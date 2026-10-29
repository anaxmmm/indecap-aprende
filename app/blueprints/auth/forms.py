from flask_babel import lazy_gettext as _l
from flask_wtf import FlaskForm
from wtforms import (
    StringField,
    PasswordField,
    BooleanField,
    SubmitField,
    HiddenField,
)
from wtforms.validators import DataRequired, Email, EqualTo, Length


def _strip_filter(value):
    """Quita espacios accidentales (autocompletado, copiar/pegar) antes de
    validar el formato del correo. Sin esto, un espacio invisible al
    inicio/fin hace que Email() rechace correos por lo demás válidos."""
    return value.strip() if value else value


class LoginForm(FlaskForm):
    email = StringField(
        _l("Correo electrónico"),
        validators=[DataRequired(), Email()],
        filters=[_strip_filter],
    )
    password = PasswordField(_l("Contraseña"), validators=[DataRequired()])
    remember_me = BooleanField(_l("Recordarme"))
    # Acceso elegido («estudiante» o «docente»). El servidor lo compara con
    # el rol guardado en la base de datos antes de abrir la sesión.
    portal_role = HiddenField(_l("Tipo de acceso"), default="estudiante")
    submit = SubmitField(_l("Iniciar sesión"))


class ForgotPasswordForm(FlaskForm):
    email = StringField(
        _l("Correo electrónico"),
        validators=[DataRequired(), Email()],
        filters=[_strip_filter],
    )
    submit = SubmitField(_l("Enviar enlace de recuperación"))


class ResetPasswordForm(FlaskForm):
    password = PasswordField(
        _l("Nueva contraseña"),
        validators=[DataRequired(), Length(min=8, message=_l("Usa al menos 8 caracteres."))],
    )
    confirm_password = PasswordField(
        _l("Confirmar nueva contraseña"),
        validators=[DataRequired(), EqualTo("password", message=_l("Las contraseñas no coinciden."))],
    )
    submit = SubmitField(_l("Restablecer contraseña"))
