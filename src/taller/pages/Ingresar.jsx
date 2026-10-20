// /s sin código: para quien no puede usar el QR y escribe la dirección a mano.
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Logo } from "../componentes.jsx";
import { HERRAMIENTA } from "../datos.js";

export default function Ingresar() {
  const nav = useNavigate();
  const [codigo, setCodigo] = useState("");
  const limpio = codigo.trim().toUpperCase();
  return (
    <main className="t-pagina">
      <div className="t-angosta">
        <Logo />
        <form className="t-tarjeta t-sube" style={{ marginTop: 32 }} onSubmit={(e) => { e.preventDefault(); if (limpio.length >= 4) nav(`/s/${limpio}`); }}>
          <p className="t-etiqueta">{HERRAMIENTA}</p>
          <h1 style={{ fontSize: 26, lineHeight: 1.2, color: "var(--profundo)", margin: "8px 0 20px" }}>Escriba el código que aparece en la pantalla</h1>
          <label className="t-label" htmlFor="codigo">Código</label>
          <input id="codigo" className="t-campo t-mayus" value={codigo} onChange={(e) => setCodigo(e.target.value)} maxLength={8}
            autoCapitalize="characters" autoComplete="off" spellCheck={false} autoFocus
            style={{ fontSize: 28, letterSpacing: ".12em", fontWeight: 700 }} />
          <button className="t-boton" type="submit" disabled={limpio.length < 4} style={{ marginTop: 20, width: "100%" }}>Entrar</button>
        </form>
      </div>
    </main>
  );
}
