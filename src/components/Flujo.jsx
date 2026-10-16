// Flujo del aspirante (solapa Resumen del informe). Puntos de luz recorren las 7 etapas por un haz de
// líneas finas, el recurso gráfico de la marca. En cada etapa el haz se angosta según el puntaje: con
// puntajes bajos, más puntos quedan en el camino (en gris); los que llegan al final toman el color de
// destaque. Es una ilustración del puntaje, no una medición. Con movimiento reducido se dibuja quieto.
import { useEffect, useRef } from "react";
import { sinMovimiento } from "../lib/movimiento.js";

const AGUA = [127, 214, 222], PETROLEO = [11, 100, 112], CORAL = [255, 107, 74], PERDIDA = [154, 168, 171];
const N = 7;
export const FIN = 0.93;                            // el haz ocupa el 93 % del largo; el resto es la llegada
export const posEtapa = (i) => FIN * (i + 0.5) / N; // centro de cada etapa, para ubicar los rótulos
const PERDIDA_MAX = 0.36;                           // con puntaje 1 la etapa retiene el 64 %; con 5, todos siguen
const retencion = (s) => 1 - PERDIDA_MAX * (5 - Math.max(1, Math.min(5, s || 1))) / 4;
const acumulada = (ps) => { let c = 1; return ps.map((s) => (c *= retencion(s))); };
const suave = (a, b, x) => { const t = Math.max(0, Math.min(1, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
const mezcla = (a, b, t) => a.map((v, k) => Math.round(v + (b[k] - v) * t));

export default function Flujo({ puntajes, vertical = false, oscuro = true, style }) {
  const ref = useRef(null);
  const objetivo = useRef(puntajes);
  const cambio = useRef(null);
  objetivo.current = puntajes;

  useEffect(() => {
    const cv = ref.current; if (!cv) return;
    const ctx = cv.getContext("2d"), quieto = sinMovimiento(), tinta = oscuro ? AGUA : PETROLEO;
    let W = 0, H = 0, raf = 0, visible = true, previo = null, porNacer = 0, t = 0, semilla = 11;
    const R = () => { semilla = (semilla * 16807) % 2147483647; return (semilla - 1) / 2147483646; };
    let cum = acumulada(objetivo.current);
    const lineas = Array.from({ length: 26 }, (_, k) => ({ v: -1 + 2 * k / 25, ph: R() * 6.28, f: 1.5 + R() * 2.5, a: 0.07 + R() * 0.13, w: 0.6 + R() * 0.7 }));
    let P = [];

    const medir = () => {
      const r = cv.getBoundingClientRect(), d = Math.min(window.devicePixelRatio || 1, 2);
      W = r.width; H = r.height; cv.width = Math.round(W * d); cv.height = Math.round(H * d); ctx.setTransform(d, 0, 0, d, 0, 0);
    };
    const largo = () => (vertical ? H : W), cruce = () => (vertical ? W : H);
    const centro = () => cruce() * (vertical ? 0.5 : 0.4), semi = () => cruce() * (vertical ? 0.4 : 0.34);
    // Ancho relativo del haz en u (0–1 sobre el tramo de etapas): baja a la retención acumulada en cada etapa.
    const ancho = (u) => {
      let w = 1;
      for (let i = 0; i < N; i++) {
        const c = (i + 0.5) / N, a = c - 0.03, b = c + 0.05;
        if (u <= a) return w;
        if (u < b) return w + (cum[i] - w) * suave(a, b, u);
        w = cum[i];
      }
      return w;
    };
    // Posición en pantalla de un punto del haz: u a lo largo, v de -1 a 1 a lo ancho.
    const punto = (u, v, onda = 0) => {
      const m = Math.min(u, 1.05) * FIN * largo(), c = centro() + v * semi() * (0.1 + 0.9 * ancho(Math.min(u, 1))) + onda;
      return vertical ? [c, m] : [m, c];
    };
    const nacer = () => {
      const ps = objetivo.current; let cae = N;
      for (let i = 0; i < N; i++) if (R() > retencion(ps[i])) { cae = i; break; }
      P.push({ u: 0, v: R() * 1.8 - 0.9, vel: 0.085 + R() * 0.035, cae, est: "va", r: 1.3 + R() * 1.3, vida: 0, x: 0, y: 0, vx: 0, vy: 0 });
    };
    const avanzar = (dt) => {
      t += dt;
      const meta = acumulada(objetivo.current);
      cum = cum.map((c, i) => c + (meta[i] - c) * Math.min(1, dt * 2.5));
      porNacer += dt * (vertical ? 7 : 10);
      while (porNacer >= 1) { nacer(); porNacer -= 1; }
      for (const p of P) {
        p.vida += dt;
        if (p.est === "va") {
          p.u += p.vel * dt;
          if (p.cae < N && p.u >= (p.cae + 0.5) / N) {
            [p.x, p.y] = punto(p.u, p.v); p.est = "cae"; p.vida = 0;
            const lado = p.v < 0 ? -1 : 1;
            if (vertical) { p.vx = lado * (18 + R() * 22); p.vy = p.vel * FIN * largo() * 0.35; }
            else { p.vx = p.vel * FIN * largo() * 0.3; p.vy = 6 + R() * 16; }
          } else if (p.u >= 1) { [p.x, p.y] = punto(1, p.v); p.est = "llega"; p.vida = 0; }
        } else if (p.est === "cae") {
          p.x += p.vx * dt; p.y += p.vy * dt;
          if (vertical) p.vx *= 1 + dt * 0.8; else p.vy += 55 * dt;
        } else {
          const avance = p.vel * FIN * largo() * 0.25 * dt;
          if (vertical) p.y += avance; else p.x += avance;
        }
      }
      P = P.filter((p) => !(p.est === "cae" && p.vida > 1.7) && !(p.est === "llega" && p.vida > 1.4));
    };
    const dibujar = () => {
      ctx.clearRect(0, 0, W, H); ctx.lineCap = "round";
      for (const l of lineas) {
        ctx.strokeStyle = `rgba(${tinta},${l.a})`; ctx.lineWidth = l.w; ctx.beginPath();
        for (let k = 0; k <= 70; k++) {
          const u = k / 70, [x, y] = punto(u, l.v, Math.sin(u * l.f * 6.283 + l.ph + t * 0.5) * 2.2 * (1 - u * 0.6));
          if (k) ctx.lineTo(x, y); else ctx.moveTo(x, y);
        }
        ctx.stroke();
      }
      // Marca de cada etapa: un filete que cruza el haz.
      ctx.strokeStyle = `rgba(${tinta},.3)`; ctx.lineWidth = 1;
      for (let i = 0; i < N; i++) {
        const u = (i + 0.5) / N, [x1, y1] = punto(u, -1.25), [x2, y2] = punto(u, 1.25);
        ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
      }
      // Brillo de llegada: más intenso cuantos más aspirantes llegan.
      const [fx, fy] = punto(1, 0), rg = ctx.createRadialGradient(fx, fy, 0, fx, fy, cruce() * 0.35);
      rg.addColorStop(0, `rgba(${CORAL},${0.06 + 0.22 * cum[N - 1]})`); rg.addColorStop(1, `rgba(${CORAL},0)`);
      ctx.fillStyle = rg; ctx.fillRect(0, 0, W, H);
      for (const p of P) {
        let x, y, c = tinta, al = 0.9, brillo = 0;
        if (p.est === "va") { [x, y] = punto(p.u, p.v); al = 0.85 * Math.min(1, p.u * 12); }
        else if (p.est === "cae") { x = p.x; y = p.y; c = mezcla(tinta, PERDIDA, Math.min(1, p.vida / 0.35)); al = 0.8 * (1 - p.vida / 1.7); }
        else { x = p.x; y = p.y; c = CORAL; al = 1 - p.vida / 1.4; brillo = 10; }
        ctx.save(); ctx.fillStyle = `rgba(${c},${Math.max(0, al)})`;
        if (brillo) { ctx.shadowColor = `rgba(${CORAL},${al})`; ctx.shadowBlur = brillo; }
        ctx.beginPath(); ctx.arc(x, y, p.r, 0, 6.283); ctx.fill(); ctx.restore();
      }
    };
    const cuadro = (ts) => {
      const dt = previo == null ? 0 : Math.min(0.05, (ts - previo) / 1000); previo = ts;
      avanzar(dt); dibujar();
      if (visible) raf = requestAnimationFrame(cuadro);
    };
    // Arranca con el haz ya poblado (simula unos segundos sin dibujar).
    const poblar = () => { P = []; cum = acumulada(objetivo.current); for (let k = 0; k < 330; k++) avanzar(1 / 30); };

    medir(); poblar(); dibujar();
    if (!quieto) raf = requestAnimationFrame(cuadro);
    cambio.current = () => { if (quieto) { poblar(); dibujar(); } };
    const io = "IntersectionObserver" in window ? new IntersectionObserver(([e]) => {
      visible = e.isIntersecting; cancelAnimationFrame(raf); previo = null;
      if (visible && !quieto) raf = requestAnimationFrame(cuadro);
    }) : null;
    io?.observe(cv);
    let rt; const alCambiar = () => { clearTimeout(rt); rt = setTimeout(() => { medir(); dibujar(); }, 120); };
    window.addEventListener("resize", alCambiar);
    return () => { cancelAnimationFrame(raf); io?.disconnect(); window.removeEventListener("resize", alCambiar); clearTimeout(rt); cambio.current = null; };
  }, [vertical, oscuro]);

  const clave = puntajes.map((s) => s.toFixed(2)).join(",");
  useEffect(() => { cambio.current?.(); }, [clave]);

  return <canvas ref={ref} aria-hidden="true" style={{ display: "block", width: "100%", ...style }} />;
}
