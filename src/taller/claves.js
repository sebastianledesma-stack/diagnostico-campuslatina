// La clave del facilitador queda guardada en este navegador por sesión, así el panel y la
// pantalla proyectada abiertos en la misma computadora no la vuelven a pedir.
const KEY = (codigo) => `taller-clave-${codigo}`;

export function leerClave(codigo) {
  try { return localStorage.getItem(KEY(codigo)) || ""; } catch { return ""; }
}
export function guardarClave(codigo, clave) {
  try { localStorage.setItem(KEY(codigo), clave); } catch { /* modo privado: se vuelve a pedir */ }
}
export function borrarClave(codigo) {
  try { localStorage.removeItem(KEY(codigo)); } catch { /* nada que borrar */ }
}

// Clave sugerida al crear la sesión: 8 caracteres fáciles de dictar (sin 0/o, 1/l/i).
export function claveAlAzar() {
  const letras = "abcdefghjkmnpqrstuvwxyz23456789";
  const n = crypto.getRandomValues(new Uint32Array(8));
  return Array.from(n, (x) => letras[x % letras.length]).join("");
}
