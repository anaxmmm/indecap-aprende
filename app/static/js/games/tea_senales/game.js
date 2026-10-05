/**
 * LA ESTACIÓN DE LAS SEÑALES — Trastorno del espectro autista
 *
 * Habilidad núcleo: predictibilidad, comunicación social y flexibilidad.
 *  - Agenda y anticipación ............ corteza prefrontal (planificación)
 *  - Reconocer emociones y señales .... giro fusiforme, surco temporal superior
 *  - Lenguaje figurado y turnos ....... surco temporal superior, prefrontal medial
 *  - Creencias de otros (teoría de la mente) ... corteza prefrontal medial
 *  - Doble sentido social (nueva) ...... pragmática e intención implícita
 *
 * MAPA DE ETAPAS (5 Stages de 10 niveles, 50 en total, numeración continua):
 *   Stage 1 · Base            → niveles 1-10  (sin cambio de contenido)
 *   Stage 2 · Media           → niveles 11-20 (predictibilidad y comunicación adulta)
 *   Stage 3 · Alta            → niveles 21-30 (convivencia y relaciones)
 *   Stage 4 · Muy Alta        → niveles 31-40 (trabajo y autonomía social)
 *   Stage 5 · Súper Difícil   → niveles 41-50 (integración total)
 *
 * El desbloqueo de nivel a nivel (score >= 60) lo maneja
 * games/services.py::get_unlocked_level, agnóstico al número de niveles.
 *
 * Principios de diseño (se conservan sin cambios en todos los niveles):
 *  - Cero presión de tiempo en todos los niveles.
 *  - Estructura predecible: cada nivel anuncia en la intro qué va a pasar.
 *  - Lenguaje literal y consignas cortas en las respuestas del juego.
 *  - Control sensorial siempre visible: alto contraste, reducir movimiento,
 *    volumen de voz (botón de voz) y "Pausa tranquila".
 *  - Nivel 10: evaluación embebida con una muestra de todas las mecánicas.
 *
 * Contenido de las etapas 2 a 5: pensado para jóvenes de 15 a 26 años
 * (trabajo, convivencia, relaciones), con el mismo lenguaje literal y corto.
 *
 * Nota: la pausa tranquila oculta el reto pero el cronómetro del HUD sigue
 * contando (el tiempo total de la sesión queda registrado sin penalizar).
 *
 * Estilos: se inyectan desde aquí para no tocar games.css.
 */
