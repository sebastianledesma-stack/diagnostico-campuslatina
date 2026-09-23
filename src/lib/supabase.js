// Cliente Supabase del navegador (anon key). Por RLS solo puede hacer INSERT en diagnosticos
// y usar Auth (magic link del panel /admin). Nunca lee diagnósticos directamente.
import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = url && anonKey ? createClient(url, anonKey) : null;

if (!supabase) console.warn("[supabase] Falta VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY: no se guardarán diagnósticos.");
