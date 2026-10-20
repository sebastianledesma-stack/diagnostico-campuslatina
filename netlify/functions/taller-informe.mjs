// POST /api/taller/informe  { codigo, participante, email }
// Al cierre del taller, cada asistente pide el PDF con su mirada y la de la sala. La validación y los
// topes están en la base (taller_envio_iniciar); el PDF queda en Storage (bucket taller-informes).
import { json } from "../lib/env.js";
import { supabaseAdmin } from "../lib/supabaseAdmin.js";
import { enviarMail } from "../lib/mailer.js";
import { procesarInforme } from "../lib/tallerInforme.js";

export default async (req) => {
  if (req.method !== "POST") return json({ message: "Método no permitido" }, 405);
  const body = await req.json().catch(() => ({}));
  const db = supabaseAdmin();
  const llamar = async (fn, args) => {
    const { data, error } = await db.rpc(fn, args);
    if (error) throw new Error(error.message);
    return data;
  };
  const r = await procesarInforme(body, {
    iniciar: (codigo, participante, email) => llamar("taller_envio_iniciar", { p_codigo: codigo, p_participante: participante, p_email: email }),
    guardar: async (ruta, pdf) => {
      const { error } = await db.storage.from("taller-informes").upload(ruta, pdf, { contentType: "application/pdf", upsert: true });
      if (error) throw error;
    },
    enviar: (payload, opciones) => enviarMail(payload, opciones),
    terminar: (envio, ruta, ok, error) => llamar("taller_envio_terminar", { p_envio: envio, p_archivo: ruta, p_ok: ok, p_error: error }),
  });
  return json(r.cuerpo, r.status);
};

export const config = { path: "/api/taller/informe" };
