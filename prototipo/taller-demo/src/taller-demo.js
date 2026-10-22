// Solo para el link de prueba del taller: la base del taller corre dentro del navegador (PGlite, la misma
// migración 003 que en Supabase) con la sesión DEMO sembrada. No se conecta a la base real ni envía mails.
// Las pestañas del mismo navegador comparten la base (un worker con elección de líder); cada dispositivo tiene la suya.
import { PGliteWorker } from "@electric-sql/pglite/worker";

const PREFIJO = "/taller-api/rest/v1/rpc/";
let base;
const abrir = () => (base ||= PGliteWorker.create(new Worker(new URL("./taller-demo-worker.js", import.meta.url), { type: "module" })));

async function llamar(db, fn, args = {}) {
  if (!/^taller_[a-z_]+$/.test(fn)) throw Object.assign(new Error("Función desconocida"), { status: 404 });
  const nombres = Object.keys(args);
  if (nombres.some((n) => !/^p_[a-z_]+$/.test(n))) throw Object.assign(new Error("Argumento inválido"), { status: 400 });
  const sql = `select public.${fn}(${nombres.map((n, i) => `${n} => $${i + 1}`).join(", ")}) as r`;
  return db.transaction(async (tx) => {
    await tx.exec("set local role anon");
    const { rows } = await tx.query(sql, nombres.map((n) => args[n]));
    return rows[0].r;
  });
}

const json = (o, status = 200) => new Response(JSON.stringify(o), { status, headers: { "Content-Type": "application/json" } });
const original = window.fetch.bind(window);
window.fetch = async (input, init = {}) => {
  const url = typeof input === "string" ? input : input?.url || "";
  let ruta;
  try { ruta = new URL(url, location.href).pathname; } catch { ruta = url; }
  let args = {};
  try { args = init.body ? JSON.parse(init.body) : {}; } catch { args = {}; }
  // El informe por email: en el link de prueba no se arma ni se envía.
  if (ruta.startsWith("/api/taller/informe")) {
    try {
      const db = await abrir();
      await llamar(db, "taller_estado", { p_codigo: args.codigo, p_participante: args.participante });
      return json({ ok: true, prueba: true });
    } catch (err) { return json({ message: err.message }, 400); }
  }
  if (!ruta.startsWith(PREFIJO)) return original(input, init);
  try {
    return json(await llamar(await abrir(), ruta.slice(PREFIJO.length), args));
  } catch (err) {
    return json({ code: err.code || null, message: err.message }, err.status || (err.code === "42501" ? 401 : 400));
  }
};
