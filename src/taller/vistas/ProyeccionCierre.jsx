// Cierre en la pantalla proyectada (1920×1080), en 4 pasos: el viaje de la sala (las 7 etapas como un
// recorrido, hoy y con las ideas elegidas), el recorrido del aspirante, primero hoy y después con las
// ideas de la sala (el haz se abre y llegan más), y el informe que recibe cada asistente. La etapa más
// baja se marca con un rótulo, no con el destaque (ámbar, --coral): el destaque es lo que se puede ganar.
import { fmt1 } from "../../lib/scoring.js";
import { diagnostico } from "../sala.js";
import { Cabecera } from "./proyector.jsx";
import { NIVELES } from "./Salud.jsx";
import { Haz, posEtapa } from "./Haz.jsx";

const marco = { position: "absolute", inset: 0, padding: "52px 112px 44px", display: "flex", flexDirection: "column" };
const personas = (datos) => datos.participantes.filter((f) => Object.keys(f.r).length).length;
const etiqueta = { fontSize: 20, fontWeight: 600, letterSpacing: ".12em", textTransform: "uppercase" };
const corto = (name) => name.replace("Retención temprana", "Retención");
const AMBAR_TEXTO = "#A85F08"; // el destaque en texto chico sobre fondo claro (el ámbar puro no se lee)

const Titulo = () => (
  <h1 style={{ fontSize: 60, lineHeight: 1.05, fontWeight: 700, letterSpacing: "-.02em", color: "var(--profundo)" }}>
    El viaje <span className="t-cursiva" style={{ color: "var(--petroleo)", fontWeight: 400 }}>invisible</span> del aspirante
  </h1>
);

// El viaje: las 7 etapas como un perfil sobre las bandas de nivel. Petróleo, hoy; ámbar punteado, con
// las ideas que eligió la sala.
export function ViajeSala({ datos }) {
  const dx = diagnostico(datos.participantes, datos.elegidas);
  const hayIdeas = dx.etapas.some((e) => e.puntaje != null && e.conIdeas > e.puntaje + 0.04);
  const W = 1696, H = 520, izq = 150, der = 60, arriba = 30;
  const x = (i) => izq + (i * (W - izq - der)) / 6;
  const y = (v) => arriba + (1 - (v - 1) / 4) * (H - arriba - 40);
  const puntos = (k) => dx.etapas.map((e, i) => (e[k] == null ? null : { i, v: e[k] })).filter(Boolean);
  const hoy = puntos("puntaje"), plan = puntos("conIdeas");
  const linea = (ps) => ps.map((p) => `${x(p.i)},${y(p.v)}`).join(" ");
  const f = dx.fuga ? dx.etapas.findIndex((e) => e.id === dx.fuga.id) : -1;
  const xRotulo = f >= 0 ? Math.min(W - 350, Math.max(izq - 40, x(f) - 170)) : 0;
  return (
    <div style={marco}>
      <Cabecera nombre={datos.nombre} derecha={`Resultado final · ${personas(datos)} personas`} />
      <div className="t-sube" style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginTop: 36 }}>
        <Titulo />
        {dx.global != null && (
          <div style={{ display: "flex", gap: 56, alignItems: "flex-end" }}>
            <p style={{ lineHeight: 1 }}>
              <span style={{ ...etiqueta, display: "block", color: "var(--apagado)" }}>La sala hoy</span>
              <b style={{ fontSize: 120, color: "var(--profundo)", letterSpacing: "-.04em" }}>{fmt1(dx.global)}</b>
            </p>
            {hayIdeas && (
              <p style={{ lineHeight: 1 }}>
                <span style={{ ...etiqueta, display: "block", color: AMBAR_TEXTO }}>Con las ideas</span>
                <b style={{ fontSize: 120, color: "var(--coral)", letterSpacing: "-.04em" }}>{fmt1(dx.globalConIdeas)}</b>
              </p>
            )}
          </div>
        )}
      </div>
      <svg width={W} height={H + 50} viewBox={`0 0 ${W} ${H + 50}`} role="img" style={{ display: "block", marginTop: 44, overflow: "visible" }}
        aria-label={`Puntaje de la sala por etapa: ${dx.etapas.map((e) => `${e.name} ${e.puntaje == null ? "sin respuestas" : fmt1(e.puntaje)}`).join(", ")}`}>
        {NIVELES.map((b, i) => (
          <g key={b.label}>
            <rect x={izq - 40} y={y(b.hasta)} width={W - izq + 40 - der + 40} height={y(b.desde) - y(b.hasta)} fill={i % 2 ? "#DCE9EB" : "#E3EEEF"} />
            <text x={izq - 56} y={(y(b.desde) + y(b.hasta)) / 2 + 7} textAnchor="end" fontSize="20" fontWeight="600" fill="#4D6166">{b.label}</text>
          </g>
        ))}
        {hayIdeas && (
          <g style={{ animation: "t-aparece .8s ease both", animationDelay: "1400ms" }}>
            <polyline points={linea(plan)} fill="none" stroke="var(--coral)" strokeWidth="6" strokeLinejoin="round" strokeLinecap="round" strokeDasharray="2 14" />
            {plan.map((p) => (
              <g key={p.i}>
                <circle cx={x(p.i)} cy={y(p.v)} r="12" fill="var(--coral)" stroke="var(--bruma)" strokeWidth="4" />
                <text x={x(p.i)} y={y(p.v) - 26} textAnchor="middle" fontSize="28" fontWeight="700" fill={AMBAR_TEXTO}>{fmt1(p.v)}</text>
              </g>
            ))}
          </g>
        )}
        <polyline points={linea(hoy)} fill="none" stroke="var(--petroleo)" strokeWidth="6" strokeLinejoin="round" strokeLinecap="round"
          pathLength="1" style={{ strokeDasharray: 1, animation: "t-traza 1.4s cubic-bezier(.4,0,.2,1) both", animationDelay: "200ms" }} />
        {hoy.map((p) => (
          <g key={p.i} style={{ animation: "t-aparece .4s ease both", animationDelay: `${300 + p.i * 160}ms` }}>
            <circle cx={x(p.i)} cy={y(p.v)} r="12" fill="var(--petroleo)" stroke="var(--bruma)" strokeWidth="4" />
            <text x={x(p.i)} y={y(p.v) + 48} textAnchor="middle" fontSize="34" fontWeight="700" fill="#123A42">{fmt1(p.v)}</text>
          </g>
        ))}
        {f >= 0 && dx.etapas[f].puntaje != null && (
          <g style={{ animation: "t-aparece .5s ease both", animationDelay: "1800ms" }}>
            <rect x={xRotulo} y={y(dx.etapas[f].puntaje) + 70} width="340" height="40" rx="20" fill="#123A42" />
            <text x={xRotulo + 170} y={y(dx.etapas[f].puntaje) + 97} textAnchor="middle" fontSize="20" fontWeight="700" fill="#fff">Acá se pierden más aspirantes</text>
          </g>
        )}
        {dx.etapas.map((e, i) => (
          <text key={e.id} x={x(i)} y={H + 30} textAnchor="middle" fontSize="24" fontWeight={i === f ? 700 : 500} fill="#123A42">{e.num}. {corto(e.name)}</text>
        ))}
      </svg>
    </div>
  );
}

