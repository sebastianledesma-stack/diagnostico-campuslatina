// Auditor de UX/UI para pegar en la consola del navegador (o inyectar con una herramienta de pruebas).
// Revisa cada elemento visible de la pantalla actual:
//  - contraste real texto/fondo (WCAG AA: 4.5:1 normal, 3:1 texto grande), componiendo transparencias
//  - tamaño de letra mínimo (error < 11 px, aviso < 13 px en texto de lectura)
//  - zonas táctiles menores a 44 × 44 px
//  - desbordes horizontales
// Uso: __uxAudit("nombre de pantalla") → objeto con los hallazgos.
window.__uxAudit = function (pantalla) {
  const parse = (c) => { const m = c && c.match(/rgba?\(([^)]+)\)/); if (!m) return null; const p = m[1].split(",").map(parseFloat); return { r: p[0], g: p[1], b: p[2], a: p.length > 3 ? p[3] : 1 }; };
  const over = (fg, bg) => ({ r: fg.r * fg.a + bg.r * (1 - fg.a), g: fg.g * fg.a + bg.g * (1 - fg.a), b: fg.b * fg.a + bg.b * (1 - fg.a), a: 1 });
  const lum = ({ r, g, b }) => { const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }; return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b); };
  const ratio = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };
  const visible = (el) => { const r = el.getBoundingClientRect(); if (r.width < 1 || r.height < 1) return false; for (let e = el; e; e = e.parentElement) { const cs = getComputedStyle(e); if (cs.display === "none" || cs.visibility === "hidden" || parseFloat(cs.opacity) === 0) return false; } return true; };
  const bgOf = (el) => { const capas = []; for (let e = el; e; e = e.parentElement) { const c = parse(getComputedStyle(e).backgroundColor); if (c && c.a > 0) { capas.push(c); if (c.a >= 1) break; } } let base = { r: 255, g: 255, b: 255, a: 1 }; for (let i = capas.length - 1; i >= 0; i--) base = over(capas[i], base); return base; };
  const desc = (el) => (el.innerText || el.getAttribute("aria-label") || el.value || "").replace(/\s+/g, " ").trim().slice(0, 45);

  const contraste = [], chicos = [], tactiles = [], desbordes = [];
  let textos = 0;
  for (const el of document.body.querySelectorAll("*")) {
    if (["SCRIPT", "STYLE", "SVG", "PATH", "CANVAS", "OPTION"].includes(el.tagName.toUpperCase())) continue;
    // Texto propio, ignorando emojis sueltos (se dibujan a color, su contraste no aplica)
    const propio = [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.replace(/[\p{Extended_Pictographic}\u{FE0F}\u{200D}\s]/gu, "").trim());
    if (propio && visible(el)) {
      textos++;
      const cs = getComputedStyle(el);
      const fs = parseFloat(cs.fontSize), fw = parseInt(cs.fontWeight, 10);
      const bg = bgOf(el); const fg = over(parse(cs.color), bg);
      const op = [...(function* () { for (let e = el; e; e = e.parentElement) yield parseFloat(getComputedStyle(e).opacity); })()].reduce((a, b) => a * b, 1);
      const grande = fs >= 24 || (fs >= 18.66 && fw >= 700);
      const r = ratio(op < 1 ? over({ ...fg, a: op }, bg) : fg, bg);
      const disabled = el.closest("button:disabled,[aria-disabled=true]");
      if (!disabled && r < (grande ? 3 : 4.5)) contraste.push(`${r.toFixed(2)}:1 · ${fs}px · "${desc(el)}"`);
      const esEtiqueta = cs.textTransform === "uppercase" || /Mono/.test(cs.fontFamily);
      if (fs < 11 || (!esEtiqueta && fs < 13)) chicos.push(`${fs}px · "${desc(el)}"`);
    }
    if (el.matches("button,a[href],input,select,textarea,[role=radio],[role=checkbox],[role=tab]") && visible(el)) {
      const r = el.getBoundingClientRect();
      if ((r.height < 44 || r.width < 44) && !el.closest(".PhoneInputCountry")) tactiles.push(`${Math.round(r.width)}×${Math.round(r.height)} · ${el.tagName.toLowerCase()} "${desc(el)}"`);
    }
    const recortado = (e) => { for (let p = e.parentElement; p; p = p.parentElement) { const o = getComputedStyle(p); if (/hidden|clip|auto|scroll/.test(o.overflowX)) { const pr = p.getBoundingClientRect(); if (pr.right <= innerWidth + 1) return true; } } return false; };
    if (visible(el)) { const r = el.getBoundingClientRect(); if (r.right > innerWidth + 1 && !recortado(el)) desbordes.push(`${el.tagName.toLowerCase()} "${desc(el)}" termina en ${Math.round(r.right)}px`); }
  }
  return {
    pantalla, viewport: `${innerWidth}×${innerHeight}`, textos,
    scrollHorizontal: document.documentElement.scrollWidth > innerWidth,
    alto: document.documentElement.scrollHeight,
    contraste: [...new Set(contraste)], letraChica: [...new Set(chicos)], tactilesChicos: [...new Set(tactiles)], desbordes: [...new Set(desbordes)].slice(0, 8),
  };
};
