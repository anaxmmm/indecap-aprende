"""Lógica de negocio del blueprint dashboard, separada de las rutas
para mantenerlas delgadas y facilitar pruebas unitarias.
"""
from datetime import timedelta
from typing import List, Optional

from flask_babel import gettext as _
from sqlalchemy.exc import IntegrityError

from app.extensions import db
from app.models.user import User, RoleEnum
from app.models.group import Grupo
from app.models.content import Trastorno, Actividad
from app.models.assignment import TrastornoAsignado
from app.models.student_profile import StudentProfile, GeneroEnum
from app.models.teacher_profile import TeacherProfile
from app.models.notification import Notification
from app.models.assigned_session import SesionAsignada, EstadoSesion
from app.models.game_session import GameSession
from app.utils.fechas import local_day_start_utc, local_today, to_local, utc_now


def gestiona_grupo(user: User, grupo: Optional[Grupo]) -> bool:
    """El administrador gestiona todos los grupos; el docente, solo los suyos."""
    return grupo is not None and (user.is_admin or grupo.teacher_id == user.id)


def _grupo_gestionable(user: User, group_id) -> Optional[Grupo]:
    grupo = db.session.get(Grupo, group_id) if group_id else None
    return grupo if gestiona_grupo(user, grupo) else None


def get_groups_for_teacher(teacher: User) -> List[Grupo]:
    query = Grupo.query if teacher.is_admin else Grupo.query.filter_by(teacher_id=teacher.id)
    return query.order_by(Grupo.created_at.asc()).all()


def get_teachers() -> List[User]:
    """Docentes y administradores activos que pueden tener grupos a cargo."""
    return (
        User.query.filter(
            User.role.in_([RoleEnum.TEACHER, RoleEnum.ADMIN]),
            User.archived_at.is_(None),
            User.is_active_account.is_(True),
        )
        .order_by(User.full_name.asc())
        .all()
    )


def reassign_group(actor: User, group_id: int, teacher_id: int) -> Grupo:
    """Pasa un grupo completo a otro docente. Solo lo hace un administrador."""
    if not actor.is_admin:
        raise ValueError(_("Solo un administrador puede reasignar grupos."))
    grupo = db.session.get(Grupo, group_id)
    if grupo is None:
        raise ValueError(_("El grupo no existe."))
    docente = db.session.get(User, teacher_id)
    if docente is None or docente not in get_teachers():
        raise ValueError(_("Elige un docente activo."))
    grupo.teacher_id = docente.id
    db.session.commit()
    return grupo


def create_group(teacher: User, name: str) -> Grupo:
    grupo = Grupo(name=name.strip(), teacher_id=teacher.id)
    db.session.add(grupo)
    db.session.commit()
    return grupo


def delete_group(teacher: User, group_id: int) -> None:
    """Elimina un grupo completo. Solo se permite si ya no tiene ningún
    estudiante dentro (ni activo ni inactivo); los archivados no cuentan
    porque ya no se gestionan desde el grupo."""
    grupo = _grupo_gestionable(teacher, group_id)
    if grupo is None:
        raise ValueError(_("El grupo no existe o no pertenece a este docente."))

    if any(not s.is_archived for s in grupo.estudiantes):
        raise ValueError(
            _("Este grupo todavía tiene estudiantes (activos o inactivos). Muévelos a otro grupo o elimínalos antes de eliminar el grupo.")
        )

    db.session.delete(grupo)
    db.session.commit()


def _notify_activity(student_id: int, title: str) -> None:
    """Crea una notificación dirigida al estudiante. No hace commit — el
    llamador se encarga de confirmar la transacción junto con el resto de
    los cambios."""
    db.session.add(Notification.build("activity_assigned", recipient_id=student_id, title=title))


