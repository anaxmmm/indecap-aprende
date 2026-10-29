"""Lógica de negocio del blueprint admin: CRUD de trastornos, actividades,
gestión de usuarios y estadísticas."""

from flask_babel import gettext as _
from sqlalchemy.exc import IntegrityError

from app.extensions import db
from app.utils.fechas import utc_now
from app.models.content import Trastorno, Actividad
from app.models.group import Grupo
from app.models.user import User, RoleEnum


# --- Trastornos ---

def list_trastornos():
    return Trastorno.query.order_by(Trastorno.name).all()


def get_trastorno_or_404(trastorno_id: int) -> Trastorno:
    return Trastorno.query.get_or_404(trastorno_id)


def create_trastorno(data: dict) -> Trastorno:
    trastorno = Trastorno(**data)
    db.session.add(trastorno)
    db.session.commit()
    return trastorno


def update_trastorno(trastorno: Trastorno, data: dict) -> Trastorno:
    for key, value in data.items():
        setattr(trastorno, key, value)
    db.session.commit()
    return trastorno


def delete_trastorno(trastorno: Trastorno) -> None:
    db.session.delete(trastorno)
    db.session.commit()


# --- Actividades ---

def list_actividades(trastorno_id: int):
    return Actividad.query.filter_by(trastorno_id=trastorno_id).order_by(Actividad.order_index).all()


def get_actividad_or_404(actividad_id: int) -> Actividad:
    return Actividad.query.get_or_404(actividad_id)


def create_actividad(data: dict) -> Actividad:
    actividad = Actividad(**data)
    db.session.add(actividad)
    db.session.commit()
    return actividad


def update_actividad(actividad: Actividad, data: dict) -> Actividad:
    for key, value in data.items():
        setattr(actividad, key, value)
    db.session.commit()
    return actividad


def delete_actividad(actividad: Actividad) -> None:
    db.session.delete(actividad)
    db.session.commit()


# --- Usuarios ---
#
# Jerarquía: el administrador principal crea administradores; los
# administradores crean docentes y estudiantes; los docentes crean
# estudiantes desde «Registro de estudiantes». Nadie borra cuentas: se
# archivan y su información queda guardada.

def list_accounts(archived: bool = False, role: str = ""):
    query = User.query
    query = query.filter(User.archived_at.isnot(None)) if archived else query.filter(User.archived_at.is_(None))
    if role in {r.value for r in RoleEnum}:
        query = query.filter(User.role == RoleEnum(role))
    return query.order_by(User.full_name.asc()).all()


def list_all_groups():
    return Grupo.query.order_by(Grupo.name.asc()).all()


def create_account(actor: User, full_name: str, email: str, password: str, role: str, group_id=None,
                   data_consent: bool = False) -> User:
    try:
        role_enum = RoleEnum(role)
    except ValueError:
        raise ValueError(_("Ese tipo de cuenta no existe."))
    if role_enum not in actor.creatable_roles():
        raise ValueError(_("No tienes permiso para crear ese tipo de cuenta."))

    email = email.lower().strip()
    existing = User.query.filter_by(email=email).first()
    if existing is not None:
        if existing.is_archived:
            raise ValueError(_("Ese correo pertenece a una cuenta archivada. Puedes restaurarla desde «Archivadas»."))
        raise ValueError(_("Ya existe una cuenta con ese correo."))

    if role_enum == RoleEnum.STUDENT and not data_consent:
        raise ValueError(_("Confirma la autorización de tratamiento de datos para registrar al estudiante."))

    grupo = None
    if role_enum == RoleEnum.STUDENT and group_id:
        grupo = db.session.get(Grupo, group_id)
        if grupo is None:
            raise ValueError(_("El grupo elegido no existe."))

    user = User(full_name=full_name.strip(), email=email, role=role_enum, created_by_id=actor.id)
    if role_enum == RoleEnum.STUDENT:
        user.data_consent_at = utc_now()
        user.data_consent_by_id = actor.id
    user.set_password(password)
    db.session.add(user)
    if grupo is not None:
        grupo.estudiantes.append(user)
    try:
        db.session.commit()
    except IntegrityError:
        db.session.rollback()
        raise ValueError(_("Ya existe una cuenta con ese correo."))
    return user


def archive_account(actor: User, user_id: int) -> User:
    """Quita el acceso a una cuenta sin borrar nada de su información."""
    user = db.session.get(User, user_id)
    if user is None or user.is_archived or not actor.can_manage(user):
        raise ValueError(_("No puedes eliminar esa cuenta."))
    user.is_active_account = False
    user.archived_at = utc_now()
    user.archived_by_id = actor.id
    db.session.commit()
    return user


def restore_account(actor: User, user_id: int, group_id=None) -> User:
    user = db.session.get(User, user_id)
    if user is None or not user.is_archived or not actor.is_admin or not actor.can_manage(user):
        raise ValueError(_("No puedes restaurar esa cuenta."))
    if group_id and user.is_student:
        grupo = db.session.get(Grupo, group_id)
        if grupo is None:
            raise ValueError(_("El grupo elegido no existe."))
        for anterior in list(user.grupos):
            anterior.estudiantes.remove(user)
        grupo.estudiantes.append(user)
    user.is_active_account = True
    user.archived_at = None
    user.archived_by_id = None
    db.session.commit()
    return user


