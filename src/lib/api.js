// Cliente de la API del diagnóstico colaborativo (netlify/functions/diagnostico.mjs).
// El navegador ya no escribe directo en Supabase: todo pasa por el servidor, que es más
// robusto ante bloqueadores y redes corporativas, y permite compartir un mismo diagnóstico.
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function pedir(url, { method = "GET", body, intentos = 3 } = {}) {
  let ultimo;
  for (let i = 1; i <= intentos; i++) {
    try {
      const res = await fetch(url, {
        method,
        headers: body ? { "Content-Type": "application/json" } : undefined,
        body: body ? JSON.stringify(body) : undefined,
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) return data;
      ultimo = Object.assign(new Error(data.error || `Error ${res.status}`), { status: res.status });
      if (res.status < 500) throw ultimo; // error de datos: reintentar no cambia nada
    } catch (err) {
      ultimo = err;
      if (err.status && err.status < 500) throw err;
    }
    if (i < intentos) await sleep(700 * i);
  }
  throw ultimo;
}

export const crearDiagnostico = (form) => pedir("/api/diagnostico", { method: "POST", body: form });
export const leerDiagnostico = (clave) => pedir(`/api/d/${clave}`);
export const guardarEtapa = (clave, etapa, respuestas, quien) =>
  pedir(`/api/d/${clave}/etapa`, { method: "POST", body: { etapa, respuestas, quien } });
export const invitarColega = (clave, datos) => pedir(`/api/d/${clave}/invitar`, { method: "POST", body: datos, intentos: 1 });
export const finalizarDiagnostico = (clave) => pedir(`/api/d/${clave}/finalizar`, { method: "POST", body: {} });

// Nombre de quien responde en este navegador, por diagnóstico (para "respondida por …").
const KEY = (clave) => `diag-quien-${clave}`;
export function leerQuien(clave) {
  try { return localStorage.getItem(KEY(clave)) || ""; } catch { return ""; }
}
export function guardarQuien(clave, nombre) {
  try { localStorage.setItem(KEY(clave), nombre); } catch { /* modo privado: se vuelve a pedir */ }
}

// Etapas con sus 4 preguntas respondidas (misma regla que el servidor).
export const etapaCompleta = (etapa, respuestas = {}) => etapa.preguntas.every((_, i) => respuestas[`${etapa.id}_${i}`]);
