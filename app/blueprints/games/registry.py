"""
Registro único de los juegos de indecap-aprende.

Cada juego declara su condición objetivo, sus principios DUA, las habilidades
que practica y su estructura. El nivel de apoyo (pistas, tiempo, repeticiones)
es un ajuste pedagógico calibrado por desempeño, nunca un instrumento
diagnóstico.

Estructura: 5 niveles (Base, Media, Alta, Muy Alta, Súper Difícil) con 10
actividades cada uno. Internamente cada actividad tiene un número continuo
del 1 al 50 ("levels" es el total de actividades y "stage_size" las
actividades por nivel); así el progreso guardado y el desbloqueo no cambian.
"plan" (opcional) da el tema de cada nivel y el nombre de cada actividad.
"""

import json
import os
import unicodedata

from flask import current_app
from flask_babel import get_locale, gettext as _, lazy_gettext as _l


LEVEL_NAMES = [_l("Base"), _l("Media"), _l("Alta"), _l("Muy Alta"), _l("Súper Difícil")]


GAMES = {
    "discalculia_mercado": {
        "slug": "discalculia_mercado",
        "name": _l("Mercado Espacial"),
        "condition": _l("Discalculia"),
        "core_skill": _l("Sentido numérico y su uso en situaciones de la vida diaria"),
        "skills": [
            _l("Reconocer cantidades sin contar uno a uno"),
            _l("Ubicar y comparar números en la recta numérica"),
            _l("Resolver cálculos y problemas con dinero y tiempo"),
        ],
        "dua": {
            "representacion": _l("Cada reto se presenta en tres formatos: objetos concretos, apoyo pictórico y símbolo numérico, con narración opcional por voz."),
            "accion_expresion": _l("Responde eligiendo, escribiendo en un teclado numérico grande, ordenando, emparejando o moviendo un control en la recta; todo funciona también con teclado."),
            "implicacion": _l("Situaciones reales con pesos colombianos, cinco retos por actividad que suben de dificultad, reintentos sin castigo y retroalimentación de qué reforzar."),
        },
        "levels": 50,
        "has_stage_map": True,
        "stage_size": 10,
        "plan": [
            {"theme": _l("Sentido numérico"), "activities": [
                _l("Contar de un vistazo"), _l("¿Dónde hay más?"), _l("Ordenar números"),
                _l("Decenas y unidades"), _l("La recta numérica"), _l("Sumas"), _l("Restas"),
                _l("Secuencias"), _l("Contar monedas"), _l("Pares e impares"),
            ]},
            {"theme": _l("Valor posicional y operaciones"), "activities": [
                _l("Comparar números de tres cifras"), _l("Valor de cada cifra"),
                _l("Ordenar números de tres cifras"), _l("Sumas llevando"),
                _l("Restas prestando"), _l("Grupos iguales"),
                _l("Repartir en partes iguales"), _l("Leer la hora"), _l("Fracciones"),
                _l("Encuentra el error"),
            ]},
            {"theme": _l("Dinero y tiempo"), "activities": [
                _l("Billetes y monedas"), _l("¿Cuánto me falta?"),
                _l("Calcular las vueltas"), _l("Compras de varios productos"),
                _l("Descuentos"), _l("Precio por unidad"), _l("La hora exacta"),
                _l("¿A qué hora termina?"), _l("Estimar antes de calcular"),
                _l("Equivalencias de dinero"),
            ]},
            {"theme": _l("Razonamiento aplicado"), "activities": [
                _l("Recta numérica hasta 1.000"), _l("Secuencias con reglas complejas"),
                _l("Fracciones y porcentajes"), _l("Convertir medidas"), _l("Leer tablas"),
                _l("Presupuesto"), _l("Promedio de notas"), _l("Regla de tres"),
                _l("Interés simple"), _l("¿Más o menos que…?"),
            ]},
            {"theme": _l("Problemas de varios pasos"), "activities": [
                _l("Operaciones combinadas"), _l("Aumentos y descuentos"),
                _l("Planear la tarde"), _l("¿Qué oferta conviene?"), _l("Proporciones"),
                _l("La nota que necesito"), _l("Presupuesto mensual"), _l("Meta de ahorro"),
                _l("Encuentra el error en la compra"), _l("Compra completa"),
            ]},
        ],
        "asset_path": "js/games/discalculia_mercado/game.js",
        "keywords": ["discalculia", "calculo", "matematica"],
        "available": True,
    },
    "auditiva_enigma": {
        "slug": "auditiva_enigma",
        "name": _l("El Enigma Lingüístico"),
        "condition": _l("Discapacidad auditiva"),
        "core_skill": _l("Acceso al lenguaje por canal visual y vibrotáctil"),
        "skills": [
            _l("Comprender vocabulario y frases con apoyo visual"),
            _l("Ordenar palabras para formar frases correctas"),
            _l("Seguir historias y diálogos con subtítulos"),
        ],
        "dua": {
            "representacion": _l("Todo contenido tiene espejo visual: dibujos, palabras escritas, subtítulos y luces. Los videos en Lengua de Señas Colombiana se agregan cuando un intérprete los valida."),
            "accion_expresion": _l("Arrastre de pictogramas, selección y reproducción de patrones por vibración o luz."),
            "implicacion": _l("Historias secuenciadas sin dependencia del audio."),
        },
        "levels": 50,
        "has_stage_map": True,
        "stage_size": 10,
        "plan": [
            {"theme": _l("Ver y nombrar"), "activities": [
                _l("Dibujo y palabra"), _l("Ordena la historia"), _l("Construye la oración"),
                _l("Ritmo de luz"), _l("Caras y emociones"), _l("Memoria de símbolos"),
                _l("Historia con subtítulos"), _l("Une dibujo y palabra"),
                _l("Une cara y emoción"), _l("Completa el subtítulo"),
            ]},
            {"theme": _l("Lenguaje de la vida diaria"), "activities": [
                _l("Palabras de la vida adulta"), _l("Historias de la vida adulta"),
                _l("Oraciones más largas"), _l("Señales que reemplazan sonidos"),
                _l("Emociones sutiles"), _l("Ritmos más largos"), _l("Más símbolos"),
                _l("Subtítulos de la vida adulta"), _l("¿Actuar ya o con calma?"),
                _l("Vocabulario adulto"),
            ]},
            {"theme": _l("Comprensión"), "activities": [
                _l("Palabras de trabajo y trámites"), _l("Oraciones de trabajo"),
                _l("Comprender subtítulos"), _l("Subtítulos de adultos"),
                _l("Señales en casa y trabajo"), _l("Emociones y nombres"),
                _l("Ritmos exigentes"), _l("Símbolos y caras"), _l("Historias sin ayudas"),
                _l("Priorizar alertas"),
            ]},
            {"theme": _l("Integración de habilidades"), "activities": [
                _l("Dominar el vocabulario"), _l("Construir y completar"),
                _l("Historias completas"), _l("Emociones de varias formas"),
                _l("Reaccionar a señales"), _l("Ritmo de experto"), _l("Secuencias largas"),
                _l("Trámites en orden"), _l("Subtítulos difíciles"), _l("Ritmo y memoria"),
            ]},
            {"theme": _l("Autonomía comunicativa"), "activities": [
                _l("Leer y construir frases"), _l("Comprender y ordenar"),
                _l("Señales y emociones"), _l("Ritmo máximo"), _l("Memoria máxima"),
                _l("Vocabulario y emociones"), _l("Oraciones largas"),
                _l("Subtítulos de experto"), _l("Ritmo y memoria de experto"),
                _l("Repaso final"),
            ]},
        ],
        "asset_path": "js/games/auditiva_enigma/game.js",
        "keywords": ["auditiva", "sordera", "hipoacusia"],
        "available": True,
    },
    "cognitiva_rutinas": {
        "slug": "cognitiva_rutinas",
        "name": _l("Clasificador de Rutinas"),
        "condition": _l("Discapacidad cognitiva"),
        "core_skill": _l("Generalización funcional y secuencias de pasos simples"),
        "skills": [
            _l("Clasificar objetos y situaciones por un criterio"),
            _l("Ordenar los pasos de una rutina"),
            _l("Aplicar lo aprendido en situaciones de la vida diaria"),
        ],
        "dua": {
            "representacion": _l("Un solo criterio por pantalla, sin distractores, con imagen + icono + voz."),
            "accion_expresion": _l("Arrastre de tarjetas y toque único."),
            "implicacion": _l("Situaciones de la vida real y retirada gradual de ayudas (scaffolding)."),
        },
        "levels": 50,
        "has_stage_map": True,
        "stage_size": 10,
        "plan": [
            {"theme": _l("Objetos y categorías de la casa"), "activities": [
                _l("¿A qué grupo pertenece?"), _l("Encuentra el igual"),
                _l("Clasificar objetos"), _l("¿Para qué sirve?"), _l("¿Qué pasa si…?"),
                _l("Rutinas de tres pasos"), _l("Une el objeto con su uso"),
                _l("¿Cuál no pertenece?"), _l("Memoria de parejas"),
                _l("Semáforo de decisiones"),
            ]},
            {"theme": _l("Rutinas de la casa y autocuidado"), "activities": [
                _l("Rutinas de cuatro pasos"), _l("¿Qué paso falta?"), _l("Antes y después"),
                _l("Tres grupos de la casa"), _l("Convivir con otros"),
                _l("Consecuencias en la casa"), _l("¿Cuál no pertenece? Avanzado"),
                _l("Memoria con más cartas"), _l("Pasos cambiados de lugar"),
                _l("Seguridad en la casa y la calle"),
            ]},
            {"theme": _l("Dinero y trámites"), "activities": [
                _l("Documentos, dinero y trabajo"), _l("Documentos y sus usos"),
                _l("Trámites de dinero"), _l("¿Necesario o puede esperar?"),
                _l("El paso que falta en un trámite"), _l("Consecuencias con el dinero"),
                _l("El documento para cada trámite"), _l("Leer una factura"),
                _l("Cuidado con los engaños"), _l("El orden de los trámites"),
            ]},
            {"theme": _l("Trabajo y salud"), "activities": [
                _l("Rutinas del trabajo"), _l("Cuidar mi salud"),
                _l("Compañeros, jefes y clientes"), _l("Seguridad en el trabajo"),
                _l("¿Lo hago yo o pido ayuda?"), _l("¿A quién le pido ayuda?"),
                _l("Leer un horario de turnos"), _l("Pasos de trabajo y salud"),
                _l("Consecuencias en el trabajo"), _l("Memoria de la vida adulta"),
            ]},
            {"theme": _l("Vida independiente"), "activities": [
                _l("Planes de cinco pasos"), _l("Errores en un plan"),
                _l("¿Urgente o puede esperar?"), _l("Decidir con tiempo y dinero"),
                _l("El paso que falta en un plan"), _l("Situaciones sociales difíciles"),
                _l("Decisiones seguras"), _l("Lo que necesito en cada caso"),
                _l("¿Me alcanza para pagar?"), _l("Repaso final"),
            ]},
        ],
        "asset_path": "js/games/cognitiva_rutinas/game.js",
        "keywords": ["cognitiva", "intelectual", "comprension"],
        "available": True,
    },
    "visual_eco": {
        "slug": "visual_eco",
        "name": _l("Eco-Explorador Sonoro"),
        "condition": _l("Discapacidad visual"),
        "core_skill": _l("Aprendizaje por canal auditivo y háptico"),
        "skills": [
            _l("Reconocer sonidos y de dónde vienen"),
            _l("Orientarse con indicaciones de dirección"),
            _l("Recordar y seguir instrucciones escuchadas"),
        ],
        "dua": {
            "representacion": _l("Audio descriptivo enriquecido, compatibilidad total con lector de pantalla y alto contraste para baja visión residual."),
            "accion_expresion": _l("Botones grandes de alto contraste, navegación por teclado y respuesta por voz."),
            "implicacion": _l("Aventura narrada con decisiones."),
        },
        "levels": 50,
        "has_stage_map": True,
        "stage_size": 10,
        "plan": [
            {"theme": _l("Escuchar y ubicar"), "activities": [
                _l("¿Qué sonido es?"), _l("¿De dónde viene?"), _l("Memoria de sonidos"),
                _l("El sonido importante"), _l("El faro sonoro"), _l("Dictado de palabras"),
                _l("Rutas con bastón"), _l("Voces y emociones"), _l("Sonido y fuente"),
                _l("¿Alerta o cotidiano?"),
            ]},
            {"theme": _l("Sonidos de la vida diaria"), "activities": [
                _l("Sonidos de casa y trabajo"), _l("Ubicar en la calle y la oficina"),
                _l("Sonidos de la ciudad"), _l("Concentrarse en el ruido"),
                _l("Faro más lejano"), _l("Palabras de la vida adulta"),
                _l("Números cortos"), _l("Moverse solo"), _l("Tonos de voz en el trabajo"),
                _l("Fuentes de sonido"),
            ]},
            {"theme": _l("Transporte y trámites"), "activities": [
                _l("Estaciones y oficinas"), _l("Rutas sonoras"),
                _l("Números de direcciones"), _l("Cruces con tráfico"),
                _l("Secuencias más largas"), _l("Anuncios importantes"),
                _l("Reconocer alertas"), _l("Interpretar el tono"),
                _l("Faro con pocos pasos"), _l("Números de teléfono"),
            ]},
            {"theme": _l("Trabajo e independencia"), "activities": [
                _l("Códigos de seis dígitos"), _l("Rutas al banco y la EPS"),
                _l("Seis sonidos seguidos"), _l("Identificar y ubicar"),
                _l("Priorizar lo importante"), _l("Palabras sin ayudas"),
                _l("Voces y fuentes"), _l("Faro de precisión"),
                _l("Rutinas de independencia"), _l("Teléfonos y códigos"),
            ]},
            {"theme": _l("Integración"), "activities": [
                _l("Cualquier sonido de la ciudad"), _l("Orientarse y planear"),
                _l("Secuencias largas"), _l("Direcciones y teléfonos"),
                _l("Lo importante y el tono"), _l("Faro de experto"),
                _l("Cualquier palabra"), _l("Rutas de mi día"), _l("Alertas rápidas"),
                _l("Repaso final"),
            ]},
        ],
        "asset_path": "js/games/visual_eco/game.js",
        "keywords": ["visual", "ceguera", "baja vision"],
        "available": True,
    },
    "dislexia_letras": {
        "slug": "dislexia_letras",
        "name": _l("El Detector de Letras Rebeldes"),
        "condition": _l("Dislexia"),
        "core_skill": _l("Ruta de acceso al léxico (fonológica y visual)"),
        "skills": [
            _l("Asociar letras con sus sonidos"),
            _l("Leer palabras y frases con fluidez"),
            _l("Escribir y corregir palabras de uso frecuente"),
        ],
        "dua": {
            "representacion": _l("Texto con tipografía legible, resaltado sílaba a sílaba y narración sincronizada."),
            "accion_expresion": _l("Selección, orden de letras y sílabas, clasificación y escritura de lo que se escucha, todo operable con teclado."),
            "implicacion": _l("Lectura al propio ritmo, frase por frase, con textos de la vida adulta y sin castigo por el error."),
        },
        "levels": 50,
        "has_stage_map": True,
        "stage_size": 10,
        "plan": [
            {"theme": _l("Letras, sonidos y sílabas"), "activities": [
                _l("Letras que se confunden"), _l("Completa la palabra"),
                _l("¿Cuál está bien escrita?"), _l("Letras en orden"),
                _l("Sílabas en orden"), _l("Contar sílabas"), _l("Palabras que riman"),
                _l("Lectura frase por frase"), _l("Imagen y palabra"),
                _l("Dictado de palabras"),
            ]},
            {"theme": _l("Palabras de uso diario"), "activities": [
                _l("Palabras del día a día"), _l("Bien escrita: vida adulta"),
                _l("Palabras largas"), _l("Sílabas de palabras largas"),
                _l("La sílaba fuerte"), _l("Agudas, llanas y esdrújulas"),
                _l("Dictado con tildes"), _l("Avisos y mensajes"),
                _l("Reglas de ortografía"), _l("¿Qué significa?"),
            ]},
            {"theme": _l("Ortografía en contexto"), "activities": [
                _l("Suenan igual, se escriben distinto"), _l("Encuentra el error"),
                _l("Corrige escribiendo"), _l("¿Con o sin tilde?"), _l("¿B o V?"),
                _l("Leer con precisión"), _l("Dictado de frases"), _l("Letras difíciles"),
                _l("Familias de palabras"), _l("Formar oraciones"),
            ]},
            {"theme": _l("Textos de la vida adulta"), "activities": [
                _l("Leer instrucciones"), _l("Errores en mensajes de trabajo"),
                _l("Palabras que suenan igual II"), _l("Ordenar un mensaje"),
                _l("Dictado de oraciones"), _l("Acentos avanzados"), _l("¿G o J?"),
                _l("Oraciones largas"), _l("La idea principal"), _l("Abreviaturas"),
            ]},
            {"theme": _l("Lectura y escritura integradas"), "activities": [
                _l("Textos largos"), _l("Corrección escrita"), _l("Domina los homófonos"),
                _l("Mensajes completos"), _l("Dictado largo"), _l("Tildes difíciles"),
                _l("Reglas exigentes"), _l("Resumir textos"),
                _l("Instrucciones y contratos"), _l("Repaso final"),
            ]},
        ],
        "asset_path": "js/games/dislexia_letras/game.js",
        "keywords": ["dislexia", "lectura"],
        "available": True,
    },
    "tdah_ritmo": {
        "slug": "tdah_ritmo",
        "name": _l("Misión Ritmo y Enfoque"),
        "condition": _l("TDAH"),
        "core_skill": _l("Funciones ejecutivas"),
        "skills": [
            _l("Mantener la atención en una tarea"),
            _l("Esperar el momento correcto antes de responder"),
            _l("Recordar secuencias y planear los pasos"),
        ],
        "dua": {
            "representacion": _l("Consignas breves, un foco visual por pantalla y recordatorio persistente de la meta."),
            "accion_expresion": _l("Toque rápido, arrastre y secuencias tipo go/no-go."),
            "implicacion": _l("Retos cronometrados con descansos activos intercalados."),
        },
        "levels": 50,
        "has_stage_map": True,
        "stage_size": 10,
        "plan": [
            {"theme": _l("Atención y control"), "activities": [
                _l("Radar"), _l("Mensajes en clave"), _l("Estrellas escondidas"),
                _l("Radar rápido"), _l("Mensajes al revés"), _l("Cambio de regla"),
                _l("Divide la tarea"), _l("¿Me ayuda o me distrae?"), _l("Flechas"),
                _l("Mi agenda"),
            ]},
            {"theme": _l("Memoria y ritmo"), "activities": [
                _l("Radar con más meteoritos"), _l("Mensajes largos"),
                _l("Flechas con distractores"), _l("Paquetes en la oficina"),
                _l("La regla cambia más"), _l("Agenda del día"),
                _l("Mensajes largos al revés"), _l("Eco"), _l("Radar con cambio de regla"),
                _l("¿Cuánto tiempo toma?"),
            ]},
            {"theme": _l("Velocidad y precisión"), "activities": [
                _l("Radar veloz"), _l("Flechas rápidas"), _l("Ordenar de menor a mayor"),
                _l("Un día ocupado"), _l("Mapa difícil"), _l("Eco rápido"),
                _l("Regla cada dos"), _l("Mensajes muy largos al revés"),
                _l("Planear en cinco pasos"), _l("¿Hoy o después?"),
            ]},
            {"theme": _l("Doble exigencia"), "activities": [
                _l("Eco doble"), _l("Agenda exigente"), _l("Radar con cambios"),
                _l("Mensajes de siete números"), _l("Flechas al máximo"),
                _l("Oficina contra el tiempo"), _l("La regla cambia siempre"),
                _l("Planear un proyecto"), _l("Priorizar lo urgente"), _l("Eco y radar"),
            ]},
            {"theme": _l("Misión integrada"), "activities": [
                _l("Radar y regla"), _l("Flechas y búsqueda"), _l("Eco doble y mensajes"),
                _l("Agenda y regla"), _l("Radar, flechas y eco"),
                _l("Búsqueda, secuencias y agenda"), _l("Planear y calcular"),
                _l("Regla, eco y flechas"), _l("Priorizar y concentrarse"),
                _l("Misión final"),
            ]},
        ],
        "asset_path": "js/games/tdah_ritmo/game.js",
        "keywords": ["tdah", "atencion", "hiperactividad"],
        "available": True,
    },
    "tod_arquitecto": {
        "slug": "tod_arquitecto",
        "name": _l("El Arquitecto del Mundo"),
        "condition": _l("Trastorno opositor desafiante"),
        "core_skill": _l("Autorregulación emocional y conductual"),
        "skills": [
            _l("Reconocer las propias emociones"),
            _l("Elegir respuestas calmadas ante un conflicto"),
            _l("Esperar turnos y cumplir acuerdos"),
            _l("Expresar desacuerdo con respeto y negociar"),
        ],
        "dua": {
            "representacion": _l("Situaciones del colegio y del trabajo con termómetro emocional, señales del cuerpo y semáforo de la calma."),
            "accion_expresion": _l("Elegir, clasificar, emparejar y ordenar respuestas; autoinstrucciones, espera activa y turnos."),
            "implicacion": _l("Puntos de confianza y refuerzo positivo; ningún mensaje castiga y la persona siempre decide."),
        },
        "levels": 50,
        "has_stage_map": True,
        "stage_size": 10,
        "plan": [
            {"theme": _l("Reconocer lo que siento"), "activities": [
                _l("Termómetro de emociones"), _l("Señales del cuerpo"), _l("Qué me calma"),
                _l("Lo que calma y lo que empeora"), _l("Elegir cómo reaccionar"),
                _l("Semáforo de la calma"), _l("Batería de la paciencia"),
                _l("En el lugar del otro"), _l("Mi guion de calma"),
                _l("Puntos de confianza"),
            ]},
            {"theme": _l("Pausar antes de reaccionar"), "activities": [
                _l("Emoción y cuerpo"), _l("Firme o agresivo"),
                _l("Semáforo en situaciones nuevas"), _l("Espera más larga"),
                _l("Decisiones en el colegio y el trabajo"), _l("Torre por turnos"),
                _l("Qué pasa después"), _l("Cómo se sienten los demás"),
                _l("Guion completo de calma"), _l("Mis estrategias de calma"),
            ]},
            {"theme": _l("Resolver conflictos"), "activities": [
                _l("Pasos para resolver un conflicto"), _l("Firme, agresivo o callado"),
                _l("Proponer acuerdos"), _l("Decisiones en el trabajo"),
                _l("Semáforo en el trabajo"), _l("Ahora y después"),
                _l("Paciencia a prueba"), _l("Emociones propias y ajenas"),
                _l("Conductas que generan confianza"), _l("Refuerzo de la calma"),
            ]},
            {"theme": _l("Normas, autoridad y acuerdos"), "activities": [
                _l("Negociar con la autoridad"), _l("Conflictos de principio a fin"),
                _l("Firmeza con respeto"), _l("Semáforo con autoridad"),
                _l("Decidir pensando en las consecuencias"), _l("Cooperación por turnos"),
                _l("Espera de experto"), _l("Emociones intensas"), _l("Pensar en los demás"),
                _l("Guion sin ayudas"),
            ]},
            {"theme": _l("Autonomía"), "activities": [
                _l("Resolver y negociar"), _l("Comunicar pensando en el después"),
                _l("Calma con autoridad"), _l("Paciencia y cooperación"),
                _l("Manejo emocional completo"), _l("Negociar teniendo en cuenta al otro"),
                _l("Planear cómo responder"), _l("Conductas que abren puertas"),
                _l("Decir que no con respeto"), _l("Repaso final"),
            ]},
        ],
        "asset_path": "js/games/tod_arquitecto/game.js",
        "keywords": ["opositor", "desafiante", "tod", "conducta"],
        "available": True,
    },
    "tea_senales": {
        "slug": "tea_senales",
        "name": _l("La Estación de las Señales"),
        "condition": _l("Trastorno del espectro autista"),
        "core_skill": _l("Predictibilidad, comunicación social y flexibilidad"),
        "skills": [
            _l("Anticipar cambios en una rutina"),
            _l("Reconocer emociones y señales sociales"),
            _l("Comprender el lenguaje figurado y los turnos de conversación"),
        ],
        "dua": {
            "representacion": _l("Agenda visual siempre visible, anticipación de cada cambio y control sensorial permanente."),
            "accion_expresion": _l("Arrastre, selección y respuestas cerradas sin presión de tiempo."),
            "implicacion": _l("Rutina estable con intereses configurables por el docente."),
        },
        "levels": 50,
        "has_stage_map": True,
        "stage_size": 10,
        "plan": [
            {"theme": _l("Anticipar y reconocer"), "activities": [
                _l("La agenda del día"), _l("Caras y emociones"), _l("Une cara y emoción"),
                _l("¿Cómo se siente?"), _l("Turnos de conversación"),
                _l("Frases con otro sentido"), _l("Cuando el plan cambia"),
                _l("Lo que dice el cuerpo"), _l("Pasos sociales"), _l("¿Dónde lo buscará?"),
            ]},
            {"theme": _l("Comunicación en el día a día"), "activities": [
                _l("Agenda del trabajo"), _l("Ordena tu día"),
                _l("Emociones en la vida adulta"),
                _l("Conversar en el estudio y el trabajo"),
                _l("¿Literal o con otro sentido?"), _l("Cambios en el estudio y el trabajo"),
                _l("Señales del cuerpo II"), _l("Une frase y significado"),
                _l("Lo que sabe el otro"), _l("¿Sigue o termina la conversación?"),
            ]},
            {"theme": _l("Convivencia y relaciones"), "activities": [
                _l("Frases de adultos"), _l("Lo que quiere decir de verdad"),
                _l("Emociones en el trabajo"), _l("Pasos sociales de adultos"),
                _l("Conversaciones de trabajo"), _l("Adaptarse en el trabajo"),
                _l("Interés o despedida"), _l("Señales en el trabajo y la casa"),
                _l("Ponerse en el lugar del otro"), _l("Frases figuradas de adultos"),
            ]},
            {"theme": _l("Autonomía social"), "activities": [
                _l("Doble sentido"), _l("Literal o figurado avanzado"),
                _l("Situación y señales"), _l("Anticipar la agenda"),
                _l("Cambios de plan y de agenda"), _l("Permisos y malentendidos"),
                _l("Cuándo hablar y cuándo despedirse"), _l("Lo que la gente quiere decir"),
                _l("En el lugar de otra persona"), _l("Emociones y frases"),
            ]},
            {"theme": _l("Integración"), "activities": [
                _l("El sentido real"), _l("Emociones de todas las formas"),
                _l("Organizarse y adaptarse"), _l("Conversaciones completas"),
                _l("Lo que otros saben y quieren decir"), _l("Dominar el lenguaje figurado"),
                _l("Todas las señales"), _l("Anticipar y adaptarse"),
                _l("Responder con empatía"), _l("Repaso final"),
            ]},
        ],
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


def condition_label(trastorno) -> str:
    """Nombre de una condición tal como se muestra fuera del panel de
    administración. En español es el que escribió el administrador; en otro
    idioma se usa el nombre traducido del juego que le corresponde."""
    nombre = getattr(trastorno, "name", "") or ""
    if str(get_locale() or "es").startswith("es"):
        return nombre
    game = get_game_for_trastorno(trastorno)
    return str(game["condition"]) if game else nombre


def split_activity(game: dict, index: int) -> tuple[int, int]:
    """Número continuo de actividad (1..50) → (nivel 1..5, actividad 1..10)."""
    size = game.get("stage_size", 10)
    return (index - 1) // size + 1, (index - 1) % size + 1


def level_name(number: int) -> str:
    if 1 <= number <= len(LEVEL_NAMES):
        return str(LEVEL_NAMES[number - 1])
    return _("Nivel %(number)s", number=number)


def activity_title(game: dict, index: int) -> str:
    nivel, actividad = split_activity(game, index)
    plan = game.get("plan") or []
    if nivel <= len(plan) and actividad <= len(plan[nivel - 1]["activities"]):
        return str(plan[nivel - 1]["activities"][actividad - 1])
    return _("Actividad %(number)s", number=actividad)


def activity_label(game: dict, index: int) -> str:
    """Texto corto para avisos y encabezados: «Nivel 2 · Media · Actividad 3»."""
    nivel, actividad = split_activity(game, index)
    return _(
        "Nivel %(level)s · %(name)s · Actividad %(activity)s",
        level=nivel, name=level_name(nivel), activity=actividad,
    )


def build_levels(game: dict, unlocked: int | None = None, scores: dict | None = None) -> list[dict]:
    """Niveles del juego con sus actividades, listos para las plantillas.

    unlocked y scores son opcionales: el Modo maestro no los usa (todo está
    abierto); el mapa del estudiante sí, para marcar avance y estrellas.
    """
    size = game.get("stage_size", 10)
    total = game["levels"] // size
    plan = game.get("plan") or []
    scores = scores or {}
    levels = []
    for n in range(1, total + 1):
        start = (n - 1) * size + 1
        activities = []
        for index in range(start, start + size):
            best = scores.get(index, 0)
            activities.append({
                "index": index,
                "position": index - start + 1,
                "title": activity_title(game, index),
                "unlocked": unlocked is None or index <= unlocked,
                "completed": best >= PASS_SCORE,
                "stars": stars_for(best),
                "score": best,
            })
        levels.append({
            "number": n,
            "name": level_name(n),
            "theme": str(plan[n - 1]["theme"]) if n <= len(plan) else "",
            "start": start,
            "end": start + size - 1,
            "unlocked": unlocked is None or start <= unlocked,
            "completed_count": sum(1 for a in activities if a["completed"]),
            "stars": sum(a["stars"] for a in activities),
            "activities": activities,
        })
    return levels


PASS_SCORE = 60


def stars_for(score: int) -> int:
    """0 a 3 estrellas. Tres solo con todos los retos bien al primer intento;
    una estrella equivale a superar la actividad. Debe coincidir con
    core/engine.js::starsFor."""
    if score >= 100:
        return 3
    if score >= 75:
        return 2
    if score >= PASS_SCORE:
        return 1
    return 0


# ---------------------------------------------------------------------------
# Diccionarios de los juegos
# ---------------------------------------------------------------------------

_DICTIONARIES: dict = {}


def game_dictionary(game: dict, locale: str | None = None) -> dict:
    """Traducciones del contenido de un juego ({texto en español: texto}).

    Están en static/js/games/<juego>/<idioma>.json y las usa engine.js
    (función tr). En español, o si el archivo no existe, queda vacío."""
    locale = str(locale or get_locale() or "es")[:2]
    if locale == "es" or not game:
        return {}
    path = os.path.join(current_app.static_folder, "js", "games", game["slug"], locale + ".json")
    try:
        mtime = os.path.getmtime(path)
    except OSError:
        return {}
    cached = _DICTIONARIES.get(path)
    if cached is None or cached[0] != mtime:
        with open(path, encoding="utf-8") as fh:
            cached = (mtime, json.load(fh))
        _DICTIONARIES[path] = cached
    return cached[1]


def translate_game_text(slug: str, text: str, locale: str | None = None) -> str:
    """Traduce un texto guardado por un juego (por ejemplo, el nombre de una
    habilidad en el historial) al idioma activo. Funciona en los dos
    sentidos, porque la partida pudo jugarse en español o en inglés."""
    game = GAMES.get(slug)
    locale = str(locale or get_locale() or "es")[:2]
    if not game or not text:
        return text
    english = game_dictionary(game, "en")
    if locale == "es":
        for es, en in english.items():
            if en == text:
                return es
        return text
    return english.get(text, text)
