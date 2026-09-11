import os

from flask import Flask

from app.config import config_by_name
from app.extensions import db, migrate, login_manager


def create_app(config_name: str = None) -> Flask:
    """Application factory de indecap-aprende.

    Todos los blueprints se registran al mismo nivel (auth, dashboard,
    modules, admin, inclusive) — decisión documentada en
    docs/bitacoras/Bitacora_indecap-aprende.docx, sección 5.
    """
    config_name = config_name or os.environ.get("FLASK_ENV", "development")
    app = Flask(__name__)
    app.config.from_object(config_by_name[config_name])

    _init_extensions(app)
    _register_blueprints(app)
    _register_user_loader()
    _register_cli(app)
    _register_root_route(app)

    return app


def _init_extensions(app: Flask) -> None:
    db.init_app(app)
    migrate.init_app(app, db)
    login_manager.init_app(app)


def _register_blueprints(app: Flask) -> None:
    from app.blueprints.auth import bp as auth_bp
    from app.blueprints.dashboard import bp as dashboard_bp
    from app.blueprints.modules import bp as modules_bp
    from app.blueprints.admin import bp as admin_bp
    from app.blueprints.inclusive import bp as inclusive_bp

    app.register_blueprint(auth_bp, url_prefix="/auth")
    app.register_blueprint(dashboard_bp, url_prefix="/dashboard")
    app.register_blueprint(modules_bp, url_prefix="/modules")
    app.register_blueprint(admin_bp, url_prefix="/admin")
    app.register_blueprint(inclusive_bp, url_prefix="/inclusive")


def _register_user_loader() -> None:
    from app.models.user import User

    @login_manager.user_loader
    def load_user(user_id):
        return User.query.get(int(user_id))


def _register_cli(app: Flask) -> None:
    from app.cli import register_cli

    register_cli(app)


def _register_root_route(app: Flask) -> None:
    """
    Registra '/' explícitamente: sin esta ruta, la raíz del sitio da 404
    apenas se corre 'flask run', antes de que el usuario haga nada mal.
    Usuario autenticado -> directo al dashboard. Sin sesión -> landing,
    con el panel de login abierto automáticamente si venías de un intento
    de entrar a algo protegido (?next=...) o de cerrar sesión (con flash).
    """
    from flask import render_template, redirect, url_for, request, get_flashed_messages
    from flask_login import current_user

    @app.route("/")
    def index():
        if current_user.is_authenticated:
            return redirect(url_for("dashboard.index"))

        from app.blueprints.auth.forms import (
            LoginForm,
            RegistrationForm,
            ForgotPasswordForm,
        )

        next_page = request.args.get("next", "")
        auto_open_login = bool(next_page) or bool(get_flashed_messages())
        return render_template(
            "home.html",
            form=LoginForm(),
            register_form=RegistrationForm(),
            forgot_form=ForgotPasswordForm(),
            next=next_page,
            auto_open_login=auto_open_login,
        )