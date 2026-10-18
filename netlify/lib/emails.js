// Templates HTML de los mails (tablas + estilos inline para compatibilidad con clientes de correo).
// Identidad de marca: cabecera petróleo noche con el logo y el campo de líneas, Schibsted Grotesk
// (con Helvetica/Arial de respaldo, porque la mayoría de los clientes no carga fuentes web),
// esquinas rectas, filetes en lugar de tarjetas y el coral solo como destaque. Sin emojis.
import { ETAPAS_DATA } from "../../src/data/etapas.js";
import { getNivel, etapasCriticas, topRecomendaciones, sinAcciones as todoEnD, fmt1, r1 } from "../../src/lib/scoring.js";
import { datosInforme } from "../../src/lib/informePdf.js";
import { AUTORIDAD, VALIDAR } from "../../src/data/textos.js";
import { textoRango } from "../../src/data/calificacion.js";
import { env } from "./env.js";

const esc = (v) => String(v ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const f1 = fmt1;
const num2 = (n) => String(n).padStart(2, "0");
const TINTA = "#0A2329", PETROLEO = "#0B6470", AGUA = "#7FD6DE", CORAL = "#FF6B4A", BRUMA = "#EAF3F4";
const GRIS = "#4D6166", LINEA = "#D5E3E5", SLATE = "#A9C2C6", TEXTO = "#1F3A40";
const SANS = "'Schibsted Grotesk',Helvetica,Arial,sans-serif";
const SERIF = "Newsreader,Georgia,'Times New Roman',serif";
const ETIQUETA = `font-family:${SANS};font-size:11px;font-weight:600;letter-spacing:1.6px;text-transform:uppercase;`;
// Imágenes de la cabecera (public/email/, generadas con scripts/og-image.mjs). MAIL_ASSETS_URL permite
// apuntarlas a otra carpeta para las vistas previas sin publicar el sitio.
const imagen = (nombre) => `${process.env.MAIL_ASSETS_URL || env.SITE_URL || "https://diagnostico.campuslatina.com"}/email/${nombre}`;

// Palabra destacada: cursiva serif con un subrayado coral (el resaltador del manual, en versión para mail).
const destacado = (texto) => `<span style="font-family:${SERIF};font-style:italic;font-weight:400;border-bottom:3px solid ${CORAL};">${texto}</span>`;

function layout({ preheader, body }) {
  return `<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="light"><meta name="supported-color-schemes" content="light"><title>Diagnóstico CampusLatina</title>
<link href="https://fonts.googleapis.com/css2?family=Schibsted+Grotesk:wght@400;600;700&family=Newsreader:ital@1&display=swap" rel="stylesheet">
<style>@media (max-width:600px){.px{padding-left:22px!important;padding-right:22px!important}.dato{font-size:46px!important}.col{display:block!important;width:100%!important;padding:0 0 14px!important}}</style></head>
<body style="margin:0;padding:0;background:${BRUMA};">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;">${esc(preheader)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${BRUMA};"><tr><td align="center" style="padding:24px 12px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#ffffff;font-family:${SANS};color:${TINTA};">
${body}
<tr><td class="px" style="padding:20px 40px 28px;border-top:1px solid ${LINEA};">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
    <td style="${ETIQUETA}color:${GRIS};">Diagnóstico del proceso de inscripción</td>
    <td align="right" style="font-size:13px;"><a href="https://campuslatina.com" style="color:${PETROLEO};text-decoration:none;font-weight:600;">campuslatina.com</a></td>
  </tr></table>
</td></tr>
</table></td></tr></table></body></html>`;
}

// Cabecera oscura con logo, etiqueta, título y (opcional) cifras; abajo, la franja del campo de líneas.
function cabecera({ etiqueta, titulo, extra = "" }) {
  return `
<tr><td class="px" style="background:${TINTA};padding:30px 40px 6px;">
  <img src="${imagen("logo-sobre-oscuro.png")}" width="120" height="34" alt="Campus Latina" style="display:block;border:0;outline:none;">
  <div style="${ETIQUETA}color:${SLATE};margin-top:34px;">${etiqueta}</div>
  <div style="font-family:${SANS};font-size:30px;line-height:1.12;font-weight:700;letter-spacing:-0.6px;color:#ffffff;margin-top:10px;">${titulo}</div>
  ${extra}
</td></tr>
<tr><td style="background:${TINTA};line-height:0;font-size:0;"><img src="${imagen("campo.png")}" width="600" alt="" style="display:block;width:100%;max-width:600px;height:auto;border:0;"></td></tr>`;
}

const boton = (texto, href, { oscuro = false } = {}) => href
  ? `<a href="${esc(href)}" style="display:inline-block;background:${oscuro ? AGUA : PETROLEO};color:${oscuro ? TINTA : "#ffffff"};font-family:${SANS};font-weight:700;font-size:15px;text-decoration:none;padding:15px 26px;">${esc(texto)}</a>`
  : "";
const parrafo = (html, extra = "") => `<p style="font-size:16px;line-height:1.6;color:${TEXTO};margin:0 0 14px;${extra}">${html}</p>`;

// Fila de una etapa: número, nombre, tramo hoy → con el plan y puntaje.
function filaEtapa(e) {
  const hoy = Math.round(((Math.max(1, e.score) - 1) / 4) * 100);
  const plan = Math.max(hoy, Math.round(((Math.max(1, e.pot) - 1) / 4) * 100));
  return `<tr>
<td style="padding:11px 0;border-bottom:1px solid ${LINEA};width:34px;font-size:14px;font-weight:700;color:${PETROLEO};">${num2(e.num)}</td>
<td style="padding:11px 8px 11px 0;border-bottom:1px solid ${LINEA};font-size:15px;color:${TINTA};">${esc(e.name)}</td>
<td style="padding:11px 0;border-bottom:1px solid ${LINEA};width:150px;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="height:6px;"><tr>
    ${hoy ? `<td width="${hoy}%" style="background:${PETROLEO};height:6px;font-size:0;line-height:0;">&nbsp;</td>` : ""}
    ${plan > hoy ? `<td width="${plan - hoy}%" style="background:${CORAL};height:6px;font-size:0;line-height:0;opacity:.85;">&nbsp;</td>` : ""}
    ${plan < 100 ? `<td style="background:${LINEA};height:6px;font-size:0;line-height:0;">&nbsp;</td>` : ""}
  </tr></table>
</td>
<td align="right" style="padding:11px 0 11px 12px;border-bottom:1px solid ${LINEA};width:74px;font-size:15px;font-weight:700;color:${TINTA};white-space:nowrap;">${f1(e.score)}${r1(e.pot) > r1(e.score) ? `<span style="font-weight:400;color:${GRIS};"> → ${f1(e.pot)}</span>` : ""}</td>
</tr>`;
}

// Mail al directivo, con el PDF adjunto.
// Botón final del informe: reunión de 45 min si la universidad es target; si no, contacto por mail.
export function ctaInforme(d, { contactoEmail, agendaUrl } = {}) {
  const asunto = (t) => encodeURIComponent(`${t} — ${d.universidad}`);
  if (d.target && todoEnD(d.respuestas)) {
    const href = agendaUrl || (contactoEmail ? `mailto:${contactoEmail}?subject=${asunto("Quiero comparar nuestros números")}` : null);
    return { titulo: "Validemos su resultado con datos", destacar: "con datos", texto: VALIDAR.reunion, boton: "Agendar la reunión →", href };
  }
  if (d.target) {
    const href = agendaUrl || (contactoEmail ? `mailto:${contactoEmail}?subject=${asunto("Quiero agendar la reunión de 45 minutos")}` : null);
    return { titulo: "Revisemos su diagnóstico en 45 minutos", destacar: "en 45 minutos", texto: "Una reunión por videollamada para recorrer sus resultados y definir por dónde empezar. Sin compromiso.", boton: "Agendar la reunión →", href };
  }
  const href = contactoEmail ? `mailto:${contactoEmail}?subject=${asunto("Diagnóstico del proceso de inscripción")}` : null;
  return { titulo: "¿Quiere inscribir más estudiantes el próximo ciclo?", destacar: "más estudiantes", texto: "Responda este mail y revisamos juntos su diagnóstico.", boton: "Escríbanos →", href };
}

export function mailInforme(d, { contactoEmail, agendaUrl } = {}) {
  const nivel = getNivel(Number(d.score_global));
  const info = datosInforme(d.respuestas || {});
  const top = topRecomendaciones(d.scores || {}, 3, d.respuestas);
  // Si ya tiene cubiertas las acciones de arranque, no hay "3 acciones": se dice en una línea.
  const accionesTitulo = top.length === 1 ? "La acción para empezar" : `Las ${top.length} acciones para empezar`;
  // Todo en D: no hay acciones; se propone validar con números reales.
  const sinAcciones = `${VALIDAR.titulo}. ${VALIDAR.texto}`;
  const nombre = String(d.nombre || "").trim().split(/\s+/)[0];
  const critica = etapasCriticas(d.scores || {})[0];
  const subject = `${d.universidad}: dónde se están perdiendo inscriptos`;
  const cta = ctaInforme(d, { contactoEmail, agendaUrl });
  const cifra = (etq, valor, sub, color) => `<td class="col" style="vertical-align:bottom;padding-right:34px;">
      <div style="${ETIQUETA}color:${SLATE};">${etq}</div>
      <div class="dato" style="font-family:${SANS};font-size:58px;line-height:1;font-weight:700;letter-spacing:-2px;color:${color};margin-top:8px;">${valor}</div>
      <div style="font-size:13px;color:${SLATE};margin-top:6px;">${sub}</div></td>`;

  const body = `
${cabecera({
  etiqueta: "Diagnóstico del proceso de inscripción",
  titulo: esc(d.universidad),
  extra: `<div style="font-size:13px;color:${SLATE};margin-top:6px;">${esc([d.nombre, d.cargo, d.pais].filter(Boolean).join(" · "))}</div>
  <table role="presentation" cellpadding="0" cellspacing="0" style="margin-top:26px;"><tr>
    ${cifra("Hoy", f1(d.score_global), `de 5 · ${nivel.label}`, "#ffffff")}
    ${info.hayMejora ? cifra("Con el plan", f1(info.potencial), getNivel(info.potencial).label, CORAL) : ""}
  </tr></table>`,
})}

<tr><td class="px" style="padding:32px 40px 6px;">
  ${parrafo(`Hola ${esc(nombre)},`)}
  ${parrafo(`Gracias por completar el diagnóstico. ${todoEnD(d.respuestas) ? "<strong>Las 7 etapas quedaron en el nivel más alto que mide el diagnóstico.</strong>" : `<strong>El momento donde más inscriptos se pierden es ${esc(critica.name)}</strong> <span style="color:${GRIS};">(${esc(critica.pregunta)})</span>.`}`)}
  ${parrafo(`El puntaje global es <strong>${f1(d.score_global)} de 5</strong>, nivel <strong>${nivel.label}</strong>. ${top.length ? `Abajo ${top.length === 1 ? "está la acción" : `están las ${top.length} acciones`} para empezar.` : esc(sinAcciones)}`)}
  ${parrafo("<strong>El informe completo va adjunto en PDF</strong>, con el análisis de cada etapa y el plan de acción, listo para compartir con el equipo directivo.", "margin:0;")}
</td></tr>

<tr><td class="px" style="padding:30px 40px 6px;">
  <div style="${ETIQUETA}color:${GRIS};padding-bottom:10px;border-bottom:2px solid ${TINTA};">Las 7 etapas del recorrido del aspirante</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0">${info.etapas.map(filaEtapa).join("")}</table>
  ${info.hayMejora ? `<div style="font-size:12px;color:${GRIS};margin-top:8px;">En petróleo, el puntaje de hoy; en coral, lo que suma el plan de acción.</div>` : ""}
</td></tr>

<tr><td class="px" style="padding:30px 40px 8px;">
  ${top.length ? `<div style="${ETIQUETA}color:${GRIS};padding-bottom:10px;border-bottom:2px solid ${TINTA};">${accionesTitulo}</div>` : `<div style="${ETIQUETA}color:${GRIS};padding-bottom:10px;border-bottom:2px solid ${TINTA};">Tres números para validarlo</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0">${VALIDAR.metricas.map((m, i) => `<tr><td style="padding:12px 0;border-bottom:1px solid ${LINEA};width:34px;font-size:14px;font-weight:700;color:${PETROLEO};vertical-align:top;">${num2(i + 1)}</td><td style="padding:12px 0;border-bottom:1px solid ${LINEA};font-size:15px;line-height:1.5;color:${TINTA};">${esc(m)}</td></tr>`).join("")}</table>`}
  ${top.length ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0">${top.map(({ etapa, rec }, i) => `<tr>
    <td style="padding:16px 0;border-bottom:1px solid ${LINEA};width:46px;vertical-align:top;font-family:${SANS};font-size:28px;line-height:1;font-weight:700;letter-spacing:-1px;color:${PETROLEO};">${num2(i + 1)}</td>
    <td style="padding:16px 0;border-bottom:1px solid ${LINEA};">
      <div style="${ETIQUETA}color:${GRIS};">${esc(etapa.name)} · ${f1(etapa.score)} de 5</div>
      <div style="font-size:15px;line-height:1.55;color:${TINTA};margin-top:5px;">${esc(rec.texto)}</div>
      <div style="font-size:13px;color:${PETROLEO};font-weight:600;margin-top:5px;">+${f1(rec.impacto)} puntos · ${esc(rec.accion)}</div>
    </td></tr>`).join("")}</table>` : ""}
</td></tr>

<tr><td class="px" style="padding:26px 40px 36px;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${TINTA};"><tr><td style="padding:30px 30px 32px;">
    <div style="${ETIQUETA}color:${AGUA};">CampusLatina</div>
    <div style="font-family:${SANS};font-size:24px;line-height:1.2;font-weight:700;letter-spacing:-0.4px;color:#ffffff;margin:10px 0 0;">${esc(cta.titulo).replace(esc(cta.destacar), destacado(esc(cta.destacar)))}</div>
    <p style="font-size:15px;line-height:1.6;color:#C9D6D8;margin:12px 0 22px;">${AUTORIDAD} ${esc(cta.texto)}</p>
    ${boton(cta.boton, cta.href, { oscuro: true })}
  </td></tr></table>
</td></tr>`;

  const text = [
    `Hola ${nombre},`,
    ``,
    `Gracias por completar el diagnóstico del proceso de inscripción de ${d.universidad}.`,
    todoEnD(d.respuestas) ? `Las 7 etapas quedaron en el nivel más alto que mide el diagnóstico.` : `El momento donde más inscriptos se pierden es ${critica.name} (${critica.pregunta}).`,
    `Puntaje global: ${f1(d.score_global)} de 5 · ${nivel.label}${info.hayMejora ? ` · con el plan de acción: ${f1(info.potencial)}` : ""}`,
    ``,
    `Las 7 etapas:`,
    ...info.etapas.map((e) => `  ${num2(e.num)}. ${e.name}: ${f1(e.score)} · ${getNivel(e.score).label}`),
    ``,
    top.length ? `${accionesTitulo}:` : `${sinAcciones}\nTres números para validarlo:\n${VALIDAR.metricas.map((m, i) => `  ${i + 1}. ${m}`).join("\n")}`,
    ...top.map(({ etapa, rec }, i) => `  ${i + 1}. [${etapa.name}] ${rec.texto} (+${f1(rec.impacto)} pts)`),
    ``,
    `El informe completo va adjunto en PDF.`,
    ``,
    `${cta.titulo} ${cta.texto}${cta.href && !cta.href.startsWith("mailto:") ? ` ${cta.href}` : ""}`,
    `— CampusLatina`,
  ].join("\n");

  return { subject, html: layout({ preheader: todoEnD(d.respuestas) ? "Su proceso está en el nivel más alto: el próximo paso es validarlo con datos." : `Donde más inscriptos se pierden: ${critica.name}. El informe completo va adjunto en PDF.`, body }), text };
}

// Aviso interno a CampusLatina con los datos del prospecto (formato de la spec, sección 6.2).
// El asunto conserva el prefijo "🎯 TARGET" porque el equipo filtra por él; el cuerpo va sin emojis.
export function mailInterno(d, { adminUrl } = {}) {
  const nivel = getNivel(Number(d.score_global));
  const criticas = etapasCriticas(d.scores || {}).slice(0, 2);
  const waNum = String(d.whatsapp || "").replace(/\D/g, "");
  const colegas = (d.colaboradores || []).map((c) => c.nombre).filter(Boolean);
  const subject = `${d.target ? "🎯 TARGET · " : ""}Nuevo diagnóstico — ${d.universidad} (${d.pais}) · ${f1(d.score_global)}/5`;
  const row = (label, value) => `<tr><td style="padding:10px 0;border-bottom:1px solid ${LINEA};width:130px;${ETIQUETA}color:${GRIS};vertical-align:top;">${label}</td><td style="padding:10px 0;border-bottom:1px solid ${LINEA};font-size:15px;color:${TINTA};">${value}</td></tr>`;

  const body = `
${cabecera({
  etiqueta: d.target ? "Nuevo diagnóstico · Target" : "Nuevo diagnóstico completado",
  titulo: esc(d.universidad),
  extra: `<div style="margin-top:18px;font-family:${SANS};font-weight:700;font-size:44px;line-height:1;letter-spacing:-1.5px;color:#ffffff;">${f1(d.score_global)}<span style="font-size:15px;font-weight:400;letter-spacing:0;color:${SLATE};"> de 5 · ${nivel.label}</span></div>`,
})}
<tr><td class="px" style="padding:28px 40px 8px;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-top:2px solid ${TINTA};">
    ${row("Universidad", esc(d.universidad))}
    ${row("País", esc(d.pais))}
    ${row("Directivo", `${esc(d.nombre)}${d.cargo ? ` — ${esc(d.cargo)}` : ""}`)}
    ${row("Email", `<a href="mailto:${esc(d.email)}" style="color:${PETROLEO};">${esc(d.email)}</a>`)}
    ${row("WhatsApp", waNum ? `<a href="https://wa.me/${waNum}" style="color:${PETROLEO};">${esc(d.whatsapp)}</a>` : esc(d.whatsapp))}
    ${row("Alumnos hoy", esc(textoRango(d.alumnos_actuales)))}
    ${row("Meta 3–5 años", esc(textoRango(d.alumnos_meta)))}
    ${Number(d.score_global) >= 4.5 ? row("Puntaje alto", "<strong>Validar con datos:</strong> una autoevaluación tan alta suele ser optimista") : ""}
    ${row("Calificación", d.target ? "<strong>Target: se le ofreció la reunión de 45 min</strong>" : "No target: se le ofreció escribir por mail")}
    ${colegas.length ? row("Colegas", esc(colegas.join(", "))) : ""}
  </table>
</td></tr>
<tr><td class="px" style="padding:22px 40px 8px;">
  <div style="${ETIQUETA}color:${GRIS};margin-bottom:6px;">Etapas críticas</div>
  ${criticas.map((e) => `<div style="font-size:15px;line-height:1.9;color:${TINTA};"><strong style="color:${PETROLEO};">${num2(e.num)}</strong>&nbsp;&nbsp;${esc(e.name)}: <strong>${f1(e.score)}</strong></div>`).join("")}
</td></tr>
<tr><td class="px" style="padding:18px 40px 34px;">
  ${adminUrl ? boton("Ver en el panel →", adminUrl) : ""}
  <div style="font-size:13px;color:${GRIS};margin-top:14px;">El informe PDF que recibió el directivo va adjunto.</div>
</td></tr>`;

  const text = [
    `Nuevo diagnóstico completado`,
    ``,
    `Universidad: ${d.universidad}`,
    `País: ${d.pais}`,
    `Directivo: ${d.nombre}${d.cargo ? ` — ${d.cargo}` : ""}`,
    `Email: ${d.email}`,
    `WhatsApp: ${d.whatsapp}`,
    `Alumnos hoy: ${textoRango(d.alumnos_actuales)} · Meta a 3–5 años: ${textoRango(d.alumnos_meta)}`,
    Number(d.score_global) >= 4.5 ? `Puntaje alto: validar con datos (una autoevaluación tan alta suele ser optimista)` : "",
    `${d.target ? "TARGET (reunión de 45 min)" : "No target (contacto por mail)"}`,
    colegas.length ? `Colegas: ${colegas.join(", ")}` : "",
    ``,
    `Puntaje global: ${f1(d.score_global)}/5 · ${nivel.label}`,
    ``,
    `Etapas críticas:`,
    ...criticas.map((e) => `- ${e.name}: ${f1(e.score)}`),
    ``,
    adminUrl ? `Ver en el panel: ${adminUrl}` : "",
  ].join("\n");

  return { subject, html: layout({ preheader: `${d.nombre} · ${d.pais} · ${f1(d.score_global)}/5`, body }), text };
}

// Bloque de texto + botón para los mails cortos.
function mailSimple({ preheader, titulo, parrafos, boton: textoBoton, href, pie }) {
  const body = `
${cabecera({ etiqueta: "CampusLatina & CIeLatam", titulo })}
<tr><td class="px" style="padding:32px 40px 36px;">
  ${parrafos.map((p) => parrafo(p)).join("")}
  <div style="margin-top:12px;">${boton(textoBoton, href)}</div>
  ${pie ? `<p style="font-size:13px;line-height:1.6;color:${GRIS};margin:22px 0 0;padding-top:16px;border-top:1px solid ${LINEA};">${pie}</p>` : ""}
</td></tr>`;
  return layout({ preheader, body });
}
const plano = (html) => html.replace(/<[^>]+>/g, "");

// Al iniciar: link para retomar y compartir. Sirve de "guardado" si cierra la pestaña.
export function mailEnCurso(d, { link }) {
  const nombre = String(d.nombre || "").trim().split(/\s+/)[0];
  const parrafos = [
    `Hola ${esc(nombre)},`,
    `Empezó el diagnóstico del proceso de inscripción de <strong>${esc(d.universidad)}</strong>. Cada etapa se guarda al terminarla: puede seguir cuando quiera desde este link.`,
    `Si hay etapas que conoce mejor otra persona del equipo (marketing, admisiones, administración o el área académica), puede invitarla desde el tablero para que las complete. El informe se genera cuando estén las 7 etapas.`,
  ];
  return {
    subject: `Su diagnóstico de ${d.universidad}: link para continuar`,
    html: mailSimple({ preheader: "Cada etapa se guarda al terminarla. Puede seguir o compartirlo desde este link.", titulo: `Diagnóstico de ${destacado(esc(d.universidad))}`, parrafos, boton: "Continuar el diagnóstico →", href: link, pie: "Guarde este mail: el link es personal de su institución y da acceso a las respuestas." }),
    text: [...parrafos.map(plano), "", `Continuar: ${link}`].join("\n"),
  };
}

// Invitación a un colega para completar algunas etapas.
export function mailInvitacion(d, { link, invitado, de, etapas, mensaje }) {
  const nombres = etapas.map((id) => ETAPAS_DATA.find((e) => e.id === id)?.name).filter(Boolean);
  const lista = nombres.length ? nombres.join(", ") : "algunas etapas";
  const parrafos = [
    `Hola ${esc(String(invitado || "").trim().split(/\s+/)[0])},`,
    `<strong>${esc(de)}</strong> está haciendo el diagnóstico del proceso de inscripción de <strong>${esc(d.universidad)}</strong> y le pidió que complete: <strong>${esc(lista)}</strong>.`,
    mensaje ? `<span style="font-family:${SERIF};font-style:italic;font-size:18px;color:${TINTA};">“${esc(mensaje)}”</span>` : "",
    `Son 4 preguntas por etapa, de opción múltiple: unos 2 minutos cada una. Elija la opción que describe cómo funciona hoy, no cómo le gustaría que funcionara.`,
  ].filter(Boolean);
  return {
    subject: `${de} le pidió completar parte del diagnóstico de ${d.universidad}`,
    html: mailSimple({ preheader: `Etapas: ${lista}. Unos 2 minutos por etapa.`, titulo: `Su mirada sobre ${destacado(esc(lista))}`, parrafos, boton: "Responder mis etapas →", href: link }),
    text: [...parrafos.map(plano), "", `Responder: ${link}`].join("\n"),
  };
}

// A los colegas que participaron, cuando el diagnóstico queda completo.
export function mailColaboradorListo(d, { link, nombre }) {
  const critica = etapasCriticas(d.scores || {})[0];
  const parrafos = [
    `Hola ${esc(String(nombre || "").trim().split(/\s+/)[0])},`,
    `El diagnóstico del proceso de inscripción de <strong>${esc(d.universidad)}</strong> está completo. Gracias por su parte.`,
    `Puntaje global: <strong>${f1(d.score_global)} de 5</strong>. El momento donde más inscriptos se pierden es <strong>${esc(critica.name)}</strong>.`,
  ];
  return {
    subject: `Listo: el diagnóstico de ${d.universidad} está completo`,
    html: mailSimple({ preheader: `Puntaje global ${f1(d.score_global)} de 5. Vea el informe completo.`, titulo: `El diagnóstico está ${destacado("completo")}`, parrafos, boton: "Ver el informe →", href: link, pie: "El informe en PDF va adjunto." }),
    text: [...parrafos.map(plano), "", `Ver el informe: ${link}`].join("\n"),
  };
}
