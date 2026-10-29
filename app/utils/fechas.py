"""Fechas en la hora del instituto.

La base guarda todas las fechas en UTC. Para mostrarlas y para agrupar por
día o semana se pasan a la hora de Colombia (UTC-5, sin horario de verano).
El desfase se puede cambiar con UTC_OFFSET_HOURS en la configuración.
"""
from datetime import date, datetime, time, timedelta, timezone

from flask import current_app, has_app_context

DEFAULT_OFFSET_HOURS = -5


def _offset() -> timedelta:
    hours = DEFAULT_OFFSET_HOURS
    if has_app_context():
        hours = current_app.config.get("UTC_OFFSET_HOURS", DEFAULT_OFFSET_HOURS)
    return timedelta(hours=hours)


def utc_now() -> datetime:
    """Hora actual en UTC, sin zona (como se guarda en la base)."""
    return datetime.now(timezone.utc).replace(tzinfo=None)


def to_local(value: datetime | None) -> datetime | None:
    """UTC guardado en la base → hora local."""
    return value + _offset() if value is not None else None


def local_today() -> date:
    return (utc_now() + _offset()).date()


def local_day_start_utc(day: date) -> datetime:
    """Medianoche local de ese día, expresada en UTC, para filtrar consultas."""
    return datetime.combine(day, time.min) - _offset()


def format_local(value: datetime | None, pattern: str = "%d/%m/%Y %H:%M") -> str:
    local = to_local(value)
    return local.strftime(pattern) if local else ""
