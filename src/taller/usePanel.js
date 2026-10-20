// Estado completo de la sesión para la pantalla del expositor (y la espejo), consultado cada 2 s.
// Cada consulta manda la huella anterior: si nada cambió, la respuesta trae solo los conectados.
import { useCallback, useEffect, useRef, useState } from "react";
import * as api from "./api.js";

export function usePanel(codigo, clave, { cada = 2000 } = {}) {
  const [datos, setDatos] = useState(null);
  const [error, setError] = useState(null);
  const [enLinea, setEnLinea] = useState(true);
  const version = useRef(null);

  useEffect(() => {
    if (!clave) return undefined;
    let vivo = true;
    let timer;
    version.current = null;
    setError(null);
    const tick = async () => {
      try {
        const r = await api.panel(codigo, clave, version.current);
        if (!vivo) return;
        setEnLinea(true);
        setError(null);
        if (r.sin_cambios) setDatos((d) => d && { ...d, conectados: r.conectados, envios: r.envios });
        else { version.current = r.version; setDatos(r); }
      } catch (err) {
        if (!vivo) return;
        if (!api.esTransitorio(err)) { setError(err); return; } // clave o código mal: no tiene sentido reintentar
        setEnLinea(false);
      }
      timer = setTimeout(tick, cada);
    };
    tick();
    return () => { vivo = false; clearTimeout(timer); };
  }, [codigo, clave, cada]);

  // Las acciones del expositor devuelven el estado nuevo: se muestra sin esperar la próxima consulta.
  const aplicar = useCallback((r) => { version.current = r.version; setDatos(r); }, []);
  return { datos, error, enLinea, aplicar };
}
