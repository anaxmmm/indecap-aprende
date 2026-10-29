/*
 * Aviso de sesión inactiva para computadores compartidos.
 *
 * Si la persona no toca el teclado, el mouse ni la pantalla durante un rato,
 * aparece un aviso con cuenta regresiva. «Seguir conectado» mantiene la
 * sesión; si no responde, la sesión se cierra. Mientras haya actividad se
 * avisa al servidor cada pocos minutos para que no la cierre por su cuenta
 * (por ejemplo, durante un juego largo).
 */
(function () {
  "use strict";

  var script = document.currentScript;
  if (!script) return;
  var timeout = Number(script.dataset.timeout) * 1000;
  var warning = Number(script.dataset.warning) * 1000;
  if (!timeout) return;

  var keepUrl = script.dataset.keepalive;
  var logoutUrl = script.dataset.logout;
  var T = {
    title: script.dataset.title,
    text: script.dataset.text,
    stay: script.dataset.stay,
    leave: script.dataset.leave
  };

  // La actividad se comparte entre pestañas: si se trabaja en una, las
  // demás no cierran la sesión.
  var KEY = "indecap.idle.last";
  function shared() {
    try { return Number(localStorage.getItem(KEY)) || 0; } catch (e) { return 0; }
  }
  function share(t) {
    try { localStorage.setItem(KEY, String(t)); } catch (e) { /* sin almacenamiento */ }
  }

  var lastActivity = Date.now();
  var lastPing = Date.now();
  var PING_EVERY = 4 * 60 * 1000;
  var dialog = null;
  var countdown = null;

  function csrf() {
    var meta = document.querySelector('meta[name="csrf-token"]');
    return meta ? meta.content : "";
  }

  function ping() {
    lastPing = Date.now();
    return fetch(keepUrl, {
      method: "POST",
      credentials: "same-origin",
      headers: { "X-CSRFToken": csrf() }
    }).catch(function () {});
  }

  function fmt(ms) {
    var s = Math.max(0, Math.ceil(ms / 1000));
    return Math.floor(s / 60) + ":" + String(s % 60).padStart(2, "0");
  }

  function closeDialog() {
    if (!dialog) return;
    dialog.remove();
    dialog = null;
    if (countdown) { clearInterval(countdown); countdown = null; }
  }

  function leave() {
    window.location.href = logoutUrl;
  }

  function openDialog() {
    if (dialog) return;
    dialog = document.createElement("div");
    dialog.className = "idle-dialog";
    dialog.innerHTML =
      '<div class="idle-dialog__box" role="alertdialog" aria-modal="true" aria-labelledby="idleTitle" aria-describedby="idleText">' +
      '<h2 class="idle-dialog__title" id="idleTitle"></h2>' +
      '<p class="idle-dialog__text" id="idleText"></p>' +
      '<div class="idle-dialog__actions">' +
      '<button type="button" class="dx-mini" data-idle="leave"></button>' +
      '<button type="button" class="dx-action" data-idle="stay"></button>' +
      "</div></div>";
    dialog.querySelector("#idleTitle").textContent = T.title;
    dialog.querySelector('[data-idle="stay"]').textContent = T.stay;
    dialog.querySelector('[data-idle="leave"]').textContent = T.leave;
    dialog.querySelector('[data-idle="stay"]').addEventListener("click", function () {
      lastActivity = Date.now();
      share(lastActivity);
      closeDialog();
      ping();
    });
    dialog.querySelector('[data-idle="leave"]').addEventListener("click", leave);
    document.body.appendChild(dialog);

    var textEl = dialog.querySelector("#idleText");
    function tick() {
      lastActivity = Math.max(lastActivity, shared());
      var left = timeout - (Date.now() - lastActivity);
      if (left <= 0) { leave(); return; }
      textEl.textContent = T.text.replace("{t}", fmt(left));
    }
    tick();
    countdown = setInterval(tick, 1000);
    dialog.querySelector('[data-idle="stay"]').focus();
  }

  function onActivity() {
    if (dialog) return; // con el aviso abierto solo cuentan sus botones
    lastActivity = Date.now();
    share(lastActivity);
    if (Date.now() - lastPing > PING_EVERY) ping();
  }

  ["mousedown", "keydown", "touchstart", "wheel", "pointermove"].forEach(function (ev) {
    document.addEventListener(ev, onActivity, { passive: true });
  });

  setInterval(function () {
    lastActivity = Math.max(lastActivity, shared());
    var idle = Date.now() - lastActivity;
    if (dialog && idle < timeout - warning) { closeDialog(); return; }
    if (idle >= timeout) leave();
    else if (idle >= timeout - warning) openDialog();
  }, 5000);
})();
