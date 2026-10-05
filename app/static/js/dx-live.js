/* indecap-aprende · Notificaciones en vivo (docente y estudiante).
   Consulta cada 15 s el estado de las notificaciones y actualiza la campana,
   su menú y cualquier lista marcada con [data-live-feed]. Cuando llega una
   notificación nueva dispara el evento "indecap:notifications" para que la
   página (p. ej. el panel general) refresque sus datos. */
(function () {
  'use strict';

  var script = document.currentScript;
  if (!script || !script.dataset.url) return;

  var URL_ESTADO = script.dataset.url;
  var URL_LEIDAS = script.dataset.readUrl || '#';
  var TEXTO_VACIO = script.dataset.empty || '';
  var INTERVALO = 15000;

  var campana = document.querySelector('.teacher-topbar__icon-btn');
  var menu = document.querySelector('.teacher-notifications-menu');
  var feeds = document.querySelectorAll('[data-live-feed]');

  var ultimoId = null;
  var firma = null;

  function crear(tag, clase, texto) {
    var nodo = document.createElement(tag);
    if (clase) nodo.className = clase;
    if (texto) nodo.textContent = texto;
    return nodo;
  }

  function pintarInsignia(sinLeer) {
    if (!campana) return;
    var punto = campana.querySelector('.teacher-topbar__badge');
    if (sinLeer > 0 && !punto) {
      campana.appendChild(crear('span', 'teacher-topbar__badge'));
    } else if (sinLeer === 0 && punto) {
      punto.remove();
    }
  }

  function pintarMenu(items) {
    if (!menu) return;
    var cabecera = menu.querySelector('.teacher-notifications-menu__header');
    if (!cabecera) return;
    while (cabecera.nextSibling) menu.removeChild(cabecera.nextSibling);

    if (!items.length) {
      menu.appendChild(crear('div', 'teacher-notifications-menu__empty', TEXTO_VACIO));
      return;
    }

    items.forEach(function (n) {
      var fila = crear('div', 'teacher-notifications-menu__item' + (n.is_read ? '' : ' is-unread'));
      fila.appendChild(document.createTextNode(n.message));
      var fecha = crear('span', 'text-muted d-block', n.created_at);
      fecha.style.fontSize = '0.75rem';
      fila.appendChild(fecha);
      menu.appendChild(fila);
    });

    var form = crear('form', 'p-2 mb-0');
    form.method = 'post';
    form.action = URL_LEIDAS;
    var boton = crear('button', 'btn btn-sm btn-link p-0', 'Marcar todas como leídas');
    boton.type = 'submit';
    form.appendChild(boton);
    menu.appendChild(form);
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

  function sonar() {
    if (!campana) return;
    campana.classList.add('dx-bell-ring');
    setTimeout(function () { campana.classList.remove('dx-bell-ring'); }, 1800);
  }

  function aplicar(data) {
    var esNueva = ultimoId !== null && data.latest_id > ultimoId;
    var nuevaFirma = data.latest_id + ':' + data.unread + ':' +
      data.items.map(function (n) { return n.is_read ? 1 : 0; }).join('');

    if (nuevaFirma !== firma) {
      pintarInsignia(data.unread);
      pintarMenu(data.items);
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
    fetch(URL_ESTADO, { credentials: 'same-origin', headers: { 'Accept': 'application/json' } })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (data) { if (data && data.items) aplicar(data); })
      .catch(function () { /* sin red o sesión vencida: se reintenta en el próximo ciclo */ });
  }

  consultar();
  setInterval(consultar, INTERVALO);
  document.addEventListener('visibilitychange', function () {
    if (!document.hidden) consultar();
  });
})();
