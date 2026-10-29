import os
from urllib.parse import urlparse

from flask import Flask, session

from app.config import config_by_name
from app.extensions import db, migrate, login_manager, babel, csrf


def create_app(config_name: str = None) -> Flask:
    """Application factory de indecap-aprende.

    Todos los blueprints se registran al mismo nivel (auth, dashboard,
    modules, admin, inclusive, games) — decisión documentada en
    docs/bitacoras/Bitacora_indecap-aprende.docx, sección 5.
    """
    config_name = config_name or os.environ.get("FLASK_ENV", "development")
    app = Flask(__name__)
    app.config.from_object(config_by_name[config_name])
    _check_production_settings(app, config_name)

    _init_extensions(app)
    _register_blueprints(app)
    _register_user_loader()
    _register_cli(app)
    _register_root_route(app)
    _register_i18n(app)
    _register_security(app)

    return app


def _check_production_settings(app: Flask, config_name: str) -> None:
    """En producción la aplicación no arranca con la clave de ejemplo: con
    ella cualquiera podría falsificar sesiones y enlaces de recuperación."""
    if config_name != "production":
        return
    from app.config import DEFAULT_SECRET_KEY

    key = app.config.get("SECRET_KEY") or ""
    if key == DEFAULT_SECRET_KEY or len(key) < 32:
        raise RuntimeError(
            "Falta SECRET_KEY en el servidor. Define una clave propia de al menos "
            "32 caracteres en la variable de entorno SECRET_KEY (ver README)."
        )


def _register_security(app: Flask) -> None:
    """
    - Detrás de un servidor intermedio (nginx), lee la IP y el protocolo
      reales de cada visita.
    - Encabezados de seguridad en todas las respuestas.
    - Cierre de sesión por inactividad cuando no se marcó «Recordarme».
    """
    import time

    from flask import flash, jsonify, redirect, request, url_for
    from flask_babel import gettext as _
    from flask_login import current_user, logout_user

    proxies = app.config.get("TRUSTED_PROXIES") or 0
    if proxies:
        from werkzeug.middleware.proxy_fix import ProxyFix

        app.wsgi_app = ProxyFix(app.wsgi_app, x_for=proxies, x_proto=proxies, x_host=proxies)

    @app.after_request
    def security_headers(response):
        response.headers.setdefault("X-Content-Type-Options", "nosniff")
        response.headers.setdefault("X-Frame-Options", "SAMEORIGIN")
        response.headers.setdefault("Referrer-Policy", "strict-origin-when-cross-origin")
        if app.config.get("SESSION_COOKIE_SECURE"):
            response.headers.setdefault("Strict-Transport-Security", "max-age=31536000")
        return response

    @app.before_request
    def idle_logout():
        if request.endpoint in (None, "static"):
            return None
        if not current_user.is_authenticated:
            # Una consulta automática sin sesión no debe tocar la cookie: si
            # coincide con un cierre de sesión, borraría el aviso que se
            # acaba de guardar para mostrar en la pantalla de ingreso.
            if request.headers.get("X-Background"):
                return jsonify({"error": "sesion_vencida"}), 401
            return None
        if "remember" not in session:
            # Sesión recuperada con la cookie de «Recordarme».
            session["remember"] = session.get("_fresh") is False
        if session.get("remember"):
            return None
        now = time.time()
        limit = app.config["IDLE_TIMEOUT_MINUTES"] * 60
        last = session.get("last_seen")
        if last and now - last > limit:
            lang = session.get("lang")
            logout_user()
            session.clear()
            if lang:
                session["lang"] = lang
            if request.headers.get("X-Background") or request.accept_mimetypes.best == "application/json":
                return jsonify({"error": "sesion_vencida"}), 401
            flash(_("Tu sesión se cerró por inactividad. Ingresa de nuevo para continuar."), "info")
            return redirect(url_for("index", panel="login"))
        # Las consultas automáticas (campana, actualización del panel) no
        # cuentan como actividad.
        if not request.headers.get("X-Background"):
            session["last_seen"] = now
        return None

    @app.context_processor
    def inject_idle_settings():
        if current_user.is_authenticated and not session.get("remember"):
            return {
                "idle_timeout": app.config["IDLE_TIMEOUT_MINUTES"] * 60,
                "idle_warning": app.config["IDLE_WARNING_MINUTES"] * 60,
            }
        return {"idle_timeout": 0, "idle_warning": 0}


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
    csrf.init_app(app)


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
        user = db.session.get(User, int(user_id))
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
            ForgotPasswordForm,
        )

        next_page = request.args.get("next", "")
        auto_open_login = bool(next_page) or bool(get_flashed_messages())
        return render_template(
            "home.html",
            form=LoginForm(),
            forgot_form=ForgotPasswordForm(),
            next=next_page,
            auto_open_login=auto_open_login,
        )

    @app.route("/politica-de-datos")
    def politica_datos():
        return render_template(
            "legal/politica_datos.html",
            contact_email=app.config.get("DATA_CONTACT_EMAIL"),
        )


def _register_i18n(app: Flask) -> None:
    """
    Internacionalización (Flask-Babel):
    - 'current_lang' queda disponible en todas las plantillas ("es" o "en").
    - /lang/<code> guarda el idioma elegido en la sesión y devuelve al
      usuario a la página donde estaba.
    - Filtro 'notif_text': muestra un aviso en el idioma activo.
    """
    from flask import redirect, request, url_for
    from flask_babel import get_locale

    @app.context_processor
    def inject_current_lang():
        return {"current_lang": str(get_locale() or "es")}

    @app.template_filter("local")
    def local_datetime(value, pattern="%d/%m/%Y %H:%M"):
        from app.utils.fechas import format_local
        return format_local(value, pattern)

    @app.template_filter("condicion")
    def condicion(trastorno):
        from app.blueprints.games.registry import condition_label
        return condition_label(trastorno)

    @app.template_filter("notif_text")
    def notif_text(notification):
        return notification.text() if notification else ""

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
