"""
Lote 3 de i18n: rellena el catalogo de ingles con las traducciones de
base.html, admin, modulos, inclusive, restablecer contrasena y generos del
formulario de estudiantes, y compila el messages.mo.

Uso (desde la raiz del proyecto, con el entorno virtual activo):
    python i18n_lote3.py
"""
from babel.messages.pofile import read_po, write_po
from babel.messages.mofile import write_mo

PO_PATH = "app/translations/en/LC_MESSAGES/messages.po"
MO_PATH = "app/translations/en/LC_MESSAGES/messages.mo"

TRANSLATIONS = {
    # --- base.html ---
    "Trastornos": "Conditions",
    # --- admin/index.html ---
    "Panel administrador": "Administrator dashboard",
    "Actividades": "Activities",
    "Gestionar trastornos y actividades": "Manage conditions and activities",
    # --- admin/trastornos_list.html y trastorno_form.html ---
    "Nuevo trastorno": "New condition",
    "Editar trastorno": "Edit condition",
    "Editar": "Edit",
    "Eliminar": "Delete",
    "¿Eliminar este trastorno y todas sus actividades?": "Delete this condition and all its activities?",
    "Todavía no hay trastornos creados.": "There are no conditions created yet.",
    # --- admin/actividades_list.html y actividad_form.html ---
    "Actividades de %(name)s": "Activities of %(name)s",
    "Nueva actividad": "New activity",
    "Editar actividad": "Edit activity",
    "Orden": "Order",
    "Título": "Title",
    "Minutos": "Minutes",
    "Componente": "Component",
    "Ver": "View",
    "¿Eliminar esta actividad?": "Delete this activity?",
    "Todavía no hay actividades en este trastorno.": "There are no activities in this condition yet.",
    "Volver a trastornos": "Back to conditions",
    # --- admin/usuarios_list.html ---
    "Correo": "Email",
    "Rol": "Role",
    "Estado": "Status",
    "administrador": "administrator",
    "Activo": "Active",
    "Inactivo": "Inactive",
    "¿Eliminar definitivamente a %(name)s? Esta acción no se puede deshacer.": "Permanently delete %(name)s? This action cannot be undone.",
    "No hay usuarios registrados.": "There are no registered users.",
    # --- modules/index.html ---
    "Todavía no hay trastornos cargados.": "There are no conditions loaded yet.",
    # --- modules/lesson.html ---
    "Nivel de apoyo actual:": "Current support level:",
    "bajo": "low",
    "medio": "medium",
    "alto": "high",
    "Todavía no tienes un check previo para este trastorno — próximamente podrás hacerlo antes de empezar.": "You don't have a previous check for this condition yet — soon you will be able to take it before starting.",
    "Herramientas de accesibilidad de lectura": "Reading accessibility tools",
    "Pausar": "Pause",
    "Detener": "Stop",
    "Reducir tamaño de texto": "Decrease text size",
    "Aumentar tamaño de texto": "Increase text size",
    "Un paso a la vez": "One step at a time",
    "%(minutes)s min aprox.": "approx. %(minutes)s min",
    "Anterior": "Previous",
    "Siguiente": "Next",
    "Video en Lengua de Señas Colombiana": "Colombian Sign Language video",
    # --- inclusive/index.html ---
    "Módulo: inclusive": "Module: inclusive",
    # --- dashboard/forms.py: generos ---
    "Nina": "Girl",
    "Nino": "Boy",
    "Otro": "Other",
}

# Textos con plural: clave = singular en espanol; valor = (singular ingles, plural ingles)
PLURALS = {
    "%(num)d actividad": ("%(num)d activity", "%(num)d activities"),
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
