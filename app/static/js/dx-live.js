/* indecap-aprende · Notificaciones en vivo (docente y estudiante).
   Consulta cada 15 s el estado de las notificaciones y actualiza la campana,
   su menú y cualquier lista marcada con [data-live-feed]. Cuando llega una
   notificación nueva suena un aviso corto (si la persona no lo apagó) y se
   dispara el evento "indecap:notifications" para que la página (p. ej. el
   panel general) refresque sus datos. */
(function () {
  'use strict';

  var script = document.currentScript;
  if (!script || !script.dataset.url) return;

  var URL_ESTADO = script.dataset.url;
  var TEXTO_VACIO = script.dataset.empty || '';
  var INTERVALO = 15000;
  var CLAVE_SONIDO = 'indecap.notifications.sound';

  var campana = document.querySelector('.teacher-topbar__icon-btn');
  var lista = document.querySelector('[data-notifications-list]');
  var formLeidas = document.querySelector('[data-mark-read]');
  var botonSonido = document.querySelector('[data-sound-toggle]');
  var feeds = document.querySelectorAll('[data-live-feed]');

  var ultimoId = null;
  var firma = null;
  var audioCtx = null;

  function crear(tag, clase, texto) {
    var nodo = document.createElement(tag);
    if (clase) nodo.className = clase;
    if (texto) nodo.textContent = texto;
    return nodo;
  }

  // ---------- Preferencia de sonido (solo en este navegador) ----------
  function sonidoActivo() {
    try { return localStorage.getItem(CLAVE_SONIDO) !== 'off'; } catch (e) { return true; }
  }
  function pintarSonido() {
    if (!botonSonido) return;
    var activo = sonidoActivo();
    var texto = activo ? botonSonido.dataset.labelOn : botonSonido.dataset.labelOff;
    botonSonido.setAttribute('aria-pressed', activo ? 'true' : 'false');
    botonSonido.setAttribute('aria-label', texto);
    botonSonido.title = texto;
  }
  if (botonSonido) {
    botonSonido.addEventListener('click', function () {
      var activo = !sonidoActivo();
      try { localStorage.setItem(CLAVE_SONIDO, activo ? 'on' : 'off'); } catch (e) { /* sin almacenamiento */ }
      pintarSonido();
      if (activo) { prepararAudio(); pitar(); }
    });
    pintarSonido();
  }

  // ---------- Pintar ----------
  function pintarInsignia(sinLeer) {
    if (campana) {
      var punto = campana.querySelector('.teacher-topbar__badge');
      if (sinLeer > 0 && !punto) campana.appendChild(crear('span', 'teacher-topbar__badge'));
      else if (sinLeer === 0 && punto) punto.remove();
    }
    if (formLeidas) formLeidas.hidden = sinLeer === 0;
  }

  function pintarLista(items) {
    if (!lista) return;
    lista.textContent = '';
    if (!items.length) {
      lista.appendChild(crear('div', 'teacher-notifications-menu__empty', TEXTO_VACIO));
      return;
    }
    items.forEach(function (n) {
      var fila = crear('div', 'teacher-notifications-menu__item' + (n.is_read ? '' : ' is-unread'));
      fila.appendChild(crear('span', 'teacher-notifications-menu__msg', n.message));
      fila.appendChild(crear('span', 'teacher-notifications-menu__date', n.created_at));
      lista.appendChild(fila);
    });
  }

  function pintarFeeds(items) {
    feeds.forEach(function (feed) {
      feed.textContent = '';
      if (!items.length) {
        feed.appendChild(crear('p', 'dx-empty', feed.dataset.empty || TEXTO_VACIO));
        return;
      }
      items.forEach(function (n) {
        var fila = crear('div', 'dx-feed__item' + (n.is_read ? '' : ' is-unread'));
        fila.appendChild(crear('p', 'dx-feed__msg', n.message));
        fila.appendChild(crear('span', 'dx-feed__date', n.created_at));
        feed.appendChild(fila);
      });
    });
  }

  // ---------- Sonido ----------
  // Los navegadores no permiten sonido hasta que el usuario interactúa con
  // la página: se prepara el audio en el primer clic o tecla.
  function prepararAudio() {
    try {
      var Ctx = window.AudioContext || window.webkitAudioContext;
      if (!Ctx) return;
      if (!audioCtx) audioCtx = new Ctx();
      if (audioCtx.state === 'suspended') audioCtx.resume();
    } catch (e) { /* sin audio disponible */ }
  }
  document.addEventListener('click', prepararAudio, { once: true });
  document.addEventListener('keydown', prepararAudio, { once: true });

  // Aviso sonoro corto de dos notas. Si el audio no está disponible o fue
  // bloqueado, no pasa nada: la animación de la campana sigue funcionando.
  function pitar() {
    try {
      if (!audioCtx || audioCtx.state !== 'running') return;
      var ahora = audioCtx.currentTime;
      var osc = audioCtx.createOscillator();
      var vol = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, ahora);
      osc.frequency.setValueAtTime(1175, ahora + 0.14);
      vol.gain.setValueAtTime(0.0001, ahora);
      vol.gain.exponentialRampToValueAtTime(0.15, ahora + 0.02);
      vol.gain.exponentialRampToValueAtTime(0.0001, ahora + 0.4);
      osc.connect(vol);
      vol.connect(audioCtx.destination);
      osc.start(ahora);
      osc.stop(ahora + 0.45);
    } catch (e) { /* se ignora: el sonido es un extra */ }
  }

  function sonar() {
    if (!campana) return;
    campana.classList.add('dx-bell-ring');
    setTimeout(function () { campana.classList.remove('dx-bell-ring'); }, 1800);
    if (sonidoActivo()) pitar();
  }

  // ---------- Estado ----------
  function aplicar(data) {
    var esNueva = ultimoId !== null && data.latest_id > ultimoId;
    var nuevaFirma = data.latest_id + ':' + data.unread + ':' +
      data.items.map(function (n) { return n.is_read ? 1 : 0; }).join('');

    if (nuevaFirma !== firma) {
      pintarInsignia(data.unread);
      pintarLista(data.items);
      pintarFeeds(data.items);
      firma = nuevaFirma;
    }
    ultimoId = data.latest_id;

    if (esNueva) {
      sonar();
      document.dispatchEvent(new CustomEvent('indecap:notifications', { detail: data }));
    }
  }

  function consultar() {
    if (document.hidden) return;
    fetch(URL_ESTADO, { credentials: 'same-origin', headers: { 'Accept': 'application/json', 'X-Background': '1' } })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (data) { if (data && data.items) aplicar(data); })
      .catch(function () { /* sin red o sesión vencida: se reintenta en el próximo ciclo */ });
  }

  // «Marcar todas como leídas» sin recargar la página. Si algo falla, el
  // formulario se envía de la forma normal.
  if (formLeidas) {
    formLeidas.addEventListener('submit', function (e) {
      e.preventDefault();
      var meta = document.querySelector('meta[name="csrf-token"]');
      fetch(formLeidas.action, {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Accept': 'application/json', 'X-CSRFToken': meta ? meta.content : '' }
      })
        .then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
        .then(function () {
          document.querySelectorAll('.teacher-notifications-menu__item.is-unread, .dx-feed__item.is-unread')
            .forEach(function (fila) { fila.classList.remove('is-unread'); });
          pintarInsignia(0);
          firma = null;
          if (campana) campana.focus();
        })
        .catch(function () { HTMLFormElement.prototype.submit.call(formLeidas); });
    });
  }

  consultar();
  setInterval(consultar, INTERVALO);
  document.addEventListener('visibilitychange', function () {
    if (!document.hidden) consultar();
  });
})();
