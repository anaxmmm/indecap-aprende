"""Lógica de negocio del blueprint admin: CRUD de trastornos, actividades,
gestión de usuarios y estadísticas."""
from flask_babel import gettext as _
from sqlalchemy import or_

from app.extensions import db
from app.models.content import Trastorno, Actividad
from app.models.user import User
from app.models.assignment import TrastornoAsignado
from app.models.assigned_session import SesionAsignada
from app.models.notification import Notification


def get_dashboard_stats() -> dict:
    return {
        "total_users": User.query.count(),
        "total_trastornos": Trastorno.query.count(),
        "total_actividades": Actividad.query.count(),
    }


# --- Trastornos ---

def list_trastornos():
    return Trastorno.query.order_by(Trastorno.name).all()


def get_trastorno_or_404(trastorno_id: int) -> Trastorno:
    return Trastorno.query.get_or_404(trastorno_id)


def create_trastorno(data: dict) -> Trastorno:
    trastorno = Trastorno(**data)
    db.session.add(trastorno)
    db.session.commit()
    return trastorno


def update_trastorno(trastorno: Trastorno, data: dict) -> Trastorno:
    for key, value in data.items():
        setattr(trastorno, key, value)
    db.session.commit()
    return trastorno


def delete_trastorno(trastorno: Trastorno) -> None:
    db.session.delete(trastorno)
    db.session.commit()


# --- Actividades ---

def list_actividades(trastorno_id: int):
    return Actividad.query.filter_by(trastorno_id=trastorno_id).order_by(Actividad.order_index).all()


def get_actividad_or_404(actividad_id: int) -> Actividad:
    return Actividad.query.get_or_404(actividad_id)


def create_actividad(data: dict) -> Actividad:
    actividad = Actividad(**data)
    db.session.add(actividad)
    db.session.commit()
    return actividad


def update_actividad(actividad: Actividad, data: dict) -> Actividad:
    for key, value in data.items():
        setattr(actividad, key, value)
    db.session.commit()
    return actividad


def delete_actividad(actividad: Actividad) -> None:
    db.session.delete(actividad)
    db.session.commit()


# --- Usuarios ---

def list_all_users():
    return User.query.order_by(User.full_name.asc()).all()


def delete_student_account(user_id: int) -> None:
    """Elimina definitivamente una cuenta de estudiante y todo su rastro en
    el sistema (trastornos asignados, sesiones asignadas, notificaciones),
    sin importar si pertenece a algún grupo o docente — pensado para
    cuentas huérfanas que nunca pasaron por el flujo normal de registro.

    Solo aplica a cuentas de estudiante: borrar un docente o administrador
    requiere reglas aparte (tiene grupos propios como teacher_id y aparece
    como assigned_by_id en asignaciones de otros estudiantes), así que no
    se permite desde aquí todavía.
    """
    user = User.query.get(user_id)
    if user is None or not user.is_student:
        raise ValueError(_("Esa cuenta no existe o no es de un estudiante."))

    TrastornoAsignado.query.filter_by(student_id=user.id).delete()
    SesionAsignada.query.filter_by(student_id=user.id).delete()
    Notification.query.filter(
        or_(Notification.recipient_id == user.id, Notification.student_id == user.id)
    ).delete(synchronize_session=False)

    db.session.delete(user)
    db.session.commit()
