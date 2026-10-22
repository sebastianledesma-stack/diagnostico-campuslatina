// Acceso al panel: verifica la sesión de Supabase Auth (Authorization: Bearer <access_token>)
// y que el email esté en ADMIN_EMAILS. Devuelve { db, email } o, si no hay acceso, la respuesta de error.
import { env, json } from "./env.js";
import { supabaseAdmin } from "./supabaseAdmin.js";

export async function verificarAdmin(req) {
  const token = (req.headers.get("authorization") || "").replace(/^Bearer\s+/i, "");
  if (!token) return { error: json({ error: "No autenticado" }, 401) };

  const db = supabaseAdmin();
  const { data: auth, error: authErr } = await db.auth.getUser(token);
  if (authErr || !auth?.user) return { error: json({ error: "Sesión inválida" }, 401) };

  const email = String(auth.user.email || "").toLowerCase();
  if (!env.ADMIN_EMAILS.includes(email)) return { error: json({ error: "Sin acceso al panel" }, 403) };

  return { db, email };
}