// El recorrido del aspirante: el haz de las 7 etapas con los puntajes de la sala. Con `plan`, el haz se
// abre a los puntajes con las ideas elegidas (los pasos "El recorrido" y "Con las ideas" son el mismo
// componente, para que el cambio se vea en movimiento).
export function RecorridoSala({ datos, plan = false }) {
  const dx = diagnostico(datos.participantes, datos.elegidas);
  const puntajes = dx.etapas.map((e) => (plan ? e.conIdeas : e.puntaje));
  const caja = (activo, rotulo, valor) => (
    <div style={{ padding: "16px 26px", background: activo ? "#fff" : "transparent", color: activo ? "var(--profundo)" : "var(--apagado)", transition: "all .5s" }}>
      <span style={{ ...etiqueta, fontSize: 18, display: "block" }}>{rotulo}</span>
      <b style={{ fontSize: 52, lineHeight: 1, letterSpacing: "-.03em" }}>{valor == null ? "—" : fmt1(valor)}</b>
    </div>
  );
  return (
    <div style={marco}>
      <Cabecera nombre={datos.nombre} derecha={`El recorrido · ${personas(datos)} personas`} />
      <div className="t-sube" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginTop: 40 }}>
        <h1 style={{ fontSize: 64, lineHeight: 1.05, fontWeight: 700, letterSpacing: "-.02em", color: "var(--profundo)" }}>
          El recorrido del aspirante<br />
          <span className="t-cursiva" style={{ fontSize: 52, color: "var(--petroleo)", fontWeight: 400 }}>en las universidades de esta sala</span>
        </h1>
        <div style={{ display: "flex", border: "1px solid var(--linea)", borderRadius: 14, overflow: "hidden" }}>
          {caja(!plan, "Hoy", dx.global)}
          {caja(plan, "Con las ideas de la sala", dx.globalConIdeas)}
        </div>
      </div>
      <div style={{ position: "relative", marginTop: 36 }}>
        <Haz puntajes={puntajes} />
        <p style={{ ...etiqueta, position: "absolute", right: 0, top: 70, fontWeight: 700, color: AMBAR_TEXTO }}>Se inscriben</p>
      </div>
      <div style={{ position: "relative", height: 130, marginTop: 10 }}>
        {dx.etapas.map((e, i) => {
          const fuga = dx.fuga?.id === e.id;
          const cambia = plan && e.puntaje != null && fmt1(e.conIdeas) !== fmt1(e.puntaje);
          return (
            <div key={e.id} style={{ position: "absolute", top: 0, left: `${posEtapa(i) * 100}%`, transform: "translateX(-50%)", width: "12.6%", textAlign: "center" }}>
              <p style={{ fontSize: 22, lineHeight: 1.2, fontWeight: fuga ? 700 : 500, color: "var(--profundo)" }}>{e.num}. {e.name}</p>
              <p style={{ fontSize: 30, fontWeight: 700, marginTop: 6, color: "var(--profundo)" }}>
                {cambia && <span style={{ color: "var(--apagado)", fontWeight: 500 }}>{fmt1(e.puntaje)} → </span>}
                {e.puntaje == null ? "—" : fmt1(plan ? e.conIdeas : e.puntaje)}
              </p>
              {fuga && <p style={{ fontSize: 17, fontWeight: 700, color: "var(--apagado)", marginTop: 2 }}>Acá se pierden más</p>}
            </div>
          );
        })}
      </div>
      <p style={{ fontSize: 20, color: "var(--apagado)", marginTop: "auto" }}>
        Ilustrativo: en cada etapa el haz se angosta según el puntaje de la sala. En gris, los aspirantes que quedan en el camino; en ámbar, los que llegan a inscribirse.
      </p>
    </div>
  );
}

