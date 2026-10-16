// Ayudas de movimiento: cifras que cuentan hasta su valor y detección de movimiento reducido.
import { useEffect, useRef, useState } from "react";

export const sinMovimiento = () => typeof window === "undefined" || window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const suave = (t) => 1 - Math.pow(1 - t, 3);

// Devuelve un número que viaja desde el valor anterior (o desde `desde` la primera vez) hasta `valor`.
export function useCuenta(valor, { ms = 1100, desde = 0, retraso = 0 } = {}) {
  const [v, setV] = useState(() => (sinMovimiento() ? valor : desde));
  const actual = useRef(v);
  useEffect(() => {
    if (sinMovimiento()) { actual.current = valor; setV(valor); return; }
    const inicio = actual.current; let raf = 0, t0 = null;
    const paso = (ts) => {
      if (t0 == null) t0 = ts + retraso;
      const t = Math.max(0, Math.min(1, (ts - t0) / ms));
      const n = inicio + (valor - inicio) * suave(t);
      actual.current = n; setV(n);
      if (t < 1) raf = requestAnimationFrame(paso);
    };
    raf = requestAnimationFrame(paso);
    return () => cancelAnimationFrame(raf);
  }, [valor, ms, retraso]);
  return v;
}