def _auto_enroll_first_session(student_id: int, trastorno_id: int, assigned_by_id: int) -> None:
    """Al asignar un trastorno, inscribe automáticamente al estudiante en la
    primera actividad (capítulo 1) de ese plan, si no la tiene ya asignada.
    No hace commit — el llamador se encarga de confirmar la transacción."""
    primera_actividad = (
        Actividad.query.filter_by(trastorno_id=trastorno_id)
        .order_by(Actividad.order_index.asc())
        .first()
    )
    if primera_actividad is None:
        return

    ya_existe = SesionAsignada.query.filter_by(
        student_id=student_id, actividad_id=primera_actividad.id
    ).first()
    if ya_existe:
        return

    hoy = local_today()
    db.session.add(
        SesionAsignada(
            student_id=student_id,
            actividad_id=primera_actividad.id,
            assigned_by_id=assigned_by_id,
            start_date=hoy,
            end_date=hoy + timedelta(days=30),
        )
    )
    _notify_activity(student_id, primera_actividad.title)


def create_student_in_group(
    first_name: str,
    last_name: str,
    email: str,
    password: str,
    group_id: int,
    teacher: User,
    gender: str = "",
    birth_date=None,
    has_learning_difficulties: bool = False,
    trastorno_ids: Optional[List[int]] = None,
    data_consent: bool = False,
) -> User:
    if not data_consent:
        raise ValueError(_("Confirma la autorización de tratamiento de datos para registrar al estudiante."))
    grupo = _grupo_gestionable(teacher, group_id)
    if grupo is None:
        raise ValueError(_("El grupo no existe o no pertenece a este docente."))

    email = email.lower().strip()
    if User.query.filter_by(email=email).first():
        raise ValueError(_("Ya existe una cuenta con ese correo."))

    full_name = f"{first_name.strip()} {last_name.strip()}".strip()
    student = User(
        full_name=full_name,
        email=email,
        role=RoleEnum.STUDENT,
        created_by_id=teacher.id,
        data_consent_at=utc_now(),
        data_consent_by_id=teacher.id,
    )
    student.set_password(password)
    grupo.estudiantes.append(student)
    db.session.add(student)

    try:
        db.session.flush()
    except IntegrityError:
        db.session.rollback()
        raise ValueError(_("Ya existe una cuenta con ese correo."))

    db.session.add(
        StudentProfile(
            user_id=student.id,
            gender=GeneroEnum(gender) if gender else None,
            birth_date=birth_date,
            has_learning_difficulties=has_learning_difficulties,
        )
    )

    for trastorno_id in trastorno_ids or []:
        db.session.add(
            TrastornoAsignado(
                student_id=student.id,
                trastorno_id=trastorno_id,
                assigned_by_id=teacher.id,
            )
        )
        _auto_enroll_first_session(student.id, trastorno_id, teacher.id)

    db.session.commit()
    return student

def update_student(
    teacher: User,
    student_id: int,
    full_name: str,
    email: str,
    gender: str = "",
    birth_date=None,
    has_learning_difficulties: bool = False,
    trastorno_ids: Optional[List[int]] = None,
    data_consent: bool = False,
) -> User:
    """Edita los datos de un estudiante que pertenece a los grupos del
    docente. Si el estudiante todavía no tiene StudentProfile (por ejemplo,
    se creó por otra vía), se crea en este momento. Los trastornos se
    actualizan con set_assigned_trastornos, que además inscribe en la primera
    sesión del plan cuando se marca un trastorno nuevo y hace el commit de
    toda la transacción."""
    student = get_student_if_owned_by_teacher(teacher, student_id)
    if student is None:
        raise ValueError(_("Ese estudiante no existe o no pertenece a tus grupos."))

    email = email.lower().strip()
    otro = User.query.filter(User.email == email, User.id != student.id).first()
    if otro is not None:
        raise ValueError(_("Ya existe una cuenta con ese correo."))

    student.full_name = full_name.strip()
    student.email = email
    if data_consent and student.data_consent_at is None:
        student.data_consent_at = utc_now()
        student.data_consent_by_id = teacher.id

    profile = get_student_profile(student)
    if profile is None:
        profile = StudentProfile(user_id=student.id)
        db.session.add(profile)
    profile.gender = GeneroEnum(gender) if gender else None
    profile.birth_date = birth_date
    profile.has_learning_difficulties = has_learning_difficulties

    try:
        set_assigned_trastornos(teacher, student, trastorno_ids or [])
    except IntegrityError:
        db.session.rollback()
        raise ValueError(_("Ya existe una cuenta con ese correo."))

    return student


