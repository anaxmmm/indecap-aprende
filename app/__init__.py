import os
from urllib.parse import urlparse

from flask import Flask, session

from app.config import config_by_name
from app.extensions import db, migrate, login_manager, babel


def create_app(config_name: str = None) -> Flask:
    """Application factory de indecap-aprende.

    Todos los blueprints se registran al mismo nivel (auth, dashboard,
    modules, admin, inclusive, games) — decisión documentada en
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
    _register_i18n(app)

    return app


def _select_locale() -> str:
    """
    Decide el idioma de cada petición: el que el usuario eligió con el botón
    ES/EN (guardado en la sesión) o, si aún no eligió, el idioma por defecto.
    """
    from flask import current_app

    lang = session.get("lang")
    if lang in current_app.config["LANGUAGES"]:
        return lang
    return current_app.config["BABEL_DEFAULT_LOCALE"]


def _init_extensions(app: Flask) -> None:
    db.init_app(app)
    migrate.init_app(app, db)
    login_manager.init_app(app)
    babel.init_app(app, locale_selector=_select_locale)


def _register_blueprints(app: Flask) -> None:
    from app.blueprints.auth import bp as auth_bp
    from app.blueprints.dashboard import bp as dashboard_bp
    from app.blueprints.modules import bp as modules_bp
    from app.blueprints.admin import bp as admin_bp
    from app.blueprints.inclusive import bp as inclusive_bp
    from app.blueprints.games import bp as games_bp

    app.register_blueprint(auth_bp, url_prefix="/auth")
    app.register_blueprint(dashboard_bp, url_prefix="/dashboard")
    app.register_blueprint(modules_bp, url_prefix="/modules")
    app.register_blueprint(admin_bp, url_prefix="/admin")
    app.register_blueprint(inclusive_bp, url_prefix="/inclusive")
    app.register_blueprint(games_bp, url_prefix="/games")


def _register_user_loader() -> None:
    from app.models.user import User

    @login_manager.user_loader
    def load_user(user_id):
        user = User.query.get(int(user_id))
        # Si la cuenta fue desactivada (p. ej. estudiante desvinculado de su
        # grupo), Flask-Login debe dejar de reconocer la sesión existente en
        # cada request siguiente — devolver None aquí cierra esa sesión de
        # forma efectiva, sin tocar el resto del flujo de login/logout.
        if user is not None and not user.is_active_account:
            return None
        return user


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


def _register_i18n(app: Flask) -> None:
    """
    Internacionalización (Flask-Babel):
    - 'current_lang' queda disponible en todas las plantillas ("es" o "en").
    - /lang/<code> guarda el idioma elegido en la sesión y devuelve al
      usuario a la página donde estaba.
    """
    from flask import redirect, request, url_for
    from flask_babel import get_locale

    @app.context_processor
    def inject_current_lang():
        return {"current_lang": str(get_locale() or "es")}

    @app.route("/lang/<code>")
    def set_language(code):
        if code in app.config["LANGUAGES"]:
            session["lang"] = code

        # Solo se regresa a la página anterior si es de este mismo sitio
        # (evita redirecciones abiertas hacia dominios externos).
        target = request.referrer
        if target and urlparse(target).netloc == request.host:
            return redirect(target)
        return redirect(url_for("index"))
