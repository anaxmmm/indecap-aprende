from datetime import date

from app.extensions import db
from app.models.accessibility import AccessibilityProfile, AutonomyLevel
from app.models.game_session import GameSession
from app.models.progress import Progress


MAX_ERRORS_STORED = 40


def get_accessibility_context(user) -> dict:
    """
    Devuelve la configuración de accesibilidad del estudiante en un formato
    plano listo para inyectar en la plantilla del juego. Si el estudiante aún
    no tiene perfil, se asume el modo más acompañado (guiado), nunca el menos.
    """
    profile = AccessibilityProfile.query.filter_by(user_id=user.id).first()

    if profile is None:
        return {
            "contrast_mode": "normal",
            "font_preference": "estandar",
            "text_size_percent": 100,
            "line_spacing_percent": 100,
            "reduce_motion": False,
            "audio_feedback": True,
            "uses_lsc": False,
            "autonomy_level": AutonomyLevel.GUIADO.value,
        }

    return {
        "contrast_mode": profile.contrast_mode.value if profile.contrast_mode else "normal",
        "font_preference": profile.font_preference.value if profile.font_preference else "estandar",
        "text_size_percent": profile.text_size_percent or 100,
        "line_spacing_percent": profile.line_spacing_percent or 100,
        "reduce_motion": bool(profile.reduce_motion),
        "audio_feedback": bool(profile.audio_feedback),
        "uses_lsc": bool(profile.uses_lsc),
        "autonomy_level": profile.autonomy_level or AutonomyLevel.GUIADO.value,
    }


def get_unlocked_level(user, game_slug: str) -> int:
    """
    Nivel máximo desbloqueado. Se desbloquea el siguiente nivel cuando el
    estudiante alcanza 60 o más de puntaje: el umbral es pedagógico (dominio
    suficiente), no una nota, y permite repetir sin penalización.
    """
    mejor = (
        GameSession.query
        .filter(GameSession.user_id == user.id, GameSession.game_slug == game_slug)
        .filter(GameSession.score >= 60)
        .order_by(GameSession.level.desc())
        .first()
    )
    return (mejor.level + 1) if mejor else 1


def get_level_scores(user, game_slug: str) -> dict:
    """Mejor puntaje obtenido por nivel, para pintar el mapa de niveles."""
    sesiones = (
        GameSession.query
        .filter(GameSession.user_id == user.id, GameSession.game_slug == game_slug)
        .all()
    )
    resultado = {}
    for s in sesiones:
        actual = resultado.get(s.level, 0)
        if (s.score or 0) > actual:
            resultado[s.level] = s.score or 0
    return resultado


def register_daily_progress(user, minutes: int, points: int) -> None:
    """
    Suma la actividad del día al registro de racha. Si ya existe una fila para
    hoy se acumula; el UniqueConstraint (user_id, activity_date) garantiza que
    nunca haya duplicados.
    """
    hoy = date.today()
    entry = Progress.query.filter_by(user_id=user.id, activity_date=hoy).first()
    if entry is None:
        entry = Progress(user_id=user.id, activity_date=hoy, minutes_spent=0, points_earned=0)
        db.session.add(entry)
    entry.minutes_spent = (entry.minutes_spent or 0) + max(0, minutes)
    entry.points_earned = (entry.points_earned or 0) + max(0, points)


def save_game_session(user, payload: dict, game: dict) -> GameSession:
    """
    Persiste una partida. TODOS los valores se saturan a rangos válidos: el
    payload llega del navegador y no es confiable, aunque el estudiante esté
    autenticado.
    """
    level = _clamp(payload.get("level"), 1, game["levels"], default=1)
    score = _clamp(payload.get("score"), 0, 100, default=0)
    time_spent = _clamp(payload.get("time_spent"), 0, 7200, default=0)
    support_level = _clamp(payload.get("support_level"), 1, 3, default=1)

    errores = payload.get("errors")
    if not isinstance(errores, list):
        errores = []

    accesibilidad = payload.get("accessibility_settings_used")
    if not isinstance(accesibilidad, dict):
        accesibilidad = {}

    sesion = GameSession(
        user_id=user.id,
        trastorno_id=payload.get("trastorno_id") if isinstance(payload.get("trastorno_id"), int) else None,
        game_slug=game["slug"],
        level=level,
        score=score,
        time_spent=time_spent,
        support_level=support_level,
        completed=bool(payload.get("completed", True)),
    )
    sesion.errors = errores[:MAX_ERRORS_STORED]
    sesion.accessibility_settings_used = accesibilidad

    db.session.add(sesion)
    register_daily_progress(user, minutes=round(time_spent / 60), points=score)
    db.session.commit()
    return sesion


def _clamp(value, minimo: int, maximo: int, default: int) -> int:
    try:
        numero = int(value)
    except (TypeError, ValueError):
        return default
    return max(minimo, min(maximo, numero))