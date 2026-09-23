// GET /api/admin-data  (Authorization: Bearer <access_token de Supabase Auth>)
// Verifica la sesión del magic link, controla que el email esté en ADMIN_EMAILS
// y devuelve todos los diagnósticos leídos con la service key.
import { env, json } from "../lib/env.js";
import { supabaseAdmin } from "../lib/supabaseAdmin.js";

const PAGE = 1000; // máximo de filas por request en Supabase
const MAX_ROWS = 50000; // tope de seguridad

export default async (req) => {
  if (req.method !== "GET") return json({ error: "Método no permitido" }, 405);

  const token = (req.headers.get("authorization") || "").replace(/^Bearer\s+/i, "");
  if (!token) return json({ error: "No autenticado" }, 401);

  const db = supabaseAdmin();
  const { data: auth, error: authErr } = await db.auth.getUser(token);
  if (authErr || !auth?.user) return json({ error: "Sesión inválida" }, 401);

  const email = String(auth.user.email || "").toLowerCase();
  if (!env.ADMIN_EMAILS.includes(email)) return json({ error: "Sin acceso al panel" }, 403);

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

  return json({ email, diagnosticos: rows });
};

export const config = { path: "/api/admin-data" };
