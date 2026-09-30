/**
 * EL ENIGMA LINGÜÍSTICO — Discapacidad auditiva
 *
 * Habilidad núcleo: acceso al lenguaje por canal visual y vibrotáctil.
 * Todo lo que en otros juegos depende del oído tiene aquí un espejo 100%
 * visual o vibrotáctil; el juego apaga la voz sintética al arrancar.
 *  - Vocabulario pictograma + seña + palabra ...... corteza occipito-temporal
 *  - Historias y frases en orden .................. área de Broca (sintaxis)
 *  - Ritmo por luz y vibración .................... sustituto no auditivo de la prosodia
 *  - Emociones y expresión facial ................. giro fusiforme
 *  - Memoria de símbolos y subtítulos ............. memoria de trabajo visual
 *  - Señales visuales cotidianas ................... vida independiente (15-26 años)
 *
 * MAPA DE ETAPAS (5 Stages de 10 niveles, 50 en total, numeración continua):
 *   Stage 1 · Base            → niveles 1-10  (sin cambio de contenido)
 *   Stage 2 · Media           → niveles 11-20 (vocabulario y contexto de vida adulta)
 *   Stage 3 · Alta            → niveles 21-30 (comprensión y escenarios más exigentes)
 *   Stage 4 · Muy Alta        → niveles 31-40 (integración de dos mecánicas por nivel)
 *   Stage 5 · Súper Difícil   → niveles 41-50 (integración total)
 *
 * El desbloqueo de nivel a nivel (score >= 60) lo maneja
 * games/services.py::get_unlocked_level, agnóstico al número de niveles.
 *
 * VIDEOS DE SEÑAS (opcionales): si existe app/static/media/senas/<palabra>.mp4
 * se muestra el video; si no, se muestra el pictograma. Los videos deben ser
 * grabados o validados por la psicóloga o un intérprete de lengua de señas.
 *
 * Seguridad fotosensible: las luces nunca parpadean más de 1 vez por segundo.
 * La mecánica de señales visuales (Stage 2 en adelante) no usa parpadeo
 * animado: se representa con iconos estáticos, para no añadir ningún riesgo
 * nuevo de destello.
 * Nivel 10: evaluación embebida de la base.
 */
