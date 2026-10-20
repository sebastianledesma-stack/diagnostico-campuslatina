// Pantalla proyectada durante una etapa (1920×1080): abierta (contador en vivo) y sus resultados en
// 3 pasos: resultado (puntaje y barras), mapa de calor de la etapa e ideas para subir.
// Solo el nombre y la pregunta guía de la etapa: sin el resumen, que describe dudas puntuales del aspirante.
import { Qr } from "../Qr.jsx";
import { ETAPAS_DATA, CONSIGNA, CONSIGNA_TITULO, urlParticipante, urlCorta } from "../datos.js";
import { getNivel, fmt1 } from "../../lib/scoring.js";
import { completaron, conRespuestas, puntajeEtapa, distribucion, ideasEtapa, puntajeConIdeas } from "../sala.js";
import { Cabecera, Recorrido, Pie, EscalonGrande, AGUA_BARRA } from "./proyector.jsx";
import { MapaCalor, Leyenda } from "./MapaCalor.jsx";

const marco = { position: "absolute", inset: 0, padding: "52px 96px 44px", display: "flex", flexDirection: "column" };
const Numero = ({ valor, tam = 200 }) => (
  <p style={{ lineHeight: 1, fontWeight: 700 }}>
    <span style={{ fontSize: tam, letterSpacing: "-.04em" }}>{fmt1(valor)}</span>
    <span style={{ fontSize: tam / 5, color: "var(--pizarra)", fontWeight: 500 }}> de 5</span>
  </p>
);

// Encabezado común de los resultados: evento, paso y recorrido de 7 etapas.
function Encabezado({ datos, e, paso }) {
  const n = conRespuestas(datos.participantes, e.id).length;
  return (
    <>
      <Cabecera nombre={datos.nombre} derecha={`${paso} · ${n} ${n === 1 ? "persona" : "personas"}`} />
      <Recorrido etapa={e.num} reveladas={datos.reveladas} compacto />
    </>
  );
}

function TituloEtapa({ e, tam = 64 }) {
  return (
    <>
      <p style={{ fontSize: 24, color: "var(--pizarra)" }}>Etapa {e.num} de 7</p>
      <h1 style={{ fontSize: tam, lineHeight: 1.02, fontWeight: 700, letterSpacing: "-.02em", marginTop: 6 }}>{e.name}</h1>
      <p className="t-cursiva" style={{ fontSize: tam * 0.58, color: "var(--agua)", marginTop: 6 }}>{e.pregunta}</p>
    </>
  );
}

export function EtapaAbierta({ datos }) {
  const e = ETAPAS_DATA[datos.etapa - 1];
  const total = datos.participantes.length;
  const listos = completaron(datos.participantes, e.id).length;
  return (
    <div style={{ ...marco, padding: "64px 120px 56px" }}>
      <Cabecera nombre={datos.nombre} derecha="Responda en su teléfono" />
      <Recorrido etapa={e.num} reveladas={datos.reveladas} />
      <div style={{ flex: 1, display: "grid", gridTemplateColumns: "1fr 560px", gap: 96, alignItems: "center" }}>
        <div className="t-sube">
          <p style={{ fontSize: 30, color: "var(--pizarra)" }}>Etapa {e.num} de 7</p>
          <h1 style={{ fontSize: 150, lineHeight: 1, fontWeight: 700, letterSpacing: "-.025em", marginTop: 12 }}>{e.name}</h1>
          <p className="t-cursiva" style={{ fontSize: 76, lineHeight: 1.1, color: "var(--agua)", marginTop: 20 }}>{e.pregunta}</p>
          <p style={{ fontSize: 30, color: "var(--pizarra)", marginTop: 56, maxWidth: 1000, lineHeight: 1.4 }}>
            <span style={{ color: "#fff" }}>{CONSIGNA_TITULO}</span> {CONSIGNA}
          </p>
        </div>
        <div className="t-sube" style={{ "--i": 2 }}>
          <p style={{ fontSize: 30, color: "var(--pizarra)" }}>Respondieron</p>
          <p style={{ lineHeight: 1, marginTop: 8, fontWeight: 700 }}>
            <span style={{ fontSize: 240, color: "var(--coral)", letterSpacing: "-.03em" }}>{listos}</span>
            <span style={{ fontSize: 80, color: "var(--pizarra)", fontWeight: 500 }}> / {total}</span>
          </p>
          <div style={{ height: 16, borderRadius: 8, background: "rgba(255,255,255,.14)", marginTop: 24, overflow: "hidden" }}>
            <div style={{ height: "100%", width: `${total ? (listos / total) * 100 : 0}%`, background: "var(--coral)", borderRadius: 8, transition: "width .8s cubic-bezier(.2,.7,.2,1)" }} />
          </div>
        </div>
      </div>
      <Pie>
        <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
          <p style={{ fontSize: 24, color: "var(--pizarra)", textAlign: "right", lineHeight: 1.35 }}>
            ¿Todavía no entró?<br /><span style={{ color: "#fff", fontWeight: 600 }}>{urlCorta(datos.codigo)}</span>
          </p>
          <div style={{ background: "#fff", borderRadius: 14, padding: 12 }}><Qr texto={urlParticipante(datos.codigo)} tamano={112} /></div>
        </div>
      </Pie>
    </div>
  );
}

