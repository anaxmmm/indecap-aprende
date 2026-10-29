"""Intentos fallidos de inicio de sesión y solicitudes de recuperación de
contraseña, para frenar a quien intenta adivinar contraseñas.

La clave es el correo escrito (exista o no la cuenta) o la dirección IP, con
un prefijo que indica qué se está contando: «login:», «ip:» o «reset:».
"""
from app.extensions import db


class LoginThrottle(db.Model):
    __tablename__ = "login_throttles"

    id = db.Column(db.Integer, primary_key=True)
    key = db.Column(db.String(200), nullable=False, unique=True, index=True)
    failures = db.Column(db.Integer, nullable=False, default=0)
    window_start = db.Column(db.DateTime, nullable=True)
    locked_until = db.Column(db.DateTime, nullable=True)

    def __repr__(self) -> str:
        return f"<LoginThrottle {self.key} {self.failures}>"
