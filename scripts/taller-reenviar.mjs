// Reenvía el informe del taller a quienes lo pidieron y no les llegó.
//
// Lee los pedidos (taller_envios) de una sesión con la service key de .env.local y toma el último
// pedido de cada persona: si no salió, manda el mismo PDF que quedó en Storage (o lo vuelve a armar
// con sus respuestas si no se llegó a guardar) y lo marca como enviado, así figura en el admin.
// Sin --enviar no manda nada: solo muestra la lista.
//
// Uso:
//   npm run taller:reenviar                        lista los pendientes de REALCUP
//   npm run taller:reenviar -- PRUEBA              lista los de otra sesión
//   npm run taller:reenviar -- --enviar            los reenvía
//   npm run taller:reenviar -- --envio 16          solo ese pedido, aunque ya figure enviado (con --enviar, lo manda)
//   npm run taller:reenviar -- --pdf carpeta       guarda los PDF en esa carpeta en lugar de enviarlos
//   npm run taller:reenviar -- --rearmar           arma el PDF de nuevo aunque haya uno guardado
//
// Pendiente = el último pedido de la persona no tiene fecha de envío y, o falló, o lleva más de
// 2 minutos sin respuesta (el servidor se cortó). Los de menos de 2 minutos pueden estar en curso.
// Si a ese mismo email ya le llegó un pedido anterior, no se repite.
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const EN_CURSO_MS = 2 * 60 * 1000;
const PAUSA_MS = 300; // Resend admite 10 pedidos por segundo por equipo: de a uno sobra.

// Qué pedidos hay que reenviar. `envio` fuerza uno puntual, haya salido o no.
export function pendientes(envios, { ahora = Date.now(), envio = null } = {}) {
  if (envio != null) return envios.filter((e) => e.id === envio);
  const ultimo = new Map();
  for (const e of envios) {
    if (!ultimo.has(e.participante_id) || e.id > ultimo.get(e.participante_id).id) ultimo.set(e.participante_id, e);
  }
  const yaLlego = (e) => envios.some((o) => o.participante_id === e.participante_id && o.email === e.email && o.enviado_at);
  return [...ultimo.values()]
    .filter((e) => !e.enviado_at && !yaLlego(e) && (e.error || ahora - Date.parse(e.creado_at) > EN_CURSO_MS))
    .sort((a, b) => a.id - b.id);
}

// Los mismos datos que arma taller_envio_iniciar (003_taller.sql), a partir de las tablas, para
// rearmar el PDF sin crear un pedido nuevo.
export function datosDesdeTablas({ sesion, participantes, respuestas, envio }) {
  const porPersona = new Map(participantes.map((p) => [p.id, {}]));
  for (const r of respuestas) {
    const mias = porPersona.get(r.participante_id);
    if (mias) mias[r.pregunta] = r.letra;
  }
  const filas = [...participantes]
    .sort((a, b) => a.orden - b.orden)
    .map((p, i) => ({ n: i + 1, origen: p.origen, r: porPersona.get(p.id) }));
  return {
    envio: envio.id, codigo: sesion.codigo, nombre: sesion.nombre, email: envio.email,
    mias: porPersona.get(envio.participante_id) || {}, elegidas: sesion.elegidas || {}, participantes: filas,
  };
}

