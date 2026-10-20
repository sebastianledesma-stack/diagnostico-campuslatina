// Base local del taller, sin Supabase: Postgres en proceso (PGlite) con la migración 003 y una API
// que imita las RPC de Supabase (POST /rest/v1/rpc/<función>). Cada llamada corre con el rol anon,
// así que también prueba los permisos. La usan `npm run taller:local` (vía vite.config.js) y
// scripts/test-taller.mjs. Los datos quedan en .taller-local/ y sobreviven a reiniciar el servidor.
import { readFileSync, statSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { PGlite } from "@electric-sql/pglite";

const MIGRACION = new URL("../supabase/migrations/003_taller.sql", import.meta.url);

// Sesión de demo que la base local siembra sola (46 participantes sintéticos con todas las respuestas).
// Es solo local: en Supabase se siembra a mano con otra clave (ver README).
export const DEMO = { codigo: "DEMO", clave: "demo2026" };

export async function sembrarDemo(db, { cierre = false } = {}) {
  const { rows } = await db.query("select public.taller_sembrar($1, $2, p_cierre => $3) as r", [DEMO.codigo, DEMO.clave, cierre]);
  return rows[0].r;
}

// Roles que en Supabase ya existen.
const ROLES = ["anon", "authenticated", "service_role"]
  .map((r) => `do $$ begin create role ${r} nologin; exception when duplicate_object then null; end $$;`)
  .join("\n");

// dir = carpeta de datos; sin dir, la base vive en memoria (tests).
export async function abrirBase(dir) {
  const db = new PGlite(dir);
  await db.exec(ROLES);
  await db.exec(readFileSync(MIGRACION, "utf8"));
  return db;
}

// Llama a una función taller_* con argumentos con nombre, como hace la API de Supabase.
export async function llamar(db, fn, args = {}) {
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

// Plugin de Vite: atiende /taller-api/rest/v1/rpc/<función> con la base local.
export function tallerLocal({ dir = ".taller-local", prefijo = "/taller-api" } = {}) {
  let base;
  let version = statSync(MIGRACION).mtimeMs;
  const abrir = async () => {
    const db = await (base ||= abrirBase(dir).then(async (db) => {
      const { rows } = await db.query("select 1 from public.taller_sesiones where codigo = $1", [DEMO.codigo]);
      if (!rows.length) await sembrarDemo(db);
      console.log(`[taller-local] base local lista en ${dir}/ · demo en /f/${DEMO.codigo}`);
      return db;
    }));
    // Si se editó la migración, se vuelve a aplicar sin reiniciar el servidor (es idempotente).
    const ahora = statSync(MIGRACION).mtimeMs;
    if (ahora !== version) {
      version = ahora;
      await db.exec(readFileSync(MIGRACION, "utf8"));
      console.log("[taller-local] migración 003 aplicada de nuevo");
    }
    return db;
  };
  const middleware = async (req, res, next) => {
    // Informe por email (en producción, netlify/functions/taller-informe.mjs). Acá el PDF queda en
    // .taller-local/informes/ y el mail no se envía: solo se registra en la consola.
    if (req.method === "POST" && req.url.startsWith("/api/taller/informe")) {
      res.setHeader("Content-Type", "application/json");
      try {
        const { procesarInforme } = await import("../netlify/lib/tallerInforme.js");
        const db = await abrir();
        const chunks = [];
        for await (const c of req) chunks.push(c);
        const r = await procesarInforme(JSON.parse(Buffer.concat(chunks).toString("utf8") || "{}"), {
          iniciar: async (codigo, participante, email) =>
            (await db.query("select public.taller_envio_iniciar($1, $2, $3) as r", [codigo, participante, email])).rows[0].r,
          guardar: async (ruta, pdf) => {
            const archivo = join(dir, "informes", ruta);
            mkdirSync(dirname(archivo), { recursive: true });
            writeFileSync(archivo, pdf);
            console.log(`[taller-local] PDF guardado en ${archivo}`);
          },
          enviar: async (payload) => {
            console.log(`[taller-local] mail (no se envía en local) → ${payload.to} · ${payload.subject}`);
            return true;
          },
          terminar: async (envio, ruta, ok, error) => {
            await db.query("select public.taller_envio_terminar($1, $2, $3, $4)", [envio, ruta, ok, error]);
          },
        });
        res.statusCode = r.status;
        return res.end(JSON.stringify(r.cuerpo));
      } catch (err) {
        console.error("[taller-local] informe", err);
        res.statusCode = 500;
        return res.end(JSON.stringify({ message: "error" }));
      }
    }
    // Volver a sembrar la demo (npm run taller:sembrar). Solo existe en la base local.
    if (req.method === "POST" && req.url.startsWith(`${prefijo}/sembrar`)) {
      res.setHeader("Content-Type", "application/json");
      try {
        const r = await sembrarDemo(await abrir(), { cierre: req.url.includes("cierre=1") });
        return res.end(JSON.stringify(r));
      } catch (err) {
        res.statusCode = 500;
        return res.end(JSON.stringify({ message: err.message }));
      }
    }
    const m = req.url.match(new RegExp(`^${prefijo}/rest/v1/rpc/([a-z_]+)`));
    if (!m) return next();
    res.setHeader("Content-Type", "application/json");
    if (req.method !== "POST") { res.statusCode = 405; return res.end(JSON.stringify({ message: "Método no permitido" })); }
    try {
      const chunks = [];
      for await (const c of req) chunks.push(c);
      const args = chunks.length ? JSON.parse(Buffer.concat(chunks).toString("utf8")) : {};
      const r = await llamar(await abrir(), m[1], args);
      res.end(JSON.stringify(r));
    } catch (err) {
      // Mismo formato de error que Supabase: { code, message }.
      res.statusCode = err.status || (err.code === "42501" ? 401 : 400);
      res.end(JSON.stringify({ code: err.code || null, message: err.message }));
    }
  };
  return {
    name: "taller-local",
    configureServer(server) { server.middlewares.use(middleware); },
    configurePreviewServer(server) { server.middlewares.use(middleware); },
  };
}
