// Modelo ilustrativo del recorrido del aspirante (el mismo del informe del diagnóstico): en cada etapa
// sigue una parte de los aspirantes según el puntaje, y de cada 100 que empiezan llegan a inscribirse
// los que pasan las 7. No es una medición: sirve para ver el efecto del puntaje en el camino.
// Sin React: lo usan el haz de la pantalla (vistas/Haz.jsx) y el PDF del servidor.
export const N = 7;
export const FIN = 0.93;                            // el haz ocupa el 93 % del largo; el resto es la llegada
export const posEtapa = (i) => FIN * (i + 0.5) / N; // centro de cada etapa, para ubicar los rótulos
const PERDIDA_MAX = 0.36;                           // con puntaje 1 la etapa retiene el 64 %; con 5, todos siguen

export const retencion = (s) => 1 - PERDIDA_MAX * (5 - Math.max(1, Math.min(5, s || 1))) / 4;
export const acumulada = (ps) => { let c = 1; return ps.map((s) => (c *= retencion(s))); };
// De cada 100 aspirantes que empiezan, cuántos llegan a inscribirse.
export const deCada100 = (ps) => Math.round(100 * acumulada(ps)[ps.length - 1]);

const suave = (a, b, x) => { const t = Math.max(0, Math.min(1, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
// Ancho relativo del haz en u (0–1 sobre el tramo de etapas): baja a la retención acumulada en cada etapa.
export function anchoEn(cum, u) {
  let w = 1;
  for (let i = 0; i < N; i++) {
    const c = (i + 0.5) / N, a = c - 0.03, b = c + 0.05;
    if (u <= a) return w;
    if (u < b) return w + (cum[i] - w) * suave(a, b, u);
    w = cum[i];
  }
  return w;
}
