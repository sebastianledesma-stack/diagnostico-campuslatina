// /s/<código> — Frontend del asistente (teléfono, sin login ni datos previos).
// Escanea el QR → responde la etapa abierta, una pregunta por pantalla → "Listo" → resultados de la
// sala cuando los expositores los muestran → resultado final con su mirada y el PDF por email.
// Oscuro cuando hay que mirar la pantalla del salón; claro cuando hay que responder o leer.
import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import * as api from "../api.js";
import { useParticipante } from "../useParticipante.js";
import { Logo, Red, SinSesion } from "../componentes.jsx";
import { ResultadosEtapa, DiagnosticoSala } from "../vistas/ResultadosCelular.jsx";
import { CONSIGNA, CONSIGNA_TITULO, ETAPAS_DATA } from "../datos.js";

export default function Participante({ codigo: fijo }) {
  const params = useParams();
  const codigo = (fijo || params.codigo).toUpperCase();
  const p = useParticipante(codigo);
  const est = p.est;

  // Aviso táctil cuando se abre una etapa (el teléfono suele estar sobre la mesa).
  const fasePrevia = useRef(null);
  useEffect(() => {
    const clave = est && `${est.fase}-${est.etapa}`;
    // El navegador solo deja vibrar si la persona ya tocó la página.
    if (est?.fase === "abierta" && fasePrevia.current && fasePrevia.current !== clave && navigator.userActivation?.hasBeenActive) navigator.vibrate?.(80);
    fasePrevia.current = clave;
  }, [est?.fase, est?.etapa]);

  if (p.error?.codigo === "sesion_no_encontrada") return <SinSesion codigo={codigo} />;
  if (p.error) return <Oscura nombre=""><Titulo>{api.mensaje(p.error)}</Titulo></Oscura>;
  if (!est) return <Oscura nombre="" sinRed={p.sinRed}><p style={{ color: "var(--pizarra)" }}>Conectando…</p></Oscura>;

  const { fase, etapa } = est;
  if (fase === "abierta") {
    return <Etapa key={etapa} est={est} respuestas={p.respuestas} responder={p.responder} pendientes={p.pendientes} sinRed={p.sinRed} />;
  }
  if (fase === "resultados" || fase === "cierre") {
    const listo = p.res && (fase === "cierre" ? p.res.reveladas.length === 7 : p.res.reveladas.includes(etapa));
    if (!listo) return <Oscura nombre={est.nombre} sinRed={p.sinRed}><Titulo>Mire la pantalla</Titulo></Oscura>;
    return fase === "cierre"
      ? <DiagnosticoSala res={p.res} mias={p.respuestas} nombre={est.nombre} sinRed={p.sinRed} email={p.email} enviado={p.enviado} pedirInforme={p.pedirInforme} />
      : <ResultadosEtapa res={p.res} etapa={etapa} mias={p.respuestas} nombre={est.nombre} sinRed={p.sinRed} />;
  }
  return <Espera est={est} sinRed={p.sinRed} />;
}

// ── Pantallas oscuras

function Oscura({ nombre, sinRed = false, children }) {
  return (
    <main className="t-oscura t-oscuro">
      <div className="t-celu">
        <div className="t-barra">
          <p className="t-etiqueta">{nombre}</p>
          {sinRed && <Red enLinea={false} />}
        </div>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", padding: "32px 0" }}>{children}</div>
        <div style={{ opacity: 0.75 }}><Logo oscuro alto={24} /></div>
      </div>
    </main>
  );
}

const Titulo = ({ children }) => <h1 className="t-sube" style={{ fontSize: 30, lineHeight: 1.2, fontWeight: 700 }}>{children}</h1>;

function Consigna() {
  return (
    <div className="t-sube" style={{ "--i": 2, marginTop: 32, padding: 20, borderRadius: 14, background: "rgba(127,214,222,.1)", border: "1px solid rgba(127,214,222,.3)" }}>
      <p className="t-etiqueta" style={{ color: "var(--agua)" }}>Cómo responder</p>
      <p style={{ fontSize: 19, lineHeight: 1.45, marginTop: 8 }}><strong>{CONSIGNA_TITULO}</strong> {CONSIGNA}</p>
    </div>
  );
}

function Espera({ est, sinRed }) {
  const proxima = est.etapa + 1;
  return (
    <Oscura nombre={est.nombre} sinRed={sinRed}>
      <p className="t-etiqueta" style={{ color: "var(--agua)" }}>Diagnóstico colectivo</p>
      <Titulo>{proxima <= 7 ? `Enseguida se abre la etapa ${proxima}` : "Enseguida vemos el resultado final"}</Titulo>
      {proxima <= 7 && <p className="t-sube" style={{ "--i": 1, color: "var(--pizarra)", fontSize: 17, marginTop: 12 }}>{ETAPAS_DATA[proxima - 1].name}: {ETAPAS_DATA[proxima - 1].pregunta}</p>}
      <Consigna />
      <p style={{ color: "var(--pizarra)", fontSize: 15, marginTop: 24 }}>Puede dejar el teléfono sobre la mesa: cuando se abra la etapa, las preguntas aparecen acá.</p>
    </Oscura>
  );
}

