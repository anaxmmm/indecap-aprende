"""Datos extendidos del perfil de un estudiante (niño/a), separados de
User para no tocar ese modelo. Sigue el mismo patrón que Grupo y
TrastornoAsignado: tabla propia relacionada por user_id.
"""
import enum

from app.extensions import db


class GeneroEnum(str, enum.Enum):
    NINA = "nina"
    NINO = "nino"
    OTRO = "otro"


class StudentProfile(db.Model):
    __tablename__ = "student_profiles"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False, unique=True)

    alias = db.Column(db.String(80), nullable=True)
    tutor_email = db.Column(db.String(150), nullable=True)
    gender = db.Column(db.Enum(GeneroEnum), nullable=True)
    birth_date = db.Column(db.Date, nullable=True)
    has_learning_difficulties = db.Column(db.Boolean, default=False)

    user = db.relationship(
        "User",
        backref=db.backref("student_profile", uselist=False, cascade="all, delete-orphan"),
    )

    def __repr__(self) -> str:
        return f"<StudentProfile user_id={self.user_id} alias={self.alias}>"