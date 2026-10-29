from urllib.parse import urlparse

from flask import render_template, redirect, url_for, flash, request, abort, jsonify
from flask_babel import gettext as _
from flask_login import login_required, current_user

from app.blueprints.dashboard import bp
from app.blueprints.dashboard.forms import (
    GroupForm,
    AddStudentForm,
    EditStudentForm,
    AssignTrastornosForm,
    ProfileForm,
    AssignSessionForm,
)
from app.blueprints.dashboard.services import (
    get_groups_for_teacher,
    create_group,
    delete_group,
    create_student_in_group,
    update_student,
    move_student_to_group,
    deactivate_student,
    reactivate_student,
    get_student_if_owned_by_teacher,
    get_assigned_trastorno_ids,
    set_assigned_trastornos,
    get_or_create_teacher_profile,
    update_teacher_profile,
    get_recent_notifications,
    count_unread_notifications,
    mark_all_notifications_read,
    get_students_for_teacher,
    assign_session,
    get_sesiones_asignadas_for_actividad,
    update_session_notes,
    get_activity_matrix,
    get_planes_activos,
    get_trastornos_mas_trabajados,
    get_student_trastornos_con_progreso,
    get_student_actividades_por_trastorno,
    get_student_racha_mensual,
    get_started_activities,
    start_session,
    get_student_profile,
    get_teachers,
    reassign_group,
)

from app.blueprints.admin.services import archive_account
from app.blueprints.games.services import get_student_history
from app.utils.fechas import format_local, utc_now
from app.blueprints.games.registry import (
    GAMES,
    build_levels,
    condition_label,
    get_game,
    get_game_for_trastorno,
    split_activity,
    activity_title,
    level_name,
)
from app.models.content import Trastorno, Actividad


def _is_teacher_or_admin() -> bool:
    return current_user.is_teacher or current_user.is_admin


@bp.context_processor
def inject_notifications():
    if current_user.is_authenticated:
        return {
            "unread_notifications_count": count_unread_notifications(current_user),
            "recent_notifications": get_recent_notifications(current_user, limit=5),
        }
    return {"unread_notifications_count": 0, "recent_notifications": []}


@bp.route("/")
@login_required
def index():
    if current_user.is_student:
        return redirect(url_for("dashboard.student_panel_general"))
    return redirect(url_for("dashboard.panel_general"))


# ─── RUTAS DEL ESTUDIANTE ────────────────────────────────────────────────────

@bp.route("/mi-panel")
@login_required
def student_panel_general():
    if not current_user.is_student:
        return redirect(url_for("dashboard.panel_general"))
    return render_template(
        "dashboard/student/index.html",
        trastornos=get_student_trastornos_con_progreso(current_user),
        racha=get_student_racha_mensual(current_user),
        actividades_iniciadas=get_started_activities(current_user),
        active_nav="panel_general",
    )


@bp.route("/mis-actividades")
@login_required
def student_actividades():
    if not current_user.is_student:
        return redirect(url_for("dashboard.panel_general"))
    return render_template(
        "dashboard/student/actividades.html",
        grupos=get_student_actividades_por_trastorno(current_user),
        active_nav="actividades",
    )


@bp.route("/mis-actividades/sesion/<int:sesion_id>/iniciar", methods=["POST"])
@login_required
def student_iniciar_actividad(sesion_id):
    if not current_user.is_student:
        return redirect(url_for("dashboard.panel_general"))
    try:
        sesion = start_session(current_user, sesion_id)
    except ValueError as exc:
        flash(str(exc), "danger")
        return redirect(url_for("dashboard.student_actividades"))
    return redirect(
        url_for("dashboard.student_juego_detail", trastorno_id=sesion.actividad.trastorno_id)
    )


@bp.route("/juegos")
@login_required
def student_juegos():
    if not current_user.is_student:
        return redirect(url_for("dashboard.panel_general"))
    return render_template(
        "dashboard/student/juegos.html",
        trastornos=Trastorno.query.order_by(Trastorno.name.asc()).all(),
        active_nav="juegos",
    )


