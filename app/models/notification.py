"""Notificaciones para el docente (ej. cuando un estudiante avanza en una
actividad). Todavía no hay generador automático porque el motor de
actividades/juego del estudiante no existe aún.
"""
from datetime import datetime

from app.extensions import db


class Notification(db.Model):
    __tablename__ = "notifications"

    id = db.Column(db.Integer, primary_key=True)
    recipient_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    student_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=True)
    message = db.Column(db.String(255), nullable=False)
    is_read = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    recipient = db.relationship("User", foreign_keys=[recipient_id])
    student = db.relationship("User", foreign_keys=[student_id])

    def __repr__(self) -> str:
        return f"<Notification recipient_id={self.recipient_id} read={self.is_read}>"