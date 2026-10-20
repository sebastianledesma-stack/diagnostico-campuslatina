// Piezas comunes de la pantalla proyectada (1920×1080, fondo noche, alto contraste).
import { ETAPAS_DATA } from "../datos.js";
import { Logo } from "../componentes.jsx";

export const AGUA_BARRA = "#5FB8C1"; // barras sobre fondo noche; la mayoría va en coral

// Nombre del evento arriba a la izquierda y, a la derecha, lo que se esté mostrando.
export function Cabecera({ nombre, derecha }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 40 }}>
      <p style={{ fontSize: 22, fontWeight: 600, letterSpacing: ".14em", textTransform: "uppercase", color: "var(--agua)" }}>{nombre}</p>
      {derecha && <p style={{ fontSize: 22, fontWeight: 600, letterSpacing: ".14em", textTransform: "uppercase", color: "var(--pizarra)" }}>{derecha}</p>}
    </div>
  );
}

// El recorrido de 7 etapas: dónde está la sala y cuáles ya se vieron.
export function Recorrido({ etapa, reveladas = [], compacto = false }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 10, marginTop: compacto ? 18 : 28 }} aria-label={`Etapa ${etapa} de 7`}>
      {ETAPAS_DATA.map((e) => {
        const actual = e.num === etapa;
        const vista = reveladas.includes(e.num);
        return (
          <div key={e.id}>
            <div style={{ height: compacto ? 5 : 6, borderRadius: 3, background: actual ? "var(--agua)" : vista ? "rgba(255,255,255,.5)" : "rgba(255,255,255,.14)" }} />
            <p style={{ fontSize: compacto ? 16 : 18, marginTop: compacto ? 6 : 10, color: actual ? "#fff" : "var(--pizarra)", fontWeight: actual ? 600 : 400, whiteSpace: "nowrap" }}>
              {e.num}. {e.name}
            </p>
          </div>
        );
      })}
    </div>
  );
}

export function Pie({ children }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: 40 }}>
      <div style={{ opacity: 0.8 }}><Logo oscuro alto={36} /></div>
      {children}
    </div>
  );
}

// Escalón de niveles en grande, sobre fondo oscuro.
const NIVELES = ["Inicial", "En desarrollo", "Consolidado", "Avanzado"];
export function EscalonGrande({ nivel, ancho = 480 }) {
  const i = NIVELES.indexOf(nivel);
  return (
    <div style={{ width: ancho }} role="img" aria-label={`Nivel: ${nivel}`}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 6 }}>
        {NIVELES.map((n, k) => <i key={n} style={{ height: 12, borderRadius: 3, background: k <= i ? "var(--agua)" : "rgba(255,255,255,.14)" }} />)}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 6, marginTop: 10, fontSize: 18, lineHeight: 1.2 }}>
        {NIVELES.map((n, k) => <span key={n} style={{ color: k === i ? "#fff" : "var(--pizarra)", fontWeight: k === i ? 700 : 400 }}>{n}</span>)}
      </div>
    </div>
  );
}
