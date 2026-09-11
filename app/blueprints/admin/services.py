"""Lógica de negocio del blueprint admin: CRUD de trastornos, actividades y estadísticas."""
from app.extensions import db
from app.models.content import Trastorno, Actividad
from app.models.user import User


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
