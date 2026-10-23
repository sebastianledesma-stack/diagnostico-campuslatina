// POST /api/admin-logout: borra la cookie de sesión del panel.
import { json } from "../lib/env.js";
import { cookieCierre } from "../lib/adminAuth.js";

export default async (req) => {
  if (req.method !== "POST") return json({ error: "Método no permitido" }, 405);
  return json({ ok: true }, 200, { "Set-Cookie": cookieCierre() });
};

export const config = { path: "/api/admin-logout" };
