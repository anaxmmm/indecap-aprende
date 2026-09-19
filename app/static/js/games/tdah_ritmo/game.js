/**
 * MISIÓN RITMO Y ENFOQUE — TDAH
 *
 * Habilidad núcleo: funciones ejecutivas.
 *  - Control inhibitorio (go/no-go) .............. corteza orbitofrontal, estriado
 *  - Memoria de trabajo (secuencias) ............. corteza prefrontal dorsolateral
 *  - Atención selectiva (búsqueda) ............... cingulado anterior
 *  - Flexibilidad cognitiva (cambio de regla) .... corteza prefrontal, cingulado
 *
 * El nivel 10 mezcla las cuatro mecánicas: es la evaluación embebida, que mide
 * lo mismo que el resto de la sesión sin presentarse como examen.
 *
 * Apoyos según el nivel de autonomía del perfil (ajuste pedagógico, no
 * diagnóstico): guiado = más tiempo y más repeticiones; independiente = tiempo
 * base y sin repeticiones.
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
      ".tdah-cell:focus-visible{outline:3px solid var(--g-accent);outline-offset:3px}"
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
    "🚀": "cohete", "🛸": "platillo volador", "🛰️": "satélite", "✈️": "avión"
  };
  var PLURALES = { "⭐": "estrellas", "🚀": "cohetes" };

  function roundBusqueda(p, ctx) {
    var mult = timeMult(ctx);
    var target = p.set === "hard" ? "🚀" : "⭐";
    var dis = p.set === "hard" ? ["🛸", "🛰️", "✈️"] : ["🌙", "☀️", "🪐"];
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

  // ─── Definición de los 10 niveles ─────────────────────────────────────────

  var NIVELES = {
    1: {
      rounds: 3, mechanics: ["gonogo"],
      params: { gonogo: { count: 6, showMs: 2200, gapMs: 900, nogoRatio: 0.25 } },
      intro: "Te doy la bienvenida a la Misión Ritmo y Enfoque. Soy NOVA. Hoy vigilamos el radar: toca cuando veas un satélite y deja pasar los meteoritos."
    },
    2: {
      rounds: 5, mechanics: ["secuencia"],
      params: { secuencia: { lenMin: 2, lenMax: 3, mode: "same", showMs: 1000, pad: "exact" } },
      intro: "Llegan mensajes en clave. Mira los números que aparecen y repítelos en el mismo orden."
    },
    3: {
      rounds: 4, mechanics: ["busqueda"],
      params: { busqueda: { cells: 12, cols: 4, targets: 3, set: "easy", timeMs: 0 } },
      intro: "Hay estrellas escondidas en el mapa de la estación. Sin prisa: encuéntralas todas."
    },
    4: {
      rounds: 3, mechanics: ["gonogo"],
      params: { gonogo: { count: 8, showMs: 1500, gapMs: 700, nogoRatio: 0.3 } },
      intro: "El radar va un poco más rápido. Mira bien antes de tocar."
    },
    5: {
      rounds: 5, mechanics: ["secuencia"],
      params: { secuencia: { lenMin: 2, lenMax: 3, mode: "reverse", showMs: 1000, pad: "exact" } },
      intro: "Ahora los mensajes llegan al revés: tócalos empezando por el último número que viste."
    },
    6: {
      rounds: 3, mechanics: ["regla"],
      params: { regla: { trials: 8, switchEvery: 4 } },
      intro: "Las compuertas cambian de regla. Unas veces importa el tamaño y otras la forma. Yo te aviso cuando cambie."
    },
    7: {
      rounds: 4, mechanics: ["busqueda"],
      params: { busqueda: { cells: 20, cols: 5, targets: 4, set: "hard", timeMs: 40000 } },
      intro: "El mapa se llenó de naves parecidas. Busca solo los cohetes y no te distraigas con lo demás."
    },
    8: {
      rounds: 5, mechanics: ["secuencia"],
      params: { secuencia: { lenMin: 3, lenMax: 4, mode: "asc", showMs: 900, pad: "full" } },
      intro: "Los números llegan desordenados. Tócalos de menor a mayor."
    },
    9: {
      rounds: 3, mechanics: ["gonogo"],
      params: { gonogo: { count: 12, showMs: 1100, gapMs: 500, nogoRatio: 0.35, switchRule: true } },
      intro: "Radar avanzado: a mitad del reto la regla se invierte. Presta atención al aviso."
    },
    10: {
      rounds: 8, mechanics: ["gonogo", "secuencia", "busqueda", "regla"],
      params: {
        gonogo: { count: 8, showMs: 1300, gapMs: 600, nogoRatio: 0.3 },
        secuencia: { lenMin: 3, lenMax: 4, mode: "reverse", showMs: 800, pad: "full" },
        busqueda: { cells: 20, cols: 5, targets: 4, set: "hard", timeMs: 35000 },
        regla: { trials: 8, switchEvery: 2 }
      },
      intro: "Última misión: aparece todo lo que practicaste. Tómate tu tiempo y confía en lo aprendido."
    }
  };

  var CONSTRUCTORES = {
    gonogo: roundGoNoGo,
    secuencia: roundSecuencia,
    busqueda: roundBusqueda,
    regla: roundRegla
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