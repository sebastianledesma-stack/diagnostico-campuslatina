// /f — Crear una sesión del taller (o entrar al panel de una que ya existe).
// Con `evento` (desde /realcup2026/expositor) el código y el nombre vienen dados: solo falta la clave.
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import * as api from "../api.js";
import { Logo } from "../componentes.jsx";
import { guardarClave, claveAlAzar } from "../claves.js";
import { EVENTO_POR_DEFECTO, HERRAMIENTA, rutaAsistente, rutaExpositor } from "../datos.js";

export default function Crear({ evento, alCrear }) {
  const nav = useNavigate();
  const [f, setF] = useState(() => ({ nombre: evento?.nombre || EVENTO_POR_DEFECTO, clave: claveAlAzar(), codigo: evento?.codigo || "", demo: false }));
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState("");
  const [existente, setExistente] = useState("");
  const campo = (k) => (e) => setF({ ...f, [k]: e.target.type === "checkbox" ? e.target.checked : e.target.value });

  async function crear(e) {
    e.preventDefault();
    setError("");
    setEnviando(true);
    try {
      const { codigo } = await api.crearSesion({
        nombre: f.nombre.trim(), clave: f.clave.trim(), codigo: f.codigo.trim().toUpperCase(), demo: f.demo,
      });
      guardarClave(codigo, f.clave.trim());
      if (alCrear) alCrear(codigo);
      else nav(rutaExpositor(codigo));
    } catch (err) {
      setError(api.mensaje(err));
      setEnviando(false);
    }
  }

  const codigoExistente = existente.trim().toUpperCase();
  return (
    <main className="t-pagina">
      <div className="t-angosta">
        <Logo />
        <p className="t-etiqueta" style={{ marginTop: 32 }}>{HERRAMIENTA} · Expositores</p>
        <h1 style={{ fontSize: 30, lineHeight: 1.15, color: "var(--profundo)", margin: "8px 0 10px" }}>{evento ? "Crear la sesión del taller" : "Crear una sesión"}</h1>
        <p style={{ color: "var(--apagado)", marginBottom: 24 }}>
          {evento
            ? <>Los asistentes van a entrar desde su teléfono en <strong style={{ color: "var(--profundo)", fontWeight: 600 }}>{window.location.host}{rutaAsistente(evento.codigo)}</strong>, sin registrarse ni dar datos.</>
            : "Cada sesión tiene su código y su QR. Los asistentes entran desde su teléfono, sin registrarse ni dar datos."}
        </p>

        <form className="t-tarjeta t-sube" onSubmit={crear}>
          <label className="t-label" htmlFor="nombre">Nombre del evento</label>
          <input id="nombre" className="t-campo" value={f.nombre} onChange={campo("nombre")} maxLength={120} />
          <p className="t-ayuda">Aparece en la pantalla del salón y en los teléfonos.</p>

          <label className="t-label" htmlFor="clave" style={{ marginTop: 20 }}>Clave de los expositores</label>
          <input id="clave" className="t-campo" value={f.clave} onChange={campo("clave")} autoComplete="off" autoCapitalize="none" spellCheck={false} />
          <p className="t-ayuda">Con esta clave se entra a la pantalla del expositor. Anótela: no se puede recuperar.</p>

          {!evento && <>
            <label className="t-label" htmlFor="codigo" style={{ marginTop: 20 }}>Código de la sesión <span style={{ fontWeight: 400, color: "var(--apagado)" }}>(opcional)</span></label>
            <input id="codigo" className="t-campo t-mayus" value={f.codigo} onChange={campo("codigo")} placeholder="Por ejemplo, ENSAYO"
              maxLength={8} autoCapitalize="characters" autoComplete="off" spellCheck={false} />
            <p className="t-ayuda">Es lo que escribe quien no puede usar el QR. Vacío, se genera uno de 4 letras.</p>

            <label className="t-check" style={{ marginTop: 20 }}>
              <input type="checkbox" checked={f.demo} onChange={campo("demo")} />
              <span><strong style={{ fontWeight: 600 }}>Sesión de prueba</strong><br />
                <span style={{ fontSize: 14, color: "var(--apagado)" }}>Permite simular respuestas para ensayar sin gente.</span></span>
            </label>
          </>}

          {error && <p className="t-error" role="alert">{error}</p>}
          <button className="t-boton" type="submit" disabled={enviando || !f.nombre.trim() || f.clave.trim().length < 6} style={{ marginTop: 24, width: "100%" }}>
            {enviando ? "Creando…" : "Crear sesión"}
          </button>
        </form>

        {!evento && <form className="t-tarjeta" style={{ marginTop: 20 }} onSubmit={(e) => { e.preventDefault(); if (codigoExistente) nav(rutaExpositor(codigoExistente)); }}>
          <h2 style={{ fontSize: 18, color: "var(--profundo)", marginBottom: 14 }}>¿Ya creó la sesión?</h2>
          <label className="t-label" htmlFor="existente">Código</label>
          <div style={{ display: "flex", gap: 10 }}>
            <input id="existente" className="t-campo t-mayus" value={existente} onChange={(e) => setExistente(e.target.value)}
              maxLength={8} autoCapitalize="characters" autoComplete="off" spellCheck={false} />
            <button className="t-boton t-boton-sec" type="submit" disabled={codigoExistente.length < 4}>Entrar</button>
          </div>
        </form>}
      </div>
    </main>
  );
}
