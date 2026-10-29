/* Ilustraciones propias de los objetos de los juegos.
   Al mostrarse en pantalla, cada emoji se cambia por su dibujo; los datos de los juegos no cambian.
   Si un emoji no tiene dibujo, se deja como está. */
(function () {
  "use strict";

  var NAVY = "#1A3A6B", INDIGO = "#312783", GOLD = "#F5C77A", OCRE = "#B8860B", CORAL = "#E07A5F",
      TEAL = "#2F8F83", SKY = "#9DB8D9", LIGHT = "#E8EEF6", CREAM = "#FFF8EC", RED = "#D9534F",
      GREEN = "#4E9F5C", BROWN = "#8B5A2B", SKIN = "#D9A27E", INK = "#171C1E", WHITE = "#FFFFFF",
      GREY = "#8F9BA6", TAN = "#E0A458";

  function c(x, y, r, f, extra) { return '<circle cx="' + x + '" cy="' + y + '" r="' + r + '" fill="' + f + '"' + (extra || "") + "/>"; }
  function r(x, y, w, h, rx, f, extra) { return '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" rx="' + rx + '" fill="' + f + '"' + (extra || "") + "/>"; }
  function p(d, f, extra) { return '<path d="' + d + '" fill="' + f + '"' + (extra || "") + "/>"; }
  function s(d, col, w) { return '<path d="' + d + '" fill="none" stroke="' + col + '" stroke-width="' + (w || 3) + '" stroke-linecap="round" stroke-linejoin="round"/>'; }

  // Cara de persona o de emoción.
  function cara(fondo, boca, ojos, extra) {
    var o = ojos || (c(17, 21, 2.6, INK) + c(31, 21, 2.6, INK));
    return c(24, 24, 20, fondo) + o + boca + (extra || "");
  }
  // Persona de medio cuerpo.
  function persona(camisa, pelo, extra) {
    return p("M8 46c0-10 7-16 16-16s16 6 16 16z", camisa) + c(24, 18, 10, SKIN) + p(pelo, INK) + (extra || "");
  }
  var PELO_CORTO = "M14 17c0-8 5-11 10-11s10 3 10 11c-2-4-6-5-10-5s-8 1-10 5z";
  var PELO_LARGO = "M13 20c-1-10 4-14 11-14s12 4 11 14v8c-2-6-3-12-11-13-8 1-9 7-11 13z";

  var D = {
    // Transporte y lugares
    "🚌": ["bus", r(6, 8, 36, 28, 6, GOLD) + r(10, 12, 13, 10, 2, SKY) + r(25, 12, 13, 10, 2, SKY) + r(6, 27, 36, 3, 0, TAN) + c(14, 38, 4.5, NAVY) + c(34, 38, 4.5, NAVY)],
    "🚲": ["bicicleta", s("M14 32l7-13h11l5 13M21 19l6 13h-13M32 19l-5 13", CORAL) + '<circle cx="12" cy="32" r="8" fill="none" stroke="' + NAVY + '" stroke-width="3"/><circle cx="37" cy="32" r="8" fill="none" stroke="' + NAVY + '" stroke-width="3"/>' + s("M18 16h6M31 17l4-1", NAVY)],
    "🛵": ["moto", p("M10 30c2-8 10-10 18-10h8l3 10z", CORAL) + r(24, 12, 4, 10, 2, NAVY) + s("M26 12h7", NAVY) + c(12, 34, 6, NAVY) + c(12, 34, 2.5, GREY) + c(37, 34, 6, NAVY) + c(37, 34, 2.5, GREY)],
    "🚇": ["metro", r(9, 6, 30, 32, 8, SKY) + r(13, 11, 22, 10, 3, NAVY) + c(17, 29, 3, GOLD) + c(31, 29, 3, GOLD) + s("M14 38l-4 6M34 38l4 6", NAVY)],
    "🚕": ["taxi", p("M6 30l5-11c1-2 3-3 5-3h16c2 0 4 1 5 3l5 11v6H6z", GOLD) + r(19, 10, 10, 5, 2, NAVY) + r(14, 20, 20, 7, 2, SKY) + c(14, 37, 4.5, NAVY) + c(34, 37, 4.5, NAVY)],
    "🚗": ["carro", p("M6 30l5-11c1-2 3-3 5-3h16c2 0 4 1 5 3l5 11v6H6z", CORAL) + r(14, 20, 20, 7, 2, SKY) + c(14, 37, 4.5, NAVY) + c(34, 37, 4.5, NAVY)],
    "🚚": ["camión", r(4, 12, 26, 22, 3, SKY) + p("M30 18h8l6 8v8H30z", CORAL) + r(33, 20, 6, 6, 1, LIGHT) + c(12, 36, 4.5, NAVY) + c(36, 36, 4.5, NAVY)],
    "✈️": ["avión", p("M4 28l40-14-6 8-10 4-4 12-4-10-14 4z", SKY) + p("M24 26l-4 10 4-2z", NAVY)],
    "🚀": ["cohete", p("M24 4c8 6 10 16 8 26H16c-2-10 0-20 8-26z", LIGHT) + c(24, 18, 4, SKY) + p("M16 24l-6 10h7zM32 24l6 10h-7z", CORAL) + p("M19 32h10l-5 10z", GOLD)],
    "🛰️": ["satélite", r(18, 18, 12, 12, 2, GREY) + r(4, 20, 12, 8, 1, SKY) + r(32, 20, 12, 8, 1, SKY) + s("M16 24h2M30 24h2M24 18v-6", NAVY) + c(24, 10, 3, GOLD)],
    "🛸": ["nave", p("M6 28c4-4 10-6 18-6s14 2 18 6c-4 4-10 5-18 5S10 32 6 28z", GREY) + p("M15 24c0-6 4-10 9-10s9 4 9 10z", SKY) + c(14, 29, 2, GOLD) + c(24, 30, 2, GOLD) + c(34, 29, 2, GOLD)],
    "☄️": ["cometa", c(32, 16, 8, GOLD) + p("M26 20L6 40l4-10-6 2 16-16z", CORAL)],
    "🪐": ["planeta", c(24, 24, 12, CORAL) + '<ellipse cx="24" cy="24" rx="21" ry="6" fill="none" stroke="' + GOLD + '" stroke-width="3" transform="rotate(-20 24 24)"/>'],
    "🏠": ["casa", r(10, 22, 28, 20, 2, CREAM, ' stroke="#E0C9A6" stroke-width="2"') + p("M5 24L24 7l19 17z", CORAL) + r(20, 29, 8, 13, 1, NAVY) + r(12, 27, 6, 6, 1, SKY) + r(31, 27, 5, 6, 1, SKY)],
    "🏢": ["oficina", r(10, 6, 28, 38, 2, SKY) + r(14, 10, 6, 5, 1, LIGHT) + r(28, 10, 6, 5, 1, LIGHT) + r(14, 19, 6, 5, 1, LIGHT) + r(28, 19, 6, 5, 1, LIGHT) + r(14, 28, 6, 5, 1, LIGHT) + r(28, 28, 6, 5, 1, LIGHT) + r(21, 36, 6, 8, 1, NAVY)],
    "🏫": ["colegio", r(6, 20, 36, 22, 2, CREAM, ' stroke="#E0C9A6" stroke-width="2"') + p("M4 22L24 8l20 14z", NAVY) + c(24, 18, 3, GOLD) + r(20, 30, 8, 12, 1, CORAL) + r(9, 26, 7, 6, 1, SKY) + r(32, 26, 7, 6, 1, SKY)],
    "🏥": ["hospital", r(8, 10, 32, 32, 3, LIGHT, ' stroke="' + SKY + '" stroke-width="2"') + r(20, 16, 8, 18, 1, RED) + r(15, 21, 18, 8, 1, RED) + r(20, 36, 8, 6, 1, NAVY)],
    "🏦": ["banco", p("M4 18L24 6l20 12z", NAVY) + r(6, 18, 36, 3, 0, NAVY) + r(9, 22, 4, 14, 1, SKY) + r(17, 22, 4, 14, 1, SKY) + r(27, 22, 4, 14, 1, SKY) + r(35, 22, 4, 14, 1, SKY) + r(5, 36, 38, 5, 1, NAVY)],
    "🏪": ["tienda", r(8, 18, 32, 24, 2, CREAM, ' stroke="#E0C9A6" stroke-width="2"') + p("M5 18l4-10h30l4 10c0 3-3 4-5 4s-4-1-5-4c-1 3-3 4-5 4s-4-1-4-4c-1 3-3 4-5 4s-4-1-5-4c-1 3-3 4-5 4s-4-1-4-4z", CORAL) + r(12, 27, 10, 15, 1, NAVY) + r(26, 27, 10, 8, 1, SKY)],
    "🏛️": ["gobierno", p("M4 16L24 5l20 11z", GREY) + r(8, 18, 4, 18, 1, LIGHT, ' stroke="' + GREY + '"') + r(18, 18, 4, 18, 1, LIGHT, ' stroke="' + GREY + '"') + r(26, 18, 4, 18, 1, LIGHT, ' stroke="' + GREY + '"') + r(36, 18, 4, 18, 1, LIGHT, ' stroke="' + GREY + '"') + r(5, 37, 38, 5, 1, GREY)],
    "🏗️": ["construcción", s("M10 44V8h26M10 12h22v6", GOLD, 4) + s("M30 18v10", NAVY, 2) + r(26, 28, 8, 6, 1, CORAL) + r(4, 40, 16, 4, 1, GREY)],
    "🏧": ["cajero", r(10, 6, 28, 36, 4, SKY) + r(14, 10, 20, 12, 2, NAVY) + r(16, 26, 16, 3, 1, INK) + r(14, 32, 4, 3, 1, LIGHT) + r(22, 32, 4, 3, 1, LIGHT) + r(30, 32, 4, 3, 1, LIGHT)],
    "🚪": ["puerta", r(12, 4, 24, 40, 3, BROWN) + r(15, 7, 18, 16, 2, TAN) + c(31, 27, 2, GOLD)],
    "🪟": ["ventana", r(8, 8, 32, 32, 3, WHITE, ' stroke="' + NAVY + '" stroke-width="3"') + s("M24 8v32M8 24h32", NAVY) + p("M11 11h11v11H11z", SKY) + p("M26 26h11v11H26z", SKY)],
    "🚏": ["paradero", s("M24 44V16", GREY, 3) + r(14, 4, 20, 14, 3, TEAL) + r(18, 8, 12, 6, 1, WHITE)],
    "🚦": ["semáforo", r(16, 2, 16, 36, 5, NAVY) + c(24, 10, 4, RED) + c(24, 20, 4, GOLD) + c(24, 30, 4, GREEN) + r(22, 38, 4, 8, 1, GREY)],
    "🛑": ["pare", p("M17 4h14l10 10v14L31 38H17L7 28V14z", RED) + r(13, 18, 22, 6, 2, WHITE)],
    "🚸": ["cruce", p("M24 4l20 36H4z", GOLD) + c(24, 18, 3, INK) + s("M24 22v8l-4 6M24 30l4 6", INK)],

    // Dinero y trámites
    "💳": ["tarjeta", r(4, 12, 40, 26, 4, INDIGO) + r(4, 18, 40, 5, 0, INK) + r(9, 28, 9, 6, 1, GOLD) + r(24, 30, 14, 3, 1, SKY)],
    "💵": ["billete", r(4, 12, 40, 24, 3, "#9ED3B2") + r(8, 16, 32, 16, 2, "none", ' stroke="#2F6B3A" stroke-width="1.5"') + c(24, 24, 7, WHITE) + '<text x="24" y="28.5" text-anchor="middle" font-family="Montserrat, sans-serif" font-size="12" font-weight="700" fill="#2F6B3A">$</text>'],
    "💰": ["dinero", p("M17 14c-6 6-11 12-11 19 0 8 8 11 18 11s18-3 18-11c0-7-5-13-11-19z", TAN) + p("M17 14l-3-8h20l-3 8z", OCRE) + c(24, 30, 7, GOLD) + '<text x="24" y="34" text-anchor="middle" font-family="Montserrat, sans-serif" font-size="11" font-weight="700" fill="' + OCRE + '">$</text>'],
    "💸": ["gasto", r(4, 16, 30, 18, 3, "#9ED3B2") + c(19, 25, 5, WHITE) + p("M36 10l6-4-2 8z", SKY) + p("M36 20l8-2-4 7z", SKY)],
    "🪙": ["moneda", c(24, 24, 18, GOLD) + c(24, 24, 13, "none", ' stroke="' + OCRE + '" stroke-width="2.5"') + '<text x="24" y="29" text-anchor="middle" font-family="Montserrat, sans-serif" font-size="14" font-weight="700" fill="' + OCRE + '">$</text>'],
    "👛": ["billetera", r(5, 14, 38, 26, 5, CORAL) + r(28, 22, 15, 10, 4, "#C2553A") + c(34, 27, 2.5, GOLD)],
    "🐷": ["alcancía", '<ellipse cx="24" cy="27" rx="17" ry="13" fill="#F4A9A0"/>' + p("M14 16l2-8 6 6z", "#F4A9A0") + c(16, 24, 2, INK) + '<ellipse cx="40" cy="27" rx="4" ry="5" fill="#E58C82"/>' + r(20, 13, 9, 3, 1, "#C2553A") + r(14, 37, 5, 6, 2, "#F4A9A0") + r(29, 37, 5, 6, 2, "#F4A9A0")],
    "🧾": ["factura", p("M10 4h28v40l-5-3-5 3-4-3-5 3-4-3-5 3z", WHITE, ' stroke="' + SKY + '" stroke-width="2"') + s("M16 13h16M16 20h16M16 27h10", SKY) + r(26, 32, 7, 4, 1, GOLD)],
    "📄": ["documento", p("M10 4h20l8 8v32H10z", WHITE, ' stroke="' + SKY + '" stroke-width="2"') + p("M30 4v8h8", LIGHT) + s("M16 20h16M16 27h16M16 34h10", SKY)],
    "📑": ["certificado", r(12, 8, 26, 34, 2, LIGHT) + p("M8 4h22l6 6v30H8z", WHITE, ' stroke="' + SKY + '" stroke-width="2"') + s("M13 16h16M13 23h16", SKY) + c(26, 33, 4, GOLD)],
    "📜": ["certificado", r(10, 8, 28, 32, 2, CREAM, ' stroke="' + TAN + '" stroke-width="2"') + c(10, 10, 4, TAN) + c(38, 38, 4, TAN) + s("M16 16h16M16 23h16M16 30h10", TAN)],
    "📋": ["hoja de vida", r(9, 7, 30, 37, 3, TAN) + r(12, 11, 24, 30, 2, WHITE) + r(18, 4, 12, 7, 2, GREY) + s("M16 19h16M16 26h16M16 33h10", SKY)],
    "📝": ["lista", p("M10 4h22l6 6v34H10z", WHITE, ' stroke="' + SKY + '" stroke-width="2"') + s("M15 16h14M15 23h14M15 30h8", SKY) + p("M30 34l10-14 4 3-10 14-5 1z", GOLD)],
    "🗂️": ["carpeta", p("M4 12h14l4 4h22v24H4z", OCRE) + r(4, 18, 40, 22, 2, GOLD)],
    "🪪": ["documento de identidad", r(4, 10, 40, 28, 4, SKY) + c(15, 22, 5, SKIN) + p("M8 32c1-5 4-7 7-7s6 2 7 7z", NAVY) + s("M26 19h12M26 25h12M26 31h8", WHITE)],
    "✉️": ["correo", r(4, 10, 40, 28, 3, WHITE, ' stroke="' + NAVY + '" stroke-width="2.5"') + s("M5 12l19 14 19-14", NAVY, 2.5)],
    "📧": ["correo", r(4, 10, 40, 28, 3, WHITE, ' stroke="' + NAVY + '" stroke-width="2.5"') + s("M5 12l19 14 19-14", NAVY, 2.5) + c(38, 12, 6, CORAL)],
    "📨": ["mensaje enviado", r(10, 12, 34, 24, 3, WHITE, ' stroke="' + NAVY + '" stroke-width="2.5"') + s("M11 14l16 12 16-12", NAVY, 2.5) + s("M2 18h6M4 26h4M2 34h6", SKY)],
    "📬": ["buzón", r(8, 16, 30, 18, 9, SKY) + r(20, 34, 4, 10, 1, GREY) + s("M32 16V6h8v5h-8", CORAL, 2.5)],
    "🖊️": ["esfero", p("M34 6l8 8-22 22-10 2 2-10z", NAVY) + p("M12 28l8 8-10 2z", GOLD)],
    "✏️": ["lápiz", p("M34 6l8 8-22 22-10 2 2-10z", GOLD) + p("M12 28l8 8-10 2z", CREAM) + p("M30 10l8 8 4-4-8-8z", CORAL)],
    "✍️": ["firmar", s("M6 38c6-8 10 2 14-4s6-2 8 2", NAVY) + p("M30 10l8 8-12 12-8 2 2-8z", GOLD)],
    "📊": ["gráfica", r(6, 6, 36, 36, 4, WHITE, ' stroke="' + SKY + '" stroke-width="2"') + r(12, 24, 6, 12, 1, SKY) + r(21, 16, 6, 20, 1, NAVY) + r(30, 20, 6, 16, 1, GOLD)],
    "📅": ["calendario", r(6, 8, 36, 34, 4, WHITE, ' stroke="' + SKY + '" stroke-width="2"') + r(6, 8, 36, 10, 4, CORAL) + s("M15 5v7M33 5v7", NAVY) + r(13, 24, 6, 5, 1, SKY) + r(21, 24, 6, 5, 1, SKY) + r(29, 24, 6, 5, 1, NAVY) + r(13, 32, 6, 5, 1, SKY)],
    "🗓️": ["calendario", r(6, 8, 36, 34, 4, WHITE, ' stroke="' + SKY + '" stroke-width="2"') + r(6, 8, 36, 10, 4, NAVY) + s("M15 5v7M33 5v7", INK) + r(13, 24, 6, 5, 1, SKY) + r(21, 24, 6, 5, 1, GOLD) + r(29, 24, 6, 5, 1, SKY) + r(13, 32, 6, 5, 1, SKY)],
    "📆": ["horario", r(6, 8, 36, 34, 4, WHITE, ' stroke="' + SKY + '" stroke-width="2"') + r(6, 8, 36, 10, 4, TEAL) + s("M12 25h24M12 32h24", SKY) + r(20, 22, 8, 6, 1, GOLD)],
    "📌": ["chinche", c(24, 16, 10, RED) + s("M24 26v18", GREY)],
    "🔖": ["marcador", p("M14 4h20v40l-10-8-10 8z", CORAL)],
    "📖": ["libro abierto", p("M4 10c8-2 14 0 20 4 6-4 12-6 20-4v28c-8-2-14 0-20 4-6-4-12-6-20-4z", WHITE, ' stroke="' + NAVY + '" stroke-width="2.5"') + s("M24 14v28", NAVY, 2)],
    "📚": ["libros", r(6, 10, 9, 32, 2, CORAL) + r(16, 6, 9, 36, 2, NAVY) + r(26, 12, 9, 30, 2, TEAL) + r(35, 14, 7, 28, 2, GOLD, ' transform="rotate(8 38 28)"')],
    "🎓": ["graduación", p("M2 18L24 8l22 10-22 10z", NAVY) + p("M12 23v9c4 4 20 4 24 0v-9l-12 5z", INDIGO) + s("M42 19v12", GOLD)],
    "🧮": ["contabilidad", r(6, 6, 36, 36, 3, BROWN) + s("M10 15h28M10 24h28M10 33h28", TAN, 2) + c(14, 15, 3, CORAL) + c(20, 15, 3, CORAL) + c(30, 24, 3, TEAL) + c(16, 33, 3, GOLD) + c(22, 33, 3, GOLD) + c(28, 33, 3, GOLD)],
    "⚖️": ["balanza", s("M24 6v34M10 12h28M16 42h16", NAVY) + p("M4 26l6-14 6 14c0 3-3 5-6 5s-6-2-6-5z", GOLD) + p("M32 26l6-14 6 14c0 3-3 5-6 5s-6-2-6-5z", GOLD)],
    "🎫": ["tiquete", p("M4 14h40v7a3 3 0 0 0 0 6v7H4v-7a3 3 0 0 0 0-6z", GOLD) + s("M30 14v20", OCRE, 2) + s("M10 21h14M10 27h10", OCRE, 2)],
    "🔢": ["clave", r(6, 6, 36, 36, 6, NAVY) + '<text x="24" y="31" text-anchor="middle" font-family="Montserrat, sans-serif" font-size="15" font-weight="700" fill="' + WHITE + '">123</text>'],

    // Tecnología y servicios
    "📱": ["celular", r(14, 4, 20, 40, 5, NAVY) + r(17, 9, 14, 28, 2, SKY) + c(24, 40, 1.6, SKY)],
    "📲": ["celular", r(18, 4, 20, 40, 5, NAVY) + r(21, 9, 14, 28, 2, SKY) + s("M4 24h10M10 19l5 5-5 5", CORAL)],
    "📵": ["sin celular", r(14, 4, 20, 40, 5, NAVY) + r(17, 9, 14, 28, 2, SKY) + c(24, 24, 18, "none", ' stroke="' + RED + '" stroke-width="3.5"') + s("M11 11l26 26", RED, 3.5)],
    "📳": ["celular en vibración", r(14, 4, 20, 40, 5, NAVY) + r(17, 9, 14, 28, 2, SKY) + s("M8 16v16M4 20v8M40 16v16M44 20v8", CORAL)],
    "📞": ["teléfono", p("M12 6l7 2 2 9-5 3c2 5 6 9 11 11l3-5 9 2 2 7c0 4-3 7-7 6C20 39 9 28 6 14c-1-4 2-8 6-8z", TEAL)],
    "💻": ["computador", r(8, 8, 32, 22, 3, NAVY) + r(11, 11, 26, 16, 1, SKY) + p("M3 32h42l-3 6H6z", GREY)],
    "🖨️": ["impresora", r(12, 4, 24, 12, 1, WHITE, ' stroke="' + GREY + '" stroke-width="2"') + r(4, 14, 40, 18, 4, GREY) + r(12, 26, 24, 16, 1, WHITE, ' stroke="' + GREY + '" stroke-width="2"') + c(37, 20, 2, GOLD)],
    "📺": ["televisor", r(4, 8, 40, 28, 4, NAVY) + r(8, 12, 32, 20, 2, SKY) + s("M18 42h12M24 36v6", NAVY)],
    "📹": ["cámara de video", r(4, 14, 28, 20, 4, NAVY) + p("M32 20l12-6v20l-12-6z", GREY) + c(12, 20, 2.5, RED)],
    "🎧": ["audífonos", s("M8 30v-6a16 16 0 0 1 32 0v6", NAVY, 4) + r(5, 26, 9, 15, 4, CORAL) + r(34, 26, 9, 15, 4, CORAL)],
    "🎮": ["videojuego", p("M12 14h24c6 0 9 6 9 14 0 6-3 10-7 8l-6-6H16l-6 6c-4 2-7-2-7-8 0-8 3-14 9-14z", INDIGO) + s("M13 23v8M9 27h8", WHITE) + c(33, 24, 2.5, GOLD) + c(37, 29, 2.5, CORAL)],
    "🔌": ["cargador", r(14, 14, 20, 16, 4, GREY) + s("M19 14V5M29 14V5", NAVY, 3) + s("M24 30v8c0 4 4 6 8 6h8", NAVY)],
    "🔋": ["batería", r(6, 14, 34, 20, 4, NAVY) + r(40, 20, 4, 8, 1, NAVY) + r(9, 17, 28, 14, 2, GREEN)],
    "🪫": ["batería baja", r(6, 14, 34, 20, 4, NAVY) + r(40, 20, 4, 8, 1, NAVY) + r(9, 17, 7, 14, 2, RED)],
    "📶": ["internet", r(8, 32, 6, 10, 1, TEAL) + r(17, 24, 6, 18, 1, TEAL) + r(26, 16, 6, 26, 1, TEAL) + r(35, 8, 6, 34, 1, TEAL)],
    "💡": ["bombillo", p("M24 4c9 0 15 6 15 14 0 6-4 9-6 13v4H15v-4c-2-4-6-7-6-13 0-8 6-14 15-14z", GOLD) + r(16, 35, 16, 4, 1, GREY) + r(18, 40, 12, 4, 2, GREY)],
    "🔦": ["linterna", r(4, 18, 26, 12, 3, NAVY) + p("M30 16l10-6v28l-10-6z", GREY) + p("M40 12l6-4v32l-6-4z", GOLD, ' opacity="0.7"')],
    "🔔": ["campana", p("M24 6c8 0 13 6 13 14v10l4 6H7l4-6V20c0-8 5-14 13-14z", GOLD) + c(24, 40, 4, OCRE)],
    "🔊": ["sonido", p("M6 18h8l10-8v28l-10-8H6z", NAVY) + s("M30 18a8 8 0 0 1 0 12M35 13a15 15 0 0 1 0 22", TEAL)],
    "⚡": ["energía", p("M28 2L10 28h12l-4 18 20-28H26z", GOLD)],
    "🔥": ["fuego", p("M24 4c4 8 14 12 14 24 0 9-6 16-14 16S10 37 10 28c0-6 3-10 6-12 0 5 2 7 4 8-1-8 1-14 4-20z", CORAL) + p("M24 26c3 4 6 6 6 11 0 4-3 7-6 7s-6-3-6-7c0-3 2-5 3-6 0 2 1 3 2 3 0-3 0-5 1-8z", GOLD)],
    "🚰": ["agua de la llave", s("M8 14h20v6", GREY, 5) + r(4, 10, 6, 10, 2, NAVY) + p("M28 26c3 4 5 7 5 10a5 5 0 0 1-10 0c0-3 2-6 5-10z", SKY)],
    "💧": ["agua", p("M24 4c8 11 14 19 14 26a14 14 0 0 1-28 0c0-7 6-15 14-26z", SKY) + s("M17 30c0 4 3 7 6 7", WHITE)],
    "🛠️": ["herramientas", s("M10 38l18-18", GREY, 5) + p("M28 8a8 8 0 0 1 11 11l-5-1-2-2-1-5z", GREY) + s("M36 38L18 20", BROWN, 5) + r(8, 8, 10, 6, 2, NAVY, ' transform="rotate(45 13 11)"')],
    "⚠️": ["precaución", p("M24 4l20 36H4z", GOLD) + r(22, 16, 4, 12, 2, INK) + c(24, 34, 2.5, INK)],
    "🧯": ["extintor", r(14, 12, 18, 32, 5, RED) + r(18, 6, 8, 7, 1, NAVY) + s("M26 9h10l4 6", NAVY) + r(17, 22, 12, 8, 1, WHITE)],
    "🚨": ["alarma", p("M12 34v-10a12 12 0 0 1 24 0v10z", RED) + r(8, 34, 32, 8, 2, NAVY) + s("M24 4v5M8 10l4 4M40 10l-4 4", GOLD)],
    "🔑": ["llave", c(15, 24, 9, GOLD) + c(15, 24, 3.5, WHITE) + r(22, 22, 22, 5, 2, GOLD) + r(36, 26, 4, 7, 1, GOLD) + r(30, 26, 4, 5, 1, GOLD)],
    "🔎": ["buscar", c(20, 20, 12, SKY, ' stroke="' + NAVY + '" stroke-width="4"') + s("M29 29l13 13", NAVY, 6)],
    "⏰": ["despertador", c(12, 10, 5, GOLD) + c(36, 10, 5, GOLD) + c(24, 26, 16, WHITE, ' stroke="' + INDIGO + '" stroke-width="3.5"') + s("M24 26V17M24 26l7 4", INDIGO) + s("M14 42l-3 4M34 42l3 4", INDIGO)],
    "⏳": ["reloj de arena", r(10, 4, 28, 4, 2, BROWN) + r(10, 40, 28, 4, 2, BROWN) + p("M13 8h22c0 8-6 12-9 16 3 4 9 8 9 16H13c0-8 6-12 9-16-3-4-9-8-9-16z", SKY) + p("M17 40c1-5 4-8 7-10 3 2 6 5 7 10z", GOLD)],
    "⏱️": ["cronómetro", c(24, 27, 17, WHITE, ' stroke="' + NAVY + '" stroke-width="3.5"') + r(20, 2, 8, 5, 1, NAVY) + s("M24 27V17", CORAL)],
    "⏲️": ["temporizador", c(24, 26, 17, WHITE, ' stroke="' + NAVY + '" stroke-width="3.5"') + p("M24 26V12a14 14 0 0 1 12 7z", GOLD) + c(24, 26, 2.5, NAVY)],
    "🕐": ["reloj", c(24, 24, 19, WHITE, ' stroke="' + NAVY + '" stroke-width="3.5"') + s("M24 24V13M24 24l6-6", NAVY)],

    // Hogar, aseo y ropa
    "🛏️": ["cama", r(4, 22, 40, 12, 3, SKY) + r(6, 16, 12, 8, 3, WHITE) + s("M4 16v26M44 26v16", BROWN, 4)],
    "🚿": ["ducha", s("M12 44V8h12v6", GREY, 4) + p("M16 14h16l-2 6H18z", GREY) + s("M19 25l-2 6M24 25v6M29 25l2 6M18 36l-1 4M30 36l1 4", SKY)],
    "🧼": ["jabón", r(8, 18, 32, 20, 8, "#F4A9A0") + c(16, 12, 4, LIGHT) + c(26, 9, 3, LIGHT) + c(34, 14, 3, LIGHT)],
    "🪥": ["cepillo de dientes", r(4, 28, 32, 6, 3, TEAL, ' transform="rotate(-20 20 31)"') + r(30, 14, 12, 10, 2, WHITE, ' stroke="' + SKY + '" stroke-width="2" transform="rotate(-20 36 19)"')],
    "🧴": ["champú", r(13, 16, 22, 28, 6, TEAL) + r(19, 8, 10, 9, 2, NAVY) + r(17, 24, 14, 10, 2, WHITE)],
    "🧻": ["papel higiénico", r(10, 12, 26, 30, 3, WHITE, ' stroke="' + SKY + '" stroke-width="2"') + '<ellipse cx="23" cy="12" rx="13" ry="5" fill="' + LIGHT + '" stroke="' + SKY + '" stroke-width="2"/><ellipse cx="23" cy="12" rx="4" ry="1.8" fill="' + SKY + '"/>' + p("M36 26h6v18h-6z", WHITE, ' stroke="' + SKY + '" stroke-width="2"')],
    "🪒": ["máquina de afeitar", r(20, 20, 8, 24, 3, NAVY) + r(10, 6, 28, 12, 3, GREY) + r(12, 18, 24, 4, 1, SKY)],
    "🧽": ["esponja", r(6, 14, 36, 22, 6, GOLD) + r(6, 28, 36, 8, 0, GREEN) + c(16, 21, 2, OCRE) + c(28, 19, 2, OCRE) + c(34, 24, 2, OCRE)],
    "🧹": ["escoba", s("M34 4L22 28", BROWN, 4) + p("M14 26l12 6-6 14-14-6z", GOLD) + s("M12 34l10 4M10 38l9 4", OCRE, 2)],
    "🧺": ["canasta", p("M6 22h36l-4 20H10z", TAN) + s("M10 22l8-12M38 22l-8-12", BROWN) + s("M9 30h30M12 37h24", BROWN, 2)],
    "🌀": ["lavar ropa", r(8, 4, 32, 40, 4, LIGHT, ' stroke="' + GREY + '" stroke-width="2"') + c(24, 27, 11, SKY, ' stroke="' + NAVY + '" stroke-width="3"') + c(14, 10, 2, NAVY) + c(20, 10, 2, NAVY)],
    "🍽️": ["plato", c(24, 24, 15, WHITE, ' stroke="' + SKY + '" stroke-width="3"') + c(24, 24, 9, LIGHT) + s("M4 8v32M44 8v32", GREY)],
    "🥄": ["cuchara", '<ellipse cx="24" cy="12" rx="7" ry="9" fill="' + GREY + '"/>' + r(22, 19, 4, 26, 2, GREY)],
    "🔪": ["cuchillo", p("M30 4c6 4 6 14 0 22l-4-2z", GREY) + r(24, 24, 6, 20, 2, BROWN, ' transform="rotate(-10 27 34)"')],
    "🍳": ["sartén", c(20, 24, 15, NAVY) + r(33, 21, 14, 6, 3, BROWN) + c(18, 24, 8, WHITE) + c(19, 23, 4, GOLD)],
    "🫖": ["olla", p("M8 20h32v14c0 6-4 9-10 9H18c-6 0-10-3-10-9z", GREY) + r(5, 18, 38, 5, 2, NAVY) + r(20, 12, 8, 6, 2, NAVY)],
    "☕": ["café", p("M8 16h26v12c0 8-5 13-13 13S8 36 8 28z", WHITE, ' stroke="' + BROWN + '" stroke-width="3"') + s("M34 20h3a5 5 0 0 1 0 10h-4", BROWN) + r(11, 18, 20, 4, 1, BROWN) + s("M16 4c-2 3 2 5 0 8M24 4c-2 3 2 5 0 8", GREY, 2)],
    "🪑": ["silla", r(12, 4, 24, 20, 3, TAN) + r(10, 22, 28, 6, 2, BROWN) + s("M13 28v16M35 28v16", BROWN, 4)],
    "👕": ["camiseta", p("M16 6l-12 8 5 8 5-3v23h20V19l5 3 5-8-12-8c-1 4-4 6-8 6s-7-2-8-6z", SKY)],
    "👔": ["camisa", p("M16 6l-12 8 5 8 5-3v23h20V19l5 3 5-8-12-8-8 6z", WHITE, ' stroke="' + SKY + '" stroke-width="2"') + p("M22 12h4l2 4-2 20-2 3-2-3-2-20z", NAVY)],
    "👖": ["pantalón", p("M12 4h24l3 40h-10l-5-24-5 24H9z", NAVY) + s("M12 10h24", SKY, 2)],
    "🧦": ["medias", p("M16 4h12v22l8 8c3 3 1 10-5 10-2 0-4-1-6-3l-9-9z", CORAL) + r(16, 4, 12, 6, 1, WHITE)],
    "🧥": ["chaqueta", p("M16 4l-10 6-2 32h10V22l10 22 10-22v20h10l-2-32-10-6-8 10z", TEAL) + s("M24 14v28", NAVY, 2)],
    "🧢": ["gorra", p("M8 30c0-12 7-20 16-20s16 8 16 20z", CORAL) + p("M30 28h16c0 4-3 6-6 6H30z", "#C2553A") + c(24, 10, 2, "#C2553A")],
    "👟": ["tenis", p("M4 26c6 0 10-6 12-12l8 4c4 2 10 4 16 6 4 1 6 4 6 8v4H4z", WHITE, ' stroke="' + NAVY + '" stroke-width="2.5"') + r(4, 34, 42, 5, 2, NAVY) + s("M18 20l4 3M15 24l4 3", CORAL, 2)],
    "👢": ["bota", p("M12 4h16v22l12 6c4 2 6 5 6 9v3H12z", BROWN) + r(12, 40, 34, 4, 1, INK)],
    "🧤": ["guantes", p("M14 44V24l-4-10c-1-3 3-4 4-1l3 7V8c0-3 4-3 4 0v10V6c0-3 4-3 4 0v12V8c0-3 4-3 4 0v14l3-4c2-3 6-1 4 2l-6 10v14z", GOLD)],
    "⛑️": ["casco", p("M6 30c0-12 8-20 18-20s18 8 18 20z", GOLD) + r(4, 30, 40, 6, 3, OCRE) + r(21, 12, 6, 10, 2, WHITE)],
    "🎒": ["maleta", r(10, 12, 28, 32, 8, CORAL) + p("M18 12c0-5 2-8 6-8s6 3 6 8", "none", ' stroke="' + NAVY + '" stroke-width="3"') + r(15, 28, 18, 10, 3, "#C2553A")],
    "🧳": ["maleta de viaje", r(8, 14, 32, 28, 4, TEAL) + p("M18 14V8h12v6", "none", ' stroke="' + NAVY + '" stroke-width="3"') + s("M16 14v28M32 14v28", NAVY, 2)],
    "💼": ["maletín", r(4, 14, 40, 28, 4, BROWN) + p("M17 14V9h14v5", "none", ' stroke="' + NAVY + '" stroke-width="3"') + r(4, 24, 40, 3, 0, "#6E4521") + r(21, 22, 6, 7, 1, GOLD)],
    "🛍️": ["bolsa de compras", p("M8 16h32l-2 28H10z", CORAL) + p("M17 20v-6a7 7 0 0 1 14 0v6", "none", ' stroke="' + NAVY + '" stroke-width="3"')],
    "🛒": ["carrito de mercado", s("M2 8h7l5 22h24l4-16H11", NAVY) + c(17, 38, 3.5, NAVY) + c(35, 38, 3.5, NAVY) + r(14, 16, 24, 10, 1, GOLD)],
    "📦": ["paquete", p("M6 14l18-8 18 8v22l-18 8-18-8z", TAN) + p("M6 14l18 8 18-8", "none", ' stroke="' + OCRE + '" stroke-width="2"') + s("M24 22v22", OCRE, 2)],
    "🧱": ["bloque", r(4, 10, 40, 28, 2, CORAL) + s("M4 24h40M18 10v14M30 24v14M12 24v14M36 10v14", "#B5563E", 2)],
    "🧊": ["hielo", r(10, 10, 28, 28, 5, SKY, ' opacity="0.8"') + s("M16 16l6 0", WHITE)],
    "🩹": ["curita", r(4, 18, 40, 12, 6, TAN, ' transform="rotate(-30 24 24)"') + r(18, 18, 12, 12, 2, CREAM, ' transform="rotate(-30 24 24)"')],
    "🩸": ["sangre", p("M24 6c7 10 12 17 12 23a12 12 0 0 1-24 0c0-6 5-13 12-23z", RED)],
    "💊": ["medicamento", '<g transform="rotate(-35 24 24)">' + r(6, 17, 36, 14, 7, WHITE, ' stroke="' + CORAL + '" stroke-width="2"') + p("M13 17h11v14H13a7 7 0 0 1 0-14z", CORAL) + "</g>"],
    "🩺": ["revisión médica", s("M12 6v12a8 8 0 0 0 16 0V6", NAVY) + s("M20 26v6a8 8 0 0 0 16 0v-4", NAVY) + c(36, 24, 4, TEAL)],
    "🌡️": ["termómetro", r(20, 4, 8, 28, 4, WHITE, ' stroke="' + NAVY + '" stroke-width="2.5"') + c(24, 36, 7, RED) + r(22, 14, 4, 20, 2, RED)],

    // Comida
    "🍎": ["manzana", p("M24 16c-4-4-17-4-17 10 0 12 8 20 13 20 3 0 3-1 4-1s1 1 4 1c5 0 13-8 13-20 0-14-13-14-17-10z", RED) + s("M24 16c0-5 1-8 4-10", NAVY) + p("M27 10c4-5 10-4 12-1-4 4-8 4-12 1z", TEAL)],
    "🍐": ["pera", p("M24 8c4 0 5 6 6 10 2 5 8 8 8 16 0 6-6 10-14 10s-14-4-14-10c0-8 6-11 8-16 1-4 2-10 6-10z", "#B9CF5A") + s("M24 8V3", BROWN)],
    "🍌": ["banano", p("M8 10c-2 16 8 30 30 30 4 0 6-2 6-4-18 0-28-12-30-26z", GOLD) + s("M8 10l-2-4", BROWN)],
    "🍞": ["pan", p("M6 30c0-11 8-17 18-17s18 6 18 17c0 4-3 7-7 7H13c-4 0-7-3-7-7z", TAN) + s("M17 21l4 7M24 19l4 7M31 21l4 7", OCRE)],
    "🥖": ["baguette", r(4, 18, 40, 12, 6, TAN, ' transform="rotate(-25 24 24)"') + s("M14 26l4-5M22 22l4-5M30 18l4-5", OCRE, 2)],
    "🥚": ["huevos", '<ellipse cx="18" cy="27" rx="10" ry="13" fill="' + CREAM + '" stroke="#E0C9A6" stroke-width="2"/><ellipse cx="32" cy="29" rx="9" ry="12" fill="' + CREAM + '" stroke="#E0C9A6" stroke-width="2"/>'],
    "🍚": ["arroz", p("M10 24c0-8 6-13 14-13s14 5 14 13z", WHITE) + p("M5 24h38c0 11-8 18-19 18S5 35 5 24z", NAVY) + s("M12 30h24", GOLD, 2)],
    "🥣": ["desayuno", p("M5 22h38c0 11-8 18-19 18S5 33 5 22z", TEAL) + p("M10 22c0-5 6-8 14-8s14 3 14 8z", CREAM) + c(18, 18, 2, TAN) + c(27, 17, 2, TAN)],
    "🧀": ["queso", p("M4 32l30-18 10 8v14H4z", GOLD) + r(4, 32, 40, 4, 0, TAN) + c(18, 28, 3, TAN) + c(30, 24, 2.5, TAN) + c(36, 30, 2, TAN)],
    "🥑": ["aguacate", p("M24 4c7 0 9 10 11 17 3 9-3 21-11 21S10 30 13 21c2-7 4-17 11-17z", "#2F6B3A") + p("M24 10c5 0 6 8 8 14 2 7-2 14-8 14s-10-7-8-14c2-6 3-14 8-14z", "#CDE6A1") + c(24, 28, 5, BROWN)],
    "🥛": ["leche", p("M14 6h20l-2 36H16z", WHITE, ' stroke="' + SKY + '" stroke-width="2.5"') + p("M15 16h18l-1 26H16z", LIGHT)],
    "🧃": ["jugo", r(12, 10, 24, 34, 3, CORAL) + p("M12 10l4-6h16l4 6z", "#C2553A") + s("M30 4l4-4", NAVY, 2) + c(24, 28, 6, GOLD)],
    "🥪": ["sándwich", p("M4 30L24 10l20 20z", TAN) + r(4, 30, 40, 4, 1, GREEN) + r(4, 34, 40, 4, 1, CORAL) + r(4, 38, 40, 4, 1, TAN)],
    "🍱": ["comida servida", r(4, 12, 40, 28, 4, NAVY) + r(8, 16, 15, 20, 2, WHITE) + r(26, 16, 14, 9, 2, GREEN) + r(26, 27, 14, 9, 2, CORAL)],
    "🍕": ["pizza", p("M6 10c12-6 24-6 36 0L24 44z", GOLD) + p("M6 10c12-6 24-6 36 0l-2 4c-11-5-21-5-32 0z", TAN) + c(20, 20, 3, RED) + c(28, 24, 3, RED) + c(23, 32, 2.5, RED)],
    "🌰": ["semilla", p("M24 8c10 0 16 10 16 20S32 42 24 42 8 38 8 28 14 8 24 8z", BROWN) + p("M10 22c4-4 24-4 28 0", "none", ' stroke="' + TAN + '" stroke-width="3"')],

    // Naturaleza y animales
    "🌳": ["árbol", c(24, 18, 14, GREEN) + c(14, 24, 8, GREEN) + c(34, 24, 8, GREEN) + r(21, 28, 6, 16, 2, BROWN)],
    "🌿": ["planta", s("M24 44V12", GREEN) + p("M24 22c-8 0-12-6-12-10 6 0 12 4 12 10zM24 30c8 0 12-6 12-10-6 0-12 4-12 10zM24 16c5-1 8-6 7-10-5 1-8 6-7 10z", GREEN)],
    "🌱": ["planta pequeña", s("M24 44V24", GREEN) + p("M24 26c-10 0-14-8-14-12 8 0 14 4 14 12zM24 24c8 0 12-7 12-11-7 0-12 4-12 11z", GREEN) + r(12, 40, 24, 6, 2, BROWN)],
    "🌻": ["girasol", s("M24 44V26", GREEN) + c(24, 16, 12, GOLD) + c(24, 16, 6, BROWN)],
    "🌞": ["sol", c(24, 24, 11, GOLD) + s("M24 4v5M24 39v5M4 24h5M39 24h5M10 10l4 4M34 34l4 4M10 38l4-4M34 14l4-4", GOLD)],
    "☀️": ["sol", c(24, 24, 11, GOLD) + s("M24 4v5M24 39v5M4 24h5M39 24h5M10 10l4 4M34 34l4 4M10 38l4-4M34 14l4-4", GOLD)],
    "🌙": ["luna", p("M30 6a18 18 0 1 0 12 30A15 15 0 0 1 30 6z", GOLD)],
    "⭐": ["estrella", p("M24 4l6 13 14 1-11 9 4 14-13-8-13 8 4-14L4 18l14-1z", GOLD)],
    "☁️": ["nube", p("M14 36a8 8 0 0 1 0-16 11 11 0 0 1 21-2 9 9 0 0 1 1 18z", LIGHT, ' stroke="' + SKY + '" stroke-width="2"')],
    "🌧️": ["lluvia", p("M14 28a8 8 0 0 1 0-16 11 11 0 0 1 21-2 9 9 0 0 1 1 18z", SKY) + s("M16 34l-2 6M24 34l-2 6M32 34l-2 6", NAVY, 2.5)],
    "☂️": ["sombrilla", p("M4 24a20 20 0 0 1 40 0z", CORAL) + s("M24 24v14a4 4 0 0 1-8 0M24 4v2", NAVY)],
    "🌈": ["arcoíris", s("M6 38a18 18 0 0 1 36 0", RED, 4) + s("M11 38a13 13 0 0 1 26 0", GOLD, 4) + s("M16 38a8 8 0 0 1 16 0", TEAL, 4)],
    "🌬️": ["respirar", s("M4 18h26a6 6 0 1 0-6-6M4 26h34a6 6 0 1 1-6 6M4 34h16", SKY, 3.5)],
    "🐶": ["perro", c(24, 26, 15, TAN) + p("M10 14c-4 2-6 10-2 14l5-4zM38 14c4 2 6 10 2 14l-5-4z", BROWN) + c(19, 24, 2.5, INK) + c(29, 24, 2.5, INK) + '<ellipse cx="24" cy="31" rx="4" ry="3" fill="' + INK + '"/>'],
    "🐱": ["gato", p("M10 8l8 8h12l8-8v22c0 8-6 14-14 14s-14-6-14-14z", GOLD) + c(19, 26, 2.5, INK) + c(29, 26, 2.5, INK) + p("M22 31h4l-2 2z", CORAL) + s("M6 30h8M34 30h8", OCRE, 1.5)],
    "🐄": ["vaca", c(24, 24, 15, WHITE, ' stroke="' + GREY + '" stroke-width="2"') + c(17, 16, 4, INK) + '<ellipse cx="24" cy="32" rx="9" ry="6" fill="#F4A9A0"/>' + c(19, 22, 2.5, INK) + c(29, 22, 2.5, INK) + p("M9 10l4 6M39 10l-4 6", "none", ' stroke="' + TAN + '" stroke-width="3"')],
    "🐴": ["caballo", p("M14 44V24c0-12 8-18 18-18l6 10-4 4-6-2v26z", BROWN) + p("M14 20c0-8 4-14 12-16", "none", ' stroke="' + INK + '" stroke-width="4"') + c(30, 13, 2, INK)],
    "🦒": ["jirafa", p("M22 44V16l-4-6 6-4 6 4v38z", GOLD) + c(25, 22, 2.5, TAN) + c(24, 32, 3, TAN) + c(28, 40, 2.5, TAN) + c(25, 10, 1.6, INK)],
    "🐝": ["abeja", '<ellipse cx="24" cy="28" rx="13" ry="10" fill="' + GOLD + '"/>' + s("M20 19v18M28 19v18", INK, 3) + '<ellipse cx="18" cy="14" rx="7" ry="5" fill="' + LIGHT + '"/><ellipse cx="30" cy="14" rx="7" ry="5" fill="' + LIGHT + '"/>'],
    "🐜": ["hormiga", c(12, 26, 6, BROWN) + c(23, 26, 5, BROWN) + c(35, 24, 8, BROWN) + s("M20 30l-4 8M24 30v8M28 29l4 8M12 20l-4-6", BROWN, 2)],
    "🦷": ["diente", p("M12 8c4-3 8-2 12 0 4-2 8-3 12 0 5 4 4 12 2 18l-3 16c-1 2-4 2-4 0l-3-12c-1-2-3-2-4 0l-3 12c0 2-3 2-4 0l-3-16c-2-6-3-14 2-18z", WHITE, ' stroke="' + SKY + '" stroke-width="2.5"')],
    "🐦": ["pájaro", p("M8 26c0-10 8-16 18-14 6 1 10 6 10 12 0 10-8 16-16 16-6 0-10-4-12-8z", SKY) + p("M36 20l8 2-8 4z", GOLD) + c(30, 20, 2, INK) + p("M14 26c4 0 8 2 10 6-6 2-10 0-10-6z", NAVY)],

    // Deporte y ocio
    "⚽": ["balón", c(24, 24, 18, WHITE, ' stroke="' + INK + '" stroke-width="2"') + p("M24 16l7 5-3 8h-8l-3-8z", INK)],
    "🏀": ["básquet", c(24, 24, 18, CORAL) + s("M6 24h36M24 6v36M11 11c6 6 6 20 0 26M37 11c-6 6-6 20 0 26", "#B5563E", 2)],
    "🎯": ["objetivo", c(24, 24, 19, RED) + c(24, 24, 13, WHITE) + c(24, 24, 7, RED) + s("M24 24l16-16", NAVY)],
    "🎲": ["dado", r(8, 8, 32, 32, 6, WHITE, ' stroke="' + NAVY + '" stroke-width="2.5"') + c(16, 16, 3, NAVY) + c(24, 24, 3, NAVY) + c(32, 32, 3, NAVY)],
    "🎬": ["cine", r(6, 18, 36, 24, 3, NAVY) + p("M6 10l34-6 2 8-34 6z", INK) + s("M14 9l4 7M24 7l4 7M34 5l4 7", WHITE, 2)],
    "🎉": ["celebración", p("M6 42l10-26 16 16z", GOLD) + c(30, 10, 2.5, CORAL) + c(38, 18, 2.5, TEAL) + c(36, 6, 2, SKY) + s("M26 18c4-2 6-6 4-10M30 22c4 0 8-2 10-6", CORAL, 2)],
    "💃": ["danza", c(26, 8, 5, SKIN) + p("M26 14l-6 14h14z", CORAL) + p("M18 28c4 4 12 4 18 0l-4 10H22z", CORAL) + s("M26 16l8-6M24 16l-10 4M24 38l-4 8M30 38l4 8", SKIN, 3)],
    "🏃": ["correr", c(28, 8, 5, SKIN) + s("M26 14l-4 14 8 6 2 10M22 28l-8 6-6-2M24 18l10 4 4-4M24 18l-8 2-4 6", NAVY, 3.5)],
    "🎵": ["música", s("M18 36V10l20-4v26", NAVY) + c(14, 36, 5, NAVY) + c(34, 32, 5, NAVY)],

    // Señales, símbolos y estados
    "✅": ["listo", r(6, 6, 36, 36, 8, GREEN) + s("M14 24l7 7 13-14", WHITE, 4)],
    "❓": ["pregunta", c(24, 24, 19, SKY) + s("M18 18a6 6 0 1 1 9 5c-2 1-3 3-3 5", NAVY, 3.5) + c(24, 35, 2.5, NAVY)],
    "🔴": ["rojo", c(24, 24, 16, RED)],
    "🟡": ["amarillo", c(24, 24, 16, GOLD)],
    "🟢": ["verde", c(24, 24, 16, GREEN)],
    "🔵": ["azul", c(24, 24, 16, NAVY)],
    "🟦": ["cuadro azul", r(8, 8, 32, 32, 4, NAVY)],
    "🔄": ["repetir", s("M38 18A15 15 0 0 0 10 16M10 30a15 15 0 0 0 28 2", TEAL, 3.5) + p("M38 6v12H26z", TEAL) + p("M10 42V30h12z", TEAL)],
    "🔁": ["repetir", s("M8 22v-4a6 6 0 0 1 6-6h24M40 26v4a6 6 0 0 1-6 6H10", TEAL, 3.5) + p("M34 6l8 6-8 6z", TEAL) + p("M14 30l-8 6 8 6z", TEAL)],
    "💬": ["conversación", p("M6 10h36a3 3 0 0 1 3 3v18a3 3 0 0 1-3 3H20l-10 8v-8H6a3 3 0 0 1-3-3V13a3 3 0 0 1 3-3z", SKY) + c(15, 22, 2.5, NAVY) + c(24, 22, 2.5, NAVY) + c(33, 22, 2.5, NAVY)],
    "🗨️": ["mensaje", p("M6 10h36a3 3 0 0 1 3 3v18a3 3 0 0 1-3 3H20l-10 8v-8H6a3 3 0 0 1-3-3V13a3 3 0 0 1 3-3z", WHITE, ' stroke="' + NAVY + '" stroke-width="2.5"')],
    "💭": ["pensar", c(28, 18, 13, LIGHT, ' stroke="' + SKY + '" stroke-width="2"') + c(12, 34, 5, LIGHT, ' stroke="' + SKY + '" stroke-width="2"') + c(6, 42, 3, LIGHT, ' stroke="' + SKY + '" stroke-width="2"')],
    "🧠": ["mente", p("M24 8c-4-4-12-2-12 4-6 0-8 8-4 12-4 4-2 12 4 12 0 6 8 8 12 4 4 4 12 2 12-4 6 0 8-8 4-12 4-4 2-12-4-12 0-6-8-8-12-4z", "#F4A9A0") + s("M24 8v32M16 18c3 0 5 2 5 5M32 28c-3 0-5-2-5-5", "#C26A62", 2)],
    "📐": ["regla", p("M6 42V8l34 34z", GOLD) + p("M14 34V26l8 8z", WHITE) + s("M6 16h4M6 24h4M6 32h4", OCRE, 2)],
    "👀": ["mirar", '<ellipse cx="15" cy="24" rx="9" ry="12" fill="' + WHITE + '" stroke="' + NAVY + '" stroke-width="2.5"/><ellipse cx="33" cy="24" rx="9" ry="12" fill="' + WHITE + '" stroke="' + NAVY + '" stroke-width="2.5"/>' + c(18, 26, 4, INK) + c(36, 26, 4, INK)],
    "👂": ["oído", p("M16 20c0-9 6-14 12-14s12 5 12 13c0 6-4 9-7 11-3 3-3 8-8 10-4 1-8-2-8-6", SKIN) + s("M22 20c0-4 3-6 6-6s6 3 5 7c-1 3-4 4-4 7", "#B07A55", 3)],
    "🗣️": ["hablar", c(18, 20, 12, NAVY) + p("M6 44c0-8 5-12 12-12s12 4 12 12z", NAVY) + s("M34 14c3 3 3 9 0 12M39 10c5 5 5 15 0 20", CORAL)],
    "✋": ["pare", p("M14 44c-4-4-8-10-8-16 0-3 3-3 5-1l3 4V10c0-3 4-3 4 0v12V6c0-3 4-3 4 0v16V8c0-3 4-3 4 0v14V12c0-3 4-3 4 0v18c0 8-4 14-10 14z", SKIN)],
    "👋": ["saludar", p("M16 44c-4-4-8-10-8-16 0-3 3-3 5-1l3 4V10c0-3 4-3 4 0v12V6c0-3 4-3 4 0v16V8c0-3 4-3 4 0v14V12c0-3 4-3 4 0v18c0 8-4 14-10 14z", SKIN, ' transform="rotate(-15 24 24)"') + s("M40 8c3 2 4 5 4 8M4 30c0 3 1 6 3 8", SKY, 2)],
    "🙏": ["gracias", p("M24 42l-10-6V18c0-4 2-10 6-14 2 0 4 2 4 4z", SKIN) + p("M24 42l10-6V18c0-4-2-10-6-14-2 0-4 2-4 4z", "#C98E68")],
    "🤝": ["acuerdo", p("M2 22l10-8 8 4 6-2 10 6 10-4v14l-12 8-10-6-8 2-14-8z", SKIN) + s("M20 18l8 8M16 24l8 8M24 16l6 6", "#B07A55", 2)],
    "🙋": ["levantar la mano", persona(TEAL, PELO_CORTO, s("M38 30V6", SKIN, 5))],
    "🦯": ["bastón", s("M14 4l20 40", NAVY, 3.5) + s("M28 32l4 8", RED, 3.5) + s("M14 4c-4 0-6 3-5 6", NAVY, 3.5)],
    "🚶": ["caminar", c(26, 8, 5, SKIN) + s("M25 14l-3 14 6 6 2 10M22 28l-4 16M24 18l8 6M24 18l-8 6", NAVY, 3.5)],
    "🚶‍♀️": ["caminar", c(26, 8, 5, SKIN) + p("M21 4c4-2 9 0 9 6l-4-2z", INK) + s("M25 14l-3 14 6 6 2 10M22 28l-4 16M24 18l8 6M24 18l-8 6", CORAL, 3.5)],

    // Personas
    "👩": ["mujer", persona(CORAL, PELO_LARGO)],
    "👧": ["niña", persona(GOLD, PELO_LARGO)],
    "🧒": ["joven", persona(SKY, PELO_CORTO)],
    "🧑": ["persona", persona(TEAL, PELO_CORTO)],
    "👨": ["hombre", persona(NAVY, PELO_CORTO)],
    "👩‍💼": ["profesional", persona(NAVY, PELO_LARGO, p("M22 32h4l1 6-3 4-3-4z", WHITE))],
    "👨‍🍳": ["panadero", persona(WHITE, PELO_CORTO, '<g stroke="' + SKY + '" stroke-width="1.5">' + c(16, 7, 5, WHITE) + c(24, 5, 6, WHITE) + c(32, 7, 5, WHITE) + r(15, 8, 18, 5, 1, WHITE) + "</g>" + s("M8 46c0-10 7-16 16-16s16 6 16 16", SKY, 1.5))],
    "👨‍🎓": ["graduado", persona(NAVY, PELO_CORTO, p("M8 9L24 3l16 6-16 6z", INK) + s("M38 10v8", GOLD, 2))],
    "🧑‍🏫": ["profesora", persona(TEAL, PELO_LARGO, r(30, 30, 14, 10, 1, GREEN) + s("M33 34h8", WHITE, 1.5))],
    "💇": ["peluquería", persona(SKY, PELO_LARGO, s("M38 6l-6 10M42 10l-10 6", GREY, 2.5))],
    "🤒": ["cara con un termómetro en la boca", cara(GOLD, s("M18 33q6-4 12 0", INK, 2.5), null, r(22, 30, 16, 4, 2, WHITE, ' transform="rotate(-20 30 32)"'))],
    "😵": ["cara con ojos en forma de x", cara(GOLD, c(24, 33, 3.5, INK), s("M14 18l6 6M20 18l-6 6M28 18l6 6M34 18l-6 6", INK, 2.5))],

    // Emociones: el nombre accesible describe la cara, no la emoción, para no dar la respuesta.
    "😀": ["cara con una sonrisa grande", cara(GOLD, p("M14 28h20c0 6-4 10-10 10s-10-4-10-10z", INK) + p("M17 29h14v3H17z", WHITE))],
    "😊": ["cara sonriente con mejillas rosadas", cara(GOLD, s("M15 29q9 8 18 0", INK, 2.5), s("M14 21q3-3 6 0M28 21q3-3 6 0", INK, 2.5), c(13, 28, 3, CORAL, ' opacity="0.5"') + c(35, 28, 3, CORAL, ' opacity="0.5"'))],
    "🙂": ["cara con una sonrisa leve", cara(GOLD, s("M16 30q8 6 16 0", INK, 2.5))],
    "😁": ["cara mostrando los dientes", cara(GOLD, r(14, 27, 20, 9, 4, WHITE, ' stroke="' + INK + '" stroke-width="2"'), s("M14 21q3-3 6 0M28 21q3-3 6 0", INK, 2.5))],
    "😌": ["cara con ojos cerrados y sonrisa suave", cara(GOLD, s("M17 31q7 4 14 0", INK, 2.5), s("M13 21q4 3 8 0M27 21q4 3 8 0", INK, 2.5))],
    "😋": ["cara sacando la lengua", cara(GOLD, s("M16 29q8 6 16 0", INK, 2.5) + p("M26 31c0 4 2 6 4 6s4-2 3-6z", CORAL), s("M14 21q3-3 6 0M28 21q3-3 6 0", INK, 2.5))],
    "😢": ["cara con una lágrima y la boca hacia abajo", cara(SKY, s("M16 35q8-6 16 0", INK, 2.5), null, p("M34 25c2 3 3 5 3 6a3 3 0 0 1-6 0c0-1 1-3 3-6z", NAVY))],
    "😠": ["cara con cejas fruncidas y la boca hacia abajo", cara(CORAL, s("M16 35q8-5 16 0", INK, 2.5), c(17, 23, 2.6, INK) + c(31, 23, 2.6, INK), s("M12 15l8 4M36 15l-8 4", INK, 2.5))],
    "😤": ["cara con cejas fruncidas soltando aire", cara(CORAL, s("M17 33h14", INK, 2.5), c(17, 22, 2.6, INK) + c(31, 22, 2.6, INK), s("M12 15l8 4M36 15l-8 4", INK, 2.5) + p("M6 34l6-2-2 6zM42 34l-6-2 2 6z", LIGHT))],
    "😨": ["cara con ojos muy abiertos y boca abierta", cara(SKY, '<ellipse cx="24" cy="33" rx="5" ry="6" fill="' + INK + '"/>', c(17, 21, 3.5, WHITE, ' stroke="' + INK + '" stroke-width="2"') + c(31, 21, 3.5, WHITE, ' stroke="' + INK + '" stroke-width="2"'), s("M12 13l7 2M36 13l-7 2", INK, 2.5))],
    "😰": ["cara con gota de sudor y boca temblorosa", cara(SKY, s("M16 34q4-3 8 0t8 0", INK, 2.5), null, p("M38 10c2 3 3 5 3 6a3 3 0 0 1-6 0c0-1 1-3 3-6z", NAVY))],
    "😓": ["cara con ojos cerrados y gota de sudor", cara(GOLD, s("M17 34q7-4 14 0", INK, 2.5), s("M13 21h8M27 21h8", INK, 2.5), p("M37 8c2 3 3 5 3 6a3 3 0 0 1-6 0c0-1 1-3 3-6z", SKY))],
    "😮": ["cara con la boca abierta en forma de o", cara(GOLD, '<ellipse cx="24" cy="33" rx="4" ry="5" fill="' + INK + '"/>', c(17, 20, 3, INK) + c(31, 20, 3, INK), s("M13 12q4-3 8 0M27 12q4-3 8 0", INK, 2))],
    "😳": ["cara con ojos muy abiertos y mejillas rojas", cara(GOLD, s("M19 33h10", INK, 2.5), c(17, 21, 3.5, WHITE, ' stroke="' + INK + '" stroke-width="2"') + c(31, 21, 3.5, WHITE, ' stroke="' + INK + '" stroke-width="2"'), c(12, 29, 4, CORAL, ' opacity="0.6"') + c(36, 29, 4, CORAL, ' opacity="0.6"'))],
    "😕": ["cara con la boca torcida", cara(GOLD, s("M17 33l14-3", INK, 2.5))],
    "🤢": ["cara verde con la boca ondulada", cara("#9CCB8A", s("M16 34q4-3 8 0t8 0", INK, 2.5), s("M13 21h8M27 21h8", INK, 2.5))],
    "🤔": ["cara con la mano en la barbilla", cara(GOLD, s("M19 33h10", INK, 2.5), null, s("M14 14l6-2M28 13l6 1", INK, 2.5) + p("M30 40c0-4 4-6 8-5l-2 7z", SKIN))]
  };

  var KEYS = Object.keys(D).map(function (k) { return k.replace(/️/g, ""); });
  var BY = {};
  Object.keys(D).forEach(function (k) { BY[k.replace(/️/g, "")] = D[k]; });
  KEYS.sort(function (a, b) { return b.length - a.length; });
  var RE = new RegExp("(" + KEYS.map(function (k) { return k.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); }).join("|") + ")️?", "g");
  var SKIP = { SCRIPT: 1, STYLE: 1, TEXTAREA: 1, INPUT: 1, OPTION: 1, TITLE: 1 };

  function oculto(node) {
    for (var n = node; n && n.nodeType === 1; n = n.parentNode) {
      if (n.getAttribute("aria-hidden") === "true") return true;
    }
    return false;
  }

  function dibujo(k, escondido) {
    var item = BY[k];
    var span = document.createElement("span");
    span.className = "picto";
    if (escondido) span.setAttribute("aria-hidden", "true");
    else { span.setAttribute("role", "img"); span.setAttribute("aria-label", item[0]); }
    span.innerHTML = '<svg viewBox="0 0 48 48" focusable="false" aria-hidden="true">' + item[1] + "</svg>";
    return span;
  }

  function cambiarTexto(t) {
    var texto = t.nodeValue;
    RE.lastIndex = 0;
    if (!RE.test(texto)) return;
    var padre = t.parentNode;
    if (!padre || SKIP[padre.nodeName] || (padre.closest && padre.closest(".picto"))) return;
    var escondido = oculto(padre);
    var frag = document.createDocumentFragment(), ultimo = 0, m;
    RE.lastIndex = 0;
    while ((m = RE.exec(texto))) {
      if (m.index > ultimo) frag.appendChild(document.createTextNode(texto.slice(ultimo, m.index)));
      frag.appendChild(dibujo(m[1], escondido));
      ultimo = RE.lastIndex;
    }
    if (ultimo < texto.length) frag.appendChild(document.createTextNode(texto.slice(ultimo)));
    padre.replaceChild(frag, t);
  }

  function recorrer(raiz) {
    if (raiz.nodeType === 3) { cambiarTexto(raiz); return; }
    if (raiz.nodeType !== 1 || SKIP[raiz.nodeName] || raiz.classList.contains("picto")) return;
    var w = document.createTreeWalker(raiz, NodeFilter.SHOW_TEXT, null), lista = [], n;
    while ((n = w.nextNode())) lista.push(n);
    lista.forEach(cambiarTexto);
  }

  function iniciar() {
    var shell = document.querySelector(".game-shell");
    if (!shell || !window.MutationObserver) return;
    recorrer(shell);
    new MutationObserver(function (cambios) {
      cambios.forEach(function (c) {
        if (c.type === "characterData") cambiarTexto(c.target);
        else for (var i = 0; i < c.addedNodes.length; i++) recorrer(c.addedNodes[i]);
      });
    }).observe(shell, { childList: true, subtree: true, characterData: true });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", iniciar);
  else iniciar();
})();
