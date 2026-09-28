from datetime import date, timedelta

from flask import render_template, redirect, url_for, flash, request
from flask_login import login_required, current_user

from app.blueprints.dashboard import bp
from app.blueprints.dashboard.forms import (
    GroupForm,
    AddStudentForm,
    AssignTrastornosForm,
    ProfileForm,
    AssignSessionForm,
)
from app.blueprints.dashboard.services import (
    get_groups_for_teacher,
    create_group,
    delete_group,
    create_student_in_group,
    move_student_to_group,
    deactivate_student,
    reactivate_student,
    delete_student_permanently,
    get_sesiones_sistema,
    get_planes_overview,
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
    get_student_ranking_by_completed_sessions,
    get_weekly_completion_counts,
    get_trastornos_mas_trabajados,
    get_planes_activos,
    get_student_trastornos_con_progreso,
    get_student_actividades_por_trastorno,
    get_student_racha_mensual,
    get_started_activities,
    start_session,
    get_student_profile,
)
from app.blueprints.games.registry import get_game_for_trastorno
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

    rango = request.args.get("rango", "mes")
    since_map = {
        "semana": date.today() - timedelta(days=7),
        "mes": date.today() - timedelta(days=30),
        "2meses": date.today() - timedelta(days=60),
        "3meses": date.today() - timedelta(days=90),
        "todo": None,
    }
    since_date = since_map.get(rango, since_map["mes"])

    return render_template(
        "dashboard/teacher/panel_general.html",
        total_estudiantes=len(get_students_for_teacher(current_user)),
        ranking=get_student_ranking_by_completed_sessions(current_user, since_date),
        trastornos_top=get_trastornos_mas_trabajados(current_user),
        planes_activos=get_planes_activos(current_user),
        serie_semanal=get_weekly_completion_counts(current_user),
        rango_actual=rango,
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
        (t.id, t.name) for t in Trastorno.query.order_by(Trastorno.name.asc()).all()
    ]

    if request.method == "POST":
        if "submit_group" in request.form and group_form.validate_on_submit():
            create_group(current_user, group_form.name.data)
            flash("Grupo creado correctamente.", "success")
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
                    alias=student_form.alias.data,
                    tutor_email=student_form.tutor_email.data,
                    gender=student_form.gender.data,
                    birth_date=student_form.birth_date.data,
                    has_learning_difficulties=student_form.has_learning_difficulties.data,
                    trastorno_ids=student_form.trastornos.data,
                )
                flash("Estudiante añadido al grupo.", "success")
            except ValueError as exc:
                flash(str(exc), "danger")
            return redirect(url_for("dashboard.registro_estudiantes"))

        for field_errors in list(group_form.errors.values()) + list(student_form.errors.values()):
            for error in field_errors:
                flash(error, "danger")

    return render_template(
        "dashboard/teacher/registro_estudiantes.html",
        groups=groups,
        group_form=group_form,
        student_form=student_form,
        active_nav="registro_estudiantes",
    )


@bp.route("/registro-estudiantes/grupo/<int:group_id>/eliminar", methods=["POST"])
@login_required
def eliminar_grupo(group_id):
    if not _is_teacher_or_admin():
        return redirect(url_for("dashboard.index"))
    try:
        delete_group(current_user, group_id)
        flash("Grupo eliminado correctamente.", "info")
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
            flash("Estudiante movido de grupo.", "success")
        except ValueError as exc:
            flash(str(exc), "danger")
    return redirect(url_for("dashboard.registro_estudiantes"))


@bp.route("/registro-estudiantes/grupo/<int:group_id>/desvincular/<int:student_id>", methods=["POST"])
@login_required
def desvincular_estudiante(group_id, student_id):
    if not _is_teacher_or_admin():
        return redirect(url_for("dashboard.index"))
    deactivate_student(current_user, group_id, student_id)
    flash("Estudiante desvinculado. Quedó en 'Niños inactivos' de este grupo.", "info")
    return redirect(url_for("dashboard.registro_estudiantes"))


@bp.route("/registro-estudiantes/grupo/<int:group_id>/reactivar/<int:student_id>", methods=["POST"])
@login_required
def reactivar_estudiante(group_id, student_id):
    if not _is_teacher_or_admin():
        return redirect(url_for("dashboard.index"))
    reactivate_student(current_user, group_id, student_id)
    flash("Estudiante reactivado.", "success")
    return redirect(url_for("dashboard.registro_estudiantes"))


@bp.route("/registro-estudiantes/grupo/<int:group_id>/eliminar-estudiante/<int:student_id>", methods=["POST"])
@login_required
def eliminar_estudiante(group_id, student_id):
    if not _is_teacher_or_admin():
        return redirect(url_for("dashboard.index"))
    try:
        delete_student_permanently(current_user, group_id, student_id)
        flash("Estudiante eliminado definitivamente.", "info")
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
        flash("Ese estudiante no existe o no pertenece a tus grupos.", "danger")
        return redirect(url_for("dashboard.registro_estudiantes"))

    trastornos_form = AssignTrastornosForm()
    trastornos_form.trastornos.choices = [
        (t.id, t.name) for t in Trastorno.query.order_by(Trastorno.name.asc()).all()
    ]

    if request.method == "POST" and trastornos_form.validate_on_submit():
        set_assigned_trastornos(current_user, student, trastornos_form.trastornos.data)
        flash("Trastornos asignados actualizados.", "success")
        return redirect(url_for("dashboard.perfil_estudiante", student_id=student.id))

    if request.method == "GET":
        trastornos_form.trastornos.data = get_assigned_trastorno_ids(student)

    return render_template(
        "dashboard/teacher/student_profile.html",
        student=student,
        trastornos_form=trastornos_form,
        active_nav="registro_estudiantes",
    )


@bp.route("/sesiones-sistema")
@login_required
def sesiones_sistema():
    if not _is_teacher_or_admin():
        return redirect(url_for("dashboard.index"))
    trastornos = get_sesiones_sistema()
    return render_template(
        "dashboard/teacher/sesiones_sistema.html",
        trastornos=trastornos,
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
            flash("Sesión asignada correctamente.", "success")
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
        flash("Notas guardadas.", "success")
    except ValueError as exc:
        flash(str(exc), "danger")
        return redirect(url_for("dashboard.sesiones_sistema"))
    return redirect(url_for("dashboard.actividad_detail", actividad_id=actividad_id))


@bp.route("/planes-entrenamiento")
@login_required
def planes_entrenamiento():
    if not _is_teacher_or_admin():
        return redirect(url_for("dashboard.index"))
    planes = get_planes_overview(current_user)
    return render_template(
        "dashboard/teacher/planes_entrenamiento.html",
        planes=planes,
        active_nav="planes_entrenamiento",
    )


@bp.route("/guias-uso")
@login_required
def guias_uso():
    if not _is_teacher_or_admin():
        return redirect(url_for("dashboard.index"))
    return render_template(
        "dashboard/teacher/guias_uso.html", active_nav="guias_uso"
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
        flash("Perfil actualizado correctamente.", "success")
        return redirect(url_for("dashboard.perfil"))

    return render_template(
        "dashboard/teacher/perfil.html", form=form, active_nav="perfil"
    )


@bp.route("/notificaciones/marcar-leidas", methods=["POST"])
@login_required
def marcar_notificaciones_leidas():
    mark_all_notifications_read(current_user)
    return redirect(request.referrer or url_for("dashboard.index"))
