/**
 * Motor común de los juegos de indecap-aprende (v2).
 *
 * Cada juego entrega una definición de niveles y una función que construye
 * un reto. El motor se encarga del ciclo intro → retos → cierre, del HUD, del
 * temporizador, del registro de errores, del apoyo escalonado y del envío de
 * métricas.
 *
 * Tipos de reto:
 *  - Opción múltiple: el reto trae `options` y `answer`.
 *  - Mecánica propia: el reto trae `mount(host, api)`, que dibuja su propia
 *    interfaz dentro de `host`, devuelve una función de limpieza y avisa con
 *    `api.done({...})` cuando termina.
 *
 * NUEVO — Repaso de errores al cierre de nivel:
 * Si el estudiante falla al menos una ronda, al terminar todas las rondas del
 * nivel el motor genera automáticamente una ronda de repaso (con datos nuevos,
 * no la misma pregunta) por cada mecánica en la que falló, y las presenta
 * antes de cerrar el nivel. Si no hubo errores, el nivel cierra igual que
 * antes. Esto funciona para cualquier juego registrado, porque todos siguen
 * la misma convención: getLevel(level) → { rounds, mechanics, params, intro }
 * y buildRound(cfg, index, ctx) que elige la mecánica con
 * cfg.mechanics[index % cfg.mechanics.length].
 */
