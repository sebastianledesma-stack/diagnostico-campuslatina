// Gráfico del resultado de una etapa en la pantalla proyectada: una barra por pregunta con el promedio
// de la sala, sobre la escala de 1 a 5 con las bandas de los 4 niveles de fondo. La más baja va más
// oscura y con un rótulo, nunca con el destaque: el destaque es lo que se puede ganar.
import { fmt1 } from "../../lib/scoring.js";
import { ETAPAS_DATA } from "../datos.js";
import { distribucion } from "../sala.js";

export const NIVELES = [
  { label: "Inicial", desde: 1, hasta: 1.95 },
  { label: "En desarrollo", desde: 1.95, hasta: 3.05 },
  { label: "Consolidado", desde: 3.05, hasta: 4.05 },
  { label: "Avanzado", desde: 4.05, hasta: 5 },
];

const VALOR = 128; // columna del número a la derecha
const ALTO = 44, BARRA = 28;
const escala = (ancho) => (v) => ((Math.max(1, Math.min(5, v)) - 1) / 4) * ancho;

// La más baja, solo si se distingue de la siguiente (en un empate no hay una sola "más baja").
function laMasBaja(items) {
  const con = items.filter((x) => x.valor != null).sort((a, b) => a.valor - b.valor);
  return con.length > 1 && fmt1(con[0].valor) !== fmt1(con[1].valor) ? con[0].id : null;
}

// Los nombres de los niveles, una sola vez arriba de las barras.
function EjeNiveles({ ancho }) {
  const x = escala(ancho);
  return (
    <svg width={ancho} height={30} viewBox={`0 0 ${ancho} 30`} aria-hidden="true" style={{ display: "block", flex: "none" }}>
      {NIVELES.map((b) => (
        <text key={b.label} x={(x(b.desde) + x(b.hasta)) / 2} y={22} textAnchor="middle" fontSize="20" fontWeight="600" fill="#4D6166">{b.label}</text>
      ))}
    </svg>
  );
}

// Una barra sobre la escala de 1 a 5, con las bandas de nivel de fondo.
function Barra({ ancho, valor, oscura, demora, etiqueta }) {
  const x = escala(ancho);
  const y = (ALTO - BARRA) / 2;
  return (
    <svg width={ancho} height={ALTO} viewBox={`0 0 ${ancho} ${ALTO}`} role="img" aria-label={etiqueta} style={{ display: "block", flex: "none", borderRadius: 8 }}>
      {NIVELES.map((b, i) => (
        <rect key={b.label} x={x(b.desde)} y={0} width={x(b.hasta) - x(b.desde)} height={ALTO} fill={i % 2 ? "#D9E7E9" : "#E2EDEE"} />
      ))}
      {valor != null && (
        <rect x={0} y={y} width={x(valor)} height={BARRA} rx={6} fill={oscura ? "var(--profundo)" : "var(--petroleo)"} className="t-crece-svg" style={{ animationDelay: demora }} />
      )}
    </svg>
  );
}

const Rotulo = ({ children }) => (
  <span style={{ flex: "none", fontSize: 17, fontWeight: 600, color: "var(--profundo)", border: "2px solid var(--profundo)", borderRadius: 999, padding: "1px 12px", whiteSpace: "nowrap" }}>{children}</span>
);

// Resultado de una etapa: el promedio de la sala en cada pregunta (A, B, C y D valen 1, 2, 4 y 5).
export function SaludPreguntas({ filas, etapa, ancho = 1128 }) {
  const e = ETAPAS_DATA.find((x) => x.id === etapa);
  const pista = ancho - VALOR - 28;
  const preguntas = e.preguntas.map((p, q) => {
    const d = distribucion(filas, e.id, q);
    return { id: q, texto: p.texto, valor: d.total ? d.opciones.reduce((t, o) => t + o.n * o.valor, 0) / d.total : null };
  });
  const baja = laMasBaja(preguntas);
  return (
    <div style={{ width: ancho }}>
      <EjeNiveles ancho={pista} />
      {preguntas.map((r, i) => (
        <div key={r.id} className="t-sube" style={{ "--i": i + 1, marginTop: i ? 30 : 16 }}>
          {/* El rótulo va fuera del texto recortado a 2 líneas, para que nunca quede escondido. */}
          <div style={{ display: "flex", alignItems: "baseline", gap: 12 }}>
            <p style={{ fontSize: 26, lineHeight: 1.3, fontWeight: r.id === baja ? 700 : 500, color: r.id === baja ? "var(--profundo)" : "var(--texto)",
              display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
              <span style={{ color: "var(--petroleo)", fontWeight: 700, marginRight: 12 }}>{r.id + 1}</span>{r.texto}
            </p>
            {r.id === baja && <Rotulo>La más baja</Rotulo>}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 28, marginTop: 10 }}>
            <Barra ancho={pista} valor={r.valor} oscura={r.id === baja} demora={`${250 + i * 120}ms`}
              etiqueta={`Pregunta ${r.id + 1}: promedio ${r.valor == null ? "sin respuestas" : fmt1(r.valor)}`} />
            <b style={{ fontSize: 44, lineHeight: 1, letterSpacing: "-.02em", color: "var(--profundo)" }}>{r.valor == null ? "—" : fmt1(r.valor)}</b>
          </div>
        </div>
      ))}
    </div>
  );
}
