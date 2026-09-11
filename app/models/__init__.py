"""
Importar todos los modelos aquí para que Flask-Migrate/Alembic los detecte
al generar migraciones (flask db migrate).
"""
from app.models.user import User, RoleEnum  # noqa: F401
from app.models.accessibility import (  # noqa: F401
    AccessibilityProfile,
    ContrastMode,
    FontPreference,
    CognitiveSupport,
    AutonomyLevel,
)
from app.models.progress import Progress  # noqa: F401
from app.models.content import (  # noqa: F401
    Trastorno,
    Actividad,
    InteractiveWidgetType,
    CheckPrevio,
    NivelApoyo,
)

from app.models.group import Grupo
from app.models.assignment import TrastornoAsignado
from app.models.student_profile import StudentProfile
from app.models.teacher_profile import TeacherProfile
from app.models.notification import Notification
from app.models.assigned_session import SesionAsignada