@bp.route("/juegos/<int:trastorno_id>")
@login_required
def student_juego_detail(trastorno_id):
    if not current_user.is_student:
        return redirect(url_for("dashboard.panel_general"))
    trastorno = Trastorno.query.get_or_404(trastorno_id)
    return render_template(
        "dashboard/student/juego_detail.html",
        trastorno=trastorno,
        game=get_game_for_trastorno(trastorno),
        active_nav="juegos",
    )


@bp.route("/mi-perfil")
@login_required
def student_perfil():
    if not current_user.is_student:
        return redirect(url_for("dashboard.panel_general"))
    return render_template(
        "dashboard/student/perfil.html",
        profile=get_student_profile(current_user),
        active_nav="perfil",
    )


# ─── RUTAS DEL DOCENTE ───────────────────────────────────────────────────────

@bp.route("/panel-general")
@login_required
def panel_general():
    if not _is_teacher_or_admin():
        return redirect(url_for("dashboard.index"))

    actividad = get_activity_matrix(current_user)
    for fila in actividad["students"]:
        fila["url"] = url_for("dashboard.perfil_estudiante", student_id=fila["id"])

    return render_template(
        "dashboard/teacher/panel_general.html",
        total_estudiantes=len(actividad["students"]),
        planes_activos=get_planes_activos(current_user),
        trastornos_top=get_trastornos_mas_trabajados(current_user),
        actividad=actividad,
        active_nav="panel_general",
    )


@bp.route("/registro-estudiantes", methods=["GET", "POST"])
@login_required
def registro_estudiantes():
    if not _is_teacher_or_admin():
        return redirect(url_for("dashboard.index"))

    group_form = GroupForm()
    student_form = AddStudentForm()
    groups = get_groups_for_teacher(current_user)
    student_form.group_id.choices = [(g.id, g.name) for g in groups]
    student_form.trastornos.choices = [
        (t.id, condition_label(t)) for t in Trastorno.query.order_by(Trastorno.name.asc()).all()
    ]

    if request.method == "POST":
        if "submit_group" in request.form and group_form.validate_on_submit():
            create_group(current_user, group_form.name.data)
            flash(_("Grupo creado correctamente."), "success")
            return redirect(url_for("dashboard.registro_estudiantes"))

        if "submit_student" in request.form and student_form.validate_on_submit():
            try:
                create_student_in_group(
                    first_name=student_form.first_name.data,
                    last_name=student_form.last_name.data,
                    email=student_form.email.data,
                    password=student_form.password.data,
                    group_id=student_form.group_id.data,
                    teacher=current_user,
                    gender=student_form.gender.data,
                    birth_date=student_form.birth_date.data,
                    has_learning_difficulties=student_form.has_learning_difficulties.data,
                    trastorno_ids=student_form.trastornos.data,
                    data_consent=student_form.data_consent.data,
                )
                flash(_("Estudiante añadido al grupo."), "success")
            except ValueError as exc:
                flash(str(exc), "danger")
            return redirect(url_for("dashboard.registro_estudiantes"))

        for field_errors in list(group_form.errors.values()) + list(student_form.errors.values()):
            for error in field_errors:
                flash(str(error), "danger")

    return render_template(
        "dashboard/teacher/registro_estudiantes.html",
        groups=groups,
        group_form=group_form,
        student_form=student_form,
        active_nav="registro_estudiantes",
    )

