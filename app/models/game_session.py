import json
from datetime import datetime

from app.extensions import db


class GameSession(db.Model):
    """
    Registro de una partida (un nivel de un juego) realizada por un estudiante.

    Se guarda como JSON serializado en columnas de texto para no depender de
    soporte nativo de JSON: el proyecto corre hoy en SQLite (desarrollo) y debe
    poder migrar a SQL Server en el instituto sin cambiar el modelo.
    Ver docs/bitacoras/Bitacora_indecap-aprende.docx.
    """
    __tablename__ = "game_sessions"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False, index=True)
    trastorno_id = db.Column(db.Integer, db.ForeignKey("trastornos.id"), nullable=True)

    game_slug = db.Column(db.String(64), nullable=False, index=True)
    level = db.Column(db.Integer, default=1, nullable=False)

    score = db.Column(db.Integer, default=0)          # 0-100
    time_spent = db.Column(db.Integer, default=0)      # segundos
    support_level = db.Column(db.Integer, default=1)   # 1 guiado, 2 parcial, 3 independiente
    completed = db.Column(db.Boolean, default=True)

    errors_json = db.Column(db.Text, default="[]")
    accessibility_json = db.Column(db.Text, default="{}")

    created_at = db.Column(db.DateTime, default=datetime.utcnow, index=True)

    # ---- Helpers de serialización ----

    @property
    def errors(self) -> list:
        try:
            return json.loads(self.errors_json or "[]")
        except (ValueError, TypeError):
            return []

    @errors.setter
    def errors(self, value) -> None:
        self.errors_json = json.dumps(value or [], ensure_ascii=False)

    @property
    def accessibility_settings_used(self) -> dict:
        try:
            return json.loads(self.accessibility_json or "{}")
        except (ValueError, TypeError):
            return {}

    @accessibility_settings_used.setter
    def accessibility_settings_used(self, value) -> None:
        self.accessibility_json = json.dumps(value or {}, ensure_ascii=False)

    def __repr__(self) -> str:
        return f"<GameSession user_id={self.user_id} game={self.game_slug} lvl={self.level}>"
