// Lo que se proyecta en el salón según el momento del taller. La usan la pantalla del expositor
// (con controles) y la pantalla espejo /p (sin controles).
import { Qr } from "../Qr.jsx";
import { HERRAMIENTA, ETAPAS_DATA, urlParticipante, urlCorta } from "../datos.js";
import { Cabecera, Pie } from "./proyector.jsx";
import { EtapaAbierta, ResultadoEtapa, IdeasEtapa } from "./ProyeccionEtapa.jsx";
import { ViajeSala, RecorridoSala, InformeSala } from "./ProyeccionCierre.jsx";

const RECORRIDO = ["estadisticas", "mapa"];

// Clave para montar la pantalla de nuevo al cambiar de paso. Los dos pasos del recorrido comparten la
// clave: es el mismo haz, que se abre en movimiento al pasar a "Con las ideas".
export const clavePantalla = (d) => `${d.fase}-${d.etapa}-${d.fase === "cierre" && RECORRIDO.includes(d.vista) ? "recorrido" : d.vista}`;

// En las etapas, cualquier otra vista (como el mapa de calor, que ya no se usa) cae en el resultado.
export function Pantalla({ datos, onElegir }) {
  if (datos.fase === "abierta") return <EtapaAbierta datos={datos} />;
  if (datos.fase === "resultados") {
    if (datos.vista === "ideas") return <IdeasEtapa datos={datos} onElegir={onElegir} />;
    return <ResultadoEtapa datos={datos} />;
  }
  if (datos.fase === "cierre") {
    if (RECORRIDO.includes(datos.vista)) return <RecorridoSala datos={datos} plan={datos.vista === "mapa"} />;
    if (datos.vista === "informe") return <InformeSala datos={datos} />;
    return <ViajeSala datos={datos} />;
  }
  if (datos.vista === "protocolo" && datos.etapa === 0) return <Protocolo datos={datos} />;
  return <Espera datos={datos} />;
}

