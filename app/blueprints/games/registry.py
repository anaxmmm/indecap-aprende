"""
Registro único de los juegos de indecap-aprende.

Cada juego declara su condición objetivo, sus principios DUA, las regiones
cerebrales que trabaja y la configuración de sus niveles. El nivel de apoyo
(pistas, tiempo, repeticiones) es un AJUSTE PEDAGÓGICO calibrado por desempeño,
nunca un instrumento diagnóstico (metodología DUA del proyecto).

NOTA: "levels" indica cuántos niveles tiene el juego en total. Todos los
juegos del módulo ya están ampliados de 10-14 a 50 niveles (5 Stages de 10:
Base/Media/Alta/Muy Alta/Súper Difícil).

"has_stage_map": True marca los juegos que, además de la selección de nivel
simple, tienen una pantalla previa de "Etapas" (5 Stages de 10 niveles cada
uno) — los 8 juegos del módulo, con 50 niveles cada uno.
"""

import unicodedata

from flask_babel import lazy_gettext as _l


GAMES = {
    "discalculia_mercado": {
        "slug": "discalculia_mercado",
        "name": _l("Mercado Espacial"),
        "condition": _l("Discalculia"),
        "core_skill": _l("Sentido numérico y correspondencia cantidad-símbolo"),
        "brain_regions": [
            _l("Surco intraparietal (representación de magnitud)"),
            _l("Corteza parietal posterior (recta numérica mental)"),
            _l("Corteza prefrontal dorsolateral (memoria de trabajo)"),
        ],
        "dua": {
            "representacion": _l("Cada reto se presenta en tres formatos: objetos concretos, apoyo pictórico y símbolo numérico, con narración opcional por voz."),
            "accion_expresion": _l("Responde tocando, con teclado (flechas + Enter) o arrastrando; nunca se exige escritura numérica."),
            "implicacion": _l("Narrativa de mercado espacial, progresión por niveles, reintentos sin castigo y refuerzo positivo inmediato."),
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
        "name": _l("El Enigma Lingüístico"),
        "condition": _l("Discapacidad auditiva"),
        "core_skill": _l("Acceso al lenguaje por canal visual y vibrotáctil"),
        "brain_regions": [
            _l("Corteza occipito-temporal (procesamiento visual del lenguaje)"),
            _l("Área de Broca (estructura sintáctica)"),
            _l("Corteza auditiva reasignada a procesamiento visual (plasticidad cruzada)"),
        ],
        "dua": {
            "representacion": _l("Todo contenido tiene espejo 100% visual: pictogramas, lengua de señas y subtítulos sincronizados."),
            "accion_expresion": _l("Arrastre de pictogramas, selección y reproducción de patrones por vibración o luz."),
            "implicacion": _l("Historias secuenciadas sin dependencia del audio."),
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
        "name": _l("Clasificador de Rutinas"),
        "condition": _l("Discapacidad cognitiva"),
        "core_skill": _l("Generalización funcional y secuencias de pasos simples"),
        "brain_regions": [
            _l("Corteza prefrontal (planificación de secuencias)"),
            _l("Hipocampo (memoria y consolidación)"),
            _l("Ganglios basales (automatización de rutinas)"),
        ],
        "dua": {
            "representacion": _l("Un solo criterio por pantalla, sin distractores, con imagen + icono + voz."),
            "accion_expresion": _l("Arrastre de tarjetas y toque único."),
            "implicacion": _l("Situaciones de la vida real y retirada gradual de ayudas (scaffolding)."),
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
        "name": _l("Eco-Explorador Sonoro"),
        "condition": _l("Discapacidad visual"),
        "core_skill": _l("Aprendizaje por canal auditivo y háptico"),
        "brain_regions": [
            _l("Corteza auditiva primaria y secundaria"),
            _l("Corteza parietal posterior (orientación espacial)"),
            _l("Corteza occipital con plasticidad cruzada (lectura háptica)"),
        ],
        "dua": {
            "representacion": _l("Audio descriptivo enriquecido, compatibilidad total con lector de pantalla y alto contraste para baja visión residual."),
            "accion_expresion": _l("Botones grandes de alto contraste, navegación por teclado y respuesta por voz."),
            "implicacion": _l("Aventura narrada con decisiones."),
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
        "name": _l("El Detector de Letras Rebeldes"),
        "condition": _l("Dislexia"),
        "core_skill": _l("Ruta de acceso al léxico (fonológica y visual)"),
        "brain_regions": [
            _l("Giro temporal superior (procesamiento fonológico)"),
            _l("Área de la forma visual de las palabras, giro fusiforme izquierdo"),
            _l("Giro frontal inferior (articulación y decodificación)"),
        ],
        "dua": {
            "representacion": _l("Texto con tipografía legible, resaltado sílaba a sílaba y narración sincronizada."),
            "accion_expresion": _l("Trazado con dedo o lápiz óptico, teclado y selección."),
            "implicacion": _l("Progresión en cuatro modalidades de lectura según desempeño."),
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
        "name": _l("Misión Ritmo y Enfoque"),
        "condition": _l("TDAH"),
        "core_skill": _l("Funciones ejecutivas"),
        "brain_regions": [
            _l("Corteza prefrontal dorsolateral (memoria de trabajo y planificación)"),
            _l("Cingulado anterior (control atencional)"),
            _l("Corteza orbitofrontal y estriado (control inhibitorio)"),
        ],
        "dua": {
            "representacion": _l("Consignas breves, un foco visual por pantalla y recordatorio persistente de la meta."),
            "accion_expresion": _l("Toque rápido, arrastre y secuencias tipo go/no-go."),
            "implicacion": _l("Retos cronometrados con descansos activos intercalados."),
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
        "name": _l("El Arquitecto del Mundo"),
        "condition": _l("Trastorno opositor desafiante"),
        "core_skill": _l("Autorregulación emocional y conductual"),
        "brain_regions": [
            _l("Corteza prefrontal ventromedial (regulación emocional)"),
            _l("Amígdala (reactividad emocional)"),
            _l("Cingulado anterior (detección de conflicto)"),
        ],
        "dua": {
            "representacion": _l("Escenas ilustradas con termómetro emocional y semáforo de la calma."),
            "accion_expresion": _l("Elección de respuesta, autoinstrucciones y espera activa."),
            "implicacion": _l("Economía de fichas con refuerzo positivo, nunca punitivo."),
        },
        "levels": 50,
        "has_stage_map": True,
        "stage_size": 10,
        "asset_path": "js/games/tod_arquitecto/game.js",
        "keywords": ["opositor", "desafiante", "tod", "conducta"],
        "available": True,
    },
    "tea_senales": {
        "slug": "tea_senales",
        "name": _l("La Estación de las Señales"),
        "condition": _l("Trastorno del espectro autista"),
        "core_skill": _l("Predictibilidad, comunicación social y flexibilidad"),
        "brain_regions": [
            _l("Surco temporal superior (percepción social)"),
            _l("Giro fusiforme (reconocimiento facial)"),
            _l("Corteza prefrontal medial (teoría de la mente)"),
        ],
        "dua": {
            "representacion": _l("Agenda visual siempre visible, anticipación de cada cambio y control sensorial permanente."),
            "accion_expresion": _l("Arrastre, selección y respuestas cerradas sin presión de tiempo."),
            "implicacion": _l("Rutina estable con intereses configurables por el docente."),
        },
        "levels": 50,
        "has_stage_map": True,
        "stage_size": 10,
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
