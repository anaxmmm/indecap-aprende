/**
 * MISIÓN RITMO Y ENFOQUE — TDAH
 *
 * Habilidad central: funciones ejecutivas.
 *  - Control inhibitorio: tocar solo cuando corresponde (radar).
 *  - Memoria de trabajo: repetir y transformar secuencias (mensajes en clave, eco).
 *  - Atención selectiva: búsqueda en el mapa y flechas con distractores.
 *  - Flexibilidad: cambio de regla.
 *  - Planificación y autorregulación: agenda, dividir tareas, estimar tiempos.
 *
 * 5 niveles × 10 actividades. Las actividades de reacción se juegan en 3
 * bloques cortos y las de planificación en 5 retos; dentro de cada actividad
 * el ritmo y la exigencia suben reto a reto.
 *
 * Apoyos según el nivel de autonomía del perfil (ajuste pedagógico, no
 * diagnóstico): guiado = más tiempo; independiente = tiempo base. Es un apoyo
 * pedagógico, no un tratamiento clínico del TDAH.
 */
(function (global) {
  "use strict";
  var _t = global.IndecapGame.tr;

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
      ? _t("Al empezar, toca solo cuando aparezca un satélite 🛰️. A mitad del reto la regla cambia, y yo te aviso.")
      : _t("Toca el botón SOLO cuando aparezca un satélite 🛰️. Si aparece un meteorito ☄️, no toques.");

    return {
      skill: "go_no_go",
      prompt: prompt,
      speech: prompt,
      hint: _t("Espera a ver qué aparece antes de tocar. Si dudas, mejor no toques."),
      mount: function (host, api) {
        var SAT = { icon: "🛰️", name: _t("satélite") };
        var MET = { icon: "☄️", name: _t("meteorito") };
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
        btn.textContent = _t("Estoy listo");
        host.appendChild(live);
        host.appendChild(stim);
        host.appendChild(btn);

        var started = false, idx = 0, cur = null, announced = false;
        var hits = 0, rejections = 0, omissions = 0, commissions = 0;

        btn.addEventListener("click", function () {
          if (!started) {
            started = true;
            btn.textContent = _t("¡TOCAR!");
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
            var msg = _t("¡Cambio de regla! Ahora toca solo con el meteorito ☄️. Con el satélite, no toques.");
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
            message: _t("Bloque terminado: acertaste ") + ok + _t(" de ") + total + ".",
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
      ? _t("Mira los números. Luego tócalos AL REVÉS: empieza por el último que viste.")
      : (p.mode === "asc"
        ? _t("Mira los números. Luego tócalos de MENOR a MAYOR.")
        : _t("Mira los números. Luego tócalos en el MISMO orden en que aparecieron."));

    return {
      skill: "memoria_secuencia_" + p.mode,
      prompt: prompt,
      speech: prompt,
      hint: p.mode === "reverse"
        ? _t("Piensa en el último número primero, y sigue hacia atrás.")
        : (p.mode === "asc" ? _t("Busca el número más chico y ve subiendo.") : _t("Repite en tu cabeza la secuencia mientras la ves.")),
      mount: function (host, api) {
        var s = scheduler();
        host.innerHTML = "";
        var live = liveRegion();
        var stim = el("div", "tdah-stim");
        stim.setAttribute("aria-hidden", "true");
        var pad = el("div", "tdah-pad");
        pad.setAttribute("role", "group");
        pad.setAttribute("aria-label", _t("Números para tocar"));
        var actions = el("div", "tdah-actions");
        var playBtn = el("button", "game-btn game-btn--primary");
        playBtn.type = "button";
        playBtn.textContent = _t("Ver la secuencia");
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
          againBtn.textContent = _t("Ver otra vez (") + left + ")";
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
            b.setAttribute("aria-label", _t("Número ") + d);
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
              live.textContent = _t("Ahora te toca a ti.");
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
            api.feedback(_t("Ese no es el que sigue. Piénsalo con calma."), "retry");
            setTimeout(function () { b.classList.remove("is-wrong"); }, 500);
            if (errors === 2) api.hint();
          }
        }

        function end() {
          finished = true;
          var stars = errors === 0 ? 1 : (errors === 1 ? 0.75 : (errors === 2 ? 0.5 : 0.25));
          api.done({
            stars: stars,
            message: errors === 0 ? _t("¡Secuencia perfecta!") : _t("¡Secuencia completada!"),
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
    "⭐": _t("estrella"), "🌙": _t("luna"), "☀️": _t("sol"), "🪐": _t("planeta"),
    "🚀": _t("cohete"), "🛸": _t("platillo volador"), "🛰️": _t("satélite"), "✈️": _t("avión"),
    "📦": _t("paquete"), "📄": _t("documento"), "📌": _t("chincheta"), "🔖": _t("marcador")
  };
  var PLURALES = { "⭐": _t("estrellas"), "🚀": _t("cohetes"), "📦": _t("paquetes") };

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

    var prompt = _t("Encuentra ") + p.targets + " " + PLURALES[target] + " " + target +
      _t(" en el mapa. Toca solo las ") + PLURALES[target] + ".";

    return {
      skill: "busqueda_selectiva",
      prompt: prompt,
      speech: _t("Encuentra ") + p.targets + " " + PLURALES[target] + _t(" en el mapa. Toca solo las ") + PLURALES[target] + ".",
      hint: _t("Recorre el mapa en orden, fila por fila, sin saltar de un lado a otro."),
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
          status.textContent = _t("Encontradas: ") + found + _t(" de ") + p.targets +
            (limit ? _t("  ·  Tiempo: ") + remaining + " s" : "");
        }

        cells.forEach(function (icon, i) {
          var b = el("button", "tdah-cell");
          b.type = "button";
          b.textContent = icon;
          b.setAttribute("aria-label", _t("Casilla ") + (i + 1) + ": " + NOMBRES[icon]);
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
              ? _t("Se acabó el tiempo. Encontraste ") + found + _t(" de ") + p.targets + "."
              : _t("¡Encontraste todas!"),
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
      var rule = (Math.floor(i / p.switchEvery) % 2 === 0) ? "tam" : _t("forma");
      var prevRule = i > 0 ? ((Math.floor((i - 1) / p.switchEvery) % 2 === 0) ? "tam" : _t("forma")) : rule;
      trials.push({
        rule: rule,
        big: Math.random() < 0.5,
        circle: Math.random() < 0.5,
        changed: i > 0 && prevRule !== rule
      });
    }
    var prompt = _t("Sigue la regla que aparece arriba: TAMAÑO o FORMA. La regla cambia de vez en cuando, y yo te aviso.");

    return {
      skill: "flexibilidad_cambio_regla",
      prompt: prompt,
      speech: prompt,
      hint: _t("Antes de responder, lee la regla que aparece arriba."),
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
          ruleBox.textContent = _t("Regla: ") + (esTam ? _t("TAMAÑO (¿grande o pequeño?)") : _t("FORMA (¿círculo o cuadrado?)"));
          stim.textContent = current.circle ? "🔵" : "🟦";
          stim.style.fontSize = current.big ? "5rem" : "2rem";
          if (esTam) {
            setButton(bA, _t("Grande"), "big");
            setButton(bB, _t("Pequeño"), "small");
          } else {
            setButton(bA, _t("Círculo"), "circle");
            setButton(bB, _t("Cuadrado"), "square");
          }
          live.textContent = (current.changed ? _t("La regla cambió. ") : "") +
            _t("Regla: ") + (esTam ? _t("tamaño") : _t("forma")) + _t(". Figura ") +
            (current.big ? _t("grande") : _t("pequeña")) + ", " + (current.circle ? _t("círculo") : _t("cuadrado")) + ".";
          if (current.changed) api.say(_t("La regla cambió. Ahora mira ") + (esTam ? _t("el tamaño.") : _t("la forma.")));
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
            api.feedback(_t("Recuerda mirar la regla de arriba."), "retry");
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
            message: _t("Terminaste: ") + correct + _t(" de ") + trials.length + _t(" bien."),
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
    var prompt = _t("Aparece una fila de flechas. Toca hacia dónde apunta la flecha del CENTRO, sin dejarte confundir por las de los lados.");

    return {
      skill: "flechas_flanker",
      prompt: prompt,
      speech: prompt,
      hint: _t("Fíjate solo en la flecha de en medio: es la más grande y de otro color."),
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
        bL.textContent = _t("⬅️ Izquierda"); bL.dataset.value = "left";
        bR.textContent = _t("Derecha ➡️"); bR.dataset.value = "right";
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
          live.textContent = _t("Flecha central apunta hacia ") + (current.dir === "left" ? _t("la izquierda") : _t("la derecha")) + ".";
          locked = false;
        }

        function answer(btn) {
          if (locked) return;
          locked = true;
          var ok = btn.dataset.value === current.dir;
          if (ok) { correct++; btn.classList.add("is-correct"); }
          else {
            errors++; btn.classList.add("is-wrong");
            api.feedback(_t("Mira solo la flecha central, más grande y de otro color."), "retry");
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
            message: _t("Terminaste: ") + correct + _t(" de ") + trials.length + _t(" bien."),
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
    var prompt = _t("Van apareciendo letras. Toca «¡IGUAL!» cuando la letra actual sea igual a la que salió ") +
      (n === 1 ? _t("justo antes.") : _t("hace dos letras."));

    return {
      skill: "eco_nback_" + n,
      prompt: prompt,
      speech: prompt,
      hint: n === 1 ? _t("Compara la letra de ahora con la anterior.") : _t("Compara la letra de ahora con la de hace dos turnos."),
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
        btn.textContent = _t("¡IGUAL!");
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
          live.textContent = _t("Letra ") + seq[idx];
          api.say(seq[idx]);
          seen.push(seq[idx]);
          history.textContent = idx >= n ? _t("Letras recientes: ") + seen.slice(-4).join(" - ") : "";
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
            message: _t("Bloque terminado: acertaste ") + ok + _t(" de ") + total + ".",
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
    var prompt = _t("Ordena estas tareas según cuál debes hacer primero. Tócalas en el orden correcto.");

    return {
      skill: "agenda_planificacion",
      prompt: prompt,
      speech: prompt,
      hint: _t("Fíjate en la hora o el día límite de cada tarea: lo más urgente va primero."),
      mount: function (host, api) {
        host.innerHTML = "";
        var live = liveRegion();
        var pool = el("ul", "tdah-agenda-list");
        pool.setAttribute("role", "group");
        pool.setAttribute("aria-label", _t("Tareas para ordenar"));
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
              live.textContent = t.label + _t(" ubicada.");
              if (pos === orden.length) end();
            } else {
              errors++;
              li.classList.add("is-wrong");
              api.feedback(_t("Esa tarea no va ahí. Revisa cuál es más urgente."), "retry");
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
            message: errors === 0 ? _t("¡Orden perfecto!") : _t("¡Agenda organizada!"),
            error: errors ? { wrong: errors, attempts: errors + 1 } : null
          });
        }

        return function () { finished = true; };
      }
    };
  }

  // ─── Bancos de tareas para la Agenda (vida adulta, 15-26 años) ────────────

  var AGENDA_BASICO = [
    { label: _t("Entregar el informe"), when: _t("Hoy, 2:00 p.m."), rank: 1 },
    { label: _t("Responder el correo del profesor"), when: _t("Hoy, 5:00 p.m."), rank: 2 },
    { label: _t("Comprar materiales para el taller"), when: _t("Mañana"), rank: 3 },
    { label: _t("Pagar la matrícula"), when: _t("En 3 días"), rank: 4 }
  ];
  var AGENDA_MEDIO = [
    { label: _t("Confirmar la entrevista de trabajo"), when: _t("Hoy, 9:00 a.m."), rank: 1 },
    { label: _t("Entregar el examen final"), when: _t("Hoy, 4:00 p.m."), rank: 2 },
    { label: _t("Llamar al banco por la tarjeta"), when: _t("Mañana, 10:00 a.m."), rank: 3 },
    { label: _t("Renovar el documento de identidad"), when: _t("Esta semana"), rank: 4 },
    { label: _t("Inscribirse al próximo semestre"), when: _t("En 2 semanas"), rank: 5 }
  ];
  var AGENDA_EXIGENTE = [
    { label: _t("Enviar la hoja de vida a la vacante"), when: _t("Hoy, 11:00 a.m."), rank: 1 },
    { label: _t("Asistir a la reunión con el supervisor"), when: _t("Hoy, 1:00 p.m."), rank: 2 },
    { label: _t("Pagar el recibo antes del corte"), when: _t("Hoy, 6:00 p.m."), rank: 3 },
    { label: _t("Entregar el proyecto grupal"), when: _t("Mañana, 8:00 a.m."), rank: 4 },
    { label: _t("Renovar el contrato de arriendo"), when: _t("En 5 días"), rank: 5 },
    { label: _t("Programar la cita médica"), when: _t("El próximo mes"), rank: 6 }
  ];

  var CONSTRUCTORES = {
    gonogo: roundGoNoGo,
    secuencia: roundSecuencia,
    busqueda: roundBusqueda,
    regla: roundRegla,
    flechas: roundFlechas,
    eco: roundEco,
    agenda: roundAgenda
  };

  var U = global.IndecapGame.util;
  var grow = U.grow;

  // ─── Actividades de planificación y autorregulación ───────────────────────
  var TAREAS_GRANDES = [
    { t: _t("preparar una exposición"), s: [_t("Elegir el tema"), _t("Buscar información"), _t("Hacer las diapositivas"), _t("Ensayar en voz alta"), _t("Presentar")] },
    { t: _t("limpiar el cuarto"), s: [_t("Recoger la ropa"), _t("Ordenar el escritorio"), _t("Barrer"), _t("Sacar la basura")] },
    { t: _t("estudiar para un examen"), s: [_t("Revisar qué temas entran"), _t("Hacer un resumen"), _t("Resolver ejercicios"), _t("Repasar lo que costó")] },
    { t: _t("buscar trabajo"), s: [_t("Actualizar la hoja de vida"), _t("Buscar ofertas"), _t("Enviar la hoja de vida"), _t("Prepararse para la entrevista"), _t("Ir a la entrevista")] },
    { t: _t("hacer un trabajo en grupo"), s: [_t("Repartir las partes"), _t("Fijar una fecha de entrega"), _t("Hacer mi parte"), _t("Unir las partes"), _t("Revisar antes de entregar")] },
    { t: _t("organizar la semana"), s: [_t("Anotar las fechas importantes"), _t("Ver cuánto tiempo tengo libre"), _t("Poner primero lo urgente"), _t("Dejar espacios de descanso"), _t("Revisar el plan cada noche")] }
  ];
  var TIEMPOS = [
    [_t("Bañarse y vestirse"), _t("20 minutos"), [_t("2 minutos"), _t("3 horas")]],
    [_t("Ir en bus a un lugar a 5 km"), _t("25 minutos"), [_t("2 minutos"), _t("4 horas")]],
    [_t("Leer un capítulo corto"), _t("15 minutos"), [_t("1 minuto"), _t("5 horas")]],
    [_t("Hacer una tarea de 10 ejercicios"), _t("40 minutos"), [_t("3 minutos"), _t("6 horas")]],
    [_t("Preparar el almuerzo"), _t("45 minutos"), [_t("5 minutos"), _t("1 día")]],
    [_t("Responder un mensaje"), _t("2 minutos"), [_t("1 hora"), _t("1 día")]],
    [_t("Hacer el mercado de la semana"), _t("1 hora"), [_t("5 minutos"), _t("1 semana")]],
    [_t("Preparar una exposición"), _t("3 horas"), [_t("10 minutos"), _t("3 semanas")]]
  ];
  var CONCENTRACION = {
    ayuda: { label: _t("Me ayuda a concentrarme"), items: [_t("Celular en silencio y lejos"), _t("Escritorio despejado"), _t("Pausas cortas cada 25 minutos"), _t("Lista de tareas a la vista"), _t("Audífonos sin música con letra"), _t("Tomar agua"), _t("Una meta pequeña a la vez")] },
    distrae: { label: _t("Me distrae"), items: [_t("Notificaciones encendidas"), _t("Televisión prendida"), _t("Varias pestañas abiertas"), _t("Estudiar en la cama"), _t("Revisar redes «solo un momento»"), _t("Hacer tres tareas a la vez"), _t("Ruido de conversaciones")] }
  };
  var URGENCIA = {
    hoy: { label: _t("Lo hago hoy"), items: [_t("Entregar el trabajo que vence hoy"), _t("Pagar el recibo que vence hoy"), _t("Llamar para confirmar la entrevista de mañana"), _t("Comprar el pasaje para mañana temprano")] },
    luego: { label: _t("Lo agendo para después"), items: [_t("Ordenar el clóset"), _t("Ver una serie nueva"), _t("Cambiar el fondo del celular"), _t("Inscribirme a un curso del próximo mes")] }
  };

  function txtOpts(ok, bads) {
    return U.shuffle([ok].concat(bads)).map(function (t) { return { label: t, value: t, aria: t }; });
  }

  function dividirTarea(p, s) {
    var x = U.pick(TAREAS_GRANDES.filter(function (t) { return t.s.length >= p.min; }));
    var steps = x.s.slice(0, Math.max(p.min, Math.min(x.s.length, grow(3, 5, s))));
    var items = steps.map(function (t, k) { return { id: "p" + k, label: t }; });
    return {
      type: "order", skill: "planificacion",
      prompt: _t("Para ") + x.t + _t(", ordena los pasos."),
      slotsLabel: _t("Mi plan"),
      items: U.shuffle(items), answer: items.map(function (i) { return i.id; }), answerLabel: steps.join(" → "),
      hint: _t("Pregúntate: ¿qué necesito tener listo antes de este paso?"),
      explain: steps.map(function (t, k) { return (k + 1) + ". " + t; }).join(" ") + "."
    };
  }

  function estimarTiempo(p, s) {
    var x = U.pick(TIEMPOS);
    return {
      skill: "gestion_tiempo",
      prompt: _t("¿Cuánto tiempo toma, más o menos?"),
      visual: '<p class="game-equation" style="font-size:22px;letter-spacing:0">' + x[0] + "</p>",
      options: txtOpts(x[1], x[2]),
      answer: x[1],
      hint: _t("Piensa en la última vez que lo hiciste y cuánto te demoraste."),
      explain: _t("Suele tomar cerca de ") + x[1] + _t(". Calcular bien el tiempo ayuda a no dejar todo para última hora.")
    };
  }

  function clasificarTexto(bank, skill, prompt, hint) {
    return function (p, s) {
      var keys = Object.keys(bank), items = [], ans = {}, k = 0;
      keys.forEach(function (key) {
        U.shuffle(bank[key].items).slice(0, grow(2, 4, s)).forEach(function (t) { var id = "c" + (k++); items.push({ id: id, label: t }); ans[id] = key; });
      });
      return {
        type: "classify", skill: skill,
        prompt: prompt,
        bins: keys.map(function (key) { return { id: key, label: bank[key].label }; }),
        items: U.shuffle(items), answer: ans,
        hint: hint,
        explain: keys.map(function (key) { return bank[key].label + ": " + items.filter(function (i) { return ans[i.id] === key; }).map(function (i) { return i.label.toLowerCase(); }).join(", "); }).join(" · ") + "."
      };
    };
  }

  var ayudaDistrae = clasificarTexto(CONCENTRACION, "autorregulacion", _t("¿Esto te ayuda a concentrarte o te distrae?"), _t("Piensa en qué te hace perder el hilo cuando estudias."));
  var urgenteLuego = clasificarTexto(URGENCIA, "planificacion", _t("¿Lo haces hoy o lo agendas para después?"), _t("Si tiene fecha límite hoy o mañana temprano, va primero."));

  // ─── Plan: cada actividad elige su mecánica y la hace más exigente reto a reto ──
  function m(name, params) { return function (p, s) { return CONSTRUCTORES[name](params(s), { support: (p && p.support) || 1 }); }; }

  var gonogo = function (count, show, gap, nogo, sw) { return function (s) { return { count: count + s * 2, showMs: grow(show, show - 300, s), gapMs: gap, nogoRatio: nogo, switchRule: !!sw && s >= 2 }; }; };
  var secuencia = function (mode, min, max, show) { return function (s) { return { lenMin: min + (s >= 3 ? 1 : 0), lenMax: max + (s >= 2 ? 1 : 0), mode: mode, showMs: grow(show, show - 150, s), pad: min >= 3 ? "full" : "exact" }; }; };
  var busqueda = function (set, cells, cols, targets, time) { return function (s) { return { cells: cells + (s >= 2 ? cols : 0), cols: cols, targets: targets + (s >= 3 ? 1 : 0), set: set, timeMs: time ? grow(time, time - 8000, s) : 0 }; }; };
  var regla = function (trials, sw) { return function (s) { return { trials: trials + s, switchEvery: Math.max(1, sw - (s >= 3 ? 1 : 0)) }; }; };
  var flechas = function (trials) { return function (s) { return { trials: trials + s * 2 }; }; };
  var eco = function (back, len, show) { return function (s) { return { back: back, len: len + s * 2, showMs: grow(show, show - 200, s), gapMs: 450, matchRatio: 0.4 }; }; };
  var agenda = function (banco, min) { return function (s) { return { banco: banco, count: Math.min(banco.length, min + (s >= 2 ? 1 : 0)) }; }; };
  /** Mezcla: cada reto usa una mecánica distinta de la lista. */
  function mix(list) { return function (p, s) { var x = list[s % list.length]; return x(p, s); }; }

  var PLAN = {
    1: [
      [m("gonogo", gonogo(6, 2200, 900, 0.25)), 3, _t("Radar: toca cuando aparezca un satélite y deja pasar los meteoritos.")],
      [m("secuencia", secuencia("same", 2, 3, 1000)), 5, _t("Mensajes en clave: mira los números y repítelos en el mismo orden.")],
      [m("busqueda", busqueda("easy", 12, 4, 3, 0)), 3, _t("Busca las estrellas escondidas en el mapa, sin prisa.")],
      [m("gonogo", gonogo(8, 1700, 700, 0.3)), 3, _t("El radar va un poco más rápido: mira bien antes de tocar.")],
      [m("secuencia", secuencia("reverse", 2, 3, 1000)), 5, _t("Mensajes al revés: tócalos empezando por el último.")],
      [m("regla", regla(6, 4)), 3, _t("Cambio de regla: unas veces importa el tamaño y otras la forma.")],
      [dividirTarea, 5, _t("Vas a dividir tareas grandes en pasos pequeños."), { min: 3 }],
      [ayudaDistrae, 5, _t("Vas a reconocer qué te ayuda a concentrarte y qué te distrae.")],
      [m("flechas", flechas(6)), 3, _t("Flechas: sigue la flecha del centro sin mirar las de los lados.")],
      [m("agenda", agenda(AGENDA_BASICO, 3)), 3, _t("Agenda: ordena las tareas según cuál va primero.")]
    ],
    2: [
      [m("gonogo", gonogo(10, 1400, 600, 0.3)), 3, _t("Radar con más meteoritos y menos tiempo para decidir.")],
      [m("secuencia", secuencia("same", 3, 4, 900)), 5, _t("Mensajes en clave más largos.")],
      [m("flechas", flechas(8)), 3, _t("Flechas con más distractores.")],
      [m("busqueda", busqueda("oficina", 16, 4, 4, 0)), 3, _t("Encuentra los paquetes en el mapa de la oficina.")],
      [m("regla", regla(8, 3)), 3, _t("La regla cambia con más frecuencia.")],
      [m("agenda", agenda(AGENDA_BASICO, 4)), 3, _t("Organiza tu día según lo más urgente.")],
      [m("secuencia", secuencia("reverse", 3, 4, 850)), 5, _t("Mensajes más largos, al revés.")],
      [m("eco", eco(1, 10, 1400)), 3, _t("Eco: toca «¡IGUAL!» cuando la letra se repita justo después.")],
      [m("gonogo", gonogo(12, 1200, 500, 0.33, true)), 3, _t("Radar con cambio de regla a mitad del bloque.")],
      [estimarTiempo, 5, _t("Vas a calcular cuánto tiempo toman tareas de la vida diaria.")]
    ],
    3: [
      [m("gonogo", gonogo(14, 1050, 420, 0.35)), 3, _t("Radar veloz: muchos más meteoritos.")],
      [m("flechas", flechas(10)), 3, _t("Flechas rápidas con distractores.")],
      [m("secuencia", secuencia("asc", 3, 5, 800)), 5, _t("Ordena de menor a mayor los números que ves.")],
      [m("agenda", agenda(AGENDA_MEDIO, 4)), 3, _t("Organiza un día ocupado.")],
      [m("busqueda", busqueda("hard", 20, 5, 4, 40000)), 3, _t("Mapa difícil, con tiempo.")],
      [m("eco", eco(1, 12, 1250)), 3, _t("Eco de una letra atrás, más rápido.")],
      [m("regla", regla(9, 2)), 3, _t("La regla cambia cada dos estímulos.")],
      [m("secuencia", secuencia("reverse", 4, 5, 750)), 5, _t("Mensajes largos al revés.")],
      [dividirTarea, 5, _t("Vas a planear tareas largas de cinco pasos."), { min: 4 }],
      [urgenteLuego, 5, _t("Vas a decidir qué hacer hoy y qué agendar para después.")]
    ],
    4: [
      [m("eco", eco(2, 12, 1350)), 3, _t("Eco doble: toca «¡IGUAL!» si la letra es la misma de hace dos.")],
      [m("agenda", agenda(AGENDA_EXIGENTE, 5)), 3, _t("Organiza una agenda exigente.")],
      [m("gonogo", gonogo(14, 1000, 400, 0.35, true)), 3, _t("Radar rápido con cambio de regla.")],
      [m("secuencia", secuencia("same", 5, 6, 700)), 5, _t("Mensajes de cinco a siete números.")],
      [m("flechas", flechas(12)), 3, _t("Flechas a máxima concentración.")],
      [m("busqueda", busqueda("oficina", 20, 5, 5, 32000)), 3, _t("Mapa de oficina con tiempo.")],
      [m("regla", regla(10, 1)), 3, _t("La regla cambia en cada estímulo.")],
      [dividirTarea, 5, _t("Vas a planear proyectos completos."), { min: 5 }],
      [urgenteLuego, 5, _t("Vas a priorizar cuando todo parece urgente.")],
      [mix([m("eco", eco(1, 12, 1150)), m("gonogo", gonogo(10, 1050, 420, 0.3))]), 4, _t("Doble exigencia: eco y radar intercalados.")]
    ],
    5: [
      [mix([m("gonogo", gonogo(12, 950, 380, 0.35, true)), m("regla", regla(9, 2))]), 4, _t("Radar y cambio de regla intercalados.")],
      [mix([m("flechas", flechas(10)), m("busqueda", busqueda("hard", 20, 5, 5, 28000))]), 4, _t("Flechas y búsqueda intercaladas.")],
      [mix([m("eco", eco(2, 12, 1200)), m("secuencia", secuencia("reverse", 5, 6, 650))]), 4, _t("Eco doble y mensajes al revés.")],
      [mix([m("agenda", agenda(AGENDA_EXIGENTE, 5)), m("regla", regla(10, 1))]), 4, _t("Agenda y cambio de regla.")],
      [mix([m("gonogo", gonogo(10, 950, 360, 0.32)), m("flechas", flechas(10)), m("eco", eco(1, 12, 1100))]), 3, _t("Radar, flechas y eco.")],
      [mix([m("busqueda", busqueda("oficina", 20, 5, 5, 26000)), m("secuencia", secuencia("asc", 4, 5, 700)), m("agenda", agenda(AGENDA_MEDIO, 5))]), 3, _t("Búsqueda, secuencias y agenda.")],
      [mix([dividirTarea, estimarTiempo]), 4, _t("Planear y calcular tiempos."), { min: 5 }],
      [mix([m("regla", regla(9, 2)), m("eco", eco(1, 12, 1050)), m("flechas", flechas(10))]), 3, _t("Regla, eco y flechas.")],
      [mix([urgenteLuego, ayudaDistrae]), 4, _t("Priorizar y cuidar tu concentración.")],
      [mix([m("gonogo", gonogo(12, 900, 350, 0.33, true)), m("secuencia", secuencia("reverse", 5, 6, 650)), m("flechas", flechas(12)), m("eco", eco(2, 12, 1050)), m("agenda", agenda(AGENDA_EXIGENTE, 6))]), 5, _t("Misión final: un reto de cada habilidad.")]
    ]
  };

  var HABILIDADES = {
    go_no_go: _t("Esperar antes de responder"),
    memoria_secuencia_same: _t("Recordar secuencias"),
    memoria_secuencia_reverse: _t("Recordar secuencias al revés"),
    memoria_secuencia_asc: _t("Ordenar lo que recuerdas"),
    busqueda_selectiva: _t("Encontrar lo importante entre distractores"),
    flexibilidad_cambio_regla: _t("Adaptarse cuando cambia la regla"),
    flechas_flanker: _t("Ignorar distractores"),
    eco_nback_1: _t("Memoria de trabajo (eco)"),
    eco_nback_2: _t("Memoria de trabajo (eco doble)"),
    agenda_planificacion: _t("Organizar tareas por urgencia"),
    planificacion: _t("Planear paso a paso"),
    gestion_tiempo: _t("Calcular el tiempo"),
    autorregulacion: _t("Cuidar la concentración")
  };

  global.IndecapGame.register({
    slug: "tdah_ritmo",
    skillLabels: HABILIDADES,
    plan: PLAN,
    getActivity: function (index, ctx) {
      var nivel = Math.min(5, Math.max(1, Math.ceil(index / 10)));
      var act = PLAN[nivel][(index - 1) % 10];
      var extra = Object.assign({ support: (ctx && ctx.support) || 1 }, act[3] || {});
      return {
        intro: act[2] + _t(" Son ") + act[1] + _t(" retos cortos que suben de ritmo."),
        rounds: act[1],
        build: function (step) { return act[0](extra, step); }
      };
    }
  });
})(window);
