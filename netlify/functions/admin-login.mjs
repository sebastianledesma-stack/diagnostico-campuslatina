// POST /api/admin-login  { clave }
// Si la clave coincide con ADMIN_CLAVE, deja la cookie de sesión del panel.
import { env, json } from "../lib/env.js";
import { claveCorrecta, cookieSesion } from "../lib/adminAuth.js";

export default async (req) => {
  if (req.method !== "POST") return json({ error: "Método no permitido" }, 405);
  if (!env.ADMIN_CLAVE) return json({ error: "Falta configurar ADMIN_CLAVE" }, 500);

  const { clave } = await req.json().catch(() => ({}));
  if (!claveCorrecta(clave)) {
    await new Promise((listo) => setTimeout(listo, 800)); // frena los intentos seguidos
    return json({ error: "Clave incorrecta" }, 401);
  }
  return json({ ok: true }, 200, { "Set-Cookie": cookieSesion() });
};

export const config = { path: "/api/admin-login" };
