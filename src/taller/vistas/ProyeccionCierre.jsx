// Cierre en la pantalla proyectada (1920×1080), en 3 pasos: resumen de la sala (las 7 etapas, hoy y
// con las ideas elegidas), mapa de calor completo y estadísticas. La etapa más baja se marca con peso
// y un rótulo, no con coral: coral es lo que se puede ganar.
import { getNivel, fmt1 } from "../../lib/scoring.js";
import { diagnostico, estadisticas } from "../sala.js";
import { Cabecera, Pie, EscalonGrande, AGUA_BARRA } from "./proyector.jsx";
import { MapaCalor, Leyenda } from "./MapaCalor.jsx";

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

// Estadísticas: cómo ve la sala a la universidad, qué preguntas están más fuertes y más débiles,
// y dónde hubo más acuerdo y más desacuerdo (lo que más conversación genera).
export function EstadisticasSala({ datos }) {
  const est = estadisticas(datos.participantes);
  const maxNivel = Math.max(1, ...Object.values(est.niveles));
  return (
    <div style={marco}>
      <Cabecera nombre={datos.nombre} derecha={`Estadísticas · ${est.participantes} personas · ${est.respuestas} respuestas`} />
      <div style={{ flex: 1, display: "grid", gridTemplateColumns: "1fr 1fr", gridTemplateRows: "auto 1fr", gap: "48px 96px", marginTop: 48 }}>
        <section className="t-sube">
          <h2 style={titulo}>Cómo ve la sala a la universidad</h2>
          {Object.entries(est.niveles).map(([nivel, n], i) => (
            <div key={nivel} style={{ display: "grid", gridTemplateColumns: "240px 1fr 64px", alignItems: "center", gap: 20, marginTop: i ? 16 : 20 }}>
              <span style={{ fontSize: 26 }}>{nivel}</span>
              <span style={{ height: 22, borderRadius: 11, background: "rgba(255,255,255,.1)", overflow: "hidden" }}>
                <span style={{ display: "block", height: "100%", width: `${(n / maxNivel) * 100}%`, background: AGUA_BARRA, borderRadius: 11,
                  transformOrigin: "left", animation: "t-crece 1s cubic-bezier(.2,.7,.2,1) both", animationDelay: `${i * 90}ms` }} />
              </span>
              <b style={{ fontSize: 30, textAlign: "right" }}>{n}</b>
            </div>
          ))}
          <p style={{ fontSize: 20, color: "var(--pizarra)", marginTop: 16 }}>Personas según el promedio de sus respuestas.</p>
        </section>
        <section className="t-sube" style={{ "--i": 1 }}>
          <h2 style={titulo}>Más fuertes y más débiles</h2>
          <Lista items={est.fuertes} marca="↑" />
          <Lista items={est.debiles} marca="↓" />
        </section>
        <section className="t-sube" style={{ "--i": 2 }}>
          <h2 style={titulo}>Donde la sala estuvo más de acuerdo</h2>
          <Lista items={est.acuerdo} />
        </section>
        <section className="t-sube" style={{ "--i": 3 }}>
          <h2 style={titulo}>Donde hubo más desacuerdo</h2>
          <Lista items={est.desacuerdo} />
        </section>
      </div>
    </div>
  );
}

const titulo = { fontSize: 22, fontWeight: 600, letterSpacing: ".12em", textTransform: "uppercase", color: "var(--agua)" };

function Lista({ items, marca }) {
  return (
    <ol style={{ listStyle: "none", margin: "16px 0 0", padding: 0 }}>
      {items.map((x) => (
        <li key={`${x.etapa.id}-${x.q}`} style={{ display: "grid", gridTemplateColumns: marca ? "28px 1fr 72px" : "1fr 72px", gap: 12, alignItems: "baseline", marginTop: 12 }}>
          {marca && <span style={{ fontSize: 26, color: "var(--pizarra)" }}>{marca}</span>}
          <span style={{ fontSize: 23, lineHeight: 1.3 }}>{x.texto} <span style={{ color: "var(--pizarra)" }}>· {x.etapa.name}</span></span>
          <b style={{ fontSize: 28, textAlign: "right" }}>{fmt1(x.promedio)}</b>
        </li>
      ))}
    </ol>
  );
}
