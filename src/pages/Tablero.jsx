// Tablero del diagnóstico colaborativo: las 7 etapas con su estado, quién respondió cada una,
// invitar colegas por etapa y, con las 7 completas, el paso al informe.
import { useState, useEffect, useRef } from "react";
import { NAVY, NAVY_DK, EMERALD, SLATE, CREAM, WHITE, EMERALD_TXT, MUTED, TEXT, LINE, BTN_PRIMARY, BTN_DISABLED, TOUCH, PETROLEO } from "../theme.js";
import { ETAPAS_DATA } from "../data/etapas.js";
import { etapaCompleta } from "../lib/api.js";
import { useIsDesktop } from "../lib/useIsDesktop.js";

// A quién suele corresponderle cada etapa dentro de una universidad (sugerencia al invitar).
export const AREA = {
  descubrimiento: "Marketing", exploracion: "Marketing", activacion: "Admisiones", acompanamiento: "Admisiones",
  decision: "Admisiones", inscripcion: "Administración", retencion: "Área académica",
};

const mono = { fontFamily: "'CL Etiquetas',sans-serif", fontSize: 12, letterSpacing: ".1em", textTransform: "uppercase" };
const btnBase = { minHeight: TOUCH, borderRadius:2, fontSize: 16, fontFamily: "'Schibsted Grotesk',sans-serif", cursor: "pointer" };
const btnSec = { ...btnBase, padding: "0 16px", border: `1.5px solid ${NAVY}`, background: WHITE, color: NAVY, fontWeight: 600 };
const btnLink = { ...btnBase, minHeight: 44, padding: "0 4px", border: "none", background: "none", color: EMERALD_TXT, fontWeight: 600, textDecoration: "underline", textUnderlineOffset: 3 };
const campo = { display: "block", width: "100%", minHeight: TOUCH, padding: "11px 14px", border: "1.5px solid #8A9B9E", borderRadius:2, fontSize: 16, fontFamily: "'Schibsted Grotesk',sans-serif", color: NAVY, background: CREAM };
const label = { display: "block", marginBottom: 6, ...mono, color: NAVY, fontWeight: 700 };

