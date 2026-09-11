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
        "Correo electrónico",
        validators=[DataRequired(), Email()],
        filters=[_strip_filter],
    )
    password = PasswordField("Contraseña", validators=[DataRequired()])
    remember_me = BooleanField("Recordarme")
    # No se valida como "requerido": es solo una pista de UX (qué botón
    # de acceso usó la persona), el rol real siempre viene de la BD.
    portal_role = HiddenField("Tipo de acceso")
    submit = SubmitField("Iniciar sesión")


class RegistrationForm(FlaskForm):
    full_name = StringField(
        "Nombre completo", validators=[DataRequired(), Length(min=3, max=150)]
    )
    email = StringField(
        "Correo electrónico",
        validators=[DataRequired(), Email()],
        filters=[_strip_filter],
    )
    role = RadioField(
        "Tipo de cuenta",
        choices=[("estudiante", "Estudiante"), ("docente", "Docente")],
        default="estudiante",
        validators=[DataRequired()],
    )
    password = PasswordField(
        "Contraseña",
        validators=[DataRequired(), Length(min=8, message="Usa al menos 8 caracteres.")],
    )
    confirm_password = PasswordField(
        "Confirmar contraseña",
        validators=[DataRequired(), EqualTo("password", message="Las contraseñas no coinciden.")],
    )
    submit = SubmitField("Crear cuenta")

    def validate_email(self, field):
        if User.query.filter_by(email=field.data.lower().strip()).first():
            raise ValidationError("Ya existe una cuenta con ese correo.")


class ForgotPasswordForm(FlaskForm):
    email = StringField(
        "Correo electrónico",
        validators=[DataRequired(), Email()],
        filters=[_strip_filter],
    )
    submit = SubmitField("Enviar enlace de recuperación")


class ResetPasswordForm(FlaskForm):
    password = PasswordField(
        "Nueva contraseña",
        validators=[DataRequired(), Length(min=8, message="Usa al menos 8 caracteres.")],
    )
    confirm_password = PasswordField(
        "Confirmar nueva contraseña",
        validators=[DataRequired(), EqualTo("password", message="Las contraseñas no coinciden.")],
    )
    submit = SubmitField("Restablecer contraseña")