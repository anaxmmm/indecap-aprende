/**
 * MISIÓN RITMO Y ENFOQUE — TDAH
 *
 * Habilidad núcleo: funciones ejecutivas.
 *  - Control inhibitorio (go/no-go) .............. corteza orbitofrontal, estriado
 *  - Memoria de trabajo (secuencias, eco) ........ corteza prefrontal dorsolateral
 *  - Atención selectiva (búsqueda, flechas) ...... cingulado anterior
 *  - Flexibilidad cognitiva (cambio de regla) .... corteza prefrontal, cingulado
 *  - Planificación y organización (agenda) ....... corteza prefrontal dorsolateral
 *
 * MAPA DE ETAPAS (5 Stages de 10 niveles, 50 en total, numeración continua):
 *   Stage 1 · Base            → niveles 1-10  (sin cambio de contenido)
 *   Stage 2 · Media           → niveles 11-20 (ritmo más ágil, mecánicas nuevas)
 *   Stage 3 · Alta            → niveles 21-30 (más velocidad, menos apoyo)
 *   Stage 4 · Muy Alta        → niveles 31-40 (doble exigencia, funciones combinadas)
 *   Stage 5 · Súper Difícil   → niveles 41-50 (integración total, ritmo máximo)
 *
 * El desbloqueo de nivel a nivel (score >= 60) lo maneja
 * games/services.py::get_unlocked_level, agnóstico al número de niveles.
 *
 * Apoyos según el nivel de autonomía del perfil (ajuste pedagógico, no
 * diagnóstico): guiado = más tiempo y más repeticiones; independiente = tiempo
 * base y sin repeticiones. El entrenamiento de funciones ejecutivas es un
 * apoyo pedagógico, no un tratamiento clínico del TDAH.
 *
 * Estilos: se inyectan desde aquí para no tocar games.css.
 */