export function Tablero({ diag, quien, misEtapas, aviso, onResponder, onInvitar, onCopiar, onFinalizar, finalizando, errorFinal }) {
  const desk = useIsDesktop();
  const resp = diag.respuestas || {};
  const listas = ETAPAS_DATA.filter((e) => etapaCompleta(e, resp));
  const todas = listas.length === ETAPAS_DATA.length;
  // Próxima etapa sugerida: primero las asignadas a esta persona, después cualquiera pendiente.
  const pendientes = ETAPAS_DATA.filter((e) => !etapaCompleta(e, resp));
  const proxima = pendientes.find((e) => misEtapas.includes(e.id)) || (misEtapas.length ? null : pendientes[0]);
  const invitadoA = (id) => diag.colaboradores.filter((c) => c.etapas.includes(id)).map((c) => c.nombre);
  const ancho = { maxWidth: 1120, margin: "0 auto", paddingLeft: desk ? 32 : 20, paddingRight: desk ? 32 : 20 };

  const barra = (
    <div style={{ position: "sticky", bottom: 0, zIndex: 10, background: "rgba(255,255,255,.96)", backdropFilter: "blur(6px)", WebkitBackdropFilter: "blur(6px)", borderTop: `1px solid ${LINE}` }}>
      <div style={{ ...ancho, paddingTop: 10, paddingBottom: "calc(10px + env(safe-area-inset-bottom))", display: "flex", justifyContent: desk ? "flex-end" : "stretch" }}>
        {todas ? (
          <button type="button" onClick={onFinalizar} disabled={finalizando}
            style={{ ...btnBase, width: desk ? "auto" : "100%", padding: "0 32px", minHeight: TOUCH + 6, border: "none", fontWeight: 700, ...(finalizando ? BTN_DISABLED : BTN_PRIMARY) }}>
            {finalizando ? "Generando el informe…" : "Ver el diagnóstico completo →"}
          </button>
        ) : proxima ? (
          <button type="button" onClick={() => onResponder(proxima.num - 1)}
            style={{ ...btnBase, width: desk ? "auto" : "100%", padding: "0 32px", minHeight: TOUCH + 6, border: "none", fontWeight: 700, ...BTN_PRIMARY }}>
            {listas.length ? "Seguir con" : "Empezar por"} la etapa {proxima.num}: {proxima.name} →
          </button>
        ) : (
          <p style={{ margin: 0, textAlign: "center", fontSize: 15, color: TEXT, fontWeight: 500, padding: "8px 0", width: "100%" }}>
            ¡Gracias! Sus etapas ya están guardadas. El informe se genera cuando el equipo complete las 7.
          </p>
        )}
      </div>
      {errorFinal && <p role="alert" style={{ margin: "0 0 10px", textAlign: "center", fontSize: 14, color: "#B3261E" }}>{errorFinal}</p>}
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", background: WHITE, display: "flex", flexDirection: "column" }}>
      <header className="cl-oscuro" style={{ background: NAVY_DK, color: WHITE }}>
        <div style={{ ...ancho, paddingTop: 16, paddingBottom: desk ? 44 : 30 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
            {desk && <img src="/campus-latina-sobre-oscuro.svg" alt="Campus Latina" width="106" height="30" />}
            <span style={{ ...mono, color: "rgba(255,255,255,.62)" }}>Diagnóstico del proceso de inscripción</span>
          </div>
          <h1 className="cl-sube" style={{ "--i": 0, fontFamily: "'CL Titulos',sans-serif", fontWeight: 700, fontSize: desk ? 52 : 32, lineHeight: 1.04, letterSpacing: "-.03em", color: WHITE, margin: desk ? "40px 0 0" : "28px 0 0", textWrap: "balance" }}>
            {diag.universidad}
          </h1>
          <div className="cl-sube" style={{ "--i": 1, display: "flex", alignItems: "flex-end", gap: 20, marginTop: desk ? 28 : 20, flexWrap: "wrap" }}>
            <div style={{ fontFamily: "'CL Titulos',sans-serif", fontWeight: 700, fontSize: desk ? 56 : 44, lineHeight: 0.85, letterSpacing: "-.045em", color: EMERALD }}>
              {listas.length}<span style={{ fontSize: 18, color: SLATE, letterSpacing: 0, fontWeight: 500 }}> de 7 etapas</span>
            </div>
            <div role="progressbar" aria-label="Etapas completas" aria-valuemin={0} aria-valuemax={7} aria-valuenow={listas.length} style={{ display: "flex", gap: 4, flex: 1, minWidth: 180, maxWidth: 460, paddingBottom: 6 }}>
              {ETAPAS_DATA.map((e) => (
                <span key={e.id} style={{ flex: 1, height: 4, background: etapaCompleta(e, resp) ? EMERALD : "rgba(255,255,255,.14)", transition: "background .4s" }} />
              ))}
            </div>
          </div>
        </div>
      </header>
      <main style={{ ...ancho, flex: 1, width: "100%", paddingTop: desk ? 40 : 26, paddingBottom: 32 }}>
        {aviso && <p role="status" style={{ margin: "0 0 20px", padding: "12px 16px", background: "#F3F8F8", borderLeft: `3px solid ${PETROLEO}`, color: NAVY_DK, fontSize: 15, fontWeight: 500 }}>{aviso}</p>}
        <div className="cl-sube" style={{ "--i": 2, display: desk ? "grid" : "block", gridTemplateColumns: "minmax(0,1fr) auto", gap: 32, alignItems: "end", marginBottom: desk ? 32 : 24 }}>
          <p style={{ fontSize: 16, color: TEXT, lineHeight: 1.6, margin: 0, maxWidth: 640 }}>
            <strong style={{ color: NAVY_DK }}>Cada etapa se guarda al terminarla.</strong> Puede seguir más tarde desde el link que enviamos a {diag.email}, o pedirle a un colega que complete las etapas que conoce mejor. El informe se genera cuando estén las 7.
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0 22px", marginTop: desk ? 0 : 10 }}>
            <button type="button" onClick={() => onInvitar([])} style={{ ...btnLink, color: PETROLEO }}>Invitar a un colega</button>
            <button type="button" onClick={onCopiar} style={{ ...btnLink, color: NAVY_DK }}>Copiar link</button>
          </div>
        </div>

        <ol style={{ listStyle: "none", padding: 0, margin: 0, display: "grid", gridTemplateColumns: desk ? "1fr 1fr" : "1fr", columnGap: 48, borderTop: `2px solid ${NAVY_DK}` }}>
          {ETAPAS_DATA.map((e, i) => {
            const lista = etapaCompleta(e, resp);
            const por = diag.etapas_por?.[e.id]?.nombre;
            const invitados = invitadoA(e.id);
            const mia = misEtapas.includes(e.id);
            return (
              <li key={e.id} className="cl-sube" style={{ "--i": 3 + i, display: "grid", gridTemplateColumns: "56px minmax(0,1fr)", gap: 8, padding: "18px 0 12px", borderBottom: `1px solid ${LINE}` }}>
                <span aria-hidden="true" style={{ fontFamily: "'CL Titulos',sans-serif", fontWeight: 700, fontSize: 34, lineHeight: 0.9, letterSpacing: "-.045em", color: lista ? PETROLEO : mia ? NAVY_DK : "#9FB3B7" }}>{String(e.num).padStart(2, "0")}</span>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 18, fontWeight: 700, color: NAVY_DK }}>{e.name}</div>
                  <div style={{ fontSize: 15, color: PETROLEO, marginTop: 1 }}>{e.pregunta}</div>
                  <div style={{ fontSize: 14, color: MUTED, lineHeight: 1.5, marginTop: 6, display: "flex", alignItems: "center", gap: 8 }}>
                    {lista && <svg width="14" height="11" viewBox="0 0 14 11" aria-hidden="true"><path d="M1.5 5.5l3.5 3.5 7.5-7.5" fill="none" stroke={PETROLEO} strokeWidth="2" /></svg>}
                    <span>{lista
                      ? <>Lista{por ? <> · respondida por <strong style={{ color: NAVY_DK }}>{por}</strong></> : null}</>
                      : invitados.length
                        ? <>Pendiente · invitado: <strong style={{ color: NAVY_DK }}>{invitados.join(", ")}</strong></>
                        : <>Pendiente · suele conocerla: {AREA[e.id]}</>}</span>
                  </div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "0 18px", marginTop: 4 }}>
                    <button type="button" onClick={() => onResponder(i)} style={{ ...btnLink, color: lista ? NAVY_DK : PETROLEO }}>{lista ? "Revisar respuestas" : "Responder →"}</button>
                    {!lista && <button type="button" onClick={() => onInvitar([e.id])} style={{ ...btnLink, color: MUTED, fontWeight: 500 }}>Invitar a un colega</button>}
                  </div>
                </div>
              </li>
            );
          })}
        </ol>
        {quien && <p style={{ fontSize: 14, color: MUTED, margin: "20px 0 0" }}>Está respondiendo como <strong style={{ color: NAVY_DK }}>{quien}</strong>.</p>}
      </main>
      {barra}
    </div>
  );
}

