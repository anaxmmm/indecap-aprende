/**
 * Capa de accesibilidad compartida por todos los juegos.
 * Lee el perfil del estudiante servido por Flask y lo aplica al arrancar,
 * de modo que el estudiante no tenga que reconfigurar nada en cada partida.
 */
(function (global) {
  "use strict";

  function A11y(shell, profile) {
    this.shell = shell;
    this.profile = profile || {};
    this.speechOn = this.profile.audio_feedback !== false;
    this.scale = (this.profile.text_size_percent || 100) / 100;
    this.hintsUsed = 0;
    this.speechSupported = "speechSynthesis" in global;
    this.onHint = null;

    this.applyProfile();
    this.bindControls();
  }

  A11y.prototype.applyProfile = function () {
    var s = this.shell;
    s.style.setProperty("--g-scale", this.scale.toFixed(2));

    if (this.profile.contrast_mode === "alto_contraste") {
      s.classList.add("is-high-contrast");
      this.setPressed("contrast", true);
    }
    if (this.profile.reduce_motion) {
      s.classList.add("is-reduced-motion");
      this.setPressed("motion", true);
    }
    if (this.profile.font_preference === "legible_dislexia") {
      s.classList.add("is-legible-font");
    }
    if (this.profile.line_spacing_percent && this.profile.line_spacing_percent !== 100) {
      s.style.lineHeight = (this.profile.line_spacing_percent / 100 * 1.6).toFixed(2);
    }
    this.setPressed("speak", this.speechOn && this.speechSupported);

    if (!this.speechSupported) {
      var btn = this.button("speak");
      if (btn) {
        btn.disabled = true;
        btn.title = "Este navegador no permite leer en voz alta.";
      }
    }
  };

  A11y.prototype.button = function (action) {
    return this.shell.querySelector('[data-a11y-action="' + action + '"]');
  };

  A11y.prototype.setPressed = function (action, value) {
    var btn = this.button(action);
    if (btn) btn.setAttribute("aria-pressed", value ? "true" : "false");
  };

  A11y.prototype.bindControls = function () {
    var self = this;
    var bar = this.shell.querySelector(".game-a11y-bar");
    if (!bar) return;

    bar.addEventListener("click", function (event) {
      var btn = event.target.closest("[data-a11y-action]");
      if (!btn || btn.disabled) return;
      var action = btn.getAttribute("data-a11y-action");

      if (action === "speak") {
        self.speechOn = !self.speechOn;
        self.setPressed("speak", self.speechOn);
        if (!self.speechOn) self.stop();
      } else if (action === "contrast") {
        var hc = self.shell.classList.toggle("is-high-contrast");
        self.setPressed("contrast", hc);
      } else if (action === "motion") {
        var rm = self.shell.classList.toggle("is-reduced-motion");
        self.setPressed("motion", rm);
      } else if (action === "text-bigger") {
        self.scale = Math.min(1.8, self.scale + 0.15);
        self.shell.style.setProperty("--g-scale", self.scale.toFixed(2));
      } else if (action === "text-smaller") {
        self.scale = Math.max(0.85, self.scale - 0.15);
        self.shell.style.setProperty("--g-scale", self.scale.toFixed(2));
      } else if (action === "hint") {
        self.hintsUsed += 1;
        if (typeof self.onHint === "function") self.onHint();
      }
    });
  };

  /** Lee un texto en voz alta si el estudiante tiene el audio activo. */
  A11y.prototype.say = function (text, force) {
    if (!this.speechSupported) return;
    if (!this.speechOn && !force) return;
    if (!text) return;
    try {
      global.speechSynthesis.cancel();
      var u = new SpeechSynthesisUtterance(String(text));
      u.lang = "es-CO";
      u.rate = 0.92;             // ritmo pausado, no infantilizado
      global.speechSynthesis.speak(u);
    } catch (e) {
      /* La síntesis de voz nunca debe bloquear el juego. */
    }
  };

  A11y.prototype.stop = function () {
    if (this.speechSupported) {
      try { global.speechSynthesis.cancel(); } catch (e) {}
    }
  };

  /** Snapshot de los ajustes realmente usados, para las métricas. */
  A11y.prototype.snapshot = function () {
    return {
      tts: !!this.speechOn,
      high_contrast: this.shell.classList.contains("is-high-contrast"),
      reduce_motion: this.shell.classList.contains("is-reduced-motion"),
      legible_font: this.shell.classList.contains("is-legible-font"),
      text_scale: Number(this.scale.toFixed(2)),
      hints_used: this.hintsUsed
    };
  };

  global.IndecapA11y = A11y;
})(window);