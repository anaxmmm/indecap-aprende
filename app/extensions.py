"""
Instancias de extensiones de Flask, creadas una sola vez aquí y
enlazadas a la app dentro de create_app() (patrón application factory).
Evita imports circulares entre app/__init__.py y los blueprints.
"""
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_login import LoginManager

db = SQLAlchemy()
migrate = Migrate()
login_manager = LoginManager()

# Configuración básica de Flask-Login
login_manager.login_view = "index"
login_manager.login_message = "Por favor inicia sesión para continuar."
login_manager.login_message_category = "info"