def move_student_to_group(teacher: User, student_id: int, target_group_id: int, source_group_id: int) -> None:
    origen = _grupo_gestionable(teacher, source_group_id)
    target = _grupo_gestionable(teacher, target_group_id)
    if origen is None or target is None:
        raise ValueError(_("El grupo destino no existe o no pertenece a este docente."))

    student = db.session.get(User, student_id)
    if student is None or student not in origen.estudiantes:
        raise ValueError(_("El estudiante no existe."))

    for grupo in list(student.grupos):
        if gestiona_grupo(teacher, grupo):
            grupo.estudiantes.remove(student)

    target.estudiantes.append(student)
    db.session.commit()


def deactivate_student(teacher: User, group_id: int, student_id: int) -> None:
    grupo = _grupo_gestionable(teacher, group_id)
    student = db.session.get(User, student_id)
    if grupo and student and student in grupo.estudiantes:
        student.is_active_account = False
        db.session.commit()


def reactivate_student(teacher: User, group_id: int, student_id: int) -> None:
    grupo = _grupo_gestionable(teacher, group_id)
    student = db.session.get(User, student_id)
    if grupo and student and student in grupo.estudiantes:
        student.is_active_account = True
        db.session.commit()


def get_student_if_owned_by_teacher(teacher: User, student_id: int) -> Optional[User]:
    student = db.session.get(User, student_id)
    if student is None or not student.is_student:
        return None
    if teacher.is_admin:
        return student
    for grupo in student.grupos:
        if grupo.teacher_id == teacher.id:
            return student
    return None


def get_assigned_trastorno_ids(student: User) -> List[int]:
    return [asignacion.trastorno_id for asignacion in student.trastornos_asignados]


def set_assigned_trastornos(
    teacher: User, student: User, trastorno_ids: List[int]
) -> None:
    trastorno_ids = set(trastorno_ids)
    actuales = {a.trastorno_id: a for a in student.trastornos_asignados}

    for trastorno_id, asignacion in list(actuales.items()):
        if trastorno_id not in trastorno_ids:
            db.session.delete(asignacion)

    for trastorno_id in trastorno_ids:
        if trastorno_id not in actuales:
            db.session.add(
                TrastornoAsignado(
                    student_id=student.id,
                    trastorno_id=trastorno_id,
                    assigned_by_id=teacher.id,
                )
            )
            _auto_enroll_first_session(student.id, trastorno_id, teacher.id)

    db.session.commit()


def get_or_create_teacher_profile(user: User) -> TeacherProfile:
    profile = TeacherProfile.query.filter_by(user_id=user.id).first()
    if profile is None:
        profile = TeacherProfile(user_id=user.id)
        db.session.add(profile)
        db.session.commit()
    return profile


def update_teacher_profile(
    user: User, full_name: str, email: str, area: str, new_password: str = ""
) -> None:
    user.full_name = full_name.strip()
    user.email = email.lower().strip()
    if new_password:
        user.set_password(new_password)
    profile = get_or_create_teacher_profile(user)
    profile.area = (area or "").strip() or None
    db.session.commit()


def get_recent_notifications(user: User, limit: int = 10) -> List[Notification]:
    return (
        Notification.query.filter_by(recipient_id=user.id)
        .order_by(Notification.created_at.desc())
        .limit(limit)
        .all()
    )


def count_unread_notifications(user: User) -> int:
    return Notification.query.filter_by(recipient_id=user.id, is_read=False).count()


def mark_all_notifications_read(user: User) -> None:
    Notification.query.filter_by(recipient_id=user.id, is_read=False).update(
        {"is_read": True}
    )
    db.session.commit()


def get_students_for_teacher(teacher: User) -> List[User]:
    students = {}
    for grupo in get_groups_for_teacher(teacher):
        for student in grupo.estudiantes:
            if student.is_active_account:
                students[student.id] = student
    return sorted(students.values(), key=lambda s: s.full_name)


