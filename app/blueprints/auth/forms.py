from flask_babel import gettext as _, lazy_gettext as _l
from flask_wtf import FlaskForm
from wtforms import (
    StringField,
    PasswordField,
    BooleanField,
    SubmitField,
    RadioField,
    HiddenField,
)
from wtforms.validators import DataRequired, Email, EqualTo, Length, ValidationError

from app.models.user import User


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
    # No se valida como "requerido": es solo una pista de UX (qué botón
    # de acceso usó la persona), el rol real siempre viene de la BD.
    portal_role = HiddenField(_l("Tipo de acceso"))
    submit = SubmitField(_l("Iniciar sesión"))


class RegistrationForm(FlaskForm):
    full_name = StringField(
        _l("Nombre completo"), validators=[DataRequired(), Length(min=3, max=150)]
    )
    email = StringField(
        _l("Correo electrónico"),
        validators=[DataRequired(), Email()],
        filters=[_strip_filter],
    )
    role = RadioField(
        _l("Tipo de cuenta"),
        choices=[("estudiante", _l("Estudiante")), ("docente", _l("Docente"))],
        default="estudiante",
        validators=[DataRequired()],
    )
    password = PasswordField(
        _l("Contraseña"),
        validators=[DataRequired(), Length(min=8, message=_l("Usa al menos 8 caracteres."))],
    )
    confirm_password = PasswordField(
        _l("Confirmar contraseña"),
        validators=[DataRequired(), EqualTo("password", message=_l("Las contraseñas no coinciden."))],
    )
    submit = SubmitField(_l("Crear cuenta"))

    def validate_email(self, field):
        if User.query.filter_by(email=field.data.lower().strip()).first():
            raise ValidationError(_("Ya existe una cuenta con ese correo."))


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
