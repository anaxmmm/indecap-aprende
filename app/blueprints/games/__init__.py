from flask import Blueprint

bp = Blueprint("games", __name__, template_folder="templates")

from app.blueprints.games import routes  # noqa: E402,F401