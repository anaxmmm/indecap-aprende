from flask import render_template
from flask_login import login_required, current_user

from app.blueprints.modules import bp
from app.blueprints.modules.services import (
    get_all_trastornos,
    get_actividad_or_404,
    get_check_previo,
)


@bp.route("/")
@login_required
def index():
    trastornos = get_all_trastornos()
    return render_template("modules/index.html", trastornos=trastornos)


@bp.route("/actividad/<int:actividad_id>")
@login_required
def lesson_detail(actividad_id):
    actividad = get_actividad_or_404(actividad_id)
    check = get_check_previo(current_user.id, actividad.trastorno_id)
    return render_template("modules/lesson.html", actividad=actividad, check=check)