// Paso 1: puntaje de la sala y cómo se repartieron las respuestas de cada pregunta.
export function ResultadoEtapa({ datos }) {
  const e = ETAPAS_DATA[datos.etapa - 1];
  const filas = datos.participantes;
  const valor = puntajeEtapa(filas, e.id);
  const nivel = valor != null ? getNivel(valor).label : null;
  return (
    <div style={marco}>
      <Encabezado datos={datos} e={e} paso="Resultado de la sala" />
      <div style={{ display: "grid", gridTemplateColumns: "520px 1fr", gap: 80, marginTop: 44, flex: 1, minHeight: 0 }}>
        <div className="t-sube">
          <TituloEtapa e={e} />
          {valor == null ? <p style={{ fontSize: 32, marginTop: 48 }}>Nadie respondió esta etapa.</p> : (
            <>
              <div style={{ marginTop: 44 }}><Numero valor={valor} /></div>
              <p style={{ fontSize: 40, fontWeight: 700, color: "var(--agua)", marginTop: 8 }}>{nivel}</p>
              <div style={{ marginTop: 20 }}><EscalonGrande nivel={nivel} /></div>
            </>
          )}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "44px 64px", alignContent: "center" }}>
          {e.preguntas.map((p, q) => <Distribucion key={q} indice={q} pregunta={p} d={distribucion(filas, e.id, q)} />)}
        </div>
      </div>
    </div>
  );
}