@bp.route("/registro-estudiantes/estudiante/<int:student_id>/editar", methods=["POST"])
@login_required
def editar_estudiante(student_id):
    if not _is_teacher_or_admin():
        return redirect(url_for("dashboard.index"))

    form = EditStudentForm()
    form.trastornos.choices = [
        (t.id, condition_label(t)) for t in Trastorno.query.order_by(Trastorno.name.asc()).all()
    ]

    if form.validate_on_submit():
        try:
            update_student(
                teacher=current_user,
                student_id=student_id,
                full_name=form.full_name.data,
                email=form.email.data,
                gender=form.gender.data,
                birth_date=form.birth_date.data,
                has_learning_difficulties=form.has_learning_difficulties.data,
                trastorno_ids=form.trastornos.data or [],
                data_consent=form.data_consent.data,
            )
            flash(_("Datos del estudiante actualizados."), "success")
        except ValueError as exc:
            flash(str(exc), "danger")
    else:
        for field_errors in form.errors.values():
            for error in field_errors:
                flash(str(error), "danger")

    return redirect(url_for("dashboard.registro_estudiantes"))

@bp.route("/registro-estudiantes/grupo/<int:group_id>/eliminar", methods=["POST"])
@login_required
def eliminar_grupo(group_id):
    if not _is_teacher_or_admin():
        return redirect(url_for("dashboard.index"))
    try:
        delete_group(current_user, group_id)
        flash(_("Grupo eliminado correctamente."), "info")
    except ValueError as exc:
        flash(str(exc), "danger")
    return redirect(url_for("dashboard.registro_estudiantes"))


@bp.route("/registro-estudiantes/grupo/<int:group_id>/mover", methods=["POST"])
@login_required
def mover_estudiante(group_id):
    if not _is_teacher_or_admin():
        return redirect(url_for("dashboard.index"))

    student_id = request.form.get("student_id", type=int)
    target_group_id = request.form.get("target_group_id", type=int)
    if student_id and target_group_id:
        try:
            move_student_to_group(current_user, student_id, target_group_id)
            flash(_("Estudiante movido de grupo."), "success")
        except ValueError as exc:
            flash(str(exc), "danger")
    return redirect(url_for("dashboard.registro_estudiantes"))


@bp.route("/registro-estudiantes/grupo/<int:group_id>/desvincular/<int:student_id>", methods=["POST"])
@login_required
def desvincular_estudiante(group_id, student_id):
    if not _is_teacher_or_admin():
        return redirect(url_for("dashboard.index"))
    deactivate_student(current_user, group_id, student_id)
    flash(_("Estudiante desvinculado. Quedó en «Estudiantes inactivos» de este grupo."), "info")
    return redirect(url_for("dashboard.registro_estudiantes"))


@bp.route("/registro-estudiantes/grupo/<int:group_id>/reactivar/<int:student_id>", methods=["POST"])
@login_required
def reactivar_estudiante(group_id, student_id):
    if not _is_teacher_or_admin():
        return redirect(url_for("dashboard.index"))
    reactivate_student(current_user, group_id, student_id)
    flash(_("Estudiante reactivado."), "success")
    return redirect(url_for("dashboard.registro_estudiantes"))


@bp.route("/registro-estudiantes/grupo/<int:group_id>/eliminar-estudiante/<int:student_id>", methods=["POST"])
@login_required
def eliminar_estudiante(group_id, student_id):
    if not _is_teacher_or_admin():
        return redirect(url_for("dashboard.index"))
    try:
        archive_account(current_user, student_id)
        flash(_("Cuenta eliminada. Su progreso queda guardado y un administrador puede restaurarla."), "info")
    except ValueError as exc:
        flash(str(exc), "danger")
    return redirect(url_for("dashboard.registro_estudiantes"))


@bp.route("/estudiante/<int:student_id>", methods=["GET", "POST"])
@login_required
def perfil_estudiante(student_id):
    if not _is_teacher_or_admin():
        return redirect(url_for("dashboard.index"))

    student = get_student_if_owned_by_teacher(current_user, student_id)
    if student is None:
        flash(_("Ese estudiante no existe o no pertenece a tus grupos."), "danger")
        return redirect(url_for("dashboard.registro_estudiantes"))

    trastornos_form = AssignTrastornosForm()
    trastornos_form.trastornos.choices = [
        (t.id, condition_label(t)) for t in Trastorno.query.order_by(Trastorno.name.asc()).all()
    ]

    if request.method == "POST" and trastornos_form.validate_on_submit():
        set_assigned_trastornos(current_user, student, trastornos_form.trastornos.data)
        flash(_("Trastornos asignados actualizados."), "success")
        return redirect(url_for("dashboard.perfil_estudiante", student_id=student.id))

    if request.method == "GET":
        trastornos_form.trastornos.data = get_assigned_trastorno_ids(student)

    return render_template(
        "dashboard/teacher/student_profile.html",
        student=student,
        trastornos_form=trastornos_form,
        history=get_student_history(student),
        active_nav="registro_estudiantes",
    )


