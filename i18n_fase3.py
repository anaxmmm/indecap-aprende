"""
Fase 3 de i18n: rellena el catalogo de ingles con las traducciones de
formularios, rutas y servicios (auth, dashboard, games y admin) y compila
el messages.mo. Reemplaza a i18n_fase3a.py e i18n_fase3b.py.

Uso (desde la raiz del proyecto, con el entorno virtual activo):
    python i18n_fase3.py
"""
from babel.messages.pofile import read_po, write_po
from babel.messages.mofile import write_mo

PO_PATH = "app/translations/en/LC_MESSAGES/messages.po"
MO_PATH = "app/translations/en/LC_MESSAGES/messages.mo"

TRANSLATIONS = {
    # --- extensions.py (Flask-Login) ---
    "Por favor inicia sesión para continuar.": "Please sign in to continue.",
    # --- auth/forms.py ---
    "Contraseña": "Password",
    "Recordarme": "Remember me",
    "Iniciar sesión": "Sign in",
    "Tipo de cuenta": "Account type",
    "Usa al menos 8 caracteres.": "Use at least 8 characters.",
    "Confirmar contraseña": "Confirm password",
    "Las contraseñas no coinciden.": "Passwords do not match.",
    "Ya existe una cuenta con ese correo.": "An account with that email already exists.",
    "Enviar enlace de recuperación": "Send recovery link",
    "Nueva contraseña": "New password",
    "Confirmar nueva contraseña": "Confirm new password",
    "Restablecer contraseña": "Reset password",
    # --- auth/routes.py ---
    "Correo o contraseña incorrectos.": "Incorrect email or password.",
    "docente": "teacher",
    "estudiante": "student",
    "Esta cuenta es de %(role)s. Te llevamos a tu panel correspondiente.": "This is a %(role)s account. We are taking you to the matching dashboard.",
    "Revisa los datos ingresados e intenta de nuevo.": "Check the information you entered and try again.",
    "Sesión cerrada correctamente.": "Signed out successfully.",
    "Cuenta creada correctamente. ¡Bienvenido/a a indecap-aprende!": "Account created successfully. Welcome to indecap-aprende!",
    "Enlace de recuperación (temporal, solo en desarrollo): %(url)s": "Recovery link (temporary, development only): %(url)s",
    "Si el correo está registrado, recibirás instrucciones para restablecer tu contraseña.": "If the email is registered, you will receive instructions to reset your password.",
    "El enlace de recuperación no es válido o ha expirado. Solicita uno nuevo.": "The recovery link is not valid or has expired. Request a new one.",
    "Tu contraseña se actualizó correctamente. Ya puedes iniciar sesión.": "Your password was updated successfully. You can now sign in.",
    # --- dashboard/forms.py ---
    "Nombre del grupo": "Group name",
    "Crear grupo": "Create group",
    "Nombres": "First name",
    "Apellidos": "Last name",
    "Grupo": "Group",
    "Alias / Apodo": "Alias / Nickname",
    "Correo del acudiente": "Parent or guardian email",
    "Género": "Gender",
    "Fecha de nacimiento": "Date of birth",
    "Presenta dificultades de aprendizaje": "Has learning difficulties",
    "Trastornos asignados": "Assigned conditions",
    "Añadir estudiante": "Add student",
    "Seleccionar...": "Select...",
    "Guardar asignación": "Save assignment",
    "Nombre completo": "Full name",
    "Área / Especialidad": "Area / Specialty",
    "Nueva contraseña (opcional)": "New password (optional)",
    "Guardar cambios": "Save changes",
    "Ya existe otra cuenta con ese correo electrónico.": "Another account with that email already exists.",
    "Confirma la nueva contraseña.": "Confirm the new password.",
    "Estudiante": "Student",
    "Fecha de inicio": "Start date",
    "Fecha de fin": "End date",
    "Asignar sesión": "Assign session",
    # --- dashboard/routes.py: nombres de etapa ---
    "Base": "Basic",
    "Media": "Medium",
    "Alta": "High",
    "Muy Alta": "Very High",
    "Súper Difícil": "Super Hard",
    # --- dashboard/routes.py: mensajes flash ---
    "Grupo creado correctamente.": "Group created successfully.",
    "Estudiante añadido al grupo.": "Student added to the group.",
    "Grupo eliminado correctamente.": "Group deleted successfully.",
    "Estudiante movido de grupo.": "Student moved to another group.",
    "Estudiante desvinculado. Quedó en 'Niños inactivos' de este grupo.": "Student unlinked. They are now under 'Inactive children' in this group.",
    "Estudiante reactivado.": "Student reactivated.",
    "Estudiante eliminado definitivamente.": "Student permanently deleted.",
    "Ese estudiante no existe o no pertenece a tus grupos.": "That student does not exist or does not belong to your groups.",
    "Trastornos asignados actualizados.": "Assigned conditions updated.",
    "Sesión asignada correctamente.": "Session assigned successfully.",
    "Notas guardadas.": "Notes saved.",
    "Perfil actualizado correctamente.": "Profile updated successfully.",
    # --- dashboard/services.py: errores ---
    "El grupo no existe o no pertenece a este docente.": "The group does not exist or does not belong to this teacher.",
    "Este grupo todavía tiene niños asignados (activos o inactivos). Muévelos a otro grupo o elimínalos antes de eliminar el grupo.": "This group still has children assigned (active or inactive). Move them to another group or delete them before deleting the group.",
    "El grupo destino no existe o no pertenece a este docente.": "The destination group does not exist or does not belong to this teacher.",
    "El estudiante no existe.": "The student does not exist.",
    "El estudiante no existe o no pertenece a este grupo.": "The student does not exist or does not belong to this group.",
    "Ese estudiante no pertenece a tus grupos.": "That student does not belong to your groups.",
    "La fecha de fin no puede ser anterior a la de inicio.": "The end date cannot be earlier than the start date.",
    "Esa sesión asignada no existe o no te pertenece.": "That assigned session does not exist or does not belong to you.",
    "Esa actividad no existe o no te pertenece.": "That activity does not exist or does not belong to you.",
    # --- games/routes.py ---
    "Este juego todavía está en construcción.": "This game is still under construction.",
    "Tu docente aún no te asignó esta actividad.": "Your teacher has not assigned you this activity yet.",
    "Primero completa los niveles anteriores.": "Complete the previous levels first.",
    # --- admin/forms.py ---
    "Nombre (ej. Dislexia, TDAH, Discalculia)": "Name (e.g. Dyslexia, ADHD, Dyscalculia)",
    "Slug (identificador para URL, sin espacios ni tildes)": "Slug (URL identifier, no spaces or accents)",
    "Descripción": "Description",
    "Ícono (ej. brain, ear, eye)": "Icon (e.g. brain, ear, eye)",
    "Guardar": "Save",
    "Trastorno": "Condition",
    "Título de la actividad": "Activity title",
    "Contenido (se permite HTML simple: <p>, <strong>, <em>)": "Content (simple HTML allowed: <p>, <strong>, <em>)",
    "Orden dentro del trastorno": "Order within the condition",
    "Minutos estimados (20-30 recomendado)": "Estimated minutes (20-30 recommended)",
    "URL de imagen de apoyo (opcional)": "Support image URL (optional)",
    "URL de video en LSC (opcional)": "LSC (Colombian Sign Language) video URL (optional)",
    "Componente interactivo": "Interactive component",
    # --- admin/routes.py ---
    "Trastorno creado correctamente.": "Condition created successfully.",
    "Trastorno actualizado.": "Condition updated.",
    "Trastorno eliminado.": "Condition deleted.",
    "Actividad creada correctamente.": "Activity created successfully.",
    "Actividad actualizada.": "Activity updated.",
    "Actividad eliminada.": "Activity deleted.",
    "Cuenta eliminada correctamente.": "Account deleted successfully.",
    # --- admin/services.py ---
    "Esa cuenta no existe o no es de un estudiante.": "That account does not exist or is not a student account.",
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
