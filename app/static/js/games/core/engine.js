/**
 * Motor común de los juegos de indecap-aprende.
 *
 * Cada juego entrega su contenido y el motor se encarga del resto: pantalla
 * de inicio con ejemplo resuelto, retos, ayudas escalonadas, repaso de
 * errores, estrellas, retroalimentación final, sonido y envío de métricas.
 *
 * Estructura: 5 niveles × 10 actividades. Cada actividad tiene un número
 * continuo del 1 al 50 (data-level) y se juega como una partida corta de
 * retos que suben de dificultad.
 *
 * Un juego puede declararse de dos formas:
 *  - getActivity(index, ctx) → { intro, rounds, build(step, ctx), skillLabels? }
 *  - getLevel(index) + buildRound(cfg, i, ctx) (formato anterior, se adapta)
 *
 * Tipos de reto (todos accesibles con teclado):
 *  - opción múltiple: { options, answer }
 *  - "input": escribir un número con teclado en pantalla o físico
 *  - "order": ordenar elementos
 *  - "match": emparejar dos columnas
 *  - "classify": llevar cada elemento a su grupo
 *  - "slider": ubicar un valor en una recta
 *  - mecánica propia: { mount(host, api) } que avisa con api.done({...})
 */
(function (global) {
  "use strict";

  // ─── Textos ───────────────────────────────────────────────────────────────
  // play.html entrega la versión traducida en #gameStrings; esto es el respaldo.
  var T = {
    ok: ["¡Correcto!", "¡Muy bien!", "¡Eso es!", "¡Bien pensado!"],
    retry: ["Todavía no. Revisa con calma y prueba otra vez.", "Casi. Mira de nuevo el planteamiento.", "Prueba otra opción, no pasa nada."],
    reveal: "Mira cómo se resuelve:",
    check: "Comprobar",
    clear: "Borrar",
    erase: "Borrar el último dígito",
    yourAnswer: "Tu respuesta",
    yourOrder: "Tu orden",
    available: "Elementos disponibles",
    chooseItem: "Primero elige un elemento",
    placedIn: "Colocado en",
    round: "Reto",
    of: "de",
    review: "Repaso",
    reviewIntroOne: "Antes de terminar, repasemos un reto parecido al que te costó.",
    reviewIntroMany: "Antes de terminar, repasemos {n} retos parecidos a los que te costaron.",
    reviewPrefix: "Repasemos: ",
    end3: "¡Actividad dominada! Todo bien al primer intento.",
    end2: "¡Muy bien! Superaste la actividad.",
    end1: "Actividad superada. Si la repites puedes ganar más estrellas.",
    end0: "Todavía no la superas. Repítela con calma: cada intento te acerca.",
    praiseRetry: "Revisaste y corregiste tus respuestas: así se aprende.",
    praiseHint: "Usaste las pistas para avanzar: pedir ayuda también es una estrategia.",
    praiseFocus: "Te mantuviste concentrado hasta el final.",
    firstTry: "Al primer intento",
    withHelp: "Con ayuda",
    time: "Tiempo",
    mastered: "Lo que dominaste",
    toImprove: "Para reforzar",
    nothingToImprove: "Nada pendiente en esta actividad.",
    saving: "Guardando tu progreso…",
    saved: "Progreso guardado.",
    queued: "Sin conexión. Tu progreso quedó guardado en este dispositivo y se enviará al reconectar.",
    preview: "Vista previa: no se guarda progreso.",
    rejected: "No se pudo guardar esta partida. Pídele a tu docente que revise tu asignación.",
    example: "Ejemplo resuelto",
    answer: "Respuesta",
    stars: "estrellas",
    starsOf: "{n} de 3 estrellas",
    selected: "seleccionado",
    pairWith: "emparejado con",
    done: "¡Reto completado!",
    finished: "Actividad terminada",
    listen: "Escuchar de nuevo"
  };

  function loadStrings() {
    var node = document.getElementById("gameStrings");
    if (!node) return;
    try {
      var custom = JSON.parse(node.textContent || "{}");
      Object.keys(custom).forEach(function (k) { T[k] = custom[k]; });
    } catch (e) { /* se usan los textos de respaldo */ }
  }

  function fmt(text, values) {
    return String(text).replace(/\{(\w+)\}/g, function (_, k) {
      return values && values[k] !== undefined ? values[k] : "";
    });
  }

  function pick(list) {
    return Array.isArray(list) ? list[Math.floor(Math.random() * list.length)] : list;
  }

  function el(tag, cls, text) {
    var node = document.createElement(tag);
    if (cls) node.className = cls;
    if (text !== undefined && text !== null) node.textContent = text;
    return node;
  }

  function plain(html) {
    var div = document.createElement("div");
    div.innerHTML = String(html);
    return div.textContent || "";
  }

  /** Debe coincidir con games/registry.py::stars_for. */
  function starsFor(score) {
    if (score >= 100) return 3;
    if (score >= 75) return 2;
    if (score >= 60) return 1;
    return 0;
  }

  // Valor de un reto según el intento en que se acierta.
  var ATTEMPT_VALUE = [0, 1, 0.5, 0.25];

  var STAR_SVG =
    '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">' +
    '<path d="M12 2.6l2.8 5.9 6.4.8-4.7 4.4 1.2 6.4L12 17l-5.7 3.1 1.2-6.4L2.8 9.3l6.4-.8z"/></svg>';

  // ─── Sonido (Web Audio, sin archivos) ─────────────────────────────────────
  function Sound(enabled) {
    this.enabled = enabled;
    this.ctx = null;
  }
  Sound.prototype.tone = function (freq, start, dur, type, gain) {
    var ctx = this.ctx;
    var osc = ctx.createOscillator();
    var g = ctx.createGain();
    osc.type = type || "sine";
    osc.frequency.value = freq;
    var t = ctx.currentTime + start;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(gain || 0.12, t + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(g);
    g.connect(ctx.destination);
    osc.start(t);
    osc.stop(t + dur + 0.05);
  };
  Sound.prototype.play = function (kind) {
    if (!this.enabled) return;
    try {
      if (!this.ctx) {
        var AC = global.AudioContext || global.webkitAudioContext;
        if (!AC) return;
        this.ctx = new AC();
      }
      if (this.ctx.state === "suspended") this.ctx.resume();
      if (kind === "ok") {
        this.tone(660, 0, 0.14); this.tone(880, 0.1, 0.2);
      } else if (kind === "retry") {
        this.tone(330, 0, 0.22, "triangle", 0.08);
      } else if (kind === "finish") {
        this.tone(523, 0, 0.16); this.tone(659, 0.12, 0.16); this.tone(784, 0.24, 0.3);
      } else if (kind === "tap") {
        this.tone(520, 0, 0.06, "sine", 0.05);
      }
    } catch (e) { /* el sonido nunca bloquea el juego */ }
  };

  // ─── Normalización de la definición del juego ─────────────────────────────
  function resolveActivity(def, index, ctx) {
    if (typeof def.getActivity === "function") {
      var a = def.getActivity(index, ctx) || {};
      var total = a.rounds || 5;
      return {
        intro: a.intro || "",
        rounds: total,
        skillLabels: a.skillLabels || def.skillLabels || {},
        quiet: !!(a.quiet || def.quiet),
        build: function (step) { return a.build(step, ctx, total); },
        rebuild: function (step) { return a.build(step, ctx, total); }
      };
    }
    var cfg = def.getLevel(index) || {};
    var mechs = cfg.mechanics || [];
    return {
      intro: cfg.intro || "",
      rounds: cfg.rounds || 1,
      skillLabels: def.skillLabels || {},
      quiet: !!def.quiet,
      build: function (i) { return def.buildRound(cfg, i, ctx); },
      rebuild: function (i) {
        if (!mechs.length) return def.buildRound(cfg, i, ctx);
        var only = Object.assign({}, cfg, { mechanics: [mechs[i % mechs.length]] });
        return def.buildRound(only, 0, ctx);
      }
    };
  }

  /** Texto de la respuesta correcta de cualquier tipo de reto. */
  function describeAnswer(round) {
    if (!round) return "";
    if (round.answerLabel !== undefined && round.answerLabel !== null && round.answerLabel !== "") {
      return plain(round.answerLabel);
    }
    var byId = function (list, id) {
      for (var i = 0; i < (list || []).length; i++) if (String(list[i].id) === String(id)) return plain(list[i].label);
      return String(id);
    };
    switch (round.type) {
      case "order":
        return round.answer.map(function (id) { return byId(round.items, id); }).join(" → ");
      case "match":
        return Object.keys(round.answer).map(function (l) {
          return byId(round.left, l) + " = " + byId(round.right, round.answer[l]);
        }).join(" · ");
      case "classify":
        return round.bins.map(function (b) {
          var items = round.items.filter(function (it) { return String(round.answer[it.id]) === String(b.id); });
          return plain(b.label) + ": " + items.map(function (it) { return plain(it.label); }).join(", ");
        }).join(" · ");
      case "input":
        if (round.text) return String([].concat(round.answer)[0]);
        return (round.prefix || "") + String(round.answer) + (round.suffix ? " " + round.suffix : "");
      case "slider":
        return (round.prefix || "") + String(round.answer) + (round.suffix ? " " + round.suffix : "");
      default:
        if (round.options) {
          for (var i = 0; i < round.options.length; i++) {
            if (String(round.options[i].value) === String(round.answer)) return plain(round.options[i].label);
          }
        }
        return String(round.answer);
    }
  }

  // ─── Motor ────────────────────────────────────────────────────────────────
  function Engine(definition) {
    this.def = definition;
    this.shell = document.querySelector(".game-shell");
    if (!this.shell) return;
    loadStrings();

    var data = this.shell.dataset;
    this.slug = data.gameSlug;
    this.level = parseInt(data.level, 10) || 1;
    this.maxLevel = parseInt(data.maxLevel, 10) || 50;
    this.trastornoId = data.trastornoId ? parseInt(data.trastornoId, 10) : null;
    this.preview = data.preview === "1";

    var profile = {};
    try { profile = JSON.parse(data.a11y || "{}"); } catch (e) { profile = {}; }
    this.profile = profile;

    this.a11y = new global.IndecapA11y(this.shell, profile);
    this.session = new global.IndecapSession({
      url: data.submitUrl,
      csrfToken: (document.querySelector('meta[name="csrf-token"]') || {}).content || null,
      preview: this.preview,
      owner: data.userId || "anon"
    });

    var $ = function (id) { return document.getElementById(id); };
    this.el = {
      stage: $("gameStage"),
      screenIntro: $("screenIntro"),
      screenPlay: $("screenPlay"),
      screenEnd: $("screenEnd"),
      introText: $("introText"),
      example: $("introExample"),
      prompt: $("prompt"),
      visual: $("visual"),
      options: $("options"),
      feedback: $("feedback"),
      hint: $("hintText"),
      roundLabel: $("hudRound"),
      dots: $("roundDots"),
      timer: $("hudTimer"),
      endStars: $("endStars"),
      endTitle: $("endTitle"),
      endPraise: $("endPraise"),
      endStats: $("endStats"),
      endMastered: $("endMastered"),
      endImprove: $("endImprove"),
      saveState: $("saveState"),
      btnStart: $("btnStart"),
      btnRetry: $("btnRetry"),
      btnNext: $("btnNext")
    };

    this.cleanupFn = null;
    this.roundClosed = false;
    this.timer = null;

    this.bind();
    this.prepare();
  }

  Engine.prototype.supportLevel = function () {
    var base = parseInt(this.profile.autonomy_level, 10) || 1;
    return Math.max(1, Math.min(3, base));
  };

  Engine.prototype.motionDelay = function (normal) {
    return this.shell.classList.contains("is-reduced-motion") ? Math.round(normal * 0.6) : normal;
  };

  Engine.prototype.bind = function () {
    var self = this;
    this.el.btnStart.addEventListener("click", function () { self.start(); });
    this.el.btnRetry.addEventListener("click", function () { self.goToLevel(self.level); });
    this.el.btnNext.addEventListener("click", function () {
      self.goToLevel(Math.min(self.maxLevel, self.level + 1));
    });
    this.a11y.onHint = function () { self.showHint(true); };
    this.a11y.onSound = function (on) { self.sound.enabled = on; if (on) self.sound.play("tap"); };

    // Flechas para moverse entre botones de respuesta (sin mouse ni pantalla táctil).
    this.el.options.addEventListener("keydown", function (event) {
      var keys = ["ArrowRight", "ArrowLeft", "ArrowDown", "ArrowUp"];
      if (keys.indexOf(event.key) === -1) return;
      if (event.target && event.target.type === "range") return;
      var buttons = Array.prototype.slice.call(
        self.el.options.querySelectorAll("button:not(:disabled)")
      );
      if (!buttons.length) return;
      event.preventDefault();
      var current = buttons.indexOf(document.activeElement);
      var step = (event.key === "ArrowRight" || event.key === "ArrowDown") ? 1 : -1;
      buttons[(current + step + buttons.length) % buttons.length].focus();
    });
  };

  Engine.prototype.goToLevel = function (level) {
    var url = new URL(global.location.href);
    url.pathname = url.pathname.replace(/\/nivel\/\d+$/, "") + "/nivel/" + level;
    global.location.href = url.pathname + url.search;
  };

  Engine.prototype.prepare = function () {
    this.ctx = { support: this.supportLevel() };
    this.activity = resolveActivity(this.def, this.level, this.ctx);
    this.sound = new Sound(this.a11y.soundPreference(!this.activity.quiet));

    this.rounds = [];
    for (var i = 0; i < this.activity.rounds; i++) {
      this.rounds.push(this.activity.build(i));
    }
    this.mainCount = this.rounds.length;
    this.results = [];          // por reto principal: { value, attempts, revealed, skill, hint }
    this.reviewSource = [];     // índice del reto original de cada repaso
    this.index = 0;
    this.errors = [];
    this.inReview = false;
    this.startedAt = null;

    this.renderDots();
    this.el.introText.textContent = this.activity.intro;
    this.renderExample();
    this.showScreen("screenIntro");
    this.a11y.say(this.activity.intro);
  };

  /** Ejemplo resuelto en la pantalla de inicio (carga cognitiva: ver antes de hacer). */
  Engine.prototype.renderExample = function () {
    var box = this.el.example;
    if (!box) return;
    box.innerHTML = "";
    var sample = null;
    try { sample = this.activity.build(0); } catch (e) { sample = null; }
    if (!sample || typeof sample.mount === "function") { box.hidden = true; return; }

    box.appendChild(el("p", "game-example__label", T.example));
    box.appendChild(el("p", "game-example__prompt", sample.prompt));
    if (sample.visual) {
      var v = el("div", "game-example__visual");
      v.innerHTML = sample.visual;
      v.setAttribute("aria-hidden", "true");
      box.appendChild(v);
    }
    var ans = el("p", "game-example__answer");
    ans.appendChild(el("strong", null, T.answer + ": "));
    ans.appendChild(document.createTextNode(describeAnswer(sample)));
    box.appendChild(ans);
    if (sample.explain) box.appendChild(el("p", "game-example__explain", sample.explain));
    box.hidden = false;
  };

  Engine.prototype.renderDots = function () {
    var box = this.el.dots;
    if (!box) return;
    box.innerHTML = "";
    for (var i = 0; i < this.mainCount; i++) {
      var d = el("span", "game-dot");
      d.dataset.i = i;
      box.appendChild(d);
    }
  };

  Engine.prototype.updateDots = function () {
    var dots = this.el.dots ? this.el.dots.children : [];
    for (var i = 0; i < dots.length; i++) {
      var r = this.results[i];
      var cls = "game-dot";
      if (r) cls += r.revealed ? " is-missed" : (r.attempts === 1 ? " is-ok" : " is-retry");
      else if (!this.inReview && i === this.index) cls += " is-current";
      dots[i].className = cls;
    }
  };

  Engine.prototype.showScreen = function (id) {
    ["screenIntro", "screenPlay", "screenEnd"].forEach(function (key) {
      this.el[key].classList.toggle("is-active", key === id);
    }, this);
  };

  Engine.prototype.start = function () {
    this.startedAt = Date.now();
    this.showScreen("screenPlay");
    this.startTimer();
    this.renderRound();
    this.el.stage.focus();
  };

  Engine.prototype.startTimer = function () {
    var self = this;
    this.timer = setInterval(function () {
      if (self.el.timer) self.el.timer.textContent = self.clock(self.elapsed());
    }, 1000);
  };

  Engine.prototype.clock = function (s) {
    return Math.floor(s / 60) + ":" + String(s % 60).padStart(2, "0");
  };

  Engine.prototype.elapsed = function () {
    return this.startedAt ? Math.round((Date.now() - this.startedAt) / 1000) : 0;
  };

  Engine.prototype.runCleanup = function () {
    if (typeof this.cleanupFn === "function") {
      try { this.cleanupFn(); } catch (e) { /* la limpieza nunca bloquea el juego */ }
    }
    this.cleanupFn = null;
  };

  Engine.prototype.renderRound = function () {
    var round = this.rounds[this.index];
    this.runCleanup();
    this.attempts = 0;
    this.roundClosed = false;

    if (this.inReview) {
      var n = this.index - this.mainCount + 1;
      this.el.roundLabel.textContent = T.review + " " + n + " " + T.of + " " + (this.rounds.length - this.mainCount);
    } else {
      this.el.roundLabel.textContent = T.round + " " + (this.index + 1) + " " + T.of + " " + this.mainCount;
    }
    this.updateDots();
    this.setFeedback("", "");
    this.el.hint.hidden = true;
    this.el.stage.classList.remove("is-celebrating");

    this.el.prompt.textContent = round.prompt;
    this.el.visual.innerHTML = round.visual || "";
    this.el.visual.hidden = !round.visual;
    this.el.options.innerHTML = "";
    this.el.options.className = "game-options";

    if (typeof round.mount === "function") this.mountCustom(round);
    else if (round.type === "input") this.renderInput(round);
    else if (round.type === "order") this.renderOrder(round);
    else if (round.type === "match") this.renderMatch(round);
    else if (round.type === "classify") this.renderClassify(round);
    else if (round.type === "slider") this.renderSlider(round);
    else this.renderOptions(round);

    // En los dictados, lo que hay que escribir se dice después de la consigna
    // (forzado: sin voz no hay dictado).
    this.a11y.say(round.speech || round.prompt, !!round.listen);
    if (round.listen) this.a11y.say(round.listen, true, { lang: listenLang(round), queue: true });
    // Palabra o texto de práctica que se lee después de la consigna, siempre
    // con voz en español aunque la plataforma esté en inglés.
    else if (round.speakWord) this.a11y.say(round.speakWord, false, { lang: "es", queue: true });

    // En modo guiado la pista aparece sola desde el inicio.
    if (this.supportLevel() === 1 && round.hint) this.showHint(false);
  };

  Engine.prototype.setFeedback = function (text, kind) {
    this.el.feedback.textContent = text || "";
    this.el.feedback.className = "game-feedback" + (kind ? " is-" + kind : "");
    this.setMascota(text ? { ok: "celebra", retry: "anima" }[kind] : null);
  };

  // El personaje reacciona al acierto o al error; se reinicia para repetir la animación.
  Engine.prototype.setMascota = function (estado) {
    this.shell.removeAttribute("data-mascota");
    if (!estado) return;
    void this.shell.offsetWidth;
    this.shell.setAttribute("data-mascota", estado);
  };

  // ── Opción múltiple ──
  Engine.prototype.renderOptions = function (round) {
    var self = this;
    if (round.layout) this.el.options.classList.add("game-options--" + round.layout);
    round.options.forEach(function (option) {
      var btn = el("button", "game-option");
      btn.type = "button";
      btn.innerHTML = option.label +
        (option.caption ? '<span class="game-option__caption">' + option.caption + "</span>" : "");
      btn.setAttribute("aria-label", option.aria || option.plain || plain(option.label));
      btn.dataset.value = String(option.value);
      btn.addEventListener("click", function () {
        if (self.roundClosed) return;
        var ok = String(option.value) === String(round.answer);
        if (ok) btn.classList.add("is-correct");
        else { btn.classList.add("is-wrong"); btn.disabled = true; }
        self.evaluate(ok, round, option.value, function () {
          Array.prototype.forEach.call(self.el.options.querySelectorAll(".game-option"), function (b) {
            if (b.dataset.value === String(round.answer)) b.classList.add("is-correct");
            b.disabled = true;
          });
        });
      });
      self.el.options.appendChild(btn);
    });
  };

  // ── Escribir un número (o una palabra, con round.text) ──
  Engine.prototype.renderInput = function (round) {
    if (round.text) return this.renderTextInput(round);
    var self = this;
    var host = this.el.options;
    host.classList.add("game-options--input");
    this.addListenButton(round, host);

    var field = el("div", "game-input");
    if (round.prefix) field.appendChild(el("span", "game-input__affix", round.prefix));
    var input = el("input", "game-input__field");
    input.type = "text";
    input.inputMode = "numeric";
    input.autocomplete = "off";
    input.setAttribute("aria-label", T.yourAnswer);
    input.maxLength = round.maxLength || 9;
    field.appendChild(input);
    if (round.suffix) field.appendChild(el("span", "game-input__affix", round.suffix));
    host.appendChild(field);

    var pad = el("div", "game-keypad");
    pad.setAttribute("role", "group");
    pad.setAttribute("aria-label", T.yourAnswer);
    "1 2 3 4 5 6 7 8 9 ⌫ 0 ✓".split(" ").forEach(function (k) {
      var b = el("button", "game-key" + (k === "✓" ? " game-key--ok" : ""), k);
      b.type = "button";
      if (k === "⌫") b.setAttribute("aria-label", T.erase);
      if (k === "✓") b.setAttribute("aria-label", T.check);
      b.addEventListener("click", function () {
        if (self.roundClosed) return;
        if (k === "⌫") input.value = input.value.slice(0, -1);
        else if (k === "✓") submit();
        else if (input.value.length < input.maxLength) input.value += k;
        self.sound.play("tap");
        input.focus();
      });
      pad.appendChild(b);
    });
    host.appendChild(pad);

    function normalize(v) { return String(v).replace(/[^\d-]/g, "").replace(/(?!^)-/g, ""); }
    function submit() {
      if (self.roundClosed) return;
      var given = normalize(input.value);
      if (!given) { input.focus(); return; }
      var ok = round.accept ? !!round.accept(Number(given)) : given === normalize(round.answer);
      field.classList.remove("is-wrong");
      if (!ok) { void field.offsetWidth; field.classList.add("is-wrong"); input.select(); }
      else field.classList.add("is-correct");
      self.evaluate(ok, round, given, function () {
        input.value = normalize(round.answer);
        input.disabled = true;
        field.classList.remove("is-wrong");
        field.classList.add("is-correct");
        Array.prototype.forEach.call(pad.querySelectorAll("button"), function (b) { b.disabled = true; });
      });
      if (ok) {
        input.disabled = true;
        Array.prototype.forEach.call(pad.querySelectorAll("button"), function (b) { b.disabled = true; });
      }
    }
    input.addEventListener("input", function () { input.value = input.value.replace(/[^\d]/g, ""); });
    input.addEventListener("keydown", function (e) { if (e.key === "Enter") { e.preventDefault(); submit(); } });
    setTimeout(function () { input.focus(); }, 50);
  };

  /** Normaliza una respuesta escrita: minúsculas, espacios y puntuación final. */
  function normalizeText(v, strictAccents) {
    var t = String(v || "").toLowerCase().replace(/[.,;:¡!¿?"«»]/g, "").replace(/\s+/g, " ").trim();
    if (!strictAccents) t = t.replace(/ñ/g, "\u0001").normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\u0001/g, "ñ");
    return t;
  }

  /** Idioma de lo que se dicta: español por defecto (se practica en español);
      "page" usa el idioma de la página, por ejemplo para números. */
  function listenLang(round) {
    return round.listenLang === "page" ? null : (round.listenLang || "es");
  }

  /** Botón «Escuchar de nuevo» para dictados (palabras, frases o números). */
  Engine.prototype.addListenButton = function (round, host) {
    if (!round.listen) return;
    var self = this;
    var hear = el("button", "game-btn game-btn--ghost", T.listen);
    hear.type = "button";
    hear.addEventListener("click", function () {
      self.a11y.say(round.listen, true, { lang: listenLang(round) });
      var field = host.querySelector(".game-input__field");
      if (field) field.focus();
    });
    host.appendChild(hear);
  };

  Engine.prototype.renderTextInput = function (round) {
    var self = this;
    var host = this.el.options;
    host.classList.add("game-options--input");
    this.addListenButton(round, host);
    var field = el("div", "game-input game-input--text");
    var input = el("input", "game-input__field");
    input.type = "text";
    input.autocomplete = "off";
    input.setAttribute("autocapitalize", "off");
    input.setAttribute("spellcheck", "false");
    input.setAttribute("aria-label", T.yourAnswer);
    field.appendChild(input);
    host.appendChild(field);
    var check = el("button", "game-btn game-btn--primary game-check", T.check);
    check.type = "button";
    host.appendChild(check);

    var answers = [].concat(round.answer).map(function (a) { return normalizeText(a, round.strictAccents); });
    function submit() {
      if (self.roundClosed) return;
      var given = normalizeText(input.value, round.strictAccents);
      if (!given) { input.focus(); return; }
      var ok = answers.indexOf(given) !== -1;
      field.classList.remove("is-wrong");
      if (!ok) { void field.offsetWidth; field.classList.add("is-wrong"); input.select(); }
      else { field.classList.add("is-correct"); input.disabled = true; check.hidden = true; }
      self.evaluate(ok, round, input.value, function () {
        input.value = [].concat(round.answer)[0];
        input.disabled = true; check.hidden = true;
        field.classList.remove("is-wrong"); field.classList.add("is-correct");
      });
    }
    check.addEventListener("click", submit);
    input.addEventListener("keydown", function (e) { if (e.key === "Enter") { e.preventDefault(); submit(); } });
    setTimeout(function () { input.focus(); }, 60);
  };

  // ── Ordenar ──
  Engine.prototype.renderOrder = function (round) {
    var self = this;
    var host = this.el.options;
    host.classList.add("game-options--board");
    var placed = [];

    var slotsLabel = el("p", "game-board__label", round.slotsLabel || T.yourOrder);
    var slots = el("ol", "game-slots");
    var poolLabel = el("p", "game-board__label", T.available);
    var pool = el("div", "game-pool");
    var check = el("button", "game-btn game-btn--primary game-check", T.check);
    check.type = "button";
    check.disabled = true;

    function draw() {
      slots.innerHTML = "";
      for (var i = 0; i < round.items.length; i++) {
        var li = el("li", "game-slot");
        var id = placed[i];
        if (id !== undefined) {
          var item = round.items.filter(function (it) { return String(it.id) === String(id); })[0];
          var b = el("button", "game-chip is-placed");
          b.type = "button";
          b.innerHTML = '<span class="game-chip__n">' + (i + 1) + "</span>" + item.label;
          b.setAttribute("aria-label", (i + 1) + ". " + plain(item.label));
          (function (pos) {
            b.addEventListener("click", function () {
              if (self.roundClosed) return;
              placed.splice(pos, 1);
              self.sound.play("tap");
              draw();
            });
          })(i);
          li.appendChild(b);
        } else {
          li.appendChild(el("span", "game-slot__empty", String(i + 1)));
        }
        slots.appendChild(li);
      }
      pool.innerHTML = "";
      round.items.forEach(function (item) {
        if (placed.some(function (p) { return String(p) === String(item.id); })) return;
        var b = el("button", "game-chip");
        b.type = "button";
        b.innerHTML = item.label;
        b.setAttribute("aria-label", plain(item.label));
        b.addEventListener("click", function () {
          if (self.roundClosed) return;
          placed.push(item.id);
          self.sound.play("tap");
          draw();
          var next = pool.querySelector("button");
          (next || check).focus();
        });
        pool.appendChild(b);
      });
      check.disabled = placed.length !== round.items.length;
      poolLabel.hidden = placed.length === round.items.length;
    }

    check.addEventListener("click", function () {
      if (self.roundClosed) return;
      // Se compara por texto: dos elementos iguales (p. ej. dos letras «a») son intercambiables.
      var labelOf = function (id) {
        for (var k = 0; k < round.items.length; k++) if (String(round.items[k].id) === String(id)) return plain(round.items[k].label);
        return "";
      };
      var same = function (id, i) { return labelOf(id) === labelOf(round.answer[i]); };
      var ok = placed.every(same);
      var chips = slots.querySelectorAll(".game-chip");
      placed.forEach(function (id, i) { if (same(id, i)) chips[i].classList.add("is-correct"); });
      self.evaluate(ok, round, placed.slice(), function () {
        placed = round.answer.slice();
        draw();
        Array.prototype.forEach.call(host.querySelectorAll("button"), function (b) { b.disabled = true; b.classList.add("is-correct"); });
        check.hidden = true;
      });
      if (ok) {
        Array.prototype.forEach.call(host.querySelectorAll("button"), function (b) { b.disabled = true; });
        check.hidden = true;
      }
    });

    host.appendChild(slotsLabel);
    host.appendChild(slots);
    host.appendChild(poolLabel);
    host.appendChild(pool);
    host.appendChild(check);
    draw();
  };

  // ── Emparejar ──
  Engine.prototype.renderMatch = function (round) {
    var self = this;
    var host = this.el.options;
    host.classList.add("game-options--board");
    var pairs = {};      // izquierda → derecha
    var active = null;

    var cols = el("div", "game-match");
    var left = el("div", "game-match__col");
    var right = el("div", "game-match__col");
    var check = el("button", "game-btn game-btn--primary game-check", T.check);
    check.type = "button";

    function pairNumber(leftId) {
      var keys = round.left.map(function (l) { return String(l.id); });
      return keys.indexOf(String(leftId)) + 1;
    }

    function draw() {
      left.innerHTML = "";
      right.innerHTML = "";
      round.left.forEach(function (item) {
        var b = el("button", "game-chip");
        b.type = "button";
        var paired = pairs[item.id] !== undefined;
        b.innerHTML = (paired ? '<span class="game-chip__n">' + pairNumber(item.id) + "</span>" : "") + item.label;
        if (paired) b.classList.add("is-paired");
        if (String(active) === String(item.id)) { b.classList.add("is-active"); b.setAttribute("aria-pressed", "true"); }
        b.setAttribute("aria-label", plain(item.label) + (paired ? ", " + T.pairWith + " " + plain(labelOf(round.right, pairs[item.id])) : ""));
        b.addEventListener("click", function () {
          if (self.roundClosed) return;
          active = String(active) === String(item.id) ? null : item.id;
          self.sound.play("tap");
          draw();
          var first = right.querySelector("button");
          if (active !== null && first) first.focus();
        });
        left.appendChild(b);
      });
      round.right.forEach(function (item) {
        var b = el("button", "game-chip");
        b.type = "button";
        var owner = null;
        Object.keys(pairs).forEach(function (k) { if (String(pairs[k]) === String(item.id)) owner = k; });
        b.innerHTML = (owner !== null ? '<span class="game-chip__n">' + pairNumber(owner) + "</span>" : "") + item.label;
        if (owner !== null) b.classList.add("is-paired");
        b.setAttribute("aria-label", plain(item.label));
        b.addEventListener("click", function () {
          if (self.roundClosed) return;
          if (active === null) { self.setFeedback(T.chooseItem, "retry"); return; }
          Object.keys(pairs).forEach(function (k) { if (String(pairs[k]) === String(item.id)) delete pairs[k]; });
          pairs[active] = item.id;
          active = null;
          self.sound.play("tap");
          self.setFeedback("", "");
          draw();
          var nextLeft = left.querySelector("button:not(.is-paired)");
          (nextLeft || check).focus();
        });
        right.appendChild(b);
      });
      check.disabled = Object.keys(pairs).length !== round.left.length;
    }

    function labelOf(list, id) {
      for (var i = 0; i < list.length; i++) if (String(list[i].id) === String(id)) return list[i].label;
      return "";
    }

    check.addEventListener("click", function () {
      if (self.roundClosed) return;
      var ok = round.left.every(function (l) { return String(pairs[l.id]) === String(round.answer[l.id]); });
      self.evaluate(ok, round, Object.assign({}, pairs), function () {
        pairs = Object.assign({}, round.answer);
        draw();
        Array.prototype.forEach.call(host.querySelectorAll("button"), function (b) { b.disabled = true; b.classList.add("is-correct"); });
        check.hidden = true;
      });
      if (ok) {
        Array.prototype.forEach.call(host.querySelectorAll(".game-chip"), function (b) { b.disabled = true; b.classList.add("is-correct"); });
        check.hidden = true;
      } else {
        // Se sueltan solo los pares equivocados: el estudiante conserva lo que hizo bien.
        Object.keys(pairs).forEach(function (k) { if (String(pairs[k]) !== String(round.answer[k])) delete pairs[k]; });
        if (!self.roundClosed) draw();
      }
    });

    cols.appendChild(left);
    cols.appendChild(right);
    host.appendChild(cols);
    host.appendChild(check);
    draw();
  };

  // ── Clasificar ──
  Engine.prototype.renderClassify = function (round) {
    var self = this;
    var host = this.el.options;
    host.classList.add("game-options--board");
    var where = {};      // elemento → grupo
    var active = null;

    var pool = el("div", "game-pool");
    var bins = el("div", "game-bins");
    var check = el("button", "game-btn game-btn--primary game-check", T.check);
    check.type = "button";

    function draw() {
      pool.innerHTML = "";
      round.items.forEach(function (item) {
        if (where[item.id] !== undefined) return;
        var b = el("button", "game-chip");
        b.type = "button";
        b.innerHTML = item.label;
        if (String(active) === String(item.id)) { b.classList.add("is-active"); b.setAttribute("aria-pressed", "true"); }
        b.setAttribute("aria-label", plain(item.label));
        b.addEventListener("click", function () {
          if (self.roundClosed) return;
          active = String(active) === String(item.id) ? null : item.id;
          self.sound.play("tap");
          draw();
          var firstBin = bins.querySelector(".game-bin__drop");
          if (active !== null && firstBin) firstBin.focus();
        });
        pool.appendChild(b);
      });
      bins.innerHTML = "";
      round.bins.forEach(function (bin) {
        var box = el("div", "game-bin");
        var drop = el("button", "game-bin__drop");
        drop.type = "button";
        drop.innerHTML = bin.label;
        drop.setAttribute("aria-label", plain(bin.label));
        drop.addEventListener("click", function () {
          if (self.roundClosed) return;
          if (active === null) { self.setFeedback(T.chooseItem, "retry"); return; }
          where[active] = bin.id;
          active = null;
          self.sound.play("tap");
          self.setFeedback("", "");
          draw();
          var next = pool.querySelector("button");
          (next || check).focus();
        });
        box.appendChild(drop);
        var list = el("div", "game-bin__items");
        round.items.forEach(function (item) {
          if (String(where[item.id]) !== String(bin.id)) return;
          var chip = el("button", "game-chip is-placed");
          chip.type = "button";
          chip.innerHTML = item.label;
          chip.setAttribute("aria-label", plain(item.label) + ", " + T.placedIn + " " + plain(bin.label));
          chip.addEventListener("click", function () {
            if (self.roundClosed) return;
            delete where[item.id];
            self.sound.play("tap");
            draw();
          });
          list.appendChild(chip);
        });
        box.appendChild(list);
        bins.appendChild(box);
      });
      check.disabled = Object.keys(where).length !== round.items.length;
    }

    check.addEventListener("click", function () {
      if (self.roundClosed) return;
      var ok = round.items.every(function (it) { return String(where[it.id]) === String(round.answer[it.id]); });
      self.evaluate(ok, round, Object.assign({}, where), function () {
        where = Object.assign({}, round.answer);
        draw();
        Array.prototype.forEach.call(host.querySelectorAll("button"), function (b) { b.disabled = true; });
        check.hidden = true;
      });
      if (ok) {
        Array.prototype.forEach.call(host.querySelectorAll("button"), function (b) { b.disabled = true; });
        check.hidden = true;
      } else {
        Object.keys(where).forEach(function (k) { if (String(where[k]) !== String(round.answer[k])) delete where[k]; });
        if (!self.roundClosed) draw();
      }
    });

    host.appendChild(pool);
    host.appendChild(bins);
    host.appendChild(check);
    draw();
  };

  // ── Ubicar en la recta ──
  Engine.prototype.renderSlider = function (round) {
    var self = this;
    var host = this.el.options;
    host.classList.add("game-options--slider");
    var min = round.min || 0, max = round.max, step = round.step || 1;
    var tol = round.tolerance || 0;

    var readout = el("output", "game-slider__value");
    var range = el("input", "game-slider__range");
    range.type = "range";
    range.min = min; range.max = max; range.step = step;
    range.value = round.start !== undefined ? round.start : min;
    range.setAttribute("aria-label", round.prompt);
    var labels = el("div", "game-slider__ends");
    labels.appendChild(el("span", null, String(min)));
    labels.appendChild(el("span", null, String(max)));
    var check = el("button", "game-btn game-btn--primary game-check", T.check);
    check.type = "button";

    function show() {
      readout.textContent = (round.prefix || "") + range.value + (round.suffix ? " " + round.suffix : "");
      range.setAttribute("aria-valuetext", readout.textContent);
    }
    range.addEventListener("input", show);
    check.addEventListener("click", function () {
      if (self.roundClosed) return;
      var v = Number(range.value);
      var ok = Math.abs(v - Number(round.answer)) <= tol;
      self.evaluate(ok, round, v, function () {
        range.value = round.answer; show();
        range.disabled = true; check.hidden = true;
        readout.classList.add("is-correct");
      });
      if (ok) { range.disabled = true; check.hidden = true; readout.classList.add("is-correct"); }
    });

    host.appendChild(readout);
    host.appendChild(range);
    host.appendChild(labels);
    host.appendChild(check);
    show();
    setTimeout(function () { range.focus(); }, 50);
  };

  // ── Mecánica propia del juego ──
  Engine.prototype.mountCustom = function (round) {
    var self = this;
    var token = this.index;
    var api = {
      say: function (text, force, lang) { self.a11y.say(text, force, lang ? { lang: lang } : null); },
      hint: function () { self.showHint(false); },
      setPrompt: function (text) { self.el.prompt.textContent = text; },
      setVisual: function (html) { self.el.visual.innerHTML = html; self.el.visual.hidden = !html; },
      feedback: function (text, kind) { self.setFeedback(text, kind); },
      sound: function (kind) { self.sound.play(kind); },
      done: function (result) {
        if (self.roundClosed || token !== self.index) return;
        result = result || {};
        var value = Math.max(0, Math.min(1, Number(result.stars) || 0));
        var errored = result.error && typeof result.error === "object";
        if (errored) {
          var rec = { round: self.index + 1, skill: round.skill, label: self.skillName(round.skill) };
          Object.keys(result.error).forEach(function (k) { rec[k] = result.error[k]; });
          if (self.inReview) rec.phase = "repaso";
          self.errors.push(rec);
        }
        self.closeRound(round, {
          value: value,
          attempts: value >= 0.75 && !errored ? 1 : 2,
          revealed: value === 0,
          failed: errored || value < 0.75,
          message: result.message || T.done,
          delay: result.delay
        });
      }
    };
    this.cleanupFn = round.mount(this.el.options, api) || null;
  };

  /**
   * Respuesta de un reto. Acierto: se cierra. Error: se puede reintentar;
   * al segundo error aparece la pista y al tercero se muestra la solución
   * con su explicación, para que el estudiante vea el proceso.
   */
  Engine.prototype.evaluate = function (ok, round, given, revealFn) {
    if (this.roundClosed) return;
    this.attempts += 1;
    if (ok) {
      this.sound.play("ok");
      this.closeRound(round, {
        value: ATTEMPT_VALUE[this.attempts] || 0.25,
        attempts: this.attempts,
        revealed: false,
        failed: this.attempts > 1,
        message: pick(T.ok) + (round.explain ? " " + round.explain : "")
      });
      return;
    }

    var rec = {
      round: this.index + 1,
      skill: round.skill,
      label: this.skillName(round.skill),
      expected: round.type ? describeAnswer(round) : round.answer,
      given: given,
      attempts: this.attempts
    };
    if (this.inReview) rec.phase = "repaso";
    this.errors.push(rec);
    this.sound.play("retry");

    if (this.attempts >= 3) {
      if (typeof revealFn === "function") revealFn();
      this.closeRound(round, {
        value: 0,
        attempts: this.attempts,
        revealed: true,
        failed: true,
        message: T.reveal + " " + describeAnswer(round) + ". " + (round.explain || ""),
        delay: 3600
      });
      return;
    }
    var msg = round.retry || pick(T.retry);
    this.setFeedback(msg, "retry");
    this.a11y.say(msg);
    if (this.attempts >= 2) this.showHint(false);
  };

  Engine.prototype.closeRound = function (round, r) {
    var self = this;
    this.roundClosed = true;
    if (!this.inReview) {
      this.results[this.index] = {
        value: r.value,
        attempts: r.attempts,
        revealed: r.revealed,
        failed: r.failed,
        skill: round.skill,
        hint: round.hint || ""
      };
      this.updateDots();
    }
    this.setFeedback((r.revealed ? "" : "✓ ") + r.message, r.revealed ? "retry" : "ok");
    if (!r.revealed) this.el.stage.classList.add("is-celebrating");
    this.a11y.say(r.message);
    var token = this.index;
    setTimeout(function () {
      if (token === self.index) self.nextRound();
    }, this.motionDelay(r.delay || (r.revealed ? 3600 : 1700)));
  };

  Engine.prototype.showHint = function (spoken) {
    var round = this.rounds[this.index];
    if (!round || !round.hint) return;
    this.el.hint.textContent = round.hint;
    this.el.hint.hidden = false;
    if (spoken) this.a11y.say(round.hint, true);
  };

  Engine.prototype.nextRound = function () {
    this.index += 1;
    if (this.index >= this.rounds.length) {
      if (!this.inReview && this.startReview()) return;
      this.finish();
    } else {
      this.renderRound();
    }
  };

  /** Repaso: un reto nuevo y parecido por cada reto fallado. No suma puntaje. */
  Engine.prototype.startReview = function () {
    var self = this;
    var failed = [];
    this.results.forEach(function (r, i) { if (r && r.failed) failed.push(i); });
    if (!failed.length) return false;

    this.inReview = true;
    failed.forEach(function (i) {
      var r = null;
      try { r = self.activity.rebuild(i); } catch (e) { r = null; }
      if (!r) return;
      r.prompt = T.reviewPrefix + (r.prompt || "");
      r.speech = T.reviewPrefix + (r.speech || r.prompt);
      self.rounds.push(r);
      self.reviewSource.push(i);
    });
    if (this.rounds.length === this.mainCount) { this.inReview = false; return false; }

    var n = this.rounds.length - this.mainCount;
    var msg = n === 1 ? T.reviewIntroOne : fmt(T.reviewIntroMany, { n: n });
    this.el.options.innerHTML = "";
    this.el.visual.innerHTML = "";
    this.el.visual.hidden = true;
    this.el.hint.hidden = true;
    this.setFeedback("", "");
    this.el.prompt.textContent = msg;
    this.a11y.say(msg, true);
    setTimeout(function () { self.renderRound(); }, this.motionDelay(2000));
    return true;
  };

  Engine.prototype.score = function () {
    var sum = 0;
    for (var i = 0; i < this.mainCount; i++) sum += (this.results[i] && this.results[i].value) || 0;
    return Math.round((sum / Math.max(1, this.mainCount)) * 100);
  };

  Engine.prototype.finish = function () {
    clearInterval(this.timer);
    this.runCleanup();
    this.a11y.stop();

    var score = this.score();
    var stars = starsFor(score);
    var time = this.elapsed();
    this.inReview = false;
    this.index = this.mainCount;
    this.updateDots();
    this.el.roundLabel.textContent = T.finished;
    this.showScreen("screenEnd");
    this.sound.play(stars ? "finish" : "retry");
    this.setMascota(stars ? "celebra" : "anima");

    // Estrellas
    this.el.endStars.innerHTML = "";
    this.el.endStars.setAttribute("aria-label", fmt(T.starsOf, { n: stars }));
    for (var s = 1; s <= 3; s++) {
      var star = el("span", "game-star" + (s <= stars ? " is-on" : ""));
      star.innerHTML = STAR_SVG;
      star.style.setProperty("--d", (s * 0.15) + "s");
      this.el.endStars.appendChild(star);
    }
    var title = [T.end0, T.end1, T.end2, T.end3][stars];
    this.el.endTitle.textContent = title;

    // Elogio al proceso, no a la persona.
    var main = this.results.slice(0, this.mainCount);
    var firstTry = main.filter(function (r) { return r && r.attempts === 1 && !r.revealed; }).length;
    var corrected = main.filter(function (r) { return r && r.attempts > 1 && !r.revealed; }).length;
    var praise = "";
    if (corrected) praise = T.praiseRetry;
    else if (this.a11y.hintsUsed) praise = T.praiseHint;
    else if (firstTry === this.mainCount) praise = T.praiseFocus;
    this.el.endPraise.textContent = praise;
    this.el.endPraise.hidden = !praise;

    // Resumen
    this.el.endStats.innerHTML = "";
    var stats = [
      [T.firstTry, firstTry + " " + T.of + " " + this.mainCount],
      [T.withHelp, String(this.mainCount - firstTry)],
      [T.time, this.clock(time)]
    ];
    var self = this;
    stats.forEach(function (st) {
      var box = el("div", "game-stat");
      box.appendChild(el("span", "game-stat__value", st[1]));
      box.appendChild(el("span", "game-stat__label", st[0]));
      self.el.endStats.appendChild(box);
    });

    // Lo que dominó y lo que debe reforzar, con la pista concreta de cada reto fallado.
    var nice = function (skill) { return self.skillName(skill); };
    var masteredSkills = [], improve = [];
    main.forEach(function (r) {
      if (!r) return;
      var name = nice(r.skill);
      if (r.failed) {
        var tip = r.hint ? name + ": " + r.hint : name;
        if (tip && improve.indexOf(tip) === -1) improve.push(tip);
      }
    });
    main.forEach(function (r) {
      if (!r || r.failed) return;
      var name = nice(r.skill);
      var alsoFailed = improve.some(function (t) { return t.indexOf(name) === 0; });
      if (name && !alsoFailed && masteredSkills.indexOf(name) === -1) masteredSkills.push(name);
    });
    this.fillList(this.el.endMastered, masteredSkills, "");
    this.fillList(this.el.endImprove, improve, T.nothingToImprove);

    var passed = score >= 60;
    this.el.btnNext.hidden = !passed || this.level >= this.maxLevel;
    (passed && !this.el.btnNext.hidden ? this.el.btnNext : this.el.btnRetry).focus();
    this.a11y.say(title + " " + praise);

    var payload = {
      game_id: this.slug,
      trastorno_id: this.trastornoId,
      level: this.level,
      score: score,
      time_spent: time,
      support_level: this.supportLevel(),
      completed: true,
      errors: this.errors,
      accessibility_settings_used: this.a11y.snapshot()
    };

    this.el.saveState.textContent = this.preview ? T.preview : T.saving;
    this.session.submit(payload).then(function (result) {
      if (result && result.saved) {
        self.el.saveState.textContent = T.saved;
        if (result.session_id) self.askFeeling(result.session_id);
      }
      else if (result && result.queued) self.el.saveState.textContent = T.queued;
      else if (result && result.rejected) self.el.saveState.textContent = T.rejected;
      else self.el.saveState.textContent = T.preview;
    });
  };

  /** Nombre legible de una habilidad; se guarda con cada error para el historial. */
  Engine.prototype.skillName = function (skill) {
    if (!skill) return "";
    var labels = (this.activity && this.activity.skillLabels) || {};
    if (labels[skill]) return labels[skill];
    var t = String(skill).replace(/[_-]+/g, " ");
    return t.charAt(0).toUpperCase() + t.slice(1);
  };

  /** Autoevaluación al terminar: «¿Cómo te sentiste?». Es opcional. */
  Engine.prototype.askFeeling = function (sessionId) {
    var box = document.getElementById("endFeeling");
    var base = this.shell.getAttribute("data-feeling-url");
    if (!box || !base) return;
    var url = base.replace(/\/0\/feeling$/, "/" + sessionId + "/feeling");
    var state = document.getElementById("feelingState");
    var buttons = Array.prototype.slice.call(box.querySelectorAll("[data-feeling]"));
    var token = (document.querySelector('meta[name="csrf-token"]') || {}).content || "";
    state.textContent = "";
    buttons.forEach(function (b) {
      b.setAttribute("aria-pressed", "false");
      b.onclick = function () {
        var headers = { "Content-Type": "application/json" };
        if (token) headers["X-CSRFToken"] = token;
        fetch(url, { method: "POST", headers: headers, credentials: "same-origin", body: JSON.stringify({ feeling: b.getAttribute("data-feeling") }) })
          .then(function (r) {
            if (!r.ok) throw new Error("HTTP " + r.status);
            buttons.forEach(function (o) { o.setAttribute("aria-pressed", o === b ? "true" : "false"); });
            state.textContent = T.feelingThanks;
          })
          .catch(function () { state.textContent = T.feelingError; });
      };
    });
    box.hidden = false;
  };

  Engine.prototype.fillList = function (box, items, emptyText) {
    if (!box) return;
    var list = box.querySelector("ul");
    list.innerHTML = "";
    items.forEach(function (t) { list.appendChild(el("li", null, t)); });
    if (!items.length && emptyText) list.appendChild(el("li", "is-empty", emptyText));
    box.hidden = !items.length && !emptyText;
  };

  // ─── Utilidades compartidas por los juegos ────────────────────────────────
  var util = {
    rnd: function (a, b) { return Math.floor(Math.random() * (b - a + 1)) + a; },
    pick: function (list) { return list[Math.floor(Math.random() * list.length)]; },
    shuffle: function (list) {
      var a = list.slice();
      for (var i = a.length - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1)), t = a[i]; a[i] = a[j]; a[j] = t;
      }
      return a;
    },
    /** Valor que crece con el reto (step 0..4) entre a y b. */
    grow: function (a, b, step) { return Math.round(a + (b - a) * Math.max(0, Math.min(4, step)) / 4); },
    /** Miles con punto, como se escribe en Colombia: 12500 → "12.500". */
    miles: function (n) {
      var neg = n < 0, s = String(Math.abs(Math.round(n)));
      return (neg ? "−" : "") + s.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    },
    /**
     * Texto que sigue a «:» o va dentro de una frase. En español va todo en
     * minúscula; en inglés solo la primera letra, y «I» se respeta.
     */
    lower: function (t) {
      t = String(t);
      var html = global.document && global.document.documentElement;
      if (!(html && /^en/.test(html.lang || ""))) return t.toLowerCase();
      return /^I\b/.test(t) ? t : t.charAt(0).toLowerCase() + t.slice(1);
    },
    cop: function (n) { return "$" + util.miles(n); },
    copAria: function (n) { return util.miles(n).replace(/\./g, "") + " pesos"; },
    /**
     * Opciones numéricas: la respuesta, los distractores dados (errores
     * típicos) y relleno cercano si faltan. fmt(v) → { label, aria }.
     */
    choices: function (answer, distractors, n, fmt, min) {
      var out = [answer];
      util.shuffle(distractors).forEach(function (c) {
        if (out.length < n && out.indexOf(c) === -1 && (min === undefined || c >= min)) out.push(c);
      });
      var guard = 0, spread = Math.max(1, Math.round(Math.abs(answer) * 0.1));
      while (out.length < n && guard++ < 100) {
        var c = answer + util.rnd(1, 3) * spread * (Math.random() < 0.5 ? -1 : 1);
        if (out.indexOf(c) === -1 && (min === undefined || c >= min)) out.push(c);
      }
      return util.shuffle(out).map(function (v) {
        var f = fmt ? fmt(v) : { label: String(v), aria: String(v) };
        return { label: f.label, value: v, aria: f.aria };
      });
    },
    textChoices: function (answer, others, n) {
      var out = [answer];
      util.shuffle(others).forEach(function (c) { if (out.length < n && out.indexOf(c) === -1) out.push(c); });
      return util.shuffle(out).map(function (v) { return { label: v, value: v, aria: plain(v) }; });
    }
  };

  // ─── Traducción del contenido de los juegos ───────────────────────────────
  // Cada juego envuelve sus textos con tr("…"). En inglés se busca el texto
  // en el diccionario del juego (<juego>/en.json), que la página inserta en
  // #gameDict. Lo que se practica en español no está en el diccionario y se
  // queda igual.
  var dictionary = null;
  function tr(text) {
    if (typeof text !== "string") return text;
    if (dictionary === null) {
      dictionary = {};
      var node = document.getElementById("gameDict");
      if (node) { try { dictionary = JSON.parse(node.textContent) || {}; } catch (e) { dictionary = {}; } }
    }
    return Object.prototype.hasOwnProperty.call(dictionary, text) ? dictionary[text] : text;
  }

  global.IndecapGame = {
    tr: tr,
    util: util,
    definition: null,
    resolveActivity: resolveActivity,
    describeAnswer: describeAnswer,
    starsFor: starsFor,
    register: function (definition) {
      this.definition = definition;
      var boot = function () {
        if (document.querySelector(".game-shell")) new Engine(definition);
      };
      if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
      else boot();
    }
  };
})(window);
