"""
Fase 2 de i18n: rellena el catalogo de ingles (messages.po) con las
traducciones de home.html y compila el messages.mo.

Uso (desde la raiz del proyecto, con el entorno virtual activo):
    python i18n_fase2.py
"""
from babel.messages.pofile import read_po, write_po
from babel.messages.mofile import write_mo

PO_PATH = "app/translations/en/LC_MESSAGES/messages.po"
MO_PATH = "app/translations/en/LC_MESSAGES/messages.mo"

TRANSLATIONS = {
    # --- Cabecera y navegacion ---
    "indecap-aprende · Aprende de una forma que se adapte a ti": "indecap-aprende · Learn in a way that adapts to you",
    "Plataforma educativa inclusiva que adapta actividades, accesibilidad y apoyos a diferentes formas de aprender. Proyecto de INDECAP.": "Inclusive educational platform that adapts activities, accessibility and supports to different ways of learning. An INDECAP project.",
    "Navegación principal": "Main navigation",
    "Ir al inicio": "Go to home",
    "Experiencia": "Experience",
    "Necesidades de apoyo": "Support needs",
    "Cómo funciona": "How it works",
    "Metodología": "Methodology",
    "Quiénes somos": "About us",
    "Cambiar idioma": "Change language",
    "Acceder": "Sign in",
    "Abrir menú": "Open menu",
    "Cerrar menú": "Close menu",
    # --- Portada ---
    "APRENDE DE UNA FORMA": "LEARN",
    "INTUITIVA": "INTUITIVELY",
    "Una plataforma educativa inclusiva que adapta actividades, accesibilidad y apoyos a diferentes formas de aprender.": "An inclusive educational platform that adapts activities, accessibility and supports to different ways of learning.",
    "Conoce indecap-aprende": "Discover indecap-aprende",
    # --- Experiencia ---
    "Una experiencia para todos": "An experience for everyone",
    "El contenido se adapta a cada estudiante, teniendo en cuenta las barreras de acceso, es inclusivo en su interacción y diseño para el correcto acompañamiento de sus procesos.": "The content adapts to each student, taking access barriers into account, and is inclusive in its interaction and design to properly support their learning processes.",
    "La constancia es la clave del éxito.": "Consistency is the key to success.",
    # --- Necesidades de apoyo ---
    "Dislexia": "Dyslexia",
    "Facilita la lectura mediante apoyo auditivo, resaltado de palabras y contenido estructurado.": "Makes reading easier through audio support, word highlighting and structured content.",
    "Discalculia": "Dyscalculia",
    "Convierte los conceptos numéricos en experiencias visuales, concretas y fáciles de comprender.": "Turns number concepts into visual, concrete experiences that are easy to understand.",
    "TDAH": "ADHD",
    "Actividades breves y estructuradas que facilitan la concentración, la organización y el seguimiento de cada objetivo.": "Short, structured activities that support focus, organization and tracking of each goal.",
    "TEA": "ASD",
    "Entornos predecibles, instrucciones claras y una experiencia visual organizada para facilitar la interacción.": "Predictable environments, clear instructions and an organized visual experience to make interaction easier.",
    "TOD": "ODD",
    "Trastorno opositor desafiante": "Oppositional defiant disorder",
    "Actividades que promueven la autonomía, la toma de decisiones y una participación activa en el aprendizaje.": "Activities that promote autonomy, decision-making and active participation in learning.",
    "Discapacidad visual": "Visual impairment",
    "Acceso al contenido mediante navegación por teclado, lectores de pantalla y opciones de contraste.": "Access to content through keyboard navigation, screen readers and contrast options.",
    "Aud": "Hear",
    "Discapacidad auditiva": "Hearing impairment",
    "Contenido accesible mediante subtítulos, recursos visuales y materiales audiovisuales adaptados.": "Accessible content through captions, visual resources and adapted audiovisual materials.",
    "Discapacidad cognitiva": "Cognitive disability",
    "Contenidos simplificados, instrucciones claras y actividades estructuradas para facilitar la comprensión y participación.": "Simplified content, clear instructions and structured activities to support understanding and participation.",
    # --- Como funciona ---
    "Registro y configuración": "Registration and setup",
    "El docente registra al estudiante y configura el plan de entrenamiento según sus necesidades.": "The teacher registers the student and sets up the training plan according to their needs.",
    "Asignación de actividades": "Activity assignment",
    "El docente asigna las necesidades de apoyo y los juegos correspondientes desde el panel institucional.": "The teacher assigns the support needs and the matching games from the institutional panel.",
    "El estudiante juega y aprende": "The student plays and learns",
    "El estudiante ingresa a su panel, consulta sus actividades y desarrolla los juegos asignados a su propio ritmo.": "The student signs in to their dashboard, checks their activities and plays the assigned games at their own pace.",
    "Seguimiento del progreso": "Progress tracking",
    "Cada actividad realizada genera información sobre el avance del estudiante.": "Every completed activity generates information about the student's progress.",
    "Acompañamiento docente": "Teacher support",
    "El docente consulta sesiones, actividades y progreso desde su dashboard para hacer seguimiento al proceso.": "The teacher reviews sessions, activities and progress from their dashboard to follow the process.",
    # --- Metodologia (DUA) ---
    "Diseño Universal para el Aprendizaje (DUA)": "Universal Design for Learning (UDL)",
    "Representar": "Represent",
    "¿Cómo recibe la información?": "How do they receive information?",
    "Texto, audio, imágenes, elementos visuales y contenido estructurado.": "Text, audio, images, visual elements and structured content.",
    "Actuar y expresar": "Act and express",
    "¿Cómo interactúa con lo aprendido?": "How do they interact with what they have learned?",
    "Diferentes formas de responder, navegar y completar actividades.": "Different ways to respond, navigate and complete activities.",
    "Participar": "Engage",
    "¿Cómo se involucra en el proceso?": "How do they get involved in the process?",
    "Opciones de apoyo, estructura, autonomía y motivación.": "Support options, structure, autonomy and motivation.",
    # --- Quienes somos ---
    "INDECAP-APRENDE nace como proyecto de grado para el programa de Desarrollo de Software de INDECAP en Envigado, Antioquia, Colombia. Fue diseñado a partir de las necesidades identificadas en el contexto educativo de la institución, con la participación del área de psicología.": "INDECAP-APRENDE was born as a graduation project for the Software Development program at INDECAP in Envigado, Antioquia, Colombia. It was designed from the needs identified in the institution's educational context, with the participation of the psychology department.",
    "Institución educativa": "Educational institution",
    "Contexto, necesidades y acompañamiento": "Context, needs and support",
    "Sede INDECAP Envigado": "INDECAP Envigado campus",
    "Sede Envigado": "Envigado campus",
    "Facebook de INDECAP": "INDECAP on Facebook",
    "Instagram de INDECAP": "INDECAP on Instagram",
    "YouTube de INDECAP": "INDECAP on YouTube",
    "Desarrollado por Ana Melo": "Developed by Ana Melo",
    "Desarrolladora de software · INDECAP": "Software developer · INDECAP",
    "LinkedIn de Ana Melo": "Ana Melo on LinkedIn",
    "GitHub de Ana Melo": "Ana Melo on GitHub",
    # --- Pie de pagina ---
    "Calidad Educativa Certificada": "Certified Educational Quality",
    "Contacto": "Contact",
    "Proyecto de grado": "Graduation project",
    # --- Panel de acceso ---
    "Acceso a indecap-aprende": "Sign in to indecap-aprende",
    "Cerrar": "Close",
    "Ingresa a tu cuenta": "Sign in to your account",
    "Tipo de acceso": "Access type",
    "Estudiante": "Student",
    "Docente": "Teacher",
    "Tu contraseña": "Your password",
    "Ingresar": "Sign in",
    "¿Olvidaste tu contraseña?": "Forgot your password?",
    "Regístrate": "Sign up",
    "¿Problemas para ingresar? Contacta a tu docente o al administrador.": "Having trouble signing in? Contact your teacher or the administrator.",
    "Crea tu cuenta": "Create your account",
    "Nombre y apellidos": "First and last name",
    "Mínimo 8 caracteres": "At least 8 characters",
    "Repite tu contraseña": "Repeat your password",
    "Crear cuenta": "Create account",
    "¿Ya tienes cuenta? Inicia sesión": "Already have an account? Sign in",
    "Recuperar contraseña": "Reset password",
    "Te enviaremos instrucciones a tu correo.": "We will send instructions to your email.",
    "Enviar enlace": "Send link",
    "Volver a inicio de sesión": "Back to sign in",
}


def main():
    with open(PO_PATH, "rb") as f:
        catalog = read_po(f, locale="en")

    usados = set()
    pendientes = []

    for message in catalog:
        if not message.id:
            continue  # cabecera del catalogo
        if message.id in TRANSLATIONS:
            message.string = TRANSLATIONS[message.id]
            message.flags.discard("fuzzy")
            usados.add(message.id)
        elif not message.string:
            pendientes.append(message.id)

    with open(PO_PATH, "wb") as f:
        write_po(f, catalog)
    with open(MO_PATH, "wb") as f:
        write_mo(f, catalog)

    print("Traducciones aplicadas:", len(usados))

    sobrantes = [k for k in TRANSLATIONS if k not in usados]
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
