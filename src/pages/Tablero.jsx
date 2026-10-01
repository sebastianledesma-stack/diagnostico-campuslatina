// Tablero del diagnóstico colaborativo: las 7 etapas con su estado, quién respondió cada una,
// invitar colegas por etapa y, con las 7 completas, el paso al informe.
import { useState, useEffect, useRef } from "react";
import { NAVY, NAVY_DK, EMERALD, SLATE, CREAM, WHITE, EMERALD_TXT, SLATE_TXT, MUTED, TEXT, LINE, BTN_PRIMARY, BTN_DISABLED, TOUCH } from "../theme.js";
import { ETAPAS_DATA } from "../data/etapas.js";
import { etapaCompleta } from "../lib/api.js";
import { useIsDesktop } from "../lib/useIsDesktop.js";

// A quién suele corresponderle cada etapa dentro de una universidad (sugerencia al invitar).
export const AREA = {
  descubrimiento: "Marketing", exploracion: "Marketing", activacion: "Admisiones", acompanamiento: "Admisiones",
  decision: "Admisiones", inscripcion: "Administración", retencion: "Área académica",
};

const mono = { fontFamily: "'Space Mono',monospace", fontSize: 12, letterSpacing: ".1em", textTransform: "uppercase" };
const btnBase = { minHeight: TOUCH, borderRadius: 10, fontSize: 16, fontFamily: "'DM Sans',sans-serif", cursor: "pointer" };
const btnSec = { ...btnBase, padding: "0 16px", border: `1.5px solid ${NAVY}`, background: WHITE, color: NAVY, fontWeight: 600 };
const btnLink = { ...btnBase, minHeight: 44, padding: "0 4px", border: "none", background: "none", color: EMERALD_TXT, fontWeight: 600, textDecoration: "underline", textUnderlineOffset: 3 };
const campo = { display: "block", width: "100%", minHeight: TOUCH, padding: "11px 14px", border: "1.5px solid #8C8A93", borderRadius: 8, fontSize: 16, fontFamily: "'DM Sans',sans-serif", color: NAVY, background: CREAM };
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

  const barra = (
    <div style={{ position: "sticky", bottom: 0, zIndex: 10, background: "rgba(245,244,240,.96)", backdropFilter: "blur(6px)", WebkitBackdropFilter: "blur(6px)", borderTop: `1px solid ${LINE}` }}>
      <div style={{ maxWidth: desk ? 860 : 620, margin: "0 auto", padding: "10px 16px calc(10px + env(safe-area-inset-bottom))" }}>
        {todas ? (
          <button type="button" onClick={onFinalizar} disabled={finalizando}
            style={{ ...btnBase, width: "100%", minHeight: TOUCH + 4, border: "none", fontWeight: 700, ...(finalizando ? BTN_DISABLED : BTN_PRIMARY) }}>
            {finalizando ? "Generando el informe…" : "Ver el diagnóstico completo →"}
          </button>
        ) : proxima ? (
          <button type="button" onClick={() => onResponder(proxima.num - 1)}
            style={{ ...btnBase, width: "100%", minHeight: TOUCH + 4, border: "none", fontWeight: 700, ...BTN_PRIMARY }}>
            {listas.length ? "Seguir con" : "Empezar por"} la etapa {proxima.num}: {proxima.name} →
          </button>
        ) : (
          <p style={{ margin: 0, textAlign: "center", fontSize: 15, color: TEXT, fontWeight: 500, padding: "8px 0" }}>
            ¡Gracias! Sus etapas ya están guardadas. El informe se genera cuando el equipo complete las 7.
          </p>
        )}
        {errorFinal && <p role="alert" style={{ margin: "8px 0 0", textAlign: "center", fontSize: 14, color: "#B3261E" }}>{errorFinal}</p>}
      </div>
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", background: CREAM, display: "flex", flexDirection: "column" }}>
      <div style={{ background: NAVY_DK, padding: "14px 20px" }}>
        <span style={{ ...mono, color: "rgba(255,255,255,.65)" }}>Diagnóstico del proceso de inscripción</span>
      </div>
      <main style={{ flex: 1, maxWidth: desk ? 860 : 620, margin: "0 auto", padding: desk ? "40px 32px 32px" : "28px 16px 24px", width: "100%" }}>
        <h1 style={{ fontFamily: "'DM Serif Display',serif", fontWeight: 400, fontSize: desk ? 38 : 28, color: NAVY, lineHeight: 1.15, margin: 0 }}>
          {diag.universidad}
        </h1>
        <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "14px 0 6px" }}>
          <div role="progressbar" aria-label="Etapas completas" aria-valuemin={0} aria-valuemax={7} aria-valuenow={listas.length}
            style={{ flex: 1, height: 8, background: LINE, borderRadius: 4 }}>
            <div style={{ height: "100%", width: `${(listas.length / 7) * 100}%`, background: EMERALD, borderRadius: 4, transition: "width .4s" }} />
          </div>
          <span style={{ fontSize: 15, fontWeight: 700, color: NAVY, whiteSpace: "nowrap" }}>{listas.length} de 7 etapas</span>
        </div>
        {aviso && <p role="status" style={{ margin: "10px 0 0", padding: "10px 14px", borderRadius: 10, background: "rgba(0,200,150,.12)", color: NAVY, fontSize: 15, fontWeight: 500 }}>{aviso}</p>}

        <div style={{ background: WHITE, border: `1px solid ${LINE}`, borderRadius: 14, padding: "16px 18px", margin: "16px 0 22px" }}>
          <p style={{ fontSize: 15, color: TEXT, lineHeight: 1.6, margin: 0 }}>
            <strong style={{ color: NAVY }}>Cada etapa se guarda al terminarla.</strong> Puede seguir más tarde desde el link que enviamos a {diag.email}, o pedirle a un colega que complete las etapas que conoce mejor. El informe se genera cuando estén las 7.
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 14 }}>
            <button type="button" onClick={() => onInvitar([])} style={btnSec}>Invitar a un colega</button>
            <button type="button" onClick={onCopiar} style={{ ...btnSec, borderColor: LINE }}>Copiar link</button>
          </div>
        </div>

        <ol style={{ listStyle: "none", padding: 0, margin: 0, display: "grid", gridTemplateColumns: desk ? "1fr 1fr" : "1fr", gap: 12 }}>
          {ETAPAS_DATA.map((e, i) => {
            const lista = etapaCompleta(e, resp);
            const por = diag.etapas_por?.[e.id]?.nombre;
            const invitados = invitadoA(e.id);
            const mia = misEtapas.includes(e.id);
            return (
              <li key={e.id} style={{ background: WHITE, border: `1.5px solid ${lista ? "rgba(0,122,92,.35)" : mia ? EMERALD : LINE}`, borderRadius: 14, padding: "14px 16px", display: "flex", flexDirection: "column", gap: 8 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <span aria-hidden="true" style={{ width: 36, height: 36, borderRadius: "50%", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: lista ? 15 : 18, fontWeight: 700, background: lista ? "rgba(0,200,150,.15)" : CREAM, color: EMERALD_TXT, border: `2px solid ${lista ? "rgba(0,122,92,.45)" : LINE}` }}>
                    {lista ? "✓" : e.emoji}
                  </span>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 17, fontWeight: 700, color: NAVY }}>{e.num}. {e.name}</div>
                    <div style={{ fontSize: 14, color: EMERALD_TXT, fontWeight: 600 }}>{e.pregunta}</div>
                  </div>
                </div>
                <div style={{ fontSize: 14, color: MUTED, lineHeight: 1.5 }}>
                  {lista
                    ? <>Lista{por ? <> · respondida por <strong style={{ color: NAVY }}>{por}</strong></> : null}</>
                    : invitados.length
                      ? <>Pendiente · invitado: <strong style={{ color: NAVY }}>{invitados.join(", ")}</strong></>
                      : <>Pendiente · suele conocerla: {AREA[e.id]}</>}
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginTop: "auto" }}>
                  <button type="button" onClick={() => onResponder(i)} style={btnLink}>{lista ? "Revisar respuestas" : "Responder"}</button>
                  {!lista && <button type="button" onClick={() => onInvitar([e.id])} style={{ ...btnLink, color: SLATE_TXT }}>Invitar a un colega</button>}
                </div>
              </li>
            );
          })}
        </ol>
        {quien && <p style={{ fontSize: 14, color: MUTED, margin: "18px 0 0" }}>Está respondiendo como <strong style={{ color: NAVY }}>{quien}</strong>.</p>}
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
    <div onClick={(ev) => ev.target === ev.currentTarget && onCerrar()} style={{ position: "fixed", inset: 0, zIndex: 200, background: "rgba(14,18,64,.55)", display: "flex", alignItems: "flex-end", justifyContent: "center", padding: 0 }}>
      <div ref={ref} role="dialog" aria-modal="true" aria-labelledby="ventana-titulo"
        style={{ background: WHITE, width: "100%", maxWidth: 560, maxHeight: "92vh", overflowY: "auto", borderRadius: "16px 16px 0 0", padding: "22px 20px calc(20px + env(safe-area-inset-bottom))", margin: "0 auto" }}>
        <h2 id="ventana-titulo" style={{ fontFamily: "'DM Serif Display',serif", fontWeight: 400, fontSize: 24, color: NAVY, margin: "0 0 12px" }}>{titulo}</h2>
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
        <h1 style={{ fontFamily: "'DM Serif Display',serif", fontWeight: 400, fontSize: 28, color: NAVY, margin: "0 0 10px" }}>No encontramos este diagnóstico</h1>
        <p style={{ fontSize: 16, color: TEXT, lineHeight: 1.6, margin: "0 0 20px" }}>Revise que el link esté completo. Si lo copió de un mail, a veces se corta al final.</p>
        <a href="/" style={{ ...btnBase, display: "inline-flex", alignItems: "center", padding: "0 22px", textDecoration: "none", fontWeight: 700, ...BTN_PRIMARY }}>Empezar un diagnóstico nuevo</a>
      </div>
    </div>
  );
}
