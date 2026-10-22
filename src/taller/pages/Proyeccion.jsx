// /p/<código> — Pantalla espejo: lo mismo que se proyecta, sin controles. Sirve cuando el proyector
// está conectado a otra computadora que la del expositor. Protegida con la clave de la sesión.
import { useState } from "react";
import { useParams } from "react-router-dom";
import { usePanel } from "../usePanel.js";
import { Escenario, AccesoFacilitador, SinSesion } from "../componentes.jsx";
import { leerClave, guardarClave } from "../claves.js";
import { Pantalla, clavePantalla } from "../vistas/Pantalla.jsx";

export default function Proyeccion({ codigo: fijo }) {
  const params = useParams();
  const codigo = (fijo || params.codigo).toUpperCase();
  const [clave, setClave] = useState(() => leerClave(codigo));
  const { datos, error, enLinea } = usePanel(codigo, clave);

  if (error?.codigo === "sesion_no_encontrada") return <SinSesion codigo={codigo} />;
  if (!clave || error?.codigo === "clave_incorrecta") {
    return <AccesoFacilitador codigo={codigo} destino="la pantalla espejo" onListo={(c) => { guardarClave(codigo, c); setClave(c); }} />;
  }
  return (
    <Escenario cursor="none">
      {datos && <div key={clavePantalla(datos)} style={{ position: "absolute", inset: 0 }}><Pantalla datos={datos} /></div>}
      {!enLinea && <p role="status" style={{ position: "absolute", top: 24, right: 32, fontSize: 18, color: "var(--error)" }}>Sin conexión, reintentando…</p>}
    </Escenario>
  );
}
