// Resultados en el teléfono del asistente: solo el puntaje de la sala y su propia mirada al lado (sin
// saber quién es quién en el resto). El detalle se mira en la pantalla grande del salón, para que el
// teléfono no distraiga; al final, además, el pedido del PDF.
import { useState } from "react";
import { ETAPAS_DATA } from "../datos.js";
import { getNivel, fmt1 } from "../../lib/scoring.js";
import { puntajeEtapa, conRespuestas, diagnostico, miMirada } from "../sala.js";
import { Logo, Red, Escalon } from "../componentes.jsx";
import { mensaje } from "../api.js";

function Hoja({ nombre, sinRed, children }) {
  return (
    <main className="t-pagina" style={{ padding: 0 }}>
      <div className="t-celu">
        <div className="t-barra">
          <p className="t-etiqueta">{nombre}</p>
          {sinRed && <Red enLinea={false} />}
        </div>
        {children}
        <div style={{ marginTop: 40, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
          <Logo alto={22} />
          <p style={{ fontSize: 13, color: "var(--apagado)" }}>Se actualiza solo</p>
        </div>
      </div>
    </main>
  );
}

// Su mirada en grande (lo propio es lo que más importa en el teléfono) y, al lado, el puntaje de la
// sala. Si no respondió, solo la sala.
function Puntaje({ valor, detalle, yo, salaYo = valor, nota }) {
  const nivelSala = getNivel(valor).label;
  if (yo == null) {
    return (
      <div className="t-tarjeta t-sube" style={{ marginTop: 20, padding: 20 }}>
        <p className="t-etiqueta">La sala</p>
        <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginTop: 4 }}>
          <span style={{ fontSize: 64, fontWeight: 700, lineHeight: 1, color: "var(--petroleo)", letterSpacing: "-.02em" }}>{fmt1(valor)}</span>
          <span style={{ fontSize: 18, color: "var(--apagado)" }}>de 5 · <strong style={{ color: "var(--profundo)" }}>{nivelSala}</strong></span>
        </div>
        <div style={{ marginTop: 16 }}><Escalon nivel={nivelSala} /></div>
        <p className="t-ayuda" style={{ marginTop: 12 }}>{detalle}</p>
      </div>
    );
  }
  const nivel = getNivel(yo).label;
  return (
    <div className="t-tarjeta t-sube" style={{ marginTop: 20, padding: 20, borderColor: "var(--petroleo)", borderWidth: 2 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: 16 }}>
        <div>
          <p className="t-etiqueta" style={{ color: "var(--petroleo)" }}>Su mirada</p>
          <p style={{ lineHeight: 1, marginTop: 4 }}>
            <span style={{ fontSize: 76, fontWeight: 700, color: "var(--petroleo)", letterSpacing: "-.03em" }}>{fmt1(yo)}</span>
            <span style={{ fontSize: 18, color: "var(--apagado)" }}> de 5</span>
          </p>
          <p style={{ fontSize: 17, fontWeight: 700, color: "var(--profundo)", marginTop: 4 }}>{nivel}</p>
        </div>
        <div style={{ textAlign: "right", paddingBottom: 4 }}>
          <p className="t-etiqueta">La sala</p>
          <p style={{ fontSize: 34, fontWeight: 700, lineHeight: 1.1, color: "var(--profundo)", marginTop: 4 }}>{fmt1(valor)}</p>
          <p style={{ fontSize: 14, color: "var(--apagado)" }}>{nivelSala}</p>
        </div>
      </div>
      <div style={{ marginTop: 16 }}><Escalon nivel={nivel} /></div>
      <p style={{ marginTop: 14, fontSize: 16, fontWeight: 600, color: "var(--profundo)" }}>{capital(comparar(yo, salaYo))}.</p>
      <p className="t-ayuda" style={{ marginTop: 4 }}>{detalle}{nota ? ` ${nota}` : ""}</p>
    </div>
  );
}

const capital = (t) => t.charAt(0).toUpperCase() + t.slice(1);
const comparar = (yo, sala) => {
  const dif = yo - sala;
  if (Math.abs(dif) < 0.05) return "igual que la sala";
  return `${fmt1(Math.abs(dif))} ${dif > 0 ? "por encima" : "por debajo"} de la sala`;
};

const MireLaPantalla = () => <p className="t-ayuda" style={{ marginTop: 16, textAlign: "center" }}>El detalle, en la pantalla del salón.</p>;

export function ResultadosEtapa({ res, etapa, mias, nombre, sinRed }) {
  const e = ETAPAS_DATA[etapa - 1];
  const filas = res.participantes;
  const valor = puntajeEtapa(filas, e.id);
  const n = conRespuestas(filas, e.id).length;
  const yo = miMirada(mias, filas).etapas[etapa - 1].yo;
  return (
    <Hoja nombre={nombre} sinRed={sinRed}>
      <p className="t-etiqueta" style={{ marginTop: 24 }}>Etapa {e.num} de 7 · Resultados</p>
      <h1 style={{ fontSize: 30, lineHeight: 1.15, color: "var(--profundo)", marginTop: 6 }}>{e.name}</h1>
      <p className="t-cursiva" style={{ fontSize: 20, color: "var(--petroleo)", marginTop: 2 }}>{e.pregunta}</p>

      {valor == null
        ? <p style={{ marginTop: 20 }}>Nadie respondió esta etapa.</p>
        : <Puntaje valor={valor} yo={yo} detalle={`Promedio de ${n} ${n === 1 ? "persona" : "personas"}.`} />}
      <MireLaPantalla />
    </Hoja>
  );
}

