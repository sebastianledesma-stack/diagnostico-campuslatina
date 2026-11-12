// API del diagnóstico colaborativo. El link secreto /d/<clave> es la única credencial.
//   POST /api/diagnostico               crea el diagnóstico (datos del formulario) → { clave }
//   GET  /api/d/<clave>                 estado, respuestas y quién respondió cada etapa
//   POST /api/d/<clave>/etapa           guarda las 4 respuestas de una etapa
//   POST /api/d/<clave>/invitar         invita a un colega a completar algunas etapas
//   POST /api/d/<clave>/finalizar       con las 7 etapas completas: calcula, cierra y envía el informe
import { json } from "../lib/env.js";
import { supabaseAdmin } from "../lib/supabaseAdmin.js";
import { enviarMail } from "../lib/mailer.js";
import { mailEnCurso, mailInvitacion } from "../lib/emails.js";
import {
  LETRAS, EMAIL, texto, nuevaClave, hashClave, nuevoId, linkDe,
  buscarPorClave, etapasCompletas, vistaPublica, notificar,
} from "../lib/diagnostico.js";
import { ETAPAS_DATA } from "../../src/data/etapas.js";
import { calcResultados } from "../../src/lib/scoring.js";
import { esRangoValido, esMetaValida, esTarget } from "../../src/data/calificacion.js";

const ETAPAS = new Map(ETAPAS_DATA.map((e) => [e.id, e]));

export default async (req, context) => {
  try {
    const { clave, accion } = context.params || {};
    if (!clave) return req.method === "POST" ? await crear(req) : json({ error: "Método no permitido" }, 405);

    const d = await buscarPorClave(clave);
    if (!d) return json({ error: "Diagnóstico no encontrado" }, 404);

    if (!accion && req.method === "GET") return json(vistaPublica(d));
    if (req.method !== "POST") return json({ error: "Método no permitido" }, 405);
    const body = await req.json().catch(() => ({}));
    if (accion === "etapa") return await guardarEtapa(d, clave, body);
    if (accion === "invitar") return await invitar(d, clave, body);
    if (accion === "finalizar") return await finalizar(d, clave);
    return json({ error: "Acción desconocida" }, 404);
  } catch (err) {
    console.error("[diagnostico]", err);
    return json({ error: "Error del servidor" }, 500);
  }
};

async function crear(req) {
  const b = await req.json().catch(() => ({}));
  const row = {
    universidad: texto(b.universidad, 200),
    pais: texto(b.pais, 60),
    nombre: texto(b.nombre, 200),
    cargo: texto(b.cargo, 200) || null,
    email: texto(b.email, 254).toLowerCase(),
    whatsapp: texto(b.whatsapp, 40),
    alumnos_actuales: texto(b.alumnos_actuales, 20),
    alumnos_meta: texto(b.alumnos_meta, 20),
  };
  if (!row.universidad || !row.pais || !row.nombre || !EMAIL.test(row.email) || row.whatsapp.length < 4
    || !esRangoValido(row.alumnos_actuales) || !esMetaValida(row.alumnos_meta)) {
    return json({ error: "Datos incompletos" }, 400);
  }
  const clave = nuevaClave();
  const nuevo = {
    ...row,
    estado: "en_curso",
    clave_hash: hashClave(clave),
    target: esTarget(row.alumnos_actuales, row.alumnos_meta),
    respuestas: {},
  };
  const { data, error } = await supabaseAdmin().from("diagnosticos").insert(nuevo).select("*").single();
  if (error) {
    console.error("[diagnostico] INSERT", error);
    return json({ error: "Error de base de datos" }, 500);
  }
  // Link para retomar o compartir; si falla el mail, el diagnóstico sigue igual.
  await enviarMail({ to: data.email, ...mailEnCurso(data, { link: linkDe(clave) }) }, { idempotencyKey: `en-curso/${data.id}` });
  return json({ clave, ...vistaPublica(data) });
}

