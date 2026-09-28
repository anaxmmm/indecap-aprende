/**
 * EL DETECTOR DE LETRAS REBELDES — Dislexia
 *
 * Habilidad núcleo: ruta de acceso al léxico (fonológica + visual).
 *  - Lectura guiada (eco, compartida, sombra, solo) .. giro temporal superior
 *  - Cloze, vocabulario visual, reglas ............... forma visual de la palabra
 *  - Tilde y prosodia ................................ procesamiento fonológico
 *  - Ordenar grafonemas, dictado, ahorcado ........... decodificación
 *  - Trazado en lienzo ............................... motor + memoria visual
 *  - Homófonos, corrección de texto, lectura funcional  vida adulta (15-26 años)
 *
 * MAPA DE ETAPAS (5 Stages de 10 niveles, 50 en total, numeración continua):
 *   Stage 1 · Base            → niveles 1-10  (sin cambio de contenido)
 *   Stage 2 · Media           → niveles 11-20 (vocabulario y lectura de vida adulta)
 *   Stage 3 · Alta            → niveles 21-30 (lectura funcional, corrección de texto)
 *   Stage 4 · Muy Alta        → niveles 31-40 (instructivos, párrafos, homófonos en frase)
 *   Stage 5 · Súper Difícil   → niveles 41-50 (integración total, textos largos)
 *
 * El desbloqueo de nivel a nivel (score >= 60) lo maneja
 * games/services.py::get_unlocked_level, agnóstico al número de niveles.
 *
 * Diseño: tipografía legible (la activa el perfil del estudiante), nunca
 * penalización por error, palabra siempre pronunciable con voz sintética.
 * Nivel 10: evaluación embebida de la base.
 */
