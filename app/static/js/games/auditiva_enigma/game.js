/**
 * EL ENIGMA LINGÜÍSTICO — Discapacidad auditiva
 *
 * Habilidad central: acceso al lenguaje escrito por canal visual y
 * vibrotáctil. Nada depende del sonido: el juego apaga la voz sintética.
 *  - Vocabulario con dibujo y palabra (y seña, cuando hay video validado).
 *  - Orden de historias y construcción de frases.
 *  - Ritmo por luz y vibración.
 *  - Expresiones faciales, señales visuales y subtítulos.
 *  - Memoria visual de símbolos.
 *
 * 5 niveles × 10 actividades, 5 retos por actividad que suben de dificultad.
 *
 * Seguridad fotosensible: las luces nunca parpadean más de una vez por
 * segundo y las señales visuales se muestran como íconos estáticos.
 */
(function (global) {
  "use strict";
  var _t = global.IndecapGame.tr;

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

  // ─── Datos: nivel base ────────────────────────────────────────────────────
  var SENAS_BASE = "/static/media/senas/";
  var VOCAB = [
    ["🐶", "perro"], ["🐱", "gato"], ["🍎", "manzana"], ["🏠", "casa"], ["📚", "libro"],
    ["🚌", "bus"], ["🌞", "sol"], ["💧", "agua"], ["🍞", "pan"], ["🎒", "maleta"]
  ];
  /**
   * Videos de Lengua de Señas Colombiana. Solo se cargan las palabras de esta
   * lista, y cada video debe ser grabado o validado por un intérprete de LSC
   * antes de agregarse a app/static/media/senas/<palabra>.mp4. Mientras la
   * lista esté vacía, el reto se apoya en el dibujo y la palabra escrita.
   */
  var VIDEOS_SENAS = [];
  function signHtml(word) {
    if (VIDEOS_SENAS.indexOf(word) === -1) return "";
    return '<video class="aud-video" src="' + SENAS_BASE + word + '.mp4" muted loop autoplay playsinline aria-label="Seña de ' + word + '"></video>';
  }
  var HISTORIAS = [
    { title: "Un día de lluvia", steps: [{ i: "☁️", t: "El cielo se llena de nubes" }, { i: "🌧️", t: "Empieza a llover" }, { i: "☂️", t: "Abro el paraguas" }, { i: "🌈", t: "Sale el arcoíris" }] },
    { title: "Ir al colegio", steps: [{ i: "⏰", t: "Suena la alarma" }, { i: "👕", t: "Me visto" }, { i: "🚌", t: "Tomo el bus" }, { i: "🏫", t: "Llego al colegio" }] },
    { title: "Plantar una semilla", steps: [{ i: "🌰", t: "Pongo la semilla en la tierra" }, { i: "💧", t: "La riego" }, { i: "🌱", t: "Sale un brote" }, { i: "🌻", t: "Crece una flor" }] }
  ];
  var FRASES = [
    { p: "👩 🍎 😋", w: ["La", "joven", "come", "una", "manzana"] },
    { p: "🐶 🏃 🌳", w: ["El", "perro", "corre", "en", "el", "parque"] },
    { p: "🧑 📖 🏠", w: ["El", "estudiante", "lee", "en", "casa"] },
    { p: "🐱 🥛 😋", w: ["El", "gato", "toma", "leche"] },
    { p: "👩 🚌 🏫", w: ["Ella", "va", "en", "bus", "al", "colegio"] },
    { p: "🐦 ✈️ ☁️", w: ["El", "pájaro", "vuela", "entre", "las", "nubes"] }
  ];
  var EMO = [["😀", "Feliz"], ["😢", "Triste"], ["😠", "Enojado"], ["😮", "Sorprendido"], ["😨", "Asustado"], ["🤢", "Asqueado"]];
  var SIMBOLOS = [["🌞", "sol"], ["🌙", "luna"], ["⭐", "estrella"], ["🌈", "arcoíris"], ["☁️", "nube"], ["🔥", "fuego"]];
  var CUENTOS = [
    { scenes: [{ i: "🧒🎒", c: "Pedro se despierta y alista su maleta." }, { i: "🚌", c: "Toma el bus para ir al colegio." }, { i: "🏫📚", c: "En clase, la profesora enseña los colores." }],
      qs: [{ q: "¿Cómo va Pedro al colegio?", ok: "En bus", bad: ["A pie", "En bicicleta"] }, { q: "¿Qué enseña la profesora?", ok: "Los colores", bad: ["Los números", "Los animales"] }] },
    { scenes: [{ i: "👧🐱", c: "Lucía encuentra un gato pequeño en la calle." }, { i: "🥛", c: "Le da un poco de leche." }, { i: "🏠", c: "Lo lleva a casa y le hace una cama." }],
      qs: [{ q: "¿Qué encontró Lucía?", ok: "Un gato", bad: ["Un perro", "Un pájaro"] }, { q: "¿Qué le dio de tomar?", ok: "Leche", bad: ["Agua con azúcar", "Jugo"] }] },
    { scenes: [{ i: "👨‍🍳🍞", c: "Don Carlos hace pan en la mañana." }, { i: "🏪", c: "Lo lleva a su tienda." }, { i: "🧑💰", c: "Un joven compra dos panes." }],
      qs: [{ q: "¿Qué hace Don Carlos?", ok: "Pan", bad: ["Jugo", "Helado"] }, { q: "¿Cuántos panes compra el joven?", ok: "Dos", bad: ["Uno", "Cinco"] }] }
  ];

  // ─── Datos: vida adulta (niveles 2 a 5, 15-26 años) ────────────────────────
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
    { icon: "🔔💡", label: _t("Timbre de la puerta con luz"), action: _t("Alguien está en la puerta"), bad: [_t("Se acabó la batería del celular"), _t("Empezó a llover")] },
    { icon: "🚨🔴", label: _t("Alarma de incendio con luz intermitente"), action: _t("Debes evacuar el edificio"), bad: [_t("Debes cargar el celular"), _t("Debes silenciar el timbre")] },
    { icon: "📳", label: _t("Celular vibrando"), action: _t("Tienes una llamada o mensaje"), bad: [_t("Se apagó el celular"), _t("El celular se está cargando")] },
    { icon: "📹💬", label: _t("Notificación de videollamada con subtítulos activados"), action: _t("Alguien te está llamando por video"), bad: [_t("Se cortó la videollamada"), _t("Se activó el modo avión")] },
    { icon: "⏰💡", label: _t("Despertador con luz parpadeante"), action: _t("Es hora de levantarte"), bad: [_t("Se fue la luz"), _t("Sonó la alarma de incendio")] },
    { icon: "🚪🔦", label: _t("Timbre del trabajo con luz en el escritorio"), action: _t("Te están llamando a una reunión"), bad: [_t("Se dañó la luz del escritorio"), _t("Terminó tu turno")] }
  ];

  // ─── Mecánicas de opción única ─────────────────────────────────────────────
  function retoVocab(p) {
    var banco = (p && p.bancos) || VOCAB;
    var v = pick(banco), otros = shuffle(banco.filter(function (x) { return x[1] !== v[1]; })).slice(0, 2);
    var prompt = VIDEOS_SENAS.indexOf(v[1]) !== -1 ? _t("Mira el dibujo y la seña. Elige la palabra escrita que corresponde.") : _t("Mira el dibujo. Elige la palabra escrita que corresponde.");
    return {
      skill: "vocabulario_triple", prompt: prompt, speech: prompt,
      visual: '<div class="aud-row"><span class="aud-big">' + v[0] + "</span>" + signHtml(v[1]) + "</div>",
      options: textOpts(v[1], otros.map(function (x) { return x[1]; }), 3),
      answer: v[1], answerLabel: v[1],
      hint: _t("Fíjate en la primera letra de la palabra y en el dibujo."),
      explain: _t("La palabra es «") + v[1] + _t("».")
    };
  }
  function retoEmocion(p) {
    var banco = (p && p.bancos) || EMO;
    var e = pick(banco), otros = shuffle(banco.filter(function (x) { return x[1] !== e[1]; })).slice(0, 3);
    var prompt = _t("Mira la cara. ¿Qué emoción muestra?");
    return {
      skill: "expresion_facial", prompt: prompt, speech: prompt,
      visual: '<span class="aud-big">' + e[0] + "</span>",
      options: shuffle([e].concat(otros)).map(function (x) { return { label: x[0] + " " + x[1], value: x[1], aria: x[1] }; }),
      answer: e[1], answerLabel: e[1],
      hint: _t("Mira la boca, las cejas y los ojos."),
      explain: _t("Esa cara muestra: ") + e[1] + "."
    };
  }
  function retoSenales(p) {
    var banco = (p && p.bancos) || SENALES_VISUALES;
    var s = pick(banco);
    var prompt = _t("Mira la señal visual. ¿Qué significa?");
    return {
      skill: "senales_visuales", prompt: prompt, speech: prompt,
      visual: '<span class="aud-big">' + s.icon + '</span><p class="aud-caption">' + s.label + "</p>",
      options: textOpts(s.action, s.bad, 3),
      answer: s.action, answerLabel: s.action,
      hint: _t("Piensa en qué situación cotidiana usarías esa señal."),
      explain: s.label + _t(" significa: ") + s.action + "."
    };
  }

  // ─── Mecánicas con interfaz propia ────────────────────────────────────────
  /** Ritmo por luz y vibración: se reproduce con dos botones, corto y largo. */
  function roundRitmo(p, ctx) {
    var pat = [];
    for (var i = 0; i < p.len; i++) pat.push(Math.random() < 0.5 ? "c" : "l");
    if (p.len >= 3 && pat.indexOf("c") === -1) pat[0] = "c";
    if (p.len >= 3 && pat.indexOf("l") === -1) pat[p.len - 1] = "l";
    var replays = ((ctx && ctx.support) || 1) === 1 ? 3 : (ctx.support === 2 ? 2 : 1);
    var prompt = _t("Mira la luz (y siente la vibración si tu dispositivo la tiene). Repite el ritmo con los botones: toque corto o largo.");
    return {
      skill: "ritmo_luz", prompt: prompt, speech: prompt,
      hint: _t("Corto es un destello breve, largo es un destello que dura más."),
      mount: function (host, api) {
        var s = sched(); host.innerHTML = "";
        var lv = live(), box = el("div", "aud-flash"), entered = el("div", "aud-entered"), pad = el("div", "aud-actions"), acts = el("div", "aud-actions");
        box.setAttribute("role", "img"); box.setAttribute("aria-label", _t("Luz del ritmo"));
        entered.setAttribute("aria-label", _t("Tu ritmo"));
        var bC = el("button", "game-option"); bC.type = "button"; bC.textContent = _t("● Toque corto"); bC.setAttribute("aria-label", _t("Toque corto"));
        var bL = el("button", "game-option"); bL.type = "button"; bL.textContent = _t("▬ Toque largo"); bL.setAttribute("aria-label", _t("Toque largo"));
        pad.appendChild(bC); pad.appendChild(bL);
        var play = el("button", "game-btn game-btn--primary"); play.type = "button"; play.textContent = _t("Ver el ritmo");
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
          s.later(function () { playing = false; lv.textContent = _t("Ahora te toca a ti."); api.feedback(_t("Ahora te toca a ti."), ""); }, t);
        }
        function tap(k) {
          if (playing || !started || closed) return;
          if (k === pat[inp.length]) {
            inp.push(k); show(); api.feedback("", "");
            if (inp.length === pat.length) {
              closed = true;
              api.done({ stars: errors === 0 ? 1 : (errors === 1 ? 0.75 : 0.5), message: _t("¡Repetiste el ritmo!"), error: errors ? { wrong: errors, replays: used, attempts: errors + 1 } : null });
            }
          } else {
            errors++; inp = []; show();
            if (errors >= 4) {
              closed = true;
              entered.textContent = pat.map(function (x) { return x === "c" ? "●" : "▬"; }).join(" ");
              api.done({ stars: 0, message: _t("El ritmo era: ") + pat.map(function (x) { return x === "c" ? _t("corto") : _t("largo"); }).join(", ") + _t(". Lo practicamos de nuevo más adelante."), error: { wrong: errors, replays: used, attempts: errors } });
              return;
            }
            api.feedback(_t("Ese no es el ritmo. Vuelve a empezar con calma."), "retry");
            if (errors === 2) api.hint();
          }
        }
        bC.addEventListener("click", function () { tap("c"); });
        bL.addEventListener("click", function () { tap("l"); });
        play.addEventListener("click", function () {
          if (playing || closed) return;
          if (!started) { started = true; play.textContent = _t("Ver otra vez (") + replays + ")"; run(); return; }
          if (replays <= 0) return;
          replays--; used++; play.textContent = _t("Ver otra vez (") + replays + ")"; if (replays <= 0) play.disabled = true; run();
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
    var prompt = _t("Mira los símbolos que aparecen. Luego tócalos en el mismo orden.");
    return {
      skill: "memoria_simbolos", prompt: prompt, speech: prompt,
      hint: _t("Repite el orden en tu mente mientras los ves."),
      mount: function (host, api) {
        var s = sched(); host.innerHTML = "";
        var lv = live(), stim = el("div", "aud-stim"), pad = el("div", "aud-actions"), acts = el("div", "aud-actions");
        stim.setAttribute("aria-hidden", "true");
        var play = el("button", "game-btn game-btn--primary"); play.type = "button"; play.textContent = _t("Ver la secuencia");
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
            if (i >= seq.length) { stim.textContent = "?"; lv.textContent = _t("Ahora te toca a ti."); buildPad(); playing = false; return; }
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
              api.done({ stars: errors === 0 ? 1 : (errors === 1 ? 0.75 : 0.5), message: _t("¡Recordaste la secuencia!"), error: errors ? { wrong: errors, attempts: errors + 1 } : null });
            }
          } else {
            errors++; b.classList.add("is-wrong"); setTimeout(function () { b.classList.remove("is-wrong"); }, 500);
            api.feedback(_t("Ese no es el que sigue. Piénsalo con calma."), "retry");
            if (errors === 2) api.hint();
          }
        }
        play.addEventListener("click", function () {
          if (playing || closed) return;
          if (!started) { started = true; play.textContent = replays ? _t("Ver otra vez (") + left + ")" : _t("Sin repeticiones"); if (!replays) play.disabled = true; run(); return; }
          if (left <= 0) return;
          left--; play.textContent = _t("Ver otra vez (") + left + ")"; if (left <= 0) play.disabled = true; run();
        });
        return function () { closed = true; s.stop(); };
      }
    };
  }

  /** Mini-video con subtítulos: se avanza a tu ritmo y luego hay preguntas. */
  function roundSubtitulos(p, ctx, index) {
    var banco = p.cuentos || CUENTOS;
    var c = banco[((p.offset || 0) + index) % banco.length];
    var prompt = _t("Mira la historia con subtítulos. Avanza cuando termines de leer cada escena. Después habrá preguntas.");
    return {
      skill: "comprension_subtitulos", prompt: prompt, speech: prompt,
      hint: _t("Puedes volver a la escena anterior si lo necesitas."),
      mount: function (host, api) {
        host.innerHTML = "";
        var lv = live(), st = el("p", "aud-status"), sc = el("div", "aud-scene"), cap = el("div", "aud-caption"), acts = el("div", "aud-actions");
        sc.setAttribute("aria-hidden", "true"); cap.setAttribute("role", "status");
        [lv, st, sc, cap, acts].forEach(function (x) { host.appendChild(x); });
        var i = 0, q = 0, errors = 0, closed = false;
        function scene() {
          acts.innerHTML = "";
          st.textContent = _t("Escena ") + (i + 1) + _t(" de ") + c.scenes.length;
          sc.textContent = c.scenes[i].i; cap.textContent = c.scenes[i].c;
          if (i > 0) { var pv = el("button", "game-btn game-btn--ghost"); pv.type = "button"; pv.textContent = _t("◀ Anterior"); pv.addEventListener("click", function () { i--; scene(); }); acts.appendChild(pv); }
          var nx = el("button", "game-btn game-btn--primary"); nx.type = "button";
          nx.textContent = i === c.scenes.length - 1 ? _t("Ir a las preguntas") : _t("Siguiente ▶");
          nx.addEventListener("click", function () { if (i === c.scenes.length - 1) question(); else { i++; scene(); } });
          acts.appendChild(nx);
        }
        function question() {
          acts.innerHTML = ""; sc.textContent = "❓";
          var qq = c.qs[q];
          st.textContent = _t("Pregunta ") + (q + 1) + _t(" de ") + c.qs.length;
          cap.textContent = qq.q;
          textOpts(qq.ok, qq.bad, 3).forEach(function (o) {
            var b = el("button", "game-option"); b.type = "button"; b.textContent = o.label;
            b.addEventListener("click", function () {
              if (closed) return;
              if (o.value === qq.ok) {
                api.feedback("", ""); q++;
                if (q >= c.qs.length) {
                  closed = true;
                  api.done({ stars: errors === 0 ? 1 : (errors === 1 ? 0.75 : (errors === 2 ? 0.5 : 0.25)), message: _t("¡Comprendiste la historia!"), error: errors ? { wrong: errors, attempts: errors + 1 } : null });
                } else question();
              } else {
                errors++; b.classList.add("is-wrong"); b.disabled = true;
                api.feedback(_t("Prueba otra opción. Puedes volver a leer la historia con el botón de pista."), "retry");
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

  // ─── Actividades y plan: 5 niveles × 10 actividades ───────────────────────
  var U = global.IndecapGame.util;
  var grow = U.grow;

  var ALERTAS_VISUALES = {
    urgente: { label: _t("Actúo de inmediato"), items: [_t("Luz roja intermitente de alarma de incendio"), _t("Persona que hace la seña de «¡pare!»"), _t("Celular con alerta de emergencia"), _t("Luz de humo en la cocina")] },
    aviso: { label: _t("Lo reviso con calma"), items: [_t("Notificación de un mensaje"), _t("Luz del timbre de la puerta"), _t("Recordatorio de una cita mañana"), _t("Aviso de batería al 50 %")] }
  };

  function ordenarHistoria(p, s) {
    var banco = s >= 2 && p.adulto ? p.adulto : p.base, h = U.pick(banco);
    var items = h.steps.map(function (st, i) { return { id: "h" + i, label: '<span style="font-size:1.4em;margin-right:6px" aria-hidden="true">' + st.i + "</span>" + st.t }; });
    return {
      type: "order", skill: "historia_pictogramas",
      prompt: _t("Historia: «") + h.title + _t("». Ordena las escenas."),
      slotsLabel: _t("Primero → después"),
      items: U.shuffle(items), answer: items.map(function (i) { return i.id; }),
      answerLabel: h.steps.map(function (st) { return st.t; }).join(" → "),
      hint: _t("Piensa qué pasa primero, qué pasa después y cómo termina."),
      explain: h.steps.map(function (st, i) { return (i + 1) + ". " + st.t; }).join(" ") + "."
    };
  }

  function ordenarFrase(p, s) {
    var banco = s >= 2 && p.adulto ? p.adulto : p.base;
    var pool = banco.filter(function (f) { return f.w.length <= grow(5, 9, s); });
    var f = U.pick(pool.length ? pool : banco);
    var items = f.w.map(function (w, i) { return { id: "w" + i, label: w }; });
    return {
      type: "order", skill: "construccion_frases",
      prompt: _t("Ordena las palabras para decir lo que muestran los dibujos."),
      visual: '<span class="aud-big">' + f.p + "</span>",
      slotsLabel: _t("Tu oración"),
      items: U.shuffle(items), answer: items.map(function (i) { return i.id; }), answerLabel: f.w.join(" "),
      hint: _t("Primero va quién, luego qué hace y al final dónde o qué."),
      explain: "«" + f.w.join(" ") + ".»"
    };
  }

  function unirPalabra(p, s) {
    var set = U.shuffle(s >= 2 ? p.adulto : p.base).slice(0, grow(3, 5, s)), left = [], right = [], ans = {};
    set.forEach(function (v, i) { left.push({ id: "d" + i, label: '<span style="font-size:30px">' + v[0] + "</span>" }); right.push({ id: "p" + i, label: v[1] }); ans["d" + i] = "p" + i; });
    return {
      type: "match", skill: "vocabulario_visual",
      prompt: _t("Une cada dibujo con su palabra."),
      left: U.shuffle(left), right: U.shuffle(right), answer: ans,
      hint: _t("Empieza por el dibujo que reconoces más rápido."),
      explain: set.map(function (v) { return v[1]; }).join(", ") + "."
    };
  }

  function unirVoc(p, s) { return unirPalabra(VOC, s); }

  function unirEmocion(p, s) {
    var set = U.shuffle(s >= 2 ? EMO.concat(EMO_ADULTO) : EMO).slice(0, grow(3, 5, s)), left = [], right = [], ans = {};
    set.forEach(function (e, i) { left.push({ id: "c" + i, label: '<span style="font-size:30px">' + e[0] + "</span>" }); right.push({ id: "e" + i, label: e[1] }); ans["c" + i] = "e" + i; });
    return {
      type: "match", skill: "expresion_facial",
      prompt: _t("Une cada cara con la emoción que muestra."),
      left: U.shuffle(left), right: U.shuffle(right), answer: ans,
      hint: _t("Mira la boca, las cejas y los ojos."),
      explain: set.map(function (e) { return e[0] + " " + e[1]; }).join(" · ") + "."
    };
  }

  function clasificarAlertas(p, s) {
    var keys = Object.keys(ALERTAS_VISUALES), items = [], ans = {}, k = 0;
    keys.forEach(function (key) { U.shuffle(ALERTAS_VISUALES[key].items).slice(0, grow(2, 4, s)).forEach(function (t) { var id = "a" + (k++); items.push({ id: id, label: t }); ans[id] = key; }); });
    return {
      type: "classify", skill: "senales_visuales",
      prompt: _t("¿Cada señal visual pide actuar de inmediato o revisarla con calma?"),
      bins: keys.map(function (key) { return { id: key, label: ALERTAS_VISUALES[key].label }; }),
      items: U.shuffle(items), answer: ans,
      hint: _t("Las luces rojas que se repiten y las alertas de emergencia piden actuar ya."),
      explain: _t("Ante una alerta urgente, primero me pongo a salvo y luego confirmo qué pasa.")
    };
  }

  function completarSubtitulo(p, s) {
    var f = U.pick(s >= 2 ? FRASES_ADULTO : FRASES), k = U.rnd(1, f.w.length - 1), ok = f.w[k];
    var otros = [];
    (s >= 2 ? FRASES_ADULTO : FRASES).forEach(function (x) { x.w.forEach(function (w) { if (w !== ok && otros.indexOf(w) === -1 && w.length > 2) otros.push(w); }); });
    var shown = f.w.map(function (w, i) { return i === k ? "____" : w; }).join(" ");
    return {
      skill: "comprension_subtitulos",
      prompt: _t("Completa el subtítulo según los dibujos."),
      visual: '<span class="aud-big">' + f.p + '</span><p class="aud-caption" style="font-size:20px">' + shown + "</p>",
      options: textOpts(ok, U.shuffle(otros).slice(0, 4), s >= 2 ? 4 : 3),
      answer: ok,
      hint: _t("Lee toda la frase y mira los dibujos: ¿qué palabra le da sentido?"),
      explain: "«" + f.w.join(" ") + ".»"
    };
  }

  function con(fn, params) { return function (p, s) { return fn(typeof params === "function" ? params(s) : params, { support: 1 }, s); }; }
  function mix(list) { return function (p, s) { return list[s % list.length](p, s); }; }
  var VOC = { base: VOCAB, adulto: VOCAB_ADULTO };
  var HIST = { base: HISTORIAS, adulto: HISTORIAS_ADULTO };
  var FRA = { base: FRASES, adulto: FRASES_ADULTO };
  function ritmo(a, b) { return function (s) { return { len: grow(a, b, s) }; }; }
  function memo(a, b, simbolos) { return function (s) { return { lenMin: grow(a, b, s), lenMax: grow(a, b, s) + 1, simbolos: simbolos }; }; }

  var PLAN = {
    1: [
      [con(retoVocab, function (s) { return { bancos: VOCAB }; }), _t("Vas a relacionar cada dibujo con su palabra escrita.")],
      [function (p, s) { return ordenarHistoria(HIST, s); }, _t("Vas a ordenar las escenas de una historia.")],
      [function (p, s) { return ordenarFrase(FRA, s); }, _t("Vas a construir oraciones ordenando palabras.")],
      [con(roundRitmo, ritmo(2, 4)), _t("Vas a ver un ritmo de luz (y sentirlo si tu celular vibra) y repetirlo.")],
      [con(retoEmocion, {}), _t("Vas a reconocer emociones en caras.")],
      [con(roundMemoria, memo(2, 4)), _t("Vas a ver símbolos y repetirlos en el mismo orden.")],
      [con(roundSubtitulos, {}), _t("Vas a seguir una historia con subtítulos y responder preguntas.")],
      [unirVoc, _t("Vas a unir dibujos con su palabra.")],
      [unirEmocion, _t("Vas a unir caras con su emoción.")],
      [completarSubtitulo, _t("Vas a completar subtítulos con la palabra que falta.")]
    ],
    2: [
      [con(retoVocab, function (s) { return { bancos: s >= 2 ? VOCAB_ADULTO : VOCAB }; }), _t("Vas a reconocer palabras de la vida adulta.")],
      [function (p, s) { return ordenarHistoria(HIST, s); }, _t("Vas a ordenar historias de la vida adulta.")],
      [function (p, s) { return ordenarFrase(FRA, s); }, _t("Vas a construir oraciones más largas.")],
      [con(retoSenales, {}), _t("Vas a entender señales visuales que reemplazan sonidos.")],
      [con(retoEmocion, function (s) { return { bancos: s >= 2 ? EMO_ADULTO : EMO }; }), _t("Vas a reconocer emociones más sutiles.")],
      [con(roundRitmo, ritmo(3, 5)), _t("Ritmos de luz más largos.")],
      [con(roundMemoria, memo(3, 5)), _t("Secuencias de símbolos más largas.")],
      [con(roundSubtitulos, function (s) { return { cuentos: s >= 2 ? CUENTOS_ADULTO : CUENTOS }; }), _t("Historias con subtítulos de la vida adulta.")],
      [clasificarAlertas, _t("Vas a decidir qué señales visuales piden actuar ya.")],
      [unirVoc, _t("Vas a unir dibujos y palabras de la vida adulta.")]
    ],
    3: [
      [con(retoVocab, { bancos: VOCAB_ADULTO }), _t("Vas a leer palabras del trabajo y los trámites.")],
      [function (p, s) { return ordenarFrase(FRA, s + 1); }, _t("Vas a construir oraciones de trabajo y trámites.")],
      [con(roundSubtitulos, { cuentos: CUENTOS_ADULTO }), _t("Vas a comprender historias con subtítulos.")],
      [completarSubtitulo, _t("Vas a completar subtítulos de la vida adulta.")],
      [con(retoSenales, {}), _t("Vas a interpretar señales visuales de la casa y el trabajo.")],
      [unirEmocion, _t("Vas a unir emociones sutiles con su nombre.")],
      [con(roundRitmo, ritmo(4, 6)), _t("Ritmos de luz exigentes.")],
      [con(roundMemoria, memo(4, 5, SIMBOLOS.concat(EMO.map(function (e) { return [e[0], e[1].toLowerCase()]; })))), _t("Memoria de símbolos y caras.")],
      [function (p, s) { return ordenarHistoria(HIST, s + 2); }, _t("Vas a ordenar historias sin ayudas.")],
      [clasificarAlertas, _t("Vas a priorizar alertas visuales.")]
    ],
    4: [
      [mix([con(retoVocab, { bancos: VOCAB_ADULTO }), unirVoc]), _t("Vas a dominar el vocabulario de la vida adulta.")],
      [mix([function (p, s) { return ordenarFrase(FRA, 4); }, completarSubtitulo]), _t("Vas a construir y completar frases.")],
      [con(roundSubtitulos, { cuentos: CUENTOS_ADULTO }), _t("Vas a comprender historias completas.")],
      [mix([con(retoEmocion, { bancos: EMO_ADULTO }), unirEmocion]), _t("Vas a leer emociones en distintas formas.")],
      [mix([con(retoSenales, {}), clasificarAlertas]), _t("Vas a reaccionar ante señales visuales.")],
      [con(roundRitmo, ritmo(5, 6)), _t("Ritmos de luz de experto.")],
      [con(roundMemoria, memo(4, 6)), _t("Secuencias largas de símbolos.")],
      [function (p, s) { return ordenarHistoria({ base: HISTORIAS_ADULTO, adulto: HISTORIAS_ADULTO }, 4); }, _t("Vas a ordenar trámites y procesos.")],
      [completarSubtitulo, _t("Subtítulos con palabras más difíciles.")],
      [mix([con(roundRitmo, ritmo(4, 5)), con(roundMemoria, memo(4, 5))]), _t("Ritmo y memoria intercalados.")]
    ],
    5: [
      [mix([con(retoVocab, { bancos: VOCAB_ADULTO }), completarSubtitulo, function (p, s) { return ordenarFrase(FRA, 4); }]), _t("Vas a leer, completar y construir frases.")],
      [mix([con(roundSubtitulos, { cuentos: CUENTOS_ADULTO }), function (p, s) { return ordenarHistoria(HIST, 4); }]), _t("Vas a comprender y ordenar historias.")],
      [mix([con(retoSenales, {}), clasificarAlertas, unirEmocion]), _t("Vas a interpretar señales y emociones.")],
      [con(roundRitmo, ritmo(5, 7)), _t("Ritmos de luz máximos.")],
      [con(roundMemoria, memo(5, 6)), _t("Memoria visual al máximo.")],
      [mix([unirVoc, con(retoEmocion, { bancos: EMO_ADULTO })]), _t("Vocabulario y emociones.")],
      [function (p, s) { return ordenarFrase(FRA, 4); }, _t("Oraciones largas de la vida adulta.")],
      [completarSubtitulo, _t("Subtítulos de experto.")],
      [mix([con(roundRitmo, ritmo(5, 6)), con(roundMemoria, memo(5, 6))]), _t("Ritmo y memoria de experto.")],
      [mix([con(retoVocab, { bancos: VOCAB_ADULTO }), function (p, s) { return ordenarHistoria(HIST, 4); }, con(roundRitmo, ritmo(5, 5)), con(retoSenales, {}), completarSubtitulo]), _t("Repaso final: un reto de cada habilidad.")]
    ]
  };

  var HABILIDADES = {
    vocabulario_triple: _t("Vocabulario con dibujo y palabra"),
    vocabulario_visual: _t("Vocabulario visual"),
    historia_pictogramas: _t("Ordenar historias"),
    construccion_frases: _t("Construir oraciones"),
    ritmo_luz: _t("Ritmo por luz y vibración"),
    expresion_facial: _t("Leer expresiones faciales"),
    memoria_simbolos: _t("Memoria visual"),
    comprension_subtitulos: _t("Comprender subtítulos"),
    senales_visuales: _t("Entender señales visuales")
  };

  global.IndecapGame.register({
    slug: "auditiva_enigma",
    skillLabels: HABILIDADES,
    plan: PLAN,
    getActivity: function (index) {
      muteSpeech();
      var nivel = Math.min(5, Math.max(1, Math.ceil(index / 10)));
      var act = PLAN[nivel][(index - 1) % 10];
      return {
        intro: act[1] + _t(" Son 5 retos que suben de dificultad. Todo es visual: no necesitas sonido."),
        rounds: 5,
        build: function (step) { return act[0]({}, step); }
      };
    }
  });
})(window);
