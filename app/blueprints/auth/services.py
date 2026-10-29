"""Lógica de negocio del blueprint auth."""
import hashlib
from datetime import timedelta
from typing import Optional

from flask import current_app, url_for
from itsdangerous import URLSafeTimedSerializer, BadSignature, SignatureExpired

from app.extensions import db
from app.models.login_throttle import LoginThrottle
from app.models.user import User, RoleEnum
from app.utils.fechas import utc_now

RESET_TOKEN_SALT = "password-reset-salt"
RESET_TOKEN_MAX_AGE = 3600  # 1 hora


def authenticate_user(email: str, password: str) -> Optional[User]:
    """Verifica credenciales y devuelve el User si son válidas, o None."""
    user = User.query.filter_by(email=email.lower().strip()).first()
    if user and user.is_active_account and user.check_password(password):
        return user
    return None


def portal_allows(portal_role: str, user: User) -> bool:
    """El acceso «Estudiante» solo admite estudiantes; el acceso «Docente»
    admite docentes y administradores. Se valida aquí, en el servidor,
    porque el valor del portal llega desde el formulario."""
    if portal_role == "docente":
        return user.role in (RoleEnum.TEACHER, RoleEnum.ADMIN)
    return user.role == RoleEnum.STUDENT


def _get_serializer() -> URLSafeTimedSerializer:
    return URLSafeTimedSerializer(current_app.config["SECRET_KEY"])


def _password_fingerprint(user: User) -> str:
    """Huella corta de la contraseña actual: al cambiarla, los enlaces de
    recuperación emitidos antes dejan de servir (cada enlace se usa una vez)."""
    return hashlib.sha256(user.password_hash.encode("utf-8")).hexdigest()[:16]


def generate_reset_token(user: User) -> str:
    return _get_serializer().dumps(
        {"email": user.email, "fp": _password_fingerprint(user)}, salt=RESET_TOKEN_SALT
    )


def verify_reset_token(token: str, max_age: int = RESET_TOKEN_MAX_AGE) -> Optional[User]:
    """Decodifica el token y devuelve el User si es válido y no ha expirado."""
    try:
        data = _get_serializer().loads(token, salt=RESET_TOKEN_SALT, max_age=max_age)
    except (BadSignature, SignatureExpired):
        return None
    if not isinstance(data, dict):
        return None
    user = User.query.filter_by(email=data.get("email")).first()
    if user is None or not user.is_active_account:
        return None
    if data.get("fp") != _password_fingerprint(user):
        return None
    return user


def build_reset_url(user: User) -> str:
    token = generate_reset_token(user)
    return url_for("auth.reset_password_view", token=token, _external=True)


def reset_password(user: User, new_password: str) -> None:
    user.set_password(new_password)
    db.session.commit()

# ---------------------------------------------------------------------------
# Límite de intentos
# ---------------------------------------------------------------------------

def _throttle(key: str) -> LoginThrottle:
    row = LoginThrottle.query.filter_by(key=key[:200]).first()
    if row is None:
        row = LoginThrottle(key=key[:200], failures=0)
        db.session.add(row)
    return row


def minutes_locked(*keys: str) -> int:
    """Minutos que faltan para poder intentar de nuevo con cualquiera de las
    claves dadas, o 0 si ninguna está bloqueada."""
    now = utc_now()
    pendiente = 0
    for key in keys:
        row = LoginThrottle.query.filter_by(key=key[:200]).first()
        if row is not None and row.locked_until and row.locked_until > now:
            segundos = (row.locked_until - now).total_seconds()
            pendiente = max(pendiente, int(segundos // 60) + 1)
    return pendiente


def register_failure(key: str, limit: int, window_minutes: int, lock_minutes: int) -> bool:
    """Suma un intento fallido a la clave. Si llega al límite dentro de la
    ventana, la bloquea. Devuelve True cuando acaba de quedar bloqueada."""
    now = utc_now()
    row = _throttle(key)
    if row.window_start is None or now - row.window_start > timedelta(minutes=window_minutes):
        row.window_start = now
        row.failures = 0
    row.failures += 1
    bloqueada = row.failures >= limit
    if bloqueada:
        row.locked_until = now + timedelta(minutes=lock_minutes)
        row.failures = 0
        row.window_start = None
    db.session.commit()
    return bloqueada


def clear_failures(key: str) -> None:
    row = LoginThrottle.query.filter_by(key=key[:200]).first()
    if row is not None:
        db.session.delete(row)
        db.session.commit()


def login_keys(email: str, ip: str) -> tuple:
    return "login:" + (email or "").lower().strip(), "ip:" + (ip or "desconocida")
