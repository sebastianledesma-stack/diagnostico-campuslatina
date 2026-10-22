// Piezas compartidas por las tres vistas del taller.
import { useEffect, useState } from "react";
import * as api from "./api.js";
import { EVENTO } from "./datos.js";

// Marca discreta: el logo figura solo como fuente de la herramienta.
export function Logo({ oscuro = false, alto = 28 }) {
  return <img src={oscuro ? "/campus-latina-sobre-oscuro.svg" : "/campus-latina.svg"} alt="Campus Latina" height={alto} style={{ display: "block", height: alto, width: "auto" }} />;
}

// Nivel del puntaje como escalón de 4 tramos (sin colores de semáforo).
const NIVELES = ["Inicial", "En desarrollo", "Consolidado", "Avanzado"];
export function Escalon({ nivel }) {
  const i = NIVELES.indexOf(nivel);
  return (
    <div aria-label={`Nivel: ${nivel}`} role="img">
      <div className="t-escalon">{NIVELES.map((n, k) => <i key={n} data-on={k <= i ? "" : undefined} />)}</div>
      <div className="t-escalon-txt" aria-hidden="true">{NIVELES.map((n, k) => <span key={n} data-actual={k === i ? "" : undefined}>{n}</span>)}</div>
    </div>
  );
}

export function Red({ enLinea }) {
  return <span className="t-red" data-off={enLinea ? undefined : ""} role="status">{enLinea ? "Conectado" : "Sin conexión, reintentando…"}</span>;
}

// Pantalla proyectada: se diseña a 1920×1080 y se escala para ocupar la pantalla que haya.
// La pantalla proyectada va en claro: fondo bruma y texto profundo.
export function Escenario({ children, fondo = "var(--bruma)", cursor = "auto" }) {
  const [escala, setEscala] = useState(1);
  useEffect(() => {
    const medir = () => setEscala(Math.min(window.innerWidth / 1920, window.innerHeight / 1080));
    medir();
    window.addEventListener("resize", medir);
    return () => window.removeEventListener("resize", medir);
  }, []);
  return (
    <div style={{ position: "fixed", inset: 0, background: fondo, overflow: "hidden", cursor }}>
      <div style={{ position: "absolute", left: "50%", top: "50%", width: 1920, height: 1080, transform: `translate(-50%,-50%) scale(${escala})`, color: "var(--profundo)" }}>
        {children}
      </div>
    </div>
  );
}

// Pide la clave del facilitador y la valida antes de guardarla.
export function AccesoFacilitador({ codigo, destino, aviso = "", onListo }) {
  const [clave, setClave] = useState("");
  const [error, setError] = useState(aviso);
  const [enviando, setEnviando] = useState(false);
  async function entrar(e) {
    e.preventDefault();
    setError("");
    setEnviando(true);
    try {
      await api.panel(codigo, clave.trim());
      onListo(clave.trim());
    } catch (err) {
      setError(api.mensaje(err));
      setEnviando(false);
    }
  }
  return (
    <main className="t-pagina">
      <div className="t-angosta">
        <Logo />
        <form className="t-tarjeta t-sube" onSubmit={entrar} style={{ marginTop: 32 }}>
          <p className="t-etiqueta">Sesión {codigo}</p>
          <h1 style={{ fontSize: 26, lineHeight: 1.2, color: "var(--profundo)", margin: "8px 0 20px" }}>Entrar a {destino}</h1>
          <label className="t-label" htmlFor="clave">Clave de los expositores</label>
          <input id="clave" className="t-campo" type="text" autoComplete="off" autoCapitalize="none" spellCheck={false}
            value={clave} onChange={(e) => setClave(e.target.value)} autoFocus />
          {error && <p className="t-error" role="alert">{error}</p>}
          <button className="t-boton" type="submit" disabled={!clave.trim() || enviando} style={{ marginTop: 20, width: "100%" }}>
            {enviando ? "Verificando…" : "Entrar"}
          </button>
        </form>
      </div>
    </main>
  );
}

export function SinSesion({ codigo }) {
  // En la dirección del evento no hay código que revisar: la sesión se crea antes del taller.
  const evento = codigo === EVENTO.codigo;
  return (
    <main className="t-pagina">
      <div className="t-angosta">
        <Logo />
        <div className="t-tarjeta" style={{ marginTop: 32 }}>
          <h1 style={{ fontSize: 24, color: "var(--profundo)" }}>{evento ? "El taller todavía no empezó" : `No hay ninguna sesión con el código ${codigo}`}</h1>
          <p style={{ marginTop: 10, color: "var(--apagado)" }}>{evento ? "Vuelva a abrir este link cuando empiece." : "Revise el código que aparece en la pantalla."}</p>
          {!evento && <a className="t-boton" href="/s" style={{ marginTop: 20 }}>Escribir otro código</a>}
        </div>
      </div>
    </main>
  );
}
