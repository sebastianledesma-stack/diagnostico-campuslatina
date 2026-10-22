// Gráficos de la pantalla proyectada para leer la salud de la sala de un vistazo, sobre la escala de
// 1 a 5 con las bandas de los 4 niveles: una fila por pregunta (resultado de una etapa) o por etapa
// (resultado final). Los círculos son personas: el tamaño dice cuántas, el color (de pálido a
// intenso) cuán desarrollado. La línea blanca es el promedio de la sala y, en ámbar, hasta dónde
// llegaría con las ideas elegidas. Reemplazan las tablas de porcentajes y el mapa de calor: el
// reparto y el promedio se ven en el mismo lugar.
import { fmt1, calcScore } from "../../lib/scoring.js";
import { ETAPAS_DATA } from "../datos.js";
import { distribucion, conRespuestas } from "../sala.js";
import { colorDe, ESCALAS } from "../colores.js";

export const NIVELES = [
  { label: "Inicial", desde: 1, hasta: 1.95 },
  { label: "En desarrollo", desde: 1.95, hasta: 3.05 },
  { label: "Consolidado", desde: 3.05, hasta: 4.05 },
  { label: "Avanzado", desde: 4.05, hasta: 5 },
];

const PIZARRA = "#A9C2C6";
const escala = (ancho, pad) => (v) => pad + ((v - 1) / 4) * (ancho - 2 * pad);

// Las 4 bandas de nivel de fondo (la primera y la última llegan al borde) y la línea base.
function Bandas({ x, ancho, alto, cy }) {
  const borde = (v) => (v <= 1 ? 0 : v >= 5 ? ancho : x(v));
  return (
    <>
      {NIVELES.map((b, i) => (
        <rect key={b.label} x={borde(b.desde)} y={0} width={borde(b.hasta) - borde(b.desde)} height={alto} fill={i % 2 ? "rgba(255,255,255,.045)" : "rgba(255,255,255,.018)"} />
      ))}
      <line x1={x(1)} x2={x(5)} y1={cy} y2={cy} stroke="rgba(255,255,255,.2)" strokeWidth="2" />
    </>
  );
}

// Los nombres de los niveles, una sola vez arriba de las filas.
function EjeNiveles({ ancho, pad }) {
  const x = escala(ancho, pad);
  const borde = (v) => (v <= 1 ? 0 : v >= 5 ? ancho : x(v));
  return (
    <svg width={ancho} height={30} viewBox={`0 0 ${ancho} 30`} aria-hidden="true" style={{ display: "block", flex: "none" }}>
      {NIVELES.map((b) => (
        <text key={b.label} x={(borde(b.desde) + borde(b.hasta)) / 2} y={22} textAnchor="middle" fontSize="20" fontWeight="600" fill={PIZARRA}>{b.label}</text>
      ))}
    </svg>
  );
}

// Un grupo de personas en un mismo valor. Con el número adentro si entra, o arriba si es chico.
function Circulo({ cx, cy, r, v, n, conNumero, demora }) {
  return (
    <g>
      {/* Borde claro: los valores bajos son oscuros y en un proyector se perderían contra el fondo. */}
      <circle cx={cx} cy={cy} r={r} fill={colorDe(v)} stroke="rgba(255,255,255,.3)" strokeWidth="1.5" className="t-brota" style={{ animationDelay: demora }} />
      {conNumero && (r >= 17
        ? <text x={cx} y={cy} dy=".35em" textAnchor="middle" fontSize={Math.min(26, Math.round(r * 0.72))} fontWeight="700" fill={ESCALAS.oscuro.textoCelda(v)}
            style={{ animation: "t-aparece .4s ease both", animationDelay: demora }}>{n}</text>
        : <text x={cx} y={cy - r - 8} textAnchor="middle" fontSize="18" fontWeight="600" fill={PIZARRA}
            style={{ animation: "t-aparece .4s ease both", animationDelay: demora }}>{n}</text>)}
    </g>
  );
}

// El promedio de la sala: una línea blanca con un borde del color del fondo para que se lea sobre los círculos.
function Promedio({ x, v, alto, demora }) {
  return (
    <g style={{ animation: "t-aparece .5s ease both", animationDelay: demora }}>
      <line x1={x(v)} x2={x(v)} y1={4} y2={alto - 4} stroke="var(--noche)" strokeWidth="9" strokeLinecap="round" />
      <line x1={x(v)} x2={x(v)} y1={4} y2={alto - 4} stroke="#fff" strokeWidth="3" strokeLinecap="round" />
    </g>
  );
}

