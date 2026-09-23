// Prueba de punta a punta con servicios reales (usa .env.local):
// INSERT como el navegador → /api/notify (PDF + mails reales por Resend) → verifica flags en Supabase.
// Uso: node --env-file=.env.local scripts/test-e2e.mjs [email-destino]
import { createClient } from "@supabase/supabase-js";
import { sampleDiagnostico } from "./sample-data.mjs";

const e = process.env;
const destino = process.argv[2] || e.MAIL_INTERNAL_TO.split(",")[0];
const anon = createClient(e.VITE_SUPABASE_URL, e.VITE_SUPABASE_ANON_KEY, { auth: { persistSession: false } });
const admin = createClient(e.SUPABASE_URL, e.SUPABASE_SERVICE_KEY, { auth: { persistSession: false } });

const s = sampleDiagnostico();
const row = {
  id: crypto.randomUUID(), universidad: "PRUEBA — Universidad Demo", pais: s.pais, nombre: "Sebastián (prueba)",
  cargo: s.cargo, email: destino, whatsapp: s.whatsapp, respuestas: s.respuestas, scores: s.scores,
  score_global: s.score_global, nivel: s.nivel,
};

const ins = await anon.from("diagnosticos").insert(row);
if (ins.error) { console.error("✗ INSERT:", ins.error.message); process.exit(1); }
console.log("✓ INSERT como el navegador — id", row.id);

const { default: notify } = await import("../netlify/functions/notify.mjs");
const t0 = Date.now();
const res = await notify(new Request("http://localhost/api/notify", { method: "POST", body: JSON.stringify({ id: row.id }) }));
console.log(`${res.ok ? "✓" : "✗"} /api/notify → ${res.status} ${await res.text()} (${((Date.now() - t0) / 1000).toFixed(1)} s)`);

const { data } = await admin.from("diagnosticos").select("mail_enviado,notif_enviada").eq("id", row.id).single();
console.log(`${data?.mail_enviado && data?.notif_enviada ? "✓" : "✗"} flags en Supabase:`, data);