def assign_session(
    teacher: User, student_id: int, actividad_id: int, start_date, end_date
) -> SesionAsignada:
    student = db.session.get(User, student_id)
    if student is None or not any(gestiona_grupo(teacher, g) for g in student.grupos):
        raise ValueError(_("Ese estudiante no pertenece a tus grupos."))

    if end_date < start_date:
        raise ValueError(_("La fecha de fin no puede ser anterior a la de inicio."))

    sesion = SesionAsignada(
        student_id=student_id,
        actividad_id=actividad_id,
        assigned_by_id=teacher.id,
        start_date=start_date,
        end_date=end_date,
    )
    db.session.add(sesion)

    actividad = db.session.get(Actividad, actividad_id)
    if actividad is not None:
        _notify_activity(student_id, actividad.title)

    db.session.commit()
    return sesion


def get_sesiones_asignadas_for_actividad(actividad_id: int, teacher: User) -> List[SesionAsignada]:
    return (
        SesionAsignada.query.filter_by(actividad_id=actividad_id, assigned_by_id=teacher.id)
        .order_by(SesionAsignada.assigned_at.desc())
        .all()
    )


def update_session_notes(teacher: User, sesion_id: int, notes: str) -> int:
    query = SesionAsignada.query.filter_by(id=sesion_id)
    if not teacher.is_admin:
        query = query.filter_by(assigned_by_id=teacher.id)
    sesion = query.first()
    if sesion is None:
        raise ValueError(_("Esa sesión asignada no existe o no te pertenece."))
    sesion.clinical_notes = notes.strip() or None
    db.session.commit()
    return sesion.actividad_id


def get_trastornos_mas_trabajados(teacher: User, limit: int = 5) -> List[dict]:
    """Cuántos estudiantes de este docente tienen cada trastorno asignado,
    ordenado de mayor a menor. Base tanto del panel general como de
    Planes de entrenamiento."""
    student_ids = [s.id for s in get_students_for_teacher(teacher)]
    if not student_ids:
        return []

    conteos: dict = {}
    for asignacion in TrastornoAsignado.query.filter(
        TrastornoAsignado.student_id.in_(student_ids)
    ).all():
        conteos[asignacion.trastorno_id] = conteos.get(asignacion.trastorno_id, 0) + 1

    trastornos = {t.id: t for t in Trastorno.query.all()}
    resultado = [
        {"trastorno": trastornos[tid], "estudiantes": count}
        for tid, count in conteos.items()
        if tid in trastornos
    ]
    resultado.sort(key=lambda item: item["estudiantes"], reverse=True)
    return resultado[:limit]


def get_planes_activos(teacher: User) -> List[dict]:
    return [
        item
        for item in get_trastornos_mas_trabajados(teacher, limit=1000)
        if item["estudiantes"] > 0
    ]


def get_student_trastornos_con_progreso(student: User) -> List[dict]:
    """Para el panel general del estudiante: sus trastornos asignados con su
    progreso real. Si el trastorno tiene un juego disponible (registry.py),
    el progreso se mide en GameSession: nivel desbloqueado (score >= 60)
    sobre el total de niveles del juego — que es lo que el estudiante
    realmente juega. Si el trastorno todavía no tiene juego, se usa como
    respaldo el conteo antiguo de Actividad/SesionAsignada del panel
    docente.

    El import de get_game_for_trastorno se hace aquí adentro (no arriba del
    archivo) a propósito: dashboard y games se importan mutuamente en algún
    punto de la cadena de arranque, y ponerlo a nivel de módulo revienta con
    un ImportError circular. games/routes.py resuelve el mismo problema en
    sentido inverso (import de dashboard.services dentro de
    inject_notifications) por la misma razón."""
    from app.blueprints.games.registry import get_game_for_trastorno

    resultado = []
    for asignacion in student.trastornos_asignados:
        trastorno = asignacion.trastorno
        juego = get_game_for_trastorno(trastorno)

        if juego is not None:
            total = juego["levels"]
            mejor = (
                GameSession.query
                .filter(
                    GameSession.user_id == student.id,
                    GameSession.game_slug == juego["slug"],
                    GameSession.score >= 60,
                )
                .order_by(GameSession.level.desc())
                .first()
            )
            completadas = mejor.level if mejor else 0
            proxima = None
        else:
            total = Actividad.query.filter_by(trastorno_id=trastorno.id).count()
            completadas = SesionAsignada.query.filter_by(
                student_id=student.id,
                status=EstadoSesion.COMPLETADA,
            ).join(Actividad).filter(
                Actividad.trastorno_id == trastorno.id
            ).count()
            proxima = (
                SesionAsignada.query.filter_by(
                    student_id=student.id,
                    status=EstadoSesion.PENDIENTE,
                )
                .join(Actividad)
                .filter(Actividad.trastorno_id == trastorno.id)
                .order_by(Actividad.order_index.asc())
                .first()
            )

        resultado.append({
            "trastorno": trastorno,
            "juego": juego,
            "total": total,
            "completadas": min(completadas, total) if total else completadas,
            "porcentaje": round((completadas / total * 100) if total > 0 else 0),
            "proxima": proxima,
        })
    return resultado


