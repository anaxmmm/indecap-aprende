/**
 * accessible-reader.js
 * ---------------------
 * Funcionalidad real del módulo inclusivo para indecap-aprende:
 *
 * 1) Lectura en voz alta con resaltado de la palabra exacta que se está
 *    leyendo ("efecto karaoke"), usando la Web Speech API del navegador.
 *    Pensado principalmente para dislexia y baja visión, pero disponible
 *    para cualquier estudiante (principio DUA: una sola experiencia,
 *    varias formas de acceder a ella).
 *
 * 2) Control de tamaño de texto (+ / -), sin recargar la página.
 *
 * 3) "Modo un paso a la vez": divide el contenido en bloques y muestra
 *    uno solo, con navegación explícita — pensado para TDAH (reduce
 *    distracción) y para trastorno opositor desafiante (el estudiante
 *    controla el avance, nadie se lo impone).
 *
 * No requiere ninguna librería externa ni cambios en el backend: toda
 * la lógica corre en el navegador sobre el HTML que ya se sirve.
 */

class AccessibleReader {
  constructor(containerEl) {
    this.container = containerEl;
    this.utterance = null;
    this.words = [];
    this._wrapWords();
  }

  /** Envuelve cada palabra del contenido en un <span> para poder resaltarla. */
  _wrapWords() {
    const walker = document.createTreeWalker(this.container, NodeFilter.SHOW_TEXT);
    const textNodes = [];
    let node;
    while ((node = walker.nextNode())) {
      if (node.textContent.trim().length > 0) textNodes.push(node);
    }

    textNodes.forEach((textNode) => {
      const frag = document.createDocumentFragment();
      const parts = textNode.textContent.split(/(\s+)/); // conserva espacios
      parts.forEach((part) => {
        if (part.trim().length === 0) {
          frag.appendChild(document.createTextNode(part));
        } else {
          const span = document.createElement("span");
          span.className = "reader-word";
          span.textContent = part;
          frag.appendChild(span);
          this.words.push(span);
        }
      });
      textNode.parentNode.replaceChild(frag, textNode);
    });
  }

  /** Inicia (o reinicia) la lectura en voz alta con resaltado sincronizado. */
  play() {
    if (!("speechSynthesis" in window)) {
      alert(
        "Tu navegador no soporta lectura en voz alta. Prueba con Chrome o Edge actualizados."
      );
      return;
    }
    this.stop(); // evita lecturas superpuestas

    const fullText = this.container.textContent;
    this.utterance = new SpeechSynthesisUtterance(fullText);
    this.utterance.lang = "es-ES";
    this.utterance.rate = 0.95; // ligeramente más lento que el default

    // Mapa de posición de carácter -> índice de palabra, para ubicar
    // rápidamente qué <span> resaltar en cada evento "boundary".
    let charOffset = 0;
    const boundaries = this.words.map((span) => {
      const start = fullText.indexOf(span.textContent, charOffset);
      charOffset = start + span.textContent.length;
      return { start, end: charOffset, span };
    });

    this.utterance.onboundary = (event) => {
      if (event.name !== "word") return;
      const match = boundaries.find(
        (b) => event.charIndex >= b.start && event.charIndex < b.end
      );
      this._clearHighlight();
      if (match) {
        match.span.classList.add("reader-word--active");
        match.span.scrollIntoView({ block: "nearest", behavior: "smooth" });
      }
    };

    this.utterance.onend = () => this._clearHighlight();

    window.speechSynthesis.speak(this.utterance);
  }

  pause() {
    if (window.speechSynthesis.speaking) window.speechSynthesis.pause();
  }

  resume() {
    if (window.speechSynthesis.paused) window.speechSynthesis.resume();
  }

  stop() {
    window.speechSynthesis.cancel();
    this._clearHighlight();
  }

  _clearHighlight() {
    this.words.forEach((w) => w.classList.remove("reader-word--active"));
  }
}

/** Control de tamaño de texto, aplicado como variable CSS sobre <html>. */
class TextSizeControl {
  constructor(min = 90, max = 160, step = 10) {
    this.min = min;
    this.max = max;
    this.step = step;
    this.current = parseInt(
      getComputedStyle(document.documentElement).getPropertyValue("--reader-font-scale") || "100",
      10
    );
  }

  increase() {
    this.current = Math.min(this.max, this.current + this.step);
    this._apply();
  }

  decrease() {
    this.current = Math.max(this.min, this.current - this.step);
    this._apply();
  }

  _apply() {
    document.documentElement.style.setProperty("--reader-font-scale", `${this.current}%`);
  }
}

/**
 * Modo un-paso-a-la-vez: divide un contenedor en bloques (por párrafo)
 * y muestra uno solo. El estudiante avanza cuando quiere, nunca por
 * temporizador automático.
 */
class StepMode {
  constructor(containerEl, blockSelector = "p") {
    this.container = containerEl;
    this.blocks = Array.from(containerEl.querySelectorAll(blockSelector));
    this.currentIndex = 0;
  }

  enable() {
    this.container.classList.add("step-mode-active");
    this._render();
  }

  disable() {
    this.container.classList.remove("step-mode-active");
    this.blocks.forEach((b) => (b.style.display = ""));
  }

  next() {
    if (this.currentIndex < this.blocks.length - 1) {
      this.currentIndex += 1;
      this._render();
    }
  }

  previous() {
    if (this.currentIndex > 0) {
      this.currentIndex -= 1;
      this._render();
    }
  }

  _render() {
    this.blocks.forEach((block, i) => {
      block.style.display = i === this.currentIndex ? "" : "none";
    });
  }

  get progressLabel() {
    return `Paso ${this.currentIndex + 1} de ${this.blocks.length}`;
  }
}

// Exponer globalmente para uso directo desde las plantillas Jinja
window.AccessibleReader = AccessibleReader;
window.TextSizeControl = TextSizeControl;
window.StepMode = StepMode;
