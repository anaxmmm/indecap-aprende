import enum

from app.extensions import db


class ContrastMode(str, enum.Enum):
    NORMAL = "normal"
    ALTO_CONTRASTE = "alto_contraste"


class FontPreference(str, enum.Enum):
    ESTANDAR = "estandar"
    LEGIBLE_DISLEXIA = "legible_dislexia"  # ej. Atkinson Hyperlegible


class CognitiveSupport(str, enum.Enum):
    NINGUNO = "ninguno"
    TEA = "tea"
    TDAH = "tdah"
    DISCALCULIA = "discalculia"
    TOD = "trastorno_opositor_desafiante"


class AutonomyLevel(int, enum.Enum):
    GUIADO = 1       # ayudas/pistas siempre visibles
    PARCIAL = 2       # ayudas reducidas
    INDEPENDIENTE = 3  # sin ayudas por defecto


class AccessibilityProfile(db.Model):
    """
    Perfil de accesibilidad de un estudiante. Se crea junto con el usuario
    (normalmente configurado por un docente o el área de psicología en el
    primer ingreso), y sus reglas de negocio se documentan en
    docs/bitacoras/Bitacora_indecap-aprende.docx, sección 6.
    """
    __tablename__ = "accessibility_profiles"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False, unique=True)

    contrast_mode = db.Column(db.Enum(ContrastMode), default=ContrastMode.NORMAL)
    font_preference = db.Column(db.Enum(FontPreference), default=FontPreference.ESTANDAR)
    text_size_percent = db.Column(db.Integer, default=100)  # 100 = tamaño base
    line_spacing_percent = db.Column(db.Integer, default=100)
    reduce_motion = db.Column(db.Boolean, default=False)
    audio_feedback = db.Column(db.Boolean, default=True)
    uses_lsc = db.Column(db.Boolean, default=False)
    cognitive_support = db.Column(
        db.Enum(CognitiveSupport), default=CognitiveSupport.NINGUNO
    )
    autonomy_level = db.Column(db.Integer, default=AutonomyLevel.GUIADO.value)

    def __repr__(self) -> str:
        return f"<AccessibilityProfile user_id={self.user_id}>"