def get_student_actividades_por_trastorno(student: User) -> List[dict]:
    """Para la pantalla de Actividades del estudiante: sus sesiones asignadas
    agrupadas por trastorno, con su estado actual."""
    grupos = {}
    for sesion in student.sesiones_asignadas:
        trastorno = sesion.actividad.trastorno
        if trastorno.id not in grupos:
            grupos[trastorno.id] = {
                "trastorno": trastorno,
                "sesiones": [],
            }
        grupos[trastorno.id]["sesiones"].append(sesion)

    for grupo in grupos.values():
        grupo["sesiones"].sort(key=lambda s: s.actividad.order_index)

    return list(grupos.values())


def get_student_racha_mensual(student: User) -> int:
    """Racha mensual: cantidad de días distintos (no necesariamente
    consecutivos) con al menos una partida de juego completada en los
    últimos 30 días. Se cuenta en GameSession, donde se guarda cada partida."""
    since = local_today() - timedelta(days=30)
    sesiones = GameSession.query.filter(
        GameSession.user_id == student.id,
        GameSession.completed.is_(True),
        GameSession.created_at >= local_day_start_utc(since),
    ).all()
    dias = {to_local(sesion.created_at).date() for sesion in sesiones}
    return len(dias)


def get_started_activities(student: User) -> List[SesionAsignada]:
    """Sesiones pendientes que el estudiante ya abrió al menos una vez
    (started_at definido), para mostrar 'sigue donde quedaste' en su panel."""
    return (
        SesionAsignada.query.filter_by(
            student_id=student.id,
            status=EstadoSesion.PENDIENTE,
        )
        .filter(SesionAsignada.started_at.isnot(None))
        .order_by(SesionAsignada.started_at.desc())
        .all()
    )


def start_session(student: User, sesion_id: int) -> SesionAsignada:
    """Marca una sesión asignada como iniciada la primera vez que el
    estudiante la abre desde 'Mis actividades'."""
    sesion = SesionAsignada.query.filter_by(id=sesion_id, student_id=student.id).first()
    if sesion is None:
        raise ValueError(_("Esa actividad no existe o no te pertenece."))
    if sesion.started_at is None:
        sesion.started_at = utc_now()
        db.session.commit()
    return sesion


def get_student_profile(student: User) -> Optional[StudentProfile]:
    return StudentProfile.query.filter_by(user_id=student.id).first()


def get_activity_matrix(teacher: User, days: int = 365) -> dict:
    """Partidas completadas y niveles superados (score >= 60) por
    estudiante y por dia, para el grafico del panel general."""
    students = get_students_for_teacher(teacher)
    today = local_today()
    start = today - timedelta(days=days - 1)
    dates = [start + timedelta(days=i) for i in range(days)]
    index = {d: i for i, d in enumerate(dates)}

    rows = {
        s.id: {
            "id": s.id,
            "name": s.full_name,
            "done": [0] * days,
            "passed": [0] * days,
        }
        for s in students
    }

    if rows:
        query = db.session.query(
            GameSession.user_id,
            GameSession.created_at,
            GameSession.score,
        ).filter(
            GameSession.user_id.in_(list(rows.keys())),
            GameSession.completed.is_(True),
            GameSession.created_at >= local_day_start_utc(start),
        )
        for user_id, created_at, score in query:
            if created_at is None:
                continue
            i = index.get(to_local(created_at).date())
            if i is None:
                continue
            rows[user_id]["done"][i] += 1
            if (score or 0) >= 60:
                rows[user_id]["passed"][i] += 1

    return {
        "dates": [d.isoformat() for d in dates],
        "students": list(rows.values()),
    }
