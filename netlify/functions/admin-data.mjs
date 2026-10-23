// GET /api/admin-data  (cookie de sesión del panel, ver /api/admin-login)
// Devuelve todos los diagnósticos leídos con la service key.
import { json } from "../lib/env.js";
import { verificarAdmin } from "../lib/adminAuth.js";

const PAGE = 1000; // máximo de filas por request en Supabase
const MAX_ROWS = 50000; // tope de seguridad

export default async (req) => {
  if (req.method !== "GET") return json({ error: "Método no permitido" }, 405);

  const { db, error: sinAcceso } = await verificarAdmin(req);
  if (sinAcceso) return sinAcceso;

  const rows = [];
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await db
      .from("diagnosticos")
      .select("*")
      .order("created_at", { ascending: false })
      .range(from, from + PAGE - 1);
    if (error) {
      console.error("[admin-data]", error);
      return json({ error: "Error de base de datos" }, 500);
    }
    rows.push(...data);
    if (data.length < PAGE || rows.length >= MAX_ROWS) break;
  }

  return json({ diagnosticos: rows });
};

export const config = { path: "/api/admin-data" };
