/**
 * MERCADO ESPACIAL — Discalculia
 *
 * Habilidad núcleo: sentido numérico y correspondencia cantidad-símbolo.
 * Progresión concreto → pictórico → abstracto en 10 niveles base. El nivel 10
 * es evaluación embebida: mezcla todas las habilidades sin presentarse como
 * examen.
 *
 * MAPA DE ETAPAS (5 Stages de 10 niveles, 50 en total, numeración continua):
 *   Stage 1 · Base            → niveles 1-10  (sin cambio de contenido)
 *   Stage 2 · Media           → niveles 11-20 (matemática financiera cotidiana)
 *   Stage 3 · Alta            → niveles 21-30 (finanzas personales, promedios)
 *   Stage 4 · Muy Alta        → niveles 31-40 (proporciones, planificación)
 *   Stage 5 · Súper Difícil   → niveles 41-50 (integración total, mínimo apoyo)
 *
 * Cada nivel tiene 10 retos. El desbloqueo de nivel a nivel (score >= 60) lo
 * sigue manejando games/services.py::get_unlocked_level sin ningún cambio:
 * es agnóstico al número total de niveles.
 *
 * Contenido pensado para jóvenes de 15 a 26 años: a partir del nivel 11 se
 * introducen contextos de vida adulta (precios por unidad, propinas,
 * presupuesto, interés simple, promedios, conversión de unidades, regla de
 * tres y lectura de tablas), para que la progresión no se sienta repetitiva
 * ni infantil.
 *
 * El repaso de errores al cierre de cada nivel lo maneja el motor
 * (core/engine.js) de forma automática: si el estudiante falla una actividad,
 * al terminar el nivel se genera una actividad nueva de esa misma mecánica
 * antes de cerrar. Este archivo no necesita implementar nada para eso.
 *
 * Neutralidad cultural y visual:
 *  - Las figuras son formas geométricas nombradas en la consigna; nunca se
 *    depende del color (daltonismo, alto contraste).
 *  - Dinero con "$" genérico, sin país ni denominaciones locales.
 *  - Sin modismos ni referencias a comidas, fiestas o costumbres concretas.
 *
 * Los distractores modelan errores reales (dígitos invertidos, operación
 * equivocada, confundir manecillas). Los estilos se inyectan desde aquí.
 */
