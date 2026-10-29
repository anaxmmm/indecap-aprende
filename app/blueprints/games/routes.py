from flask import render_template, jsonify, request, redirect, url_for, flash, abort
from flask_babel import gettext as _
from flask_login import login_required, current_user

from app.blueprints.games import bp
from app.blueprints.games.registry import (
    GAMES,
    build_levels,
    game_dictionary,
    get_game,
    get_game_for_trastorno,
    split_activity,
    activity_title,
    level_name,
    PASS_SCORE,
)
from app.blueprints.games.services import (
    get_accessibility_context,
    get_active_assignment,
    get_unlocked_level,
    get_level_scores,
    save_game_session,
)
from app.extensions import db
from app.models.content import Trastorno
from app.models.game_session import FEELINGS, GameSession


@bp.context_processor
def inject_notifications():
    """
    base_student.html muestra la campana de notificaciones y necesita estas
    variables. Un context_processor de blueprint solo aplica a sus propias
    vistas, así que 'games' debe inyectarlas también.
    """
    if current_user.is_authenticated:
        from app.blueprints.dashboard.services import (
            count_unread_notifications,
            get_recent_notifications,
        )
        return {
            "unread_notifications_count": count_unread_notifications(current_user),
            "recent_notifications": get_recent_notifications(current_user, limit=5),
        }
    return {"unread_notifications_count": 0, "recent_notifications": []}


@bp.app_context_processor
def inject_game_access():
    """
    Expone game_access(trastorno) a TODAS las plantillas (Juegos y detalle del
    dashboard incluidos), para decidir si se muestra "Jugar" sin duplicar la
    regla de acceso en las rutas del dashboard.
    """
    def game_access(trastorno):
        game = get_game_for_trastorno(trastorno)
        info = {"game": game, "allowed": False, "assignment": None, "start_level": 1, "passed": 0}
        if game is None or not game["available"]:
            return info
        if not current_user.is_authenticated or not current_user.is_student:
            return info
        sesion = get_active_assignment(current_user, game)
        if sesion is None:
            return info
        info["allowed"] = True
        info["assignment"] = sesion
        info["start_level"] = min(get_unlocked_level(current_user, game["slug"]), game["levels"])
        info["passed"] = sum(1 for v in get_level_scores(current_user, game["slug"]).values() if v >= PASS_SCORE)
        return info

    return {"game_access": game_access, "game_dictionary": game_dictionary}


def _resolve_trastorno():
    trastorno_id = request.args.get("trastorno_id", type=int)
    return db.session.get(Trastorno, trastorno_id) if trastorno_id else None


@bp.route("/<slug>/etapas")
@login_required
def stages(slug):
    """Mapa del estudiante: 5 niveles con 10 actividades cada uno.

    El desbloqueo es el de siempre (get_unlocked_level: superar una
    actividad abre la siguiente). Los docentes no usan este mapa: exploran
    los juegos desde el Modo maestro, con todo abierto.
    """
    game = get_game(slug)
    if game is None:
        abort(404)

    if not game.get("has_stage_map"):
        return redirect(url_for("games.play", slug=slug))

    if not current_user.is_student:
        return redirect(url_for("dashboard.sesiones_sistema"))

    if not game["available"]:
        flash(_("Este juego todavía está en construcción."), "info")
        return redirect(url_for("dashboard.student_juegos"))

    if get_active_assignment(current_user, game) is None:
        flash(_("Tu docente aún no te asignó esta actividad."), "info")
        return redirect(url_for("dashboard.student_juegos"))

    unlocked = get_unlocked_level(current_user, slug)
    scores = get_level_scores(current_user, slug)
    levels = build_levels(game, unlocked=unlocked, scores=scores)

    return render_template(
        "games/stages.html",
        game=game,
        levels=levels,
        total_completed=sum(lvl["completed_count"] for lvl in levels),
        total_stars=sum(lvl["stars"] for lvl in levels),
        trastorno=_resolve_trastorno(),
        active_nav="juegos",
    )


