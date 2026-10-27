// Lo que se proyecta en el salón según el momento del taller. La usan la pantalla del expositor
// (con controles) y la pantalla espejo /p (sin controles).
import { Qr } from "../Qr.jsx";
import { HERRAMIENTA, ETAPAS_DATA, urlParticipante, urlCorta } from "../datos.js";
import { Pie } from "./proyector.jsx";
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
  return <Espera datos={datos} />;
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
