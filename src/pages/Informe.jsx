// Informe del diagnóstico: Resumen, Mapa, Etapas, Acciones e Informe (PDF).
// Lenguaje del manual de marca: tipografía grande, filetes en lugar de tarjetas, el puntaje como
// protagonista y movimiento en la primera lectura (cifras que cuentan, el flujo del aspirante,
// líneas que se dibujan). Los niveles se leen en escalones de petróleo, no con colores de semáforo.
import { useState, useEffect, useLayoutEffect, useRef, Fragment } from "react";
import { NAVY_DK, EMERALD, SLATE, WHITE, PETROLEO, AMBAR, AMBAR_LUZ, MUTED, TEXT, LINE, BTN_PRIMARY, BTN_DISABLED, TOUCH } from "../theme.js";
import { ETAPAS_DATA } from "../data/etapas.js";
import { FRICCIONES } from "../data/fricciones.js";
import { getNivel, calcEtapaProjected, accionesDeEtapa, r1, fmt1 } from "../lib/scoring.js";
import { NIVEL_DESC, lecturaDiagnostico, VALIDAR } from "../data/textos.js";
import { EnvioNota, ContactoCTA } from "../components/ReportExtras.jsx";
import { Etiqueta, Escalon, Nivel, Tramo, BORDES, pct } from "../components/Nivel.jsx";
import Flujo, { posEtapa, FIN } from "../components/Flujo.jsx";
import { useIsDesktop } from "../lib/useIsDesktop.js";
import { useCuenta } from "../lib/movimiento.js";
import { datosInforme, htmlInforme } from "../lib/informePdf.js";
import { track } from "../lib/analytics.js";

const SECCIONES = ["Resumen", "Mapa", "Etapas", "Acciones", "Informe"];
const PERDIDA_TXT = "#9AA8AB";
const num2 = (n) => String(n).padStart(2, "0");
const capital = (s) => s.charAt(0).toUpperCase() + s.slice(1);
const titular = (tam) => ({ fontFamily: "'CL Titulos',sans-serif", fontWeight: 700, fontSize: tam, lineHeight: 1.04, letterSpacing: "-.03em", margin: 0, textWrap: "balance" });
const cifraGrande = (tam) => ({ fontFamily: "'CL Titulos',sans-serif", fontWeight: 700, fontSize: tam, lineHeight: 0.86, letterSpacing: "-.045em" });
const sube = (i, extra) => ({ className: "cl-sube", style: { "--i": i, ...extra } });
const btnTexto = { background: "none", border: "none", padding: 0, cursor: "pointer", fontFamily: "'Schibsted Grotesk',sans-serif", textAlign: "left", color: "inherit" };

// Alto de la ventana (se actualiza al cambiar el tamaño), para gráficos que tienen que entrar en pantalla.
function useAltoVentana() {
  const [alto, setAlto] = useState(() => (typeof window === "undefined" ? 800 : window.innerHeight));
  useEffect(() => { const f = () => setAlto(window.innerHeight); window.addEventListener("resize", f); return () => window.removeEventListener("resize", f); }, []);
  return alto;
}

function Contenedor({ desk, children, style }) {
  return <div style={{ maxWidth: 1120, margin: "0 auto", paddingLeft: desk ? 32 : 20, paddingRight: desk ? 32 : 20, ...style }}>{children}</div>;
}

// En escritorio, título y bajada van en dos columnas: así cada solapa muestra su contenido sin bajar.
function Encabezado({ etiqueta, titulo, bajada, desk, oscuro }) {
  return (
    <div style={desk && bajada ? { display: "grid", gridTemplateColumns: "minmax(0,7fr) minmax(0,5fr)", gap: 56, alignItems: "end" } : { maxWidth: 780 }}>
      <div>
        <Etiqueta {...sube(0)} color={oscuro ? SLATE : MUTED}>{etiqueta}</Etiqueta>
        <h2 {...sube(1, { ...titular(desk ? "clamp(30px,6svh,48px)" : 32), color: oscuro ? WHITE : NAVY_DK, marginTop: 12 })}>{titulo}</h2>
      </div>
      {bajada && <p {...sube(2, { fontSize: desk ? "clamp(16px,2.6svh,19px)" : 17, lineHeight: 1.55, color: oscuro ? "rgba(255,255,255,.72)" : MUTED, margin: desk ? 0 : "16px 0 0", maxWidth: 640 })}>{bajada}</p>}
    </div>
  );
}

// ── 01 RESUMEN ─────────────────────────────────────────────
function Alternar({ plan, setPlan, d }) {
  const op = (activo, texto, alClic) => (
    <button type="button" aria-pressed={activo} onClick={alClic}
      style={{ minHeight: 40, padding: "0 14px", border: "none", background: activo ? "rgba(127,214,222,.16)" : "transparent", color: activo ? WHITE : SLATE, fontFamily: "'Schibsted Grotesk',sans-serif", fontSize: 14, fontWeight: activo ? 700 : 500, cursor: "pointer", transition: "all .25s", whiteSpace: "nowrap" }}>{texto}</button>
  );
  return (
    <div role="group" aria-label="Ver el recorrido" style={{ display: "inline-flex", border: "1px solid rgba(255,255,255,.18)" }}>
      {op(!plan, `Hoy · ${fmt1(d.global)}`, () => setPlan(false))}
      {op(plan, `Con el plan · ${fmt1(d.potencial)}`, () => { setPlan(true); track("informe_flujo_plan"); })}
    </div>
  );
}

function RotuloEtapa({ e, plan, d, vertical }) {
  const cambia = plan && r1(e.pot) > r1(e.score);
  return (
    <>
      <div style={{ display: "flex", alignItems: "baseline", gap: 8, justifyContent: vertical ? "flex-start" : "center" }}>
        <Etiqueta color={SLATE}>{num2(e.num)}</Etiqueta>
        {vertical && <span style={{ fontSize: 15, color: WHITE, fontWeight: 600 }}>{e.name}</span>}
      </div>
      {!vertical && <div style={{ fontSize: 14, color: WHITE, fontWeight: 600, marginTop: 4, lineHeight: 1.25 }}>{e.name}</div>}
      <div style={{ fontSize: 14, marginTop: 3, color: EMERALD }}>
        {cambia ? <><span style={{ color: SLATE }}>{fmt1(e.score)} → </span>{fmt1(e.pot)}</> : fmt1(plan ? e.pot : e.score)}
        {!plan && !d.todoEnD && e.id === d.peor.id && <Etiqueta color={PERDIDA_TXT} style={{ marginLeft: 8, fontSize: 10 }}>más pérdida</Etiqueta>}
      </div>
    </>
  );
}