@bp.route("/estudiante/<int:student_id>/informe")
@login_required
def informe_estudiante(student_id):
    """Historial del estudiante en una página lista para imprimir o guardar
    como PDF desde el navegador."""
    if not _is_teacher_or_admin():
        return redirect(url_for("dashboard.index"))

    student = get_student_if_owned_by_teacher(current_user, student_id)
    if student is None:
        flash(_("Ese estudiante no existe o no pertenece a tus grupos."), "danger")
        return redirect(url_for("dashboard.registro_estudiantes"))

    return render_template(
        "dashboard/teacher/informe_estudiante.html",
        student=student,
        profile=student.student_profile,
        conditions=[a.trastorno for a in student.trastornos_asignados],
        history=get_student_history(student, recent_limit=20),
        generated=utc_now(),
    )


@bp.route("/sesiones-sistema")
@login_required
def sesiones_sistema():
    """Modo maestro: los 8 juegos con sus 5 niveles y 10 actividades.

    Cada actividad ofrece jugarla o proyectarla en vivo (el docente entra en
    vista previa, sin guardar progreso) o ver sus respuestas antes de clase.
    """
    if not _is_teacher_or_admin():
        return redirect(url_for("dashboard.index"))

    juegos = [{"game": game, "levels": build_levels(game)} for game in GAMES.values()]

    return render_template(
        "dashboard/teacher/sesiones_sistema.html",
        juegos=juegos,
        active_nav="sesiones_sistema",
    )


@bp.route("/sesiones-sistema/<slug>/nivel/<int:level>/respuestas")
@login_required
def ver_respuestas(slug, level):
    """
    Hoja de respuestas de una actividad, generada en el navegador a partir del
    propio game.js del juego (mismo motor de contenido que usa el estudiante,
    sin duplicar ningún banco de datos aquí).
    """
    if not _is_teacher_or_admin():
        return redirect(url_for("dashboard.index"))

    game = get_game(slug)
    if game is None or level < 1 or level > game["levels"]:
        abort(404)

    nivel, actividad = split_activity(game, level)

    return render_template(
        "dashboard/teacher/ver_respuestas.html",
        game=game,
        level=level,
        nivel=nivel,
        nivel_name=level_name(nivel),
        actividad=actividad,
        activity_title=activity_title(game, level),
        active_nav="sesiones_sistema",
    )


@bp.route("/sesiones-sistema/actividad/<int:actividad_id>", methods=["GET", "POST"])
@login_required
def actividad_detail(actividad_id):
    if not _is_teacher_or_admin():
        return redirect(url_for("dashboard.index"))

    actividad = Actividad.query.get_or_404(actividad_id)
    students = get_students_for_teacher(current_user)

    assign_form = AssignSessionForm()
    assign_form.student_id.choices = [(s.id, s.full_name) for s in students]

    if request.method == "POST" and "submit_assign" in request.form and assign_form.validate_on_submit():
        try:
            assign_session(
                teacher=current_user,
                student_id=assign_form.student_id.data,
                actividad_id=actividad.id,
                start_date=assign_form.start_date.data,
                end_date=assign_form.end_date.data,
            )
            flash(_("Sesión asignada correctamente."), "success")
        except ValueError as exc:
            flash(str(exc), "danger")
        return redirect(url_for("dashboard.actividad_detail", actividad_id=actividad.id))

    asignaciones = get_sesiones_asignadas_for_actividad(actividad.id, current_user)

    return render_template(
        "dashboard/teacher/actividad_detail.html",
        actividad=actividad,
        assign_form=assign_form,
        asignaciones=asignaciones,
        active_nav="sesiones_sistema",
    )


