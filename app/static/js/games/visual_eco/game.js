/**
 * ECO-EXPLORADOR SONORO — Discapacidad visual
 *
 * Habilidad central: aprender y orientarse por el canal auditivo, sin
 * depender de la vista en ninguna actividad.
 *  - Identificar sonidos y voces; ubicar de dónde vienen.
 *  - Memoria auditiva de secuencias.
 *  - Atención al sonido importante en medio del ruido.
 *  - Ecolocalización (más fuerte / más débil).
 *  - Rutas de orientación y movilidad; dictado de palabras y números.
 *
 * 5 niveles × 10 actividades, 5 retos por actividad que suben de dificultad.
 *
 * Principios: cada reto se anuncia por voz y cada opción tiene su propio
 * aria-label; el campo `visual` es solo decorativo (play.html lo marca
 * aria-hidden). Todo se opera con teclado o lector de pantalla.
 */
(function (global) {
  "use strict";
  var _t = global.IndecapGame.tr;

  // ─── Utilidades ───────────────────────────────────────────────────────────
  function rnd(a, b) { return Math.floor(Math.random() * (b - a + 1)) + a; }
  function pick(a) { return a[rnd(0, a.length - 1)]; }
  function shuffle(a) {
    a = a.slice();
    for (var i = a.length - 1; i > 0; i--) { var j = rnd(0, i), t = a[i]; a[i] = a[j]; a[j] = t; }
    return a;
  }
  function el(tag, cls) { var n = document.createElement(tag); if (cls) n.className = cls; return n; }
  function live() {
    var n = el("p", "visually-hidden");
    n.setAttribute("role", "status");
    n.setAttribute("aria-live", "polite");
    return n;
  }
  function textOpts(ok, bads, n) {
    return shuffle([ok].concat(shuffle(bads).slice(0, n - 1))).map(function (t) {
      return { label: t, value: t, aria: t };
    });
  }
  function addStyles(id, css) {
    if (document.getElementById(id)) return;
    var s = document.createElement("style"); s.id = id; s.textContent = css; document.head.appendChild(s);
  }

  addStyles("visual-eco-styles", [
    ".game-shell .game-options .game-option{font-size:1.2rem;max-width:320px}",
    ".eco-status{flex-basis:100%;font-weight:600;color:var(--g-muted);margin-bottom:10px}",
    ".eco-actions{flex-basis:100%;display:flex;flex-wrap:wrap;gap:12px;justify-content:center}",
    ".eco-input{flex-basis:100%;max-width:320px;font-size:1.4rem;text-align:center;padding:10px}",
    ".eco-model{flex-basis:100%;font-size:1.3rem;font-weight:700;color:var(--g-ok)}",
    ".seq-status{flex-basis:100%;font-weight:600;color:var(--g-muted);margin-bottom:8px}",
    ".seq-list{flex-basis:100%;list-style:none;margin:0 auto 12px;padding:0;max-width:480px;text-align:left}",
    ".seq-list li{background:var(--g-ok-soft);border:2px solid var(--g-ok);color:var(--g-ok);border-radius:12px;padding:10px 14px;margin-bottom:8px;font-weight:600}",
    ".seq-steps{flex-basis:100%;display:flex;flex-wrap:wrap;gap:12px;justify-content:center}",
    ".game-option.seq-step{display:flex;flex-direction:column;align-items:center;gap:6px;font-size:1.05rem;min-width:150px}",
    ".seq-icon{font-size:2rem;line-height:1}",
    ".game-option.seq-next{outline:4px solid var(--g-accent);outline-offset:3px}"
  ].join("\n"));

  // ─── Datos: nivel base ────────────────────────────────────────────────────

  var SONIDOS = [
    { t: _t("Escuchas: «guau, guau». ¿Qué animal hace ese sonido?"), ok: _t("Perro"), bad: [_t("Gato"), _t("Pájaro")] },
    { t: _t("Escuchas un «muu» largo y grave. ¿Qué animal hace ese sonido?"), ok: _t("Vaca"), bad: [_t("Oveja"), _t("Cerdo")] },
    { t: _t("Escuchas un timbre que suena dos veces seguidas en la puerta. ¿Qué está pasando?"), ok: _t("Alguien está tocando la puerta"), bad: [_t("Está sonando el teléfono"), _t("Está sonando una alarma")] },
    { t: _t("Escuchas muchas gotas golpeando el techo con fuerza. ¿Qué está pasando?"), ok: _t("Está lloviendo"), bad: [_t("Alguien está aplaudiendo"), _t("Alguien está tocando un tambor")] },
    { t: _t("Escuchas un silbato largo y fuerte, seguido de un motor que arranca despacio. ¿Qué está pasando?"), ok: _t("Un tren está saliendo de la estación"), bad: [_t("Un avión está aterrizando"), _t("Un carro está pitando en el tráfico")] },
    { t: _t("Escuchas un pitido corto que se repite cada segundo, seguido de un motor en reversa. ¿Qué está pasando?"), ok: _t("Un carro está dando reversa"), bad: [_t("Suena un reloj despertador"), _t("Suena una calculadora")] }
  ];

  var DIRECCIONES = [
    { t: _t("Una persona te llama desde tu lado izquierdo."), ok: "izquierda" },
    { t: _t("Un carro pasa haciendo ruido por tu lado derecho."), ok: "derecha" },
    { t: _t("Escuchas pasos que se acercan desde atrás de ti."), ok: "atras" },
    { t: _t("Una voz te saluda justo de frente."), ok: "adelante" },
    { t: _t("Escuchas que alguien tose desde tu lado derecho, un poco más lejos."), ok: "derecha" },
    { t: _t("Sientes una brisa y escuchas hojas moviéndose detrás de ti."), ok: "atras" }
  ];
  var DIR_LABEL = { izquierda: _t("Izquierda"), derecha: _t("Derecha"), adelante: _t("Adelante"), atras: _t("Atrás") };

  var SETS_MEMORIA = [
    [_t("Campana"), _t("Silbato"), _t("Tambor")],
    [_t("Aplauso"), _t("Pito"), _t("Trueno")],
    [_t("Timbre"), _t("Bocina"), _t("Sirena")],
    [_t("Reloj"), _t("Radio"), _t("Puerta")]
  ];

  var FIGURA_FONDO = [
    { t: _t("Estás en un mercado con mucha gente hablando. De repente, alguien dice tu nombre. ¿Qué haces primero?"), ok: _t("Me detengo y trato de ubicar de dónde viene la voz"), bad: [_t("Sigo caminando sin prestar atención"), _t("Hablo más fuerte sin escuchar primero")] },
    { t: _t("Hay música fuerte en la sala, pero alguien te pregunta algo desde la cocina. ¿Qué haces?"), ok: _t("Pido que bajen el volumen o me acerco para escuchar mejor"), bad: [_t("Respondo cualquier cosa sin haber escuchado bien"), _t("Me quedo callado")] },
    { t: _t("Vas caminando por la acera y escuchas el motor de un carro acercándose rápido. ¿Qué haces?"), ok: _t("Me detengo y espero a que el carro pase"), bad: [_t("Sigo caminando igual"), _t("Corro sin saber hacia dónde")] }
  ];

  var PALABRAS = ["sonido", "bastón", "radio", "campana", "escucha", "viento", "puerta", "camino"];

  var RUTAS_BASTON = [
    { title: _t("Cruzar la calle con el bastón"), steps: [
      { i: "🛑", t: _t("Me detengo en el borde de la acera") },
      { i: "🦯", t: _t("Toco el piso con el bastón para ubicar el borde") },
      { i: "👂", t: _t("Escucho el tráfico y espero que se detenga") },
      { i: "🚶", t: _t("Cruzo derecho, guiándome por el sonido") }
    ] },
    { title: _t("Salir de la habitación"), steps: [
      { i: "🦯", t: _t("Extiendo el bastón frente a mí") },
      { i: "🚶", t: _t("Camino hacia la puerta") },
      { i: "✋", t: _t("Toco el marco de la puerta con la mano") },
      { i: "🚪", t: _t("Abro la puerta y salgo") }
    ] },
    { title: _t("Pedir ayuda en la calle"), steps: [
      { i: "🛑", t: _t("Me detengo en un lugar seguro") },
      { i: "👂", t: _t("Escucho si hay alguien cerca") },
      { i: "🗣️", t: _t("Pregunto en voz alta si alguien me puede ayudar") },
      { i: "🙏", t: _t("Doy las gracias por la ayuda") }
    ] }
  ];

  var VOCES = [
    { t: _t("Escuchas una voz grave y muy pausada. ¿A quién describe mejor?"), ok: _t("A una persona mayor"), bad: [_t("A un bebé"), _t("A una niña")] },
    { t: _t("Escuchas una voz aguda seguida de una risa corta. ¿A quién describe mejor?"), ok: _t("A un niño pequeño"), bad: [_t("A un hombre adulto"), _t("A una persona mayor")] },
    { t: _t("Una voz habla despacio y suave, y dice: «tranquilo, todo está bien». ¿Qué emoción transmite esa voz?"), ok: _t("Calma"), bad: [_t("Enojo"), _t("Miedo")] },
    { t: _t("Una voz habla muy rápido y fuerte, casi gritando. ¿Qué emoción transmite esa voz?"), ok: _t("Urgencia o alarma"), bad: [_t("Calma"), _t("Aburrimiento")] }
  ];

  var RUTAS_MAPA = [
    { title: _t("Ruta a la tienda"), steps: [
      { i: "🚪", t: _t("Salgo por la puerta principal") },
      { i: "⬅️", t: _t("Giro a la izquierda en la esquina") },
      { i: "🚶", t: _t("Camino derecho dos cuadras") },
      { i: "➡️", t: _t("Giro a la derecha donde escucho el semáforo") },
      { i: "🏪", t: _t("Llego a la tienda") }
    ] },
    { title: _t("Ruta al parque"), steps: [
      { i: "🚪", t: _t("Salgo de casa") },
      { i: "🚶", t: _t("Camino derecho hasta escuchar los pájaros") },
      { i: "➡️", t: _t("Giro a la derecha en esa esquina") },
      { i: "🌳", t: _t("Llego al parque") }
    ] }
  ];

  // ─── Datos: vida adulta (niveles 2 a 5, 15-26 años) ────────────────────────

  var SONIDOS_ADULTO = [
    { t: _t("Escuchas un pitido agudo y corto que se repite tres veces. ¿Qué está pasando?"), ok: _t("Llegó una notificación al celular"), bad: [_t("Está sonando el microondas"), _t("Está sonando el timbre de la puerta")] },
    { t: _t("Escuchas un pitido largo, seguido de la voz de una lavadora terminando su ciclo."), ok: _t("La lavadora terminó de lavar"), bad: [_t("El horno terminó de calentar"), _t("Llegó una llamada")] },
    { t: _t("Escuchas un «bip» corto cada vez que alguien pasa por la puerta de una tienda."), ok: _t("Se activó el sensor de la puerta"), bad: [_t("Sonó una alarma de incendio"), _t("Sonó el timbre de una casa")] },
    { t: _t("Escuchas un tono de espera repetitivo mientras sostienes el teléfono."), ok: _t("Estás en espera en una llamada"), bad: [_t("La llamada se cortó"), _t("Te están marcando a ti")] },
    { t: _t("Escuchas un pitido agudo y constante que no para, seguido de gente hablando alarmada."), ok: _t("Sonó una alarma de incendio"), bad: [_t("Sonó el timbre de la oficina"), _t("Llegó un mensaje de texto")] },
    { t: _t("Escuchas una voz grabada que dice «Por favor, diríjase a la ventanilla 3»."), ok: _t("Te están llamando en un turno de atención"), bad: [_t("Es un anuncio de un tren"), _t("Es una alarma de seguridad")] }
  ];

  var DIRECCIONES_ADULTO = [
    { t: _t("Estás en la parada y escuchas el motor del bus acercándose por tu derecha."), ok: "derecha" },
    { t: _t("En la oficina, alguien te llama desde el escritorio de tu izquierda."), ok: "izquierda" },
    { t: _t("Caminas por la acera y escuchas pasos apurados acercándose desde atrás."), ok: "atras" },
    { t: _t("En la fila del banco, la persona que sigue te habla justo de frente."), ok: "adelante" },
    { t: _t("En la terminal de transporte, escuchas un anuncio por altavoz que viene de tu lado derecho, un poco más lejos."), ok: "derecha" },
    { t: _t("Sientes que alguien se acerca caminando desde atrás de ti en el pasillo de la oficina."), ok: "atras" }
  ];

  var SETS_MEMORIA_ADULTO = [
    [_t("Bocina"), _t("Semáforo sonoro"), _t("Frenos")],
    [_t("Notificación"), _t("Timbre de oficina"), _t("Impresora")],
    [_t("Turnero"), _t("Puerta automática"), _t("Cajero")],
    [_t("Anuncio"), _t("Torniquete"), _t("Tren")]
  ];

  var FIGURA_FONDO_ADULTO = [
    { t: _t("Estás en la oficina y hay varias conversaciones al mismo tiempo, pero tu jefe te llama por tu nombre desde su oficina. ¿Qué haces primero?"), ok: _t("Me detengo y trato de ubicar de dónde viene su voz"), bad: [_t("Sigo trabajando sin prestar atención"), _t("Respondo sin saber si me llamó a mí")] },
    { t: _t("Hay mucho ruido en la terminal de transporte, pero anuncian tu destino por el altavoz. ¿Qué haces?"), ok: _t("Presto atención al anuncio y confirmo con alguien cercano"), bad: [_t("Sigo caminando sin escuchar el anuncio"), _t("Ignoro el altavoz por completo")] },
    { t: _t("En una fila de banco hay mucho ruido, pero escuchas que dicen tu número de turno. ¿Qué haces?"), ok: _t("Confirmo mi número y me acerco a la ventanilla"), bad: [_t("Sigo esperando sin comprobar si es mi turno"), _t("Me voy sin verificar")] }
  ];

  var VOCES_ADULTO = [
    { t: _t("Un supervisor habla firme y despacio, dando instrucciones claras paso a paso. ¿Qué transmite ese tono?"), ok: _t("Seguridad y control de la situación"), bad: [_t("Enojo"), _t("Duda")] },
    { t: _t("Un cliente habla rápido, con la voz temblorosa, subiendo el tono al final de las frases. ¿Qué emoción transmite?"), ok: _t("Frustración o molestia"), bad: [_t("Calma"), _t("Alegría")] },
    { t: _t("Una persona en atención al cliente habla despacio, con un tono cálido y constante."), ok: _t("Amabilidad y disposición a ayudar"), bad: [_t("Prisa"), _t("Enojo")] },
    { t: _t("Alguien te habla en tono bajo y con pausas largas entre palabras."), ok: _t("Cansancio o preocupación"), bad: [_t("Entusiasmo"), _t("Urgencia")] }
  ];

  var PALABRAS_ADULTO = ["trabajo", "entrevista", "documento", "supervisor", "presupuesto", "contrato", "reunión", "factura"];

  var RUTAS_BASTON_ADULTO = [
    { title: _t("Tomar el bus solo"), steps: [
      { i: "🚏", t: _t("Espero en la parada, cerca del borde") },
      { i: "👂", t: _t("Escucho y pregunto el número del bus que se acerca") },
      { i: "🚌", t: _t("Subo cuando confirman que es el mío") },
      { i: "💳", t: _t("Pago mi pasaje") },
      { i: "🔔", t: _t("Toco el timbre antes de mi parada") }
    ] },
    { title: _t("Pedir ayuda en una oficina"), steps: [
      { i: "🚪", t: _t("Entro y saludo en voz alta") },
      { i: "🙋", t: _t("Explico qué necesito") },
      { i: "👂", t: _t("Escucho las indicaciones para llegar a la ventanilla") },
      { i: "🚶", t: _t("Sigo la ruta que me indicaron") }
    ] },
    { title: _t("Llegar al trabajo"), steps: [
      { i: "🚪", t: _t("Salgo de casa a la hora indicada") },
      { i: "🦯", t: _t("Uso el bastón para llegar a la parada") },
      { i: "🚌", t: _t("Tomo el bus correcto") },
      { i: "🏢", t: _t("Bajo en mi parada y camino hasta la entrada") }
    ] }
  ];

  var RUTAS_MAPA_ADULTO = [
    { title: _t("Ruta al banco"), steps: [
      { i: "🚪", t: _t("Salgo por la puerta principal") },
      { i: "➡️", t: _t("Giro a la derecha en la esquina") },
      { i: "🚶", t: _t("Camino derecho tres cuadras") },
      { i: "⬅️", t: _t("Giro a la izquierda donde escucho el semáforo sonoro") },
      { i: "🏦", t: _t("Llego al banco") }
    ] },
    { title: _t("Ruta a la EPS"), steps: [
      { i: "🚪", t: _t("Salgo de casa") },
      { i: "🚌", t: _t("Tomo el bus hasta la avenida principal") },
      { i: "🚶", t: _t("Camino derecho una cuadra") },
      { i: "➡️", t: _t("Giro a la derecha en la entrada") },
      { i: "🏥", t: _t("Llego a la EPS") }
    ] },
    { title: _t("Ruta al trabajo"), steps: [
      { i: "🚪", t: _t("Salgo de casa") },
      { i: "⬅️", t: _t("Giro a la izquierda hacia la parada") },
      { i: "🚌", t: _t("Tomo el bus") },
      { i: "🚶", t: _t("Camino derecho media cuadra al bajar") },
      { i: "🏢", t: _t("Llego a la oficina") }
    ] }
  ];

  /** Dictado numérico: números de teléfono, direcciones y códigos, dígito a
      dígito para que la voz sintética los pronuncie con claridad. */
  var NUMEROS_CORTOS = ["314", "605", "782", "930", "417"];
  var NUMEROS_TELEFONO = ["3005550148", "3105550173", "3205550126", "3155550190", "3015550164"];
  var NUMEROS_DIRECCION = ["Calle 45 # 12-30", "Carrera 8 # 20-15", "Avenida 30 # 5-42", "Calle 10 # 44-21", "Carrera 15 # 33-08"];
  var NUMEROS_CODIGO = ["482915", "739064", "156482", "902317", "648023"];

  // ─── Mecánicas de opción única ─────────────────────────────────────────────

  function retoSonido(p) {
    var banco = (p && p.bancos) || SONIDOS;
    var s = pick(banco);
    return {
      skill: "identificacion_sonidos", prompt: s.t, speech: s.t,
      options: textOpts(s.ok, s.bad, 3), answer: s.ok, answerLabel: s.ok,
      hint: _t("Piensa qué animal o cosa hace normalmente ese sonido."),
      explain: _t("Ese sonido lo hace: ") + s.ok + "."
    };
  }

  function retoDireccion(p) {
    var banco = (p && p.bancos) || DIRECCIONES;
    var d = pick(banco);
    var prompt = d.t + _t(" ¿De qué dirección viene el sonido?");
    return {
      skill: "localizacion_espacial", prompt: prompt, speech: prompt,
      options: Object.keys(DIR_LABEL).map(function (k) { return { label: DIR_LABEL[k], value: k, aria: DIR_LABEL[k] }; }),
      answer: d.ok, answerLabel: DIR_LABEL[d.ok],
      hint: _t("Imagina que tú estás en esa escena. ¿De qué lado se escucha?"),
      explain: _t("El sonido viene de: ") + DIR_LABEL[d.ok] + "."
    };
  }

  function retoFiguraFondo(p) {
    var banco = (p && p.bancos) || FIGURA_FONDO;
    var f = pick(banco);
    return {
      skill: "atencion_selectiva_auditiva", prompt: f.t, speech: f.t,
      options: textOpts(f.ok, f.bad, 3), answer: f.ok, answerLabel: f.ok,
      hint: _t("Piensa qué es lo más seguro e importante en ese momento."),
      explain: f.ok + "."
    };
  }

  function retoVoz(p) {
    var banco = (p && p.bancos) || VOCES;
    var v = pick(banco);
    return {
      skill: "reconocimiento_voz", prompt: v.t, speech: v.t,
      options: textOpts(v.ok, v.bad, 3), answer: v.ok, answerLabel: v.ok,
      hint: _t("Fíjate en el tono, la velocidad y las palabras que usa la voz."),
      explain: v.ok + "."
    };
  }

  // ─── Mecánicas con interfaz propia ────────────────────────────────────────

  /** Memoria auditiva: escucha una secuencia de sonidos nombrados y repítela
   * tocando los botones en el mismo orden. 100% operable por botón/teclado. */
  function roundMemoria(p, ctx, index) {
    var sets = p.sets || SETS_MEMORIA;
    var set = sets[((p.offset || 0) + index) % sets.length];
    var prompt = _t("Vas a escuchar una secuencia de ") + set.length + _t(" sonidos. Escúchalos y luego tócalos en el mismo orden.");
    return {
      skill: "memoria_secuencia_sonora", prompt: prompt, speech: prompt,
      hint: _t("Repite en tu mente el nombre de cada sonido en el orden en que sonó."),
      mount: function (host, api) {
        host.innerHTML = "";
        var lv = live(), status = el("p", "eco-status"), pad = el("div", "eco-actions"), replayBtn = el("button", "game-btn game-btn--ghost");
        replayBtn.type = "button"; replayBtn.textContent = _t("🔊 Escuchar de nuevo");
        [lv, status, pad, replayBtn].forEach(function (x) { host.appendChild(x); });

        var pos = 0, errors = 0, closed = false;
        function playSequence() {
          status.textContent = _t("Escuchando la secuencia…");
          var i = 0;
          (function step() {
            if (i >= set.length) { status.textContent = _t("Ahora repítela tocando los botones."); return; }
            api.say(set[i], true);
            i++;
            setTimeout(step, 900);
          })();
        }
        function buildPad() {
          shuffle(set).forEach(function (name) {
            var b = el("button", "game-option"); b.type = "button"; b.textContent = name; b.setAttribute("aria-label", name);
            b.addEventListener("click", function () { tap(b, name); });
            pad.appendChild(b);
          });
        }
        function tap(btn, name) {
          if (closed) return;
          if (name === set[pos]) {
            pos++; btn.classList.add("is-correct"); btn.disabled = true;
            lv.textContent = _t("Correcto: ") + name; api.feedback("", "");
            if (pos === set.length) { end(); }
          } else {
            errors++; btn.classList.add("is-wrong");
            setTimeout(function () { btn.classList.remove("is-wrong"); }, 500);
            api.feedback(_t("Ese no es el que sigue. Puedes volver a escuchar la secuencia."), "retry");
            if (errors === 2) api.hint();
          }
        }
        function end() {
          closed = true;
          api.done({
            stars: errors === 0 ? 1 : (errors === 1 ? 0.75 : 0.5),
            message: _t("¡Repetiste la secuencia de sonidos!"),
            error: errors ? { wrong: errors, attempts: errors + 1 } : null
          });
        }
        replayBtn.addEventListener("click", playSequence);
        buildPad();
        playSequence();
        return function () { closed = true; };
      }
    };
  }

  /** Ecolocalización: avanza o retrocede según el sonido se escuche más
   * fuerte o más débil, hasta encontrar el faro sonoro. Sin depender de
   * ninguna posición visual: solo dos botones y retroalimentación por voz. */
  function roundEco(p, ctx) {
    var target = rnd(3, 6);
    var pos = 0;
    var support = (ctx && ctx.support) || 1;
    var maxSteps = p.maxSteps || (support === 1 ? 14 : 10);
    var prompt = _t("Sigue el sonido de un faro invisible: «¡pío!». Cada vez que avances o retrocedas, te digo si se escucha más fuerte o más débil. Encuéntralo.");
    return {
      skill: "ecolocalizacion", prompt: prompt, speech: prompt,
      hint: _t("Si el sonido se hace más fuerte, vas en la dirección correcta. Si se hace más débil, retrocede."),
      mount: function (host, api) {
        host.innerHTML = "";
        var lv = live(), status = el("p", "eco-status"), actions = el("div", "eco-actions");
        status.textContent = _t("Da tu primer paso para saber si el faro está más cerca hacia adelante o hacia atrás.");
        var bAdv = el("button", "game-btn game-btn--primary"); bAdv.type = "button"; bAdv.textContent = _t("Avanzar");
        var bRet = el("button", "game-btn game-btn--ghost"); bRet.type = "button"; bRet.textContent = _t("Retroceder");
        actions.appendChild(bAdv); actions.appendChild(bRet);
        [lv, status, actions].forEach(function (x) { host.appendChild(x); });

        var errors = 0, closed = false, steps = 0;

        function move(dir) {
          if (closed) return;
          steps++;
          var newPos = Math.max(0, pos + dir);
          var prevDist = Math.abs(target - pos), newDist = Math.abs(target - newPos);
          var msg;
          if (newPos === target) { msg = _t("¡Pío! Lo encontraste."); }
          else if (newDist < prevDist) { msg = _t("El sonido se escucha más fuerte."); }
          else { msg = _t("El sonido se escucha más débil."); errors++; }
          pos = newPos;
          lv.textContent = msg;
          api.say(msg, true);
          api.feedback(msg, newPos === target ? "ok" : "");
          status.textContent = _t("Pasos dados: ") + steps;

          if (pos === target) {
            closed = true;
            api.done({
              stars: errors === 0 ? 1 : (errors <= 2 ? 0.75 : 0.5),
              message: _t("¡Encontraste el faro sonoro en ") + steps + _t(" pasos!"),
              error: errors ? { wrong: errors, steps: steps, attempts: errors + 1 } : null
            });
          } else if (steps >= maxSteps) {
            closed = true;
            api.done({
              stars: 0.5,
              message: _t("Buen intento. El faro estaba un poco más adelante."),
              error: { wrong: errors, steps: steps, attempts: errors + 1 }
            });
          }
        }
        bAdv.addEventListener("click", function () { move(1); });
        bRet.addEventListener("click", function () { move(-1); });
        return function () { closed = true; };
      }
    };
  }

  // ─── Actividades y plan: 5 niveles × 10 actividades ───────────────────────

  var U = global.IndecapGame.util;
  var grow = U.grow;

  var SONIDOS_MEMORIA = [_t("Campana"), _t("Silbato"), _t("Tambor"), _t("Aplauso"), _t("Pito"), _t("Timbre"), _t("Bocina"), _t("Sirena"), _t("Reloj"), _t("Radio"), _t("Puerta"), _t("Trueno")];
  var SONIDOS_CIUDAD = [_t("Bocina"), _t("Semáforo sonoro"), _t("Frenos"), _t("Notificación"), _t("Impresora"), _t("Turnero"), _t("Puerta automática"), _t("Cajero"), _t("Anuncio"), _t("Torniquete"), _t("Tren"), _t("Timbre de oficina")];
  var ALERTA = {
    alerta: { label: _t("Me avisa de un peligro o algo urgente"), items: [_t("Alarma de incendio"), _t("Bocina de un carro muy cerca"), _t("Sirena de ambulancia"), _t("Pitido de un carro en reversa"), _t("Grito de «¡cuidado!»"), _t("Olla a presión silbando fuerte")] },
    diario: { label: _t("Sonido de todos los días"), items: [_t("Notificación del celular"), _t("Lavadora terminando"), _t("Música de fondo"), _t("Conversación en la oficina"), _t("Pájaros en el parque"), _t("Microondas que termina")] }
  };
  var FUENTES = [[_t("Pitido corto cada segundo y motor en reversa"), _t("Un carro dando reversa")], [_t("Voz grabada: «diríjase a la ventanilla 3»"), _t("Turnero de atención")],
    [_t("Pitido largo que no para y gente hablando alarmada"), _t("Alarma de incendio")], [_t("«Tic-tac» constante"), _t("Reloj")], [_t("Silbido agudo que sube de volumen"), _t("Olla a presión")],
    [_t("Tono repetido mientras sostienes el teléfono"), _t("Llamada en espera")], [_t("«Bip» al pasar una tarjeta"), _t("Torniquete del metro")], [_t("Golpes de gotas en el techo"), _t("Lluvia")]];

  function rutaOrden(p, s) {
    var rutas = s >= 2 && p.adulto ? p.adulto : p.base;
    var r = U.pick(rutas);
    var items = r.steps.map(function (st, i) { return { id: "r" + i, label: '<span aria-hidden="true" style="margin-right:6px">' + st.i + "</span>" + st.t }; });
    return {
      type: "order", skill: p.skill || "orientacion_movilidad",
      prompt: _t("Ordena los pasos: ") + U.lower(r.title) + ".",
      slotsLabel: _t("Primero → después"),
      items: U.shuffle(items), answer: items.map(function (i) { return i.id; }),
      answerLabel: r.steps.map(function (st) { return st.t; }).join(" → "),
      hint: _t("Imagina que lo haces ahora: ¿qué es lo primero que tocas o escuchas?"),
      explain: r.steps.map(function (st, i) { return (i + 1) + ". " + st.t; }).join(" ") + "."
    };
  }

  function memoria(p, s) {
    var n = grow(3, 5, s), set = U.shuffle(p.pool).slice(0, n);
    return roundMemoria({ sets: [set] }, {}, 0);
  }

  function dictadoPalabra(p, s) {
    var w = U.pick(p.bank);
    return {
      type: "input", text: true, skill: "dictado_palabras",
      prompt: _t("Escucha la palabra y escríbela."),
      listen: w, answer: w, strictAccents: false,
      hint: _t("Escúchala otra vez y escribe sílaba por sílaba."),
      explain: _t("Se escribe «") + w + _t("».")
    };
  }

  function dictadoNumero(p, s) {
    var raw = U.pick(p.bank), digits = raw.replace(/\D/g, "");
    var spoken = digits.split("").join(", ");
    return {
      type: "input", skill: "dictado_numerico",
      prompt: p.prompt || _t("Escucha el número y escríbelo."),
      listen: (p.say ? raw + _t(". Dígito por dígito: ") : "") + spoken,
      answer: digits, maxLength: digits.length + 6, listenLang: "page",
      answerLabel: digits === raw ? raw : digits + " (" + raw + ")",
      hint: _t("Puedes escucharlo de nuevo las veces que necesites."),
      explain: digits === raw ? _t("El número es ") + raw + "." : _t("En ") + raw + _t(" los números, en orden, son ") + raw.match(/\d+/g).join(" ") + "."
    };
  }

  function clasificarSonidos(p, s) {
    var keys = Object.keys(ALERTA), items = [], ans = {}, k = 0;
    keys.forEach(function (key) { U.shuffle(ALERTA[key].items).slice(0, grow(2, 4, s)).forEach(function (t) { var id = "a" + (k++); items.push({ id: id, label: t }); ans[id] = key; }); });
    return {
      type: "classify", skill: "atencion_selectiva_auditiva",
      prompt: _t("¿Cada sonido te avisa de algo urgente o es de todos los días?"),
      bins: keys.map(function (key) { return { id: key, label: ALERTA[key].label }; }),
      items: U.shuffle(items), answer: ans,
      hint: _t("Los sonidos de alerta suelen ser fuertes, agudos y repetidos."),
      explain: _t("Ante un sonido de alerta, primero me detengo y busco ubicar de dónde viene.")
    };
  }

  function unirFuente(p, s) {
    var set = U.shuffle(FUENTES).slice(0, grow(3, 5, s)), left = [], right = [], ans = {};
    set.forEach(function (f, i) { left.push({ id: "s" + i, label: f[0] }); right.push({ id: "f" + i, label: f[1] }); ans["s" + i] = "f" + i; });
    return {
      type: "match", skill: "identificacion_sonidos",
      prompt: _t("Une cada sonido con lo que lo produce."),
      left: U.shuffle(left), right: U.shuffle(right), answer: ans,
      hint: _t("Empieza por el sonido que más has escuchado."),
      explain: set.map(function (f) { return f[0] + " → " + f[1]; }).join(" · ") + "."
    };
  }

  function con(fn, params) { return function (p, s) { return fn(typeof params === "function" ? params(s) : params, { support: 1 }, 0); }; }
  function mix(list) { return function (p, s) { return list[s % list.length](p, s); }; }
  function bank(base, adulto) { return function (s) { return { bancos: s >= 2 ? adulto : base }; }; }

  var RUTAS = { base: RUTAS_BASTON, adulto: RUTAS_BASTON_ADULTO };
  var MAPAS = { base: RUTAS_MAPA, adulto: RUTAS_MAPA_ADULTO, skill: "rutas_sonoras" };

  var PLAN = {
    1: [
      [con(retoSonido, {}), _t("Vas a identificar sonidos por su descripción.")],
      [con(retoDireccion, {}), _t("Vas a ubicar de qué dirección viene un sonido.")],
      [function (p, s) { return memoria({ pool: SONIDOS_MEMORIA }, s); }, _t("Vas a escuchar secuencias de sonidos y repetirlas en orden.")],
      [con(retoFiguraFondo, {}), _t("Vas a prestar atención al sonido importante en medio del ruido.")],
      [con(roundEco, function (s) { return { maxSteps: grow(14, 10, s) }; }), _t("Vas a encontrar un faro invisible siguiendo si el sonido sube o baja.")],
      [function (p, s) { return dictadoPalabra({ bank: PALABRAS }, s); }, _t("Vas a escuchar palabras y escribirlas.")],
      [function (p, s) { return rutaOrden(RUTAS, s); }, _t("Vas a ordenar los pasos de rutas con bastón.")],
      [con(retoVoz, {}), _t("Vas a reconocer quién habla y qué emoción transmite su voz.")],
      [unirFuente, _t("Vas a unir sonidos con lo que los produce.")],
      [clasificarSonidos, _t("Vas a distinguir sonidos de alerta de sonidos cotidianos.")]
    ],
    2: [
      [con(retoSonido, bank(SONIDOS, SONIDOS_ADULTO)), _t("Vas a identificar sonidos de la casa y del trabajo.")],
      [con(retoDireccion, bank(DIRECCIONES, DIRECCIONES_ADULTO)), _t("Vas a ubicar sonidos en la calle y la oficina.")],
      [function (p, s) { return memoria({ pool: SONIDOS_CIUDAD }, s); }, _t("Vas a recordar secuencias de sonidos de la ciudad.")],
      [con(retoFiguraFondo, bank(FIGURA_FONDO, FIGURA_FONDO_ADULTO)), _t("Vas a concentrarte en ambientes ruidosos.")],
      [con(roundEco, function (s) { return { maxSteps: grow(12, 9, s) }; }), _t("El faro sonoro está más lejos: encuéntralo con menos pasos.")],
      [function (p, s) { return dictadoPalabra({ bank: PALABRAS_ADULTO }, s); }, _t("Vas a escribir palabras de la vida adulta.")],
      [function (p, s) { return dictadoNumero({ bank: NUMEROS_CORTOS }, s); }, _t("Vas a escuchar números cortos y escribirlos.")],
      [function (p, s) { return rutaOrden(RUTAS, s); }, _t("Vas a ordenar rutas para moverte solo.")],
      [con(retoVoz, bank(VOCES, VOCES_ADULTO)), _t("Vas a reconocer tonos de voz en el trabajo.")],
      [unirFuente, _t("Vas a unir sonidos de la vida diaria con su fuente.")]
    ],
    3: [
      [con(retoSonido, { bancos: SONIDOS_ADULTO }), _t("Vas a reconocer sonidos de estaciones y oficinas.")],
      [function (p, s) { return rutaOrden(MAPAS, s); }, _t("Vas a ordenar rutas sonoras para llegar a un lugar.")],
      [function (p, s) { return dictadoNumero({ bank: NUMEROS_DIRECCION, say: true, prompt: _t("Escucha la dirección y escribe solo sus números, en orden.") }, s); }, _t("Vas a escribir los números de direcciones.")],
      [con(retoDireccion, { bancos: DIRECCIONES_ADULTO }), _t("Vas a ubicar sonidos en cruces con tráfico.")],
      [function (p, s) { return memoria({ pool: SONIDOS_CIUDAD }, s + 1); }, _t("Vas a recordar secuencias más largas.")],
      [con(retoFiguraFondo, { bancos: FIGURA_FONDO_ADULTO }), _t("Vas a atender anuncios importantes en lugares ruidosos.")],
      [clasificarSonidos, _t("Vas a reconocer alertas entre muchos sonidos.")],
      [con(retoVoz, { bancos: VOCES_ADULTO }), _t("Vas a interpretar el tono de voz de otras personas.")],
      [con(roundEco, function (s) { return { maxSteps: grow(10, 8, s) }; }), _t("Faro sonoro con pocos pasos.")],
      [function (p, s) { return dictadoNumero({ bank: NUMEROS_TELEFONO, prompt: _t("Escucha el número de teléfono y escríbelo.") }, s); }, _t("Vas a escribir números de teléfono.")]
    ],
    4: [
      [function (p, s) { return dictadoNumero({ bank: NUMEROS_CODIGO, prompt: _t("Escucha el código y escríbelo.") }, s); }, _t("Vas a escribir códigos de seis dígitos.")],
      [function (p, s) { return rutaOrden({ base: RUTAS_MAPA_ADULTO, adulto: RUTAS_MAPA_ADULTO, skill: "rutas_sonoras" }, s); }, _t("Vas a planear rutas al banco, la EPS y el trabajo.")],
      [function (p, s) { return memoria({ pool: SONIDOS_CIUDAD.concat(SONIDOS_MEMORIA) }, s + 1); }, _t("Vas a recordar secuencias de hasta seis sonidos.")],
      [mix([con(retoSonido, { bancos: SONIDOS_ADULTO }), con(retoDireccion, { bancos: DIRECCIONES_ADULTO })]), _t("Vas a identificar y ubicar sonidos.")],
      [mix([con(retoFiguraFondo, { bancos: FIGURA_FONDO_ADULTO }), clasificarSonidos]), _t("Vas a priorizar el sonido importante.")],
      [function (p, s) { return dictadoPalabra({ bank: PALABRAS_ADULTO }, s); }, _t("Vas a escribir palabras de trabajo sin ayudas.")],
      [mix([con(retoVoz, { bancos: VOCES_ADULTO }), unirFuente]), _t("Vas a reconocer voces y fuentes de sonido.")],
      [con(roundEco, function (s) { return { maxSteps: 8 }; }), _t("Faro sonoro: precisión máxima.")],
      [function (p, s) { return rutaOrden(RUTAS, s + 2); }, _t("Vas a ordenar rutinas de independencia.")],
      [function (p, s) { return dictadoNumero({ bank: NUMEROS_TELEFONO.concat(NUMEROS_CODIGO) }, s); }, _t("Vas a escribir teléfonos y códigos.")]
    ],
    5: [
      [mix([con(retoSonido, { bancos: SONIDOS_ADULTO }), unirFuente, clasificarSonidos]), _t("Vas a reconocer cualquier sonido de la ciudad.")],
      [mix([con(retoDireccion, { bancos: DIRECCIONES_ADULTO }), function (p, s) { return rutaOrden(MAPAS, 4); }]), _t("Vas a orientarte y planear rutas.")],
      [function (p, s) { return memoria({ pool: SONIDOS_CIUDAD.concat(SONIDOS_MEMORIA) }, 4); }, _t("Vas a recordar secuencias largas.")],
      [mix([function (p, s) { return dictadoNumero({ bank: NUMEROS_DIRECCION, say: true, prompt: _t("Escucha la dirección y escribe solo sus números, en orden.") }, s); }, function (p, s) { return dictadoNumero({ bank: NUMEROS_TELEFONO }, s); }]), _t("Vas a escribir direcciones y teléfonos.")],
      [mix([con(retoFiguraFondo, { bancos: FIGURA_FONDO_ADULTO }), con(retoVoz, { bancos: VOCES_ADULTO })]), _t("Vas a escuchar lo importante y el tono de cada voz.")],
      [con(roundEco, function () { return { maxSteps: 8 }; }), _t("Faro sonoro de experto.")],
      [function (p, s) { return dictadoPalabra({ bank: PALABRAS_ADULTO.concat(PALABRAS) }, s); }, _t("Vas a escribir cualquier palabra que escuches.")],
      [function (p, s) { return rutaOrden({ base: RUTAS_BASTON_ADULTO.concat(RUTAS_MAPA_ADULTO), adulto: RUTAS_BASTON_ADULTO.concat(RUTAS_MAPA_ADULTO) }, s); }, _t("Vas a ordenar rutas completas de tu día.")],
      [mix([clasificarSonidos, unirFuente]), _t("Vas a decidir rápido qué sonido es una alerta.")],
      [mix([con(retoSonido, { bancos: SONIDOS_ADULTO }), function (p, s) { return memoria({ pool: SONIDOS_CIUDAD }, 3); }, function (p, s) { return dictadoNumero({ bank: NUMEROS_CODIGO }, s); }, function (p, s) { return rutaOrden(MAPAS, 4); }, con(retoVoz, { bancos: VOCES_ADULTO })]), _t("Repaso final: un reto de cada habilidad.")]
    ]
  };

  var HABILIDADES = {
    identificacion_sonidos: _t("Identificar sonidos"),
    localizacion_espacial: _t("Ubicar de dónde viene un sonido"),
    memoria_secuencia_sonora: _t("Memoria auditiva"),
    atencion_selectiva_auditiva: _t("Atender al sonido importante"),
    ecolocalizacion: _t("Seguir un sonido"),
    dictado_palabras: _t("Escribir palabras que escuchas"),
    dictado_numerico: _t("Escribir números que escuchas"),
    orientacion_movilidad: _t("Rutinas de orientación y movilidad"),
    rutas_sonoras: _t("Planear rutas"),
    reconocimiento_voz: _t("Reconocer tonos de voz")
  };

  global.IndecapGame.register({
    slug: "visual_eco",
    skillLabels: HABILIDADES,
    plan: PLAN,
    getActivity: function (index) {
      var nivel = Math.min(5, Math.max(1, Math.ceil(index / 10)));
      var act = PLAN[nivel][(index - 1) % 10];
      return {
        intro: act[1] + _t(" Son 5 retos que suben de dificultad. Todo se escucha y se responde con teclado o lector de pantalla."),
        rounds: 5,
        build: function (step) { return act[0]({}, step); }
      };
    }
  });
})(window);
