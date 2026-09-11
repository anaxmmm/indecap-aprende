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


class BaseConfig:
    SECRET_KEY = os.environ.get("SECRET_KEY", "cambia-esta-clave-en-produccion")
    SQLALCHEMY_DATABASE_URI = _resolve_database_url()
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    REMEMBER_COOKIE_DURATION = timedelta(days=14)

    # Reglas del módulo inclusivo, centralizadas para no dispersar "números mágicos"
    ACTIVITY_MAX_MINUTES = 30
    ACTIVITY_MIN_MINUTES = 20


class DevelopmentConfig(BaseConfig):
    DEBUG = True


class ProductionConfig(BaseConfig):
    DEBUG = False
    SESSION_COOKIE_SECURE = True
    REMEMBER_COOKIE_SECURE = True


class TestingConfig(BaseConfig):
    TESTING = True
    SQLALCHEMY_DATABASE_URI = "sqlite:///:memory:"
    WTF_CSRF_ENABLED = False


config_by_name = {
    "development": DevelopmentConfig,
    "production": ProductionConfig,
    "testing": TestingConfig,
}
