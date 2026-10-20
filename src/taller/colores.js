// Escala de color del mapa de calor (de 1 a 5, de pálido a intenso), sobre fondo oscuro (pantalla)
// o claro (teléfono y PDF). Sin React: la usan el mapa en SVG y el PDF del servidor.
export const ESCALAS = {
  oscuro: {
    paradas: [[1, [32, 66, 75]], [2, [46, 108, 118]], [4, [98, 186, 195]], [5, [200, 245, 248]]],
    vacio: "rgba(255,255,255,.04)", bordeVacio: "rgba(255,255,255,.1)", texto: "#FFFFFF", suave: "#A9C2C6", marco: "#FFFFFF", textoCelda: (v) => (v >= 3.6 ? "#0A2329" : "#FFFFFF"),
  },
  claro: {
    paradas: [[1, [214, 231, 233]], [2, [168, 205, 209]], [4, [62, 143, 153]], [5, [11, 100, 112]]],
    vacio: "#FFFFFF", bordeVacio: "#D5E3E5", texto: "#123A42", suave: "#4D6166", marco: "#123A42", textoCelda: (v) => (v >= 3 ? "#FFFFFF" : "#123A42"),
  },
};

export function colorDe(v, tema = "oscuro") {
  const p = ESCALAS[tema].paradas;
  const x = Math.max(1, Math.min(5, v));
  for (let i = 1; i < p.length; i++) {
    if (x <= p[i][0]) {
      const [a, ca] = p[i - 1];
      const [b, cb] = p[i];
      const t = (x - a) / (b - a);
      return `rgb(${ca.map((c, k) => Math.round(c + (cb[k] - c) * t)).join(",")})`;
    }
  }
  return `rgb(${p[p.length - 1][1].join(",")})`;
}