(function (global) {
  "use strict";

  var FRASES_ACIERTO = [
    "¡Correcto!", "¡Muy bien!", "¡Eso es!", "¡Lo lograste!", "¡Excelente!"
  ];
  var FRASES_REINTENTO = [
    "Casi. Inténtalo otra vez.",
    "Todavía no. Mira de nuevo con calma.",
    "Prueba otra opción, no pasa nada."
  ];

  function pick(list) {
    return list[Math.floor(Math.random() * list.length)];
  }

  function fmtStars(n) {
    return String(Math.round(n * 10) / 10);
  }

  function Engine(definition) {
    this.def = definition;
    this.shell = document.querySelector(".game-shell");
    if (!this.shell) return;

    var data = this.shell.dataset;
    this.slug = data.gameSlug;
    this.gameName = data.gameName;
    this.level = parseInt(data.level, 10) || 1;
    this.maxLevel = parseInt(data.maxLevel, 10) || 10;
    this.trastornoId = data.trastornoId ? parseInt(data.trastornoId, 10) : null;
    this.preview = data.preview === "1";

    var profile = {};
    try { profile = JSON.parse(data.a11y || "{}"); } catch (e) { profile = {}; }
    this.profile = profile;

    this.a11y = new global.IndecapA11y(this.shell, profile);
    this.session = new global.IndecapSession({
      url: data.submitUrl,
      csrfToken: (document.querySelector('meta[name="csrf-token"]') || {}).content || null,
      preview: this.preview
    });

    this.el = {
      stage: document.getElementById("gameStage"),
      screenIntro: document.getElementById("screenIntro"),
      screenPlay: document.getElementById("screenPlay"),
      screenEnd: document.getElementById("screenEnd"),
      introText: document.getElementById("introText"),
      endText: document.getElementById("endText"),
      prompt: document.getElementById("prompt"),
      visual: document.getElementById("visual"),
      options: document.getElementById("options"),
      feedback: document.getElementById("feedback"),
      hint: document.getElementById("hintText"),
      saveState: document.getElementById("saveState"),
      hudLevel: document.getElementById("hudLevel"),
      hudRound: document.getElementById("hudRound"),
      hudStars: document.getElementById("hudStars"),
      hudTimer: document.getElementById("hudTimer"),
      progressBar: document.getElementById("progressBar"),
      btnStart: document.getElementById("btnStart"),
      btnRetry: document.getElementById("btnRetry"),
      btnNext: document.getElementById("btnNext")
    };

    this.cleanupFn = null;
    this.roundClosed = false;

    this.bind();
    this.prepareLevel();
  }

  /** Nivel de apoyo: 1 guiado, 2 parcial, 3 independiente. */
  Engine.prototype.supportLevel = function () {
    var base = this.profile.autonomy_level || 1;
    return Math.max(1, Math.min(3, base));
  };

  Engine.prototype.bind = function () {
    var self = this;
    this.el.btnStart.addEventListener("click", function () { self.start(); });
    this.el.btnRetry.addEventListener("click", function () { self.goToLevel(self.level); });
    this.el.btnNext.addEventListener("click", function () {
      self.goToLevel(Math.min(self.maxLevel, self.level + 1));
    });

    this.a11y.onHint = function () { self.showHint(true); };

    // Navegación por teclado entre opciones: requisito de accesibilidad para
    // estudiantes que no usan mouse ni pantalla táctil.
    this.el.options.addEventListener("keydown", function (event) {
      var keys = ["ArrowRight", "ArrowLeft", "ArrowDown", "ArrowUp"];
      if (keys.indexOf(event.key) === -1) return;
      event.preventDefault();
      var botones = Array.prototype.slice.call(
        self.el.options.querySelectorAll(".game-option:not(:disabled)")
      );
      if (!botones.length) return;
      var actual = botones.indexOf(document.activeElement);
      var paso = (event.key === "ArrowRight" || event.key === "ArrowDown") ? 1 : -1;
      var siguiente = (actual + paso + botones.length) % botones.length;
      botones[siguiente].focus();
    });
  };

  Engine.prototype.goToLevel = function (level) {
    var url = new URL(global.location.href);
    url.pathname = url.pathname.replace(/\/nivel\/\d+$/, "");
    global.location.href = url.pathname + "/nivel/" + level + url.search;
  };

  Engine.prototype.prepareLevel = function () {
    this.config = this.def.getLevel(this.level);
    var ctx = { support: this.supportLevel() };
    this.ctx = ctx;

    // Se guarda, para cada ronda, qué mecánica la generó (misma convención
    // que usan todos los juegos: cfg.mechanics[index % cfg.mechanics.length]).
    // Esto permite, si el estudiante falla, regenerar después una ronda nueva
    // de esa misma mecánica para el repaso final, sin que cada juego tenga
    // que implementar nada adicional.
    this.roundMechanics = [];
    this.rounds = [];
    for (var i = 0; i < this.config.rounds; i++) {
      var mech = (this.config.mechanics && this.config.mechanics.length)
        ? this.config.mechanics[i % this.config.mechanics.length]
        : null;
      this.roundMechanics.push(mech);
      this.rounds.push(this.def.buildRound(this.config, i, ctx));
    }

    this.index = 0;
    this.stars = 0;
    this.errors = [];
    this.attemptsInRound = 0;
    this.startedAt = null;

    this.inCorrection = false;
    this.failedMechanics = [];
    this.correctionStartIndex = null;
    this.correctionTotal = 0;

    this.el.hudLevel.textContent = this.level;
    this.el.introText.textContent = this.config.intro;
    this.showScreen("screenIntro");
    this.a11y.say(this.config.intro);
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
      var s = self.elapsed();
      var min = Math.floor(s / 60);
      var sec = String(s % 60).padStart(2, "0");
      self.el.hudTimer.textContent = "⏱ " + min + ":" + sec;
    }, 1000);
  };

  Engine.prototype.elapsed = function () {
    return this.startedAt ? Math.round((Date.now() - this.startedAt) / 1000) : 0;
  };

  /** Detiene temporizadores y escuchas del reto personalizado anterior. */
  Engine.prototype.runCleanup = function () {
    if (typeof this.cleanupFn === "function") {
      try { this.cleanupFn(); } catch (e) { /* la limpieza nunca debe bloquear el juego */ }
    }
    this.cleanupFn = null;
  };

  Engine.prototype.renderRound = function () {
    var round = this.rounds[this.index];
    this.runCleanup();
    this.attemptsInRound = 0;
    this.roundClosed = false;

    if (this.inCorrection) {
      var ci = this.index - this.correctionStartIndex + 1;
      this.el.hudRound.textContent = "Repaso " + ci + "/" + this.correctionTotal;
    } else {
      this.el.hudRound.textContent = (this.index + 1) + "/" + this.rounds.length;
    }
    this.el.progressBar.style.width = ((this.index / this.rounds.length) * 100) + "%";
    this.el.feedback.textContent = "";
    this.el.feedback.className = "game-feedback";
    this.el.hint.hidden = true;

    this.el.prompt.textContent = round.prompt;
    this.el.visual.innerHTML = round.visual || "";
    this.el.options.innerHTML = "";

    var self = this;
    if (typeof round.mount === "function") {
      this.mountCustom(round);
    } else {
      round.options.forEach(function (option) {
        var btn = document.createElement("button");
        btn.type = "button";
        btn.className = "game-option";
        btn.innerHTML = option.label +
          (option.caption ? '<span class="game-option__caption">' + option.caption + "</span>" : "");
        btn.setAttribute("aria-label", option.aria || option.plain || option.label);
        btn.dataset.value = String(option.value);
        btn.addEventListener("click", function () { self.answer(btn, option, round); });
        self.el.options.appendChild(btn);
      });
    }

    this.a11y.say(round.speech || round.prompt);

    // En modo guiado la pista aparece sola: el estudiante no debe tener que
    // pedirla para poder avanzar.
    if (this.supportLevel() === 1 && round.hint) {
      this.showHint(false);
    }
  };

  /** Monta un reto con mecánica propia y le entrega la API del motor. */
  Engine.prototype.mountCustom = function (round) {
    var self = this;
    var token = this.index;

    var api = {
      say: function (text, force) { self.a11y.say(text, force); },
      hint: function () { self.showHint(false); },
      setPrompt: function (text) { self.el.prompt.textContent = text; },
      setVisual: function (html) { self.el.visual.innerHTML = html; },
      feedback: function (text, kind) {
        self.el.feedback.textContent = text || "";
        self.el.feedback.className = "game-feedback" + (kind ? " is-" + kind : "");
      },
      /**
       * Cierra el reto. result = { stars: 0..1, message, error, delay }
       * `error` es un objeto opcional con las métricas del reto; el motor le
       * añade el número de reto y la habilidad.
       */
      done: function (result) {
        if (self.roundClosed || token !== self.index) return;
        self.roundClosed = true;
        result = result || {};

        var stars = Math.max(0, Math.min(1, Number(result.stars) || 0));
        self.stars += stars;
        self.el.hudStars.textContent = fmtStars(self.stars);

        if (result.error && typeof result.error === "object") {
          var registro = { round: self.index + 1, skill: round.skill };
          Object.keys(result.error).forEach(function (k) { registro[k] = result.error[k]; });
          self.errors.push(registro);
          self.markMechanicFailed(token);
        }

        var msg = result.message || "¡Reto completado!";
        self.el.feedback.textContent = (stars >= 0.75 ? "✓ " : "") + msg;
        self.el.feedback.className = "game-feedback " + (stars >= 0.75 ? "is-ok" : "is-retry");
        self.a11y.say(msg);

        var espera = result.delay || 1800;
        setTimeout(function () {
          if (token === self.index) self.nextRound();
        }, espera);
      }
    };

    this.cleanupFn = round.mount(this.el.options, api) || null;
  };

  Engine.prototype.showHint = function (spoken) {
    var round = this.rounds[this.index];
    if (!round || !round.hint) return;
    this.el.hint.textContent = "💡 " + round.hint;
    this.el.hint.hidden = false;
    if (spoken) this.a11y.say(round.hint, true);
  };

  /** Anota que la mecánica de la ronda `idx` necesita repaso al cerrar el nivel. */
  Engine.prototype.markMechanicFailed = function (idx) {
    if (this.inCorrection) return; // el repaso no genera repasos de sí mismo
    var mech = this.roundMechanics[idx];
    if (mech && this.failedMechanics.indexOf(mech) === -1) {
      this.failedMechanics.push(mech);
    }
  };

  Engine.prototype.answer = function (button, option, round) {
    this.attemptsInRound += 1;
    var correcto = String(option.value) === String(round.answer);

    if (correcto) {
      button.classList.add("is-correct");
      this.lockOptions();
      // Primer intento: estrella completa. Con reintentos, media estrella:
      // se reconoce el logro sin castigar el error.
      this.stars += this.attemptsInRound === 1 ? 1 : 0.5;
      this.el.hudStars.textContent = fmtStars(this.stars);

      var frase = pick(FRASES_ACIERTO);
      this.el.feedback.textContent = "✓ " + frase + (round.explain ? " " + round.explain : "");
      this.el.feedback.className = "game-feedback is-ok";
      this.a11y.say(frase + (round.explain ? ". " + round.explain : ""));

      var self = this;
      setTimeout(function () { self.nextRound(); }, this.profile.reduce_motion ? 700 : 1500);
    } else {
      button.classList.add("is-wrong");
      button.disabled = true;
      this.errors.push({
        round: this.index + 1,
        skill: round.skill,
        expected: round.answer,
        given: option.value,
        attempts: this.attemptsInRound
      });
      this.markMechanicFailed(this.index);

      var msg = pick(FRASES_REINTENTO);
      this.el.feedback.textContent = msg;
      this.el.feedback.className = "game-feedback is-retry";
      this.a11y.say(msg);

      // Tras dos intentos la pista aparece sola, en cualquier nivel de apoyo.
      if (this.attemptsInRound >= 2) this.showHint(false);

      // Tras tres intentos se revela la respuesta para evitar el bloqueo y la
      // desmotivación, y se avanza.
      if (this.attemptsInRound >= 3) this.reveal(round);
    }
  };

  Engine.prototype.reveal = function (round) {
    var self = this;
    var botones = this.el.options.querySelectorAll(".game-option");
    Array.prototype.forEach.call(botones, function (btn) {
      if (btn.dataset.value === String(round.answer)) btn.classList.add("is-correct");
      btn.disabled = true;
    });
    var texto = "La respuesta era " + (round.answerLabel || round.answer) + ". " + (round.explain || "");
    this.el.feedback.textContent = texto;
    this.el.feedback.className = "game-feedback is-retry";
    this.a11y.say(texto);
    setTimeout(function () { self.nextRound(); }, 2400);
  };

  Engine.prototype.lockOptions = function () {
    Array.prototype.forEach.call(
      this.el.options.querySelectorAll(".game-option"),
      function (btn) { btn.disabled = true; }
    );
  };

  Engine.prototype.nextRound = function () {
    this.index += 1;
    if (this.index >= this.rounds.length) {
      if (!this.inCorrection && this.failedMechanics.length) {
        this.startCorrection();
      } else {
        this.finish();
      }
    } else {
      this.renderRound();
    }
  };

  /**
   * Genera y encadena rondas de repaso, una por cada mecánica en la que el
   * estudiante falló durante el nivel. Se construyen con el mismo
   * buildRound(cfg, index, ctx) del juego, así que traen datos nuevos (no la
   * pregunta exacta que falló) pero de la misma habilidad.
   */
  Engine.prototype.startCorrection = function () {
    var self = this;
    this.inCorrection = true;

    var mechs = this.failedMechanics.slice();
    var correctionCfg = Object.assign({}, this.config, { mechanics: mechs });
    this.correctionStartIndex = this.rounds.length;
    this.correctionTotal = mechs.length;

    mechs.forEach(function (m, i) {
      var r = self.def.buildRound(correctionCfg, i, self.ctx);
      var basePrompt = r.prompt || "";
      r.prompt = "🔁 Repasemos: " + basePrompt;
      r.speech = "Repasemos. " + (r.speech || basePrompt);
      self.roundMechanics.push(m);
      self.rounds.push(r);
    });

    this.el.feedback.textContent = "";
    this.el.prompt.textContent = "";
    this.el.visual.innerHTML = "";
    this.el.options.innerHTML = "";

    var msg = mechs.length === 1
      ? "Antes de terminar, repasemos una actividad más."
      : "Antes de terminar, repasemos " + mechs.length + " actividades más.";
    this.el.prompt.textContent = msg;
    this.a11y.say(msg, true);

    setTimeout(function () { self.renderRound(); }, 1400);
  };

  Engine.prototype.finish = function () {
    clearInterval(this.timer);
    this.runCleanup();
    this.a11y.stop();

    var score = Math.round((this.stars / this.rounds.length) * 100);
    this.el.progressBar.style.width = "100%";
    this.showScreen("screenEnd");

    var estrellas = fmtStars(this.stars);
    var mensaje;
    if (score >= 80) {
      mensaje = "¡Misión completada! Dominaste este nivel con " + estrellas + " estrellas.";
    } else if (score >= 60) {
      mensaje = "¡Nivel superado! Conseguiste " + estrellas + " estrellas y puedes seguir adelante.";
    } else {
      mensaje = "Buen esfuerzo. Repite este nivel para afianzarlo; cada intento cuenta.";
    }
    this.el.endText.textContent = mensaje;
    this.a11y.say(mensaje);

    this.el.btnNext.hidden = score < 60 || this.level >= this.maxLevel;

    var payload = {
      game_id: this.slug,
      trastorno_id: this.trastornoId,
      level: this.level,
      score: score,
      time_spent: this.elapsed(),
      support_level: this.supportLevel(),
      completed: true,
      errors: this.errors,
      accessibility_settings_used: this.a11y.snapshot()
    };

    var self = this;
    this.el.saveState.textContent = "Guardando tu progreso…";
    this.session.submit(payload).then(function (result) {
      if (result && result.saved) {
        self.el.saveState.textContent = "Progreso guardado.";
      } else if (result && result.queued) {
        self.el.saveState.textContent =
          "Sin conexión. Tu progreso quedó guardado en este dispositivo y se enviará solo al reconectar.";
      } else {
        self.el.saveState.textContent = "Modo vista previa: no se guardó progreso.";
      }
    });
  };

  global.IndecapGame = {
    register: function (definition) {
      if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", function () { new Engine(definition); });
      } else {
        new Engine(definition);
      }
    }
  };
})(window);
