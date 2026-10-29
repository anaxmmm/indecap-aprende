# ---------------------------------------------------------------------------
# Funciones usadas por games/routes.py (motor de juegos)
# ---------------------------------------------------------------------------

from collections import Counter
from datetime import timedelta
from typing import Optional

from app.blueprints.games.registry import (
    GAMES,
    PASS_SCORE,
    activity_label,
    activity_title,
    stars_for,
    translate_game_text,
)
from app.extensions import db
from app.utils.fechas import local_today, to_local
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
    """Asignación que le da al estudiante acceso a este juego (ver
    games/routes.py::play).

    El permiso sale de TrastornoAsignado, lo que el docente marca en el
    perfil del estudiante: se busca, entre sus trastornos asignados, el que
    corresponde a este juego según el registro. No tiene fechas de vigencia:
    la asignación del trastorno es, por sí sola, el permiso de juego."""
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
    """Avisa a los docentes del estudiante la primera vez que supera una
    actividad (score >= 60). Esto es lo que sincroniza la campana y el feed de
    'Últimos avances' del panel general con el progreso real del juego.

    Anti-spam: la comprobación de "primera vez" se hace ANTES de agregar la
    partida actual (ver save_game_session, que llama a esta función antes
    del db.session.add). Si ya existía otra partida del mismo juego y nivel
    con score >= 60, el nivel ya fue notificado y no se vuelve a avisar por
    repeticiones del mismo nivel.

    Idioma: el aviso guarda su tipo y sus datos, y la frase se arma en el
    idioma de quien la lee (ver Notification.text).

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

    from app.blueprints.games.registry import split_activity

    nivel, actividad = split_activity(game, level)
    docente_ids = {grupo.teacher_id for grupo in student.grupos}
    for docente_id in docente_ids:
        db.session.add(
            Notification.build(
                "level_passed",
                recipient_id=docente_id,
                student_id=student.id,
                student=student.full_name,
                activity=actividad,
                level=nivel,
                game_slug=game["slug"],
            )
        )


def _as_int(value, default: int, low: int, high: int) -> int:
    try:
        number = int(value)
    except (TypeError, ValueError):
        return default
    return max(low, min(high, number))


def save_game_session(student: User, payload: dict, game: dict) -> GameSession:
    """Guarda una partida enviada por engine.js::finish. Las claves leídas de
    payload deben coincidir exactamente con las que arma ese archivo
    (game_id, trastorno_id, level, score, time_spent, support_level,
    completed, errors, accessibility_settings_used)."""
    # El navegador no es fuente confiable: se acotan los valores antes de
    # guardarlos para que un envío manipulado no desbloquee de más.
    score = _as_int(payload.get("score"), 0, 0, 100)
    level = _as_int(payload.get("level"), 1, 1, game["levels"])
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
        time_spent=_as_int(payload.get("time_spent"), 0, 0, 24 * 3600),
        support_level=_as_int(payload.get("support_level"), 1, 1, 3),
        completed=completed,
    )
    errores = payload.get("errors")
    sesion.errors = [e for e in errores if isinstance(e, dict)][:100] if isinstance(errores, list) else []
    sesion.accessibility_settings_used = payload.get("accessibility_settings_used") or {}

    db.session.add(sesion)
    db.session.commit()
    return sesion


# ---------------------------------------------------------------------------
# Historial del estudiante (vista del docente)
# ---------------------------------------------------------------------------

def _skill_text(error: dict) -> str:
    """Nombre legible de la habilidad de un error. Las partidas nuevas lo
    traen guardado; las antiguas solo tienen el identificador."""
    label = error.get("label")
    if isinstance(label, str) and label.strip():
        return label.strip()[:120]
    skill = str(error.get("skill") or "").replace("_", " ").replace("-", " ").strip()
    return skill[:1].upper() + skill[1:] if skill else ""


def get_student_history(student: User, recent_limit: int = 15, weeks: int = 8) -> dict:
    """Resumen del avance de un estudiante en los juegos: por juego, lo que
    debe reforzar, la evolución semanal y sus últimas partidas."""
    sesiones = (
        GameSession.query.filter_by(user_id=student.id)
        .order_by(GameSession.created_at.desc())
        .all()
    )

    por_juego: dict = {}
    for s in sesiones:
        game = GAMES.get(s.game_slug)
        if game is None:
            continue
        item = por_juego.setdefault(s.game_slug, {
            "game": game, "best": {}, "plays": 0, "last": s.created_at, "recent_scores": [],
        })
        item["plays"] += 1
        if s.score > item["best"].get(s.level, -1):
            item["best"][s.level] = s.score
        if len(item["recent_scores"]) < 5:
            item["recent_scores"].append(s.score)

    juegos = []
    for item in por_juego.values():
        game, best = item["game"], item["best"]
        superadas = sum(1 for v in best.values() if v >= PASS_SCORE)
        juegos.append({
            "game": game,
            "plays": item["plays"],
            "passed": superadas,
            "total": game["levels"],
            "percent": round(superadas * 100 / game["levels"]) if game["levels"] else 0,
            "stars": sum(stars_for(v) for v in best.values()),
            "average": round(sum(item["recent_scores"]) / len(item["recent_scores"])),
            "last": item["last"],
        })
    juegos.sort(key=lambda j: j["last"], reverse=True)

    # Habilidades con más errores en las últimas 30 partidas.
    conteo: Counter = Counter()
    juego_de: dict = {}
    for s in sesiones[:30]:
        game = GAMES.get(s.game_slug)
        vistos = set()
        for e in s.errors:
            if not isinstance(e, dict) or e.get("phase") == "repaso":
                continue
            # Se cuenta con el nombre en español, aunque la partida se haya
            # jugado en inglés, y se muestra en el idioma de quien consulta.
            texto = translate_game_text(s.game_slug, _skill_text(e), "es")
            if not texto or texto in vistos:
                continue
            vistos.add(texto)
            conteo[texto] += 1
            if game is not None:
                juego_de.setdefault(texto, s.game_slug)
    reforzar = [
        {
            "skill": translate_game_text(juego_de.get(texto, ""), texto),
            "count": n,
            "game": GAMES[juego_de[texto]]["name"] if texto in juego_de else "",
        }
        for texto, n in conteo.most_common(6)
    ]

    # Promedio semanal (lunes a domingo) de las últimas semanas.
    hoy = local_today()
    inicio = hoy - timedelta(days=hoy.weekday()) - timedelta(weeks=weeks - 1)
    semanas = [{"start": inicio + timedelta(weeks=i), "scores": []} for i in range(weeks)]
    for s in sesiones:
        dia = to_local(s.created_at).date()
        if dia < inicio:
            break
        semanas[min(weeks - 1, (dia - inicio).days // 7)]["scores"].append(s.score)
    evolucion = [
        {
            "start": w["start"],
            "plays": len(w["scores"]),
            "average": round(sum(w["scores"]) / len(w["scores"])) if w["scores"] else None,
        }
        for w in semanas
    ]

    sentimientos = Counter(s.feeling for s in sesiones if s.feeling)

    recientes = []
    for s in sesiones[:recent_limit]:
        game = GAMES.get(s.game_slug)
        if game is None:
            continue
        recientes.append({
            "game": game,
            "label": activity_label(game, s.level),
            "title": activity_title(game, s.level),
            "score": s.score,
            "stars": stars_for(s.score),
            "passed": s.score >= PASS_SCORE,
            "time": s.time_spent or 0,
            "feeling": s.feeling,
            "date": s.created_at,
        })

    total = len(sesiones)
    return {
        "total_plays": total,
        "passed": sum(j["passed"] for j in juegos),
        "average": round(sum(s.score for s in sesiones[:20]) / min(total, 20)) if total else None,
        "last": sesiones[0].created_at if sesiones else None,
        "games": juegos,
        "reinforce": reforzar,
        "weeks": evolucion,
        "feelings": {k: sentimientos.get(k, 0) for k in ("bien", "regular", "dificil")},
        "recent": recientes,
    }