// Antes de empezar: cómo funciona el ejercicio. Lo que responde cada uno lo ve solo esa persona (en la
// pantalla solo el promedio), conviene responder con la realidad de su universidad, y de dónde sale el
// diagnóstico (las cifras son las de campuslatina.com).
const PUNTOS = [
  ["Sus respuestas las ve solo usted.", "Nadie más en la sala: en esta pantalla aparece solo el promedio de todos."],
  ["Para que le sirva, responda con la realidad de su universidad.", "O con lo que considere más cercano a ella. No hay respuestas correctas."],
  ["En su teléfono verá cómo está su universidad frente al promedio de la sala.", "Etapa por etapa, y al final, con un informe en PDF si lo pide."],
];
const CIFRAS = [
  ["+2,5M", "jóvenes y adultos alcanzados en procesos de admisión en los últimos 5 años"],
  ["+200K", "estudiantes matriculados en carreras de grado, pregrado y posgrado"],
];
function Protocolo({ datos }) {
  return (
    <div style={{ position: "absolute", inset: 0, padding: "52px 112px 44px", display: "flex", flexDirection: "column" }}>
      <Cabecera nombre={datos.nombre} derecha={HERRAMIENTA} />
      <div style={{ flex: 1, display: "grid", gridTemplateColumns: "minmax(0, 1fr) 640px", gap: 112, alignItems: "center" }}>
        <div>
          <h1 className="t-sube" style={{ fontSize: 96, lineHeight: 1, fontWeight: 700, letterSpacing: "-.02em", color: "var(--profundo)" }}>
            Antes de <span className="t-cursiva" style={{ color: "var(--petroleo)", fontWeight: 400 }}>empezar</span>
          </h1>
          <ol style={{ listStyle: "none", margin: "56px 0 0", padding: 0 }}>
            {PUNTOS.map(([titulo, texto], i) => (
              <li key={titulo} className="t-sube" style={{ "--i": i + 1, display: "flex", gap: 28, marginTop: i ? 40 : 0 }}>
                <span style={{ flex: "none", width: 56, height: 56, borderRadius: "50%", background: "var(--petroleo)", color: "#fff", display: "grid", placeItems: "center", fontSize: 28, fontWeight: 700 }}>{i + 1}</span>
                <div>
                  <p style={{ fontSize: 38, lineHeight: 1.2, fontWeight: 700, color: "var(--profundo)" }}>{titulo}</p>
                  <p style={{ fontSize: 26, lineHeight: 1.4, color: "var(--apagado)", marginTop: 8 }}>{texto}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
        <div className="t-sube" style={{ "--i": 4, background: "#fff", border: "1px solid var(--linea)", borderRadius: 24, padding: "44px 48px" }}>
          <p style={{ fontSize: 20, fontWeight: 600, letterSpacing: ".12em", textTransform: "uppercase", color: "var(--petroleo)" }}>De dónde sale este diagnóstico</p>
          {CIFRAS.map(([cifra, texto], i) => (
            <div key={cifra} style={{ marginTop: i ? 28 : 24 }}>
              <p style={{ fontSize: 88, lineHeight: 1, fontWeight: 700, letterSpacing: "-.04em", color: i ? "var(--coral)" : "var(--profundo)" }}>{cifra}</p>
              <p style={{ fontSize: 22, lineHeight: 1.35, color: "var(--apagado)", marginTop: 8 }}>{texto}</p>
            </div>
          ))}
          <p style={{ fontSize: 24, lineHeight: 1.4, color: "var(--profundo)", marginTop: 32, paddingTop: 28, borderTop: "1px solid var(--linea)" }}>
            Con un modelo construido sobre esa experiencia armamos este diagnóstico y detectamos las palancas que más pesan para crecer. El objetivo: simplificar la lectura del proceso para tomar decisiones estratégicas a la escala de su universidad.
          </p>
        </div>
      </div>
      <Pie />
    </div>
  );
}

// QR grande, la dirección y cuántos ya entraron. También entre etapas, para quien llega tarde.
function Espera({ datos }) {
  const proxima = ETAPAS_DATA[datos.etapa]; // la siguiente a la última abierta
  const n = datos.participantes.length;
  return (
    <div style={{ position: "absolute", inset: 0, padding: "96px 120px 56px", display: "flex", flexDirection: "column" }}>
      <div style={{ flex: 1, display: "grid", gridTemplateColumns: "1fr 600px", gap: 120, alignItems: "center" }}>
        <div className="t-sube">
          <p style={{ fontSize: 26, fontWeight: 600, letterSpacing: ".14em", textTransform: "uppercase", color: "var(--petroleo)" }}>{datos.nombre}</p>
          <p style={{ fontSize: 30, color: "var(--apagado)", marginTop: 48 }}>{HERRAMIENTA}</p>
          <h1 style={{ fontSize: 112, lineHeight: 1.02, fontWeight: 700, letterSpacing: "-.02em", marginTop: 12 }}>
            El viaje <span className="t-cursiva" style={{ color: "var(--petroleo)", fontWeight: 400 }}>invisible</span> del aspirante
          </h1>
          <p style={{ fontSize: 36, color: "var(--apagado)", marginTop: 56 }}>Escanee el código con su teléfono o entre a</p>
          <p style={{ fontSize: 48, fontWeight: 600, marginTop: 8 }}>{urlCorta(datos.codigo)}</p>
          <div style={{ display: "flex", alignItems: "baseline", gap: 24, marginTop: 48 }}>
            <span style={{ fontSize: 120, fontWeight: 700, lineHeight: 1, color: "var(--coral)" }}>{n}</span>
            <span style={{ fontSize: 36, color: "var(--apagado)" }}>{n === 1 ? "persona ya entró" : "personas ya entraron"}</span>
          </div>
          {datos.etapa > 0 && proxima && <p style={{ fontSize: 30, color: "var(--apagado)", marginTop: 20 }}>Próxima: etapa {proxima.num}, {proxima.name}</p>}
        </div>
        {/* Sin el código aparte: ya está en la dirección (o no hace falta, en la del evento). */}
        <div className="t-sube" style={{ "--i": 2 }}>
          <div style={{ background: "#fff", border: "1px solid var(--linea)", borderRadius: 32, padding: 48 }}>
            <Qr texto={urlParticipante(datos.codigo)} tamano={504} />
          </div>
        </div>
      </div>
      <Pie />
    </div>
  );
}
