// true en pantallas ≥ 1024 px. El celular usa siempre la distribución de una columna.
import { useEffect, useState } from "react";

const QUERY = "(min-width: 1024px)";

export function useIsDesktop() {
  const [desk, setDesk] = useState(() => typeof window !== "undefined" && window.matchMedia(QUERY).matches);
  useEffect(() => {
    const mq = window.matchMedia(QUERY);
    const on = () => setDesk(mq.matches);
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);
  return desk;
}