function Distribucion({ indice, pregunta, d }) {
  return (
    <section className="t-sube" style={{ "--i": indice + 1 }}>
      <h2 style={{ fontSize: 26, lineHeight: 1.3, fontWeight: 600, minHeight: 68, display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
        {indice + 1}. {pregunta.texto}
      </h2>
      <div style={{ marginTop: 14 }}>
        {d.opciones.map((o, i) => (
          <div key={o.letra} style={{ marginTop: i ? 14 : 0 }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 16, fontSize: 22, lineHeight: 1.25 }}>
              <span style={{ color: o.mayoria ? "#fff" : "rgba(255,255,255,.78)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                <b>{o.letra}</b> · {o.etiqueta.replace(/\.$/, "")}
              </span>
              <b style={{ fontSize: 24, color: o.mayoria ? "var(--coral)" : "#fff" }}>{Math.round(o.pct * 100)}%</b>
            </div>
            <div style={{ height: 12, borderRadius: 6, background: "rgba(255,255,255,.12)", marginTop: 6, overflow: "hidden" }}>
              <span style={{ display: "block", height: "100%", borderRadius: 6, width: `${o.pct * 100}%`, background: o.mayoria ? "var(--coral)" : AGUA_BARRA,
                transformOrigin: "left", animation: "t-crece .9s cubic-bezier(.2,.7,.2,1) both", animationDelay: `${indice * 120 + i * 60}ms` }} />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

// Paso 2: mapa de calor de la etapa (una fila por persona, una columna por pregunta).
const MAPA_ETAPA = { ancho: 1060, alto: 820, celdaGap: 6, bloqueGap: 6, filaGap: 2, filaMax: 28, cabeceraAlto: 70, cabeceraDoble: true, pieAlto: 52, letra: 20 };
export function MapaEtapa({ datos }) {
  const e = ETAPAS_DATA[datos.etapa - 1];
  const filas = datos.participantes;
  return (
    <div style={marco}>
      <Encabezado datos={datos} e={e} paso="Mapa de calor" />
      <div style={{ display: "grid", gridTemplateColumns: "1060px 1fr", gap: 72, marginTop: 28, flex: 1, minHeight: 0 }}>
        <div className="t-sube"><MapaCalor filas={filas} etapa={e.id} tema="oscuro" m={MAPA_ETAPA} titulo={`Mapa de calor de ${e.name}`} /></div>
        <div className="t-sube" style={{ "--i": 2, display: "flex", flexDirection: "column" }}>
          <TituloEtapa e={e} tam={52} />
          <p style={{ fontSize: 22, color: "var(--pizarra)", marginTop: 24, lineHeight: 1.4 }}>
            Cada fila es una persona; cada columna, una pregunta. <span style={{ color: "#fff" }}>Más intenso, más desarrollado.</span>
          </p>
          <ol style={{ listStyle: "none", margin: "28px 0 0", padding: 0 }}>
            {e.preguntas.map((p, q) => (
              <li key={q} style={{ fontSize: 21, lineHeight: 1.35, marginTop: q ? 16 : 0, color: "rgba(255,255,255,.9)" }}>
                <b style={{ color: "var(--agua)" }}>Pregunta {q + 1}.</b> {p.texto}
              </li>
            ))}
          </ol>
          <div style={{ marginTop: "auto" }}><Leyenda tema="oscuro" letra={18} fuga={false} /></div>
        </div>
      </div>
    </div>
  );
}

// Paso 3: ideas para subir, como en el diagnóstico. La sala elige algunas o todas (en la pantalla
// del expositor, con un clic) y se ve el puntaje potencial de la etapa.
export function IdeasEtapa({ datos, onElegir }) {
  const e = ETAPAS_DATA[datos.etapa - 1];
  const filas = datos.participantes;
  const ideas = ideasEtapa(filas, e.id);
  const claves = (datos.elegidas[e.id] || []).filter((c) => ideas.some((i) => i.clave === c));
  const hoy = puntajeEtapa(filas, e.id);
  const con = claves.length ? puntajeConIdeas(filas, e.id, claves) : hoy;
  const alternar = (clave) => onElegir?.(e.num, claves.includes(clave) ? claves.filter((c) => c !== clave) : [...claves, clave]);
  return (
    <div style={marco}>
      <Encabezado datos={datos} e={e} paso="Ideas para subir" />
      <div style={{ display: "grid", gridTemplateColumns: "520px 1fr", gap: 72, marginTop: 44, flex: 1, minHeight: 0 }}>
        <div className="t-sube">
          <TituloEtapa e={e} />
          {hoy != null && (
            <div style={{ marginTop: 44 }}>
              <p style={{ fontSize: 26, color: "var(--pizarra)" }}>Hoy</p>
              <Numero valor={hoy} tam={120} />
              <p style={{ fontSize: 26, color: "var(--pizarra)", marginTop: 28 }}>{claves.length ? `Con ${claves.length === 1 ? "la idea elegida" : `las ${claves.length} ideas elegidas`}` : "Elijan las ideas que aplicarían"}</p>
              <p style={{ lineHeight: 1, fontWeight: 700, color: claves.length ? "var(--coral)" : "rgba(255,255,255,.3)" }}>
                <span style={{ fontSize: 160, letterSpacing: "-.04em" }}>{fmt1(con)}</span>
                {claves.length > 0 && <span style={{ fontSize: 40, fontWeight: 600 }}> +{fmt1(con - hoy)}</span>}
              </p>
              <div style={{ marginTop: 20 }}><EscalonGrande nivel={getNivel(con).label} /></div>
            </div>
          )}
        </div>
        {ideas.length === 0 ? (
          <p style={{ fontSize: 36, alignSelf: "center" }}>La sala ya está en el nivel más alto en todas las preguntas de esta etapa.</p>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 28, alignContent: "center" }}>
            {ideas.map((i, k) => {
              const elegida = claves.includes(i.clave);
              return (
                <button key={i.clave} type="button" onClick={() => alternar(i.clave)} disabled={!onElegir} aria-pressed={elegida}
                  className="t-sube" style={{ "--i": k + 1, textAlign: "left", font: "inherit", color: "#fff", cursor: onElegir ? "pointer" : "default",
                    background: elegida ? "rgba(127,214,222,.14)" : "rgba(255,255,255,.05)", border: `2px solid ${elegida ? "var(--agua)" : "rgba(255,255,255,.12)"}`,
                    borderRadius: 22, padding: "26px 30px", minHeight: 300, display: "flex", flexDirection: "column", transition: "background .2s, border-color .2s" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16 }}>
                    <span style={{ fontSize: 56, fontWeight: 700, lineHeight: 1, color: "var(--coral)" }}>{i.sube >= 0.05 ? `+${fmt1(i.sube)}` : "+0.0"}</span>
                    <span aria-hidden="true" style={{ width: 44, height: 44, borderRadius: 12, border: `2px solid ${elegida ? "var(--agua)" : "rgba(255,255,255,.35)"}`,
                      background: elegida ? "var(--agua)" : "transparent", display: "grid", placeItems: "center" }}>
                      {elegida && <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="var(--noche)" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>}
                    </span>
                  </div>
                  <p style={{ fontSize: 26, lineHeight: 1.35, marginTop: 18, fontWeight: 500 }}>{i.texto}</p>
                  <p style={{ fontSize: 19, color: "var(--pizarra)", marginTop: "auto", paddingTop: 16 }}>
                    {i.tipo === "nivel" ? `${i.detalle} · pregunta ${i.q + 1}` : `${i.detalle} · pregunta ${i.q + 1}`}
                  </p>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
