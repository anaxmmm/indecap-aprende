from flask_babel import lazy_gettext as _l
from flask_wtf import FlaskForm
from wtforms import StringField, TextAreaField, IntegerField, SelectField, SubmitField
from wtforms.validators import DataRequired, Length, NumberRange, Optional, URL

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
