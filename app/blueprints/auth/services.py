"""Lógica de negocio del blueprint auth."""
from typing import Optional

from flask import current_app, url_for
from itsdangerous import URLSafeTimedSerializer, BadSignature, SignatureExpired

from app.extensions import db
from app.models.user import User, RoleEnum

RESET_TOKEN_SALT = "password-reset-salt"
RESET_TOKEN_MAX_AGE = 3600  # 1 hora


def authenticate_user(email: str, password: str) -> Optional[User]:
    """Verifica credenciales y devuelve el User si son válidas, o None."""
    user = User.query.filter_by(email=email.lower().strip()).first()
    if user and user.is_active_account and user.check_password(password):
        return user
    return None


def register_user(full_name: str, email: str, password: str, role: str) -> User:
    """Crea un nuevo usuario (estudiante o docente) y lo persiste."""
    user = User(
        full_name=full_name.strip(),
        email=email.lower().strip(),
        role=RoleEnum(role),
    )
    user.set_password(password)
    db.session.add(user)
    db.session.commit()
    return user


def _get_serializer() -> URLSafeTimedSerializer:
    return URLSafeTimedSerializer(current_app.config["SECRET_KEY"])


def generate_reset_token(user: User) -> str:
    return _get_serializer().dumps(user.email, salt=RESET_TOKEN_SALT)


def verify_reset_token(token: str, max_age: int = RESET_TOKEN_MAX_AGE) -> Optional[User]:
    """Decodifica el token y devuelve el User si es válido y no ha expirado."""
    try:
        email = _get_serializer().loads(token, salt=RESET_TOKEN_SALT, max_age=max_age)
    except (BadSignature, SignatureExpired):
        return None
    return User.query.filter_by(email=email).first()


def build_reset_url(user: User) -> str:
    token = generate_reset_token(user)
    return url_for("auth.reset_password_view", token=token, _external=True)


def reset_password(user: User, new_password: str) -> None:
    user.set_password(new_password)
    db.session.commit()