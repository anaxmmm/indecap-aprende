/**
 * LA ESTACIÓN DE LAS SEÑALES — Trastorno del espectro autista
 *
 * Habilidad núcleo: predictibilidad, comunicación social y flexibilidad.
 *  - Agenda y anticipación ............ corteza prefrontal (planificación)
 *  - Reconocer emociones y señales .... giro fusiforme, surco temporal superior
 *  - Lenguaje figurado y turnos ....... surco temporal superior, prefrontal medial
 *  - Creencias de otros (teoría de la mente) ... corteza prefrontal medial
 *
 * Principios de diseño:
 *  - Cero presión de tiempo en todos los niveles.
 *  - Estructura predecible: cada nivel anuncia en la intro qué va a pasar.
 *  - Lenguaje literal y consignas cortas en las respuestas del juego.
 *  - Control sensorial siempre visible: alto contraste, reducir movimiento,
 *    volumen de voz (botón de voz) y "Pausa tranquila".
 *  - Nivel 10: evaluación embebida con una muestra de todas las mecánicas.
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

  // ─── Datos ────────────────────────────────────────────────────────────────

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

  // ─── Mecánicas de opción única ────────────────────────────────────────────

  function agendaVisual(refIdx) {
    var partes = AGENDA.map(function (a, i) {
      return '<span class="tea-agenda__item' + (i === refIdx ? " is-ref" : "") + '">' +
        '<span class="tea-agenda__n">' + (i + 1) + "</span>" +
        '<span class="tea-agenda__i">' + a.i + "</span>" +
        "<span>" + a.t + "</span></span>";
    });
    return '<div class="tea-agenda">' + partes.join('<span class="tea-agenda__arrow" aria-hidden="true">→</span>') + "</div>";
  }

  /** Agenda: anticipar qué viene antes y después. Siempre la misma agenda. */
  function retoAgenda(p) {
    var modes = p.modes || ["despues"];
    var mode = modes[rnd(0, modes.length - 1)];
    var ref = mode === "despues" ? rnd(0, AGENDA.length - 2) : rnd(1, AGENDA.length - 1);
    var ansIdx = mode === "despues" ? ref + 1 : ref - 1;
    var ok = AGENDA[ansIdx].t;
    var bads = AGENDA.filter(function (a, i) { return i !== ansIdx && i !== ref; })
      .map(function (a) { return a.t; });
    var lista = AGENDA.map(function (a) { return a.t; }).join(", ");
    var prompt = "La agenda de hoy es: " + lista + ". ¿Qué viene " +
      (mode === "despues" ? "después de " : "antes de ") + AGENDA[ref].t + "?";
    return {
      skill: "agenda_" + mode,
      prompt: prompt,
      speech: prompt,
      visual: agendaVisual(ref),
      options: textOptions(ok, bads, 3),
      answer: ok,
      answerLabel: ok,
      hint: "Sigue las flechas de la agenda. Siempre va en el mismo orden.",
      explain: "En la agenda, " + ok + " va " + (mode === "despues" ? "después de " : "antes de ") + AGENDA[ref].t + "."
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
  function retoSituacion() {
    var s = SITUACIONES[rnd(0, SITUACIONES.length - 1)];
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

  /** Leer señales del cuerpo. */
  function retoSenales() {
    var s = SENALES[rnd(0, SENALES.length - 1)];
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
  function retoTurnos() {
    var d = DIALOGOS[rnd(0, DIALOGOS.length - 1)];
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
  function retoFigurado() {
    var f = FIGURADO[rnd(0, FIGURADO.length - 1)];
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
  function retoCambio() {
    var c = CAMBIOS[rnd(0, CAMBIOS.length - 1)];
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
  function retoCreencia() {
    var c = CREENCIAS[rnd(0, CREENCIAS.length - 1)];
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

  // ─── Mecánica con interfaz propia: ordenar pasos sociales ─────────────────

  function roundSecuencia(p, ctx, index) {
    var r = SECUENCIAS[((p.offset || 0) + index) % SECUENCIAS.length];
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

  // ─── Definición de los 10 niveles ─────────────────────────────────────────

  var CONSTRUCTORES = {
    agenda: function (p) { return retoAgenda(p); },
    emocion: function (p) { return retoEmocion(p); },
    situacion: function () { return retoSituacion(); },
    turnos: function () { return retoTurnos(); },
    figurado: function () { return retoFigurado(); },
    cambio: function () { return retoCambio(); },
    senales: function () { return retoSenales(); },
    secuencia: roundSecuencia,
    creencia: function () { return retoCreencia(); }
  };

  var NIVELES = {
    1: { rounds: 5, mechanics: ["agenda"], params: { agenda: { modes: ["despues"] } },
         intro: "Bienvenida a la Estación de las Señales. Soy NOVA. Aquí todo es predecible: la agenda siempre va en el mismo orden y no hay tiempo límite. Este nivel tiene 5 preguntas sobre la agenda de hoy. Si necesitas parar, usa «Pausa tranquila»." },
    2: { rounds: 5, mechanics: ["emocion"], params: { emocion: { emos: ["feliz", "triste", "enojado"] } },
         intro: "Este nivel tiene 5 caras. Vas a decir qué emoción muestra cada una: feliz, triste o enojado." },
    3: { rounds: 5, mechanics: ["situacion"], params: { situacion: {} },
         intro: "Este nivel tiene 5 situaciones. Vas a elegir cómo se siente la persona en cada una." },
    4: { rounds: 4, mechanics: ["turnos"], params: { turnos: {} },
         intro: "Este nivel tiene 4 conversaciones. Vas a elegir la mejor respuesta para seguir hablando con alguien." },
    5: { rounds: 5, mechanics: ["figurado"], params: { figurado: {} },
         intro: "Algunas frases dicen una cosa pero significan otra. Este nivel tiene 5 frases y vas a elegir qué quieren decir." },
    6: { rounds: 3, mechanics: ["cambio"], params: { cambio: {} },
         intro: "A veces el plan cambia. Este nivel tiene 3 cambios de plan. Vas a elegir cómo seguir. Es normal que un cambio incomode." },
    7: { rounds: 5, mechanics: ["senales"], params: { senales: {} },
         intro: "El cuerpo también comunica. Este nivel tiene 5 escenas. Mira las señales y elige qué siente la persona." },
    8: { rounds: 3, mechanics: ["secuencia"], params: { secuencia: {} },
         intro: "Este nivel tiene 3 pasos a paso sociales. Toca los pasos en el orden en que se hacen." },
    9: { rounds: 3, mechanics: ["creencia"], params: { creencia: {} },
         intro: "Las personas piensan según lo que vieron. Este nivel tiene 3 historias y una pregunta en cada una: dónde va a buscar la persona." },
    10: { rounds: 9,
          mechanics: ["agenda", "emocion", "situacion", "turnos", "figurado", "cambio", "senales", "creencia", "secuencia"],
          params: {
            agenda: { modes: ["despues", "antes"] },
            emocion: { emos: ["feliz", "triste", "enojado", "sorprendido", "asustado", "tranquilo"] },
            situacion: {}, turnos: {}, figurado: {}, cambio: {}, senales: {}, creencia: {},
            secuencia: {}
          },
          intro: "Última misión de la estación: 9 retos, uno de cada tipo que practicaste. Sin tiempo límite. Recuerda que puedes usar «Pausa tranquila»." }
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