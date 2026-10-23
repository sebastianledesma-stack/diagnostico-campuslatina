// Acceso al panel con una clave compartida (ADMIN_CLAVE). Al ingresar, /api/admin-login deja una
// cookie HttpOnly firmada con esa clave que vence a los 30 días; cambiar la clave cierra todas las sesiones.
import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import { env, json } from "./env.js";
import { supabaseAdmin } from "./supabaseAdmin.js";

const COOKIE = "cl_admin";
const DURACION = 30 * 24 * 3600; // segundos

const firmar = (datos) => createHmac("sha256", env.ADMIN_CLAVE).update(datos).digest("base64url");
// Comparación en tiempo constante (sobre los hashes, para que el largo tampoco se filtre).
const iguales = (a, b) => timingSafeEqual(createHash("sha256").update(String(a)).digest(), createHash("sha256").update(String(b)).digest());

export const claveCorrecta = (clave) => !!env.ADMIN_CLAVE && typeof clave === "string" && iguales(clave, env.ADMIN_CLAVE);

export function cookieSesion() {
  const datos = `v1.${Math.floor(Date.now() / 1000) + DURACION}`;
  return `${COOKIE}=${datos}.${firmar(datos)}; Path=/api; Max-Age=${DURACION}; HttpOnly; Secure; SameSite=Strict`;
}
export const cookieCierre = () => `${COOKIE}=; Path=/api; Max-Age=0; HttpOnly; Secure; SameSite=Strict`;

function sesionValida(req) {
  const valor = (req.headers.get("cookie") || "").split(/;\s*/).find((c) => c.startsWith(`${COOKIE}=`))?.slice(COOKIE.length + 1);
  const [version, vence, firma] = String(valor || "").split(".");
  if (version !== "v1" || !firma || !(Number(vence) > Date.now() / 1000)) return false;
  return iguales(firma, firmar(`${version}.${vence}`));
}

// Devuelve { db } o, si no hay sesión, la respuesta de error.
export async function verificarAdmin(req) {
  if (!env.ADMIN_CLAVE) return { error: json({ error: "Falta configurar ADMIN_CLAVE" }, 500) };
  if (!sesionValida(req)) return { error: json({ error: "No autenticado" }, 401) };
  return { db: supabaseAdmin() };
}
