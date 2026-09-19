/**
 * MERCADO ESPACIAL — Discalculia
 *
 * Habilidad núcleo: sentido numérico y correspondencia cantidad-símbolo.
 * Cada nivel trabaja una mecánica distinta, recorriendo la progresión
 * concreto → pictórico → abstracto. El nivel 10 es evaluación embebida: mezcla
 * todas las mecánicas anteriores sin presentarse como examen.
 */
(function (global) {
  "use strict";

  var OBJETOS = ["🪐", "⭐", "🚀", "🛸", "☄️", "🌙"];

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

  function tokens(count, icon) {
    var html = "";
    for (var i = 0; i < count; i++) {
      html += '<span class="game-token">' + icon + "</span>";
    }
    return html;
  }

  /** Genera distractores numéricos cercanos: obliga a comparar magnitud real. */
  function distractores(answer, cantidad, min, max) {
    var opciones = [answer];
    var intentos = 0;
    while (opciones.length < cantidad && intentos < 60) {
      intentos++;
      var delta = rnd(1, 3) * (Math.random() < 0.5 ? -1 : 1);
      var candidato = answer + delta;
      if (candidato >= min && candidato <= max && opciones.indexOf(candidato) === -1) {
        opciones.push(candidato);
      }
    }
    return shuffle(opciones);
  }

  function opcionesNumericas(valores) {
    return valores.map(function (v) {
      return { label: String(v), value: v, aria: "Número " + v };
    });
  }

  // ─── Mecánicas ────────────────────────────────────────────────────────────

  /** Subitización: reconocer cantidad de un vistazo, sin contar uno a uno. */
  function retoSubitizar(cfg) {
    var icon = OBJETOS[rnd(0, OBJETOS.length - 1)];
    var cantidad = rnd(cfg.min, cfg.max);
    return {
      skill: "subitizacion",
      prompt: "¿Cuántos " + (cantidad === 1 ? "objeto hay" : "objetos hay") + " en la bodega?",
      speech: "¿Cuántos objetos hay en la bodega?",
      visual: '<div class="game-group">' + tokens(cantidad, icon) + "</div>",
      options: opcionesNumericas(distractores(cantidad, 4, cfg.min, cfg.max + 2)),
      answer: cantidad,
      answerLabel: cantidad,
      hint: "Míralos en grupos pequeños: dos y dos, o tres y uno.",
      explain: "Hay " + cantidad + " objetos."
    };
  }

  /** Comparación de magnitudes: ataca el déficit nuclear de la discalculia. */
  function retoComparar(cfg) {
    var a = rnd(cfg.min, cfg.max);
    var b = rnd(cfg.min, cfg.max);
    if (Math.random() < 0.2) b = a; // se incluye el caso "igual" a propósito
    var iconA = "🪐", iconB = "⭐";
    var respuesta = a > b ? "mas" : (a < b ? "menos" : "igual");

    return {
      skill: "comparacion_magnitud",
      prompt: "¿El montón morado tiene MÁS, MENOS o IGUAL que el montón amarillo?",
      speech: "¿El montón morado tiene más, menos o igual cantidad que el montón amarillo?",
      visual:
        '<div class="game-group">' + tokens(a, iconA) + "</div>" +
        '<div class="game-group">' + tokens(b, iconB) + "</div>",
      options: [
        { label: "MÁS", value: "mas", aria: "Más" },
        { label: "IGUAL", value: "igual", aria: "Igual" },
        { label: "MENOS", value: "menos", aria: "Menos" }
      ],
      answer: respuesta,
      answerLabel: respuesta === "mas" ? "MÁS" : (respuesta === "menos" ? "MENOS" : "IGUAL"),
      hint: "Empareja de a uno: al que le sobren, ese tiene más.",
      explain: "Morado tiene " + a + " y amarillo tiene " + b + "."
    };
  }

  /** Recta numérica: construye la representación espacial del número. */
  function retoRecta(cfg) {
    var max = cfg.max;
    var objetivo = rnd(1, max - 1);
    var html = '<div class="game-numberline">';
    for (var i = 0; i <= max; i++) {
      var clase = "game-numberline__tick";
      if (i === 0 || i === max || i === Math.round(max / 2)) clase += " is-anchor";
      var etiqueta = (i === 0 || i === max || i === Math.round(max / 2)) ? i : "·";
      html += '<span class="' + clase + '">' + etiqueta + "</span>";
    }
    html += "</div>";

    return {
      skill: "recta_numerica",
      prompt: "¿Qué número va justo entre " + (objetivo - 1) + " y " + (objetivo + 1) + "?",
      speech: "¿Qué número va justo entre " + (objetivo - 1) + " y " + (objetivo + 1) + "?",
      visual: html,
      options: opcionesNumericas(distractores(objetivo, 4, 0, max)),
      answer: objetivo,
      answerLabel: objetivo,
      hint: "Camina por la recta desde el 0 y cuenta los pasos.",
      explain: objetivo + " está entre " + (objetivo - 1) + " y " + (objetivo + 1) + "."
    };
  }

  /** Composición: base de la suma y la resta. */
  function retoComponer(cfg) {
    var total = rnd(cfg.min, cfg.max);
    var parteA = rnd(1, total - 1);
    var parteB = total - parteA;

    var correcta = parteA + "+" + parteB;
    var opciones = [{ label: parteA + " + " + parteB, value: correcta, aria: parteA + " más " + parteB }];
    var intentos = 0;
    while (opciones.length < 3 && intentos < 40) {
      intentos++;
      var x = rnd(1, cfg.max - 1);
      var y = rnd(1, cfg.max - 1);
      if (x + y === total) continue;
      var clave = x + "+" + y;
      if (!opciones.some(function (o) { return o.value === clave; })) {
        opciones.push({ label: x + " + " + y, value: clave, aria: x + " más " + y });
      }
    }

    return {
      skill: "composicion",
      prompt: "Necesitas cargar " + total + " cajas. ¿Qué dos cargamentos suman exactamente " + total + "?",
      speech: "¿Qué dos cargamentos suman " + total + "?",
      visual: '<div class="game-group">' + tokens(total, "📦") + "</div>",
      options: shuffle(opciones),
      answer: correcta,
      answerLabel: parteA + " + " + parteB,
      hint: "Cuenta las cajas y sepáralas en dos montones.",
      explain: parteA + " más " + parteB + " es igual a " + total + "."
    };
  }

  /** Cloze numérico: el número faltante en una operación. */
  function retoCloze(cfg) {
    var resta = cfg.allowSubtraction && Math.random() < 0.5;
    var a, b, resultado, faltante, textoEcuacion;

    if (resta) {
      a = rnd(cfg.min + 2, cfg.max);
      b = rnd(1, a - 1);
      resultado = a - b;
      faltante = b;
      textoEcuacion = a + ' − <span class="is-blank">?</span> = ' + resultado;
    } else {
      a = rnd(1, cfg.max - 1);
      b = rnd(1, cfg.max - a);
      resultado = a + b;
      faltante = b;
      textoEcuacion = a + ' + <span class="is-blank">?</span> = ' + resultado;
    }

    return {
      skill: resta ? "cloze_resta" : "cloze_suma",
      prompt: "Completa el código de la compuerta:",
      speech: resta
        ? (a + " menos cuánto es igual a " + resultado + "?")
        : (a + " más cuánto es igual a " + resultado + "?"),
      visual: '<span class="game-equation">' + textoEcuacion + "</span>",
      options: opcionesNumericas(distractores(faltante, 4, 0, cfg.max)),
      answer: faltante,
      answerLabel: faltante,
      hint: resta
        ? "Piensa cuánto le quitaste a " + a + " para quedarte con " + resultado + "."
        : "Cuenta hacia adelante desde " + a + " hasta llegar a " + resultado + ".",
      explain: resta
        ? (a + " menos " + faltante + " es " + resultado + ".")
        : (a + " más " + faltante + " es " + resultado + ".")
    };
  }

  /** Patrones y secuencias. */
  function retoPatron(cfg) {
    var paso = cfg.steps[rnd(0, cfg.steps.length - 1)];
    var inicio = rnd(1, 6);
    var serie = [inicio, inicio + paso, inicio + paso * 2, inicio + paso * 3];
    var respuesta = serie[3];

    return {
      skill: "patrones",
      prompt: "¿Qué número continúa la señal?",
      speech: "¿Qué número continúa la secuencia " + serie.slice(0, 3).join(", ") + "?",
      visual: '<span class="game-equation">' + serie.slice(0, 3).join("  ·  ") +
              '  ·  <span class="is-blank">?</span></span>',
      options: opcionesNumericas(distractores(respuesta, 4, 0, respuesta + 6)),
      answer: respuesta,
      answerLabel: respuesta,
      hint: "Fíjate cuánto aumenta de un número al siguiente.",
      explain: "La señal aumenta de " + paso + " en " + paso + "."
    };
  }

  /** Matemática de la vida diaria: transferencia a contexto real. */
  function retoTienda(cfg) {
    var precio = rnd(2, cfg.max);
    var pago = precio + rnd(1, 4);
    var vuelto = pago - precio;

    return {
      skill: "vida_diaria",
      prompt: "El repuesto cuesta " + precio + " créditos y pagas con " + pago + ". ¿Cuánto te devuelven?",
      speech: "El repuesto cuesta " + precio + " créditos y pagas con " + pago + ". ¿Cuánto te devuelven?",
      visual: '<div class="game-group">' + tokens(pago, "🪙") + "</div>",
      options: opcionesNumericas(distractores(vuelto, 4, 0, 10)),
      answer: vuelto,
      answerLabel: vuelto,
      hint: "Cuenta desde " + precio + " hasta " + pago + ".",
      explain: pago + " menos " + precio + " son " + vuelto + " créditos."
    };
  }

  // ─── Definición de los 10 niveles ─────────────────────────────────────────

  var NIVELES = {
    1:  { rounds: 5, min: 1, max: 3,  mechanics: ["subitizar"],
          intro: "¡Bienvenida al Mercado Espacial! Soy NOVA. Vamos a contar la carga de la primera bodega. Mira bien y dime cuántos objetos ves." },
    2:  { rounds: 6, min: 1, max: 5,  mechanics: ["subitizar"],
          intro: "Llegaron más naves. Ahora hay hasta cinco objetos por bodega. Intenta verlos de un vistazo, sin contarlos uno por uno." },
    3:  { rounds: 6, min: 1, max: 6,  mechanics: ["comparar"],
          intro: "Dos comerciantes discuten por quién tiene más mercancía. Ayúdame a decidir: ¿más, menos o igual?" },
    4:  { rounds: 6, min: 0, max: 10, mechanics: ["recta"],
          intro: "Esta es la ruta del muelle, numerada del 0 al 10. Dime en qué punto está cada compuerta." },
    5:  { rounds: 6, min: 4, max: 8,  mechanics: ["componer"],
          intro: "Hay que repartir la carga en dos naves. Escoge los dos cargamentos que suman el total exacto." },
    6:  { rounds: 6, min: 1, max: 10, mechanics: ["cloze"], allowSubtraction: false,
          intro: "Las compuertas se abren con un código. Falta un número en cada uno. ¿Cuál es?" },
    7:  { rounds: 6, min: 1, max: 12, mechanics: ["patron"], steps: [1, 2, 5],
          intro: "Las señales del faro siguen un patrón. Descubre qué número viene después." },
    8:  { rounds: 7, min: 0, max: 20, mechanics: ["recta", "comparar"],
          intro: "La ruta ahora llega hasta el 20 y hay más carga que comparar. Vas muy bien." },
    9:  { rounds: 7, min: 2, max: 15, mechanics: ["cloze"], allowSubtraction: true,
          intro: "Los códigos ahora también restan. Piensa con calma, puedes intentarlo las veces que necesites." },
    10: { rounds: 8, min: 2, max: 12, mechanics: ["subitizar", "comparar", "cloze", "patron", "tienda"],
          steps: [2, 3], allowSubtraction: true,
          intro: "Última misión: eres la encargada del mercado. Aquí aparece de todo lo que aprendiste. ¡Vamos!" }
  };

  var CONSTRUCTORES = {
    subitizar: retoSubitizar,
    comparar: retoComparar,
    recta: retoRecta,
    componer: retoComponer,
    cloze: retoCloze,
    patron: retoPatron,
    tienda: retoTienda
  };

  global.IndecapGame.register({
    slug: "discalculia_mercado",

    getLevel: function (level) {
      var base = NIVELES[level] || NIVELES[1];
      // Se copia la configuración para que un nivel nunca mute a otro.
      return {
        rounds: base.rounds,
        min: base.min,
        max: base.max,
        mechanics: base.mechanics,
        steps: base.steps || [1, 2],
        allowSubtraction: !!base.allowSubtraction,
        intro: base.intro
      };
    },

    buildRound: function (cfg, index) {
      var mecanica = cfg.mechanics[index % cfg.mechanics.length];
      return CONSTRUCTORES[mecanica](cfg);
    }
  });
})(window);