// Ventana accesible: foco al abrir, Escape cierra y el foco vuelve al botón que la abrió.
function Ventana({ titulo, onCerrar, children }) {
  const ref = useRef(null);
  const cerrar = useRef(onCerrar);
  cerrar.current = onCerrar;
  // Solo al abrir: si dependiera de onCerrar, el foco volvería al primer campo en cada tecla.
  useEffect(() => {
    const previo = document.activeElement;
    ref.current?.querySelector("input,textarea,button")?.focus();
    const esc = (ev) => ev.key === "Escape" && cerrar.current();
    document.addEventListener("keydown", esc);
    return () => { document.removeEventListener("keydown", esc); previo?.focus?.(); };
  }, []);
  return (
    <div onClick={(ev) => ev.target === ev.currentTarget && onCerrar()} style={{ position: "fixed", inset: 0, zIndex: 200, background: "rgba(10,35,41,.55)", display: "flex", alignItems: "flex-end", justifyContent: "center", padding: 0 }}>
      <div ref={ref} role="dialog" aria-modal="true" aria-labelledby="ventana-titulo"
        style={{ background: WHITE, width: "100%", maxWidth: 560, maxHeight: "92vh", overflowY: "auto", borderRadius: 0, borderTop: `3px solid ${PETROLEO}`, padding: "24px 22px calc(20px + env(safe-area-inset-bottom))", margin: "0 auto" }}>
        <h2 id="ventana-titulo" style={{ fontFamily: "'CL Titulos',sans-serif", fontWeight: 700, fontSize: 26, letterSpacing: "-.02em", color: NAVY_DK, margin: "0 0 12px" }}>{titulo}</h2>
        {children}
      </div>
    </div>
  );
}