@bp.route("/sesiones-sistema/asignacion/<int:asignacion_id>/notas", methods=["POST"])
@login_required
def actualizar_notas_sesion(asignacion_id):
    if not _is_teacher_or_admin():
        return redirect(url_for("dashboard.index"))
    try:
        actividad_id = update_session_notes(
            current_user, asignacion_id, request.form.get("clinical_notes", "")
        )
        flash(_("Notas guardadas."), "success")
    except ValueError as exc:
        flash(str(exc), "danger")
        return redirect(url_for("dashboard.sesiones_sistema"))
    return redirect(url_for("dashboard.actividad_detail", actividad_id=actividad_id))


@bp.route("/docentes-grupos", methods=["GET", "POST"])
@login_required
def docentes_grupos():
    if not current_user.is_admin:
        return redirect(url_for("dashboard.index"))

    if request.method == "POST":
        try:
            grupo = reassign_group(
                current_user,
                request.form.get("group_id", type=int),
                request.form.get("teacher_id", type=int),
            )
            flash(
                _("El grupo %(grupo)s quedó a cargo de %(docente)s.", grupo=grupo.name, docente=grupo.teacher.full_name),
                "success",
            )
        except ValueError as exc:
            flash(str(exc), "danger")
        return redirect(url_for("dashboard.docentes_grupos"))

    return render_template(
        "dashboard/teacher/docentes_grupos.html",
        grupos=get_groups_for_teacher(current_user),
        docentes=get_teachers(),
        active_nav="docentes_grupos",
    )


@bp.route("/guias-uso")
@login_required
def guias_uso():
    if not _is_teacher_or_admin():
        return redirect(url_for("dashboard.index"))
    return render_template(
        "dashboard/teacher/guias_uso.html",
        games=list(GAMES.values()),
        active_nav="guias_uso",
    )


@bp.route("/perfil", methods=["GET", "POST"])
@login_required
def perfil():
    if not _is_teacher_or_admin():
        return redirect(url_for("dashboard.index"))

    profile = get_or_create_teacher_profile(current_user)
    form = ProfileForm(current_user_id=current_user.id)

    if request.method == "GET":
        form.full_name.data = current_user.full_name
        form.email.data = current_user.email
        form.area.data = profile.area

    if form.validate_on_submit():
        update_teacher_profile(
            current_user,
            form.full_name.data,
            form.email.data,
            form.area.data,
            new_password=form.new_password.data,
        )
        flash(_("Perfil actualizado correctamente."), "success")
        return redirect(url_for("dashboard.perfil"))

    return render_template(
        "dashboard/teacher/perfil.html", form=form, active_nav="perfil"
    )


@bp.route("/notificaciones/marcar-leidas", methods=["POST"])
@login_required
def marcar_notificaciones_leidas():
    mark_all_notifications_read(current_user)
    if request.accept_mimetypes.best == "application/json":
        return jsonify({"unread": 0})
    target = request.referrer
    if target and urlparse(target).netloc == request.host:
        return redirect(target)
    return redirect(url_for("dashboard.index"))


@bp.route("/notificaciones/estado")
@login_required
def notificaciones_estado():
    """Estado de las notificaciones en JSON. Lo consulta static/js/dx-live.js
    cada pocos segundos para mantener la campana sincronizada sin recargar."""
    notificaciones = get_recent_notifications(current_user, limit=5)
    return jsonify({
        "unread": count_unread_notifications(current_user),
        "latest_id": notificaciones[0].id if notificaciones else 0,
        "items": [
            {
                "id": n.id,
                "message": n.text(),
                "is_read": bool(n.is_read),
                "created_at": format_local(n.created_at, "%d/%m %H:%M"),
            }
            for n in notificaciones
        ],
    })
