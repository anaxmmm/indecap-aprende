"""Avisos para docentes y estudiantes (por ejemplo, cuando un estudiante
supera una actividad de un juego).

Cada aviso guarda su tipo y sus datos, no solo la frase: así se muestra en
el idioma de quien lo lee. Los avisos antiguos, que solo tienen la frase en
español, se muestran tal como se guardaron.
"""
import json

from flask_babel import gettext, lazy_gettext as _l

from app.extensions import db
from app.utils.fechas import utc_now

TEMPLATES = {
    "level_passed": _l("%(student)s superó la actividad %(activity)s del nivel %(level)s (%(level_name)s) en «%(game)s»."),
    "activity_assigned": _l("Tu docente te asignó una nueva actividad: %(title)s."),
}


class Notification(db.Model):
    __tablename__ = "notifications"

    id = db.Column(db.Integer, primary_key=True)
    recipient_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    student_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=True)
    message = db.Column(db.String(255), nullable=False)
    kind = db.Column(db.String(40), nullable=True)
    params_json = db.Column(db.Text, nullable=True)
    is_read = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=utc_now)

    recipient = db.relationship("User", foreign_keys=[recipient_id])
    student = db.relationship("User", foreign_keys=[student_id])

    @classmethod
    def build(cls, kind: str, recipient_id: int, student_id=None, **params) -> "Notification":
        """Crea el aviso con su tipo y sus datos; la frase en español queda
        también en `message` como respaldo."""
        notification = cls(
            recipient_id=recipient_id,
            student_id=student_id,
            kind=kind,
            params_json=json.dumps(params, ensure_ascii=False),
        )
        from flask_babel import force_locale
        with force_locale("es"):
            notification.message = notification.text()[:255]
        return notification

    def text(self) -> str:
        """La frase del aviso en el idioma activo."""
        template = TEMPLATES.get(self.kind or "")
        if template is None:
            return gettext(self.message) if self.message else ""
        try:
            params = json.loads(self.params_json or "{}")
        except ValueError:
            return self.message or ""
        if self.kind == "level_passed":
            from app.blueprints.games.registry import get_game, level_name
            game = get_game(params.get("game_slug", ""))
            params["game"] = str(game["name"]) if game else params.get("game_slug", "")
            params["level_name"] = str(level_name(params.get("level", 1)))
        try:
            return str(template) % params
        except (KeyError, TypeError, ValueError):
            return self.message or ""

    def __repr__(self) -> str:
        return f"<Notification recipient_id={self.recipient_id} read={self.is_read}>"
