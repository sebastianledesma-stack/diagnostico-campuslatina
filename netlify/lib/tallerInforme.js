// Pedido del informe del taller por email: valida (en la base), arma el PDF con la mirada de la
// persona y la de la sala, lo guarda en Supabase Storage, lo envía y deja registrado cómo salió.
// Las operaciones de base, archivo y mail llegan como `io` para usar lo mismo en producción
// (Supabase + Resend, netlify/functions/taller-informe.mjs) y en la base local (scripts/taller-local.mjs).
import { generarInformeTaller } from "./pdfTaller.js";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
// Errores de datos que la base devuelve con nombre y el teléfono sabe explicar.
const CONOCIDOS = new Set(["sesion_no_encontrada", "todavia_no", "email_invalido", "no_registrado", "demasiados_envios"]);

export async function procesarInforme({ codigo, participante, email } = {}, io) {
  if (typeof codigo !== "string" || !UUID.test(String(participante || "")) || typeof email !== "string" || email.length > 254) {
    return { status: 400, cuerpo: { message: "datos_invalidos" } };
  }
  let datos;
  try {
    datos = await io.iniciar(codigo, participante, email);
  } catch (err) {
    const codigoError = String(err.message || "").match(/[a-z_]+/)?.[0];
    if (CONOCIDOS.has(codigoError)) return { status: 400, cuerpo: { message: codigoError } };
    console.error("[taller-informe] iniciar", err);
    return { status: 500, cuerpo: { message: "error" } };
  }

  const fecha = new Date();
  const pdf = await generarInformeTaller(datos, fecha);
  const ruta = rutaInforme(datos.codigo, participante, datos.envio, fecha);
  let guardado = true;
  try {
    await io.guardar(ruta, pdf);
  } catch (err) {
    guardado = false;
    console.error("[taller-informe] guardar", err);
  }
  const ok = await io.enviar(mailInforme(datos, pdf), { idempotencyKey: `taller-envio-${datos.envio}` });
  await io.terminar(datos.envio, guardado ? ruta : null, ok, ok ? null : "no se pudo enviar el mail");
  return ok ? { status: 200, cuerpo: { ok: true } } : { status: 502, cuerpo: { message: "envio_fallido" } };
}

// Dónde queda el PDF en Storage (bucket taller-informes). También lo usa scripts/taller-reenviar.mjs.
export const rutaInforme = (codigo, participante, envio, fecha = new Date()) =>
  `${codigo}/${fecha.toISOString().slice(0, 10)}-${participante}-${envio}.pdf`;

// El mail con el PDF adjunto. También lo usa scripts/taller-reenviar.mjs, para que el reenvío sea idéntico.
export function mailInforme({ email, nombre }, pdf) {
  return {
    to: email,
    subject: `Su informe del Diagnóstico colectivo · ${nombre}`,
    html: htmlMail(nombre),
    attachments: [{ filename: "diagnostico-colectivo.pdf", content: pdf }],
  };
}

const escapar = (t) => String(t).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);

function htmlMail(nombre) {
  return `<!doctype html><html lang="es"><body style="margin:0;padding:0;background:#EAF3F4">
<div style="max-width:560px;margin:0 auto;padding:32px 24px;font-family:Arial,Helvetica,sans-serif;color:#1F3A40;font-size:15px;line-height:1.6">
  <p style="font-size:12px;letter-spacing:1.5px;text-transform:uppercase;color:#4D6166;margin:0">Diagnóstico colectivo · ${escapar(nombre)}</p>
  <h1 style="font-size:24px;color:#123A42;margin:8px 0 16px">El viaje invisible del aspirante</h1>
  <p>Gracias por participar. Adjuntamos el informe en PDF con su mirada sobre su universidad y la de la sala: dónde coincidió con el resto, dónde no, y las ideas que la sala eligió para subir el puntaje.</p>
  <p style="color:#4D6166;font-size:13px;margin-top:24px">Campus Latina</p>
</div></body></html>`;
}