function Leyenda({ ideas = false, personas }) {
  const item = { display: "inline-flex", alignItems: "center", gap: 10, whiteSpace: "nowrap" };
  return (
    <div style={{ display: "flex", gap: 32, fontSize: 20, color: PIZARRA, marginTop: 22 }}>
      <span style={item}>
        <svg width="34" height="22" aria-hidden="true"><circle cx="9" cy="11" r="6" fill={colorDe(2)} /><circle cx="24" cy="11" r="9" fill={colorDe(4.5)} /></svg>
        {personas}
      </span>
      <span style={item}><svg width="10" height="26" aria-hidden="true"><line x1="5" x2="5" y1="2" y2="24" stroke="#fff" strokeWidth="3" strokeLinecap="round" /></svg>Promedio de la sala</span>
      {ideas && (
        <span style={item}><svg width="34" height="14" aria-hidden="true"><line x1="2" x2="24" y1="7" y2="7" stroke="var(--ambar-luz)" strokeWidth="4" strokeLinecap="round" /><circle cx="27" cy="7" r="6" fill="var(--ambar-luz)" /></svg>Con las ideas elegidas</span>
      )}
    </div>
  );
}

// Resultado de una etapa: una fila por pregunta. El tamaño de cada círculo es cuántas personas
// eligieron esa respuesta (A, B, C o D, que valen 1, 2, 4 y 5). La pregunta más baja va en negrita.
export function SaludPreguntas({ filas, etapa, ancho = 1128 }) {
  const e = ETAPAS_DATA.find((x) => x.id === etapa);
  const VALOR = 128, ALTO = 96, CY = 48, PAD = 44, RMAX = 40;
  const pista = ancho - VALOR;
  const x = escala(pista, PAD);
  const preguntas = e.preguntas.map((p, q) => {
    const d = distribucion(filas, e.id, q);
    return { p, q, d, prom: d.total ? d.opciones.reduce((t, o) => t + o.n * o.valor, 0) / d.total : null };
  });
  const max = Math.max(1, ...preguntas.flatMap((r) => r.d.opciones.map((o) => o.n)));
  const conDatos = preguntas.filter((r) => r.prom != null);
  const baja = conDatos.length > 1 ? conDatos.reduce((a, b) => (b.prom < a.prom ? b : a)).q : null;
  return (
    <div style={{ width: ancho }}>
      <EjeNiveles ancho={pista} pad={PAD} />
      {preguntas.map((r, i) => {
        const destacada = r.q === baja;
        return (
          <div key={r.q} className="t-sube" style={{ "--i": i + 1, marginTop: i ? 22 : 14 }}>
            <p style={{ fontSize: 26, lineHeight: 1.3, fontWeight: destacada ? 700 : 500, color: destacada ? "#fff" : "rgba(255,255,255,.8)",
              display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden", paddingRight: VALOR }}>
              <span style={{ color: "var(--agua)", fontWeight: 700, marginRight: 12 }}>{r.q + 1}</span>{r.p.texto}
            </p>
            <div style={{ display: "flex", alignItems: "center", marginTop: 4 }}>
              <svg width={pista} height={ALTO} viewBox={`0 0 ${pista} ${ALTO}`} role="img" style={{ display: "block", flex: "none", overflow: "visible" }}
                aria-label={`Pregunta ${r.q + 1}: ${r.d.opciones.map((o) => `${o.letra} ${o.n}`).join(", ")}; promedio ${r.prom == null ? "sin respuestas" : fmt1(r.prom)}`}>
                <Bandas x={x} ancho={pista} alto={ALTO} cy={CY} />
                {r.d.opciones.map((o) => (o.n > 0
                  ? <Circulo key={o.letra} cx={x(o.valor)} cy={CY} r={Math.max(9, RMAX * Math.sqrt(o.n / max))} v={o.valor} n={o.n} conNumero demora={`${250 + i * 140}ms`} />
                  : <circle key={o.letra} cx={x(o.valor)} cy={CY} r="5" fill="none" stroke="rgba(255,255,255,.25)" strokeWidth="2" />))}
                {r.prom != null && <Promedio x={x} v={r.prom} alto={ALTO} demora={`${800 + i * 140}ms`} />}
              </svg>
              <b style={{ width: VALOR, textAlign: "right", fontSize: 44, lineHeight: 1, letterSpacing: "-.02em" }}>{r.prom == null ? "—" : fmt1(r.prom)}</b>
            </div>
          </div>
        );
      })}
      <Leyenda personas="Personas que eligieron cada respuesta" />
    </div>
  );
}

// Resultado final: una fila por etapa. Cada círculo junta a las personas que le dieron el mismo
// puntaje a esa etapa; en ámbar, hasta dónde llegaría con las ideas que eligió la sala.
export function SaludEtapas({ filas, dx, ancho = 1080 }) {
  const NOMBRE = 290, VALOR = 130, ALTO = 84, CY = 42, PAD = 22, RMAX = 18;
  const pista = ancho - NOMBRE - VALOR;
  const x = escala(pista, PAD);
  // Puntajes de cada persona por etapa, agrupados de a 0,25 (el paso de los promedios de 4 respuestas).
  const grupos = dx.etapas.map((e) => {
    const n = {};
    conRespuestas(filas, e.id).forEach((f) => { const v = Math.round(calcScore(f.r, e.id) * 4) / 4; n[v] = (n[v] || 0) + 1; });
    return Object.entries(n).map(([v, k]) => ({ v: Number(v), n: k }));
  });
  const max = Math.max(1, ...grupos.flat().map((g) => g.n));
  const hayIdeas = dx.etapas.some((e) => e.puntaje != null && e.conIdeas > e.puntaje + 0.04);
  return (
    <div style={{ width: ancho }}>
      <div style={{ display: "flex", paddingLeft: NOMBRE }}><EjeNiveles ancho={pista} pad={PAD} /></div>
      {dx.etapas.map((e, i) => {
        const fuga = dx.fuga?.id === e.id;
        const sube = e.puntaje != null && e.conIdeas > e.puntaje + 0.04;
        return (
          <div key={e.id} className="t-sube" style={{ "--i": i + 1, display: "flex", alignItems: "center", marginTop: i ? 10 : 8 }}>
            <div style={{ width: NOMBRE, flex: "none", paddingRight: 20 }}>
              <p style={{ fontSize: 26, lineHeight: 1.2, fontWeight: fuga ? 700 : 500, color: fuga ? "#fff" : "rgba(255,255,255,.82)" }}>{e.num}. {e.name}</p>
              {fuga && <p style={{ fontSize: 18, fontWeight: 600, color: "#fff", marginTop: 4 }}>Acá se pierden más aspirantes</p>}
            </div>
            <svg width={pista} height={ALTO} viewBox={`0 0 ${pista} ${ALTO}`} role="img" style={{ display: "block", flex: "none", overflow: "visible" }}
              aria-label={`${e.name}: promedio ${e.puntaje == null ? "sin respuestas" : fmt1(e.puntaje)}${sube ? `, con las ideas ${fmt1(e.conIdeas)}` : ""}`}>
              <Bandas x={x} ancho={pista} alto={ALTO} cy={CY} />
              {grupos[i].map((g) => (
                <Circulo key={g.v} cx={x(g.v)} cy={CY} r={Math.max(5, RMAX * Math.sqrt(g.n / max))} v={g.v} n={g.n} demora={`${250 + i * 90}ms`} />
              ))}
              {sube && (
                <g style={{ animation: "t-aparece .5s ease both", animationDelay: `${1300 + i * 90}ms` }}>
                  <line x1={x(e.puntaje)} x2={x(e.conIdeas)} y1={CY} y2={CY} stroke="var(--noche)" strokeWidth="9" strokeLinecap="round" />
                  <line x1={x(e.puntaje)} x2={x(e.conIdeas)} y1={CY} y2={CY} stroke="var(--ambar-luz)" strokeWidth="4" strokeLinecap="round" />
                  <circle cx={x(e.conIdeas)} cy={CY} r="8" fill="var(--ambar-luz)" stroke="var(--noche)" strokeWidth="2" />
                </g>
              )}
              {e.puntaje != null && <Promedio x={x} v={e.puntaje} alto={ALTO} demora={`${700 + i * 90}ms`} />}
            </svg>
            <p style={{ width: VALOR, flex: "none", textAlign: "right", lineHeight: 1.05 }}>
              <b style={{ fontSize: 40, letterSpacing: "-.02em" }}>{e.puntaje == null ? "—" : fmt1(e.puntaje)}</b>
              {sube && <span style={{ display: "block", fontSize: 24, fontWeight: 700, color: "var(--ambar-luz)" }}>→ {fmt1(e.conIdeas)}</span>}
            </p>
          </div>
        );
      })}
      <div style={{ paddingLeft: NOMBRE }}><Leyenda ideas={hayIdeas} personas="Personas, según su puntaje" /></div>
    </div>
  );
}