// El informe: lo que le llega a cada asistente por email, con 4 páginas de ejemplo (datos de muestra,
// public/taller/informe-*.png; se regeneran si cambia el PDF de netlify/lib/pdfTaller.js).
const PAGINAS = [
  { img: "/taller/informe-1.png", titulo: "Su mirada", texto: "Su puntaje en cada etapa al lado del de la sala" },
  { img: "/taller/informe-2.png", titulo: "El recorrido", texto: "Según su mirada, la sala hoy y con las ideas" },
  { img: "/taller/informe-3.png", titulo: "Qué mide cada etapa", texto: "Y qué implica para el camino del aspirante" },
  { img: "/taller/informe-4.png", titulo: "Ideas para subir", texto: "Las de cada etapa, con las que eligió la sala" },
];
export function InformeSala({ datos }) {
  return (
    <div style={marco}>
      <Cabecera nombre={datos.nombre} derecha={`El informe · ${personas(datos)} personas`} />
      <div className="t-sube" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginTop: 36 }}>
        <h1 style={{ fontSize: 64, lineHeight: 1.05, fontWeight: 700, letterSpacing: "-.02em", color: "var(--profundo)" }}>
          Lo que le llega por email<br />
          <span className="t-cursiva" style={{ fontSize: 52, color: "var(--petroleo)", fontWeight: 400 }}>un PDF con su mirada y la de la sala</span>
        </h1>
        <p style={{ fontSize: 30, fontWeight: 700, color: "var(--profundo)", textAlign: "right", lineHeight: 1.3 }}>
          Pídalo en su teléfono:<br /><span style={{ color: AMBAR_TEXTO }}>escriba su email</span>
        </p>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: 40, marginTop: 44 }}>
        {PAGINAS.map((p, i) => (
          <figure key={p.img} className="t-sube" style={{ "--i": i + 1, margin: 0 }}>
            <img src={p.img} alt={`Página de ejemplo: ${p.titulo}`} style={{ display: "block", width: "100%", aspectRatio: "780 / 1104", objectFit: "cover", objectPosition: "top",
              borderRadius: 6, boxShadow: "0 1px 0 rgba(18,58,66,.08), 0 18px 40px rgba(18,58,66,.14)", background: "#fff" }} />
            <figcaption style={{ marginTop: 18 }}>
              <p style={{ fontSize: 26, fontWeight: 700, color: "var(--profundo)" }}><span style={{ color: "var(--petroleo)", marginRight: 10 }}>{i + 1}</span>{p.titulo}</p>
              <p style={{ fontSize: 20, color: "var(--apagado)", marginTop: 4, lineHeight: 1.35 }}>{p.texto}</p>
            </figcaption>
          </figure>
        ))}
      </div>
      <p style={{ fontSize: 18, color: "var(--apagado)", marginTop: "auto" }}>Páginas de ejemplo, con datos de muestra. Cada informe lleva la mirada de quien lo pide y los resultados de esta sala.</p>
    </div>
  );
}
