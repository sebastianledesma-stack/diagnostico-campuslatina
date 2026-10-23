// Smoke test del acceso al panel y de /api/admin-data con Supabase simulado (sin servicios reales):
// clave → cookie de sesión, cookies inválidas o vencidas, paginación de >1000 filas y cierre de sesión.
//   node scripts/test-admin.mjs
import { createHmac } from "node:crypto";
Object.assign(process.env, { SUPABASE_URL: "https://mock.supabase.co", SUPABASE_SERVICE_KEY: "service", ADMIN_CLAVE: "clave-de-prueba" });
const TOTAL = 1234;
globalThis.fetch = async (url) => {
  url = String(url);
  if (url.startsWith("https://mock.supabase.co/rest/v1/diagnosticos")) {
    const q = new URL(url).searchParams;
    const a = Number(q.get("offset") || 0), lim = Number(q.get("limit") || 1000);
    const rows = Array.from({ length: Math.max(0, Math.min(lim, TOTAL - a)) }, (_, i) => ({ id: a + i }));
    return new Response(JSON.stringify(rows), { status: 200, headers: { "content-type": "application/json" } });
  }
  throw new Error(`fetch inesperado ${url}`);
};
const { default: login } = await import("../netlify/functions/admin-login.mjs");
const { default: logout } = await import("../netlify/functions/admin-logout.mjs");
const { default: datos } = await import("../netlify/functions/admin-data.mjs");

let fallas = 0;
const esperar = (nombre, real, esperado) => { const ok = real === esperado; if (!ok) fallas++; console.log(`${ok ? "ok  " : "MAL "} ${nombre.padEnd(34)} ${real}${ok ? "" : ` (esperado ${esperado})`}`); };
const pedirLogin = (clave) => login(new Request("http://x/api/admin-login", { method: "POST", body: JSON.stringify({ clave }) }));
const pedirDatos = (cookie) => datos(new Request("http://x/api/admin-data", { headers: cookie ? { cookie } : {} }));

const bien = await pedirLogin("clave-de-prueba");
const setCookie = bien.headers.get("set-cookie") || "";
const cookie = setCookie.split(";")[0];
esperar("login con la clave", bien.status, 200);
esperar("cookie HttpOnly, Secure, SameSite", /HttpOnly/.test(setCookie) && /Secure/.test(setCookie) && /SameSite=Strict/.test(setCookie), true);
esperar("login con otra clave", (await pedirLogin("otra")).status, 401);
esperar("login sin clave", (await pedirLogin(undefined)).status, 401);

const r = await pedirDatos(`otra=1; ${cookie}`);
esperar("datos con la cookie", r.status, 200);
esperar("filas (paginadas de a 1000)", (await r.json()).diagnosticos.length, TOTAL);
esperar("datos sin cookie", (await pedirDatos(null)).status, 401);
const [nombre, valor] = cookie.split("=");
const [v, vence, firma] = valor.split(".");
esperar("firma adulterada", (await pedirDatos(`${nombre}=${v}.${vence}.${firma.slice(0, -2)}xx`)).status, 401);
esperar("vencimiento estirado", (await pedirDatos(`${nombre}=${v}.${Number(vence) + 999999}.${firma}`)).status, 401);
const vieja = `v1.${Math.floor(Date.now() / 1000) - 10}`;
esperar("cookie vencida (bien firmada)", (await pedirDatos(`${nombre}=${vieja}.${createHmac("sha256", "clave-de-prueba").update(vieja).digest("base64url")}`)).status, 401);
const { env } = await import("../netlify/lib/env.js");
env.ADMIN_CLAVE = "clave-nueva";
esperar("cambiar la clave cierra sesiones", (await pedirDatos(cookie)).status, 401);
const salida = await logout(new Request("http://x/api/admin-logout", { method: "POST" }));
esperar("logout borra la cookie", salida.status === 200 && /Max-Age=0/.test(salida.headers.get("set-cookie") || ""), true);
env.ADMIN_CLAVE = "";
esperar("sin ADMIN_CLAVE no entra nadie", (await pedirLogin("")).status, 500);
console.log(fallas ? `\n${fallas} fallas` : "\nTodo bien");
process.exit(fallas ? 1 : 0);
