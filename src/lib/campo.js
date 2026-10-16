// Campo de líneas: el recurso gráfico de la marca (mismo dibujo que en campuslatina.com, assets/campo.js).
// Líneas finas que nacen dispersas y convergen en un haz calmo; algunos puntos de luz viajan por ellas
// y los que llegan toman el color de destaque. montarCampo(canvas, { linea, destaque, tipo }) devuelve
// una función para desmontarlo. Con movimiento reducido se dibuja quieto.
const TIPOS = {
  // Fondo de pantallas oscuras: las líneas pasan por la mitad de abajo y convergen abajo a la derecha.
  fondo: {
    ancho: { n: 56, conv: { x: 1.03, y: 0.82 }, banda: 0.05, yMin: 0.3, puntos: 22, alfa: [0.05, 0.12] },
    angosto: { n: 38, conv: { x: 1.04, y: 0.92 }, banda: 0.04, yMin: 0.55, puntos: 12, alfa: [0.05, 0.11] },
  },
};

function rng(seed) {
  return () => {
    seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const suave = (a, b, x) => { const t = Math.max(0, Math.min(1, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
const rgb = (hex) => { const n = parseInt(hex.replace("#", ""), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; };

export function montarCampo(cv, { linea = "#7FD6DE", destaque = "#FF6B4A", tipo = "fondo" } = {}) {
  if (!cv || typeof window === "undefined") return () => {};
  const ctx = cv.getContext("2d");
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const col = rgb(linea), dest = rgb(destaque);
  let F = null, raf = 0, t0 = null, visible = true;

  function preparar() {
    const r = cv.getBoundingClientRect(), d = Math.min(window.devicePixelRatio || 1, 2);
    const cfg = TIPOS[tipo][r.width < 700 ? "angosto" : "ancho"], R = rng(9);
    cv.width = Math.round(r.width * d); cv.height = Math.round(r.height * d); ctx.setTransform(d, 0, 0, d, 0, 0);
    const L = [], P = [];
    for (let i = 0; i < cfg.n; i++) {
      L.push({ y0: cfg.yMin + R() * (1.15 - cfg.yMin), ye: cfg.conv.y + (R() - 0.5) * cfg.banda, f: 1.2 + R() * 2.4, amp: 0.04 + R() * 0.1,
        ph: R() * 6.28, sp: 0.15 + R() * 0.35, a: cfg.alfa[0] + R() * (cfg.alfa[1] - cfg.alfa[0]), w: 0.6 + R() * 1.1 });
    }
    for (let j = 0; j < cfg.puntos; j++) P.push({ l: Math.floor(R() * cfg.n), u: R(), v: 0.035 + R() * 0.05, r: 1.5 + R() * 2, hi: R() < 0.4 });
    F = { w: r.width, h: r.height, cfg, L, P, R };
  }
  const yEn = (l, u, t) => { const c = Math.pow(suave(0.08, 1, u), 1.25); return (l.y0 + (l.ye - l.y0) * c + Math.sin(u * l.f * 6.283 + l.ph + t * l.sp) * l.amp * (1 - c)) * F.h; };
  const xEn = (u) => (-0.04 + u * (F.cfg.conv.x + 0.04)) * F.w;

  function dibujar(t) {
    const { w, h, cfg } = F; ctx.clearRect(0, 0, w, h); ctx.lineCap = "round";
    for (const l of F.L) {
      const g = ctx.createLinearGradient(0, 0, w, 0);
      g.addColorStop(0, `rgba(${col},${l.a * 0.4})`); g.addColorStop(0.6, `rgba(${col},${l.a})`); g.addColorStop(1, `rgba(${col},${Math.min(1, l.a * 2.2)})`);
      ctx.strokeStyle = g; ctx.lineWidth = l.w; ctx.beginPath();
      for (let k = 0; k <= 56; k++) { const u = k / 56, x = xEn(u), y = yEn(l, u, t); if (k) ctx.lineTo(x, y); else ctx.moveTo(x, y); }
      ctx.stroke();
    }
    const cx = cfg.conv.x * w, cy = cfg.conv.y * h, rg = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.max(w, h) * 0.22);
    rg.addColorStop(0, `rgba(${col},.08)`); rg.addColorStop(1, `rgba(${col},0)`); ctx.fillStyle = rg; ctx.fillRect(0, 0, w, h);
    for (const p of F.P) {
      const l = F.L[p.l], x = xEn(p.u), y = yEn(l, p.u, t), al = Math.sin(Math.min(p.u, 1) * Math.PI) * 0.8;
      const c = p.hi && p.u > 0.6 ? dest : col;
      ctx.save(); ctx.shadowColor = `rgba(${c},${al})`; ctx.shadowBlur = 10; ctx.fillStyle = `rgba(${c},${al})`;
      ctx.beginPath(); ctx.arc(x, y, p.r, 0, 6.283); ctx.fill(); ctx.restore();
    }
  }
  function cuadro(ts) {
    if (t0 == null) t0 = ts;
    for (const p of F.P) { p.u += p.v / 60; if (p.u > 1.02) { p.u = 0; p.l = Math.floor(F.R() * F.L.length); } }
    dibujar((ts - t0) / 1000);
    if (visible) raf = requestAnimationFrame(cuadro);
  }
  preparar(); dibujar(0);
  if (!reduce) raf = requestAnimationFrame(cuadro);
  const io = "IntersectionObserver" in window ? new IntersectionObserver(([e]) => {
    visible = e.isIntersecting; cancelAnimationFrame(raf); if (visible && !reduce) raf = requestAnimationFrame(cuadro);
  }) : null;
  io?.observe(cv);
  let rt; const alCambiar = () => { clearTimeout(rt); rt = setTimeout(() => { preparar(); dibujar(0); }, 150); };
  window.addEventListener("resize", alCambiar);
  return () => { cancelAnimationFrame(raf); io?.disconnect(); window.removeEventListener("resize", alCambiar); clearTimeout(rt); };
}
