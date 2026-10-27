// GET /api/admin-taller[?sesion=CODIGO]  (cookie de sesión del panel, ver /api/admin-login)
// Las sesiones del Diagnóstico colectivo (taller en vivo) y, de la elegida, cada participante con sus
// respuestas y el email con el que pidió el PDF (su identificación; si no lo pidió, queda anónimo).
// Sin sesión elegida: REALCUP si existe, si no la más reciente que no sea de prueba.
import { json } from "../lib/env.js";
import { verificarAdmin } from "../lib/adminAuth.js";

const PAGE = 1000; // máximo de filas por request en Supabase
const CODIGO = /^[A-Z0-9]{4,8}$/;

// Todas las filas de una consulta, de a PAGE (las respuestas de 300 personas son 8.400 filas).
async function todas(consulta) {
  const filas = [];
  for (let desde = 0; ; desde += PAGE) {
    const { data, error } = await consulta().range(desde, desde + PAGE - 1);
    if (error) throw error;
    filas.push(...data);
    if (data.length < PAGE) return filas;
  }
}

export default async (req) => {
  if (req.method !== "GET") return json({ error: "Método no permitido" }, 405);

  const { db, error: sinAcceso } = await verificarAdmin(req);
  if (sinAcceso) return sinAcceso;

  try {
    const sesiones = await todas(() => db.from("taller_sesiones").select("id, codigo, nombre, demo, fase, created_at").order("created_at", { ascending: false }));
    const pedida = String(new URL(req.url).searchParams.get("sesion") || "").toUpperCase();
    const sesion = (CODIGO.test(pedida) && sesiones.find((s) => s.codigo === pedida))
      || sesiones.find((s) => s.codigo === "REALCUP") || sesiones.find((s) => !s.demo) || sesiones[0];
    const lista = sesiones.map(({ id, ...s }) => s);
    if (!sesion) return json({ sesiones: lista, sesion: null, participantes: [] });

    const [participantes, respuestas, envios] = await Promise.all([
      todas(() => db.from("taller_participantes").select("id, orden, origen, creado_at").eq("sesion_id", sesion.id).order("orden")),
      todas(() => db.from("taller_respuestas").select("participante_id, pregunta, letra").eq("sesion_id", sesion.id).order("participante_id").order("pregunta")),
      todas(() => db.from("taller_envios").select("participante_id, email, enviado_at, error").eq("sesion_id", sesion.id).order("id")),
    ]);
    const porPersona = new Map(participantes.map((p) => [p.id, { ...p, r: {}, email: "", informe: null, envios: 0 }]));
    for (const r of respuestas) porPersona.get(r.participante_id) && (porPersona.get(r.participante_id).r[r.pregunta] = r.letra);
    // El último email que pidió el PDF es el que identifica a la persona.
    for (const e of envios) {
      const p = porPersona.get(e.participante_id);
      if (!p) continue;
      p.email = e.email;
      p.envios += 1;
      if (e.enviado_at) p.informe = e.enviado_at;
    }
    const { id, ...datosSesion } = sesion;
    return json({ sesiones: lista, sesion: datosSesion, participantes: [...porPersona.values()].map(({ id: _, ...p }) => p) });
  } catch (error) {
    console.error("[admin-taller]", error);
    return json({ error: "Error de base de datos" }, 500);
  }
};

export const config = { path: "/api/admin-taller" };
