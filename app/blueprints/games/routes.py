from flask import render_template, jsonify, request, redirect, url_for, flash, abort
from flask_login import login_required, current_user

from app.blueprints.games import bp
from app.blueprints.games.registry import GAMES, get_game
from app.blueprints.games.services import (
    get_accessibility_context,
    get_unlocked_level,
    get_level_scores,
    save_game_session,
)
from app.models.content import Trastorno


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


@bp.route("/<slug>")
@bp.route("/<slug>/nivel/<int:level>")
@login_required
def play(slug, level=None):
    """Sirve el juego. El docente puede entrar en modo vista previa."""
    game = get_game(slug)
    if game is None:
        abort(404)

    if not game["available"]:
        flash("Este juego todavía está en construcción.", "info")
        return redirect(url_for("dashboard.student_juegos"))

    a11y = get_accessibility_context(current_user)

    if not current_user.is_student:
        preview = True
        unlocked = game["levels"]
        scores = {}
    else:
        preview = False
        unlocked = get_unlocked_level(current_user, slug)
        scores = get_level_scores(current_user, slug)

    level = level or 1
    if level < 1 or level > game["levels"]:
        abort(404)
    if level > unlocked:
        flash("Primero completa los niveles anteriores.", "info")
        return redirect(url_for("games.play", slug=slug, level=unlocked))

    trastorno_id = request.args.get("trastorno_id", type=int)
    trastorno = Trastorno.query.get(trastorno_id) if trastorno_id else None

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