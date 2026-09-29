// POST /api/guardar  { id, universidad, pais, nombre, cargo, email, whatsapp, respuestas }
// Plan B del guardado: el navegador inserta directo en Supabase, pero si esa conexión falla
// (bloqueadores, redes corporativas, cortes) persist.js manda la fila acá y la inserta el servidor.
// Mismas reglas que el INSERT anónimo: los puntajes se recalculan acá y los flags de envío
// arrancan en false. Después el navegador llama a /api/notify como siempre.
import { json } from "../lib/env.js";
import { supabaseAdmin } from "../lib/supabaseAdmin.js";
import { calcResultados } from "../../src/lib/scoring.js";
import { ETAPAS_DATA } from "../../src/data/etapas.js";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const LETRAS = new Set(["A", "B", "C", "D"]);
const CLAVES = new Set(ETAPAS_DATA.flatMap((e) => e.preguntas.map((_, i) => `${e.id}_${i}`)));

const texto = (v, max) => (typeof v === "string" ? v.trim().slice(0, max) : "");

export default async (req) => {
  if (req.method !== "POST") return json({ error: "Método no permitido" }, 405);
  const b = await req.json().catch(() => null);
  if (!b || !UUID.test(String(b.id || ""))) return json({ error: "id inválido" }, 400);

  const respuestas = {};
  for (const [k, v] of Object.entries(b.respuestas || {})) {
    if (CLAVES.has(k) && LETRAS.has(v)) respuestas[k] = v;
  }
  const row = {
    id: b.id,
    universidad: texto(b.universidad, 200),
    pais: texto(b.pais, 60),
    nombre: texto(b.nombre, 200),
    cargo: texto(b.cargo, 200) || null,
    email: texto(b.email, 254).toLowerCase(),
    whatsapp: texto(b.whatsapp, 40),
    respuestas,
    ...calcResultados(respuestas),
  };
  if (!row.universidad || !row.pais || !row.nombre || !EMAIL.test(row.email) || row.whatsapp.length < 4 || Object.keys(respuestas).length !== CLAVES.size) {
    return json({ error: "Datos incompletos" }, 400);
  }

  const { error } = await supabaseAdmin().from("diagnosticos").insert(row);
  // 23505: la fila ya existe (el INSERT del navegador llegó aunque su respuesta se perdió).
  if (error && error.code !== "23505") {
    console.error("[guardar] INSERT", error);
    return json({ error: "Error de base de datos" }, 500);
  }
  return json({ ok: true });
};

export const config = { path: "/api/guardar" };
