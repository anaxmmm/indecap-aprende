/**
 * ECO-EXPLORADOR SONORO — Discapacidad visual
 *
 * Habilidad núcleo: aprendizaje por canal auditivo y háptico, sin depender
 * de la vista en ninguna mecánica.
 *  - Identificación de sonidos ................ corteza auditiva primaria/secundaria
 *  - Localización espacial del sonido ......... corteza parietal posterior
 *  - Memoria auditiva secuencial .............. hipocampo + memoria de trabajo
 *  - Atención selectiva auditiva (figura-fondo)  corteza auditiva + cingulado anterior
 *  - Ecolocalización (más fuerte / más débil) . plasticidad cruzada occipito-auditiva
 *  - Rutinas de orientación y movilidad ........ ganglios basales + prefrontal
 *
 * Principios de diseño:
 *  - CERO dependencia visual: cada reto se anuncia por voz (api.say) y cada
 *    opción tiene su propio aria-label, sin depender de iconos ni color.
 *  - El campo `visual` de cada reto (si existe) es solo decorativo para
 *    quienes SÍ ven la pantalla (docentes en modo vista previa); play.html
 *    ya lo marca aria-hidden, así que nunca es información necesaria.
 *  - Todas las mecánicas propias (mount) se operan por botón/teclado, nunca
 *    por arrastre, trazado en lienzo, ni nada que exija coordinación visual.
 *  - Nivel 10: evaluación embebida con una muestra de todas las mecánicas.
 *
 * Estilos: se inyectan desde aquí para no tocar games.css.
 */