function FlujoEtapas({ d, plan, desk }) {
  const ps = d.etapas.map((e) => (plan ? e.pot : e.score));
  if (desk) return (
    <div>
      <Flujo puntajes={ps} style={{ height: "clamp(130px,22svh,230px)" }} />
      <div style={{ position: "relative", height: 74, marginTop: 4 }}>
        {d.etapas.map((e, i) => (
          <div key={e.id} style={{ position: "absolute", top: 0, left: `${posEtapa(i) * 100}%`, transform: "translateX(-50%)", width: "12.6%", textAlign: "center" }}>
            <RotuloEtapa e={e} plan={plan} d={d} />
          </div>
        ))}
        <Etiqueta color={AMBAR_LUZ} style={{ position: "absolute", top: 0, right: 0 }}>Se inscriben</Etiqueta>
      </div>
    </div>
  );
  return (
    <div style={{ position: "relative", height: 7 * 68 + 40 }}>
      <Flujo puntajes={ps} vertical style={{ position: "absolute", left: 0, top: 0, width: "42%", height: "100%" }} />
      {d.etapas.map((e, i) => (
        <div key={e.id} style={{ position: "absolute", left: "46%", right: 0, top: `${posEtapa(i) * 100}%`, transform: "translateY(-50%)" }}>
          <RotuloEtapa e={e} plan={plan} d={d} vertical />
        </div>
      ))}
      <Etiqueta color={AMBAR_LUZ} style={{ position: "absolute", left: "46%", top: `${(FIN + 0.035) * 100}%`, transform: "translateY(-50%)" }}>Se inscriben</Etiqueta>
    </div>
  );
}

function Cifra({ etiqueta, valor, nombre, sub, i, desk }) {
  return (
    <div {...sube(i + 1, { padding: desk ? (i ? "0 0 0 40px" : "0 40px 0 0") : "22px 0", borderLeft: desk && i ? `1px solid ${LINE}` : "none", borderTop: !desk && i ? `1px solid ${LINE}` : "none" })}>
      <Etiqueta color={MUTED}>{etiqueta}</Etiqueta>
      <div style={{ ...cifraGrande(desk ? 64 : 48), color: PETROLEO, margin: "14px 0 10px" }}>{valor}</div>
      <div style={{ fontSize: 17, fontWeight: 600, color: NAVY_DK }}>{nombre}</div>
      {sub && <div style={{ fontSize: 15, color: MUTED, marginTop: 2 }}>{sub}</div>}
    </div>
  );
}

function Resumen({ d, desk, registroData, irA }) {
  const [plan, setPlan] = useState(false);
  const cifra = useCuenta(r1(d.global), { ms: 1500, retraso: 250 });
  const nivel = getNivel(d.global).label;
  const quien = [registroData.nombre, registroData.cargo, registroData.pais].filter(Boolean).join(" · ");
  return (
    <>
      <section className="cl-oscuro" style={{ background: NAVY_DK, color: WHITE, overflow: "hidden" }}>
        <Contenedor desk={desk} style={{ paddingTop: desk ? "clamp(20px,4svh,56px)" : 32, paddingBottom: desk ? "clamp(14px,2.5svh,28px)" : 20 }}>
          <Etiqueta {...sube(0)} color={SLATE}>Diagnóstico del proceso de inscripción · {new Date().toLocaleDateString("es-AR", { month: "long", year: "numeric" })}</Etiqueta>
          <h1 {...sube(1, { ...titular(desk ? "clamp(26px,5svh,44px)" : 30), color: WHITE, marginTop: 10 })}>{registroData.universidad || "Su institución"}</h1>
          {quien && <p {...sube(2, { fontSize: 15, color: SLATE, margin: "8px 0 0" })}>{quien}</p>}
          <div style={{ display: "grid", gridTemplateColumns: desk ? "auto minmax(0,1fr)" : "1fr", gap: desk ? 72 : 22, alignItems: "end", marginTop: desk ? "clamp(16px,3.5svh,44px)" : 30 }}>
            <div {...sube(3)}>
              <div style={{ display: "flex", alignItems: "baseline", gap: 12 }}>
                <span aria-label={`${fmt1(d.global)} de 5`} style={{ ...cifraGrande(desk ? "clamp(80px,17svh,176px)" : 120), color: WHITE }}>{cifra.toFixed(1)}</span>
                <span style={{ fontSize: 18, color: SLATE }}>de 5</span>
              </div>
              <div style={{ marginTop: desk ? "clamp(8px,2svh,18px)" : 18 }}><Nivel score={d.global} oscuro color={WHITE} tam={14} puntaje={false} /></div>
            </div>
            <p {...sube(4, { fontSize: desk ? "clamp(16px,2.8svh,22px)" : 18, lineHeight: 1.45, color: "rgba(255,255,255,.72)", margin: 0, maxWidth: 580, textWrap: "pretty" })}>
              <strong style={{ color: WHITE, fontWeight: 600 }}>{capital(NIVEL_DESC[nivel])}.</strong> {lecturaDiagnostico(d.global, d.peor)}
            </p>
          </div>
          <div className="cl-aparece" style={{ "--i": 6, marginTop: desk ? "clamp(18px,4svh,60px)" : 40 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 14, flexWrap: "wrap", marginBottom: desk ? 8 : 18 }}>
              <Etiqueta color={EMERALD}>El recorrido del aspirante</Etiqueta>
              {d.hayMejora && <Alternar plan={plan} setPlan={setPlan} d={d} />}
            </div>
            <FlujoEtapas d={d} plan={plan} desk={desk} />
            <p style={{ fontSize: 13, color: SLATE, lineHeight: 1.55, margin: desk ? "4px 0 0" : "18px 0 0", maxWidth: desk ? "none" : 720 }}>
              Ilustrativo: en cada etapa el haz se angosta según su puntaje. En gris, los aspirantes que quedan en el camino; en ámbar, los que llegan a inscribirse.
            </p>
          </div>
        </Contenedor>
      </section>
      <section style={{ background: WHITE }}>
        <Contenedor desk={desk} style={{ paddingTop: desk ? 56 : 28, display: "grid", gridTemplateColumns: desk ? "repeat(3,minmax(0,1fr))" : "1fr" }}>
          <Cifra i={0} desk={desk} etiqueta="Donde mejor funciona" valor={fmt1(d.mejor.score)} nombre={d.mejor.name} sub={d.mejor.pregunta} />
          {d.todoEnD
            ? <Cifra i={1} desk={desk} etiqueta="Próximo paso" valor="5.0" nombre="Validarlo con datos" sub="Detalle en Acciones" />
            : <Cifra i={1} desk={desk} etiqueta="Donde más inscriptos se pierden" valor={fmt1(d.peor.score)} nombre={d.peor.name} sub={d.peor.pregunta} />}
          <Cifra i={2} desk={desk} etiqueta="Con todas las acciones del plan" valor={fmt1(d.potencial)} nombre={getNivel(d.potencial).label} sub={d.hayMejora ? `+${fmt1(r1(d.potencial) - r1(d.global))} puntos sobre hoy` : "Ya está en el máximo de referencia"} />
        </Contenedor>
      </section>
    </>
  );
}

