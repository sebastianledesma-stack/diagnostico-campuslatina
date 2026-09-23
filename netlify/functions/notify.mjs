// POST /api/notify  { id }
// Lee el diagnóstico con la service key, genera el PDF y envía:
//   1) el informe al directivo (PDF adjunto)
//   2) el aviso interno a CampusLatina (mismo PDF)
// y actualiza mail_enviado / notif_enviada.
// Recibe solo el id (no el email) para que nadie pueda usar el endpoint para mandar mails a terceros.
import { env, json } from "../lib/env.js";
import { supabaseAdmin } from "../lib/supabaseAdmin.js";
import { enviarMail } from "../lib/mailer.js";
import { renderInformePDF, nombreArchivoPDF } from "../lib/pdf.js";
import { mailInforme, mailInterno } from "../lib/emails.js";

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

  if (d.mail_enviado && d.notif_enviada) return json({ ok: true, mail_enviado: true, notif_enviada: true });
  if (Date.now() - new Date(d.created_at).getTime() > VENTANA_MS) return json({ error: "Diagnóstico vencido para notificar" }, 410);

  let pdf;
  try {
    pdf = await renderInformePDF(d, { contacto: env.CONTACT_EMAIL });
  } catch (err) {
    console.error("[notify] PDF", err);
  }
  // base64 explícito: el SDK serializa el Buffer tal cual y la API espera base64.
  const attachments = pdf
    ? [{ filename: nombreArchivoPDF(d), content: Buffer.from(pdf).toString("base64"), contentType: "application/pdf" }]
    : undefined;

  const cliente = mailInforme(d, { contactoEmail: env.CONTACT_EMAIL });
  const interno = mailInterno(d, { adminUrl: env.SITE_URL ? `${env.SITE_URL}/admin?id=${d.id}` : "" });

  const [mail_enviado, notif_enviada] = await Promise.all([
    d.mail_enviado || enviarMail(
      { to: d.email, replyTo: env.CONTACT_EMAIL || undefined, ...cliente, attachments },
      { idempotencyKey: `informe/${d.id}` },
    ),
    d.notif_enviada || (env.MAIL_INTERNAL_TO.length
      ? enviarMail(
          { to: env.MAIL_INTERNAL_TO, replyTo: d.email, ...interno, attachments },
          { idempotencyKey: `interno/${d.id}` },
        )
      : (console.error("[notify] Falta MAIL_INTERNAL_TO"), false)),
  ]);

  const { error: upErr } = await db.from("diagnosticos").update({ mail_enviado, notif_enviada }).eq("id", d.id);
  if (upErr) console.error("[notify] UPDATE", upErr);

  return json({ ok: mail_enviado && notif_enviada, mail_enviado, notif_enviada, pdf: !!pdf }, mail_enviado ? 200 : 502);
};

export const config = { path: "/api/notify" };