function leerOpciones(argv) {
  const o = { codigo: "REALCUP", enviar: false, envio: null, pdf: null, rearmar: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--enviar") o.enviar = true;
    else if (a === "--rearmar") o.rearmar = true;
    else if (a === "--envio") o.envio = Number(argv[++i]);
    else if (a === "--pdf") o.pdf = argv[++i];
    else if (a.startsWith("--")) throw new Error(`Opción desconocida: ${a}`);
    else o.codigo = a.toUpperCase();
  }
  if (o.envio != null && !Number.isInteger(o.envio)) throw new Error("--envio lleva el número del pedido");
  if (o.pdf != null && !o.pdf) throw new Error("--pdf lleva una carpeta");
  if (o.enviar && o.pdf) throw new Error("Use --enviar o --pdf, no los dos");
  return o;
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const hora = (iso) => (iso ? new Date(iso).toLocaleString("es-AR", { dateStyle: "short", timeStyle: "short" }) : "—");

async function main() {
  const o = leerOpciones(process.argv.slice(2));
  const archivoEnv = fileURLToPath(new URL("../.env.local", import.meta.url));
  if (existsSync(archivoEnv)) process.loadEnvFile(archivoEnv);
  // Con MAIL_SOLO_LOG el mailer no envía pero devuelve "ok": se marcarían como enviados sin haber salido.
  if (o.enviar && process.env.MAIL_SOLO_LOG) throw new Error("MAIL_SOLO_LOG está activo: así no se envía nada. Sáquelo y vuelva a correr.");
  // env.js lee process.env al importarse: por eso estos imports van después de cargar .env.local.
  const { supabaseAdmin } = await import("../netlify/lib/supabaseAdmin.js");
  const { enviarMail } = await import("../netlify/lib/mailer.js");
  const { generarInformeTaller } = await import("../netlify/lib/pdfTaller.js");
  const { mailInforme, rutaInforme } = await import("../netlify/lib/tallerInforme.js");
  if (o.enviar && !process.env.RESEND_API_KEY) throw new Error("Falta RESEND_API_KEY en .env.local");

  const db = supabaseAdmin();
  const todas = async (consulta) => {
    const filas = [];
    for (let desde = 0; ; desde += 1000) {
      const { data, error } = await consulta().range(desde, desde + 999);
      if (error) throw error;
      filas.push(...data);
      if (data.length < 1000) return filas;
    }
  };

  const { data: sesion, error: errSesion } = await db.from("taller_sesiones")
    .select("id, codigo, nombre, elegidas, fase, demo").eq("codigo", o.codigo).maybeSingle();
  if (errSesion) throw errSesion;
  if (!sesion) throw new Error(`No hay ninguna sesión con el código ${o.codigo}`);

  const envios = await todas(() => db.from("taller_envios")
    .select("id, participante_id, email, archivo, creado_at, enviado_at, error").eq("sesion_id", sesion.id).order("id"));
  const personas = new Set(envios.map((e) => e.participante_id));
  const conInforme = new Set(envios.filter((e) => e.enviado_at).map((e) => e.participante_id));
  const lista = pendientes(envios, { envio: o.envio });

  console.log(`${sesion.nombre} (${sesion.codigo}${sesion.demo ? ", prueba" : ""}, fase ${sesion.fase})`);
  console.log(`${envios.length} pedidos de ${personas.size} personas · ${conInforme.size} ya recibieron el informe`);
  if (o.envio != null && !lista.length) throw new Error(`El pedido ${o.envio} no es de esta sesión`);
  if (!lista.length) {
    console.log("No hay nada para reenviar.");
    return;
  }
  console.log(`\n${o.envio != null ? "Pedido elegido" : "Para reenviar"}:`);
  for (const e of lista) {
    const estado = e.enviado_at ? `enviado ${hora(e.enviado_at)}` : e.error ? `falló: ${e.error}` : "sin respuesta del servidor";
    console.log(`  #${e.id}  ${e.email}  · pedido ${hora(e.creado_at)} · ${estado} · ${e.archivo && !o.rearmar ? "PDF guardado" : "PDF a rearmar"}`);
  }
  if (!o.enviar && !o.pdf) {
    console.log(`\nNo se envió nada. Para reenviarlos: npm run taller:reenviar -- ${o.codigo}${o.envio != null ? ` --envio ${o.envio}` : ""} --enviar`);
    return;
  }

  let tablas = null; // participantes y respuestas, solo si hay que rearmar algún PDF
  const rearmar = async (e) => {
    tablas ||= {
      participantes: await todas(() => db.from("taller_participantes").select("id, orden, origen").eq("sesion_id", sesion.id).order("orden")),
      respuestas: await todas(() => db.from("taller_respuestas").select("participante_id, pregunta, letra").eq("sesion_id", sesion.id).order("participante_id").order("pregunta")),
    };
    return generarInformeTaller(datosDesdeTablas({ sesion, ...tablas, envio: e }), new Date());
  };
  const pdfDe = async (e) => {
    if (e.archivo && !o.rearmar) {
      const { data, error } = await db.storage.from("taller-informes").download(e.archivo);
      if (!error) return { pdf: Buffer.from(await data.arrayBuffer()), ruta: e.archivo };
      console.log(`  #${e.id}  el PDF guardado no se pudo leer (${error.message}): se rearma`);
    }
    const pdf = await rearmar(e);
    if (o.pdf) return { pdf, ruta: null };
    const ruta = rutaInforme(sesion.codigo, e.participante_id, e.id);
    const { error } = await db.storage.from("taller-informes").upload(ruta, pdf, { contentType: "application/pdf", upsert: true });
    if (error) console.log(`  #${e.id}  no se pudo guardar el PDF rearmado (${error.message}); se envía igual`);
    return { pdf, ruta: error ? e.archivo : ruta };
  };

  if (o.pdf) mkdirSync(o.pdf, { recursive: true });
  let enviados = 0;
  let fallidos = 0;
  console.log("");
  for (const e of lista) {
    const { pdf, ruta } = await pdfDe(e);
    if (o.pdf) {
      const destino = join(o.pdf, `informe-${sesion.codigo}-${e.id}.pdf`);
      writeFileSync(destino, pdf);
      console.log(`  #${e.id}  guardado en ${destino}`);
      continue;
    }
    const ok = await enviarMail(mailInforme({ email: e.email, nombre: sesion.nombre }, pdf), { idempotencyKey: `taller-reenvio-${e.id}` });
    // Si falla el reenvío de uno que ya había salido (--envio), no se borra la fecha del envío original.
    const { error } = ok || !e.enviado_at
      ? await db.rpc("taller_envio_terminar", { p_envio: e.id, p_archivo: ruta, p_ok: ok, p_error: ok ? null : "reenvío: no se pudo enviar el mail" })
      : { error: null };
    if (ok) enviados++;
    else fallidos++;
    console.log(`  #${e.id}  ${e.email}  ${ok ? "enviado" : "NO SE PUDO ENVIAR"}${error ? ` (no se pudo marcar en la base: ${error.message})` : ""}`);
    await sleep(PAUSA_MS);
  }
  if (!o.pdf) {
    console.log(`\n${enviados} enviados${fallidos ? `, ${fallidos} fallaron (vuelva a correrlo en unos minutos)` : ""}.`);
    if (fallidos) process.exitCode = 1;
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((err) => {
    console.error(`\nError: ${err.message || err}`);
    process.exit(1);
  });
}