// ── 02 MAPA ────────────────────────────────────────────────
const BANDAS = [["Inicial", "1.0–1.9", 1, BORDES[0]], ["En desarrollo", "2.0–3.0", BORDES[0], BORDES[1]], ["Consolidado", "3.1–4.0", BORDES[1], BORDES[2]], ["Avanzado", "4.1–5.0", BORDES[2], 5]];
const anchoBanda = (a, b) => `calc(${pct(b)} - ${pct(a)})`;

function Mapa({ d, desk, irA }) {
  const [listo, setListo] = useState(false);
  useEffect(() => { let r2; const r = requestAnimationFrame(() => { r2 = requestAnimationFrame(() => setListo(true)); }); return () => { cancelAnimationFrame(r); cancelAnimationFrame(r2); }; }, []);
  const altoVentana = useAltoVentana();
  const FILA = desk ? Math.round(Math.max(44, Math.min(66, (altoVentana - 300) / 7))) : 60, COL = desk ? 250 : 124, alto = FILA * 7;
  const x = (s) => ((Math.max(1, Math.min(5, s)) - 1) / 4) * 100;
  const linea = (k) => d.etapas.map((e, i) => `${x(e[k])},${FILA * i + FILA / 2}`).join(" ");
  return (
    <Contenedor desk={desk} style={{ paddingTop: desk ? "clamp(24px,5svh,64px)" : 36 }}>
      <Encabezado desk={desk} etiqueta="Mapa de niveles" titulo={<>Dónde está <em className="cl-hi">cada etapa</em></>}
        bajada="Cada fila es una etapa del recorrido. El punto marca su puntaje de hoy; el aro ámbar, hasta dónde llega con las acciones del plan." />
      <div {...sube(3, { display: "grid", gridTemplateColumns: `${COL}px minmax(0,1fr)`, marginTop: desk ? "clamp(16px,4svh,48px)" : 32 })}>
        <div />
        <div style={{ position: "relative", height: desk ? 50 : 24 }}>
          {BANDAS.map(([n, r, a, b], k) => (
            <div key={n} style={{ position: "absolute", left: pct(a), width: anchoBanda(a, b), bottom: 10, textAlign: "center" }}>
              {desk ? <><Etiqueta color={NAVY_DK} style={{ display: "block" }}>{n}</Etiqueta><span style={{ fontSize: 12, color: MUTED }}>{r}</span></>
                : <span style={{ fontSize: 12, color: MUTED, fontWeight: 600 }}>{k + 1}</span>}
            </div>
          ))}
        </div>
        <div>
          {d.etapas.map((e, i) => (
            <button key={e.id} type="button" onClick={() => irA(2, i)} className="cl-fila"
              style={{ ...btnTexto, display: "flex", flexDirection: "column", justifyContent: "center", width: "100%", height: FILA, borderTop: `1px solid ${LINE}`, paddingRight: 12 }}>
              <span style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
                {desk && <Etiqueta color={MUTED}>{num2(e.num)}</Etiqueta>}
                <span style={{ fontSize: desk ? 16 : 14, fontWeight: 600, color: NAVY_DK, lineHeight: 1.2 }}>{e.name}</span>
              </span>
              <span style={{ fontSize: 13, color: MUTED, marginTop: 3 }}>{fmt1(e.score)}{r1(e.pot) > r1(e.score) ? ` → ${fmt1(e.pot)}` : ""}</span>
            </button>
          ))}
        </div>
        <div style={{ position: "relative", height: alto }}>
          {BANDAS.map(([n, , a, b], k) => (
            <div key={n} style={{ position: "absolute", top: 0, bottom: 0, left: pct(a), width: anchoBanda(a, b), background: k % 2 ? "#F4F9F9" : "transparent", borderLeft: k ? `1px solid ${LINE}` : "none" }} />
          ))}
          {d.etapas.map((e, i) => <div key={e.id} style={{ position: "absolute", left: 0, right: 0, top: FILA * i, borderTop: `1px solid ${LINE}` }} />)}
          <svg viewBox={`0 0 100 ${alto}`} preserveAspectRatio="none" aria-hidden="true"
            style={{ position: "absolute", inset: 0, width: "100%", height: "100%", overflow: "visible", clipPath: listo ? "inset(0 0 0 0)" : "inset(0 0 100% 0)", transition: "clip-path 1.6s cubic-bezier(.4,0,.2,1) .5s" }}>
            {d.hayMejora && <polyline points={linea("pot")} fill="none" stroke={AMBAR} strokeWidth="1.5" strokeDasharray="4 5" vectorEffect="non-scaling-stroke" />}
            <polyline points={linea("score")} fill="none" stroke={PETROLEO} strokeWidth="2" vectorEffect="non-scaling-stroke" />
          </svg>
          {d.etapas.map((e, i) => {
            const y = FILA * i + FILA / 2, crece = r1(e.pot) > r1(e.score);
            return (
              <Fragment key={e.id}>
                {crece && <span aria-hidden="true" style={{ position: "absolute", top: y, left: listo ? pct(e.pot) : pct(e.score), width: 12, height: 12, margin: "-6px 0 0 -6px", border: `2px solid ${AMBAR}`, borderRadius: "50%", background: WHITE, opacity: listo ? 1 : 0, transition: `left 1s cubic-bezier(.2,.7,.2,1) ${1.3 + i * 0.07}s, opacity .4s ${1.3 + i * 0.07}s` }} />}
                <span aria-hidden="true" style={{ position: "absolute", top: y, left: listo ? pct(e.score) : "0%", width: 14, height: 14, margin: "-7px 0 0 -7px", borderRadius: "50%", background: PETROLEO, boxShadow: `0 0 0 3px ${WHITE}`, transition: `left 1.1s cubic-bezier(.2,.7,.2,1) ${i * 0.07}s` }} />
              </Fragment>
            );
          })}
        </div>
      </div>
      <p className="sr-only" style={{ position: "absolute", left: -9999 }}>{d.etapas.map((e) => `${e.name}: ${fmt1(e.score)} de 5 (${getNivel(e.score).label}), con el plan ${fmt1(e.pot)}.`).join(" ")}</p>
      <div {...sube(4, { display: "flex", gap: 22, flexWrap: "wrap", marginTop: 18, fontSize: 14, color: MUTED, paddingLeft: desk ? COL : 0 })}>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}><span style={{ width: 12, height: 12, borderRadius: "50%", background: PETROLEO }} />Hoy</span>
        {d.hayMejora && <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}><span style={{ width: 10, height: 10, borderRadius: "50%", border: `2px solid ${AMBAR}` }} />Con el plan</span>}
        <span>Toque una etapa para ver su detalle.</span>
      </div>
      <div {...sube(5, { marginTop: desk ? 56 : 40, display: "grid", gridTemplateColumns: desk ? `${COL}px repeat(4,minmax(0,1fr))` : "1fr", borderTop: `2px solid ${NAVY_DK}` })}>
        {desk && <div style={{ paddingTop: 16 }}><Etiqueta color={MUTED}>Qué significa cada nivel</Etiqueta></div>}
        {!desk && <Etiqueta color={MUTED} style={{ display: "block", paddingTop: 16 }}>Qué significa cada nivel</Etiqueta>}
        {BANDAS.map(([n, r, a], k) => (
          <div key={n} style={{ padding: desk ? "16px 16px 0" : "14px 0", borderLeft: desk && k ? `1px solid ${LINE}` : "none", borderBottom: desk ? "none" : `1px solid ${LINE}` }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}><Escalon score={a + 0.1} /><strong style={{ fontSize: 15, color: NAVY_DK }}>{n}</strong>{!desk && <span style={{ fontSize: 13, color: MUTED }}>{k + 1} · {r}</span>}</div>
            <p style={{ fontSize: 14, color: MUTED, lineHeight: 1.5, margin: "6px 0 0" }}>{capital(NIVEL_DESC[n])}.</p>
          </div>
        ))}
      </div>
    </Contenedor>
  );
}