(function (global) {
  "use strict";

  // ─── Utilidades ───────────────────────────────────────────────────────────

  function rnd(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  function pick(a) { return a[rnd(0, a.length - 1)]; }

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

  /** Multiplicador de tiempo: más tiempo cuanto más acompañado el estudiante. */
  function timeMult(ctx) {
    var s = (ctx && ctx.support) || 1;
    return s === 1 ? 1.6 : (s === 2 ? 1.3 : 1);
  }

  /** Temporizadores agrupados para poder cancelarlos todos al salir del reto. */
  function scheduler() {
    var alive = true, timers = [], intervals = [];
    return {
      later: function (fn, ms) {
        timers.push(setTimeout(function () { if (alive) fn(); }, ms));
      },
      every: function (fn, ms) {
        intervals.push(setInterval(function () { if (alive) fn(); }, ms));
      },
      stop: function () {
        alive = false;
        timers.forEach(clearTimeout);
        intervals.forEach(clearInterval);
      }
    };
  }

  var STYLE_ID = "tdah-ritmo-styles";
  function injectStyles() {
    if (document.getElementById(STYLE_ID)) return;
    var css = [
      ".tdah-stim{flex-basis:100%;min-height:110px;display:flex;align-items:center;justify-content:center;font-size:5rem;line-height:1;font-weight:700;color:var(--g-frame);border-radius:16px;transition:background .2s ease}",
      ".tdah-stim.is-ok{background:var(--g-ok-soft)}",
      ".tdah-stim.is-bad{background:var(--g-retry-soft)}",
      ".tdah-tap{min-width:240px;min-height:68px;font-size:1.3rem}",
      ".tdah-pad,.tdah-actions{flex-basis:100%;display:flex;flex-wrap:wrap;gap:12px;justify-content:center}",
      ".tdah-status{flex-basis:100%;font-weight:600;color:var(--g-muted);margin-bottom:8px}",
      ".tdah-rule{flex-basis:100%;font-weight:700;background:var(--g-accent-soft);color:var(--g-frame-dark);border-radius:10px;padding:8px 14px}",
      ".tdah-grid{flex-basis:100%;width:100%;max-width:440px;margin:0 auto;display:grid;grid-template-columns:repeat(var(--cols,4),minmax(56px,1fr));gap:10px}",
      ".tdah-cell{background:#FFFFFF;border:3px solid var(--g-frame);border-radius:12px;min-height:60px;font-size:2rem;cursor:pointer}",
      ".tdah-cell:disabled{cursor:default;opacity:.55}",
      ".tdah-cell.is-found{background:var(--g-ok-soft);border-color:var(--g-ok);opacity:1}",
      ".tdah-cell.is-miss{background:var(--g-retry-soft);border-color:var(--g-retry)}",
      ".tdah-cell:focus-visible{outline:3px solid var(--g-accent);outline-offset:3px}",
      ".tdah-flanker{flex-basis:100%;display:flex;align-items:center;justify-content:center;gap:14px;font-size:2.6rem;font-weight:700;color:var(--g-frame);min-height:100px}",
      ".tdah-flanker .is-center{color:var(--g-accent);transform:scale(1.15)}",
      ".tdah-agenda-list{flex-basis:100%;list-style:none;margin:0 auto 14px;padding:0;max-width:520px;text-align:left}",
      ".tdah-agenda-item{background:#FFFFFF;border:2px solid var(--g-frame);border-radius:12px;padding:10px 16px;margin-bottom:8px;cursor:pointer;display:flex;justify-content:space-between;gap:10px;align-items:center}",
      ".tdah-agenda-item:disabled,.tdah-agenda-item.is-placed{cursor:default;opacity:.55}",
      ".tdah-agenda-item.is-wrong{border-color:var(--g-retry);background:var(--g-retry-soft)}",
      ".tdah-agenda-slots{flex-basis:100%;list-style:decimal;margin:0 auto;padding-left:1.4rem;max-width:520px;text-align:left}",
      ".tdah-agenda-slots li{color:var(--g-ok);font-weight:600;margin-bottom:6px;min-height:1.4em}",
      ".tdah-eco-history{flex-basis:100%;font-size:0.85rem;color:var(--g-muted);margin-bottom:4px}"
    ].join("\n");
    var style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = css;
    document.head.appendChild(style);
  }
  injectStyles();

  // ─── Mecánica 1: go / no-go (control inhibitorio) ─────────────────────────

  function roundGoNoGo(p, ctx) {
    var mult = timeMult(ctx);
    var sw = !!p.switchRule;
    var prompt = sw
      ? "Al empezar, toca solo cuando aparezca un satélite 🛰️. A mitad del reto la regla cambia, y yo te aviso."
      : "Toca el botón SOLO cuando aparezca un satélite 🛰️. Si aparece un meteorito ☄️, no toques.";

    return {
      skill: "go_no_go",
      prompt: prompt,
      speech: prompt,
      hint: "Espera a ver qué aparece antes de tocar. Si dudas, mejor no toques.",
      mount: function (host, api) {
        var SAT = { icon: "🛰️", name: "satélite" };
        var MET = { icon: "☄️", name: "meteorito" };
        var s = scheduler();

        var half = sw ? Math.floor(p.count / 2) : p.count;
        function phasePlan(len) {
          var nogo = Math.max(1, Math.round(len * p.nogoRatio));
          var arr = [];
          for (var i = 0; i < len; i++) arr.push(i < nogo ? "nogo" : "go");
          return shuffle(arr);
        }
        var plan = phasePlan(half);
        if (sw) plan = plan.concat(phasePlan(p.count - half));

        host.innerHTML = "";
        var live = liveRegion();
        var stim = el("div", "tdah-stim");
        stim.setAttribute("aria-hidden", "true");
        var btn = el("button", "game-btn game-btn--primary tdah-tap");
        btn.type = "button";
        btn.textContent = "Estoy listo";
        host.appendChild(live);
        host.appendChild(stim);
        host.appendChild(btn);

        var started = false, idx = 0, cur = null, announced = false;
        var hits = 0, rejections = 0, omissions = 0, commissions = 0;

        btn.addEventListener("click", function () {
          if (!started) {
            started = true;
            btn.textContent = "¡TOCAR!";
            s.later(next, 700);
            return;
          }
          if (!cur || !cur.open || cur.responded) return;
          cur.responded = true;
          if (cur.tok === "go") { hits++; stim.classList.add("is-ok"); }
          else { commissions++; stim.classList.add("is-bad"); }
        });

        function next() {
          if (idx >= plan.length) { finish(); return; }

          if (sw && idx === half && !announced) {
            announced = true;
            cur = null;
            stim.className = "tdah-stim";
            stim.textContent = "🔄";
            var msg = "¡Cambio de regla! Ahora toca solo con el meteorito ☄️. Con el satélite, no toques.";
            live.textContent = msg;
            api.setPrompt(msg);
            api.say(msg);
            s.later(next, 3600 * mult);
            return;
          }

          var tok = plan[idx];
          var phase = (sw && idx >= half) ? 2 : 1;
          var obj = ((tok === "go") === (phase === 1)) ? SAT : MET;

          cur = { tok: tok, open: true, responded: false };
          stim.className = "tdah-stim";
          stim.textContent = obj.icon;
          live.textContent = obj.name;

          s.later(function () {
            cur.open = false;
            if (!cur.responded) {
              if (cur.tok === "go") omissions++; else rejections++;
            }
            stim.textContent = "";
            stim.className = "tdah-stim";
            live.textContent = "";
            idx++;
            s.later(next, p.gapMs * mult);
          }, p.showMs * mult);
        }

        function finish() {
          btn.disabled = true;
          var total = plan.length;
          var ok = hits + rejections;
          api.done({
            stars: ok / total,
            message: "Bloque terminado: acertaste " + ok + " de " + total + ".",
            error: (omissions || commissions) ? {
              omissions: omissions,        // no tocó cuando debía (inatención)
              commissions: commissions,    // tocó cuando no debía (impulsividad)
              hits: hits,
              rejections: rejections,
              attempts: 1
            } : null
          });
        }

        return function () { s.stop(); };
      }
    };
  }

  // ─── Mecánica 2: secuencias (memoria de trabajo) ──────────────────────────

  function roundSecuencia(p, ctx) {
    ctx = ctx || { support: 1 };
    var mult = timeMult(ctx);
    var len = rnd(p.lenMin, p.lenMax);
    var pool = shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9]).slice(0, len);
    var expected;
    if (p.mode === "reverse") expected = pool.slice().reverse();
    else if (p.mode === "asc") expected = pool.slice().sort(function (a, b) { return a - b; });
    else expected = pool.slice();

    var replaysAllowed = ctx.support === 1 ? 2 : (ctx.support === 2 ? 1 : 0);
    var prompt = p.mode === "reverse"
      ? "Mira los números. Luego tócalos AL REVÉS: empieza por el último que viste."
      : (p.mode === "asc"
        ? "Mira los números. Luego tócalos de MENOR a MAYOR."
        : "Mira los números. Luego tócalos en el MISMO orden en que aparecieron.");

    return {
      skill: "memoria_secuencia_" + p.mode,
      prompt: prompt,
      speech: prompt,
      hint: p.mode === "reverse"
        ? "Piensa en el último número primero, y sigue hacia atrás."
        : (p.mode === "asc" ? "Busca el número más chico y ve subiendo." : "Repite en tu cabeza la secuencia mientras la ves."),
      mount: function (host, api) {
        var s = scheduler();
        host.innerHTML = "";
        var live = liveRegion();
        var stim = el("div", "tdah-stim");
        stim.setAttribute("aria-hidden", "true");
        var pad = el("div", "tdah-pad");
        pad.setAttribute("role", "group");
        pad.setAttribute("aria-label", "Números para tocar");
        var actions = el("div", "tdah-actions");
        var playBtn = el("button", "game-btn game-btn--primary");
        playBtn.type = "button";
        playBtn.textContent = "Ver la secuencia";
        actions.appendChild(playBtn);
        var againBtn = null;
        var left = replaysAllowed;
        if (replaysAllowed > 0) {
          againBtn = el("button", "game-btn game-btn--ghost");
          againBtn.type = "button";
          againBtn.hidden = true;
          actions.appendChild(againBtn);
        }
        host.appendChild(live);
        host.appendChild(stim);
        host.appendChild(pad);
        host.appendChild(actions);

        var playing = false, finished = false, pos = 0, errors = 0, replays = 0;

        function refreshAgain() {
          if (!againBtn) return;
          againBtn.textContent = "Ver otra vez (" + left + ")";
          againBtn.disabled = left <= 0;
        }

        function buildPad() {
          pad.innerHTML = "";
          var digits = p.pad === "full"
            ? [1, 2, 3, 4, 5, 6, 7, 8, 9]
            : shuffle(pool);
          digits.forEach(function (d) {
            var b = el("button", "game-option");
            b.type = "button";
            b.textContent = d;
            b.setAttribute("aria-label", "Número " + d);
            b.addEventListener("click", function () { tap(b, d); });
            pad.appendChild(b);
          });
        }

        function play() {
          playing = true;
          pos = 0;
          pad.innerHTML = "";
          var i = 0;
          function step() {
            if (i >= pool.length) {
              stim.textContent = "?";
              live.textContent = "Ahora te toca a ti.";
              buildPad();
              playing = false;
              return;
            }
            stim.textContent = pool[i];
            live.textContent = String(pool[i]);
            api.say(String(pool[i]));
            i++;
            s.later(function () {
              stim.textContent = "";
              s.later(step, 250);
            }, p.showMs * mult);
          }
          step();
        }

        function tap(b, d) {
          if (playing || finished) return;
          if (d === expected[pos]) {
            b.classList.add("is-correct");
            b.disabled = true;
            pos++;
            if (pos === expected.length) end();
          } else {
            errors++;
            b.classList.add("is-wrong");
            api.feedback("Ese no es el que sigue. Piénsalo con calma.", "retry");
            setTimeout(function () { b.classList.remove("is-wrong"); }, 500);
            if (errors === 2) api.hint();
          }
        }

        function end() {
          finished = true;
          var stars = errors === 0 ? 1 : (errors === 1 ? 0.75 : (errors === 2 ? 0.5 : 0.25));
          api.done({
            stars: stars,
            message: errors === 0 ? "¡Secuencia perfecta!" : "¡Secuencia completada!",
            error: errors ? { wrong: errors, replays: replays, attempts: errors + 1 } : null
          });
        }

        playBtn.addEventListener("click", function () {
          if (playing || finished) return;
          playBtn.hidden = true;
          if (againBtn) { againBtn.hidden = false; refreshAgain(); }
          play();
        });
        if (againBtn) {
          againBtn.addEventListener("click", function () {
            if (playing || finished || left <= 0) return;
            left--;
            replays++;
            refreshAgain();
            play();
          });
        }

        return function () { s.stop(); };
      }
    };
  }

  // ─── Mecánica 3: búsqueda selectiva (atención) ────────────────────────────

  var NOMBRES = {
    "⭐": "estrella", "🌙": "luna", "☀️": "sol", "🪐": "planeta",
    "🚀": "cohete", "🛸": "platillo volador", "🛰️": "satélite", "✈️": "avión",
    "📦": "paquete", "📄": "documento", "📌": "chincheta", "🔖": "marcador"
  };
  var PLURALES = { "⭐": "estrellas", "🚀": "cohetes", "📦": "paquetes" };

  function roundBusqueda(p, ctx) {
    var mult = timeMult(ctx);
    var sets = {
      easy: { target: "⭐", dis: ["🌙", "☀️", "🪐"] },
      hard: { target: "🚀", dis: ["🛸", "🛰️", "✈️"] },
      oficina: { target: "📦", dis: ["📄", "📌", "🔖"] }
    };
    var set = sets[p.set] || sets.easy;
    var target = set.target, dis = set.dis;
    var cells = [];
    for (var i = 0; i < p.targets; i++) cells.push(target);
    while (cells.length < p.cells) cells.push(dis[rnd(0, dis.length - 1)]);
    cells = shuffle(cells);
    var limit = p.timeMs ? Math.round(p.timeMs * mult / 1000) : 0;

    var prompt = "Encuentra " + p.targets + " " + PLURALES[target] + " " + target +
      " en el mapa. Toca solo las " + PLURALES[target] + ".";

    return {
      skill: "busqueda_selectiva",
      prompt: prompt,
      speech: "Encuentra " + p.targets + " " + PLURALES[target] + " en el mapa. Toca solo las " + PLURALES[target] + ".",
      hint: "Recorre el mapa en orden, fila por fila, sin saltar de un lado a otro.",
      mount: function (host, api) {
        var s = scheduler();
        host.innerHTML = "";
        var status = el("p", "tdah-status");
        status.setAttribute("role", "status");
        var grid = el("div", "tdah-grid");
        grid.style.setProperty("--cols", p.cols);
        host.appendChild(status);
        host.appendChild(grid);

        var found = 0, errors = 0, finished = false, remaining = limit;

        function refresh() {
          status.textContent = "Encontradas: " + found + " de " + p.targets +
            (limit ? "  ·  Tiempo: " + remaining + " s" : "");
        }

        cells.forEach(function (icon, i) {
          var b = el("button", "tdah-cell");
          b.type = "button";
          b.textContent = icon;
          b.setAttribute("aria-label", "Casilla " + (i + 1) + ": " + NOMBRES[icon]);
          b.addEventListener("click", function () {
            if (finished || b.disabled) return;
            b.disabled = true;
            if (icon === target) {
              found++;
              b.classList.add("is-found");
              refresh();
              if (found === p.targets) end(false);
            } else {
              errors++;
              b.classList.add("is-miss");
              if (errors === 3) api.hint();
            }
          });
          grid.appendChild(b);
        });

        function end(timeout) {
          if (finished) return;
          finished = true;
          Array.prototype.forEach.call(grid.querySelectorAll("button"), function (b) { b.disabled = true; });
          var stars = Math.max(0, found / p.targets - Math.min(0.3, errors * 0.1));
          api.done({
            stars: stars,
            message: timeout
              ? "Se acabó el tiempo. Encontraste " + found + " de " + p.targets + "."
              : "¡Encontraste todas!",
            error: (errors || found < p.targets) ? {
              found: found, targets: p.targets, wrong: errors,
              timeout: !!timeout, attempts: errors + 1
            } : null
          });
        }

        refresh();
        if (limit) {
          s.every(function () {
            remaining--;
            if (remaining <= 0) { remaining = 0; refresh(); end(true); }
            else refresh();
          }, 1000);
        }

        return function () { s.stop(); };
      }
    };
  }

  // ─── Mecánica 4: cambio de regla (flexibilidad cognitiva) ─────────────────

  function roundRegla(p, ctx) {
    var trials = [];
    for (var i = 0; i < p.trials; i++) {
      var rule = (Math.floor(i / p.switchEvery) % 2 === 0) ? "tam" : "forma";
      var prevRule = i > 0 ? ((Math.floor((i - 1) / p.switchEvery) % 2 === 0) ? "tam" : "forma") : rule;
      trials.push({
        rule: rule,
        big: Math.random() < 0.5,
        circle: Math.random() < 0.5,
        changed: i > 0 && prevRule !== rule
      });
    }
    var prompt = "Sigue la regla que aparece arriba: TAMAÑO o FORMA. La regla cambia de vez en cuando, y yo te aviso.";

    return {
      skill: "flexibilidad_cambio_regla",
      prompt: prompt,
      speech: prompt,
      hint: "Antes de responder, lee la regla que aparece arriba.",
      mount: function (host, api) {
        var s = scheduler();
        host.innerHTML = "";
        var live = liveRegion();
        var ruleBox = el("div", "tdah-rule");
        ruleBox.setAttribute("aria-hidden", "true");
        var stim = el("div", "tdah-stim");
        stim.setAttribute("aria-hidden", "true");
        var row = el("div", "tdah-actions");
        var bA = el("button", "game-option");
        var bB = el("button", "game-option");
        bA.type = "button"; bB.type = "button";
        row.appendChild(bA); row.appendChild(bB);
        host.appendChild(live);
        host.appendChild(ruleBox);
        host.appendChild(stim);
        host.appendChild(row);

        var idx = 0, correct = 0, errors = 0, switchErrors = 0, locked = false;
        var current = null;

        function setButton(btn, label, value) {
          btn.textContent = label;
          btn.dataset.value = value;
          btn.setAttribute("aria-label", label);
          btn.className = "game-option";
          btn.disabled = false;
        }

        function render() {
          current = trials[idx];
          var esTam = current.rule === "tam";
          ruleBox.textContent = "Regla: " + (esTam ? "TAMAÑO (¿grande o pequeño?)" : "FORMA (¿círculo o cuadrado?)");
          stim.textContent = current.circle ? "🔵" : "🟦";
          stim.style.fontSize = current.big ? "5rem" : "2rem";
          if (esTam) {
            setButton(bA, "Grande", "big");
            setButton(bB, "Pequeño", "small");
          } else {
            setButton(bA, "Círculo", "circle");
            setButton(bB, "Cuadrado", "square");
          }
          live.textContent = (current.changed ? "La regla cambió. " : "") +
            "Regla: " + (esTam ? "tamaño" : "forma") + ". Figura " +
            (current.big ? "grande" : "pequeña") + ", " + (current.circle ? "círculo" : "cuadrado") + ".";
          if (current.changed) api.say("La regla cambió. Ahora mira " + (esTam ? "el tamaño." : "la forma."));
          locked = false;
        }

        function answer(btn) {
          if (locked) return;
          locked = true;
          var expected = current.rule === "tam"
            ? (current.big ? "big" : "small")
            : (current.circle ? "circle" : "square");
          var ok = btn.dataset.value === expected;
          if (ok) {
            correct++;
            btn.classList.add("is-correct");
          } else {
            errors++;
            if (current.changed) switchErrors++;
            btn.classList.add("is-wrong");
            [bA, bB].forEach(function (b) {
              if (b.dataset.value === expected) b.classList.add("is-correct");
            });
            api.feedback("Recuerda mirar la regla de arriba.", "retry");
          }
          s.later(advance, ok ? 700 : 1400);
        }

        function advance() {
          api.feedback("", "");
          idx++;
          if (idx >= trials.length) end(); else render();
        }

        function end() {
          api.done({
            stars: correct / trials.length,
            message: "Terminaste: " + correct + " de " + trials.length + " bien.",
            error: errors ? {
              wrong: errors,
              switch_errors: switchErrors,  // errores justo después de cambiar la regla
              attempts: errors + 1
            } : null
          });
        }

        bA.addEventListener("click", function () { answer(bA); });
        bB.addEventListener("click", function () { answer(bB); });

        render();
        return function () { s.stop(); };
      }
    };
  }

  // ─── Mecánica 5 (nueva): flechas / flanker (atención selectiva) ───────────

  function roundFlechas(p, ctx) {
    var mult = timeMult(ctx);
    var trials = [];
    for (var i = 0; i < p.trials; i++) {
      var congruent = Math.random() < 0.5;
      var dir = Math.random() < 0.5 ? "left" : "right";
      var flanker = congruent ? dir : (dir === "left" ? "right" : "left");
      trials.push({ dir: dir, flanker: flanker, congruent: congruent });
    }
    var prompt = "Aparece una fila de flechas. Toca hacia dónde apunta la flecha del CENTRO, sin dejarte confundir por las de los lados.";

    return {
      skill: "flechas_flanker",
      prompt: prompt,
      speech: prompt,
      hint: "Fíjate solo en la flecha de en medio: es la más grande y de otro color.",
      mount: function (host, api) {
        var s = scheduler();
        host.innerHTML = "";
        var live = liveRegion();
        var row = el("div", "tdah-flanker");
        row.setAttribute("aria-hidden", "true");
        var actions = el("div", "tdah-actions");
        var bL = el("button", "game-option");
        var bR = el("button", "game-option");
        bL.type = "button"; bR.type = "button";
        bL.textContent = "⬅️ Izquierda"; bL.dataset.value = "left";
        bR.textContent = "Derecha ➡️"; bR.dataset.value = "right";
        actions.appendChild(bL); actions.appendChild(bR);
        host.appendChild(live);
        host.appendChild(row);
        host.appendChild(actions);

        var idx = 0, correct = 0, errors = 0, locked = true, current = null;

        function arrowIcon(dir) { return dir === "left" ? "⬅️" : "➡️"; }

        function render() {
          current = trials[idx];
          row.innerHTML = "";
          for (var k = 0; k < 5; k++) {
            var span = el("span");
            var isCenter = k === 2;
            span.className = isCenter ? "is-center" : "";
            span.textContent = arrowIcon(isCenter ? current.dir : current.flanker);
            row.appendChild(span);
          }
          live.textContent = "Flecha central apunta hacia " + (current.dir === "left" ? "la izquierda" : "la derecha") + ".";
          locked = false;
        }

        function answer(btn) {
          if (locked) return;
          locked = true;
          var ok = btn.dataset.value === current.dir;
          if (ok) { correct++; btn.classList.add("is-correct"); }
          else {
            errors++; btn.classList.add("is-wrong");
            api.feedback("Mira solo la flecha central, más grande y de otro color.", "retry");
          }
          s.later(function () {
            bL.className = "game-option"; bR.className = "game-option";
            idx++;
            if (idx >= trials.length) end(); else render();
          }, ok ? 500 : 1100);
        }

        function end() {
          api.done({
            stars: correct / trials.length,
            message: "Terminaste: " + correct + " de " + trials.length + " bien.",
            error: errors ? { wrong: errors, attempts: errors + 1 } : null
          });
        }

        bL.addEventListener("click", function () { answer(bL); });
        bR.addEventListener("click", function () { answer(bR); });

        render();
        return function () { s.stop(); };
      }
    };
  }

  // ─── Mecánica 6 (nueva): eco / n-back (memoria de trabajo activa) ─────────

  function roundEco(p, ctx) {
    var mult = timeMult(ctx);
    var n = p.back; // 1 o 2 pasos atrás
    var letras = ["A", "E", "I", "O", "U", "M", "S", "T"];
    var seq = [];
    for (var i = 0; i < p.len; i++) {
      if (i >= n && Math.random() < p.matchRatio) seq.push(seq[i - n]);
      else seq.push(pick(letras));
    }
    var matches = seq.map(function (v, i) { return i >= n && v === seq[i - n]; });
    var prompt = "Van apareciendo letras. Toca «¡IGUAL!» cuando la letra actual sea igual a la que salió " +
      (n === 1 ? "justo antes." : "hace dos letras.");

    return {
      skill: "eco_nback_" + n,
      prompt: prompt,
      speech: prompt,
      hint: n === 1 ? "Compara la letra de ahora con la anterior." : "Compara la letra de ahora con la de hace dos turnos.",
      mount: function (host, api) {
        var s = scheduler();
        host.innerHTML = "";
        var live = liveRegion();
        var stim = el("div", "tdah-stim");
        stim.setAttribute("aria-hidden", "true");
        var history = el("p", "tdah-eco-history");
        history.setAttribute("aria-hidden", "true");
        var btn = el("button", "game-btn game-btn--primary tdah-tap");
        btn.type = "button";
        btn.textContent = "¡IGUAL!";
        btn.disabled = true;
        host.appendChild(live);
        host.appendChild(history);
        host.appendChild(stim);
        host.appendChild(btn);

        var idx = -1, hits = 0, misses = 0, falseAlarms = 0, correctRejections = 0, responded = false, seen = [];

        btn.addEventListener("click", function () {
          if (idx < 0 || responded || btn.disabled) return;
          responded = true;
          if (matches[idx]) { hits++; stim.classList.add("is-ok"); }
          else { falseAlarms++; stim.classList.add("is-bad"); }
        });

        function next() {
          idx++;
          if (idx >= seq.length) { finish(); return; }
          responded = false;
          stim.className = "tdah-stim";
          stim.textContent = seq[idx];
          live.textContent = "Letra " + seq[idx];
          api.say(seq[idx]);
          seen.push(seq[idx]);
          history.textContent = idx >= n ? "Letras recientes: " + seen.slice(-4).join(" - ") : "";
          btn.disabled = idx < n;
          s.later(function () {
            if (!responded && idx >= n) {
              if (matches[idx]) misses++; else correctRejections++;
            }
            btn.disabled = true;
            s.later(next, p.gapMs * mult);
          }, p.showMs * mult);
        }

        function finish() {
          btn.disabled = true;
          var total = seq.length - n;
          var ok = hits + correctRejections;
          api.done({
            stars: total > 0 ? ok / total : 1,
            message: "Bloque terminado: acertaste " + ok + " de " + total + ".",
            error: (misses || falseAlarms) ? {
              misses: misses, false_alarms: falseAlarms,
              hits: hits, attempts: 1
            } : null
          });
        }

        next();
        return function () { s.stop(); };
      }
    };
  }

  // ─── Mecánica 7 (nueva): agenda / planificador (organización del tiempo) ──

  function roundAgenda(p, ctx) {
    var tareas = shuffle(p.banco).slice(0, p.count);
    var orden = tareas.slice().sort(function (a, b) { return a.rank - b.rank; });
    var prompt = "Ordena estas tareas según cuál debes hacer primero. Tócalas en el orden correcto.";

    return {
      skill: "agenda_planificacion",
      prompt: prompt,
      speech: prompt,
      hint: "Fíjate en la hora o el día límite de cada tarea: lo más urgente va primero.",
      mount: function (host, api) {
        host.innerHTML = "";
        var live = liveRegion();
        var pool = el("ul", "tdah-agenda-list");
        pool.setAttribute("role", "group");
        pool.setAttribute("aria-label", "Tareas para ordenar");
        var slots = el("ol", "tdah-agenda-slots");
        for (var k = 0; k < orden.length; k++) slots.appendChild(el("li"));
        host.appendChild(live);
        host.appendChild(pool);
        host.appendChild(slots);

        var pos = 0, errors = 0, finished = false;

        tareas.forEach(function (t) {
          var li = el("li", "tdah-agenda-item");
          li.tabIndex = 0;
          li.setAttribute("role", "button");
          var label = el("span"); label.textContent = t.label;
          var when = el("span"); when.textContent = t.when; when.style.color = "var(--g-muted)"; when.style.fontSize = "0.85rem";
          li.appendChild(label); li.appendChild(when);
          function tap() {
            if (finished || li.classList.contains("is-placed")) return;
            if (t.rank === orden[pos].rank) {
              li.classList.add("is-placed");
              slots.children[pos].textContent = t.label + " — " + t.when;
              pos++;
              live.textContent = t.label + " ubicada.";
              if (pos === orden.length) end();
            } else {
              errors++;
              li.classList.add("is-wrong");
              api.feedback("Esa tarea no va ahí. Revisa cuál es más urgente.", "retry");
              setTimeout(function () { li.classList.remove("is-wrong"); }, 500);
              if (errors === 2) api.hint();
            }
          }
          li.addEventListener("click", tap);
          li.addEventListener("keydown", function (e) { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); tap(); } });
          pool.appendChild(li);
        });

        function end() {
          finished = true;
          var stars = errors === 0 ? 1 : (errors === 1 ? 0.75 : (errors === 2 ? 0.5 : 0.25));
          api.done({
            stars: stars,
            message: errors === 0 ? "¡Orden perfecto!" : "¡Agenda organizada!",
            error: errors ? { wrong: errors, attempts: errors + 1 } : null
          });
        }

        return function () { finished = true; };
      }
    };
  }

  // ─── Bancos de tareas para la Agenda (vida adulta, 15-26 años) ────────────

  var AGENDA_BASICO = [
    { label: "Entregar el informe", when: "Hoy, 2:00 p.m.", rank: 1 },
    { label: "Responder el correo del profesor", when: "Hoy, 5:00 p.m.", rank: 2 },
    { label: "Comprar materiales para el taller", when: "Mañana", rank: 3 },
    { label: "Pagar la matrícula", when: "En 3 días", rank: 4 }
  ];
  var AGENDA_MEDIO = [
    { label: "Confirmar la entrevista de trabajo", when: "Hoy, 9:00 a.m.", rank: 1 },
    { label: "Entregar el examen final", when: "Hoy, 4:00 p.m.", rank: 2 },
    { label: "Llamar al banco por la tarjeta", when: "Mañana, 10:00 a.m.", rank: 3 },
    { label: "Renovar el documento de identidad", when: "Esta semana", rank: 4 },
    { label: "Inscribirse al próximo semestre", when: "En 2 semanas", rank: 5 }
  ];
  var AGENDA_EXIGENTE = [
    { label: "Enviar la hoja de vida a la vacante", when: "Hoy, 11:00 a.m.", rank: 1 },
    { label: "Asistir a la reunión con el supervisor", when: "Hoy, 1:00 p.m.", rank: 2 },
    { label: "Pagar el recibo antes del corte", when: "Hoy, 6:00 p.m.", rank: 3 },
    { label: "Entregar el proyecto grupal", when: "Mañana, 8:00 a.m.", rank: 4 },
    { label: "Renovar el contrato de arriendo", when: "En 5 días", rank: 5 },
    { label: "Programar la cita médica", when: "El próximo mes", rank: 6 }
  ];

  // ─── Definición de los niveles (50: 5 Stages de 10 niveles) ────────────────

  var CONSTRUCTORES = {
    gonogo: roundGoNoGo,
    secuencia: roundSecuencia,
    busqueda: roundBusqueda,
    regla: roundRegla,
    flechas: roundFlechas,
    eco: roundEco,
    agenda: roundAgenda
  };

  var NIVELES = {
    // ══ Stage 1 · Base (1-10): sin cambios ═══════════════════════════════════
    1: {
      rounds: 3, mechanics: ["gonogo"],
      params: { gonogo: { count: 6, showMs: 2200, gapMs: 900, nogoRatio: 0.25 } },
      intro: "Stage 1 · Nivel 1 · Te doy la bienvenida a la Misión Ritmo y Enfoque. Soy NOVA. Hoy vigilamos el radar: toca cuando veas un satélite y deja pasar los meteoritos."
    },
    2: {
      rounds: 5, mechanics: ["secuencia"],
      params: { secuencia: { lenMin: 2, lenMax: 3, mode: "same", showMs: 1000, pad: "exact" } },
      intro: "Stage 1 · Nivel 2 · Llegan mensajes en clave. Mira los números que aparecen y repítelos en el mismo orden."
    },
    3: {
      rounds: 4, mechanics: ["busqueda"],
      params: { busqueda: { cells: 12, cols: 4, targets: 3, set: "easy", timeMs: 0 } },
      intro: "Stage 1 · Nivel 3 · Hay estrellas escondidas en el mapa de la estación. Sin prisa: encuéntralas todas."
    },
    4: {
      rounds: 3, mechanics: ["gonogo"],
      params: { gonogo: { count: 8, showMs: 1500, gapMs: 700, nogoRatio: 0.3 } },
      intro: "Stage 1 · Nivel 4 · El radar va un poco más rápido. Mira bien antes de tocar."
    },
    5: {
      rounds: 5, mechanics: ["secuencia"],
      params: { secuencia: { lenMin: 2, lenMax: 3, mode: "reverse", showMs: 1000, pad: "exact" } },
      intro: "Stage 1 · Nivel 5 · Ahora los mensajes llegan al revés: tócalos empezando por el último número que viste."
    },
    6: {
      rounds: 3, mechanics: ["regla"],
      params: { regla: { trials: 8, switchEvery: 4 } },
      intro: "Stage 1 · Nivel 6 · Las compuertas cambian de regla. Unas veces importa el tamaño y otras la forma. Yo te aviso cuando cambie."
    },
    7: {
      rounds: 4, mechanics: ["busqueda"],
      params: { busqueda: { cells: 20, cols: 5, targets: 4, set: "hard", timeMs: 40000 } },
      intro: "Stage 1 · Nivel 7 · El mapa se llenó de naves parecidas. Busca solo los cohetes y no te distraigas con lo demás."
    },
    8: {
      rounds: 5, mechanics: ["secuencia"],
      params: { secuencia: { lenMin: 3, lenMax: 4, mode: "asc", showMs: 900, pad: "full" } },
      intro: "Stage 1 · Nivel 8 · Los números llegan desordenados. Tócalos de menor a mayor."
    },
    9: {
      rounds: 3, mechanics: ["gonogo"],
      params: { gonogo: { count: 12, showMs: 1100, gapMs: 500, nogoRatio: 0.35, switchRule: true } },
      intro: "Stage 1 · Nivel 9 · Radar avanzado: a mitad del reto la regla se invierte. Presta atención al aviso."
    },
    10: {
      rounds: 8, mechanics: ["gonogo", "secuencia", "busqueda", "regla"],
      params: {
        gonogo: { count: 8, showMs: 1300, gapMs: 600, nogoRatio: 0.3 },
        secuencia: { lenMin: 3, lenMax: 4, mode: "reverse", showMs: 800, pad: "full" },
        busqueda: { cells: 20, cols: 5, targets: 4, set: "hard", timeMs: 35000 },
        regla: { trials: 8, switchEvery: 2 }
      },
      intro: "Stage 1 · Nivel 10 · Última misión de la base: aparece todo lo que practicaste. Tómate tu tiempo y confía en lo aprendido."
    },

    // ══ Stage 2 · Media (11-20): ritmo más ágil, mecánicas nuevas ═══════════
    11: { rounds: 10, mechanics: ["gonogo"],
          params: { gonogo: { count: 10, showMs: 1300, gapMs: 600, nogoRatio: 0.3 } },
          intro: "Stage 2 · Nivel 11 · El radar sube de ritmo: más meteoritos y menos tiempo para decidir." },
    12: { rounds: 10, mechanics: ["secuencia"],
          params: { secuencia: { lenMin: 3, lenMax: 5, mode: "same", showMs: 850, pad: "full" } },
          intro: "Stage 2 · Nivel 12 · Mensajes más largos, en el mismo orden." },
    13: { rounds: 10, mechanics: ["flechas"],
          params: { flechas: { trials: 10 } },
          intro: "Stage 2 · Nivel 13 · Mecánica nueva: sigue la flecha del centro sin dejarte confundir por las de los lados." },
    14: { rounds: 10, mechanics: ["busqueda"],
          params: { busqueda: { cells: 20, cols: 5, targets: 5, set: "oficina", timeMs: 0 } },
          intro: "Stage 2 · Nivel 14 · Encuentra los paquetes en el mapa de la oficina." },
    15: { rounds: 10, mechanics: ["regla"],
          params: { regla: { trials: 9, switchEvery: 3 } },
          intro: "Stage 2 · Nivel 15 · La regla cambia con más frecuencia." },
    16: { rounds: 10, mechanics: ["agenda"],
          params: { agenda: { banco: AGENDA_BASICO, count: 4 } },
          intro: "Stage 2 · Nivel 16 · Mecánica nueva: organiza tu día ordenando tareas según lo más urgente." },
    17: { rounds: 10, mechanics: ["secuencia"],
          params: { secuencia: { lenMin: 4, lenMax: 5, mode: "reverse", showMs: 800, pad: "full" } },
          intro: "Stage 2 · Nivel 17 · Mensajes más largos, al revés." },
    18: { rounds: 10, mechanics: ["eco"],
          params: { eco: { back: 1, len: 12, showMs: 1400, gapMs: 500, matchRatio: 0.4 } },
          intro: "Stage 2 · Nivel 18 · Mecánica nueva: toca «¡IGUAL!» cuando la letra se repita justo después de la anterior." },
    19: { rounds: 10, mechanics: ["gonogo"],
          params: { gonogo: { count: 14, showMs: 1000, gapMs: 450, nogoRatio: 0.35, switchRule: true } },
          intro: "Stage 2 · Nivel 19 · Radar con cambio de regla a mitad del bloque, más rápido." },
    20: { rounds: 10,
          mechanics: ["gonogo", "secuencia", "flechas", "busqueda", "regla", "agenda", "eco"],
          params: {
            gonogo: { count: 10, showMs: 1200, gapMs: 550, nogoRatio: 0.3 },
            secuencia: { lenMin: 3, lenMax: 4, mode: "same", showMs: 850, pad: "full" },
            flechas: { trials: 8 },
            busqueda: { cells: 20, cols: 5, targets: 4, set: "oficina", timeMs: 0 },
            regla: { trials: 8, switchEvery: 3 },
            agenda: { banco: AGENDA_BASICO, count: 4 },
            eco: { back: 1, len: 10, showMs: 1300, gapMs: 500, matchRatio: 0.4 }
          },
          intro: "Stage 2 · Nivel 20 · Reto integrador de la etapa Media: mezcla todo lo practicado." },

    // ══ Stage 3 · Alta (21-30): más velocidad, menos apoyo ══════════════════
    21: { rounds: 10, mechanics: ["gonogo"],
          params: { gonogo: { count: 14, showMs: 950, gapMs: 400, nogoRatio: 0.35 } },
          intro: "Stage 3 · Nivel 21 · Radar veloz: aparecen muchos más meteoritos." },
    22: { rounds: 10, mechanics: ["flechas"],
          params: { flechas: { trials: 12 } },
          intro: "Stage 3 · Nivel 22 · Flechas con más distractores." },
    23: { rounds: 10, mechanics: ["secuencia"],
          params: { secuencia: { lenMin: 4, lenMax: 6, mode: "asc", showMs: 750, pad: "full" } },
          intro: "Stage 3 · Nivel 23 · Ordena de menor a mayor con el teclado completo de números." },
    24: { rounds: 10, mechanics: ["agenda"],
          params: { agenda: { banco: AGENDA_MEDIO, count: 5 } },
          intro: "Stage 3 · Nivel 24 · Organiza cinco tareas de un día ocupado." },
    25: { rounds: 10, mechanics: ["busqueda"],
          params: { busqueda: { cells: 24, cols: 6, targets: 5, set: "hard", timeMs: 30000 } },
          intro: "Stage 3 · Nivel 25 · Mapa difícil, contra el tiempo." },
    26: { rounds: 10, mechanics: ["eco"],
          params: { eco: { back: 1, len: 14, showMs: 1200, gapMs: 450, matchRatio: 0.4 } },
          intro: "Stage 3 · Nivel 26 · Sigue practicando el eco de una letra atrás, más rápido." },
    27: { rounds: 10, mechanics: ["regla"],
          params: { regla: { trials: 10, switchEvery: 2 } },
          intro: "Stage 3 · Nivel 27 · La regla cambia casi en cada figura." },
    28: { rounds: 10, mechanics: ["secuencia"],
          params: { secuencia: { lenMin: 5, lenMax: 6, mode: "reverse", showMs: 700, pad: "full" } },
          intro: "Stage 3 · Nivel 28 · Mensajes largos, al revés." },
    29: { rounds: 10, mechanics: ["gonogo", "flechas"],
          params: { gonogo: { count: 8, showMs: 1000, gapMs: 450, nogoRatio: 0.3 }, flechas: { trials: 8 } },
          intro: "Stage 3 · Nivel 29 · Radar y flechas alternados: cambia de tarea sin perder el ritmo." },
    30: { rounds: 10,
          mechanics: ["gonogo", "flechas", "secuencia", "agenda", "busqueda", "eco", "regla"],
          params: {
            gonogo: { count: 10, showMs: 1000, gapMs: 450, nogoRatio: 0.32 },
            flechas: { trials: 10 },
            secuencia: { lenMin: 4, lenMax: 5, mode: "asc", showMs: 800, pad: "full" },
            agenda: { banco: AGENDA_MEDIO, count: 5 },
            busqueda: { cells: 24, cols: 6, targets: 5, set: "hard", timeMs: 30000 },
            eco: { back: 1, len: 12, showMs: 1200, gapMs: 450, matchRatio: 0.4 },
            regla: { trials: 9, switchEvery: 2 }
          },
          intro: "Stage 3 · Nivel 30 · Reto integrador de la etapa Alta: mezcla todo lo practicado." },

    // ══ Stage 4 · Muy Alta (31-40): doble exigencia ══════════════════════════
    31: { rounds: 10, mechanics: ["eco"],
          params: { eco: { back: 2, len: 14, showMs: 1300, gapMs: 500, matchRatio: 0.35 } },
          intro: "Stage 4 · Nivel 31 · Eco de dos pasos atrás: compara con la letra de hace dos turnos." },
    32: { rounds: 10, mechanics: ["agenda"],
          params: { agenda: { banco: AGENDA_EXIGENTE, count: 6 } },
          intro: "Stage 4 · Nivel 32 · Agenda con seis tareas y horas más exigentes." },
    33: { rounds: 10, mechanics: ["gonogo"],
          params: { gonogo: { count: 16, showMs: 900, gapMs: 380, nogoRatio: 0.35, switchRule: true } },
          intro: "Stage 4 · Nivel 33 · Radar con cambio de regla, en un bloque largo." },
    34: { rounds: 10, mechanics: ["secuencia"],
          params: { secuencia: { lenMin: 5, lenMax: 7, mode: "same", showMs: 700, pad: "full" } },
          intro: "Stage 4 · Nivel 34 · Mensajes muy largos, en el mismo orden." },
    35: { rounds: 10, mechanics: ["flechas"],
          params: { flechas: { trials: 14 } },
          intro: "Stage 4 · Nivel 35 · Flechas a contrarreloj: responde rápido sin perder precisión." },
    36: { rounds: 10, mechanics: ["busqueda"],
          params: { busqueda: { cells: 24, cols: 6, targets: 5, set: "oficina", timeMs: 25000 } },
          intro: "Stage 4 · Nivel 36 · Mapa grande, cinco objetivos y poco tiempo." },
    37: { rounds: 10, mechanics: ["regla"],
          params: { regla: { trials: 10, switchEvery: 1 } },
          intro: "Stage 4 · Nivel 37 · La regla cambia en cada figura." },
    38: { rounds: 10, mechanics: ["agenda", "secuencia"],
          params: { agenda: { banco: AGENDA_MEDIO, count: 5 }, secuencia: { lenMin: 4, lenMax: 5, mode: "reverse", showMs: 750, pad: "full" } },
          intro: "Stage 4 · Nivel 38 · Organiza tareas y recuerda mensajes al revés, alternando." },
    39: { rounds: 10, mechanics: ["eco", "gonogo"],
          params: { eco: { back: 1, len: 12, showMs: 1100, gapMs: 450, matchRatio: 0.4 }, gonogo: { count: 10, showMs: 950, gapMs: 400, nogoRatio: 0.3 } },
          intro: "Stage 4 · Nivel 39 · Memoria y control inhibitorio, uno tras otro." },
    40: { rounds: 10,
          mechanics: ["eco", "agenda", "gonogo", "secuencia", "flechas", "busqueda", "regla"],
          params: {
            eco: { back: 1, len: 12, showMs: 1100, gapMs: 450, matchRatio: 0.4 },
            agenda: { banco: AGENDA_EXIGENTE, count: 6 },
            gonogo: { count: 12, showMs: 900, gapMs: 400, nogoRatio: 0.32 },
            secuencia: { lenMin: 4, lenMax: 6, mode: "asc", showMs: 750, pad: "full" },
            flechas: { trials: 10 },
            busqueda: { cells: 24, cols: 6, targets: 5, set: "oficina", timeMs: 25000 },
            regla: { trials: 9, switchEvery: 2 }
          },
          intro: "Stage 4 · Nivel 40 · Reto integrador de la etapa Muy Alta: mezcla todo lo practicado." },

    // ══ Stage 5 · Súper Difícil (41-50): integración total, ritmo máximo ════
    41: { rounds: 10, mechanics: ["gonogo", "regla"],
          params: { gonogo: { count: 12, showMs: 850, gapMs: 350, nogoRatio: 0.35, switchRule: true }, regla: { trials: 9, switchEvery: 2 } },
          intro: "Stage 5 · Nivel 41 · Inhibición y flexibilidad, sin descanso entre una y otra." },
    42: { rounds: 10, mechanics: ["flechas", "busqueda"],
          params: { flechas: { trials: 12 }, busqueda: { cells: 24, cols: 6, targets: 5, set: "hard", timeMs: 25000 } },
          intro: "Stage 5 · Nivel 42 · Atención selectiva doble: flechas y mapa alternados." },
    43: { rounds: 10, mechanics: ["eco", "secuencia"],
          params: { eco: { back: 2, len: 14, showMs: 1100, gapMs: 400, matchRatio: 0.35 }, secuencia: { lenMin: 5, lenMax: 7, mode: "reverse", showMs: 650, pad: "full" } },
          intro: "Stage 5 · Nivel 43 · Memoria de trabajo exigente: eco de dos atrás y mensajes largos al revés." },
    44: { rounds: 10, mechanics: ["agenda", "regla"],
          params: { agenda: { banco: AGENDA_EXIGENTE, count: 6 }, regla: { trials: 10, switchEvery: 1 } },
          intro: "Stage 5 · Nivel 44 · Planificar y cambiar de regla, uno tras otro." },
    45: { rounds: 10, mechanics: ["gonogo", "flechas", "eco"],
          params: {
            gonogo: { count: 10, showMs: 850, gapMs: 350, nogoRatio: 0.32 },
            flechas: { trials: 10 },
            eco: { back: 1, len: 12, showMs: 1050, gapMs: 400, matchRatio: 0.4 }
          },
          intro: "Stage 5 · Nivel 45 · Tres funciones ejecutivas a la vez." },
    46: { rounds: 10, mechanics: ["busqueda", "secuencia", "agenda"],
          params: {
            busqueda: { cells: 24, cols: 6, targets: 5, set: "oficina", timeMs: 22000 },
            secuencia: { lenMin: 4, lenMax: 6, mode: "asc", showMs: 700, pad: "full" },
            agenda: { banco: AGENDA_MEDIO, count: 5 }
          },
          intro: "Stage 5 · Nivel 46 · Buscar, recordar y planificar en el mismo bloque." },
    47: { rounds: 10, mechanics: ["regla", "eco", "flechas"],
          params: {
            regla: { trials: 9, switchEvery: 2 },
            eco: { back: 1, len: 12, showMs: 1050, gapMs: 400, matchRatio: 0.4 },
            flechas: { trials: 10 }
          },
          intro: "Stage 5 · Nivel 47 · Cambio de regla, memoria y atención selectiva combinadas." },
    48: { rounds: 10, mechanics: ["gonogo", "busqueda", "agenda", "secuencia"],
          params: {
            gonogo: { count: 10, showMs: 850, gapMs: 350, nogoRatio: 0.32 },
            busqueda: { cells: 20, cols: 5, targets: 4, set: "hard", timeMs: 22000 },
            agenda: { banco: AGENDA_MEDIO, count: 5 },
            secuencia: { lenMin: 4, lenMax: 6, mode: "reverse", showMs: 700, pad: "full" }
          },
          intro: "Stage 5 · Nivel 48 · Cuatro mecánicas alternadas, sin previo aviso." },
    49: { rounds: 10,
          mechanics: ["gonogo", "flechas", "eco", "regla", "busqueda", "agenda"],
          params: {
            gonogo: { count: 10, showMs: 850, gapMs: 350, nogoRatio: 0.32, switchRule: true },
            flechas: { trials: 10 },
            eco: { back: 2, len: 12, showMs: 1050, gapMs: 400, matchRatio: 0.35 },
            regla: { trials: 9, switchEvery: 1 },
            busqueda: { cells: 24, cols: 6, targets: 5, set: "oficina", timeMs: 22000 },
            agenda: { banco: AGENDA_EXIGENTE, count: 6 }
          },
          intro: "Stage 5 · Nivel 49 · Mezcla exigente de seis mecánicas. Falta solo el reto final." },
    50: { rounds: 10,
          mechanics: ["gonogo", "secuencia", "flechas", "busqueda", "regla", "eco", "agenda"],
          params: {
            gonogo: { count: 12, showMs: 800, gapMs: 350, nogoRatio: 0.33, switchRule: true },
            secuencia: { lenMin: 5, lenMax: 7, mode: "reverse", showMs: 650, pad: "full" },
            flechas: { trials: 12 },
            busqueda: { cells: 24, cols: 6, targets: 5, set: "hard", timeMs: 22000 },
            regla: { trials: 10, switchEvery: 1 },
            eco: { back: 2, len: 14, showMs: 1000, gapMs: 380, matchRatio: 0.35 },
            agenda: { banco: AGENDA_EXIGENTE, count: 6 }
          },
          intro: "Stage 5 · Nivel 50 · Reto final de la Misión Ritmo y Enfoque: las siete mecánicas, al ritmo más alto. ¡Tú puedes!" }
  };

  global.IndecapGame.register({
    slug: "tdah_ritmo",

    getLevel: function (level) {
      var base = NIVELES[level] || NIVELES[1];
      // Se copia la configuración para que un nivel nunca mute a otro.
      return {
        rounds: base.rounds,
        mechanics: base.mechanics.slice(),
        params: base.params,
        intro: base.intro
      };
    },

    buildRound: function (cfg, index, ctx) {
      var mecanica = cfg.mechanics[index % cfg.mechanics.length];
      return CONSTRUCTORES[mecanica](cfg.params[mecanica], ctx || { support: 1 });
    }
  });
})(window);