// ── Etapa abierta: una pregunta por pantalla, con barra de progreso.

function Etapa({ est, respuestas, responder, pendientes, sinRed }) {
  const e = ETAPAS_DATA[est.etapa - 1];
  const claveDe = (q) => `${e.id}_${q}`;
  const primera = e.preguntas.findIndex((_, q) => !respuestas[claveDe(q)]);
  // La primera vez que se abre la etapa 1, antes de la primera pregunta, la consigna.
  const [paso, setPaso] = useState(primera === -1 ? 4 : e.num === 1 && primera === 0 ? -1 : primera); // -1 consigna · 4 listo
  const [avanzando, setAvanzando] = useState(false);
  useEffect(() => { window.scrollTo(0, 0); }, [paso]);

  if (paso === -1) {
    return (
      <Oscura nombre={est.nombre} sinRed={sinRed}>
        <p className="t-etiqueta" style={{ color: "var(--agua)" }}>Etapa 1 de 7 · {e.name}</p>
        <Titulo>Antes de empezar</Titulo>
        <Consigna />
        <button className="t-boton" style={{ marginTop: 28, background: "var(--agua)", color: "var(--noche)" }} onClick={() => setPaso(0)}>Empezar</button>
      </Oscura>
    );
  }

  if (paso === 4) {
    return (
      <Oscura nombre={est.nombre} sinRed={sinRed}>
        <div className="t-sube" aria-hidden="true" style={{ width: 56, height: 56, borderRadius: "50%", background: "var(--agua)", display: "grid", placeItems: "center", marginBottom: 20 }}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--noche)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>
        </div>
        <Titulo>Listo. Los resultados se verán en la pantalla.</Titulo>
        <p className="t-sube" style={{ "--i": 1, color: "var(--pizarra)", fontSize: 17, marginTop: 14 }}>
          {pendientes > 0
            ? sinRed ? "Sin conexión: sus respuestas se envían solas cuando vuelva la señal." : "Guardando sus respuestas…"
            : "Sus respuestas ya están guardadas."}
        </p>
      </Oscura>
    );
  }

  const pregunta = e.preguntas[paso];
  const elegida = respuestas[claveDe(paso)];
  function elegir(letra) {
    if (avanzando) return;
    responder(claveDe(paso), letra);
    setAvanzando(true);
    // Breve pausa para que se vea la opción marcada antes de pasar a la siguiente.
    setTimeout(() => { setAvanzando(false); setPaso(paso + 1); }, 320);
  }
  return (
    <main className="t-pagina" style={{ padding: 0 }}>
      <div className="t-celu">
        <div className="t-barra">
          <p className="t-etiqueta">Etapa {e.num} · {e.name}</p>
          {sinRed ? <Red enLinea={false} /> : <p className="t-etiqueta">{paso + 1} de 4</p>}
        </div>
        <div className="t-progreso" aria-hidden="true">
          {e.preguntas.map((_, q) => <span key={q} data-hecho={q !== paso && respuestas[claveDe(q)] ? "" : undefined} data-actual={q === paso ? "" : undefined} />)}
        </div>
        <span className="t-chip">Su universidad</span>
        <h1 id="pregunta" className="t-sube" key={paso} style={{ fontSize: 23, lineHeight: 1.25, color: "var(--profundo)", marginTop: 14 }}>{pregunta.texto}</h1>
        {pregunta.ayuda && <p style={{ fontSize: 16, color: "var(--apagado)", marginTop: 6 }}>{pregunta.ayuda}</p>}
        <div role="group" aria-labelledby="pregunta" style={{ marginTop: 20 }}>
          {pregunta.opciones.map((o) => (
            <button key={o.letra} type="button" className="t-opcion" aria-pressed={elegida === o.letra} onClick={() => elegir(o.letra)}>
              <span className="t-letra">{o.letra}</span>
              <span><strong>{o.etiqueta}</strong><small>{o.texto}</small></span>
            </button>
          ))}
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 16 }}>
          {paso > 0 ? <button className="t-link" onClick={() => setPaso(paso - 1)}>Atrás</button> : <span />}
          {elegida && <button className="t-link" onClick={() => setPaso(paso + 1)}>Siguiente</button>}
        </div>
      </div>
    </main>
  );
}
