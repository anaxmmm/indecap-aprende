"""Asignación de trastornos a un estudiante, hecha por un docente.

Se modela como tabla propia (no como columna en User ni en Trastorno)
para no tocar esos archivos y para poder registrar quién asignó y cuándo,
igual que se hizo con Grupo en app/models/group.py.
"""
from datetime import datetime

from app.extensions import db


class TrastornoAsignado(db.Model):
    __tablename__ = "trastornos_asignados"

    id = db.Column(db.Integer, primary_key=True)
    student_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    trastorno_id = db.Column(db.Integer, db.ForeignKey("trastornos.id"), nullable=False)
    assigned_by_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    assigned_at = db.Column(db.DateTime, default=datetime.utcnow)

    student = db.relationship(
        "User", foreign_keys=[student_id], backref="trastornos_asignados"
    )
    trastorno = db.relationship("Trastorno", backref="asignaciones")
    assigned_by = db.relationship("User", foreign_keys=[assigned_by_id])

    __table_args__ = (
        db.UniqueConstraint("student_id", "trastorno_id", name="uq_student_trastorno"),
    )

    def __repr__(self) -> str:
        return f"<TrastornoAsignado student_id={self.student_id} trastorno_id={self.trastorno_id}>"