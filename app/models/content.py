import enum

from app.extensions import db


class Trastorno(db.Model):
    """
    Área de trabajo de la plataforma: cada trastorno/discapacidad que
    indecap-aprende acompaña (Dislexia, Discalculia, TDAH, TEA, TOD, etc.).
    Reemplaza al concepto original de "materia académica" — decisión de
    alcance registrada en docs/bitacoras: la plataforma se enfoca por
    completo en actividades de intervención educativa por trastorno,
    no en contenido curricular general.
    """
    __tablename__ = "trastornos"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False, unique=True)
    slug = db.Column(db.String(100), nullable=False, unique=True)
    description = db.Column(db.Text)
    icon = db.Column(db.String(50))  # nombre de ícono, ej. "brain", "ear", "eye"

    actividades = db.relationship(
        "Actividad", backref="trastorno", cascade="all, delete-orphan"
    )

    def __repr__(self) -> str:
        return f"<Trastorno {self.name}>"


class InteractiveWidgetType(str, enum.Enum):
    """
    Componentes interactivos que reemplazan (no acompañan) el texto plano
    cuando una presentación distinta del mismo texto no basta.
    """
    NONE = "none"
    NUMBER_LINE = "number_line"        # recta numérica interactiva (discalculia)
    VISUAL_BLOCKS = "visual_blocks"    # bloques contables visuales (discalculia)


class NivelApoyo(str, enum.Enum):
    """
    Resultado del check corto previo a una actividad — NO es un diagnóstico
    clínico ni mide avance del trastorno. Solo ajusta cuánta ayuda mostrar
    (pistas visibles, pasos más cortos, etc.) dentro de la actividad.
    Editable siempre por un docente; ver docs/bitacoras para la
    justificación de este límite deliberado.
    """
    BAJO = "bajo"
    MEDIO = "medio"
    ALTO = "alto"


class Actividad(db.Model):
    """
    Actividad de intervención educativa dentro de un trastorno.

    Principio de diseño (ver docs/bitacoras): una sola actividad, múltiples
    formas de representación (texto, audio vía Web Speech API, imagen de
    apoyo, video LSC), adaptada en el frontend según el AccessibilityProfile
    del estudiante y el nivel de apoyo indicado por el check previo.
    """
    __tablename__ = "actividades"

    id = db.Column(db.Integer, primary_key=True)
    trastorno_id = db.Column(db.Integer, db.ForeignKey("trastornos.id"), nullable=False)
    title = db.Column(db.String(200), nullable=False)
    content_body = db.Column(db.Text)
    order_index = db.Column(db.Integer, default=0)
    estimated_minutes = db.Column(db.Integer, default=20)  # respeta el límite de 20-30 min

    support_image_url = db.Column(db.String(500), nullable=True)
    lsc_video_url = db.Column(db.String(500), nullable=True)

    interactive_widget = db.Column(
        db.Enum(InteractiveWidgetType), default=InteractiveWidgetType.NONE
    )

    def __repr__(self) -> str:
        return f"<Actividad {self.title}>"


class CheckPrevio(db.Model):
    """
    Check corto (3-5 preguntas) que un estudiante responde antes de una
    actividad, para calibrar cuánta ayuda mostrar. Se guarda el resultado
    por estudiante y trastorno — no por actividad individual — porque el
    nivel de apoyo aplica a todo el trastorno, no cambia actividad a
    actividad.
    """
    __tablename__ = "checks_previos"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    trastorno_id = db.Column(db.Integer, db.ForeignKey("trastornos.id"), nullable=False)
    nivel_apoyo = db.Column(db.Enum(NivelApoyo), default=NivelApoyo.MEDIO)
    respondido_en = db.Column(db.DateTime, server_default=db.func.now())

    __table_args__ = (
        db.UniqueConstraint("user_id", "trastorno_id", name="uq_user_trastorno_check"),
    )

    def __repr__(self) -> str:
        return f"<CheckPrevio user_id={self.user_id} trastorno_id={self.trastorno_id}>"