(function (global) {
  "use strict";

  // ─── Utilidades ───────────────────────────────────────────────────────────
  function rnd(a, b) { return Math.floor(Math.random() * (b - a + 1)) + a; }
  function pick(a) { return a[rnd(0, a.length - 1)]; }
  function shuffle(a) {
    a = a.slice();
    for (var i = a.length - 1; i > 0; i--) { var j = rnd(0, i), t = a[i]; a[i] = a[j]; a[j] = t; }
    return a;
  }
  function el(tag, cls) { var n = document.createElement(tag); if (cls) n.className = cls; return n; }
  function live() {
    var n = el("p", "visually-hidden");
    n.setAttribute("role", "status");
    n.setAttribute("aria-live", "polite");
    return n;
  }
  function textOpts(ok, bads, n) {
    return shuffle([ok].concat(shuffle(bads).slice(0, n - 1))).map(function (t) {
      return { label: t, value: t, aria: t };
    });
  }
  function addStyles(id, css) {
    if (document.getElementById(id)) return;
    var s = document.createElement("style"); s.id = id; s.textContent = css; document.head.appendChild(s);
  }

  addStyles("visual-eco-styles", [
    ".game-shell .game-options .game-option{font-size:1.2rem;max-width:320px}",
    ".eco-status{flex-basis:100%;font-weight:600;color:var(--g-muted);margin-bottom:10px}",
    ".eco-actions{flex-basis:100%;display:flex;flex-wrap:wrap;gap:12px;justify-content:center}",
    ".eco-input{flex-basis:100%;max-width:320px;font-size:1.4rem;text-align:center;padding:10px}",
    ".eco-model{flex-basis:100%;font-size:1.3rem;font-weight:700;color:var(--g-ok)}",
    ".seq-status{flex-basis:100%;font-weight:600;color:var(--g-muted);margin-bottom:8px}",
    ".seq-list{flex-basis:100%;list-style:none;margin:0 auto 12px;padding:0;max-width:480px;text-align:left}",
    ".seq-list li{background:var(--g-ok-soft);border:2px solid var(--g-ok);color:var(--g-ok);border-radius:12px;padding:10px 14px;margin-bottom:8px;font-weight:600}",
    ".seq-steps{flex-basis:100%;display:flex;flex-wrap:wrap;gap:12px;justify-content:center}",
    ".game-option.seq-step{display:flex;flex-direction:column;align-items:center;gap:6px;font-size:1.05rem;min-width:150px}",
    ".seq-icon{font-size:2rem;line-height:1}",
    ".game-option.seq-next{outline:4px solid var(--g-accent);outline-offset:3px}"
  ].join("\n"));

  /** Ordenar elementos tocándolos, en el orden correcto. Igual patrón que en
   * los otros juegos: 100% operable por botón/teclado, nunca por arrastre. */
  function sequenceMount(steps, help, extra) {
    return function (host, api) {
      var n = steps.length;
      host.innerHTML = "";
      var lv = live(), status = el("p", "seq-status"), done = el("ol", "seq-list"), pool = el("div", "seq-steps");
      done.setAttribute("aria-label", "Pasos ya ordenados");
      pool.setAttribute("role", "group"); pool.setAttribute("aria-label", "Pasos para ordenar");
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
        var tx = el("span"); tx.textContent = o.t; b.appendChild(tx);
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
          var li = el("li"); li.textContent = o.t; done.appendChild(li);
          lv.textContent = "Paso " + pos + ": " + o.t;
          api.say("Paso " + pos + ": " + o.t);
          api.feedback("", "");
          if (pos === n) { end(); return; }
          refresh();
          if (btns[0]) btns[0].el.focus();
        } else {
          errors++;
          btn.classList.add("is-wrong");
          setTimeout(function () { btn.classList.remove("is-wrong"); }, 500);
          api.feedback("Ese paso va después. Escúchalo otra vez con calma.", "retry");
          if (help === 2) highlight = true;
          refresh();
          if (errors === 2) api.hint();
        }
      }
      function end() {
        finished = true;
        status.textContent = "¡Ruta completa!";
        var err = { wrong: errors, help_level: help, attempts: errors + 1 };
        Object.keys(extra || {}).forEach(function (k) { err[k] = extra[k]; });
        api.done({
          stars: errors === 0 ? 1 : (errors === 1 ? 0.75 : (errors <= 3 ? 0.5 : 0.25)),
          message: errors === 0 ? "¡Todos los pasos en el orden correcto!" : "¡Lo lograste!",
          error: errors ? err : null
        });
      }
      refresh();
      return function () { finished = true; };
    };
  }

  // ─── Datos ────────────────────────────────────────────────────────────────

  var SONIDOS = [
    { t: "Escuchas: «guau, guau». ¿Qué animal hace ese sonido?", ok: "Perro", bad: ["Gato", "Pájaro"] },
    { t: "Escuchas un «muu» largo y grave. ¿Qué animal hace ese sonido?", ok: "Vaca", bad: ["Oveja", "Cerdo"] },
    { t: "Escuchas un timbre que suena dos veces seguidas en la puerta. ¿Qué está pasando?", ok: "Alguien está tocando la puerta", bad: ["Está sonando el teléfono", "Está sonando una alarma"] },
    { t: "Escuchas muchas gotas golpeando el techo con fuerza. ¿Qué está pasando?", ok: "Está lloviendo", bad: ["Alguien está aplaudiendo", "Alguien está tocando un tambor"] },
    { t: "Escuchas un silbato largo y fuerte, seguido de un motor que arranca despacio. ¿Qué está pasando?", ok: "Un tren está saliendo de la estación", bad: ["Un avión está aterrizando", "Un carro está pitando en el tráfico"] },
    { t: "Escuchas un pitido corto que se repite cada segundo, seguido de un motor en reversa. ¿Qué está pasando?", ok: "Un carro está dando reversa", bad: ["Suena un reloj despertador", "Suena una calculadora"] }
  ];

  var DIRECCIONES = [
    { t: "Una persona te llama desde tu lado izquierdo.", ok: "izquierda" },
    { t: "Un carro pasa haciendo ruido por tu lado derecho.", ok: "derecha" },
    { t: "Escuchas pasos que se acercan desde atrás de ti.", ok: "atras" },
    { t: "Una voz te saluda justo de frente.", ok: "adelante" },
    { t: "Escuchas que alguien tose desde tu lado derecho, un poco más lejos.", ok: "derecha" },
    { t: "Sientes una brisa y escuchas hojas moviéndose detrás de ti.", ok: "atras" }
  ];
  var DIR_LABEL = { izquierda: "Izquierda", derecha: "Derecha", adelante: "Adelante", atras: "Atrás" };

  var SETS_MEMORIA = [
    ["Campana", "Silbato", "Tambor"],
    ["Aplauso", "Pito", "Trueno"],
    ["Timbre", "Bocina", "Sirena"],
    ["Reloj", "Radio", "Puerta"]
  ];

  var FIGURA_FONDO = [
    { t: "Estás en un mercado con mucha gente hablando. De repente, alguien dice tu nombre. ¿Qué haces primero?", ok: "Me detengo y trato de ubicar de dónde viene la voz", bad: ["Sigo caminando sin prestar atención", "Hablo más fuerte sin escuchar primero"] },
    { t: "Hay música fuerte en la sala, pero alguien te pregunta algo desde la cocina. ¿Qué haces?", ok: "Pido que bajen el volumen o me acerco para escuchar mejor", bad: ["Respondo cualquier cosa sin haber escuchado bien", "Me quedo callado"] },
    { t: "Vas caminando por la acera y escuchas el motor de un carro acercándose rápido. ¿Qué haces?", ok: "Me detengo y espero a que el carro pase", bad: ["Sigo caminando igual", "Corro sin saber hacia dónde"] }
  ];

  var PALABRAS = ["sonido", "baston", "radio", "campana", "escucha", "viento", "puerta", "camino"];

  var RUTAS_BASTON = [
    { title: "Cruzar la calle con el bastón", steps: [
      { i: "🛑", t: "Me detengo en el borde de la acera" },
      { i: "🦯", t: "Toco el piso con el bastón para ubicar el borde" },
      { i: "👂", t: "Escucho el tráfico y espero que se detenga" },
      { i: "🚶", t: "Cruzo derecho, guiándome por el sonido" }
    ] },
    { title: "Salir de la habitación", steps: [
      { i: "🦯", t: "Extiendo el bastón frente a mí" },
      { i: "🚶", t: "Camino hacia la puerta" },
      { i: "✋", t: "Toco el marco de la puerta con la mano" },
      { i: "🚪", t: "Abro la puerta y salgo" }
    ] },
    { title: "Pedir ayuda en la calle", steps: [
      { i: "🛑", t: "Me detengo en un lugar seguro" },
      { i: "👂", t: "Escucho si hay alguien cerca" },
      { i: "🗣️", t: "Pregunto en voz alta si alguien me puede ayudar" },
      { i: "🙏", t: "Doy las gracias por la ayuda" }
    ] }
  ];

  var VOCES = [
    { t: "Escuchas una voz grave y muy pausada. ¿A quién describe mejor?", ok: "A una persona mayor", bad: ["A un bebé", "A una niña"] },
    { t: "Escuchas una voz aguda seguida de una risa corta. ¿A quién describe mejor?", ok: "A un niño pequeño", bad: ["A un hombre adulto", "A una persona mayor"] },
    { t: "Una voz habla despacio y suave, y dice: «tranquilo, todo está bien». ¿Qué emoción transmite esa voz?", ok: "Calma", bad: ["Enojo", "Miedo"] },
    { t: "Una voz habla muy rápido y fuerte, casi gritando. ¿Qué emoción transmite esa voz?", ok: "Urgencia o alarma", bad: ["Calma", "Aburrimiento"] }
  ];

  var RUTAS_MAPA = [
    { title: "Ruta a la tienda", steps: [
      { i: "🚪", t: "Salgo por la puerta principal" },
      { i: "⬅️", t: "Giro a la izquierda en la esquina" },
      { i: "🚶", t: "Camino derecho dos cuadras" },
      { i: "➡️", t: "Giro a la derecha donde escucho el semáforo" },
      { i: "🏪", t: "Llego a la tienda" }
    ] },
    { title: "Ruta al parque", steps: [
      { i: "🚪", t: "Salgo de casa" },
      { i: "🚶", t: "Camino derecho hasta escuchar los pájaros" },
      { i: "➡️", t: "Giro a la derecha en esa esquina" },
      { i: "🌳", t: "Llego al parque" }
    ] }
  ];

  // ─── Mecánicas de opción única ────────────────────────────────────────────

  function retoSonido() {
    var s = pick(SONIDOS);
    return {
      skill: "identificacion_sonidos", prompt: s.t, speech: s.t,
      options: textOpts(s.ok, s.bad, 3), answer: s.ok, answerLabel: s.ok,
      hint: "Piensa qué animal o cosa hace normalmente ese sonido.",
      explain: "Ese sonido lo hace: " + s.ok + "."
    };
  }

  function retoDireccion() {
    var d = pick(DIRECCIONES);
    var prompt = d.t + " ¿De qué dirección viene el sonido?";
    return {
      skill: "localizacion_espacial", prompt: prompt, speech: prompt,
      options: Object.keys(DIR_LABEL).map(function (k) { return { label: DIR_LABEL[k], value: k, aria: DIR_LABEL[k] }; }),
      answer: d.ok, answerLabel: DIR_LABEL[d.ok],
      hint: "Imagina que tú estás en esa escena. ¿De qué lado se escucha?",
      explain: "El sonido viene de: " + DIR_LABEL[d.ok] + "."
    };
  }

  function retoFiguraFondo() {
    var f = pick(FIGURA_FONDO);
    return {
      skill: "atencion_selectiva_auditiva", prompt: f.t, speech: f.t,
      options: textOpts(f.ok, f.bad, 3), answer: f.ok, answerLabel: f.ok,
      hint: "Piensa qué es lo más seguro e importante en ese momento.",
      explain: f.ok + "."
    };
  }

  function retoVoz() {
    var v = pick(VOCES);
    return {
      skill: "reconocimiento_voz", prompt: v.t, speech: v.t,
      options: textOpts(v.ok, v.bad, 3), answer: v.ok, answerLabel: v.ok,
      hint: "Fíjate en el tono, la velocidad y las palabras que usa la voz.",
      explain: v.ok + "."
    };
  }

  // ─── Mecánicas con interfaz propia ────────────────────────────────────────

  /** Memoria auditiva: escucha una secuencia de sonidos nombrados y repítela
   * tocando los botones en el mismo orden. 100% operable por botón/teclado. */
  function roundMemoria(p, ctx, index) {
    var set = SETS_MEMORIA[((p.offset || 0) + index) % SETS_MEMORIA.length];
    var prompt = "Vas a escuchar una secuencia de " + set.length + " sonidos. Escúchalos y luego tócalos en el mismo orden.";
    return {
      skill: "memoria_secuencia_sonora", prompt: prompt, speech: prompt,
      hint: "Repite en tu mente el nombre de cada sonido en el orden en que sonó.",
      mount: function (host, api) {
        host.innerHTML = "";
        var lv = live(), status = el("p", "eco-status"), pad = el("div", "eco-actions"), replayBtn = el("button", "game-btn game-btn--ghost");
        replayBtn.type = "button"; replayBtn.textContent = "🔊 Escuchar de nuevo";
        [lv, status, pad, replayBtn].forEach(function (x) { host.appendChild(x); });

        var pos = 0, errors = 0, closed = false;
        function playSequence() {
          status.textContent = "Escuchando la secuencia…";
          var i = 0;
          (function step() {
            if (i >= set.length) { status.textContent = "Ahora repítela tocando los botones."; return; }
            api.say(set[i], true);
            i++;
            setTimeout(step, 900);
          })();
        }
        function buildPad() {
          shuffle(set).forEach(function (name) {
            var b = el("button", "game-option"); b.type = "button"; b.textContent = name; b.setAttribute("aria-label", name);
            b.addEventListener("click", function () { tap(b, name); });
            pad.appendChild(b);
          });
        }
        function tap(btn, name) {
          if (closed) return;
          if (name === set[pos]) {
            pos++; btn.classList.add("is-correct"); btn.disabled = true;
            lv.textContent = "Correcto: " + name; api.feedback("", "");
            if (pos === set.length) { end(); }
          } else {
            errors++; btn.classList.add("is-wrong");
            setTimeout(function () { btn.classList.remove("is-wrong"); }, 500);
            api.feedback("Ese no es el que sigue. Puedes volver a escuchar la secuencia.", "retry");
            if (errors === 2) api.hint();
          }
        }
        function end() {
          closed = true;
          api.done({
            stars: errors === 0 ? 1 : (errors === 1 ? 0.75 : 0.5),
            message: "¡Repetiste la secuencia de sonidos!",
            error: errors ? { wrong: errors, attempts: errors + 1 } : null
          });
        }
        replayBtn.addEventListener("click", playSequence);
        buildPad();
        playSequence();
        return function () { closed = true; };
      }
    };
  }

  /** Ecolocalización: avanza o retrocede según el sonido se escuche más
   * fuerte o más débil, hasta encontrar el faro sonoro. Sin depender de
   * ninguna posición visual: solo dos botones y retroalimentación por voz. */
  function roundEco(p, ctx) {
    var target = rnd(3, 6);
    var pos = 0;
    var maxSteps = ((ctx && ctx.support) || 1) === 1 ? 14 : 10;
    var prompt = "Sigue el sonido de un faro invisible: «¡pío!». Cada vez que avances o retrocedas, te digo si se escucha más fuerte o más débil. Encuéntralo.";
    return {
      skill: "ecolocalizacion", prompt: prompt, speech: prompt,
      hint: "Si el sonido se hace más fuerte, vas en la dirección correcta. Si se hace más débil, retrocede.",
      mount: function (host, api) {
        host.innerHTML = "";
        var lv = live(), status = el("p", "eco-status"), actions = el("div", "eco-actions");
        status.textContent = "Da tu primer paso para saber si el faro está más cerca hacia adelante o hacia atrás.";
        var bAdv = el("button", "game-btn game-btn--primary"); bAdv.type = "button"; bAdv.textContent = "Avanzar";
        var bRet = el("button", "game-btn game-btn--ghost"); bRet.type = "button"; bRet.textContent = "Retroceder";
        actions.appendChild(bAdv); actions.appendChild(bRet);
        [lv, status, actions].forEach(function (x) { host.appendChild(x); });

        var errors = 0, closed = false, steps = 0;

        function move(dir) {
          if (closed) return;
          steps++;
          var newPos = Math.max(0, pos + dir);
          var prevDist = Math.abs(target - pos), newDist = Math.abs(target - newPos);
          var msg;
          if (newPos === target) { msg = "¡Pío! Lo encontraste."; }
          else if (newDist < prevDist) { msg = "El sonido se escucha más fuerte."; }
          else { msg = "El sonido se escucha más débil."; errors++; }
          pos = newPos;
          lv.textContent = msg;
          api.say(msg, true);
          api.feedback(msg, newPos === target ? "ok" : "");
          status.textContent = "Pasos dados: " + steps;

          if (pos === target) {
            closed = true;
            api.done({
              stars: errors === 0 ? 1 : (errors <= 2 ? 0.75 : 0.5),
              message: "¡Encontraste el faro sonoro en " + steps + " pasos!",
              error: errors ? { wrong: errors, steps: steps, attempts: errors + 1 } : null
            });
          } else if (steps >= maxSteps) {
            closed = true;
            api.done({
              stars: 0.5,
              message: "Buen intento. El faro estaba un poco más adelante.",
              error: { wrong: errors, steps: steps, attempts: errors + 1 }
            });
          }
        }
        bAdv.addEventListener("click", function () { move(1); });
        bRet.addEventListener("click", function () { move(-1); });
        return function () { closed = true; };
      }
    };
  }

  /** Dictado por voz: escucha la palabra y escríbela con el teclado. */
  function roundDictado() {
    var w = pick(PALABRAS);
    var prompt = "Escucha la palabra y escríbela con el teclado.";
    return {
      skill: "dictado_auditivo", prompt: prompt, speech: prompt,
      hint: "Pulsa «Escuchar» las veces que necesites y escribe letra por letra.",
      mount: function (host, api) {
        host.innerHTML = "";
        var lv = live(), actions = el("div", "eco-actions"), input = el("input", "form-control eco-input");
        input.type = "text"; input.setAttribute("autocomplete", "off"); input.setAttribute("autocapitalize", "off");
        input.setAttribute("spellcheck", "false"); input.setAttribute("aria-label", "Escribe la palabra que escuchaste");
        var listen = el("button", "game-btn game-btn--ghost"); listen.type = "button"; listen.textContent = "🔊 Escuchar";
        var check = el("button", "game-btn game-btn--primary"); check.type = "button"; check.textContent = "Comprobar";
        actions.appendChild(listen); actions.appendChild(check);
        [lv, actions, input].forEach(function (x) { host.appendChild(x); });

        var tries = 0, closed = false;
        listen.addEventListener("click", function () { api.say(w, true); });
        function submit() {
          if (closed) return;
          var v = input.value.trim().toLowerCase();
          if (!v) { api.feedback("Escribe la palabra que escuchaste.", "retry"); return; }
          tries++;
          if (v === w) {
            closed = true;
            api.done({ stars: tries === 1 ? 1 : 0.75, message: "¡Bien escrita: «" + w + "»!", error: tries > 1 ? { word: w, attempts: tries } : null });
          } else if (tries === 1) {
            api.say("Escucha de nuevo: " + w, true);
            lv.textContent = "Vuelve a intentarlo.";
            api.feedback("Escucha otra vez y vuelve a escribirla.", "retry");
            input.value = ""; input.focus();
          } else {
            closed = true;
            api.done({ stars: 0.5, message: "Se escribe «" + w + "». Sigue practicando.", error: { word: w, typed: v, attempts: tries } });
          }
        }
        check.addEventListener("click", submit);
        input.addEventListener("keydown", function (e) { if (e.key === "Enter") { e.preventDefault(); submit(); } });
        listen.click();
        return function () { closed = true; };
      }
    };
  }

  function roundBaston(p, ctx, index) {
    var r = RUTAS_BASTON[((p.offset || 0) + index) % RUTAS_BASTON.length];
    var steps = r.steps.map(function (s, i) { return { k: "p" + i, i: s.i, t: s.t }; });
    var prompt = "Rutina: «" + r.title + "». Escucha cada paso y tócalos en el orden en que se hacen.";
    return {
      skill: "rutina_orientacion_movilidad", prompt: prompt, speech: prompt,
      hint: "Piensa qué haces primero para estar seguro, y qué haces al final.",
      mount: sequenceMount(steps, (ctx && ctx.support) || 1, { routine: r.title })
    };
  }

  function roundMapa(p, ctx, index) {
    var r = RUTAS_MAPA[((p.offset || 0) + index) % RUTAS_MAPA.length];
    var steps = r.steps.map(function (s, i) { return { k: "p" + i, i: s.i, t: s.t }; });
    var prompt = "Ruta sonora: «" + r.title + "». Ordena los giros en el orden correcto para llegar.";
    return {
      skill: "mapa_mental_sonoro", prompt: prompt, speech: prompt,
      hint: "Recuerda la ruta desde el principio: primero sales, luego giras.",
      mount: sequenceMount(steps, (ctx && ctx.support) || 1, { route: r.title })
    };
  }

  // ─── Definición de los 10 niveles ─────────────────────────────────────────

  var CONSTRUCTORES = {
    sonido: function () { return retoSonido(); },
    direccion: function () { return retoDireccion(); },
    figurafondo: function () { return retoFiguraFondo(); },
    voz: function () { return retoVoz(); },
    memoria: roundMemoria,
    eco: roundEco,
    dictado: function () { return roundDictado(); },
    baston: roundBaston,
    mapa: roundMapa
  };

  var NIVELES = {
    1: { rounds: 5, mechanics: ["sonido"], params: { sonido: {} },
         intro: "Bienvenido al Eco-Explorador Sonoro. Soy NOVA. Aquí todo se explora con el oído. Empecemos identificando sonidos." },
    2: { rounds: 4, mechanics: ["direccion"], params: { direccion: {} },
         intro: "Ahora vamos a ubicar de dónde viene el sonido: izquierda, derecha, adelante o atrás." },
    3: { rounds: 3, mechanics: ["memoria"], params: { memoria: {} },
         intro: "Vas a escuchar una secuencia de sonidos. Tócalos en el mismo orden en que sonaron." },
    4: { rounds: 3, mechanics: ["figurafondo"], params: { figurafondo: {} },
         intro: "A veces hay mucho ruido de fondo. Practiquemos cómo prestar atención al sonido importante." },
    5: { rounds: 3, mechanics: ["eco"], params: { eco: {} },
         intro: "Este es el reto del Eco-Explorador: sigue un sonido avanzando o retrocediendo, según se escuche más fuerte o más débil." },
    6: { rounds: 4, mechanics: ["dictado"], params: { dictado: {} },
         intro: "Voy a dictarte palabras. Escúchalas con atención y escríbelas con el teclado." },
    7: { rounds: 3, mechanics: ["baston"], params: { baston: {} },
         intro: "Practiquemos rutinas de orientación y movilidad. Escucha cada paso y ordénalos." },
    8: { rounds: 3, mechanics: ["voz"], params: { voz: {} },
         intro: "Cada voz cuenta algo distinto. Escucha la descripción y elige quién habla o qué emoción transmite." },
    9: { rounds: 2, mechanics: ["mapa"], params: { mapa: {} },
         intro: "Vamos a recorrer una ruta sonora. Ordena los giros en el orden correcto para llegar al destino." },
    10: { rounds: 9,
          mechanics: ["sonido", "direccion", "memoria", "figurafondo", "eco", "dictado", "baston", "voz", "mapa"],
          params: { sonido: {}, direccion: {}, memoria: {}, figurafondo: {}, eco: {}, dictado: {}, baston: {}, voz: {}, mapa: {} },
          intro: "Última misión del Eco-Explorador: aparece todo lo que practicaste. Confía en tu oído." }
  };

  global.IndecapGame.register({
    slug: "visual_eco",
    getLevel: function (level) {
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
