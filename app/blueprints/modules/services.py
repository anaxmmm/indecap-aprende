"""Lógica de negocio del blueprint modules (listado y detalle de actividades)."""
from app.models.content import Trastorno, Actividad, CheckPrevio


def get_all_trastornos():
    return Trastorno.query.order_by(Trastorno.name).all()


def get_actividad_or_404(actividad_id: int) -> Actividad:
    return Actividad.query.get_or_404(actividad_id)


def get_check_previo(user_id: int, trastorno_id: int):
    return CheckPrevio.query.filter_by(user_id=user_id, trastorno_id=trastorno_id).first()
