"""Lógica de negocio del blueprint dashboard, separada de las rutas
para mantenerlas delgadas y facilitar pruebas unitarias.
"""
from datetime import date, datetime, timedelta
from typing import List, Optional

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


def get_groups_for_teacher(teacher: User) -> List[Grupo]:
    return (
        Grupo.query.filter_by(teacher_id=teacher.id)
        .order_by(Grupo.created_at.asc())
        .all()
    )


def create_group(teacher: User, name: str) -> Grupo:
    grupo = Grupo(name=name.strip(), teacher_id=teacher.id)
    db.session.add(grupo)
    db.session.commit()
    return grupo


def _notify_student(student_id: int, message: str) -> None:
    """Crea una notificación dirigida al estudiante. No hace commit — el
    llamador se encarga de confirmar la transacción junto con el resto de
    los cambios."""
    db.session.add(Notification(recipient_id=student_id, message=message))


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

    hoy = date.today()
    db.session.add(
        SesionAsignada(
            student_id=student_id,
            actividad_id=primera_actividad.id,
            assigned_by_id=assigned_by_id,
            start_date=hoy,
            end_date=hoy + timedelta(days=30),
        )
    )
    _notify_student(
        student_id,
        f"Tu docente te asignó una nueva actividad: {primera_actividad.title}.",
    )


