/**
 * CLASIFICADOR DE RUTINAS — Discapacidad cognitiva
 *
 * Habilidad núcleo: generalización funcional y secuencias de pasos simples.
 *  - Clasificación por un solo criterio ...... corteza prefrontal
 *  - Memoria visual simple ................... hipocampo
 *  - Rutinas y tareas en secuencia ........... prefrontal + ganglios basales
 *
 * Principios de diseño:
 *  - Un solo criterio por pantalla y sin distractores complejos.
 *  - Sin límite de tiempo en ningún reto.
 *  - Apoyo escalonado: en modo guiado el paso siguiente se resalta solo; en
 *    parcial se resalta tras el primer error; en independiente no se resalta.
 *  - Nivel 9: retirada gradual de ayudas dentro del mismo nivel (scaffolding).
 *  - Nivel 10: evaluación embebida, mezcla las mecánicas anteriores.
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

  function scheduler() {
    var alive = true, timers = [];
    return {
      later: function (fn, ms) {
        timers.push(setTimeout(function () { if (alive) fn(); }, ms));
      },
      stop: function () {
        alive = false;
        timers.forEach(clearTimeout);
      }
    };
  }

  /** Opciones de texto: la respuesta correcta más n-1 distractores, mezcladas. */
  function textOptions(ok, bads, n) {
    var list = [ok].concat(shuffle(bads).slice(0, n - 1));
    return shuffle(list).map(function (t) {
      return { label: t, value: t, aria: t };
    });
  }

  var STYLE_ID = "cognitiva-rutinas-styles";
  function injectStyles() {
    if (document.getElementById(STYLE_ID)) return;
    var css = [
      ".game-shell .game-options .game-option{font-size:1.15rem}",
      ".cog-big{font-size:5rem;line-height:1}",
      ".cog-emoji{font-size:2.6rem;line-height:1}",
      ".cog-status{flex-basis:100%;font-weight:600;color:var(--g-muted);margin-bottom:8px}",
      ".cog-list{flex-basis:100%;list-style:none;margin:0 auto 12px;padding:0;max-width:480px;text-align:left}",
      ".cog-list li{background:var(--g-ok-soft);border:2px solid var(--g-ok);color:var(--g-ok);border-radius:12px;padding:10px 14px;margin-bottom:8px;font-weight:600}",
      ".cog-steps{flex-basis:100%;display:flex;flex-wrap:wrap;gap:12px;justify-content:center}",
      ".game-option.cog-step{display:flex;flex-direction:column;align-items:center;gap:6px;font-size:1rem;min-width:150px;max-width:220px}",
      ".cog-step-icon{font-size:2.2rem;line-height:1}",
      ".game-option.cog-next{outline:4px solid var(--g-accent);outline-offset:3px}",
      ".cog-grid{flex-basis:100%;width:100%;max-width:420px;margin:0 auto;display:grid;grid-template-columns:repeat(var(--cols,3),minmax(84px,1fr));gap:12px}",
      ".game-option.cog-card{font-size:2.6rem;min-height:84px;padding:8px}"
    ].join("\n");
    var style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = css;
    document.head.appendChild(style);
  }
  injectStyles();

  // ─── Datos ────────────────────────────────────────────────────────────────

  var CATS = {
    animal: { label: "Animal", items: [["🐶", "perro"], ["🐱", "gato"], ["🐮", "vaca"], ["🐔", "gallina"], ["🐟", "pez"]] },
    comida: { label: "Comida", items: [["🍎", "manzana"], ["🍌", "banano"], ["🍞", "pan"], ["🥛", "leche"], ["🍕", "pizza"]] },
    ropa: { label: "Ropa", items: [["👕", "camiseta"], ["🧦", "medias"], ["👟", "zapato"], ["🧢", "gorra"]] },
    transporte: { label: "Transporte", items: [["🚗", "carro"], ["🚌", "bus"], ["🚲", "bicicleta"], ["✈️", "avión"]] }
  };

  var ALL = [];
  Object.keys(CATS).forEach(function (k) { ALL = ALL.concat(CATS[k].items); });

  var FUNCIONES = [
    { icon: "☂️", name: "paraguas", ok: "Para protegerme de la lluvia", bad: ["Para cortar papel", "Para escuchar música", "Para dormir"] },
    { icon: "🪥", name: "cepillo de dientes", ok: "Para limpiar los dientes", bad: ["Para peinarme", "Para escribir", "Para tomar agua"] },
    { icon: "🔑", name: "llave", ok: "Para abrir una puerta", bad: ["Para cocinar", "Para pintar", "Para medir el tiempo"] },
    { icon: "🧤", name: "guantes", ok: "Para cuidar las manos del frío", bad: ["Para ver de lejos", "Para comer sopa", "Para escuchar"] },
    { icon: "⏰", name: "reloj despertador", ok: "Para despertarme a tiempo", bad: ["Para lavar la ropa", "Para cortar el pan", "Para secarme el pelo"] },
    { icon: "✏️", name: "lápiz", ok: "Para escribir y dibujar", bad: ["Para abrir latas", "Para barrer", "Para calentar comida"] },
    { icon: "🥄", name: "cuchara", ok: "Para comer sopa", bad: ["Para cortar el cabello", "Para secar el piso", "Para escribir"] }
  ];

  var CAUSAS = [
    { icon: "💡", accion: "tocas el interruptor de la luz", ok: "La luz se enciende", bad: ["Empieza a llover", "Suena una canción"] },
    { icon: "🚰", accion: "abres la llave del agua", ok: "Sale agua", bad: ["Se apaga la luz", "Aparece una flor"] },
    { icon: "🔔", accion: "presionas el timbre", ok: "El timbre suena", bad: ["Se abre la ventana", "Sale humo"] },
    { icon: "🧊", accion: "dejas un hielo al sol", ok: "El hielo se derrite", bad: ["El hielo crece", "El hielo canta"] },
    { icon: "🚦", accion: "el semáforo se pone en rojo", ok: "Los carros se detienen", bad: ["Los carros aceleran", "Los carros vuelan"] }
  ];

  var SOCIALES = [
    { icon: "😢", t: "Un compañero está llorando.", ok: "Le pregunto qué le pasa y lo acompaño", bad: ["Me voy a jugar sin decirle nada"] },
    { icon: "📚", t: "A tu compañera se le cayeron los cuadernos.", ok: "Le ayudo a recogerlos", bad: ["Me río y sigo caminando"] },
    { icon: "✏️", t: "Alguien te presta un lápiz.", ok: "Le digo gracias", bad: ["Me lo quedo sin decir nada"] },
    { icon: "👋", t: "Llegas a clase y ves a tu profesora.", ok: "La saludo", bad: ["Paso sin mirarla"] },
    { icon: "🧸", t: "Quieres un juguete que tiene otro niño.", ok: "Le pido el juguete por favor", bad: ["Se lo quito"] }
  ];

  var ROUTINES = {
    r3: [
      { title: "Lavarse las manos", steps: [
        { i: "🚰", t: "Abro el agua" }, { i: "🧼", t: "Me pongo jabón y froto" }, { i: "🧻", t: "Me seco las manos" }] },
      { title: "Cepillarse los dientes", steps: [
        { i: "🪥", t: "Pongo pasta en el cepillo" }, { i: "😁", t: "Me cepillo los dientes" }, { i: "🚰", t: "Me enjuago la boca" }] },
      { title: "Ir al colegio", steps: [
        { i: "🎒", t: "Alisto mi maleta" }, { i: "🚌", t: "Tomo el bus" }, { i: "🏫", t: "Llego al colegio" }] }
    ],
    r4: [
      { title: "Empezar el día", steps: [
        { i: "🛏️", t: "Me levanto" }, { i: "🚿", t: "Me baño" }, { i: "👕", t: "Me visto" }, { i: "🥣", t: "Desayuno" }] },
      { title: "Preparar un sándwich", steps: [
        { i: "🍞", t: "Saco el pan" }, { i: "🧀", t: "Pongo el queso" }, { i: "🥪", t: "Cierro el sándwich" }, { i: "🍽️", t: "Me lo como" }] },
      { title: "Guardar mis útiles", steps: [
        { i: "📚", t: "Termino de estudiar" }, { i: "✏️", t: "Junto mis lápices" }, { i: "🎒", t: "Los guardo en la maleta" }, { i: "😌", t: "Cierro la maleta" }] }
    ],
    tarea: [
      { title: "Cruzar la calle", steps: [
        { i: "🚶", t: "Me detengo en la acera" }, { i: "👀", t: "Miro a ambos lados" }, { i: "🚦", t: "Espero que los carros se detengan" }, { i: "✅", t: "Cruzo caminando" }] },
      { title: "Comprar pan", steps: [
        { i: "🏪", t: "Voy a la tienda" }, { i: "🥖", t: "Pido el pan" }, { i: "💰", t: "Pago" }, { i: "🙏", t: "Recibo el cambio y digo gracias" }] },
      { title: "Lavarse las manos antes de comer", steps: [
        { i: "🚰", t: "Abro el agua" }, { i: "🧼", t: "Pongo jabón" }, { i: "🙌", t: "Froto mis manos" }, { i: "🚿", t: "Me enjuago" }, { i: "🧻", t: "Me seco" }] },
      { title: "Usar el bus", steps: [
        { i: "🚏", t: "Espero en la parada" }, { i: "🚌", t: "Subo cuando el bus se detiene" }, { i: "💳", t: "Pago mi pasaje" }, { i: "🪑", t: "Me siento o me sostengo" }] }
    ]
  };

  // ─── Mecánicas de opción única ────────────────────────────────────────────

  /** Clasificación por un solo criterio. */
  function retoClasificar(p) {
    var keys = p.cats;
    var key = keys[rnd(0, keys.length - 1)];
    var items = CATS[key].items;
    var it = items[rnd(0, items.length - 1)];
    var opts = keys.map(function (k) {
      return { label: CATS[k].label, value: k, aria: CATS[k].label };
    });
    var prompt = "¿A qué grupo pertenece: " + it[1] + "?";
    return {
      skill: "clasificacion",
      prompt: prompt,
      speech: prompt,
      visual: '<span class="cog-big">' + it[0] + "</span>",
      options: shuffle(opts),
      answer: key,
      answerLabel: CATS[key].label,
      hint: "Mira la imagen y piensa qué es. Luego elige su grupo.",
      explain: "«" + it[1] + "» es del grupo " + CATS[key].label + "."
    };
  }

  /** Emparejamiento imagen-imagen idéntica. */
  function retoIgual() {
    var pool = shuffle(ALL);
    var target = pool[0];
    var opts = [target, pool[1], pool[2]].map(function (it) {
      return {
        label: '<span class="cog-emoji">' + it[0] + "</span>",
        value: it[0],
        aria: "Imagen de " + it[1]
      };
    });
    var prompt = "Encuentra la imagen que es igual a: " + target[1] + ".";
    return {
      skill: "emparejamiento_identico",
      prompt: prompt,
      speech: prompt,
      visual: '<span class="cog-big">' + target[0] + "</span>",
      options: shuffle(opts),
      answer: target[0],
      answerLabel: target[1],
      hint: "Mira bien la imagen de arriba y busca la que se ve igual.",
      explain: "Esa imagen es un(a) " + target[1] + ", igual a la de arriba."
    };
  }

  /** Emparejamiento imagen-función: pasa de "igual" a "para qué sirve". */
  function retoFuncion() {
    var f = FUNCIONES[rnd(0, FUNCIONES.length - 1)];
    var prompt = "¿Para qué sirve: " + f.name + "?";
    return {
      skill: "imagen_funcion",
      prompt: prompt,
      speech: prompt,
      visual: '<span class="cog-big">' + f.icon + "</span>",
      options: textOptions(f.ok, f.bad, 3),
      answer: f.ok,
      answerLabel: f.ok,
      hint: "Piensa en cuándo usas ese objeto en tu casa o en el colegio.",
      explain: "El " + f.name + ": " + f.ok.charAt(0).toLowerCase() + f.ok.slice(1) + "."
    };
  }

  /** Causa-efecto. */
  function retoCausa() {
    var c = CAUSAS[rnd(0, CAUSAS.length - 1)];
    var prompt = "¿Qué pasa cuando " + c.accion + "?";
    return {
      skill: "causa_efecto",
      prompt: prompt,
      speech: prompt,
      visual: '<span class="cog-big">' + c.icon + "</span>",
      options: textOptions(c.ok, c.bad, 3),
      answer: c.ok,
      answerLabel: c.ok,
      hint: "Imagina que lo haces tú. ¿Qué ves que ocurre enseguida?",
      explain: "Cuando " + c.accion + ": " + c.ok.charAt(0).toLowerCase() + c.ok.slice(1) + "."
    };
  }

  /** Habilidades sociales guiadas: dos respuestas simples. */
  function retoSocial() {
    var s = SOCIALES[rnd(0, SOCIALES.length - 1)];
    var prompt = "Situación: " + s.t + " ¿Qué haces?";
    return {
      skill: "habilidad_social",
      prompt: prompt,
      speech: prompt,
      visual: '<span class="cog-big">' + s.icon + "</span>",
      options: textOptions(s.ok, s.bad, 2),
      answer: s.ok,
      answerLabel: s.ok,
      hint: "Piensa qué te gustaría que hicieran contigo en esa situación.",
      explain: "Eso ayuda a que todos se sientan bien."
    };
  }

  // ─── Mecánicas con interfaz propia ────────────────────────────────────────

  /**
   * Rutinas y tareas en secuencia. Se tocan las tarjetas en el orden correcto.
   * Nivel de ayuda (help): 1 resalta siempre el paso siguiente, 2 lo resalta
   * tras el primer error, 3 no resalta. Con p.fade la ayuda se retira reto a
   * reto dentro del mismo nivel.
   */
  function roundRutina(p, ctx, index) {
    var list = ROUTINES[p.list];
    var r = list[((p.offset || 0) + index) % list.length];
    var support = (ctx && ctx.support) || 1;
    var help = p.fade ? Math.min(3, support + index) : support;
    var prompt = "Ordena los pasos: " + r.title + ". Toca primero el paso que se hace primero.";

    return {
      skill: "secuencia_" + p.list,
      prompt: prompt,
      speech: prompt,
      hint: "Piensa qué haces primero y sigue paso a paso.",
      mount: function (host, api) {
        var n = r.steps.length;
        host.innerHTML = "";
        var live = liveRegion();
        var status = el("p", "cog-status");
        var done = el("ol", "cog-list");
        done.setAttribute("aria-label", "Pasos ya ordenados");
        var pool = el("div", "cog-steps");
        pool.setAttribute("role", "group");
        pool.setAttribute("aria-label", "Pasos para ordenar");
        host.appendChild(live);
        host.appendChild(status);
        host.appendChild(done);
        host.appendChild(pool);

        var order = shuffle(r.steps.map(function (s, i) { return { s: s, i: i }; }));
        var guard = 0;
        while (guard++ < 10 && order.every(function (o, k) { return o.i === k; })) {
          order = shuffle(order);
        }

        var pos = 0, errors = 0, finished = false;
        var highlight = help === 1;
        var buttons = [];

        function refresh() {
          status.textContent = "Paso " + Math.min(pos + 1, n) + " de " + n;
          buttons.forEach(function (b) {
            b.el.classList.toggle("cog-next", highlight && b.o.i === pos);
          });
        }

        order.forEach(function (o) {
          var b = el("button", "game-option cog-step");
          b.type = "button";
          var ic = el("span", "cog-step-icon");
          ic.textContent = o.s.i;
          ic.setAttribute("aria-hidden", "true");
          var tx = el("span");
          tx.textContent = o.s.t;
          b.appendChild(ic);
          b.appendChild(tx);
          b.setAttribute("aria-label", o.s.t);
          b.addEventListener("click", function () { tap(b, o); });
          pool.appendChild(b);
          buttons.push({ el: b, o: o });
        });

        function tap(btn, o) {
          if (finished) return;
          if (o.i === pos) {
            pos++;
            buttons = buttons.filter(function (x) { return x.el !== btn; });
            btn.remove();
            var li = el("li");
            li.textContent = o.s.i + " " + o.s.t;
            done.appendChild(li);
            live.textContent = "Paso " + pos + ": " + o.s.t;
            api.say("Paso " + pos + ": " + o.s.t);
            api.feedback("", "");
            if (pos === n) { end(); return; }
            refresh();
            if (buttons[0]) buttons[0].el.focus();
          } else {
            errors++;
            btn.classList.add("is-wrong");
            setTimeout(function () { btn.classList.remove("is-wrong"); }, 500);
            api.feedback("Ese paso va después. Mira cuál se hace primero.", "retry");
            if (help === 2) highlight = true;
            refresh();
            if (errors === 2) api.hint();
          }
        }

        function end() {
          finished = true;
          status.textContent = "¡Rutina completa!";
          var stars = errors === 0 ? 1 : (errors === 1 ? 0.75 : (errors <= 3 ? 0.5 : 0.25));
          api.done({
            stars: stars,
            message: errors === 0 ? "¡Todos los pasos en orden!" : "¡Rutina completada!",
            error: errors ? { wrong: errors, routine: r.title, help_level: help, attempts: errors + 1 } : null
          });
        }

        refresh();
        return function () { finished = true; };
      }
    };
  }

  /** Memoria visual simple: pocas parejas y sin límite de tiempo. */
  function roundMemoria(p, ctx) {
    var support = (ctx && ctx.support) || 1;
    var picked = shuffle(ALL).slice(0, p.pairs);
    var deck = shuffle(picked.concat(picked));
    var preview = support === 1 ? 3500 : (support === 2 ? 2200 : 0);
    var prompt = "Encuentra las parejas. Toca dos cartas: si son iguales, se quedan abiertas. No hay límite de tiempo.";

    return {
      skill: "memoria_visual_simple",
      prompt: prompt,
      speech: prompt,
      hint: "Recuerda dónde viste cada dibujo. Abre una carta y busca su pareja.",
      mount: function (host, api) {
        var s = scheduler();
        host.innerHTML = "";
        var live = liveRegion();
        var status = el("p", "cog-status");
        var grid = el("div", "cog-grid");
        grid.style.setProperty("--cols", p.pairs === 3 ? 3 : 4);
        host.appendChild(live);
        host.appendChild(status);
        host.appendChild(grid);

        var cards = [], open = null, lock = true, found = 0, errors = 0, finished = false;

        function show(c) {
          c.up = true;
          c.b.textContent = c.it[0];
          c.b.setAttribute("aria-label", "Carta " + c.n + ": " + c.it[1]);
        }
        function hide(c) {
          c.up = false;
          c.b.textContent = "❓";
          c.b.setAttribute("aria-label", "Carta " + c.n + ", boca abajo");
        }

        deck.forEach(function (it, i) {
          var c = { it: it, n: i + 1, up: false, matched: false };
          c.b = el("button", "game-option cog-card");
          c.b.type = "button";
          c.b.addEventListener("click", function () { flip(c); });
          grid.appendChild(c.b);
          cards.push(c);
          show(c);
        });

        function refresh() {
          status.textContent = "Parejas encontradas: " + found + " de " + p.pairs;
        }

        function ready() {
          cards.forEach(hide);
          lock = false;
          refresh();
        }

        if (preview > 0) {
          status.textContent = "Mira bien las cartas. Se van a tapar en unos segundos.";
          s.later(ready, preview);
        } else {
          ready();
        }

        function flip(c) {
          if (lock || finished || c.matched || c.up) return;
          show(c);
          if (!open) { open = c; return; }
          var first = open;
          open = null;
          if (first.it[0] === c.it[0]) {
            first.matched = c.matched = true;
            first.b.classList.add("is-correct");
            c.b.classList.add("is-correct");
            first.b.disabled = c.b.disabled = true;
            found++;
            live.textContent = "Pareja encontrada: " + c.it[1];
            api.say("Pareja: " + c.it[1]);
            refresh();
            if (found === p.pairs) end();
          } else {
            errors++;
            lock = true;
            live.textContent = "No son iguales.";
            s.later(function () { hide(first); hide(c); lock = false; }, 1000);
            if (errors === 4) api.hint();
          }
        }

        function end() {
          finished = true;
          var stars = errors <= p.pairs ? 1 : (errors <= p.pairs * 2 ? 0.75 : 0.5);
          api.done({
            stars: stars,
            message: "¡Encontraste todas las parejas!",
            error: errors ? { wrong: errors, pairs: p.pairs, attempts: errors + 1 } : null
          });
        }

        return function () { s.stop(); };
      }
    };
  }

  // ─── Definición de los 10 niveles ─────────────────────────────────────────

  var CONSTRUCTORES = {
    clasificar: function (p) { return retoClasificar(p); },
    igual: function () { return retoIgual(); },
    funcion: function () { return retoFuncion(); },
    causa: function () { return retoCausa(); },
    social: function () { return retoSocial(); },
    memoria: roundMemoria,
    rutina3: roundRutina,
    rutina4: roundRutina,
    tarea: roundRutina
  };

  var NIVELES = {
    1: { rounds: 5, mechanics: ["clasificar"],
         params: { clasificar: { cats: ["animal", "comida"] } },
         intro: "¡Hola! Soy NOVA. Hoy vamos a ordenar cosas y aprender rutinas, paso a paso y sin prisa. Primero: ¿a qué grupo pertenece cada objeto?" },
    2: { rounds: 5, mechanics: ["igual"], params: { igual: {} },
         intro: "Ahora buscamos imágenes iguales. Mira el dibujo de arriba y elige el que se ve igual." },
    3: { rounds: 3, mechanics: ["rutina3"], params: { rutina3: { list: "r3" } },
         intro: "Las rutinas tienen pasos. Toca los pasos en el orden en que se hacen. Si te equivocas, no pasa nada: puedes intentarlo otra vez." },
    4: { rounds: 5, mechanics: ["causa"], params: { causa: {} },
         intro: "Cuando hacemos algo, pasa algo. Veamos qué ocurre en cada caso." },
    5: { rounds: 5, mechanics: ["funcion"], params: { funcion: {} },
         intro: "Cada objeto sirve para algo. Elige para qué sirve cada uno." },
    6: { rounds: 3, mechanics: ["memoria"], params: { memoria: { pairs: 3 } },
         intro: "Juego de memoria: encuentra las parejas. No hay límite de tiempo." },
    7: { rounds: 5, mechanics: ["social"], params: { social: {} },
         intro: "A veces hay que decidir cómo tratar a los demás. Elige lo que ayuda a que todos estén bien." },
    8: { rounds: 3, mechanics: ["rutina4"], params: { rutina4: { list: "r4" } },
         intro: "Las rutinas ahora tienen cuatro pasos. Tú puedes ordenarlas." },
    9: { rounds: 4, mechanics: ["tarea"], params: { tarea: { list: "tarea", fade: true } },
         intro: "Tareas de la vida diaria. Al principio te ayudo mucho, y poco a poco te ayudo menos, porque cada vez lo haces mejor." },
    10: { rounds: 8,
          mechanics: ["clasificar", "funcion", "rutina3", "memoria", "causa", "social", "rutina4", "tarea"],
          params: {
            clasificar: { cats: ["animal", "comida", "ropa"] },
            funcion: {}, causa: {}, social: {},
            rutina3: { list: "r3" }, rutina4: { list: "r4" },
            memoria: { pairs: 4 },
            tarea: { list: "tarea", fade: true }
          },
          intro: "Última misión: aparece todo lo que aprendiste. Ya sabes hacerlo. Con calma, paso a paso." }
  };

  global.IndecapGame.register({
    slug: "cognitiva_rutinas",

    getLevel: function (level) {
      var base = NIVELES[level] || NIVELES[1];
      // Se copia la configuración para que un nivel nunca mute a otro.
      return {
        rounds: base.rounds,
        mechanics: base.mechanics.slice(),
        params: base.params,
        offset: rnd(0, 99),
        intro: base.intro
      };
    },

    buildRound: function (cfg, index, ctx) {
      var m = cfg.mechanics[index % cfg.mechanics.length];
      var p = Object.assign({}, cfg.params[m], { offset: cfg.offset });
      return CONSTRUCTORES[m](p, ctx || { support: 1 }, index);
    }
  });
})(window);