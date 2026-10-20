// Cierre en la pantalla proyectada (1920×1080), en 3 pasos: resumen de la sala (las 7 etapas, hoy y
// con las ideas elegidas), mapa de calor completo y estadísticas. La etapa más baja se marca con peso
// y un rótulo, no con coral: coral es lo que se puede ganar.
import { getNivel, fmt1 } from "../../lib/scoring.js";
import { diagnostico, estadisticas } from "../sala.js";
import { Cabecera, Pie, EscalonGrande, AGUA_BARRA } from "./proyector.jsx";
import { MapaCalor, Leyenda } from "./MapaCalor.jsx";
import { colorDe } from "../colores.js";

const marco = { position: "absolute", inset: 0, padding: "52px 112px 44px", display: "flex", flexDirection: "column" };
const personas = (datos) => datos.participantes.filter((f) => Object.keys(f.r).length).length;

export function ResumenSala({ datos }) {
  const dx = diagnostico(datos.participantes, datos.elegidas);
  const hayIdeas = dx.etapas.some((e) => e.eligieron > 0) && dx.globalConIdeas > dx.global;
  const nivel = dx.global != null ? getNivel(dx.global).label : null;
  return (
    <div style={marco}>
      <Cabecera nombre={datos.nombre} derecha={`Resultado final · ${personas(datos)} personas`} />
      <div style={{ flex: 1, display: "grid", gridTemplateColumns: "560px 1fr", gap: 112, alignItems: "center" }}>
        <div className="t-sube">
          <h1 style={{ fontSize: 64, lineHeight: 1.05, fontWeight: 700, letterSpacing: "-.02em" }}>
            El viaje <span className="t-cursiva" style={{ color: "var(--agua)", fontWeight: 400 }}>invisible</span> del aspirante
          </h1>
          {dx.global != null && (
            <>
              <p style={{ marginTop: 40, lineHeight: 1, fontWeight: 700 }}>
                <span style={{ fontSize: 200, letterSpacing: "-.04em" }}>{fmt1(dx.global)}</span>
                <span style={{ fontSize: 40, color: "var(--pizarra)", fontWeight: 500 }}> de 5</span>
              </p>
              <p style={{ fontSize: 40, fontWeight: 700, color: "var(--agua)", marginTop: 8 }}>{nivel}</p>
              <div style={{ marginTop: 20 }}><EscalonGrande nivel={nivel} /></div>
            </>
          )}
          {hayIdeas && (
            <div className="t-sube" style={{ "--i": 3, marginTop: 40, paddingTop: 28, borderTop: "1px solid rgba(255,255,255,.14)" }}>
              <p style={{ fontSize: 26, color: "var(--pizarra)" }}>Con las ideas que eligió la sala</p>
              <p style={{ fontSize: 96, fontWeight: 700, lineHeight: 1.05, color: "var(--coral)", marginTop: 6 }}>
                {fmt1(dx.globalConIdeas)} <span style={{ fontSize: 32, color: "var(--pizarra)", fontWeight: 500 }}>+{fmt1(dx.globalConIdeas - dx.global)}</span>
              </p>
            </div>
          )}
        </div>
        <div>
          {dx.etapas.map((e, i) => {
            const esFuga = dx.fuga?.id === e.id;
            const sube = hayIdeas && e.conIdeas > e.puntaje;
            return (
              <div key={e.id} className="t-sube" style={{ "--i": i + 1, marginTop: i ? 22 : 0 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 24 }}>
                  <span style={{ fontSize: 30, fontWeight: esFuga ? 700 : 500, color: esFuga ? "#fff" : "rgba(255,255,255,.85)" }}>
                    {e.num}. {e.name}
                    {esFuga && <span style={{ fontSize: 22, fontWeight: 700, marginLeft: 16, padding: "3px 14px", borderRadius: 999, border: "2px solid #fff", verticalAlign: "middle" }}>Acá se pierden más aspirantes</span>}
                  </span>
                  <span style={{ fontSize: 34, fontWeight: 700 }}>
                    {e.puntaje == null ? "—" : fmt1(e.puntaje)}
                    {sube && <span style={{ fontSize: 24, color: "var(--coral)", marginLeft: 12 }}>→ {fmt1(e.conIdeas)}</span>}
                  </span>
                </div>
                <div style={{ position: "relative", height: 20, borderRadius: 10, background: "rgba(255,255,255,.1)", marginTop: 10, overflow: "hidden" }}>
                  {sube && <span style={{ position: "absolute", inset: 0, width: `${(e.conIdeas / 5) * 100}%`, background: "rgba(255,107,74,.8)", borderRadius: 10 }} />}
                  <span style={{ position: "absolute", inset: 0, width: `${((e.puntaje || 0) / 5) * 100}%`, borderRadius: 10, background: esFuga ? "#fff" : AGUA_BARRA,
                    transformOrigin: "left", animation: "t-crece 1s cubic-bezier(.2,.7,.2,1) both", animationDelay: `${300 + i * 90}ms` }} />
                </div>
              </div>
            );
          })}
          {hayIdeas && <p style={{ fontSize: 20, color: "var(--pizarra)", marginTop: 28 }}>En coral, hasta dónde llegaría cada etapa con las ideas elegidas.</p>}
        </div>
      </div>
      <Pie />
    </div>
  );
}