# --- Datos personales de estudiantes (Ley 1581 de 2012) ---

def _student_for_data(actor: User, user_id: int) -> User:
    user = db.session.get(User, user_id)
    if user is None or not user.is_student or not actor.is_admin or not actor.can_manage(user):
        raise ValueError(_("No puedes gestionar los datos de esa cuenta."))
    return user


def _iso(value):
    from app.utils.fechas import to_local

    if value is None:
        return None
    if hasattr(value, "hour"):
        return to_local(value).strftime("%Y-%m-%d %H:%M")
    return value.isoformat()


def export_student_data(actor: User, user_id: int) -> dict:
    """Todo lo que la plataforma guarda de un estudiante, para entregarlo
    cuando él o su acudiente lo soliciten."""
    from app.blueprints.games.registry import GAMES
    from app.models.assigned_session import SesionAsignada
    from app.models.game_session import GameSession

    user = _student_for_data(actor, user_id)
    perfil = user.student_profile
    accesibilidad = user.accessibility_profile

    partidas = (
        GameSession.query.filter_by(user_id=user.id).order_by(GameSession.created_at.asc()).all()
    )
    sesiones = SesionAsignada.query.filter_by(student_id=user.id).all()

    return {
        "generado": _iso(utc_now()),
        "plataforma": "indecap-aprende",
        "cuenta": {
            "nombre": user.full_name,
            "correo": user.email,
            "rol": user.role.value,
            "creada": _iso(user.created_at),
            "activa": bool(user.is_active_account),
            "archivada": _iso(user.archived_at),
            "autorizacion_datos": _iso(user.data_consent_at),
        },
        "perfil": {
            "alias": perfil.alias,
            "correo_acudiente": perfil.tutor_email,
            "genero": perfil.gender.value if perfil.gender else None,
            "fecha_nacimiento": _iso(perfil.birth_date),
            "dificultades_aprendizaje": bool(perfil.has_learning_difficulties),
        } if perfil else None,
        "grupos": [{"grupo": g.name, "docente": g.teacher.full_name} for g in user.grupos],
        "condiciones_asignadas": [
            {"condicion": a.trastorno.name, "asignada": _iso(getattr(a, "assigned_at", None))}
            for a in user.trastornos_asignados
        ],
        "accesibilidad": {
            "contraste": accesibilidad.contrast_mode.value if accesibilidad.contrast_mode else None,
            "fuente": accesibilidad.font_preference.value if accesibilidad.font_preference else None,
            "tamano_texto": accesibilidad.text_size_percent,
            "interlineado": accesibilidad.line_spacing_percent,
            "reducir_movimiento": bool(accesibilidad.reduce_motion),
            "audio": accesibilidad.audio_feedback,
        } if accesibilidad else None,
        "partidas": [
            {
                "fecha": _iso(p.created_at),
                "juego": str(GAMES[p.game_slug]["name"]) if p.game_slug in GAMES else p.game_slug,
                "actividad": p.level,
                "puntaje": p.score,
                "tiempo_segundos": p.time_spent,
                "nivel_apoyo": p.support_level,
                "completada": bool(p.completed),
                "como_se_sintio": p.feeling,
                "errores": p.errors,
                "ayudas_accesibilidad": p.accessibility_settings_used,
            }
            for p in partidas
        ],
        "sesiones_asignadas": [
            {
                "actividad": s.actividad.title if s.actividad else None,
                "desde": _iso(s.start_date),
                "hasta": _iso(s.end_date),
                "estado": s.status.value if s.status else None,
                "notas": s.clinical_notes,
            }
            for s in sesiones
        ],
    }


def purge_student(actor: User, user_id: int, confirmation: str) -> str:
    """Borra definitivamente una cuenta de estudiante archivada y todo lo
    que la plataforma guarda de ella. No se puede deshacer. Devuelve el
    nombre del estudiante borrado."""
    from app.models.assigned_session import SesionAsignada
    from app.models.assignment import TrastornoAsignado
    from app.models.content import CheckPrevio
    from app.models.game_session import GameSession
    from app.models.login_throttle import LoginThrottle
    from app.models.notification import Notification

    user = _student_for_data(actor, user_id)
    if not user.is_archived:
        raise ValueError(_("Primero elimina la cuenta; el borrado definitivo se hace desde «Archivadas»."))
    if (confirmation or "").strip().lower() != user.email.lower():
        raise ValueError(_("El correo escrito no coincide. No se borró nada."))

    nombre = user.full_name
    Notification.query.filter(
        (Notification.student_id == user.id) | (Notification.recipient_id == user.id)
    ).delete(synchronize_session=False)
    GameSession.query.filter_by(user_id=user.id).delete(synchronize_session=False)
    SesionAsignada.query.filter_by(student_id=user.id).delete(synchronize_session=False)
    TrastornoAsignado.query.filter_by(student_id=user.id).delete(synchronize_session=False)
    CheckPrevio.query.filter_by(user_id=user.id).delete(synchronize_session=False)
    LoginThrottle.query.filter(
        LoginThrottle.key.in_(["login:" + user.email, "reset:" + user.email])
    ).delete(synchronize_session=False)
    for grupo in list(user.grupos):
        grupo.estudiantes.remove(user)
    db.session.delete(user)
    db.session.commit()
    return nombre
