// Resultados en el teléfono del asistente: lo mismo que se proyecta, para leer de cerca, más su
// propia mirada al lado de la de la sala (sin saber quién es quién en el resto).
import { useState } from "react";
import { ETAPAS_DATA } from "../datos.js";
import { getNivel, fmt1 } from "../../lib/scoring.js";
import { puntajeEtapa, conRespuestas, distribucion, ideasEtapa, puntajeConIdeas, diagnostico, miMirada, estadisticas } from "../sala.js";
import { Logo, Red, Escalon } from "../componentes.jsx";
import { mensaje } from "../api.js";
import { MapaCalor, Leyenda } from "./MapaCalor.jsx";

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

const Seccion = ({ children, ayuda }) => (
  <>
    <h2 style={{ fontSize: 20, color: "var(--profundo)", marginTop: 32 }}>{children}</h2>
    {ayuda && <p className="t-ayuda" style={{ marginTop: 4 }}>{ayuda}</p>}
  </>
);

function Puntaje({ valor, detalle, yo }) {
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
          <span style={{ color: "var(--apagado)" }}> · {comparar(yo, valor)}</span>
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
const textoSube = (s) => (s >= 0.05 ? `+${fmt1(s)}` : "+0.0");

// Ideas para subir de una etapa: las del diagnóstico, con las que eligió la sala marcadas.
function Ideas({ filas, e, elegidas }) {
  const ideas = ideasEtapa(filas, e.id);
  const claves = elegidas[e.id] || [];
  const hoy = puntajeEtapa(filas, e.id);
  const con = claves.length ? puntajeConIdeas(filas, e.id, claves) : null;
  if (!ideas.length) return <p style={{ marginTop: 12 }}>La sala ya está en el nivel más alto en todas las preguntas de esta etapa.</p>;
  return (
    <>
      {con != null && con > hoy && (
        <p className="t-tarjeta" style={{ marginTop: 12, padding: "14px 18px", fontSize: 16 }}>
          Con las ideas que eligió la sala: <strong>{fmt1(hoy)}</strong> → <strong style={{ color: "var(--coral)", fontSize: 22 }}>{fmt1(con)}</strong>
        </p>
      )}
      {ideas.map((i) => {
        const elegida = claves.includes(i.clave);
        return (
          <section key={i.clave} className="t-tarjeta" style={{ marginTop: 12, padding: 18, borderColor: elegida ? "var(--petroleo)" : undefined, borderWidth: elegida ? 2 : 1 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 12 }}>
              <span style={{ fontSize: 26, fontWeight: 700, color: "var(--coral)", lineHeight: 1.1 }}>{textoSube(i.sube)}</span>
              {elegida && <span className="t-chip">Elegida por la sala</span>}
            </div>
            <p style={{ fontSize: 16, color: "var(--profundo)", marginTop: 8, lineHeight: 1.45 }}>{i.texto}</p>
            <p className="t-ayuda">{i.tipo === "nivel" ? `${i.detalle} · ${i.pregunta}` : i.detalle}</p>
          </section>
        );
      })}
    </>
  );
}

const MAPA_ETAPA = { ancho: 320, filaAlto: 9, celdaGap: 3, bloqueGap: 3, filaGap: 1, cabeceraAlto: 34, cabeceraDoble: true, pieAlto: 26, letra: 11, marco: 2 };

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

      <Seccion ayuda={yo != null ? "Su respuesta va marcada." : null}>Qué respondió la sala</Seccion>
      {e.preguntas.map((p, q) => {
        const d = distribucion(filas, e.id, q);
        const mia = mias[`${e.id}_${q}`];
        return (
          <section key={q} className="t-tarjeta" style={{ marginTop: 12, padding: 18 }}>
            <h3 style={{ fontSize: 16, lineHeight: 1.35, color: "var(--profundo)" }}>{q + 1}. {p.texto}</h3>
            <div style={{ marginTop: 12 }}>
              {d.opciones.map((o, i) => (
                <div key={o.letra} className="t-dist-fila" data-mayoria={o.mayoria ? "" : undefined}>
                  <div className="t-dist-texto">
                    <span><b>{o.letra}</b> · {o.etiqueta}{mia === o.letra && <span className="t-chip" style={{ marginLeft: 8, padding: "1px 8px", fontSize: 12 }}>Usted</span>}</span>
                    <b>{Math.round(o.pct * 100)}%</b>
                  </div>
                  <div className="t-dist-pista"><span style={{ width: `${o.pct * 100}%`, animationDelay: `${i * 60}ms` }} /></div>
                </div>
              ))}
            </div>
          </section>
        );
      })}

      <Seccion ayuda="Cada fila es una persona; cada columna, una pregunta. Más intenso, más desarrollado.">Mapa de calor</Seccion>
      <div className="t-tarjeta" style={{ marginTop: 12, padding: 12 }}>
        <MapaCalor filas={filas} etapa={e.id} tema="claro" m={MAPA_ETAPA} titulo={`Mapa de calor de ${e.name}`} />
        <div style={{ marginTop: 10 }}><Leyenda tema="claro" letra={13} gap={12} fuga={false} /></div>
      </div>

      <Seccion ayuda="Cuánto subiría el puntaje de la sala con cada idea, como en el diagnóstico.">Ideas para subir</Seccion>
      <Ideas filas={filas} e={e} elegidas={res.elegidas} />
    </Hoja>
  );
}

