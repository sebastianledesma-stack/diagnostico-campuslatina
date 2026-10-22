// Variables de entorno del servidor (Netlify → Site configuration → Environment variables).
export const env = {
  SUPABASE_URL: process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL,
  SUPABASE_SERVICE_KEY: process.env.SUPABASE_SERVICE_KEY,
  RESEND_API_KEY: process.env.RESEND_API_KEY,
  MAIL_FROM: process.env.MAIL_FROM || "Diagnóstico Campus Latina <no-reply@campuslatina.com>",
  // Destinatario(s) del aviso interno, separados por coma.
  MAIL_INTERNAL_TO: list(process.env.MAIL_INTERNAL_TO),
  // Contacto comercial: Reply-To del mail al directivo y botón "Hablemos".
  CONTACT_EMAIL: process.env.CONTACT_EMAIL || process.env.VITE_CONTACT_EMAIL || "",
  SITE_URL: (process.env.SITE_URL || process.env.URL || "").replace(/\/$/, ""),
  // Link público para agendar la reunión de 45 min (Google Calendar, Calendly…).
  // Sin él, el botón abre un mail a CONTACT_EMAIL pidiendo la reunión.
  AGENDA_URL: process.env.AGENDA_URL || process.env.VITE_AGENDA_URL || "",
  // Emails con acceso a /admin, separados por coma.
  ADMIN_EMAILS: list(process.env.ADMIN_EMAILS),
};

function list(v) {
  return String(v || "").split(",").map((s) => s.trim().toLowerCase()).filter(Boolean);
}

export function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
  });
}