// ── Cierre ───────────────────────────────────────────────────────

export function DiagnosticoSala({ res, mias, nombre, sinRed, email, enviado, pedirInforme }) {
  const filas = res.participantes;
  const dx = diagnostico(filas, res.elegidas);
  const mia = miMirada(mias, filas);
  const n = filas.filter((f) => Object.keys(f.r).length).length;
  // Si llegó tarde, su mirada se compara solo en las etapas que respondió.
  const nota = mia.yo != null && mia.respondidas < 7
    ? `Comparada en ${mia.respondidas === 1 ? "la etapa que respondió" : `las ${mia.respondidas} etapas que respondió`}.`
    : null;
  return (
    <Hoja nombre={nombre} sinRed={sinRed}>
      <p className="t-etiqueta" style={{ marginTop: 24 }}>Diagnóstico colectivo · Resultado final</p>
      <h1 style={{ fontSize: 30, lineHeight: 1.15, color: "var(--profundo)", marginTop: 6 }}>
        El viaje <span className="t-cursiva" style={{ color: "var(--petroleo)" }}>invisible</span> del aspirante
      </h1>

      {dx.global != null && (
        <Puntaje valor={dx.global} yo={mia.yo} salaYo={mia.sala ?? dx.global} nota={nota}
          detalle={`${dx.respondidas === 7 ? "Promedio de las 7 etapas" : `Promedio de ${dx.respondidas} de las 7 etapas`} · ${n} ${n === 1 ? "persona" : "personas"}.`} />
      )}
      <PedirInforme email={email} enviado={enviado} pedirInforme={pedirInforme} />
    </Hoja>
  );
}

// Pedido del PDF por email: le llega su mirada y la de la sala. Una vez enviado, el formulario se
// esconde (para no confundir) y queda solo una aclaración chica por si se equivocó de email.
function PedirInforme({ email: inicial, enviado: yaEnviado, pedirInforme }) {
  const [email, setEmail] = useState(inicial || "");
  const [enviadoA, setEnviadoA] = useState(yaEnviado || "");
  const [corregir, setCorregir] = useState(false);
  const [error, setError] = useState("");
  const [enviando, setEnviando] = useState(false);
  async function enviar(ev) {
    ev.preventDefault();
    setEnviando(true);
    setError("");
    try {
      await pedirInforme(email.trim());
      setEnviadoA(email.trim());
      setCorregir(false);
    } catch (err) {
      setError(mensaje(err));
    }
    setEnviando(false);
  }
  if (enviadoA && !corregir) {
    return (
      <div className="t-tarjeta" role="status" style={{ marginTop: 20, padding: 18, background: "#E1EFF0", borderColor: "var(--petroleo)" }}>
        <h2 style={{ fontSize: 19, color: "var(--profundo)" }}>Le enviamos el informe en PDF</h2>
        <p style={{ fontSize: 15, marginTop: 6, color: "var(--texto)", wordBreak: "break-word" }}>A <strong>{enviadoA}</strong>. Puede tardar unos minutos; si no lo ve, revise la carpeta de spam.</p>
        <p style={{ fontSize: 13, color: "var(--apagado)", marginTop: 10 }}>
          ¿El email tiene un error? <button type="button" onClick={() => setCorregir(true)}
            style={{ background: "none", border: 0, padding: 0, font: "inherit", color: "var(--petroleo)", textDecoration: "underline", cursor: "pointer" }}>Corregirlo</button>
        </p>
      </div>
    );
  }
  return (
    <form className="t-tarjeta" onSubmit={enviar} style={{ marginTop: 20, padding: 18, background: "#E1EFF0", borderColor: "var(--petroleo)" }}>
      <h2 style={{ fontSize: 19, color: "var(--profundo)" }}>{corregir ? "Enviarlo a otro email" : "Reciba el informe en PDF"}</h2>
      <p className="t-ayuda" style={{ marginTop: 4 }}>Con su mirada y la de la sala. No mostramos su email en pantalla.</p>
      <label className="t-label" htmlFor="email" style={{ marginTop: 12 }}>Email</label>
      <input id="email" className="t-campo" type="email" inputMode="email" autoComplete="email" required value={email}
        onChange={(ev) => setEmail(ev.target.value)} placeholder="nombre@universidad.edu" />
      <button className="t-boton" type="submit" disabled={enviando || !email.trim()} style={{ width: "100%", marginTop: 12 }}>
        {enviando ? "Enviando…" : "Enviarme el PDF"}
      </button>
      {error && <p role="alert" style={{ marginTop: 10, fontSize: 15, fontWeight: 500, color: "var(--error)" }}>{error}</p>}
    </form>
  );
}