(function (global) {
  "use strict";

  // ─── Utilidades ───────────────────────────────────────────────────────────
  function rnd(a, b) { return Math.floor(Math.random() * (b - a + 1)) + a; }
  function pick(a) { return a[rnd(0, a.length - 1)]; }
  function shuffle(a) { a = a.slice(); for (var i = a.length - 1; i > 0; i--) { var j = rnd(0, i), t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  function el(tag, cls) { var n = document.createElement(tag); if (cls) n.className = cls; return n; }
  function live() { var n = el("p", "visually-hidden"); n.setAttribute("role", "status"); n.setAttribute("aria-live", "polite"); return n; }
  function mult(ctx) { var s = (ctx && ctx.support) || 1; return s === 1 ? 1.5 : (s === 2 ? 1.2 : 1); }
  function sched() {
    var alive = true, timers = [];
    return {
      later: function (fn, ms) { timers.push(setTimeout(function () { if (alive) fn(); }, ms)); },
      stop: function () { alive = false; timers.forEach(clearTimeout); }
    };
  }
  function addStyles(id, css) {
    if (document.getElementById(id)) return;
    var s = document.createElement("style"); s.id = id; s.textContent = css; document.head.appendChild(s);
  }
  function textOpts(ok, bads, n) {
    return shuffle([ok].concat(shuffle(bads).slice(0, n - 1))).map(function (t) { return { label: t, value: t, aria: t }; });
  }
  function vibrate(ms) { try { if (navigator.vibrate) navigator.vibrate(ms); } catch (e) {} }

  /** La voz sintética no se usa en este juego: se apaga el botón una sola vez. */
  var muted = false;
  function muteSpeech() {
    if (muted) return; muted = true;
    var b = document.querySelector('[data-a11y-action="speak"]');
    if (!b) return;
    if (b.getAttribute("aria-pressed") === "true") b.click();
    b.hidden = true;
  }

  addStyles("auditiva-styles", [
    ".game-shell .game-options .game-option{font-size:1.15rem;max-width:300px}",
    ".aud-big{font-size:4.5rem;line-height:1}",
    ".aud-sign{font-size:4.5rem}",
    ".aud-video{width:180px;max-width:100%;border-radius:12px;border:3px solid var(--g-frame)}",
    ".aud-row{display:flex;flex-wrap:wrap;gap:16px;justify-content:center;align-items:center}",
    ".aud-status{flex-basis:100%;font-weight:600;color:var(--g-muted);margin-bottom:8px}",
    ".aud-actions{flex-basis:100%;display:flex;flex-wrap:wrap;gap:12px;justify-content:center}",
    ".aud-flash{flex-basis:100%;width:160px;height:160px;margin:0 auto 12px;border-radius:24px;background:#DCE4EA;border:4px solid var(--g-frame);transition:background .1s}",
    ".aud-flash.is-on{background:var(--g-accent-soft);box-shadow:0 0 0 10px var(--g-accent)}",
    ".aud-stim{flex-basis:100%;min-height:110px;display:flex;align-items:center;justify-content:center;font-size:5rem}",
    ".aud-entered{flex-basis:100%;font-size:2rem;min-height:44px;letter-spacing:.3em;color:var(--g-frame)}",
    ".aud-scene{flex-basis:100%;font-size:5rem;line-height:1.1}",
    ".aud-caption{flex-basis:100%;background:#111627;color:#FFFFFF;border-radius:10px;padding:12px 16px;font-size:1.2rem;line-height:1.5;max-width:520px;margin:8px auto 12px}",
    ".seq-status{flex-basis:100%;font-weight:600;color:var(--g-muted);margin-bottom:8px}",
    ".seq-list{flex-basis:100%;list-style:none;margin:0 auto 12px;padding:0;max-width:480px;text-align:left}",
    ".seq-list li{background:var(--g-ok-soft);border:2px solid var(--g-ok);color:var(--g-ok);border-radius:12px;padding:10px 14px;margin-bottom:8px;font-weight:600}",
    ".seq-steps{flex-basis:100%;display:flex;flex-wrap:wrap;gap:12px;justify-content:center}",
    ".game-option.seq-step{display:flex;flex-direction:column;align-items:center;gap:6px;font-size:1.05rem;min-width:110px}",
    ".seq-icon{font-size:2.4rem;line-height:1}",
    ".game-option.seq-next{outline:4px solid var(--g-accent);outline-offset:3px}",
    ".game-shell[data-game-slug=\"auditiva_enigma\"] .game-stage{min-height:0;align-items:flex-start;padding-top:20px}",
    ".game-shell[data-game-slug=\"auditiva_enigma\"] .game-screen.is-active{padding-top:4px}"
  ].join("\n"));

  function sequenceMount(steps, help, showText, extra) {
    return function (host, api) {
      var n = steps.length;
      host.innerHTML = "";
      var lv = live(), status = el("p", "seq-status"), done = el("ol", "seq-list"), pool = el("div", "seq-steps");
      done.setAttribute("aria-label", "Ya ordenados");
      pool.setAttribute("role", "group"); pool.setAttribute("aria-label", "Elementos para ordenar");
      [lv, status, done, pool].forEach(function (x) { host.appendChild(x); });
      var order = shuffle(steps), g = 0;
      while (g++ < 10 && order.every(function (o, k) { return o.k === steps[k].k; })) order = shuffle(steps);
      var pos = 0, errors = 0, finished = false, highlight = help === 1, btns = [];
      function refresh() {
        status.textContent = "Paso " + Math.min(pos + 1, n) + " de " + n;
        btns.forEach(function (b) { b.el.classList.toggle("seq-next", highlight && pos < n && b.o.k === steps[pos].k); });
      }
      order.forEach(function (o) {
        var b = el("button", "game-option seq-step"); b.type = "button";
        if (o.i) { var ic = el("span", "seq-icon"); ic.textContent = o.i; ic.setAttribute("aria-hidden", "true"); b.appendChild(ic); }
        if (showText) { var tx = el("span"); tx.textContent = o.t; b.appendChild(tx); }
        b.setAttribute("aria-label", o.t);
        b.addEventListener("click", function () { tap(b, o); });
        pool.appendChild(b); btns.push({ el: b, o: o });
      });
      function tap(btn, o) {
        if (finished) return;
        if (o.k === steps[pos].k) {
          pos++;
          btns = btns.filter(function (x) { return x.el !== btn; });
          btn.remove();
          var li = el("li"); li.textContent = (o.i ? o.i + " " : "") + o.t; done.appendChild(li);
          lv.textContent = "Paso " + pos + ": " + o.t;
          api.feedback("", "");
          if (pos === n) { end(); return; }
          refresh();
          if (btns[0]) btns[0].el.focus();
        } else {
          errors++;
          btn.classList.add("is-wrong");
          setTimeout(function () { btn.classList.remove("is-wrong"); }, 500);
          api.feedback("Ese va después. Mira los dibujos y prueba otra vez.", "retry");
          if (help === 2) highlight = true;
          refresh();
          if (errors === 2) api.hint();
        }
      }
      function end() {
        finished = true;
        status.textContent = "¡Completo!";
        var err = { wrong: errors, help_level: help, attempts: errors + 1 };
        Object.keys(extra || {}).forEach(function (k) { err[k] = extra[k]; });
        api.done({
          stars: errors === 0 ? 1 : (errors === 1 ? 0.75 : (errors <= 3 ? 0.5 : 0.25)),
          message: errors === 0 ? "¡Todo en orden!" : "¡Lo lograste!",
          error: errors ? err : null
        });
      }
      refresh();
      return function () { finished = true; };
    };
  }

  // ─── Datos: base (Stage 1, sin cambios) ────────────────────────────────────
  var SENAS_BASE = "/static/media/senas/";
  var VOCAB = [
    ["🐶", "perro"], ["🐱", "gato"], ["🍎", "manzana"], ["🏠", "casa"], ["📚", "libro"],
    ["🚌", "bus"], ["🌞", "sol"], ["💧", "agua"], ["🍞", "pan"], ["🎒", "maleta"]
  ];
  function signHtml(word) {
    return '<video class="aud-video" src="' + SENAS_BASE + word + '.mp4" muted loop autoplay playsinline ' +
      'aria-label="Seña de ' + word + '" ' +
      'onerror="this.replaceWith(document.createTextNode(\'🤟\'))"></video>';
  }
  var HISTORIAS = [
    { title: "Un día de lluvia", steps: [{ i: "☁️", t: "El cielo se llena de nubes" }, { i: "🌧️", t: "Empieza a llover" }, { i: "☂️", t: "Abro el paraguas" }, { i: "🌈", t: "Sale el arcoíris" }] },
    { title: "Ir al colegio", steps: [{ i: "⏰", t: "Suena la alarma" }, { i: "👕", t: "Me visto" }, { i: "🚌", t: "Tomo el bus" }, { i: "🏫", t: "Llego al colegio" }] },
    { title: "Plantar una semilla", steps: [{ i: "🌰", t: "Pongo la semilla en la tierra" }, { i: "💧", t: "La riego" }, { i: "🌱", t: "Sale un brote" }, { i: "🌻", t: "Crece una flor" }] }
  ];
  var FRASES = [
    { p: "👧 🍎 😋", w: ["La", "niña", "come", "una", "manzana"] },
    { p: "🐶 🏃 🌳", w: ["El", "perro", "corre", "en", "el", "parque"] },
    { p: "👦 📖 🏠", w: ["El", "niño", "lee", "en", "casa"] },
    { p: "🐱 🥛 😋", w: ["El", "gato", "toma", "leche"] },
    { p: "🚌 🏫 👧", w: ["La", "niña", "va", "en", "bus", "al", "colegio"] },
    { p: "🐦 ✈️ ☁️", w: ["El", "pájaro", "vuela", "entre", "las", "nubes"] }
  ];
  var EMO = [["😀", "Feliz"], ["😢", "Triste"], ["😠", "Enojado"], ["😮", "Sorprendido"], ["😨", "Asustado"], ["🤢", "Asqueado"]];
  var SIMBOLOS = [["🌞", "sol"], ["🌙", "luna"], ["⭐", "estrella"], ["🌈", "arcoíris"], ["☁️", "nube"], ["🔥", "fuego"]];
  var CUENTOS = [
    { scenes: [{ i: "🧒🎒", c: "Pedro se despierta y alista su maleta." }, { i: "🚌", c: "Toma el bus para ir al colegio." }, { i: "🏫📚", c: "En clase, la profesora enseña los colores." }],
      qs: [{ q: "¿Cómo va Pedro al colegio?", ok: "En bus", bad: ["A pie", "En bicicleta"] }, { q: "¿Qué enseña la profesora?", ok: "Los colores", bad: ["Los números", "Los animales"] }] },
    { scenes: [{ i: "👧🐱", c: "Lucía encuentra un gato pequeño en la calle." }, { i: "🥛", c: "Le da un poco de leche." }, { i: "🏠", c: "Lo lleva a casa y le hace una cama." }],
      qs: [{ q: "¿Qué encontró Lucía?", ok: "Un gato", bad: ["Un perro", "Un pájaro"] }, { q: "¿Qué le dio de tomar?", ok: "Leche", bad: ["Agua con azúcar", "Jugo"] }] },
    { scenes: [{ i: "👨‍🍳🍞", c: "Don Carlos hace pan en la mañana." }, { i: "🏪", c: "Lo lleva a su tienda." }, { i: "👧💰", c: "Una niña compra dos panes." }],
      qs: [{ q: "¿Qué hace Don Carlos?", ok: "Pan", bad: ["Jugo", "Helado"] }, { q: "¿Cuántos panes compra la niña?", ok: "Dos", bad: ["Uno", "Cinco"] }] }
  ];

  // ─── Datos: vida adulta (Stage 2 en adelante, 15-26 años) ──────────────────
  var VOCAB_ADULTO = [
    ["💻", "computador"], ["📄", "documento"], ["🏢", "oficina"], ["📅", "agenda"], ["💳", "tarjeta"],
    ["🔑", "contraseña"], ["📞", "llamada"], ["🖊️", "firma"], ["🧾", "factura"], ["📦", "paquete"]
  ];
  var HISTORIAS_ADULTO = [
    { title: "Buscar empleo", steps: [{ i: "📝", t: "Actualiza su hoja de vida" }, { i: "📧", t: "Envía la solicitud" }, { i: "📞", t: "Lo llaman para la entrevista" }, { i: "🎉", t: "Lo contratan" }] },
    { title: "Pagar un servicio", steps: [{ i: "🧾", t: "Recibe la factura" }, { i: "🏦", t: "Va al banco" }, { i: "💳", t: "Paga con tarjeta" }, { i: "✅", t: "Guarda el recibo" }] },
    { title: "Preparar una entrevista", steps: [{ i: "👔", t: "Se viste formal" }, { i: "🕐", t: "Llega temprano" }, { i: "🤝", t: "Saluda al entrevistador" }, { i: "💬", t: "Responde las preguntas" }] }
  ];
  var FRASES_ADULTO = [
    { p: "👩‍💼 💻 📊", w: ["La", "jefa", "revisa", "el", "informe", "en", "el", "computador"] },
    { p: "👨 🏦 💳", w: ["El", "hombre", "paga", "la", "factura", "en", "el", "banco"] },
    { p: "👩 📞 🏥", w: ["Ella", "llama", "para", "pedir", "una", "cita", "médica"] },
    { p: "👨‍🎓 📚 🎓", w: ["El", "estudiante", "entrega", "su", "trabajo", "final"] },
    { p: "👩‍💼 🤝 📄", w: ["La", "jefa", "firma", "el", "contrato"] },
    { p: "👨 📦 🚪", w: ["El", "repartidor", "deja", "el", "paquete", "en", "la", "puerta"] }
  ];
  var EMO_ADULTO = [["😕", "Confundido"], ["😌", "Aliviado"], ["😤", "Impaciente"], ["🙏", "Agradecido"], ["😰", "Nervioso"], ["😊", "Orgulloso"]];
  var CUENTOS_ADULTO = [
    { scenes: [{ i: "👔📄", c: "Marta se prepara con su hoja de vida para la entrevista." }, { i: "🚶‍♀️🏢", c: "Llega a la empresa quince minutos antes." }, { i: "🤝💼", c: "El entrevistador le hace preguntas sobre su experiencia." }],
      qs: [{ q: "¿Qué lleva Marta a la entrevista?", ok: "Su hoja de vida", bad: ["Su celular", "Un regalo"] }, { q: "¿Cuánto tiempo antes llega?", ok: "Quince minutos", bad: ["Una hora", "Cinco minutos"] }] },
    { scenes: [{ i: "📬🧾", c: "Llega la factura del agua a la casa de Andrés." }, { i: "🏦💳", c: "Andrés va al banco y paga con su tarjeta." }, { i: "📱✅", c: "Recibe la confirmación del pago en su celular." }],
      qs: [{ q: "¿Qué factura le llegó a Andrés?", ok: "La del agua", bad: ["La de la luz", "La del internet"] }, { q: "¿Cómo paga?", ok: "Con tarjeta", bad: ["En efectivo", "Con cheque"] }] },
    { scenes: [{ i: "📞🏥", c: "Sofía llama para pedir una cita médica." }, { i: "📅", c: "Le dan una cita para el próximo martes." }, { i: "🩺", c: "El doctor la revisa y le da una recomendación." }],
      qs: [{ q: "¿Para qué día le dan la cita?", ok: "El martes", bad: ["El lunes", "El viernes"] }, { q: "¿Quién la revisa?", ok: "El doctor", bad: ["La enfermera", "El recepcionista"] }] }
  ];
  /** Señales visuales cotidianas: alertas que en la vida diaria suelen ser
      sonoras, presentadas aquí como icono estático (sin parpadeo) para no
      introducir ningún riesgo fotosensible nuevo. */
  var SENALES_VISUALES = [
    { icon: "🔔💡", label: "Timbre de la puerta con luz", action: "Alguien está en la puerta", bad: ["Se acabó la batería del celular", "Empezó a llover"] },
    { icon: "🚨🔴", label: "Alarma de incendio con luz intermitente", action: "Debes evacuar el edificio", bad: ["Debes cargar el celular", "Debes silenciar el timbre"] },
    { icon: "📳", label: "Celular vibrando", action: "Tienes una llamada o mensaje", bad: ["Se apagó el celular", "El celular se está cargando"] },
    { icon: "📹💬", label: "Notificación de videollamada con subtítulos activados", action: "Alguien te está llamando por video", bad: ["Se cortó la videollamada", "Se activó el modo avión"] },
    { icon: "⏰💡", label: "Despertador con luz parpadeante", action: "Es hora de levantarte", bad: ["Se fue la luz", "Sonó la alarma de incendio"] },
    { icon: "🚪🔦", label: "Timbre del trabajo con luz en el escritorio", action: "Te están llamando a una reunión", bad: ["Se dañó la luz del escritorio", "Terminó tu turno"] }
  ];

  // ─── Mecánicas de opción única ─────────────────────────────────────────────
  function retoVocab(p) {
    var banco = (p && p.bancos) || VOCAB;
    var v = pick(banco), otros = shuffle(banco.filter(function (x) { return x[1] !== v[1]; })).slice(0, 2);
    var prompt = "Mira el dibujo y la seña. Elige la palabra escrita que corresponde.";
    return {
      skill: "vocabulario_triple", prompt: prompt, speech: prompt,
      visual: '<div class="aud-row"><span class="aud-big">' + v[0] + "</span>" + signHtml(v[1]) + "</div>",
      options: textOpts(v[1], otros.map(function (x) { return x[1]; }), 3),
      answer: v[1], answerLabel: v[1],
      hint: "Fíjate en la primera letra de la palabra y en el dibujo.",
      explain: "El dibujo, la seña y la palabra se llaman «" + v[1] + "»."
    };
  }
  function retoEmocion(p) {
    var banco = (p && p.bancos) || EMO;
    var e = pick(banco), otros = shuffle(banco.filter(function (x) { return x[1] !== e[1]; })).slice(0, 3);
    var prompt = "Mira la cara. ¿Qué emoción muestra?";
    return {
      skill: "expresion_facial", prompt: prompt, speech: prompt,
      visual: '<span class="aud-big">' + e[0] + "</span>",
      options: shuffle([e].concat(otros)).map(function (x) { return { label: x[0] + " " + x[1], value: x[1], aria: x[1] }; }),
      answer: e[1], answerLabel: e[1],
      hint: "Mira la boca, las cejas y los ojos.",
      explain: "Esa cara muestra: " + e[1] + "."
    };
  }
  function retoSenales(p) {
    var banco = (p && p.bancos) || SENALES_VISUALES;
    var s = pick(banco);
    var prompt = "Mira la señal visual. ¿Qué significa?";
    return {
      skill: "senales_visuales", prompt: prompt, speech: prompt,
      visual: '<span class="aud-big">' + s.icon + '</span><p class="aud-caption">' + s.label + "</p>",
      options: textOpts(s.action, s.bad, 3),
      answer: s.action, answerLabel: s.action,
      hint: "Piensa en qué situación cotidiana usarías esa señal.",
      explain: s.label + " significa: " + s.action + "."
    };
  }

  // ─── Mecánicas con interfaz propia ────────────────────────────────────────
  function roundHistoria(p, ctx, index) {
    var banco = p.historias || HISTORIAS;
    var h = banco[((p.offset || 0) + index) % banco.length];
    var steps = h.steps.map(function (s, i) { return { k: "p" + i, i: s.i, t: s.t }; });
    var prompt = "Historia: «" + h.title + "». Toca las viñetas en el orden en que ocurre.";
    return {
      skill: "historia_pictogramas", prompt: prompt, speech: prompt,
      hint: "Piensa qué pasa primero, qué pasa después y cómo termina.",
      mount: sequenceMount(steps, (ctx && ctx.support) || 1, p.text !== false, { story: h.title })
    };
  }

  function roundFrase(p, ctx) {
    var banco = p.frases || FRASES;
    var pool = banco.filter(function (f) { return f.w.length >= p.minW && f.w.length <= p.maxW; });
    var f = pick(pool.length ? pool : banco);
    var steps = f.w.map(function (w, i) { return { k: w, t: w, n: i }; });
    var prompt = "Ordena las palabras para decir lo que muestran los dibujos.";
    return {
      skill: "construccion_frases", prompt: prompt, speech: prompt,
      visual: '<span class="aud-big">' + f.p + "</span>",
      hint: "En una oración primero va quién, luego qué hace y al final dónde o qué.",
      mount: sequenceMount(steps, (ctx && ctx.support) || 1, true, { sentence: f.w.join(" ") })
    };
  }

  /** Ritmo por luz y vibración: se reproduce con dos botones, corto y largo. */
  function roundRitmo(p, ctx) {
    var pat = [];
    for (var i = 0; i < p.len; i++) pat.push(Math.random() < 0.5 ? "c" : "l");
    if (p.len >= 3 && pat.indexOf("c") === -1) pat[0] = "c";
    if (p.len >= 3 && pat.indexOf("l") === -1) pat[p.len - 1] = "l";
    var replays = ((ctx && ctx.support) || 1) === 1 ? 3 : (ctx.support === 2 ? 2 : 1);
    var prompt = "Mira la luz (y siente la vibración si tu dispositivo la tiene). Repite el ritmo con los botones: toque corto o largo.";
    return {
      skill: "ritmo_luz", prompt: prompt, speech: prompt,
      hint: "Corto es un destello breve, largo es un destello que dura más.",
      mount: function (host, api) {
        var s = sched(); host.innerHTML = "";
        var lv = live(), box = el("div", "aud-flash"), entered = el("div", "aud-entered"), pad = el("div", "aud-actions"), acts = el("div", "aud-actions");
        box.setAttribute("role", "img"); box.setAttribute("aria-label", "Luz del ritmo");
        entered.setAttribute("aria-label", "Tu ritmo");
        var bC = el("button", "game-option"); bC.type = "button"; bC.textContent = "● Toque corto"; bC.setAttribute("aria-label", "Toque corto");
        var bL = el("button", "game-option"); bL.type = "button"; bL.textContent = "▬ Toque largo"; bL.setAttribute("aria-label", "Toque largo");
        pad.appendChild(bC); pad.appendChild(bL);
        var play = el("button", "game-btn game-btn--primary"); play.type = "button"; play.textContent = "Ver el ritmo";
        acts.appendChild(play);
        [lv, box, entered, pad, acts].forEach(function (x) { host.appendChild(x); });
        var inp = [], playing = false, started = false, closed = false, errors = 0, used = 0;

        function show() { entered.textContent = inp.map(function (k) { return k === "c" ? "●" : "▬"; }).join(" "); }
        function run() {
          playing = true; inp = []; show(); var t = 300;
          pat.forEach(function (k) {
            var d = k === "c" ? 350 : 900;
            s.later(function () { box.classList.add("is-on"); vibrate(d); }, t);
            s.later(function () { box.classList.remove("is-on"); }, t + d);
            t += d + 450;
          });
          s.later(function () { playing = false; lv.textContent = "Ahora te toca a ti."; api.feedback("Ahora te toca a ti.", ""); }, t);
        }
        function tap(k) {
          if (playing || !started || closed) return;
          if (k === pat[inp.length]) {
            inp.push(k); show(); api.feedback("", "");
            if (inp.length === pat.length) {
              closed = true;
              api.done({ stars: errors === 0 ? 1 : (errors === 1 ? 0.75 : 0.5), message: "¡Repetiste el ritmo!", error: errors ? { wrong: errors, replays: used, attempts: errors + 1 } : null });
            }
          } else {
            errors++; inp = []; show();
            api.feedback("Ese no es el ritmo. Vuelve a empezar con calma.", "retry");
            if (errors === 2) api.hint();
          }
        }
        bC.addEventListener("click", function () { tap("c"); });
        bL.addEventListener("click", function () { tap("l"); });
        play.addEventListener("click", function () {
          if (playing || closed) return;
          if (!started) { started = true; play.textContent = "Ver otra vez (" + replays + ")"; run(); return; }
          if (replays <= 0) return;
          replays--; used++; play.textContent = "Ver otra vez (" + replays + ")"; if (replays <= 0) play.disabled = true; run();
        });
        return function () { closed = true; s.stop(); };
      }
    };
  }

  /** Memoria visual de secuencias de símbolos. */
  function roundMemoria(p, ctx) {
    var banco = p.simbolos || SIMBOLOS;
    var m = mult(ctx), len = rnd(p.lenMin, p.lenMax);
    var seq = shuffle(banco).slice(0, len);
    var replays = ((ctx && ctx.support) || 1) === 1 ? 2 : (ctx.support === 2 ? 1 : 0);
    var prompt = "Mira los símbolos que aparecen. Luego tócalos en el mismo orden.";
    return {
      skill: "memoria_simbolos", prompt: prompt, speech: prompt,
      hint: "Repite el orden en tu mente mientras los ves.",
      mount: function (host, api) {
        var s = sched(); host.innerHTML = "";
        var lv = live(), stim = el("div", "aud-stim"), pad = el("div", "aud-actions"), acts = el("div", "aud-actions");
        stim.setAttribute("aria-hidden", "true");
        var play = el("button", "game-btn game-btn--primary"); play.type = "button"; play.textContent = "Ver la secuencia";
        acts.appendChild(play);
        [lv, stim, pad, acts].forEach(function (x) { host.appendChild(x); });
        var playing = false, closed = false, pos = 0, errors = 0, left = replays, started = false;

        function buildPad() {
          pad.innerHTML = "";
          shuffle(banco).forEach(function (sy) {
            var b = el("button", "game-option"); b.type = "button"; b.textContent = sy[0]; b.setAttribute("aria-label", sy[1]);
            b.addEventListener("click", function () { tap(b, sy); });
            pad.appendChild(b);
          });
        }
        function run() {
          playing = true; pos = 0; pad.innerHTML = ""; var i = 0;
          (function step() {
            if (i >= seq.length) { stim.textContent = "?"; lv.textContent = "Ahora te toca a ti."; buildPad(); playing = false; return; }
            stim.textContent = seq[i][0]; lv.textContent = seq[i][1]; i++;
            s.later(function () { stim.textContent = ""; s.later(step, 300); }, 1000 * m);
          })();
        }
        function tap(b, sy) {
          if (playing || closed) return;
          if (sy[1] === seq[pos][1]) {
            b.classList.add("is-correct"); b.disabled = true; pos++; api.feedback("", "");
            if (pos === seq.length) {
              closed = true;
              api.done({ stars: errors === 0 ? 1 : (errors === 1 ? 0.75 : 0.5), message: "¡Recordaste la secuencia!", error: errors ? { wrong: errors, attempts: errors + 1 } : null });
            }
          } else {
            errors++; b.classList.add("is-wrong"); setTimeout(function () { b.classList.remove("is-wrong"); }, 500);
            api.feedback("Ese no es el que sigue. Piénsalo con calma.", "retry");
            if (errors === 2) api.hint();
          }
        }
        play.addEventListener("click", function () {
          if (playing || closed) return;
          if (!started) { started = true; play.textContent = replays ? "Ver otra vez (" + left + ")" : "Sin repeticiones"; if (!replays) play.disabled = true; run(); return; }
          if (left <= 0) return;
          left--; play.textContent = "Ver otra vez (" + left + ")"; if (left <= 0) play.disabled = true; run();
        });
        return function () { closed = true; s.stop(); };
      }
    };
  }

  /** Mini-video con subtítulos: se avanza a tu ritmo y luego hay preguntas. */
  function roundSubtitulos(p, ctx, index) {
    var banco = p.cuentos || CUENTOS;
    var c = banco[((p.offset || 0) + index) % banco.length];
    var prompt = "Mira la historia con subtítulos. Avanza cuando termines de leer cada escena. Después habrá preguntas.";
    return {
      skill: "comprension_subtitulos", prompt: prompt, speech: prompt,
      hint: "Puedes volver a la escena anterior si lo necesitas.",
      mount: function (host, api) {
        host.innerHTML = "";
        var lv = live(), st = el("p", "aud-status"), sc = el("div", "aud-scene"), cap = el("div", "aud-caption"), acts = el("div", "aud-actions");
        sc.setAttribute("aria-hidden", "true"); cap.setAttribute("role", "status");
        [lv, st, sc, cap, acts].forEach(function (x) { host.appendChild(x); });
        var i = 0, q = 0, errors = 0, closed = false;
        function scene() {
          acts.innerHTML = "";
          st.textContent = "Escena " + (i + 1) + " de " + c.scenes.length;
          sc.textContent = c.scenes[i].i; cap.textContent = c.scenes[i].c;
          if (i > 0) { var pv = el("button", "game-btn game-btn--ghost"); pv.type = "button"; pv.textContent = "◀ Anterior"; pv.addEventListener("click", function () { i--; scene(); }); acts.appendChild(pv); }
          var nx = el("button", "game-btn game-btn--primary"); nx.type = "button";
          nx.textContent = i === c.scenes.length - 1 ? "Ir a las preguntas" : "Siguiente ▶";
          nx.addEventListener("click", function () { if (i === c.scenes.length - 1) question(); else { i++; scene(); } });
          acts.appendChild(nx);
        }
        function question() {
          acts.innerHTML = ""; sc.textContent = "❓";
          var qq = c.qs[q];
          st.textContent = "Pregunta " + (q + 1) + " de " + c.qs.length;
          cap.textContent = qq.q;
          textOpts(qq.ok, qq.bad, 3).forEach(function (o) {
            var b = el("button", "game-option"); b.type = "button"; b.textContent = o.label;
            b.addEventListener("click", function () {
              if (closed) return;
              if (o.value === qq.ok) {
                api.feedback("", ""); q++;
                if (q >= c.qs.length) {
                  closed = true;
                  api.done({ stars: errors === 0 ? 1 : (errors === 1 ? 0.75 : (errors === 2 ? 0.5 : 0.25)), message: "¡Comprendiste la historia!", error: errors ? { wrong: errors, attempts: errors + 1 } : null });
                } else question();
              } else {
                errors++; b.classList.add("is-wrong"); b.disabled = true;
                api.feedback("Prueba otra opción. Puedes volver a leer la historia con el botón de pista.", "retry");
              }
            });
            acts.appendChild(b);
          });
        }
        scene();
        return function () { closed = true; };
      }
    };
  }

  // ─── Definición de los niveles (50: 5 Stages de 10 niveles) ────────────────
  var CONSTRUCTORES = {
    vocab: function (p) { return retoVocab(p); },
    emocion: function (p) { return retoEmocion(p); },
    senales: function (p) { return retoSenales(p); },
    historia: roundHistoria,
    frase: roundFrase,
    ritmo: roundRitmo,
    memoria: roundMemoria,
    subtitulos: roundSubtitulos
  };

  var NIVELES = {
    // ══ Stage 1 · Base (1-10): sin cambios ═══════════════════════════════════
    1: { rounds: 5, mechanics: ["vocab"], params: { vocab: {} },
         intro: "Stage 1 · Nivel 1 · Hola, soy NOVA. En este enigma todo se ve: dibujos, señas y palabras escritas. Empecemos relacionando el dibujo con su palabra." },
    2: { rounds: 3, mechanics: ["historia"], params: { historia: { text: true } },
         intro: "Stage 1 · Nivel 2 · Las historias tienen orden. Toca las viñetas en el orden en que ocurren." },
    3: { rounds: 4, mechanics: ["frase"], params: { frase: { minW: 4, maxW: 5 } },
         intro: "Stage 1 · Nivel 3 · Vamos a construir oraciones. Los dibujos te dicen qué decir; tú ordenas las palabras." },
    4: { rounds: 4, mechanics: ["ritmo"], params: { ritmo: { len: 3 } },
         intro: "Stage 1 · Nivel 4 · Los ritmos también se ven y se sienten. Mira la luz y repite el patrón: corto o largo." },
    5: { rounds: 5, mechanics: ["emocion"], params: { emocion: {} },
         intro: "Stage 1 · Nivel 5 · Las caras dicen mucho. Mira la expresión y elige la emoción." },
    6: { rounds: 4, mechanics: ["memoria"], params: { memoria: { lenMin: 3, lenMax: 4 } },
         intro: "Stage 1 · Nivel 6 · Mira los símbolos que aparecen y repítelos en el mismo orden." },
    7: { rounds: 2, mechanics: ["subtitulos"], params: { subtitulos: {} },
         intro: "Stage 1 · Nivel 7 · Ahora una historia con subtítulos. Avanza a tu ritmo y luego responde las preguntas." },
    8: { rounds: 4, mechanics: ["frase"], params: { frase: { minW: 6, maxW: 7 } },
         intro: "Stage 1 · Nivel 8 · Las oraciones ahora son más largas. Recuerda: quién, qué hace y dónde." },
    9: { rounds: 6, mechanics: ["ritmo", "historia"], params: { ritmo: { len: 5 }, historia: { text: false } },
         intro: "Stage 1 · Nivel 9 · Ritmos más largos y historias solo con dibujos. Tú puedes con ambas." },
    10: { rounds: 8,
          mechanics: ["vocab", "historia", "frase", "ritmo", "emocion", "memoria", "subtitulos", "frase"],
          params: { vocab: {}, historia: { text: false }, frase: { minW: 5, maxW: 7 }, ritmo: { len: 4 }, emocion: {}, memoria: { lenMin: 4, lenMax: 5 }, subtitulos: {} },
          intro: "Stage 1 · Nivel 10 · Última misión de la base: aparece todo lo que aprendiste. Sin tiempo límite. ¡Adelante!" },

    // ══ Stage 2 · Media (11-20): vocabulario y contexto de vida adulta ══════
    11: { rounds: 10, mechanics: ["vocab"], params: { vocab: { bancos: VOCAB_ADULTO } },
          intro: "Stage 2 · Nivel 11 · Vocabulario del trabajo y la tecnología: dibujo, seña y palabra." },
    12: { rounds: 10, mechanics: ["historia"], params: { historia: { historias: HISTORIAS_ADULTO, text: false } },
          intro: "Stage 2 · Nivel 12 · Historias de la vida adulta, solo con dibujos: busca empleo, paga un servicio." },
    13: { rounds: 10, mechanics: ["frase"], params: { frase: { frases: FRASES_ADULTO, minW: 5, maxW: 7 } },
          intro: "Stage 2 · Nivel 13 · Oraciones más largas de contexto laboral." },
    14: { rounds: 10, mechanics: ["senales"], params: { senales: { bancos: SENALES_VISUALES } },
          intro: "Stage 2 · Nivel 14 · Mecánica nueva: reconoce señales visuales cotidianas, como el timbre con luz o el celular vibrando." },
    15: { rounds: 10, mechanics: ["ritmo"], params: { ritmo: { len: 5 } },
          intro: "Stage 2 · Nivel 15 · Ritmos más largos." },
    16: { rounds: 10, mechanics: ["emocion"], params: { emocion: { bancos: EMO_ADULTO } },
          intro: "Stage 2 · Nivel 16 · Emociones en contexto de trabajo y estudio: confundido, aliviado, agradecido." },
    17: { rounds: 10, mechanics: ["memoria"], params: { memoria: { lenMin: 4, lenMax: 5 } },
          intro: "Stage 2 · Nivel 17 · Secuencias de símbolos más largas." },
    18: { rounds: 10, mechanics: ["subtitulos"], params: { subtitulos: { cuentos: CUENTOS_ADULTO } },
          intro: "Stage 2 · Nivel 18 · Historias con subtítulos sobre la vida adulta: entrevistas, pagos, citas." },
    19: { rounds: 10, mechanics: ["frase", "senales"],
          params: { frase: { frases: FRASES_ADULTO, minW: 5, maxW: 7 }, senales: { bancos: SENALES_VISUALES } },
          intro: "Stage 2 · Nivel 19 · Oraciones y señales visuales, alternadas." },
    20: { rounds: 10,
          mechanics: ["vocab", "historia", "frase", "senales", "ritmo", "emocion", "memoria", "subtitulos"],
          params: {
            vocab: { bancos: VOCAB_ADULTO }, historia: { historias: HISTORIAS_ADULTO, text: false },
            frase: { frases: FRASES_ADULTO, minW: 5, maxW: 7 }, senales: { bancos: SENALES_VISUALES },
            ritmo: { len: 5 }, emocion: { bancos: EMO_ADULTO }, memoria: { lenMin: 4, lenMax: 5 },
            subtitulos: { cuentos: CUENTOS_ADULTO }
          },
          intro: "Stage 2 · Nivel 20 · Reto integrador de la etapa Media: mezcla todo lo practicado." },

    // ══ Stage 3 · Alta (21-30): comprensión y escenarios más exigentes ══════
    21: { rounds: 10, mechanics: ["subtitulos"], params: { subtitulos: { cuentos: CUENTOS_ADULTO } },
          intro: "Stage 3 · Nivel 21 · Historias con subtítulos, con más atención a los detalles." },
    22: { rounds: 10, mechanics: ["vocab"], params: { vocab: { bancos: VOCAB_ADULTO.concat(VOCAB) } },
          intro: "Stage 3 · Nivel 22 · Vocabulario ampliado, con más palabras para reconocer." },
    23: { rounds: 10, mechanics: ["frase"], params: { frase: { frases: FRASES_ADULTO, minW: 6, maxW: 9 } },
          intro: "Stage 3 · Nivel 23 · Oraciones largas con orden más libre." },
    24: { rounds: 10, mechanics: ["senales"], params: { senales: { bancos: SENALES_VISUALES } },
          intro: "Stage 3 · Nivel 24 · Más señales visuales combinadas." },
    25: { rounds: 10, mechanics: ["historia"], params: { historia: { historias: HISTORIAS_ADULTO, text: false } },
          intro: "Stage 3 · Nivel 25 · Historias de varios pasos, solo con dibujos." },
    26: { rounds: 10, mechanics: ["ritmo"], params: { ritmo: { len: 6 } },
          intro: "Stage 3 · Nivel 26 · Ritmos más complejos." },
    27: { rounds: 10, mechanics: ["emocion"], params: { emocion: { bancos: EMO_ADULTO } },
          intro: "Stage 3 · Nivel 27 · Emociones más sutiles: sigue practicando." },
    28: { rounds: 10, mechanics: ["memoria"], params: { memoria: { lenMin: 5, lenMax: 6 } },
          intro: "Stage 3 · Nivel 28 · Secuencias de hasta seis símbolos." },
    29: { rounds: 10, mechanics: ["historia", "emocion"],
          params: { historia: { historias: HISTORIAS_ADULTO, text: false }, emocion: { bancos: EMO_ADULTO } },
          intro: "Stage 3 · Nivel 29 · Historias y emociones, alternadas." },
    30: { rounds: 10,
          mechanics: ["subtitulos", "vocab", "frase", "senales", "historia", "ritmo", "emocion", "memoria"],
          params: {
            subtitulos: { cuentos: CUENTOS_ADULTO }, vocab: { bancos: VOCAB_ADULTO.concat(VOCAB) },
            frase: { frases: FRASES_ADULTO, minW: 6, maxW: 9 }, senales: { bancos: SENALES_VISUALES },
            historia: { historias: HISTORIAS_ADULTO, text: false }, ritmo: { len: 6 },
            emocion: { bancos: EMO_ADULTO }, memoria: { lenMin: 5, lenMax: 6 }
          },
          intro: "Stage 3 · Nivel 30 · Reto integrador de la etapa Alta: mezcla todo lo practicado." },

    // ══ Stage 4 · Muy Alta (31-40): integración de dos mecánicas por nivel ══
    31: { rounds: 10, mechanics: ["subtitulos"], params: { subtitulos: { cuentos: CUENTOS_ADULTO } },
          intro: "Stage 4 · Nivel 31 · Historias con subtítulos, cada vez con más atención a los detalles." },
    32: { rounds: 10, mechanics: ["senales"], params: { senales: { bancos: SENALES_VISUALES } },
          intro: "Stage 4 · Nivel 32 · Señales visuales avanzadas." },
    33: { rounds: 10, mechanics: ["vocab", "frase"],
          params: { vocab: { bancos: VOCAB_ADULTO.concat(VOCAB) }, frase: { frases: FRASES_ADULTO, minW: 5, maxW: 8 } },
          intro: "Stage 4 · Nivel 33 · Vocabulario y oraciones, combinados." },
    34: { rounds: 10, mechanics: ["ritmo"], params: { ritmo: { len: 6 } },
          intro: "Stage 4 · Nivel 34 · Ritmos largos y precisos." },
    35: { rounds: 10, mechanics: ["memoria", "emocion"],
          params: { memoria: { lenMin: 5, lenMax: 6 }, emocion: { bancos: EMO_ADULTO } },
          intro: "Stage 4 · Nivel 35 · Memoria de símbolos y emociones, alternadas." },
    36: { rounds: 10, mechanics: ["historia", "frase"],
          params: { historia: { historias: HISTORIAS_ADULTO, text: false }, frase: { frases: FRASES_ADULTO, minW: 5, maxW: 8 } },
          intro: "Stage 4 · Nivel 36 · Historias y oraciones, combinadas." },
    37: { rounds: 10, mechanics: ["subtitulos", "senales"],
          params: { subtitulos: { cuentos: CUENTOS_ADULTO }, senales: { bancos: SENALES_VISUALES } },
          intro: "Stage 4 · Nivel 37 · Subtítulos y señales visuales, alternados." },
    38: { rounds: 10, mechanics: ["vocab", "memoria"],
          params: { vocab: { bancos: VOCAB_ADULTO.concat(VOCAB) }, memoria: { lenMin: 5, lenMax: 6 } },
          intro: "Stage 4 · Nivel 38 · Vocabulario técnico y memoria de símbolos." },
    39: { rounds: 10, mechanics: ["ritmo", "emocion"],
          params: { ritmo: { len: 6 }, emocion: { bancos: EMO_ADULTO } },
          intro: "Stage 4 · Nivel 39 · Ritmo y emociones, alternados." },
    40: { rounds: 10,
          mechanics: ["subtitulos", "senales", "vocab", "frase", "memoria", "historia", "ritmo", "emocion"],
          params: {
            subtitulos: { cuentos: CUENTOS_ADULTO }, senales: { bancos: SENALES_VISUALES },
            vocab: { bancos: VOCAB_ADULTO.concat(VOCAB) }, frase: { frases: FRASES_ADULTO, minW: 5, maxW: 8 },
            memoria: { lenMin: 5, lenMax: 6 }, historia: { historias: HISTORIAS_ADULTO, text: false },
            ritmo: { len: 6 }, emocion: { bancos: EMO_ADULTO }
          },
          intro: "Stage 4 · Nivel 40 · Reto integrador de la etapa Muy Alta: mezcla todo lo practicado." },

    // ══ Stage 5 · Súper Difícil (41-50): integración total ══════════════════
    41: { rounds: 10, mechanics: ["senales", "emocion"],
          params: { senales: { bancos: SENALES_VISUALES }, emocion: { bancos: EMO_ADULTO } },
          intro: "Stage 5 · Nivel 41 · Señales visuales y emociones, sin previo aviso de cuál toca." },
    42: { rounds: 10, mechanics: ["subtitulos", "memoria"],
          params: { subtitulos: { cuentos: CUENTOS_ADULTO }, memoria: { lenMin: 5, lenMax: 6 } },
          intro: "Stage 5 · Nivel 42 · Comprensión de historias y memoria de símbolos, combinadas." },
    43: { rounds: 10, mechanics: ["frase", "vocab", "senales"],
          params: { frase: { frases: FRASES_ADULTO, minW: 5, maxW: 9 }, vocab: { bancos: VOCAB_ADULTO.concat(VOCAB) }, senales: { bancos: SENALES_VISUALES } },
          intro: "Stage 5 · Nivel 43 · Oraciones, vocabulario y señales, en un mismo bloque." },
    44: { rounds: 10, mechanics: ["historia", "ritmo"],
          params: { historia: { historias: HISTORIAS_ADULTO, text: false }, ritmo: { len: 6 } },
          intro: "Stage 5 · Nivel 44 · Historias y ritmos, alternados." },
    45: { rounds: 10, mechanics: ["subtitulos", "emocion", "senales"],
          params: { subtitulos: { cuentos: CUENTOS_ADULTO }, emocion: { bancos: EMO_ADULTO }, senales: { bancos: SENALES_VISUALES } },
          intro: "Stage 5 · Nivel 45 · Tres mecánicas de comprensión y reconocimiento visual, combinadas." },
    46: { rounds: 10, mechanics: ["memoria", "vocab", "frase"],
          params: { memoria: { lenMin: 5, lenMax: 6 }, vocab: { bancos: VOCAB_ADULTO.concat(VOCAB) }, frase: { frases: FRASES_ADULTO, minW: 5, maxW: 9 } },
          intro: "Stage 5 · Nivel 46 · Memoria, vocabulario y oraciones, sin repetir el mismo tipo de reto." },
    47: { rounds: 10, mechanics: ["historia", "senales", "ritmo"],
          params: { historia: { historias: HISTORIAS_ADULTO, text: false }, senales: { bancos: SENALES_VISUALES }, ritmo: { len: 6 } },
          intro: "Stage 5 · Nivel 47 · Historias, señales y ritmo combinados." },
    48: { rounds: 10, mechanics: ["subtitulos", "vocab", "emocion", "memoria"],
          params: { subtitulos: { cuentos: CUENTOS_ADULTO }, vocab: { bancos: VOCAB_ADULTO.concat(VOCAB) }, emocion: { bancos: EMO_ADULTO }, memoria: { lenMin: 5, lenMax: 6 } },
          intro: "Stage 5 · Nivel 48 · Cuatro mecánicas alternadas, sin previo aviso." },
    49: { rounds: 10,
          mechanics: ["subtitulos", "senales", "frase", "vocab", "historia", "ritmo", "emocion", "memoria"],
          params: {
            subtitulos: { cuentos: CUENTOS_ADULTO }, senales: { bancos: SENALES_VISUALES },
            frase: { frases: FRASES_ADULTO, minW: 5, maxW: 9 }, vocab: { bancos: VOCAB_ADULTO.concat(VOCAB) },
            historia: { historias: HISTORIAS_ADULTO, text: false }, ritmo: { len: 6 },
            emocion: { bancos: EMO_ADULTO }, memoria: { lenMin: 5, lenMax: 6 }
          },
          intro: "Stage 5 · Nivel 49 · Mezcla exigente de casi todas las mecánicas. Falta solo el reto final." },
    50: { rounds: 10,
          mechanics: ["vocab", "historia", "frase", "senales", "ritmo", "emocion", "memoria", "subtitulos"],
          params: {
            vocab: { bancos: VOCAB_ADULTO.concat(VOCAB) }, historia: { historias: HISTORIAS_ADULTO, text: false },
            frase: { frases: FRASES_ADULTO, minW: 5, maxW: 9 }, senales: { bancos: SENALES_VISUALES },
            ritmo: { len: 6 }, emocion: { bancos: EMO_ADULTO }, memoria: { lenMin: 5, lenMax: 6 },
            subtitulos: { cuentos: CUENTOS_ADULTO }
          },
          intro: "Stage 5 · Nivel 50 · Reto final de El Enigma Lingüístico: las ocho mecánicas, todo lo que aprendiste. ¡Tú puedes!" }
  };

  global.IndecapGame.register({
    slug: "auditiva_enigma",
    getLevel: function (level) {
      muteSpeech();
      var base = NIVELES[level] || NIVELES[1];
      return { rounds: base.rounds, mechanics: base.mechanics.slice(), params: base.params, offset: rnd(0, 99), intro: base.intro };
    },
    buildRound: function (cfg, index, ctx) {
      var m = cfg.mechanics[index % cfg.mechanics.length];
      var p = Object.assign({}, cfg.params[m], { offset: cfg.offset });
      return CONSTRUCTORES[m](p, ctx || { support: 1 }, index);
    }
  });
})(window);
