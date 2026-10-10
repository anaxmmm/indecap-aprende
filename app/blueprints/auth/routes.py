from flask import redirect, url_for, flash, request, render_template, current_app
from flask_babel import gettext as _
from flask_login import login_user, logout_user, login_required, current_user

from app.blueprints.auth import bp
from app.blueprints.auth.forms import (
    LoginForm,
    RegistrationForm,
    ForgotPasswordForm,
    ResetPasswordForm,
)
from app.blueprints.auth.services import (
    authenticate_user,
    register_user,
    build_reset_url,
    verify_reset_token,
    reset_password,
)
from app.models.user import User


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
        user = authenticate_user(form.email.data, form.password.data)
        if user is None:
            flash(_("Correo o contraseña incorrectos."), "danger")
            return redirect(url_for("index", next=next_page, panel="login"))

        portal_role = (form.portal_role.data or "").strip()
        if portal_role and portal_role != user.role.value:
            role_label = _("docente") if user.is_teacher else _("estudiante")
            flash(
                _("Esta cuenta es de %(role)s. Te llevamos a tu panel correspondiente.", role=role_label),
                "info",
            )

        login_user(user, remember=form.remember_me.data)
        return redirect(next_page or url_for("dashboard.index"))

    flash(_("Revisa los datos ingresados e intenta de nuevo."), "danger")
    return redirect(url_for("index", next=next_page, panel="login"))


@bp.route("/logout")
@login_required
def logout():
    logout_user()
    flash(_("Sesión cerrada correctamente."), "info")
    return redirect(url_for("index"))


@bp.route("/register", methods=["GET", "POST"])
def register():
    if current_user.is_authenticated:
        return redirect(url_for("dashboard.index"))

    next_page = request.values.get("next") or None

    if request.method == "GET":
        return redirect(url_for("index", next=next_page, panel="register"))

    form = RegistrationForm()
    if form.validate_on_submit():
        user = register_user(
            full_name=form.full_name.data,
            email=form.email.data,
            password=form.password.data,
            role=form.role.data,
        )
        login_user(user)
        flash(_("Cuenta creada correctamente. ¡Bienvenido/a a indecap-aprende!"), "success")
        return redirect(next_page or url_for("dashboard.index"))

    for field_errors in form.errors.values():
        for error in field_errors:
            flash(str(error), "danger")
    return redirect(url_for("index", next=next_page, panel="register"))


@bp.route("/forgot-password", methods=["GET", "POST"])
def forgot_password():
    if current_user.is_authenticated:
        return redirect(url_for("dashboard.index"))

    if request.method == "GET":
        return redirect(url_for("index", panel="forgot"))

    form = ForgotPasswordForm()
    if form.validate_on_submit():
        user = User.query.filter_by(email=form.email.data.lower().strip()).first()
        if user:
            reset_url = build_reset_url(user)
            # TODO (informe final / próxima iteración): sustituir este log +
            # flash temporal por un envío real de correo (Flask-Mail, SendGrid,
            # SES...). Se deja visible en pantalla solo para poder probar el
            # flujo completo mientras no hay servidor de correo configurado.
            current_app.logger.info("Enlace de recuperación para %s: %s", user.email, reset_url)
            flash(
                _("Enlace de recuperación (temporal, solo en desarrollo): %(url)s", url=reset_url),
                "info",
            )

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