@bp.route("/<slug>")
@bp.route("/<slug>/nivel/<int:level>")
@login_required
def play(slug, level=None):
    """Sirve el juego. El docente puede entrar en modo vista previa."""
    game = get_game(slug)
    if game is None:
        abort(404)

    if not game["available"]:
        flash(_("Este juego todavía está en construcción."), "info")
        return redirect(url_for("dashboard.student_juegos"))

    a11y = get_accessibility_context(current_user)

    if not current_user.is_student:
        preview = True
        unlocked = game["levels"]
        scores = {}
    else:
        # El acceso lo controla el docente: sin actividad asignada y vigente
        # no se entra, aunque el estudiante conozca la URL.
        if get_active_assignment(current_user, game) is None:
            flash(_("Tu docente aún no te asignó esta actividad."), "info")
            return redirect(url_for("dashboard.student_juegos"))
        preview = False
        unlocked = get_unlocked_level(current_user, slug)
        scores = get_level_scores(current_user, slug)

    level = level or 1
    if level < 1 or level > game["levels"]:
        abort(404)
    if level > unlocked:
        flash(_("Primero completa las actividades anteriores."), "info")
        return redirect(url_for("games.play", slug=slug, level=unlocked))

    trastorno = _resolve_trastorno()
    nivel, actividad = split_activity(game, level)

    return render_template(
        "games/play.html",
        game=game,
        level=level,
        nivel=nivel,
        nivel_name=level_name(nivel),
        actividad=actividad,
        activity_title=activity_title(game, level),
        unlocked_level=unlocked,
        level_scores=scores,
        a11y=a11y,
        preview=preview,
        trastorno=trastorno,
        active_nav="juegos" if current_user.is_student else "sesiones_sistema",
    )


@bp.route("/api/game-session/submit", methods=["POST"])
@login_required
def submit_session():
    """
    Recibe las métricas de una partida.

    El student_id NUNCA se lee del cuerpo de la petición: se toma de la sesión
    autenticada, para que nadie pueda escribir progreso a nombre de otro.
    """
    payload = request.get_json(silent=True)
    if not isinstance(payload, dict):
        return jsonify({"ok": False, "error": "payload_invalido"}), 400

    game = get_game(payload.get("game_id"))
    if game is None:
        return jsonify({"ok": False, "error": "juego_desconocido"}), 404

    if not current_user.is_student:
        return jsonify({"ok": True, "saved": False, "reason": "modo_vista_previa"}), 200

    if get_active_assignment(current_user, game) is None:
        return jsonify({"ok": False, "error": "sin_asignacion_vigente"}), 403

    sesion = save_game_session(current_user, payload, game)

    return jsonify({
        "ok": True,
        "saved": True,
        "session_id": sesion.id,
        "unlocked_level": get_unlocked_level(current_user, game["slug"]),
    }), 201


@bp.route("/api/game-session/<int:session_id>/feeling", methods=["POST"])
@login_required
def submit_feeling(session_id):
    """Guarda la respuesta a «¿Cómo te sentiste?» de una partida propia."""
    payload = request.get_json(silent=True) or {}
    feeling = payload.get("feeling")
    if feeling not in FEELINGS:
        return jsonify({"ok": False, "error": "valor_invalido"}), 400
    sesion = GameSession.query.filter_by(id=session_id, user_id=current_user.id).first()
    if sesion is None:
        return jsonify({"ok": False, "error": "partida_desconocida"}), 404
    sesion.feeling = feeling
    db.session.commit()
    return jsonify({"ok": True}), 200


@bp.route("/api/games")
@login_required
def list_games():
    """Catálogo de juegos para los dashboards."""
    return jsonify([
        {
            "slug": g["slug"],
            "name": g["name"],
            "condition": g["condition"],
            "core_skill": g["core_skill"],
            "skills": g["skills"],
            "levels": g["levels"],
            "available": g["available"],
        }
        for g in GAMES.values()
    ])