export function InvitarVentana({ etapasIniciales, onCerrar, onEnviar }) {
  const [f, setF] = useState({ nombre: "", email: "", mensaje: "", etapas: etapasIniciales });
  const [estado, setEstado] = useState({ enviando: false, error: "" });
  const valido = f.nombre.trim() && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email.trim()) && f.etapas.length > 0;
  const toggle = (id) => setF((p) => ({ ...p, etapas: p.etapas.includes(id) ? p.etapas.filter((x) => x !== id) : [...p.etapas, id] }));
  const enviar = async () => {
    if (!valido) return;
    setEstado({ enviando: true, error: "" });
    try {
      await onEnviar({ nombre: f.nombre.trim(), email: f.email.trim(), mensaje: f.mensaje.trim(), etapas: f.etapas });
    } catch (err) {
      setEstado({ enviando: false, error: err.message || "No se pudo enviar la invitación. Intente de nuevo." });
    }
  };
  return (
    <Ventana titulo="Invitar a un colega" onCerrar={onCerrar}>
      <p style={{ fontSize: 15, color: TEXT, lineHeight: 1.55, margin: "0 0 16px" }}>Le llega un mail con un link para responder las etapas que elija. Ve el mismo diagnóstico y sus respuestas se suman al resto.</p>
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <div>
          <label htmlFor="inv-nombre" style={label}>Nombre</label>
          <input id="inv-nombre" autoComplete="off" value={f.nombre} onChange={(ev) => setF({ ...f, nombre: ev.target.value })} placeholder="Ej: Juan Pérez" style={campo} />
        </div>
        <div>
          <label htmlFor="inv-email" style={label}>Correo electrónico</label>
          <input id="inv-email" type="email" inputMode="email" autoComplete="off" value={f.email} onChange={(ev) => setF({ ...f, email: ev.target.value })} placeholder="Ej: juan@universidad.edu" style={campo} />
        </div>
        <fieldset style={{ border: "none", padding: 0, margin: 0 }}>
          <legend style={label}>Etapas que le pide completar</legend>
          <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {ETAPAS_DATA.map((e) => (
              <label key={e.id} style={{ display: "flex", alignItems: "center", gap: 12, minHeight: 44, fontSize: 16, color: NAVY, cursor: "pointer" }}>
                <input type="checkbox" checked={f.etapas.includes(e.id)} onChange={() => toggle(e.id)} style={{ width: 22, height: 22, accentColor: EMERALD_TXT, flexShrink: 0 }} />
                <span>{e.num}. {e.name} <span style={{ color: MUTED, fontSize: 14 }}>· {AREA[e.id]}</span></span>
              </label>
            ))}
          </div>
        </fieldset>
        <div>
          <label htmlFor="inv-mensaje" style={label}>Mensaje (opcional)</label>
          <textarea id="inv-mensaje" rows={2} maxLength={300} value={f.mensaje} onChange={(ev) => setF({ ...f, mensaje: ev.target.value })} placeholder="Ej: ¿Me ayudás con esta parte? Lleva unos minutos." style={{ ...campo, resize: "vertical" }} />
        </div>
      </div>
      {estado.error && <p role="alert" style={{ fontSize: 14, color: "#B3261E", margin: "12px 0 0" }}>{estado.error}</p>}
      <div style={{ display: "flex", gap: 10, marginTop: 18 }}>
        <button type="button" onClick={onCerrar} style={{ ...btnSec, borderColor: LINE }}>Cancelar</button>
        <button type="button" onClick={enviar} disabled={!valido || estado.enviando}
          style={{ ...btnBase, flex: 1, border: "none", fontWeight: 700, ...(valido && !estado.enviando ? BTN_PRIMARY : BTN_DISABLED) }}>
          {estado.enviando ? "Enviando…" : "Enviar invitación"}
        </button>
      </div>
    </Ventana>
  );
}

// Se pide una sola vez por navegador, para registrar quién respondió cada etapa.
export function QuienVentana({ sugerido, onListo, onCerrar }) {
  const [nombre, setNombre] = useState(sugerido || "");
  const ok = nombre.trim().length > 1;
  return (
    <Ventana titulo="¿Quién está respondiendo?" onCerrar={onCerrar}>
      <p style={{ fontSize: 15, color: TEXT, lineHeight: 1.55, margin: "0 0 14px" }}>Así el equipo sabe quién completó cada etapa.</p>
      <label htmlFor="quien-nombre" style={label}>Su nombre</label>
      <input id="quien-nombre" autoComplete="name" value={nombre} onChange={(ev) => setNombre(ev.target.value)}
        onKeyDown={(ev) => ev.key === "Enter" && ok && onListo(nombre.trim())} placeholder="Ej: Juan Pérez" style={campo} />
      <button type="button" onClick={() => ok && onListo(nombre.trim())} disabled={!ok}
        style={{ ...btnBase, width: "100%", marginTop: 16, border: "none", fontWeight: 700, ...(ok ? BTN_PRIMARY : BTN_DISABLED) }}>
        Continuar →
      </button>
    </Ventana>
  );
}

export function Cargando({ texto = "Cargando el diagnóstico…" }) {
  return (
    <div style={{ minHeight: "100vh", background: CREAM, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <p role="status" style={{ fontSize: 16, color: TEXT }}>{texto}</p>
    </div>
  );
}

export function NoEncontrado() {
  return (
    <div style={{ minHeight: "100vh", background: CREAM, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div style={{ maxWidth: 440, textAlign: "center" }}>
        <h1 style={{ fontFamily: "'CL Titulos',serif", fontWeight: 400, fontSize: 28, color: NAVY, margin: "0 0 10px" }}>No encontramos este diagnóstico</h1>
        <p style={{ fontSize: 16, color: TEXT, lineHeight: 1.6, margin: "0 0 20px" }}>Revise que el link esté completo. Si lo copió de un mail, a veces se corta al final.</p>
        <a href="/" style={{ ...btnBase, display: "inline-flex", alignItems: "center", padding: "0 22px", textDecoration: "none", fontWeight: 700, ...BTN_PRIMARY }}>Empezar un diagnóstico nuevo</a>
      </div>
    </div>
  );
}
