/**
 * CLASIFICADOR DE RUTINAS — Discapacidad cognitiva
 *
 * Habilidad núcleo: generalización funcional y secuencias de pasos simples.
 *  - Clasificación por un solo criterio ...... corteza prefrontal
 *  - Memoria visual simple ................... hipocampo
 *  - Rutinas y tareas en secuencia ........... prefrontal + ganglios basales
 *  - Semáforo de decisiones (nueva) ........... juicio situacional cotidiano
 *
 * MAPA DE ETAPAS (5 Stages de 10 niveles, 50 en total, numeración continua):
 *   Stage 1 · Base            → niveles 1-10  (sin cambio de contenido)
 *   Stage 2 · Media           → niveles 11-20 (rutinas de vida independiente)
 *   Stage 3 · Alta            → niveles 21-30 (dinero y trámites)
 *   Stage 4 · Muy Alta        → niveles 31-40 (trabajo y salud)
 *   Stage 5 · Súper Difícil   → niveles 41-50 (integración total)
 *
 * El desbloqueo de nivel a nivel (score >= 60) lo maneja
 * games/services.py::get_unlocked_level, agnóstico al número de niveles.
 *
 * Principios de diseño (se conservan sin cambios en todos los niveles):
 *  - Un solo criterio por pantalla y sin distractores complejos.
 *  - Sin límite de tiempo en ningún reto.
 *  - Apoyo escalonado: en modo guiado el paso siguiente se resalta solo; en
 *    parcial se resalta tras el primer error; en independiente no se resalta.
 *  - Nivel 9: retirada gradual de ayudas dentro del mismo nivel (scaffolding).
 *  - Nivel 10: evaluación embebida, mezcla las mecánicas anteriores.
 *
 * Contenido de las etapas 2 a 5: pensado para jóvenes de 15 a 26 años,
 * orientado a autonomía en la vida adulta (dinero, transporte, trabajo,
 * trámites, salud), en vez de contextos infantiles.
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

  // ─── Datos: base (Stage 1, sin cambios) ────────────────────────────────────

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

  // ─── Datos: vida adulta (Stage 2 en adelante, 15-26 años) ──────────────────

  var CATS_ADULTO = {
    documentos: { label: "Documento", items: [["🪪", "cédula"], ["🧾", "recibo"], ["📄", "contrato"], ["🎫", "tiquete"], ["📋", "hoja de vida"]] },
    dinero: { label: "Dinero", items: [["💵", "billete"], ["🪙", "moneda"], ["💳", "tarjeta"], ["🏦", "cuenta bancaria"], ["🧧", "sobre de pago"]] },
    trabajo: { label: "Trabajo", items: [["👷", "casco"], ["🧤", "guantes"], ["📎", "clip"], ["💻", "computador"], ["🗂️", "carpeta"]] }
  };
  var ALL_ADULTO = [];
  Object.keys(CATS_ADULTO).forEach(function (k) { ALL_ADULTO = ALL_ADULTO.concat(CATS_ADULTO[k].items); });

  var CATS_GASTOS = {
    comida: { label: "Comida", items: [["🍔", "hamburguesa"], ["🍚", "arroz"], ["🥖", "pan"]] },
    transporte_gasto: { label: "Transporte", items: [["🚌", "pasaje de bus"], ["⛽", "gasolina"], ["🚕", "taxi"]] },
    vivienda: { label: "Vivienda", items: [["🏠", "arriendo"], ["💡", "recibo de luz"], ["🚰", "recibo de agua"]] },
    ocio: { label: "Ocio", items: [["🎮", "videojuego"], ["🎬", "cine"], ["🎵", "concierto"]] }
  };
  var ALL_GASTOS = [];
  Object.keys(CATS_GASTOS).forEach(function (k) { ALL_GASTOS = ALL_GASTOS.concat(CATS_GASTOS[k].items); });

  var ALL_STAGE5 = ALL_ADULTO.concat(ALL_GASTOS);

  var FUNCIONES_ADULTO = [
    { icon: "🪪", name: "cédula", ok: "Para identificarte", bad: ["Para pagar el bus", "Para abrir una puerta", "Para cocinar"] },
    { icon: "💳", name: "tarjeta débito", ok: "Para pagar o sacar tu dinero", bad: ["Para identificarte ante la policía", "Para abrir el correo", "Para viajar en avión"] },
    { icon: "🧾", name: "recibo de pago", ok: "Para comprobar que pagaste un servicio", bad: ["Para pedir empleo", "Para votar", "Para viajar"] },
    { icon: "🎫", name: "tiquete de bus", ok: "Para poder subir al bus", bad: ["Para pagar el arriendo", "Para comprar comida", "Para dormir"] },
    { icon: "📋", name: "hoja de vida", ok: "Para mostrar tu experiencia al buscar trabajo", bad: ["Para pagar impuestos", "Para pedir una cita médica", "Para tomar el bus"] },
    { icon: "🔑", name: "llave de tu casa", ok: "Para entrar y salir de tu casa", bad: ["Para pagar el bus", "Para hacer una compra", "Para llamar por teléfono"] }
  ];

  var CAUSAS_ADULTO = [
    { icon: "🔥", accion: "dejas la estufa encendida sin vigilar", ok: "Se puede quemar la comida o iniciar un incendio", bad: ["La comida se enfría sola", "No pasa nada"] },
    { icon: "⏰", accion: "no programas la alarma para ir a trabajar", ok: "Puedes llegar tarde al trabajo", bad: ["Llegas más temprano", "Te dan el día libre"] },
    { icon: "💸", accion: "gastas todo tu dinero antes de fin de mes", ok: "Te puede faltar dinero para lo necesario", bad: ["Te sobra más dinero", "El banco te regala más"] },
    { icon: "🧾", accion: "no pagas un servicio a tiempo", ok: "Te pueden cobrar un recargo o cortar el servicio", bad: ["Te devuelven el dinero", "El servicio mejora"] },
    { icon: "🔋", accion: "no cargas tu celular", ok: "Se puede apagar y no podrás usarlo", bad: ["Dura más tiempo encendido", "Se carga solo"] }
  ];

  var SOCIALES_ADULTO = [
    { icon: "😓", t: "Un compañero de trabajo comete un error y se ve preocupado.", ok: "Le digo que no se preocupe y le ayudo a corregirlo", bad: ["Me río de él delante de otros"] },
    { icon: "⏳", t: "Alguien te interrumpe mientras estás concentrado en una tarea.", ok: "Le pido amablemente que espere un momento", bad: ["Le grito que se vaya"] },
    { icon: "🙋", t: "No entiendes una instrucción de tu jefe.", ok: "Le pido que me la explique de nuevo", bad: ["Sigo sin preguntar y me equivoco"] },
    { icon: "🤝", t: "Un compañero nuevo llega al trabajo.", ok: "Lo saludo y le explico cómo son las cosas", bad: ["Lo ignoro por completo"] },
    { icon: "😠", t: "Un cliente te habla de forma grosera.", ok: "Respondo con calma y busco ayuda de un supervisor", bad: ["Le respondo también de forma grosera"] },
    { icon: "🏦", t: "No entiendes un trámite en el banco o la EPS.", ok: "Pido que me expliquen más despacio", bad: ["Me voy sin resolver mi duda"] },
    { icon: "🤒", t: "Te sientes mal y necesitas pedir el día libre a tu jefe.", ok: "Le explico con respeto y pido permiso", bad: ["No aviso y falto sin decir nada"] }
  ];

  /** Semáforo de decisiones: situaciones de juicio y seguridad cotidiana,
      con la misma estructura simple de dos opciones que ya usa retoSocial. */
  var SEMAFORO_BASICO = [
    { icon: "🚗", t: "Un desconocido se ofrece a llevarte a tu casa en su carro.", ok: "Le digo que no, gracias, y sigo mi camino", bad: ["Subo al carro porque parece amable"] },
    { icon: "📱", t: "Alguien que no conoces te pide tu contraseña por mensaje.", ok: "No se la doy y le cuento a alguien de confianza", bad: ["Se la envío porque insiste mucho"] },
    { icon: "🚪", t: "Alguien toca a tu puerta y dice que es del banco sin avisar antes.", ok: "No abro y llamo al banco para confirmar", bad: ["Abro la puerta enseguida"] },
    { icon: "💊", t: "Un desconocido te ofrece una pastilla en la calle.", ok: "La rechazo y me alejo", bad: ["La acepto porque insiste"] },
    { icon: "🚸", t: "Vas a cruzar la calle y el semáforo peatonal está en rojo.", ok: "Espero a que cambie a verde", bad: ["Cruzo de todas formas porque tengo prisa"] }
  ];
  var SEMAFORO_DINERO = [
    { icon: "📞", t: "Te llaman diciendo que ganaste un premio, pero piden que pagues primero.", ok: "No pago nada y cuelgo", bad: ["Pago porque quiero el premio"] },
    { icon: "💳", t: "Un mensaje dice que tu tarjeta se bloqueó y pide el número completo.", ok: "No lo doy y llamo directamente al banco", bad: ["Envío el número por el mensaje"] },
    { icon: "🛍️", t: "Quieres comprar algo pero no te alcanza el dinero del mes.", ok: "Espero a tener el dinero o busco algo más barato", bad: ["Pido prestado sin pensar cómo pagarlo"] },
    { icon: "🧾", t: "Un vendedor te presiona para firmar un contrato sin leerlo.", ok: "Pido tiempo para leerlo con calma", bad: ["Firmo rápido para que no insista"] },
    { icon: "💵", t: "Encuentras dinero que no es tuyo en el trabajo.", ok: "Lo entrego a mi jefe o a seguridad", bad: ["Me lo quedo sin decir nada"] }
  ];
  var SEMAFORO_TRABAJO = [
    { icon: "⚠️", t: "Ves un cable eléctrico dañado en tu área de trabajo.", ok: "Lo reporto a mi jefe o supervisor", bad: ["Lo toco para revisar si funciona"] },
    { icon: "🧤", t: "Tu trabajo requiere usar guantes de protección, pero los olvidaste.", ok: "Pido unos prestados o aviso antes de empezar", bad: ["Trabajo sin ellos para no molestar a nadie"] },
    { icon: "🕐", t: "Tu jefe te pide quedarte horas extra sin avisarte antes.", ok: "Le pregunto si es posible o si puedo hacerlo otro día", bad: ["Me quedo sin decir nada, aunque tenía otro compromiso"] },
    { icon: "🤒", t: "Te sientes muy enfermo para ir a trabajar.", ok: "Aviso a mi jefe y pido el día", bad: ["Voy a trabajar sin avisar y me siento peor"] },
    { icon: "😳", t: "Un compañero te pide que mientas para cubrir un error suyo.", ok: "Le digo que no puedo hacerlo", bad: ["Miento para ayudarlo"] }
  ];
  var SEMAFORO_TODO = SEMAFORO_BASICO.concat(SEMAFORO_DINERO, SEMAFORO_TRABAJO);

  // Rutinas de vida adulta: se añaden como claves nuevas al mismo objeto
  // ROUTINES que ya usan las mecánicas rutina3/rutina4/tarea (no se toca
  // r3/r4/tarea, que siguen siendo del Stage 1).
  ROUTINES.banco = [
    { title: "Pagar una cuenta en el banco", steps: [
      { i: "🧾", t: "Llevo la factura al banco" }, { i: "🏦", t: "Hago la fila y espero mi turno" }, { i: "💳", t: "Pago y guardo el recibo" }] },
    { title: "Sacar dinero del cajero", steps: [
      { i: "💳", t: "Introduzco mi tarjeta" }, { i: "🔢", t: "Marco mi clave" }, { i: "💵", t: "Retiro el dinero y guardo la tarjeta" }] },
    { title: "Abrir una cuenta de ahorros", steps: [
      { i: "🪪", t: "Llevo mi cédula" }, { i: "📝", t: "Lleno el formulario" }, { i: "✅", t: "Firmo y recibo mi cuenta" }] }
  ];
  ROUTINES.lunch = [
    { title: "Preparar un almuerzo sencillo", steps: [
      { i: "🍚", t: "Sirvo el arroz" }, { i: "🍗", t: "Agrego la proteína" }, { i: "🥗", t: "Agrego la ensalada" }, { i: "🍽️", t: "Me siento a comer" }] },
    { title: "Calentar comida en el microondas", steps: [
      { i: "🍱", t: "Pongo la comida en un plato" }, { i: "⏲️", t: "Programo el tiempo" }, { i: "🔥", t: "Caliento la comida" }, { i: "🍽️", t: "La saco y como" }] },
    { title: "Lavar los platos después de comer", steps: [
      { i: "🍽️", t: "Recojo los platos sucios" }, { i: "🧽", t: "Los enjabono" }, { i: "🚰", t: "Los enjuago" }, { i: "🧺", t: "Los dejo secar" }] }
  ];
  ROUTINES.transporte = [
    { title: "Usar el bus solo", steps: [
      { i: "🚏", t: "Espero en la parada" }, { i: "🚌", t: "Subo cuando llega mi bus" }, { i: "💳", t: "Pago el pasaje" }, { i: "🔔", t: "Toco el timbre antes de mi parada" }] },
    { title: "Pedir un taxi por aplicación", steps: [
      { i: "📱", t: "Abro la aplicación" }, { i: "📍", t: "Pongo mi destino" }, { i: "🚕", t: "Espero el carro correcto" }, { i: "✅", t: "Confirmo que llegué bien" }] },
    { title: "Usar el metro", steps: [
      { i: "🎫", t: "Compro o cargo mi tarjeta" }, { i: "🚇", t: "Paso el torniquete" }, { i: "🚉", t: "Espero en el andén" }, { i: "🚪", t: "Bajo en mi estación" }] }
  ];
  ROUTINES.compra = [
    { title: "Comprar en el supermercado con lista", steps: [
      { i: "📝", t: "Reviso mi lista" }, { i: "🛒", t: "Recojo lo que necesito" }, { i: "💳", t: "Pago en la caja" }, { i: "🧾", t: "Guardo el recibo" }] },
    { title: "Pagar servicios por app", steps: [
      { i: "📱", t: "Abro la app del banco" }, { i: "🧾", t: "Busco la factura" }, { i: "✅", t: "Confirmo el pago" }, { i: "📩", t: "Guardo la confirmación" }] },
    { title: "Devolver un producto en una tienda", steps: [
      { i: "🧾", t: "Llevo el recibo" }, { i: "🛍️", t: "Muestro el producto" }, { i: "🗣️", t: "Explico el motivo" }, { i: "💵", t: "Recibo el cambio o devolución" }] }
  ];
  ROUTINES.trabajo = [
    { title: "Llegar puntual al trabajo", steps: [
      { i: "⏰", t: "Me despierto con tiempo" }, { i: "🚿", t: "Me alisto rápido" }, { i: "🚌", t: "Tomo el transporte a tiempo" }, { i: "🏢", t: "Llego antes de la hora de entrada" }] },
    { title: "Avisar que llegarás tarde", steps: [
      { i: "📱", t: "Reviso la hora" }, { i: "📞", t: "Llamo a mi jefe" }, { i: "🗣️", t: "Explico el motivo" }, { i: "🚶", t: "Voy en camino" }] },
    { title: "Marcar entrada en el trabajo", steps: [
      { i: "🪪", t: "Muestro mi carné" }, { i: "⏱️", t: "Marco mi hora de entrada" }, { i: "🗂️", t: "Voy a mi puesto" }, { i: "✅", t: "Empiezo mis tareas" }] }
  ];
  ROUTINES.cita = [
    { title: "Pedir una cita médica", steps: [
      { i: "📞", t: "Llamo a la EPS o clínica" }, { i: "🗣️", t: "Explico qué necesito" }, { i: "📅", t: "Me dan una fecha" }, { i: "📝", t: "Anoto la cita en mi agenda" }] },
    { title: "Asistir a la cita médica", steps: [
      { i: "🪪", t: "Llevo mi documento" }, { i: "🕐", t: "Llego a tiempo" }, { i: "🩺", t: "El doctor me revisa" }, { i: "💊", t: "Recibo las indicaciones" }] },
    { title: "Recoger medicamentos en la farmacia", steps: [
      { i: "📄", t: "Llevo la fórmula médica" }, { i: "💊", t: "Entrego la fórmula en la farmacia" }, { i: "⏳", t: "Espero mi turno" }, { i: "✅", t: "Recibo los medicamentos" }] }
  ];

  // ─── Mecánicas de opción única ────────────────────────────────────────────

  /** Clasificación por un solo criterio. */
  function retoClasificar(p) {
    var source = p.catsSource || CATS;
    var keys = p.cats;
    var key = keys[rnd(0, keys.length - 1)];
    var items = source[key].items;
    var it = items[rnd(0, items.length - 1)];
    var opts = keys.map(function (k) {
      return { label: source[k].label, value: k, aria: source[k].label };
    });
    var prompt = "¿A qué grupo pertenece: " + it[1] + "?";
    return {
      skill: "clasificacion",
      prompt: prompt,
      speech: prompt,
      visual: '<span class="cog-big">' + it[0] + "</span>",
      options: shuffle(opts),
      answer: key,
      answerLabel: source[key].label,
      hint: "Mira la imagen y piensa qué es. Luego elige su grupo.",
      explain: "«" + it[1] + "» es del grupo " + source[key].label + "."
    };
  }

  /** Emparejamiento imagen-imagen idéntica. */
  function retoIgual(p) {
    var banco = (p && p.bancos) || ALL;
    var pool = shuffle(banco);
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
  function retoFuncion(p) {
    var banco = (p && p.bancos) || FUNCIONES;
    var f = banco[rnd(0, banco.length - 1)];
    var prompt = "¿Para qué sirve: " + f.name + "?";
    return {
      skill: "imagen_funcion",
      prompt: prompt,
      speech: prompt,
      visual: '<span class="cog-big">' + f.icon + "</span>",
      options: textOptions(f.ok, f.bad, 3),
      answer: f.ok,
      answerLabel: f.ok,
      hint: "Piensa en cuándo usas ese objeto en tu casa o en el trabajo.",
      explain: "El " + f.name + ": " + f.ok.charAt(0).toLowerCase() + f.ok.slice(1) + "."
    };
  }

  /** Causa-efecto. */
  function retoCausa(p) {
    var banco = (p && p.bancos) || CAUSAS;
    var c = banco[rnd(0, banco.length - 1)];
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
  function retoSocial(p) {
    var banco = (p && p.bancos) || SOCIALES;
    var s = banco[rnd(0, banco.length - 1)];
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

  /** Semáforo de decisiones: juicio situacional en escenarios de seguridad
      cotidiana (calle, dinero, trabajo). Misma estructura simple que
      retoSocial: dos opciones, sin distractores complejos. */
  function retoSemaforo(p) {
    var banco = (p && p.bancos) || SEMAFORO_BASICO;
    var s = banco[rnd(0, banco.length - 1)];
    var prompt = "Situación: " + s.t + " ¿Qué haces?";
    return {
      skill: "semaforo_decisiones",
      prompt: prompt,
      speech: prompt,
      visual: '<span class="cog-big">' + s.icon + "</span>",
      options: textOptions(s.ok, s.bad, 2),
      answer: s.ok,
      answerLabel: s.ok,
      hint: "Piensa en lo que te mantiene seguro o te ayuda a resolver bien la situación.",
      explain: "Esa decisión te cuida a ti y evita problemas."
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
    var banco = p.bancos || ALL;
    var picked = shuffle(banco).slice(0, p.pairs);
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

  // ─── Definición de los niveles (50: 5 Stages de 10 niveles) ────────────────

  var CONSTRUCTORES = {
    clasificar: function (p) { return retoClasificar(p); },
    igual: function (p) { return retoIgual(p); },
    funcion: function (p) { return retoFuncion(p); },
    causa: function (p) { return retoCausa(p); },
    social: function (p) { return retoSocial(p); },
    semaforo: function (p) { return retoSemaforo(p); },
    memoria: roundMemoria,
    rutina3: roundRutina,
    rutina4: roundRutina,
    tarea: roundRutina
  };

  var NIVELES = {
    // ══ Stage 1 · Base (1-10): sin cambios ═══════════════════════════════════
    1: { rounds: 5, mechanics: ["clasificar"],
         params: { clasificar: { cats: ["animal", "comida"] } },
         intro: "Stage 1 · Nivel 1 · ¡Hola! Soy NOVA. Hoy vamos a ordenar cosas y aprender rutinas, paso a paso y sin prisa. Primero: ¿a qué grupo pertenece cada objeto?" },
    2: { rounds: 5, mechanics: ["igual"], params: { igual: {} },
         intro: "Stage 1 · Nivel 2 · Ahora buscamos imágenes iguales. Mira el dibujo de arriba y elige el que se ve igual." },
    3: { rounds: 3, mechanics: ["rutina3"], params: { rutina3: { list: "r3" } },
         intro: "Stage 1 · Nivel 3 · Las rutinas tienen pasos. Toca los pasos en el orden en que se hacen. Si te equivocas, no pasa nada: puedes intentarlo otra vez." },
    4: { rounds: 5, mechanics: ["causa"], params: { causa: {} },
         intro: "Stage 1 · Nivel 4 · Cuando hacemos algo, pasa algo. Veamos qué ocurre en cada caso." },
    5: { rounds: 5, mechanics: ["funcion"], params: { funcion: {} },
         intro: "Stage 1 · Nivel 5 · Cada objeto sirve para algo. Elige para qué sirve cada uno." },
    6: { rounds: 3, mechanics: ["memoria"], params: { memoria: { pairs: 3 } },
         intro: "Stage 1 · Nivel 6 · Juego de memoria: encuentra las parejas. No hay límite de tiempo." },
    7: { rounds: 5, mechanics: ["social"], params: { social: {} },
         intro: "Stage 1 · Nivel 7 · A veces hay que decidir cómo tratar a los demás. Elige lo que ayuda a que todos estén bien." },
    8: { rounds: 3, mechanics: ["rutina4"], params: { rutina4: { list: "r4" } },
         intro: "Stage 1 · Nivel 8 · Las rutinas ahora tienen cuatro pasos. Tú puedes ordenarlas." },
    9: { rounds: 4, mechanics: ["tarea"], params: { tarea: { list: "tarea", fade: true } },
         intro: "Stage 1 · Nivel 9 · Tareas de la vida diaria. Al principio te ayudo mucho, y poco a poco te ayudo menos, porque cada vez lo haces mejor." },
    10: { rounds: 8,
          mechanics: ["clasificar", "funcion", "rutina3", "memoria", "causa", "social", "rutina4", "tarea"],
          params: {
            clasificar: { cats: ["animal", "comida", "ropa"] },
            funcion: {}, causa: {}, social: {},
            rutina3: { list: "r3" }, rutina4: { list: "r4" },
            memoria: { pairs: 4 },
            tarea: { list: "tarea", fade: true }
          },
          intro: "Stage 1 · Nivel 10 · Última misión de la base: aparece todo lo que aprendiste. Ya sabes hacerlo. Con calma, paso a paso." },

    // ══ Stage 2 · Media (11-20): rutinas de vida independiente ══════════════
    11: { rounds: 10, mechanics: ["clasificar"],
          params: { clasificar: { cats: ["documentos", "dinero", "trabajo"], catsSource: CATS_ADULTO } },
          intro: "Stage 2 · Nivel 11 · Objetos de tu casa y tu trabajo: documentos, dinero y herramientas. ¿A qué grupo pertenece cada uno?" },
    12: { rounds: 10, mechanics: ["igual"], params: { igual: { bancos: ALL_ADULTO } },
          intro: "Stage 2 · Nivel 12 · Busca la imagen igual entre objetos de uso diario adulto." },
    13: { rounds: 10, mechanics: ["rutina3"], params: { rutina3: { list: "banco" } },
          intro: "Stage 2 · Nivel 13 · Aprendemos a pagar una cuenta o usar el banco, paso a paso." },
    14: { rounds: 10, mechanics: ["causa"], params: { causa: { bancos: CAUSAS_ADULTO } },
          intro: "Stage 2 · Nivel 14 · Cuando haces algo en tu casa o tu trabajo, algo pasa. Veamos qué ocurre." },
    15: { rounds: 10, mechanics: ["funcion"], params: { funcion: { bancos: FUNCIONES_ADULTO } },
          intro: "Stage 2 · Nivel 15 · Documentos y objetos que usas en tu vida diaria: ¿para qué sirve cada uno?" },
    16: { rounds: 10, mechanics: ["memoria"], params: { memoria: { bancos: ALL_ADULTO, pairs: 4 } },
          intro: "Stage 2 · Nivel 16 · Juego de memoria con objetos de trabajo y documentos." },
    17: { rounds: 10, mechanics: ["social"], params: { social: { bancos: SOCIALES_ADULTO } },
          intro: "Stage 2 · Nivel 17 · Situaciones en el trabajo: ¿qué haces en cada caso?" },
    18: { rounds: 10, mechanics: ["rutina4"], params: { rutina4: { list: "lunch" } },
          intro: "Stage 2 · Nivel 18 · Aprendemos a preparar un almuerzo sencillo para ti mismo." },
    19: { rounds: 10, mechanics: ["semaforo"], params: { semaforo: { bancos: SEMAFORO_BASICO } },
          intro: "Stage 2 · Nivel 19 · Mecánica nueva: el Semáforo de decisiones. Situaciones cotidianas donde eliges lo más seguro." },
    20: { rounds: 10,
          mechanics: ["clasificar", "igual", "rutina3", "causa", "funcion", "memoria", "social", "rutina4", "semaforo"],
          params: {
            clasificar: { cats: ["documentos", "dinero", "trabajo"], catsSource: CATS_ADULTO },
            igual: { bancos: ALL_ADULTO }, rutina3: { list: "banco" }, causa: { bancos: CAUSAS_ADULTO },
            funcion: { bancos: FUNCIONES_ADULTO }, memoria: { bancos: ALL_ADULTO, pairs: 4 },
            social: { bancos: SOCIALES_ADULTO }, rutina4: { list: "lunch" }, semaforo: { bancos: SEMAFORO_BASICO }
          },
          intro: "Stage 2 · Nivel 20 · Reto integrador de la etapa Media: mezcla todo lo practicado." },

    // ══ Stage 3 · Alta (21-30): dinero y trámites ═══════════════════════════
    21: { rounds: 10, mechanics: ["clasificar"],
          params: { clasificar: { cats: ["comida", "transporte_gasto", "vivienda", "ocio"], catsSource: CATS_GASTOS } },
          intro: "Stage 3 · Nivel 21 · Clasifica gastos: comida, transporte, vivienda u ocio." },
    22: { rounds: 10, mechanics: ["rutina4"], params: { rutina4: { list: "transporte" } },
          intro: "Stage 3 · Nivel 22 · Aprendemos a usar el transporte público solo." },
    23: { rounds: 10, mechanics: ["causa"], params: { causa: { bancos: CAUSAS_ADULTO } },
          intro: "Stage 3 · Nivel 23 · Sigue practicando qué pasa cuando manejas mal el dinero o el tiempo." },
    24: { rounds: 10, mechanics: ["funcion"], params: { funcion: { bancos: FUNCIONES_ADULTO } },
          intro: "Stage 3 · Nivel 24 · Documentos importantes: ¿para qué sirve cada uno?" },
    25: { rounds: 10, mechanics: ["memoria"], params: { memoria: { bancos: ALL_GASTOS, pairs: 4 } },
          intro: "Stage 3 · Nivel 25 · Juego de memoria con tipos de gasto." },
    26: { rounds: 10, mechanics: ["semaforo"], params: { semaforo: { bancos: SEMAFORO_DINERO } },
          intro: "Stage 3 · Nivel 26 · Semáforo de decisiones: situaciones de dinero y compras." },
    27: { rounds: 10, mechanics: ["rutina4"], params: { rutina4: { list: "compra" } },
          intro: "Stage 3 · Nivel 27 · Aprendemos a comprar en el supermercado con una lista." },
    28: { rounds: 10, mechanics: ["social"], params: { social: { bancos: SOCIALES_ADULTO } },
          intro: "Stage 3 · Nivel 28 · Pedir ayuda en una entidad, como el banco o la EPS." },
    29: { rounds: 10, mechanics: ["rutina3", "causa"],
          params: { rutina3: { list: "banco" }, causa: { bancos: CAUSAS_ADULTO } },
          intro: "Stage 3 · Nivel 29 · Rutinas de banco y causa-efecto, alternadas." },
    30: { rounds: 10,
          mechanics: ["clasificar", "rutina4", "causa", "funcion", "memoria", "semaforo", "rutina3", "social"],
          params: {
            clasificar: { cats: ["comida", "transporte_gasto", "vivienda", "ocio"], catsSource: CATS_GASTOS },
            rutina4: { list: "transporte" }, causa: { bancos: CAUSAS_ADULTO }, funcion: { bancos: FUNCIONES_ADULTO },
            memoria: { bancos: ALL_GASTOS, pairs: 4 }, semaforo: { bancos: SEMAFORO_DINERO },
            rutina3: { list: "banco" }, social: { bancos: SOCIALES_ADULTO }
          },
          intro: "Stage 3 · Nivel 30 · Reto integrador de la etapa Alta: mezcla todo lo practicado." },

    // ══ Stage 4 · Muy Alta (31-40): trabajo y salud ═════════════════════════
    31: { rounds: 10, mechanics: ["rutina4"], params: { rutina4: { list: "trabajo" } },
          intro: "Stage 4 · Nivel 31 · Aprendemos a llegar puntual al trabajo, paso a paso." },
    32: { rounds: 10, mechanics: ["semaforo"], params: { semaforo: { bancos: SEMAFORO_TRABAJO } },
          intro: "Stage 4 · Nivel 32 · Semáforo de decisiones: situaciones de seguridad en el trabajo." },
    33: { rounds: 10, mechanics: ["clasificar", "funcion"],
          params: { clasificar: { cats: ["trabajo", "documentos"], catsSource: CATS_ADULTO }, funcion: { bancos: FUNCIONES_ADULTO } },
          intro: "Stage 4 · Nivel 33 · Clasificación y función de elementos de trabajo y documentos." },
    34: { rounds: 10, mechanics: ["rutina4"], params: { rutina4: { list: "cita" } },
          intro: "Stage 4 · Nivel 34 · Aprendemos a agendar y asistir a una cita médica." },
    35: { rounds: 10, mechanics: ["memoria", "causa"],
          params: { memoria: { bancos: ALL_GASTOS, pairs: 4 }, causa: { bancos: CAUSAS_ADULTO } },
          intro: "Stage 4 · Nivel 35 · Memoria y causa-efecto, combinadas." },
    36: { rounds: 10, mechanics: ["social"], params: { social: { bancos: SOCIALES_ADULTO } },
          intro: "Stage 4 · Nivel 36 · Resolver un malentendido con un compañero de trabajo." },
    37: { rounds: 10, mechanics: ["semaforo", "rutina4"],
          params: { semaforo: { bancos: SEMAFORO_TRABAJO }, rutina4: { list: "trabajo" } },
          intro: "Stage 4 · Nivel 37 · Decisiones de seguridad y rutina de trabajo, alternadas." },
    38: { rounds: 10, mechanics: ["clasificar", "memoria"],
          params: { clasificar: { cats: ["documentos", "dinero"], catsSource: CATS_ADULTO }, memoria: { bancos: ALL_ADULTO, pairs: 4 } },
          intro: "Stage 4 · Nivel 38 · Documentos importantes: clasifica y recuerda." },
    39: { rounds: 10, mechanics: ["rutina4", "social"],
          params: { rutina4: { list: "trabajo" }, social: { bancos: SOCIALES_ADULTO } },
          intro: "Stage 4 · Nivel 39 · Rutina de trabajo y situaciones sociales, como pedir un permiso." },
    40: { rounds: 10,
          mechanics: ["rutina4", "semaforo", "clasificar", "memoria", "causa", "funcion", "social"],
          params: {
            rutina4: { list: "trabajo" }, semaforo: { bancos: SEMAFORO_TRABAJO },
            clasificar: { cats: ["trabajo", "documentos"], catsSource: CATS_ADULTO },
            memoria: { bancos: ALL_ADULTO, pairs: 4 }, causa: { bancos: CAUSAS_ADULTO },
            funcion: { bancos: FUNCIONES_ADULTO }, social: { bancos: SOCIALES_ADULTO }
          },
          intro: "Stage 4 · Nivel 40 · Reto integrador de la etapa Muy Alta: mezcla todo lo practicado." },

    // ══ Stage 5 · Súper Difícil (41-50): integración total ══════════════════
    41: { rounds: 10, mechanics: ["semaforo", "causa"],
          params: { semaforo: { bancos: SEMAFORO_TODO }, causa: { bancos: CAUSAS_ADULTO } },
          intro: "Stage 5 · Nivel 41 · Decisiones y causa-efecto, sin previo aviso de cuál toca." },
    42: { rounds: 10, mechanics: ["clasificar", "memoria"],
          params: {
            clasificar: { cats: ["comida", "transporte_gasto", "vivienda", "ocio"], catsSource: CATS_GASTOS },
            memoria: { bancos: ALL_GASTOS, pairs: 4 }
          },
          intro: "Stage 5 · Nivel 42 · Clasificar gastos y recordar parejas, combinado." },
    43: { rounds: 10, mechanics: ["funcion", "igual"],
          params: { funcion: { bancos: FUNCIONES_ADULTO }, igual: { bancos: ALL_STAGE5 } },
          intro: "Stage 5 · Nivel 43 · Función de objetos e imágenes iguales, alternadas." },
    44: { rounds: 10, mechanics: ["rutina4", "social"],
          params: { rutina4: { list: "compra" }, social: { bancos: SOCIALES_ADULTO } },
          intro: "Stage 5 · Nivel 44 · Rutina de compra y situaciones sociales, combinadas." },
    45: { rounds: 10, mechanics: ["semaforo", "clasificar", "funcion"],
          params: {
            semaforo: { bancos: SEMAFORO_TODO },
            clasificar: { cats: ["documentos", "dinero", "trabajo"], catsSource: CATS_ADULTO },
            funcion: { bancos: FUNCIONES_ADULTO }
          },
          intro: "Stage 5 · Nivel 45 · Tres mecánicas de juicio y clasificación, combinadas." },
    46: { rounds: 10, mechanics: ["memoria", "causa", "rutina3"],
          params: { memoria: { bancos: ALL_STAGE5, pairs: 4 }, causa: { bancos: CAUSAS_ADULTO }, rutina3: { list: "banco" } },
          intro: "Stage 5 · Nivel 46 · Memoria, causa-efecto y rutina de banco, alternadas." },
    47: { rounds: 10, mechanics: ["social", "semaforo", "rutina4"],
          params: { social: { bancos: SOCIALES_ADULTO }, semaforo: { bancos: SEMAFORO_TODO }, rutina4: { list: "trabajo" } },
          intro: "Stage 5 · Nivel 47 · Situaciones sociales, decisiones y rutina de trabajo combinadas." },
    48: { rounds: 10, mechanics: ["clasificar", "igual", "funcion", "memoria"],
          params: {
            clasificar: { cats: ["comida", "transporte_gasto", "vivienda", "ocio"], catsSource: CATS_GASTOS },
            igual: { bancos: ALL_STAGE5 }, funcion: { bancos: FUNCIONES_ADULTO }, memoria: { bancos: ALL_STAGE5, pairs: 4 }
          },
          intro: "Stage 5 · Nivel 48 · Cuatro mecánicas alternadas, sin previo aviso." },
    49: { rounds: 10, mechanics: ["semaforo", "causa", "social", "rutina3", "rutina4"],
          params: {
            semaforo: { bancos: SEMAFORO_TODO }, causa: { bancos: CAUSAS_ADULTO }, social: { bancos: SOCIALES_ADULTO },
            rutina3: { list: "banco" }, rutina4: { list: "cita" }
          },
          intro: "Stage 5 · Nivel 49 · Mezcla exigente de casi todas las mecánicas. Falta solo el reto final." },
    50: { rounds: 10,
          mechanics: ["clasificar", "igual", "funcion", "causa", "social", "memoria", "rutina3", "rutina4", "semaforo"],
          params: {
            clasificar: { cats: ["documentos", "dinero", "trabajo"], catsSource: CATS_ADULTO },
            igual: { bancos: ALL_STAGE5 }, funcion: { bancos: FUNCIONES_ADULTO }, causa: { bancos: CAUSAS_ADULTO },
            social: { bancos: SOCIALES_ADULTO }, memoria: { bancos: ALL_STAGE5, pairs: 4 },
            rutina3: { list: "banco" }, rutina4: { list: "trabajo" }, semaforo: { bancos: SEMAFORO_TODO }
          },
          intro: "Stage 5 · Nivel 50 · Reto final del Clasificador de Rutinas: todo lo que aprendiste sobre tu vida independiente. ¡Tú puedes!" }
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