// ── Cierre ───────────────────────────────────────────────────────

// Dónde queda la mirada propia entre la de todos: un punto por persona (anónimo), el propio resaltado
// y una línea en el promedio de la sala. Escala de 1 a 5.
function Ubicacion({ yo, sala, todos, alto = 34 }) {
  const x = (v) => 8 + ((v - 1) / 4) * 304;
  return (
    <svg viewBox={`0 0 320 ${alto}`} width="100%" role="img" aria-label={`Su mirada ${fmt1(yo)}, la sala ${fmt1(sala)}`} style={{ display: "block" }}>
      <line x1={x(1)} x2={x(5)} y1={alto / 2} y2={alto / 2} stroke="#D5E3E5" strokeWidth="2" />
      {todos.map((v, i) => <circle key={i} cx={x(v)} cy={alto / 2} r="4" fill="#A8CDD1" opacity=".7" />)}
      {sala != null && <line x1={x(sala)} x2={x(sala)} y1={3} y2={alto - 3} stroke="#123A42" strokeWidth="2" />}
      {yo != null && <circle cx={x(yo)} cy={alto / 2} r="7" fill="#0B6470" stroke="#fff" strokeWidth="2" />}
    </svg>
  );
}

const MAPA_CELU = {
  etapas: { ancho: 320, filaAlto: 8, celdaGap: 3, bloqueGap: 3, filaGap: 1, cabeceraAlto: 20, pieAlto: 28, letra: 11, marco: 2 },
  preguntas: { ancho: 320, filaAlto: 7, celdaGap: 1, bloqueGap: 5, filaGap: 1, cabeceraAlto: 20, pieAlto: 18, letra: 11, marco: 1.5 },
};

