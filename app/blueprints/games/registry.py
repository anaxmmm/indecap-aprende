"""
Registro único de los juegos de indecap-aprende.

Cada juego declara su condición objetivo, sus principios DUA, las regiones
cerebrales que trabaja y la configuración de sus niveles. El nivel de apoyo
(pistas, tiempo, repeticiones) es un AJUSTE PEDAGÓGICO calibrado por desempeño,
nunca un instrumento diagnóstico (metodología DUA del proyecto).

NOTA: "levels" indica cuántos niveles tiene el juego en total. Se está
ampliando cada juego de 10 a 50 niveles (5 Stages de 10: Base/Media/Alta/
Muy Alta/Súper Difícil), juego por juego.

"has_stage_map": True marca los juegos que, además de la selección de nivel
simple, tienen una pantalla previa de "Etapas" (5 Stages de 10 niveles cada
uno) — discalculia_mercado, dislexia_letras, tdah_ritmo, auditiva_enigma,
cognitiva_rutinas y visual_eco por ahora, con 50 niveles cada uno.
"""

import unicodedata


GAMES = {
    "discalculia_mercado": {
        "slug": "discalculia_mercado",
        "name": "Mercado Espacial",
        "condition": "Discalculia",
        "core_skill": "Sentido numérico y correspondencia cantidad-símbolo",
        "brain_regions": [
            "Surco intraparietal (representación de magnitud)",
            "Corteza parietal posterior (recta numérica mental)",
            "Corteza prefrontal dorsolateral (memoria de trabajo)",
        ],
        "dua": {
            "representacion": "Cada reto se presenta en tres formatos: objetos concretos, apoyo pictórico y símbolo numérico, con narración opcional por voz.",
            "accion_expresion": "Responde tocando, con teclado (flechas + Enter) o arrastrando; nunca se exige escritura numérica.",
            "implicacion": "Narrativa de mercado espacial, progresión por niveles, reintentos sin castigo y refuerzo positivo inmediato.",
        },
        "levels": 50,
        "has_stage_map": True,
        "stage_size": 10,
        "asset_path": "js/games/discalculia_mercado/game.js",
        "keywords": ["discalculia", "calculo", "matematica"],
        "available": True,
    },
    "auditiva_enigma": {
        "slug": "auditiva_enigma",
        "name": "El Enigma Lingüístico",
        "condition": "Discapacidad auditiva",
        "core_skill": "Acceso al lenguaje por canal visual y vibrotáctil",
        "brain_regions": [
            "Corteza occipito-temporal (procesamiento visual del lenguaje)",
            "Área de Broca (estructura sintáctica)",
            "Corteza auditiva reasignada a procesamiento visual (plasticidad cruzada)",
        ],
        "dua": {
            "representacion": "Todo contenido tiene espejo 100% visual: pictogramas, lengua de señas y subtítulos sincronizados.",
            "accion_expresion": "Arrastre de pictogramas, selección y reproducción de patrones por vibración o luz.",
            "implicacion": "Historias secuenciadas sin dependencia del audio.",
        },
        "levels": 50,
        "has_stage_map": True,
        "stage_size": 10,
        "asset_path": "js/games/auditiva_enigma/game.js",
        "keywords": ["auditiva", "sordera", "hipoacusia"],
        "available": True,
    },
    "cognitiva_rutinas": {
        "slug": "cognitiva_rutinas",
        "name": "Clasificador de Rutinas",
        "condition": "Discapacidad cognitiva",
        "core_skill": "Generalización funcional y secuencias de pasos simples",
        "brain_regions": [
            "Corteza prefrontal (planificación de secuencias)",
            "Hipocampo (memoria y consolidación)",
            "Ganglios basales (automatización de rutinas)",
        ],
        "dua": {
            "representacion": "Un solo criterio por pantalla, sin distractores, con imagen + icono + voz.",
            "accion_expresion": "Arrastre de tarjetas y toque único.",
            "implicacion": "Situaciones de la vida real y retirada gradual de ayudas (scaffolding).",
        },
        "levels": 50,
        "has_stage_map": True,
        "stage_size": 10,
        "asset_path": "js/games/cognitiva_rutinas/game.js",
        "keywords": ["cognitiva", "intelectual", "comprension"],
        "available": True,
    },
    "visual_eco": {
        "slug": "visual_eco",
        "name": "Eco-Explorador Sonoro",
        "condition": "Discapacidad visual",
        "core_skill": "Aprendizaje por canal auditivo y háptico",
        "brain_regions": [
            "Corteza auditiva primaria y secundaria",
            "Corteza parietal posterior (orientación espacial)",
            "Corteza occipital con plasticidad cruzada (lectura háptica)",
        ],
        "dua": {
            "representacion": "Audio descriptivo enriquecido, compatibilidad total con lector de pantalla y alto contraste para baja visión residual.",
            "accion_expresion": "Botones grandes de alto contraste, navegación por teclado y respuesta por voz.",
            "implicacion": "Aventura narrada con decisiones.",
        },
        "levels": 50,
        "has_stage_map": True,
        "stage_size": 10,
        "asset_path": "js/games/visual_eco/game.js",
        "keywords": ["visual", "ceguera", "baja vision"],
        "available": True,
    },
    "dislexia_letras": {
        "slug": "dislexia_letras",
        "name": "El Detector de Letras Rebeldes",
        "condition": "Dislexia",
        "core_skill": "Ruta de acceso al léxico (fonológica y visual)",
        "brain_regions": [
            "Giro temporal superior (procesamiento fonológico)",
            "Área de la forma visual de las palabras, giro fusiforme izquierdo",
            "Giro frontal inferior (articulación y decodificación)",
        ],
        "dua": {
            "representacion": "Texto con tipografía legible, resaltado sílaba a sílaba y narración sincronizada.",
            "accion_expresion": "Trazado con dedo o lápiz óptico, teclado y selección.",
            "implicacion": "Progresión en cuatro modalidades de lectura según desempeño.",
        },
        "levels": 50,
        "has_stage_map": True,
        "stage_size": 10,
        "asset_path": "js/games/dislexia_letras/game.js",
        "keywords": ["dislexia", "lectura"],
        "available": True,
    },
    "tdah_ritmo": {
        "slug": "tdah_ritmo",
        "name": "Misión Ritmo y Enfoque",
        "condition": "TDAH",
        "core_skill": "Funciones ejecutivas",
        "brain_regions": [
            "Corteza prefrontal dorsolateral (memoria de trabajo y planificación)",
            "Cingulado anterior (control atencional)",
            "Corteza orbitofrontal y estriado (control inhibitorio)",
        ],
        "dua": {
            "representacion": "Consignas breves, un foco visual por pantalla y recordatorio persistente de la meta.",
            "accion_expresion": "Toque rápido, arrastre y secuencias tipo go/no-go.",
            "implicacion": "Retos cronometrados con descansos activos intercalados.",
        },
        "levels": 50,
        "has_stage_map": True,
        "stage_size": 10,
        "asset_path": "js/games/tdah_ritmo/game.js",
        "keywords": ["tdah", "atencion", "hiperactividad"],
        "available": True,
    },
    "tod_arquitecto": {
        "slug": "tod_arquitecto",
        "name": "El Arquitecto del Mundo",
        "condition": "Trastorno opositor desafiante",
        "core_skill": "Autorregulación emocional y conductual",
        "brain_regions": [
            "Corteza prefrontal ventromedial (regulación emocional)",
            "Amígdala (reactividad emocional)",
            "Cingulado anterior (detección de conflicto)",
        ],
        "dua": {
            "representacion": "Escenas ilustradas con termómetro emocional y semáforo de la calma.",
            "accion_expresion": "Elección de respuesta, autoinstrucciones y espera activa.",
            "implicacion": "Economía de fichas con refuerzo positivo, nunca punitivo.",
        },
        "levels": 10,
        "asset_path": "js/games/tod_arquitecto/game.js",
        "keywords": ["opositor", "desafiante", "tod", "conducta"],
        "available": True,
    },
    "tea_senales": {
        "slug": "tea_senales",
        "name": "La Estación de las Señales",
        "condition": "Trastorno del espectro autista",
        "core_skill": "Predictibilidad, comunicación social y flexibilidad",
        "brain_regions": [
            "Surco temporal superior (percepción social)",
            "Giro fusiforme (reconocimiento facial)",
            "Corteza prefrontal medial (teoría de la mente)",
        ],
        "dua": {
            "representacion": "Agenda visual siempre visible, anticipación de cada cambio y control sensorial permanente.",
            "accion_expresion": "Arrastre, selección y respuestas cerradas sin presión de tiempo.",
            "implicacion": "Rutina estable con intereses configurables por el docente.",
        },
        "levels": 10,
        "asset_path": "js/games/tea_senales/game.js",
        "keywords": ["tea", "autismo", "espectro"],
        "available": True,
    },
}


def _normalize(text: str) -> str:
    """Minúsculas y sin tildes, para emparejar nombres de trastorno del admin."""
    if not text:
        return ""
    nfkd = unicodedata.normalize("NFKD", str(text))
    sin_tildes = "".join(c for c in nfkd if not unicodedata.combining(c))
    return sin_tildes.lower().strip()


def get_game(slug: str):
    """Devuelve la definición de un juego o None."""
    return GAMES.get(slug)


def get_game_for_trastorno(trastorno) -> dict | None:
    """
    Resuelve qué juego corresponde a un Trastorno del panel de administración.

    Se emparejan por palabras clave y no por id, para que el administrador
    pueda renombrar o recrear trastornos sin romper el enlace al juego.
    """
    if trastorno is None:
        return None
    nombre = _normalize(getattr(trastorno, "name", ""))
    slug_directo = _normalize(getattr(trastorno, "slug", ""))

    for game in GAMES.values():
        if slug_directo and slug_directo == game["slug"]:
            return game
        for keyword in game["keywords"]:
            if keyword in nombre:
                return game
    return None
