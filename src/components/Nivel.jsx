// Piezas del informe para mostrar niveles y puntajes sin semáforo de colores (manual de identidad):
// el nivel se lee en un escalón de 4 barras en petróleo y el puntaje en un tramo de 1 a 5.
import { getNivel, fmt1, r1 } from "../lib/scoring.js";
import { PETROLEO, EMERALD, CORAL, LINE } from "../theme.js";

export const ORDEN_NIVEL = { "Inicial": 1, "En desarrollo": 2, "Consolidado": 3, "Avanzado": 4 };
// Bordes de los niveles en la escala 1–5 (los puntajes se redondean a un decimal: 1.9 | 2.0–3.0 | 3.1–4.0 | 4.1).
export const BORDES = [1.95, 3.05, 4.05];
export const pct = (s) => `${((Math.max(1, Math.min(5, s)) - 1) / 4) * 100}%`;

export function Etiqueta({ children, color, as: Tag = "span", style, ...rest }) {
  return <Tag {...rest} style={{ fontFamily: "'CL Etiquetas',sans-serif", fontSize: 12, letterSpacing: ".12em", textTransform: "uppercase", color, ...style }}>{children}</Tag>;
}

// Cuatro barras que suben: cuántas están llenas indica el nivel.
export function Escalon({ score, oscuro, alto = 12 }) {
  const n = ORDEN_NIVEL[getNivel(score).label];
  return (
    <span aria-hidden="true" style={{ display: "inline-flex", alignItems: "flex-end", gap: 2, height: alto, flexShrink: 0 }}>
      {[1, 2, 3, 4].map((k) => (
        <span key={k} style={{ width: Math.max(3, alto / 3.2), height: `${25 * k}%`, background: k <= n ? (oscuro ? EMERALD : PETROLEO) : (oscuro ? "rgba(255,255,255,.18)" : LINE), transition: "background .4s" }} />
      ))}
    </span>
  );
}

// "2.3 · En desarrollo" con su escalón.
export function Nivel({ score, oscuro, color, tam = 12, puntaje = true }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
      <Escalon score={score} oscuro={oscuro} alto={tam} />
      <Etiqueta color={color}>{puntaje ? `${fmt1(score)} · ` : ""}{getNivel(score).label}</Etiqueta>
    </span>
  );
}

// Tramo de 1 a 5: hoy (punto lleno) y, si sube, hasta dónde llega con el plan (aro coral).
export function Tramo({ hoy, plan, oscuro, alto = 14 }) {
  const sube = plan != null && r1(plan) > r1(hoy);
  const base = oscuro ? "rgba(255,255,255,.16)" : LINE, tinta = oscuro ? EMERALD : PETROLEO;
  return (
    <svg width="100%" height={alto} aria-hidden="true" style={{ display: "block", overflow: "visible" }}>
      <line x1="0" x2="100%" y1="50%" y2="50%" stroke={base} strokeWidth="1" />
      {BORDES.map((b) => <line key={b} x1={pct(b)} x2={pct(b)} y1="20%" y2="80%" stroke={base} strokeWidth="1" />)}
      <line x1="0" x2={pct(hoy)} y1="50%" y2="50%" stroke={tinta} strokeWidth="2" style={{ transition: "all .6s cubic-bezier(.2,.7,.2,1)" }} />
      {sube && <line x1={pct(hoy)} x2={pct(plan)} y1="50%" y2="50%" stroke={CORAL} strokeWidth="2" strokeDasharray="3 3" style={{ transition: "all .6s cubic-bezier(.2,.7,.2,1)" }} />}
      {sube && <circle cx={pct(plan)} cy="50%" r="4" fill={oscuro ? "#0A2329" : "#fff"} stroke={CORAL} strokeWidth="2" style={{ transition: "all .6s cubic-bezier(.2,.7,.2,1)" }} />}
      <circle cx={pct(hoy)} cy="50%" r="4" fill={tinta} style={{ transition: "all .6s cubic-bezier(.2,.7,.2,1)" }} />
    </svg>
  );
}
