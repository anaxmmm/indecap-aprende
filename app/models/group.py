"""Modelo de grupo de estudiantes a cargo de un docente.

Se implementa como tabla propia + asociación many-to-many con `users`,
en vez de agregar una columna a User, para no tocar la tabla `users`
ya existente. La regla de negocio "un estudiante pertenece a un solo
grupo a la vez" se aplica en app/blueprints/dashboard/services.py, no
a nivel de base de datos.
"""

from app.extensions import db
from app.utils.fechas import utc_now

grupo_estudiantes = db.Table(
    "grupo_estudiantes",
    db.Column("grupo_id", db.Integer, db.ForeignKey("grupos.id"), primary_key=True),
    db.Column("student_id", db.Integer, db.ForeignKey("users.id"), primary_key=True),
)


class Grupo(db.Model):
    __tablename__ = "grupos"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(150), nullable=False)
    teacher_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    created_at = db.Column(db.DateTime, default=utc_now)

    teacher = db.relationship(
        "User", foreign_keys=[teacher_id], backref="grupos_a_cargo"
    )
    estudiantes = db.relationship(
        "User", secondary=grupo_estudiantes, backref="grupos"
    )

    def __repr__(self) -> str:
        return f"<Grupo {self.name} (docente_id={self.teacher_id})>"