(function (global) {
  "use strict";

  // ─── Utilidades ───────────────────────────────────────────────────────────
  function rnd(a, b) { return Math.floor(Math.random() * (b - a + 1)) + a; }
  function pick(a) { return a[rnd(0, a.length - 1)]; }
  function shuffle(arr) {
    var a = arr.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = rnd(0, i), t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }

  var FORMAS = [
    { i: "●", s: "círculos" },
    { i: "■", s: "cuadrados" },
    { i: "▲", s: "triángulos" },
    { i: "◆", s: "rombos" }
  ];

  function tokens(count, icon) {
    var html = "";
    for (var i = 0; i < count; i++) html += '<span class="game-token">' + icon + "</span>";
    return html;
  }

  /** Opciones numéricas: la respuesta, distractores dados y relleno cercano. */
  function numChoices(answer, cands, n, min, max, fmt) {
    var out = [answer];
    shuffle(cands).forEach(function (c) {
      if (out.length < n && c !== answer && c >= min && c <= max && out.indexOf(c) === -1) out.push(c);
    });
    var g = 0;
    while (out.length < n && g++ < 80) {
      var c = answer + rnd(1, 4) * (Math.random() < 0.5 ? -1 : 1);
      if (c >= min && c <= max && out.indexOf(c) === -1) out.push(c);
    }
    return shuffle(out).map(function (v) {
      var f = fmt ? fmt(v) : { label: String(v), aria: "Número " + v };
      return { label: f.label, value: v, aria: f.aria };
    });
  }
  function fmtMoney(v) { return { label: "$" + v, aria: v + " unidades de dinero" }; }

  /** Opciones de texto (horas, fracciones). */
  function strChoices(answer, cands, n, ariaFn) {
    var out = [answer];
    shuffle(cands).forEach(function (c) {
      if (out.length < n && out.indexOf(c) === -1) out.push(c);
    });
    return shuffle(out).map(function (v) {
      return { label: v, value: v, aria: ariaFn ? ariaFn(v) : v };
    });
  }

  var STYLE_ID = "discalculia-styles";
  (function injectStyles() {
    if (document.getElementById(STYLE_ID)) return;
    var css = [
      ".game-token{color:var(--g-text)}",
      ".game-shell.is-high-contrast .game-equation{color:var(--g-text)}",
      ".dm-blocks{display:flex;flex-wrap:wrap;gap:14px;justify-content:center;align-items:flex-end}",
      ".dm-col{display:flex;flex-wrap:wrap;gap:4px;align-items:flex-end;justify-content:center;border:3px dashed var(--indecap-border,#DCE4EA);border-radius:12px;padding:10px;max-width:210px}",
      ".dm-hun{display:inline-block;width:46px;height:46px;border:3px solid var(--g-text);background:var(--g-accent-soft);border-radius:4px}",
      ".dm-ten{display:inline-block;width:14px;height:46px;border:2px solid var(--g-text);background:var(--g-accent-soft);border-radius:3px}",
      ".dm-uni{display:inline-block;width:14px;height:14px;border:2px solid var(--g-text);background:var(--g-accent-soft);border-radius:2px}",
      ".dm-receipt{border:3px dashed var(--g-text);border-radius:12px;padding:12px 22px;text-align:left;font-size:1.2rem;color:var(--g-text);min-width:230px}",
      ".dm-receipt p{margin:4px 0}",
      ".dm-coin{display:inline-flex;align-items:center;justify-content:center;width:54px;height:54px;border-radius:50%;border:3px solid var(--g-frame-dark);background:var(--g-accent-soft);color:var(--g-frame-dark);font-weight:700}",
      ".dm-bill{width:88px;height:50px;border-radius:6px}"
    ].join("\n");
    var s = document.createElement("style"); s.id = STYLE_ID; s.textContent = css; document.head.appendChild(s);
  })();

  // ─── Gráficos SVG (usan currentColor: funcionan en alto contraste) ────────
  function rectaSvg(max, step, marker) {
    var x0 = 30, x1 = 490, y = 58;
    function X(v) { return x0 + (x1 - x0) * v / max; }
    var s = '<svg viewBox="0 0 520 110" width="100%" style="max-width:520px;color:var(--g-text)" aria-hidden="true">';
    s += '<line x1="' + x0 + '" y1="' + y + '" x2="' + x1 + '" y2="' + y + '" stroke="currentColor" stroke-width="3"/>';
    for (var v = 0; v <= max; v += step) {
      var anchor = (v === 0 || v === max || v === max / 2);
      var h = anchor ? 14 : 8;
      s += '<line x1="' + X(v).toFixed(1) + '" y1="' + (y - h) + '" x2="' + X(v).toFixed(1) + '" y2="' + (y + h) + '" stroke="currentColor" stroke-width="' + (anchor ? 3 : 2) + '"/>';
      if (anchor) {
        s += '<text x="' + X(v).toFixed(1) + '" y="' + (y + 36) + '" text-anchor="middle" font-size="17" font-weight="700" fill="currentColor">' + v + "</text>";
      }
    }
    var mx = X(marker);
    s += '<path d="M' + mx.toFixed(1) + " " + (y - 6) + " l-9 -20 h18 z\" fill=\"var(--g-accent)\" stroke=\"currentColor\" stroke-width=\"2\"/>";
    return s + "</svg>";
  }

  function relojSvg(h, m) {
    var cx = 100, cy = 100, s = '<svg viewBox="0 0 200 200" width="190" height="190" style="color:var(--g-text)" aria-hidden="true">';
    s += '<circle cx="100" cy="100" r="92" fill="none" stroke="currentColor" stroke-width="4"/>';
    var i, a;
    for (i = 0; i < 60; i++) {
      a = i * 6 * Math.PI / 180;
      var len = i % 5 === 0 ? 8 : 4;
      s += '<line x1="' + (cx + 92 * Math.sin(a)).toFixed(1) + '" y1="' + (cy - 92 * Math.cos(a)).toFixed(1) +
        '" x2="' + (cx + (92 - len) * Math.sin(a)).toFixed(1) + '" y2="' + (cy - (92 - len) * Math.cos(a)).toFixed(1) +
        '" stroke="currentColor" stroke-width="' + (i % 5 === 0 ? 2.5 : 1) + '"/>';
    }
    for (i = 1; i <= 12; i++) {
      a = i * 30 * Math.PI / 180;
      s += '<text x="' + (cx + 70 * Math.sin(a)).toFixed(1) + '" y="' + (cy - 70 * Math.cos(a) + 6).toFixed(1) +
        '" text-anchor="middle" font-size="18" font-weight="700" fill="currentColor">' + i + "</text>";
    }
    function hand(deg, len, w) {
      var r = deg * Math.PI / 180;
      return '<line x1="100" y1="100" x2="' + (cx + len * Math.sin(r)).toFixed(1) + '" y2="' + (cy - len * Math.cos(r)).toFixed(1) +
        '" stroke="currentColor" stroke-width="' + w + '" stroke-linecap="round"/>';
    }
    s += hand(((h % 12) + m / 60) * 30, 42, 7);
    s += hand(m * 6, 66, 4);
    s += '<circle cx="100" cy="100" r="5" fill="currentColor"/>';
    return s + "</svg>";
  }

  function barraSvg(n, k) {
    var W = 300, H = 56, w = W / n;
    var s = '<svg viewBox="0 0 ' + (W + 4) + " " + (H + 4) + '" width="300" style="max-width:100%;color:var(--g-text)" aria-hidden="true">';
    for (var i = 0; i < n; i++) {
      s += '<rect x="' + (2 + i * w).toFixed(1) + '" y="2" width="' + w.toFixed(1) + '" height="' + H +
        '" fill="' + (i < k ? "currentColor" : "none") + '" stroke="currentColor" stroke-width="3"/>';
    }
    return s + "</svg>";
  }

  // ─── Mecánicas (Stage 1 · Base) ────────────────────────────────────────────

  /** Subitización y conteo selectivo: cuántas figuras de un tipo, sin contar una a una. */
  function retoSubitizar(p) {
    var formas = shuffle(FORMAS).slice(0, p.kinds || 1);
    var meta = formas[0], n = rnd(p.min, p.max), items = [], i;
    for (i = 0; i < n; i++) items.push(meta.i);
    if (formas.length > 1) {
      var extra = rnd(p.min, p.max), otras = formas.slice(1);
      for (i = 0; i < extra; i++) items.push(pick(otras).i);
    }
    items = shuffle(items);
    var html = items.map(function (ic) { return '<span class="game-token">' + ic + "</span>"; }).join("");
    var prompt = "¿Cuántos " + meta.s + " " + meta.i + " hay?";
    return {
      skill: "subitizacion", prompt: prompt, speech: prompt,
      visual: '<div class="game-group">' + html + "</div>",
      options: numChoices(n, [n + 1, n - 1, n + 2, n - 2], 4, 1, p.max + 12),
      answer: n, answerLabel: n,
      hint: "Agrúpalos de a dos o de a tres en vez de contar uno por uno.",
      explain: "Hay " + n + " " + meta.s + "."
    };
  }

  /** Comparación de magnitudes entre dos grupos de figuras distintas. */
  function retoComparar(p) {
    var par = shuffle(FORMAS).slice(0, 2), A = par[0], B = par[1];
    var a = rnd(p.min, p.max), b = rnd(p.min, p.max);
    if (Math.random() < 0.2) b = a; else if (b === a) b = a < p.max ? a + 1 : a - 1;
    var resp = a > b ? "mas" : (a < b ? "menos" : "igual");
    var prompt = "¿Hay MÁS, MENOS o IGUAL cantidad de " + A.s + " " + A.i + " (izquierda) que de " + B.s + " " + B.i + " (derecha)?";
    return {
      skill: "comparacion_magnitud", prompt: prompt,
      speech: "¿Hay más, menos o igual cantidad de " + A.s + ", a la izquierda, que de " + B.s + ", a la derecha?",
      visual: '<div class="game-group">' + tokens(a, A.i) + '</div><div class="game-group">' + tokens(b, B.i) + "</div>",
      options: [
        { label: "MÁS", value: "mas", aria: "Más" },
        { label: "IGUAL", value: "igual", aria: "Igual" },
        { label: "MENOS", value: "menos", aria: "Menos" }
      ],
      answer: resp, answerLabel: resp === "mas" ? "MÁS" : (resp === "menos" ? "MENOS" : "IGUAL"),
      hint: "Empareja de a uno: el grupo al que le sobren figuras tiene más.",
      explain: "Hay " + a + " " + A.s + " y " + b + " " + B.s + "."
    };
  }

  /** Comparar números cuyos dígitos son los mismos en distinto orden. */
  function retoCompararNum(p) {
    var nums;
    if (p.digits === 2) {
      var t = rnd(1, 9), u = rnd(1, 9);
      while (u === t) u = rnd(1, 9);
      var c = rnd(10, 99), a = t * 10 + u, b = u * 10 + t;
      while (c === a || c === b) c = rnd(10, 99);
      nums = [a, b, c];
    } else {
      var d = shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9]).slice(0, 3);
      var perms = [[0, 1, 2], [0, 2, 1], [1, 0, 2], [1, 2, 0], [2, 0, 1], [2, 1, 0]];
      nums = shuffle(perms).slice(0, 3).map(function (q) { return d[q[0]] * 100 + d[q[1]] * 10 + d[q[2]]; });
    }
    var mayor = Math.random() < 0.5;
    var ord = nums.slice().sort(function (x, y) { return x - y; });
    var ans = mayor ? ord[2] : ord[0];
    var prompt = "¿Cuál de estos números es el " + (mayor ? "MAYOR" : "MENOR") + "?";
    return {
      skill: "comparacion_numeros", prompt: prompt, speech: prompt, visual: "",
      options: shuffle(nums).map(function (v) { return { label: String(v), value: v, aria: "Número " + v }; }),
      answer: ans, answerLabel: ans,
      hint: p.digits === 2 ? "Compara primero las decenas; si empatan, las unidades." : "Compara de izquierda a derecha: primero las centenas.",
      explain: "El " + (mayor ? "mayor" : "menor") + " es " + ans + "."
    };
  }

  /** Valor posicional: bloques → número, y valor de un dígito. */
  function retoPosicional(p) {
    var modo = pick(p.modes), i;
    if (modo === "digito") {
      var nd = p.hundreds ? 3 : 2;
      var dig = shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9]).slice(0, nd);
      var num = dig.reduce(function (acc, d) { return acc * 10 + d; }, 0);
      var pos = rnd(0, nd - 1), d = dig[pos], k = nd - 1 - pos, val = d * Math.pow(10, k);
      var prompt = "En el número " + num + ", ¿qué valor tiene el dígito " + d + "?";
      return {
        skill: "valor_posicional", prompt: prompt, speech: prompt, visual: '<span class="game-equation">' + num + "</span>",
        options: numChoices(val, [d, d * 10, d * 100, d * 1000], 4, 1, 9000),
        answer: val, answerLabel: val,
        hint: "De derecha a izquierda: unidades, decenas, centenas.",
        explain: "El " + d + " está en el lugar de " + (k === 0 ? "las unidades" : (k === 1 ? "las decenas" : "las centenas")) + ": vale " + val + "."
      };
    }
    var h = p.hundreds ? rnd(1, 3) : 0, t = rnd(p.hundreds ? 0 : 1, 9), u = rnd(0, 9);
    var value = h * 100 + t * 10 + u;
    var html = '<div class="dm-blocks">';
    if (h) { html += '<div class="dm-col">'; for (i = 0; i < h; i++) html += '<span class="dm-hun"></span>'; html += "</div>"; }
    if (t) { html += '<div class="dm-col">'; for (i = 0; i < t; i++) html += '<span class="dm-ten"></span>'; html += "</div>"; }
    if (u) { html += '<div class="dm-col">'; for (i = 0; i < u; i++) html += '<span class="dm-uni"></span>'; html += "</div>"; }
    html += "</div>";
    var leyenda = (h ? "Cada cuadrado grande vale 100, " : "Cada ") + (h ? "cada barra vale 10 " : "barra vale 10 ") +
      "y cada cuadrito vale 1. ¿Qué número forman los bloques?";
    var swapped = h ? h * 100 + u * 10 + t : u * 10 + t;
    return {
      skill: "valor_posicional_bloques", prompt: leyenda, speech: leyenda, visual: html,
      options: numChoices(value, [swapped, value + 10, value - 10, value + 1, value - 1, value + 100, value - 100], 4, 1, 999),
      answer: value, answerLabel: value,
      hint: "Cuenta cada tipo por separado y suma: primero los grandes, luego las barras, luego los cuadritos.",
      explain: (h ? h + " de 100 + " : "") + t + " de 10 + " + u + " de 1 = " + value + "."
    };
  }

  /** Recta numérica: leer la posición de una flecha. */
  function retoRecta(p) {
    var marker, tries = 0;
    do { marker = rnd(1, p.max / p.step - 1) * p.step; tries++; } while (marker === p.max / 2 && tries < 30);
    var prompt = "¿Qué número señala la flecha en la recta?";
    return {
      skill: "recta_numerica", prompt: prompt, speech: prompt,
      visual: rectaSvg(p.max, p.step, marker),
      options: numChoices(marker, [marker + p.step, marker - p.step, marker + 2 * p.step, marker - 2 * p.step], 4, 0, p.max),
      answer: marker, answerLabel: marker,
      hint: "Mira los números marcados y cuenta cuántas rayitas hay hasta la flecha.",
      explain: "La flecha señala el " + marker + "."
    };
  }

  /** Aritmética: suma, resta y número faltante, con llevada. */
  function retoOperar(p) {
    var op = pick(p.ops), a, b, c, res, ans, eq, cands, explain, tries = 0;
    if (op === "suma") {
      do { a = rnd(5, p.max - 5); b = rnd(3, p.max - a); tries++; } while (p.carry && (a % 10) + (b % 10) < 10 && tries < 60);
      res = a + b; ans = res; eq = a + " + " + b + " = ?";
      cands = [res + 1, res - 1, res + 10, res - 10, Math.abs(a - b)];
      explain = a + " más " + b + " es " + res + ".";
    } else if (op === "resta") {
      do { a = rnd(10, p.max); b = rnd(3, a - 1); tries++; } while (p.carry && (a % 10) >= (b % 10) && tries < 60);
      res = a - b; ans = res; eq = a + " − " + b + " = ?";
      cands = [res + 1, res - 1, res + 10, res - 10, a + b];
      explain = a + " menos " + b + " es " + res + ".";
    } else {
      var tipo = rnd(1, 3);
      if (tipo === 1) {
        a = rnd(3, p.max - 6); b = rnd(3, p.max - a); c = a + b; ans = b; eq = a + " + ? = " + c;
        cands = [b + 1, b - 1, c, a, c + a]; explain = "Faltan " + b + ": " + a + " + " + b + " = " + c + ".";
      } else if (tipo === 2) {
        a = rnd(10, p.max); b = rnd(3, a - 2); c = a - b; ans = b; eq = a + " − ? = " + c;
        cands = [b + 1, b - 1, c, a + c, a - 1]; explain = "Se quitaron " + b + ": " + a + " − " + b + " = " + c + ".";
      } else {
        b = rnd(3, 20); c = rnd(3, p.max - b); a = b + c; ans = a; eq = "? − " + b + " = " + c;
        cands = [c, b, a + 1, a - 1, a + 10]; explain = "Había " + a + ": " + a + " − " + b + " = " + c + ".";
      }
    }
    return {
      skill: "aritmetica_" + op, prompt: "Calcula el valor que falta:", speech: "Calcula. " + eq.replace("?", "cuánto").replace("−", "menos").replace("+", "más"),
      visual: '<span class="game-equation">' + eq.replace("?", '<span class="is-blank">?</span>') + "</span>",
      options: numChoices(ans, cands, 4, 0, p.max + 25),
      answer: ans, answerLabel: ans,
      hint: op === "suma" ? "Suma primero las unidades. Si pasan de 9, lleva una decena." :
            (op === "resta" ? "Si las unidades no alcanzan, toma una decena del número de la izquierda." :
            "Piensa en la operación contraria para encontrar el número que falta."),
      explain: explain
    };
  }

  /** Sumar monedas y billetes. */
  function retoMonedas(p) {
    var n = rnd(p.n[0], p.n[1]), vals = [], sum = 0, html = "", i;
    for (i = 0; i < n; i++) { var v = pick(p.coins); vals.push(v); sum += v; }
    vals.sort(function (x, y) { return y - x; });
    vals.forEach(function (v) { html += '<span class="dm-coin' + (v >= 50 ? " dm-bill" : "") + '">' + v + "</span>"; });
    var prompt = "¿Cuánto dinero hay en total sumando estas monedas y billetes?";
    return {
      skill: "dinero_suma", prompt: prompt, speech: prompt,
      visual: '<div class="dm-blocks">' + html + "</div>",
      options: numChoices(sum, [sum + 1, sum - 1, sum + 5, sum - 5, sum + 10, sum - 10], 4, 1, sum + 25, fmtMoney),
      answer: sum, answerLabel: "$" + sum,
      hint: "Empieza por los valores más grandes y ve sumando.",
      explain: "En total hay $" + sum + "."
    };
  }

  /** Calcular el vuelto de una compra. */
  function retoCambio(p) {
    var price = rnd(3, p.priceMax);
    var bills = [10, 20, 50, 100, 200].filter(function (b) { return b > price; });
    var pay = bills[rnd(0, Math.min(1, bills.length - 1))], change = pay - price;
    var prompt = "El total de la compra es $" + price + " y pagas con $" + pay + ". ¿Cuánto te devuelven?";
    return {
      skill: "dinero_cambio", prompt: prompt, speech: prompt,
      visual: '<div class="dm-receipt"><p>Total: <strong>$' + price + "</strong></p><p>Pagas con: <strong>$" + pay + "</strong></p><p>Vuelto: <strong>?</strong></p></div>",
      options: numChoices(change, [change + 1, change - 1, change + 5, change - 5, price, price + pay], 4, 0, pay + price, fmtMoney),
      answer: change, answerLabel: "$" + change,
      hint: "El vuelto es lo que falta para llegar desde el total hasta lo que pagaste.",
      explain: "$" + pay + " − $" + price + " = $" + change + "."
    };
  }

  function horaTxt(h, m) {
    h = ((h - 1 + 12 * 4) % 12) + 1;
    return h + ":" + (m < 10 ? "0" + m : m);
  }

  /** Leer la hora en un reloj de agujas. */
  function retoReloj(p) {
    var h = rnd(1, 12), m = pick(p.minutes), ans = horaTxt(h, m);
    var cands = [horaTxt(h + 1, m), horaTxt(h - 1, m), horaTxt(h, (m + 30) % 60), horaTxt(h, (m + 15) % 60),
                 horaTxt(m === 0 ? 12 : m / 5, (h % 12) * 5)]; // confundir la manecilla corta con la larga
    var prompt = "¿Qué hora marca el reloj?";
    return {
      skill: "lectura_reloj", prompt: prompt, speech: prompt,
      visual: relojSvg(h, m),
      options: strChoices(ans, cands.filter(function (c) { return c !== ans; }), 4, function (v) { return "Hora " + v; }),
      answer: ans, answerLabel: ans,
      hint: "La manecilla corta marca la hora y la larga los minutos. Cada número de la esfera vale 5 minutos.",
      explain: "El reloj marca las " + ans + "."
    };
  }

  /** Duración: a qué hora termina una actividad. */
  function retoTiempo(p) {
    var h = rnd(1, 12), m = pick([0, 15, 30, 45]), dur = pick(p.durations);
    var tot = (h % 12) * 60 + m + dur, hh = Math.floor(tot / 60) % 12 || 12, mm = tot % 60;
    var ans = horaTxt(hh, mm);
    var cands = [horaTxt(hh, (mm + 15) % 60), horaTxt(hh, (mm + 30) % 60), horaTxt(hh + 1, mm), horaTxt(hh - 1, mm), horaTxt(h, (m + dur) % 60)];
    var cosa = pick(["Un turno", "Una reunión", "Un taller", "Una clase"]);
    var prompt = cosa + " empieza a las " + horaTxt(h, m) + " y dura " + dur + " minutos. ¿A qué hora termina?";
    return {
      skill: "duracion_tiempo", prompt: prompt, speech: prompt,
      visual: relojSvg(h, m),
      options: strChoices(ans, cands.filter(function (c) { return c !== ans; }), 4, function (v) { return "Hora " + v; }),
      answer: ans, answerLabel: ans,
      hint: "Suma los minutos por partes: primero hasta la hora en punto y luego el resto.",
      explain: "Termina a las " + ans + "."
    };
  }

  function fr(k, n) { return k + "/" + n; }
  function eqFr(a, b) {
    var x = a.split("/").map(Number), y = b.split("/").map(Number);
    return x[0] * y[1] === y[0] * x[1];
  }
  function validFr(f) { var x = f.split("/").map(Number); return x[0] >= 1 && x[0] < x[1]; }

  /** Fracción de una barra dividida en partes iguales. */
  function retoFraccion(p) {
    var n = pick(p.parts), k = rnd(1, n - 1), ans = fr(k, n);
    var cands = [fr(n - k, n), fr(k, n + 1), fr(k + 1, n), fr(k - 1, n), fr(1, n), fr(k, n + 2)]
      .filter(function (c) { return validFr(c) && !eqFr(c, ans); });
    var prompt = "La barra está dividida en partes iguales. ¿Qué fracción está sombreada?";
    return {
      skill: "fracciones", prompt: prompt, speech: prompt, visual: barraSvg(n, k),
      options: strChoices(ans, cands, 4, function (v) { var x = v.split("/"); return x[0] + " de " + x[1] + " partes"; }),
      answer: ans, answerLabel: ans,
      hint: "Abajo va el total de partes iguales; arriba, cuántas están sombreadas.",
      explain: "Hay " + k + " partes sombreadas de " + n + ": " + ans + "."
    };
  }

  /** Porcentajes básicos y descuentos. */
  function retoPorcentaje(p) {
    var pct = pick(p.pcts), price = pick([20, 40, 60, 80, 100, 120, 200]), modo = pick(p.modes);
    var desc = price * pct / 100, pagar = price - desc;
    var hint = "El 10 % es la décima parte, el 25 % la cuarta parte y el 50 % la mitad.";
    if (modo === "parte") {
      var q1 = "¿Cuánto es el " + pct + " % de " + price + "?";
      return {
        skill: "porcentaje", prompt: q1, speech: "¿Cuánto es el " + pct + " por ciento de " + price + "?",
        visual: '<span class="game-equation">' + pct + " % de " + price + "</span>",
        options: numChoices(desc, [pagar, pct, desc * 2, Math.max(1, desc - 5), desc + 5], 4, 0, price + 20),
        answer: desc, answerLabel: desc, hint: hint, explain: "El " + pct + " % de " + price + " es " + desc + "."
      };
    }
    var q2 = "Un artículo cuesta $" + price + " y tiene " + pct + " % de descuento. ¿Cuánto pagas?";
    return {
      skill: "descuento", prompt: q2, speech: "Un artículo cuesta " + price + " y tiene " + pct + " por ciento de descuento. ¿Cuánto pagas?",
      visual: '<div class="dm-receipt"><p>Precio: <strong>$' + price + "</strong></p><p>Descuento: <strong>" + pct + " %</strong></p><p>Pagas: <strong>?</strong></p></div>",
      options: numChoices(pagar, [desc, price - pct, pagar + 10, pagar - 10, price], 4, 0, price + 20, fmtMoney),
      answer: pagar, answerLabel: "$" + pagar,
      hint: "Primero calcula cuánto es el descuento y luego réstalo del precio.",
      explain: "El descuento es $" + desc + ", así que pagas $" + pagar + "."
    };
  }

  /** Patrones: suma, resta, doble y alternados. */
  function retoPatron(p) {
    var kind = pick(p.kinds), serie, ans, cands, regla, s0, step;
    if (kind === "suma") {
      step = pick(p.steps); s0 = rnd(1, 12);
      serie = [s0, s0 + step, s0 + 2 * step, s0 + 3 * step]; ans = s0 + 4 * step;
      cands = [ans + 1, ans - 1, ans + step, ans - step]; regla = "sube de " + step + " en " + step;
    } else if (kind === "resta") {
      step = pick(p.steps); s0 = rnd(30, 60);
      serie = [s0, s0 - step, s0 - 2 * step, s0 - 3 * step]; ans = s0 - 4 * step;
      cands = [ans + 1, ans - 1, ans + step, ans - step]; regla = "baja de " + step + " en " + step;
    } else if (kind === "doble") {
      s0 = rnd(1, 5); serie = [s0, 2 * s0, 4 * s0, 8 * s0]; ans = 16 * s0;
      cands = [12 * s0, ans + s0, ans - 2, 24 * s0]; regla = "se duplica cada vez";
    } else {
      var a1 = rnd(2, 5), a2 = rnd(1, 4);
      while (a2 === a1) a2 = rnd(1, 4);
      s0 = rnd(1, 8);
      serie = [s0, s0 + a1, s0 + a1 + a2, s0 + 2 * a1 + a2]; ans = s0 + 2 * a1 + 2 * a2;
      cands = [s0 + 3 * a1 + a2, ans + 1, ans - 1, serie[3] + 1]; regla = "suma " + a1 + " y luego " + a2 + ", en ese orden";
    }
    return {
      skill: "patron_" + kind, prompt: "¿Qué número continúa la secuencia?",
      speech: "¿Qué número continúa la secuencia " + serie.join(", ") + "?",
      visual: '<span class="game-equation">' + serie.join("  ·  ") + '  ·  <span class="is-blank">?</span></span>',
      options: numChoices(ans, cands, 4, 0, ans + 30),
      answer: ans, answerLabel: ans,
      hint: "Mira cuánto cambia de un número al siguiente. ¿Es siempre igual?",
      explain: "La secuencia " + regla + "."
    };
  }

  /** Grupos iguales (multiplicación) y reparto (división). */
  function retoGrupos(p) {
    var f = pick(FORMAS), modo = pick(p.modes), i;
    if (modo === "mult") {
      var g = rnd(2, p.maxG), m = rnd(2, p.maxM), tot = g * m, html = "";
      for (i = 0; i < g; i++) html += '<div class="game-group">' + tokens(m, f.i) + "</div>";
      var q = "Hay " + g + " grupos con " + m + " " + f.s + " " + f.i + " cada uno. ¿Cuántas figuras hay en total?";
      return {
        skill: "multiplicacion_grupos", prompt: q, speech: q, visual: html,
        options: numChoices(tot, [g + m, tot + m, tot - m, tot + g, tot - g], 4, 1, tot + 12),
        answer: tot, answerLabel: tot,
        hint: "Suma el mismo número varias veces: " + m + " + " + m + "…",
        explain: g + " grupos de " + m + " son " + tot + "."
      };
    }
    var gr = rnd(2, 5), each = rnd(2, p.maxM), total = gr * each;
    var q2 = "Hay " + total + " " + f.s + " " + f.i + " y se reparten en partes iguales entre " + gr + " grupos. ¿Cuántos quedan en cada grupo?";
    return {
      skill: "division_reparto", prompt: q2, speech: q2,
      visual: '<div class="game-group">' + tokens(total, f.i) + "</div>",
      options: numChoices(each, [gr, total - gr, each + 1, each - 1, total], 4, 1, total),
      answer: each, answerLabel: each,
      hint: "Reparte de a una figura por grupo, en ronda, hasta que no queden.",
      explain: total + " entre " + gr + " es " + each + " en cada grupo."
    };
  }

  var ARTICULOS = [
    { n: "cuadernos", g: "cada uno" }, { n: "boletos", g: "cada uno" }, { n: "lápices", g: "cada uno" },
    { n: "cajas", g: "cada una" }, { n: "bolsas", g: "cada una" }, { n: "tarjetas", g: "cada una" }
  ];

  /** Problema de dos pasos: multiplicar y luego calcular el vuelto. */
  function retoCompra(p) {
    var it = pick(ARTICULOS), q = rnd(2, 5), price = rnd(3, p.priceMax), total = q * price;
    var bills = [20, 50, 100, 200].filter(function (b) { return b > total; });
    var pay = bills.length ? bills[0] : Math.ceil((total + 1) / 50) * 50, change = pay - total;
    var prompt = "Compras " + q + " " + it.n + " de $" + price + " " + it.g + " y pagas con $" + pay + ". ¿Cuánto te devuelven?";
    return {
      skill: "problema_dos_pasos", prompt: prompt, speech: prompt,
      visual: '<div class="dm-receipt"><p>' + q + " × $" + price + " = <strong>?</strong></p><p>Pagas: <strong>$" + pay + "</strong></p><p>Vuelto: <strong>?</strong></p></div>",
      options: numChoices(change, [total, pay - price, change + price, change + 5, change - 5, change + 10], 4, 0, pay, fmtMoney),
      answer: change, answerLabel: "$" + change,
      hint: "Paso 1: calcula el total (" + q + " × " + price + "). Paso 2: réstalo de lo que pagaste.",
      explain: "Total: $" + total + ". Vuelto: $" + pay + " − $" + total + " = $" + change + "."
    };
  }

  /** Estimación: redondear para calcular aproximadamente. */
  function retoEstimar() {
    var a, b, ea, eb, est, tries = 0;
    do {
      a = rnd(12, 98); b = rnd(12, 98);
      ea = Math.round(a / 10) * 10; eb = Math.round(b / 10) * 10; est = ea + eb; tries++;
    } while (Math.abs(a + b - est) > 4 && tries < 200);
    var prompt = "Sin hacer la cuenta exacta, ¿qué resultado se acerca más a " + a + " + " + b + "?";
    return {
      skill: "estimacion", prompt: prompt, speech: prompt,
      visual: '<span class="game-equation">' + a + " + " + b + " ≈ ?</span>",
      options: numChoices(est, [est + 10, est - 10, est + 20, est - 20], 4, 10, 300),
      answer: est, answerLabel: est,
      hint: "Redondea cada número a la decena más cercana y suma.",
      explain: a + " es casi " + ea + " y " + b + " es casi " + eb + ". Suman cerca de " + est + "."
    };
  }

  // ─── Mecánicas nuevas (Stages 2 a 5 · vida adulta, 15-26 años) ─────────────

  var PRODUCTOS_UNIT = [
    { n: "paquetes de hojas de examen", u: "hoja" },
    { n: "botellas de agua", u: "ml" },
    { n: "planes de datos móviles", u: "GB" },
    { n: "cajas de lápices", u: "lápiz" },
    { n: "paquetes de café", u: "gramo" }
  ];

  var ITEMS_PROPORCION = ["boletos de bus", "entradas de cine", "fotocopias", "recargas de celular", "pasajes de metro"];

  var CATEGORIAS_PRESUPUESTO = ["transporte", "comida", "entretenimiento", "materiales de estudio", "ahorro"];

  var TABLAS_LECTURA = [
    { tema: "Precios de transporte", filas: [
      { nombre: "Bus urbano", valor: "$2.500" },
      { nombre: "Bus intermunicipal", valor: "$8.000" },
      { nombre: "Taxi (tarifa base)", valor: "$4.200" },
      { nombre: "Metro", valor: "$2.750" }
    ] },
    { tema: "Planes de datos móviles", filas: [
      { nombre: "Plan Básico (2GB)", valor: "$15.000" },
      { nombre: "Plan Medio (5GB)", valor: "$25.000" },
      { nombre: "Plan Alto (10GB)", valor: "$38.000" },
      { nombre: "Plan Ilimitado", valor: "$55.000" }
    ] },
    { tema: "Horarios de un curso", filas: [
      { nombre: "Grupo A", valor: "7:00 a.m." },
      { nombre: "Grupo B", valor: "9:30 a.m." },
      { nombre: "Grupo C", valor: "2:00 p.m." },
      { nombre: "Grupo D", valor: "4:15 p.m." }
    ] }
  ];

  /** Precio por unidad: comparar dos presentaciones del mismo producto. */
  function retoPrecioUnitario(p) {
    var prod = pick(p.productos);
    var qA = rnd(p.min, p.max), qB = rnd(p.min, p.max);
    while (qB === qA) qB = rnd(p.min, p.max);
    var priceA = rnd(p.priceMin, p.priceMax), priceB = rnd(p.priceMin, p.priceMax);
    var upA = priceA / qA, upB = priceB / qB, tries = 0;
    while (Math.abs(upA - upB) < 0.05 && tries++ < 30) { priceB = rnd(p.priceMin, p.priceMax); upB = priceB / qB; }
    var ans = upA < upB ? "A" : "B";
    var prompt = "¿Cuál presentación de " + prod.n + " es más barata por " + prod.u + "?";
    return {
      skill: "precio_unitario", prompt: prompt, speech: prompt,
      visual: '<div class="dm-receipt"><p>Opción A: ' + qA + " " + prod.u + "(s) — <strong>$" + priceA + "</strong></p><p>Opción B: " + qB + " " + prod.u + "(s) — <strong>$" + priceB + "</strong></p></div>",
      options: [{ label: "Opción A", value: "A", aria: "Opción A" }, { label: "Opción B", value: "B", aria: "Opción B" }],
      answer: ans, answerLabel: "Opción " + ans,
      hint: "Divide el precio entre la cantidad para saber cuánto cuesta cada " + prod.u + ".",
      explain: "Opción A cuesta $" + upA.toFixed(2) + " por " + prod.u + " y Opción B cuesta $" + upB.toFixed(2) + " por " + prod.u + ". La más barata es la Opción " + ans + "."
    };
  }

  /** Propinas: calcular un porcentaje de recargo sobre una cuenta. */
  function retoPropina(p) {
    var cuenta = rnd(p.min, p.max), pct = pick(p.pcts);
    var propina = Math.round(cuenta * pct / 100);
    var prompt = "La cuenta es de $" + cuenta + " y quieres dejar " + pct + " % de propina. ¿Cuánto es la propina?";
    return {
      skill: "propina", prompt: prompt, speech: prompt,
      visual: '<div class="dm-receipt"><p>Cuenta: <strong>$' + cuenta + "</strong></p><p>Propina (" + pct + " %): <strong>?</strong></p></div>",
      options: numChoices(propina, [propina + 5, propina - 5, Math.round(cuenta * (pct + 5) / 100), Math.round(cuenta * (pct - 5) / 100)], 4, 0, cuenta, fmtMoney),
      answer: propina, answerLabel: "$" + propina,
      hint: "El 10 % es la décima parte del total; ajusta desde ahí.",
      explain: "El " + pct + " % de $" + cuenta + " es $" + propina + "."
    };
  }

  /** Presupuesto: cuánto queda de un monto fijo tras repartir entre categorías. */
  function retoPresupuesto(p) {
    var total = pick(p.totales);
    var cats = shuffle(p.categorias).slice(0, 2);
    var a = rnd(p.min, Math.floor(total * 0.35)), b = rnd(p.min, Math.floor(total * 0.35));
    var resto = total - a - b;
    var prompt = "Tienes un presupuesto de $" + total + ". Ya destinaste $" + a + " a " + cats[0] + " y $" + b + " a " + cats[1] + ". ¿Cuánto te queda?";
    return {
      skill: "presupuesto", prompt: prompt, speech: prompt,
      visual: '<div class="dm-receipt"><p>Presupuesto: <strong>$' + total + "</strong></p><p>" + cats[0] + ": <strong>$" + a + "</strong></p><p>" + cats[1] + ": <strong>$" + b + "</strong></p><p>Resto: <strong>?</strong></p></div>",
      options: numChoices(resto, [resto + 10, resto - 10, a + b, total - a], 4, 0, total, fmtMoney),
      answer: resto, answerLabel: "$" + resto,
      hint: "Suma lo ya gastado y réstalo del presupuesto total.",
      explain: "$" + total + " − ($" + a + " + $" + b + ") = $" + resto + "."
    };
  }

  /** Interés simple sobre un ahorro. */
  function retoInteresSimple(p) {
    var capital = pick(p.capitales), tasa = pick(p.tasas), meses = pick(p.meses);
    var interes = Math.round(capital * tasa / 100 * meses);
    var prompt = "Ahorras $" + capital + " con un interés simple del " + tasa + " % mensual. ¿Cuánto interés ganas en " + meses + " mes(es)?";
    return {
      skill: "interes_simple", prompt: prompt, speech: prompt,
      visual: '<div class="dm-receipt"><p>Capital: <strong>$' + capital + "</strong></p><p>Tasa mensual: <strong>" + tasa + " %</strong></p><p>Tiempo: <strong>" + meses + " mes(es)</strong></p></div>",
      options: numChoices(interes, [interes + Math.round(capital * tasa / 100), Math.max(1, interes - Math.round(capital * tasa / 100)), Math.round(capital * tasa / 100), interes + 10], 4, 0, capital, fmtMoney),
      answer: interes, answerLabel: "$" + interes,
      hint: "Interés simple = capital × tasa × tiempo. Calcula el interés de un mes y multiplícalo por los meses.",
      explain: "$" + capital + " × " + tasa + " % × " + meses + " = $" + interes + "."
    };
  }

  /** Promedio de varios valores (calificaciones o gastos). */
  function retoPromedio(p) {
    var n = pick(p.n), vals = [], i;
    for (i = 0; i < n; i++) vals.push(rnd(p.min, p.max));
    var suma = vals.reduce(function (a, b) { return a + b; }, 0);
    var prom = Math.round(suma / n);
    var prompt = "Estos son tus valores: " + vals.join(", ") + ". ¿Cuál es el promedio (redondeado)?";
    return {
      skill: "promedio", prompt: prompt, speech: prompt,
      visual: '<span class="game-equation">(' + vals.join(" + ") + ") / " + n + "</span>",
      options: numChoices(prom, [prom + 1, prom - 1, Math.round(suma / (n - 1)), vals[0]], 4, 0, p.max),
      answer: prom, answerLabel: prom,
      hint: "Suma todos los valores y divide entre cuántos son.",
      explain: "La suma es " + suma + " y hay " + n + " valores: " + suma + " ÷ " + n + " ≈ " + prom + "."
    };
  }

  /** Conversión de unidades cotidianas: tiempo o medidas. */
  function retoConversion(p) {
    var modo = pick(p.modes);
    if (modo === "horas_minutos") {
      var h = rnd(1, 5), extraM = pick([0, 15, 30, 45]), totalMin = h * 60 + extraM;
      var prompt = "¿Cuántos minutos son " + h + " horas y " + extraM + " minutos?";
      return {
        skill: "conversion_tiempo", prompt: prompt, speech: prompt,
        visual: '<span class="game-equation">' + h + "h " + extraM + "min = ? min</span>",
        options: numChoices(totalMin, [totalMin + 10, totalMin - 10, h * 60, extraM], 4, 0, 400),
        answer: totalMin, answerLabel: totalMin,
        hint: "Cada hora tiene 60 minutos; multiplica y suma el resto.",
        explain: h + " horas son " + (h * 60) + " minutos, más " + extraM + " = " + totalMin + " minutos."
      };
    }
    var m = rnd(1, 9), cm = pick([0, 25, 50, 75]), totalCm = m * 100 + cm;
    var prompt2 = "¿Cuántos centímetros son " + m + " metros y " + cm + " centímetros?";
    return {
      skill: "conversion_medida", prompt: prompt2, speech: prompt2,
      visual: '<span class="game-equation">' + m + "m " + cm + "cm = ? cm</span>",
      options: numChoices(totalCm, [totalCm + 10, totalCm - 10, m * 100, cm], 4, 0, 1000),
      answer: totalCm, answerLabel: totalCm,
      hint: "Cada metro tiene 100 centímetros.",
      explain: m + " metros son " + (m * 100) + " cm, más " + cm + " = " + totalCm + " cm."
    };
  }

  /** Regla de tres simple: proporción directa entre cantidad y precio. */
  function retoReglaDeTres(p) {
    var it = pick(p.items), a = rnd(2, 6), pa = rnd(p.priceMin, p.priceMax);
    var b = rnd(a + 1, a + 6), pb = Math.round(pa / a * b);
    var prompt = "Si " + a + " " + it + " cuestan $" + pa + ", ¿cuánto cuestan " + b + " " + it + " al mismo precio por unidad?";
    return {
      skill: "regla_de_tres", prompt: prompt, speech: prompt,
      visual: '<div class="dm-receipt"><p>' + a + " " + it + ": <strong>$" + pa + "</strong></p><p>" + b + " " + it + ": <strong>?</strong></p></div>",
      options: numChoices(pb, [pb + Math.round(pa / a), pb - Math.round(pa / a), pa * b, pa + pb], 4, 0, pb + 50, fmtMoney),
      answer: pb, answerLabel: "$" + pb,
      hint: "Calcula primero cuánto cuesta uno, y luego multiplica por la cantidad nueva.",
      explain: "Uno cuesta $" + Math.round(pa / a) + "; " + b + " cuestan $" + pb + "."
    };
  }

  /** Lectura de una tabla sencilla de precios u horarios. */
  function retoTabla(p) {
    var tabla = pick(p.tablas), elegido = pick(tabla.filas);
    var prompt = "Según la tabla de \"" + tabla.tema + "\", ¿cuál es el valor de \"" + elegido.nombre + "\"?";
    var html = '<div class="dm-receipt"><p><strong>' + tabla.tema + "</strong></p>" +
      tabla.filas.map(function (f) { return "<p>" + f.nombre + ": <strong>" + f.valor + "</strong></p>"; }).join("") + "</div>";
    var distractores = tabla.filas.filter(function (f) { return f !== elegido; }).map(function (f) { return f.valor; });
    return {
      skill: "lectura_tabla", prompt: prompt, speech: prompt, visual: html,
      options: strChoices(elegido.valor, distractores, Math.min(4, distractores.length + 1), function (v) { return v; }),
      answer: elegido.valor, answerLabel: elegido.valor,
      hint: "Busca en la tabla la fila exacta que se pregunta y lee su valor.",
      explain: elegido.nombre + " tiene un valor de " + elegido.valor + " según la tabla."
    };
  }

  // ─── Definición de los niveles (50: 5 Stages de 10 niveles) ───────────────
  var CONSTRUCTORES = {
    subitizar: retoSubitizar, comparar: retoComparar, compararNum: retoCompararNum,
    posicional: retoPosicional, recta: retoRecta, rectaFina: retoRecta,
    operar: retoOperar, monedas: retoMonedas, cambio: retoCambio,
    reloj: retoReloj, relojFino: retoReloj, tiempo: retoTiempo,
    fraccion: retoFraccion, porcentaje: retoPorcentaje, patron: retoPatron,
    grupos: retoGrupos, compra: retoCompra, estimar: retoEstimar,
    precioUnitario: retoPrecioUnitario, propina: retoPropina, presupuesto: retoPresupuesto,
    interesSimple: retoInteresSimple, promedio: retoPromedio, conversion: retoConversion,
    reglaDeTres: retoReglaDeTres, tabla: retoTabla
  };

  var NIVELES = {
    // ══ Stage 1 · Base (1-10): mismo contenido, 10 retos parejos ═════════════
    1: { rounds: 10, mechanics: ["subitizar"], params: { subitizar: { min: 2, max: 6, kinds: 1 } },
         intro: "Stage 1 · Nivel 1 · Ver la cantidad de un vistazo. Aparecen grupos de figuras: elige cuántas hay, sin contarlas una por una." },
    2: { rounds: 10, mechanics: ["subitizar", "comparar"],
         params: { subitizar: { min: 4, max: 9, kinds: 2 }, comparar: { min: 3, max: 9 } },
         intro: "Stage 1 · Nivel 2 · Ahora hay figuras mezcladas: cuenta solo el tipo que se pide. También comparas dos grupos: más, menos o igual." },
    3: { rounds: 10, mechanics: ["compararNum", "posicional"],
         params: { compararNum: { digits: 2 }, posicional: { modes: ["bloques"], hundreds: false } },
         intro: "Stage 1 · Nivel 3 · Números de dos cifras. Compara números con los mismos dígitos y aprende a leer decenas y unidades con bloques." },
    4: { rounds: 10, mechanics: ["recta", "rectaFina"],
         params: { recta: { max: 20, step: 1 }, rectaFina: { max: 100, step: 10 } },
         intro: "Stage 1 · Nivel 4 · La recta numérica. Lee qué número señala la flecha, primero de 0 a 20 y luego de 0 a 100." },
    5: { rounds: 10, mechanics: ["operar", "patron"],
         params: { operar: { ops: ["suma", "resta", "falta"], max: 30, carry: true }, patron: { kinds: ["suma", "resta"], steps: [2, 3, 4, 5] } },
         intro: "Stage 1 · Nivel 5 · Cálculo. Sumas y restas con llevada, el número que falta y secuencias." },
    6: { rounds: 10, mechanics: ["monedas", "cambio"],
         params: { monedas: { coins: [1, 2, 5, 10, 20], n: [3, 5] }, cambio: { priceMax: 90 } },
         intro: "Stage 1 · Nivel 6 · Dinero. Suma monedas y billetes y calcula el vuelto de una compra." },
    7: { rounds: 10, mechanics: ["reloj", "relojFino", "tiempo"],
         params: { reloj: { minutes: [0, 30] }, relojFino: { minutes: [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55] }, tiempo: { durations: [30, 45, 60, 90] } },
         intro: "Stage 1 · Nivel 7 · El tiempo. Lee la hora en un reloj de agujas y calcula cuándo termina una actividad." },
    8: { rounds: 10, mechanics: ["fraccion", "porcentaje"],
         params: { fraccion: { parts: [2, 3, 4, 5, 6, 8] }, porcentaje: { pcts: [10, 25, 50], modes: ["parte", "descuento"] } },
         intro: "Stage 1 · Nivel 8 · Fracciones y porcentajes. Lee fracciones en una barra y calcula descuentos sencillos." },
    9: { rounds: 10, mechanics: ["patron", "grupos", "posicional"],
         params: {
           patron: { kinds: ["suma", "resta", "doble", "alterna"], steps: [3, 4, 6, 7] },
           grupos: { modes: ["mult", "reparto"], maxG: 6, maxM: 7 },
           posicional: { modes: ["bloques", "digito"], hundreds: true }
         },
         intro: "Stage 1 · Nivel 9 · Patrones más complejos, grupos iguales, reparto y números de tres cifras." },
    10: { rounds: 10,
          mechanics: ["compararNum", "posicional", "recta", "operar", "monedas", "reloj", "fraccion", "porcentaje", "compra", "estimar"],
          params: {
            compararNum: { digits: 3 }, posicional: { modes: ["bloques", "digito"], hundreds: true },
            recta: { max: 100, step: 5 }, operar: { ops: ["suma", "resta", "falta"], max: 50, carry: true },
            monedas: { coins: [1, 5, 10, 20, 50], n: [4, 6] }, reloj: { minutes: [0, 15, 30, 45] },
            fraccion: { parts: [2, 3, 4, 5, 6, 8] }, porcentaje: { pcts: [10, 25, 50], modes: ["parte", "descuento"] },
            compra: { priceMax: 25 }, estimar: {}
          },
          intro: "Stage 1 · Nivel 10 · Reto final de la base. Aparece una muestra de todo lo practicado, incluidos problemas de dos pasos y estimación." },

    // ══ Stage 2 · Media (11-20): matemática financiera cotidiana ════════════
    11: { rounds: 10, mechanics: ["operar", "monedas"],
          params: { operar: { ops: ["suma", "resta", "falta"], max: 60, carry: true }, monedas: { coins: [1, 2, 5, 10, 20, 50], n: [4, 6] } },
          intro: "Stage 2 · Nivel 11 · Cálculo con llevada hasta 60 y suma de monedas y billetes." },
    12: { rounds: 10, mechanics: ["precioUnitario", "compararNum"],
          params: { precioUnitario: { productos: PRODUCTOS_UNIT, min: 2, max: 8, priceMin: 4, priceMax: 60 }, compararNum: { digits: 3 } },
          intro: "Stage 2 · Nivel 12 · ¿Cuál presentación conviene más? Compara precio por unidad entre dos opciones." },
    13: { rounds: 10, mechanics: ["cambio", "compra"],
          params: { cambio: { priceMax: 120 }, compra: { priceMax: 20 } },
          intro: "Stage 2 · Nivel 13 · Vueltos en compras cotidianas: calcula cuánto te devuelven." },
    14: { rounds: 10, mechanics: ["propina", "porcentaje"],
          params: { propina: { min: 15, max: 90, pcts: [10, 15, 20] }, porcentaje: { pcts: [10, 25, 50], modes: ["parte", "descuento"] } },
          intro: "Stage 2 · Nivel 14 · Propinas y porcentajes: calcula cuánto dejar según el total de la cuenta." },
    15: { rounds: 10, mechanics: ["recta", "operar"],
          params: { recta: { max: 150, step: 10 }, operar: { ops: ["suma", "resta", "falta"], max: 80, carry: true } },
          intro: "Stage 2 · Nivel 15 · Recta numérica hasta 150 y cálculo con números más grandes." },
    16: { rounds: 10, mechanics: ["presupuesto", "operar"],
          params: { presupuesto: { totales: [80, 100, 150, 200], categorias: CATEGORIAS_PRESUPUESTO, min: 5 }, operar: { ops: ["suma", "resta"], max: 100, carry: true } },
          intro: "Stage 2 · Nivel 16 · Presupuesto: reparte un monto fijo entre gastos sin pasarte." },
    17: { rounds: 10, mechanics: ["fraccion", "grupos"],
          params: { fraccion: { parts: [3, 4, 5, 6, 8] }, grupos: { modes: ["mult", "reparto"], maxG: 7, maxM: 8 } },
          intro: "Stage 2 · Nivel 17 · Fracciones en porciones y reparto en grupos." },
    18: { rounds: 10, mechanics: ["porcentaje", "cambio"],
          params: { porcentaje: { pcts: [10, 15, 20, 25], modes: ["descuento"] }, cambio: { priceMax: 150 } },
          intro: "Stage 2 · Nivel 18 · Descuentos y vueltos combinados." },
    19: { rounds: 10, mechanics: ["reloj", "tiempo"],
          params: { reloj: { minutes: [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55] }, tiempo: { durations: [45, 60, 90, 120] } },
          intro: "Stage 2 · Nivel 19 · Horarios y turnos: calcula cuándo termina una actividad." },
    20: { rounds: 10,
          mechanics: ["operar", "precioUnitario", "propina", "presupuesto", "fraccion", "porcentaje", "reloj", "cambio"],
          params: {
            operar: { ops: ["suma", "resta", "falta"], max: 90, carry: true },
            precioUnitario: { productos: PRODUCTOS_UNIT, min: 2, max: 8, priceMin: 4, priceMax: 60 },
            propina: { min: 15, max: 90, pcts: [10, 15, 20] },
            presupuesto: { totales: [80, 100, 150, 200], categorias: CATEGORIAS_PRESUPUESTO, min: 5 },
            fraccion: { parts: [3, 4, 5, 6, 8] }, porcentaje: { pcts: [10, 15, 20, 25], modes: ["parte", "descuento"] },
            reloj: { minutes: [0, 15, 30, 45] }, cambio: { priceMax: 150 }
          },
          intro: "Stage 2 · Nivel 20 · Reto integrador de la etapa Media: mezcla todo lo practicado." },

    // ══ Stage 3 · Alta (21-30): finanzas personales y datos ═════════════════
    21: { rounds: 10, mechanics: ["compararNum", "posicional"],
          params: { compararNum: { digits: 3 }, posicional: { modes: ["bloques", "digito"], hundreds: true } },
          intro: "Stage 3 · Nivel 21 · Números de tres cifras: comparación y valor posicional." },
    22: { rounds: 10, mechanics: ["interesSimple", "monedas"],
          params: { interesSimple: { capitales: [50, 100, 150, 200], tasas: [1, 2, 3], meses: [1] }, monedas: { coins: [1, 2, 5, 10, 20, 50], n: [4, 6] } },
          intro: "Stage 3 · Nivel 22 · Interés simple: cuánto ganas ahorrando durante un mes." },
    23: { rounds: 10, mechanics: ["promedio", "operar"],
          params: { promedio: { n: [3, 4], min: 40, max: 100 }, operar: { ops: ["suma", "resta", "falta"], max: 120, carry: true } },
          intro: "Stage 3 · Nivel 23 · Promedios: calcula el valor medio de varias calificaciones o gastos." },
    24: { rounds: 10, mechanics: ["conversion", "recta"],
          params: { conversion: { modes: ["horas_minutos", "metros_cm"] }, recta: { max: 200, step: 20 } },
          intro: "Stage 3 · Nivel 24 · Conversión de unidades: horas a minutos y metros a centímetros." },
    25: { rounds: 10, mechanics: ["presupuesto", "porcentaje"],
          params: { presupuesto: { totales: [150, 200, 300, 400], categorias: CATEGORIAS_PRESUPUESTO, min: 10 }, porcentaje: { pcts: [10, 15, 20, 25, 50], modes: ["parte", "descuento"] } },
          intro: "Stage 3 · Nivel 25 · Presupuesto con montos más grandes y varias categorías." },
    26: { rounds: 10, mechanics: ["porcentaje", "cambio"],
          params: { porcentaje: { pcts: [10, 15, 20, 25], modes: ["descuento"] }, cambio: { priceMax: 200 } },
          intro: "Stage 3 · Nivel 26 · Descuentos y recargos combinados sobre precios más altos." },
    27: { rounds: 10, mechanics: ["fraccion", "compararNum"],
          params: { fraccion: { parts: [4, 5, 6, 8, 10] }, compararNum: { digits: 3 } },
          intro: "Stage 3 · Nivel 27 · Fracciones con más partes y comparación de números de tres cifras." },
    28: { rounds: 10, mechanics: ["patron", "operar"],
          params: { patron: { kinds: ["suma", "resta", "doble", "alterna"], steps: [4, 5, 6, 7] }, operar: { ops: ["suma", "resta", "falta"], max: 150, carry: true } },
          intro: "Stage 3 · Nivel 28 · Patrones más exigentes y cálculo con números grandes." },
    29: { rounds: 10, mechanics: ["compra", "presupuesto"],
          params: { compra: { priceMax: 30 }, presupuesto: { totales: [150, 200, 300], categorias: CATEGORIAS_PRESUPUESTO, min: 10 } },
          intro: "Stage 3 · Nivel 29 · Problemas de dos pasos con dinero y presupuesto." },
    30: { rounds: 10,
          mechanics: ["interesSimple", "promedio", "conversion", "presupuesto", "porcentaje", "fraccion", "patron"],
          params: {
            interesSimple: { capitales: [50, 100, 150, 200], tasas: [1, 2, 3], meses: [1, 2] },
            promedio: { n: [3, 4], min: 40, max: 100 },
            conversion: { modes: ["horas_minutos", "metros_cm"] },
            presupuesto: { totales: [150, 200, 300, 400], categorias: CATEGORIAS_PRESUPUESTO, min: 10 },
            porcentaje: { pcts: [10, 15, 20, 25, 50], modes: ["parte", "descuento"] },
            fraccion: { parts: [4, 5, 6, 8, 10] }, patron: { kinds: ["suma", "resta", "doble", "alterna"], steps: [4, 5, 6, 7] }
          },
          intro: "Stage 3 · Nivel 30 · Reto integrador de la etapa Alta: mezcla todo lo practicado." },

    // ══ Stage 4 · Muy Alta (31-40): proporciones y planificación ════════════
    31: { rounds: 10, mechanics: ["reglaDeTres", "precioUnitario"],
          params: { reglaDeTres: { items: ITEMS_PROPORCION, priceMin: 5, priceMax: 40 }, precioUnitario: { productos: PRODUCTOS_UNIT, min: 3, max: 10, priceMin: 6, priceMax: 80 } },
          intro: "Stage 4 · Nivel 31 · Regla de tres simple: si una cantidad cuesta X, ¿cuánto cuesta otra cantidad?" },
    32: { rounds: 10, mechanics: ["interesSimple", "monedas"],
          params: { interesSimple: { capitales: [100, 200, 300, 500], tasas: [1, 2, 3, 4], meses: [2, 3, 4] }, monedas: { coins: [1, 2, 5, 10, 20, 50, 100], n: [5, 7] } },
          intro: "Stage 4 · Nivel 32 · Interés simple a varios meses." },
    33: { rounds: 10, mechanics: ["tabla", "reglaDeTres"],
          params: { tabla: { tablas: TABLAS_LECTURA }, reglaDeTres: { items: ITEMS_PROPORCION, priceMin: 5, priceMax: 40 } },
          intro: "Stage 4 · Nivel 33 · Lectura de tablas de precios y horarios." },
    34: { rounds: 10, mechanics: ["promedio", "conversion"],
          params: { promedio: { n: [4, 5], min: 30, max: 100 }, conversion: { modes: ["horas_minutos", "metros_cm"] } },
          intro: "Stage 4 · Nivel 34 · Promedios con más datos y conversión de unidades." },
    35: { rounds: 10, mechanics: ["recta", "posicional"],
          params: { recta: { max: 1000, step: 50 }, posicional: { modes: ["bloques", "digito"], hundreds: true } },
          intro: "Stage 4 · Nivel 35 · Recta numérica y valor posicional hasta 1000." },
    36: { rounds: 10, mechanics: ["presupuesto", "interesSimple"],
          params: { presupuesto: { totales: [200, 300, 400, 500], categorias: CATEGORIAS_PRESUPUESTO, min: 15 }, interesSimple: { capitales: [100, 200, 300], tasas: [1, 2, 3], meses: [1, 2] } },
          intro: "Stage 4 · Nivel 36 · Presupuesto con una meta de ahorro definida." },
    37: { rounds: 10, mechanics: ["fraccion", "porcentaje"],
          params: { fraccion: { parts: [5, 6, 7, 8, 10] }, porcentaje: { pcts: [10, 15, 20, 25, 50, 75], modes: ["parte", "descuento"] } },
          intro: "Stage 4 · Nivel 37 · Fracciones y porcentajes combinados." },
    38: { rounds: 10, mechanics: ["compra", "cambio", "porcentaje"],
          params: { compra: { priceMax: 35 }, cambio: { priceMax: 250 }, porcentaje: { pcts: [10, 15, 20], modes: ["descuento"] } },
          intro: "Stage 4 · Nivel 38 · Problemas de varios pasos: compra, descuento y vuelto." },
    39: { rounds: 10, mechanics: ["patron", "grupos"],
          params: { patron: { kinds: ["suma", "resta", "doble", "alterna"], steps: [5, 6, 7, 8] }, grupos: { modes: ["mult", "reparto"], maxG: 9, maxM: 9 } },
          intro: "Stage 4 · Nivel 39 · Patrones y secuencias avanzadas." },
    40: { rounds: 10,
          mechanics: ["reglaDeTres", "interesSimple", "tabla", "promedio", "conversion", "presupuesto", "porcentaje", "compra"],
          params: {
            reglaDeTres: { items: ITEMS_PROPORCION, priceMin: 5, priceMax: 40 },
            interesSimple: { capitales: [100, 200, 300, 500], tasas: [1, 2, 3, 4], meses: [2, 3, 4] },
            tabla: { tablas: TABLAS_LECTURA }, promedio: { n: [4, 5], min: 30, max: 100 },
            conversion: { modes: ["horas_minutos", "metros_cm"] },
            presupuesto: { totales: [200, 300, 400, 500], categorias: CATEGORIAS_PRESUPUESTO, min: 15 },
            porcentaje: { pcts: [10, 15, 20, 25, 50, 75], modes: ["parte", "descuento"] }, compra: { priceMax: 35 }
          },
          intro: "Stage 4 · Nivel 40 · Reto integrador de la etapa Muy Alta: mezcla todo lo practicado." },

    // ══ Stage 5 · Súper Difícil (41-50): integración total, mínimo apoyo ════
    41: { rounds: 10, mechanics: ["operar", "precioUnitario", "reglaDeTres"],
          params: { operar: { ops: ["suma", "resta", "falta"], max: 300, carry: true }, precioUnitario: { productos: PRODUCTOS_UNIT, min: 3, max: 12, priceMin: 8, priceMax: 100 }, reglaDeTres: { items: ITEMS_PROPORCION, priceMin: 8, priceMax: 60 } },
          intro: "Stage 5 · Nivel 41 · Cálculo exigente, precio por unidad y proporciones." },
    42: { rounds: 10, mechanics: ["interesSimple", "promedio"],
          params: { interesSimple: { capitales: [200, 400, 600, 800], tasas: [2, 3, 4, 5], meses: [2, 3, 4, 6] }, promedio: { n: [4, 5, 6], min: 30, max: 120 } },
          intro: "Stage 5 · Nivel 42 · Interés simple con montos altos y promedios con más datos." },
    43: { rounds: 10, mechanics: ["presupuesto", "conversion", "tabla"],
          params: { presupuesto: { totales: [300, 400, 500, 600], categorias: CATEGORIAS_PRESUPUESTO, min: 20 }, conversion: { modes: ["horas_minutos", "metros_cm"] }, tabla: { tablas: TABLAS_LECTURA } },
          intro: "Stage 5 · Nivel 43 · Presupuesto, conversión de unidades y lectura de tablas." },
    44: { rounds: 10, mechanics: ["porcentaje", "cambio", "compra"],
          params: { porcentaje: { pcts: [10, 15, 20, 25, 50, 75], modes: ["parte", "descuento"] }, cambio: { priceMax: 300 }, compra: { priceMax: 40 } },
          intro: "Stage 5 · Nivel 44 · Descuentos, vueltos y compras de varios pasos, con precios altos." },
    45: { rounds: 10, mechanics: ["recta", "posicional", "compararNum"],
          params: { recta: { max: 1000, step: 50 }, posicional: { modes: ["bloques", "digito"], hundreds: true }, compararNum: { digits: 3 } },
          intro: "Stage 5 · Nivel 45 · Recta numérica, valor posicional y comparación con números grandes." },
    46: { rounds: 10, mechanics: ["fraccion", "patron", "grupos"],
          params: { fraccion: { parts: [6, 7, 8, 9, 10] }, patron: { kinds: ["suma", "resta", "doble", "alterna"], steps: [6, 7, 8, 9] }, grupos: { modes: ["mult", "reparto"], maxG: 9, maxM: 9 } },
          intro: "Stage 5 · Nivel 46 · Fracciones con más partes, patrones avanzados y grupos." },
    47: { rounds: 10, mechanics: ["reglaDeTres", "propina", "presupuesto"],
          params: { reglaDeTres: { items: ITEMS_PROPORCION, priceMin: 10, priceMax: 70 }, propina: { min: 20, max: 150, pcts: [10, 15, 20] }, presupuesto: { totales: [300, 400, 500, 600], categorias: CATEGORIAS_PRESUPUESTO, min: 20 } },
          intro: "Stage 5 · Nivel 47 · Proporciones, propinas y presupuesto combinados." },
    48: { rounds: 10, mechanics: ["interesSimple", "tabla", "conversion"],
          params: { interesSimple: { capitales: [300, 500, 700, 900], tasas: [2, 3, 4, 5], meses: [3, 4, 6] }, tabla: { tablas: TABLAS_LECTURA }, conversion: { modes: ["horas_minutos", "metros_cm"] } },
          intro: "Stage 5 · Nivel 48 · Interés simple a más plazo, tablas y conversión de unidades." },
    49: { rounds: 10,
          mechanics: ["operar", "porcentaje", "precioUnitario", "reglaDeTres", "promedio", "presupuesto", "conversion", "tabla"],
          params: {
            operar: { ops: ["suma", "resta", "falta"], max: 350, carry: true },
            porcentaje: { pcts: [10, 15, 20, 25, 50, 75], modes: ["parte", "descuento"] },
            precioUnitario: { productos: PRODUCTOS_UNIT, min: 3, max: 12, priceMin: 8, priceMax: 100 },
            reglaDeTres: { items: ITEMS_PROPORCION, priceMin: 10, priceMax: 70 },
            promedio: { n: [4, 5, 6], min: 30, max: 120 },
            presupuesto: { totales: [300, 400, 500, 600], categorias: CATEGORIAS_PRESUPUESTO, min: 20 },
            conversion: { modes: ["horas_minutos", "metros_cm"] }, tabla: { tablas: TABLAS_LECTURA }
          },
          intro: "Stage 5 · Nivel 49 · Mezcla exigente de todas las habilidades financieras practicadas." },
    50: { rounds: 10,
          mechanics: ["compararNum", "posicional", "recta", "operar", "monedas", "cambio", "reloj", "fraccion", "porcentaje", "patron", "grupos", "compra", "estimar", "precioUnitario", "propina", "presupuesto", "interesSimple", "promedio", "conversion", "reglaDeTres", "tabla"],
          params: {
            compararNum: { digits: 3 }, posicional: { modes: ["bloques", "digito"], hundreds: true },
            recta: { max: 1000, step: 50 }, operar: { ops: ["suma", "resta", "falta"], max: 400, carry: true },
            monedas: { coins: [1, 2, 5, 10, 20, 50, 100, 200], n: [6, 8] }, cambio: { priceMax: 300 },
            reloj: { minutes: [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55] },
            fraccion: { parts: [3, 4, 5, 6, 7, 8, 9, 10] },
            porcentaje: { pcts: [10, 20, 25, 50, 75], modes: ["parte", "descuento"] },
            patron: { kinds: ["suma", "resta", "doble", "alterna"], steps: [5, 6, 7, 8, 9] },
            grupos: { modes: ["mult", "reparto"], maxG: 9, maxM: 9 }, compra: { priceMax: 40 }, estimar: {},
            precioUnitario: { productos: PRODUCTOS_UNIT, min: 3, max: 12, priceMin: 8, priceMax: 100 },
            propina: { min: 20, max: 150, pcts: [10, 15, 20] },
            presupuesto: { totales: [300, 400, 500, 600], categorias: CATEGORIAS_PRESUPUESTO, min: 20 },
            interesSimple: { capitales: [300, 500, 700, 900], tasas: [2, 3, 4, 5], meses: [3, 4, 6] },
            promedio: { n: [4, 5, 6], min: 30, max: 120 }, conversion: { modes: ["horas_minutos", "metros_cm"] },
            reglaDeTres: { items: ITEMS_PROPORCION, priceMin: 10, priceMax: 70 }, tabla: { tablas: TABLAS_LECTURA }
          },
          intro: "Stage 5 · Nivel 50 · Reto final del Mercado Espacial: todas las habilidades practicadas, al máximo nivel de exigencia." }
  };

  global.IndecapGame.register({
    slug: "discalculia_mercado",

    getLevel: function (level) {
      var base = NIVELES[level] || NIVELES[1];
      // Se copia la configuración para que un nivel nunca mute a otro.
      return { rounds: base.rounds, mechanics: base.mechanics.slice(), params: base.params, intro: base.intro };
    },

    buildRound: function (cfg, index) {
      var m = cfg.mechanics[index % cfg.mechanics.length];
      return CONSTRUCTORES[m](cfg.params[m] || {});
    }
  });
})(window);
