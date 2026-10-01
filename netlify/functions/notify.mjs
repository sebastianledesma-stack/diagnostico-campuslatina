// POST /api/notify  { id }   (versión anterior del test: guardado completo de una vez)
// Lee el diagnóstico con la service key, genera el PDF y envía:
//   1) el informe al directivo (PDF adjunto)
//   2) el aviso interno a CampusLatina (mismo PDF)
// y actualiza mail_enviado / notif_enviada.
// Recibe solo el id (no el email) para que nadie pueda usar el endpoint para mandar mails a terceros.
import { json } from "../lib/env.js";
import { supabaseAdmin } from "../lib/supabaseAdmin.js";
import { notificar } from "../lib/diagnostico.js";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const VENTANA_MS = 30 * 60 * 1000; // solo se notifica un diagnóstico recién creado

export default async (req) => {
  if (req.method !== "POST") return json({ error: "Método no permitido" }, 405);

  const { id } = await req.json().catch(() => ({}));
  if (!UUID.test(String(id || ""))) return json({ error: "id inválido" }, 400);

  const db = supabaseAdmin();
  const { data: d, error } = await db.from("diagnosticos").select("*").eq("id", id).maybeSingle();
  if (error) {
    console.error("[notify] SELECT", error);
    return json({ error: "Error de base de datos" }, 500);
  }
  if (!d) return json({ error: "Diagnóstico no encontrado" }, 404);
  if (d.estado === "en_curso") return json({ error: "Diagnóstico incompleto" }, 409);

  if (d.mail_enviado && d.notif_enviada) return json({ ok: true, mail_enviado: true, notif_enviada: true });
  if (Date.now() - new Date(d.created_at).getTime() > VENTANA_MS) return json({ error: "Diagnóstico vencido para notificar" }, 410);

  const r = await notificar(d);
  return json({ ok: r.mail_enviado && r.notif_enviada, ...r }, r.mail_enviado ? 200 : 502);
};

export const config = { path: "/api/notify" };
