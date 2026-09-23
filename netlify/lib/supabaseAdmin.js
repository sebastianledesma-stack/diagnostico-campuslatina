// Cliente Supabase con service role key: saltea RLS. Solo se usa del lado del servidor.
import { createClient } from "@supabase/supabase-js";
import { env } from "./env.js";

let client;
export function supabaseAdmin() {
  if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_KEY) throw new Error("Faltan SUPABASE_URL / SUPABASE_SERVICE_KEY");
  client ||= createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return client;
}
