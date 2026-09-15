"""Formularios (Flask-WTF) del blueprint dashboard."""
from flask_wtf import FlaskForm
from wtforms import (
    StringField,
    PasswordField,
    SelectField,
    SelectMultipleField,
    BooleanField,
    DateField,
    SubmitField,
)
from wtforms.validators import DataRequired, Email, Length, Optional, ValidationError

from app.models.user import User
from app.models.student_profile import GeneroEnum


class GroupForm(FlaskForm):
    name = StringField(
        "Nombre del grupo", validators=[DataRequired(), Length(min=2, max=100)]
    )
    submit_group = SubmitField("Crear grupo")


class AddStudentForm(FlaskForm):
    first_name = StringField("Nombres", validators=[DataRequired(), Length(max=100)])
    last_name = StringField("Apellidos", validators=[DataRequired(), Length(max=100)])
    email = StringField(
        "Correo electrónico", validators=[DataRequired(), Email(), Length(max=150)]
    )
    password = PasswordField(
        "Contraseña", validators=[DataRequired(), Length(min=6, max=128)]
    )
    group_id = SelectField("Grupo", coerce=int, validators=[DataRequired()])
    alias = StringField("Alias / Apodo", validators=[Optional(), Length(max=100)])
    tutor_email = StringField(
        "Correo del acudiente", validators=[Optional(), Email(), Length(max=150)]
    )
    gender = SelectField("Género", choices=[], validators=[Optional()])
    birth_date = DateField(
        "Fecha de nacimiento", validators=[Optional()], format="%Y-%m-%d"
    )
    has_learning_difficulties = BooleanField("Presenta dificultades de aprendizaje")
    trastornos = SelectMultipleField(
        "Trastornos asignados", coerce=int, validators=[Optional()]
    )
    submit_student = SubmitField("Añadir estudiante")

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        # Las opciones se generan a partir del Enum real, así nunca
        # se desincronizan si agregas/quitas géneros en el modelo.
        self.gender.choices = [("", "Seleccionar...")] + [
            (g.value, g.value.replace("_", " ").capitalize()) for g in GeneroEnum
        ]


class AssignTrastornosForm(FlaskForm):
    trastornos = SelectMultipleField(
        "Trastornos asignados", coerce=int, validators=[Optional()]
    )
    submit = SubmitField("Guardar asignación")


class ProfileForm(FlaskForm):
    full_name = StringField(
        "Nombre completo", validators=[DataRequired(), Length(max=150)]
    )
    email = StringField(
        "Correo electrónico", validators=[DataRequired(), Email(), Length(max=150)]
    )
    area = StringField("Área / Especialidad", validators=[Optional(), Length(max=150)])
    new_password = PasswordField(
        "Nueva contraseña (opcional)",
        validators=[Optional(), Length(min=6, max=128)],
    )
    confirm_password = PasswordField(
        "Confirmar nueva contraseña", validators=[Optional()]
    )
    submit = SubmitField("Guardar cambios")

    def __init__(self, current_user_id=None, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.current_user_id = current_user_id

    def validate_email(self, field):
        existente = User.query.filter_by(email=field.data.lower().strip()).first()
        if existente is not None and existente.id != self.current_user_id:
            raise ValidationError("Ya existe otra cuenta con ese correo electrónico.")

    def validate_confirm_password(self, field):
        # Validación cruzada manual: si se escribió una nueva contraseña,
        # exigimos confirmación exacta. Si ambos campos quedan vacíos, no
        # se intenta cambiar la contraseña (queda la actual).
        if self.new_password.data:
            if not field.data:
                raise ValidationError("Confirma la nueva contraseña.")
            if field.data != self.new_password.data:
                raise ValidationError("Las contraseñas no coinciden.")


class AssignSessionForm(FlaskForm):
    student_id = SelectField("Estudiante", coerce=int, validators=[DataRequired()])
    start_date = DateField(
        "Fecha de inicio", validators=[DataRequired()], format="%Y-%m-%d"
    )
    end_date = DateField(
        "Fecha de fin", validators=[DataRequired()], format="%Y-%m-%d"
    )
    submit_assign = SubmitField("Asignar sesión")