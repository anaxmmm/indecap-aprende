import json

from flask import render_template, redirect, url_for, flash, abort, request, make_response
from flask_babel import gettext as _, lazy_gettext as _l
from flask_login import current_user
from werkzeug.utils import secure_filename

from app.blueprints.admin import bp
from app.blueprints.admin import services
from app.blueprints.admin.forms import TrastornoForm, ActividadForm, AccountForm
from app.models.content import Trastorno
from app.extensions import login_manager


@bp.before_request
def require_admin():
    if not current_user.is_authenticated:
        return login_manager.unauthorized()
    if not current_user.is_admin:
        abort(403)


@bp.context_processor
def inject_notifications():
    from app.blueprints.dashboard.services import count_unread_notifications, get_recent_notifications
    return {
        "unread_notifications_count": count_unread_notifications(current_user),
        "recent_notifications": get_recent_notifications(current_user, limit=5),
    }


@bp.route("/")
def index():
    return redirect(url_for("admin.usuarios_list"))


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
        flash(_("Trastorno creado correctamente."), "success")
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
        flash(_("Trastorno actualizado."), "success")
        return redirect(url_for("admin.trastornos_list"))
    return render_template("admin/trastorno_form.html", form=form, mode="edit", trastorno=trastorno)


@bp.route("/trastornos/<int:trastorno_id>/delete", methods=["POST"])
def trastorno_delete(trastorno_id):
    trastorno = services.get_trastorno_or_404(trastorno_id)
    services.delete_trastorno(trastorno)
    flash(_("Trastorno eliminado."), "info")
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
        flash(_("Actividad creada correctamente."), "success")
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
        flash(_("Actividad actualizada."), "success")
        return redirect(url_for("admin.actividades_list", trastorno_id=actividad.trastorno_id))
    return render_template("admin/actividad_form.html", form=form, mode="edit", trastorno=actividad.trastorno)


@bp.route("/actividades/<int:actividad_id>/delete", methods=["POST"])
def actividad_delete(actividad_id):
    actividad = services.get_actividad_or_404(actividad_id)
    trastorno_id = actividad.trastorno_id
    services.delete_actividad(actividad)
    flash(_("Actividad eliminada."), "info")
    return redirect(url_for("admin.actividades_list", trastorno_id=trastorno_id))


# --- Usuarios ---

ROLE_LABELS = {
    "administrador": _l("Administrador"),
    "docente": _l("Docente"),
    "estudiante": _l("Estudiante"),
}


def _account_form():
    form = AccountForm()
    form.role.choices = [(r.value, ROLE_LABELS[r.value]) for r in current_user.creatable_roles()]
    form.group_id.choices = [(0, _l("Sin grupo"))] + [
        (g.id, "%s · %s" % (g.name, g.teacher.full_name)) for g in services.list_all_groups()
    ]
    return form


@bp.route("/usuarios", methods=["GET", "POST"])
def usuarios_list():
    vista = request.args.get("vista", "activas")
    rol = request.args.get("rol", "")
    form = _account_form()

    if request.method == "POST":
        if form.validate_on_submit():
            try:
                services.create_account(
                    current_user,
                    full_name=form.full_name.data,
                    email=form.email.data,
                    password=form.password.data,
                    role=form.role.data,
                    group_id=form.group_id.data or None,
                    data_consent=form.data_consent.data,
                )
                flash(_("Cuenta creada. Comparte la contraseña temporal con la persona de forma segura."), "success")
                return redirect(url_for("admin.usuarios_list"))
            except ValueError as exc:
                flash(str(exc), "danger")
        else:
            for errors in form.errors.values():
                for error in errors:
                    flash(str(error), "danger")

    return render_template(
        "admin/usuarios_list.html",
        usuarios=services.list_accounts(archived=(vista == "archivadas"), role=rol),
        vista=vista,
        rol=rol,
        form=form,
        groups=services.list_all_groups(),
        role_labels=ROLE_LABELS,
        open_form=request.method == "POST",
        active_nav="usuarios",
    )


@bp.route("/usuarios/<int:user_id>/eliminar", methods=["POST"])
def usuario_delete(user_id):
    try:
        user = services.archive_account(current_user, user_id)
        flash(_("La cuenta de %(name)s se eliminó del acceso. Su información queda guardada en «Archivadas».", name=user.full_name), "info")
    except ValueError as exc:
        flash(str(exc), "danger")
    return redirect(url_for("admin.usuarios_list"))


@bp.route("/usuarios/<int:user_id>/datos.json")
def usuario_export(user_id):
    """Descarga todo lo que la plataforma guarda de un estudiante."""
    try:
        data = services.export_student_data(current_user, user_id)
    except ValueError as exc:
        flash(str(exc), "danger")
        return redirect(url_for("admin.usuarios_list"))
    nombre = secure_filename(data["cuenta"]["correo"].split("@")[0]) or "estudiante"
    response = make_response(json.dumps(data, ensure_ascii=False, indent=2))
    response.headers["Content-Type"] = "application/json; charset=utf-8"
    response.headers["Content-Disposition"] = 'attachment; filename="datos-%s.json"' % nombre
    return response


@bp.route("/usuarios/<int:user_id>/borrar-definitivo", methods=["POST"])
def usuario_purge(user_id):
    try:
        nombre = services.purge_student(current_user, user_id, request.form.get("confirmacion", ""))
        flash(_("Se borraron definitivamente la cuenta y toda la información de %(name)s.", name=nombre), "info")
    except ValueError as exc:
        flash(str(exc), "danger")
    return redirect(url_for("admin.usuarios_list", vista="archivadas"))


@bp.route("/usuarios/<int:user_id>/restaurar", methods=["POST"])
def usuario_restore(user_id):
    try:
        user = services.restore_account(current_user, user_id, request.form.get("group_id", type=int))
        flash(_("La cuenta de %(name)s se restauró.", name=user.full_name), "success")
    except ValueError as exc:
        flash(str(exc), "danger")
    return redirect(url_for("admin.usuarios_list", vista="archivadas"))
