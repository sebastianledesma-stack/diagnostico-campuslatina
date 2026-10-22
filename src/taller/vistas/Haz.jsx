// El haz del recorrido: el mismo recurso que el informe del diagnóstico (Flujo.jsx del rediseño).
// Puntos de luz recorren las 7 etapas por un haz de líneas finas que en cada etapa se angosta según
// el puntaje de la sala: con puntajes bajos, más puntos quedan en el camino (en gris); los que llegan
// al final se encienden en ámbar (el destaque de la marca). Cuando cambian los puntajes (hoy → con las ideas), el haz se abre de
// a poco. Es una ilustración del puntaje, no una medición. Con movimiento reducido se dibuja quieto.
import { useEffect, useRef } from "react";

const PETROLEO = [11, 100, 112], AMBAR = [240, 140, 26], PERDIDA = [154, 168, 171]; // ámbar: #F08C1A, sobre fondo claro
const N = 7;
export const FIN = 0.93;                            // el haz ocupa el 93 % del largo; el resto es la llegada
export const posEtapa = (i) => FIN * (i + 0.5) / N; // centro de cada etapa, para ubicar los rótulos
const PERDIDA_MAX = 0.36;                           // con puntaje 1 la etapa retiene el 64 %; con 5, todos siguen
const retencion = (s) => 1 - PERDIDA_MAX * (5 - Math.max(1, Math.min(5, s || 1))) / 4;
const acumulada = (ps) => { let c = 1; return ps.map((s) => (c *= retencion(s))); };
const suave = (a, b, x) => { const t = Math.max(0, Math.min(1, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
const mezcla = (a, b, t) => a.map((v, k) => Math.round(v + (b[k] - v) * t));
const sinMovimiento = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export function Haz({ puntajes, ancho = 1696, alto = 480 }) {
  const ref = useRef(null);
  const objetivo = useRef(puntajes);
  const cambio = useRef(null);
  objetivo.current = puntajes;

  useEffect(() => {
    const cv = ref.current;
    const ctx = cv.getContext("2d"), quieto = sinMovimiento(), tinta = PETROLEO;
    const W = ancho, H = alto, d = 2;
    cv.width = W * d; cv.height = H * d; ctx.setTransform(d, 0, 0, d, 0, 0);
    let raf = 0, previo = null, porNacer = 0, t = 0, semilla = 11;
    const R = () => { semilla = (semilla * 16807) % 2147483647; return (semilla - 1) / 2147483646; };
    let cum = acumulada(objetivo.current);
    const lineas = Array.from({ length: 30 }, (_, k) => ({ v: -1 + 2 * k / 29, ph: R() * 6.28, f: 1.5 + R() * 2.5, a: 0.1 + R() * 0.13, w: 0.7 + R() * 0.8 }));
    let P = [];
    const centro = H * 0.44, semi = H * 0.38;
    // Ancho relativo del haz en u (0–1 sobre el tramo de etapas): baja a la retención acumulada en cada etapa.
    const anchoEn = (u) => {
      let w = 1;
      for (let i = 0; i < N; i++) {
        const c = (i + 0.5) / N, a = c - 0.03, b = c + 0.05;
        if (u <= a) return w;
        if (u < b) return w + (cum[i] - w) * suave(a, b, u);
        w = cum[i];
      }
      return w;
    };
    const punto = (u, v, onda = 0) => [Math.min(u, 1.05) * FIN * W, centro + v * semi * (0.1 + 0.9 * anchoEn(Math.min(u, 1))) + onda];
    const nacer = () => {
      const ps = objetivo.current; let cae = N;
      for (let i = 0; i < N; i++) if (R() > retencion(ps[i])) { cae = i; break; }
      P.push({ u: 0, v: R() * 1.8 - 0.9, vel: 0.085 + R() * 0.035, cae, est: "va", r: 2.6 + R() * 2.6, vida: 0, x: 0, y: 0, vx: 0, vy: 0 });
    };
    const avanzar = (dt) => {
      t += dt;
      const meta = acumulada(objetivo.current);
      cum = cum.map((c, i) => c + (meta[i] - c) * Math.min(1, dt * 1.6));
      porNacer += dt * 20;
      while (porNacer >= 1) { nacer(); porNacer -= 1; }
      for (const p of P) {
        p.vida += dt;
        if (p.est === "va") {
          p.u += p.vel * dt;
          if (p.cae < N && p.u >= (p.cae + 0.5) / N) { [p.x, p.y] = punto(p.u, p.v); p.est = "cae"; p.vida = 0; p.vx = p.vel * FIN * W * 0.3; p.vy = 6 + R() * 16; }
          else if (p.u >= 1) { [p.x, p.y] = punto(1, p.v); p.est = "llega"; p.vida = 0; }
        } else if (p.est === "cae") { p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 55 * dt; }
        else p.x += p.vel * FIN * W * 0.25 * dt;
      }
      P = P.filter((p) => !(p.est === "cae" && p.vida > 1.7) && !(p.est === "llega" && p.vida > 1.4));
    };
    const dibujar = () => {
      ctx.clearRect(0, 0, W, H); ctx.lineCap = "round";
      for (const l of lineas) {
        ctx.strokeStyle = `rgba(${tinta},${l.a})`; ctx.lineWidth = l.w; ctx.beginPath();
        for (let k = 0; k <= 80; k++) {
          const u = k / 80, [x, y] = punto(u, l.v, Math.sin(u * l.f * 6.283 + l.ph + t * 0.5) * 3 * (1 - u * 0.6));
          if (k) ctx.lineTo(x, y); else ctx.moveTo(x, y);
        }
        ctx.stroke();
      }
      // Marca de cada etapa: un filete que cruza el haz.
      ctx.strokeStyle = `rgba(${tinta},.3)`; ctx.lineWidth = 1.2;
      for (let i = 0; i < N; i++) {
        const u = (i + 0.5) / N, [x1, y1] = punto(u, -1.25), [x2, y2] = punto(u, 1.25);
        ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
      }
      // Brillo de llegada: más intenso cuantos más aspirantes llegan.
      const [fx, fy] = punto(1, 0), rg = ctx.createRadialGradient(fx, fy, 0, fx, fy, H * 0.45);
      rg.addColorStop(0, `rgba(${AMBAR},${0.08 + 0.3 * cum[N - 1]})`); rg.addColorStop(1, `rgba(${AMBAR},0)`);
      ctx.fillStyle = rg; ctx.fillRect(0, 0, W, H);
      for (const p of P) {
        let x, y, c = tinta, al = 0.9, brillo = 0;
        if (p.est === "va") { [x, y] = punto(p.u, p.v); al = 0.85 * Math.min(1, p.u * 12); }
        else if (p.est === "cae") { x = p.x; y = p.y; c = mezcla(tinta, PERDIDA, Math.min(1, p.vida / 0.35)); al = 0.8 * (1 - p.vida / 1.7); }
        else { x = p.x; y = p.y; c = AMBAR; al = 1 - p.vida / 1.4; brillo = 14; }
        ctx.save(); ctx.fillStyle = `rgba(${c},${Math.max(0, al)})`;
        if (brillo) { ctx.shadowColor = `rgba(${AMBAR},${al})`; ctx.shadowBlur = brillo; }
        ctx.beginPath(); ctx.arc(x, y, p.r, 0, 6.283); ctx.fill(); ctx.restore();
      }
    };
    const cuadro = (ts) => {
      const dt = previo == null ? 0 : Math.min(0.05, (ts - previo) / 1000); previo = ts;
      avanzar(dt); dibujar();
      raf = requestAnimationFrame(cuadro);
    };
    // Arranca con el haz ya poblado (simula unos segundos sin dibujar).
    const poblar = () => { P = []; for (let k = 0; k < 330; k++) avanzar(1 / 30); cum = acumulada(objetivo.current); };

    poblar(); dibujar();
    if (!quieto) raf = requestAnimationFrame(cuadro);
    cambio.current = () => { if (quieto) { poblar(); dibujar(); } };
    return () => { cancelAnimationFrame(raf); cambio.current = null; };
  }, [ancho, alto]);

  const clave = puntajes.map((s) => (s ?? 0).toFixed(2)).join(",");
  useEffect(() => { cambio.current?.(); }, [clave]);

  return <canvas ref={ref} aria-hidden="true" style={{ display: "block", width: ancho, height: alto }} />;
}
