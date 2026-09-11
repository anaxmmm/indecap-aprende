"""Blueprint: inclusive
Módulo inclusivo: perfiles de accesibilidad, LSC, recompensas por perfil.
"""
from flask import Blueprint

bp = Blueprint("inclusive", __name__, template_folder="../../templates/inclusive")

from app.blueprints.inclusive import routes  # noqa: E402,F401
