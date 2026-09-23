// Smoke test de /api/notify sin servicios reales: intercepta fetch hacia Supabase y Resend.
// Uso: node scripts/test-notify.mjs [carpeta-salida]  → guarda los HTML de los mails generados.
import { writeFileSync, mkdirSync } from "node:fs";
import { sampleDiagnostico } from "./sample-data.mjs";

const out = process.argv[2] || ".";
mkdirSync(out, { recursive: true });
Object.assign(process.env, {
  SUPABASE_URL: "https://mock.supabase.co", SUPABASE_SERVICE_KEY: "service",
  RESEND_API_KEY: "re_test", MAIL_INTERNAL_TO: "seba@campuslatina.com",
  CONTACT_EMAIL: "seba@campuslatina.com", SITE_URL: "https://diagnostico.campuslatina.com",
});

const row = sampleDiagnostico();
const enviados = [];
let update = null;
let resendFallas = Number(process.env.RESEND_FAIL || 0);

globalThis.fetch = async (url, init = {}) => {
  url = String(url);
  const method = init.method || "GET";
  if (url.startsWith("https://mock.supabase.co/rest/v1/diagnosticos")) {
    if (method === "GET") {
      const accept = new Headers(init.headers).get("accept") || "";
      const body = accept.includes("vnd.pgrst.object") ? row : [row];
      return new Response(JSON.stringify(body), { status: 200, headers: { "content-type": "application/json" } });
    }
    if (method === "PATCH") { update = JSON.parse(init.body); return new Response(null, { status: 204 }); }
  }
  if (url.startsWith("https://api.resend.com/emails")) {
    if (resendFallas-- > 0) return new Response(JSON.stringify({ name: "internal_server_error", message: "boom", statusCode: 500 }), { status: 500, headers: { "content-type": "application/json" } });
    const body = JSON.parse(init.body);
    enviados.push({ body, idem: new Headers(init.headers).get("idempotency-key") });
    return new Response(JSON.stringify({ id: `email_${enviados.length}` }), { status: 200, headers: { "content-type": "application/json" } });
  }
  throw new Error(`fetch inesperado: ${method} ${url}`);
};

const { default: notify, config } = await import("../netlify/functions/notify.mjs");
const res = await notify(new Request("http://localhost/api/notify", { method: "POST", body: JSON.stringify({ id: row.id }) }));
console.log("path:", config.path, "| status:", res.status, "|", await res.text());
console.log("UPDATE:", update);
for (const [i, { body, idem }] of enviados.entries()) {
  console.log(`mail ${i + 1}: to=${body.to} reply_to=${body.reply_to} idem=${idem} subject="${body.subject}" adjuntos=${(body.attachments || []).map((a) => `${a.filename} (${Math.round(a.content.length * 0.75 / 1024)} KB)`).join(", ")}`);
  writeFileSync(`${out}/mail-${i + 1}.html`, body.html);
}

const bad = await notify(new Request("http://localhost/api/notify", { method: "POST", body: JSON.stringify({ id: "x" }) }));
console.log("id inválido →", bad.status);
