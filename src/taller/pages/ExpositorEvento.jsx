// /realcup2026/expositor — La pantalla del expositor del taller de REALCUP. Si la sesión todavía no
// existe, se crea acá mismo (con la clave de los expositores) y se sigue a la pantalla.
import { useEffect, useState } from "react";
import * as api from "../api.js";
import { EVENTO } from "../datos.js";
import Crear from "./Crear.jsx";
import Expositor from "./Expositor.jsx";

export default function ExpositorEvento() {
  const [existe, setExiste] = useState(null);
  useEffect(() => {
    // Sin participante, taller_estado solo consulta: no da de alta a nadie.
    api.estado(EVENTO.codigo).then(
      () => setExiste(true),
      // Un error de red no significa que no exista: la pantalla del expositor maneja sus reintentos.
      (err) => setExiste(err.codigo !== "sesion_no_encontrada"),
    );
  }, []);

  if (existe === null) return null;
  if (!existe) return <Crear evento={EVENTO} alCrear={() => setExiste(true)} />;
  return <Expositor codigo={EVENTO.codigo} />;
}
