// Cliente Supabase del navegador (anon key). Por RLS solo puede hacer INSERT en diagnosticos
// y usar Auth (magic link del panel /admin). Nunca lee diagnósticos directamente.
import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Si el link mágico vino vencido o ya usado, Supabase redirige con #error=… en la URL.
// Se lee antes de crear el cliente, que limpia la URL al inicializarse.
const hash = new URLSearchParams(typeof window !== "undefined" ? window.location.hash.slice(1) : "");
export const authRedirectError = hash.get("error")
  ? { code: hash.get("error_code") || hash.get("error"), message: hash.get("error_description") || "" }
  : null;

export const supabase = url && anonKey ? createClient(url, anonKey) : null;

if (!supabase) console.warn("[supabase] Falta VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY: no se guardarán diagnósticos.");
