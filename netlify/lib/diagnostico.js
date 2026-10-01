// Lógica compartida del diagnóstico colaborativo (lado servidor).
// Cada diagnóstico se identifica por un link secreto /d/<clave>: quien lo tiene puede ver y
// completar las etapas. En la base se guarda solo el hash de la clave.
import { createHash, randomBytes } from "node:crypto";
import { env } from "./env.js";
import { supabaseAdmin } from "./supabaseAdmin.js";
import { enviarMail } from "./mailer.js";
import { renderInformePDF, nombreArchivoPDF } from "./pdf.js";
import { mailInforme, mailInterno, mailColaboradorListo } from "./emails.js";
import { ETAPAS_DATA } from "../../src/data/etapas.js";

export const LETRAS = new Set(["A", "B", "C", "D"]);
export const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const CLAVE = /^[A-Za-z0-9_-]{32}$/;

export const texto = (v, max) => (typeof v === "string" ? v.trim().slice(0, max) : "");
export const nuevaClave = () => randomBytes(24).toString("base64url"); // 32 caracteres, 192 bits
export const hashClave = (clave) => createHash("sha256").update(clave).digest("hex");
export const nuevoId = () => randomBytes(6).toString("hex");
export const linkDe = (clave, extra = "") => `${env.SITE_URL || "https://diagnostico.campuslatina.com"}/d/${clave}${extra}`;

export async function buscarPorClave(clave) {
  if (!CLAVE.test(String(clave || ""))) return null;
  const { data, error } = await supabaseAdmin().from("diagnosticos").select("*").eq("clave_hash", hashClave(clave)).maybeSingle();
  if (error) throw error;
  return data;
}

// Etapas con sus 4 preguntas respondidas.
export const etapasCompletas = (respuestas = {}) =>
  ETAPAS_DATA.filter((e) => e.preguntas.every((_, i) => LETRAS.has(respuestas[`${e.id}_${i}`]))).map((e) => e.id);

// Lo que ve cualquiera que tenga el link: sin teléfono ni mails de los colegas.
export function vistaPublica(d) {
  return {
    estado: d.estado,
    universidad: d.universidad,
    pais: d.pais,
    nombre: d.nombre,
    cargo: d.cargo,
    email: d.email,
    target: !!d.target,
    respuestas: d.respuestas || {},
    etapas_por: Object.fromEntries(Object.entries(d.etapas_por || {}).map(([k, v]) => [k, { nombre: v?.nombre || "" }])),
    colaboradores: (d.colaboradores || []).map((c) => ({ id: c.id, nombre: c.nombre, etapas: c.etapas || [] })),
    mail_enviado: !!d.mail_enviado,
    created_at: d.created_at,
  };
}

// Informe al directivo (PDF), aviso interno y "listo" a los colegas. Idempotente: Resend no
// duplica un envío con la misma idempotencyKey, y lo ya enviado queda marcado en la fila.
export async function notificar(d, { clave } = {}) {
  let pdf;
  try {
    pdf = await renderInformePDF(d, { contacto: env.CONTACT_EMAIL });
  } catch (err) {
    console.error("[notificar] PDF", err);
  }
  const attachments = pdf
    ? [{ filename: nombreArchivoPDF(d), content: Buffer.from(pdf).toString("base64"), contentType: "application/pdf" }]
    : undefined;

  const cliente = mailInforme(d, { contactoEmail: env.CONTACT_EMAIL, agendaUrl: env.AGENDA_URL });
  const interno = mailInterno(d, { adminUrl: env.SITE_URL ? `${env.SITE_URL}/admin?id=${d.id}` : "" });
  const colegas = (d.colaboradores || []).filter((c) => EMAIL.test(c.email || "") && c.email !== d.email);

  const [mail_enviado, notif_enviada] = await Promise.all([
    d.mail_enviado || enviarMail(
      { to: d.email, replyTo: env.CONTACT_EMAIL || undefined, ...cliente, attachments },
      { idempotencyKey: `informe/${d.id}` },
    ),
    d.notif_enviada || (env.MAIL_INTERNAL_TO.length
      ? enviarMail({ to: env.MAIL_INTERNAL_TO, replyTo: d.email, ...interno, attachments }, { idempotencyKey: `interno/${d.id}` })
      : (console.error("[notificar] Falta MAIL_INTERNAL_TO"), false)),
    ...(clave && !d.mail_enviado ? colegas.map((c) => enviarMail(
      { to: c.email, replyTo: d.email, ...mailColaboradorListo(d, { link: linkDe(clave), nombre: c.nombre }), attachments },
      { idempotencyKey: `listo/${d.id}/${c.id}` },
    )) : []),
  ]);

  const { error } = await supabaseAdmin().from("diagnosticos").update({ mail_enviado, notif_enviada }).eq("id", d.id);
  if (error) console.error("[notificar] UPDATE", error);
  return { mail_enviado, notif_enviada, pdf: !!pdf };
}
