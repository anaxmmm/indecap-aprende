/**
 * EL DETECTOR DE LETRAS REBELDES — Dislexia
 *
 * Habilidad central: leer y escribir con seguridad, conectando sonidos,
 * letras, sílabas y significado.
 *
 * 5 niveles × 10 actividades, 5 retos por actividad que suben de dificultad.
 *
 *   Nivel 1 · Base           Letras, sonidos y sílabas
 *   Nivel 2 · Media          Palabras de uso diario
 *   Nivel 3 · Alta           Ortografía en contexto
 *   Nivel 4 · Muy Alta       Textos de la vida adulta
 *   Nivel 5 · Súper Difícil  Lectura y escritura integradas
 *
 * Principios: toda palabra se puede escuchar; la lectura va al ritmo del
 * estudiante (frase por frase, sin tiempo); el error nunca se castiga. La
 * tipografía legible se activa desde el perfil del estudiante. En el nivel 1
 * la escritura no exige tildes; desde el nivel 2 sí.
 */
(function (global) {
  "use strict";
  var _t = global.IndecapGame.tr;

  var U = global.IndecapGame.util;
  var rnd = U.rnd, pick = U.pick, shuffle = U.shuffle, grow = U.grow;
  var RETOS = 5;

  (function injectStyles() {
    if (document.getElementById("dl-styles")) return;
    var css = [
      ".dl-ico{font-size:1.4em;line-height:1;margin-right:.35em;vertical-align:-.15em}",
      ".dl-hero{display:inline-flex;flex-direction:column;align-items:center;gap:8px;padding:16px 28px;border:1px solid var(--line);border-radius:var(--r-lg);background:var(--canvas)}",
      ".dl-hero__ico{font-size:60px;line-height:1}",
      ".dl-word{font-size:34px;font-weight:700;letter-spacing:.06em;color:var(--navy-800)}",
      ".dl-word .gap{display:inline-block;min-width:1.2em;border-bottom:4px solid var(--gold-500);color:var(--gold-600)}",
      ".dl-sentence{max-width:620px;font-size:22px;line-height:1.7;font-weight:500}",
      ".dl-sentence .gap{display:inline-block;min-width:3em;border-bottom:3px solid var(--gold-500)}",
      ".dl-read{width:100%;max-width:640px;margin:0 auto;text-align:left}",
      ".dl-read__text{padding:20px 24px;border:1px solid var(--line);border-radius:var(--r-lg);background:var(--surface);box-shadow:var(--sh-xs)}",
      ".dl-read__line{margin:0 0 8px;padding:4px 8px;border-radius:8px;font-size:19px;line-height:1.9;transition:background .2s ease,opacity .2s ease}",
      ".dl-read__line.is-dim{opacity:.35}",
      ".dl-read__line.is-on{background:var(--gold-100);opacity:1}",
      ".dl-read__bar{display:flex;flex-wrap:wrap;gap:8px;justify-content:center;margin:16px 0}",
      ".dl-read__q{margin:16px 0 12px;font-weight:600;font-size:18px;text-align:center}",
      ".dl-read__opts{display:flex;flex-direction:column;gap:8px;max-width:520px;margin:0 auto}",
      ".dl-read__opts .game-option{font-size:16px;justify-content:flex-start;text-align:left}",
      ".dl-syl{display:inline-flex;gap:6px}",
      ".dl-syl span{padding:6px 12px;border:1px solid var(--line);border-radius:8px;background:var(--surface);font-size:24px;font-weight:600}"
    ].join("");
    var tag = document.createElement("style");
    tag.id = "dl-styles";
    tag.textContent = css;
    document.head.appendChild(tag);
  })();

  function textOpts(ok, bads, n) {
    var uniq = [];
    shuffle(bads).forEach(function (t) { if (t !== ok && uniq.indexOf(t) === -1) uniq.push(t); });
    return shuffle([ok].concat(uniq.slice(0, n - 1))).map(function (t) { return { label: t, value: t, aria: t }; });
  }
  function hero(i, t) { return '<div class="dl-hero"><span class="dl-hero__ico" aria-hidden="true">' + i + "</span>" + (t ? '<span class="dl-word">' + t + "</span>" : "") + "</div>"; }
  function cap(t) { return t.charAt(0).toUpperCase() + t.slice(1); }

  // ─── Bancos de contenido ─────────────────────────────────────────────────
  var CLOZE = [
    ["🐄", "vaca", "v", "b"], ["👢", "bota", "b", "v"], ["🔑", "llave", "ll", "y"], ["👟", "zapato", "z", "s"],
    ["🦒", "jirafa", "j", "g"], ["🏠", "casa", "s", "z"], ["🧀", "queso", "qu", "k"], ["🐴", "caballo", "b", "v"],
    ["🚲", "bicicleta", "c", "s"], ["🌳", "árbol", "b", "v"], ["🪟", "ventana", "v", "b"], ["🧹", "escoba", "b", "v"]
  ];
  var CLOZE_ADULTO = [
    ["🚌", "autobús", "b", "v"], ["💼", "trabajo", "b", "v"], ["🧾", "impuesto", "s", "z"], ["✉️", "mensaje", "j", "g"],
    ["📞", "llamada", "ll", "y"], ["📋", "vacante", "v", "b"], ["🏦", "cuenta", "c", "qu"], ["💳", "tarjeta", "j", "g"],
    ["📅", "agenda", "g", "j"], ["🔑", "contraseña", "s", "z"]
  ];
  var CLOZE_AVANZADO = [
    ["🎓", "graduación", "c", "s"], ["📊", "análisis", "s", "z"], ["⚖️", "abogado", "b", "v"], ["📜", "excepción", "c", "s"],
    ["🏛️", "gobierno", "b", "v"], ["🚀", "proyecto", "y", "ll"], ["🎯", "objetivo", "j", "g"], ["💡", "inteligencia", "g", "j"],
    ["🏗️", "construcción", "cc", "c"], ["🧠", "conciencia", "c", "s"]
  ];
  var VOCAB = [
    ["🐄", "vaca", "baca", "vaka"], ["🔑", "llave", "yave", "llabe"], ["🦒", "jirafa", "girafa", "jiraffa"],
    ["🐝", "abeja", "aveja", "abexa"], ["🐜", "hormiga", "ormiga", "hormica"], ["🧹", "escoba", "escova", "eskoba"],
    ["🪟", "ventana", "bentana", "ventaba"], ["🧀", "queso", "keso", "quezo"]
  ];
  var VOCAB_ADULTO = [
    ["💻", "computador", "conputador", "computadór"], ["📄", "documento", "dokumento", "documeto"], ["🏢", "oficina", "ofisina", "oficna"],
    ["📅", "agenda", "ajenda", "aguenda"], ["💳", "tarjeta", "tarjeda", "targeta"], ["🧾", "factura", "fautura", "fatura"],
    ["📱", "celular", "zelular", "selular"], ["🔑", "contraseña", "contraceña", "contrasenia"], ["🚌", "autobús", "autobuz", "autovús"]
  ];
  var CONFUSAS = [
    ["🦷", "diente", "d", ["b", "p", "q"]], ["🍞", "pan", "p", ["b", "d", "q"]], ["⚽", "balón", "b", ["d", "p", "q"]],
    ["🧀", "queso", "q", ["p", "b", "d"]], ["🎲", "dado", "d", ["b", "p", "q"]], ["🥖", "baguette", "b", ["d", "p", "q"]],
    ["🍐", "pera", "p", ["b", "d", "q"]], ["🏀", "básquet", "b", ["d", "p", "q"]], ["💃", "danza", "d", ["b", "p", "q"]]
  ];
  var SILABAS = [
    ["🪑", "si-lla"], ["🍌", "ba-na-no"], ["👟", "za-pa-to"], ["📱", "ce-lu-lar"], ["🚲", "bi-ci-cle-ta"], ["🏫", "co-le-gio"],
    ["🔑", "lla-ve"], ["🌙", "lu-na"], ["🧃", "ju-go"], ["💻", "com-pu-ta-dor"], ["🧾", "fac-tu-ra"], ["🗓️", "ca-len-da-rio"]
  ];
  var SILABAS_ADULTO = [
    ["💼", "tra-ba-jo"], ["🏦", "ban-co"], ["📋", "en-tre-vis-ta"], ["💰", "pre-su-pues-to"], ["🏥", "hos-pi-tal"],
    ["📦", "in-ven-ta-rio"], ["🧑‍🏫", "pro-fe-so-ra"], ["🧮", "con-ta-bi-li-dad"], ["🚚", "pro-vee-dor"], ["📜", "cer-ti-fi-ca-do"]
  ];
  var RIMAS = [
    ["camión", "canción", ["camino", "cama"]], ["ventana", "mañana", ["ventilador", "venta"]], ["café", "bebé", ["cafetera", "casa"]],
    ["perro", "cerro", ["pera", "pelo"]], ["sol", "col", ["sal", "solo"]], ["gato", "pato", ["gallo", "gota"]],
    ["trabajo", "atajo", ["trabajar", "trato"]], ["mensaje", "pasaje", ["mesa", "menta"]], ["llave", "nave", ["lluvia", "llama"]]
  ];
  var TILDE = [
    ["canción", "can-CIÓN", "aguda"], ["papel", "pa-PEL", "aguda"], ["reloj", "re-LOJ", "aguda"], ["camión", "ca-MIÓN", "aguda"],
    ["según", "se-GÚN", "aguda"], ["además", "a-de-MÁS", "aguda"], ["también", "tam-BIÉN", "aguda"], ["ciudad", "ciu-DAD", "aguda"],
    ["casa", "CA-sa", "llana"], ["árbol", "ÁR-bol", "llana"], ["lápiz", "LÁ-piz", "llana"], ["mesa", "ME-sa", "llana"],
    ["fácil", "FÁ-cil", "llana"], ["examen", "e-XA-men", "llana"], ["joven", "JO-ven", "llana"], ["azúcar", "a-ZÚ-car", "llana"],
    ["teléfono", "te-LÉ-fo-no", "esdrújula"], ["música", "MÚ-si-ca", "esdrújula"], ["número", "NÚ-me-ro", "esdrújula"],
    ["médico", "MÉ-di-co", "esdrújula"], ["trámite", "TRÁ-mi-te", "esdrújula"], ["rápido", "RÁ-pi-do", "esdrújula"], ["último", "ÚL-ti-mo", "esdrújula"]
  ];
  var CON_SIN_TILDE = [
    ["canción", true], ["camion", false, "camión"], ["papel", false], ["arbol", false, "árbol"], ["mesa", false], ["lápiz", true],
    ["telefono", false, "teléfono"], ["música", true], ["examen", false], ["exámen", false, "examen"], ["joven", false],
    ["según", true], ["facil", false, "fácil"], ["página", true], ["reloj", false], ["util", false, "útil"], ["trámite", true], ["ciudad", false]
  ];
  var REGLAS = [
    { r: _t("Antes de p y b se escribe M"), ok: "tambor", bad: ["tanbor", "tanvor"] },
    { r: _t("Antes de v se escribe N"), ok: "envase", bad: ["embase", "enbase"] },
    { r: _t("Las terminaciones -aba, -abas, -ábamos se escriben con B"), ok: "cantaba", bad: ["cantava", "cantava "] },
    { r: _t("Con «güe» y «güi» se usa diéresis cuando la U suena"), ok: "pingüino", bad: ["pinguino", "pingiuno"] },
    { r: _t("Las palabras que empiezan por «hum-» llevan H"), ok: "humo", bad: ["umo", "jumo"] },
    { r: _t("En «gui» y «gue» la U no suena"), ok: "guitarra", bad: ["gitarra", "ghitarra"] },
    { r: _t("Los verbos terminados en -ger y -gir se escriben con G"), ok: "recoger", bad: ["recojer", "recoguer"] },
    { r: _t("Las palabras terminadas en -aje se escriben con J"), ok: "mensaje", bad: ["mensage", "menzaje"] },
    { r: _t("Las palabras que empiezan por «hosp-» llevan H"), ok: "hospital", bad: ["ospital", "jospital"] },
    { r: _t("Las palabras terminadas en -illo, -illa se escriben con LL"), ok: "cuchillo", bad: ["cuchiyo", "cuchilo"] },
    { r: _t("Las palabras que empiezan por «bibl-» se escriben con B"), ok: "biblioteca", bad: ["viblioteca", "bibliotecca"] },
    { r: _t("Las terminaciones -bilidad se escriben con B"), ok: "posibilidad", bad: ["posivilidad", "posibilidat"] },
    { r: _t("Las palabras terminadas en -ción vienen de palabras con -to, -tor o -do"), ok: "situación", bad: ["situasión", "situaxión"] }
  ].map(function (x) { x.bad = x.bad.map(function (b) { return b.trim(); }).filter(function (b, i, a) { return b !== x.ok && a.indexOf(b) === i; }); return x; });
  var LETRA_BV = [["ca_allo", "b", "caballo"], ["_entana", "v", "ventana"], ["tra_ajo", "b", "trabajo"], ["_ivir", "v", "vivir"], ["nue_o", "v", "nuevo"],
    ["ha_lar", "b", "hablar"], ["in_itar", "v", "invitar"], ["cam_iar", "b", "cambiar"], ["_ender", "v", "vender"], ["sa_er", "b", "saber"], ["ner_ioso", "v", "nervioso"], ["o_jeto", "b", "objeto"]];
  var LETRA_GJ = [["re_oger", "g", "recoger"], ["mensa_e", "j", "mensaje"], ["_ente", "g", "gente"], ["tar_eta", "j", "tarjeta"], ["ele_ir", "g", "elegir"],
    ["via_e", "j", "viaje"], ["ima_en", "g", "imagen"], ["_efe", "j", "jefe"], ["prote_er", "g", "proteger"], ["pasa_e", "j", "pasaje"]];
  var HOMOFONOS = [
    { f: "No sé si ___ alguien en la oficina.", ok: "hay", bad: ["ahí", "ay"], r: _t("«Hay» es del verbo haber; «ahí» es un lugar; «ay» expresa dolor.") },
    { f: "Deja el paquete ___ mismo, junto a la puerta.", ok: "ahí", bad: ["hay", "ay"], r: _t("«Ahí» indica un lugar.") },
    { f: "___, me golpeé con la mesa.", ok: "Ay", bad: ["Hay", "Ahí"], r: _t("«Ay» expresa dolor o sorpresa.") },
    { f: "Espero que ___ a la reunión de mañana.", ok: "vayas", bad: ["vallas", "bayas"], r: _t("«Vayas» viene del verbo ir.") },
    { f: "Pusieron ___ nuevas alrededor del parque.", ok: "vallas", bad: ["vayas", "bayas"], r: _t("«Vallas» son cercas o carteles.") },
    { f: "___ si el jefe ya llegó.", ok: "A ver", bad: ["Haber", "Aver"], r: _t("«A ver» es para mirar o comprobar; «haber» es un verbo.") },
    { f: "El paquete debe ___ llegado ayer.", ok: "haber", bad: ["a ver", "aver"], r: _t("«Haber» acompaña al verbo «llegado».") },
    { f: "El plomero cambió el ___ de la ducha.", ok: "tubo", bad: ["tuvo", "tuvó"], r: _t("«Tubo» es un conducto; «tuvo» viene de tener.") },
    { f: "Ella ___ un problema con la factura.", ok: "tuvo", bad: ["tubo", "tuvó"], r: _t("«Tuvo» viene del verbo tener.") },
    { f: "Es la primera ___ que trabajo en un banco.", ok: "vez", bad: ["ves", "bez"], r: _t("«Vez» es una ocasión; «ves» viene de ver.") },
    { f: "¿Tú ___ el error en el documento?", ok: "ves", bad: ["vez", "bes"], r: _t("«Ves» viene del verbo ver.") },
    { f: "___ llegas a tiempo, avísame.", ok: "Si no", bad: ["Sino", "Sinó"], r: _t("«Si no» expresa una condición.") },
    { f: "No quiero café, ___ té.", ok: "sino", bad: ["si no", "sinó"], r: _t("«Sino» contrapone una cosa con otra.") },
    { f: "Llegó tarde ___ perdió el bus.", ok: "porque", bad: ["por qué", "porqué"], r: _t("«Porque» da la causa.") },
    { f: "¿___ no fuiste a la reunión?", ok: "Por qué", bad: ["Porque", "Porqué"], r: _t("«Por qué» se usa para preguntar.") },
    { f: "Se ___ el vaso y se regó el agua.", ok: "cayó", bad: ["calló", "cayo"], r: _t("«Cayó» viene de caer; «calló», de callar.") },
    { f: "La ___ de interés del banco cambió.", ok: "tasa", bad: ["taza", "tassa"], r: _t("«Tasa» es un porcentaje; «taza» es un recipiente.") }
  ];
  var CORRECCION = [
    { t: "Nos vemos mañana en la ofisina a las 8 a. m.", mal: "ofisina", bien: "oficina" },
    { t: "Necesito que confirmes tu asistensia al taller.", mal: "asistensia", bien: "asistencia" },
    { t: "Voy a ablar con el supervisor sobre el turno.", mal: "ablar", bien: "hablar" },
    { t: "Ese producto tiene una garantia de un año.", mal: "garantia", bien: "garantía" },
    { t: "Ayer resivimos el pago de la factura.", mal: "resivimos", bien: "recibimos" },
    { t: "Muchas grasias por la oportunidad de la entrevista.", mal: "grasias", bien: "gracias" },
    { t: "El exámen quedó programado para el lunes.", mal: "exámen", bien: "examen" },
    { t: "Por favor traigan el informe con los datos actualisados.", mal: "actualisados", bien: "actualizados" },
    { t: "Le envío mi trabajo final ajunto.", mal: "ajunto", bien: "adjunto" },
    { t: "Recibirá el paquete en tres días abiles.", mal: "abiles", bien: "hábiles" },
    { t: "Todos deben dirijirse al punto de encuentro.", mal: "dirijirse", bien: "dirigirse" },
    { t: "El documento estará en la pagina web desde el lunes.", mal: "pagina", bien: "página" },
    { t: "Agradezco a todos su colavoración con el proyecto.", mal: "colavoración", bien: "colaboración" },
    { t: "Verifiquen que los datos esten correctos.", mal: "esten", bien: "estén" },
    { t: "Su reclamo fue registrado y sera atendido pronto.", mal: "sera", bien: "será" }
  ];
  var FAMILIAS = [["proteger", "protección"], ["decidir", "decisión"], ["actuar", "acción"], ["invitar", "invitación"], ["revisar", "revisión"],
    ["elegir", "elección"], ["corregir", "corrección"], ["pagar", "pago"], ["vender", "venta"], ["construir", "construcción"]];
  var SIGNIFICADOS = [["factura", "Documento que dice cuánto debes pagar"], ["hoja de vida", "Documento con tu estudio y experiencia"], ["contraseña", "Clave secreta para entrar a una cuenta"],
    ["vacante", "Puesto de trabajo disponible"], ["presupuesto", "Plan de cuánto vas a gastar"], ["plazo", "Tiempo límite para hacer algo"], ["requisito", "Condición que debes cumplir"],
    ["recargo", "Cobro extra por pagar tarde"]];
  var ABREVIATURAS = [["Cra.", "carrera"], ["Cl.", "calle"], ["Av.", "avenida"], ["Apto.", "apartamento"], ["p. m.", "de la tarde o noche"], ["a. m.", "de la mañana"],
    ["Dr.", "doctor"], ["N.º", "número"], ["Tel.", "teléfono"], ["etc.", "y otras cosas más"]];
  var DICTADO_1 = [["🐄", "vaca"], ["🔑", "llave"], ["🦒", "jirafa"], ["👟", "zapato"], ["🏫", "escuela"], ["🚚", "camión"], ["🧀", "queso"], ["📱", "celular"]];
  var DICTADO_2 = ["computador", "documento", "entrevista", "presupuesto", "matrícula", "supervisor", "contraseña", "factura", "gracias", "hábil"];
  var DICTADO_3 = ["Buenos días", "Muchas gracias", "Con gusto", "Quedo atento", "Hasta mañana", "Por favor confirme"];
  var DICTADO_4 = ["Necesito una copia del documento", "La reunión empieza a las ocho", "Envíe la factura por correo", "Mañana entrego el informe final", "Confirmo mi asistencia al taller"];
  var DICTADO_5 = ["Le agradezco su atención y quedo pendiente", "El pago se realizará el próximo viernes", "Adjunto la factura y el comprobante de pago", "Por favor revise los datos antes de firmar"];
  var ORACIONES = [
    "Mañana tengo una entrevista de trabajo", "El bus pasa cada quince minutos", "Guardé el recibo en mi carpeta",
    "La reunión se cambió para el jueves", "Necesito cargar mi celular", "Hoy pagué la factura de la luz", "Mi turno empieza a las siete"
  ];
  var MENSAJES = [
    ["Hola, Laura.", "Te escribo por la reunión de mañana.", "Se cambió para las 3 p. m.", "Por favor confirma si puedes asistir.", "Gracias, Andrés."],
    ["Buenos días, profesora.", "Le envío mi trabajo final.", "Lo adjunto en formato PDF.", "Quedo atento a sus comentarios.", "Saludos, Julián."],
    ["Señor cliente:", "Su pedido fue enviado hoy.", "Llegará en tres días hábiles.", "Puede rastrearlo con el código 4521.", "Gracias por su compra."]
  ];

  var LECTURAS = {
    corta: [
      { s: ["Hoy llueve mucho en la ciudad.", "Luis lleva su paraguas amarillo.", "Camina despacio para no mojarse."], q: "¿De qué color es el paraguas?", ok: "Amarillo", bad: ["Rojo", "Azul"] },
      { s: ["Ana trabaja en una panadería.", "Entra a las seis de la mañana.", "Su pan favorito es el pandebono."], q: "¿A qué hora entra Ana?", ok: "A las seis de la mañana", bad: ["A las ocho", "A las seis de la tarde"] },
      { s: ["Camilo compró un celular nuevo.", "Lo pagó en tres cuotas.", "La primera cuota fue en marzo."], q: "¿En cuántas cuotas pagó el celular?", ok: "En tres cuotas", bad: ["En una cuota", "En marzo"] }
    ],
    funcional: [
      { s: ["Se busca auxiliar de bodega.", "Turno de 7 a. m. a 3 p. m., de lunes a sábado.", "Enviar hoja de vida a empleos@textil.com antes del viernes."], q: "¿A qué correo hay que enviar la hoja de vida?", ok: "empleos@textil.com", bad: ["turno@textil.com", "bodega@textil.com"] },
      { s: ["Su cita médica fue cambiada para el jueves 14.", "Debe llegar 15 minutos antes con su documento.", "Si no puede asistir, cancele con un día de anticipación."], q: "¿Con cuánta anticipación debe cancelar?", ok: "Un día", bad: ["Una semana", "Una hora"] },
      { s: ["El banco cambió su horario de atención.", "Ahora abre de 8 a. m. a 4 p. m., de lunes a viernes.", "Los sábados estará cerrado."], q: "¿A qué hora abre ahora el banco?", ok: "8 a. m.", bad: ["7 a. m.", "9 a. m."] },
      { s: ["Tu pedido llegará en 3 días hábiles.", "Puedes rastrearlo con el código 4521.", "Si no llega, escribe a soporte."], q: "¿Cuál es el código de rastreo?", ok: "4521", bad: ["4512", "1524"] }
    ],
    instructivo: [
      { s: ["Para cambiar tu contraseña, entra a la página de inicio.", "Pulsa «Olvidé mi contraseña».", "Escribe tu correo y espera el mensaje.", "El enlace del mensaje funciona solo 30 minutos."], q: "¿Cuánto tiempo funciona el enlace?", ok: "30 minutos", bad: ["3 horas", "1 día"] },
      { s: ["Antes de usar la licuadora, revisa que la tapa esté cerrada.", "No la uses con las manos mojadas.", "Después de cada uso, desconéctala y lávala con agua tibia."], q: "¿Qué debes hacer después de cada uso?", ok: "Desconectarla y lavarla", bad: ["Dejarla conectada", "Guardarla sin lavar"] },
      { s: ["La biblioteca presta libros por ocho días.", "Puedes renovar el préstamo una sola vez.", "Si entregas tarde, pagas una multa por cada día."], q: "¿Cuántas veces puedes renovar?", ok: "Una vez", bad: ["Dos veces", "Ninguna"] },
      { s: ["Se arrienda apartamento de dos habitaciones.", "Incluye agua y gas; la luz se paga aparte.", "Interesados llamar al 300 555 0148."], q: "¿Qué servicio NO está incluido?", ok: "La luz", bad: ["El agua", "El gas"] }
    ],
    larga: [
      { s: ["El contrato dura seis meses.", "El pago se hace los primeros cinco días de cada mes.", "Si alguien quiere terminarlo antes, debe avisar con quince días de anticipación.", "Se trabaja de lunes a viernes.", "No incluye los días festivos."], q: "¿Con cuántos días de anticipación se avisa para terminar el contrato?", ok: "Quince días", bad: ["Cinco días", "Seis días"] },
      { s: ["El curso tiene cuatro módulos y dura diez semanas.", "Cada módulo termina con una evaluación virtual.", "Para aprobar necesitas al menos el setenta por ciento.", "Puedes repetir una evaluación una sola vez.", "El certificado se entrega en formato digital."], q: "¿Cuántas veces puedes repetir una evaluación?", ok: "Una vez", bad: ["Dos veces", "Todas las que quieras"] },
      { s: ["Este producto tiene garantía de doce meses.", "Cubre defectos de fábrica, pero no golpes ni humedad.", "Para usarla debes presentar la factura original.", "El servicio técnico atiende de lunes a sábado.", "Las reparaciones tardan máximo diez días hábiles."], q: "¿Qué NO cubre la garantía?", ok: "Golpes y humedad", bad: ["Defectos de fábrica", "Reparaciones en diez días"] },
      { s: ["La convocatoria de becas está abierta hasta el 30 de noviembre.", "Pueden aplicar estudiantes desde segundo semestre.", "Se envía el formulario, una carta de motivación y las notas.", "Los resultados salen la primera semana de diciembre.", "Solo se reciben solicitudes por el portal web."], q: "¿Por dónde se envían las solicitudes?", ok: "Por el portal web", bad: ["Por correo físico", "En persona"] }
    ]
  };
  var IDEA_PRINCIPAL = [
    { t: "Dormir bien ayuda a concentrarse. Cuando una persona descansa entre siete y nueve horas, recuerda mejor lo que aprende y se cansa menos durante el día.", ok: "Dormir bien mejora la concentración y la memoria", bad: ["Las personas duermen siete horas", "Estudiar de noche es mejor"] },
    { t: "Antes de firmar un contrato conviene leerlo completo, preguntar lo que no se entiende y guardar una copia. Así se evitan sorpresas con pagos o fechas.", ok: "Hay que leer bien un contrato antes de firmarlo", bad: ["Los contratos tienen fechas", "Siempre hay sorpresas con los pagos"] },
    { t: "Ahorrar una parte pequeña de cada pago, aunque sea poco, ayuda a tener dinero para emergencias y a cumplir metas sin endeudarse.", ok: "Ahorrar un poco cada vez ayuda en emergencias y metas", bad: ["Las emergencias son caras", "Endeudarse es la única opción"] },
    { t: "En una entrevista de trabajo ayuda llegar a tiempo, saludar con respeto y contar con ejemplos lo que sabes hacer.", ok: "Cómo presentarse bien en una entrevista", bad: ["Las entrevistas son difíciles", "Hay que llevar ejemplos impresos"] }
  ];

  // ─── Mecánicas ───────────────────────────────────────────────────────────

  function letraInicial(p, s) {
    var x = pick(CONFUSAS);
    return {
      skill: "letras_confusas",
      prompt: _t("¿Con qué letra empieza la palabra?"),
      speakWord: x[1],
      visual: hero(x[0], s >= 3 ? "" : x[1].slice(1).replace(/^/, "_")),
      options: shuffle([x[2]].concat(x[3].slice(0, grow(1, 3, s)))).map(function (l) { return { label: l, value: l, aria: _t("letra ") + l }; }),
      answer: x[2],
      hint: _t("Di la palabra en voz alta y fíjate en el primer sonido. La b tiene la barriga a la derecha; la d, a la izquierda."),
      explain: cap(x[1]) + _t(" empieza con ") + x[2] + "."
    };
  }

  function completar(p, s) {
    var w = pick(p.bank), word = w[1], g = w[2], i = word.indexOf(g);
    var shown = word.slice(0, i) + '<span class="gap">?</span>' + word.slice(i + g.length);
    return {
      skill: "ortografia_letras",
      prompt: _t("¿Qué letra completa la palabra?"),
      speakWord: word,
      visual: hero(s >= 3 ? "" : w[0], shown),
      options: textOpts(g, [w[3]].concat(s >= 2 ? [pick(["s", "c", "z", "j", "g", "y", "ll", "b", "v"])] : []), s >= 2 ? 3 : 2),
      answer: g,
      hint: _t("Piensa en cómo la has visto escrita en un letrero o en el celular."),
      explain: _t("Se escribe «") + word + _t("».")
    };
  }

  function bienEscrita(p, s) {
    var w = pick(p.bank);
    var opts = textOpts(w[1], w.slice(2), s >= 2 ? 3 : 2);
    return {
      skill: "ortografia_visual",
      prompt: _t("¿Cuál está bien escrita?"),
      visual: s >= 3 ? "" : hero(w[0], ""),
      options: opts,
      answer: w[1],
      hint: _t("Lee cada opción despacio, letra por letra."),
      explain: _t("Se escribe «") + w[1] + _t("».")
    };
  }

  function letrasEnOrden(p, s) {
    var w = pick(p.bank), word = typeof w === "string" ? w : w[1];
    var letters = word.split("");
    var items = letters.map(function (c, k) { return { id: "l" + k, label: c }; });
    var order = shuffle(items), guard = 0;
    while (guard++ < 10 && order.every(function (o, k) { return o.label === letters[k]; })) order = shuffle(items);
    return {
      type: "order", skill: "ordenar_letras",
      prompt: _t("Ordena las letras para formar la palabra que escuchas."),
      speech: _t("Forma la palabra."), speakWord: word,
      visual: s <= 2 && w[0] ? hero(w[0], "") : "",
      slotsLabel: _t("Tu palabra"),
      items: order, answer: items.map(function (x) { return x.id; }), answerLabel: word,
      hint: _t("Escucha la palabra otra vez con «Leer en voz alta» y busca el primer sonido."),
      explain: _t("La palabra es «") + word + _t("».")
    };
  }

  function silabasEnOrden(p, s) {
    var w = pick(p.bank), syl = w[1].split("-");
    if (syl.length < 2) return silabasEnOrden(p, s);
    var items = syl.map(function (x, k) { return { id: "s" + k, label: x }; });
    var order = shuffle(items), guard = 0;
    while (guard++ < 10 && order.every(function (o, k) { return o.label === syl[k]; })) order = shuffle(items);
    var word = syl.join("");
    return {
      type: "order", skill: "silabas",
      prompt: _t("Ordena las sílabas para formar la palabra."),
      speech: _t("Forma la palabra."), speakWord: word,
      visual: s <= 2 ? hero(w[0], "") : "",
      slotsLabel: _t("Tu palabra"),
      items: order, answer: items.map(function (x) { return x.id; }), answerLabel: syl.join("-"),
      hint: _t("Di la palabra aplaudiendo cada sílaba."),
      explain: _t("Se forma así: ") + syl.join("-") + "."
    };
  }

  function contarSilabas(p, s) {
    var w = pick(p.bank), n = w[1].split("-").length, word = w[1].replace(/-/g, "");
    return {
      skill: "silabas",
      prompt: _t("¿Cuántas sílabas tiene la palabra?"),
      speakWord: word,
      visual: hero(w[0], word),
      options: [1, 2, 3, 4, 5].slice(0, s >= 2 ? 5 : 4).map(function (k) { return { label: String(k), value: k }; }),
      answer: n,
      hint: _t("Aplaude una vez por cada golpe de voz: ") + (s <= 1 ? w[1] : "ca-sa tiene dos") + ".",
      explain: cap(word) + _t(" se divide así: ") + w[1] + " (" + n + ")."
    };
  }

  function rima(p, s) {
    var r = pick(RIMAS);
    return {
      skill: "conciencia_fonologica",
      prompt: _t("¿Qué palabra termina con el mismo sonido que «") + r[0] + _t("»?"),
      speech: _t("¿Qué palabra termina con el mismo sonido que esta?"), speakWord: r[0],
      options: textOpts(r[1], r[2], 3),
      answer: r[1],
      hint: _t("Fíjate solo en el final de las palabras, desde la última vocal fuerte."),
      explain: cap(r[0]) + _t(" y ") + r[1] + _t(" terminan igual.")
    };
  }

  function unirImagen(p, s) {
    var set = shuffle(p.bank).slice(0, grow(3, 5, s)), left = [], right = [], ans = {};
    set.forEach(function (w, k) {
      left.push({ id: "i" + k, label: '<span style="font-size:28px">' + w[0] + "</span>" });
      right.push({ id: "w" + k, label: w[1] });
      ans["i" + k] = "w" + k;
    });
    return {
      type: "match", skill: "vocabulario",
      prompt: _t("Une cada imagen con su palabra."),
      left: shuffle(left), right: shuffle(right), answer: ans,
      hint: _t("Empieza por la imagen que reconoces más rápido."),
      explain: set.map(function (w) { return w[1]; }).join(", ") + "."
    };
  }

  function dictado(p, s) {
    var x = pick(p.bank), word = typeof x === "string" ? x : x[1];
    return {
      type: "input", text: true, skill: "escritura_dictado",
      prompt: p.sentence ? _t("Escucha la frase y escríbela.") : _t("Escucha la palabra y escríbela."),
      visual: typeof x !== "string" && s <= 2 ? hero(x[0], "") : "",
      listen: word, speech: p.sentence ? _t("Escribe la frase") : _t("Escribe la palabra"),
      answer: word, strictAccents: !!p.strict,
      hint: p.sentence ? _t("Escribe palabra por palabra; puedes escucharla las veces que quieras.") : _t("Escúchala otra vez y escribe sílaba por sílaba."),
      explain: _t("Se escribe: «") + word + _t("».")
    };
  }

  function silabaTonica(p, s) {
    var w = pick(TILDE.slice(0, grow(8, TILDE.length, s))), syl = w[1].split("-"), strong = syl.filter(function (x) { return x === x.toUpperCase(); })[0];
    return {
      skill: "acentuacion",
      prompt: _t("¿En qué sílaba suena más fuerte «") + w[0] + _t("»?"),
      speech: _t("¿En qué sílaba suena más fuerte esta palabra?"), speakWord: w[0],
      options: syl.map(function (x, k) { return { label: x.toLowerCase(), value: k, aria: x.toLowerCase() }; }),
      answer: syl.indexOf(strong),
      hint: _t("Dila como si llamaras a alguien desde lejos: la sílaba que alargas es la fuerte."),
      explain: _t("Suena más fuerte en «") + strong.toLowerCase() + _t("».")
    };
  }

  function tipoPalabra(p, s) {
    var pool = shuffle(TILDE).slice(0, grow(4, 7, s)), items = [], ans = {};
    pool.forEach(function (w, k) { items.push({ id: "t" + k, label: w[0] }); ans["t" + k] = w[2]; });
    return {
      type: "classify", skill: "acentuacion",
      prompt: _t("Clasifica cada palabra según su sílaba más fuerte."),
      bins: [{ id: "aguda", label: _t("Aguda (última)") }, { id: "llana", label: _t("Llana (penúltima)") }, { id: "esdrújula", label: _t("Esdrújula (antepenúltima)") }],
      items: items, answer: ans,
      hint: _t("Busca la sílaba fuerte y cuenta desde el final."),
      explain: pool.map(function (w) { return w[0] + ": " + w[2]; }).join(" · ") + "."
    };
  }

  function llevaTilde(p, s) {
    var pool = shuffle(CON_SIN_TILDE).slice(0, grow(4, 6, s)), items = [], ans = {};
    pool.forEach(function (w, k) { items.push({ id: "w" + k, label: w[0] }); ans["w" + k] = w[1] ? "bien" : (w[2] ? "mal" : "bien"); });
    return {
      type: "classify", skill: "acentuacion",
      prompt: _t("¿Cada palabra está bien escrita, con o sin tilde?"),
      bins: [{ id: "bien", label: _t("Bien escrita") }, { id: "mal", label: _t("Le falta o sobra la tilde") }],
      items: items, answer: ans,
      hint: _t("Las agudas llevan tilde si terminan en n, s o vocal; las llanas, si no terminan así; las esdrújulas, siempre."),
      explain: pool.filter(function (w) { return w[2]; }).map(function (w) { return w[0] + " → " + w[2]; }).join(" · ") || _t("Todas estaban bien escritas.")
    };
  }

  function regla(p, s) {
    var x = pick(REGLAS.slice(0, grow(6, REGLAS.length, s)));
    return {
      skill: "reglas_ortograficas",
      prompt: _t("Regla: ") + x.r + _t(". ¿Cuál está bien escrita?"),
      options: textOpts(x.ok, x.bad, 3),
      answer: x.ok,
      hint: _t("Lee la regla otra vez y busca la palabra que la cumple."),
      explain: _t("Se escribe «") + x.ok + _t("».")
    };
  }

  function claseLetra(p, s) {
    var bank = p.gj ? LETRA_GJ : LETRA_BV, letters = p.gj ? ["g", "j"] : ["b", "v"];
    var pool = shuffle(bank).slice(0, grow(4, 6, s)), items = [], ans = {};
    pool.forEach(function (w, k) { items.push({ id: "w" + k, label: w[0].replace("_", "▢") }); ans["w" + k] = w[1]; });
    return {
      type: "classify", skill: "ortografia_letras",
      prompt: _t("¿Cada palabra se completa con ") + letters[0].toUpperCase() + _t(" o con ") + letters[1].toUpperCase() + "?",
      bins: letters.map(function (l) { return { id: l, label: _t("Con ") + l.toUpperCase() }; }),
      items: items, answer: ans,
      hint: p.gj ? _t("Los verbos en -ger y -gir van con G; las palabras en -aje, con J.") : _t("Antes de consonante va B (habla, objeto); después de N va V (invitar)."),
      explain: pool.map(function (w) { return w[2]; }).join(", ") + "."
    };
  }

  function homofono(p, s) {
    var x = pick(HOMOFONOS);
    return {
      skill: "homofonos",
      prompt: _t("¿Qué palabra completa la frase?"),
      visual: '<p class="dl-sentence">' + x.f.replace("___", '<span class="gap"></span>') + "</p>",
      speakWord: x.f.replace("___", "espacio"),
      options: textOpts(x.ok, x.bad, s >= 2 ? 3 : 2),
      answer: x.ok,
      hint: _t("Piensa qué significa la frase: ¿habla de un lugar, de una acción o de una pregunta?"),
      explain: x.r
    };
  }

  function encontrarMal(p, s) {
    var c = pick(p.bank || CORRECCION);
    var words = c.t.replace(/[.,¿?]/g, "").split(" ").filter(function (w) { return w.length > 3; });
    var bads = words.filter(function (w) { return w !== c.mal; });
    return {
      skill: "correccion_texto",
      prompt: _t("Toca la palabra que está mal escrita."),
      visual: '<p class="dl-sentence">' + c.t + "</p>",
      options: textOpts(c.mal, bads, s >= 2 ? 4 : 3),
      answer: c.mal,
      hint: _t("Lee despacio y fíjate en tildes y letras que suenan igual (s, c, z, b, v, h)."),
      explain: _t("«") + c.mal + _t("» se escribe «") + c.bien + _t("».")
    };
  }

  function corregirEscribiendo(p, s) {
    var c = pick(CORRECCION);
    return {
      type: "input", text: true, skill: "correccion_texto", strictAccents: true,
      prompt: _t("La palabra «") + c.mal + _t("» está mal escrita. Escríbela bien."),
      visual: '<p class="dl-sentence">' + c.t + "</p>",
      answer: c.bien,
      hint: _t("Revisa las letras que suenan igual y la tilde."),
      explain: _t("Se escribe «") + c.bien + _t("».")
    };
  }

  function ordenarPalabras(p, s) {
    var o = pick(p.bank), words = o.split(" ");
    var items = words.map(function (w, k) { return { id: "p" + k, label: w }; });
    var order = shuffle(items), guard = 0;
    while (guard++ < 10 && order.every(function (x, k) { return x.label === words[k]; })) order = shuffle(items);
    return {
      type: "order", skill: "sintaxis",
      prompt: _t("Ordena las palabras para formar una oración."),
      slotsLabel: _t("Tu oración"),
      items: order, answer: items.map(function (x) { return x.id; }), answerLabel: o,
      hint: _t("Empieza por quién hace la acción y luego qué hace."),
      explain: _t("«") + o + _t(".»")
    };
  }

  function ordenarMensaje(p, s) {
    var m = pick(MENSAJES), n = grow(3, m.length, s), lines = m.slice(0, n);
    var items = lines.map(function (l, k) { return { id: "m" + k, label: l }; });
    return {
      type: "order", skill: "comprension_textos",
      prompt: _t("Ordena las partes del mensaje."),
      slotsLabel: _t("Mensaje en orden"),
      items: shuffle(items), answer: items.map(function (x) { return x.id; }), answerLabel: lines.join(" "),
      hint: _t("Un mensaje empieza con el saludo y termina con la despedida o la firma."),
      explain: lines.join(" ")
    };
  }

  function unirPares(p, s) {
    var set = shuffle(p.bank).slice(0, grow(3, 5, s)), left = [], right = [], ans = {};
    set.forEach(function (x, k) { left.push({ id: "a" + k, label: x[0] }); right.push({ id: "b" + k, label: x[1] }); ans["a" + k] = "b" + k; });
    return {
      type: "match", skill: p.skill,
      prompt: p.prompt,
      left: shuffle(left), right: shuffle(right), answer: ans,
      hint: p.hint,
      explain: set.map(function (x) { return x[0] + " = " + x[1]; }).join(" · ") + "."
    };
  }

  function ideaPrincipal(p, s) {
    var x = pick(IDEA_PRINCIPAL);
    return {
      skill: "comprension_textos",
      layout: "list",
      prompt: _t("¿Cuál es la idea principal del texto?"),
      visual: '<p class="dl-sentence" style="font-size:18px;text-align:left">' + x.t + "</p>",
      speakWord: x.t,
      options: textOpts(x.ok, x.bad, 3),
      answer: x.ok,
      hint: _t("La idea principal resume todo el texto, no solo un detalle."),
      explain: _t("La idea principal es: ") + x.ok.toLowerCase() + "."
    };
  }

  /**
   * Lectura al ritmo del estudiante: retos 1-2 frase por frase (lectura
   * compartida, con voz); retos 3-5 el texto completo para leer solo.
   * Al terminar responde una pregunta de comprensión.
   */
  function lectura(p, s) {
    var t = pick(LECTURAS[p.bank]);
    var paso = s <= 1;
    var prompt = paso ? _t("Lee frase por frase. Puedes escuchar cada una.") : _t("Lee el texto con calma y luego responde.");
    return {
      skill: "comprension_lectora",
      prompt: prompt,
      hint: _t("Vuelve a buscar la respuesta en el texto: suele estar escrita casi igual."),
      mount: function (host, api) {
        host.innerHTML = "";
        var wrap = document.createElement("div"); wrap.className = "dl-read";
        var box = document.createElement("div"); box.className = "dl-read__text";
        var lines = t.s.map(function (frase) { var pEl = document.createElement("p"); pEl.className = "dl-read__line" + (paso ? " is-dim" : ""); pEl.textContent = frase; box.appendChild(pEl); return pEl; });
        var bar = document.createElement("div"); bar.className = "dl-read__bar";
        wrap.appendChild(box); wrap.appendChild(bar); host.appendChild(wrap);
        var idx = -1, attempts = 0, closed = false;
        function btn(text, primary, fn) {
          var b = document.createElement("button"); b.type = "button";
          b.className = "game-btn " + (primary ? "game-btn--primary" : "game-btn--ghost");
          b.textContent = text; b.addEventListener("click", fn); bar.appendChild(b); return b;
        }
        function next() {
          idx++;
          lines.forEach(function (l, k) { l.classList.toggle("is-on", k === idx); l.classList.toggle("is-dim", k > idx); });
          if (idx < lines.length) api.say(t.s[idx], true, "es");
          if (idx >= lines.length - 1) { bar.innerHTML = ""; btn(_t("Ya leí"), true, ask).focus(); }
        }
        function ask() {
          bar.innerHTML = "";
          lines.forEach(function (l) { l.classList.remove("is-dim", "is-on"); });
          var q = document.createElement("p"); q.className = "dl-read__q"; q.textContent = t.q; wrap.appendChild(q);
          var opts = document.createElement("div"); opts.className = "dl-read__opts"; opts.setAttribute("role", "group"); wrap.appendChild(opts);
          api.say(t.q, false, "es");
          textOpts(t.ok, t.bad, 3).forEach(function (o) {
            var b = document.createElement("button"); b.type = "button"; b.className = "game-option"; b.textContent = o.label;
            b.addEventListener("click", function () {
              if (closed) return;
              attempts++;
              if (o.value === t.ok) {
                closed = true; b.classList.add("is-correct"); api.sound("ok");
                api.done({ stars: attempts === 1 ? 1 : 0.5, message: _t("¡Bien! ") + t.ok + ".", error: attempts > 1 ? { attempts: attempts, question: t.q } : null });
              } else {
                b.classList.add("is-wrong"); b.disabled = true; api.sound("retry");
                api.feedback(_t("Busca la respuesta en el texto."), "retry");
                lines.forEach(function (l) { l.classList.add("is-on"); });
                if (attempts >= 2) { closed = true; api.done({ stars: 0, message: _t("La respuesta era: ") + t.ok + ".", error: { attempts: attempts, question: t.q }, delay: 3200 }); }
              }
            });
            opts.appendChild(b);
          });
          opts.querySelector("button").focus();
        }
        if (paso) {
          btn(_t("Escuchar la frase"), false, function () { if (idx >= 0) api.say(t.s[idx], true, "es"); });
          btn(_t("Siguiente frase"), true, next);
          next();
        } else {
          btn(_t("Escuchar todo"), false, function () { api.say(t.s.join(" "), true, "es"); });
          btn(_t("Ya leí"), true, ask);
        }
        return function () { closed = true; };
      }
    };
  }

  function repasoFinal(p, s) {
    var mecs = [
      function () { return homofono({}, 4); },
      function () { return dictado({ bank: DICTADO_5, sentence: true, strict: true }, 4); },
      function () { return tipoPalabra({}, 4); },
      function () { return encontrarMal({}, 4); },
      function () { return lectura({ bank: "larga" }, 4); }
    ];
    return mecs[s % mecs.length]();
  }

  // ─── Plan ────────────────────────────────────────────────────────────────
  var PLAN = {
    1: [
      [letraInicial, {}, _t("Vas a reconocer letras que se confunden: b, d, p y q.")],
      [completar, { bank: CLOZE }, _t("Vas a completar palabras con la letra que falta.")],
      [bienEscrita, { bank: VOCAB }, _t("Vas a elegir la palabra bien escrita.")],
      [letrasEnOrden, { bank: [["🌙", "luna"], ["🪑", "mesa"], ["🐱", "gato"], ["🔑", "llave"], ["⚽", "pelota"], ["🧃", "jugo"]] }, _t("Vas a ordenar letras para formar palabras.")],
      [silabasEnOrden, { bank: SILABAS }, _t("Vas a ordenar sílabas para formar palabras.")],
      [contarSilabas, { bank: SILABAS }, _t("Vas a contar las sílabas de cada palabra.")],
      [rima, {}, _t("Vas a encontrar palabras que terminan con el mismo sonido.")],
      [lectura, { bank: "corta" }, _t("Vas a leer textos cortos frase por frase y responder una pregunta.")],
      [unirImagen, { bank: DICTADO_1.concat(CLOZE.filter(function (c) { return !DICTADO_1.some(function (d) { return d[1] === c[1]; }); }).map(function (c) { return [c[0], c[1]]; })) }, _t("Vas a unir imágenes con su palabra.")],
      [dictado, { bank: DICTADO_1 }, _t("Vas a escuchar palabras y escribirlas.")]
    ],
    2: [
      [completar, { bank: CLOZE_ADULTO }, _t("Vas a completar palabras de uso diario.")],
      [bienEscrita, { bank: VOCAB_ADULTO }, _t("Vas a elegir la palabra bien escrita.")],
      [letrasEnOrden, { bank: [["💼", "trabajo"], ["🏢", "oficina"], ["✉️", "correo"], ["📞", "llamada"], ["🧾", "factura"], ["🏦", "cuenta"]] }, _t("Vas a ordenar letras de palabras más largas.")],
      [silabasEnOrden, { bank: SILABAS_ADULTO }, _t("Vas a ordenar sílabas de palabras largas.")],
      [silabaTonica, {}, _t("Vas a encontrar la sílaba que suena más fuerte.")],
      [tipoPalabra, {}, _t("Vas a clasificar palabras en agudas, llanas y esdrújulas.")],
      [dictado, { bank: DICTADO_2, strict: true }, _t("Vas a escribir palabras que escuchas, con su tilde.")],
      [lectura, { bank: "funcional" }, _t("Vas a leer avisos y mensajes de la vida diaria.")],
      [regla, {}, _t("Vas a aplicar reglas de ortografía.")],
      [unirPares, { bank: SIGNIFICADOS, skill: "vocabulario", prompt: _t("Une cada palabra con su significado."), hint: _t("Piensa en dónde has escuchado esa palabra.") }, _t("Vas a unir palabras con su significado.")]
    ],
    3: [
      [homofono, {}, _t("Vas a elegir entre palabras que suenan igual pero se escriben distinto.")],
      [encontrarMal, {}, _t("Vas a encontrar la palabra mal escrita en una frase.")],
      [corregirEscribiendo, {}, _t("Vas a escribir bien la palabra equivocada.")],
      [llevaTilde, {}, _t("Vas a decidir si una palabra está bien escrita con o sin tilde.")],
      [claseLetra, {}, _t("Vas a decidir si una palabra va con B o con V.")],
      [lectura, { bank: "funcional" }, _t("Vas a leer avisos y responder con precisión.")],
      [dictado, { bank: DICTADO_3, sentence: true, strict: true }, _t("Vas a escribir frases cortas que escuchas.")],
      [completar, { bank: CLOZE_AVANZADO }, _t("Vas a completar palabras con letras difíciles.")],
      [unirPares, { bank: FAMILIAS, skill: "vocabulario", prompt: _t("Une cada verbo con la palabra de su familia."), hint: _t("Busca la palabra que comparte el comienzo.") }, _t("Vas a unir palabras de la misma familia.")],
      [ordenarPalabras, { bank: ORACIONES }, _t("Vas a ordenar palabras para formar oraciones.")]
    ],
    4: [
      [lectura, { bank: "instructivo" }, _t("Vas a leer instrucciones y responder.")],
      [encontrarMal, { bank: CORRECCION.slice(7) }, _t("Vas a encontrar errores en mensajes de trabajo.")],
      [homofono, {}, _t("Vas a resolver palabras que suenan igual en frases más difíciles.")],
      [ordenarMensaje, {}, _t("Vas a ordenar las partes de un mensaje.")],
      [dictado, { bank: DICTADO_4, sentence: true, strict: true }, _t("Vas a escribir oraciones que escuchas.")],
      [tipoPalabra, {}, _t("Vas a clasificar más palabras según su acento.")],
      [claseLetra, { gj: true }, _t("Vas a decidir si una palabra va con G o con J.")],
      [ordenarPalabras, { bank: ORACIONES.concat(DICTADO_4) }, _t("Vas a ordenar oraciones más largas.")],
      [ideaPrincipal, {}, _t("Vas a encontrar la idea principal de un texto.")],
      [unirPares, { bank: ABREVIATURAS, skill: "lectura_funcional", prompt: _t("Une cada abreviatura con su significado."), hint: _t("Las verás en direcciones, horarios y documentos.") }, _t("Vas a leer abreviaturas de direcciones y documentos.")]
    ],
    5: [
      [lectura, { bank: "larga" }, _t("Vas a leer textos largos y responder con precisión.")],
      [corregirEscribiendo, {}, _t("Vas a corregir palabras escribiéndolas bien.")],
      [homofono, {}, _t("Vas a dominar las palabras que suenan igual.")],
      [ordenarMensaje, {}, _t("Vas a ordenar mensajes completos.")],
      [dictado, { bank: DICTADO_5, sentence: true, strict: true }, _t("Vas a escribir oraciones largas que escuchas.")],
      [llevaTilde, {}, _t("Vas a revisar tildes en palabras difíciles.")],
      [regla, {}, _t("Vas a aplicar reglas de ortografía exigentes.")],
      [ideaPrincipal, {}, _t("Vas a resumir textos en su idea principal.")],
      [lectura, { bank: "instructivo" }, _t("Vas a leer instrucciones y contratos sencillos.")],
      [repasoFinal, {}, _t("Repaso final: un reto de cada habilidad.")]
    ]
  };

  var HABILIDADES = {
    letras_confusas: _t("Distinguir b, d, p y q"),
    ortografia_letras: _t("Elegir la letra correcta"),
    ortografia_visual: _t("Reconocer la palabra bien escrita"),
    ordenar_letras: _t("Formar palabras con letras"),
    silabas: _t("Separar en sílabas"),
    conciencia_fonologica: _t("Escuchar los sonidos de las palabras"),
    vocabulario: _t("Vocabulario"),
    escritura_dictado: _t("Escribir lo que escuchas"),
    acentuacion: _t("Acento y tildes"),
    reglas_ortograficas: _t("Reglas de ortografía"),
    homofonos: _t("Palabras que suenan igual"),
    correccion_texto: _t("Encontrar y corregir errores"),
    sintaxis: _t("Formar oraciones"),
    comprension_textos: _t("Entender textos completos"),
    comprension_lectora: _t("Comprensión lectora"),
    lectura_funcional: _t("Leer documentos de la vida diaria")
  };

  global.IndecapGame.register({
    slug: "dislexia_letras",
    skillLabels: HABILIDADES,
    plan: PLAN,
    getActivity: function (index) {
      var nivel = Math.min(5, Math.max(1, Math.ceil(index / 10)));
      var act = PLAN[nivel][(index - 1) % 10];
      return {
        intro: act[2] + _t(" Son ") + RETOS + _t(" retos que suben de dificultad. Puedes escuchar todo en voz alta."),
        rounds: RETOS,
        build: function (step) { return act[0](act[1], step); }
      };
    }
  });
})(window);
