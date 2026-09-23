// Verifica RLS contra el Supabase real (usa .env.local). Borra la fila de prueba al final.
// Uso: node --env-file=.env.local scripts/test-supabase-rls.mjs
import { createClient } from "@supabase/supabase-js";
import { sampleDiagnostico } from "./sample-data.mjs";

const e = process.env;
const opts = { auth: { persistSession: false } };
const anon = createClient(e.VITE_SUPABASE_URL, e.VITE_SUPABASE_ANON_KEY, opts);
const admin = createClient(e.SUPABASE_URL, e.SUPABASE_SERVICE_KEY, opts);
const ok = (b) => (b ? "✓" : "✗ FALLA");

const base = sampleDiagnostico();
delete base.created_at; delete base.mail_enviado; delete base.notif_enviada;
const row = { ...base, id: crypto.randomUUID(), universidad: "PRUEBA AUTOMÁTICA — borrar" };

const ins = await anon.from("diagnosticos").insert(row);
console.log(ok(!ins.error), "anon puede INSERTAR", ins.error?.message || "");

const sel = await anon.from("diagnosticos").select("*");
console.log(ok(sel.error || sel.data?.length === 0), "anon NO puede leer", sel.error ? `(${sel.error.message})` : `(${sel.data.length} filas visibles)`);

const upd = await anon.from("diagnosticos").update({ mail_enviado: true }).eq("id", row.id).select();
console.log(ok(upd.error || !upd.data?.length), "anon NO puede actualizar", upd.error?.message || "");

const cheat = await anon.from("diagnosticos").insert({ ...row, id: crypto.randomUUID(), mail_enviado: true });
console.log(ok(!!cheat.error), "anon NO puede insertar con mail_enviado=true", cheat.error ? "" : "(¡se insertó!)");

const bad = await anon.from("diagnosticos").insert({ ...row, id: crypto.randomUUID(), nivel: "Genio" });
console.log(ok(!!bad.error), "la base rechaza un nivel inválido");

const back = await admin.from("diagnosticos").select("id,universidad,score_global,nivel,mail_enviado").eq("id", row.id).single();
console.log(ok(!back.error && back.data?.id === row.id), "el servidor (secret key) lee la fila", back.data ? `→ ${back.data.score_global} ${back.data.nivel}` : back.error?.message);

const del = await admin.from("diagnosticos").delete().eq("universidad", "PRUEBA AUTOMÁTICA — borrar");
const left = await admin.from("diagnosticos").select("id").eq("universidad", "PRUEBA AUTOMÁTICA — borrar");
console.log(ok(!del.error && left.data?.length === 0), "filas de prueba borradas");
