// Persistencia al terminar el test: INSERT en Supabase (con reintento silencioso) y
// disparo de /api/notify, que genera el PDF y envía los mails.
// Devuelve el estado del envío para el banner del informe: "enviado" | "error".
import { supabase } from "./supabase.js";
import { calcResultados } from "./scoring.js";
import { track } from "./analytics.js";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Devuelve null si se guardó, o un código corto del último error (se manda a Analytics para diagnosticar).
async function insertar(row, intentos = 3) {
  let ultimo = "desconocido";
  for (let i = 1; i <= intentos; i++) {
    // Sin .select(): el rol anon no tiene permiso de lectura (return=minimal).
    const { error } = await supabase.from("diagnosticos").insert(row);
    // 23505 = el id ya existe: un intento anterior llegó a escribir aunque la respuesta se perdió.
    if (!error || error.code === "23505") return null;
    console.error(`[diagnostico] INSERT falló (intento ${i}/${intentos})`, error);
    ultimo = String(error.code || error.status || error.message || "desconocido").slice(0, 40);
    if (i < intentos) await sleep(800 * i);
  }
  return ultimo;
}

// Plan B: si el navegador no llega a Supabase, el servidor inserta la fila (netlify/functions/guardar.mjs).
async function guardarEnServidor(row) {
  const res = await fetch("/api/guardar", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(row),
  });
  return res.ok;
}

// crypto.randomUUID no existe en navegadores viejos (Safari < 15.4).
function uuid() {
  if (crypto.randomUUID) return crypto.randomUUID();
  const b = crypto.getRandomValues(new Uint8Array(16));
  b[6] = (b[6] & 0x0f) | 0x40; b[8] = (b[8] & 0x3f) | 0x80;
  const h = [...b].map((x) => x.toString(16).padStart(2, "0")).join("");
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
}

export async function guardarDiagnostico(registro, respuestas) {
  const { scores, score_global, nivel } = calcResultados(respuestas);
  // El id se genera en el cliente porque el rol anon no puede leer la fila después de insertarla.
  const id = uuid();
  const row = {
    id,
    universidad: registro.universidad.trim(),
    pais: registro.pais,
    nombre: registro.nombre.trim(),
    cargo: registro.cargo?.trim() || null,
    email: registro.email.trim().toLowerCase(),
    whatsapp: registro.whatsapp.trim(),
    respuestas,
    scores,
    score_global,
    nivel,
  };

  let fallo = null;
  try {
    fallo = supabase ? await insertar(row) : "sin_config";
  } catch (err) {
    console.error("[diagnostico] INSERT falló", err);
    fallo = "excepcion";
  }
  if (fallo) {
    let rescatado = false;
    try { rescatado = await guardarEnServidor(row); } catch (err) { console.error("[diagnostico] /api/guardar falló", err); }
    track("guardado_plan_b", { motivo: fallo, resultado: rescatado ? "ok" : "error" });
    if (!rescatado) { track("envio_error", { paso: "guardado", motivo: fallo }); return "error"; }
  }

  try {
    const res = await fetch("/api/notify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
      keepalive: true,
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data.mail_enviado) {
      console.error("[diagnostico] /api/notify", res.status, data);
      track("envio_error", { paso: "mail", motivo: String(res.status) });
      return "error";
    }
    return "enviado";
  } catch (err) {
    console.error("[diagnostico] /api/notify falló", err);
    track("envio_error", { paso: "mail", motivo: "red" });
    return "error";
  }
}