const MAPA_SALA = {
  ancho: 1696, alto: 800, celdaGap: 2, bloqueGap: 18, filaGap: 2, filaMax: 24,
  cabeceraAlto: 76, cabeceraDoble: true, pieAlto: 52, letra: 18, marco: 3,
};
export function MapaSala({ datos }) {
  return (
    <div style={{ ...marco, padding: "48px 112px 40px" }}>
      <Cabecera nombre={datos.nombre} derecha={`Mapa de calor · ${personas(datos)} personas`} />
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: 40, marginTop: 20 }}>
        <p style={{ fontSize: 24, color: "var(--pizarra)" }}>
          Cada fila es una persona; cada columna, una pregunta. <span style={{ color: "#fff" }}>Más intenso, más desarrollado.</span>
        </p>
        <Leyenda tema="oscuro" letra={18} />
      </div>
      <div className="t-sube" style={{ marginTop: 16 }}>
        <MapaCalor filas={datos.participantes} tema="oscuro" m={MAPA_SALA} />
      </div>
    </div>
  );
}

// Estadísticas, con movimiento: cada persona es un punto que cae en la escala de 1 a 5 (anónimo);
// las preguntas más fuertes y más débiles se deslizan hasta su promedio; y el acuerdo se ve en el
// color: una barra de un solo tono es acuerdo, una barra repartida es desacuerdo.
export function EstadisticasSala({ datos }) {
  const est = estadisticas(datos.participantes);
  const sala = diagnostico(datos.participantes).global;
  const n = est.participantes;
  return (
    <div style={marco}>
      <Cabecera nombre={datos.nombre} derecha={`Estadísticas · ${n} ${n === 1 ? "persona" : "personas"} · ${est.respuestas} respuestas`} />
      <section style={{ marginTop: 32 }}>
        <h2 style={titulo}>Cómo ve la sala a la universidad</h2>
        <p style={{ fontSize: 20, color: "var(--pizarra)", marginTop: 6 }}>Cada punto es una persona, según el promedio de sus respuestas.</p>
        <Enjambre personas={est.personas} sala={sala} niveles={est.niveles} />
      </section>
      <div style={{ flex: 1, display: "grid", gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1fr)", gap: 96, marginTop: 24, minHeight: 0 }}>
        <section>
          <h2 style={titulo}>Lo más fuerte y lo más débil</h2>
          <Piruletas items={[...est.fuertes.map((x) => ({ ...x, fuerte: true })), ...est.debiles]} />
        </section>
        <section>
          <h2 style={titulo}>Acuerdo y desacuerdo</h2>
          {n < 3 ? (
            <p style={{ fontSize: 24, color: "var(--pizarra)", marginTop: 20, lineHeight: 1.4 }}>Hacen falta al menos 3 personas para medir el acuerdo de la sala.</p>
          ) : (
            <>
              <Reparto titulo="Más acuerdo" items={est.acuerdo} desde={0} />
              <Reparto titulo="Más desacuerdo" items={est.desacuerdo} desde={3} />
            </>
          )}
        </section>
      </div>
    </div>
  );
}

const titulo = { fontSize: 22, fontWeight: 600, letterSpacing: ".12em", textTransform: "uppercase", color: "var(--agua)" };
const NIVELES = [
  { label: "Inicial", desde: 1, hasta: 1.95 },
  { label: "En desarrollo", desde: 1.95, hasta: 3.05 },
  { label: "Consolidado", desde: 3.05, hasta: 4.05 },
  { label: "Avanzado", desde: 4.05, hasta: 5 },
];

// Enjambre de puntos: cada persona cae en su lugar de la escala, apilándose sin taparse.
// Las bandas de fondo son los 4 niveles, con cuántas personas hay en cada uno.
function Enjambre({ personas, sala, niveles }) {
  const ancho = 1696, alto = 270, eje = 200;
  const x = (v) => 24 + ((v - 1) / 4) * (ancho - 48);
  const r = Math.max(6, Math.min(14, 20 - personas.length / 6));
  // Ubicar cada punto lo más cerca posible de la línea, sin superponerse con los ya ubicados.
  const puestos = [];
  [...personas].sort((a, b) => a - b).forEach((v) => {
    const cx = x(v);
    for (let k = 0; k < 400; k++) {
      const cy = eje - r - 4 - k * (r * 0.9);
      if (cy < r) { puestos.push({ cx, cy: r, v }); return; }
      if (puestos.every((p) => (p.cx - cx) ** 2 + (p.cy - cy) ** 2 >= (2 * r + 2) ** 2)) { puestos.push({ cx, cy, v }); return; }
    }
  });
  const max = Math.max(...Object.values(niveles));
  return (
    <svg viewBox={`0 -44 ${ancho} ${alto + 44}`} width="100%" style={{ display: "block", marginTop: 8, overflow: "visible" }} role="img"
      aria-label={`${personas.length} personas en la escala de 1 a 5; promedio de la sala ${sala != null ? fmt1(sala) : "—"}`}>
      {NIVELES.map((b, i) => {
        const destacado = niveles[b.label] === max && max > 0;
        return (
          <g key={b.label}>
            <rect x={x(b.desde)} y={0} width={x(b.hasta) - x(b.desde)} height={eje} fill={i % 2 ? "rgba(255,255,255,.035)" : "rgba(255,255,255,.015)"} />
            <text x={(x(b.desde) + x(b.hasta)) / 2} y={eje + 38} textAnchor="middle" fontSize="24" fontWeight={destacado ? 700 : 500} fill={destacado ? "#fff" : "#A9C2C6"}>{b.label}</text>
            <text x={(x(b.desde) + x(b.hasta)) / 2} y={eje + 66} textAnchor="middle" fontSize="20" fill="#A9C2C6">
              {niveles[b.label]} {niveles[b.label] === 1 ? "persona" : "personas"}
            </text>
          </g>
        );
      })}
      <line x1={x(1)} x2={x(5)} y1={eje} y2={eje} stroke="rgba(255,255,255,.25)" strokeWidth="2" />
      {[1, 2, 3, 4, 5].map((v) => <text key={v} x={x(v)} y={eje + 16} textAnchor="middle" fontSize="14" fill="rgba(169,194,198,.7)">{v}</text>)}
      {puestos.map((p, i) => (
        <circle key={i} cx={p.cx} cy={p.cy} r={r} fill="var(--agua)" fillOpacity=".85"
          style={{ animation: "t-cae .7s cubic-bezier(.2,.8,.3,1.2) both", animationDelay: `${200 + i * Math.min(40, 1600 / puestos.length)}ms` }} />
      ))}
      {sala != null && (
        <g style={{ animation: "t-aparece .6s ease both", animationDelay: "1900ms" }}>
          <line x1={x(sala)} x2={x(sala)} y1={6} y2={eje} stroke="#fff" strokeWidth="3" strokeDasharray="6 6" />
          <rect x={x(sala) - 74} y={-30} width="148" height="34" rx="17" fill="#fff" />
          <text x={x(sala)} y={-6} textAnchor="middle" fontSize="20" fontWeight="700" fill="var(--noche)">La sala {fmt1(sala)}</text>
        </g>
      )}
    </svg>
  );
}

// Lo más fuerte y lo más débil: cada pregunta se desliza desde 1 hasta su promedio.
function Piruletas({ items }) {
  return (
    <ol style={{ listStyle: "none", margin: "18px 0 0", padding: 0 }}>
      {items.map((x, i) => (
        <li key={`${x.etapa.id}-${x.q}`} style={{ marginTop: i === 3 ? 18 : i ? 8 : 0 }}>
          <p style={{ fontSize: 19, lineHeight: 1.3, color: "rgba(255,255,255,.9)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            <span style={{ color: x.fuerte ? "var(--agua)" : "#fff", fontWeight: 700 }}>{x.fuerte ? "↑" : "↓"}</span> {x.texto} <span style={{ color: "var(--pizarra)" }}>· {x.etapa.name}</span>
          </p>
          <div style={{ position: "relative", height: 22, marginTop: 6 }}>
            <div style={{ position: "absolute", left: 0, right: 64, top: 10, height: 2, background: "rgba(255,255,255,.15)" }} />
            <div style={{ position: "absolute", left: 0, top: 3, width: `calc((100% - 64px) * ${(x.promedio - 1) / 4})`, height: 16, display: "flex", justifyContent: "flex-end",
              animation: "t-desde-cero 1.1s cubic-bezier(.2,.7,.2,1) both", animationDelay: `${600 + i * 110}ms` }}>
              <div style={{ height: 3, alignSelf: "center", flex: 1, background: x.fuerte ? "var(--agua)" : "rgba(255,255,255,.55)" }} />
              <div style={{ width: 16, height: 16, borderRadius: "50%", background: x.fuerte ? "var(--agua)" : "#fff", flex: "none" }} />
            </div>
            <b style={{ position: "absolute", right: 0, top: -6, fontSize: 24 }}>{fmt1(x.promedio)}</b>
          </div>
        </li>
      ))}
    </ol>
  );
}

// Reparto de respuestas de una pregunta en una barra: de A (pálido) a D (intenso). Un solo tono es
// acuerdo; varios tonos parejos, desacuerdo.
function Reparto({ titulo: subtitulo, items, desde }) {
  return (
    <div style={{ marginTop: desde ? 16 : 14 }}>
      <p style={{ fontSize: 18, color: "var(--pizarra)", letterSpacing: ".08em", textTransform: "uppercase", fontWeight: 600 }}>{subtitulo}</p>
      {items.map((x, i) => {
        const total = x.letras.A + x.letras.B + x.letras.C + x.letras.D || 1;
        return (
          <div key={`${x.etapa.id}-${x.q}`} style={{ marginTop: 8 }}>
            <p style={{ fontSize: 19, lineHeight: 1.3, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", color: "rgba(255,255,255,.9)" }}>
              {x.texto} <span style={{ color: "var(--pizarra)" }}>· {x.etapa.name}</span>
            </p>
            <div style={{ display: "flex", height: 20, borderRadius: 6, overflow: "hidden", marginTop: 5,
              animation: "t-revela .9s cubic-bezier(.2,.7,.2,1) both", animationDelay: `${900 + (desde + i) * 120}ms` }}>
              {["A", "B", "C", "D"].map((l) => x.letras[l] > 0 && (
                <span key={l} title={`${l}: ${x.letras[l]}`} style={{ width: `${(x.letras[l] / total) * 100}%`, background: colorDe({ A: 1, B: 2, C: 4, D: 5 }[l], "oscuro"),
                  display: "grid", placeItems: "center", fontSize: 13, fontWeight: 700, color: l === "D" || l === "C" ? "var(--noche)" : "#fff" }}>
                  {x.letras[l] / total >= 0.12 ? l : ""}
                </span>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
