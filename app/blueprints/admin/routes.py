from flask import render_template, redirect, url_for, flash, abort
from flask_login import current_user

from app.blueprints.admin import bp
from app.blueprints.admin import services
from app.blueprints.admin.forms import TrastornoForm, ActividadForm
from app.models.content import Trastorno
from app.extensions import login_manager


@bp.before_request
def require_admin():
    if not current_user.is_authenticated:
        return login_manager.unauthorized()
    if not current_user.is_admin:
        abort(403)


@bp.route("/")
def index():
    stats = services.get_dashboard_stats()
    return render_template("admin/index.html", stats=stats)


# --- Trastornos ---

@bp.route("/trastornos")
def trastornos_list():
    trastornos = services.list_trastornos()
    return render_template("admin/trastornos_list.html", trastornos=trastornos)


@bp.route("/trastornos/new", methods=["GET", "POST"])
def trastorno_new():
    form = TrastornoForm()
    if form.validate_on_submit():
        services.create_trastorno(
            {
                "name": form.name.data,
                "slug": form.slug.data,
                "description": form.description.data,
                "icon": form.icon.data,
            }
        )
        flash("Trastorno creado correctamente.", "success")
        return redirect(url_for("admin.trastornos_list"))
    return render_template("admin/trastorno_form.html", form=form, mode="new")


@bp.route("/trastornos/<int:trastorno_id>/edit", methods=["GET", "POST"])
def trastorno_edit(trastorno_id):
    trastorno = services.get_trastorno_or_404(trastorno_id)
    form = TrastornoForm(obj=trastorno)
    if form.validate_on_submit():
        services.update_trastorno(
            trastorno,
            {
                "name": form.name.data,
                "slug": form.slug.data,
                "description": form.description.data,
                "icon": form.icon.data,
            },
        )
        flash("Trastorno actualizado.", "success")
        return redirect(url_for("admin.trastornos_list"))
    return render_template("admin/trastorno_form.html", form=form, mode="edit", trastorno=trastorno)


@bp.route("/trastornos/<int:trastorno_id>/delete", methods=["POST"])
def trastorno_delete(trastorno_id):
    trastorno = services.get_trastorno_or_404(trastorno_id)
    services.delete_trastorno(trastorno)
    flash("Trastorno eliminado.", "info")
    return redirect(url_for("admin.trastornos_list"))


# --- Actividades ---

def _populate_trastorno_choices(form):
    form.trastorno_id.choices = [(t.id, t.name) for t in Trastorno.query.order_by(Trastorno.name).all()]


@bp.route("/trastornos/<int:trastorno_id>/actividades")
def actividades_list(trastorno_id):
    trastorno = services.get_trastorno_or_404(trastorno_id)
    actividades = services.list_actividades(trastorno_id)
    return render_template("admin/actividades_list.html", trastorno=trastorno, actividades=actividades)


@bp.route("/trastornos/<int:trastorno_id>/actividades/new", methods=["GET", "POST"])
def actividad_new(trastorno_id):
    trastorno = services.get_trastorno_or_404(trastorno_id)
    form = ActividadForm(trastorno_id=trastorno_id)
    _populate_trastorno_choices(form)
    if form.validate_on_submit():
        services.create_actividad(
            {
                "trastorno_id": form.trastorno_id.data,
                "title": form.title.data,
                "content_body": form.content_body.data,
                "order_index": form.order_index.data or 0,
                "estimated_minutes": form.estimated_minutes.data,
                "support_image_url": form.support_image_url.data or None,
                "lsc_video_url": form.lsc_video_url.data or None,
                "interactive_widget": form.interactive_widget.data,
            }
        )
        flash("Actividad creada correctamente.", "success")
        return redirect(url_for("admin.actividades_list", trastorno_id=trastorno_id))
    return render_template("admin/actividad_form.html", form=form, mode="new", trastorno=trastorno)


@bp.route("/actividades/<int:actividad_id>/edit", methods=["GET", "POST"])
def actividad_edit(actividad_id):
    actividad = services.get_actividad_or_404(actividad_id)
    form = ActividadForm(obj=actividad)
    _populate_trastorno_choices(form)
    if form.validate_on_submit():
        services.update_actividad(
            actividad,
            {
                "trastorno_id": form.trastorno_id.data,
                "title": form.title.data,
                "content_body": form.content_body.data,
                "order_index": form.order_index.data or 0,
                "estimated_minutes": form.estimated_minutes.data,
                "support_image_url": form.support_image_url.data or None,
                "lsc_video_url": form.lsc_video_url.data or None,
                "interactive_widget": form.interactive_widget.data,
            },
        )
        flash("Actividad actualizada.", "success")
        return redirect(url_for("admin.actividades_list", trastorno_id=actividad.trastorno_id))
    return render_template("admin/actividad_form.html", form=form, mode="edit", trastorno=actividad.trastorno)


@bp.route("/actividades/<int:actividad_id>/delete", methods=["POST"])
def actividad_delete(actividad_id):
    actividad = services.get_actividad_or_404(actividad_id)
    trastorno_id = actividad.trastorno_id
    services.delete_actividad(actividad)
    flash("Actividad eliminada.", "info")
    return redirect(url_for("admin.actividades_list", trastorno_id=trastorno_id))
