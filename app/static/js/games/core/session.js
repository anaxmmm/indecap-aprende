/**
 * Envío de métricas con cola offline.
 *
 * Las sedes del instituto tienen señal intermitente. Si el envío falla por
 * conexión, la partida se guarda en localStorage y se reintenta al reconectar,
 * para no perder el trabajo real del estudiante.
 *
 * La cola es propia de cada cuenta: en un computador compartido, lo pendiente
 * de un estudiante nunca se envía con la sesión de otro.
 */
(function (global) {
  "use strict";

  var QUEUE_PREFIX = "indecap.games.queue.";
  var MAX_QUEUE = 50;

  function readQueue(key) {
    try {
      var raw = global.localStorage.getItem(key);
      var parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      return [];
    }
  }

  function writeQueue(key, items) {
    try {
      if (!items.length) { global.localStorage.removeItem(key); return; }
      global.localStorage.setItem(key, JSON.stringify(items.slice(-MAX_QUEUE)));
    } catch (e) {
      /* Modo privado o cuota llena: se pierde la cola, no el juego. */
    }
  }

  function Session(config) {
    this.url = config.url;
    this.csrfToken = config.csrfToken || null;
    this.preview = !!config.preview;
    this.key = QUEUE_PREFIX + (config.owner || "anon");
    var self = this;
    global.addEventListener("online", function () { self.flush(); });
  }

  Session.prototype._post = function (payload) {
    var headers = { "Content-Type": "application/json" };
    if (this.csrfToken) headers["X-CSRFToken"] = this.csrfToken;

    return fetch(this.url, {
      method: "POST",
      headers: headers,
      credentials: "same-origin",
      body: JSON.stringify(payload)
    }).then(function (response) {
      // 4xx: el servidor rechazó la partida (sin asignación, sesión vencida…).
      // Reintentarla no la arreglaría, así que no se encola.
      if (response.status >= 400 && response.status < 500) {
        return { ok: false, rejected: true, status: response.status };
      }
      if (!response.ok) throw new Error("HTTP " + response.status);
      return response.json();
    });
  };

  /** Envía una partida. Si falla, la encola. Nunca rechaza la promesa. */
  Session.prototype.submit = function (payload) {
    var self = this;
    if (this.preview) {
      return Promise.resolve({ ok: true, saved: false, reason: "modo_vista_previa" });
    }
    return this._post(payload)
      .then(function (data) {
        self.flush();
        return data;
      })
      .catch(function () {
        var queue = readQueue(self.key);
        queue.push(payload);
        writeQueue(self.key, queue);
        return { ok: false, queued: true };
      });
  };

  /** Reintenta enviar lo pendiente. Se llama al reconectar y tras cada envío. */
  Session.prototype.flush = function () {
    var queue = readQueue(this.key);
    if (!queue.length || this.preview) return Promise.resolve(0);

    var self = this;
    var pendientes = [];
    var enviados = 0;

    return queue.reduce(function (chain, payload) {
      return chain.then(function () {
        return self._post(payload)
          .then(function () { enviados += 1; })
          .catch(function () { pendientes.push(payload); });
      });
    }, Promise.resolve()).then(function () {
      writeQueue(self.key, pendientes);
      return enviados;
    });
  };

  Session.prototype.pendingCount = function () {
    return readQueue(this.key).length;
  };

  global.IndecapSession = Session;
})(window);