// ── 03 ETAPAS ──────────────────────────────────────────────
function DetalleEtapa({ e, desk, irA }) {
  const crece = r1(e.pot) > r1(e.score);
  return (
    <div>
      {desk && (
        <div className="cl-lado" style={{ "--i": 0, display: "flex", alignItems: "flex-end", gap: 24, marginBottom: 28 }}>
          <span aria-hidden="true" style={{ ...cifraGrande(128), color: PETROLEO }}>{num2(e.num)}</span>
          <div style={{ paddingBottom: 6 }}>
            <h3 style={{ ...titular(40), color: NAVY_DK }}>{e.name}</h3>
            <p style={{ fontFamily: "Newsreader,Georgia,serif", fontStyle: "italic", fontSize: 24, color: NAVY_DK, margin: "6px 0 0" }}><span className="cl-hi">{e.pregunta}</span></p>
          </div>
        </div>
      )}
      <div className="cl-lado" style={{ "--i": 1, display: "grid", gridTemplateColumns: desk ? "1fr 1fr" : "1fr", gap: desk ? 40 : 18 }}>
        <div>
          <Etiqueta color={MUTED}>El momento del aspirante</Etiqueta>
          <p style={{ fontSize: 16, color: TEXT, lineHeight: 1.65, margin: "8px 0 0" }}>{e.resumen}</p>
        </div>
        <div>
          <Etiqueta color={MUTED}>Qué mide esta etapa</Etiqueta>
          <p style={{ fontSize: 16, color: TEXT, lineHeight: 1.65, margin: "8px 0 0" }}>{e.contexto}</p>
        </div>
      </div>
      {e.score < 5 && (
        <div className="cl-lado" style={{ "--i": 2, marginTop: desk ? 36 : 26 }}>
          <Etiqueta color={MUTED}>Dónde suele perderse valor</Etiqueta>
          <ol style={{ listStyle: "none", padding: 0, margin: "10px 0 0", borderTop: `1px solid ${LINE}` }}>
            {(FRICCIONES[e.id] || []).map((f, k) => (
              <li key={k} style={{ display: "grid", gridTemplateColumns: "34px minmax(0,1fr)", padding: "14px 0", borderBottom: `1px solid ${LINE}` }}>
                <Etiqueta color={PETROLEO} style={{ paddingTop: 3 }}>{num2(k + 1)}</Etiqueta>
                <span style={{ fontSize: 16, color: NAVY_DK, lineHeight: 1.5 }}>{f.texto}</span>
              </li>
            ))}
          </ol>
        </div>
      )}
      <div className="cl-lado" style={{ "--i": 3, marginTop: desk ? 36 : 26, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, alignItems: "end" }}>
        <div>
          <Etiqueta color={MUTED}>Hoy</Etiqueta>
          <div style={{ ...cifraGrande(desk ? 56 : 44), color: NAVY_DK, margin: "10px 0 10px" }}>{fmt1(e.score)}</div>
          <Nivel score={e.score} color={NAVY_DK} puntaje={false} />
        </div>
        <div>
          <Etiqueta color={MUTED}>Con el plan</Etiqueta>
          <div style={{ ...cifraGrande(desk ? 56 : 44), color: PETROLEO, margin: "10px 0 10px" }}>{fmt1(e.pot)}</div>
          <Nivel score={e.pot} color={PETROLEO} puntaje={false} />
        </div>
      </div>
      <div className="cl-lado" style={{ "--i": 4, marginTop: 18 }}><Tramo hoy={e.score} plan={e.pot} /></div>
      {crece && <button type="button" onClick={() => irA(3)} className="cl-lado" style={{ ...btnTexto, "--i": 5, marginTop: 22, minHeight: 44, fontSize: 16, fontWeight: 600, color: PETROLEO }}><span className="cl-link">Ver las acciones para subirla</span> →</button>}
    </div>
  );
}