(function (global) {
  "use strict";

  // ─── Utilidades ───────────────────────────────────────────────────────────
  function rnd(a, b) { return Math.floor(Math.random() * (b - a + 1)) + a; }
  function pick(a) { return a[rnd(0, a.length - 1)]; }
  function shuffle(a) { a = a.slice(); for (var i = a.length - 1; i > 0; i--) { var j = rnd(0, i), t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  function el(tag, cls) { var n = document.createElement(tag); if (cls) n.className = cls; return n; }
  function live() { var n = el("p", "visually-hidden"); n.setAttribute("role", "status"); n.setAttribute("aria-live", "polite"); return n; }
  function mult(ctx) { var s = (ctx && ctx.support) || 1; return s === 1 ? 1.5 : (s === 2 ? 1.2 : 1); }
  function sched() {
    var alive = true, timers = [];
    return {
      later: function (fn, ms) { timers.push(setTimeout(function () { if (alive) fn(); }, ms)); },
      stop: function () { alive = false; timers.forEach(clearTimeout); }
    };
  }
  function addStyles(id, css) {
    if (document.getElementById(id)) return;
    var s = document.createElement("style"); s.id = id; s.textContent = css; document.head.appendChild(s);
  }
  function textOpts(ok, bads, n) {
    return shuffle([ok].concat(shuffle(bads).slice(0, n - 1))).map(function (t) { return { label: t, value: t, aria: t }; });
  }
  /** Muestra varias líneas de texto como párrafos, para lectura estática
      (sin interactividad de resaltado) dentro de un reto de opción única. */
  function textoVisual(lines) {
    return '<div class="dx-text">' + lines.map(function (l) { return '<p class="dx-line">' + l + "</p>"; }).join("") + "</div>";
  }

  addStyles("dislexia-styles", [
    ".game-shell .game-options .game-option{font-size:1.25rem}",
    ".dx-big{font-size:4rem;line-height:1}",
    ".dx-word-big{font-size:2.2rem;font-weight:700;letter-spacing:.08em;color:var(--g-frame)}",
    ".dx-status{flex-basis:100%;font-weight:600;color:var(--g-muted);margin-bottom:8px}",
    ".dx-text{flex-basis:100%;max-width:560px;margin:0 auto 14px;text-align:left}",
    ".dx-line{font-size:1.35rem;line-height:2.1;margin:0 0 6px}",
    ".dx-word.is-on{background:var(--g-accent-soft);color:var(--g-frame-dark);border-radius:6px}",
    ".dx-actions{flex-basis:100%;display:flex;flex-wrap:wrap;gap:12px;justify-content:center}",
    ".dx-canvas{flex-basis:100%;width:100%;max-width:320px;border:3px solid var(--g-frame);border-radius:16px;background:#FFFFFF;touch-action:none;cursor:crosshair}",
    ".dx-slots{flex-basis:100%;font-size:2.4rem;font-weight:700;letter-spacing:.35em;color:var(--g-frame)}",
    ".dx-keys{flex-basis:100%;display:grid;grid-template-columns:repeat(9,minmax(34px,1fr));gap:6px;max-width:440px;margin:0 auto}",
    ".game-option.dx-key{min-width:0;min-height:44px;padding:4px;font-size:1.05rem}",
    ".dx-input{flex-basis:100%;max-width:320px;font-size:1.5rem;text-align:center;padding:10px}",
    ".dx-model{flex-basis:100%;font-size:1.6rem;font-weight:700;color:var(--g-ok)}",
    ".seq-status{flex-basis:100%;font-weight:600;color:var(--g-muted);margin-bottom:8px}",
    ".seq-list{flex-basis:100%;list-style:none;margin:0 auto 12px;padding:0;max-width:480px;text-align:left}",
    ".seq-list li{background:var(--g-ok-soft);border:2px solid var(--g-ok);color:var(--g-ok);border-radius:12px;padding:10px 14px;margin-bottom:8px;font-weight:600}",
    ".seq-steps{flex-basis:100%;display:flex;flex-wrap:wrap;gap:12px;justify-content:center}",
    ".game-option.seq-step{display:flex;flex-direction:column;align-items:center;gap:6px;font-size:1.4rem;min-width:70px}",
    ".game-option.seq-next{outline:4px solid var(--g-accent);outline-offset:3px}"
  ].join("\n"));

  function sequenceMount(steps, help, showText, extra) {
    return function (host, api) {
      var n = steps.length;
      host.innerHTML = "";
      var lv = live(), status = el("p", "seq-status"), done = el("ol", "seq-list"), pool = el("div", "seq-steps");
      done.setAttribute("aria-label", "Ya ordenados");
      pool.setAttribute("role", "group"); pool.setAttribute("aria-label", "Elementos para ordenar");
      [lv, status, done, pool].forEach(function (x) { host.appendChild(x); });
      var order = shuffle(steps), g = 0;
      while (g++ < 10 && order.every(function (o, k) { return o.k === steps[k].k; })) order = shuffle(steps);
      var pos = 0, errors = 0, finished = false, highlight = help === 1, btns = [];
      function refresh() {
        status.textContent = "Letra " + Math.min(pos + 1, n) + " de " + n;
        btns.forEach(function (b) { b.el.classList.toggle("seq-next", highlight && pos < n && b.o.k === steps[pos].k); });
      }
      order.forEach(function (o) {
        var b = el("button", "game-option seq-step"); b.type = "button";
        if (showText) { var tx = el("span"); tx.textContent = o.t; b.appendChild(tx); }
        b.setAttribute("aria-label", o.t);
        b.addEventListener("click", function () { tap(b, o); });
        pool.appendChild(b); btns.push({ el: b, o: o });
      });
      function tap(btn, o) {
        if (finished) return;
        if (o.k === steps[pos].k) {
          pos++;
          btns = btns.filter(function (x) { return x.el !== btn; });
          btn.remove();
          var li = el("li"); li.textContent = o.t; done.appendChild(li);
          lv.textContent = o.t;
          api.feedback("", "");
          if (pos === n) { end(); return; }
          refresh();
          if (btns[0]) btns[0].el.focus();
        } else {
          errors++;
          btn.classList.add("is-wrong");
          setTimeout(function () { btn.classList.remove("is-wrong"); }, 500);
          api.feedback("Esa letra va después. Escucha la palabra otra vez.", "retry");
          if (help === 2) highlight = true;
          refresh();
          if (errors === 2) api.hint();
        }
      }
      function end() {
        finished = true;
        status.textContent = "¡Palabra completa!";
        var err = { wrong: errors, help_level: help, attempts: errors + 1 };
        Object.keys(extra || {}).forEach(function (k) { err[k] = extra[k]; });
        api.say(extra && extra.word, true);
        api.done({
          stars: errors === 0 ? 1 : (errors === 1 ? 0.75 : (errors <= 3 ? 0.5 : 0.25)),
          message: errors === 0 ? "¡Formaste la palabra sin errores!" : "¡Formaste la palabra!",
          error: errors ? err : null
        });
      }
      refresh();
      return function () { finished = true; };
    };
  }

  // ─── Datos: base (Stage 1, sin cambios) ────────────────────────────────────
  var TEXTOS = [
    { s: ["Ana tiene un perro pequeño.", "El perro se llama Bruno.", "Todas las tardes salen a caminar al parque."], q: "¿Cómo se llama el perro?", ok: "Bruno", bad: ["Toby", "Max"] },
    { s: ["Hoy llueve mucho en la ciudad.", "Luis lleva su paraguas amarillo.", "Camina despacio para no mojarse."], q: "¿De qué color es el paraguas?", ok: "Amarillo", bad: ["Rojo", "Azul"] },
    { s: ["En la finca hay una vaca grande.", "La vaca da leche fresca.", "Marta la recoge cada mañana."], q: "¿Qué da la vaca?", ok: "Leche", bad: ["Pan", "Miel"] }
  ];
  var CLOZE = [
    ["🐄", "vaca", "v", "b"], ["👢", "bota", "b", "v"], ["🔑", "llave", "ll", "y"], ["👟", "zapato", "z", "s"],
    ["🦒", "jirafa", "j", "g"], ["🏠", "casa", "s", "z"], ["🧀", "queso", "qu", "k"], ["🐴", "caballo", "b", "v"],
    ["🚲", "bicicleta", "c", "s"], ["🌳", "árbol", "b", "v"]
  ];
  var TILDE = [
    ["canción", "can-CIÓN", "aguda"], ["papel", "pa-PEL", "aguda"], ["reloj", "re-LOJ", "aguda"], ["camión", "ca-MIÓN", "aguda"],
    ["casa", "CA-sa", "llana"], ["árbol", "ÁR-bol", "llana"], ["lápiz", "LÁ-piz", "llana"], ["mesa", "ME-sa", "llana"],
    ["teléfono", "te-LÉ-fo-no", "esdrújula"], ["pájaro", "PÁ-ja-ro", "esdrújula"], ["música", "MÚ-si-ca", "esdrújula"], ["número", "NÚ-me-ro", "esdrújula"]
  ];
  var TILDE_REGLA = {
    aguda: "suena más fuerte en la última sílaba",
    llana: "suena más fuerte en la penúltima sílaba",
    esdrújula: "suena más fuerte en la antepenúltima sílaba y siempre lleva tilde"
  };
  var ORDEN = [
    { w: "gato", g: ["g", "a", "t", "o"], i: "🐱" }, { w: "luna", g: ["l", "u", "n", "a"], i: "🌙" },
    { w: "mesa", g: ["m", "e", "s", "a"], i: "🪑" }, { w: "llave", g: ["ll", "a", "v", "e"], i: "🔑" },
    { w: "chico", g: ["ch", "i", "c", "o"], i: "👦" }, { w: "pelota", g: ["p", "e", "l", "o", "t", "a"], i: "⚽" }
  ];
  var LETRAS = ["a", "o", "e", "m", "s", "b", "p", "d"];
  var VOCAB = [
    ["🐄", "vaca", "baca", "vaka"], ["🔑", "llave", "yave", "llabe"], ["🦒", "jirafa", "girafa", "jirafa "],
    ["🐝", "abeja", "aveja", "abexa"], ["🐜", "hormiga", "ormiga", "hormica"], ["🧹", "escoba", "escova", "eskoba"],
    ["🪟", "ventana", "bentana", "ventaba"], ["🧀", "queso", "keso", "quezo"]
  ];
  var AHORCADO = [
    { w: "tesoro", i: "💰" }, { w: "pirata", i: "🏴‍☠️" }, { w: "barco", i: "⛵" },
    { w: "isla", i: "🏝️" }, { w: "ballena", i: "🐋" }, { w: "montaña", i: "⛰️" }
  ];
  var DICTADO = ["vaca", "llave", "jirafa", "zapato", "escuela", "camión"];
  var REGLAS = [
    { r: "Antes de p y b se escribe M", ok: "tambor", bad: ["tanbor", "tanvor"] },
    { r: "Antes de v se escribe N", ok: "envase", bad: ["embase", "enbase"] },
    { r: "Las palabras terminadas en -aba se escriben con B", ok: "cantaba", bad: ["cantava", "cantaba "] },
    { r: "Con «güe» y «güi» se usa diéresis", ok: "pingüino", bad: ["pinguino", "pingiuno"] },
    { r: "Las palabras que empiezan por «hum-» llevan H", ok: "humo", bad: ["umo", "jumo"] },
    { r: "Con las letras «gui» la U no se pronuncia", ok: "guitarra", bad: ["gitarra", "ghitarra"] }
  ];

  // ─── Datos: vida adulta (Stage 2 en adelante, 15-26 años) ──────────────────
  var CLOZE_ADULTO = [
    ["🚌", "autobús", "b", "v"], ["💼", "trabajo", "b", "v"], ["🧾", "impuesto", "s", "z"],
    ["✉️", "mensaje", "j", "g"], ["📞", "llamada", "ll", "y"], ["📋", "vacante", "v", "b"],
    ["🏦", "cuenta", "c", "qu"], ["💳", "tarjeta", "j", "g"], ["📅", "agenda", "g", "j"], ["🔑", "contraseña", "s", "z"]
  ];
  var VOCAB_ADULTO = [
    ["💻", "computador", "conputador", "computadór"], ["📄", "documento", "dokumento", "documeto"],
    ["🖋️", "firma", "hirma", "firmma"], ["🏢", "oficina", "ofisina", "oficna"],
    ["📅", "agenda", "ajenda", "aguenda"], ["💳", "tarjeta", "tarjeda", "targeta"],
    ["🧾", "factura", "fautura", "fatura"], ["📱", "celular", "zelular", "selular"],
    ["🚌", "autobús", "autobuz", "autovús"], ["🔑", "contraseña", "contraceña", "contrasenia"]
  ];
  var ORDEN_ADULTO = [
    { w: "trabajo", g: ["t", "r", "a", "b", "a", "j", "o"], i: "💼" },
    { w: "oficina", g: ["o", "f", "i", "c", "i", "n", "a"], i: "🏢" },
    { w: "reunión", g: ["r", "e", "u", "n", "i", "ó", "n"], i: "🗓️" },
    { w: "cheque", g: ["ch", "e", "q", "u", "e"], i: "🏦" },
    { w: "correo", g: ["c", "o", "r", "r", "e", "o"], i: "✉️" },
    { w: "llamada", g: ["ll", "a", "m", "a", "d", "a"], i: "📞" }
  ];
  var LETRAS_ADULTO = ["Á", "É", "Í", "Ó", "Ú", "Ñ", "B", "V", "G", "J"];
  // Las palabras del ahorcado no llevan tilde porque el teclado del juego
  // solo tiene a-z y ñ: una palabra con tilde no se podría completar.
  var AHORCADO_ADULTO = [
    { w: "entrevista", i: "🧑‍💼" }, { w: "presupuesto", i: "💰" }, { w: "certificado", i: "📜" },
    { w: "contrato", i: "📃" }, { w: "salario", i: "💵" }, { w: "empleo", i: "💼" }
  ];
  var DICTADO_ADULTO = ["computador", "documento", "entrevista", "presupuesto", "matrícula", "supervisor"];
  var DICTADO_FRASES = ["Buenos días", "Hasta luego", "Muchas gracias", "Con gusto", "Por favor confirme", "Quedo atento"];
  var REGLAS_ADULTO = [
    { r: "Los verbos terminados en -ger y -gir se escriben con G", ok: "recoger", bad: ["recojer", "recoguer"] },
    { r: "Las palabras terminadas en -sión suelen venir de verbos terminados en -der, -dir o -ter", ok: "decisión", bad: ["desición", "decizión"] },
    { r: "Las palabras terminadas en -cción vienen de palabras con -cto o -ctor", ok: "acción", bad: ["acsión", "ación"] },
    { r: "Se escribe con H toda palabra que empieza por «hosp-», «host-» u «hosti-»", ok: "hospital", bad: ["ospital", "jospital"] },
    { r: "El prefijo «sub-» se mantiene aunque complique la pronunciación", ok: "subrayar", bad: ["surayar", "suvrayar"] },
    { r: "Las palabras terminadas en -aje se escriben con J", ok: "mensaje", bad: ["mensage", "menzaje"] }
  ];
  var TILDE_ADULTO = [
    ["según", "se-GÚN", "aguda"], ["además", "a-de-MÁS", "aguda"], ["así", "a-SÍ", "aguda"],
    ["carácter", "ca-RÁC-ter", "llana"], ["fácil", "FÁ-cil", "llana"], ["útil", "Ú-til", "llana"],
    ["análisis", "a-NÁ-li-sis", "esdrújula"], ["décimo", "DÉ-ci-mo", "esdrújula"]
  ];
  var HOMOFONOS = [
    { frase: "No sé si ___ alguien en la oficina.", ok: "hay", bad: ["ahí", "ay"], regla: "«Hay» viene del verbo haber; «ahí» indica lugar; «ay» expresa dolor o sorpresa." },
    { frase: "Deja el paquete ___ mismo, junto a la puerta.", ok: "ahí", bad: ["hay", "ay"], regla: "«Ahí» indica un lugar específico." },
    { frase: "___, me golpeé con la mesa.", ok: "Ay", bad: ["Hay", "Ahí"], regla: "«Ay» expresa dolor, sorpresa o queja." },
    { frase: "Espero que ___ a la reunión de mañana.", ok: "vayas", bad: ["vallas", "bayas"], regla: "«Vayas» viene del verbo ir." },
    { frase: "Pusieron ___ nuevas alrededor del terreno.", ok: "vallas", bad: ["vayas", "bayas"], regla: "«Vallas» son cercas o carteles publicitarios." },
    { frase: "El postre lleva varias ___ silvestres.", ok: "bayas", bad: ["vayas", "vallas"], regla: "«Bayas» son frutos pequeños." },
    { frase: "El jefe quiere que ___ el informe antes del viernes.", ok: "revises", bad: ["rebises", "revices"], regla: "Se escribe con V." },
    { frase: "Ese vendedor siempre trata de ___ al cliente.", ok: "convencer", bad: ["combencer", "convenser"], regla: "Se escribe con V." },
    { frase: "No quiero ___ ningún compromiso todavía.", ok: "asumir", bad: ["azumir", "asummir"], regla: "Se escribe con S." },
    { frase: "___ tarde otra vez al trabajo.", ok: "Llegué", bad: ["Yegué", "Llegé"], regla: "Se escribe con doble L." }
  ];
  var CORRECCION = [
    { texto: "Nos vemos mañana en la ofisina a las 8am.", mal: "ofisina", bien: "oficina" },
    { texto: "Perdon por la demora, ya envío el archivo.", mal: "Perdon", bien: "Perdón" },
    { texto: "Necesito que confirmes tu aciztencia al taller.", mal: "aciztencia", bien: "asistencia" },
    { texto: "El profesor nos dio una prorroga para la entrega.", mal: "prorroga", bien: "prórroga" },
    { texto: "Voy a ablar con el supervisor sobre el turno.", mal: "ablar", bien: "hablar" },
    { texto: "Ese producto tiene una garantia de un año.", mal: "garantia", bien: "garantía" },
    { texto: "Disculpa la moletia, ¿me puedes llamar luego?", mal: "moletia", bien: "molestia" },
    { texto: "El exámen quedó programado para el lunes.", mal: "exámen", bien: "examen" },
    { texto: "Ayer resivimos el pago de la factura.", mal: "resivimos", bien: "recibimos" },
    { texto: "Muchas grasias por la oportunidad de la entrevista.", mal: "grasias", bien: "gracias" }
  ];
  var LECTURA_FUNCIONAL = [
    { s: ["Se busca auxiliar de bodega.", "Turno de 7am a 3pm, de lunes a sábado.", "Enviar hoja de vida al correo empleos@textil.com antes del viernes."],
      q: "¿A qué correo hay que enviar la hoja de vida?", ok: "empleos@textil.com", bad: ["turno@textil.com", "bodega@textil.com"] },
    { s: ["Recuerda: la entrega del proyecto final es el 20 de octubre.", "Debes subir el archivo en formato PDF.", "No se aceptan entregas después de las 11:59 p.m."],
      q: "¿En qué formato debe subirse el archivo?", ok: "PDF", bad: ["Word", "Excel"] },
    { s: ["Su cita médica fue reprogramada para el jueves 14.", "Debe llegar 15 minutos antes con su documento de identidad.", "Si no puede asistir, cancele con un día de anticipación."],
      q: "¿Con cuánta anticipación debe cancelar si no puede asistir?", ok: "un día", bad: ["una semana", "una hora"] },
    { s: ["El banco informa un cambio en el horario de atención.", "Ahora abre de 8am a 4pm, de lunes a viernes.", "Los sábados permanecerá cerrado."],
      q: "¿A qué hora abre ahora el banco?", ok: "8am", bad: ["7am", "9am"] },
    { s: ["Tu pedido fue enviado y llegará en 3 días hábiles.", "Puedes rastrearlo con el código 4521.", "Si no llega, comunícate con soporte."],
      q: "¿Cuál es el código de rastreo?", ok: "4521", bad: ["4512", "1524"] },
    { s: ["La matrícula para el próximo semestre inicia el 5 de noviembre.", "Debes traer tu documento de identidad y el recibo de pago.", "El horario de atención es de 9am a 5pm."],
      q: "¿Qué documento debes traer además del recibo de pago?", ok: "documento de identidad", bad: ["certificado médico", "carta laboral"] }
  ];

  // ─── Datos: Stage 4 y 5 (Muy Alta y Súper Difícil) ─────────────────────────
  var LECTURA_INSTRUCTIVOS = [
    { s: ["Para restablecer tu contraseña, entra a la página de inicio.", "Pulsa el enlace «Olvidé mi contraseña».", "Escribe tu correo y espera el mensaje de confirmación.", "El enlace del mensaje solo funciona durante 30 minutos."],
      q: "¿Cuánto tiempo funciona el enlace del mensaje?", ok: "30 minutos", bad: ["3 horas", "1 día"] },
    { s: ["Empresa de logística busca conductor.", "Se requiere licencia vigente y dos años de experiencia.", "El contrato es a término fijo con prestaciones de ley.", "Las entrevistas serán el martes a las 10 de la mañana."],
      q: "¿Qué día serán las entrevistas?", ok: "martes", bad: ["jueves", "lunes"] },
    { s: ["Antes de usar la licuadora, verifica que la tapa esté bien cerrada.", "No la uses con las manos mojadas.", "Después de cada uso, desconéctala y lávala con agua tibia."],
      q: "¿Qué debes hacer después de cada uso?", ok: "Desconectarla y lavarla", bad: ["Dejarla conectada", "Guardarla sin lavar"] },
    { s: ["La biblioteca presta libros por ocho días.", "Puedes renovar el préstamo una sola vez.", "Si entregas tarde, pagas una multa por cada día de retraso."],
      q: "¿Cuántas veces puedes renovar el préstamo?", ok: "Una vez", bad: ["Dos veces", "Ninguna"] },
    { s: ["Hola equipo, la reunión del lunes se movió para el miércoles.", "Será en la sala 3, a las 2 de la tarde.", "Por favor lleven sus informes impresos."],
      q: "¿En qué sala será la reunión?", ok: "Sala 3", bad: ["Sala 2", "Sala 5"] },
    { s: ["Se arrienda apartamento de dos habitaciones.", "Incluye servicios de agua y gas, la luz se paga aparte.", "Interesados llamar al 3005550148."],
      q: "¿Qué servicio NO está incluido?", ok: "La luz", bad: ["El agua", "El gas"] }
  ];
  var LECTURA_LARGA = [
    { s: ["El contrato tiene una duración de seis meses.", "El pago se realiza los primeros cinco días de cada mes.", "Si alguna de las partes quiere terminarlo antes, debe avisar con quince días de anticipación.", "El contratista trabajará de lunes a viernes.", "No incluye trabajo los días festivos."],
      q: "¿Con cuántos días de anticipación se debe avisar para terminar el contrato?", ok: "Quince días", bad: ["Cinco días", "Seis días"] },
    { s: ["El curso tiene cuatro módulos y dura diez semanas.", "Cada módulo termina con una evaluación virtual.", "Para aprobar, necesitas al menos el setenta por ciento en todas las evaluaciones.", "Puedes repetir una evaluación una sola vez.", "El certificado se entrega en formato digital."],
      q: "¿Cuántas veces puedes repetir una evaluación?", ok: "Una vez", bad: ["Dos veces", "Todas las que quieras"] },
    { s: ["Este producto tiene garantía de doce meses desde la fecha de compra.", "La garantía cubre defectos de fábrica, pero no golpes ni humedad.", "Para hacerla válida debes presentar la factura original.", "El servicio técnico atiende de lunes a sábado.", "Las reparaciones tardan máximo diez días hábiles."],
      q: "¿Qué documento debes presentar para hacer válida la garantía?", ok: "La factura original", bad: ["La cédula", "El manual de uso"] },
    { s: ["La convocatoria de becas está abierta hasta el 30 de noviembre.", "Pueden aplicar estudiantes de segundo semestre en adelante.", "Se debe enviar el formulario, una carta de motivación y el certificado de notas.", "Los resultados se publicarán en la primera semana de diciembre.", "Solo se recibirán solicitudes por el portal web."],
      q: "¿Cuándo se publican los resultados?", ok: "Primera semana de diciembre", bad: ["30 de noviembre", "Segunda semana de enero"] },
    { s: ["Buenas tardes. Les recuerdo que el inventario se hará el sábado.", "El horario será de 6 de la mañana a 2 de la tarde.", "Quienes trabajen ese día descansarán el lunes.", "Deben llevar chaleco y zapatos de seguridad.", "Quien no pueda asistir debe avisar hoy mismo."],
      q: "¿Qué día descansarán quienes trabajen el sábado?", ok: "El lunes", bad: ["El domingo", "El martes"] }
  ];
  var CORRECCION_PARRAFOS = [
    { texto: "Hola equipo. Les escribo para confirmar la reunión del jueves. Por favor traigan el informe con todos los datos actualisados.", mal: "actualisados", bien: "actualizados" },
    { texto: "Buenas tardes, profesora. Le envío mi trabajo final ajunto. Quedo atenta a cualquier corrección que deba hacer.", mal: "ajunto", bien: "adjunto" },
    { texto: "Señor cliente, su pedido ya fue despachado. Recibirá el paquete en un plazo de tres días abiles.", mal: "abiles", bien: "hábiles" },
    { texto: "Recuerden que mañana es el simulacro de evacuación. Todos deben dirijirse al punto de encuentro sin correr.", mal: "dirijirse", bien: "dirigirse" },
    { texto: "Estimado usuario, su solicitud fue aprobada. El documento estará disponible en la pagina web desde el lunes.", mal: "pagina", bien: "página" },
    { texto: "Hoy tuvimos una jornada muy productiva. Agradezco a todos su colavoración y compromiso con el proyecto.", mal: "colavoración", bien: "colaboración" },
    { texto: "Adjunto el contrato firmado. Por favor verifiquen que los datos personales esten correctos antes del viernes.", mal: "esten", bien: "estén" },
    { texto: "El gerente pidió que revicemos los números del mes antes de enviarlos a contabilidad.", mal: "revicemos", bien: "revisemos" },
    { texto: "Gracias por comunicarse con nosotros. Su reclamo fue registrado y sera atendido en las próximas horas.", mal: "sera", bien: "será" },
    { texto: "Queremos invitarte al taller de manejo del estrés. Habrá refrigerios y certificado de asistensia para todos los participantes.", mal: "asistensia", bien: "asistencia" }
  ];
  var HOMOFONOS_FRASE = [
    { frase: "___ si el jefe ya llegó.", ok: "A ver", bad: ["Haber", "Aver"], regla: "«A ver» se usa para mirar o comprobar algo; «haber» es un verbo." },
    { frase: "El paquete debe ___ llegado ayer.", ok: "haber", bad: ["a ver", "aver"], regla: "«Haber» es un verbo: aquí acompaña a «llegado»." },
    { frase: "El plomero cambió el ___ de la ducha.", ok: "tubo", bad: ["tuvo", "tuvó"], regla: "«Tubo» es un conducto; «tuvo» viene del verbo tener." },
    { frase: "Ella ___ un problema con la factura.", ok: "tuvo", bad: ["tubo", "tuvó"], regla: "«Tuvo» viene del verbo tener." },
    { frase: "Es la primera ___ que trabajo en un banco.", ok: "vez", bad: ["ves", "bez"], regla: "«Vez» es una ocasión; «ves» viene del verbo ver." },
    { frase: "¿Tú ___ el error en el documento?", ok: "ves", bad: ["vez", "bes"], regla: "«Ves» viene del verbo ver." },
    { frase: "___ llegas a tiempo, avísame.", ok: "Si no", bad: ["Sino", "Sinó"], regla: "«Si no» expresa una condición." },
    { frase: "No quiero café, ___ té.", ok: "sino", bad: ["si no", "sinó"], regla: "«Sino» contrapone: no es una cosa, sino otra." },
    { frase: "Llegó tarde ___ perdió el bus.", ok: "porque", bad: ["por qué", "porqué"], regla: "«Porque» da la causa de algo." },
    { frase: "¿___ no fuiste a la reunión?", ok: "Por qué", bad: ["Porque", "Porqué"], regla: "«Por qué» se usa para preguntar el motivo." },
    { frase: "Se ___ el vaso y se derramó el agua.", ok: "cayó", bad: ["calló", "cayo"], regla: "«Cayó» viene del verbo caer; «calló» viene de callar." },
    { frase: "La ___ de interés del banco cambió esta semana.", ok: "tasa", bad: ["taza", "tassa"], regla: "«Tasa» es un porcentaje o tarifa; «taza» es un recipiente." }
  ];
  var CLOZE_AVANZADO = [
    ["🎓", "graduación", "c", "s"], ["📊", "análisis", "s", "z"], ["⚖️", "abogado", "b", "v"],
    ["📜", "excepción", "c", "s"], ["🗳️", "elección", "cc", "c"], ["🏛️", "gobierno", "b", "v"],
    ["🚀", "proyecto", "y", "ll"], ["🧠", "consciente", "sc", "c"], ["🎯", "objetivo", "j", "g"],
    ["💡", "inteligencia", "g", "j"], ["🏗️", "construcción", "cc", "c"]
  ];
  var TILDE_AVANZADO = [
    ["también", "tam-BIÉN", "aguda"], ["café", "ca-FÉ", "aguda"], ["jamás", "ja-MÁS", "aguda"],
    ["actriz", "ac-TRIZ", "aguda"], ["ciudad", "ciu-DAD", "aguda"], ["salud", "sa-LUD", "aguda"],
    ["azúcar", "a-ZÚ-car", "llana"], ["cárcel", "CÁR-cel", "llana"], ["dólar", "DÓ-lar", "llana"],
    ["ágil", "Á-gil", "llana"], ["examen", "e-XA-men", "llana"], ["joven", "JO-ven", "llana"],
    ["cómodo", "CÓ-mo-do", "esdrújula"], ["rápido", "RÁ-pi-do", "esdrújula"], ["económico", "e-co-NÓ-mi-co", "esdrújula"],
    ["médico", "MÉ-di-co", "esdrújula"], ["último", "ÚL-ti-mo", "esdrújula"], ["trámite", "TRÁ-mi-te", "esdrújula"]
  ];
  var ORDEN_AVANZADO = [
    { w: "contrato", g: ["c", "o", "n", "t", "r", "a", "t", "o"], i: "📃" },
    { w: "entrevista", g: ["e", "n", "t", "r", "e", "v", "i", "s", "t", "a"], i: "🧑‍💼" },
    { w: "documento", g: ["d", "o", "c", "u", "m", "e", "n", "t", "o"], i: "📄" },
    { w: "supervisor", g: ["s", "u", "p", "e", "r", "v", "i", "s", "o", "r"], i: "👷" },
    { w: "presupuesto", g: ["p", "r", "e", "s", "u", "p", "u", "e", "s", "t", "o"], i: "💰" },
    { w: "responsable", g: ["r", "e", "s", "p", "o", "n", "s", "a", "b", "l", "e"], i: "✅" }
  ];
  var LETRAS_MINUSCULAS = ["g", "q", "y", "j", "ñ", "á", "é", "í", "ó", "ú"];
  var LETRAS_CONFUSAS = ["b", "d", "p", "q", "g", "j", "y", "B", "D", "P"];
  var AHORCADO_TECNICO = [
    { w: "supervisor", i: "👷" }, { w: "presupuesto", i: "💰" }, { w: "inventario", i: "📦" },
    { w: "proveedor", i: "🚚" }, { w: "contabilidad", i: "🧮" }, { w: "aprendizaje", i: "🎓" },
    { w: "certificado", i: "📜" }
  ];
  var DICTADO_ORACIONES = [
    "Necesito una copia del documento", "La reunión empieza a las ocho", "Envíe la factura por correo",
    "Mañana entrego el informe final", "Quedo atento a su respuesta", "Confirmo mi asistencia al taller"
  ];
  var DICTADO_LARGO = [
    "Le agradezco su atención y quedo pendiente", "El pago se realizará el próximo viernes",
    "Adjunto la factura y el comprobante de pago", "Solicito una cita para renovar mi documento",
    "Gracias por su paciencia y comprensión", "Por favor revise los datos antes de firmar"
  ];
  var REGLAS_EXIGENTES = [
    { r: "Las palabras terminadas en -illo e -illa se escriben con LL", ok: "cuchillo", bad: ["cuchiyo", "cuchilo"] },
    { r: "Las palabras que empiezan por «bibl-» se escriben con B", ok: "biblioteca", bad: ["viblioteca", "bibliotecca"] },
    { r: "Después de N se escribe V, no B", ok: "invitar", bad: ["imbitar", "inbitar"] },
    { r: "Las palabras terminadas en -ción llevan C, no S ni X", ok: "situación", bad: ["situasión", "situaxión"] },
    { r: "Antes de e e i el sonido suave se escribe con C", ok: "conocer", bad: ["conozer", "conoser"] },
    { r: "Las palabras terminadas en -bilidad se escriben con B", ok: "posibilidad", bad: ["posivilidad", "posibilidat"] },
    { r: "Los verbos terminados en -ger se escriben con G", ok: "proteger", bad: ["protejer", "protecer"] },
    { r: "Antes de consonante suele escribirse «ex», no «es»", ok: "extraño", bad: ["estraño", "extranio"] }
  ];

  // Bancos combinados para el Stage 5 (se juntan una sola vez, al cargar).
  var CLOZE_TODO = CLOZE_AVANZADO.concat(CLOZE_ADULTO);
  var TILDE_TODO = TILDE_AVANZADO.concat(TILDE_ADULTO);
  var HOMOFONOS_TODO = HOMOFONOS_FRASE.concat(HOMOFONOS);
  var REGLAS_TODO = REGLAS_EXIGENTES.concat(REGLAS_ADULTO);
  var TEXTOS_TODOS = LECTURA_LARGA.concat(LECTURA_INSTRUCTIVOS);
  var CORRECCION_TODO = CORRECCION_PARRAFOS.concat(CORRECCION);
  var DICTADO_TODO = DICTADO_LARGO.concat(DICTADO_ORACIONES);
  var AHORCADO_TODO = AHORCADO_TECNICO.concat(AHORCADO_ADULTO);

  // ─── Mecánicas de opción única ─────────────────────────────────────────────
  function retoCloze(p) {
    var banco = (p && p.bancos) || CLOZE;
    var c = pick(banco), i = c[1].indexOf(c[2]);
    var blank = c[1].slice(0, i) + "_" + c[1].slice(i + c[2].length);
    var prompt = "Completa la palabra: " + blank;
    return {
      skill: "cloze_ortografia", prompt: prompt, speech: "Completa la palabra " + c[1] + ". Falta una letra.",
      visual: '<span class="dx-big">' + c[0] + '</span><span class="dx-word-big">' + blank + "</span>",
      options: shuffle([c[2], c[3]]).map(function (t) { return { label: t, value: t, aria: "Letra " + t }; }),
      answer: c[2], answerLabel: c[2],
      hint: "Di la palabra en voz alta y fíjate en cómo suena al principio o en el medio.",
      explain: "Se escribe «" + c[1] + "»."
    };
  }
  function retoTilde(p) {
    var banco = (p && p.bancos) || TILDE;
    var t = pick(banco);
    var prompt = "Clasifica la palabra «" + t[0] + "»: ¿aguda, llana o esdrújula?";
    return {
      skill: "tilde_prosodia", prompt: prompt, speech: prompt,
      visual: '<span class="dx-word-big">' + t[1] + "</span>",
      options: ["aguda", "llana", "esdrújula"].map(function (k) { return { label: k.charAt(0).toUpperCase() + k.slice(1), value: k, aria: k }; }),
      answer: t[2], answerLabel: t[2],
      hint: "Di la palabra y busca la sílaba que suena más fuerte.",
      explain: "«" + t[0] + "» es " + t[2] + ": " + TILDE_REGLA[t[2]] + "."
    };
  }
  function retoVocab(p) {
    var banco = (p && p.bancos) || VOCAB;
    var v = pick(banco);
    var prompt = "¿Cómo se escribe correctamente este dibujo?";
    return {
      skill: "vocabulario_visual", prompt: prompt, speech: prompt,
      visual: '<span class="dx-big">' + v[0] + "</span>",
      options: textOpts(v[1], [v[2], v[3]].filter(function (x) { return x.trim() !== v[1]; }), 3),
      answer: v[1], answerLabel: v[1],
      hint: "Recuerda la imagen de la palabra: cómo se ve escrita.",
      explain: "Se escribe «" + v[1] + "»."
    };
  }
  function retoRegla(p) {
    var banco = (p && p.bancos) || REGLAS;
    var r = pick(banco);
    var bad = r.bad.map(function (x) { return x.trim(); }).filter(function (x) { return x !== r.ok; });
    var prompt = "Regla: " + r.r + ". ¿Cuál palabra está bien escrita?";
    return {
      skill: "reglas_ortograficas", prompt: prompt, speech: prompt,
      visual: '<span class="dx-big">📜</span>',
      options: textOpts(r.ok, bad, 3), answer: r.ok, answerLabel: r.ok,
      hint: "Lee la regla otra vez y busca la palabra que la cumple.",
      explain: "«" + r.ok + "» cumple la regla."
    };
  }
  function retoHomofono(p) {
    var banco = (p && p.bancos) || HOMOFONOS;
    var h = pick(banco);
    var prompt = "Completa la frase: " + h.frase;
    return {
      skill: "homofonos", prompt: prompt, speech: h.frase.replace("___", "espacio en blanco"),
      visual: '<span class="dx-word-big">' + h.frase + "</span>",
      options: textOpts(h.ok, h.bad, Math.min(3, h.bad.length + 1)),
      answer: h.ok, answerLabel: h.ok,
      hint: "Piensa en el significado de cada palabra antes de elegir.",
      explain: h.regla
    };
  }
  function retoCorreccion(p) {
    var banco = (p && p.bancos) || CORRECCION;
    var c = pick(banco);
    var palabras = c.texto.replace(/[.,]/g, "").split(" ").filter(function (w) { return w.length > 3 && w !== c.mal; });
    var distractores = shuffle(palabras).slice(0, 3);
    var prompt = "Lee el mensaje y encuentra la palabra que está mal escrita:";
    return {
      skill: "correccion_texto", prompt: prompt, speech: prompt + " " + c.texto,
      visual: textoVisual([c.texto]),
      options: textOpts(c.mal, distractores, Math.min(4, distractores.length + 1)),
      answer: c.mal, answerLabel: c.mal,
      hint: "Lee cada palabra despacio, en voz alta si puedes.",
      explain: "«" + c.mal + "» está mal escrita: se escribe «" + c.bien + "»."
    };
  }
  function retoLecturaFuncional(p) {
    var banco = (p && p.textos) || LECTURA_FUNCIONAL;
    var t = pick(banco);
    return {
      skill: "lectura_funcional", prompt: t.q, speech: t.s.join(" ") + " " + t.q,
      visual: textoVisual(t.s),
      options: textOpts(t.ok, t.bad, Math.min(3, t.bad.length + 1)),
      answer: t.ok, answerLabel: t.ok,
      hint: "Vuelve a leer el mensaje y busca el dato exacto que se pregunta.",
      explain: "La respuesta es «" + t.ok + "»."
    };
  }

  // ─── Mecánicas con interfaz propia ────────────────────────────────────────
  /** Lectura guiada: eco, compartida, sombra o solo. Acepta p.textos para
      usar un banco de textos distinto al de la base (vida adulta). */
  function roundLectura(p, ctx, index) {
    var mode = p.mode, textos = p.textos || TEXTOS;
    var t = textos[((p.offset || 0) + index) % textos.length], m = mult(ctx);
    var lab = {
      eco: "Escucha y sigue las palabras con la vista.",
      compartida: "Leemos por turnos: NOVA lee una frase y tú lees la siguiente.",
      sombra: "Lee en voz alta al mismo tiempo que NOVA.",
      solo: "Lee tú en voz alta. Pulsa «Ya leí» al terminar cada frase."
    };
    var prompt = "Lectura guiada. " + lab[mode];
    return {
      skill: "lectura_" + mode, prompt: prompt, speech: prompt,
      hint: "Sigue con el dedo o con la vista la palabra resaltada.",
      mount: function (host, api) {
        var s = sched(); host.innerHTML = "";
        var lv = live(), status = el("p", "dx-status"), txt = el("div", "dx-text"), actions = el("div", "dx-actions");
        [lv, status, txt, actions].forEach(function (x) { host.appendChild(x); });
        var words = t.s.map(function (sen) {
          var line = el("p", "dx-line");
          var arr = sen.split(" ").map(function (w) { var sp = el("span", "dx-word"); sp.textContent = w + " "; line.appendChild(sp); return sp; });
          txt.appendChild(line); return arr;
        });
        var errors = 0, closed = false;
        function clear() { words.forEach(function (a) { a.forEach(function (w) { w.classList.remove("is-on"); }); }); }
        function button(label, primary, fn) {
          var b = el("button", "game-btn " + (primary ? "game-btn--primary" : "game-btn--ghost"));
          b.type = "button"; b.textContent = label; b.addEventListener("click", fn); actions.appendChild(b); return b;
        }
        function play(i) {
          if (closed) return;
          clear(); actions.innerHTML = "";
          if (i >= t.s.length) { ask(); return; }
          var own = mode === "solo" || (mode === "compartida" && i % 2 === 1);
          if (own) {
            status.textContent = "Te toca leer: frase " + (i + 1) + " de " + t.s.length;
            lv.textContent = status.textContent;
            words[i].forEach(function (w) { w.classList.add("is-on"); });
            button("Ya leí", true, function () { play(i + 1); }).focus();
          } else {
            status.textContent = "NOVA lee: frase " + (i + 1) + " de " + t.s.length;
            api.say(t.s[i], true);
            var step = Math.round(430 * m);
            words[i].forEach(function (w, k) { s.later(function () { clear(); w.classList.add("is-on"); }, k * step); });
            s.later(function () { play(i + 1); }, words[i].length * step + 700);
          }
        }
        function ask() {
          status.textContent = "Pregunta de comprensión: " + t.q;
          lv.textContent = status.textContent; api.say(t.q, true);
          textOpts(t.ok, t.bad, 3).forEach(function (o) {
            var b = el("button", "game-option"); b.type = "button"; b.textContent = o.label;
            b.addEventListener("click", function () {
              if (closed) return;
              if (o.value === t.ok) {
                closed = true; b.classList.add("is-correct");
                api.done({
                  stars: errors === 0 ? 1 : (errors === 1 ? 0.75 : 0.5),
                  message: "¡Bien leído!",
                  error: errors ? { wrong: errors, mode: mode, attempts: errors + 1 } : null
                });
              } else {
                errors++; b.classList.add("is-wrong"); b.disabled = true;
                api.feedback("Vuelve a mirar el texto y prueba otra opción.", "retry");
              }
            });
            actions.appendChild(b);
          });
        }
        button("Empezar la lectura", true, function () { play(0); });
        return function () { closed = true; s.stop(); };
      }
    };
  }

  function roundOrdenar(p, ctx) {
    var banco = (p && p.bancos) || ORDEN;
    var w = pick(banco);
    var steps = w.g.map(function (g, i) { return { k: g, t: g, i: null, n: i }; });
    var prompt = "Forma la palabra «" + w.w + "» tocando las letras en orden.";
    return {
      skill: "ordenar_grafonemas", prompt: prompt, speech: "Forma la palabra " + w.w + " tocando las letras en orden.",
      visual: '<span class="dx-big">' + w.i + "</span>",
      hint: "Di la palabra despacio y toca cada sonido en orden.",
      mount: sequenceMount(steps, (ctx && ctx.support) || 1, true, { word: w.w })
    };
  }

  /** Trazado: se calcula cuánto del camino punteado cubrió el trazo. */
  function roundTrazo(p, ctx, index) {
    var L = p.letters[((p.offset || 0) + index) % p.letters.length];
    var thr = ((ctx && ctx.support) || 1) === 1 ? 0.4 : (ctx.support === 2 ? 0.5 : 0.6);
    var prompt = "Traza la letra «" + L + "» siguiendo el camino punteado, con el dedo o el lápiz óptico.";
    return {
      skill: "trazado_letra", prompt: prompt, speech: prompt,
      hint: "Empieza por arriba y sigue las líneas punteadas despacio.",
      mount: function (host, api) {
        var W = 320, H = 230, FONT = "bold 190px Arial, Helvetica, sans-serif", INK = "#1E40FF";
        host.innerHTML = "";
        var lv = live(), canvas = el("canvas", "dx-canvas"), actions = el("div", "dx-actions");
        canvas.width = W; canvas.height = H; canvas.setAttribute("role", "img");
        canvas.setAttribute("aria-label", "Lienzo para trazar la letra " + L + ". Si no puedes trazar, usa el botón de ayuda del docente.");
        [lv, canvas, actions].forEach(function (x) { host.appendChild(x); });
        var view = canvas.getContext("2d");
        var ink = document.createElement("canvas"); ink.width = W; ink.height = H;
        var ic = ink.getContext("2d"); ic.lineWidth = 16; ic.lineCap = "round"; ic.lineJoin = "round"; ic.strokeStyle = INK; ic.fillStyle = INK;
        var mask = document.createElement("canvas"); mask.width = W; mask.height = H;
        var mc = mask.getContext("2d");
        mc.font = FONT; mc.textAlign = "center"; mc.textBaseline = "middle"; mc.fillStyle = "#000"; mc.strokeStyle = "#000"; mc.lineWidth = 8;
        mc.fillText(L, W / 2, H / 2 + 8); mc.strokeText(L, W / 2, H / 2 + 8);

        function draw() {
          view.clearRect(0, 0, W, H); view.fillStyle = "#FFFFFF"; view.fillRect(0, 0, W, H);
          view.font = FONT; view.textAlign = "center"; view.textBaseline = "middle";
          view.setLineDash([3, 9]); view.lineWidth = 3; view.strokeStyle = "#5A6570";
          view.strokeText(L, W / 2, H / 2 + 8); view.setLineDash([]);
          view.drawImage(ink, 0, 0);
        }
        function pos(e) { var r = canvas.getBoundingClientRect(); return { x: (e.clientX - r.left) * W / r.width, y: (e.clientY - r.top) * H / r.height }; }
        var drawing = false, last = null, attempts = 0, closed = false;
        canvas.addEventListener("pointerdown", function (e) {
          if (closed) return; drawing = true; last = pos(e);
          try { canvas.setPointerCapture(e.pointerId); } catch (x) {}
          ic.beginPath(); ic.arc(last.x, last.y, 8, 0, Math.PI * 2); ic.fill(); draw();
        });
        canvas.addEventListener("pointermove", function (e) {
          if (!drawing || closed) return; var q = pos(e);
          ic.beginPath(); ic.moveTo(last.x, last.y); ic.lineTo(q.x, q.y); ic.stroke(); last = q; draw();
        });
        ["pointerup", "pointercancel"].forEach(function (n) { canvas.addEventListener(n, function () { drawing = false; }); });

        function clearInk() { ic.clearRect(0, 0, W, H); draw(); }
        function button(label, primary, fn) {
          var b = el("button", "game-btn " + (primary ? "game-btn--primary" : "game-btn--ghost"));
          b.type = "button"; b.textContent = label; b.addEventListener("click", fn); actions.appendChild(b); return b;
        }
        button("Listo", true, function () {
          if (closed) return;
          var m = mc.getImageData(0, 0, W, H).data, k = ic.getImageData(0, 0, W, H).data, mt = 0, cov = 0, it = 0, out = 0;
          for (var i = 3; i < m.length; i += 4) {
            var inM = m[i] > 40, inK = k[i] > 40;
            if (inM) { mt++; if (inK) cov++; }
            if (inK) { it++; if (!inM) out++; }
          }
          if (it < 200) { api.feedback("Traza la letra con el dedo antes de pulsar Listo.", "retry"); return; }
          var c = mt ? cov / mt : 0, o = it ? out / it : 1;
          attempts++;
          if (c >= thr && o <= 0.55) {
            closed = true;
            api.done({
              stars: attempts === 1 ? 1 : (attempts === 2 ? 0.75 : 0.5),
              message: "¡Trazaste la «" + L + "»!",
              error: attempts > 1 ? { attempts: attempts, letter: L } : null
            });
          } else if (attempts >= 3) {
            closed = true;
            api.done({ stars: 0.5, message: "Buen intento con la «" + L + "». Seguimos practicando.", error: { attempts: attempts, letter: L, coverage: Math.round(c * 100) } });
          } else {
            api.feedback("Casi. Sigue el camino punteado y vuelve a intentarlo.", "retry");
            clearInk(); if (attempts === 2) api.hint();
          }
        });
        button("Borrar", false, function () { if (!closed) clearInk(); });
        button("Necesito ayuda del docente", false, function () {
          if (closed) return; closed = true;
          api.done({ stars: 0.5, message: "Lo trazamos juntos con el docente.", error: { help_requested: true, letter: L, attempts: attempts + 1 } });
        });
        draw();
        return function () { closed = true; };
      }
    };
  }

  /** Ahorcado sin castigo: cada error revela más el dibujo-pista. */
  function roundAhorcado(p, ctx) {
    var banco = (p && p.bancos) || AHORCADO;
    var d = pick(banco), word = d.w, help = (ctx && ctx.support) || 1;
    var prompt = "Descubre la palabra secreta. Toca letras; cada error revela más el dibujo.";
    return {
      skill: "ahorcado_palabra", prompt: prompt, speech: prompt,
      hint: "Prueba con las vocales primero.",
      mount: function (host, api) {
        host.innerHTML = "";
        var lv = live(), pic = el("div", "dx-big"), slots = el("div", "dx-slots"), keys = el("div", "dx-keys");
        pic.textContent = d.i; pic.setAttribute("aria-hidden", "true"); pic.style.flexBasis = "100%";
        keys.setAttribute("role", "group"); keys.setAttribute("aria-label", "Letras");
        [lv, pic, slots, keys].forEach(function (x) { host.appendChild(x); });
        var shown = word.split("").map(function () { return false; }), wrong = 0, closed = false, btns = {};
        if (help === 1) shown[0] = true;
        function render() {
          slots.textContent = word.split("").map(function (c, i) { return shown[i] ? c : "_"; }).join(" ");
          slots.setAttribute("aria-label", "Palabra: " + word.split("").map(function (c, i) { return shown[i] ? c : "espacio vacío"; }).join(", "));
          pic.style.opacity = String(Math.min(1, 0.15 + wrong * 0.14));
        }
        function guess(ch) {
          if (closed || !btns[ch] || btns[ch].disabled) return;
          btns[ch].disabled = true;
          var hit = false;
          word.split("").forEach(function (c, i) { if (c === ch) { shown[i] = true; hit = true; } });
          if (hit) btns[ch].classList.add("is-correct"); else { wrong++; btns[ch].classList.add("is-wrong"); api.feedback("Esa letra no está. Prueba otra.", "retry"); }
          render();
          if (shown.every(Boolean)) finish(false);
          else if (wrong >= 7) { shown = shown.map(function () { return true; }); render(); finish(true); }
          if (hit) api.feedback("", "");
          if (wrong === 3) api.hint();
        }
        function finish(gaveUp) {
          closed = true; pic.style.opacity = "1";
          api.say(word, true);
          api.done({
            stars: gaveUp ? 0.5 : (wrong <= 2 ? 1 : (wrong <= 4 ? 0.75 : 0.5)),
            message: "La palabra era «" + word + "».",
            error: wrong ? { wrong: wrong, word: word, attempts: wrong + 1 } : null
          });
        }
        "abcdefghijklmnñopqrstuvwxyz".split("").forEach(function (ch) {
          var b = el("button", "game-option dx-key"); b.type = "button"; b.textContent = ch; b.setAttribute("aria-label", "Letra " + ch);
          b.addEventListener("click", function () { guess(ch); });
          keys.appendChild(b); btns[ch] = b;
        });
        function onKey(e) {
          if (e.ctrlKey || e.metaKey || e.altKey) return;
          var k = (e.key || "").toLowerCase();
          if (k.length === 1) guess(k);
        }
        document.addEventListener("keydown", onKey);
        render();
        return function () { closed = true; document.removeEventListener("keydown", onKey); };
      }
    };
  }

  /** Dictado con comparación y segunda oportunidad. Acepta p.bancos para
      usar palabras o frases más largas en niveles avanzados. */
  function roundDictado(p) {
    var banco = (p && p.bancos) || DICTADO;
    var w = pick(banco);
    var prompt = "Escucha y escribe con el teclado.";
    return {
      skill: "dictado", prompt: prompt, speech: prompt,
      hint: "Pulsa «Escuchar» las veces que necesites y escribe con calma.",
      mount: function (host, api) {
        host.innerHTML = "";
        var lv = live(), actions = el("div", "dx-actions"), input = el("input", "form-control dx-input"), model = el("p", "dx-model");
        input.type = "text"; input.setAttribute("autocomplete", "off"); input.setAttribute("autocapitalize", "off");
        input.setAttribute("spellcheck", "false"); input.setAttribute("aria-label", "Escribe lo que escuchaste");
        model.hidden = true;
        var listen = el("button", "game-btn game-btn--ghost"); listen.type = "button"; listen.textContent = "🔊 Escuchar";
        var check = el("button", "game-btn game-btn--primary"); check.type = "button"; check.textContent = "Comprobar";
        actions.appendChild(listen); actions.appendChild(check);
        [lv, actions, input, model].forEach(function (x) { host.appendChild(x); });
        var tries = 0, closed = false;
        listen.addEventListener("click", function () { api.say(w, true); });
        function submit() {
          if (closed) return;
          var v = input.value.trim();
          if (!v) { api.feedback("Escribe lo que escuchaste.", "retry"); return; }
          tries++;
          if (v === w) {
            closed = true; model.hidden = true;
            api.done({ stars: tries === 1 ? 1 : 0.75, message: "¡Bien escrito: «" + w + "»!", error: tries > 1 ? { word: w, attempts: tries } : null });
          } else if (tries === 1) {
            model.hidden = false; model.textContent = "Modelo: " + w;
            lv.textContent = "Compara con el modelo: " + w;
            api.feedback("Compara con el modelo y escríbelo de nuevo.", "retry"); input.value = ""; input.focus();
          } else {
            closed = true;
            api.done({ stars: 0.5, message: "Se escribe «" + w + "». Sigue practicando.", error: { word: w, typed: v, attempts: tries } });
          }
        }
        check.addEventListener("click", submit);
        input.addEventListener("keydown", function (e) { if (e.key === "Enter") { e.preventDefault(); submit(); } });
        return function () { closed = true; };
      }
    };
  }

  // ─── Definición de los niveles (50: 5 Stages de 10 niveles) ───────────────
  var CONSTRUCTORES = {
    cloze: function (p) { return retoCloze(p); },
    tilde: function (p) { return retoTilde(p); },
    vocab: function (p) { return retoVocab(p); },
    regla: function (p) { return retoRegla(p); },
    homofono: function (p) { return retoHomofono(p); },
    correccion: function (p) { return retoCorreccion(p); },
    lecturaFuncional: function (p) { return retoLecturaFuncional(p); },
    lectura_eco: function (p, c, i) { return roundLectura(Object.assign({}, p, { mode: "eco" }), c, i); },
    lectura_compartida: function (p, c, i) { return roundLectura(Object.assign({}, p, { mode: "compartida" }), c, i); },
    lectura_sombra: function (p, c, i) { return roundLectura(Object.assign({}, p, { mode: "sombra" }), c, i); },
    lectura_solo: function (p, c, i) { return roundLectura(Object.assign({}, p, { mode: "solo" }), c, i); },
    ordenar: roundOrdenar,
    trazo: roundTrazo,
    ahorcado: roundAhorcado,
    dictado: function (p) { return roundDictado(p); }
  };

  var NIVELES = {
    // ══ Stage 1 · Base (1-10): sin cambios ═══════════════════════════════════
    1: { rounds: 3, mechanics: ["lectura_eco"], params: { lectura_eco: {} },
         intro: "Stage 1 · Nivel 1 · Hola, soy NOVA. Los Detectores de Letras Rebeldes atrapamos letras que se esconden. Empezamos leyendo juntos: yo leo y tú sigues con los ojos." },
    2: { rounds: 5, mechanics: ["cloze"], params: { cloze: {} },
         intro: "Stage 1 · Nivel 2 · A estas palabras se les escapó una letra. Elige la que falta." },
    3: { rounds: 5, mechanics: ["tilde"], params: { tilde: {} },
         intro: "Stage 1 · Nivel 3 · Toda palabra tiene una sílaba que suena más fuerte. Descubre si es aguda, llana o esdrújula." },
    4: { rounds: 4, mechanics: ["ordenar"], params: { ordenar: {} },
         intro: "Stage 1 · Nivel 4 · Las letras se mezclaron. Tócalas en el orden correcto para formar la palabra." },
    5: { rounds: 4, mechanics: ["trazo"], params: { trazo: { letters: LETRAS } },
         intro: "Stage 1 · Nivel 5 · Vamos a trazar letras siguiendo el camino punteado. Usa el dedo o el lápiz óptico. Si necesitas ayuda, pídela." },
    6: { rounds: 5, mechanics: ["vocab"], params: { vocab: {} },
         intro: "Stage 1 · Nivel 6 · Mira el dibujo y elige cómo se escribe la palabra. Fíjate bien en cada letra." },
    7: { rounds: 3, mechanics: ["ahorcado"], params: { ahorcado: {} },
         intro: "Stage 1 · Nivel 7 · Hay una palabra secreta. Toca letras para descubrirla; cada error revela más el dibujo." },
    8: { rounds: 4, mechanics: ["dictado"], params: { dictado: {} },
         intro: "Stage 1 · Nivel 8 · Voy a dictarte palabras. Escúchalas y escríbelas con el teclado. Si te equivocas, tendrás una segunda oportunidad." },
    9: { rounds: 4, mechanics: ["lectura_sombra", "regla"], params: { lectura_sombra: {}, regla: {} },
         intro: "Stage 1 · Nivel 9 · Ahora leemos a la vez: lee en voz alta junto conmigo. Después repasamos reglas de ortografía." },
    10: { rounds: 9,
          mechanics: ["lectura_compartida", "cloze", "tilde", "ordenar", "trazo", "vocab", "ahorcado", "dictado", "regla"],
          params: { lectura_compartida: {}, cloze: {}, tilde: {}, ordenar: {}, trazo: { letters: ["a", "o", "s", "e"] }, vocab: {}, ahorcado: {}, dictado: {}, regla: {} },
          intro: "Stage 1 · Nivel 10 · Última misión de la base: aparece todo lo que aprendiste. Lee, completa, traza y escribe. ¡Tú puedes!" },

    // ══ Stage 2 · Media (11-20): vocabulario y lectura de vida adulta ═══════
    11: { rounds: 10, mechanics: ["lectura_compartida"], params: { lectura_compartida: { textos: LECTURA_FUNCIONAL } },
          intro: "Stage 2 · Nivel 11 · Ahora leemos mensajes y avisos de la vida real, por turnos." },
    12: { rounds: 10, mechanics: ["cloze"], params: { cloze: { bancos: CLOZE_ADULTO } },
          intro: "Stage 2 · Nivel 12 · Completa palabras de trabajo, estudio y trámites cotidianos." },
    13: { rounds: 10, mechanics: ["tilde"], params: { tilde: { bancos: TILDE_ADULTO } },
          intro: "Stage 2 · Nivel 13 · Clasifica palabras más largas según dónde suenan más fuerte." },
    14: { rounds: 10, mechanics: ["ordenar"], params: { ordenar: { bancos: ORDEN_ADULTO } },
          intro: "Stage 2 · Nivel 14 · Ordena letras de palabras más largas de la vida diaria." },
    15: { rounds: 10, mechanics: ["trazo"], params: { trazo: { letters: LETRAS_ADULTO } },
          intro: "Stage 2 · Nivel 15 · Traza letras mayúsculas, acentuadas y la Ñ." },
    16: { rounds: 10, mechanics: ["vocab"], params: { vocab: { bancos: VOCAB_ADULTO } },
          intro: "Stage 2 · Nivel 16 · Objetos y palabras que usarás en el trabajo o el estudio." },
    17: { rounds: 10, mechanics: ["homofono"], params: { homofono: { bancos: HOMOFONOS } },
          intro: "Stage 2 · Nivel 17 · Palabras que suenan igual pero se escriben distinto: hay, ahí, ay y más." },
    18: { rounds: 10, mechanics: ["dictado"], params: { dictado: { bancos: DICTADO_ADULTO } },
          intro: "Stage 2 · Nivel 18 · Dictado con vocabulario más largo." },
    19: { rounds: 10, mechanics: ["regla"], params: { regla: { bancos: REGLAS_ADULTO } },
          intro: "Stage 2 · Nivel 19 · Nuevas reglas de ortografía para palabras de uso frecuente." },
    20: { rounds: 10,
          mechanics: ["lectura_compartida", "cloze", "tilde", "ordenar", "vocab", "homofono", "dictado", "regla"],
          params: {
            lectura_compartida: { textos: LECTURA_FUNCIONAL }, cloze: { bancos: CLOZE_ADULTO }, tilde: { bancos: TILDE_ADULTO },
            ordenar: { bancos: ORDEN_ADULTO }, vocab: { bancos: VOCAB_ADULTO }, homofono: { bancos: HOMOFONOS },
            dictado: { bancos: DICTADO_ADULTO }, regla: { bancos: REGLAS_ADULTO }
          },
          intro: "Stage 2 · Nivel 20 · Reto integrador de la etapa Media: mezcla todo lo practicado." },

    // ══ Stage 3 · Alta (21-30): lectura funcional y corrección de texto ════
    21: { rounds: 10, mechanics: ["lecturaFuncional"], params: { lecturaFuncional: { textos: LECTURA_FUNCIONAL } },
          intro: "Stage 3 · Nivel 21 · Lee mensajes y avisos reales, y responde el dato exacto que se pide." },
    22: { rounds: 10, mechanics: ["cloze"], params: { cloze: { bancos: CLOZE_ADULTO.concat(CLOZE) } },
          intro: "Stage 3 · Nivel 22 · Cloze más exigente, con más palabras para elegir." },
    23: { rounds: 10, mechanics: ["tilde"], params: { tilde: { bancos: TILDE_ADULTO.concat(TILDE) } },
          intro: "Stage 3 · Nivel 23 · Clasificación de tilde con un banco de palabras más amplio." },
    24: { rounds: 10, mechanics: ["correccion"], params: { correccion: { bancos: CORRECCION } },
          intro: "Stage 3 · Nivel 24 · Encuentra la palabra mal escrita en mensajes cotidianos." },
    25: { rounds: 10, mechanics: ["trazo"], params: { trazo: { letters: ["Ñ", "Á", "É", "Í", "Ó", "Ú", "Q", "X"] } },
          intro: "Stage 3 · Nivel 25 · Sigue practicando el trazo de letras exigentes." },
    26: { rounds: 10, mechanics: ["homofono"], params: { homofono: { bancos: HOMOFONOS } },
          intro: "Stage 3 · Nivel 26 · Más casos de palabras homófonas en contexto." },
    27: { rounds: 10, mechanics: ["ahorcado"], params: { ahorcado: { bancos: AHORCADO_ADULTO } },
          intro: "Stage 3 · Nivel 27 · Descubre palabras del mundo laboral y del estudio." },
    28: { rounds: 10, mechanics: ["dictado"], params: { dictado: { bancos: DICTADO_FRASES } },
          intro: "Stage 3 · Nivel 28 · Dictado de frases cortas completas." },
    29: { rounds: 10, mechanics: ["regla"], params: { regla: { bancos: REGLAS_ADULTO.concat(REGLAS) } },
          intro: "Stage 3 · Nivel 29 · Reglas de ortografía combinadas." },
    30: { rounds: 10,
          mechanics: ["lecturaFuncional", "cloze", "tilde", "correccion", "trazo", "homofono", "ahorcado", "dictado", "regla"],
          params: {
            lecturaFuncional: { textos: LECTURA_FUNCIONAL }, cloze: { bancos: CLOZE_ADULTO.concat(CLOZE) },
            tilde: { bancos: TILDE_ADULTO.concat(TILDE) }, correccion: { bancos: CORRECCION },
            trazo: { letters: ["Ñ", "Á", "É", "Í", "Ó", "Ú", "Q", "X"] }, homofono: { bancos: HOMOFONOS },
            ahorcado: { bancos: AHORCADO_ADULTO }, dictado: { bancos: DICTADO_FRASES }, regla: { bancos: REGLAS_ADULTO.concat(REGLAS) }
          },
          intro: "Stage 3 · Nivel 30 · Reto integrador de la etapa Alta: mezcla todo lo practicado." },

    // ══ Stage 4 · Muy Alta (31-40): instructivos, párrafos y frases completas ═
    31: { rounds: 10, mechanics: ["lecturaFuncional"], params: { lecturaFuncional: { textos: LECTURA_INSTRUCTIVOS } },
          intro: "Stage 4 · Nivel 31 · Instructivos, avisos de empleo y reglamentos breves: lee con atención y responde." },
    32: { rounds: 10, mechanics: ["correccion"], params: { correccion: { bancos: CORRECCION_PARRAFOS } },
          intro: "Stage 4 · Nivel 32 · Ahora el error está escondido en un párrafo completo. Léelo con calma." },
    33: { rounds: 10, mechanics: ["homofono"], params: { homofono: { bancos: HOMOFONOS_FRASE } },
          intro: "Stage 4 · Nivel 33 · Homófonos en frases completas: a ver, haber, tubo, tuvo, sino, si no y más." },
    34: { rounds: 10, mechanics: ["cloze"], params: { cloze: { bancos: CLOZE_AVANZADO } },
          intro: "Stage 4 · Nivel 34 · Palabras largas con letras dobles y grupos difíciles: cc, sc, ll, y." },
    35: { rounds: 10, mechanics: ["trazo", "ordenar"],
          params: { trazo: { letters: LETRAS_MINUSCULAS }, ordenar: { bancos: ORDEN_AVANZADO } },
          intro: "Stage 4 · Nivel 35 · Trazas letras con tilde y cola, y armas palabras largas letra por letra." },
    36: { rounds: 10, mechanics: ["tilde"], params: { tilde: { bancos: TILDE_AVANZADO } },
          intro: "Stage 4 · Nivel 36 · Aguda, llana o esdrújula: ahora con palabras de uso diario más difíciles." },
    37: { rounds: 10, mechanics: ["ahorcado"], params: { ahorcado: { bancos: AHORCADO_TECNICO } },
          intro: "Stage 4 · Nivel 37 · Descubre palabras técnicas del mundo laboral." },
    38: { rounds: 10, mechanics: ["dictado"], params: { dictado: { bancos: DICTADO_ORACIONES } },
          intro: "Stage 4 · Nivel 38 · Dictado de oraciones completas, como las de un correo de trabajo." },
    39: { rounds: 10, mechanics: ["regla"], params: { regla: { bancos: REGLAS_EXIGENTES } },
          intro: "Stage 4 · Nivel 39 · Reglas de ortografía más exigentes." },
    40: { rounds: 10,
          mechanics: ["lecturaFuncional", "correccion", "homofono", "cloze", "tilde", "ahorcado", "dictado", "regla", "ordenar"],
          params: {
            lecturaFuncional: { textos: LECTURA_INSTRUCTIVOS }, correccion: { bancos: CORRECCION_PARRAFOS },
            homofono: { bancos: HOMOFONOS_FRASE }, cloze: { bancos: CLOZE_AVANZADO }, tilde: { bancos: TILDE_AVANZADO },
            ahorcado: { bancos: AHORCADO_TECNICO }, dictado: { bancos: DICTADO_ORACIONES }, regla: { bancos: REGLAS_EXIGENTES },
            ordenar: { bancos: ORDEN_AVANZADO }
          },
          intro: "Stage 4 · Nivel 40 · Reto integrador de la etapa Muy Alta: mezcla todo lo practicado." },

    // ══ Stage 5 · Súper Difícil (41-50): integración total, textos largos ══
    41: { rounds: 10, mechanics: ["lecturaFuncional", "correccion", "homofono"],
          params: { lecturaFuncional: { textos: LECTURA_LARGA }, correccion: { bancos: CORRECCION_TODO }, homofono: { bancos: HOMOFONOS_TODO } },
          intro: "Stage 5 · Nivel 41 · Textos largos, mensajes con errores y palabras que suenan igual, todo mezclado." },
    42: { rounds: 10, mechanics: ["cloze", "tilde", "regla"],
          params: { cloze: { bancos: CLOZE_TODO }, tilde: { bancos: TILDE_TODO }, regla: { bancos: REGLAS_TODO } },
          intro: "Stage 5 · Nivel 42 · Letras que faltan, sílabas fuertes y reglas, con todo el vocabulario que ya conoces." },
    43: { rounds: 10, mechanics: ["lectura_sombra", "lecturaFuncional"],
          params: { lectura_sombra: { textos: TEXTOS_TODOS }, lecturaFuncional: { textos: TEXTOS_TODOS } },
          intro: "Stage 5 · Nivel 43 · Lees en voz alta junto a NOVA textos largos y luego respondes sobre otros." },
    44: { rounds: 10, mechanics: ["correccion", "dictado"],
          params: { correccion: { bancos: CORRECCION_TODO }, dictado: { bancos: DICTADO_TODO } },
          intro: "Stage 5 · Nivel 44 · Encuentras errores en mensajes y escribes oraciones dictadas." },
    45: { rounds: 10, mechanics: ["trazo", "cloze"],
          params: { trazo: { letters: LETRAS_CONFUSAS }, cloze: { bancos: CLOZE_TODO } },
          intro: "Stage 5 · Nivel 45 · Trazas las letras que más se confunden (b, d, p, q) y completas palabras difíciles." },
    46: { rounds: 10, mechanics: ["homofono", "regla", "tilde"],
          params: { homofono: { bancos: HOMOFONOS_TODO }, regla: { bancos: REGLAS_TODO }, tilde: { bancos: TILDE_TODO } },
          intro: "Stage 5 · Nivel 46 · Homófonos, reglas y sílabas fuertes, sin repetir el mismo tipo de reto." },
    47: { rounds: 10, mechanics: ["ahorcado", "dictado", "vocab"],
          params: { ahorcado: { bancos: AHORCADO_TODO }, dictado: { bancos: DICTADO_TODO }, vocab: { bancos: VOCAB_ADULTO } },
          intro: "Stage 5 · Nivel 47 · Adivinas palabras, escribes oraciones y eliges la escritura correcta." },
    48: { rounds: 10, mechanics: ["lecturaFuncional", "correccion", "homofono", "cloze"],
          params: { lecturaFuncional: { textos: TEXTOS_TODOS }, correccion: { bancos: CORRECCION_TODO }, homofono: { bancos: HOMOFONOS_TODO }, cloze: { bancos: CLOZE_TODO } },
          intro: "Stage 5 · Nivel 48 · Lectura, corrección, homófonos y letras que faltan, todo en un mismo reto." },
    49: { rounds: 10,
          mechanics: ["lectura_sombra", "correccion", "homofono", "cloze", "tilde", "regla", "ordenar", "ahorcado", "dictado", "vocab"],
          params: {
            lectura_sombra: { textos: TEXTOS_TODOS }, correccion: { bancos: CORRECCION_TODO }, homofono: { bancos: HOMOFONOS_TODO },
            cloze: { bancos: CLOZE_TODO }, tilde: { bancos: TILDE_TODO }, regla: { bancos: REGLAS_TODO },
            ordenar: { bancos: ORDEN_AVANZADO }, ahorcado: { bancos: AHORCADO_TODO }, dictado: { bancos: DICTADO_TODO },
            vocab: { bancos: VOCAB_ADULTO }
          },
          intro: "Stage 5 · Nivel 49 · Mezcla exigente de casi todo lo que has practicado. Falta solo un nivel." },
    50: { rounds: 10,
          mechanics: ["lectura_compartida", "lecturaFuncional", "correccion", "homofono", "cloze", "tilde", "regla", "ordenar", "trazo", "dictado"],
          params: {
            lectura_compartida: { textos: TEXTOS_TODOS }, lecturaFuncional: { textos: LECTURA_LARGA }, correccion: { bancos: CORRECCION_TODO },
            homofono: { bancos: HOMOFONOS_TODO }, cloze: { bancos: CLOZE_TODO }, tilde: { bancos: TILDE_TODO },
            regla: { bancos: REGLAS_TODO }, ordenar: { bancos: ORDEN_AVANZADO }, trazo: { letters: LETRAS_CONFUSAS },
            dictado: { bancos: DICTADO_TODO }
          },
          intro: "Stage 5 · Nivel 50 · Reto final del Detector de Letras Rebeldes: lees, corriges, trazas y escribes. ¡Tú puedes!" }
  };

  global.IndecapGame.register({
    slug: "dislexia_letras",
    getLevel: function (level) {
      var base = NIVELES[level] || NIVELES[1];
      return { rounds: base.rounds, mechanics: base.mechanics.slice(), params: base.params, offset: rnd(0, 99), intro: base.intro };
    },
    buildRound: function (cfg, index, ctx) {
      var m = cfg.mechanics[index % cfg.mechanics.length];
      var p = Object.assign({}, cfg.params[m], { offset: cfg.offset });
      return CONSTRUCTORES[m](p, ctx || { support: 1 }, index);
    }
  });
})(window);
