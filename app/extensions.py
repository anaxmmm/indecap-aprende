"""
Instancias de extensiones de Flask, creadas una sola vez aquí y
enlazadas a la app dentro de create_app() (patrón application factory).
Evita imports circulares entre app/__init__.py y los blueprints.
"""
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_login import LoginManager
from flask_babel import Babel, gettext

db = SQLAlchemy()
migrate = Migrate()
login_manager = LoginManager()
babel = Babel()


def N_(message):
    """Marca un texto para que pybabel lo extraiga al catálogo, sin
    traducirlo todavía. La traducción real ocurre al mostrar el mensaje,
    mediante login_manager.localize_callback."""
    return message


# Configuración básica de Flask-Login
login_manager.login_view = "index"
login_manager.login_message = N_("Por favor inicia sesión para continuar.")
login_manager.localize_callback = gettext
login_manager.login_message_category = "info"
