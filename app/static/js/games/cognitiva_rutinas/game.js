/**
 * CLASIFICADOR DE RUTINAS — Discapacidad cognitiva
 *
 * Habilidad central: organizar la vida diaria con autonomía: clasificar,
 * seguir pasos, prever consecuencias y tomar decisiones seguras.
 *
 * 5 niveles × 10 actividades, 5 retos por actividad que suben de dificultad
 * (más elementos, más opciones, menos apoyo visual).
 *
 *   Nivel 1 · Base           Objetos y categorías de la casa
 *   Nivel 2 · Media          Rutinas de la casa y autocuidado
 *   Nivel 3 · Alta           Dinero y trámites
 *   Nivel 4 · Muy Alta       Trabajo y salud
 *   Nivel 5 · Súper Difícil  Vida independiente
 *
 * Principios: un solo criterio por pantalla, lenguaje concreto, imagen +
 * texto + voz, sin límite de tiempo y situaciones de la vida real para
 * jóvenes de 15 a 26 años (nada infantil).
 */
(function (global) {
  "use strict";
  var _t = global.IndecapGame.tr;

  var U = global.IndecapGame.util;
  /** «15 de marzo»; en inglés el diccionario lo deja como «March 15». */
  function fecha(dia, mes) { return _t("{d} de {m}").replace("{d}", dia).replace("{m}", mes); }
  /** Días de la semana dentro de una frase: en español van en minúscula. */
  function diaEnFrase(d) {
    var html = global.document && global.document.documentElement;
    return html && /^en/.test(html.lang || "") ? d : d.toLowerCase();
  }
  var rnd = U.rnd, pick = U.pick, shuffle = U.shuffle, grow = U.grow, cop = U.cop;
  var RETOS = 5;

  (function injectStyles() {
    if (document.getElementById("cog-styles")) return;
    var css = [
      ".cog-ico{font-size:1.5em;line-height:1;margin-right:.35em;vertical-align:-.15em}",
      ".cog-hero{display:inline-flex;flex-direction:column;align-items:center;gap:8px;padding:20px 28px;border:1px solid var(--line);border-radius:var(--r-lg);background:var(--canvas)}",
      ".cog-hero__ico{font-size:64px;line-height:1}",
      ".cog-hero__name{font-weight:600;font-size:16px;color:var(--ink-900)}",
      ".cog-scene{max-width:560px;margin:0 auto;padding:16px 20px;display:flex;gap:16px;align-items:center;text-align:left;border:1px solid var(--line);border-radius:var(--r-lg);background:var(--canvas);font-size:17px;line-height:1.5}",
      ".cog-scene__ico{font-size:44px;line-height:1;flex-shrink:0}",
      ".cog-steps{list-style:none;margin:0 auto;padding:0;max-width:520px;display:grid;gap:8px;text-align:left}",
      ".cog-steps li{display:flex;align-items:center;gap:12px;padding:10px 14px;border:1px solid var(--line);border-radius:var(--r-md);background:var(--surface);font-size:15px}",
      ".cog-steps li b{display:inline-flex;align-items:center;justify-content:center;width:26px;height:26px;border-radius:6px;background:var(--navy-800);color:#fff;font-size:12px;flex-shrink:0}",
      ".cog-steps li.is-gap{border-style:dashed;color:var(--ink-400);background:var(--canvas)}",
      ".cog-doc{min-width:280px;max-width:420px;padding:16px 20px;border:1px solid var(--line);border-radius:var(--r-md);background:var(--surface);box-shadow:var(--sh-xs);text-align:left;font-size:15px}",
      ".cog-doc h4{margin:0 0 10px;font-size:15px;font-weight:700}",
      ".cog-doc p{display:flex;justify-content:space-between;gap:24px;margin:0;padding:6px 0;border-bottom:1px dashed var(--line)}",
      ".cog-doc p:last-child{border-bottom:0}",
      ".cog-grid{width:100%;max-width:440px;margin:0 auto;display:grid;grid-template-columns:repeat(var(--cols,3),minmax(84px,1fr));gap:10px}",
      ".game-option.cog-card{font-size:40px;min-height:88px;padding:8px}",
      ".cog-status{margin:0 0 10px;font-weight:600;color:var(--ink-600)}"
    ].join("");
    var tag = document.createElement("style");
    tag.id = "cog-styles";
    tag.textContent = css;
    document.head.appendChild(tag);
  })();

  // ─── Utilidades ───────────────────────────────────────────────────────────
  function ico(i, t) { return '<span class="cog-ico" aria-hidden="true">' + i + "</span>" + t; }
  function hero(i, t) { return '<div class="cog-hero"><span class="cog-hero__ico" aria-hidden="true">' + i + '</span><span class="cog-hero__name">' + t + "</span></div>"; }
  function scene(i, t) { return '<div class="cog-scene"><span class="cog-scene__ico" aria-hidden="true">' + i + "</span><span>" + t + "</span></div>"; }
  function textOpts(ok, bads, n) {
    var uniq = [];
    shuffle(bads).forEach(function (t) { if (t !== ok && uniq.indexOf(t) === -1) uniq.push(t); });
    return shuffle([ok].concat(uniq.slice(0, n - 1))).map(function (t) { return { label: t, value: t, aria: t }; });
  }
  function stepsList(steps, gapIndex) {
    return '<ol class="cog-steps">' + steps.map(function (st, k) {
      return k === gapIndex ? '<li class="is-gap"><b>' + (k + 1) + _t("</b>¿…?</li>") :
        "<li><b>" + (k + 1) + '</b><span class="cog-ico" aria-hidden="true">' + st.i + "</span>" + st.t + "</li>";
    }).join("") + "</ol>";
  }
  /** Con poco apoyo (retos altos) se quitan los íconos y queda solo el texto. */
  function label(item, s, cut) { return s >= (cut || 4) ? item[1] : ico(item[0], item[1]); }

  // ─── Contenido ───────────────────────────────────────────────────────────
  var CATS = {
    comida: { label: _t("Comida"), items: [["🍎", _t("manzana")], ["🍞", _t("pan")], ["🥚", _t("huevos")], ["🍚", _t("arroz")], ["🧀", _t("queso")], ["🥑", _t("aguacate")]] },
    ropa: { label: _t("Ropa"), items: [["👕", _t("camiseta")], ["👖", _t("pantalón")], ["🧦", _t("medias")], ["🧥", _t("chaqueta")], ["👟", _t("tenis")], ["🧢", _t("gorra")]] },
    aseo: { label: _t("Aseo personal"), items: [["🧼", _t("jabón")], ["🪥", _t("cepillo de dientes")], ["🧴", _t("champú")], ["🧻", _t("papel higiénico")], ["🪒", _t("máquina de afeitar")]] },
    cocina: { label: _t("Cocina"), items: [["🍳", _t("sartén")], ["🥄", _t("cuchara")], ["🔪", _t("cuchillo")], ["🍽️", _t("plato")], ["🫖", _t("olla")]] },
    tecnologia: { label: _t("Tecnología"), items: [["📱", _t("celular")], ["💻", _t("computador")], ["🎧", _t("audífonos")], ["🔌", _t("cargador")], ["🖨️", _t("impresora")]] },
    transporte: { label: _t("Transporte"), items: [["🚌", _t("bus")], ["🚲", _t("bicicleta")], ["🛵", _t("moto")], ["🚇", _t("metro")], ["🚕", _t("taxi")]] }
  };
  var CATS_ADULTO = {
    documentos: { label: _t("Documentos"), items: [["🪪", _t("cédula")], ["🧾", _t("factura")], ["📄", _t("contrato")], ["📋", _t("hoja de vida")], ["📑", _t("certificado")]] },
    dinero: { label: _t("Dinero"), items: [["💵", _t("billete")], ["🪙", _t("moneda")], ["💳", _t("tarjeta débito")], ["🏦", _t("cuenta de ahorros")], ["📲", _t("billetera digital")]] },
    trabajo: { label: _t("Trabajo"), items: [["⛑️", _t("casco")], ["🧤", _t("guantes de protección")], ["🗂️", _t("carpeta")], ["🪪", _t("carné de la empresa")], ["📆", _t("horario de turnos")]] }
  };
  function itemsOf(cats) { var all = []; Object.keys(cats).forEach(function (k) { cats[k].items.forEach(function (it) { all.push({ it: it, cat: k }); }); }); return all; }

  var FUNCIONES = [
    { i: "☂️", n: _t("paraguas"), ok: _t("Para protegerme de la lluvia"), bad: [_t("Para cortar papel"), _t("Para escuchar música"), _t("Para guardar comida")] },
    { i: "🔑", n: _t("llave"), ok: _t("Para abrir una puerta"), bad: [_t("Para cocinar"), _t("Para medir el tiempo"), _t("Para pagar")] },
    { i: "⏰", n: _t("despertador"), ok: _t("Para despertarme a tiempo"), bad: [_t("Para lavar la ropa"), _t("Para calentar comida"), _t("Para secarme el pelo")] },
    { i: "🧯", n: _t("extintor"), ok: _t("Para apagar un incendio pequeño"), bad: [_t("Para regar las plantas"), _t("Para limpiar el piso"), _t("Para inflar llantas")] },
    { i: "🩹", n: _t("curita"), ok: _t("Para cubrir una herida pequeña"), bad: [_t("Para pegar papeles"), _t("Para cerrar una bolsa"), _t("Para decorar")] },
    { i: "🔌", n: _t("cargador"), ok: _t("Para cargar la batería del celular"), bad: [_t("Para hacer llamadas"), _t("Para encender la luz"), _t("Para conectar el agua")] },
    { i: "🧽", n: _t("esponja"), ok: _t("Para lavar los platos"), bad: [_t("Para secarme el pelo"), _t("Para escribir"), _t("Para barrer")] }
  ];
  var FUNCIONES_ADULTO = [
    { i: "🪪", n: _t("cédula"), ok: _t("Para identificarme"), bad: [_t("Para pagar el bus"), _t("Para abrir una puerta"), _t("Para cocinar")] },
    { i: "💳", n: _t("tarjeta débito"), ok: _t("Para pagar o sacar mi dinero"), bad: [_t("Para identificarme ante la policía"), _t("Para abrir el correo"), _t("Para viajar en avión")] },
    { i: "🧾", n: _t("recibo de pago"), ok: _t("Para demostrar que ya pagué"), bad: [_t("Para pedir empleo"), _t("Para votar"), _t("Para viajar")] },
    { i: "📋", n: _t("hoja de vida"), ok: _t("Para mostrar mi experiencia al buscar trabajo"), bad: [_t("Para pagar impuestos"), _t("Para pedir una cita médica"), _t("Para tomar el bus")] },
    { i: "📄", n: _t("fórmula médica"), ok: _t("Para reclamar medicamentos en la farmacia"), bad: [_t("Para entrar al cine"), _t("Para pagar el arriendo"), _t("Para abrir una cuenta")] },
    { i: "📆", n: _t("agenda"), ok: _t("Para anotar citas y no olvidarlas"), bad: [_t("Para guardar dinero"), _t("Para medir la temperatura"), _t("Para cargar el celular")] }
  ];

  var CAUSAS = [
    { i: "💡", a: _t("tocas el interruptor de la luz"), ok: _t("La luz se enciende"), bad: [_t("Empieza a llover"), _t("Suena el celular")] },
    { i: "🧊", a: _t("dejas un hielo al sol"), ok: _t("El hielo se derrite"), bad: [_t("El hielo crece"), _t("El hielo se vuelve agua caliente de inmediato")] },
    { i: "🔋", a: _t("no cargas el celular en todo el día"), ok: _t("Se apaga por falta de batería"), bad: [_t("Se carga solo"), _t("Funciona más rápido")] },
    { i: "🥛", a: _t("dejas la leche fuera de la nevera todo el día"), ok: _t("Se puede dañar"), bad: [_t("Se vuelve más fresca"), _t("Se convierte en queso para comer")] },
    { i: "🚰", a: _t("dejas la llave del agua abierta"), ok: _t("Se desperdicia el agua"), bad: [_t("Se ahorra agua"), _t("Se apaga la luz")] }
  ];
  var CAUSAS_ADULTO = [
    { i: "🔥", a: _t("dejas la estufa encendida sin vigilar"), ok: _t("Se puede quemar la comida o empezar un incendio"), bad: [_t("La comida se enfría sola"), _t("No pasa nada")] },
    { i: "⏰", a: _t("no programas la alarma para ir a trabajar"), ok: _t("Puedes llegar tarde"), bad: [_t("Llegas más temprano"), _t("Te dan el día libre")] },
    { i: "💸", a: _t("gastas todo tu dinero en la primera semana"), ok: _t("Te puede faltar dinero para lo necesario"), bad: [_t("Te sobra dinero"), _t("El banco te regala más")] },
    { i: "🧾", a: _t("no pagas un servicio a tiempo"), ok: _t("Te cobran un recargo o te cortan el servicio"), bad: [_t("Te devuelven el dinero"), _t("El servicio mejora")] },
    { i: "💊", a: _t("dejas de tomar un medicamento sin preguntar al médico"), ok: _t("Tu tratamiento puede no funcionar"), bad: [_t("Te curas más rápido"), _t("No importa")] },
    { i: "📵", a: _t("no avisas que vas a faltar al trabajo"), ok: _t("Tu jefe se preocupa y puede haber un llamado de atención"), bad: [_t("Te suben el sueldo"), _t("Nadie lo nota nunca")] }
  ];

  var SOCIALES = [
    { i: "😢", t: _t("Un compañero de clase está triste."), ok: _t("Le pregunto qué le pasa y lo escucho"), bad: [_t("Me burlo de él"), _t("Lo grabo con el celular")] },
    { i: "📚", t: _t("A una compañera se le cayeron los cuadernos."), ok: _t("Le ayudo a recogerlos"), bad: [_t("Me río y sigo caminando"), _t("Los pateo")] },
    { i: "✏️", t: _t("Alguien te presta un lapicero."), ok: _t("Le digo gracias y se lo devuelvo"), bad: [_t("Me lo quedo sin decir nada"), _t("Lo boto")] },
    { i: "👋", t: _t("Llegas al salón y ves a tu profesora."), ok: _t("La saludo"), bad: [_t("Paso sin mirarla"), _t("Le grito desde lejos")] },
    { i: "🎧", t: _t("Quieres usar el computador que está usando otra persona."), ok: _t("Le pregunto si me lo puede prestar cuando termine"), bad: [_t("Se lo quito"), _t("Lo apago para que se vaya")] }
  ];
  var SOCIALES_ADULTO = [
    { i: "😓", t: _t("Un compañero de trabajo comete un error y se ve preocupado."), ok: _t("Le digo que no se preocupe y le ayudo a corregirlo"), bad: [_t("Me río de él delante de otros"), _t("Le cuento a todos")] },
    { i: "⏳", t: _t("Alguien te interrumpe mientras estás concentrado."), ok: _t("Le pido amablemente que espere un momento"), bad: [_t("Le grito que se vaya"), _t("Lo ignoro y me voy")] },
    { i: "🙋", t: _t("No entiendes una instrucción de tu jefe."), ok: _t("Le pido que me la explique de nuevo"), bad: [_t("Sigo sin preguntar y me equivoco"), _t("Hago otra cosa")] },
    { i: "🤝", t: _t("Llega un compañero nuevo al trabajo."), ok: _t("Lo saludo y le explico cómo funcionan las cosas"), bad: [_t("Lo ignoro por completo"), _t("Le escondo sus cosas")] },
    { i: "😠", t: _t("Un cliente te habla de forma grosera."), ok: _t("Respondo con calma y busco ayuda de un supervisor"), bad: [_t("Le respondo también de forma grosera"), _t("Me voy sin decir nada")] },
    { i: "🏦", t: _t("No entiendes un trámite en el banco o en la EPS."), ok: _t("Pido que me lo expliquen más despacio"), bad: [_t("Me voy sin resolver mi duda"), _t("Firmo sin entender")] }
  ];

  var SEMAFORO_BASICO = [
    { i: "🚗", t: _t("Un desconocido se ofrece a llevarte a tu casa en su carro."), ok: _t("Le digo que no, gracias, y sigo mi camino"), bad: [_t("Me subo porque parece amable")] },
    { i: "📱", t: _t("Alguien que no conoces te pide tu contraseña por mensaje."), ok: _t("No se la doy y le cuento a alguien de confianza"), bad: [_t("Se la envío porque insiste")] },
    { i: "🚸", t: _t("Vas a cruzar y el semáforo peatonal está en rojo."), ok: _t("Espero a que cambie a verde"), bad: [_t("Cruzo corriendo porque tengo prisa")] },
    { i: "🔥", t: _t("Hueles gas en la cocina."), ok: _t("No prendo nada, abro las ventanas y aviso"), bad: [_t("Prendo la estufa para revisar")] },
    { i: "🔌", t: _t("Un enchufe está echando chispas."), ok: _t("No lo toco y aviso a un adulto o al encargado"), bad: [_t("Lo desconecto con las manos mojadas")] }
  ];
  var SEMAFORO_DINERO = [
    { i: "📞", t: _t("Te llaman diciendo que ganaste un premio, pero debes pagar primero."), ok: _t("No pago nada y cuelgo"), bad: [_t("Pago porque quiero el premio")] },
    { i: "💳", t: _t("Un mensaje dice que tu tarjeta se bloqueó y pide la clave."), ok: _t("No la doy y llamo directamente al banco"), bad: [_t("Envío la clave por el mensaje")] },
    { i: "🛍️", t: _t("Quieres comprar algo, pero no te alcanza el dinero del mes."), ok: _t("Espero a tener el dinero o busco algo más barato"), bad: [_t("Pido prestado sin pensar cómo pagar")] },
    { i: "🧾", t: _t("Un vendedor te presiona para firmar un contrato sin leerlo."), ok: _t("Pido tiempo para leerlo con calma"), bad: [_t("Firmo rápido para que deje de insistir")] },
    { i: "🏧", t: _t("Un desconocido se ofrece a ayudarte en el cajero."), ok: _t("No acepto y pido ayuda al personal del banco"), bad: [_t("Le doy mi tarjeta para que me ayude")] }
  ];
  var SEMAFORO_TRABAJO = [
    { i: "⚠️", t: _t("Ves un cable eléctrico dañado en tu área de trabajo."), ok: _t("Lo reporto al supervisor"), bad: [_t("Lo toco para ver si funciona")] },
    { i: "🧤", t: _t("Debes usar guantes de protección, pero los olvidaste."), ok: _t("Aviso y pido unos antes de empezar"), bad: [_t("Trabajo sin ellos para no molestar")] },
    { i: "🤒", t: _t("Te sientes muy enfermo para ir a trabajar."), ok: _t("Aviso a mi jefe y pido el día"), bad: [_t("Voy sin avisar y me siento peor")] },
    { i: "😳", t: _t("Un compañero te pide que mientas para cubrir un error suyo."), ok: _t("Le digo que no puedo hacerlo"), bad: [_t("Miento para ayudarlo")] },
    { i: "🕐", t: _t("Tu jefe te pide quedarte más tiempo y tenías una cita médica."), ok: _t("Le explico que tengo una cita y pregunto si puede ser otro día"), bad: [_t("Pierdo la cita sin decir nada")] }
  ];

  var RUTINAS = {
    casa3: [
      { t: _t("Lavarse las manos"), s: [["🚰", _t("Abro el agua")], ["🧼", _t("Me pongo jabón y froto")], ["🧻", _t("Me seco las manos")]] },
      { t: _t("Cepillarse los dientes"), s: [["🪥", _t("Pongo crema en el cepillo")], ["😁", _t("Me cepillo los dientes")], ["🚰", _t("Me enjuago la boca")]] },
      { t: _t("Cargar el celular"), s: [["🔌", _t("Conecto el cargador")], ["📱", _t("Conecto el celular")], ["🔋", _t("Espero a que cargue")]] },
      { t: _t("Hacer un café"), s: [["🫖", _t("Caliento el agua")], ["☕", _t("Sirvo el café")], ["🥄", _t("Lo revuelvo")]] }
    ],
    casa4: [
      { t: _t("Empezar el día"), s: [["🛏️", _t("Me levanto")], ["🚿", _t("Me baño")], ["👕", _t("Me visto")], ["🥣", _t("Desayuno")]] },
      { t: _t("Lavar los platos"), s: [["🍽️", _t("Recojo los platos sucios")], ["🧽", _t("Los enjabono")], ["🚰", _t("Los enjuago")], ["🧺", _t("Los dejo secar")]] },
      { t: _t("Lavar la ropa"), s: [["🧺", _t("Separo la ropa clara de la oscura")], ["🧴", _t("Pongo jabón en la lavadora")], ["🌀", _t("Lavo la ropa")], ["👕", _t("La cuelgo a secar")]] },
      { t: _t("Calentar comida en el microondas"), s: [["🍱", _t("Pongo la comida en un plato")], ["⏲️", _t("Programo el tiempo")], ["🔥", _t("Caliento la comida")], ["🍽️", _t("La saco con cuidado")]] },
      { t: _t("Cruzar la calle"), s: [["🚶", _t("Me detengo en el andén")], ["👀", _t("Miro a ambos lados")], ["🚦", _t("Espero el semáforo en verde")], ["✅", _t("Cruzo caminando")]] }
    ],
    banco: [
      { t: _t("Sacar dinero del cajero"), s: [["💳", _t("Introduzco la tarjeta")], ["🔢", _t("Marco mi clave sin que nadie vea")], ["💵", _t("Retiro el dinero")], ["👛", _t("Guardo la tarjeta y el dinero")]] },
      { t: _t("Pagar una factura en el banco"), s: [["🧾", _t("Llevo la factura")], ["🏦", _t("Hago la fila")], ["💳", _t("Pago en la caja")], ["📄", _t("Guardo el recibo")]] },
      { t: _t("Abrir una cuenta de ahorros"), s: [["🪪", _t("Llevo mi cédula")], ["📝", _t("Lleno el formulario")], ["✍️", _t("Firmo")], ["✅", _t("Recibo los datos de mi cuenta")]] },
      { t: _t("Comprar en el supermercado"), s: [["📝", _t("Reviso mi lista")], ["🛒", _t("Busco los productos")], ["💳", _t("Pago en la caja")], ["🧾", _t("Reviso el recibo")]] }
    ],
    trabajo: [
      { t: _t("Llegar puntual al trabajo"), s: [["⏰", _t("Me despierto con tiempo")], ["🚿", _t("Me alisto")], ["🚌", _t("Tomo el transporte a tiempo")], ["🏢", _t("Llego antes de la hora")]] },
      { t: _t("Avisar que llegarás tarde"), s: [["📱", _t("Reviso la hora")], ["📞", _t("Llamo a mi jefe")], ["🗣️", _t("Explico el motivo")], ["🚶", _t("Sigo en camino")]] },
      { t: _t("Empezar el turno"), s: [["🪪", _t("Muestro mi carné")], ["⏱️", _t("Marco la hora de entrada")], ["⛑️", _t("Me pongo el equipo de protección")], ["✅", _t("Empiezo mis tareas")]] }
    ],
    salud: [
      { t: _t("Pedir una cita médica"), s: [["📞", _t("Llamo a la EPS")], ["🗣️", _t("Explico qué necesito")], ["📅", _t("Me dan una fecha")], ["📝", _t("Anoto la cita")]] },
      { t: _t("Ir a la cita médica"), s: [["🪪", _t("Llevo mi documento")], ["🕐", _t("Llego a tiempo")], ["🩺", _t("El médico me revisa")], ["💊", _t("Recibo las indicaciones")]] },
      { t: _t("Reclamar medicamentos"), s: [["📄", _t("Llevo la fórmula")], ["🏥", _t("Voy a la farmacia")], ["⏳", _t("Espero mi turno")], ["✅", _t("Recibo los medicamentos")]] }
    ],
    vida5: [
      { t: _t("Buscar trabajo"), s: [["📋", _t("Actualizo mi hoja de vida")], ["🔎", _t("Busco ofertas")], ["📨", _t("Envío mi hoja de vida")], ["📞", _t("Respondo las llamadas")], ["🤝", _t("Voy a la entrevista")]] },
      { t: _t("Mudarse a una habitación"), s: [["💰", _t("Reviso cuánto puedo pagar")], ["🔎", _t("Busco opciones")], ["👀", _t("Visito el lugar")], ["📄", _t("Leo el contrato")], ["🔑", _t("Recibo las llaves")]] },
      { t: _t("Organizar el mes"), s: [["💵", _t("Recibo mi pago")], ["🏠", _t("Pago arriendo y servicios")], ["🛒", _t("Hago el mercado")], ["🐷", _t("Separo el ahorro")], ["🎬", _t("Uso lo que sobra para salir")]] },
      { t: _t("Viajar en bus intermunicipal"), s: [["🗓️", _t("Elijo la fecha")], ["🎫", _t("Compro el tiquete")], ["🧳", _t("Empaco")], ["🚌", _t("Llego a la terminal con tiempo")], ["📲", _t("Aviso cuando llego")]] }
    ]
  };

  var NECESIDAD = {
    necesario: { label: _t("Necesario este mes"), items: [["🏠", _t("arriendo")], ["💡", _t("recibo de luz")], ["🚌", _t("pasajes para ir a trabajar")], ["🍚", _t("mercado")], ["💊", _t("medicamentos")]] },
    espera: { label: _t("Puede esperar"), items: [["🎮", _t("videojuego nuevo")], ["👟", _t("tenis de marca")], ["🎬", _t("cine")], ["🎧", _t("audífonos nuevos")], ["🍕", _t("pedir domicilio")]] }
  };
  var AYUDA = {
    yo: { label: _t("Lo puedo hacer yo"), items: [["🧹", _t("barrer mi puesto")], ["📝", _t("anotar mis tareas")], ["🧤", _t("ponerme los guantes")], ["🗂️", _t("ordenar mi carpeta")], ["💧", _t("tomar agua en el descanso")]] },
    ayuda: { label: _t("Pido ayuda"), items: [["⚡", _t("arreglar un cable dañado")], ["🩸", _t("una herida que no para de sangrar")], ["🧯", _t("un incendio")], ["🛠️", _t("una máquina que suena raro")], ["😵", _t("un compañero que se desmaya")]] }
  };
  var URGENCIA = {
    urgente: { label: _t("Urgente hoy"), items: [["🧾", _t("factura que vence hoy")], ["🤒", _t("fiebre muy alta")], ["🔑", _t("perdí las llaves de la casa")], ["🚰", _t("una fuga de agua")]] },
    despues: { label: _t("Puede esperar"), items: [["👕", _t("comprar ropa")], ["📺", _t("ver una serie")], ["💇", _t("cortarme el pelo")], ["🧹", _t("ordenar el clóset")]] }
  };
  var A_QUIEN = [
    [_t("Me duele mucho una muela"), _t("Odontólogo")], [_t("Perdí mi tarjeta débito"), _t("Banco")], [_t("Me robaron el celular"), _t("Policía")],
    [_t("No sé qué tarea hacer en el turno"), _t("Jefe o supervisor")], [_t("Necesito una cita médica"), _t("EPS")], [_t("Se dañó la luz de la casa"), _t("Empresa de energía")]
  ];
  var DOCS_TRAMITE = [
    [_t("Reclamar medicamentos"), _t("Fórmula médica")], [_t("Abrir una cuenta"), _t("Cédula")], [_t("Pedir trabajo"), _t("Hoja de vida")],
    [_t("Demostrar que pagaste"), _t("Recibo de pago")], [_t("Viajar en bus intermunicipal"), _t("Tiquete")], [_t("Entrar a la empresa"), _t("Carné")]
  ];

  // ─── Mecánicas ───────────────────────────────────────────────────────────

  function aQueGrupo(p, s) {
    var keys = shuffle(Object.keys(p.cats)).slice(0, grow(2, 4, s));
    var k = keys[0], item = pick(p.cats[k].items);
    return {
      skill: "clasificar",
      prompt: _t("¿A qué grupo pertenece?"),
      visual: hero(item[0], item[1]),
      speech: _t("¿A qué grupo pertenece ") + item[1] + "?",
      options: shuffle(keys).map(function (key) { return { label: p.cats[key].label, value: key }; }),
      answer: k,
      hint: _t("Piensa para qué se usa o dónde lo encuentras."),
      explain: item[1].charAt(0).toUpperCase() + item[1].slice(1) + _t(" es del grupo ") + p.cats[k].label + "."
    };
  }

  function encontrarIgual(p, s) {
    var pool = shuffle(itemsOf(p.cats)), target = pool[0].it;
    var others = pool.slice(1, grow(3, 6, s)).map(function (x) { return x.it; });
    if (s >= 3) {
      var parecido = pool.filter(function (x) { return x.cat === pool[0].cat && x.it !== target && others.indexOf(x.it) === -1; })[0];
      if (parecido) others[0] = parecido.it;
    }
    var opts = shuffle([target].concat(others)).map(function (it) { return { label: '<span style="font-size:40px">' + it[0] + "</span>", value: it[1], aria: it[1] }; });
    return {
      skill: "atencion_visual",
      prompt: s >= 2 ? _t("Busca el que es exactamente igual. Ojo: hay uno parecido.") : _t("Busca el que es igual al de arriba."),
      visual: hero(target[0], s >= 3 ? "" : target[1]),
      speech: _t("Busca el que es igual: ") + target[1],
      options: opts,
      answer: target[1],
      hint: _t("Compara la forma completa, no solo el color."),
      explain: _t("El igual es ") + target[1] + "."
    };
  }

  function clasificarGrupos(p, s) {
    var keys = shuffle(Object.keys(p.cats)).slice(0, p.bins || 2);
    var n = grow(p.min || 4, p.max || 6, s), items = [], answer = {};
    var pool = shuffle(itemsOf(p.cats).filter(function (x) { return keys.indexOf(x.cat) !== -1; }));
    pool.slice(0, n).forEach(function (x, k) { var id = "i" + k; items.push({ id: id, label: label(x.it, s) }); answer[id] = x.cat; });
    return {
      type: "classify", skill: p.skill || "clasificar",
      prompt: p.prompt || _t("Lleva cada elemento a su grupo."),
      bins: keys.map(function (k) { return { id: k, label: p.cats[k].label }; }),
      items: items, answer: answer,
      hint: p.hint || _t("Toca un elemento y luego el grupo donde va."),
      explain: keys.map(function (k) { return p.cats[k].label + ": " + pool.slice(0, n).filter(function (x) { return x.cat === k; }).map(function (x) { return x.it[1]; }).join(", "); }).join(" · ") + "."
    };
  }

  function paraQueSirve(p, s) {
    var f = pick(p.bank);
    return {
      skill: "funcion_objetos",
      prompt: _t("¿Para qué sirve {o}?").replace("{o}", (/^[aeiouáéíóú]/i.test(f.n) ? _t("el ") : "") + f.n),
      visual: hero(f.i, f.n),
      options: textOpts(f.ok, f.bad, grow(2, 4, s)),
      answer: f.ok, layout: "list",
      hint: _t("Piensa en cuándo lo has visto usar."),
      explain: _t("Sirve: ") + U.lower(f.ok) + "."
    };
  }

  function queHaceFalta(p, s) {
    var pares = p.pairs, n = grow(3, Math.min(5, pares.length), s), set = shuffle(pares).slice(0, n);
    var left = [], right = [], ans = {};
    set.forEach(function (x, k) { left.push({ id: "a" + k, label: x[0] }); right.push({ id: "b" + k, label: x[1] }); ans["a" + k] = "b" + k; });
    return {
      type: "match", skill: p.skill || "relacionar",
      prompt: p.prompt,
      left: shuffle(left), right: shuffle(right), answer: ans,
      hint: p.hint || _t("Toca uno de la izquierda y luego su pareja a la derecha."),
      explain: set.map(function (x) { return x[0] + " → " + x[1]; }).join(" · ") + "."
    };
  }

  function unirUso(p, s) {
    var n = grow(3, 5, s), set = shuffle(p.bank).slice(0, n);
    var left = [], right = [], ans = {};
    set.forEach(function (f, k) { left.push({ id: "o" + k, label: s >= 4 ? f.n : ico(f.i, f.n) }); right.push({ id: "u" + k, label: f.ok }); ans["o" + k] = "u" + k; });
    return {
      type: "match", skill: "funcion_objetos",
      prompt: _t("Une cada objeto con su uso."),
      left: shuffle(left), right: shuffle(right), answer: ans,
      hint: _t("Empieza por el objeto que mejor conoces."),
      explain: set.map(function (f) { return f.n + ": " + U.lower(f.ok); }).join(" · ") + "."
    };
  }

  function queNoPertenece(p, s) {
    var keys = shuffle(Object.keys(p.cats)), main = keys[0];
    var same = shuffle(p.cats[main].items).slice(0, grow(3, 4, s));
    var intruder = pick(p.cats[keys[1]].items);
    var opts = shuffle(same.concat([intruder])).map(function (it) { return { label: label(it, s, 3), value: it[1], aria: it[1] }; });
    return {
      skill: "categorizar",
      prompt: _t("¿Cuál no pertenece al grupo?"),
      options: opts,
      answer: intruder[1],
      hint: _t("Busca qué tienen en común casi todos."),
      explain: _t("Los demás son del grupo ") + p.cats[main].label + "; " + intruder[1] + _t(" es de ") + p.cats[keys[1]].label + "."
    };
  }

  function causaEfecto(p, s) {
    var c = pick(p.bank);
    return {
      skill: "causa_efecto",
      prompt: _t("¿Qué pasa si ") + c.a + "?",
      visual: s <= 2 ? hero(c.i, "") : "",
      options: textOpts(c.ok, c.bad, s >= 2 ? 3 : 2),
      answer: c.ok, layout: "list",
      hint: _t("Imagina la situación paso a paso: ¿qué pasaría después?"),
      explain: c.ok + "."
    };
  }

  function social(p, s) {
    var x = pick(p.bank);
    return {
      skill: "habilidades_sociales",
      prompt: _t("¿Qué es lo más adecuado?"),
      visual: scene(x.i, x.t),
      speech: x.t + _t(" ¿Qué es lo más adecuado?"),
      options: textOpts(x.ok, x.bad, s >= 2 ? 3 : 2),
      answer: x.ok, layout: "list",
      hint: _t("Piensa cómo se sentiría la otra persona con cada opción."),
      explain: _t("Lo adecuado es: ") + U.lower(x.ok) + "."
    };
  }

  function semaforo(p, s) {
    var x = pick(p.bank);
    return {
      skill: "decision_segura",
      prompt: _t("Semáforo de decisiones: ¿qué haces?"),
      visual: scene(x.i, x.t),
      speech: x.t + _t(" ¿Qué haces?"),
      options: textOpts(x.ok, x.bad.concat(s >= 2 ? [_t("Lo hago para no quedar mal")] : []), s >= 2 ? 3 : 2),
      answer: x.ok, layout: "list",
      hint: _t("Pregúntate: ¿esto me puede poner en riesgo a mí o a otros?"),
      explain: _t("Lo seguro es: ") + U.lower(x.ok) + "."
    };
  }

  function ordenarRutina(p, s) {
    var r = pick(p.bank), steps = r.s;
    return {
      type: "order", skill: "secuencias",
      prompt: _t("Ordena los pasos para: ") + U.lower(r.t) + ".",
      slotsLabel: _t("Primero → después"),
      items: shuffle(steps.map(function (st, k) { return { id: "s" + k, label: label(st, s) }; })),
      answer: steps.map(function (st, k) { return "s" + k; }),
      answerLabel: steps.map(function (st) { return st[1]; }).join(" → "),
      hint: _t("¿Qué es lo primero que harías? Empieza por ahí."),
      explain: steps.map(function (st, k) { return (k + 1) + ". " + st[1]; }).join(" ") + "."
    };
  }

  function pasoQueFalta(p, s) {
    var r = pick(p.bank), gap = rnd(s >= 2 ? 0 : 1, r.s.length - 1), ok = r.s[gap][1];
    var others = [];
    Object.keys(RUTINAS).forEach(function (k) { RUTINAS[k].forEach(function (x) { if (x !== r) x.s.forEach(function (st) { others.push(st[1]); }); }); });
    var steps = r.s.map(function (st) { return { i: st[0], t: st[1] }; });
    return {
      skill: "secuencias",
      prompt: _t("Para ") + U.lower(r.t) + _t(", ¿qué paso falta?"),
      visual: stepsList(steps, gap),
      options: textOpts(ok, shuffle(others).slice(0, 4), s >= 2 ? 4 : 3),
      answer: ok, layout: "list",
      hint: _t("Lee el paso de antes y el de después del espacio vacío."),
      explain: _t("Falta: ") + U.lower(ok) + "."
    };
  }

  function antesDespues(p, s) {
    var r = pick(p.bank), k = rnd(1, r.s.length - 1), antes = Math.random() < 0.5 || s < 2;
    var ref = antes ? r.s[k] : r.s[k - 1], ok = antes ? r.s[k - 1][1] : r.s[k][1];
    var bads = r.s.filter(function (x) { return x[1] !== ok && x[1] !== ref[1]; }).map(function (x) { return x[1]; });
    if (bads.length < 1) return antesDespues(p, s);
    return {
      skill: "secuencias",
      prompt: _t("Para ") + U.lower(r.t) + _t(": ¿qué va justo ") + (antes ? _t("antes") : _t("después")) + _t(" de «") + U.lower(ref[1]) + _t("»?"),
      visual: hero(ref[0], ""),
      options: textOpts(ok, bads, Math.min(3, bads.length + 1)),
      answer: ok, layout: "list",
      hint: _t("Imagina que lo estás haciendo ahora mismo."),
      explain: (antes ? _t("Antes va: ") : _t("Después va: ")) + U.lower(ok) + "."
    };
  }

  function encontrarErrorRutina(p, s) {
    var r = pick(p.bank), n = r.s.length, i = rnd(0, n - 2);
    var shown = r.s.slice();
    var t = shown[i]; shown[i] = shown[i + 1]; shown[i + 1] = t;
    var opts = shown.map(function (st, k) { return { label: (k + 1) + ". " + st[1], value: k, aria: _t("Paso ") + (k + 1) + ": " + st[1] }; });
    return {
      skill: "secuencias",
      layout: "list",
      prompt: _t("En esta rutina de «") + U.lower(r.t) + _t("» hay dos pasos cambiados de lugar. Toca el primero de los dos que está fuera de orden."),
      options: opts,
      answer: i,
      hint: _t("Lee la rutina en voz alta: ¿en qué momento deja de tener sentido?"),
      explain: _t("Los pasos ") + (i + 1) + _t(" y ") + (i + 2) + _t(" están cambiados: primero va «") + U.lower(r.s[i][1]) + _t("».")
    };
  }

  function leerRecibo(p, s) {
    var empresas = [["💡", _t("Energía")], ["🚰", _t("Acueducto")], ["📶", _t("Internet")], ["🔥", _t("Gas")]];
    var e = pick(empresas), valor = rnd(25, 180) * 1000, dia = rnd(5, 28), mes = pick([_t("marzo"), _t("abril"), _t("mayo"), _t("junio")]);
    var tengo = valor + (Math.random() < 0.5 ? -1 : 1) * rnd(2, 20) * 1000;
    var preguntas = [
      { q: _t("¿Cuánto hay que pagar?"), ok: cop(valor), bad: [cop(valor + 10000), cop(dia * 1000), cop(Math.round(valor / 2))] },
      { q: _t("¿Hasta qué día se puede pagar sin recargo?"), ok: fecha(dia, mes), bad: [fecha(dia > 3 ? dia - 3 : dia + 3, mes), fecha(1, mes), _t("Cualquier día")] },
      { q: _t("Tienes ") + cop(tengo) + _t(". ¿Te alcanza para pagarlo?"), ok: tengo >= valor ? _t("Sí, me alcanza") : _t("No, me faltan ") + cop(valor - tengo), bad: [tengo >= valor ? _t("No, me falta dinero") : _t("Sí, me alcanza"), _t("No se puede saber")] }
    ];
    var q = preguntas[Math.min(2, Math.floor(s / 2) + (p.hard ? 1 : 0))];
    return {
      skill: "lectura_funcional",
      prompt: q.q,
      visual: '<div class="cog-doc"><h4>' + ico(e[0], _t("Factura de ") + e[1]) + _t("</h4><p><span>Valor a pagar</span><strong>") + cop(valor) + _t("</strong></p><p><span>Pague hasta</span><strong>") + fecha(dia, mes) + _t("</strong></p><p><span>Referencia</span><strong>") + rnd(100000, 999999) + "</strong></p></div>",
      options: textOpts(q.ok, q.bad, 3),
      answer: q.ok, layout: "list",
      hint: _t("Busca en la factura la línea que responde la pregunta."),
      explain: _t("La respuesta es: ") + q.ok + "."
    };
  }

  function horarioTurnos(p, s) {
    var nombres = ["Laura", "Andrés", "Camila", "Julián"], dias = [_t("Lunes"), _t("Martes"), _t("Miércoles"), _t("Jueves")];
    var turnos = [_t("6 a. m. – 2 p. m."), _t("2 p. m. – 10 p. m.")];
    var table = nombres.map(function () { return dias.map(function () { return pick(turnos); }); });
    var who = rnd(0, 3), day = rnd(0, 3), ok = table[who][day];
    var html = '<table class="dm-table" style="border-collapse:separate;border-spacing:0;border:1px solid var(--line);border-radius:12px;overflow:hidden;font-size:14px;background:var(--surface)"><tr><th style="padding:8px 12px;background:var(--canvas)"></th>' +
      dias.slice(0, grow(2, 4, s)).map(function (d) { return '<th style="padding:8px 12px;background:var(--canvas)">' + d + "</th>"; }).join("") + "</tr>" +
      nombres.map(function (n, r) { return '<tr><th style="padding:8px 12px;text-align:left">' + n + "</th>" + table[r].slice(0, grow(2, 4, s)).map(function (t) { return '<td style="padding:8px 12px;border-top:1px solid var(--line)">' + t + "</td>"; }).join("") + "</tr>"; }).join("") + "</table>";
    day = Math.min(day, grow(2, 4, s) - 1); ok = table[who][day];
    return {
      skill: "lectura_funcional",
      prompt: _t("¿En qué turno trabaja {p} el {d}?").replace("{p}", nombres[who]).replace("{d}", diaEnFrase(dias[day])),
      visual: html,
      options: turnos.map(function (t) { return { label: t, value: t }; }),
      answer: ok,
      hint: _t("Busca la fila con el nombre y baja por la columna del día."),
      explain: _t("{p} trabaja de {h} el {d}.").replace("{p}", nombres[who]).replace("{h}", ok).replace("{d}", diaEnFrase(dias[day]))
    };
  }

  function decidirDosCriterios(p, s) {
    var casos = [
      { t: _t("Tienes que llegar en 20 minutos y tienes ") + cop(12000) + _t(". El bus tarda 15 minutos y cuesta ") + cop(3200) + _t("; el taxi tarda 10 minutos y cuesta ") + cop(18000) + ".", ok: _t("Tomo el bus"), bad: [_t("Tomo el taxi"), _t("Me voy caminando 50 minutos")] },
      { t: _t("Tienes ") + cop(20000) + _t(" para el almuerzo de dos días. Un almuerzo cuesta ") + cop(16000) + _t(" y uno casero que llevas cuesta ") + cop(6000) + ".", ok: _t("Llevo almuerzo casero los dos días"), bad: [_t("Compro el almuerzo de ") + cop(16000) + _t(" el primer día"), _t("No almuerzo")] },
      { t: _t("Mañana entras a las 7 a. m. y el bus se demora 40 minutos. Te gusta dormir mucho."), ok: _t("Pongo la alarma a las 5:45 a. m."), bad: [_t("Pongo la alarma a las 6:45 a. m."), _t("No pongo alarma")] },
      { t: _t("Te ofrecen dos trabajos: uno paga más pero queda a 2 horas; otro paga un poco menos y queda a 20 minutos."), ok: _t("Comparo cuánto gasto en transporte y tiempo antes de decidir"), bad: [_t("Elijo el que paga más sin pensar en nada más"), _t("No elijo ninguno")] }
    ];
    var c = casos[rnd(0, Math.min(casos.length - 1, s))];
    return {
      skill: "toma_decisiones",
      prompt: _t("¿Qué decisión es la mejor?"),
      visual: scene("🤔", c.t),
      speech: c.t + _t(" ¿Qué decisión es la mejor?"),
      options: textOpts(c.ok, c.bad, 3),
      answer: c.ok, layout: "list",
      hint: _t("Revisa dos cosas: el tiempo y el dinero que tienes."),
      explain: _t("La mejor opción es: ") + U.lower(c.ok) + "."
    };
  }

  function memoriaPares(p, s) {
    var pairs = grow(p.pairs[0], p.pairs[1], s), support = 1;
    var banco = itemsOf(p.cats).map(function (x) { return x.it; });
    var picked = shuffle(banco).slice(0, pairs), deck = shuffle(picked.concat(picked));
    var prompt = _t("Encuentra las parejas. Toca dos cartas: si son iguales, quedan abiertas.");
    return {
      skill: "memoria_visual",
      prompt: prompt,
      hint: _t("Recuerda dónde viste cada dibujo antes de que se taparan."),
      mount: function (host, api) {
        var timers = [], alive = true;
        function later(fn, ms) { timers.push(setTimeout(function () { if (alive) fn(); }, ms)); }
        host.innerHTML = "";
        var status = document.createElement("p"); status.className = "cog-status"; status.setAttribute("role", "status");
        var grid = document.createElement("div"); grid.className = "cog-grid";
        grid.style.setProperty("--cols", pairs <= 3 ? 3 : 4);
        host.appendChild(status); host.appendChild(grid);
        var cards = [], open = null, lock = true, found = 0, errors = 0;
        function show(c) { c.up = true; c.b.textContent = c.it[0]; c.b.setAttribute("aria-label", _t("Carta ") + c.n + ": " + c.it[1]); }
        function hide(c) { c.up = false; c.b.textContent = "?"; c.b.setAttribute("aria-label", _t("Carta ") + c.n + _t(", boca abajo")); }
        deck.forEach(function (it, k) {
          var c = { it: it, n: k + 1 };
          c.b = document.createElement("button"); c.b.type = "button"; c.b.className = "game-option cog-card";
          c.b.addEventListener("click", function () { flip(c); });
          grid.appendChild(c.b); cards.push(c); show(c);
        });
        status.textContent = _t("Mira las cartas: se van a tapar en unos segundos.");
        later(function () { cards.forEach(hide); lock = false; status.textContent = _t("Parejas: {n} de {t}").replace("{n}", 0).replace("{t}", pairs); }, grow(4500, 2500, s));
        function flip(c) {
          if (lock || c.matched || c.up) return;
          show(c); api.sound("tap");
          if (!open) { open = c; return; }
          var first = open; open = null;
          if (first.it[1] === c.it[1]) {
            first.matched = c.matched = true;
            first.b.classList.add("is-correct"); c.b.classList.add("is-correct");
            first.b.disabled = c.b.disabled = true;
            found++; status.textContent = _t("Parejas: {n} de {t}").replace("{n}", found).replace("{t}", pairs);
            api.sound("ok");
            if (found === pairs) api.done({ stars: errors <= pairs ? 1 : errors <= pairs * 2 ? 0.75 : 0.5, message: _t("¡Encontraste todas las parejas!"), error: errors > pairs ? { wrong: errors, pairs: pairs } : null });
          } else {
            errors++; lock = true;
            later(function () { hide(first); hide(c); lock = false; }, 1000);
            if (errors === pairs + 1) api.hint();
            // Si sigue costando, se muestran de nuevo las cartas por un momento.
            if (errors > pairs && (errors - pairs) % (pairs * 2) === 0) {
              later(function () {
                lock = true; status.textContent = _t("Mira otra vez dónde está cada carta.");
                cards.forEach(function (x) { if (!x.matched) show(x); });
                later(function () { cards.forEach(function (x) { if (!x.matched) hide(x); }); lock = false; status.textContent = _t("Parejas: {n} de {t}").replace("{n}", found).replace("{t}", pairs); }, 2000);
              }, 1100);
            }
          }
        }
        return function () { alive = false; timers.forEach(clearTimeout); };
      }
    };
  }

  function repasoIntegrado(p, s) {
    var mecs = [
      function () { return aQueGrupo({ cats: CATS_ADULTO }, s); },
      function () { return ordenarRutina({ bank: RUTINAS.vida5.concat(RUTINAS.salud) }, s); },
      function () { return causaEfecto({ bank: CAUSAS_ADULTO }, s); },
      function () { return semaforo({ bank: SEMAFORO_DINERO.concat(SEMAFORO_TRABAJO) }, s); },
      function () { return leerRecibo({ hard: true }, s); }
    ];
    return mecs[s % mecs.length]();
  }

  // ─── Plan ────────────────────────────────────────────────────────────────
  var PLAN = {
    1: [
      [aQueGrupo, { cats: CATS }, _t("Vas a decidir a qué grupo pertenece cada objeto de la casa.")],
      [encontrarIgual, { cats: CATS }, _t("Vas a buscar el objeto que es exactamente igual.")],
      [clasificarGrupos, { cats: CATS, min: 4, max: 6 }, _t("Vas a llevar cada objeto a su grupo.")],
      [paraQueSirve, { bank: FUNCIONES }, _t("Vas a decir para qué sirve cada objeto.")],
      [causaEfecto, { bank: CAUSAS }, _t("Vas a pensar qué pasa después de una acción.")],
      [ordenarRutina, { bank: RUTINAS.casa3 }, _t("Vas a ordenar rutinas cortas de tres pasos.")],
      [unirUso, { bank: FUNCIONES }, _t("Vas a unir cada objeto con su uso.")],
      [queNoPertenece, { cats: CATS }, _t("Vas a encontrar el objeto que no pertenece al grupo.")],
      [memoriaPares, { cats: CATS, pairs: [3, 5] }, _t("Vas a encontrar parejas de cartas usando tu memoria.")],
      [semaforo, { bank: SEMAFORO_BASICO }, _t("Vas a elegir la decisión segura en situaciones de todos los días.")]
    ],
    2: [
      [ordenarRutina, { bank: RUTINAS.casa4 }, _t("Vas a ordenar rutinas de la casa de cuatro pasos.")],
      [pasoQueFalta, { bank: RUTINAS.casa4 }, _t("Vas a descubrir qué paso falta en una rutina.")],
      [antesDespues, { bank: RUTINAS.casa4 }, _t("Vas a decidir qué va antes y qué va después.")],
      [clasificarGrupos, { cats: { aseo: CATS.aseo, cocina: CATS.cocina, ropa: CATS.ropa }, bins: 3, min: 5, max: 7 }, _t("Vas a clasificar objetos de la casa en tres grupos.")],
      [social, { bank: SOCIALES }, _t("Vas a elegir cómo actuar con otras personas.")],
      [causaEfecto, { bank: CAUSAS.concat(CAUSAS_ADULTO.slice(0, 2)) }, _t("Vas a prever consecuencias en la casa.")],
      [queNoPertenece, { cats: CATS }, _t("Vas a encontrar el que no pertenece, con grupos más parecidos.")],
      [memoriaPares, { cats: { tecnologia: CATS.tecnologia, cocina: CATS.cocina, aseo: CATS.aseo }, pairs: [4, 6] }, _t("Vas a encontrar parejas con más cartas.")],
      [encontrarErrorRutina, { bank: RUTINAS.casa4 }, _t("Vas a encontrar los pasos cambiados de lugar en una rutina.")],
      [semaforo, { bank: SEMAFORO_BASICO }, _t("Vas a tomar decisiones seguras en la casa y en la calle.")]
    ],
    3: [
      [clasificarGrupos, { cats: CATS_ADULTO, bins: 3, min: 5, max: 7 }, _t("Vas a clasificar documentos, dinero y objetos de trabajo.")],
      [paraQueSirve, { bank: FUNCIONES_ADULTO }, _t("Vas a decir para qué sirven documentos y objetos de la vida adulta.")],
      [ordenarRutina, { bank: RUTINAS.banco }, _t("Vas a ordenar los pasos de trámites de dinero.")],
      [clasificarGrupos, { cats: NECESIDAD, min: 4, max: 7, skill: "prioridades", prompt: _t("¿Es necesario este mes o puede esperar?"), hint: _t("Pregúntate: ¿qué pasa si no lo pago este mes?") }, _t("Vas a separar gastos necesarios de los que pueden esperar.")],
      [pasoQueFalta, { bank: RUTINAS.banco }, _t("Vas a descubrir qué paso falta en un trámite.")],
      [causaEfecto, { bank: CAUSAS_ADULTO }, _t("Vas a prever las consecuencias de decisiones con dinero.")],
      [queHaceFalta, { pairs: DOCS_TRAMITE, prompt: _t("Une cada trámite con el documento que necesitas."), skill: "documentos" }, _t("Vas a unir cada trámite con el documento que necesitas.")],
      [leerRecibo, {}, _t("Vas a leer una factura y responder con sus datos.")],
      [semaforo, { bank: SEMAFORO_DINERO }, _t("Vas a reconocer engaños con dinero y elegir lo seguro.")],
      [antesDespues, { bank: RUTINAS.banco }, _t("Vas a decidir el orden correcto en trámites.")]
    ],
    4: [
      [ordenarRutina, { bank: RUTINAS.trabajo }, _t("Vas a ordenar rutinas del trabajo.")],
      [ordenarRutina, { bank: RUTINAS.salud }, _t("Vas a ordenar los pasos para cuidar tu salud.")],
      [social, { bank: SOCIALES_ADULTO }, _t("Vas a elegir cómo actuar con compañeros, jefes y clientes.")],
      [semaforo, { bank: SEMAFORO_TRABAJO }, _t("Vas a tomar decisiones seguras en el trabajo.")],
      [clasificarGrupos, { cats: AYUDA, min: 4, max: 7, skill: "pedir_ayuda", prompt: _t("¿Lo puedes hacer tú o debes pedir ayuda?"), hint: _t("Si hay riesgo para ti o para otros, pide ayuda.") }, _t("Vas a decidir qué puedes hacer tú y cuándo pedir ayuda.")],
      [queHaceFalta, { pairs: A_QUIEN, prompt: _t("Une cada problema con quién te puede ayudar."), skill: "pedir_ayuda" }, _t("Vas a unir cada problema con quién te puede ayudar.")],
      [horarioTurnos, {}, _t("Vas a leer un horario de turnos.")],
      [pasoQueFalta, { bank: RUTINAS.salud.concat(RUTINAS.trabajo) }, _t("Vas a descubrir qué paso falta en rutinas de trabajo y salud.")],
      [causaEfecto, { bank: CAUSAS_ADULTO }, _t("Vas a prever consecuencias en el trabajo y la salud.")],
      [memoriaPares, { cats: CATS_ADULTO, pairs: [4, 6] }, _t("Vas a encontrar parejas con objetos de la vida adulta.")]
    ],
    5: [
      [ordenarRutina, { bank: RUTINAS.vida5 }, _t("Vas a ordenar tareas largas de cinco pasos.")],
      [encontrarErrorRutina, { bank: RUTINAS.vida5 }, _t("Vas a encontrar errores de orden en planes largos.")],
      [clasificarGrupos, { cats: URGENCIA, min: 4, max: 7, skill: "prioridades", prompt: _t("¿Es urgente hoy o puede esperar?"), hint: _t("Urgente es lo que trae un problema si no lo haces hoy.") }, _t("Vas a decidir qué es urgente y qué puede esperar.")],
      [decidirDosCriterios, {}, _t("Vas a tomar decisiones pensando en el tiempo y el dinero.")],
      [pasoQueFalta, { bank: RUTINAS.vida5 }, _t("Vas a descubrir qué paso falta en un plan.")],
      [social, { bank: SOCIALES_ADULTO }, _t("Vas a resolver situaciones sociales más difíciles.")],
      [semaforo, { bank: SEMAFORO_BASICO.concat(SEMAFORO_DINERO, SEMAFORO_TRABAJO) }, _t("Vas a tomar decisiones seguras en cualquier situación.")],
      [queHaceFalta, { pairs: DOCS_TRAMITE.concat(A_QUIEN.slice(0, 2)), prompt: _t("Une cada situación con lo que necesitas."), skill: "documentos" }, _t("Vas a unir situaciones con lo que necesitas para resolverlas.")],
      [leerRecibo, { hard: true }, _t("Vas a leer facturas y decidir si te alcanza el dinero.")],
      [repasoIntegrado, {}, _t("Repaso final: un reto de cada habilidad que trabajaste.")]
    ]
  };

  var HABILIDADES = {
    clasificar: _t("Clasificar por grupos"),
    atencion_visual: _t("Fijarse en los detalles"),
    funcion_objetos: _t("Saber para qué sirven las cosas"),
    causa_efecto: _t("Prever consecuencias"),
    secuencias: _t("Ordenar los pasos de una rutina"),
    categorizar: _t("Encontrar lo que no pertenece"),
    memoria_visual: _t("Memoria visual"),
    decision_segura: _t("Tomar decisiones seguras"),
    habilidades_sociales: _t("Actuar bien con otras personas"),
    prioridades: _t("Decidir qué es prioritario"),
    documentos: _t("Saber qué documento usar"),
    lectura_funcional: _t("Leer facturas y horarios"),
    pedir_ayuda: _t("Saber cuándo y a quién pedir ayuda"),
    toma_decisiones: _t("Tomar decisiones con dos criterios"),
    relacionar: _t("Relacionar ideas")
  };

  global.IndecapGame.register({
    slug: "cognitiva_rutinas",
    skillLabels: HABILIDADES,
    plan: PLAN,
    getActivity: function (index) {
      var nivel = Math.min(5, Math.max(1, Math.ceil(index / 10)));
      var act = PLAN[nivel][(index - 1) % 10];
      return {
        intro: act[2] + _t(" Son ") + RETOS + _t(" retos que suben de dificultad, sin límite de tiempo."),
        rounds: RETOS,
        build: function (step) { return act[0](act[1], step); }
      };
    }
  });
})(window);
