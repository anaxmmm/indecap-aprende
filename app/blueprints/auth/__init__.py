"""Blueprint: auth
Autenticación: login, logout, registro (a cargo de docentes/admin).
"""
from flask import Blueprint

bp = Blueprint("auth", __name__, template_folder="../../templates/auth")

from app.blueprints.auth import routes  # noqa: E402,F401