async function guardarEtapa(d, clave, b) {
  if (d.estado !== "en_curso") return json({ error: "El diagnóstico ya está completo" }, 409);
  const etapa = ETAPAS.get(b.etapa);
  if (!etapa) return json({ error: "Etapa inválida" }, 400);
  const respuestas = {};
  etapa.preguntas.forEach((_, i) => {
    const k = `${etapa.id}_${i}`;
    if (LETRAS.has(b.respuestas?.[k])) respuestas[k] = b.respuestas[k];
  });
  if (Object.keys(respuestas).length !== etapa.preguntas.length) return json({ error: "Faltan respuestas de la etapa" }, 400);

  const por = { nombre: texto(b.quien, 100) || d.nombre, at: new Date().toISOString() };
  const { data, error } = await supabaseAdmin().rpc("guardar_etapa", {
    p_clave_hash: hashClave(clave), p_respuestas: respuestas, p_etapa: etapa.id, p_por: por,
  });
  if (error || !data?.length) {
    console.error("[diagnostico] guardar_etapa", error);
    return json({ error: "No se pudo guardar la etapa" }, 500);
  }
  return json(vistaPublica(data[0]));
}

async function invitar(d, clave, b) {
  if (d.estado !== "en_curso") return json({ error: "El diagnóstico ya está completo" }, 409);
  const colaborador = {
    id: nuevoId(),
    nombre: texto(b.nombre, 100),
    email: texto(b.email, 254).toLowerCase(),
    etapas: [...new Set((Array.isArray(b.etapas) ? b.etapas : []).filter((id) => ETAPAS.has(id)))],
    at: new Date().toISOString(),
  };
  if (!colaborador.nombre || !EMAIL.test(colaborador.email)) return json({ error: "Nombre y mail del colega" }, 400);
  if ((d.colaboradores || []).some((c) => c.email === colaborador.email)) return json({ error: "Ese colega ya fue invitado" }, 409);

  const { data, error } = await supabaseAdmin().rpc("agregar_colaborador", { p_clave_hash: hashClave(clave), p_colaborador: colaborador });
  if (error) {
    console.error("[diagnostico] agregar_colaborador", error);
    return json({ error: "No se pudo invitar" }, 500);
  }
  if (!data?.length) return json({ error: "Se alcanzó el máximo de 10 colegas" }, 409);

  const enviado = await enviarMail({
    to: colaborador.email,
    replyTo: d.email,
    ...mailInvitacion(d, {
      link: linkDe(clave, `?inv=${colaborador.id}`),
      invitado: colaborador.nombre,
      de: texto(b.de, 100) || d.nombre,
      etapas: colaborador.etapas,
      mensaje: texto(b.mensaje, 300),
    }),
  }, { idempotencyKey: `invitacion/${d.id}/${colaborador.id}` });
  return json({ ...vistaPublica(data[0]), invitacion_enviada: enviado });
}

async function finalizar(d, clave) {
  if (d.estado === "en_curso") {
    if (etapasCompletas(d.respuestas).length !== ETAPAS_DATA.length) return json({ error: "Faltan etapas por completar" }, 409);
    const { data, error } = await supabaseAdmin()
      .from("diagnosticos")
      .update({ ...calcResultados(d.respuestas), estado: "completo", actualizado_at: new Date().toISOString() })
      .eq("id", d.id)
      .eq("estado", "en_curso")
      .select("*");
    if (error) {
      console.error("[diagnostico] finalizar", error);
      return json({ error: "No se pudo cerrar el diagnóstico" }, 500);
    }
    // Si otro colega lo cerró en el mismo instante, se sigue con la fila ya cerrada.
    d = data?.[0] || (await buscarPorClave(clave));
  }
  const envio = d.mail_enviado && d.notif_enviada ? { mail_enviado: true } : await notificar(d, { clave });
  return json({ ...vistaPublica({ ...d, mail_enviado: envio.mail_enviado }), envio: envio.mail_enviado ? "enviado" : "error" });
}

export const config = { path: ["/api/diagnostico", "/api/d/:clave", "/api/d/:clave/:accion"] };