(function (global) {
  "use strict";

  // ─── Utilidades ───────────────────────────────────────────────────────────

  function rnd(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  function shuffle(arr) {
    var a = arr.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }

  function el(tag, className) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    return node;
  }

  function liveRegion() {
    var node = el("p", "visually-hidden");
    node.setAttribute("role", "status");
    node.setAttribute("aria-live", "polite");
    return node;
  }

  function textOptions(ok, bads, n) {
    var list = [ok].concat(shuffle(bads).slice(0, n - 1));
    return shuffle(list).map(function (t) {
      return { label: t, value: t, aria: t };
    });
  }

  function lower(t) {
    return t.charAt(0).toLowerCase() + t.slice(1);
  }

  var STYLE_ID = "tea-senales-styles";
  function injectStyles() {
    if (document.getElementById(STYLE_ID)) return;
    var css = [
      ".game-shell .game-options .game-option{font-size:1.15rem;max-width:300px}",
      ".tea-big{font-size:5rem;line-height:1}",
      ".tea-status{flex-basis:100%;font-weight:600;color:var(--g-muted);margin-bottom:8px}",
      ".tea-agenda{display:flex;flex-wrap:wrap;align-items:center;justify-content:center;gap:8px}",
      ".tea-agenda__item{display:flex;flex-direction:column;align-items:center;gap:2px;background:#FFFFFF;border:2px solid var(--indecap-border,#DCE4EA);border-radius:12px;padding:8px 10px;min-width:96px;font-size:.85rem;color:var(--g-text)}",
      ".tea-agenda__item.is-ref{border-color:var(--g-accent);background:var(--g-accent-soft);color:var(--g-frame-dark);font-weight:700}",
      ".tea-agenda__n{font-size:.75rem;color:var(--g-muted)}",
      ".tea-agenda__i{font-size:1.8rem;line-height:1}",
      ".tea-agenda__arrow{color:var(--g-muted);font-size:1.2rem}",
      ".tea-story{max-width:560px;margin:0 auto;font-size:1.1rem;line-height:1.7;color:var(--g-text)}",
      ".tea-list{flex-basis:100%;list-style:none;margin:0 auto 12px;padding:0;max-width:480px;text-align:left}",
      ".tea-list li{background:var(--g-ok-soft);border:2px solid var(--g-ok);color:var(--g-ok);border-radius:12px;padding:10px 14px;margin-bottom:8px;font-weight:600}",
      ".tea-steps{flex-basis:100%;display:flex;flex-wrap:wrap;gap:12px;justify-content:center}",
      ".game-option.tea-step{display:flex;flex-direction:column;align-items:center;gap:6px;font-size:1rem;min-width:150px;max-width:220px}",
      ".tea-step-icon{font-size:2.2rem;line-height:1}",
      ".game-option.tea-next{outline:4px solid var(--g-accent);outline-offset:3px}",
      ".tea-calm{display:none;text-align:center;max-width:460px;margin:0 auto;color:var(--g-text)}",
      ".tea-calm h2{font-size:1.4rem;margin-bottom:12px}",
      ".tea-calm p{line-height:1.7}",
      ".game-shell.tea-paused .game-screen{display:none !important}",
      ".game-shell.tea-paused .tea-calm{display:block}"
    ].join("\n");
    var style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = css;
    document.head.appendChild(style);
  }
  injectStyles();

  /**
   * Botón "Pausa tranquila" en la barra de accesibilidad y su panel dentro del
   * escenario. Es un control sensorial permanente: el estudiante puede parar
   * en cualquier momento sin explicar por qué.
   */
  function setupCalm() {
    var shell = document.querySelector(".game-shell");
    var bar = document.querySelector(".game-a11y-bar");
    var stage = document.getElementById("gameStage");
    if (!shell || !bar || !stage || document.getElementById("teaCalmBtn")) return;

    var btn = el("button", "game-a11y-btn");
    btn.id = "teaCalmBtn";
    btn.type = "button";
    btn.setAttribute("aria-pressed", "false");
    btn.textContent = "🌿 Pausa tranquila";
    var hintBtn = bar.querySelector('[data-a11y-action="hint"]');
    bar.insertBefore(btn, hintBtn);

    var panel = el("div", "tea-calm");
    panel.setAttribute("role", "region");
    panel.setAttribute("aria-label", "Pausa tranquila");
    panel.innerHTML =
      "<h2>Pausa tranquila</h2>" +
      "<p>Estás en una pausa. No hay tiempo límite y no pierdes nada.</p>" +
      "<p>Puedes respirar así: cuenta 4 al tomar aire, 4 al sostenerlo y 4 al soltarlo.</p>";
    var back = el("button", "game-btn game-btn--primary");
    back.type = "button";
    back.textContent = "Volver al juego";
    panel.appendChild(back);
    stage.appendChild(panel);

    function toggle(force) {
      var on = typeof force === "boolean" ? force : !shell.classList.contains("tea-paused");
      shell.classList.toggle("tea-paused", on);
      btn.setAttribute("aria-pressed", on ? "true" : "false");
      if (on) { back.focus(); } else { btn.focus(); }
    }

    btn.addEventListener("click", function () { toggle(); });
    back.addEventListener("click", function () { toggle(false); });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && shell.classList.contains("tea-paused")) toggle(false);
    });
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", setupCalm);
  } else {
    setupCalm();
  }

  // ─── Datos: base (Stage 1, sin cambios) ────────────────────────────────────

  var AGENDA = [
    { i: "🌅", t: "Llegada y saludo" },
    { i: "🧩", t: "Juego de la estación" },
    { i: "🍎", t: "Recreo" },
    { i: "📖", t: "Lectura" },
    { i: "🏠", t: "Salida" }
  ];

  var EMO = {
    feliz: ["😀", "Feliz"],
    triste: ["😢", "Triste"],
    enojado: ["😠", "Enojado"],
    sorprendido: ["😮", "Sorprendido"],
    asustado: ["😨", "Asustado"],
    tranquilo: ["😌", "Tranquilo"]
  };
  var EMO_KEYS = Object.keys(EMO);

  var SITUACIONES = [
    { t: "Le regalan su juguete favorito.", e: "feliz" },
    { t: "Se le rompió un dibujo que hizo con mucho esfuerzo.", e: "triste" },
    { t: "Otro niño le quitó su lugar sin preguntar.", e: "enojado" },
    { t: "Escuchó un trueno muy fuerte de repente.", e: "asustado" },
    { t: "Abrió una caja y salió un muñeco de resorte que no esperaba.", e: "sorprendido" },
    { t: "Está en su casa, recostado, escuchando música suave.", e: "tranquilo" },
    { t: "Su equipo ganó el partido.", e: "feliz" }
  ];

  var SENALES = [
    { t: "Tu compañero cruza los brazos, frunce el ceño y respira fuerte.", e: "enojado" },
    { t: "Tu compañera sonríe y salta con los brazos arriba.", e: "feliz" },
    { t: "Tu compañero mira al suelo, tiene los hombros caídos y los ojos llorosos.", e: "triste" },
    { t: "Tu compañero abre mucho los ojos y da un paso atrás cuando suena un trueno.", e: "asustado" },
    { t: "Tu compañera está sentada, respira lento y tiene los hombros sueltos.", e: "tranquilo" }
  ];

  var DIALOGOS = [
    { t: "Un compañero te dice: «Hola, ¿cómo estás?»", ok: "Le respondo y le pregunto cómo está él", bad: ["No digo nada y me voy", "Empiezo a hablar de otro tema sin responderle"] },
    { t: "Tu amiga te cuenta que su perro se enfermó.", ok: "La escucho y le digo que lamento lo que pasó", bad: ["Cambio de tema y hablo de mis juegos", "Me pongo a mirar el celular"] },
    { t: "Dos compañeros conversan y tú quieres participar.", ok: "Espero una pausa y pregunto: «¿Puedo unirme?»", bad: ["Los interrumpo hablando fuerte", "Me quedo lejos sin decir nada"] },
    { t: "La profesora te pregunta cómo te fue en la actividad.", ok: "Le cuento brevemente cómo me fue", bad: ["Me quedo callado mirando el piso", "Le respondo algo que no tiene relación"] },
    { t: "Un compañero termina de hablar y te mira.", ok: "Es mi turno: le respondo", bad: ["Sigo esperando en silencio", "Me voy sin decir nada"] }
  ];

  var FIGURADO = [
    { f: "Está lloviendo a cántaros", ok: "Llueve muy fuerte", bad: ["Caen cántaros del cielo", "Llueve muy poco"] },
    { f: "Tengo mariposas en el estómago", ok: "Estoy nervioso o emocionado", bad: ["Me comí unas mariposas", "Tengo mucha hambre"] },
    { f: "Se me hizo agua la boca", ok: "Algo se ve muy rico", bad: ["Me cayó agua en la boca", "Tengo sed de jugo"] },
    { f: "Estoy muerto de sueño", ok: "Tengo mucho sueño", bad: ["Estoy enfermo de gravedad", "No tengo sueño"] },
    { f: "Me quedé de piedra", ok: "Me sorprendí mucho", bad: ["Me convertí en piedra", "Me dio mucha risa"] }
  ];

  var CAMBIOS = [
    { plan: "Hoy irás al parque 🌳", nuevo: "empezó a llover ☔ y ahora el plan es ir a la biblioteca 📚",
      ok: "Voy a la biblioteca: es el plan nuevo", bad: ["Me enojo y no quiero ir a ningún lado", "Insisto en ir al parque bajo la lluvia"] },
    { plan: "Hoy tienes clase de dibujo 🎨", nuevo: "la profesora avisó que hoy será clase de música 🎵",
      ok: "Me preparo para la clase de música", bad: ["Me niego a entrar al salón", "Repito que quiero dibujo"] },
    { plan: "Hoy comerás pasta 🍝", nuevo: "se acabó la pasta y ahora hay arroz con pollo 🍗",
      ok: "Pruebo el arroz con pollo", bad: ["No como nada por el cambio", "Pido pasta una y otra vez"] }
  ];

  var CREENCIAS = [
    { t: "Luis guarda su balón en la caja roja y sale del salón. Mientras Luis no está, Mateo pasa el balón a la caja azul. Luis vuelve.",
      q: "¿Dónde va a buscar Luis el balón?", ok: "En la caja roja", bad: ["En la caja azul"],
      why: "Luis no vio el cambio, así que busca donde lo dejó." },
    { t: "Ana deja su libro en la mochila y va al baño. Mientras Ana no está, su hermano guarda el libro en el cajón. Ana vuelve.",
      q: "¿Dónde va a buscar Ana el libro?", ok: "En la mochila", bad: ["En el cajón"],
      why: "Ana no vio que lo movieron, así que lo busca en la mochila." },
    { t: "Sofía pone su bufanda en la silla y sale al patio. Mientras Sofía no está, su amiga la cuelga en el perchero. Sofía vuelve.",
      q: "¿Dónde va a buscar Sofía la bufanda?", ok: "En la silla", bad: ["En el perchero"],
      why: "Sofía no vio el cambio, así que mira primero donde la dejó." }
  ];

  var SECUENCIAS = [
    { title: "Unirte a un juego", steps: [
      { i: "👀", t: "Miro cómo juegan" }, { i: "🚶", t: "Me acerco" },
      { i: "🗣️", t: "Pregunto: ¿puedo jugar?" }, { i: "⏳", t: "Espero la respuesta" }] },
    { title: "Pedir ayuda a la profesora", steps: [
      { i: "✋", t: "Levanto la mano" }, { i: "⏳", t: "Espero mi turno" },
      { i: "🗣️", t: "Explico lo que necesito" }, { i: "🙏", t: "Doy las gracias" }] },
    { title: "Terminar una conversación", steps: [
      { i: "👂", t: "Escucho lo que dice" }, { i: "🗣️", t: "Digo que debo irme" }, { i: "👋", t: "Me despido" }] }
  ];

  // ─── Datos: vida adulta (Stage 2 en adelante, 15-26 años) ──────────────────

  var AGENDA_ADULTO = [
    { i: "⏰", t: "Llegada al trabajo" },
    { i: "💻", t: "Revisar correos" },
    { i: "🗓️", t: "Reunión de equipo" },
    { i: "🍽️", t: "Almuerzo" },
    { i: "🏠", t: "Salida" }
  ];

  var SITUACIONES_ADULTO = [
    { t: "Le aprobaron el préstamo que pidió en el banco.", e: "feliz" },
    { t: "No pasó la entrevista de trabajo que quería.", e: "triste" },
    { t: "Un compañero se llevó el crédito por un trabajo que él hizo.", e: "enojado" },
    { t: "Escuchó un ruido fuerte y desconocido en el apartamento de noche.", e: "asustado" },
    { t: "Le avisaron que ganó una beca que no esperaba.", e: "sorprendido" },
    { t: "Está en su casa un domingo, sin pendientes, leyendo algo que le gusta.", e: "tranquilo" },
    { t: "Terminó a tiempo un proyecto importante en el trabajo.", e: "feliz" }
  ];

  var SENALES_ADULTO = [
    { t: "Tu jefe cruza los brazos, aprieta la mandíbula y habla más rápido de lo normal.", e: "enojado" },
    { t: "Tu compañero de trabajo sonríe y cuenta la noticia moviendo las manos con entusiasmo.", e: "feliz" },
    { t: "Tu compañero de piso mira al suelo, habla bajo y tiene los hombros caídos.", e: "triste" },
    { t: "Un compañero se sobresalta y da un paso atrás cuando suena la alarma de incendio.", e: "asustado" },
    { t: "Tu pareja está sentada, respira lento y tiene la postura relajada.", e: "tranquilo" }
  ];

  var DIALOGOS_ADULTO = [
    { t: "Un compañero de trabajo te dice: «Buenos días, ¿cómo estás?»", ok: "Le respondo y le pregunto cómo está él", bad: ["No digo nada y sigo caminando", "Empiezo a hablar de mi tarea sin responderle"] },
    { t: "Tu compañero de piso te cuenta que perdió su empleo.", ok: "Lo escucho y le digo que lamento lo que pasó", bad: ["Cambio de tema y hablo de mis planes", "Me pongo a mirar el celular"] },
    { t: "Dos compañeros conversan en la sala de descanso y tú quieres participar.", ok: "Espero una pausa y pregunto: «¿Puedo unirme?»", bad: ["Los interrumpo hablando fuerte", "Me quedo lejos sin decir nada"] },
    { t: "Tu jefe te pregunta cómo va el proyecto.", ok: "Le cuento brevemente el avance", bad: ["Me quedo callado mirando el piso", "Le respondo algo que no tiene relación"] },
    { t: "Un compañero termina de hablar en la reunión y te mira.", ok: "Es mi turno: le respondo", bad: ["Sigo esperando en silencio", "Me voy sin decir nada"] }
  ];

  var FIGURADO_ADULTO = [
    { f: "Se me fue el tren", ok: "Perdí una oportunidad importante", bad: ["Un tren se fue sin mí", "No tengo transporte"] },
    { f: "Está costando un ojo de la cara", ok: "Es muy caro", bad: ["Alguien perdió un ojo", "Está muy barato"] },
    { f: "Me tiene entre la espada y la pared", ok: "Me siento obligado a elegir entre dos opciones difíciles", bad: ["Estoy atrapado entre dos objetos", "Tengo mucho espacio para decidir"] },
    { f: "Eso es pan comido", ok: "Es muy fácil de hacer", bad: ["Alguien se comió pan", "Es muy difícil de hacer"] },
    { f: "Tirar la toalla", ok: "Rendirse o dejar de intentarlo", bad: ["Lanzar una toalla de verdad", "Seguir intentándolo con más fuerza"] }
  ];

  var CAMBIOS_ADULTO = [
    { plan: "Hoy tenías reunión presencial en la oficina 🏢", nuevo: "avisaron que ahora la reunión será virtual 💻",
      ok: "Me conecto a la reunión virtual", bad: ["Me enojo y no me conecto", "Insisto en ir a la oficina de todas formas"] },
    { plan: "Hoy ibas a almorzar con un compañero 🍽️", nuevo: "tu compañero avisó que debe cancelar por una emergencia",
      ok: "Entiendo y reprogramamos para otro día", bad: ["Me molesto y dejo de hablarle", "Insisto en que almorcemos igual"] },
    { plan: "Hoy tenías turno de la mañana en el trabajo ⏰", nuevo: "te avisaron que el turno cambió a la tarde",
      ok: "Ajusto mi horario para el turno de la tarde", bad: ["No voy a trabajar por el cambio", "Reclamo sin escuchar la explicación"] }
  ];

  var CREENCIAS_ADULTO = [
    { t: "Camilo guarda su laptop en su escritorio y sale a una reunión. Mientras Camilo no está, el aseador la mueve a otro escritorio para limpiar. Camilo vuelve.",
      q: "¿Dónde va a buscar Camilo la laptop?", ok: "En su escritorio", bad: ["En el otro escritorio"],
      why: "Camilo no vio el cambio, así que busca donde la dejó." },
    { t: "Valentina deja su carpeta en la sala de reuniones y va a imprimir algo. Mientras Valentina no está, un compañero guarda la carpeta en un archivador. Valentina vuelve.",
      q: "¿Dónde va a buscar Valentina la carpeta?", ok: "En la sala de reuniones", bad: ["En el archivador"],
      why: "Valentina no vio que la movieron, así que la busca donde la dejó." },
    { t: "Daniel deja las llaves del carro en la mesa y sale a comprar algo. Mientras Daniel no está, su compañero de piso las cuelga en el gancho de la entrada. Daniel vuelve.",
      q: "¿Dónde va a buscar Daniel las llaves?", ok: "En la mesa", bad: ["En el gancho de la entrada"],
      why: "Daniel no vio el cambio, así que mira primero donde las dejó." }
  ];

  var SECUENCIAS_ADULTO = [
    { title: "Unirte a una conversación de trabajo", steps: [
      { i: "👀", t: "Observo de qué están hablando" }, { i: "🚶", t: "Me acerco al grupo" },
      { i: "🗣️", t: "Pregunto: ¿puedo participar?" }, { i: "⏳", t: "Espero la respuesta" }] },
    { title: "Pedir ayuda a tu supervisor", steps: [
      { i: "✋", t: "Pido un momento para hablar" }, { i: "⏳", t: "Espero a que esté disponible" },
      { i: "🗣️", t: "Explico lo que necesito" }, { i: "🙏", t: "Doy las gracias" }] },
    { title: "Pedir un permiso en el trabajo", steps: [
      { i: "📝", t: "Pienso qué voy a pedir" }, { i: "🗣️", t: "Hablo con mi jefe con respeto" },
      { i: "⏳", t: "Espero la respuesta" }, { i: "🙏", t: "Agradezco, sea cual sea la respuesta" }] },
    { title: "Resolver un malentendido", steps: [
      { i: "😕", t: "Noto que algo no está claro" }, { i: "🗣️", t: "Pregunto para entender mejor" },
      { i: "👂", t: "Escucho la explicación" }, { i: "🤝", t: "Aclaramos juntos el malentendido" }] }
  ];

  /** Doble sentido social: una frase con una intención implícita distinta a
      su significado literal. Se pregunta qué quiere decir realmente la
      persona, con lenguaje corto y literal en las opciones. */
  var DOBLE_SENTIDO = [
    { t: "Un compañero dice «no hay problema» con la voz cortante y sin mirarte.", q: "¿Qué quiere decir realmente?", ok: "Sí hay un problema, aunque lo diga con otras palabras", bad: ["No hay ningún problema"] },
    { t: "Tu jefe dice «interesante» después de ver tu propuesta, sin decir nada más.", q: "¿Qué puede querer decir?", ok: "Puede que tenga dudas y no las haya dicho todavía", bad: ["Le encantó completamente tu propuesta"] },
    { t: "Un amigo dice «como quieras» con un suspiro, después de proponer varios planes.", q: "¿Qué puede querer decir?", ok: "Puede que sí tenga una preferencia, aunque no la diga", bad: ["De verdad le da igual cualquier plan"] },
    { t: "Un compañero de piso dice «tranquilo, no importa» cuando le rompiste algo, pero se queda callado después.", q: "¿Qué puede querer decir?", ok: "Puede que sí le importe, aunque lo disimule", bad: ["De verdad no le importa en absoluto"] },
    { t: "Tu pareja dice «haz lo que quieras» durante una discusión.", q: "¿Qué puede querer decir?", ok: "Puede estar molesta y prefiere no seguir discutiendo en ese momento", bad: ["Realmente te está dando libertad total"] },
    { t: "Un cliente dice «bueno, gracias» de forma seca después de una atención lenta.", q: "¿Qué puede querer decir?", ok: "Puede estar insatisfecho, aunque agradezca por cortesía", bad: ["Quedó completamente satisfecho"] }
  ];

  // ─── Mecánicas de opción única ────────────────────────────────────────────

  function agendaVisual(lista, refIdx) {
    var partes = lista.map(function (a, i) {
      return '<span class="tea-agenda__item' + (i === refIdx ? " is-ref" : "") + '">' +
        '<span class="tea-agenda__n">' + (i + 1) + "</span>" +
        '<span class="tea-agenda__i">' + a.i + "</span>" +
        "<span>" + a.t + "</span></span>";
    });
    return '<div class="tea-agenda">' + partes.join('<span class="tea-agenda__arrow" aria-hidden="true">→</span>') + "</div>";
  }

  /** Agenda: anticipar qué viene antes y después. Acepta p.bancos para una
      agenda distinta a la de la base (vida adulta). */
  function retoAgenda(p) {
    var lista = (p && p.bancos) || AGENDA;
    var modes = p.modes || ["despues"];
    var mode = modes[rnd(0, modes.length - 1)];
    var ref = mode === "despues" ? rnd(0, lista.length - 2) : rnd(1, lista.length - 1);
    var ansIdx = mode === "despues" ? ref + 1 : ref - 1;
    var ok = lista[ansIdx].t;
    var bads = lista.filter(function (a, i) { return i !== ansIdx && i !== ref; })
      .map(function (a) { return a.t; });
    var texto = lista.map(function (a) { return a.t; }).join(", ");
    var prompt = "La agenda de hoy es: " + texto + ". ¿Qué viene " +
      (mode === "despues" ? "después de " : "antes de ") + lista[ref].t + "?";
    return {
      skill: "agenda_" + mode,
      prompt: prompt,
      speech: prompt,
      visual: agendaVisual(lista, ref),
      options: textOptions(ok, bads, 3),
      answer: ok,
      answerLabel: ok,
      hint: "Sigue las flechas de la agenda. Siempre va en el mismo orden.",
      explain: "En la agenda, " + ok + " va " + (mode === "despues" ? "después de " : "antes de ") + lista[ref].t + "."
    };
  }

  function emoOptions(key, pool) {
    var otros = shuffle(pool.filter(function (k) { return k !== key; })).slice(0, 2);
    return shuffle([key].concat(otros)).map(function (k) {
      return { label: EMO[k][1], value: k, aria: EMO[k][1] };
    });
  }

  /** Reconocer la emoción de una cara. */
  function retoEmocion(p) {
    var pool = p.emos;
    var key = pool[rnd(0, pool.length - 1)];
    var prompt = "Mira la cara. ¿Qué emoción muestra?";
    return {
      skill: "reconocer_emocion",
      prompt: prompt,
      speech: prompt,
      visual: '<span class="tea-big">' + EMO[key][0] + "</span>",
      options: emoOptions(key, pool),
      answer: key,
      answerLabel: EMO[key][1],
      hint: "Mira la boca y los ojos de la cara.",
      explain: "Esa cara muestra: " + EMO[key][1] + "."
    };
  }

  /** Inferir la emoción a partir de una situación. */
  function retoSituacion(p) {
    var banco = (p && p.bancos) || SITUACIONES;
    var s = pick(banco);
    var prompt = "Situación: " + s.t + " ¿Cómo se siente?";
    return {
      skill: "emocion_situacion",
      prompt: prompt,
      speech: prompt,
      visual: '<span class="tea-big">' + EMO[s.e][0] + "</span>",
      options: emoOptions(s.e, EMO_KEYS),
      answer: s.e,
      answerLabel: EMO[s.e][1],
      hint: "Piensa cómo te sentirías tú si te pasara eso.",
      explain: "En esa situación, casi todas las personas se sienten: " + EMO[s.e][1] + "."
    };
  }
  function pick(a) { return a[rnd(0, a.length - 1)]; }

  /** Leer señales del cuerpo. */
  function retoSenales(p) {
    var banco = (p && p.bancos) || SENALES;
    var s = pick(banco);
    var prompt = s.t + " ¿Qué crees que siente?";
    return {
      skill: "senales_corporales",
      prompt: prompt,
      speech: prompt,
      visual: '<span class="tea-big">👀</span>',
      options: emoOptions(s.e, EMO_KEYS),
      answer: s.e,
      answerLabel: EMO[s.e][1],
      hint: "Fíjate en los brazos, la cara y la respiración.",
      explain: "Esas señales del cuerpo suelen indicar: " + EMO[s.e][1] + "."
    };
  }

  /** Turnos de conversación. */
  function retoTurnos(p) {
    var banco = (p && p.bancos) || DIALOGOS;
    var d = pick(banco);
    var prompt = d.t + " ¿Qué respondes?";
    return {
      skill: "turnos_conversacion",
      prompt: prompt,
      speech: prompt,
      visual: '<span class="tea-big">💬</span>',
      options: textOptions(d.ok, d.bad, 3),
      answer: d.ok,
      answerLabel: d.ok,
      hint: "En una conversación, uno habla y el otro escucha, y luego cambian.",
      explain: "Así la conversación sigue y la otra persona se siente escuchada."
    };
  }

  /** Lenguaje figurado. */
  function retoFigurado(p) {
    var banco = (p && p.bancos) || FIGURADO;
    var f = pick(banco);
    var prompt = "Alguien dice: «" + f.f + "». ¿Qué quiere decir?";
    return {
      skill: "lenguaje_figurado",
      prompt: prompt,
      speech: prompt,
      visual: '<span class="tea-big">🗨️</span>',
      options: textOptions(f.ok, f.bad, 3),
      answer: f.ok,
      answerLabel: f.ok,
      hint: "Algunas frases no se entienden al pie de la letra. Piensa qué querría decir la persona.",
      explain: "«" + f.f + "» quiere decir: " + lower(f.ok) + "."
    };
  }

  /** Cambios de plan anunciados. */
  function retoCambio(p) {
    var banco = (p && p.bancos) || CAMBIOS;
    var c = pick(banco);
    var prompt = "Tu plan era: " + c.plan + ". Aviso: " + c.nuevo + ". ¿Qué haces?";
    return {
      skill: "cambio_de_plan",
      prompt: prompt,
      speech: prompt,
      visual: '<span class="tea-big">🔄</span>',
      options: textOptions(c.ok, c.bad, 3),
      answer: c.ok,
      answerLabel: c.ok,
      hint: "Puedes respirar hondo y seguir el plan nuevo.",
      explain: "Es normal que un cambio incomode. Respirar y seguir el plan nuevo ayuda."
    };
  }

  /** Creencias de otros: qué piensa alguien que no vio el cambio. */
  function retoCreencia(p) {
    var banco = (p && p.bancos) || CREENCIAS;
    var c = pick(banco);
    var prompt = c.t + " " + c.q;
    return {
      skill: "creencia_falsa",
      prompt: prompt,
      speech: prompt,
      visual: '<span class="tea-big">🧠</span>',
      options: textOptions(c.ok, c.bad, 2),
      answer: c.ok,
      answerLabel: c.ok,
      hint: "Piensa qué vio la persona y qué no vio.",
      explain: c.why
    };
  }

  /** Doble sentido social: interpretar la intención detrás de una frase. */
  function retoDobleSentido(p) {
    var banco = (p && p.bancos) || DOBLE_SENTIDO;
    var d = pick(banco);
    var prompt = d.t + " " + d.q;
    return {
      skill: "doble_sentido_social",
      prompt: prompt,
      speech: prompt,
      visual: '<span class="tea-big">🤔</span>',
      options: textOptions(d.ok, d.bad, 2),
      answer: d.ok,
      answerLabel: d.ok,
      hint: "A veces el tono o la situación dicen algo distinto a las palabras.",
      explain: d.ok + "."
    };
  }

  // ─── Mecánica con interfaz propia: ordenar pasos sociales ─────────────────

  function roundSecuencia(p, ctx, index) {
    var lista = p.bancos || SECUENCIAS;
    var r = lista[((p.offset || 0) + index) % lista.length];
    var help = (ctx && ctx.support) || 1;
    var prompt = "Ordena los pasos: " + r.title + ". Toca primero el paso que se hace primero.";

    return {
      skill: "secuencia_social",
      prompt: prompt,
      speech: prompt,
      hint: "Piensa qué haces primero y sigue paso a paso.",
      mount: function (host, api) {
        var n = r.steps.length;
        host.innerHTML = "";
        var live = liveRegion();
        var status = el("p", "tea-status");
        var done = el("ol", "tea-list");
        done.setAttribute("aria-label", "Pasos ya ordenados");
        var pool = el("div", "tea-steps");
        pool.setAttribute("role", "group");
        pool.setAttribute("aria-label", "Pasos para ordenar");
        host.appendChild(live);
        host.appendChild(status);
        host.appendChild(done);
        host.appendChild(pool);

        var order = shuffle(r.steps.map(function (s, i) { return { s: s, i: i }; }));
        var guard = 0;
        while (guard++ < 10 && order.every(function (o, k) { return o.i === k; })) {
          order = shuffle(order);
        }

        var pos = 0, errors = 0, finished = false;
        var highlight = help === 1;
        var buttons = [];

        function refresh() {
          status.textContent = "Paso " + Math.min(pos + 1, n) + " de " + n;
          buttons.forEach(function (b) {
            b.el.classList.toggle("tea-next", highlight && b.o.i === pos);
          });
        }

        order.forEach(function (o) {
          var b = el("button", "game-option tea-step");
          b.type = "button";
          var ic = el("span", "tea-step-icon");
          ic.textContent = o.s.i;
          ic.setAttribute("aria-hidden", "true");
          var tx = el("span");
          tx.textContent = o.s.t;
          b.appendChild(ic);
          b.appendChild(tx);
          b.setAttribute("aria-label", o.s.t);
          b.addEventListener("click", function () { tap(b, o); });
          pool.appendChild(b);
          buttons.push({ el: b, o: o });
        });

        function tap(btn, o) {
          if (finished) return;
          if (o.i === pos) {
            pos++;
            buttons = buttons.filter(function (x) { return x.el !== btn; });
            btn.remove();
            var li = el("li");
            li.textContent = o.s.i + " " + o.s.t;
            done.appendChild(li);
            live.textContent = "Paso " + pos + ": " + o.s.t;
            api.say("Paso " + pos + ": " + o.s.t);
            api.feedback("", "");
            if (pos === n) { end(); return; }
            refresh();
            if (buttons[0]) buttons[0].el.focus();
          } else {
            errors++;
            btn.classList.add("is-wrong");
            setTimeout(function () { btn.classList.remove("is-wrong"); }, 500);
            api.feedback("Ese paso va después. Mira cuál se hace primero.", "retry");
            if (help === 2) highlight = true;
            refresh();
            if (errors === 2) api.hint();
          }
        }

        function end() {
          finished = true;
          status.textContent = "¡Pasos completos!";
          var stars = errors === 0 ? 1 : (errors === 1 ? 0.75 : (errors <= 3 ? 0.5 : 0.25));
          api.done({
            stars: stars,
            message: errors === 0 ? "¡Todos los pasos en orden!" : "¡Secuencia completada!",
            error: errors ? { wrong: errors, sequence: r.title, help_level: help, attempts: errors + 1 } : null
          });
        }

        refresh();
        return function () { finished = true; };
      }
    };
  }

  // ─── Definición de los niveles (50: 5 Stages de 10 niveles) ────────────────

  var CONSTRUCTORES = {
    agenda: function (p) { return retoAgenda(p); },
    emocion: function (p) { return retoEmocion(p); },
    situacion: function (p) { return retoSituacion(p); },
    turnos: function (p) { return retoTurnos(p); },
    figurado: function (p) { return retoFigurado(p); },
    cambio: function (p) { return retoCambio(p); },
    senales: function (p) { return retoSenales(p); },
    dobleSentido: function (p) { return retoDobleSentido(p); },
    secuencia: roundSecuencia,
    creencia: function (p) { return retoCreencia(p); }
  };

  var NIVELES = {
    // ══ Stage 1 · Base (1-10): sin cambios ═══════════════════════════════════
    1: { rounds: 5, mechanics: ["agenda"], params: { agenda: { modes: ["despues"] } },
         intro: "Stage 1 · Nivel 1 · Bienvenida a la Estación de las Señales. Soy NOVA. Aquí todo es predecible: la agenda siempre va en el mismo orden y no hay tiempo límite. Este nivel tiene 5 preguntas sobre la agenda de hoy. Si necesitas parar, usa «Pausa tranquila»." },
    2: { rounds: 5, mechanics: ["emocion"], params: { emocion: { emos: ["feliz", "triste", "enojado"] } },
         intro: "Stage 1 · Nivel 2 · Este nivel tiene 5 caras. Vas a decir qué emoción muestra cada una: feliz, triste o enojado." },
    3: { rounds: 5, mechanics: ["situacion"], params: { situacion: {} },
         intro: "Stage 1 · Nivel 3 · Este nivel tiene 5 situaciones. Vas a elegir cómo se siente la persona en cada una." },
    4: { rounds: 4, mechanics: ["turnos"], params: { turnos: {} },
         intro: "Stage 1 · Nivel 4 · Este nivel tiene 4 conversaciones. Vas a elegir la mejor respuesta para seguir hablando con alguien." },
    5: { rounds: 5, mechanics: ["figurado"], params: { figurado: {} },
         intro: "Stage 1 · Nivel 5 · Algunas frases dicen una cosa pero significan otra. Este nivel tiene 5 frases y vas a elegir qué quieren decir." },
    6: { rounds: 3, mechanics: ["cambio"], params: { cambio: {} },
         intro: "Stage 1 · Nivel 6 · A veces el plan cambia. Este nivel tiene 3 cambios de plan. Vas a elegir cómo seguir. Es normal que un cambio incomode." },
    7: { rounds: 5, mechanics: ["senales"], params: { senales: {} },
         intro: "Stage 1 · Nivel 7 · El cuerpo también comunica. Este nivel tiene 5 escenas. Mira las señales y elige qué siente la persona." },
    8: { rounds: 3, mechanics: ["secuencia"], params: { secuencia: {} },
         intro: "Stage 1 · Nivel 8 · Este nivel tiene 3 pasos a paso sociales. Toca los pasos en el orden en que se hacen." },
    9: { rounds: 3, mechanics: ["creencia"], params: { creencia: {} },
         intro: "Stage 1 · Nivel 9 · Las personas piensan según lo que vieron. Este nivel tiene 3 historias y una pregunta en cada una: dónde va a buscar la persona." },
    10: { rounds: 9,
          mechanics: ["agenda", "emocion", "situacion", "turnos", "figurado", "cambio", "senales", "creencia", "secuencia"],
          params: {
            agenda: { modes: ["despues", "antes"] },
            emocion: { emos: ["feliz", "triste", "enojado", "sorprendido", "asustado", "tranquilo"] },
            situacion: {}, turnos: {}, figurado: {}, cambio: {}, senales: {}, creencia: {},
            secuencia: {}
          },
          intro: "Stage 1 · Nivel 10 · Última misión de la base: 9 retos, uno de cada tipo que practicaste. Sin tiempo límite. Recuerda que puedes usar «Pausa tranquila»." },

    // ══ Stage 2 · Media (11-20): predictibilidad y comunicación adulta ═════
    11: { rounds: 10, mechanics: ["agenda"], params: { agenda: { bancos: AGENDA_ADULTO, modes: ["despues"] } },
          intro: "Stage 2 · Nivel 11 · Ahora la agenda es de un día de trabajo. Sigue siendo siempre en el mismo orden." },
    12: { rounds: 10, mechanics: ["emocion"], params: { emocion: { emos: EMO_KEYS } },
          intro: "Stage 2 · Nivel 12 · Reconoce emociones en contexto de trabajo." },
    13: { rounds: 10, mechanics: ["situacion"], params: { situacion: { bancos: SITUACIONES_ADULTO } },
          intro: "Stage 2 · Nivel 13 · Situaciones de la vida adulta: entrevistas, préstamos, proyectos." },
    14: { rounds: 10, mechanics: ["turnos"], params: { turnos: { bancos: DIALOGOS_ADULTO } },
          intro: "Stage 2 · Nivel 14 · Turnos de conversación en el trabajo." },
    15: { rounds: 10, mechanics: ["figurado"], params: { figurado: { bancos: FIGURADO_ADULTO } },
          intro: "Stage 2 · Nivel 15 · Frases de uso cotidiano entre personas adultas." },
    16: { rounds: 10, mechanics: ["cambio"], params: { cambio: { bancos: CAMBIOS_ADULTO } },
          intro: "Stage 2 · Nivel 16 · Cambios de plan en el trabajo o el estudio." },
    17: { rounds: 10, mechanics: ["senales"], params: { senales: { bancos: SENALES_ADULTO } },
          intro: "Stage 2 · Nivel 17 · Señales del cuerpo en el trabajo." },
    18: { rounds: 10, mechanics: ["secuencia"], params: { secuencia: { bancos: [SECUENCIAS_ADULTO[1]] } },
          intro: "Stage 2 · Nivel 18 · Aprende a pedir ayuda a tu supervisor, paso a paso." },
    19: { rounds: 10, mechanics: ["creencia"], params: { creencia: { bancos: CREENCIAS_ADULTO } },
          intro: "Stage 2 · Nivel 19 · Creencias de otras personas en el trabajo." },
    20: { rounds: 10,
          mechanics: ["agenda", "emocion", "situacion", "turnos", "figurado", "cambio", "senales", "creencia"],
          params: {
            agenda: { bancos: AGENDA_ADULTO, modes: ["despues", "antes"] }, emocion: { emos: EMO_KEYS },
            situacion: { bancos: SITUACIONES_ADULTO }, turnos: { bancos: DIALOGOS_ADULTO },
            figurado: { bancos: FIGURADO_ADULTO }, cambio: { bancos: CAMBIOS_ADULTO },
            senales: { bancos: SENALES_ADULTO }, creencia: { bancos: CREENCIAS_ADULTO }
          },
          intro: "Stage 2 · Nivel 20 · Reto integrador de la etapa Media: mezcla todo lo practicado." },

    // ══ Stage 3 · Alta (21-30): convivencia y relaciones ════════════════════
    21: { rounds: 10, mechanics: ["agenda"], params: { agenda: { bancos: AGENDA_ADULTO, modes: ["despues", "antes"] } },
          intro: "Stage 3 · Nivel 21 · Sigue practicando con la agenda del día." },
    22: { rounds: 10, mechanics: ["dobleSentido"], params: { dobleSentido: { bancos: DOBLE_SENTIDO } },
          intro: "Stage 3 · Nivel 22 · Mecánica nueva: Doble sentido social. A veces las palabras y la intención no son lo mismo." },
    23: { rounds: 10, mechanics: ["situacion"], params: { situacion: { bancos: SITUACIONES_ADULTO } },
          intro: "Stage 3 · Nivel 23 · Situaciones de citas médicas y trámites." },
    24: { rounds: 10, mechanics: ["turnos"], params: { turnos: { bancos: DIALOGOS_ADULTO } },
          intro: "Stage 3 · Nivel 24 · Turnos de conversación en una reunión." },
    25: { rounds: 10, mechanics: ["cambio"], params: { cambio: { bancos: CAMBIOS_ADULTO } },
          intro: "Stage 3 · Nivel 25 · Cambios de plan más complejos." },
    26: { rounds: 10, mechanics: ["emocion"], params: { emocion: { emos: EMO_KEYS } },
          intro: "Stage 3 · Nivel 26 · Sigue practicando el reconocimiento de emociones." },
    27: { rounds: 10, mechanics: ["secuencia"], params: { secuencia: { bancos: [SECUENCIAS_ADULTO[0]] } },
          intro: "Stage 3 · Nivel 27 · Unirte a una conversación de trabajo, paso a paso." },
    28: { rounds: 10, mechanics: ["creencia"], params: { creencia: { bancos: CREENCIAS_ADULTO } },
          intro: "Stage 3 · Nivel 28 · Más historias sobre lo que piensan los demás." },
    29: { rounds: 10, mechanics: ["dobleSentido", "turnos"],
          params: { dobleSentido: { bancos: DOBLE_SENTIDO }, turnos: { bancos: DIALOGOS_ADULTO } },
          intro: "Stage 3 · Nivel 29 · Doble sentido y turnos de conversación, alternados." },
    30: { rounds: 10,
          mechanics: ["agenda", "dobleSentido", "situacion", "turnos", "cambio", "emocion", "secuencia", "creencia"],
          params: {
            agenda: { bancos: AGENDA_ADULTO, modes: ["despues", "antes"] }, dobleSentido: { bancos: DOBLE_SENTIDO },
            situacion: { bancos: SITUACIONES_ADULTO }, turnos: { bancos: DIALOGOS_ADULTO },
            cambio: { bancos: CAMBIOS_ADULTO }, emocion: { emos: EMO_KEYS },
            secuencia: { bancos: [SECUENCIAS_ADULTO[0]] }, creencia: { bancos: CREENCIAS_ADULTO }
          },
          intro: "Stage 3 · Nivel 30 · Reto integrador de la etapa Alta: mezcla todo lo practicado." },

    // ══ Stage 4 · Muy Alta (31-40): trabajo y autonomía social ══════════════
    31: { rounds: 10, mechanics: ["secuencia"], params: { secuencia: { bancos: [SECUENCIAS_ADULTO[2]] } },
          intro: "Stage 4 · Nivel 31 · Aprende a pedir un permiso en el trabajo, paso a paso." },
    32: { rounds: 10, mechanics: ["dobleSentido"], params: { dobleSentido: { bancos: DOBLE_SENTIDO } },
          intro: "Stage 4 · Nivel 32 · Doble sentido en contexto de pareja y amistad." },
    33: { rounds: 10, mechanics: ["agenda", "cambio"],
          params: { agenda: { bancos: AGENDA_ADULTO, modes: ["despues", "antes"] }, cambio: { bancos: CAMBIOS_ADULTO } },
          intro: "Stage 4 · Nivel 33 · Agenda y cambios de plan, combinados." },
    34: { rounds: 10, mechanics: ["situacion", "emocion"],
          params: { situacion: { bancos: SITUACIONES_ADULTO }, emocion: { emos: EMO_KEYS } },
          intro: "Stage 4 · Nivel 34 · Situaciones y emociones, combinadas." },
    35: { rounds: 10, mechanics: ["figurado"], params: { figurado: { bancos: FIGURADO_ADULTO } },
          intro: "Stage 4 · Nivel 35 · Expresiones más complejas del lenguaje cotidiano." },
    36: { rounds: 10, mechanics: ["creencia", "turnos"],
          params: { creencia: { bancos: CREENCIAS_ADULTO }, turnos: { bancos: DIALOGOS_ADULTO } },
          intro: "Stage 4 · Nivel 36 · Creencias de otros y turnos de conversación, combinados." },
    37: { rounds: 10, mechanics: ["senales", "dobleSentido"],
          params: { senales: { bancos: SENALES_ADULTO }, dobleSentido: { bancos: DOBLE_SENTIDO } },
          intro: "Stage 4 · Nivel 37 · Señales del cuerpo y doble sentido, combinados." },
    38: { rounds: 10, mechanics: ["secuencia"], params: { secuencia: { bancos: [SECUENCIAS_ADULTO[3]] } },
          intro: "Stage 4 · Nivel 38 · Aprende a resolver un malentendido, paso a paso." },
    39: { rounds: 10, mechanics: ["cambio", "emocion"],
          params: { cambio: { bancos: CAMBIOS_ADULTO }, emocion: { emos: EMO_KEYS } },
          intro: "Stage 4 · Nivel 39 · Cambios de plan y emociones, combinados." },
    40: { rounds: 10,
          mechanics: ["secuencia", "dobleSentido", "agenda", "situacion", "figurado", "creencia", "senales"],
          params: {
            secuencia: { bancos: SECUENCIAS_ADULTO }, dobleSentido: { bancos: DOBLE_SENTIDO },
            agenda: { bancos: AGENDA_ADULTO, modes: ["despues", "antes"] }, situacion: { bancos: SITUACIONES_ADULTO },
            figurado: { bancos: FIGURADO_ADULTO }, creencia: { bancos: CREENCIAS_ADULTO },
            senales: { bancos: SENALES_ADULTO }
          },
          intro: "Stage 4 · Nivel 40 · Reto integrador de la etapa Muy Alta: mezcla todo lo practicado." },

    // ══ Stage 5 · Súper Difícil (41-50): integración total ══════════════════
    41: { rounds: 10, mechanics: ["dobleSentido", "figurado"],
          params: { dobleSentido: { bancos: DOBLE_SENTIDO }, figurado: { bancos: FIGURADO_ADULTO } },
          intro: "Stage 5 · Nivel 41 · Doble sentido y lenguaje figurado, sin previo aviso de cuál toca." },
    42: { rounds: 10, mechanics: ["creencia", "situacion"],
          params: { creencia: { bancos: CREENCIAS_ADULTO }, situacion: { bancos: SITUACIONES_ADULTO } },
          intro: "Stage 5 · Nivel 42 · Creencias y situaciones, combinadas." },
    43: { rounds: 10, mechanics: ["turnos", "senales"],
          params: { turnos: { bancos: DIALOGOS_ADULTO }, senales: { bancos: SENALES_ADULTO } },
          intro: "Stage 5 · Nivel 43 · Turnos de conversación y señales del cuerpo, alternados." },
    44: { rounds: 10, mechanics: ["agenda", "cambio", "emocion"],
          params: {
            agenda: { bancos: AGENDA_ADULTO, modes: ["despues", "antes"] }, cambio: { bancos: CAMBIOS_ADULTO },
            emocion: { emos: EMO_KEYS }
          },
          intro: "Stage 5 · Nivel 44 · Agenda, cambios de plan y emociones, combinados." },
    45: { rounds: 10, mechanics: ["secuencia", "dobleSentido"],
          params: { secuencia: { bancos: SECUENCIAS_ADULTO }, dobleSentido: { bancos: DOBLE_SENTIDO } },
          intro: "Stage 5 · Nivel 45 · Pasos sociales y doble sentido, combinados." },
    46: { rounds: 10, mechanics: ["figurado", "creencia", "turnos"],
          params: { figurado: { bancos: FIGURADO_ADULTO }, creencia: { bancos: CREENCIAS_ADULTO }, turnos: { bancos: DIALOGOS_ADULTO } },
          intro: "Stage 5 · Nivel 46 · Lenguaje figurado, creencias y turnos, sin repetir el mismo tipo de reto." },
    47: { rounds: 10, mechanics: ["situacion", "senales", "dobleSentido"],
          params: { situacion: { bancos: SITUACIONES_ADULTO }, senales: { bancos: SENALES_ADULTO }, dobleSentido: { bancos: DOBLE_SENTIDO } },
          intro: "Stage 5 · Nivel 47 · Situaciones, señales del cuerpo y doble sentido, combinados." },
    48: { rounds: 10, mechanics: ["agenda", "secuencia", "cambio", "emocion"],
          params: {
            agenda: { bancos: AGENDA_ADULTO, modes: ["despues", "antes"] }, secuencia: { bancos: SECUENCIAS_ADULTO },
            cambio: { bancos: CAMBIOS_ADULTO }, emocion: { emos: EMO_KEYS }
          },
          intro: "Stage 5 · Nivel 48 · Cuatro mecánicas alternadas, sin previo aviso." },
    49: { rounds: 10, mechanics: ["dobleSentido", "figurado", "creencia", "turnos", "senales"],
          params: {
            dobleSentido: { bancos: DOBLE_SENTIDO }, figurado: { bancos: FIGURADO_ADULTO },
            creencia: { bancos: CREENCIAS_ADULTO }, turnos: { bancos: DIALOGOS_ADULTO }, senales: { bancos: SENALES_ADULTO }
          },
          intro: "Stage 5 · Nivel 49 · Mezcla exigente de casi todas las mecánicas. Falta solo el reto final." },
    50: { rounds: 10,
          mechanics: ["agenda", "emocion", "situacion", "turnos", "figurado", "cambio", "senales", "creencia", "dobleSentido", "secuencia"],
          params: {
            agenda: { bancos: AGENDA_ADULTO, modes: ["despues", "antes"] }, emocion: { emos: EMO_KEYS },
            situacion: { bancos: SITUACIONES_ADULTO }, turnos: { bancos: DIALOGOS_ADULTO },
            figurado: { bancos: FIGURADO_ADULTO }, cambio: { bancos: CAMBIOS_ADULTO },
            senales: { bancos: SENALES_ADULTO }, creencia: { bancos: CREENCIAS_ADULTO },
            dobleSentido: { bancos: DOBLE_SENTIDO }, secuencia: { bancos: SECUENCIAS_ADULTO }
          },
          intro: "Stage 5 · Nivel 50 · Reto final de La Estación de las Señales: todo lo que aprendiste sobre comunicación y predictibilidad. Sin tiempo límite. ¡Tú puedes!" }
  };

  global.IndecapGame.register({
    slug: "tea_senales",

    getLevel: function (level) {
      var base = NIVELES[level] || NIVELES[1];
      // Se copia la configuración para que un nivel nunca mute a otro.
      return {
        rounds: base.rounds,
        mechanics: base.mechanics.slice(),
        params: base.params,
        offset: rnd(0, 99),
        intro: base.intro
      };
    },

    buildRound: function (cfg, index, ctx) {
      var m = cfg.mechanics[index % cfg.mechanics.length];
      var p = Object.assign({}, cfg.params[m], { offset: cfg.offset });
      return CONSTRUCTORES[m](p, ctx || { support: 1 }, index);
    }
  });
})(window);
