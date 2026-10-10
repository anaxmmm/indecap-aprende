"""
Dashboard del docente, Lote 2A: rellena el catalogo de ingles con las
traducciones de base_teacher, panel_general, registro_estudiantes,
student_profile y perfil, y compila el messages.mo.

Uso (desde la raiz del proyecto, con el entorno virtual activo):
    python i18n_lote2a.py
"""
from babel.messages.pofile import read_po, write_po
from babel.messages.mofile import write_mo

PO_PATH = "app/translations/en/LC_MESSAGES/messages.po"
MO_PATH = "app/translations/en/LC_MESSAGES/messages.mo"

TRANSLATIONS = {
    # --- base_teacher.html ---
    "Panel docente": "Teacher dashboard",
    "Usuarios": "Users",
    "Perfil": "Profile",
    "Todavía no tienes notificaciones. Aquí verás avisos cuando tus estudiantes superen niveles de los juegos.": "You don't have any notifications yet. You will see alerts here when your students clear game levels.",
    "Volver al panel": "Back to dashboard",
    "Panel general": "General dashboard",
    "Registro de estudiantes": "Student registry",
    "Sesiones sistema": "System sessions",
    "Guías de uso": "User guides",
    # --- panel_general.html (HTML) ---
    "Panel": "Main",
    "general": "dashboard",
    "Sigue el avance de tus estudiantes en tiempo real. Cambia el periodo, agrupa por semana o toca a un estudiante del ranking para ver solo su actividad.": "Follow your students' progress in real time. Change the period, group by week or tap a student in the ranking to see only their activity.",
    "Actualizado en vivo": "Updated live",
    "Actualizar": "Refresh",
    "Estudiantes activos": "Active students",
    "Planes activos": "Active plans",
    "Trastorno más trabajado": "Most practiced condition",
    "Partidas en el periodo": "Games in the period",
    "niveles superados": "levels cleared",
    "Rendimiento general": "Overall performance",
    "Partidas completadas": "Games completed",
    "Periodo": "Period",
    "7 días": "7 days",
    "30 días": "30 days",
    "2 meses": "2 months",
    "3 meses": "3 months",
    "1 año": "1 year",
    "Agrupar por": "Group by",
    "Por día": "By day",
    "Por semana": "By week",
    "Desde": "From",
    "Hasta": "To",
    "Quitar filtro de estudiante": "Remove student filter",
    "Gráfico de partidas completadas y niveles superados": "Chart of games completed and levels cleared",
    "Aún no hay partidas completadas en este periodo.": "There are no completed games in this period yet.",
    "Ranking": "Ranking",
    "Estudiantes con más actividades realizadas": "Students with the most activities completed",
    "Toca a un estudiante para ver solo su actividad en el gráfico.": "Tap a student to see only their activity in the chart.",
    "Aquí verás el avance de cada estudiante cuando completen su primera actividad.": "You will see each student's progress here once they complete their first activity.",
    "Trastornos en entrenamiento": "Conditions in training",
    "Aparecerán aquí al asignar trastornos en": "They will appear here when you assign conditions in",
    "est.": "stud.",
    # --- panel_general.html (JavaScript) ---
    "Sem": "Wk",
    "Semana del": "Week of",
    "Viendo:": "Viewing:",
    "Ver perfil": "View profile",
    "Revisa el rango de fechas: la fecha inicial debe ser anterior a la final.": "Check the date range: the start date must be before the end date.",
    "nivel superado": "level cleared",
    "partida": "game",
    "partidas": "games",
    "Del {from} al {to}": "From {from} to {to}",
    "Actualizado": "Updated",
    "Niveles superados (≥ 60)": "Levels cleared (≥ 60)",
    # --- registro_estudiantes.html ---
    "Listado de grupos": "Group list",
    "Añadir grupo": "Add group",
    "Todavía no tienes grupos. Crea el primero arriba.": "You don't have any groups yet. Create the first one above.",
    "Añadir niño": "Add child",
    "¿Eliminar el grupo '%(name)s'? Esta acción no se puede deshacer.": "Delete the group '%(name)s'? This action cannot be undone.",
    "Eliminar grupo": "Delete group",
    "Nuevo niño": "New child",
    "correo del niño": "child's email",
    "correo del tutor": "guardian's email",
    "No hay trastornos cargados en el sistema todavía.": "There are no conditions loaded in the system yet.",
    "Al marcar un trastorno, el estudiante queda inscrito automáticamente en la primera sesión del plan de entrenamiento correspondiente.": "When you check a condition, the student is automatically enrolled in the first session of the matching training plan.",
    "Mover": "Move",
    "Desvincular": "Unlink",
    "Sin niños asignados todavía.": "No children assigned yet.",
    "Niños inactivos": "Inactive children",
    "Reactivar": "Reactivate",
    "¿Eliminar definitivamente a %(name)s? Esta acción borra todo su historial y no se puede deshacer.": "Permanently delete %(name)s? This action erases their entire history and cannot be undone.",
    "Eliminar definitivamente": "Delete permanently",
    # --- student_profile.html ---
    "Perfil de %(name)s": "Profile of %(name)s",
    "Marca los trastornos que este estudiante debe trabajar. Esto define qué actividades verá en su dashboard.": "Check the conditions this student should work on. This defines which activities they will see in their dashboard.",
    "Progreso": "Progress",
    "El histórico de sesiones y evolución se conecta en la siguiente iteración, junto con el reproductor de actividades.": "The session history and progress will be connected in the next iteration, together with the activity player.",
    # --- perfil.html ---
    "ej. Psicología, Matemáticas": "e.g. Psychology, Mathematics",
    "Mínimo 6 caracteres": "At least 6 characters",
}


def main():
    with open(PO_PATH, "rb") as f:
        catalog = read_po(f, locale="en")

    usados = set()
    pendientes = []

    for message in catalog:
        if not message.id:
            continue  # cabecera del catalogo
        if isinstance(message.id, (tuple, list)):
            continue  # plurales: ya resueltos en el Lote 1
        if message.id in TRANSLATIONS:
            message.string = TRANSLATIONS[message.id]
            message.flags.discard("fuzzy")
            usados.add(message.id)
        elif not message.string or "fuzzy" in message.flags:
            pendientes.append(message.id)

    with open(PO_PATH, "wb") as f:
        write_po(f, catalog)
    with open(MO_PATH, "wb") as f:
        write_mo(f, catalog)

    print("Traducciones aplicadas:", len(usados))

    sobrantes = [k for k in TRANSLATIONS if k not in usados]
    if sobrantes:
        print("\nAVISO: estas traducciones no coinciden con ningun texto del codigo:")
        for k in sobrantes:
            print("  -", k)

    if pendientes:
        print("\nAVISO: estos textos siguen sin traducir:")
        for k in pendientes:
            print("  -", k)

    if not sobrantes and not pendientes:
        print("Catalogo completo y compilado.")


if __name__ == "__main__":
    main()
