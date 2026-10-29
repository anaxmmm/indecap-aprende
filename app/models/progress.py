from datetime import date

from app.extensions import db
from app.utils.fechas import utc_now


class Progress(db.Model):
    """
    Registro diario de actividad de un estudiante, base del sistema de
    racha tipo Duolingo en el dashboard.
    """
    __tablename__ = "progress_entries"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    activity_date = db.Column(db.Date, default=date.today, nullable=False)
    minutes_spent = db.Column(db.Integer, default=0)
    points_earned = db.Column(db.Integer, default=0)
    created_at = db.Column(db.DateTime, default=utc_now)

    __table_args__ = (
        db.UniqueConstraint("user_id", "activity_date", name="uq_user_activity_date"),
    )

    def __repr__(self) -> str:
        return f"<Progress user_id={self.user_id} date={self.activity_date}>"
