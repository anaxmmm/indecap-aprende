"""
Configuración de la aplicación indecap-aprende.

Estrategia de base de datos:
- Si la variable de entorno DATABASE_URL está definida (típicamente PostgreSQL,
  tanto en local como en Railway/Render), se usa esa.
- Si NO está definida, se usa un archivo SQLite local (instance/indecap_dev.db)
  para que el proyecto corra sin necesidad de instalar PostgreSQL primero.
  Esto es solo para desarrollo inicial: la base de datos objetivo del proyecto
  es PostgreSQL (ver docs/bitacoras para la justificación).
"""
import os
from datetime import timedelta

BASE_DIR = os.path.abspath(os.path.dirname(os.path.dirname(__file__)))


def _resolve_database_url() -> str:
    url = os.environ.get("DATABASE_URL")
    if url:
        # Railway/Render a veces entregan la URL con el esquema antiguo
        # "postgres://", que SQLAlchemy 1.4+ ya no acepta. Se normaliza aquí.
        if url.startswith("postgres://"):
            url = url.replace("postgres://", "postgresql://", 1)
        return url
    instance_dir = os.path.join(BASE_DIR, "instance")
    os.makedirs(instance_dir, exist_ok=True)
    return "sqlite:///" + os.path.join(instance_dir, "indecap_dev.db")


def _env_int(name: str, default: int) -> int:
    try:
        return int(os.environ.get(name, default))
    except (TypeError, ValueError):
        return default


DEFAULT_SECRET_KEY = "cambia-esta-clave-en-produccion"


class BaseConfig:
    SECRET_KEY = os.environ.get("SECRET_KEY", DEFAULT_SECRET_KEY)
    SQLALCHEMY_DATABASE_URI = _resolve_database_url()
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    REMEMBER_COOKIE_DURATION = timedelta(days=14)
    SESSION_COOKIE_SAMESITE = "Lax"
    SESSION_COOKIE_HTTPONLY = True
    REMEMBER_COOKIE_SAMESITE = "Lax"
    REMEMBER_COOKIE_HTTPONLY = True

    # Reglas del módulo inclusivo, centralizadas para no dispersar "números mágicos"
    ACTIVITY_MAX_MINUTES = 30
    ACTIVITY_MIN_MINUTES = 20

    # Internacionalización (Flask-Babel): el español es el idioma fuente
    LANGUAGES = ["es", "en"]
    BABEL_DEFAULT_LOCALE = "es"

    # Inicio de sesión: intentos fallidos permitidos antes de bloquear y
    # minutos de bloqueo. Por dirección IP el límite es más alto, porque en
    # el instituto muchos estudiantes comparten la misma conexión.
    LOGIN_MAX_ATTEMPTS = _env_int("LOGIN_MAX_ATTEMPTS", 5)
    LOGIN_MAX_ATTEMPTS_IP = _env_int("LOGIN_MAX_ATTEMPTS_IP", 30)
    LOGIN_LOCK_MINUTES = _env_int("LOGIN_LOCK_MINUTES", 10)
    # Solicitudes de recuperación de contraseña por correo y por hora.
    RESET_MAX_REQUESTS = _env_int("RESET_MAX_REQUESTS", 3)

    # Sesión inactiva: aviso unos minutos antes y cierre automático. No
    # aplica a quien marcó «Recordarme» (computador personal).
    IDLE_TIMEOUT_MINUTES = _env_int("IDLE_TIMEOUT_MINUTES", 30)
    IDLE_WARNING_MINUTES = _env_int("IDLE_WARNING_MINUTES", 5)

    # Correo saliente (recuperación de contraseña). Los define el área de
    # sistemas en las variables de entorno del servidor.
    MAIL_SERVER = os.environ.get("MAIL_SERVER", "")
    MAIL_PORT = _env_int("MAIL_PORT", 587)
    MAIL_USERNAME = os.environ.get("MAIL_USERNAME", "")
    MAIL_PASSWORD = os.environ.get("MAIL_PASSWORD", "")
    MAIL_USE_TLS = os.environ.get("MAIL_USE_TLS", "true").lower() in ("1", "true", "si", "sí", "yes")
    MAIL_USE_SSL = os.environ.get("MAIL_USE_SSL", "false").lower() in ("1", "true", "si", "sí", "yes")
    MAIL_DEFAULT_SENDER = os.environ.get("MAIL_DEFAULT_SENDER", "")

    # Contacto para ejercer los derechos sobre los datos personales.
    DATA_CONTACT_EMAIL = os.environ.get("DATA_CONTACT_EMAIL", "indecap@indecap.edu.co")

    # Copias de seguridad de la base de datos (comando «flask respaldo»).
    BACKUP_DIR = os.environ.get("BACKUP_DIR", os.path.join(BASE_DIR, "instance", "respaldos"))
    BACKUP_KEEP = _env_int("BACKUP_KEEP", 14)

    # Número de servidores intermedios (por ejemplo nginx) delante de la
    # aplicación, para leer bien la IP y el protocolo de cada visita.
    TRUSTED_PROXIES = _env_int("TRUSTED_PROXIES", 0)


class DevelopmentConfig(BaseConfig):
    DEBUG = True


class ProductionConfig(BaseConfig):
    DEBUG = False
    SESSION_COOKIE_SECURE = True
    REMEMBER_COOKIE_SECURE = True
    PREFERRED_URL_SCHEME = "https"


class TestingConfig(BaseConfig):
    TESTING = True
    SQLALCHEMY_DATABASE_URI = "sqlite:///:memory:"
    WTF_CSRF_ENABLED = False


config_by_name = {
    "development": DevelopmentConfig,
    "production": ProductionConfig,
    "testing": TestingConfig,
}
