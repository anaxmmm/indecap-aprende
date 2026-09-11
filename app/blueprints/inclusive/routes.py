from flask import render_template
from flask_login import login_required

from app.blueprints.inclusive import bp


@bp.route("/")
@login_required
def index():
    """Vista principal del módulo inclusive. Placeholder a implementar."""
    return render_template("inclusive/index.html")
