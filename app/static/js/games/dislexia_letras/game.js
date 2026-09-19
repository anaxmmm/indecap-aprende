/**
 * EL DETECTOR DE LETRAS REBELDES — Dislexia
 *
 * Habilidad núcleo: ruta de acceso al léxico (fonológica + visual).
 *  - Lectura guiada (eco, compartida, sombra, solo) .. giro temporal superior
 *  - Cloze, vocabulario visual, reglas ............... forma visual de la palabra
 *  - Tilde y prosodia ................................ procesamiento fonológico
 *  - Ordenar grafonemas, dictado, ahorcado ........... decodificación
 *  - Trazado en lienzo ............................... motor + memoria visual
 *
 * Diseño: tipografía legible (la activa el perfil del estudiante), nunca
 * penalización por error, palabra siempre pronunciable con voz sintética.
 * Nivel 10: evaluación embebida.
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

  addStyles("dislexia-styles", [
    ".game-shell .game-options .game-option{font-size:1.25rem}",
    ".dx-big{font-size:4rem;line-height:1}",
    ".dx-word-big{font-size:2.2rem;font-weight:700;letter-spacing:.08em;color:var(--g-frame)}",
    ".dx-status{flex-basis:100%;font-weight:600;color:var(--g-muted);margin-bottom:8px}",
    ".dx-text{flex-basis:100%;max-width:560px;margin:0 auto 14px;text-align:left}",
    ".dx-line{font-size:1.35rem;line-height:2.1;margin:0 0 6px}",
    ".dx-word.is-on{background:var(--g-accent-soft);color:var(--g-frame-dark);border-radius:6px}",
    ".dx-actions{flex-basis:100%;display:flex;flex-wrap:wrap;gap:12px;justify-content:center}",
    ".dx-canvas{flex-basis:100%;width:100%;max-width:320px;border:3px solid var(--g-frame);border-radius:16px;background:#FFFFFF;touch-action:none;cursor:crosshair}",
    ".dx-slots{flex-basis:100%;font-size:2.4rem;font-weight:700;letter-spacing:.35em;color:var(--g-frame)}",
    ".dx-keys{flex-basis:100%;display:grid;grid-template-columns:repeat(9,minmax(34px,1fr));gap:6px;max-width:440px;margin:0 auto}",
    ".game-option.dx-key{min-width:0;min-height:44px;padding:4px;font-size:1.05rem}",
    ".dx-input{flex-basis:100%;max-width:320px;font-size:1.5rem;text-align:center;padding:10px}",
    ".dx-model{flex-basis:100%;font-size:1.6rem;font-weight:700;color:var(--g-ok)}",
    ".seq-status{flex-basis:100%;font-weight:600;color:var(--g-muted);margin-bottom:8px}",
    ".seq-list{flex-basis:100%;list-style:none;margin:0 auto 12px;padding:0;max-width:480px;text-align:left}",
    ".seq-list li{background:var(--g-ok-soft);border:2px solid var(--g-ok);color:var(--g-ok);border-radius:12px;padding:10px 14px;margin-bottom:8px;font-weight:600}",
    ".seq-steps{flex-basis:100%;display:flex;flex-wrap:wrap;gap:12px;justify-content:center}",
    ".game-option.seq-step{display:flex;flex-direction:column;align-items:center;gap:6px;font-size:1.4rem;min-width:70px}",
    ".game-option.seq-next{outline:4px solid var(--g-accent);outline-offset:3px}"
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
        status.textContent = "Letra " + Math.min(pos + 1, n) + " de " + n;
        btns.forEach(function (b) { b.el.classList.toggle("seq-next", highlight && pos < n && b.o.k === steps[pos].k); });
      }
      order.forEach(function (o) {
        var b = el("button", "game-option seq-step"); b.type = "button";
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
          var li = el("li"); li.textContent = o.t; done.appendChild(li);
          lv.textContent = o.t;
          api.feedback("", "");
          if (pos === n) { end(); return; }
          refresh();
          if (btns[0]) btns[0].el.focus();
        } else {
          errors++;
          btn.classList.add("is-wrong");
          setTimeout(function () { btn.classList.remove("is-wrong"); }, 500);
          api.feedback("Esa letra va después. Escucha la palabra otra vez.", "retry");
          if (help === 2) highlight = true;
          refresh();
          if (errors === 2) api.hint();
        }
      }
      function end() {
        finished = true;
        status.textContent = "¡Palabra completa!";
        var err = { wrong: errors, help_level: help, attempts: errors + 1 };
        Object.keys(extra || {}).forEach(function (k) { err[k] = extra[k]; });
        api.say(extra && extra.word, true);
        api.done({
          stars: errors === 0 ? 1 : (errors === 1 ? 0.75 : (errors <= 3 ? 0.5 : 0.25)),
          message: errors === 0 ? "¡Formaste la palabra sin errores!" : "¡Formaste la palabra!",
          error: errors ? err : null
        });
      }
      refresh();
      return function () { finished = true; };
    };
  }

  // ─── Datos ────────────────────────────────────────────────────────────────
  var TEXTOS = [
    { s: ["Ana tiene un perro pequeño.", "El perro se llama Bruno.", "Todas las tardes salen a caminar al parque."], q: "¿Cómo se llama el perro?", ok: "Bruno", bad: ["Toby", "Max"] },
    { s: ["Hoy llueve mucho en la ciudad.", "Luis lleva su paraguas amarillo.", "Camina despacio para no mojarse."], q: "¿De qué color es el paraguas?", ok: "Amarillo", bad: ["Rojo", "Azul"] },
    { s: ["En la finca hay una vaca grande.", "La vaca da leche fresca.", "Marta la recoge cada mañana."], q: "¿Qué da la vaca?", ok: "Leche", bad: ["Pan", "Miel"] }
  ];
  var CLOZE = [
    ["🐄", "vaca", "v", "b"], ["👢", "bota", "b", "v"], ["🔑", "llave", "ll", "y"], ["👟", "zapato", "z", "s"],
    ["🦒", "jirafa", "j", "g"], ["🏠", "casa", "s", "z"], ["🧀", "queso", "qu", "k"], ["🐴", "caballo", "b", "v"],
    ["🚲", "bicicleta", "c", "s"], ["🌳", "árbol", "b", "v"]
  ];
  var TILDE = [
    ["canción", "can-CIÓN", "aguda"], ["papel", "pa-PEL", "aguda"], ["reloj", "re-LOJ", "aguda"], ["camión", "ca-MIÓN", "aguda"],
    ["casa", "CA-sa", "llana"], ["árbol", "ÁR-bol", "llana"], ["lápiz", "LÁ-piz", "llana"], ["mesa", "ME-sa", "llana"],
    ["teléfono", "te-LÉ-fo-no", "esdrújula"], ["pájaro", "PÁ-ja-ro", "esdrújula"], ["música", "MÚ-si-ca", "esdrújula"], ["número", "NÚ-me-ro", "esdrújula"]
  ];
  var TILDE_REGLA = {
    aguda: "suena más fuerte en la última sílaba",
    llana: "suena más fuerte en la penúltima sílaba",
    esdrújula: "suena más fuerte en la antepenúltima sílaba y siempre lleva tilde"
  };
  var ORDEN = [
    { w: "gato", g: ["g", "a", "t", "o"], i: "🐱" }, { w: "luna", g: ["l", "u", "n", "a"], i: "🌙" },
    { w: "mesa", g: ["m", "e", "s", "a"], i: "🪑" }, { w: "llave", g: ["ll", "a", "v", "e"], i: "🔑" },
    { w: "chico", g: ["ch", "i", "c", "o"], i: "👦" }, { w: "pelota", g: ["p", "e", "l", "o", "t", "a"], i: "⚽" }
  ];
  var LETRAS = ["a", "o", "e", "m", "s", "b", "p", "d"];
  var VOCAB = [
    ["🐄", "vaca", "baca", "vaka"], ["🔑", "llave", "yave", "llabe"], ["🦒", "jirafa", "girafa", "jirafa "],
    ["🐝", "abeja", "aveja", "abexa"], ["🐜", "hormiga", "ormiga", "hormica"], ["🧹", "escoba", "escova", "eskoba"],
    ["🪟", "ventana", "bentana", "ventaba"], ["🧀", "queso", "keso", "quezo"]
  ];
  var AHORCADO = [
    { w: "tesoro", i: "💰" }, { w: "pirata", i: "🏴‍☠️" }, { w: "barco", i: "⛵" },
    { w: "isla", i: "🏝️" }, { w: "ballena", i: "🐋" }, { w: "montaña", i: "⛰️" }
  ];
  var DICTADO = ["vaca", "llave", "jirafa", "zapato", "escuela", "camión"];
  var REGLAS = [
    { r: "Antes de p y b se escribe M", ok: "tambor", bad: ["tanbor", "tanvor"] },
    { r: "Antes de v se escribe N", ok: "envase", bad: ["embase", "enbase"] },
    { r: "Las palabras terminadas en -aba se escriben con B", ok: "cantaba", bad: ["cantava", "cantaba "] },
    { r: "Con «güe» y «güi» se usa diéresis", ok: "pingüino", bad: ["pinguino", "pingiuno"] },
    { r: "Las palabras que empiezan por «hum-» llevan H", ok: "humo", bad: ["umo", "jumo"] },
    { r: "Con las letras «gui» la U no se pronuncia", ok: "guitarra", bad: ["gitarra", "ghitarra"] }
  ];

  // ─── Mecánicas de opción única ────────────────────────────────────────────
  function retoCloze() {
    var c = pick(CLOZE), i = c[1].indexOf(c[2]);
    var blank = c[1].slice(0, i) + "_" + c[1].slice(i + c[2].length);
    var prompt = "Completa la palabra: " + blank;
    return {
      skill: "cloze_ortografia", prompt: prompt, speech: "Completa la palabra " + c[1] + ". Falta una letra.",
      visual: '<span class="dx-big">' + c[0] + '</span><span class="dx-word-big">' + blank + "</span>",
      options: shuffle([c[2], c[3]]).map(function (t) { return { label: t, value: t, aria: "Letra " + t }; }),
      answer: c[2], answerLabel: c[2],
      hint: "Di la palabra en voz alta y fíjate en cómo suena al principio o en el medio.",
      explain: "Se escribe «" + c[1] + "»."
    };
  }
  function retoTilde() {
    var t = pick(TILDE);
    var prompt = "Clasifica la palabra «" + t[0] + "»: ¿aguda, llana o esdrújula?";
    return {
      skill: "tilde_prosodia", prompt: prompt, speech: prompt,
      visual: '<span class="dx-word-big">' + t[1] + "</span>",
      options: ["aguda", "llana", "esdrújula"].map(function (k) { return { label: k.charAt(0).toUpperCase() + k.slice(1), value: k, aria: k }; }),
      answer: t[2], answerLabel: t[2],
      hint: "Di la palabra y busca la sílaba que suena más fuerte.",
      explain: "«" + t[0] + "» es " + t[2] + ": " + TILDE_REGLA[t[2]] + "."
    };
  }
  function retoVocab() {
    var v = pick(VOCAB);
    var prompt = "¿Cómo se escribe correctamente este dibujo?";
    return {
      skill: "vocabulario_visual", prompt: prompt, speech: prompt,
      visual: '<span class="dx-big">' + v[0] + "</span>",
      options: textOpts(v[1], [v[2], v[3]].filter(function (x) { return x.trim() !== v[1]; }), 3),
      answer: v[1], answerLabel: v[1],
      hint: "Recuerda la imagen de la palabra: cómo se ve escrita.",
      explain: "Se escribe «" + v[1] + "»."
    };
  }
  function retoRegla() {
    var r = pick(REGLAS);
    var bad = r.bad.map(function (x) { return x.trim(); }).filter(function (x) { return x !== r.ok; });
    var prompt = "Regla: " + r.r + ". ¿Cuál palabra está bien escrita?";
    return {
      skill: "reglas_ortograficas", prompt: prompt, speech: prompt,
      visual: '<span class="dx-big">📜</span>',
      options: textOpts(r.ok, bad, 3), answer: r.ok, answerLabel: r.ok,
      hint: "Lee la regla otra vez y busca la palabra que la cumple.",
      explain: "«" + r.ok + "» cumple la regla."
    };
  }

  // ─── Mecánicas con interfaz propia ────────────────────────────────────────
  /** Lectura guiada: eco, compartida, sombra o solo. */
  function roundLectura(p, ctx, index) {
    var mode = p.mode, t = TEXTOS[((p.offset || 0) + index) % TEXTOS.length], m = mult(ctx);
    var lab = {
      eco: "Escucha y sigue las palabras con la vista.",
      compartida: "Leemos por turnos: NOVA lee una frase y tú lees la siguiente.",
      sombra: "Lee en voz alta al mismo tiempo que NOVA.",
      solo: "Lee tú en voz alta. Pulsa «Ya leí» al terminar cada frase."
    };
    var prompt = "Lectura guiada. " + lab[mode];
    return {
      skill: "lectura_" + mode, prompt: prompt, speech: prompt,
      hint: "Sigue con el dedo o con la vista la palabra resaltada.",
      mount: function (host, api) {
        var s = sched(); host.innerHTML = "";
        var lv = live(), status = el("p", "dx-status"), txt = el("div", "dx-text"), actions = el("div", "dx-actions");
        [lv, status, txt, actions].forEach(function (x) { host.appendChild(x); });
        var words = t.s.map(function (sen) {
          var line = el("p", "dx-line");
          var arr = sen.split(" ").map(function (w) { var sp = el("span", "dx-word"); sp.textContent = w + " "; line.appendChild(sp); return sp; });
          txt.appendChild(line); return arr;
        });
        var errors = 0, closed = false;
        function clear() { words.forEach(function (a) { a.forEach(function (w) { w.classList.remove("is-on"); }); }); }
        function button(label, primary, fn) {
          var b = el("button", "game-btn " + (primary ? "game-btn--primary" : "game-btn--ghost"));
          b.type = "button"; b.textContent = label; b.addEventListener("click", fn); actions.appendChild(b); return b;
        }
        function play(i) {
          if (closed) return;
          clear(); actions.innerHTML = "";
          if (i >= t.s.length) { ask(); return; }
          var own = mode === "solo" || (mode === "compartida" && i % 2 === 1);
          if (own) {
            status.textContent = "Te toca leer: frase " + (i + 1) + " de " + t.s.length;
            lv.textContent = status.textContent;
            words[i].forEach(function (w) { w.classList.add("is-on"); });
            button("Ya leí", true, function () { play(i + 1); }).focus();
          } else {
            status.textContent = "NOVA lee: frase " + (i + 1) + " de " + t.s.length;
            api.say(t.s[i], true);
            var step = Math.round(430 * m);
            words[i].forEach(function (w, k) { s.later(function () { clear(); w.classList.add("is-on"); }, k * step); });
            s.later(function () { play(i + 1); }, words[i].length * step + 700);
          }
        }
        function ask() {
          status.textContent = "Pregunta de comprensión: " + t.q;
          lv.textContent = status.textContent; api.say(t.q, true);
          textOpts(t.ok, t.bad, 3).forEach(function (o) {
            var b = el("button", "game-option"); b.type = "button"; b.textContent = o.label;
            b.addEventListener("click", function () {
              if (closed) return;
              if (o.value === t.ok) {
                closed = true; b.classList.add("is-correct");
                api.done({
                  stars: errors === 0 ? 1 : (errors === 1 ? 0.75 : 0.5),
                  message: "¡Bien leído!",
                  error: errors ? { wrong: errors, mode: mode, attempts: errors + 1 } : null
                });
              } else {
                errors++; b.classList.add("is-wrong"); b.disabled = true;
                api.feedback("Vuelve a mirar el texto y prueba otra opción.", "retry");
              }
            });
            actions.appendChild(b);
          });
        }
        button("Empezar la lectura", true, function () { play(0); });
        return function () { closed = true; s.stop(); };
      }
    };
  }

  function roundOrdenar(p, ctx) {
    var w = pick(ORDEN);
    var steps = w.g.map(function (g, i) { return { k: g, t: g, i: null, n: i }; });
    var prompt = "Forma la palabra «" + w.w + "» tocando las letras en orden.";
    return {
      skill: "ordenar_grafonemas", prompt: prompt, speech: "Forma la palabra " + w.w + " tocando las letras en orden.",
      visual: '<span class="dx-big">' + w.i + "</span>",
      hint: "Di la palabra despacio y toca cada sonido en orden.",
      mount: sequenceMount(steps, (ctx && ctx.support) || 1, true, { word: w.w })
    };
  }

  /** Trazado: se calcula cuánto del camino punteado cubrió el trazo. */
  function roundTrazo(p, ctx, index) {
    var L = p.letters[((p.offset || 0) + index) % p.letters.length];
    var thr = ((ctx && ctx.support) || 1) === 1 ? 0.4 : (ctx.support === 2 ? 0.5 : 0.6);
    var prompt = "Traza la letra «" + L + "» siguiendo el camino punteado, con el dedo o el lápiz óptico.";
    return {
      skill: "trazado_letra", prompt: prompt, speech: prompt,
      hint: "Empieza por arriba y sigue las líneas punteadas despacio.",
      mount: function (host, api) {
        var W = 320, H = 230, FONT = "bold 190px Arial, Helvetica, sans-serif", INK = "#1E40FF";
        host.innerHTML = "";
        var lv = live(), canvas = el("canvas", "dx-canvas"), actions = el("div", "dx-actions");
        canvas.width = W; canvas.height = H; canvas.setAttribute("role", "img");
        canvas.setAttribute("aria-label", "Lienzo para trazar la letra " + L + ". Si no puedes trazar, usa el botón de ayuda del docente.");
        [lv, canvas, actions].forEach(function (x) { host.appendChild(x); });
        var view = canvas.getContext("2d");
        var ink = document.createElement("canvas"); ink.width = W; ink.height = H;
        var ic = ink.getContext("2d"); ic.lineWidth = 16; ic.lineCap = "round"; ic.lineJoin = "round"; ic.strokeStyle = INK; ic.fillStyle = INK;
        var mask = document.createElement("canvas"); mask.width = W; mask.height = H;
        var mc = mask.getContext("2d");
        mc.font = FONT; mc.textAlign = "center"; mc.textBaseline = "middle"; mc.fillStyle = "#000"; mc.strokeStyle = "#000"; mc.lineWidth = 8;
        mc.fillText(L, W / 2, H / 2 + 8); mc.strokeText(L, W / 2, H / 2 + 8);

        function draw() {
          view.clearRect(0, 0, W, H); view.fillStyle = "#FFFFFF"; view.fillRect(0, 0, W, H);
          view.font = FONT; view.textAlign = "center"; view.textBaseline = "middle";
          view.setLineDash([3, 9]); view.lineWidth = 3; view.strokeStyle = "#5A6570";
          view.strokeText(L, W / 2, H / 2 + 8); view.setLineDash([]);
          view.drawImage(ink, 0, 0);
        }
        function pos(e) { var r = canvas.getBoundingClientRect(); return { x: (e.clientX - r.left) * W / r.width, y: (e.clientY - r.top) * H / r.height }; }
        var drawing = false, last = null, attempts = 0, closed = false;
        canvas.addEventListener("pointerdown", function (e) {
          if (closed) return; drawing = true; last = pos(e);
          try { canvas.setPointerCapture(e.pointerId); } catch (x) {}
          ic.beginPath(); ic.arc(last.x, last.y, 8, 0, Math.PI * 2); ic.fill(); draw();
        });
        canvas.addEventListener("pointermove", function (e) {
          if (!drawing || closed) return; var q = pos(e);
          ic.beginPath(); ic.moveTo(last.x, last.y); ic.lineTo(q.x, q.y); ic.stroke(); last = q; draw();
        });
        ["pointerup", "pointercancel"].forEach(function (n) { canvas.addEventListener(n, function () { drawing = false; }); });

        function clearInk() { ic.clearRect(0, 0, W, H); draw(); }
        function button(label, primary, fn) {
          var b = el("button", "game-btn " + (primary ? "game-btn--primary" : "game-btn--ghost"));
          b.type = "button"; b.textContent = label; b.addEventListener("click", fn); actions.appendChild(b); return b;
        }
        button("Listo", true, function () {
          if (closed) return;
          var m = mc.getImageData(0, 0, W, H).data, k = ic.getImageData(0, 0, W, H).data, mt = 0, cov = 0, it = 0, out = 0;
          for (var i = 3; i < m.length; i += 4) {
            var inM = m[i] > 40, inK = k[i] > 40;
            if (inM) { mt++; if (inK) cov++; }
            if (inK) { it++; if (!inM) out++; }
          }
          if (it < 200) { api.feedback("Traza la letra con el dedo antes de pulsar Listo.", "retry"); return; }
          var c = mt ? cov / mt : 0, o = it ? out / it : 1;
          attempts++;
          if (c >= thr && o <= 0.55) {
            closed = true;
            api.done({
              stars: attempts === 1 ? 1 : (attempts === 2 ? 0.75 : 0.5),
              message: "¡Trazaste la «" + L + "»!",
              error: attempts > 1 ? { attempts: attempts, letter: L } : null
            });
          } else if (attempts >= 3) {
            closed = true;
            api.done({ stars: 0.5, message: "Buen intento con la «" + L + "». Seguimos practicando.", error: { attempts: attempts, letter: L, coverage: Math.round(c * 100) } });
          } else {
            api.feedback("Casi. Sigue el camino punteado y vuelve a intentarlo.", "retry");
            clearInk(); if (attempts === 2) api.hint();
          }
        });
        button("Borrar", false, function () { if (!closed) clearInk(); });
        button("Necesito ayuda del docente", false, function () {
          if (closed) return; closed = true;
          api.done({ stars: 0.5, message: "Lo trazamos juntos con el docente.", error: { help_requested: true, letter: L, attempts: attempts + 1 } });
        });
        draw();
        return function () { closed = true; };
      }
    };
  }

  /** Ahorcado sin castigo: cada error revela más el dibujo-pista. */
  function roundAhorcado(p, ctx) {
    var d = pick(AHORCADO), word = d.w, help = (ctx && ctx.support) || 1;
    var prompt = "Descubre la palabra secreta. Toca letras; cada error revela más el dibujo.";
    return {
      skill: "ahorcado_palabra", prompt: prompt, speech: prompt,
      hint: "Prueba con las vocales primero.",
      mount: function (host, api) {
        host.innerHTML = "";
        var lv = live(), pic = el("div", "dx-big"), slots = el("div", "dx-slots"), keys = el("div", "dx-keys");
        pic.textContent = d.i; pic.setAttribute("aria-hidden", "true"); pic.style.flexBasis = "100%";
        keys.setAttribute("role", "group"); keys.setAttribute("aria-label", "Letras");
        [lv, pic, slots, keys].forEach(function (x) { host.appendChild(x); });
        var shown = word.split("").map(function () { return false; }), wrong = 0, closed = false, btns = {};
        if (help === 1) shown[0] = true;
        function render() {
          slots.textContent = word.split("").map(function (c, i) { return shown[i] ? c : "_"; }).join(" ");
          slots.setAttribute("aria-label", "Palabra: " + word.split("").map(function (c, i) { return shown[i] ? c : "espacio vacío"; }).join(", "));
          pic.style.opacity = String(Math.min(1, 0.15 + wrong * 0.14));
        }
        function guess(ch) {
          if (closed || !btns[ch] || btns[ch].disabled) return;
          btns[ch].disabled = true;
          var hit = false;
          word.split("").forEach(function (c, i) { if (c === ch) { shown[i] = true; hit = true; } });
          if (hit) btns[ch].classList.add("is-correct"); else { wrong++; btns[ch].classList.add("is-wrong"); api.feedback("Esa letra no está. Prueba otra.", "retry"); }
          render();
          if (shown.every(Boolean)) finish(false);
          else if (wrong >= 7) { shown = shown.map(function () { return true; }); render(); finish(true); }
          if (hit) api.feedback("", "");
          if (wrong === 3) api.hint();
        }
        function finish(gaveUp) {
          closed = true; pic.style.opacity = "1";
          api.say(word, true);
          api.done({
            stars: gaveUp ? 0.5 : (wrong <= 2 ? 1 : (wrong <= 4 ? 0.75 : 0.5)),
            message: "La palabra era «" + word + "».",
            error: wrong ? { wrong: wrong, word: word, attempts: wrong + 1 } : null
          });
        }
        "abcdefghijklmnñopqrstuvwxyz".split("").forEach(function (ch) {
          var b = el("button", "game-option dx-key"); b.type = "button"; b.textContent = ch; b.setAttribute("aria-label", "Letra " + ch);
          b.addEventListener("click", function () { guess(ch); });
          keys.appendChild(b); btns[ch] = b;
        });
        function onKey(e) {
          if (e.ctrlKey || e.metaKey || e.altKey) return;
          var k = (e.key || "").toLowerCase();
          if (k.length === 1) guess(k);
        }
        document.addEventListener("keydown", onKey);
        render();
        return function () { closed = true; document.removeEventListener("keydown", onKey); };
      }
    };
  }

  /** Dictado con comparación y segunda oportunidad. */
  function roundDictado() {
    var w = pick(DICTADO);
    var prompt = "Escucha la palabra y escríbela con el teclado.";
    return {
      skill: "dictado", prompt: prompt, speech: prompt,
      hint: "Pulsa «Escuchar» las veces que necesites y escribe letra por letra.",
      mount: function (host, api) {
        host.innerHTML = "";
        var lv = live(), actions = el("div", "dx-actions"), input = el("input", "form-control dx-input"), model = el("p", "dx-model");
        input.type = "text"; input.setAttribute("autocomplete", "off"); input.setAttribute("autocapitalize", "off");
        input.setAttribute("spellcheck", "false"); input.setAttribute("aria-label", "Escribe la palabra que escuchaste");
        model.hidden = true;
        var listen = el("button", "game-btn game-btn--ghost"); listen.type = "button"; listen.textContent = "🔊 Escuchar";
        var check = el("button", "game-btn game-btn--primary"); check.type = "button"; check.textContent = "Comprobar";
        actions.appendChild(listen); actions.appendChild(check);
        [lv, actions, input, model].forEach(function (x) { host.appendChild(x); });
        var tries = 0, closed = false;
        listen.addEventListener("click", function () { api.say(w, true); });
        function submit() {
          if (closed) return;
          var v = input.value.trim();
          if (!v) { api.feedback("Escribe la palabra que escuchaste.", "retry"); return; }
          tries++;
          if (v === w) {
            closed = true; model.hidden = true;
            api.done({ stars: tries === 1 ? 1 : 0.75, message: "¡Bien escrita: «" + w + "»!", error: tries > 1 ? { word: w, attempts: tries } : null });
          } else if (tries === 1) {
            model.hidden = false; model.textContent = "Modelo: " + w;
            lv.textContent = "Compara con el modelo: " + w;
            api.feedback("Compara con el modelo y escríbela de nuevo.", "retry"); input.value = ""; input.focus();
          } else {
            closed = true;
            api.done({ stars: 0.5, message: "Se escribe «" + w + "». Sigue practicando.", error: { word: w, typed: v, attempts: tries } });
          }
        }
        check.addEventListener("click", submit);
        input.addEventListener("keydown", function (e) { if (e.key === "Enter") { e.preventDefault(); submit(); } });
        return function () { closed = true; };
      }
    };
  }

  // ─── Definición de los 10 niveles ─────────────────────────────────────────
  var CONSTRUCTORES = {
    cloze: function () { return retoCloze(); },
    tilde: function () { return retoTilde(); },
    vocab: function () { return retoVocab(); },
    regla: function () { return retoRegla(); },
    lectura_eco: function (p, c, i) { return roundLectura(Object.assign({}, p, { mode: "eco" }), c, i); },
    lectura_compartida: function (p, c, i) { return roundLectura(Object.assign({}, p, { mode: "compartida" }), c, i); },
    lectura_sombra: function (p, c, i) { return roundLectura(Object.assign({}, p, { mode: "sombra" }), c, i); },
    lectura_solo: function (p, c, i) { return roundLectura(Object.assign({}, p, { mode: "solo" }), c, i); },
    ordenar: roundOrdenar,
    trazo: roundTrazo,
    ahorcado: roundAhorcado,
    dictado: roundDictado
  };

  var NIVELES = {
    1: { rounds: 3, mechanics: ["lectura_eco"], params: { lectura_eco: {} },
         intro: "Hola, soy NOVA. Los Detectores de Letras Rebeldes atrapamos letras que se esconden. Empezamos leyendo juntos: yo leo y tú sigues con los ojos." },
    2: { rounds: 5, mechanics: ["cloze"], params: { cloze: {} },
         intro: "A estas palabras se les escapó una letra. Elige la que falta." },
    3: { rounds: 5, mechanics: ["tilde"], params: { tilde: {} },
         intro: "Toda palabra tiene una sílaba que suena más fuerte. Descubre si es aguda, llana o esdrújula." },
    4: { rounds: 4, mechanics: ["ordenar"], params: { ordenar: {} },
         intro: "Las letras se mezclaron. Tócalas en el orden correcto para formar la palabra." },
    5: { rounds: 4, mechanics: ["trazo"], params: { trazo: { letters: LETRAS } },
         intro: "Vamos a trazar letras siguiendo el camino punteado. Usa el dedo o el lápiz óptico. Si necesitas ayuda, pídela." },
    6: { rounds: 5, mechanics: ["vocab"], params: { vocab: {} },
         intro: "Mira el dibujo y elige cómo se escribe la palabra. Fíjate bien en cada letra." },
    7: { rounds: 3, mechanics: ["ahorcado"], params: { ahorcado: {} },
         intro: "Hay una palabra secreta. Toca letras para descubrirla; cada error revela más el dibujo." },
    8: { rounds: 4, mechanics: ["dictado"], params: { dictado: {} },
         intro: "Voy a dictarte palabras. Escúchalas y escríbelas con el teclado. Si te equivocas, tendrás una segunda oportunidad." },
    9: { rounds: 4, mechanics: ["lectura_sombra", "regla"], params: { lectura_sombra: {}, regla: {} },
         intro: "Ahora leemos a la vez: lee en voz alta junto conmigo. Después repasamos reglas de ortografía." },
    10: { rounds: 9,
          mechanics: ["lectura_compartida", "cloze", "tilde", "ordenar", "trazo", "vocab", "ahorcado", "dictado", "regla"],
          params: { lectura_compartida: {}, cloze: {}, tilde: {}, ordenar: {}, trazo: { letters: ["a", "o", "s", "e"] }, vocab: {}, ahorcado: {}, dictado: {}, regla: {} },
          intro: "Última misión: aparece todo lo que aprendiste. Lee, completa, traza y escribe. ¡Tú puedes!" }
  };

  global.IndecapGame.register({
    slug: "dislexia_letras",
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