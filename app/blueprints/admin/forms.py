from flask_wtf import FlaskForm
from wtforms import StringField, TextAreaField, IntegerField, SelectField, SubmitField
from wtforms.validators import DataRequired, Length, NumberRange, Optional, URL

from app.models.content import InteractiveWidgetType


class TrastornoForm(FlaskForm):
    name = StringField("Nombre (ej. Dislexia, TDAH, Discalculia)", validators=[DataRequired(), Length(max=100)])
    slug = StringField(
        "Slug (identificador para URL, sin espacios ni tildes)",
        validators=[DataRequired(), Length(max=100)],
    )
    description = TextAreaField("Descripción", validators=[Optional()])
    icon = StringField("Ícono (ej. brain, ear, eye)", validators=[Optional(), Length(max=50)])
    submit = SubmitField("Guardar")


class ActividadForm(FlaskForm):
    trastorno_id = SelectField("Trastorno", coerce=int, validators=[DataRequired()])
    title = StringField("Título de la actividad", validators=[DataRequired(), Length(max=200)])
    content_body = TextAreaField(
        "Contenido (se permite HTML simple: <p>, <strong>, <em>)",
        validators=[DataRequired()],
    )
    order_index = IntegerField("Orden dentro del trastorno", default=0, validators=[Optional()])
    estimated_minutes = IntegerField(
        "Minutos estimados (20-30 recomendado)",
        default=20,
        validators=[NumberRange(min=5, max=60)],
    )
    support_image_url = StringField("URL de imagen de apoyo (opcional)", validators=[Optional(), URL()])
    lsc_video_url = StringField("URL de video en LSC (opcional)", validators=[Optional(), URL()])
    interactive_widget = SelectField(
        "Componente interactivo",
        choices=[(w.value, w.name.replace("_", " ").title()) for w in InteractiveWidgetType],
        validators=[DataRequired()],
    )
    submit = SubmitField("Guardar")
