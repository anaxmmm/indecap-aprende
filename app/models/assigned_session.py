"""Asignación de una actividad concreta a un estudiante, con rango de
fechas, estado y notas clínicas. Equivalente al 'Asignar sesión' de
Atenxia. Un estudiante puede tener varios trastornos asignados a la vez,
así que esto asigna la actividad puntual, no el trastorno completo.
"""
import enum
from datetime import datetime

from app.extensions import db


class EstadoSesion(str, enum.Enum):
    PENDIENTE = "pendiente"
    COMPLETADA = "completada"


class SesionAsignada(db.Model):
    __tablename__ = "sesiones_asignadas"

    id = db.Column(db.Integer, primary_key=True)
    student_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    actividad_id = db.Column(db.Integer, db.ForeignKey("actividades.id"), nullable=False)
    assigned_by_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)

    start_date = db.Column(db.Date, nullable=False)
    end_date = db.Column(db.Date, nullable=False)
    status = db.Column(db.Enum(EstadoSesion), default=EstadoSesion.PENDIENTE)
    clinical_notes = db.Column(db.Text, nullable=True)

    assigned_at = db.Column(db.DateTime, default=datetime.utcnow)

    student = db.relationship(
        "User", foreign_keys=[student_id], backref="sesiones_asignadas"
    )
    actividad = db.relationship("Actividad", backref="asignaciones")
    assigned_by = db.relationship("User", foreign_keys=[assigned_by_id])

    def __repr__(self) -> str:
        return f"<SesionAsignada student_id={self.student_id} actividad_id={self.actividad_id}>"