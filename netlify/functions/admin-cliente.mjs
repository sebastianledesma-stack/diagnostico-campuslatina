// POST /api/admin-cliente  { ids: [...], es_cliente }  (cookie de sesión del panel, ver /api/admin-login)
// Marca como cliente de Campus Latina (o le quita la marca) a una universidad: el panel manda los ids
// de todos sus diagnósticos. Necesita la columna de supabase/migrations/005_clientes.sql.
import { json } from "../lib/env.js";
import { verificarAdmin } from "../lib/adminAuth.js";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const MAX_IDS = 200;

export default async (req) => {
  if (req.method !== "POST") return json({ error: "Método no permitido" }, 405);

  const { db, error: sinAcceso } = await verificarAdmin(req);
  if (sinAcceso) return sinAcceso;

  const body = await req.json().catch(() => ({}));
  const ids = Array.isArray(body.ids) ? body.ids.map(String) : [];
  if (!ids.length || ids.length > MAX_IDS || !ids.every((id) => UUID.test(id)) || typeof body.es_cliente !== "boolean") {
    return json({ error: "Datos inválidos" }, 400);
  }

  const { data, error } = await db.from("diagnosticos").update({ es_cliente: body.es_cliente }).in("id", ids).select("id, es_cliente");
  if (error) {
    console.error("[admin-cliente]", error);
    // Sin la migración, la columna no existe (PostgREST: PGRST204 al escribir, 42703 al leer).
    if (["PGRST204", "42703"].includes(error.code)) return json({ error: "Falta correr la migración 005_clientes.sql en Supabase" }, 409);
    return json({ error: "Error de base de datos" }, 500);
  }
  if (!data?.length) return json({ error: "Diagnóstico no encontrado" }, 404);

  console.log(`[admin-cliente] ${body.es_cliente ? "marcados" : "desmarcados"} ${data.length}`);
  return json({ actualizados: data.length });
};

export const config = { path: "/api/admin-cliente" };
