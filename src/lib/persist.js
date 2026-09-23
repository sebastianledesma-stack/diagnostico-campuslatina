// Persistencia al terminar el test: INSERT en Supabase (con reintento silencioso) y
// disparo de /api/notify, que genera el PDF y envía los mails.
// Devuelve el estado del envío para el banner del informe: "enviado" | "error".
import { supabase } from "./supabase.js";
import { calcResultados } from "./scoring.js";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function insertar(row, intentos = 3) {
  for (let i = 1; i <= intentos; i++) {
    // Sin .select(): el rol anon no tiene permiso de lectura (return=minimal).
    const { error } = await supabase.from("diagnosticos").insert(row);
    // 23505 = el id ya existe: un intento anterior llegó a escribir aunque la respuesta se perdió.
    if (!error || error.code === "23505") return true;
    console.error(`[diagnostico] INSERT falló (intento ${i}/${intentos})`, error);
    if (i < intentos) await sleep(800 * i);
  }
  return false;
}

export async function guardarDiagnostico(registro, respuestas) {
  if (!supabase) return "error";
  const { scores, score_global, nivel } = calcResultados(respuestas);
  // El id se genera en el cliente porque el rol anon no puede leer la fila después de insertarla.
  const id = crypto.randomUUID();
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

  try {
    if (!(await insertar(row))) return "error";
  } catch (err) {
    console.error("[diagnostico] INSERT falló", err);
    return "error";
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
      return "error";
    }
    return "enviado";
  } catch (err) {
    console.error("[diagnostico] /api/notify falló", err);
    return "error";
  }
}
