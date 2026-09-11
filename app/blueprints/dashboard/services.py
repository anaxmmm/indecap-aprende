"""Lógica de negocio del blueprint dashboard, separada de las rutas
para mantenerlas delgadas y facilitar pruebas unitarias.
"""
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
from app.models.assigned_session import SesionAsignada


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

    db.session.commit()


def get_or_create_teacher_profile(user: User) -> TeacherProfile:
    profile = TeacherProfile.query.filter_by(user_id=user.id).first()
    if profile is None:
        profile = TeacherProfile(user_id=user.id)
        db.session.add(profile)
        db.session.commit()
    return profile


def update_teacher_profile(user: User, full_name: str, email: str, area: str) -> None:
    user.full_name = full_name.strip()
    user.email = email.lower().strip()
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