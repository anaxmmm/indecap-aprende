from flask import render_template, jsonify, request, redirect, url_for, flash, abort
from flask_babel import gettext as _, lazy_gettext as _l
from flask_login import login_required, current_user

from app.blueprints.games import bp
from app.blueprints.games.registry import GAMES, get_game, get_game_for_trastorno
from app.blueprints.games.services import (
    get_accessibility_context,
    get_active_assignment,
    get_unlocked_level,
    get_level_scores,
    save_game_session,
)
from app.models.content import Trastorno


# Nombres genéricos de etapa, en orden de dificultad. Aplican a cualquier
# juego que declare "has_stage_map": True en el registry, agrupado en
# bloques de "stage_size" niveles cada uno.
STAGE_NAMES = [_l("Base"), _l("Media"), _l("Alta"), _l("Muy Alta"), _l("Súper Difícil")]


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
        info = {"game": game, "allowed": False, "assignment": None, "start_level": 1}
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
        return info

    return {"game_access": game_access}


def _resolve_trastorno():
    trastorno_id = request.args.get("trastorno_id", type=int)
    return Trastorno.query.get(trastorno_id) if trastorno_id else None


@bp.route("/<slug>/etapas")
@login_required
def stages(slug):
    """
    Mapa de etapas: agrupa los niveles de un juego en bloques de
    game['stage_size'] (por ahora solo discalculia_mercado, 5 etapas de 10
    niveles = 50 niveles en total). No introduce un concepto nuevo de
    "etapa completada": el desbloqueo de cada nivel individual sigue
    siendo exactamente el que ya calcula get_unlocked_level (score >= 60
    en el nivel anterior), así que una etapa está disponible en cuanto su
    primer nivel es alcanzable.
    """
    game = get_game(slug)
    if game is None:
        abort(404)

    if not game.get("has_stage_map"):
        # Este juego no tiene mapa de etapas: se comporta como antes.
        return redirect(url_for("games.play", slug=slug))

    if not game["available"]:
        flash(_("Este juego todavía está en construcción."), "info")
        return redirect(url_for("dashboard.student_juegos"))

    if not current_user.is_student:
        preview = True
        unlocked = game["levels"]
        scores = {}
    else:
        if get_active_assignment(current_user, game) is None:
            flash(_("Tu docente aún no te asignó esta actividad."), "info")
            return redirect(url_for("dashboard.student_juegos"))
        preview = False
        unlocked = get_unlocked_level(current_user, slug)
        scores = get_level_scores(current_user, slug)

    stage_size = game.get("stage_size", 10)
    total_stages = game["levels"] // stage_size

    stages_data = []
    for s in range(1, total_stages + 1):
        start = (s - 1) * stage_size + 1
        end = s * stage_size
        levels = []
        for lvl in range(start, end + 1):
            best = scores.get(lvl, 0)
            levels.append({
                "level": lvl,
                "position": lvl - start + 1,
                "unlocked": lvl <= unlocked,
                "completed": best >= 60,
                "score": best,
            })
        stages_data.append({
            "number": s,
            "name": str(STAGE_NAMES[s - 1]) if s - 1 < len(STAGE_NAMES) else _("Etapa %(number)s", number=s),
            "start": start,
            "end": end,
            "unlocked": start <= unlocked,
            "completed_count": sum(1 for lvl in levels if lvl["completed"]),
            "levels": levels,
        })

    trastorno = _resolve_trastorno()

    return render_template(
        "games/stages.html",
        game=game,
        stages=stages_data,
        preview=preview,
        trastorno=trastorno,
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
        flash(_("Primero completa los niveles anteriores."), "info")
        return redirect(url_for("games.play", slug=slug, level=unlocked))

    trastorno = _resolve_trastorno()

    return render_template(
        "games/play.html",
        game=game,
        level=level,
        unlocked_level=unlocked,
        level_scores=scores,
        a11y=a11y,
        preview=preview,
        trastorno=trastorno,
        active_nav="juegos",
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
            "brain_regions": g["brain_regions"],
            "levels": g["levels"],
            "available": g["available"],
        }
        for g in GAMES.values()
    ])
