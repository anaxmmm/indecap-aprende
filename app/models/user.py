import enum
from datetime import datetime

from flask_login import UserMixin
from werkzeug.security import generate_password_hash, check_password_hash

from app.extensions import db


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
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    is_active_account = db.Column(db.Boolean, default=True)

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

    def __repr__(self) -> str:
        return f"<User {self.email} ({self.role.value})>"
