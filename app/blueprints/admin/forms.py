from flask_babel import lazy_gettext as _l
from flask_wtf import FlaskForm
from wtforms import BooleanField, StringField, TextAreaField, IntegerField, SelectField, SubmitField, PasswordField
from wtforms.validators import DataRequired, Email, Length, NumberRange, Optional, URL

from app.models.content import InteractiveWidgetType


class TrastornoForm(FlaskForm):
    name = StringField(_l("Nombre (ej. Dislexia, TDAH, Discalculia)"), validators=[DataRequired(), Length(max=100)])
    slug = StringField(
        _l("Slug (identificador para URL, sin espacios ni tildes)"),
        validators=[DataRequired(), Length(max=100)],
    )
    description = TextAreaField(_l("Descripción"), validators=[Optional()])
    icon = StringField(_l("Ícono (ej. brain, ear, eye)"), validators=[Optional(), Length(max=50)])
    submit = SubmitField(_l("Guardar"))


class ActividadForm(FlaskForm):
    trastorno_id = SelectField(_l("Trastorno"), coerce=int, validators=[DataRequired()])
    title = StringField(_l("Título de la actividad"), validators=[DataRequired(), Length(max=200)])
    content_body = TextAreaField(
        _l("Contenido (se permite HTML simple: <p>, <strong>, <em>)"),
        validators=[DataRequired()],
    )
    order_index = IntegerField(_l("Orden dentro del trastorno"), default=0, validators=[Optional()])
    estimated_minutes = IntegerField(
        _l("Minutos estimados (20-30 recomendado)"),
        default=20,
        validators=[NumberRange(min=5, max=60)],
    )
    support_image_url = StringField(_l("URL de imagen de apoyo (opcional)"), validators=[Optional(), URL()])
    lsc_video_url = StringField(_l("URL de video en LSC (opcional)"), validators=[Optional(), URL()])
    interactive_widget = SelectField(
        _l("Componente interactivo"),
        choices=[(w.value, w.name.replace("_", " ").title()) for w in InteractiveWidgetType],
        validators=[DataRequired()],
    )
    submit = SubmitField(_l("Guardar"))


class AccountForm(FlaskForm):
    full_name = StringField(_l("Nombre completo"), validators=[DataRequired(), Length(min=3, max=150)])
    email = StringField(_l("Correo electrónico"), validators=[DataRequired(), Email(), Length(max=150)],
                        filters=[lambda v: v.strip() if v else v])
    role = SelectField(_l("Tipo de cuenta"), validators=[DataRequired()])
    group_id = SelectField(_l("Grupo (solo estudiantes)"), coerce=int, validators=[Optional()])
    password = PasswordField(
        _l("Contraseña temporal"),
        validators=[DataRequired(), Length(min=8, message=_l("Usa al menos 8 caracteres."))],
    )
    data_consent = BooleanField(
        _l("El estudiante, o su acudiente si es menor de edad, autorizó el tratamiento de sus datos según la política de tratamiento de datos.")
    )
    submit = SubmitField(_l("Crear cuenta"))