def create_student_in_group(
    first_name: str,
    last_name: str,
    email: str,
    password: str,
    group_id: int,
    teacher: User,
    alias: str = "",
    tutor_email: str = "",
    gender: str = "",
    birth_date=None,
    has_learning_difficulties: bool = False,
    trastorno_ids: Optional[List[int]] = None,
) -> User:
    grupo = Grupo.query.filter_by(id=group_id, teacher_id=teacher.id).first()
    if grupo is None:
        raise ValueError("El grupo no existe o no pertenece a este docente.")

    email = email.lower().strip()
    if User.query.filter_by(email=email).first():
        raise ValueError("Ya existe una cuenta con ese correo.")

    full_name = f"{first_name.strip()} {last_name.strip()}".strip()
    student = User(full_name=full_name, email=email, role=RoleEnum.STUDENT)
    student.set_password(password)
    grupo.estudiantes.append(student)
    db.session.add(student)

    try:
        db.session.flush()
    except IntegrityError:
        db.session.rollback()
        raise ValueError("Ya existe una cuenta con ese correo.")

    db.session.add(
        StudentProfile(
            user_id=student.id,
            alias=alias.strip() or None,
            tutor_email=tutor_email.strip().lower() or None,
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


def move_student_to_group(teacher: User, student_id: int, target_group_id: int) -> None:
    target = Grupo.query.filter_by(id=target_group_id, teacher_id=teacher.id).first()
    if target is None:
        raise ValueError("El grupo destino no existe o no pertenece a este docente.")

    student = User.query.get(student_id)
    if student is None:
        raise ValueError("El estudiante no existe.")

    for grupo in list(student.grupos):
        if grupo.teacher_id == teacher.id:
            grupo.estudiantes.remove(student)

    target.estudiantes.append(student)
    db.session.commit()


def deactivate_student(teacher: User, group_id: int, student_id: int) -> None:
    grupo = Grupo.query.filter_by(id=group_id, teacher_id=teacher.id).first()
    student = User.query.get(student_id)
    if grupo and student and student in grupo.estudiantes:
        student.is_active_account = False
        db.session.commit()


def reactivate_student(teacher: User, group_id: int, student_id: int) -> None:
    grupo = Grupo.query.filter_by(id=group_id, teacher_id=teacher.id).first()
    student = User.query.get(student_id)
    if grupo and student and student in grupo.estudiantes:
        student.is_active_account = True
        db.session.commit()


def get_sesiones_sistema() -> List[Trastorno]:
    return Trastorno.query.order_by(Trastorno.name.asc()).all()


def get_trastornos_overview() -> List[dict]:
    trastornos = Trastorno.query.order_by(Trastorno.name.asc()).all()
    overview = []
    for trastorno in trastornos:
        actividades = (
            Actividad.query.filter_by(trastorno_id=trastorno.id)
            .order_by(Actividad.order_index.asc())
            .all()
        )
        overview.append({"trastorno": trastorno, "actividades": actividades})
    return overview


def get_planes_overview(teacher: User) -> List[dict]:
    """Igual que get_trastornos_overview, pero con el conteo de estudiantes
    de este docente inscritos en cada plan (trastorno)."""
    overview = get_trastornos_overview()
    counts = {
        item["trastorno"].id: item["estudiantes"]
        for item in get_trastornos_mas_trabajados(teacher, limit=1000)
    }
    for plan in overview:
        plan["estudiantes_inscritos"] = counts.get(plan["trastorno"].id, 0)
    return overview


def get_student_if_owned_by_teacher(teacher: User, student_id: int) -> Optional[User]:
    student = User.query.get(student_id)
    if student is None or not student.is_student:
        return None
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
    student = User.query.get(student_id)
    if student is None or not any(g.teacher_id == teacher.id for g in student.grupos):
        raise ValueError("Ese estudiante no pertenece a tus grupos.")

    if end_date < start_date:
        raise ValueError("La fecha de fin no puede ser anterior a la de inicio.")

    sesion = SesionAsignada(
        student_id=student_id,
        actividad_id=actividad_id,
        assigned_by_id=teacher.id,
        start_date=start_date,
        end_date=end_date,
    )
    db.session.add(sesion)

    actividad = Actividad.query.get(actividad_id)
    if actividad is not None:
        _notify_student(
            student_id,
            f"Tu docente te asignó una nueva actividad: {actividad.title}.",
        )

    db.session.commit()
    return sesion


def get_sesiones_asignadas_for_actividad(actividad_id: int, teacher: User) -> List[SesionAsignada]:
    return (
        SesionAsignada.query.filter_by(actividad_id=actividad_id, assigned_by_id=teacher.id)
        .order_by(SesionAsignada.assigned_at.desc())
        .all()
    )


def update_session_notes(teacher: User, sesion_id: int, notes: str) -> int:
    sesion = SesionAsignada.query.filter_by(id=sesion_id, assigned_by_id=teacher.id).first()
    if sesion is None:
        raise ValueError("Esa sesión asignada no existe o no te pertenece.")
    sesion.clinical_notes = notes.strip() or None
    db.session.commit()
    return sesion.actividad_id


def get_student_ranking_by_completed_sessions(teacher: User, since_date=None) -> List[dict]:
    """Ranking de estudiantes por sesiones completadas dentro de un ciclo.
    Los ciclos duran 6-7 meses; el filtro 'ciclo_actual' usa 6 meses como
    referencia por defecto cuando no se pasa since_date."""
    if since_date is None:
        since_date = date.today() - timedelta(days=180)

    ranking = []
    for student in get_students_for_teacher(teacher):
        query = SesionAsignada.query.filter(
            SesionAsignada.student_id == student.id,
            SesionAsignada.status == EstadoSesion.COMPLETADA,
            SesionAsignada.assigned_at >= since_date,
        )
        ranking.append({"student": student, "completadas": query.count()})
    ranking.sort(key=lambda fila: fila["completadas"], reverse=True)
    return ranking


def get_weekly_completion_counts(teacher: User, weeks: int = 8) -> dict:
    """Serie semanal de sesiones completadas, para el gráfico de rendimiento
    general del panel general. Referencia temporal: los ciclos duran 6-7 meses,
    así que 8 semanas (≈2 meses) es una vista relevante del ciclo activo."""
    student_ids = [s.id for s in get_students_for_teacher(teacher)]
    today = date.today()
    labels, values = [], []
    for i in range(weeks - 1, -1, -1):
        week_start = today - timedelta(days=today.weekday() + i * 7)
        week_end = week_start + timedelta(days=6)
        count = 0
        if student_ids:
            count = SesionAsignada.query.filter(
                SesionAsignada.student_id.in_(student_ids),
                SesionAsignada.status == EstadoSesion.COMPLETADA,
                SesionAsignada.assigned_at >= week_start,
                SesionAsignada.assigned_at <= week_end,
            ).count()
        labels.append(week_start.strftime("%d/%m"))
        values.append(count)
    return {"labels": labels, "values": values}


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
    """Para el panel general del estudiante: sus trastornos asignados con
    cuántas actividades tiene en total y cuántas ha completado."""
    resultado = []
    for asignacion in student.trastornos_asignados:
        trastorno = asignacion.trastorno
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
            "total": total,
            "completadas": completadas,
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


def get_student_racha(student: User) -> int:
    """Días consecutivos con al menos una sesión completada (racha de constancia).
    Cuenta hacia atrás desde hoy hasta romper la racha."""
    today = date.today()
    racha = 0
    dia = today
    for _ in range(365):
        tuvo_actividad = SesionAsignada.query.filter(
            SesionAsignada.student_id == student.id,
            SesionAsignada.status == EstadoSesion.COMPLETADA,
            SesionAsignada.assigned_at >= dia,
            SesionAsignada.assigned_at < dia + timedelta(days=1),
        ).first()
        if tuvo_actividad:
            racha += 1
            dia -= timedelta(days=1)
        else:
            break
    return racha


def get_student_racha_mensual(student: User) -> int:
    """Racha mensual: cantidad de días distintos (no necesariamente
    consecutivos) con al menos una sesión completada en los últimos 30 días."""
    since = date.today() - timedelta(days=30)
    sesiones = SesionAsignada.query.filter(
        SesionAsignada.student_id == student.id,
        SesionAsignada.status == EstadoSesion.COMPLETADA,
        SesionAsignada.assigned_at >= since,
    ).all()
    dias = {sesion.assigned_at.date() for sesion in sesiones}
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
        raise ValueError("Esa actividad no existe o no te pertenece.")
    if sesion.started_at is None:
        sesion.started_at = datetime.utcnow()
        db.session.commit()
    return sesion


def get_student_profile(student: User) -> Optional[StudentProfile]:
    return StudentProfile.query.filter_by(user_id=student.id).first()