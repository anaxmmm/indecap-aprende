"""
Fase 2, Lote 1 de i18n: rellena el catalogo de ingles (messages.po) con las
traducciones de las plantillas del estudiante y compila el messages.mo.

Uso (desde la raiz del proyecto, con el entorno virtual activo):
    python i18n_lote1.py
"""
from babel.messages.pofile import read_po, write_po
from babel.messages.mofile import write_mo

PO_PATH = "app/translations/en/LC_MESSAGES/messages.po"
MO_PATH = "app/translations/en/LC_MESSAGES/messages.mo"

TRANSLATIONS = {
    # --- dashboard/index.html ---
    "Módulo: dashboard": "Module: dashboard",
    "Placeholder — pantalla real pendiente de diseño.": "Placeholder — final screen pending design.",
    # --- base_student.html ---
    "Mi espacio": "My space",
    "Notificaciones": "Notifications",
    "Marcar todas como leídas": "Mark all as read",
    "Todavía no tienes notificaciones. Aquí verás avisos cuando tu docente te asigne algo nuevo.": "You don't have any notifications yet. You will see alerts here when your teacher assigns you something new.",
    "Mi perfil": "My profile",
    "Cerrar sesión": "Sign out",
    "Mi panel": "My dashboard",
    "Juegos": "Games",
    # --- student/index.html ---
    "¡Hola,": "Hello,",
    "Hoy es un buen día para jugar tu primera actividad. Avanzas a tu propio ritmo.": "Today is a good day to play your first activity. You move at your own pace.",
    "Ir a Juegos": "Go to Games",
    "Racha este mes": "Streak this month",
    "Actividades iniciadas": "Activities started",
    "Avance general": "Overall progress",
    "Continúa": "Keep going",
    "Sigue donde quedaste": "Pick up where you left off",
    "Continuar": "Continue",
    "Tu plan": "Your plan",
    "Mis trastornos asignados": "My assigned conditions",
    "Todavía no tienes trastornos asignados. Tu docente los configurará pronto.": "You don't have any conditions assigned yet. Your teacher will set them up soon.",
    "completado": "completed",
    "%(done)s de %(total)s actividades completadas": "%(done)s of %(total)s activities completed",
    "Jugar": "Play",
    "Avisos": "Alerts",
    # --- student/actividades.html ---
    "Mis actividades": "My activities",
    "Todavía no tienes actividades asignadas. Tu docente las configurará pronto.": "You don't have any assigned activities yet. Your teacher will set them up soon.",
    "Completada": "Completed",
    "Pendiente": "Pending",
    # --- student/juegos.html ---
    "Todavía no hay juegos configurados en el sistema.": "There are no games set up in the system yet.",
    "Actividad en preparación.": "Activity in preparation.",
    # --- student/juego_detail.html ---
    "Actividad asignada por tu docente el %(fecha)s.": "Activity assigned by your teacher on %(fecha)s.",
    "Tu docente aún no te asignó esta actividad.": "Your teacher has not assigned you this activity yet.",
    "Volver a Juegos": "Back to Games",
    "Actividad en preparación": "Activity in preparation",
    "Estamos preparando la actividad interactiva para esta área.": "We are preparing the interactive activity for this area.",
    # --- student/perfil.html ---
    "Nombre completo": "Full name",
    "Correo electrónico": "Email",
    "Alias": "Alias",
    "¿Necesitas cambiar algún dato? Pídele a tu docente que lo actualice desde tu perfil en el panel de administración.": "Need to change any information? Ask your teacher to update it from your profile in the administration panel.",
    # --- games/stages.html ---
    "Etapas": "Stages",
    "Modo vista previa: como docente puedes ver todas las etapas y niveles, pero el progreso no se guarda.": "Preview mode: as a teacher you can see all stages and levels, but progress is not saved.",
    "Etapa %(number)s": "Stage %(number)s",
    "Niveles %(start)s–%(end)s": "Levels %(start)s–%(end)s",
    "superados": "cleared",
    "Completa la etapa anterior para desbloquear esta.": "Complete the previous stage to unlock this one.",
    "Nivel %(pos)s de la etapa %(stage)s, superado": "Level %(pos)s of stage %(stage)s, cleared",
    "Nivel %(pos)s de la etapa %(stage)s": "Level %(pos)s of stage %(stage)s",
    "Nivel %(pos)s bloqueado": "Level %(pos)s locked",
    # --- games/play.html ---
    "Modo vista previa: puedes jugar para conocer la actividad, pero no se guarda progreso.": "Preview mode: you can play to get to know the activity, but progress is not saved.",
    "Ajustes de accesibilidad": "Accessibility settings",
    "Leer en voz alta": "Read aloud",
    "Alto contraste": "High contrast",
    "Texto": "Text",
    "Reducir movimiento": "Reduce motion",
    "Necesito una pista": "I need a hint",
    "Salir del juego": "Exit game",
    "Nivel": "Level",
    "Reto": "Challenge",
    "Estrellas": "Stars",
    "tu guía": "your guide",
    "Cargando la misión…": "Loading the mission…",
    "Comenzar la misión": "Start the mission",
    "Opciones de respuesta": "Answer options",
    "Repetir nivel": "Repeat level",
    "Siguiente nivel": "Next level",
    "Salir": "Exit",
    "Qué trabaja esta actividad": "What this activity works on",
    "Habilidad núcleo:": "Core skill:",
    "Regiones cerebrales implicadas:": "Brain regions involved:",
    "Representación:": "Representation:",
    "Acción y expresión:": "Action and expression:",
    "Implicación:": "Engagement:",
    "El nivel de apoyo (pistas, tiempo y repeticiones) se calibra según el desempeño. Es un ajuste pedagógico, no un instrumento diagnóstico.": "The support level (hints, time and repetitions) is calibrated according to performance. It is a pedagogical adjustment, not a diagnostic instrument.",
}

# Textos con plural: clave = singular en espanol; valor = (singular ingles, plural ingles)
PLURALS = {
    "Llevas %(num)d día activo este mes. ¡Sigue así!": (
        "You have been active for %(num)d day this month. Keep it up!",
        "You have been active for %(num)d days this month. Keep it up!",
    ),
    "%(num)d día": ("%(num)d day", "%(num)d days"),
}


def _sin_traducir(message):
    if isinstance(message.string, (tuple, list)):
        return not any(message.string)
    return not message.string


def main():
    with open(PO_PATH, "rb") as f:
        catalog = read_po(f, locale="en")

    usados = set()
    pendientes = []

    for message in catalog:
        if not message.id:
            continue  # cabecera del catalogo

        if isinstance(message.id, (tuple, list)):
            clave = message.id[0]
            if clave in PLURALS:
                message.string = PLURALS[clave]
                message.flags.discard("fuzzy")
                usados.add(clave)
            elif _sin_traducir(message) or "fuzzy" in message.flags:
                pendientes.append(clave)
        else:
            if message.id in TRANSLATIONS:
                message.string = TRANSLATIONS[message.id]
                message.flags.discard("fuzzy")
                usados.add(message.id)
            elif _sin_traducir(message) or "fuzzy" in message.flags:
                pendientes.append(message.id)

    with open(PO_PATH, "wb") as f:
        write_po(f, catalog)
    with open(MO_PATH, "wb") as f:
        write_mo(f, catalog)

    print("Traducciones aplicadas:", len(usados))

    esperadas = set(TRANSLATIONS) | set(PLURALS)
    sobrantes = [k for k in esperadas if k not in usados]
    if sobrantes:
        print("\nAVISO: estas traducciones no coinciden con ningun texto de las plantillas:")
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
