"""
Registry de juegos: rellena el catalogo de ingles con los nombres, la
condicion, la habilidad nucleo, las regiones cerebrales y los principios DUA
de los 8 juegos, y compila el messages.mo.

Uso (desde la raiz del proyecto, con el entorno virtual activo):
    python i18n_registry.py
"""
from babel.messages.pofile import read_po, write_po
from babel.messages.mofile import write_mo

PO_PATH = "app/translations/en/LC_MESSAGES/messages.po"
MO_PATH = "app/translations/en/LC_MESSAGES/messages.mo"

TRANSLATIONS = {
    # --- discalculia_mercado ---
    "Mercado Espacial": "Space Market",
    "Sentido numérico y correspondencia cantidad-símbolo": "Number sense and quantity-symbol correspondence",
    "Surco intraparietal (representación de magnitud)": "Intraparietal sulcus (magnitude representation)",
    "Corteza parietal posterior (recta numérica mental)": "Posterior parietal cortex (mental number line)",
    "Corteza prefrontal dorsolateral (memoria de trabajo)": "Dorsolateral prefrontal cortex (working memory)",
    "Cada reto se presenta en tres formatos: objetos concretos, apoyo pictórico y símbolo numérico, con narración opcional por voz.": "Each challenge is presented in three formats: concrete objects, pictorial support and numeric symbol, with optional voice narration.",
    "Responde tocando, con teclado (flechas + Enter) o arrastrando; nunca se exige escritura numérica.": "Respond by tapping, with the keyboard (arrows + Enter) or by dragging; numeric writing is never required.",
    "Narrativa de mercado espacial, progresión por niveles, reintentos sin castigo y refuerzo positivo inmediato.": "Space market storyline, level progression, retries without penalty and immediate positive reinforcement.",
    # --- auditiva_enigma ---
    "El Enigma Lingüístico": "The Linguistic Enigma",
    "Acceso al lenguaje por canal visual y vibrotáctil": "Access to language through the visual and vibrotactile channel",
    "Corteza occipito-temporal (procesamiento visual del lenguaje)": "Occipito-temporal cortex (visual language processing)",
    "Área de Broca (estructura sintáctica)": "Broca's area (syntactic structure)",
    "Corteza auditiva reasignada a procesamiento visual (plasticidad cruzada)": "Auditory cortex reassigned to visual processing (cross-modal plasticity)",
    "Todo contenido tiene espejo 100% visual: pictogramas, lengua de señas y subtítulos sincronizados.": "All content has a 100% visual mirror: pictograms, sign language and synchronized captions.",
    "Arrastre de pictogramas, selección y reproducción de patrones por vibración o luz.": "Pictogram dragging, selection and playback of patterns by vibration or light.",
    "Historias secuenciadas sin dependencia del audio.": "Sequenced stories with no dependence on audio.",
    # --- cognitiva_rutinas ---
    "Clasificador de Rutinas": "Routine Sorter",
    "Generalización funcional y secuencias de pasos simples": "Functional generalization and simple step sequences",
    "Corteza prefrontal (planificación de secuencias)": "Prefrontal cortex (sequence planning)",
    "Hipocampo (memoria y consolidación)": "Hippocampus (memory and consolidation)",
    "Ganglios basales (automatización de rutinas)": "Basal ganglia (routine automation)",
    "Un solo criterio por pantalla, sin distractores, con imagen + icono + voz.": "A single criterion per screen, no distractors, with image + icon + voice.",
    "Arrastre de tarjetas y toque único.": "Card dragging and single tap.",
    "Situaciones de la vida real y retirada gradual de ayudas (scaffolding).": "Real-life situations and gradual withdrawal of supports (scaffolding).",
    # --- visual_eco ---
    "Eco-Explorador Sonoro": "Sound Eco-Explorer",
    "Aprendizaje por canal auditivo y háptico": "Learning through the auditory and haptic channel",
    "Corteza auditiva primaria y secundaria": "Primary and secondary auditory cortex",
    "Corteza parietal posterior (orientación espacial)": "Posterior parietal cortex (spatial orientation)",
    "Corteza occipital con plasticidad cruzada (lectura háptica)": "Occipital cortex with cross-modal plasticity (haptic reading)",
    "Audio descriptivo enriquecido, compatibilidad total con lector de pantalla y alto contraste para baja visión residual.": "Enriched audio description, full screen reader compatibility and high contrast for residual low vision.",
    "Botones grandes de alto contraste, navegación por teclado y respuesta por voz.": "Large high-contrast buttons, keyboard navigation and voice response.",
    "Aventura narrada con decisiones.": "Narrated adventure with decisions.",
    # --- dislexia_letras ---
    "El Detector de Letras Rebeldes": "The Rebel Letter Detector",
    "Ruta de acceso al léxico (fonológica y visual)": "Lexical access route (phonological and visual)",
    "Giro temporal superior (procesamiento fonológico)": "Superior temporal gyrus (phonological processing)",
    "Área de la forma visual de las palabras, giro fusiforme izquierdo": "Visual word form area, left fusiform gyrus",
    "Giro frontal inferior (articulación y decodificación)": "Inferior frontal gyrus (articulation and decoding)",
    "Texto con tipografía legible, resaltado sílaba a sílaba y narración sincronizada.": "Text with legible typography, syllable-by-syllable highlighting and synchronized narration.",
    "Trazado con dedo o lápiz óptico, teclado y selección.": "Tracing with finger or stylus, keyboard and selection.",
    "Progresión en cuatro modalidades de lectura según desempeño.": "Progression through four reading modes according to performance.",
    # --- tdah_ritmo ---
    "Misión Ritmo y Enfoque": "Rhythm and Focus Mission",
    "Funciones ejecutivas": "Executive functions",
    "Corteza prefrontal dorsolateral (memoria de trabajo y planificación)": "Dorsolateral prefrontal cortex (working memory and planning)",
    "Cingulado anterior (control atencional)": "Anterior cingulate (attentional control)",
    "Corteza orbitofrontal y estriado (control inhibitorio)": "Orbitofrontal cortex and striatum (inhibitory control)",
    "Consignas breves, un foco visual por pantalla y recordatorio persistente de la meta.": "Short instructions, one visual focus per screen and a persistent reminder of the goal.",
    "Toque rápido, arrastre y secuencias tipo go/no-go.": "Quick tap, dragging and go/no-go type sequences.",
    "Retos cronometrados con descansos activos intercalados.": "Timed challenges with active breaks in between.",
    # --- tod_arquitecto ---
    "El Arquitecto del Mundo": "The World Architect",
    "Autorregulación emocional y conductual": "Emotional and behavioral self-regulation",
    "Corteza prefrontal ventromedial (regulación emocional)": "Ventromedial prefrontal cortex (emotional regulation)",
    "Amígdala (reactividad emocional)": "Amygdala (emotional reactivity)",
    "Cingulado anterior (detección de conflicto)": "Anterior cingulate (conflict detection)",
    "Escenas ilustradas con termómetro emocional y semáforo de la calma.": "Illustrated scenes with an emotional thermometer and a calm traffic light.",
    "Elección de respuesta, autoinstrucciones y espera activa.": "Choosing a response, self-instructions and active waiting.",
    "Economía de fichas con refuerzo positivo, nunca punitivo.": "Token economy with positive, never punitive, reinforcement.",
    # --- tea_senales ---
    "La Estación de las Señales": "The Signal Station",
    "Trastorno del espectro autista": "Autism spectrum disorder",
    "Predictibilidad, comunicación social y flexibilidad": "Predictability, social communication and flexibility",
    "Surco temporal superior (percepción social)": "Superior temporal sulcus (social perception)",
    "Giro fusiforme (reconocimiento facial)": "Fusiform gyrus (face recognition)",
    "Corteza prefrontal medial (teoría de la mente)": "Medial prefrontal cortex (theory of mind)",
    "Agenda visual siempre visible, anticipación de cada cambio y control sensorial permanente.": "Always-visible visual schedule, anticipation of every change and permanent sensory control.",
    "Arrastre, selección y respuestas cerradas sin presión de tiempo.": "Dragging, selection and closed-ended answers with no time pressure.",
    "Rutina estable con intereses configurables por el docente.": "Stable routine with interests configurable by the teacher.",
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
            continue  # plurales: ya resueltos en lotes anteriores
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
