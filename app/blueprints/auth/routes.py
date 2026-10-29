import time

from flask import redirect, url_for, flash, request, render_template, current_app, session
from flask_babel import gettext as _
from flask_login import login_user, logout_user, login_required, current_user

from app.blueprints.auth import bp
from app.blueprints.auth.forms import (
    LoginForm,
    ForgotPasswordForm,
    ResetPasswordForm,
)
from app.blueprints.auth.services import (
    authenticate_user,
    portal_allows,
    build_reset_url,
    verify_reset_token,
    reset_password,
    clear_failures,
    login_keys,
    minutes_locked,
    register_failure,
)
from app.models.user import User
from app.utils.correo import mail_configured, send_mail


def _flash_locked(minutes: int) -> None:
    flash(
        _("Demasiados intentos fallidos. Por seguridad, espera %(n)s minutos e intenta de nuevo.", n=minutes),
        "danger",
    )


@bp.route("/login", methods=["GET", "POST"])
def login():
    """
    El único formulario real vive en el panel de superposición de home.html.
    Esta ruta procesa el POST de ese formulario y, por compatibilidad,
    redirige cualquier GET de vuelta al inicio conservando 'next'.
    """
    if current_user.is_authenticated:
        return redirect(url_for("dashboard.index"))

    next_page = request.values.get("next") or None

    if request.method == "GET":
        return redirect(url_for("index", next=next_page, panel="login"))

    form = LoginForm()
    if form.validate_on_submit():
        cfg = current_app.config
        email_key, ip_key = login_keys(form.email.data, request.remote_addr)
        bloqueo = minutes_locked(email_key, ip_key)
        if bloqueo:
            _flash_locked(bloqueo)
            return redirect(url_for("index", next=next_page, panel="login"))

        user = authenticate_user(form.email.data, form.password.data)
        if user is None:
            lock = cfg["LOGIN_LOCK_MINUTES"]
            por_correo = register_failure(email_key, cfg["LOGIN_MAX_ATTEMPTS"], lock, lock)
            por_ip = register_failure(ip_key, cfg["LOGIN_MAX_ATTEMPTS_IP"], lock, lock)
            if por_correo or por_ip:
                _flash_locked(lock)
            else:
                flash(_("Correo o contraseña incorrectos."), "danger")
            return redirect(url_for("index", next=next_page, panel="login"))

        portal_role = (form.portal_role.data or "estudiante").strip()
        if not portal_allows(portal_role, user):
            if user.is_student:
                flash(_("Esta cuenta es de estudiante. Ingresa por la opción «Estudiante»."), "danger")
            else:
                flash(_("Esta cuenta es institucional. Ingresa por la opción «Docente»."), "danger")
            return redirect(url_for("index", next=next_page, panel="login", portal="estudiante" if user.is_student else "docente"))

        clear_failures(email_key)
        login_user(user, remember=form.remember_me.data)
        session["remember"] = bool(form.remember_me.data)
        session["last_seen"] = time.time()
        return redirect(next_page or url_for("dashboard.index"))

    flash(_("Revisa los datos ingresados e intenta de nuevo."), "danger")
    return redirect(url_for("index", next=next_page, panel="login"))


@bp.route("/logout")
@login_required
def logout():
    lang = session.get("lang")
    logout_user()
    session.clear()
    if lang:
        session["lang"] = lang
    if request.args.get("motivo") == "inactividad":
        flash(_("Tu sesión se cerró por inactividad. Ingresa de nuevo para continuar."), "info")
        return redirect(url_for("index", panel="login"))
    flash(_("Sesión cerrada correctamente."), "info")
    return redirect(url_for("index"))


@bp.route("/forgot-password", methods=["GET", "POST"])
def forgot_password():
    if current_user.is_authenticated:
        return redirect(url_for("dashboard.index"))

    if request.method == "GET":
        return redirect(url_for("index", panel="forgot"))

    form = ForgotPasswordForm()
    if form.validate_on_submit():
        email = form.email.data.lower().strip()
        user = User.query.filter_by(email=email).first()
        reset_key = "reset:" + email
        if user and user.is_active_account and not minutes_locked(reset_key):
            register_failure(reset_key, current_app.config["RESET_MAX_REQUESTS"], 60, 60)
            _send_reset_email(user)

        # Mensaje idéntico exista o no la cuenta: evita revelar qué correos
        # están registrados.
        flash(
            _("Si el correo está registrado, recibirás instrucciones para restablecer tu contraseña."),
            "success",
        )
        return redirect(url_for("index", panel="login"))

    for field_errors in form.errors.values():
        for error in field_errors:
            flash(str(error), "danger")
    return redirect(url_for("index", panel="forgot"))


def _send_reset_email(user: User) -> None:
    """Envía el enlace de recuperación. Sin servidor de correo configurado,
    en desarrollo el enlace se muestra en pantalla para poder probar el
    proceso; en producción solo queda un aviso en el registro del servidor."""
    reset_url = build_reset_url(user)
    if mail_configured():
        context = {"user": user, "url": reset_url}
        enviado = send_mail(
            user.email,
            _("Recupera tu contraseña de indecap-aprende"),
            render_template("email/recuperar_contrasena.txt", **context),
            render_template("email/recuperar_contrasena.html", **context),
        )
        if enviado:
            return
    if current_app.debug:
        flash(_("Enlace de recuperación (solo en desarrollo): %(url)s", url=reset_url), "info")
    else:
        current_app.logger.warning("No se envió el correo de recuperación: el servidor de correo no está configurado o falló.")


@bp.route("/sigo-aqui", methods=["POST"])
@login_required
def keepalive():
    """Lo llama el aviso de sesión inactiva cuando la persona elige seguir."""
    session["last_seen"] = time.time()
    return "", 204


@bp.route("/reset-password/<token>", methods=["GET", "POST"])
def reset_password_view(token):
    if current_user.is_authenticated:
        return redirect(url_for("dashboard.index"))

    user = verify_reset_token(token)
    if user is None:
        flash(_("El enlace de recuperación no es válido o ha expirado. Solicita uno nuevo."), "danger")
        return redirect(url_for("index", panel="forgot"))

    form = ResetPasswordForm()
    if form.validate_on_submit():
        reset_password(user, form.password.data)
        flash(_("Tu contraseña se actualizó correctamente. Ya puedes iniciar sesión."), "success")
        return redirect(url_for("index", panel="login"))

    return render_template("auth/reset_password.html", form=form, token=token)
