# ---------------------------------------------------------------------------
# Funciones usadas por games/routes.py (motor de juegos)
# ---------------------------------------------------------------------------

from typing import Optional

from flask_babel import force_locale

from app.extensions import db
from app.models.accessibility import (
    AccessibilityProfile,
    AutonomyLevel,
    ContrastMode,
    FontPreference,
)
from app.models.assignment import TrastornoAsignado
from app.models.game_session import GameSession
from app.models.notification import Notification
from app.models.user import User


def get_accessibility_context(user: User) -> dict:
    """Perfil de accesibilidad para la barra de ajustes del juego (a11y.js)
    y para calibrar el nivel de apoyo del motor (engine.js::supportLevel).
    Se llama tanto para estudiantes como para docentes en modo vista previa
    (ver games/routes.py::play), así que si el usuario todavía no tiene un
    AccessibilityProfile creado, se devuelven los valores por defecto del
    modelo en vez de fallar."""
    profile = AccessibilityProfile.query.filter_by(user_id=user.id).first()
    if profile is None:
        return {
            "contrast_mode": ContrastMode.NORMAL.value,
            "font_preference": FontPreference.ESTANDAR.value,
            "text_size_percent": 100,
            "line_spacing_percent": 100,
            "reduce_motion": False,
            "audio_feedback": True,
            "autonomy_level": AutonomyLevel.GUIADO.value,
        }
    return {
        "contrast_mode": profile.contrast_mode.value if profile.contrast_mode else ContrastMode.NORMAL.value,
        "font_preference": profile.font_preference.value if profile.font_preference else FontPreference.ESTANDAR.value,
        "text_size_percent": profile.text_size_percent or 100,
        "line_spacing_percent": profile.line_spacing_percent or 100,
        "reduce_motion": bool(profile.reduce_motion),
        "audio_feedback": profile.audio_feedback if profile.audio_feedback is not None else True,
        "autonomy_level": profile.autonomy_level or AutonomyLevel.GUIADO.value,
    }


def get_active_assignment(student: User, game: dict) -> Optional[TrastornoAsignado]:
    """Candado real de acceso a un juego (ver games/routes.py::play).

    El acceso a los juegos del registry se basa directamente en
    TrastornoAsignado — lo que el docente asigna en perfil_estudiante — y
    ya NO en SesionAsignada/Actividad. Antes se exigía una SesionAsignada
    vigente ligada a una Actividad del trastorno, pero
    _auto_enroll_first_session nunca crea esa SesionAsignada para
    trastornos con juego propio en el registry, porque ya no existen filas
    Actividad para ellos (el proyecto abandonó ese sistema en favor de los
    juegos). Eso dejaba el botón "Jugar" siempre bloqueado aunque el
    docente sí hubiera asignado el trastorno.

    Ahora se busca, entre los trastornos que el docente le asignó a este
    estudiante, cuál corresponde a este juego según el registry, y se
    devuelve esa asignación (TrastornoAsignado) directamente — sin fechas
    de vigencia, porque TrastornoAsignado no las tiene: la asignación del
    trastorno es, por sí sola, el permiso de juego."""
    from app.blueprints.games.registry import get_game_for_trastorno

    for asignacion in student.trastornos_asignados:
        candidato = asignacion.trastorno
        juego_candidato = get_game_for_trastorno(candidato)
        if juego_candidato is not None and juego_candidato["slug"] == game["slug"]:
            return asignacion
    return None


def get_unlocked_level(student: User, slug: str) -> int:
    """Nivel más alto que el estudiante puede jugar de este juego: el primer
    nivel aún no superado (score >= 60) más uno. Mismo criterio de
    'superado' que ya usa get_student_trastornos_con_progreso, para no tener
    dos reglas distintas de qué cuenta como nivel dominado."""
    mejor = (
        GameSession.query
        .filter(
            GameSession.user_id == student.id,
            GameSession.game_slug == slug,
            GameSession.score >= 60,
        )
        .order_by(GameSession.level.desc())
        .first()
    )
    return (mejor.level + 1) if mejor else 1


def get_level_scores(student: User, slug: str) -> dict:
    """Mejor puntaje logrado por el estudiante en cada nivel de este juego,
    como {nivel: mejor_score}."""
    sesiones = GameSession.query.filter_by(user_id=student.id, game_slug=slug).all()
    scores: dict = {}
    for sesion in sesiones:
        if sesion.score > scores.get(sesion.level, 0):
            scores[sesion.level] = sesion.score
    return scores


def _notify_teachers_of_new_level(student: User, game: dict, level: int) -> None:
    """Avisa a los docentes del estudiante la primera vez que supera un
    nivel (score >= 60). Esto es lo que sincroniza la campana y el feed de
    'Últimos avances' del panel general con el progreso real del juego.

    Anti-spam: la comprobación de "primera vez" se hace ANTES de agregar la
    partida actual (ver save_game_session, que llama a esta función antes
    del db.session.add). Si ya existía otra partida del mismo juego y nivel
    con score >= 60, el nivel ya fue notificado y no se vuelve a avisar por
    repeticiones del mismo nivel.

    Idioma: el aviso se guarda ya escrito en la base de datos, así que se
    fija siempre en español. Sin esto, el nombre del juego (que ahora es un
    texto traducible) saldría en el idioma que tuviera activo el estudiante
    en ese momento, mezclado con el resto de la frase en español.

    No hace commit: el llamador confirma la transacción junto con la partida."""
    ya_superado = (
        GameSession.query
        .filter(
            GameSession.user_id == student.id,
            GameSession.game_slug == game["slug"],
            GameSession.level == level,
            GameSession.score >= 60,
        )
        .count()
    )
    if ya_superado > 0:
        return

    with force_locale("es"):
        nombre_juego = str(game["name"])

    docente_ids = {grupo.teacher_id for grupo in student.grupos}
    for docente_id in docente_ids:
        db.session.add(
            Notification(
                recipient_id=docente_id,
                student_id=student.id,
                message=f"{student.full_name} superó el nivel {level} de «{nombre_juego}».",
            )
        )


def save_game_session(student: User, payload: dict, game: dict) -> GameSession:
    """Guarda una partida enviada por engine.js::finish. Las claves leídas de
    payload deben coincidir exactamente con las que arma ese archivo
    (game_id, trastorno_id, level, score, time_spent, support_level,
    completed, errors, accessibility_settings_used)."""
    score = payload.get("score", 0)
    level = payload.get("level", 1)
    completed = bool(payload.get("completed", True))

    # Notificar ANTES de agregar la partida: si se agregara primero, el
    # autoflush de SQLAlchemy haría visible la fila nueva en la consulta de
    # duplicados y el nivel se marcaría siempre como "ya notificado".
    if completed and score >= 60:
        _notify_teachers_of_new_level(student, game, level)

    sesion = GameSession(
        user_id=student.id,
        trastorno_id=payload.get("trastorno_id"),
        game_slug=game["slug"],
        level=level,
        score=score,
        time_spent=payload.get("time_spent", 0),
        support_level=payload.get("support_level", 1),
        completed=completed,
    )
    sesion.errors = payload.get("errors") or []
    sesion.accessibility_settings_used = payload.get("accessibility_settings_used") or {}

    db.session.add(sesion)
    db.session.commit()
    return sesion
