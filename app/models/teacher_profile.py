"""Datos extendidos del perfil de un docente/psicólogo, separados de User
para no tocar ese modelo. Mismo patrón que StudentProfile.
"""
from app.extensions import db


class TeacherProfile(db.Model):
    __tablename__ = "teacher_profiles"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False, unique=True)
    area = db.Column(db.String(150), nullable=True)  # ej. "Psicología", "Matemáticas"

    user = db.relationship(
        "User",
        backref=db.backref("teacher_profile", uselist=False, cascade="all, delete-orphan"),
    )

    def __repr__(self) -> str:
        return f"<TeacherProfile user_id={self.user_id} area={self.area}>"