import { PGlite } from "@electric-sql/pglite";
import { worker } from "@electric-sql/pglite/worker";
import MIGRACION from "../../../supabase/migrations/003_taller.sql?raw";

const ROLES = ["anon", "authenticated", "service_role"]
  .map((r) => `do $$ begin create role ${r} nologin; exception when duplicate_object then null; end $$;`).join("\n");

worker({
  async init() {
    const db = new PGlite("idb://campuslatina-taller-prueba");
    await db.exec(ROLES);
    await db.exec(MIGRACION);
    const { rows } = await db.query("select 1 from public.taller_sesiones where codigo = $1", ["DEMO"]);
    if (!rows.length) await db.query("select public.taller_sembrar($1, $2) as r", ["DEMO", "demo2026"]);
    return db;
  },
});
