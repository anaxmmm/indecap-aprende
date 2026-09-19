/**
 * EL ARQUITECTO DEL MUNDO — Trastorno opositor desafiante (TOD)
 *
 * Habilidad núcleo: autorregulación emocional y conductual.
 * Ciclo de terapia cognitivo-conductual gamificada:
 *   nombrar la emoción → pausar → elegir respuesta → ver la consecuencia.
 *  - Termómetro emocional ........ corteza prefrontal ventromedial
 *  - Semáforo y espera ........... cingulado anterior (pausa entre impulso y acción)
 *  - Perspectiva del otro ........ corteza prefrontal medial (empatía)
 *  - Economía de fichas .......... refuerzo positivo, nunca punitivo
 *
 * Diseño: ningún mensaje castiga. El error se presenta como "otra opción",
 * y no hay pérdida de puntos por esperar poco: siempre se reconoce el intento.
 * Nivel 10: evaluación embebida con una muestra de las mecánicas.
 */
(function (global) {
  "use strict";

  // ─── Utilidades ───────────────────────────────────────────────────────────
  function rnd(a, b) { return Math.floor(Math.random() * (b - a + 1)) + a; }
  function pick(a) { return a[rnd(0, a.length - 1)]; }
  function shuffle(a) { a = a.slice(); for (var i = a.length - 1; i > 0; i--) { var j = rnd(0, i), t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  function el(tag, cls) { var n = document.createElement(tag); if (cls) n.className = cls; return n; }
  function live() { var n = el("p", "visually-hidden"); n.setAttribute("role", "status"); n.setAttribute("aria-live", "polite"); return n; }
  function low(t) { return t.charAt(0).toLowerCase() + t.slice(1); }
  function opts(ok, bads, n) {
    return shuffle([ok].concat(shuffle(bads).slice(0, n - 1))).map(function (t) { return { label: t, value: t, aria: t }; });
  }
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

  addStyles("tod-styles", [
    ".game-shell .game-options .game-option{font-size:1.1rem;max-width:320px}",
    ".tod-big{flex-basis:100%;font-size:4.5rem;line-height:1}",
    ".tod-msg{flex-basis:100%;font-size:1.1rem;line-height:1.6;color:var(--g-text);max-width:520px;margin:6px auto 12px}",
    ".tod-actions{flex-basis:100%;display:flex;flex-wrap:wrap;gap:12px;justify-content:center}",
    ".tod-tower{flex-basis:100%;font-size:2rem;line-height:1.3;min-height:48px;word-break:break-all}",
    ".game-btn.is-waiting{opacity:.55}",
    ".seq-status{flex-basis:100%;font-weight:600;color:var(--g-muted);margin-bottom:8px}",
    ".seq-list{flex-basis:100%;list-style:none;margin:0 auto 12px;padding:0;max-width:480px;text-align:left}",
    ".seq-list li{background:var(--g-ok-soft);border:2px solid var(--g-ok);color:var(--g-ok);border-radius:12px;padding:10px 14px;margin-bottom:8px;font-weight:600}",
    ".seq-steps{flex-basis:100%;display:flex;flex-wrap:wrap;gap:12px;justify-content:center}",
    ".game-option.seq-step{display:flex;flex-direction:column;align-items:center;gap:6px;font-size:1rem;min-width:120px}",
    ".seq-icon{font-size:2.2rem;line-height:1}",
    ".game-option.seq-next{outline:4px solid var(--g-accent);outline-offset:3px}"
  ].join("\n"));

  /** Ordenar elementos tocándolos. Reutilizable: pasos con {k, i?, t}. */
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
          live.textContent = "";
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
          api.feedback("Ese va después. Mira cuál se hace primero.", "retry");
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

  // ─── Datos ────────────────────────────────────────────────────────────────
  var NIV = { 1: "Tranquilo", 2: "Molesto", 3: "Muy enojado" };
  var ESCENAS = [
    { t: "Un compañero te saluda y tú sonríes.", icon: "🙂", lvl: 1 },
    { t: "Estás dibujando con calma.", icon: "🎨", lvl: 1 },
    { t: "Alguien te empuja sin querer en la fila.", icon: "🚶", lvl: 2 },
    { t: "Perdiste un punto en el juego.", icon: "🎮", lvl: 2 },
    { t: "Te quitan tu juguete y se lo llevan corriendo.", icon: "🧸", lvl: 3 },
    { t: "Te dicen que no puedes salir al recreo y no entiendes por qué.", icon: "🏫", lvl: 3 }
  ];
  var CALMAS = ["Respirar hondo cuatro veces", "Contar hasta diez despacio", "Pedir un momento a solas", "Apretar una pelota antiestrés", "Tomar agua y estirar los brazos"];
  var NOCALMAS = ["Gritar más fuerte", "Tirar las cosas al piso", "Empujar a alguien", "Romper mi cuaderno"];

  var DEC = [
    { t: "Un compañero te quitó tu lápiz.", icon: "✏️", ok: "Le digo con calma: «Es mío, por favor devuélvemelo»", bad: ["Se lo quito a la fuerza", "Le grito y me voy"], why: "Así pides lo tuyo sin pelear y es más fácil que te lo devuelva." },
    { t: "Tu equipo perdió el partido.", icon: "⚽", ok: "Respiro y felicito al otro equipo", bad: ["Pateo el balón lejos", "Culpo a mis compañeros"], why: "Perder también es parte de jugar, y así el ambiente sigue bien." },
    { t: "La profesora te pide guardar el celular.", icon: "📱", ok: "Lo guardo y le pregunto cuándo puedo usarlo", bad: ["Le digo que no y sigo usándolo", "Lo escondo y finjo que lo guardé"], why: "Cumplir la regla y preguntar por el momento te da más confianza." },
    { t: "Otro niño hizo una burla de ti.", icon: "😤", ok: "Me alejo y se lo cuento a un adulto", bad: ["Le pego", "Le hago una burla peor"], why: "Alejarte y pedir ayuda te protege y resuelve el problema." },
    { t: "Te toca esperar tu turno en el juego.", icon: "⏳", ok: "Espero y cuento mientras llega mi turno", bad: ["Me meto antes", "Me voy y dejo el juego"], why: "Esperar es difícil, y lo estás logrando." },
    { t: "Te piden ayudar a recoger el salón.", icon: "🧹", ok: "Ayudo con lo que puedo", bad: ["Digo que no es mi trabajo", "Me escondo"], why: "Colaborar hace que terminen más rápido y todos se sientan bien." }
  ];
  var PERS = [
    { t: "Marta le prestó su borrador a Juan y Juan lo perdió.", ok: "Marta se siente molesta o triste porque era suyo", bad: ["Marta se siente feliz porque se libró del borrador", "Marta no siente nada"] },
    { t: "Sofía dibujó un paisaje y alguien lo rompió sin querer.", ok: "Sofía se siente triste porque se esforzó", bad: ["Sofía se siente muy contenta", "A Sofía le da lo mismo"] },
    { t: "Andrés se cayó en el patio y todos se rieron.", ok: "Andrés se siente avergonzado o triste", bad: ["Andrés se siente orgulloso", "Andrés se siente tranquilo"] },
    { t: "Lucía sacó una buena nota y su amigo la felicitó.", ok: "Lucía se siente contenta y apreciada", bad: ["Lucía se siente enojada", "Lucía se siente asustada"] },
    { t: "Pedro esperó su turno mucho rato y al final se lo saltaron.", ok: "Pedro se siente molesto porque no fue justo", bad: ["Pedro se siente feliz", "Pedro no se dio cuenta"] }
  ];
  var FICHAS = [
    { t: "La profesora dice: «Guarden sus cuadernos».", ok: "Guardo mi cuaderno y espero la siguiente instrucción", bad: ["Sigo escribiendo como si nada", "Cierro el cuaderno con fuerza y protesto"] },
    { t: "Es hora de formar la fila para salir.", ok: "Me pongo en la fila con calma", bad: ["Me quedo sentado", "Corro a la puerta empujando"] },
    { t: "Un compañero necesita un borrador y tú tienes dos.", ok: "Le presto uno", bad: ["Digo que no tengo", "Se lo escondo"] },
    { t: "Terminaste tu tarea antes que los demás.", ok: "Reviso mi trabajo o espero en silencio", bad: ["Molesto a los demás", "Me paro a caminar por el salón"] },
    { t: "Te piden bajar la voz.", ok: "Bajo la voz y sigo con mi actividad", bad: ["Hablo más fuerte", "Me enojo y me voy"] }
  ];

  // ─── Mecánicas de opción única ────────────────────────────────────────────
  function retoTermometro() {
    var s = pick(ESCENAS);
    var prompt = "Escena: " + s.t + " ¿Qué tan fuerte es la emoción?";
    return {
      skill: "termometro_emocional", prompt: prompt, speech: prompt,
      visual: '<span class="tod-big">' + s.icon + "</span>",
      options: [1, 2, 3].map(function (n) { return { label: NIV[n], value: n, aria: NIV[n] }; }),
      answer: s.lvl, answerLabel: NIV[s.lvl],
      hint: "Piensa si para quien lo vive es algo pequeño, mediano o muy grande.",
      explain: "Aquí la emoción es de nivel «" + NIV[s.lvl] + "»."
    };
  }
  function retoEstrategia() {
    var ok = pick(CALMAS);
    var prompt = "Sientes mucho enojo. ¿Qué te ayuda a calmarte?";
    return {
      skill: "estrategia_calma", prompt: prompt, speech: prompt,
      visual: '<span class="tod-big">🌡️</span>',
      options: opts(ok, NOCALMAS, 3), answer: ok, answerLabel: ok,
      hint: "Busca lo que baja el enojo sin lastimar a nadie.",
      explain: "«" + ok + "» ayuda a bajar la intensidad de la emoción."
    };
  }
  function retoDecision() {
    var d = pick(DEC);
    var prompt = "Situación: " + d.t + " ¿Qué eliges hacer?";
    return {
      skill: "historia_decision", prompt: prompt, speech: prompt,
      visual: '<span class="tod-big">' + d.icon + "</span>",
      options: opts(d.ok, d.bad, 3), answer: d.ok, answerLabel: d.ok,
      hint: "Piensa qué pasaría después con cada opción.",
      explain: d.why
    };
  }
  function retoPerspectiva() {
    var p = pick(PERS);
    var prompt = p.t + " ¿Cómo se siente?";
    return {
      skill: "perspectiva_otro", prompt: prompt, speech: prompt,
      visual: '<span class="tod-big">🧠</span>',
      options: opts(p.ok, p.bad, 3), answer: p.ok, answerLabel: p.ok,
      hint: "Imagina que eso te pasara a ti.",
      explain: "Ponerse en el lugar del otro ayuda a entender lo que siente."
    };
  }
  function retoFichas() {
    var f = pick(FICHAS);
    var prompt = "Situación: " + f.t + " Elige la conducta esperada para ganar una ficha ⭐.";
    return {
      skill: "economia_fichas", prompt: prompt, speech: prompt,
      visual: '<span class="tod-big">⭐</span>',
      options: opts(f.ok, f.bad, 3), answer: f.ok, answerLabel: f.ok,
      hint: "Elige lo que ayuda a que todos trabajen bien.",
      explain: "¡Ficha ganada! Elegir esta conducta suma para decorar tu estación."
    };
  }

  // ─── Mecánicas con interfaz propia ────────────────────────────────────────
  /** Semáforo: ROJO detente, AMARILLO piensa, VERDE actúa. */
  function roundSemaforo(p, ctx) {
    var d = pick(DEC), m = mult(ctx), secs = Math.max(2, Math.round(3 * m));
    var prompt = "Pasa algo que te molesta. ROJO: detente. AMARILLO: piensa. VERDE: actúa.";
    return {
      skill: "semaforo_calma", prompt: prompt, speech: prompt,
      hint: "Respira antes de elegir. No hay prisa.",
      mount: function (host, api) {
        var s = sched(); host.innerHTML = "";
        var lv = live(), light = el("div", "tod-big"), msg = el("p", "tod-msg"), box = el("div", "tod-actions");
        [lv, light, msg, box].forEach(function (x) { host.appendChild(x); });
        var errors = 0, closed = false;

        function red() {
          light.textContent = "🔴";
          msg.textContent = "ROJO. " + d.t + " Detente y respira.";
          lv.textContent = msg.textContent; api.say("Rojo. Detente y respira.");
          box.innerHTML = "";
          var left = secs, b = el("button", "game-btn game-btn--primary is-waiting");
          b.type = "button"; b.setAttribute("aria-disabled", "true"); b.textContent = "Espera… " + left;
          box.appendChild(b);
          (function tick() {
            s.later(function () {
              left--;
              if (left > 0) { b.textContent = "Espera… " + left; tick(); }
              else { b.classList.remove("is-waiting"); b.removeAttribute("aria-disabled"); b.textContent = "Ya me detuve"; b.focus(); }
            }, 1000);
          })();
          b.addEventListener("click", function () { if (!b.classList.contains("is-waiting")) yellow(); });
        }
        function yellow() {
          light.textContent = "🟡";
          msg.textContent = "AMARILLO. Piensa: ¿qué puedo hacer?";
          lv.textContent = msg.textContent; api.say("Amarillo. Piensa qué puedes hacer.");
          box.innerHTML = "";
          opts(d.ok, d.bad, 3).forEach(function (o) {
            var b = el("button", "game-option"); b.type = "button"; b.textContent = o.label; b.setAttribute("aria-label", o.aria);
            b.addEventListener("click", function () {
              if (closed) return;
              if (o.value === d.ok) { green(); }
              else {
                errors++; b.classList.add("is-wrong"); b.disabled = true;
                api.feedback("Prueba otra opción. Puedes pensarlo con calma.", "retry");
                if (errors === 2) api.hint();
              }
            });
            box.appendChild(b);
          });
        }
        function green() {
          closed = true; light.textContent = "🟢";
          msg.textContent = "VERDE. Actúa: " + d.ok + ".";
          lv.textContent = msg.textContent; box.innerHTML = "";
          api.done({
            stars: errors === 0 ? 1 : (errors === 1 ? 0.75 : 0.5),
            message: "¡Lo hiciste con calma!",
            error: errors ? { wrong: errors, attempts: errors + 1 } : null
          });
        }
        red();
        return function () { closed = true; s.stop(); };
      }
    };
  }

  /** Espera con recompensa diferida: "cuida el huevo". */
  function roundEspera(p, ctx) {
    var target = Math.max(4, Math.round(p.secs * (((ctx && ctx.support) || 1) === 1 ? 0.7 : 1)));
    var prompt = "Cuida el huevo. Cuanto más esperes sin tocar el botón, más grande será tu premio. Puedes tocar cuando quieras.";
    return {
      skill: "espera_recompensa", prompt: prompt, speech: prompt,
      hint: "Respira mientras esperas. Cada segundo cuenta.",
      mount: function (host, api) {
        var s = sched(); host.innerHTML = "";
        var lv = live(), egg = el("div", "tod-big"), st = el("p", "tod-msg"), box = el("div", "tod-actions");
        egg.textContent = "🥚"; egg.setAttribute("aria-hidden", "true");
        var b = el("button", "game-btn game-btn--ghost"); b.type = "button"; b.textContent = "Ya no quiero esperar";
        box.appendChild(b);
        [lv, egg, st, box].forEach(function (x) { host.appendChild(x); });
        var t = 0, closed = false;
        st.textContent = "Has esperado 0 de " + target + " segundos.";

        function finish(hatched) {
          if (closed) return; closed = true; b.disabled = true;
          var ratio = t / target;
          var stars = hatched ? 1 : (ratio >= 0.6 ? 0.75 : (ratio >= 0.3 ? 0.5 : 0.25));
          if (hatched) egg.textContent = "🐥";
          api.done({
            stars: stars,
            message: hatched ? "¡El huevo eclosionó! Esperaste " + t + " segundos."
                             : "Esperaste " + t + " segundos. ¡Eso también es un logro!",
            error: hatched ? null : { waited: t, target: target, attempts: 1 }
          });
        }
        (function tick() {
          s.later(function () {
            if (closed) return;
            t++;
            egg.textContent = t >= target ? "🐥" : (t >= target / 2 ? "🐣" : "🥚");
            st.textContent = "Has esperado " + t + " de " + target + " segundos.";
            if (t === Math.floor(target / 2)) { lv.textContent = "Vas por la mitad."; api.say("Vas por la mitad."); }
            if (t >= target) finish(true); else tick();
          }, 1000);
        })();
        b.addEventListener("click", function () { finish(false); });
        return function () { closed = true; s.stop(); };
      }
    };
  }

  /** Turnos y cooperación con NOVA. */
  function roundTurnos(p, ctx) {
    var m = mult(ctx);
    var prompt = "Construye una torre con NOVA. Pon un bloque solo cuando sea tu turno.";
    return {
      skill: "turnos_cooperacion", prompt: prompt, speech: prompt,
      hint: "Mira quién tiene el turno antes de tocar.",
      mount: function (host, api) {
        var s = sched(); host.innerHTML = "";
        var lv = live(), turn = el("p", "tod-msg"), tower = el("div", "tod-tower"), box = el("div", "tod-actions");
        tower.setAttribute("aria-hidden", "true");
        var b = el("button", "game-btn game-btn--primary"); b.type = "button"; b.textContent = "Poner mi bloque 🧱";
        box.appendChild(b);
        [lv, turn, tower, box].forEach(function (x) { host.appendChild(x); });
        var mine = true, placed = 0, skips = 0, closed = false;

        function setTurn(me) {
          mine = me; b.classList.toggle("is-waiting", !me); b.setAttribute("aria-disabled", String(!me));
          turn.textContent = me ? "Es tu turno." : "Es el turno de NOVA. Esperemos.";
          lv.textContent = turn.textContent;
        }
        setTurn(true);
        b.addEventListener("click", function () {
          if (closed) return;
          if (!mine) { skips++; api.feedback("Todavía no es tu turno. Esperemos a NOVA.", "retry"); return; }
          api.feedback("", "");
          placed++; tower.textContent += "🧱"; setTurn(false);
          if (placed >= p.blocks) { end(); return; }
          s.later(function () {
            placed++; tower.textContent += "🟦";
            if (placed >= p.blocks) { end(); return; }
            setTurn(true);
          }, 1300 * m);
        });
        function end() {
          if (closed) return; closed = true; b.disabled = true;
          api.done({
            stars: skips === 0 ? 1 : (skips === 1 ? 0.75 : (skips === 2 ? 0.5 : 0.25)),
            message: "¡Torre terminada entre los dos!",
            error: skips ? { skipped_turns: skips, attempts: skips + 1 } : null
          });
        }
        return function () { closed = true; s.stop(); };
      }
    };
  }

  /** Autoinstrucciones: "Paro. Pienso. Elijo." */
  function roundGuion(p, ctx) {
    var steps = p.steps === 3
      ? [{ k: "paro", i: "✋", t: "Paro" }, { k: "pienso", i: "💭", t: "Pienso" }, { k: "elijo", i: "✅", t: "Elijo" }]
      : [{ k: "paro", i: "✋", t: "Paro" }, { k: "respiro", i: "🌬️", t: "Respiro" }, { k: "pienso", i: "💭", t: "Pienso" }, { k: "elijo", i: "✅", t: "Elijo" }];
    var prompt = "Ordena los pasos de tu guion de calma. Toca primero el paso que se hace primero.";
    return {
      skill: "autoinstrucciones", prompt: prompt, speech: prompt,
      hint: "Primero detengo mi cuerpo, al final elijo qué hacer.",
      mount: sequenceMount(steps, (ctx && ctx.support) || 1, true, { script: p.steps + " pasos" })
    };
  }

  // ─── Definición de los 10 niveles ─────────────────────────────────────────
  var CONSTRUCTORES = {
    termometro: function () { return retoTermometro(); },
    estrategia: function () { return retoEstrategia(); },
    decision: function () { return retoDecision(); },
    perspectiva: function () { return retoPerspectiva(); },
    fichas: function () { return retoFichas(); },
    semaforo: roundSemaforo,
    espera: roundEspera,
    turnos: roundTurnos,
    guion: roundGuion
  };

  var NIVELES = {
    1: { rounds: 5, mechanics: ["termometro"], params: { termometro: {} },
         intro: "Hola, soy NOVA. En esta misión construimos tu mundo aprendiendo a manejar lo que sientes. Primero: ponerle nombre a la emoción. ¿Qué tan fuerte es?" },
    2: { rounds: 5, mechanics: ["estrategia"], params: { estrategia: {} },
         intro: "Cuando una emoción es muy fuerte, hay trucos para calmarla. Elige el que ayuda." },
    3: { rounds: 4, mechanics: ["decision"], params: { decision: {} },
         intro: "Ante un problema puedes elegir cómo reaccionar. Verás qué pasa con cada elección." },
    4: { rounds: 3, mechanics: ["semaforo"], params: { semaforo: {} },
         intro: "El semáforo de la calma: rojo, detente. Amarillo, piensa. Verde, actúa." },
    5: { rounds: 3, mechanics: ["espera"], params: { espera: { secs: 6 } },
         intro: "Esperar es difícil y tiene premio. Cuida el huevo: no hay respuestas malas, solo intentos." },
    6: { rounds: 5, mechanics: ["perspectiva"], params: { perspectiva: {} },
         intro: "Ahora, ponte en el lugar del otro. ¿Cómo se siente cada personaje y por qué?" },
    7: { rounds: 2, mechanics: ["turnos"], params: { turnos: { blocks: 8 } },
         intro: "Vamos a construir una torre entre NOVA y tú, por turnos. Espera tu turno para poner tu bloque." },
    8: { rounds: 3, mechanics: ["guion"], params: { guion: { steps: 3 } },
         intro: "Tu guion de calma: Paro. Pienso. Elijo. Ordénalo para que quede en tu mente." },
    9: { rounds: 5, mechanics: ["fichas"], params: { fichas: {} },
         intro: "Cada buena decisión te da una ficha para decorar tu estación. Elige la conducta esperada en cada situación." },
    10: { rounds: 8,
          mechanics: ["termometro", "estrategia", "decision", "semaforo", "perspectiva", "turnos", "guion", "fichas"],
          params: { termometro: {}, estrategia: {}, decision: {}, semaforo: {}, perspectiva: {}, turnos: { blocks: 6 }, guion: { steps: 4 }, fichas: {} },
          intro: "Última misión: aparece todo lo que practicaste. Ya sabes cómo calmarte y decidir. ¡Adelante!" }
  };

  global.IndecapGame.register({
    slug: "tod_arquitecto",
    getLevel: function (level) {
      var base = NIVELES[level] || NIVELES[1];
      return { rounds: base.rounds, mechanics: base.mechanics.slice(), params: base.params, intro: base.intro };
    },
    buildRound: function (cfg, index, ctx) {
      var m = cfg.mechanics[index % cfg.mechanics.length];
      return CONSTRUCTORES[m](cfg.params[m] || {}, ctx || { support: 1 }, index);
    }
  });
})(window);