function Etapas({ d, desk, sel, setSel, irA }) {
  const actual = sel === -1 ? null : sel ?? (desk ? d.etapas.indexOf(d.peor) : null);
  const cabecera = (e, activo) => (
    <>
      <span style={{ ...cifraGrande(desk ? 30 : 26), color: activo ? PETROLEO : "#9FB3B7", transition: "color .3s" }}>{num2(e.num)}</span>
      <span style={{ minWidth: 0 }}>
        <span style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "baseline" }}>
          <span style={{ fontSize: 16, fontWeight: activo ? 700 : 600, color: NAVY_DK }}>{e.name}</span>
          <span style={{ fontSize: 14, color: MUTED, whiteSpace: "nowrap" }}>{fmt1(e.score)}</span>
        </span>
        <span style={{ display: "block", marginTop: 8 }}><Tramo hoy={e.score} plan={e.pot} alto={10} /></span>
      </span>
    </>
  );
  return (
    <Contenedor desk={desk} style={{ paddingTop: desk ? "clamp(24px,5svh,64px)" : 36 }}>
      <Encabezado desk={desk} etiqueta="Diagnóstico detallado" titulo={<>Las 7 <em className="cl-hi">etapas</em></>}
        bajada="Un cuello de botella en cualquier etapa afecta todo lo que viene después." />
      {desk ? (
        <div style={{ display: "grid", gridTemplateColumns: "330px minmax(0,1fr)", gap: 56, alignItems: "start", marginTop: 48 }}>
          <div role="tablist" aria-orientation="vertical" aria-label="Etapas" {...sube(3, { borderTop: `1px solid ${LINE}`, position: "sticky", top: 76 })}>
            {d.etapas.map((e, i) => {
              const activo = actual === i;
              return (
                <button key={e.id} type="button" role="tab" aria-selected={activo} aria-controls="etapa-detalle" onClick={() => setSel(i)} className="cl-fila"
                  style={{ ...btnTexto, position: "relative", display: "grid", gridTemplateColumns: "52px minmax(0,1fr)", gap: 8, alignItems: "center", width: "100%", padding: "clamp(10px,1.9svh,16px) 12px clamp(10px,1.9svh,16px) 14px", borderBottom: `1px solid ${LINE}`, background: activo ? "#F3F8F8" : "transparent" }}>
                  <span aria-hidden="true" style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: 3, background: PETROLEO, transform: `scaleY(${activo ? 1 : 0})`, transition: "transform .35s cubic-bezier(.2,.7,.2,1)" }} />
                  {cabecera(e, activo)}
                </button>
              );
            })}
          </div>
          <section id="etapa-detalle" role="tabpanel" aria-label={d.etapas[actual].name} key={d.etapas[actual].id}>
            <DetalleEtapa e={d.etapas[actual]} desk={desk} irA={irA} />
          </section>
        </div>
      ) : (
        <div {...sube(3, { marginTop: 28, borderTop: `1px solid ${LINE}` })}>
          {d.etapas.map((e, i) => {
            const abierta = actual === i;
            return (
              <div key={e.id} style={{ borderBottom: `1px solid ${LINE}` }}>
                <button type="button" aria-expanded={abierta} aria-controls={`etapa-${e.id}`} onClick={() => setSel(abierta ? -1 : i)}
                  style={{ ...btnTexto, display: "grid", gridTemplateColumns: "44px minmax(0,1fr)", gap: 8, alignItems: "center", width: "100%", minHeight: TOUCH + 20, padding: "14px 0" }}>
                  {cabecera(e, abierta)}
                </button>
                {abierta && (
                  <div id={`etapa-${e.id}`} style={{ padding: "4px 0 28px" }}>
                    <p style={{ fontFamily: "Newsreader,Georgia,serif", fontStyle: "italic", fontSize: 21, color: NAVY_DK, margin: "0 0 18px" }}><span className="cl-hi">{e.pregunta}</span></p>
                    <DetalleEtapa e={e} desk={desk} irA={irA} />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </Contenedor>
  );
}

// ── 04 ACCIONES ────────────────────────────────────────────
function Casilla({ on }) {
  return (
    <span aria-hidden="true" style={{ width: 22, height: 22, marginTop: 2, border: `1.5px solid ${on ? PETROLEO : "#8A9B9E"}`, background: on ? PETROLEO : WHITE, display: "flex", alignItems: "center", justifyContent: "center", transition: "background .2s, border-color .2s" }}>
      <svg width="14" height="14" viewBox="0 0 14 14"><path d="M2.5 7.5l3 3 6-7" fill="none" stroke={WHITE} strokeWidth="2" strokeLinecap="square" pathLength="1" style={{ strokeDasharray: 1, strokeDashoffset: on ? 0 : 1, transition: "stroke-dashoffset .3s ease .05s" }} /></svg>
    </span>
  );
}

function Accion({ r, on, alternar }) {
  return (
    <button type="button" role="checkbox" aria-checked={on} onClick={alternar} className="cl-fila"
      style={{ ...btnTexto, display: "grid", gridTemplateColumns: "26px minmax(0,1fr) auto", gap: 16, alignItems: "start", width: "100%", padding: "18px 10px 18px 6px", background: on ? "#F3F8F8" : "transparent", borderBottom: `1px solid ${LINE}` }}>
      <Casilla on={on} />
      <span>
        {r.tipo === "nivel" && <span style={{ display: "block", fontSize: 14, color: MUTED, lineHeight: 1.45, marginBottom: 4 }}>Mejora: {r.pregunta}</span>}
        <span style={{ display: "block", fontSize: 16, color: NAVY_DK, lineHeight: 1.5 }}>{r.texto}</span>
        <Etiqueta color={MUTED} style={{ display: "block", marginTop: 8, fontSize: 11 }}>{r.accion}</Etiqueta>
      </span>
      <span style={{ fontFamily: "'CL Titulos',sans-serif", fontSize: 18, color: on ? PETROLEO : MUTED, whiteSpace: "nowrap", transition: "color .3s" }}>+{fmt1(r.impacto)}</span>
    </button>
  );
}

function Barra({ hoy, plan }) {
  return (
    <div aria-hidden="true" style={{ position: "relative", height: 6, background: "rgba(255,255,255,.14)" }}>
      <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: pct(hoy), background: EMERALD }} />
      <div style={{ position: "absolute", top: 0, bottom: 0, left: pct(hoy), width: `calc(${pct(Math.max(plan, hoy))} - ${pct(hoy)})`, background: AMBAR_LUZ, transition: "width .6s cubic-bezier(.2,.7,.2,1)" }} />
      {BORDES.map((b) => <div key={b} style={{ position: "absolute", top: -3, bottom: -3, left: pct(b), width: 1, background: "rgba(255,255,255,.35)" }} />)}
    </div>
  );
}

function Validar({ desk, registroData }) {
  return (
    <Contenedor desk={desk} style={{ paddingTop: desk ? "clamp(24px,5svh,64px)" : 36 }}>
      <Encabezado desk={desk} etiqueta="Plan de acción" titulo={<>El <em className="cl-hi">próximo paso</em></>} />
      <div {...sube(3, { background: NAVY_DK, color: WHITE, padding: desk ? "40px 44px" : "26px 22px", marginTop: 32, maxWidth: 820 })}>
        <div style={{ ...titular(desk ? 30 : 24), color: WHITE }}>{VALIDAR.titulo}</div>
        <p style={{ fontSize: 17, color: "rgba(255,255,255,.78)", lineHeight: 1.6, margin: "14px 0 22px" }}>{VALIDAR.texto}</p>
        <Etiqueta color={EMERALD}>Tres números para validarlo</Etiqueta>
        <ol style={{ listStyle: "none", padding: 0, margin: "12px 0 0" }}>
          {VALIDAR.metricas.map((m, k) => (
            <li key={m} style={{ display: "grid", gridTemplateColumns: "34px 1fr", padding: "12px 0", borderTop: "1px solid rgba(255,255,255,.12)", fontSize: 16, lineHeight: 1.5 }}>
              <Etiqueta color={EMERALD} style={{ paddingTop: 3 }}>{num2(k + 1)}</Etiqueta>{m}
            </li>
          ))}
        </ol>
        {registroData.target && <p style={{ fontSize: 16, color: EMERALD, fontWeight: 600, margin: "18px 0 0" }}>{VALIDAR.reunion}</p>}
      </div>
    </Contenedor>
  );
}

function Acciones({ d, desk, checked, setChecked, registroData }) {
  const proyEtapa = (eid) => calcEtapaProjected(d.scores, checked, eid, d.respuestas);
  const proyectado = parseFloat((ETAPAS_DATA.reduce((s, e) => s + proyEtapa(e.id), 0) / ETAPAS_DATA.length).toFixed(2));
  const total = d.etapas.reduce((n, e) => n + accionesDeEtapa(d.respuestas, e.id).filter((a) => checked[a.key]).length, 0);
  const cifra = useCuenta(r1(proyectado), { ms: 700, desde: r1(d.global) });
  if (d.todoEnD) return <Validar desk={desk} registroData={registroData} />;
  const sube_ = r1(proyectado) > r1(d.global);
  const todas = () => setChecked(Object.fromEntries(d.etapas.flatMap((e) => accionesDeEtapa(d.respuestas, e.id).map((a) => [a.key, true]))));
  const linkOscuro = { ...btnTexto, minHeight: 40, fontSize: 14, fontWeight: 600, color: EMERALD };
  const explicacion = `Cada acción sube un escalón la pregunta que mejora${d.cubiertas ? ` (no repetimos ${d.cubiertas === 1 ? "una acción de arranque que ya tiene resuelta" : `${d.cubiertas} acciones de arranque que ya tiene resueltas`})` : ""}. Llegar a 5 es tener todo el proceso automatizado y medido en las 7 etapas${registroData.target ? ": es lo que trabajamos en la reunión de 45 minutos." : "."}`;
  const panel = (
    <div className="cl-oscuro" style={{ background: NAVY_DK, color: WHITE, padding: desk ? "28px 28px 24px" : "24px 20px" }}>
      <Etiqueta color={SLATE}>Puntaje proyectado</Etiqueta>
      <div style={{ display: "flex", alignItems: "baseline", gap: 14, marginTop: 16 }}>
        <span style={{ ...cifraGrande(desk ? 40 : 34), color: SLATE }}>{fmt1(d.global)}</span>
        <span aria-hidden="true" style={{ color: SLATE, fontSize: 20 }}>→</span>
        <span aria-live="polite" aria-label={`Puntaje proyectado: ${fmt1(proyectado)}`} style={{ ...cifraGrande(desk ? 80 : 60), color: sube_ ? AMBAR_LUZ : WHITE, transition: "color .4s" }}>{cifra.toFixed(1)}</span>
      </div>
      <div style={{ marginTop: 16 }}><Nivel score={proyectado} oscuro color={WHITE} puntaje={false} /></div>
      <div style={{ marginTop: 20 }}><Barra hoy={d.global} plan={proyectado} /></div>
      <p style={{ fontSize: 14, color: SLATE, margin: "14px 0 0" }}>{total} {total === 1 ? "acción seleccionada" : "acciones seleccionadas"}{sube_ ? ` · +${fmt1(r1(proyectado) - r1(d.global))} puntos` : ""}</p>
      <div style={{ display: "flex", gap: 20, marginTop: 6 }}>
        <button type="button" onClick={todas} style={linkOscuro}>Marcar todas</button>
        {total > 0 && <button type="button" onClick={() => setChecked({})} style={{ ...linkOscuro, color: SLATE }}>Desmarcar</button>}
      </div>
      {desk && <p style={{ fontSize: 13, color: "rgba(255,255,255,.6)", lineHeight: 1.55, margin: "16px 0 0", borderTop: "1px solid rgba(255,255,255,.12)", paddingTop: 14 }}>{explicacion}</p>}
    </div>
  );
  const lista = (
    <div>
      {d.etapas.map((e, gi) => {
        const recs = accionesDeEtapa(d.respuestas, e.id), nuevo = proyEtapa(e.id), cambia = r1(nuevo) > r1(e.score);
        return (
          <section key={e.id} {...sube(gi + 3, { marginTop: gi ? 48 : 0 })}>
            <header style={{ display: "flex", alignItems: "baseline", gap: 14, paddingBottom: 12, borderBottom: `2px solid ${NAVY_DK}` }}>
              <span style={{ ...cifraGrande(28), color: PETROLEO }}>{num2(e.num)}</span>
              <h3 style={{ ...titular(desk ? 24 : 20), color: NAVY_DK, flex: 1 }}>{e.name}</h3>
              <span style={{ fontSize: 15, color: MUTED, whiteSpace: "nowrap" }}>{fmt1(e.score)}{cambia && <> → <strong style={{ color: PETROLEO }}>{fmt1(nuevo)}</strong></>}</span>
            </header>
            {!recs.length && <p style={{ margin: 0, padding: "16px 0", fontSize: 16, color: TEXT, borderBottom: `1px solid ${LINE}` }}>Esta etapa ya está en el nivel más alto que mide el diagnóstico.</p>}
            {recs.map((r) => <Accion key={r.key} r={r} on={!!checked[r.key]} alternar={() => setChecked((p) => ({ ...p, [r.key]: !p[r.key] }))} />)}
          </section>
        );
      })}
    </div>
  );
  return (
    <>
      <Contenedor desk={desk} style={{ paddingTop: desk ? "clamp(24px,5svh,64px)" : 36 }}>
        <Encabezado desk={desk} etiqueta="Plan de acción" titulo={<>Para <em className="cl-hi">subir de nivel</em></>}
          bajada="Marque las acciones que su equipo puede implementar y vea cómo sube el puntaje." />
        {desk ? (
          <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) 340px", gap: 56, alignItems: "start", marginTop: 48 }}>
            {lista}
            <aside {...sube(3, { position: "sticky", top: 76 })}>{panel}</aside>
          </div>
        ) : (
          <>
            <div {...sube(3, { margin: "28px -20px 36px" })}>{panel}</div>
            {lista}
            <p style={{ fontSize: 14, color: MUTED, lineHeight: 1.55, margin: "28px 0 0" }}>{explicacion}</p>
          </>
        )}
      </Contenedor>
      {!desk && (
        <div className="cl-oscuro" style={{ position: "sticky", bottom: 0, zIndex: 20, background: NAVY_DK, color: WHITE, marginTop: 24, padding: "12px 20px calc(12px + env(safe-area-inset-bottom))", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
          <Etiqueta color={SLATE}>{total} {total === 1 ? "acción" : "acciones"}</Etiqueta>
          <span style={{ fontSize: 16 }}><span style={{ color: SLATE }}>{fmt1(d.global)} → </span><strong style={{ fontSize: 22, color: sube_ ? AMBAR_LUZ : WHITE }}>{cifra.toFixed(1)}</strong></span>
        </div>
      )}
    </>
  );
}

// ── 05 INFORME ─────────────────────────────────────────────
// PDF imprimible: el HTML A4 de lib/informePdf.js se abre en otra pestaña y se imprime.
function abrirPdf(d, registroData) {
  const win = window.open("", "_blank");
  if (win) { win.document.write(htmlInforme(d, registroData, { origen: window.location.origin })); win.document.close(); }
}

function InformeFinal({ d, desk, registroData, envio }) {
  const [estado, setEstado] = useState("listo");
  const generar = () => { setEstado("generando"); abrirPdf(d, registroData); track("informe_pdf"); setTimeout(() => setEstado("hecho"), 800); };
  const orden = [...d.etapas].sort((a, b) => (b.pot - b.score) - (a.pot - a.score));
  return (
    <>
      <section className="cl-oscuro" style={{ background: NAVY_DK, color: WHITE }}>
        <Contenedor desk={desk} style={{ paddingTop: desk ? "clamp(24px,5svh,64px)" : 36, paddingBottom: desk ? "clamp(24px,4.5svh,56px)" : 36, ...(desk ? { display: "grid", gridTemplateColumns: "minmax(0,1fr) auto", columnGap: 56, alignItems: "end" } : {}) }}>
          <div>
            <Encabezado oscuro desk={desk} etiqueta="Su informe" titulo={<>Lo que puede <em className="cl-hi-oscuro">sumar</em></>} />
            {desk && <p {...sube(4, { fontSize: "clamp(16px,2.6svh,19px)", color: "rgba(255,255,255,.72)", lineHeight: 1.55, margin: "16px 0 0", maxWidth: 520 })}>
              {d.hayMejora ? <>Implementando todas las acciones del plan, su proceso suma <strong style={{ color: WHITE }}>+{fmt1(r1(d.potencial) - r1(d.global))} puntos</strong> y pasa a {getNivel(d.potencial).label.toLowerCase()}.</> : "Su proceso ya está en el máximo de referencia de este diagnóstico. Las recomendaciones ayudan a sostenerlo."}
            </p>}
          </div>
          <div {...sube(3, { display: "flex", alignItems: "flex-end", gap: desk ? 40 : 28, marginTop: desk ? 0 : 28, flexWrap: "wrap" })}>
            <div><Etiqueta color={SLATE}>Hoy</Etiqueta><div style={{ ...cifraGrande(desk ? "clamp(72px,14svh,120px)" : 84), color: WHITE, marginTop: 14 }}>{fmt1(d.global)}</div></div>
            <svg width={desk ? 80 : 60} height="20" aria-hidden="true" style={{ marginBottom: desk ? 26 : 26 }}><line x1="0" x2="100%" y1="10" y2="10" stroke={SLATE} strokeWidth="1" /><path d={`M${desk ? 70 : 50} 4l8 6-8 6`} fill="none" stroke={SLATE} strokeWidth="1" /></svg>
            <div><Etiqueta color={SLATE}>Con el plan</Etiqueta><div style={{ ...cifraGrande(desk ? "clamp(72px,14svh,120px)" : 84), color: AMBAR_LUZ, marginTop: 14 }}>{fmt1(d.potencial)}</div></div>
          </div>
          {!desk && <p {...sube(4, { fontSize: 17, color: "rgba(255,255,255,.72)", lineHeight: 1.55, margin: "24px 0 0", maxWidth: 620 })}>
            {d.hayMejora ? <>Implementando todas las acciones del plan, su proceso suma <strong style={{ color: WHITE }}>+{fmt1(r1(d.potencial) - r1(d.global))} puntos</strong> y pasa a {getNivel(d.potencial).label.toLowerCase()}.</> : "Su proceso ya está en el máximo de referencia de este diagnóstico. Las recomendaciones ayudan a sostenerlo."}
          </p>}
        </Contenedor>
      </section>
      <Contenedor desk={desk} style={{ paddingTop: desk ? "clamp(24px,5svh,56px)" : 32, display: "grid", gridTemplateColumns: desk ? "minmax(0,1fr) 380px" : "1fr", gap: desk ? 64 : 40, alignItems: "start" }}>
        <div {...sube(5)}>
          <Etiqueta color={MUTED}>Mejora posible por etapa</Etiqueta>
          <div style={{ marginTop: 12, borderTop: `2px solid ${NAVY_DK}` }}>
            {orden.map((e) => {
              const gana = r1(e.pot) - r1(e.score);
              return (
                <div key={e.id} style={{ display: "grid", gridTemplateColumns: desk ? "40px 190px minmax(0,1fr) 64px" : "34px minmax(0,1fr) 56px", gap: 12, alignItems: "center", padding: "14px 0", borderBottom: `1px solid ${LINE}` }}>
                  <Etiqueta color={MUTED}>{num2(e.num)}</Etiqueta>
                  <span style={{ fontSize: 15, fontWeight: 600, color: NAVY_DK }}>{e.name}</span>
                  {desk && <Tramo hoy={e.score} plan={e.pot} />}
                  <span style={{ textAlign: "right", fontSize: 15, fontWeight: 700, color: gana > 0 ? PETROLEO : MUTED }}>{gana > 0 ? `+${fmt1(gana)}` : "máx."}</span>
                </div>
              );
            })}
          </div>
        </div>
        <div {...sube(6, { borderTop: `2px solid ${PETROLEO}`, paddingTop: 20 })}>
          <Etiqueta color={MUTED}>Informe completo en PDF</Etiqueta>
          <p style={{ fontSize: 16, color: TEXT, lineHeight: 1.6, margin: "12px 0 16px" }}>Las 7 etapas con su análisis, dónde se pierde valor en cada una y el plan de acción. Listo para imprimir o compartir con el equipo directivo.</p>
          {estado === "hecho" ? (
            <div role="status" style={{ padding: "16px 0", borderTop: `1px solid ${LINE}` }}>
              <div style={{ fontSize: 16, color: PETROLEO, fontWeight: 700 }}>El PDF se abrió en otra pestaña.</div>
              <p style={{ fontSize: 15, color: TEXT, margin: "4px 0 0" }}>Desde ahí puede imprimirlo o guardarlo.</p>
              <button type="button" onClick={() => setEstado("listo")} style={{ ...btnTexto, marginTop: 10, minHeight: 44, color: PETROLEO, fontSize: 15, fontWeight: 600 }}><span className="cl-link">Generarlo de nuevo</span></button>
            </div>
          ) : (
            <button type="button" onClick={generar} disabled={estado === "generando"}
              style={{ width: "100%", minHeight: TOUCH + 6, border: "none", cursor: estado === "generando" ? "not-allowed" : "pointer", ...(estado === "generando" ? BTN_DISABLED : BTN_PRIMARY), fontSize: 16, fontFamily: "'Schibsted Grotesk',sans-serif", fontWeight: 700 }}>
              {estado === "generando" ? "Generando el PDF…" : "Descargar el informe en PDF"}
            </button>
          )}
          <EnvioNota email={registroData.email} estado={envio} />
          <p style={{ fontSize: 14, color: MUTED, lineHeight: 1.55, margin: "24px 0 0", paddingTop: 16, borderTop: `1px solid ${LINE}` }}>
            <strong style={{ color: NAVY_DK }}>Próximamente, comparación regional.</strong> Cuando 10 o más universidades completen el diagnóstico, podrá ver cómo se compara su proceso con el de otras instituciones de la región.
          </p>
        </div>
      </Contenedor>
    </>
  );
}

// ── NAVEGACIÓN ─────────────────────────────────────────────
function Solapas({ tab, irA, desk }) {
  const refs = useRef([]), caja = useRef(null);
  const [marca, setMarca] = useState({ left: 0, width: 0 });
  useLayoutEffect(() => {
    const medir = () => { const b = refs.current[tab]; if (b) setMarca({ left: b.offsetLeft, width: b.offsetWidth }); };
    medir();
    refs.current[tab]?.scrollIntoView?.({ inline: "center", block: "nearest" });
    window.addEventListener("resize", medir);
    return () => window.removeEventListener("resize", medir);
  }, [tab, desk]);
  return (
    <nav aria-label="Secciones del informe" style={{ position: "sticky", top: 0, zIndex: 100, background: NAVY_DK, borderBottom: "1px solid rgba(255,255,255,.1)" }}>
      <Contenedor desk={desk} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 24, paddingLeft: desk ? 32 : 0, paddingRight: desk ? 32 : 0 }}>
        {desk && <a href="https://campuslatina.com/" aria-label="Campus Latina" style={{ display: "flex" }}><img src="/campus-latina-sobre-oscuro.svg" alt="" width="120" height="34" /></a>}
        <div ref={caja} role="tablist" className="cl-sin-barra" style={{ position: "relative", display: "flex", overflowX: "auto", padding: desk ? 0 : "0 12px" }}>
          {SECCIONES.map((s, i) => (
            <button key={s} ref={(el) => { refs.current[i] = el; }} type="button" role="tab" aria-selected={tab === i} onClick={() => irA(i)}
              style={{ ...btnTexto, display: "inline-flex", alignItems: "center", gap: 7, minHeight: TOUCH + 8, padding: "0 14px", whiteSpace: "nowrap", color: tab === i ? WHITE : "rgba(255,255,255,.62)", fontSize: 15, fontWeight: tab === i ? 700 : 500, transition: "color .25s" }}>
              <Etiqueta color={tab === i ? EMERALD : "rgba(255,255,255,.4)"} style={{ fontSize: 11 }}>{num2(i + 1)}</Etiqueta>{s}
            </button>
          ))}
          <span aria-hidden="true" style={{ position: "absolute", bottom: 0, height: 2, background: EMERALD, left: marca.left, width: marca.width, transition: "left .45s cubic-bezier(.2,.7,.2,1), width .45s cubic-bezier(.2,.7,.2,1)" }} />
        </div>
      </Contenedor>
    </nav>
  );
}

function Pie({ tab, irA, desk }) {
  const antes = tab > 0 ? tab - 1 : null, despues = tab < SECCIONES.length - 1 ? tab + 1 : null;
  return (
    <Contenedor desk={desk} style={{ marginTop: tab === SECCIONES.length - 1 ? 0 : desk ? 80 : 56, paddingTop: 24, paddingBottom: 24, borderTop: tab === SECCIONES.length - 1 ? "none" : `1px solid ${LINE}`, display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: 16 }}>
      {antes != null ? (
        <button type="button" onClick={() => irA(antes)} style={{ ...btnTexto, minHeight: 44 }}>
          <Etiqueta color={MUTED} style={{ display: "block" }}>← {num2(antes + 1)}</Etiqueta>
          <span style={{ fontSize: 16, color: MUTED }}>{SECCIONES[antes]}</span>
        </button>
      ) : <span />}
      {despues != null && (
        <button type="button" onClick={() => irA(despues)} style={{ ...btnTexto, minHeight: 44, textAlign: "right" }}>
          <Etiqueta color={MUTED} style={{ display: "block" }}>Siguiente · {num2(despues + 1)}</Etiqueta>
          <span style={{ ...titular(desk ? 32 : 24), color: NAVY_DK }}><span className="cl-link">{SECCIONES[despues]}</span> →</span>
        </button>
      )}
    </Contenedor>
  );
}

export function Informe({ registroData, respuestas, envio }) {
  const desk = useIsDesktop();
  const [tab, setTab] = useState(0);
  const [checked, setChecked] = useState({});
  const [sel, setSel] = useState(null);
  const d = datosInforme(respuestas);
  const irA = (i, etapa) => {
    if (etapa != null) setSel(etapa);
    setTab(i); window.scrollTo(0, 0);
    track("informe_seccion", { seccion: SECCIONES[i] });
  };
  return (
    <div style={{ fontFamily: "'Schibsted Grotesk',sans-serif", background: WHITE, minHeight: "100vh", color: NAVY_DK }}>
      <Solapas tab={tab} irA={irA} desk={desk} />
      <main key={tab} role="tabpanel" aria-label={SECCIONES[tab]}>
        {tab === 0 && <Resumen d={d} desk={desk} registroData={registroData} irA={irA} />}
        {tab === 1 && <Mapa d={d} desk={desk} irA={irA} />}
        {tab === 2 && <Etapas d={d} desk={desk} sel={sel} setSel={setSel} irA={irA} />}
        {tab === 3 && <Acciones d={d} desk={desk} checked={checked} setChecked={setChecked} registroData={registroData} />}
        {tab === 4 && <InformeFinal d={d} desk={desk} registroData={registroData} envio={envio} />}
      </main>
      {tab === SECCIONES.length - 1 && <div style={{ marginTop: desk ? 80 : 56 }}><ContactoCTA universidad={registroData.universidad} target={registroData.target} alto={d.todoEnD} ancho={1120} /></div>}
      <Pie tab={tab} irA={irA} desk={desk} />
      <p style={{ textAlign: "center", margin: 0, padding: "0 16px 36px" }}><Etiqueta color={MUTED}>CampusLatina × CIeLatam × Salesforce</Etiqueta></p>
    </div>
  );
}
