/**
 * MERCADO ESPACIAL — Discalculia
 *
 * Habilidad central: sentido numérico y su uso en situaciones reales.
 *
 * 5 niveles × 10 actividades. Cada actividad se juega en 5 retos que suben
 * de dificultad (step 0 → 4): números más grandes, menos apoyo visual y más
 * pasos. Progresión concreto → pictórico → abstracto entre niveles.
 *
 *   Nivel 1 · Base           Sentido numérico (hasta 100)
 *   Nivel 2 · Media          Valor posicional y operaciones (hasta 1.000)
 *   Nivel 3 · Alta           Dinero y tiempo en pesos colombianos
 *   Nivel 4 · Muy Alta       Razonamiento aplicado
 *   Nivel 5 · Súper Difícil  Problemas de varios pasos
 *
 * Todo el dinero es en pesos colombianos (COP), con monedas y billetes
 * dibujados en SVG propio (no reproducen el diseño de los billetes reales).
 * Las respuestas son enteros exactos. Los distractores modelan errores
 * reales: invertir cifras, equivocar la operación, olvidar lo que se lleva.
 * Nunca se depende del color: las figuras se nombran en la consigna.
 */
(function (global) {
  "use strict";
  var _t = global.IndecapGame.tr;

  var U = global.IndecapGame.util;
  var rnd = U.rnd, pick = U.pick, shuffle = U.shuffle, grow = U.grow, cop = U.cop, miles = U.miles;
  var RETOS = 5;

  // ─── Estilos propios del juego ────────────────────────────────────────────
  (function injectStyles() {
    if (document.getElementById("dm-styles")) return;
    var css = [
      ".dm-row{display:flex;flex-wrap:wrap;justify-content:center;gap:10px;align-items:center}",
      ".dm-money{display:flex;flex-wrap:wrap;justify-content:center;gap:10px;max-width:560px}",
      ".dm-money svg{width:auto;height:auto;stroke:none}",
      ".dm-receipt{min-width:260px;padding:16px 20px;border:1px solid var(--line);border-radius:var(--r-md);background:var(--surface);box-shadow:var(--sh-xs);text-align:left;font-size:16px}",
      ".dm-receipt p{display:flex;justify-content:space-between;gap:24px;margin:0;padding:6px 0;border-bottom:1px dashed var(--line)}",
      ".dm-receipt p:last-child{border-bottom:0;font-weight:700}",
      ".dm-receipt strong{font-variant-numeric:tabular-nums}",
      ".dm-steps{list-style:none;margin:0;padding:0;display:grid;gap:6px;text-align:left;font-size:16px;font-variant-numeric:tabular-nums}",
      ".dm-steps li{padding:10px 14px;border:1px solid var(--line);border-radius:var(--r-sm);background:var(--surface)}",
      ".dm-table{border-collapse:separate;border-spacing:0;border:1px solid var(--line);border-radius:var(--r-md);overflow:hidden;font-size:15px;background:var(--surface)}",
      ".dm-table th,.dm-table td{padding:8px 14px;border-bottom:1px solid var(--line);text-align:left}",
      ".dm-table th{background:var(--canvas);font-weight:600}",
      ".dm-table tr:last-child td{border-bottom:0}",
      ".dm-svg{display:block}",
      ".dm-svg text{font-family:var(--font-ui);font-weight:700}",
      ".game-shell.is-high-contrast .dm-svg .dm-fill{fill:#000!important;stroke:#fff!important}",
      ".game-shell.is-high-contrast .dm-svg text{fill:#fff!important}",
      ".game-shell.is-high-contrast .dm-svg .dm-ink{stroke:#fff!important}"
    ].join("");
    var tag = document.createElement("style");
    tag.id = "dm-styles";
    tag.textContent = css;
    document.head.appendChild(tag);
  })();

  // ─── Dibujos SVG ─────────────────────────────────────────────────────────
  var COIN = { 50: ["#d9dee8", "#9aa3b5"], 100: ["#e6c97a", "#a8862e"], 200: ["#d9dee8", "#8a93a6"], 500: ["#efd28a", "#9c7a22"], 1000: ["#e8c770", "#8f6d17"] };
  var BILL = { 2000: "#dfe8fb", 5000: "#ebe1f7", 10000: "#fde3d6", 20000: "#fff1c4", 50000: "#f8dce8", 100000: "#dcf2e5" };

  function coinSvg(v) {
    var c = COIN[v] || COIN[100];
    return _t('<svg class="dm-svg" width="64" height="64" viewBox="0 0 64 64" role="img" aria-label="moneda de ') + v + ' pesos">' +
      '<circle class="dm-fill" cx="32" cy="32" r="29" fill="' + c[0] + '" stroke="' + c[1] + '" stroke-width="3"/>' +
      '<circle cx="32" cy="32" r="22" fill="none" stroke="' + c[1] + '" stroke-width="1" stroke-dasharray="2 3" opacity=".7"/>' +
      '<text x="32" y="37" text-anchor="middle" font-size="' + (v >= 1000 ? 13 : 15) + '" fill="#2b2f3a">' + cop(v) + "</text></svg>";
  }
  function billSvg(v) {
    var f = BILL[v] || BILL[2000];
    return _t('<svg class="dm-svg" width="116" height="60" viewBox="0 0 116 60" role="img" aria-label="billete de ') + miles(v).replace(/\./g, "") + ' pesos">' +
      '<rect class="dm-fill" x="1.5" y="1.5" width="113" height="57" rx="8" fill="' + f + '" stroke="#7d869a" stroke-width="1.5"/>' +
      '<rect x="8" y="8" width="100" height="44" rx="5" fill="none" stroke="#7d869a" stroke-width="1" opacity=".45"/>' +
      '<circle cx="24" cy="30" r="10" fill="none" stroke="#7d869a" stroke-width="1" opacity=".5"/>' +
      '<text x="70" y="36" text-anchor="middle" font-size="16" fill="#1d2233">' + cop(v) + "</text></svg>";
  }
  function moneySvg(v) { return v >= 2000 ? billSvg(v) : coinSvg(v); }
  function moneyRow(values) { return '<div class="dm-money">' + values.map(moneySvg).join("") + "</div>"; }

  function clockSvg(h, m) {
    var ticks = "";
    for (var i = 0; i < 12; i++) {
      var a = i * Math.PI / 6;
      ticks += '<line class="dm-ink" x1="' + (60 + 46 * Math.sin(a)) + '" y1="' + (60 - 46 * Math.cos(a)) + '" x2="' + (60 + 52 * Math.sin(a)) + '" y2="' + (60 - 52 * Math.cos(a)) + '" stroke="#10204a" stroke-width="' + (i % 3 === 0 ? 3 : 1.5) + '"/>';
    }
    var nums = "";
    [12, 3, 6, 9].forEach(function (n, k) {
      var a = k * Math.PI / 2;
      nums += '<text x="' + (60 + 37 * Math.sin(a)) + '" y="' + (65 - 37 * Math.cos(a)) + '" text-anchor="middle" font-size="12" fill="#10204a">' + n + "</text>";
    });
    var am = m * Math.PI / 30, ah = ((h % 12) + m / 60) * Math.PI / 6;
    return '<svg class="dm-svg" width="140" height="140" viewBox="0 0 120 120" role="img" aria-label="reloj">' +
      '<circle class="dm-fill" cx="60" cy="60" r="56" fill="#fff" stroke="#10204a" stroke-width="3"/>' + ticks + nums +
      '<line class="dm-ink" x1="60" y1="60" x2="' + (60 + 26 * Math.sin(ah)) + '" y2="' + (60 - 26 * Math.cos(ah)) + '" stroke="#10204a" stroke-width="5" stroke-linecap="round"/>' +
      '<line class="dm-ink" x1="60" y1="60" x2="' + (60 + 40 * Math.sin(am)) + '" y2="' + (60 - 40 * Math.cos(am)) + '" stroke="#c9a24a" stroke-width="3" stroke-linecap="round"/>' +
      '<circle cx="60" cy="60" r="4" fill="#10204a"/></svg>';
  }

  function fractionSvg(parts, filled) {
    var w = 280, cell = w / parts, s = "";
    for (var i = 0; i < parts; i++) {
      s += '<rect class="dm-fill" x="' + (i * cell + 1) + '" y="1" width="' + (cell - 2) + '" height="46" rx="4" fill="' + (i < filled ? "#10204a" : "#fff") + '" stroke="#10204a" stroke-width="2"/>';
    }
    return '<svg class="dm-svg" width="' + (w + 2) + '" height="48" viewBox="0 0 ' + (w + 2) + _t(' 48" role="img" aria-label="barra dividida en ') + parts + _t(' partes, ') + filled + _t(' pintadas">') + s + "</svg>";
  }

  function blocksSvg(c, d, u) {
    var x = 0, s = "";
    for (var i = 0; i < c; i++) { s += '<rect class="dm-fill" x="' + x + '" y="0" width="56" height="56" fill="#f8e9c6" stroke="#10204a" stroke-width="2"/>'; x += 64; }
    for (i = 0; i < d; i++) { s += '<rect class="dm-fill" x="' + x + '" y="0" width="12" height="56" fill="#f8e9c6" stroke="#10204a" stroke-width="2"/>'; x += 18; }
    for (i = 0; i < u; i++) { s += '<rect class="dm-fill" x="' + x + '" y="44" width="12" height="12" fill="#f8e9c6" stroke="#10204a" stroke-width="2"/>'; x += 18; }
    return '<svg class="dm-svg" width="' + Math.max(x, 20) + '" height="58" viewBox="0 -1 ' + Math.max(x, 20) + ' 58" role="img" aria-label="' + c + _t(' centenas, ') + d + _t(' decenas y ') + u + _t(' unidades">') + s + "</svg>";
  }

  function numberLineSvg(min, max, step, target) {
    var w = 520, pad = 20, span = max - min, s = "";
    var X = function (v) { return pad + (v - min) / span * (w - 2 * pad); };
    s += '<line class="dm-ink" x1="' + pad + '" y1="40" x2="' + (w - pad) + '" y2="40" stroke="#10204a" stroke-width="3"/>';
    for (var v = min; v <= max; v += step) {
      var label = (v === min || v === max || (v - min) % (step * 2) === 0);
      s += '<line class="dm-ink" x1="' + X(v) + '" y1="32" x2="' + X(v) + '" y2="48" stroke="#10204a" stroke-width="2"/>';
      if (label) s += '<text x="' + X(v) + '" y="68" text-anchor="middle" font-size="12" fill="#4b5568">' + miles(v) + "</text>";
    }
    s += '<path d="M' + (X(target) - 9) + ' 6 L' + (X(target) + 9) + ' 6 L' + X(target) + ' 26 Z" fill="#c9a24a"/>';
    return '<svg class="dm-svg" width="' + w + '" height="76" viewBox="0 0 ' + w + _t(' 76" role="img" aria-label="recta numérica de ') + min + _t(' a ') + max + _t(' con una flecha">') + s + "</svg>";
  }

  var FIGURAS = [
    { s: _t("círculos"), d: '<circle cx="14" cy="14" r="11"/>' },
    { s: _t("cuadrados"), d: '<rect x="3" y="3" width="22" height="22" rx="3"/>' },
    { s: _t("triángulos"), d: '<path d="M14 2 L26 25 L2 25 Z"/>' },
    { s: _t("estrellas"), d: '<path d="M14 1.5l3.6 7.6 8.3 1-6.1 5.7 1.6 8.2L14 20l-7.4 4 1.6-8.2L2.1 10.1l8.3-1z"/>' }
  ];
  function shapeSvg(f) { return '<svg class="dm-svg" width="28" height="28" viewBox="0 0 28 28" aria-hidden="true" fill="#10204a" stroke="none">' + f.d + "</svg>"; }
  function shapeGroup(items) { return '<div class="game-group">' + items.map(shapeSvg).join("") + "</div>"; }

  function receipt(rows) {
    return '<div class="dm-receipt">' + rows.map(function (r) { return "<p><span>" + r[0] + "</span><strong>" + r[1] + "</strong></p>"; }).join("") + "</div>";
  }

  // ─── Formatos de respuesta ───────────────────────────────────────────────
  function num(v) { return { label: miles(v), aria: String(v) }; }
  function money(v) { return { label: cop(v), aria: U.copAria(v) }; }
  function input(answer, extra) {
    var r = { type: "input", answer: answer, maxLength: String(answer).length + 2 };
    Object.keys(extra || {}).forEach(function (k) { r[k] = extra[k]; });
    return r;
  }
  function moneyInput(answer, extra) {
    var r = input(answer, extra);
    r.prefix = "$";
    r.answerLabel = cop(answer);
    return r;
  }
  function merge(a, b) { Object.keys(b).forEach(function (k) { a[k] = b[k]; }); return a; }

  /** Descompone un valor en billetes y monedas colombianas, de mayor a menor. */
  function breakDown(value, allowed) {
    var out = [];
    allowed.slice().sort(function (a, b) { return b - a; }).forEach(function (d) {
      while (value >= d) { out.push(d); value -= d; }
    });
    return out;
  }

  // Productos y precios de referencia en pesos (redondeados a 50 o 100).
  var PRODUCTOS = [
    { n: _t("cuaderno"), p: [3500, 6500] }, { n: _t("lapicero"), p: [1200, 2500] },
    { n: _t("pasaje de bus"), p: [2800, 3400] }, { n: _t("empanada"), p: [2000, 3500] },
    { n: _t("jugo"), p: [3000, 5500] }, { n: _t("almuerzo"), p: [14000, 22000] },
    { n: _t("recarga de datos"), p: [5000, 20000] }, { n: _t("camiseta"), p: [25000, 48000] },
    { n: _t("audífonos"), p: [30000, 85000] }, { n: _t("libro"), p: [28000, 60000] }
  ];
  function price(prod, round) { round = round || 100; return Math.round(rnd(prod.p[0], prod.p[1]) / round) * round; }

  // ═════════════════════════════════════════════════════════════════════════
  // NIVEL 1 · Sentido numérico
  // ═════════════════════════════════════════════════════════════════════════

  function contarVistazo(p, s) {
    var f = pick(FIGURAS), n = rnd(grow(3, 8, s), grow(5, 12, s));
    var items = [];
    for (var i = 0; i < n; i++) items.push(f);
    if (s >= 2) {
      var otra = pick(FIGURAS.filter(function (x) { return x !== f; }));
      for (i = 0; i < grow(1, 6, s); i++) items.push(otra);
    }
    items = shuffle(items);
    var prompt = _t("¿Cuántos ") + f.s + _t(" hay?");
    var r = { skill: "subitizacion", prompt: prompt, visual: shapeGroup(items),
      hint: _t("Agrúpalos de a dos o de a tres en vez de contarlos uno por uno."),
      explain: _t("Hay ") + n + " " + f.s + "." };
    return s < 3 ? merge(r, { options: U.choices(n, [n - 1, n + 1, n + 2, n - 2], 4, num, 1), answer: n })
                 : merge(r, input(n));
  }

  function dondeHayMas(p, s) {
    var fa = pick(FIGURAS), fb = pick(FIGURAS.filter(function (x) { return x !== fa; }));
    var a = rnd(grow(3, 8, s), grow(6, 14, s));
    var diff = [0, 1, 2, 3][rnd(0, s >= 3 ? 1 : 3)];
    var b = Math.max(1, a + (Math.random() < 0.5 ? -diff : diff));
    var ia = [], ib = [], i;
    for (i = 0; i < a; i++) ia.push(fa);
    for (i = 0; i < b; i++) ib.push(fb);
    var ans = a > b ? _t("MÁS") : a < b ? _t("MENOS") : _t("IGUAL");
    return {
      skill: "comparacion_magnitud",
      prompt: _t("¿Hay más, menos o igual cantidad de ") + fa.s + _t(" (izquierda) que de ") + fb.s + _t(" (derecha)?"),
      visual: '<div class="dm-row">' + shapeGroup(ia) + shapeGroup(ib) + "</div>",
      options: [_t("MÁS"), _t("IGUAL"), _t("MENOS")].map(function (v) { return { label: v, value: v }; }),
      answer: ans,
      hint: _t("Empareja de a uno: el grupo al que le sobren figuras tiene más."),
      explain: _t("Hay ") + a + " " + fa.s + " y " + b + " " + fb.s + "."
    };
  }

  function ordenarNumeros(p, s) {
    var n = p.n ? p.n + (s >= 3 ? 1 : 0) : grow(3, 5, s), max = grow(p.min, p.max, s), set = [];
    while (set.length < n) {
      var v = rnd(1, max);
      if (p.close && set.length) v = Math.min(max, Math.max(1, set[0] + rnd(-max / 8, max / 8) | 0));
      if (set.indexOf(v) === -1) set.push(v);
    }
    var desc = s >= 3 && p.desc;
    var sorted = set.slice().sort(function (a, b) { return desc ? b - a : a - b; });
    return {
      type: "order", skill: "orden_numeros",
      prompt: desc ? _t("Ordena de mayor a menor.") : _t("Ordena de menor a mayor."),
      items: shuffle(set).map(function (v) { return { id: "n" + v, label: miles(v) }; }),
      answer: sorted.map(function (v) { return "n" + v; }),
      answerLabel: sorted.map(miles).join(" → "),
      hint: _t("Mira primero cuántas cifras tiene cada número; luego compara de izquierda a derecha."),
      explain: _t("El orden es ") + sorted.map(miles).join(", ") + "."
    };
  }

  function unidadesDecenas(p, s) {
    var hundreds = p.hundreds && s >= 1;
    var c = hundreds ? rnd(1, 9) : 0, d = rnd(s >= 2 ? 1 : 1, 9), u = rnd(0, 9);
    var n = c * 100 + d * 10 + u;
    var r = {
      skill: "valor_posicional_bloques",
      prompt: _t("¿Qué número forman estos bloques?") + (s === 0 ? _t(" Cada barra vale 10 y cada cuadrito vale 1.") : ""),
      visual: blocksSvg(c, d, u),
      hint: hundreds ? _t("Cada cuadro grande vale 100, cada barra 10 y cada cuadrito 1.") : _t("Cuenta las barras de 10 en 10 y suma los cuadritos."),
      explain: (c ? c + _t(" centenas, ") : "") + d + _t(" decenas y ") + u + _t(" unidades forman ") + n + "."
    };
    var swapped = c ? u * 100 + d * 10 + c : u * 10 + d;
    return s < 2 ? merge(r, { options: U.choices(n, [swapped, n + 10, n - 10, n + 1], 4, num, 0), answer: n })
                 : merge(r, input(n));
  }

  /** Retos 1-2: leer la flecha. Retos 3-5: ubicar el número moviendo el control. */
  function rectaUbicar(p, s) {
    if (s <= 1) return rectaLeer({ min: p.max, max: p.max, step: p.lineStep || p.step * 2 }, s);
    var max = grow(p.max, p.max2 || p.max, s), step = s >= 3 && p.fine ? p.fine : p.step;
    var target = rnd(1, max / step - 1) * step;
    return {
      type: "slider", skill: "recta_numerica",
      prompt: _t("Mueve el control hasta el ") + miles(target) + ".",
      min: 0, max: max, step: step, answer: target, start: 0,
      tolerance: 0,
      hint: _t("Fíjate en la mitad de la recta: ¿el número está antes o después?"),
      explain: _t("El ") + miles(target) + _t(" está a ") + Math.round(target / max * 100) + _t(" % del camino entre 0 y ") + miles(max) + "."
    };
  }

  function rectaLeer(p, s) {
    var max = grow(p.min, p.max, s), step = p.step;
    var target = rnd(1, max / step - 1) * step;
    return {
      skill: "recta_numerica",
      prompt: _t("¿Qué número señala la flecha?"),
      visual: numberLineSvg(0, max, step, target),
      options: U.choices(target, [target + step, target - step, target + 2 * step], 4, num, 0),
      answer: target,
      hint: _t("Cuenta los saltos desde la marca con número más cercana."),
      explain: _t("Cada marca avanza ") + step + _t(". La flecha está en ") + miles(target) + "."
    };
  }

  function operar(p, s) {
    var op = p.op === "mix" ? pick(["+", "−"]) : p.op;
    var max = grow(p.min, p.max, s), a, b, ans, prompt;
    if (op === "+") {
      a = rnd(Math.ceil(max / 5), max); b = rnd(Math.ceil(max / 6), max);
      if (p.carry) { a = a - (a % 10) + rnd(5, 9); b = b - (b % 10) + rnd(5, 9); }
      ans = a + b;
    } else {
      a = rnd(Math.ceil(max / 2), max); b = rnd(Math.ceil(max / 8), a - 1);
      if (p.carry) { a = a - (a % 10) + rnd(0, 4); b = b - (b % 10) + rnd(5, 9); if (b >= a) b = a - rnd(1, 5); }
      ans = a - b;
    }
    var missing = p.missing && s >= 2;
    if (missing) {
      prompt = op === "+" ? miles(a) + " + ? = " + miles(ans) : miles(a) + " − ? = " + miles(ans);
      var r = input(b);
      return merge(r, {
        skill: "aritmetica_falta", prompt: _t("¿Qué número falta?"),
        visual: '<p class="game-equation">' + prompt.replace("?", '<span class="is-blank">?</span>') + "</p>",
        speech: _t("¿Qué número falta? ") + prompt.replace("?", _t("cuánto")),
        hint: op === "+" ? _t("Resta: el total menos el número que ya conoces.") : _t("Resta: el primer número menos el resultado."),
        explain: _t("El número que falta es ") + miles(b) + "."
      });
    }
    var withTokens = p.tokens && s <= 1 && a <= 20 && b <= 20;
    return merge(input(ans), {
      skill: op === "+" ? "aritmetica_suma" : "aritmetica_resta",
      prompt: _t("Resuelve:"),
      visual: (withTokens ? shapeGroup(new Array(a).fill(FIGURAS[0])) + (op === "+" ? shapeGroup(new Array(b).fill(FIGURAS[1])) : "") : "") +
        '<p class="game-equation">' + miles(a) + " " + op + " " + miles(b) + ' = <span class="is-blank">?</span></p>',
      speech: miles(a) + (op === "+" ? _t(" más ") : _t(" menos ")) + miles(b),
      hint: p.carry ? (op === "+" ? _t("Suma primero las unidades; si pasan de 9, lleva una decena.") : _t("Si arriba hay menos unidades, pide prestada una decena.")) :
        (op === "+" ? _t("Empieza por el número mayor y cuenta hacia adelante.") : _t("Cuenta hacia atrás desde el número mayor.")),
      explain: miles(a) + " " + op + " " + miles(b) + " = " + miles(ans) + "."
    });
  }

  function secuencia(p, s) {
    var step = pick(p.steps), len = 5, kind = pick(p.kinds);
    var start = rnd(p.start[0], p.start[1]), seq = [], v = start;
    for (var i = 0; i < len; i++) {
      seq.push(v);
      if (kind === "suma") v += step;
      else if (kind === "resta") v -= step;
      else if (kind === "doble") v *= 2;
      else if (kind === "alterna") v += (i % 2 === 0 ? step : -Math.ceil(step / 2));
    }
    if (kind === "resta" && seq[len - 1] < 0) return secuencia(p, s);
    var hide = s >= 2 ? rnd(1, len - 1) : len - 1;
    var ans = seq[hide];
    var shown = seq.map(function (x, k) { return k === hide ? '<span class="is-blank">?</span>' : miles(x); }).join(", ");
    var rule = kind === "suma" ? _t("suma ") + step : kind === "resta" ? _t("resta ") + step : kind === "doble" ? _t("se duplica") : _t("sube ") + step + _t(" y baja ") + Math.ceil(step / 2);
    return merge(input(ans), {
      skill: "patron_" + kind,
      prompt: _t("¿Qué número falta en la secuencia?"),
      visual: '<p class="game-equation">' + shown + "</p>",
      speech: _t("¿Qué número falta? ") + seq.map(function (x, k) { return k === hide ? _t("cuánto") : x; }).join(", "),
      hint: _t("Mira cuánto cambia de un número al siguiente."),
      explain: _t("La regla es: ") + rule + _t(". Falta el ") + miles(ans) + "."
    });
  }

  function contarDinero(p, s) {
    var count = grow(p.n[0], p.n[1], s), vals = [];
    for (var i = 0; i < count; i++) vals.push(pick(p.denoms));
    vals.sort(function (a, b) { return b - a; });
    var total = vals.reduce(function (x, y) { return x + y; }, 0);
    return merge(moneyInput(total), {
      skill: p.denoms.some(function (d) { return d >= 2000; }) ? "dinero_billetes" : "dinero_monedas",
      prompt: _t("¿Cuánto dinero hay en total?"),
      visual: moneyRow(vals),
      speech: _t("¿Cuánto dinero hay? ") + vals.map(U.copAria).join(", "),
      hint: _t("Empieza por los de mayor valor y ve sumando."),
      explain: vals.map(cop).join(" + ") + " = " + cop(total) + "."
    });
  }

  function parImpar(p, s) {
    var n = grow(4, 6, s), set = [];
    while (set.length < n) { var v = rnd(1, grow(p.min, p.max, s)); if (set.indexOf(v) === -1) set.push(v); }
    var ans = {};
    set.forEach(function (v) { ans["n" + v] = v % 2 === 0 ? "par" : "impar"; });
    return {
      type: "classify", skill: "par_impar",
      prompt: _t("Clasifica cada número: ¿es par o impar?"),
      bins: [{ id: "par", label: _t("Pares") }, { id: "impar", label: _t("Impares") }],
      items: set.map(function (v) { return { id: "n" + v, label: miles(v) }; }),
      answer: ans,
      hint: _t("Solo mira la última cifra: si termina en 0, 2, 4, 6 u 8 es par."),
      explain: _t("Pares: ") + set.filter(function (v) { return v % 2 === 0; }).map(miles).join(", ") + "."
    };
  }

  // ═════════════════════════════════════════════════════════════════════════
  // NIVEL 2 · Valor posicional y operaciones
  // ═════════════════════════════════════════════════════════════════════════

  function compararNumeros(p, s) {
    var digits = p.digits, n = 4, set = [];
    var base = rnd(Math.pow(10, digits - 1), Math.pow(10, digits) - 1);
    var low = Math.pow(10, digits - 1), high = Math.pow(10, digits) - 1;
    if (s >= 3) {
      var rev = parseInt(String(base).split("").reverse().join(""), 10);
      set.push(base);
      if (rev >= low && rev !== base) set.push(rev);
    }
    while (set.length < n) {
      var v = s >= 2 ? Math.min(high, Math.max(low, base + rnd(-60, 60))) : rnd(low, high);
      if (set.indexOf(v) === -1) set.push(v);
    }
    var mayor = Math.random() < 0.5;
    var ans = mayor ? Math.max.apply(null, set) : Math.min.apply(null, set);
    return {
      skill: "comparacion_numeros",
      prompt: _t("¿Cuál es el número ") + (mayor ? _t("mayor") : _t("menor")) + "?",
      options: shuffle(set).map(function (v) { return { label: miles(v), value: v, aria: String(v) }; }),
      answer: ans,
      hint: _t("Compara cifra por cifra empezando por la izquierda (centenas, luego decenas)."),
      explain: _t("El ") + (mayor ? _t("mayor") : _t("menor")) + _t(" es ") + miles(ans) + "."
    };
  }

  function valorPosicional(p, s) {
    var n = rnd(grow(100, 1000, s), grow(999, 9999, s));
    var str = String(n), pos = rnd(0, str.length - 1), d = parseInt(str[pos], 10);
    if (d === 0) return valorPosicional(p, s);
    var place = Math.pow(10, str.length - 1 - pos), ans = d * place;
    var names = { 1: _t("unidades"), 10: _t("decenas"), 100: _t("centenas"), 1000: _t("unidades de mil") };
    var digitsHtml = str.split("").map(function (c, k) { return k === pos ? '<span class="is-blank" style="border:0;color:var(--gold-600)">' + c + "</span>" : c; }).join("");
    var r = {
      skill: "valor_posicional",
      prompt: _t("¿Cuánto vale el ") + d + _t(" resaltado en ") + miles(n) + "?",
      visual: '<p class="game-equation">' + digitsHtml + "</p>",
      hint: _t("Fíjate en la posición: unidades, decenas, centenas, unidades de mil, de derecha a izquierda."),
      explain: _t("Está en las ") + names[place] + _t(", así que vale ") + miles(ans) + "."
    };
    return s < 2 ? merge(r, { options: U.choices(ans, [d, d * 10, d * 100, d * 1000].filter(function (x) { return x !== ans; }), 4, num, 1), answer: ans })
                 : merge(r, input(ans));
  }

  function gruposIguales(p, s) {
    var g = rnd(2, grow(4, 9, s)), m = rnd(2, grow(5, 9, s)), ans = g * m;
    var groups = "";
    if (s <= 1) for (var i = 0; i < g; i++) groups += shapeGroup(new Array(m).fill(FIGURAS[i % 4]));
    var contexto = pick([[_t("cajas"), _t("marcadores")], [_t("filas"), _t("sillas")], [_t("paquetes"), _t("galletas")], [_t("bolsas"), _t("naranjas")]]);
    return merge(input(ans), {
      skill: "multiplicacion_grupos",
      prompt: _t("Hay ") + g + " " + contexto[0] + _t(" con ") + m + " " + contexto[1] + _t(" cada una. ¿Cuántos ") + contexto[1] + _t(" hay en total?"),
      visual: groups ? '<div class="dm-row">' + groups + "</div>" : '<p class="game-equation">' + g + " × " + m + ' = <span class="is-blank">?</span></p>',
      hint: _t("Es sumar ") + m + _t(" tantas veces como ") + contexto[0] + _t(" hay: ") + g + _t(" veces."),
      explain: g + " × " + m + " = " + ans + "."
    });
  }

  function repartir(p, s) {
    var g = rnd(2, grow(4, 9, s)), each = rnd(2, grow(5, 12, s)), total = g * each;
    var ctx = pick([[_t("personas"), _t("dulces")], [_t("equipos"), _t("jugadores")], [_t("mesas"), _t("platos")], [_t("grupos"), _t("hojas")]]);
    return merge(input(each), {
      skill: "division_reparto",
      prompt: _t("Se reparten ") + total + " " + ctx[1] + _t(" en partes iguales entre ") + g + " " + ctx[0] + _t(". ¿Cuántos le tocan a cada uno?"),
      visual: '<p class="game-equation">' + total + " ÷ " + g + ' = <span class="is-blank">?</span></p>',
      hint: _t("Busca el número que multiplicado por ") + g + _t(" da ") + total + ".",
      explain: total + " ÷ " + g + " = " + each + _t(", porque ") + g + " × " + each + " = " + total + "."
    });
  }

  function horaTexto(h, m) { return h + ":" + String(m).padStart(2, "0"); }
  function leerHora(p, s) {
    var mins = s <= 1 ? [0, 30] : s <= 2 ? [0, 15, 30, 45] : p.fine ? [5, 10, 20, 25, 35, 40, 50, 55] : [0, 15, 30, 45];
    var h = rnd(1, 12), m = pick(mins), ans = horaTexto(h, m);
    var others = [horaTexto(h, (m + 30) % 60), horaTexto((h % 12) + 1, m), horaTexto(m / 5 || 12, h * 5 % 60), horaTexto(h === 1 ? 12 : h - 1, m)];
    return {
      skill: "lectura_reloj",
      prompt: _t("¿Qué hora marca el reloj?"),
      visual: clockSvg(h, m),
      options: U.textChoices(ans, others, 4),
      answer: ans,
      hint: _t("La manecilla corta (azul) marca la hora; la larga (dorada) marca los minutos: cada número son 5 minutos."),
      explain: _t("La corta está en el ") + h + (m >= 30 ? _t(" (pasando hacia el siguiente)") : "") + _t(" y la larga en ") + m + _t(" minutos: ") + ans + "."
    };
  }

  function fracciones(p, s) {
    var parts = pick(p.parts.slice(0, grow(2, p.parts.length, s))), filled = rnd(1, parts - 1);
    var ans = filled + "/" + parts;
    var others = [(parts - filled) + "/" + parts, parts + "/" + filled, filled + "/" + (parts + 1), (filled + 1) + "/" + parts].filter(function (x) { return x !== ans; });
    return {
      skill: "fracciones",
      prompt: _t("¿Qué fracción de la barra está pintada?"),
      visual: fractionSvg(parts, filled),
      options: U.textChoices(ans, others, 4),
      answer: ans,
      hint: _t("Abajo va el total de partes; arriba, cuántas están pintadas."),
      explain: _t("Hay ") + filled + _t(" partes pintadas de ") + parts + ": " + ans + "."
    };
  }

  /** Muestra una operación resuelta paso a paso con un paso equivocado. */
  function encontrarError(p, s) {
    var a = rnd(grow(25, 300, s), grow(60, 900, s)), b = rnd(grow(15, 150, s), grow(40, 500, s));
    if (p.money) { a = Math.round(a * 100 / 50) * 50 + 10000; b = Math.round(b * 100 / 50) * 50 + 2000; }
    var fmt = p.money ? cop : miles;
    var steps, wrongIdx, correct;
    if (!p.money) {
      a = a - (a % 10) + rnd(5, 9); b = b - (b % 10) + rnd(5, 9);
      var ua = a % 10, ub = b % 10, u = ua + ub;
      var da = Math.floor(a / 10) % 10, db = Math.floor(b / 10) % 10, dSum = da + db + 1;
      correct = a + b;
      wrongIdx = rnd(0, 2);
      steps = [
        _t("Unidades: ") + ua + " + " + ub + " = " + (wrongIdx === 0 ? u - 1 : u) + _t(", escribo ") + ((wrongIdx === 0 ? u - 1 : u) % 10) + _t(" y llevo 1"),
        _t("Decenas: ") + da + " + " + db + " + 1 = " + (wrongIdx === 1 ? dSum - 1 : dSum),
        _t("Resultado: ") + miles(a) + " + " + miles(b) + " = " + miles(wrongIdx === 2 ? correct - 10 : correct)
      ];
    } else {
      var desc = pick([10, 20, 25]), conDesc = a - a * desc / 100, pago = Math.ceil((conDesc + b) / 10000) * 10000 + 10000;
      correct = pago - (conDesc + b);
      wrongIdx = rnd(0, 2);
      steps = [
        _t("Descuento del ") + desc + _t(" % sobre ") + fmt(a) + ": " + fmt(wrongIdx === 0 ? a * desc / 10 : a * desc / 100),
        _t("Total a pagar: ") + fmt(conDesc) + " + " + fmt(b) + " = " + fmt(wrongIdx === 1 ? conDesc + b + 1000 : conDesc + b),
        _t("Vueltas de ") + fmt(pago) + ": " + fmt(wrongIdx === 2 ? correct + 1000 : correct)
      ];
    }
    var opts = steps.map(function (t, i) { return { label: _t("Paso ") + (i + 1) + ": " + t, value: i, aria: _t("Paso ") + (i + 1) + ". " + t }; });
    return {
      skill: p.money ? "problema_tres_pasos" : "revision_suma",
      layout: "list",
      prompt: _t("Uno de estos pasos tiene un error. ¿Cuál?"),
      visual: "",
      options: opts,
      answer: wrongIdx,
      hint: _t("Revisa cada paso por separado y haz tú la cuenta."),
      explain: _t("El paso ") + (wrongIdx + 1) + _t(" está mal. ") + (p.money ? _t("Las vueltas correctas son ") + cop(correct) + "." : _t("El resultado correcto es ") + miles(correct) + ".")
    };
  }

  // ═════════════════════════════════════════════════════════════════════════
  // NIVEL 3 · Dinero y tiempo
  // ═════════════════════════════════════════════════════════════════════════

  function cuantoFalta(p, s) {
    var prod = PRODUCTOS[rnd(grow(0, 4, s), grow(4, 9, s))], cost = price(prod, 100);
    var have = Math.max(500, Math.round((cost - rnd(cost * 0.15, cost * 0.6)) / 500) * 500);
    var vals = breakDown(have, [50000, 20000, 10000, 5000, 2000, 1000, 500, 200, 100]);
    return merge(moneyInput(cost - have), {
      skill: "dinero_faltante",
      prompt: _t("El ") + prod.n + _t(" cuesta ") + cop(cost) + _t(" y tienes esto. ¿Cuánto te falta?"),
      visual: moneyRow(vals),
      speech: _t("El ") + prod.n + _t(" cuesta ") + U.copAria(cost) + _t(". Tienes ") + U.copAria(have) + _t(". ¿Cuánto te falta?"),
      hint: _t("Primero cuenta cuánto tienes; luego resta: precio menos lo que tienes."),
      explain: _t("Tienes ") + cop(have) + ". " + cop(cost) + " − " + cop(have) + " = " + cop(cost - have) + "."
    });
  }

  function vueltas(p, s) {
    var prod = PRODUCTOS[rnd(grow(0, 3, s), grow(5, 9, s))], cost = price(prod, s >= 3 ? 50 : 100);
    var bills = [2000, 5000, 10000, 20000, 50000, 100000].filter(function (b) { return b > cost; });
    var pay = bills[Math.min(bills.length - 1, s >= 2 ? 1 : 0)] || 100000;
    var ans = pay - cost;
    return merge(moneyInput(ans), {
      skill: "dinero_cambio",
      prompt: _t("Compras un ") + prod.n + _t(" de ") + cop(cost) + _t(" y pagas con este billete. ¿Cuánto te devuelven?"),
      visual: billSvg(pay) + receipt([[_t("Total"), cop(cost)], [_t("Pagas con"), cop(pay)], [_t("Vueltas"), "?"]]),
      speech: _t("Compras un ") + prod.n + _t(" de ") + U.copAria(cost) + _t(" y pagas con ") + U.copAria(pay) + _t(". ¿Cuánto te devuelven?"),
      hint: _t("Cuenta desde el precio hasta el billete: primero hasta el siguiente mil, luego de mil en mil."),
      explain: cop(pay) + " − " + cop(cost) + " = " + cop(ans) + "."
    });
  }

  function compraVarios(p, s) {
    var n = grow(2, 4, s), items = shuffle(PRODUCTOS.slice(0, 7)).slice(0, n), rows = [], total = 0;
    items.forEach(function (it) {
      var q = s >= 2 ? rnd(1, 3) : 1, pr = price(it, 100);
      total += q * pr;
      rows.push([(q > 1 ? q + " × " : "") + it.n, cop(pr) + (q > 1 ? " c/u" : "")]);
    });
    rows.push([_t("Total"), "?"]);
    return merge(moneyInput(total), {
      skill: "dinero_suma",
      prompt: _t("¿Cuánto cuesta toda la compra?"),
      visual: receipt(rows),
      hint: _t("Si un producto se compra varias veces, multiplica primero; luego suma todo."),
      explain: _t("El total es ") + cop(total) + "."
    });
  }

  function descuento(p, s) {
    var pct = pick(s <= 1 ? [10, 50] : s <= 3 ? [10, 20, 25, 50] : [15, 20, 25, 30, 40]);
    var prod = PRODUCTOS[rnd(5, 9)], pr = Math.round(price(prod, 1000) / 1000) * 1000;
    var desc = pr * pct / 100, ans = pr - desc;
    var askDiscount = s <= 1;
    var r = {
      skill: "descuento",
      prompt: askDiscount ? _t("Un ") + prod.n + _t(" de ") + cop(pr) + _t(" tiene ") + pct + _t(" % de descuento. ¿Cuánto te descuentan?") :
        _t("Un ") + prod.n + _t(" de ") + cop(pr) + _t(" tiene ") + pct + _t(" % de descuento. ¿Cuánto pagas?"),
      visual: receipt([[_t("Precio"), cop(pr)], [_t("Descuento"), pct + " %"], [askDiscount ? _t("Descuento en pesos") : _t("Pagas"), "?"]]),
      hint: pct === 50 ? _t("El 50 % es la mitad.") : _t("Calcula el 10 % (quita un cero) y multiplícalo para llegar a ") + pct + " %.",
      explain: _t("El ") + pct + _t(" % de ") + cop(pr) + _t(" es ") + cop(desc) + (askDiscount ? "." : _t(". Pagas ") + cop(pr) + " − " + cop(desc) + " = " + cop(ans) + ".")
    };
    return merge(r, moneyInput(askDiscount ? desc : ans));
  }

  function precioUnidad(p, s) {
    var prod = pick([[_t("galletas"), _t("paquete")], [_t("huevos"), _t("huevo")], [_t("lápices"), _t("lápiz")], [_t("jabones"), _t("jabón")]]);
    var uA = rnd(5, 15) * 100, uB = uA + (Math.random() < 0.5 ? 1 : -1) * rnd(1, s >= 3 ? 1 : 4) * 100;
    var qA = rnd(2, 6), qB = qA + rnd(2, 6);
    var ans = uA < uB ? "A" : "B";
    return {
      skill: "precio_unitario",
      prompt: _t("¿Qué oferta de ") + prod[0] + _t(" sale más barata por unidad?"),
      visual: receipt([[_t("Oferta A: ") + qA + " " + prod[0], cop(qA * uA)], [_t("Oferta B: ") + qB + " " + prod[0], cop(qB * uB)]]),
      options: [{ label: _t("Oferta A"), value: "A" }, { label: _t("Oferta B"), value: "B" }],
      answer: ans,
      hint: _t("Divide cada precio entre la cantidad para saber cuánto cuesta cada ") + prod[1] + ".",
      explain: "A: " + cop(uA) + _t(" por ") + prod[1] + ". B: " + cop(uB) + _t(" por ") + prod[1] + _t(". Sale más barata la oferta ") + ans + "."
    };
  }

  function sumarMinutos(h, m, add) { var t = h * 60 + m + add; return [Math.floor(t / 60) % 24, t % 60]; }
  function horaTermina(p, s) {
    var h = rnd(6, 17), m = pick([0, 10, 15, 20, 30, 40, 45]);
    var dur = pick(s <= 1 ? [30, 45, 60] : s <= 3 ? [50, 75, 90, 105] : [95, 125, 140, 155]);
    var fin = sumarMinutos(h, m, dur), ans = horaTexto(fin[0], fin[1]);
    var actividad = pick([_t("la clase"), _t("el partido"), _t("la película"), _t("el turno"), _t("el taller")]);
    var w1 = sumarMinutos(h, m, dur - 10), w2 = sumarMinutos(h, m, dur + 60 - (dur % 60 === 0 ? 30 : 0)), w3 = sumarMinutos(h, 0, dur);
    return {
      skill: "duracion_tiempo",
      prompt: actividad.charAt(0).toUpperCase() + actividad.slice(1) + _t(" empieza a las ") + horaTexto(h, m) + _t(" y dura ") + dur + _t(" minutos. ¿A qué hora termina?"),
      options: U.textChoices(ans, [horaTexto(w1[0], w1[1]), horaTexto(w2[0], w2[1]), horaTexto(w3[0], w3[1])], 4),
      answer: ans,
      hint: _t("Suma primero las horas completas (60 minutos) y luego los minutos que sobran."),
      explain: dur + _t(" minutos son ") + Math.floor(dur / 60) + " h " + (dur % 60) + _t(" min. Termina a las ") + ans + "."
    };
  }

  function estimar(p, s) {
    var n = grow(2, 4, s), vals = [], total = 0;
    for (var i = 0; i < n; i++) { var v = rnd(11, 99) * (s >= 2 ? 100 : 10) + rnd(1, 9) * (s >= 2 ? 10 : 1); vals.push(v); total += v; }
    var unit = s >= 2 ? 1000 : 100;
    var est = vals.reduce(function (a, v) { return a + Math.round(v / unit) * unit; }, 0);
    var opts = [est, est + 2 * unit * n, Math.max(unit, est - 2 * unit * n), est * 10];
    return {
      skill: "estimacion",
      prompt: _t("Sin hacer la cuenta exacta, ¿cuál es el resultado más cercano a ") + vals.map(miles).join(" + ") + "?",
      options: shuffle(opts).map(function (v) { return { label: _t("Cerca de ") + miles(v), value: v, aria: _t("cerca de ") + v }; }),
      answer: est,
      hint: _t("Redondea cada número a la ") + (unit === 1000 ? _t("unidad de mil") : _t("centena")) + _t(" más cercana y suma los redondeos."),
      explain: _t("Redondeando queda cerca de ") + miles(est) + _t(". La suma exacta es ") + miles(total) + "."
    };
  }

  function emparejarDinero(p, s) {
    var n = grow(3, 4, s), targets = shuffle([2000, 5000, 10000, 20000, 50000]).slice(0, n);
    var left = [], right = [], ans = {};
    targets.forEach(function (t, i) {
      var parts = t === 2000 ? [1000, 1000] : t === 5000 ? [2000, 2000, 1000] : t === 10000 ? [5000, 2000, 2000, 1000] :
        t === 20000 ? [10000, 5000, 5000] : [20000, 20000, 10000];
      if (s >= 3 && t === 10000) parts = [5000, 5000];
      left.push({ id: "l" + i, label: parts.map(cop).join(" + ") });
      right.push({ id: "r" + i, label: cop(t) });
      ans["l" + i] = "r" + i;
    });
    return {
      type: "match", skill: "equivalencia_dinero",
      prompt: _t("Une cada grupo de billetes y monedas con el valor que suma."),
      left: shuffle(left), right: shuffle(right), answer: ans,
      hint: _t("Suma cada grupo de la izquierda antes de buscar su pareja."),
      explain: targets.map(cop).join(", ") + "."
    };
  }

  // ═════════════════════════════════════════════════════════════════════════
  // NIVEL 4 · Razonamiento aplicado
  // ═════════════════════════════════════════════════════════════════════════

  function equivalencias(p, s) {
    var pool = [["1/2", "50 %"], ["1/4", "25 %"], ["3/4", "75 %"], ["1/10", "10 %"], ["1/5", "20 %"], ["2/5", "40 %"], ["3/10", "30 %"], ["1/100", "1 %"]];
    var set = shuffle(pool.slice(0, grow(5, 8, s))).slice(0, grow(3, 5, s));
    var left = [], right = [], ans = {};
    set.forEach(function (pair, i) { left.push({ id: "f" + i, label: pair[0] }); right.push({ id: "p" + i, label: pair[1] }); ans["f" + i] = "p" + i; });
    return {
      type: "match", skill: "fraccion_porcentaje",
      prompt: _t("Une cada fracción con su porcentaje."),
      left: shuffle(left), right: shuffle(right), answer: ans,
      hint: _t("Piensa en partes de 100: ¿cuántas de cada 100 representa la fracción?"),
      explain: set.map(function (x) { return x[0] + " = " + x[1]; }).join(" · ") + "."
    };
  }

  function convertir(p, s) {
    var pool = s <= 1 ? [[_t("1 hora"), _t("60 minutos")], [_t("media hora"), _t("30 minutos")], [_t("1 metro"), _t("100 centímetros")], [_t("1 kilo"), _t("1.000 gramos")]] :
      [[_t("2 horas y media"), _t("150 minutos")], [_t("90 minutos"), _t("1 hora y media")], [_t("3,5 metros"), _t("350 centímetros")], [_t("2 kilos y medio"), _t("2.500 gramos")], [_t("1 litro"), _t("1.000 mililitros")], [_t("un cuarto de hora"), _t("15 minutos")]];
    var set = shuffle(pool).slice(0, grow(3, 4, s)), left = [], right = [], ans = {};
    set.forEach(function (pair, i) { left.push({ id: "a" + i, label: pair[0] }); right.push({ id: "b" + i, label: pair[1] }); ans["a" + i] = "b" + i; });
    return {
      type: "match", skill: "conversion_medida",
      prompt: _t("Une las medidas que son iguales."),
      left: shuffle(left), right: shuffle(right), answer: ans,
      hint: _t("Recuerda: 1 hora = 60 min, 1 m = 100 cm, 1 kg = 1.000 g."),
      explain: set.map(function (x) { return x[0] + " = " + x[1]; }).join(" · ") + "."
    };
  }

  function leerTabla(p, s) {
    var meses = [_t("Enero"), _t("Febrero"), _t("Marzo"), _t("Abril")];
    var rows = meses.map(function (m) { return [m, rnd(8, 30) * 1000]; });
    var q = s <= 1 ? "max" : s <= 3 ? "diff" : "sum";
    var max = rows.reduce(function (a, r) { return r[1] > a[1] ? r : a; });
    var a = rows[0], b = rows[rnd(1, 3)];
    var html = _t('<table class="dm-table"><tr><th>Mes</th><th>Ahorro</th></tr>') + rows.map(function (r) { return "<tr><td>" + r[0] + "</td><td>" + cop(r[1]) + "</td></tr>"; }).join("") + "</table>";
    if (q === "max") {
      return { skill: "lectura_tabla", prompt: _t("¿En qué mes ahorró más?"), visual: html,
        options: meses.map(function (m) { return { label: m, value: m }; }), answer: max[0],
        hint: _t("Compara la columna de ahorro fila por fila."), explain: _t("En ") + max[0] + _t(" ahorró ") + cop(max[1]) + _t(", el valor más alto.") };
    }
    var total = rows.reduce(function (t, r) { return t + r[1]; }, 0);
    var ans = q === "diff" ? Math.abs(a[1] - b[1]) : total;
    return merge(moneyInput(ans), { skill: "lectura_tabla",
      prompt: q === "diff" ? _t("¿Cuánto más ahorró en ") + (a[1] > b[1] ? a[0] : b[0]) + _t(" que en ") + (a[1] > b[1] ? b[0] : a[0]) + "?" : _t("¿Cuánto ahorró en total en los cuatro meses?"),
      visual: html,
      hint: q === "diff" ? _t("Busca los dos valores en la tabla y réstalos.") : _t("Suma los cuatro valores de la columna."),
      explain: _t("La respuesta es ") + cop(ans) + "." });
  }

  function presupuesto(p, s) {
    var total = pick(p.totals), n = grow(2, 4, s), cats = shuffle([_t("transporte"), _t("comida"), _t("datos del celular"), _t("fotocopias"), _t("ahorro"), _t("salidas")]).slice(0, n);
    var gastos = cats.map(function () { return rnd(2, Math.floor(total / 1000 / (n + 1))) * 1000; });
    var used = gastos.reduce(function (a, b) { return a + b; }, 0), ans = total - used;
    var rows = [[_t("Presupuesto"), cop(total)]].concat(cats.map(function (c, i) { return [c.charAt(0).toUpperCase() + c.slice(1), "− " + cop(gastos[i])]; })).concat([[_t("Queda"), "?"]]);
    return merge(moneyInput(ans), {
      skill: "presupuesto",
      prompt: _t("Con este presupuesto y estos gastos, ¿cuánto dinero queda?"),
      visual: receipt(rows),
      hint: _t("Suma todos los gastos y réstalos del presupuesto."),
      explain: _t("Gastos: ") + cop(used) + _t(". Queda ") + cop(total) + " − " + cop(used) + " = " + cop(ans) + "."
    });
  }

  function promedio(p, s) {
    var n = grow(3, 5, s), avg = rnd(p.min, p.max), vals = [], i;
    for (i = 0; i < n - 1; i++) vals.push(avg + rnd(-p.spread, p.spread));
    vals.push(avg * n - vals.reduce(function (a, b) { return a + b; }, 0));
    var top = p.unit === "nota" ? 50 : Infinity, bottom = p.unit === "nota" ? 10 : 0;
    if (vals.some(function (v) { return v < bottom || v > top; })) return promedio(p, s);
    var askMissing = p.missing && s >= 2;
    var label = p.unit === "nota" ? function (v) { return (v / 10).toFixed(1).replace(".", ","); } : p.unit === "cop" ? cop : miles;
    if (askMissing) {
      var shownVals = vals.slice(0, n - 1);
      var r = {
        skill: "promedio",
        prompt: _t("Con ") + (n - 1) + _t(" notas de ") + shownVals.map(label).join(", ") + _t(", ¿qué nota necesitas en la última para que el promedio de las ") + n + _t(" sea ") + label(avg) + "?",
        options: U.choices(vals[n - 1], [avg, vals[n - 1] + 5, vals[n - 1] - 5], 4, function (v) { return { label: label(v), aria: label(v) }; }, 0),
        answer: vals[n - 1],
        hint: _t("Multiplica el promedio por la cantidad de notas y réstale lo que ya tienes."),
        explain: label(avg) + " × " + n + " = " + label(avg * n) + _t(". Te falta ") + label(vals[n - 1]) + "."
      };
      return r;
    }
    return {
      skill: "promedio",
      prompt: _t("¿Cuál es el promedio de ") + vals.map(label).join(", ") + "?",
      options: U.choices(avg, [avg + 1, avg - 1, Math.round(vals.reduce(function (a, b) { return a + b; }, 0) / (n - 1))], 4, function (v) { return { label: label(v), aria: label(v) }; }, 0),
      answer: avg,
      hint: _t("Suma todos los valores y divide entre cuántos son (") + n + ").",
      explain: _t("Suma: ") + label(vals.reduce(function (a, b) { return a + b; }, 0)) + _t(". Entre ") + n + _t(" da ") + label(avg) + "."
    };
  }

  function reglaTres(p, s) {
    var it = pick([[_t("cuadernos"), _t("cuaderno")], [_t("pasajes"), _t("pasaje")], [_t("botellas de agua"), _t("botella")], [_t("fotocopias"), _t("fotocopia")]]);
    var unit = rnd(grow(3, 8, s), grow(8, 25, s)) * 100, a = rnd(2, 6), b = a + rnd(1, grow(3, 9, s));
    if (s >= 3) unit = rnd(12, 45) * 50;
    var pa = a * unit, ans = b * unit;
    return merge(moneyInput(ans), {
      skill: "regla_de_tres",
      prompt: _t("Si ") + a + " " + it[0] + _t(" cuestan ") + cop(pa) + _t(", ¿cuánto cuestan ") + b + " " + it[0] + "?",
      hint: _t("Calcula primero cuánto cuesta un ") + it[1] + ".",
      explain: _t("Un ") + it[1] + _t(" cuesta ") + cop(pa) + " ÷ " + a + " = " + cop(unit) + _t(". Por ") + b + ": " + cop(ans) + "."
    });
  }

  function interes(p, s) {
    var cap = pick(s <= 1 ? [100000, 200000, 500000] : [150000, 300000, 450000, 800000, 1200000]);
    var tasa = pick(s <= 1 ? [1, 2] : [1, 2, 3, 5]), meses = pick(s <= 2 ? [2, 3, 6] : [4, 6, 9, 12]);
    var porMes = cap * tasa / 100, ans = porMes * meses;
    return merge(moneyInput(ans), {
      skill: "interes_simple",
      prompt: _t("Ahorras ") + cop(cap) + _t(" con ") + tasa + _t(" % de interés simple mensual. ¿Cuánto ganas de interés en ") + meses + _t(" meses?"),
      hint: _t("Calcula el interés de un mes (") + tasa + _t(" % del ahorro) y multiplícalo por los meses."),
      explain: _t("Cada mes: ") + cop(porMes) + _t(". En ") + meses + _t(" meses: ") + cop(ans) + "."
    });
  }

  function mayorMenorQue(p, s) {
    var limit = pick([20000, 50000]), n = grow(4, 6, s), items = [], ans = {};
    for (var i = 0; i < n; i++) {
      var q, pr, total;
      do { q = rnd(1, 4); pr = rnd(3, 30) * 1000; total = q * pr; }
      while (Math.abs(total - limit) < 3000 || items.some(function (x) { return x.label === q + " × " + cop(pr); }));
      var id = "c" + i;
      items.push({ id: id, label: q + " × " + cop(pr), total: total });
      ans[id] = q * pr > limit ? "mas" : "menos";
    }
    return {
      type: "classify", skill: "estimacion",
      prompt: _t("Sin calcular exacto, clasifica cada compra: ¿cuesta más o menos de ") + cop(limit) + "?",
      bins: [{ id: "menos", label: _t("Menos de ") + cop(limit) }, { id: "mas", label: _t("Más de ") + cop(limit) }],
      items: items.map(function (x) { return { id: x.id, label: x.label }; }),
      answer: ans,
      hint: _t("Redondea el precio y multiplica mentalmente por la cantidad."),
      explain: items.map(function (x) { return x.label + " = " + cop(x.total); }).join(" · ") + "."
    };
  }

  // ═════════════════════════════════════════════════════════════════════════
  // NIVEL 5 · Integración
  // ═════════════════════════════════════════════════════════════════════════

  function combinadas(p, s) {
    var a = rnd(2, 9), b = rnd(2, 9), c = rnd(2, 9), d = rnd(10, 60);
    var forms = [
      [a + " + " + b + " × " + c, a + b * c, (a + b) * c, _t("Primero la multiplicación: ") + b + " × " + c + " = " + b * c + _t("; luego suma ") + a + "."],
      ["(" + a + " + " + b + ") × " + c, (a + b) * c, a + b * c, _t("Primero el paréntesis: ") + (a + b) + _t("; luego × ") + c + "."],
      [d + " − " + b + " × " + c, d - b * c, (d - b) * c, _t("Primero ") + b + " × " + c + " = " + b * c + _t("; luego ") + d + " − " + b * c + "."],
      [a + " × " + b + " + " + c + " × " + d, a * b + c * d, (a * b + c) * d, _t("Las dos multiplicaciones primero; luego suma.")]
    ];
    var f = forms[Math.min(forms.length - 1, rnd(0, grow(1, 3, s)))];
    if (f[1] < 0) return combinadas(p, s);
    return merge(input(f[1]), {
      skill: "operaciones_combinadas",
      prompt: _t("Resuelve respetando el orden de las operaciones:"),
      visual: '<p class="game-equation">' + f[0] + ' = <span class="is-blank">?</span></p>',
      hint: _t("Primero paréntesis, luego multiplicaciones y divisiones, al final sumas y restas."),
      explain: f[3] + _t(" Resultado: ") + f[1] + "."
    });
  }

  function aumentoDescuento(p, s) {
    var base = rnd(10, 90) * 1000, pct = pick([10, 20, 25, 50]);
    var sube = Math.random() < 0.5, after = sube ? base + base * pct / 100 : base - base * pct / 100;
    var twoStep = s >= 3, pct2 = pick([10, 20]), final = twoStep ? after - after * pct2 / 100 : after;
    var prompt = _t("Un producto de ") + cop(base) + (sube ? _t(" sube ") : _t(" baja ")) + pct + " %" + (twoStep ? _t(" y luego tiene un descuento adicional de ") + pct2 + " %" : "") + _t(". ¿Cuál es el precio final?");
    return merge(moneyInput(final), {
      skill: "porcentaje",
      prompt: prompt,
      hint: twoStep ? _t("El segundo porcentaje se calcula sobre el precio nuevo, no sobre el original.") : _t("Calcula el ") + pct + _t(" % y súmalo o réstalo."),
      explain: _t("Después del primer cambio: ") + cop(after) + (twoStep ? _t(". Con el ") + pct2 + _t(" % menos: ") + cop(final) : "") + "."
    });
  }

  function planearHorario(p, s) {
    var tareas = shuffle([[_t("almorzar"), 30], [_t("hacer la tarea"), 75], [_t("ir al gimnasio"), 60], [_t("ver una serie"), 45], [_t("leer"), 40], [_t("ordenar el cuarto"), 25]]).slice(0, grow(2, 4, s));
    var start = rnd(13, 16), total = tareas.reduce(function (a, t) { return a + t[1]; }, 0);
    var fin = sumarMinutos(start, 0, total);
    return merge(input(total), {
      skill: "duracion_tiempo",
      suffix: "min",
      prompt: _t("Empiezas a las ") + start + _t(":00 y vas a ") + tareas.map(function (t) { return t[0] + " (" + t[1] + " min)"; }).join(", ") + _t(". ¿Cuántos minutos te toma todo?"),
      hint: _t("Suma todas las duraciones. Si quieres la hora final, conviértelo a horas después."),
      explain: _t("En total son ") + total + _t(" minutos: terminas a las ") + horaTexto(fin[0], fin[1]) + "."
    });
  }

  function compararOfertas(p, s) {
    var base = rnd(40, 120) * 1000;
    var oA = { t: _t("20 % de descuento"), v: base * 0.8 };
    var refund = rnd(12, 26) * 1000;
    var oB = { t: _t("Pagas ") + cop(base) + _t(" y te devuelven ") + cop(refund) + _t(" en un bono"), v: base - refund };
    oA.t = _t("Descuento del 20 %");
    var oC = { t: _t("Lleva 2 y paga solo una y media"), v: base * 0.75 };
    var opts = s >= 2 ? [oA, oB, oC] : [oA, oB];
    var best = opts.reduce(function (a, o) { return o.v < a.v ? o : a; });
    if (opts.filter(function (o) { return o.v === best.v; }).length > 1) return compararOfertas(p, s);
    return {
      skill: "comparar_ofertas",
      layout: "list",
      prompt: _t("Un artículo cuesta ") + cop(base) + _t(". ¿Qué oferta te deja pagar menos por unidad?"),
      options: opts.map(function (o, i) { return { label: o.t, value: i, aria: o.t }; }),
      answer: opts.indexOf(best),
      hint: _t("Calcula cuánto pagarías realmente por una unidad en cada oferta."),
      explain: opts.map(function (o) { return o.t + ": " + cop(o.v); }).join(" · ") + "."
    };
  }

  function proporciones(p, s) {
    var r = pick([[_t("Una receta para"), _t("personas usa"), _t("gramos de arroz"), 4, 300], [_t("Un mapa a escala: cada"), _t("centímetros equivalen a"), _t("metros"), 2, 50], [_t("Una moto recorre en"), _t("horas"), _t("kilómetros"), 2, 90]]);
    var a = r[3], va = r[4] * (s >= 2 ? rnd(1, 3) : 1), b = a * rnd(2, 4) + (s >= 3 ? a / 2 : 0), ans = va / a * b;
    if (ans % 1 !== 0) return proporciones(p, s);
    return merge(input(ans), {
      skill: "regla_de_tres",
      suffix: r[2].split(" ")[0],
      prompt: r[0] + " " + a + " " + r[1] + " " + va + " " + r[2] + _t(". ¿Cuántos ") + r[2] + _t(" corresponden a ") + b + "?",
      hint: _t("Busca cuánto corresponde a 1 y multiplica."),
      explain: va + " ÷ " + a + " = " + va / a + _t(" por cada uno. × ") + b + " = " + ans + "."
    });
  }

  function presupuestoMensual(p, s) {
    var sueldo = pick([1300000, 1500000, 1750000, 2000000]);
    var arriendo = Math.round(sueldo * pick([0.3, 0.35, 0.4]) / 10000) * 10000;
    var mercado = rnd(25, 40) * 10000, transporte = rnd(10, 18) * 10000, pctAhorro = pick([10, 15, 20]);
    var ahorro = sueldo * pctAhorro / 100, queda = sueldo - arriendo - mercado - transporte - ahorro;
    if (queda < 50000) return presupuestoMensual(p, s);
    return merge(moneyInput(queda), {
      skill: "presupuesto",
      prompt: _t("Con un ingreso de ") + cop(sueldo) + _t(" al mes, ¿cuánto queda libre después de estos gastos y de ahorrar el ") + pctAhorro + " %?",
      visual: receipt([[_t("Ingreso"), cop(sueldo)], [_t("Arriendo"), "− " + cop(arriendo)], [_t("Mercado"), "− " + cop(mercado)], [_t("Transporte"), "− " + cop(transporte)], [_t("Ahorro (") + pctAhorro + " %)", "?"], [_t("Queda libre"), "?"]]),
      hint: _t("Calcula primero el ahorro (") + pctAhorro + _t(" % del ingreso) y luego resta todo."),
      explain: _t("Ahorro: ") + cop(ahorro) + _t(". Queda ") + cop(queda) + "."
    });
  }

  function ahorroMeta(p, s) {
    var meta = rnd(30, 150) * 10000, mensual = rnd(5, 25) * 10000, ya = s >= 2 ? rnd(2, 8) * 10000 : 0;
    var meses = Math.ceil((meta - ya) / mensual);
    return merge(input(meses), {
      skill: "planeacion_ahorro",
      suffix: _t("meses"),
      prompt: _t("Quieres comprar algo de ") + cop(meta) + "." + (ya ? _t(" Ya tienes ") + cop(ya) + "." : "") + _t(" Si ahorras ") + cop(mensual) + _t(" al mes, ¿cuántos meses necesitas como mínimo?"),
      hint: _t("Divide lo que te falta entre lo que ahorras cada mes y redondea hacia arriba."),
      explain: _t("Te faltan ") + cop(meta - ya) + ". ÷ " + cop(mensual) + " = " + ((meta - ya) / mensual).toFixed(1).replace(".", ",") + _t(", así que necesitas ") + meses + _t(" meses.")
    });
  }

  function compraCompleta(p, s) {
    var items = shuffle(PRODUCTOS.slice(4)).slice(0, grow(2, 3, s)), total = 0, rows = [];
    items.forEach(function (it) { var pr = Math.round(price(it, 1000) / 1000) * 1000; total += pr; rows.push([it.n.charAt(0).toUpperCase() + it.n.slice(1), cop(pr)]); });
    var pct = pick([10, 20, 25]), conDesc = total - total * pct / 100;
    var pay = Math.ceil(conDesc / 50000) * 50000;
    if (pay === conDesc) pay += 50000;
    var ans = pay - conDesc;
    rows.push([_t("Descuento"), pct + " %"], [_t("Pagas con"), cop(pay)], [_t("Vueltas"), "?"]);
    return merge(moneyInput(ans), {
      skill: "problema_tres_pasos",
      prompt: _t("Suma la compra, aplica el descuento y calcula las vueltas."),
      visual: receipt(rows),
      hint: _t("Tres pasos: total, luego total menos descuento, luego billete menos lo que pagas."),
      explain: _t("Total ") + cop(total) + _t(", con descuento ") + cop(conDesc) + _t(", vueltas ") + cop(ans) + "."
    });
  }

  // ═════════════════════════════════════════════════════════════════════════
  // Plan: qué se juega en cada actividad
  // ═════════════════════════════════════════════════════════════════════════

  var COINS = [50, 100, 200, 500, 1000];

  var PLAN = {
    1: [
      [contarVistazo, {}, _t("Vas a decir cuántas figuras hay mirándolas de un vistazo, sin contarlas una por una.")],
      [dondeHayMas, {}, _t("Vas a comparar dos grupos y decidir dónde hay más.")],
      [ordenarNumeros, { min: 20, max: 99, desc: true }, _t("Vas a ordenar números de menor a mayor.")],
      [unidadesDecenas, {}, _t("Vas a leer números a partir de decenas y unidades.")],
      [rectaUbicar, { max: 20, max2: 50, step: 1, lineStep: 2 }, _t("Vas a leer y ubicar números en la recta numérica.")],
      [operar, { op: "+", min: 10, max: 50, tokens: true }, _t("Vas a resolver sumas.")],
      [operar, { op: "−", min: 10, max: 50, tokens: true }, _t("Vas a resolver restas.")],
      [secuencia, { steps: [2, 5, 10], kinds: ["suma"], start: [1, 20] }, _t("Vas a descubrir la regla de una secuencia y completar el número que falta.")],
      [contarDinero, { denoms: [50, 100, 200, 500], n: [2, 6] }, _t("Vas a contar cuánto dinero hay en monedas.")],
      [parImpar, { min: 20, max: 99 }, _t("Vas a clasificar números en pares e impares.")]
    ],
    2: [
      [compararNumeros, { digits: 3 }, _t("Vas a comparar números de tres cifras.")],
      [valorPosicional, {}, _t("Vas a descubrir cuánto vale una cifra según su posición.")],
      [ordenarNumeros, { min: 150, max: 999, close: true, desc: true, n: 4 }, _t("Vas a ordenar números de tres cifras.")],
      [operar, { op: "+", min: 100, max: 800, carry: true }, _t("Vas a resolver sumas llevando.")],
      [operar, { op: "−", min: 100, max: 900, carry: true, missing: true }, _t("Vas a resolver restas prestando y encontrar números que faltan.")],
      [gruposIguales, {}, _t("Vas a calcular el total de grupos iguales (multiplicación).")],
      [repartir, {}, _t("Vas a repartir en partes iguales (división).")],
      [leerHora, {}, _t("Vas a leer la hora en un reloj de manecillas.")],
      [fracciones, { parts: [2, 3, 4, 5, 6, 8, 10] }, _t("Vas a reconocer qué fracción de una barra está pintada.")],
      [encontrarError, {}, _t("Vas a revisar una suma resuelta paso a paso y encontrar el error.")]
    ],
    3: [
      [contarDinero, { denoms: [500, 1000, 2000, 5000, 10000], n: [3, 6] }, _t("Vas a contar billetes y monedas en pesos colombianos.")],
      [cuantoFalta, {}, _t("Vas a calcular cuánto dinero te falta para una compra.")],
      [vueltas, {}, _t("Vas a calcular cuánto te devuelven después de pagar.")],
      [compraVarios, {}, _t("Vas a calcular el total de una compra con varios productos.")],
      [descuento, {}, _t("Vas a calcular descuentos en pesos.")],
      [precioUnidad, {}, _t("Vas a comparar ofertas para saber cuál sale más barata por unidad.")],
      [leerHora, { fine: true }, _t("Vas a leer la hora exacta, de cinco en cinco minutos.")],
      [horaTermina, {}, _t("Vas a calcular a qué hora termina una actividad.")],
      [estimar, {}, _t("Vas a estimar resultados redondeando, sin hacer la cuenta exacta.")],
      [emparejarDinero, {}, _t("Vas a unir grupos de billetes y monedas con el valor que suman.")]
    ],
    4: [
      [rectaUbicar, { max: 1000, step: 50, fine: 10, lineStep: 100 }, _t("Vas a leer y ubicar números en una recta del 0 al 1.000.")],
      [secuencia, { steps: [3, 4, 6, 8], kinds: ["doble", "alterna", "resta"], start: [3, 60] }, _t("Vas a completar secuencias con reglas más complejas.")],
      [equivalencias, {}, _t("Vas a unir fracciones con su porcentaje.")],
      [convertir, {}, _t("Vas a unir medidas que son iguales: tiempo, longitud y peso.")],
      [leerTabla, {}, _t("Vas a leer una tabla de ahorros y responder con sus datos.")],
      [presupuesto, { totals: [50000, 80000, 100000, 150000] }, _t("Vas a calcular cuánto queda de un presupuesto.")],
      [promedio, { min: 30, max: 45, spread: 8, unit: "nota", missing: true }, _t("Vas a calcular promedios de notas.")],
      [reglaTres, {}, _t("Vas a calcular precios con proporciones (regla de tres).")],
      [interes, {}, _t("Vas a calcular cuánto gana un ahorro con interés simple.")],
      [mayorMenorQue, {}, _t("Vas a estimar si una compra cuesta más o menos que un valor.")]
    ],
    5: [
      [combinadas, {}, _t("Vas a resolver operaciones combinadas respetando el orden.")],
      [aumentoDescuento, {}, _t("Vas a calcular aumentos y descuentos encadenados.")],
      [planearHorario, {}, _t("Vas a planear tu tarde sumando duraciones.")],
      [compararOfertas, {}, _t("Vas a decidir qué oferta te conviene más.")],
      [proporciones, {}, _t("Vas a resolver proporciones en recetas, mapas y recorridos.")],
      [promedio, { min: 32, max: 42, spread: 6, unit: "nota", missing: true }, _t("Vas a calcular la nota que necesitas para alcanzar un promedio.")],
      [presupuestoMensual, {}, _t("Vas a organizar un presupuesto mensual con ahorro.")],
      [ahorroMeta, {}, _t("Vas a calcular cuántos meses necesitas para ahorrar una meta.")],
      [encontrarError, { money: true }, _t("Vas a revisar una compra resuelta en tres pasos y encontrar el error.")],
      [compraCompleta, {}, _t("Vas a resolver una compra completa: total, descuento y vueltas.")]
    ]
  };

  var HABILIDADES = {
    subitizacion: _t("Reconocer cantidades de un vistazo"),
    comparacion_magnitud: _t("Comparar cantidades"),
    comparacion_numeros: _t("Comparar números"),
    orden_numeros: _t("Ordenar números"),
    valor_posicional: _t("Valor de una cifra según su posición"),
    valor_posicional_bloques: _t("Leer números con bloques"),
    recta_numerica: _t("Ubicar números en la recta"),
    aritmetica_suma: _t("Sumar"),
    aritmetica_resta: _t("Restar"),
    aritmetica_falta: _t("Encontrar el número que falta"),
    patron_suma: _t("Secuencias que suman"),
    patron_resta: _t("Secuencias que restan"),
    patron_doble: _t("Secuencias que se duplican"),
    patron_alterna: _t("Secuencias alternas"),
    dinero_monedas: _t("Contar monedas"),
    dinero_billetes: _t("Contar billetes y monedas"),
    dinero_faltante: _t("Calcular cuánto falta"),
    dinero_cambio: _t("Calcular las vueltas"),
    dinero_suma: _t("Sumar una compra"),
    equivalencia_dinero: _t("Equivalencias de dinero"),
    par_impar: _t("Pares e impares"),
    multiplicacion_grupos: _t("Grupos iguales (multiplicación)"),
    division_reparto: _t("Repartir en partes iguales (división)"),
    lectura_reloj: _t("Leer la hora"),
    duracion_tiempo: _t("Calcular duraciones"),
    fracciones: _t("Fracciones"),
    fraccion_porcentaje: _t("Fracciones y porcentajes"),
    revision_suma: _t("Revisar una suma paso a paso"),
    descuento: _t("Descuentos"),
    porcentaje: _t("Porcentajes"),
    precio_unitario: _t("Precio por unidad"),
    estimacion: _t("Estimar resultados"),
    conversion_medida: _t("Convertir medidas"),
    lectura_tabla: _t("Leer tablas"),
    presupuesto: _t("Presupuesto"),
    promedio: _t("Promedio"),
    regla_de_tres: _t("Proporciones (regla de tres)"),
    interes_simple: _t("Interés simple"),
    operaciones_combinadas: _t("Orden de las operaciones"),
    comparar_ofertas: _t("Comparar ofertas"),
    planeacion_ahorro: _t("Planear un ahorro"),
    problema_tres_pasos: _t("Problemas de varios pasos")
  };

  global.IndecapGame.register({
    slug: "discalculia_mercado",
    skillLabels: HABILIDADES,
    plan: PLAN,

    getActivity: function (index) {
      var nivel = Math.min(5, Math.max(1, Math.ceil(index / 10)));
      var act = PLAN[nivel][(index - 1) % 10];
      return {
        intro: act[2] + _t(" Son ") + RETOS + _t(" retos que suben de dificultad."),
        rounds: RETOS,
        build: function (step) { return act[0](act[1], step); }
      };
    }
  });
})(window);
