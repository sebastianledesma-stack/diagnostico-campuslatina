// Cierre en la pantalla proyectada (1920×1080), en 2 pasos: resumen de la sala (la salud de las 7
// etapas, hoy y con las ideas elegidas) y estadísticas. La etapa más baja se marca con peso y un
// rótulo, no con ámbar: ámbar es lo que se puede ganar.
import { getNivel, fmt1 } from "../../lib/scoring.js";
import { diagnostico, estadisticas } from "../sala.js";
import { Cabecera, Pie, EscalonGrande } from "./proyector.jsx";
import { SaludEtapas, NIVELES } from "./Salud.jsx";
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
      <div style={{ flex: 1, display: "grid", gridTemplateColumns: "520px 1fr", gap: 96, alignItems: "center" }}>
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
              <p style={{ fontSize: 96, fontWeight: 700, lineHeight: 1.05, color: "var(--ambar-luz)", marginTop: 6 }}>
                {fmt1(dx.globalConIdeas)} <span style={{ fontSize: 32, color: "var(--pizarra)", fontWeight: 500 }}>+{fmt1(dx.globalConIdeas - dx.global)}</span>
              </p>
            </div>
          )}
        </div>
        <SaludEtapas filas={datos.participantes} dx={dx} />
      </div>
      <Pie />
    </div>
  );
}

// Estadísticas: cada persona es un punto que cae en la escala de 1 a 5 (anónimo), y abajo solo 4
// preguntas destacadas (la más fuerte, la más débil, la de más acuerdo y la de más desacuerdo), cada
// una con el reparto de sus respuestas: un solo tono es acuerdo; varios tonos parejos, desacuerdo.
export function EstadisticasSala({ datos }) {
  const est = estadisticas(datos.participantes);
  const sala = diagnostico(datos.participantes).global;
  const n = est.participantes;
  // Sin repetir: si la de más acuerdo ya salió como la más débil, va la siguiente.
  const vistas = new Set();
  const elegir = (lista) => {
    const x = lista.find((y) => !vistas.has(`${y.etapa.id}_${y.q}`));
    if (x) vistas.add(`${x.etapa.id}_${x.q}`);
    return x;
  };
  const destacados = [
    { titulo: "La más fuerte", x: elegir(est.fuertes) },
    { titulo: "La más débil", x: elegir(est.debiles) },
    ...(n >= 3 ? [{ titulo: "Más acuerdo", x: elegir(est.acuerdo) }, { titulo: "Más desacuerdo", x: elegir(est.desacuerdo) }] : []),
  ].filter((d) => d.x);
  return (
    <div style={marco}>
      <Cabecera nombre={datos.nombre} derecha={`Estadísticas · ${n} ${n === 1 ? "persona" : "personas"}`} />
      <section style={{ marginTop: 36 }}>
        <h2 style={titulo}>Cómo ve la sala a la universidad</h2>
        <p style={{ fontSize: 20, color: "var(--pizarra)", marginTop: 6 }}>Cada punto es una persona, según el promedio de sus respuestas.</p>
        <Enjambre personas={est.personas} sala={sala} niveles={est.niveles} alto={400} />
      </section>
      <div style={{ display: "grid", gridTemplateColumns: `repeat(${destacados.length}, minmax(0, 1fr))`, gap: 56, marginTop: "auto" }}>
        {destacados.map((d, i) => <Destacado key={d.titulo} {...d} i={i} />)}
      </div>
    </div>
  );
}

const titulo = { fontSize: 22, fontWeight: 600, letterSpacing: ".12em", textTransform: "uppercase", color: "var(--agua)" };

// Enjambre de puntos: cada persona cae en su lugar de la escala, apilándose sin taparse.
// Las bandas de fondo son los 4 niveles, con cuántas personas hay en cada uno.
function Enjambre({ personas, sala, niveles, alto = 270 }) {
  const ancho = 1696, eje = alto - 70;
  const x = (v) => 24 + ((v - 1) / 4) * (ancho - 48);
  const r = Math.max(7, Math.min(16, 22 - personas.length / 6));
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

// Una pregunta destacada: su texto, la etapa, su promedio y el reparto de sus respuestas en una barra
// de A (pálido) a D (intenso).
function Destacado({ titulo: rotulo, x, i }) {
  const total = x.letras.A + x.letras.B + x.letras.C + x.letras.D || 1;
  return (
    <section className="t-sube" style={{ "--i": i + 3, borderTop: "1px solid rgba(255,255,255,.14)", paddingTop: 20 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 16 }}>
        <p style={{ ...titulo, fontSize: 19 }}>{rotulo}</p>
        <b style={{ fontSize: 40, lineHeight: 1 }}>{fmt1(x.promedio)}</b>
      </div>
      <p style={{ fontSize: 22, lineHeight: 1.3, marginTop: 12, minHeight: 86, display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{x.texto}</p>
      <p style={{ fontSize: 18, color: "var(--pizarra)", marginTop: 4 }}>{x.etapa.name}</p>
      <div style={{ display: "flex", gap: 2, height: 22, borderRadius: 6, overflow: "hidden", marginTop: 14,
        animation: "t-revela .9s cubic-bezier(.2,.7,.2,1) both", animationDelay: `${1200 + i * 150}ms` }}>
        {["A", "B", "C", "D"].map((l) => x.letras[l] > 0 && (
          <span key={l} title={`${l}: ${x.letras[l]}`} style={{ width: `${(x.letras[l] / total) * 100}%`, background: colorDe({ A: 1, B: 2, C: 4, D: 5 }[l], "oscuro"),
            display: "grid", placeItems: "center", fontSize: 14, fontWeight: 700, color: l === "D" || l === "C" ? "var(--noche)" : "#fff" }}>
            {x.letras[l] / total >= 0.12 ? l : ""}
          </span>
        ))}
      </div>
    </section>
  );
}
