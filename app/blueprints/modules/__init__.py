"""Blueprint: modules
Contenido educativo: Matemáticas, Inglés, Español, Ciencias.
"""
from flask import Blueprint

bp = Blueprint("modules", __name__, template_folder="../../templates/modules")

from app.blueprints.modules import routes  # noqa: E402,F401
