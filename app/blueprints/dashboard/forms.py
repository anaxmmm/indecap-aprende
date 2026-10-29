"""Formularios (Flask-WTF) del blueprint dashboard."""
from flask_babel import gettext as _, lazy_gettext as _l
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


def _opciones_genero():
    # Las opciones se generan a partir del Enum real, así nunca
    # se desincronizan si agregas/quitas géneros en el modelo.
    # El valor guardado sigue siendo el del Enum (nina/nino/otro) para no
    # tocar la base de datos; solo cambia la etiqueta que ve el docente.
    # Cualquier valor nuevo del modelo se sigue mostrando con el formato anterior.
    etiquetas = {
        "nina": _("Femenino"),
        "nino": _("Masculino"),
        "otro": _("Otro"),
    }
    return [("", _("Seleccionar..."))] + [
        (g.value, etiquetas.get(g.value, g.value.replace("_", " ").capitalize()))
        for g in GeneroEnum
    ]


class GroupForm(FlaskForm):
    name = StringField(
        _l("Nombre del grupo"), validators=[DataRequired(), Length(min=2, max=100)]
    )
    submit_group = SubmitField(_l("Crear grupo"))


class AddStudentForm(FlaskForm):
    first_name = StringField(_l("Nombres"), validators=[DataRequired(), Length(max=100)])
    last_name = StringField(_l("Apellidos"), validators=[DataRequired(), Length(max=100)])
    email = StringField(
        _l("Correo electrónico"), validators=[DataRequired(), Email(), Length(max=150)]
    )
    password = PasswordField(
        _l("Contraseña"), validators=[DataRequired(), Length(min=8, max=128, message=_l("Usa al menos 8 caracteres."))]
    )
    group_id = SelectField(_l("Grupo"), coerce=int, validators=[DataRequired()])
    gender = SelectField(_l("Género"), choices=[], validators=[Optional()])
    birth_date = DateField(
        _l("Fecha de nacimiento"), validators=[Optional()], format="%Y-%m-%d"
    )
    has_learning_difficulties = BooleanField(_l("Presenta dificultades de aprendizaje"))
    trastornos = SelectMultipleField(
        _l("Trastornos asignados"), coerce=int, validators=[Optional()]
    )
    data_consent = BooleanField(
        _l("El estudiante, o su acudiente si es menor de edad, autorizó el tratamiento de sus datos según la política de tratamiento de datos."),
        validators=[DataRequired(message=_l("Confirma la autorización de tratamiento de datos para registrar al estudiante."))],
    )
    submit_student = SubmitField(_l("Añadir estudiante"))

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.gender.choices = _opciones_genero()


class EditStudentForm(FlaskForm):
    full_name = StringField(
        _l("Nombre completo"), validators=[DataRequired(), Length(max=150)]
    )
    email = StringField(
        _l("Correo electrónico"), validators=[DataRequired(), Email(), Length(max=150)]
    )
    gender = SelectField(_l("Género"), choices=[], validators=[Optional()])
    birth_date = DateField(
        _l("Fecha de nacimiento"), validators=[Optional()], format="%Y-%m-%d"
    )
    has_learning_difficulties = BooleanField(_l("Presenta dificultades de aprendizaje"))
    trastornos = SelectMultipleField(
        _l("Trastornos asignados"), coerce=int, validators=[Optional()]
    )
    data_consent = BooleanField(_l("Registrar la autorización de tratamiento de datos"))
    submit_edit = SubmitField(_l("Guardar cambios"))

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.gender.choices = _opciones_genero()


class AssignTrastornosForm(FlaskForm):
    trastornos = SelectMultipleField(
        _l("Trastornos asignados"), coerce=int, validators=[Optional()]
    )
    submit = SubmitField(_l("Guardar asignación"))


class ProfileForm(FlaskForm):
    full_name = StringField(
        _l("Nombre completo"), validators=[DataRequired(), Length(max=150)]
    )
    email = StringField(
        _l("Correo electrónico"), validators=[DataRequired(), Email(), Length(max=150)]
    )
    area = StringField(_l("Área / Especialidad"), validators=[Optional(), Length(max=150)])
    new_password = PasswordField(
        _l("Nueva contraseña (opcional)"),
        validators=[Optional(), Length(min=8, max=128, message=_l("Usa al menos 8 caracteres."))],
    )
    confirm_password = PasswordField(
        _l("Confirmar nueva contraseña"), validators=[Optional()]
    )
    submit = SubmitField(_l("Guardar cambios"))

    def __init__(self, current_user_id=None, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.current_user_id = current_user_id

    def validate_email(self, field):
        existente = User.query.filter_by(email=field.data.lower().strip()).first()
        if existente is not None and existente.id != self.current_user_id:
            raise ValidationError(_("Ya existe otra cuenta con ese correo electrónico."))

    def validate_confirm_password(self, field):
        # Validación cruzada manual: si se escribió una nueva contraseña,
        # exigimos confirmación exacta. Si ambos campos quedan vacíos, no
        # se intenta cambiar la contraseña (queda la actual).
        if self.new_password.data:
            if not field.data:
                raise ValidationError(_("Confirma la nueva contraseña."))
            if field.data != self.new_password.data:
                raise ValidationError(_("Las contraseñas no coinciden."))


class AssignSessionForm(FlaskForm):
    student_id = SelectField(_l("Estudiante"), coerce=int, validators=[DataRequired()])
    start_date = DateField(
        _l("Fecha de inicio"), validators=[DataRequired()], format="%Y-%m-%d"
    )
    end_date = DateField(
        _l("Fecha de fin"), validators=[DataRequired()], format="%Y-%m-%d"
    )
    submit_assign = SubmitField(_l("Asignar sesión"))
