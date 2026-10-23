// POST /api/admin-test  { id, es_test }  (cookie de sesión del panel, ver /api/admin-login)
// Marca un diagnóstico como test (o le quita la marca). Los tests no cuentan en las métricas,
// el CSV ni el informe consolidado del panel. Necesita la columna de supabase/migrations/004_tests.sql.
import { json } from "../lib/env.js";
import { verificarAdmin } from "../lib/adminAuth.js";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async (req) => {
  if (req.method !== "POST") return json({ error: "Método no permitido" }, 405);

  const { db, error: sinAcceso } = await verificarAdmin(req);
  if (sinAcceso) return sinAcceso;

  const body = await req.json().catch(() => ({}));
  if (!UUID.test(String(body.id || "")) || typeof body.es_test !== "boolean") return json({ error: "Datos inválidos" }, 400);

  const { data, error } = await db.from("diagnosticos").update({ es_test: body.es_test }).eq("id", body.id).select("id, es_test");
  if (error) {
    console.error("[admin-test]", error);
    // Sin la migración, la columna no existe (PostgREST: PGRST204 al escribir, 42703 al leer).
    if (["PGRST204", "42703"].includes(error.code)) return json({ error: "Falta correr la migración 004_tests.sql en Supabase" }, 409);
    return json({ error: "Error de base de datos" }, 500);
  }
  if (!data?.length) return json({ error: "Diagnóstico no encontrado" }, 404);

  console.log(`[admin-test] ${body.es_test ? "marcado" : "desmarcado"} ${body.id}`);
  return json(data[0]);
};

export const config = { path: "/api/admin-test" };
