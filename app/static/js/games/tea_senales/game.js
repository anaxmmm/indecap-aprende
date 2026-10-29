/**
 * LA ESTACIÓN DE LAS SEÑALES — Trastorno del espectro autista
 *
 * Habilidad central: anticipación, comunicación social y flexibilidad.
 *  - Agenda y cambios de plan anunciados.
 *  - Reconocer emociones en caras, situaciones y señales del cuerpo.
 *  - Lenguaje figurado, doble sentido y turnos de conversación.
 *  - Lo que piensa otra persona según lo que vio (creencias de otros).
 *
 * 5 niveles × 10 actividades, 5 retos por actividad que suben de dificultad.
 *
 * Principios: cero presión de tiempo; cada actividad anuncia lo que va a
 * pasar; lenguaje literal y consignas cortas; control sensorial siempre
 * visible («Pausa tranquila», contraste, movimiento). Los sonidos empiezan
 * apagados y el estudiante decide si los activa.
 */
(function (global) {
  "use strict";
  var _t = global.IndecapGame.tr;

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

  function textOptions(ok, bads, n) {
    var list = [ok].concat(shuffle(bads).slice(0, n - 1));
    return shuffle(list).map(function (t) {
      return { label: t, value: t, aria: t };
    });
  }

  function lower(t) {
    return t.charAt(0).toLowerCase() + t.slice(1);
  }

  var STYLE_ID = "tea-senales-styles";
  function injectStyles() {
    if (document.getElementById(STYLE_ID)) return;
    var css = [
      ".game-shell .game-options .game-option{font-size:1.15rem;max-width:300px}",
      ".tea-big{font-size:5rem;line-height:1}",
      ".tea-status{flex-basis:100%;font-weight:600;color:var(--g-muted);margin-bottom:8px}",
      ".tea-agenda{display:flex;flex-wrap:wrap;align-items:center;justify-content:center;gap:8px}",
      ".tea-agenda__item{display:flex;flex-direction:column;align-items:center;gap:2px;background:#FFFFFF;border:2px solid var(--indecap-border,#DCE4EA);border-radius:12px;padding:8px 10px;min-width:96px;font-size:.85rem;color:var(--g-text)}",
      ".tea-agenda__item.is-ref{border-color:var(--g-accent);background:var(--g-accent-soft);color:var(--g-frame-dark);font-weight:700}",
      ".tea-agenda__n{font-size:.75rem;color:var(--g-muted)}",
      ".tea-agenda__i{font-size:1.8rem;line-height:1}",
      ".tea-agenda__arrow{color:var(--g-muted);font-size:1.2rem}",
      ".tea-story{max-width:560px;margin:0 auto;font-size:1.1rem;line-height:1.7;color:var(--g-text)}",
      ".tea-list{flex-basis:100%;list-style:none;margin:0 auto 12px;padding:0;max-width:480px;text-align:left}",
      ".tea-list li{background:var(--g-ok-soft);border:2px solid var(--g-ok);color:var(--g-ok);border-radius:12px;padding:10px 14px;margin-bottom:8px;font-weight:600}",
      ".tea-steps{flex-basis:100%;display:flex;flex-wrap:wrap;gap:12px;justify-content:center}",
      ".game-option.tea-step{display:flex;flex-direction:column;align-items:center;gap:6px;font-size:1rem;min-width:150px;max-width:220px}",
      ".tea-step-icon{font-size:2.2rem;line-height:1}",
      ".game-option.tea-next{outline:4px solid var(--g-accent);outline-offset:3px}",
      ".tea-calm{display:none;text-align:center;max-width:460px;margin:0 auto;color:var(--g-text)}",
      ".tea-calm h2{font-size:1.4rem;margin-bottom:12px}",
      ".tea-calm p{line-height:1.7}",
      ".game-shell.tea-paused .game-screen{display:none !important}",
      ".game-shell.tea-paused .tea-calm{display:block}"
    ].join("\n");
    var style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = css;
    document.head.appendChild(style);
  }
  injectStyles();

  /**
   * Botón "Pausa tranquila" en la barra de accesibilidad y su panel dentro del
   * escenario. Es un control sensorial permanente: el estudiante puede parar
   * en cualquier momento sin explicar por qué.
   */
  function setupCalm() {
    var shell = document.querySelector(".game-shell");
    var bar = document.querySelector(".game-a11y-bar");
    var stage = document.getElementById("gameStage");
    if (!shell || !bar || !stage || document.getElementById("teaCalmBtn")) return;

    var btn = el("button", "game-a11y-btn");
    btn.id = "teaCalmBtn";
    btn.type = "button";
    btn.setAttribute("aria-pressed", "false");
    btn.textContent = _t("🌿 Pausa tranquila");
    var hintBtn = bar.querySelector('[data-a11y-action="hint"]');
    bar.insertBefore(btn, hintBtn);

    var panel = el("div", "tea-calm");
    panel.setAttribute("role", "region");
    panel.setAttribute("aria-label", _t("Pausa tranquila"));
    panel.innerHTML =
      _t("<h2>Pausa tranquila</h2>") +
      _t("<p>Estás en una pausa. No hay tiempo límite y no pierdes nada.</p>") +
      _t("<p>Puedes respirar así: cuenta 4 al tomar aire, 4 al sostenerlo y 4 al soltarlo.</p>");
    var back = el("button", "game-btn game-btn--primary");
    back.type = "button";
    back.textContent = _t("Volver al juego");
    panel.appendChild(back);
    stage.appendChild(panel);

    function toggle(force) {
      var on = typeof force === "boolean" ? force : !shell.classList.contains("tea-paused");
      shell.classList.toggle("tea-paused", on);
      btn.setAttribute("aria-pressed", on ? "true" : "false");
      if (on) { back.focus(); } else { btn.focus(); }
    }

    btn.addEventListener("click", function () { toggle(); });
    back.addEventListener("click", function () { toggle(false); });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && shell.classList.contains("tea-paused")) toggle(false);
    });
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", setupCalm);
  } else {
    setupCalm();
  }

  // ─── Datos: nivel base ────────────────────────────────────────────────────

  var AGENDA = [
    { i: "🏫", t: _t("Llegada al colegio") },
    { i: "📐", t: _t("Clase de matemáticas") },
    { i: "🥪", t: _t("Descanso") },
    { i: "📖", t: _t("Clase de lectura") },
    { i: "🏠", t: _t("Salida") }
  ];

  var EMO = {
    feliz: ["😀", _t("Feliz")],
    triste: ["😢", _t("Triste")],
    enojado: ["😠", _t("Enojado")],
    sorprendido: ["😮", _t("Sorprendido")],
    asustado: ["😨", _t("Asustado")],
    tranquilo: ["😌", _t("Tranquilo")]
  };
  var EMO_KEYS = Object.keys(EMO);

  var SITUACIONES = [
    { t: _t("Le dicen que sacó la mejor nota del curso."), e: "feliz" },
    { t: _t("Se le dañó el celular donde tenía todas sus fotos."), e: "triste" },
    { t: _t("Alguien se coló en la fila del almuerzo delante de él."), e: "enojado" },
    { t: _t("Escuchó un trueno muy fuerte de repente."), e: "asustado" },
    { t: _t("Sus amigos le hicieron una fiesta de cumpleaños que no esperaba."), e: "sorprendido" },
    { t: _t("Está en su cuarto escuchando su música favorita, sin pendientes."), e: "tranquilo" },
    { t: _t("Su equipo ganó el partido del torneo."), e: "feliz" }
  ];

  var SENALES = [
    { t: _t("Tu compañero cruza los brazos, frunce el ceño y respira fuerte."), e: "enojado" },
    { t: _t("Tu compañera sonríe y salta con los brazos arriba."), e: "feliz" },
    { t: _t("Tu compañero mira al suelo, tiene los hombros caídos y los ojos llorosos."), e: "triste" },
    { t: _t("Tu compañero abre mucho los ojos y da un paso atrás cuando suena un trueno."), e: "asustado" },
    { t: _t("Tu compañera está sentada, respira lento y tiene los hombros sueltos."), e: "tranquilo" }
  ];

  var DIALOGOS = [
    { t: _t("Un compañero te dice: «Hola, ¿cómo estás?»"), ok: _t("Le respondo y le pregunto cómo está él"), bad: [_t("No digo nada y me voy"), _t("Empiezo a hablar de otro tema sin responderle")] },
    { t: _t("Tu amiga te cuenta que su mascota se enfermó."), ok: _t("La escucho y le digo que lamento lo que pasó"), bad: [_t("Cambio de tema y hablo de mis juegos"), _t("Me pongo a mirar el celular")] },
    { t: _t("Dos compañeros conversan y tú quieres participar."), ok: _t("Espero una pausa y pregunto: «¿Puedo unirme?»"), bad: [_t("Los interrumpo hablando fuerte"), _t("Me quedo lejos sin decir nada")] },
    { t: _t("La profesora te pregunta cómo te fue en la actividad."), ok: _t("Le cuento brevemente cómo me fue"), bad: [_t("Me quedo callado mirando el piso"), _t("Le respondo algo que no tiene relación")] },
    { t: _t("Un compañero termina de hablar y te mira."), ok: _t("Es mi turno: le respondo"), bad: [_t("Sigo esperando en silencio"), _t("Me voy sin decir nada")] }
  ];

  var FIGURADO = [
    { f: _t("Está lloviendo a cántaros"), ok: _t("Llueve muy fuerte"), bad: [_t("Caen cántaros del cielo"), _t("Llueve muy poco")] },
    { f: _t("Tengo mariposas en el estómago"), ok: _t("Estoy nervioso o emocionado"), bad: [_t("Me comí unas mariposas"), _t("Tengo mucha hambre")] },
    { f: _t("Se me hizo agua la boca"), ok: _t("Algo se ve muy rico"), bad: [_t("Me cayó agua en la boca"), _t("Tengo sed de jugo")] },
    { f: _t("Estoy muerto de sueño"), ok: _t("Tengo mucho sueño"), bad: [_t("Estoy enfermo de gravedad"), _t("No tengo sueño")] },
    { f: _t("Me quedé de piedra"), ok: _t("Me sorprendí mucho"), bad: [_t("Me convertí en piedra"), _t("Me dio mucha risa")] }
  ];

  var CAMBIOS = [
    { plan: _t("Hoy había clase de educación física en la cancha"), nuevo: _t("empezó a llover y la clase será en el salón"),
      ok: _t("Voy al salón: es el plan nuevo"), bad: [_t("Me enojo y no quiero entrar a ninguna clase"), _t("Insisto en ir a la cancha bajo la lluvia")] },
    { plan: _t("Hoy tenías clase de dibujo"), nuevo: _t("la profesora avisó que hoy será clase de música"),
      ok: _t("Me preparo para la clase de música"), bad: [_t("Me niego a entrar al salón"), _t("Repito que quiero dibujo")] },
    { plan: _t("Hoy ibas a almorzar pasta"), nuevo: _t("se acabó la pasta y hay arroz con pollo"),
      ok: _t("Pruebo el arroz con pollo o pido otra opción"), bad: [_t("No como nada por el cambio"), _t("Pido pasta una y otra vez")] }
  ];

  var CREENCIAS = [
    { t: _t("Luis guarda su balón en la caja roja y sale del salón. Mientras Luis no está, Mateo pasa el balón a la caja azul. Luis vuelve."),
      q: _t("¿Dónde va a buscar Luis el balón?"), ok: _t("En la caja roja"), bad: [_t("En la caja azul")],
      why: _t("Luis no vio el cambio, así que busca donde lo dejó.") },
    { t: _t("Ana deja su libro en la mochila y va al baño. Mientras Ana no está, su hermano guarda el libro en el cajón. Ana vuelve."),
      q: _t("¿Dónde va a buscar Ana el libro?"), ok: _t("En la mochila"), bad: [_t("En el cajón")],
      why: _t("Ana no vio que lo movieron, así que lo busca en la mochila.") },
    { t: _t("Sofía pone su bufanda en la silla y sale al patio. Mientras Sofía no está, su amiga la cuelga en el perchero. Sofía vuelve."),
      q: _t("¿Dónde va a buscar Sofía la bufanda?"), ok: _t("En la silla"), bad: [_t("En el perchero")],
      why: _t("Sofía no vio el cambio, así que mira primero donde la dejó.") }
  ];

  var SECUENCIAS = [
    { title: _t("Unirte a un grupo en el descanso"), steps: [
      { i: "👀", t: _t("Miro de qué están hablando") }, { i: "🚶", t: _t("Me acerco") },
      { i: "🗣️", t: _t("Pregunto: ¿puedo unirme?") }, { i: "⏳", t: _t("Espero la respuesta") }] },
    { title: _t("Pedir ayuda a la profesora"), steps: [
      { i: "✋", t: _t("Levanto la mano") }, { i: "⏳", t: _t("Espero mi turno") },
      { i: "🗣️", t: _t("Explico lo que necesito") }, { i: "🙏", t: _t("Doy las gracias") }] },
    { title: _t("Terminar una conversación"), steps: [
      { i: "👂", t: _t("Escucho lo que dice") }, { i: "🗣️", t: _t("Digo que debo irme") }, { i: "👋", t: _t("Me despido") }] }
  ];

  // ─── Datos: vida adulta (niveles 2 a 5, 15-26 años) ────────────────────────

  var AGENDA_ADULTO = [
    { i: "⏰", t: _t("Llegada al trabajo") },
    { i: "💻", t: _t("Revisar correos") },
    { i: "🗓️", t: _t("Reunión de equipo") },
    { i: "🍽️", t: _t("Almuerzo") },
    { i: "🏠", t: _t("Salida") }
  ];

  var SITUACIONES_ADULTO = [
    { t: _t("Le aprobaron el préstamo que pidió en el banco."), e: "feliz" },
    { t: _t("No pasó la entrevista de trabajo que quería."), e: "triste" },
    { t: _t("Un compañero se llevó el crédito por un trabajo que él hizo."), e: "enojado" },
    { t: _t("Escuchó un ruido fuerte y desconocido en el apartamento de noche."), e: "asustado" },
    { t: _t("Le avisaron que ganó una beca que no esperaba."), e: "sorprendido" },
    { t: _t("Está en su casa un domingo, sin pendientes, leyendo algo que le gusta."), e: "tranquilo" },
    { t: _t("Terminó a tiempo un proyecto importante en el trabajo."), e: "feliz" }
  ];

  var SENALES_ADULTO = [
    { t: _t("Tu jefe cruza los brazos, aprieta la mandíbula y habla más rápido de lo normal."), e: "enojado" },
    { t: _t("Tu compañero de trabajo sonríe y cuenta la noticia moviendo las manos con entusiasmo."), e: "feliz" },
    { t: _t("Tu compañero de piso mira al suelo, habla bajo y tiene los hombros caídos."), e: "triste" },
    { t: _t("Un compañero se sobresalta y da un paso atrás cuando suena la alarma de incendio."), e: "asustado" },
    { t: _t("Tu pareja está sentada, respira lento y tiene la postura relajada."), e: "tranquilo" }
  ];

  var DIALOGOS_ADULTO = [
    { t: _t("Un compañero de trabajo te dice: «Buenos días, ¿cómo estás?»"), ok: _t("Le respondo y le pregunto cómo está él"), bad: [_t("No digo nada y sigo caminando"), _t("Empiezo a hablar de mi tarea sin responderle")] },
    { t: _t("Tu compañero de piso te cuenta que perdió su empleo."), ok: _t("Lo escucho y le digo que lamento lo que pasó"), bad: [_t("Cambio de tema y hablo de mis planes"), _t("Me pongo a mirar el celular")] },
    { t: _t("Dos compañeros conversan en la sala de descanso y tú quieres participar."), ok: _t("Espero una pausa y pregunto: «¿Puedo unirme?»"), bad: [_t("Los interrumpo hablando fuerte"), _t("Me quedo lejos sin decir nada")] },
    { t: _t("Tu jefe te pregunta cómo va el proyecto."), ok: _t("Le cuento brevemente el avance"), bad: [_t("Me quedo callado mirando el piso"), _t("Le respondo algo que no tiene relación")] },
    { t: _t("Un compañero termina de hablar en la reunión y te mira."), ok: _t("Es mi turno: le respondo"), bad: [_t("Sigo esperando en silencio"), _t("Me voy sin decir nada")] }
  ];

  var FIGURADO_ADULTO = [
    { f: _t("Se me fue el tren"), ok: _t("Perdí una oportunidad importante"), bad: [_t("Un tren se fue sin mí"), _t("No tengo transporte")] },
    { f: _t("Está costando un ojo de la cara"), ok: _t("Es muy caro"), bad: [_t("Alguien perdió un ojo"), _t("Está muy barato")] },
    { f: _t("Me tiene entre la espada y la pared"), ok: _t("Me siento obligado a elegir entre dos opciones difíciles"), bad: [_t("Estoy atrapado entre dos objetos"), _t("Tengo mucho espacio para decidir")] },
    { f: _t("Eso es pan comido"), ok: _t("Es muy fácil de hacer"), bad: [_t("Alguien se comió pan"), _t("Es muy difícil de hacer")] },
    { f: _t("Tirar la toalla"), ok: _t("Rendirse o dejar de intentarlo"), bad: [_t("Lanzar una toalla de verdad"), _t("Seguir intentándolo con más fuerza")] }
  ];

  var CAMBIOS_ADULTO = [
    { plan: _t("Hoy tenías reunión presencial en la oficina 🏢"), nuevo: _t("avisaron que ahora la reunión será virtual 💻"),
      ok: _t("Me conecto a la reunión virtual"), bad: [_t("Me enojo y no me conecto"), _t("Insisto en ir a la oficina de todas formas")] },
    { plan: _t("Hoy ibas a almorzar con un compañero 🍽️"), nuevo: _t("tu compañero avisó que debe cancelar por una emergencia"),
      ok: _t("Entiendo y reprogramamos para otro día"), bad: [_t("Me molesto y dejo de hablarle"), _t("Insisto en que almorcemos igual")] },
    { plan: _t("Hoy tenías turno de la mañana en el trabajo ⏰"), nuevo: _t("te avisaron que el turno cambió a la tarde"),
      ok: _t("Ajusto mi horario para el turno de la tarde"), bad: [_t("No voy a trabajar por el cambio"), _t("Reclamo sin escuchar la explicación")] }
  ];

  var CREENCIAS_ADULTO = [
    { t: _t("Camilo guarda su laptop en su escritorio y sale a una reunión. Mientras Camilo no está, el aseador la mueve a otro escritorio para limpiar. Camilo vuelve."),
      q: _t("¿Dónde va a buscar Camilo la laptop?"), ok: _t("En su escritorio"), bad: [_t("En el otro escritorio")],
      why: _t("Camilo no vio el cambio, así que busca donde la dejó.") },
    { t: _t("Valentina deja su carpeta en la sala de reuniones y va a imprimir algo. Mientras Valentina no está, un compañero guarda la carpeta en un archivador. Valentina vuelve."),
      q: _t("¿Dónde va a buscar Valentina la carpeta?"), ok: _t("En la sala de reuniones"), bad: [_t("En el archivador")],
      why: _t("Valentina no vio que la movieron, así que la busca donde la dejó.") },
    { t: _t("Daniel deja las llaves del carro en la mesa y sale a comprar algo. Mientras Daniel no está, su compañero de piso las cuelga en el gancho de la entrada. Daniel vuelve."),
      q: _t("¿Dónde va a buscar Daniel las llaves?"), ok: _t("En la mesa"), bad: [_t("En el gancho de la entrada")],
      why: _t("Daniel no vio el cambio, así que mira primero donde las dejó.") }
  ];

  var SECUENCIAS_ADULTO = [
    { title: _t("Unirte a una conversación de trabajo"), steps: [
      { i: "👀", t: _t("Observo de qué están hablando") }, { i: "🚶", t: _t("Me acerco al grupo") },
      { i: "🗣️", t: _t("Pregunto: ¿puedo participar?") }, { i: "⏳", t: _t("Espero la respuesta") }] },
    { title: _t("Pedir ayuda a tu supervisor"), steps: [
      { i: "✋", t: _t("Pido un momento para hablar") }, { i: "⏳", t: _t("Espero a que esté disponible") },
      { i: "🗣️", t: _t("Explico lo que necesito") }, { i: "🙏", t: _t("Doy las gracias") }] },
    { title: _t("Pedir un permiso en el trabajo"), steps: [
      { i: "📝", t: _t("Pienso qué voy a pedir") }, { i: "🗣️", t: _t("Hablo con mi jefe con respeto") },
      { i: "⏳", t: _t("Espero la respuesta") }, { i: "🙏", t: _t("Agradezco, sea cual sea la respuesta") }] },
    { title: _t("Resolver un malentendido"), steps: [
      { i: "😕", t: _t("Noto que algo no está claro") }, { i: "🗣️", t: _t("Pregunto para entender mejor") },
      { i: "👂", t: _t("Escucho la explicación") }, { i: "🤝", t: _t("Aclaramos juntos el malentendido") }] }
  ];

  /** Doble sentido social: una frase con una intención implícita distinta a
      su significado literal. Se pregunta qué quiere decir realmente la
      persona, con lenguaje corto y literal en las opciones. */
  var DOBLE_SENTIDO = [
    { t: _t("Un compañero dice «no hay problema» con la voz cortante y sin mirarte."), q: _t("¿Qué quiere decir realmente?"), ok: _t("Sí hay un problema, aunque lo diga con otras palabras"), bad: [_t("No hay ningún problema")] },
    { t: _t("Tu jefe dice «interesante» después de ver tu propuesta, sin decir nada más."), q: _t("¿Qué puede querer decir?"), ok: _t("Puede que tenga dudas y no las haya dicho todavía"), bad: [_t("Le encantó completamente tu propuesta")] },
    { t: _t("Un amigo dice «como quieras» con un suspiro, después de proponer varios planes."), q: _t("¿Qué puede querer decir?"), ok: _t("Puede que sí tenga una preferencia, aunque no la diga"), bad: [_t("De verdad le da igual cualquier plan")] },
    { t: _t("Un compañero de piso dice «tranquilo, no importa» cuando le rompiste algo, pero se queda callado después."), q: _t("¿Qué puede querer decir?"), ok: _t("Puede que sí le importe, aunque lo disimule"), bad: [_t("De verdad no le importa en absoluto")] },
    { t: _t("Tu pareja dice «haz lo que quieras» durante una discusión."), q: _t("¿Qué puede querer decir?"), ok: _t("Puede estar molesta y prefiere no seguir discutiendo en ese momento"), bad: [_t("Realmente te está dando libertad total")] },
    { t: _t("Un cliente dice «bueno, gracias» de forma seca después de una atención lenta."), q: _t("¿Qué puede querer decir?"), ok: _t("Puede estar insatisfecho, aunque agradezca por cortesía"), bad: [_t("Quedó completamente satisfecho")] }
  ];

  // ─── Mecánicas de opción única ────────────────────────────────────────────

  function agendaVisual(lista, refIdx) {
    var partes = lista.map(function (a, i) {
      return '<span class="tea-agenda__item' + (i === refIdx ? " is-ref" : "") + '">' +
        '<span class="tea-agenda__n">' + (i + 1) + "</span>" +
        '<span class="tea-agenda__i">' + a.i + "</span>" +
        "<span>" + a.t + "</span></span>";
    });
    return '<div class="tea-agenda">' + partes.join('<span class="tea-agenda__arrow" aria-hidden="true">→</span>') + "</div>";
  }

  /** Agenda: anticipar qué viene antes y después. Acepta p.bancos para una
      agenda distinta a la de la base (vida adulta). */
  function retoAgenda(p) {
    var lista = (p && p.bancos) || AGENDA;
    var modes = p.modes || ["despues"];
    var mode = modes[rnd(0, modes.length - 1)];
    var ref = mode === "despues" ? rnd(0, lista.length - 2) : rnd(1, lista.length - 1);
    var ansIdx = mode === "despues" ? ref + 1 : ref - 1;
    var ok = lista[ansIdx].t;
    var bads = lista.filter(function (a, i) { return i !== ansIdx && i !== ref; })
      .map(function (a) { return a.t; });
    var texto = lista.map(function (a) { return a.t; }).join(", ");
    var prompt = _t("La agenda de hoy es: ") + texto + _t(". ¿Qué viene ") +
      (mode === "despues" ? _t("después de ") : _t("antes de ")) + lista[ref].t + "?";
    return {
      skill: "agenda_" + mode,
      prompt: prompt,
      speech: prompt,
      visual: agendaVisual(lista, ref),
      options: textOptions(ok, bads, 3),
      answer: ok,
      answerLabel: ok,
      hint: _t("Sigue las flechas de la agenda. Siempre va en el mismo orden."),
      explain: _t("En la agenda, ") + ok + _t(" va ") + (mode === "despues" ? _t("después de ") : _t("antes de ")) + lista[ref].t + "."
    };
  }

  function emoOptions(key, pool) {
    var otros = shuffle(pool.filter(function (k) { return k !== key; })).slice(0, 2);
    return shuffle([key].concat(otros)).map(function (k) {
      return { label: EMO[k][1], value: k, aria: EMO[k][1] };
    });
  }

  /** Reconocer la emoción de una cara. */
  function retoEmocion(p) {
    var pool = p.emos;
    var key = pool[rnd(0, pool.length - 1)];
    var prompt = _t("Mira la cara. ¿Qué emoción muestra?");
    return {
      skill: "reconocer_emocion",
      prompt: prompt,
      speech: prompt,
      visual: '<span class="tea-big">' + EMO[key][0] + "</span>",
      options: emoOptions(key, pool),
      answer: key,
      answerLabel: EMO[key][1],
      hint: _t("Mira la boca y los ojos de la cara."),
      explain: _t("Esa cara muestra: ") + EMO[key][1] + "."
    };
  }

  /** Inferir la emoción a partir de una situación. */
  function retoSituacion(p) {
    var banco = (p && p.bancos) || SITUACIONES;
    var s = pick(banco);
    var prompt = _t("Situación: ") + s.t + _t(" ¿Cómo se siente?");
    return {
      skill: "emocion_situacion",
      prompt: prompt,
      speech: prompt,
      visual: '<span class="tea-big">' + EMO[s.e][0] + "</span>",
      options: emoOptions(s.e, EMO_KEYS),
      answer: s.e,
      answerLabel: EMO[s.e][1],
      hint: _t("Piensa cómo te sentirías tú si te pasara eso."),
      explain: _t("En esa situación, casi todas las personas se sienten: ") + EMO[s.e][1] + "."
    };
  }
  function pick(a) { return a[rnd(0, a.length - 1)]; }

  /** Leer señales del cuerpo. */
  function retoSenales(p) {
    var banco = (p && p.bancos) || SENALES;
    var s = pick(banco);
    var prompt = s.t + _t(" ¿Qué crees que siente?");
    return {
      skill: "senales_corporales",
      prompt: prompt,
      speech: prompt,
      visual: '<span class="tea-big">👀</span>',
      options: emoOptions(s.e, EMO_KEYS),
      answer: s.e,
      answerLabel: EMO[s.e][1],
      hint: _t("Fíjate en los brazos, la cara y la respiración."),
      explain: _t("Esas señales del cuerpo suelen indicar: ") + EMO[s.e][1] + "."
    };
  }

  /** Turnos de conversación. */
  function retoTurnos(p) {
    var banco = (p && p.bancos) || DIALOGOS;
    var d = pick(banco);
    var prompt = d.t + _t(" ¿Qué respondes?");
    return {
      skill: "turnos_conversacion",
      prompt: prompt,
      speech: prompt,
      visual: '<span class="tea-big">💬</span>',
      options: textOptions(d.ok, d.bad, 3),
      answer: d.ok,
      answerLabel: d.ok,
      hint: _t("En una conversación, uno habla y el otro escucha, y luego cambian."),
      explain: _t("Así la conversación sigue y la otra persona se siente escuchada.")
    };
  }

  /** Lenguaje figurado. */
  function retoFigurado(p) {
    var banco = (p && p.bancos) || FIGURADO;
    var f = pick(banco);
    var prompt = _t("Alguien dice: «") + f.f + _t("». ¿Qué quiere decir?");
    return {
      skill: "lenguaje_figurado",
      prompt: prompt,
      speech: prompt,
      visual: '<span class="tea-big">🗨️</span>',
      options: textOptions(f.ok, f.bad, 3),
      answer: f.ok,
      answerLabel: f.ok,
      hint: _t("Algunas frases no se entienden al pie de la letra. Piensa qué querría decir la persona."),
      explain: "«" + f.f + _t("» quiere decir: ") + lower(f.ok) + "."
    };
  }

  /** Cambios de plan anunciados. */
  function retoCambio(p) {
    var banco = (p && p.bancos) || CAMBIOS;
    var c = pick(banco);
    var prompt = _t("Tu plan era: ") + c.plan + _t(". Aviso: ") + c.nuevo + _t(". ¿Qué haces?");
    return {
      skill: "cambio_de_plan",
      prompt: prompt,
      speech: prompt,
      visual: '<span class="tea-big">🔄</span>',
      options: textOptions(c.ok, c.bad, 3),
      answer: c.ok,
      answerLabel: c.ok,
      hint: _t("Puedes respirar hondo y seguir el plan nuevo."),
      explain: _t("Es normal que un cambio incomode. Respirar y seguir el plan nuevo ayuda.")
    };
  }

  /** Creencias de otros: qué piensa alguien que no vio el cambio. */
  function retoCreencia(p) {
    var banco = (p && p.bancos) || CREENCIAS;
    var c = pick(banco);
    var prompt = c.t + " " + c.q;
    return {
      skill: "creencia_falsa",
      prompt: prompt,
      speech: prompt,
      visual: '<span class="tea-big">🧠</span>',
      options: textOptions(c.ok, c.bad, 2),
      answer: c.ok,
      answerLabel: c.ok,
      hint: _t("Piensa qué vio la persona y qué no vio."),
      explain: c.why
    };
  }

  /** Doble sentido social: interpretar la intención detrás de una frase. */
  function retoDobleSentido(p) {
    var banco = (p && p.bancos) || DOBLE_SENTIDO;
    var d = pick(banco);
    var prompt = d.t + " " + d.q;
    return {
      skill: "doble_sentido_social",
      prompt: prompt,
      speech: prompt,
      visual: '<span class="tea-big">🤔</span>',
      options: textOptions(d.ok, d.bad, 2),
      answer: d.ok,
      answerLabel: d.ok,
      hint: _t("A veces el tono o la situación dicen algo distinto a las palabras."),
      explain: d.ok + "."
    };
  }

  var U = global.IndecapGame.util;

  function opts(ok, bads, n) {
    var uniq = [];
    U.shuffle(bads).forEach(function (t) { if (t !== ok && uniq.indexOf(t) === -1) uniq.push(t); });
    return U.shuffle([ok].concat(uniq.slice(0, n - 1))).map(function (t) { return { label: t, value: t, aria: t }; });
  }
  /** Retos 1-2 con el banco base; 3-5 con el banco de vida adulta. */
  function banco(base, adulto, s) { return s >= 2 && adulto ? adulto : base; }

  var LITERAL = [
    _t("La tienda abre a las 8"), _t("Está lloviendo fuerte"), _t("El bus llega en 10 minutos"), _t("Tengo mucha hambre"),
    _t("La reunión es en la sala 3"), _t("Hace mucho calor hoy"), _t("Perdí mis llaves")
  ];
  var FIGURADAS = FIGURADO.concat(FIGURADO_ADULTO).map(function (f) { return f.f; }).concat([_t("Me muero de la risa"), _t("Estoy en las nubes")]);
  var CONVERSACION = {
    sigue: { label: _t("Quiere seguir hablando"), items: [_t("Me hace preguntas"), _t("Me mira y sonríe"), _t("Se acerca un poco"), _t("Me cuenta algo más del tema"), _t("Asiente mientras hablo")] },
    termina: { label: _t("Quiere terminar la conversación"), items: [_t("Mira el reloj varias veces"), _t("Responde con una sola palabra"), _t("Da un paso hacia atrás"), _t("Dice «bueno, te dejo»"), _t("Guarda sus cosas en la maleta")] }
  };
  var DIA = [
    { t: _t("Desayunar"), h: _t("6:30 a. m.") }, { t: _t("Tomar el bus"), h: _t("7:00 a. m.") }, { t: _t("Primera clase"), h: _t("7:30 a. m.") },
    { t: _t("Descanso"), h: _t("10:00 a. m.") }, { t: _t("Almuerzo"), h: _t("12:30 p. m.") }, { t: _t("Tareas"), h: _t("3:00 p. m.") }, { t: _t("Cena"), h: _t("7:00 p. m.") }
  ];

  function unirEmociones(p, s) {
    var keys = U.shuffle(EMO_KEYS).slice(0, U.grow(3, 6, s)), left = [], right = [], ans = {};
    keys.forEach(function (k, i) { left.push({ id: "c" + i, label: '<span style="font-size:32px">' + EMO[k][0] + "</span>" }); right.push({ id: "e" + i, label: EMO[k][1] }); ans["c" + i] = "e" + i; });
    return {
      type: "match", skill: "reconocer_emocion",
      prompt: _t("Une cada cara con su emoción."),
      left: U.shuffle(left), right: U.shuffle(right), answer: ans,
      hint: _t("Mira la boca y los ojos de cada cara."),
      explain: keys.map(function (k) { return EMO[k][0] + " " + EMO[k][1]; }).join(" · ") + "."
    };
  }

  function unirFigurado(p, s) {
    var pool = U.shuffle(s >= 2 ? FIGURADO_ADULTO : FIGURADO).slice(0, U.grow(3, 5, s)), left = [], right = [], ans = {};
    pool.forEach(function (f, i) { left.push({ id: "f" + i, label: "«" + f.f + "»" }); right.push({ id: "m" + i, label: f.ok }); ans["f" + i] = "m" + i; });
    return {
      type: "match", skill: "lenguaje_figurado",
      prompt: _t("Une cada frase con lo que quiere decir de verdad."),
      left: U.shuffle(left), right: U.shuffle(right), answer: ans,
      hint: _t("Estas frases no se entienden al pie de la letra."),
      explain: pool.map(function (f) { return "«" + f.f + "»: " + U.lower(f.ok); }).join(" · ") + "."
    };
  }

  function literalOFigurado(p, s) {
    var n = U.grow(2, 3, s), items = [], ans = {};
    U.shuffle(LITERAL).slice(0, n).forEach(function (t, i) { items.push({ id: "l" + i, label: "«" + t + "»" }); ans["l" + i] = "literal"; });
    U.shuffle(FIGURADAS).slice(0, n).forEach(function (t, i) { items.push({ id: "g" + i, label: "«" + t + "»" }); ans["g" + i] = "figurado"; });
    return {
      type: "classify", skill: "lenguaje_figurado",
      prompt: _t("¿La frase dice exactamente lo que pasa, o tiene otro sentido?"),
      bins: [{ id: "literal", label: _t("Dice exactamente lo que pasa") }, { id: "figurado", label: _t("Tiene otro sentido") }],
      items: U.shuffle(items), answer: ans,
      hint: _t("Imagina la frase tal cual: si sería imposible o rara, tiene otro sentido."),
      explain: _t("Las frases con otro sentido no se toman al pie de la letra.")
    };
  }

  function senalesConversacion(p, s) {
    var keys = Object.keys(CONVERSACION), items = [], ans = {}, k = 0;
    keys.forEach(function (key) { U.shuffle(CONVERSACION[key].items).slice(0, U.grow(2, 4, s)).forEach(function (t) { var id = "s" + (k++); items.push({ id: id, label: t }); ans[id] = key; }); });
    return {
      type: "classify", skill: "senales_sociales",
      prompt: _t("¿Qué te dice cada señal sobre la otra persona?"),
      bins: keys.map(function (key) { return { id: key, label: CONVERSACION[key].label }; }),
      items: U.shuffle(items), answer: ans,
      hint: _t("Las preguntas y acercarse suelen indicar interés; mirar el reloj o alejarse, que quiere irse."),
      explain: _t("Leer estas señales ayuda a saber cuándo seguir y cuándo despedirse.")
    };
  }

  function ordenarSecuencia(p, s) {
    var x = U.pick(banco(SECUENCIAS, SECUENCIAS_ADULTO, s));
    var items = x.steps.map(function (st, i) { return { id: "q" + i, label: '<span style="font-size:1.3em;margin-right:6px" aria-hidden="true">' + st.i + "</span>" + st.t }; });
    return {
      type: "order", skill: "pasos_sociales",
      prompt: _t("Ordena los pasos para: ") + U.lower(x.title) + ".",
      slotsLabel: _t("Primero → después"),
      items: U.shuffle(items), answer: items.map(function (i) { return i.id; }),
      answerLabel: x.steps.map(function (st) { return st.t; }).join(" → "),
      hint: _t("Piensa qué haces primero antes de hablar con alguien."),
      explain: x.steps.map(function (st, i) { return (i + 1) + ". " + st.t; }).join(" ") + "."
    };
  }

  function ordenarDia(p, s) {
    var n = U.grow(4, 7, s), pool = DIA.slice(0, 7);
    var chosen = U.shuffle(pool).slice(0, n).sort(function (a, b) { return pool.indexOf(a) - pool.indexOf(b); });
    var items = chosen.map(function (d, i) { return { id: "d" + i, label: d.t + (s <= 2 ? " · " + d.h : "") }; });
    return {
      type: "order", skill: "anticipacion",
      prompt: _t("Ordena tu día de la primera a la última actividad.") + (s >= 3 ? _t(" Esta vez sin horas: piensa en lo que haces cada día.") : ""),
      slotsLabel: _t("Mi día"),
      items: U.shuffle(items), answer: items.map(function (i) { return i.id; }),
      answerLabel: chosen.map(function (d) { return d.t; }).join(" → "),
      hint: _t("Usa las horas como guía: las de la mañana van primero."),
      explain: chosen.map(function (d) { return d.h + " " + d.t; }).join(" · ") + "."
    };
  }

  function con(fn, params) { return function (p, s) { return fn(typeof params === "function" ? params(s) : params); }; }
  function mix(list) { return function (p, s) { return list[s % list.length](p, s); }; }

  var EMO_BASE = ["feliz", "triste", "enojado"];
  var PLAN = {
    1: [
      [con(retoAgenda, function (s) { return { modes: s >= 2 ? ["despues", "antes"] : ["despues"] }; }), _t("Vas a mirar la agenda del día y decir qué viene antes o después.")],
      [con(retoEmocion, function (s) { return { emos: s >= 2 ? EMO_KEYS : EMO_BASE }; }), _t("Vas a reconocer emociones en caras.")],
      [unirEmociones, _t("Vas a unir cada cara con su emoción.")],
      [con(retoSituacion, function (s) { return { bancos: SITUACIONES }; }), _t("Vas a decidir cómo se siente alguien en una situación.")],
      [con(retoTurnos, {}), _t("Vas a elegir la mejor respuesta para seguir una conversación.")],
      [con(retoFigurado, {}), _t("Vas a descubrir qué quieren decir frases que no son literales.")],
      [con(retoCambio, {}), _t("A veces el plan cambia. Vas a elegir cómo seguir.")],
      [con(retoSenales, {}), _t("Vas a leer lo que comunica el cuerpo.")],
      [ordenarSecuencia, _t("Vas a ordenar los pasos de situaciones sociales.")],
      [con(retoCreencia, {}), _t("Vas a pensar dónde busca una persona algo que le movieron sin que viera.")]
    ],
    2: [
      [con(retoAgenda, { bancos: AGENDA_ADULTO, modes: ["despues", "antes"] }), _t("Vas a anticipar la agenda de un día de trabajo.")],
      [ordenarDia, _t("Vas a ordenar las actividades de tu día.")],
      [con(retoSituacion, function (s) { return { bancos: banco(SITUACIONES, SITUACIONES_ADULTO, s) }; }), _t("Vas a reconocer emociones en situaciones de la vida adulta.")],
      [con(retoTurnos, function (s) { return { bancos: banco(DIALOGOS, DIALOGOS_ADULTO, s) }; }), _t("Vas a practicar turnos de conversación en el estudio y el trabajo.")],
      [literalOFigurado, _t("Vas a separar frases literales de frases con otro sentido.")],
      [con(retoCambio, function (s) { return { bancos: banco(CAMBIOS, CAMBIOS_ADULTO, s) }; }), _t("Vas a responder a cambios de plan en el estudio y el trabajo.")],
      [con(retoSenales, function (s) { return { bancos: banco(SENALES, SENALES_ADULTO, s) }; }), _t("Vas a leer señales del cuerpo en otros contextos.")],
      [unirFigurado, _t("Vas a unir frases figuradas con su significado.")],
      [con(retoCreencia, function (s) { return { bancos: banco(CREENCIAS, CREENCIAS_ADULTO, s) }; }), _t("Vas a pensar en lo que sabe y no sabe otra persona.")],
      [senalesConversacion, _t("Vas a leer si alguien quiere seguir hablando o terminar.")]
    ],
    3: [
      [con(retoFigurado, { bancos: FIGURADO_ADULTO }), _t("Vas a entender frases de uso cotidiano entre adultos.")],
      [con(retoDobleSentido, {}), _t("Vas a descubrir lo que alguien quiere decir de verdad.")],
      [con(retoSituacion, { bancos: SITUACIONES_ADULTO }), _t("Vas a reconocer emociones en situaciones de trabajo y estudio.")],
      [ordenarSecuencia, _t("Vas a ordenar pasos sociales de la vida adulta.")],
      [con(retoTurnos, { bancos: DIALOGOS_ADULTO }), _t("Vas a responder en conversaciones de trabajo.")],
      [con(retoCambio, { bancos: CAMBIOS_ADULTO }), _t("Vas a adaptarte a cambios en el trabajo.")],
      [senalesConversacion, _t("Vas a reconocer señales de interés o de cierre en una conversación.")],
      [con(retoSenales, { bancos: SENALES_ADULTO }), _t("Vas a leer señales del cuerpo en el trabajo y la casa.")],
      [con(retoCreencia, { bancos: CREENCIAS_ADULTO }), _t("Vas a pensar en lo que otra persona vio y no vio.")],
      [unirFigurado, _t("Vas a unir frases figuradas de adultos con su significado.")]
    ],
    4: [
      [con(retoDobleSentido, {}), _t("Vas a interpretar frases con doble sentido.")],
      [literalOFigurado, _t("Vas a distinguir frases literales y figuradas más difíciles.")],
      [mix([con(retoSituacion, { bancos: SITUACIONES_ADULTO }), con(retoSenales, { bancos: SENALES_ADULTO })]), _t("Vas a combinar situación y señales del cuerpo.")],
      [con(retoAgenda, { bancos: AGENDA_ADULTO, modes: ["antes", "despues"] }), _t("Vas a anticipar cambios en la agenda del trabajo.")],
      [mix([con(retoCambio, { bancos: CAMBIOS_ADULTO }), con(retoAgenda, { bancos: AGENDA_ADULTO, modes: ["antes"] })]), _t("Vas a manejar cambios de plan y de agenda.")],
      [ordenarSecuencia, _t("Vas a ordenar cómo pedir permisos y resolver malentendidos.")],
      [mix([con(retoTurnos, { bancos: DIALOGOS_ADULTO }), senalesConversacion]), _t("Vas a decidir cuándo hablar y cuándo despedirte.")],
      [mix([con(retoFigurado, { bancos: FIGURADO_ADULTO }), con(retoDobleSentido, {})]), _t("Vas a interpretar lo que la gente quiere decir.")],
      [con(retoCreencia, { bancos: CREENCIAS_ADULTO }), _t("Vas a ponerte en el lugar de otra persona.")],
      [mix([unirEmociones, unirFigurado]), _t("Vas a unir emociones y frases con su significado.")]
    ],
    5: [
      [mix([con(retoDobleSentido, {}), con(retoFigurado, { bancos: FIGURADO_ADULTO })]), _t("Vas a interpretar el sentido real de lo que se dice.")],
      [mix([con(retoSituacion, { bancos: SITUACIONES_ADULTO }), con(retoSenales, { bancos: SENALES_ADULTO }), unirEmociones]), _t("Vas a reconocer emociones de todas las formas.")],
      [mix([con(retoCambio, { bancos: CAMBIOS_ADULTO }), ordenarDia]), _t("Vas a organizar tu día y adaptarte a cambios.")],
      [mix([ordenarSecuencia, con(retoTurnos, { bancos: DIALOGOS_ADULTO })]), _t("Vas a manejar conversaciones de principio a fin.")],
      [mix([con(retoCreencia, { bancos: CREENCIAS_ADULTO }), con(retoDobleSentido, {})]), _t("Vas a pensar en lo que otros saben y quieren decir.")],
      [mix([literalOFigurado, unirFigurado]), _t("Vas a dominar el lenguaje figurado.")],
      [mix([senalesConversacion, con(retoSenales, { bancos: SENALES_ADULTO })]), _t("Vas a leer todas las señales de una conversación.")],
      [mix([con(retoAgenda, { bancos: AGENDA_ADULTO, modes: ["antes", "despues"] }), con(retoCambio, { bancos: CAMBIOS_ADULTO })]), _t("Vas a anticipar y adaptarte.")],
      [mix([con(retoTurnos, { bancos: DIALOGOS_ADULTO }), con(retoSituacion, { bancos: SITUACIONES_ADULTO })]), _t("Vas a responder con empatía.")],
      [mix([unirEmociones, con(retoFigurado, { bancos: FIGURADO_ADULTO }), ordenarSecuencia, con(retoCreencia, { bancos: CREENCIAS_ADULTO }), senalesConversacion]), _t("Repaso final: un reto de cada habilidad.")]
    ]
  };

  var HABILIDADES = {
    agenda_despues: _t("Anticipar lo que viene después"),
    agenda_antes: _t("Recordar lo que pasó antes"),
    reconocer_emocion: _t("Reconocer emociones"),
    emocion_situacion: _t("Entender cómo se siente alguien"),
    senales_corporales: _t("Leer señales del cuerpo"),
    senales_sociales: _t("Leer señales en una conversación"),
    turnos_conversacion: _t("Turnos de conversación"),
    lenguaje_figurado: _t("Lenguaje figurado"),
    cambio_de_plan: _t("Adaptarse a cambios de plan"),
    creencia_falsa: _t("Pensar en lo que sabe otra persona"),
    doble_sentido_social: _t("Entender el doble sentido"),
    pasos_sociales: _t("Pasos de situaciones sociales"),
    anticipacion: _t("Organizar el día")
  };

  global.IndecapGame.register({
    slug: "tea_senales",
    quiet: true,
    skillLabels: HABILIDADES,
    plan: PLAN,
    getActivity: function (index) {
      var nivel = Math.min(5, Math.max(1, Math.ceil(index / 10)));
      var act = PLAN[nivel][(index - 1) % 10];
      return {
        intro: act[1] + _t(" Son 5 retos. No hay límite de tiempo. Si necesitas parar, usa «Pausa tranquila»."),
        rounds: 5,
        build: function (step) { return act[0]({}, step); }
      };
    }
  });
})(window);
