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

// El puntaje de la sala y, debajo, la mirada propia comparada con la de la sala en lo mismo que respondió.
function Puntaje({ valor, detalle, yo, salaYo = valor, nota }) {
  const nivel = getNivel(valor).label;
  return (
    <div className="t-tarjeta t-sube" style={{ marginTop: 20, padding: 20 }}>
      <p className="t-etiqueta">La sala</p>
      <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginTop: 4 }}>
        <span style={{ fontSize: 64, fontWeight: 700, lineHeight: 1, color: "var(--petroleo)", letterSpacing: "-.02em" }}>{fmt1(valor)}</span>
        <span style={{ fontSize: 18, color: "var(--apagado)" }}>de 5 · <strong style={{ color: "var(--profundo)" }}>{nivel}</strong></span>
      </div>
      <div style={{ marginTop: 16 }}><Escalon nivel={nivel} /></div>
      <p className="t-ayuda" style={{ marginTop: 12 }}>{detalle}</p>
      {yo != null && (
        <p style={{ marginTop: 14, paddingTop: 12, borderTop: "1px solid var(--linea)", fontSize: 16 }}>
          Su mirada: <strong style={{ fontSize: 22, color: "var(--profundo)" }}>{fmt1(yo)}</strong>
          <span style={{ color: "var(--apagado)" }}> · {comparar(yo, salaYo)}</span>
          {nota && <span className="t-ayuda" style={{ display: "block", marginTop: 4 }}>{nota}</span>}
        </p>
      )}
    </div>
  );
}

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

export function DiagnosticoSala({ res, mias, nombre, sinRed, email, pedirInforme }) {
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
      <PedirInforme email={email} pedirInforme={pedirInforme} />
    </Hoja>
  );
}

// Pedido del PDF por email: le llega su mirada y la de la sala.
function PedirInforme({ email: inicial, pedirInforme }) {
  const [email, setEmail] = useState(inicial || "");
  const [estado, setEstado] = useState(null); // { ok, texto }
  const [enviando, setEnviando] = useState(false);
  async function enviar(ev) {
    ev.preventDefault();
    setEnviando(true);
    setEstado(null);
    try {
      await pedirInforme(email.trim());
      setEstado({ ok: true, texto: `Listo. Le enviamos el informe a ${email.trim()}.` });
    } catch (err) {
      setEstado({ ok: false, texto: mensaje(err) });
    }
    setEnviando(false);
  }
  return (
    <form className="t-tarjeta" onSubmit={enviar} style={{ marginTop: 20, padding: 18, background: "#E1EFF0", borderColor: "var(--petroleo)" }}>
      <h2 style={{ fontSize: 19, color: "var(--profundo)" }}>Reciba el informe en PDF</h2>
      <p className="t-ayuda" style={{ marginTop: 4 }}>Con su mirada y la de la sala. No mostramos su email en pantalla.</p>
      <label className="t-label" htmlFor="email" style={{ marginTop: 12 }}>Email</label>
      <input id="email" className="t-campo" type="email" inputMode="email" autoComplete="email" required value={email}
        onChange={(ev) => setEmail(ev.target.value)} placeholder="nombre@universidad.edu" />
      <button className="t-boton" type="submit" disabled={enviando || !email.trim()} style={{ width: "100%", marginTop: 12 }}>
        {enviando ? "Enviando…" : "Enviarme el PDF"}
      </button>
      {estado && <p role="status" style={{ marginTop: 10, fontSize: 15, fontWeight: 500, color: estado.ok ? "var(--petroleo)" : "var(--error)" }}>{estado.texto}</p>}
    </form>
  );
}
