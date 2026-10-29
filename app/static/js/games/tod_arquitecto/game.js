/**
 * EL ARQUITECTO DEL MUNDO — Trastorno opositor desafiante (TOD)
 *
 * Habilidad central: autorregulación emocional y conductual.
 * Ciclo de terapia cognitivo-conductual llevado a juego:
 *   nombrar la emoción → pausar → elegir respuesta → ver la consecuencia.
 *  - Termómetro emocional y señales del cuerpo.
 *  - Semáforo de la calma y espera activa.
 *  - Perspectiva del otro.
 *  - Expresar desacuerdo con respeto, negociar y resolver conflictos.
 *
 * 5 niveles × 10 actividades, 5 retos por actividad que suben de dificultad.
 *
 * Diseño: ningún mensaje castiga ni sermonea. El error se presenta como
 * «otra opción» y el estudiante siempre decide; se reconoce cada intento.
 */
(function (global) {
  "use strict";
  var _t = global.IndecapGame.tr;

  // ─── Utilidades ───────────────────────────────────────────────────────────
  function rnd(a, b) { return Math.floor(Math.random() * (b - a + 1)) + a; }
  function pick(a) { return a[rnd(0, a.length - 1)]; }
  function shuffle(a) { a = a.slice(); for (var i = a.length - 1; i > 0; i--) { var j = rnd(0, i), t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  function el(tag, cls) { var n = document.createElement(tag); if (cls) n.className = cls; return n; }
  function live() { var n = el("p", "visually-hidden"); n.setAttribute("role", "status"); n.setAttribute("aria-live", "polite"); return n; }
  function low(t) { return t.charAt(0).toLowerCase() + t.slice(1); }
  function opts(ok, bads, n) {
    return shuffle([ok].concat(shuffle(bads).slice(0, n - 1))).map(function (t) { return { label: t, value: t, aria: t }; });
  }
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

  addStyles("tod-styles", [
    ".game-shell .game-options .game-option{font-size:1.1rem;max-width:320px}",
    ".tod-big{flex-basis:100%;font-size:4.5rem;line-height:1}",
    ".tod-msg{flex-basis:100%;font-size:1.1rem;line-height:1.6;color:var(--g-text);max-width:520px;margin:6px auto 12px}",
    ".tod-actions{flex-basis:100%;display:flex;flex-wrap:wrap;gap:12px;justify-content:center}",
    ".tod-tower{flex-basis:100%;font-size:2rem;line-height:1.3;min-height:48px;word-break:break-all}",
    ".game-btn.is-waiting{opacity:.55}",
    ".seq-status{flex-basis:100%;font-weight:600;color:var(--g-muted);margin-bottom:8px}",
    ".seq-list{flex-basis:100%;list-style:none;margin:0 auto 12px;padding:0;max-width:480px;text-align:left}",
    ".seq-list li{background:var(--g-ok-soft);border:2px solid var(--g-ok);color:var(--g-ok);border-radius:12px;padding:10px 14px;margin-bottom:8px;font-weight:600}",
    ".seq-steps{flex-basis:100%;display:flex;flex-wrap:wrap;gap:12px;justify-content:center}",
    ".game-option.seq-step{display:flex;flex-direction:column;align-items:center;gap:6px;font-size:1rem;min-width:120px}",
    ".seq-icon{font-size:2.2rem;line-height:1}",
    ".game-option.seq-next{outline:4px solid var(--g-accent);outline-offset:3px}"
  ].join("\n"));

  // ─── Datos ────────────────────────────────────────────────────────────────
  var NIV = { 1: _t("Tranquilo"), 2: _t("Molesto"), 3: _t("Muy enojado") };
  var ESCENAS = [
    { t: _t("Un compañero te saluda y te pregunta cómo estás."), icon: "🙂", lvl: 1 },
    { t: _t("Estás escuchando música en el bus, sin afán."), icon: "🎧", lvl: 1 },
    { t: _t("Alguien te empuja sin querer en la fila del almuerzo."), icon: "🚶", lvl: 2 },
    { t: _t("Perdiste una partida en línea por un error tuyo."), icon: "🎮", lvl: 2 },
    { t: _t("Un profesor te baja la nota y no entiendes por qué."), icon: "📝", lvl: 2 },
    { t: _t("Alguien publica una foto tuya burlándose de ti."), icon: "📱", lvl: 3 },
    { t: _t("Te culpan en público de algo que no hiciste."), icon: "🗣️", lvl: 3 },
    { t: _t("Tu jefe te regaña delante de los clientes."), icon: "🏪", lvl: 3 }
  ];
  var CALMAS = [_t("Respirar hondo cuatro veces"), _t("Contar hasta diez despacio"), _t("Pedir un momento a solas"), _t("Caminar un rato"), _t("Tomar agua y estirar los brazos"), _t("Escribir lo que siento antes de responder"), _t("Escuchar una canción tranquila")];
  var NOCALMAS = [_t("Gritar más fuerte"), _t("Tirar las cosas"), _t("Empujar a alguien"), _t("Responder el mensaje de inmediato con insultos"), _t("Golpear la pared"), _t("Publicar en redes lo que siento en caliente")];

  var DEC = [
    { t: _t("Un compañero se lleva tu cargador sin pedirlo."), icon: "🔌", ok: _t("Le digo con calma: «Es mío, devuélvemelo, por favor»"), bad: [_t("Se lo quito a la fuerza"), _t("Le escondo sus cosas para que aprenda")], why: _t("Así pides lo tuyo sin pelear y es más fácil que te lo devuelva.") },
    { t: _t("Tu equipo perdió el partido del torneo."), icon: "⚽", ok: _t("Respiro y felicito al otro equipo"), bad: [_t("Pateo el balón lejos"), _t("Culpo a mis compañeros")], why: _t("Perder es parte de jugar, y el respeto se nota.") },
    { t: _t("La profesora te pide guardar el celular en clase."), icon: "📱", ok: _t("Lo guardo y le pregunto cuándo lo puedo usar"), bad: [_t("Le digo que no y sigo usándolo"), _t("Finjo que lo guardo")], why: _t("Cumples la norma y además consigues información para después.") },
    { t: _t("Alguien se burla de ti en el descanso."), icon: "😤", ok: _t("Me alejo y se lo cuento a alguien de confianza"), bad: [_t("Le pego"), _t("Le hago una burla peor")], why: _t("Alejarte te protege y pedir ayuda resuelve el problema.") },
    { t: _t("Te toca esperar mucho en la fila del banco."), icon: "⏳", ok: _t("Espero y uso ese tiempo para algo tranquilo"), bad: [_t("Me cuelo"), _t("Le reclamo a gritos al cajero")], why: _t("Esperar es difícil, y lo estás logrando.") },
    { t: _t("Te piden ayudar a ordenar el salón al final de la clase."), icon: "🧹", ok: _t("Ayudo con una parte"), bad: [_t("Digo que no es mi trabajo"), _t("Me voy sin decir nada")], why: _t("Colaborar hace que terminen más rápido.") }
  ];
  var DEC_ADULTO = [
    { t: _t("Tu jefe te pide repetir un trabajo que ya habías entregado."), icon: "💼", ok: _t("Pregunto qué hay que cambiar y lo corrijo"), bad: [_t("Le digo que no lo voy a repetir"), _t("Lo hago peor a propósito")], why: _t("Preguntar te da la información para terminar rápido y bien.") },
    { t: _t("Un cliente te habla de forma grosera."), icon: "🏪", ok: _t("Respondo con calma y pido apoyo a mi supervisor"), bad: [_t("Le respondo con groserías"), _t("Lo ignoro y me voy")], why: _t("Mantener la calma te protege a ti y a tu trabajo.") },
    { t: _t("Un compañero se lleva el crédito de tu idea en una reunión."), icon: "💡", ok: _t("Después hablo con él en privado y aclaro que la idea fue mía"), bad: [_t("Lo insulto delante de todos"), _t("Dejo de trabajar en el proyecto")], why: _t("Hablar en privado y con hechos funciona mejor que pelear en público.") },
    { t: _t("Te ponen un turno que no te sirve."), icon: "🗓️", ok: _t("Explico por qué no me sirve y propongo un cambio"), bad: [_t("No llego al turno sin avisar"), _t("Me quejo con todos menos con quien decide")], why: _t("Proponer una solución te da más opciones que negarte.") },
    { t: _t("Un policía de tránsito te pide los documentos."), icon: "🚦", ok: _t("Se los muestro con calma y pregunto si hay algún problema"), bad: [_t("Le grito que me deje en paz"), _t("Me voy sin mostrarlos")], why: _t("Colaborar con calma evita que una situación pequeña crezca.") }
  ];
  var PERS = [
    { t: _t("Marta le prestó sus audífonos a Juan y Juan los perdió."), ok: _t("Marta se siente molesta porque eran suyos"), bad: [_t("Marta se siente feliz"), _t("Marta no siente nada")] },
    { t: _t("Sofía preparó una exposición durante días y la interrumpieron con burlas."), ok: _t("Sofía se siente triste o frustrada porque se esforzó"), bad: [_t("Sofía se siente muy contenta"), _t("A Sofía le da lo mismo")] },
    { t: _t("Andrés se cayó en el pasillo y todos se rieron."), ok: _t("Andrés se siente avergonzado"), bad: [_t("Andrés se siente orgulloso"), _t("Andrés se siente tranquilo")] },
    { t: _t("Lucía sacó una buena nota y su amigo la felicitó."), ok: _t("Lucía se siente contenta y valorada"), bad: [_t("Lucía se siente enojada"), _t("Lucía se siente asustada")] },
    { t: _t("Pedro esperó su turno mucho rato y se lo saltaron."), ok: _t("Pedro se siente molesto porque no fue justo"), bad: [_t("Pedro se siente feliz"), _t("Pedro no se dio cuenta")] },
    { t: _t("La profesora tuvo que repetir la instrucción cinco veces."), ok: _t("La profesora se siente cansada o frustrada"), bad: [_t("La profesora se divierte mucho"), _t("La profesora no siente nada")] }
  ];
  var FICHAS = [
    { t: _t("Te piden: «Guarden sus cosas, ya termina la clase»."), ok: _t("Guardo mis cosas y espero la siguiente instrucción"), bad: [_t("Sigo en lo mío como si nada"), _t("Cierro todo con fuerza y protesto")] },
    { t: _t("Hay que hacer fila para entrar al cine."), ok: _t("Hago la fila con calma"), bad: [_t("Me cuelo"), _t("Empujo para avanzar")] },
    { t: _t("Un compañero necesita un lapicero y tú tienes dos."), ok: _t("Le presto uno"), bad: [_t("Digo que no tengo"), _t("Se lo escondo")] },
    { t: _t("Terminaste tu trabajo antes que los demás."), ok: _t("Reviso mi trabajo o adelanto otra tarea"), bad: [_t("Molesto a los demás"), _t("Me voy sin avisar")] },
    { t: _t("Te piden bajar el volumen de la música."), ok: _t("Lo bajo y sigo con lo mío"), bad: [_t("Lo subo más"), _t("Me enojo y me voy")] }
  ];
  var ESTILOS = {
    asertivo: { label: _t("Firme y respetuoso"), items: [_t("«No estoy de acuerdo; ¿podemos hablarlo?»"), _t("«Me molestó lo que pasó y quiero que no se repita»"), _t("«Necesito que me expliques por qué»"), _t("«Prefiero hacerlo de otra forma; te propongo esto»")] },
    agresivo: { label: _t("Agresivo"), items: [_t("«¡Usted no me manda!»"), _t("«Cállate, nadie te preguntó»"), _t("«Si no me lo devuelves, verás»"), _t("«Eres un inútil»")] },
    pasivo: { label: _t("Me quedo callado aunque me moleste"), items: [_t("«Sí, sí, lo que digas…» (pero sigues molesto)"), _t("«No importa…» (y te vas resentido)"), _t("No digo nada y lo dejo pasar otra vez"), _t("«Como quieras…» (aunque no estés de acuerdo)")] }
  };
  var CUERPO = [[_t("Enojo"), _t("Calor en la cara y puños apretados")], [_t("Miedo"), _t("Corazón rápido y ganas de salir corriendo")], [_t("Tristeza"), _t("Pecho apretado y ganas de llorar")],
    [_t("Nervios"), _t("Manos sudorosas y estómago revuelto")], [_t("Calma"), _t("Respiración lenta y hombros sueltos")], [_t("Frustración"), _t("Ganas de rendirse y tensión en la mandíbula")]];
  var CONFLICTO = [
    { t: _t("Resolver un problema con un compañero"), s: [_t("Me calmo antes de hablar"), _t("Digo lo que me molestó sin insultar"), _t("Escucho su versión"), _t("Buscamos una solución juntos"), _t("Cumplimos lo que acordamos")] },
    { t: _t("Expresar desacuerdo con una nota"), s: [_t("Espero a estar tranquilo"), _t("Pido hablar con el profesor a solas"), _t("Explico por qué no estoy de acuerdo"), _t("Escucho su explicación"), _t("Acepto la decisión o pido revisión formal")] },
    { t: _t("Pedir un cambio de turno en el trabajo"), s: [_t("Reviso por qué lo necesito"), _t("Hablo con mi jefe con tiempo"), _t("Propongo una alternativa"), _t("Escucho la respuesta"), _t("Confirmo el acuerdo por escrito")] }
  ];
  var CONSECUENCIAS = [
    { t: _t("Le respondes mal a tu jefe porque te corrigió."), ok: _t("Ahora me desahogo, pero después pierdo su confianza y quizá el trabajo"), bad: [_t("No pasa nada después"), _t("Me suben el sueldo por tener carácter")] },
    { t: _t("Te sales de clase sin permiso porque estás aburrido."), ok: _t("Me evito la clase, pero me atraso y me ponen una anotación"), bad: [_t("Aprendo más afuera"), _t("Nadie lo nota nunca")] },
    { t: _t("Esperas a calmarte antes de contestar un mensaje que te molestó."), ok: _t("Me cuesta esperar, pero evito decir algo de lo que me arrepienta"), bad: [_t("Pierdo la discusión para siempre"), _t("La otra persona se burla de mí")] },
    { t: _t("Cumples con una norma que no te gusta mientras pides que la cambien."), ok: _t("No me gusta ahora, pero gano credibilidad para que me escuchen"), bad: [_t("Pierdo mi dignidad"), _t("La norma nunca podrá cambiar")] }
  ];
  var NEGOCIAR = [
    { t: _t("Tu mamá te pide llegar a las 9 p. m. y tú quieres llegar a las 11 p. m."), ok: _t("Propongo llegar a las 10 p. m. y avisar cuando salga"), bad: [_t("Llego a las 11 p. m. sin avisar"), _t("Me encierro en el cuarto y no vuelvo a pedir permiso")] },
    { t: _t("El profesor no acepta tu trabajo tarde."), ok: _t("Le explico qué pasó y pregunto si puedo entregarlo con una nota menor"), bad: [_t("Le digo que es injusto y me voy"), _t("No vuelvo a entregar trabajos")] },
    { t: _t("Tu compañero de cuarto deja todo desordenado."), ok: _t("Le propongo turnos de aseo y los escribimos"), bad: [_t("Le boto sus cosas"), _t("Dejo de hablarle")] },
    { t: _t("Tu jefe te pide quedarte una hora más hoy."), ok: _t("Le digo que hoy no puedo y le ofrezco quedarme mañana"), bad: [_t("Me voy sin decir nada"), _t("Me quedo de mala gana y trabajo mal")] }
  ];

  // ─── Mecánicas de opción única ────────────────────────────────────────────
  function retoTermometro() {
    var s = pick(ESCENAS);
    var prompt = _t("Escena: ") + s.t + _t(" ¿Qué tan fuerte es la emoción?");
    return {
      skill: "termometro_emocional", prompt: prompt, speech: prompt,
      visual: '<span class="tod-big">' + s.icon + "</span>",
      options: [1, 2, 3].map(function (n) { return { label: NIV[n], value: n, aria: NIV[n] }; }),
      answer: s.lvl, answerLabel: NIV[s.lvl],
      hint: _t("Piensa si para quien lo vive es algo pequeño, mediano o muy grande."),
      explain: _t("Aquí la emoción es de nivel «") + NIV[s.lvl] + _t("».")
    };
  }
  function retoEstrategia() {
    var ok = pick(CALMAS);
    var prompt = _t("Sientes mucho enojo. ¿Qué te ayuda a calmarte?");
    return {
      skill: "estrategia_calma", prompt: prompt, speech: prompt,
      visual: '<span class="tod-big">🌡️</span>',
      options: opts(ok, NOCALMAS, 3), answer: ok, answerLabel: ok,
      hint: _t("Busca lo que baja el enojo sin lastimar a nadie."),
      explain: "«" + ok + _t("» ayuda a bajar la intensidad de la emoción.")
    };
  }
  function retoDecision() {
    var d = pick(DEC);
    var prompt = _t("Situación: ") + d.t + _t(" ¿Qué eliges hacer?");
    return {
      skill: "historia_decision", prompt: prompt, speech: prompt,
      visual: '<span class="tod-big">' + d.icon + "</span>",
      options: opts(d.ok, d.bad, 3), answer: d.ok, answerLabel: d.ok,
      hint: _t("Piensa qué pasaría después con cada opción."),
      explain: d.why
    };
  }
  function retoPerspectiva() {
    var p = pick(PERS);
    var prompt = p.t + _t(" ¿Cómo se siente?");
    return {
      skill: "perspectiva_otro", prompt: prompt, speech: prompt,
      visual: '<span class="tod-big">🧠</span>',
      options: opts(p.ok, p.bad, 3), answer: p.ok, answerLabel: p.ok,
      hint: _t("Imagina que eso te pasara a ti."),
      explain: _t("Ponerse en el lugar del otro ayuda a entender lo que siente.")
    };
  }
  function retoFichas() {
    var f = pick(FICHAS);
    var prompt = _t("Situación: ") + f.t + _t(" ¿Qué haces?");
    return {
      skill: "economia_fichas", prompt: prompt, speech: prompt,
      visual: '<span class="tod-big">🤝</span>',
      options: opts(f.ok, f.bad, 3), answer: f.ok, answerLabel: f.ok,
      hint: _t("Elige lo que ayuda a que todos trabajen bien."),
      explain: _t("Esa elección suma puntos de confianza con los demás.")
    };
  }

  // ─── Mecánicas con interfaz propia ────────────────────────────────────────
  /** Semáforo: ROJO detente, AMARILLO piensa, VERDE actúa. */
  function roundSemaforo(p, ctx) {
    var d = pick((p && p.bank) || DEC), m = mult(ctx), secs = Math.max(2, Math.round(3 * m));
    var prompt = _t("Pasa algo que te molesta. ROJO: detente. AMARILLO: piensa. VERDE: actúa.");
    return {
      skill: "semaforo_calma", prompt: prompt, speech: prompt,
      hint: _t("Respira antes de elegir. No hay prisa."),
      mount: function (host, api) {
        var s = sched(); host.innerHTML = "";
        var lv = live(), light = el("div", "tod-big"), msg = el("p", "tod-msg"), box = el("div", "tod-actions");
        [lv, light, msg, box].forEach(function (x) { host.appendChild(x); });
        var errors = 0, closed = false;

        function red() {
          light.textContent = "🔴";
          msg.textContent = _t("ROJO. ") + d.t + _t(" Detente y respira.");
          lv.textContent = msg.textContent; api.say(_t("Rojo. Detente y respira."));
          box.innerHTML = "";
          var left = secs, b = el("button", "game-btn game-btn--primary is-waiting");
          b.type = "button"; b.setAttribute("aria-disabled", "true"); b.textContent = _t("Espera… ") + left;
          box.appendChild(b);
          (function tick() {
            s.later(function () {
              left--;
              if (left > 0) { b.textContent = _t("Espera… ") + left; tick(); }
              else { b.classList.remove("is-waiting"); b.removeAttribute("aria-disabled"); b.textContent = _t("Ya me detuve"); b.focus(); }
            }, 1000);
          })();
          b.addEventListener("click", function () { if (!b.classList.contains("is-waiting")) yellow(); });
        }
        function yellow() {
          light.textContent = "🟡";
          msg.textContent = _t("AMARILLO. Piensa: ¿qué puedo hacer?");
          lv.textContent = msg.textContent; api.say(_t("Amarillo. Piensa qué puedes hacer."));
          box.innerHTML = "";
          opts(d.ok, d.bad, 3).forEach(function (o) {
            var b = el("button", "game-option"); b.type = "button"; b.textContent = o.label; b.setAttribute("aria-label", o.aria);
            b.addEventListener("click", function () {
              if (closed) return;
              if (o.value === d.ok) { green(); }
              else {
                errors++; b.classList.add("is-wrong"); b.disabled = true;
                api.feedback(_t("Prueba otra opción. Puedes pensarlo con calma."), "retry");
                if (errors === 2) api.hint();
              }
            });
            box.appendChild(b);
          });
        }
        function green() {
          closed = true; light.textContent = "🟢";
          msg.textContent = _t("VERDE. Actúa: ") + d.ok + ".";
          lv.textContent = msg.textContent; box.innerHTML = "";
          api.done({
            stars: errors === 0 ? 1 : (errors === 1 ? 0.75 : 0.5),
            message: _t("¡Lo hiciste con calma!"),
            error: errors ? { wrong: errors, attempts: errors + 1 } : null
          });
        }
        red();
        return function () { closed = true; s.stop(); };
      }
    };
  }

  /** Espera con recompensa diferida: la batería de la paciencia. */
  function roundEspera(p, ctx) {
    var target = Math.max(4, Math.round(p.secs * (((ctx && ctx.support) || 1) === 1 ? 0.7 : 1)));
    var prompt = _t("Carga la batería de la paciencia. Cuanto más esperes sin tocar el botón, más se llena. Puedes tocar cuando quieras.");
    return {
      skill: "espera_recompensa", prompt: prompt, speech: prompt,
      hint: _t("Respira mientras esperas. Cada segundo cuenta."),
      mount: function (host, api) {
        var s = sched(); host.innerHTML = "";
        var lv = live(), egg = el("div", "tod-big"), st = el("p", "tod-msg"), box = el("div", "tod-actions");
        egg.textContent = "🪫"; egg.setAttribute("aria-hidden", "true");
        var b = el("button", "game-btn game-btn--ghost"); b.type = "button"; b.textContent = _t("Ya no quiero esperar");
        box.appendChild(b);
        [lv, egg, st, box].forEach(function (x) { host.appendChild(x); });
        var t = 0, closed = false;
        st.textContent = _t("Has esperado 0 de ") + target + _t(" segundos.");

        function finish(hatched) {
          if (closed) return; closed = true; b.disabled = true;
          var ratio = t / target;
          var stars = hatched ? 1 : (ratio >= 0.6 ? 0.75 : (ratio >= 0.3 ? 0.5 : 0.25));
          if (hatched) egg.textContent = "⚡";
          api.done({
            stars: stars,
            message: hatched ? _t("¡Batería llena! Esperaste ") + t + _t(" segundos.")
                             : _t("Esperaste ") + t + _t(" segundos. ¡Eso también es un logro!"),
            error: hatched ? null : { waited: t, target: target, attempts: 1 }
          });
        }
        (function tick() {
          s.later(function () {
            if (closed) return;
            t++;
            egg.textContent = t >= target ? "⚡" : (t >= target / 2 ? "🔋" : "🪫");
            st.textContent = _t("Has esperado ") + t + _t(" de ") + target + _t(" segundos.");
            if (t === Math.floor(target / 2)) { lv.textContent = _t("Vas por la mitad."); api.say(_t("Vas por la mitad.")); }
            if (t >= target) finish(true); else tick();
          }, 1000);
        })();
        b.addEventListener("click", function () { finish(false); });
        return function () { closed = true; s.stop(); };
      }
    };
  }

  /** Turnos y cooperación con NOVA. */
  function roundTurnos(p, ctx) {
    var m = mult(ctx);
    var prompt = _t("Construye una torre con NOVA. Pon un bloque solo cuando sea tu turno.");
    return {
      skill: "turnos_cooperacion", prompt: prompt, speech: prompt,
      hint: _t("Mira quién tiene el turno antes de tocar."),
      mount: function (host, api) {
        var s = sched(); host.innerHTML = "";
        var lv = live(), turn = el("p", "tod-msg"), tower = el("div", "tod-tower"), box = el("div", "tod-actions");
        tower.setAttribute("aria-hidden", "true");
        var b = el("button", "game-btn game-btn--primary"); b.type = "button"; b.textContent = _t("Poner mi bloque 🧱");
        box.appendChild(b);
        [lv, turn, tower, box].forEach(function (x) { host.appendChild(x); });
        var mine = true, placed = 0, skips = 0, closed = false, total = (p && p.blocks) || 6;

        function setTurn(me) {
          mine = me; b.classList.toggle("is-waiting", !me); b.setAttribute("aria-disabled", String(!me));
          turn.textContent = me ? _t("Es tu turno.") : _t("Es el turno de NOVA. Esperemos.");
          lv.textContent = turn.textContent;
        }
        setTurn(true);
        b.addEventListener("click", function () {
          if (closed) return;
          if (!mine) { skips++; api.feedback(_t("Todavía no es tu turno. Esperemos a NOVA."), "retry"); return; }
          api.feedback("", "");
          placed++; tower.textContent += "🧱"; setTurn(false);
          if (placed >= total) { end(); return; }
          s.later(function () {
            placed++; tower.textContent += "🟦";
            if (placed >= total) { end(); return; }
            setTurn(true);
          }, 1300 * m);
        });
        function end() {
          if (closed) return; closed = true; b.disabled = true;
          api.done({
            stars: skips === 0 ? 1 : (skips === 1 ? 0.75 : (skips === 2 ? 0.5 : 0.25)),
            message: _t("¡Torre terminada entre los dos!"),
            error: skips ? { skipped_turns: skips, attempts: skips + 1 } : null
          });
        }
        return function () { closed = true; s.stop(); };
      }
    };
  }

  /** Autoinstrucciones: "Paro. Pienso. Elijo." */
  var U = global.IndecapGame.util;
  var grow = U.grow;

  function termometro(p, s) {
    var r = retoTermometro();
    if (s >= 2) r.prompt = r.prompt.replace(_t("Escena: "), "");
    return r;
  }
  function estrategia(p, s) {
    var r = retoEstrategia();
    r.options = opts(r.answer, NOCALMAS, s >= 2 ? 4 : 3);
    return r;
  }
  function decision(p, s) {
    var d = U.pick(s >= 2 && p.adulto ? DEC_ADULTO : DEC);
    return {
      skill: "historia_decision", prompt: _t("Situación: ") + d.t + _t(" ¿Qué eliges hacer?"),
      visual: '<span class="tod-big">' + d.icon + "</span>",
      options: opts(d.ok, d.bad, 3), answer: d.ok,
      hint: _t("Piensa qué pasaría después con cada opción."),
      explain: d.why
    };
  }
  function clasificarCalma(p, s) {
    var items = [], ans = {};
    U.shuffle(CALMAS).slice(0, grow(2, 4, s)).forEach(function (t, i) { items.push({ id: "c" + i, label: t }); ans["c" + i] = "baja"; });
    U.shuffle(NOCALMAS).slice(0, grow(2, 4, s)).forEach(function (t, i) { items.push({ id: "n" + i, label: t }); ans["n" + i] = "sube"; });
    return {
      type: "classify", skill: "estrategia_calma",
      prompt: _t("¿Esto baja el enojo o lo empeora?"),
      bins: [{ id: "baja", label: _t("Me ayuda a calmarme") }, { id: "sube", label: _t("Lo empeora") }],
      items: U.shuffle(items), answer: ans,
      hint: _t("Lo que calma no lastima a nadie y te da tiempo para pensar."),
      explain: _t("Tener tus estrategias claras ayuda a usarlas cuando más las necesitas.")
    };
  }
  function estilos(p, s) {
    var keys = s >= 2 ? ["asertivo", "agresivo", "pasivo"] : ["asertivo", "agresivo"], items = [], ans = {}, k = 0;
    keys.forEach(function (key) { U.shuffle(ESTILOS[key].items).slice(0, grow(2, 3, s)).forEach(function (t) { var id = "e" + (k++); items.push({ id: id, label: t }); ans[id] = key; }); });
    return {
      type: "classify", skill: "comunicacion_asertiva",
      prompt: _t("¿Cómo suena cada frase?"),
      bins: keys.map(function (key) { return { id: key, label: ESTILOS[key].label }; }),
      items: U.shuffle(items), answer: ans,
      hint: _t("Firme y respetuoso es decir lo que quieres sin atacar ni quedarte callado."),
      explain: _t("La forma firme y respetuosa es la que más funciona para que te escuchen.")
    };
  }
  function cuerpo(p, s) {
    var set = U.shuffle(CUERPO).slice(0, grow(3, 5, s)), left = [], right = [], ans = {};
    set.forEach(function (x, i) { left.push({ id: "m" + i, label: x[0] }); right.push({ id: "c" + i, label: x[1] }); ans["m" + i] = "c" + i; });
    return {
      type: "match", skill: "termometro_emocional",
      prompt: _t("Une cada emoción con lo que se siente en el cuerpo."),
      left: U.shuffle(left), right: U.shuffle(right), answer: ans,
      hint: _t("Reconocer las señales del cuerpo te avisa antes de explotar."),
      explain: set.map(function (x) { return x[0] + ": " + U.lower(x[1]); }).join(" · ") + "."
    };
  }
  function guion(p, s) {
    var todos = [["✋", _t("Paro")], ["🌬️", _t("Respiro")], ["💭", _t("Pienso")], ["✅", _t("Elijo")], ["🔁", _t("Reviso cómo me fue")]];
    var elegidos = s >= 2 ? todos : [todos[0], todos[2], todos[3]];
    var pasos = elegidos.map(function (x) { return x[1]; });
    var items = elegidos.map(function (x, i) { return { id: "g" + i, label: '<span aria-hidden="true" style="margin-right:6px">' + x[0] + "</span>" + x[1] }; });
    return {
      type: "order", skill: "autoinstrucciones",
      prompt: _t("Ordena tu guion de calma."),
      slotsLabel: _t("Mi guion"),
      items: U.shuffle(items), answer: items.map(function (i) { return i.id; }), answerLabel: pasos.join(" → "),
      hint: _t("Primero detengo el cuerpo; al final elijo qué hacer."),
      explain: pasos.join(" → ") + "."
    };
  }
  function resolverConflicto(p, s) {
    var c = U.pick(CONFLICTO), pasos = c.s.slice(0, grow(3, 5, s));
    var items = pasos.map(function (t, i) { return { id: "r" + i, label: t }; });
    return {
      type: "order", skill: "resolucion_conflictos",
      prompt: _t("Ordena los pasos para: ") + U.lower(c.t) + ".",
      slotsLabel: _t("Primero → después"),
      items: U.shuffle(items), answer: items.map(function (i) { return i.id; }), answerLabel: pasos.join(" → "),
      hint: _t("Calmarse va antes de hablar; el acuerdo va al final."),
      explain: pasos.map(function (t, i) { return (i + 1) + ". " + t; }).join(" ") + "."
    };
  }
  function consecuencias(p, s) {
    var c = U.pick(CONSECUENCIAS);
    return {
      skill: "consecuencias", layout: "list",
      prompt: c.t + _t(" ¿Qué pasa después?"),
      options: opts(c.ok, c.bad, 3), answer: c.ok,
      hint: _t("Piensa en lo que pasa ahora y en lo que pasa en unas semanas."),
      explain: c.ok + "."
    };
  }
  function negociar(p, s) {
    var n = U.pick(NEGOCIAR);
    return {
      skill: "negociacion", layout: "list",
      prompt: n.t + _t(" ¿Qué propones?"),
      options: opts(n.ok, n.bad, 3), answer: n.ok,
      hint: _t("Una buena propuesta tiene en cuenta lo que quieres tú y lo que quiere la otra persona."),
      explain: _t("Proponer un punto medio te da más de lo que te da pelear o rendirte.")
    };
  }
  function perspectiva(p, s) { return retoPerspectiva(); }
  function fichas(p, s) {
    var r = retoFichas();
    r.explain = _t("Esa elección suma puntos de confianza con los demás.");
    return r;
  }
  function con(fn, params) { return function (p, s) { return fn(typeof params === "function" ? params(s) : params, { support: 1 }, s); }; }
  function mix(list) { return function (p, s) { return list[s % list.length](p, s); }; }
  var esperaS = function (a, b) { return function (s) { return { secs: grow(a, b, s) }; }; };

  var PLAN = {
    1: [
      [termometro, _t("Vas a medir qué tan fuerte es una emoción.")],
      [cuerpo, _t("Vas a unir cada emoción con lo que se siente en el cuerpo.")],
      [estrategia, _t("Vas a elegir qué te ayuda a calmarte.")],
      [clasificarCalma, _t("Vas a separar lo que te calma de lo que empeora el enojo.")],
      [decision, _t("Vas a elegir cómo reaccionar ante un problema.")],
      [con(roundSemaforo, {}), _t("Semáforo de la calma: rojo, me detengo; amarillo, pienso; verde, actúo.")],
      [con(roundEspera, esperaS(5, 9)), _t("Vas a practicar la espera: carga la batería de la paciencia.")],
      [perspectiva, _t("Vas a ponerte en el lugar de otra persona.")],
      [guion, _t("Vas a ordenar tu guion de calma.")],
      [fichas, _t("Vas a elegir la conducta que suma confianza.")]
    ],
    2: [
      [mix([termometro, cuerpo]), _t("Vas a reconocer emociones y sus señales.")],
      [estilos, _t("Vas a distinguir frases agresivas de frases firmes y respetuosas.")],
      [con(roundSemaforo, {}), _t("Semáforo de la calma en situaciones nuevas.")],
      [con(roundEspera, esperaS(8, 12)), _t("Más tiempo de espera.")],
      [function (p, s) { return decision({ adulto: true }, s); }, _t("Vas a decidir en situaciones del colegio y el trabajo.")],
      [con(roundTurnos, function (s) { return { blocks: grow(6, 10, s) }; }), _t("Vas a construir una torre por turnos.")],
      [consecuencias, _t("Vas a pensar en lo que pasa después de cada decisión.")],
      [perspectiva, _t("Vas a entender cómo se sienten los demás.")],
      [guion, _t("Vas a ordenar el guion completo de calma.")],
      [clasificarCalma, _t("Vas a armar tu lista de estrategias de calma.")]
    ],
    3: [
      [resolverConflicto, _t("Vas a ordenar los pasos para resolver un conflicto.")],
      [estilos, _t("Vas a reconocer la forma firme, la agresiva y la pasiva.")],
      [negociar, _t("Vas a proponer acuerdos en lugar de pelear.")],
      [function (p, s) { return decision({ adulto: true }, s + 2); }, _t("Vas a decidir en situaciones de trabajo.")],
      [con(roundSemaforo, { bank: DEC_ADULTO }), _t("Semáforo de la calma en el trabajo.")],
      [consecuencias, _t("Vas a comparar lo que pasa ahora y lo que pasa después.")],
      [con(roundEspera, esperaS(10, 14)), _t("Paciencia a prueba.")],
      [mix([perspectiva, cuerpo]), _t("Vas a leer emociones propias y ajenas.")],
      [fichas, _t("Vas a elegir conductas que generan confianza.")],
      [mix([estrategia, clasificarCalma]), _t("Vas a reforzar tus estrategias de calma.")]
    ],
    4: [
      [negociar, _t("Vas a negociar con figuras de autoridad.")],
      [resolverConflicto, _t("Vas a resolver conflictos de principio a fin.")],
      [mix([estilos, negociar]), _t("Vas a decir lo que quieres con firmeza y respeto.")],
      [con(roundSemaforo, { bank: DEC_ADULTO }), _t("Semáforo de la calma con autoridad.")],
      [mix([consecuencias, function (p, s) { return decision({ adulto: true }, 4); }]), _t("Vas a decidir pensando en las consecuencias.")],
      [con(roundTurnos, function (s) { return { blocks: grow(6, 10, s) }; }), _t("Cooperación por turnos.")],
      [con(roundEspera, esperaS(12, 16)), _t("Espera de experto.")],
      [mix([termometro, cuerpo, estrategia]), _t("Vas a reconocer y regular emociones intensas.")],
      [mix([perspectiva, fichas]), _t("Vas a pensar en los demás y en la confianza.")],
      [guion, _t("Guion de calma completo y sin ayudas.")]
    ],
    5: [
      [mix([resolverConflicto, negociar]), _t("Vas a resolver y negociar situaciones difíciles.")],
      [mix([estilos, consecuencias]), _t("Vas a comunicarte pensando en lo que viene después.")],
      [mix([con(roundSemaforo, { bank: DEC_ADULTO }), function (p, s) { return decision({ adulto: true }, 4); }]), _t("Vas a mantener la calma con autoridad.")],
      [mix([con(roundEspera, esperaS(14, 18)), con(roundTurnos, function (s) { return { blocks: grow(6, 10, s) }; })]), _t("Paciencia y cooperación.")],
      [mix([cuerpo, clasificarCalma, estrategia]), _t("Vas a manejar tus emociones de principio a fin.")],
      [mix([perspectiva, negociar]), _t("Vas a negociar teniendo en cuenta al otro.")],
      [mix([resolverConflicto, guion]), _t("Vas a planear cómo responder.")],
      [mix([fichas, consecuencias]), _t("Vas a elegir conductas que te abren puertas.")],
      [mix([estilos, function (p, s) { return decision({ adulto: true }, 4); }]), _t("Vas a decir que no con respeto.")],
      [mix([termometro, estilos, negociar, resolverConflicto, guion]), _t("Repaso final: un reto de cada habilidad.")]
    ]
  };

  var HABILIDADES = {
    termometro_emocional: _t("Reconocer qué tan fuerte es una emoción"),
    estrategia_calma: _t("Usar estrategias de calma"),
    historia_decision: _t("Elegir cómo reaccionar"),
    semaforo_calma: _t("Detenerse antes de actuar"),
    espera_recompensa: _t("Esperar"),
    perspectiva_otro: _t("Ponerse en el lugar del otro"),
    turnos_cooperacion: _t("Cooperar por turnos"),
    autoinstrucciones: _t("Guion de calma"),
    economia_fichas: _t("Conductas que generan confianza"),
    comunicacion_asertiva: _t("Decir las cosas con firmeza y respeto"),
    resolucion_conflictos: _t("Resolver conflictos"),
    consecuencias: _t("Pensar en las consecuencias"),
    negociacion: _t("Negociar acuerdos")
  };

  global.IndecapGame.register({
    slug: "tod_arquitecto",
    skillLabels: HABILIDADES,
    plan: PLAN,
    getActivity: function (index) {
      var nivel = Math.min(5, Math.max(1, Math.ceil(index / 10)));
      var act = PLAN[nivel][(index - 1) % 10];
      return {
        intro: act[1] + _t(" Son 5 retos que suben de dificultad. Aquí no hay respuestas que castiguen: tú eliges."),
        rounds: 5,
        build: function (step) { return act[0]({}, step); }
      };
    }
  });
})(window);