export function DiagnosticoSala({ res, mias, nombre, sinRed, email, pedirInforme }) {
  const [porEtapa, setPorEtapa] = useState(true);
  const filas = res.participantes;
  const dx = diagnostico(filas, res.elegidas);
  const mia = miMirada(mias, filas);
  const est = estadisticas(filas);
  const hayIdeas = dx.etapas.some((e) => e.eligieron > 0) && dx.globalConIdeas > dx.global;
  return (
    <Hoja nombre={nombre} sinRed={sinRed}>
      <p className="t-etiqueta" style={{ marginTop: 24 }}>Diagnóstico colectivo · Resultado final</p>
      <h1 style={{ fontSize: 30, lineHeight: 1.15, color: "var(--profundo)", marginTop: 6 }}>
        El viaje <span className="t-cursiva" style={{ color: "var(--petroleo)" }}>invisible</span> del aspirante
      </h1>

      <PedirInforme email={email} pedirInforme={pedirInforme} />

      {mia.yo != null && (
        <>
          <Seccion ayuda={`Cada punto es una persona de la sala; el suyo, resaltado. La línea es el promedio.${mia.respondidas < 7 ? ` Se compara solo en ${mia.respondidas === 1 ? "la etapa que respondió" : `las ${mia.respondidas} etapas que respondió`}.` : ""}`}>Su mirada y la de la sala</Seccion>
          <div className="t-tarjeta" style={{ marginTop: 12, padding: 18 }}>
            <div style={{ display: "flex", gap: 28, alignItems: "baseline" }}>
              <p><span className="t-etiqueta" style={{ display: "block" }}>Usted</span><strong style={{ fontSize: 40, color: "var(--petroleo)" }}>{fmt1(mia.yo)}</strong></p>
              <p><span className="t-etiqueta" style={{ display: "block" }}>La sala</span><strong style={{ fontSize: 40, color: "var(--profundo)" }}>{fmt1(mia.sala)}</strong></p>
            </div>
            <div style={{ marginTop: 8 }}><Ubicacion yo={mia.yo} sala={mia.sala} todos={mia.todos} /></div>
            {mia.ubicacion != null && (
              <p style={{ fontSize: 15, marginTop: 8 }}>Usted ve la universidad más desarrollada que {Math.round(mia.ubicacion * 10)} de cada 10 personas de la sala.</p>
            )}
            {mia.etapas.filter((x) => x.yo != null).map((x) => (
              <div key={x.id} style={{ marginTop: 14 }}>
                <div className="t-dist-texto">
                  <span style={{ fontWeight: 600, color: "var(--profundo)" }}>{x.num}. {x.name}</span>
                  <span style={{ fontSize: 14 }}><b style={{ color: "var(--petroleo)" }}>{fmt1(x.yo)}</b> · sala {fmt1(x.sala)}</span>
                </div>
                <Ubicacion yo={x.yo} sala={x.sala} todos={x.todos} alto={26} />
              </div>
            ))}
          </div>
        </>
      )}

      <Seccion>La sala</Seccion>
      {dx.global != null && (
        <Puntaje valor={dx.global} detalle={`${dx.respondidas === 7 ? "Promedio de las 7 etapas" : `Promedio de ${dx.respondidas} de las 7 etapas`} · ${est.participantes} personas.`} />
      )}
      {hayIdeas && (
        <p style={{ marginTop: 14, fontSize: 17 }}>
          Con las ideas que eligió la sala: <strong style={{ color: "var(--coral)", fontSize: 22 }}>{fmt1(dx.globalConIdeas)}</strong>
        </p>
      )}
      <div className="t-tarjeta" style={{ marginTop: 12, padding: 18 }}>
        {dx.etapas.map((e, i) => {
          const esFuga = dx.fuga?.id === e.id;
          return (
            <div key={e.id} style={{ marginTop: i ? 16 : 0 }}>
              <div className="t-dist-texto">
                <span style={{ fontWeight: esFuga ? 700 : 500, color: "var(--profundo)" }}>{e.num}. {e.name}</span>
                <b>{e.puntaje == null ? "—" : fmt1(e.puntaje)}{hayIdeas && e.conIdeas > e.puntaje ? ` → ${fmt1(e.conIdeas)}` : ""}</b>
              </div>
              <div className="t-dist-pista" style={{ height: 12, position: "relative" }}>
                {hayIdeas && e.conIdeas > e.puntaje && (
                  <span style={{ position: "absolute", inset: 0, width: `${(e.conIdeas / 5) * 100}%`, background: "var(--coral-suave)" }} />
                )}
                <span style={{ position: "relative", width: `${((e.puntaje || 0) / 5) * 100}%`, background: esFuga ? "var(--profundo)" : "#6FA7AE", animationDelay: `${i * 70}ms` }} />
              </div>
              {esFuga && <p style={{ fontSize: 14, fontWeight: 600, color: "var(--profundo)", marginTop: 4 }}>Acá se pierden más aspirantes</p>}
            </div>
          );
        })}
        {hayIdeas && <p className="t-ayuda" style={{ marginTop: 16 }}>En coral claro, hasta dónde llegaría cada etapa con las ideas elegidas.</p>}
      </div>

      <Seccion ayuda="Cada fila es una persona. Más intenso, más desarrollado. El recuadro marca la etapa más baja.">Mapa de calor</Seccion>
      <div className="t-segmentos" role="group" aria-label="Columnas del mapa" style={{ marginTop: 12 }}>
        <button aria-pressed={porEtapa} onClick={() => setPorEtapa(true)}>Por etapa</button>
        <button aria-pressed={!porEtapa} onClick={() => setPorEtapa(false)}>Por pregunta</button>
      </div>
      <div className="t-tarjeta" style={{ marginTop: 12, padding: 12 }}>
        <MapaCalor filas={filas} porEtapa={porEtapa} tema="claro" m={MAPA_CELU[porEtapa ? "etapas" : "preguntas"]} />
        <p style={{ fontSize: 12, color: "var(--apagado)", marginTop: 10, lineHeight: 1.5 }}>{ETAPAS_DATA.map((e) => `${e.num}. ${e.name}`).join(" · ")}</p>
        <div style={{ marginTop: 10 }}><Leyenda tema="claro" letra={13} gap={12} /></div>
      </div>

      <Seccion>Dónde hubo más acuerdo y más desacuerdo</Seccion>
      <Lista titulo="Más acuerdo" items={est.acuerdo} detalle={(x) => `promedio ${fmt1(x.promedio)}`} />
      <Lista titulo="Más desacuerdo" items={est.desacuerdo} detalle={(x) => `promedio ${fmt1(x.promedio)}`} />
    </Hoja>
  );
}

function Lista({ titulo, items, detalle }) {
  return (
    <div className="t-tarjeta" style={{ marginTop: 12, padding: 18 }}>
      <p className="t-etiqueta">{titulo}</p>
      <ol style={{ margin: "8px 0 0", paddingLeft: 20, fontSize: 15, lineHeight: 1.45 }}>
        {items.map((x) => <li key={`${x.etapa.id}-${x.q}`} style={{ marginTop: 6 }}>{x.texto} <span style={{ color: "var(--apagado)" }}>({x.etapa.name}, {detalle(x)})</span></li>)}
      </ol>
    </div>
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
