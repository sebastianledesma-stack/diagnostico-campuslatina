// Smoke test de /api/admin-data con Supabase simulado (auth + paginación de >1000 filas).
Object.assign(process.env, { SUPABASE_URL: "https://mock.supabase.co", SUPABASE_SERVICE_KEY: "service", ADMIN_EMAILS: "seba@campuslatina.com, otro@campuslatina.com" });
const TOTAL = 1234;
const users = { "tok-admin": "Seba@CampusLatina.com", "tok-intruso": "alguien@gmail.com" };
globalThis.fetch = async (url, init = {}) => {
  url = String(url);
  const h = new Headers(init.headers);
  if (url.startsWith("https://mock.supabase.co/auth/v1/user")) {
    const email = users[(h.get("authorization") || "").replace("Bearer ", "")];
    return email
      ? new Response(JSON.stringify({ id: "u", email, aud: "authenticated" }), { status: 200, headers: { "content-type": "application/json" } })
      : new Response(JSON.stringify({ msg: "invalid JWT" }), { status: 401, headers: { "content-type": "application/json" } });
  }
  if (url.startsWith("https://mock.supabase.co/rest/v1/diagnosticos")) {
    const q = new URL(url).searchParams;
    const a = Number(q.get("offset") || 0), lim = Number(q.get("limit") || 1000);
    const rows = Array.from({ length: Math.max(0, Math.min(lim, TOTAL - a)) }, (_, i) => ({ id: a + i }));
    return new Response(JSON.stringify(rows), { status: 200, headers: { "content-type": "application/json" } });
  }
  throw new Error(`fetch inesperado ${url}`);
};
const { default: handler } = await import("../netlify/functions/admin-data.mjs");
const call = (tok) => handler(new Request("http://x/api/admin-data", { headers: tok ? { Authorization: `Bearer ${tok}` } : {} }));
const ok = await call("tok-admin"); const body = await ok.json();
console.log("admin     →", ok.status, body.email, body.diagnosticos.length, "filas");
console.log("intruso   →", (await call("tok-intruso")).status);
console.log("inválido  →", (await call("tok-x")).status);
console.log("sin token →", (await call(null)).status);
