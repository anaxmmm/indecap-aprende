import enum

from flask_login import UserMixin
from werkzeug.security import generate_password_hash, check_password_hash

from app.extensions import db
from app.utils.fechas import utc_now


class RoleEnum(str, enum.Enum):
    STUDENT = "estudiante"
    TEACHER = "docente"
    ADMIN = "administrador"


class User(UserMixin, db.Model):
    __tablename__ = "users"

    id = db.Column(db.Integer, primary_key=True)
    full_name = db.Column(db.String(150), nullable=False)
    email = db.Column(db.String(150), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(255), nullable=False)
    role = db.Column(db.Enum(RoleEnum), nullable=False, default=RoleEnum.STUDENT)
    created_at = db.Column(db.DateTime, default=utc_now)
    is_active_account = db.Column(db.Boolean, default=True)

    # Administrador principal: el único que puede crear o archivar otros
    # administradores. Se asigna con el comando «flask create-admin».
    is_principal = db.Column(db.Boolean, nullable=False, default=False, server_default=db.false())

    # Las cuentas no se borran: se archivan. La persona deja de poder
    # ingresar y sale de las listas, pero sus partidas, avisos y asignaciones
    # se conservan para cualquier revisión posterior.
    archived_at = db.Column(db.DateTime, nullable=True)
    archived_by_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=True)
    created_by_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=True)

    # Autorización de tratamiento de datos (Ley 1581 de 2012). Para los
    # estudiantes se registra quién la confirmó y cuándo, al crear la cuenta.
    data_consent_at = db.Column(db.DateTime, nullable=True)
    data_consent_by_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=True)

    accessibility_profile = db.relationship(
        "AccessibilityProfile",
        backref="user",
        uselist=False,
        cascade="all, delete-orphan",
    )
    progress_entries = db.relationship(
        "Progress", backref="user", cascade="all, delete-orphan"
    )

    def set_password(self, raw_password: str) -> None:
        self.password_hash = generate_password_hash(raw_password)

    def check_password(self, raw_password: str) -> bool:
        return check_password_hash(self.password_hash, raw_password)

    @property
    def is_student(self) -> bool:
        return self.role == RoleEnum.STUDENT

    @property
    def is_teacher(self) -> bool:
        return self.role == RoleEnum.TEACHER

    @property
    def is_admin(self) -> bool:
        return self.role == RoleEnum.ADMIN

    @property
    def is_archived(self) -> bool:
        return self.archived_at is not None

    def creatable_roles(self) -> list:
        """Roles de las cuentas que esta persona puede crear."""
        if self.is_admin and self.is_principal:
            return [RoleEnum.ADMIN, RoleEnum.TEACHER, RoleEnum.STUDENT]
        if self.is_admin:
            return [RoleEnum.TEACHER, RoleEnum.STUDENT]
        if self.is_teacher:
            return [RoleEnum.STUDENT]
        return []

    def can_manage(self, other: "User") -> bool:
        """Si puede archivar o restaurar la cuenta de otra persona.
        Un docente solo gestiona a los estudiantes de sus propios grupos."""
        if other is None or other.id == self.id or other.is_principal:
            return False
        if other.role not in self.creatable_roles():
            return False
        if self.is_teacher:
            return any(g.teacher_id == self.id for g in other.grupos)
        return True

    def __repr__(self) -> str:
        return f"<User {self.email} ({self.role.value})>"
