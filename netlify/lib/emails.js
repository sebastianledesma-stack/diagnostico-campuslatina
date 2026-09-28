// Templates HTML de los mails (tablas + estilos inline para compatibilidad con clientes de correo).
import { NAVY, NAVY_DK, EMERALD, SLATE, CREAM, EMERALD_TXT, SLATE_TXT, MUTED, nivelDarkColor } from "../../src/theme.js";
import { ETAPAS_DATA } from "../../src/data/etapas.js";
import { getNivel, etapasCriticas, topRecomendaciones } from "../../src/lib/scoring.js";
import { AUTORIDAD } from "../../src/data/textos.js";

const esc = (v) => String(v ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const f1 = (n) => Number(n || 0).toFixed(1);
const SANS = "'DM Sans',Arial,Helvetica,sans-serif";
const SERIF = "'DM Serif Display',Georgia,serif";
const MONO = "'Space Mono',Consolas,monospace";

function layout({ preheader, body }) {
  return `<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="light"><title>Diagnóstico CampusLatina</title>
<link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;700&family=DM+Serif+Display&family=Space+Mono&display=swap" rel="stylesheet">
<style>@media (max-width:600px){.px{padding-left:20px!important;padding-right:20px!important}.score{font-size:40px!important}}</style></head>
<body style="margin:0;padding:0;background:${CREAM};">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;">${esc(preheader)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${CREAM};"><tr><td align="center" style="padding:24px 12px;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#ffffff;border-radius:14px;overflow:hidden;font-family:${SANS};color:${NAVY};">
${body}
<tr><td class="px" style="padding:18px 36px;background:${CREAM};border-top:1px solid #E8E6DF;font-family:${MONO};font-size:12px;letter-spacing:1px;text-transform:uppercase;color:${MUTED};text-align:center;">
Diagnóstico del proceso de inscripción universitaria · CampusLatina</td></tr>
</table></td></tr></table></body></html>`;
}

function filaEtapa(e) {
  const n = getNivel(e.score);
  return `<tr>
<td style="padding:9px 0;border-bottom:1px solid #F0EEEA;font-size:14px;color:${NAVY};">${e.num}. ${esc(e.name)}</td>
<td style="padding:9px 0;border-bottom:1px solid #F0EEEA;width:180px;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
    <td style="width:90px;"><div style="height:6px;background:#E8E6DF;border-radius:3px;"><div style="height:6px;width:${Math.round((e.score / 5) * 100)}%;background:${n.color};border-radius:3px;"></div></div></td>
    <td style="padding-left:10px;font-family:${MONO};font-size:12px;color:${n.color};white-space:nowrap;">${f1(e.score)} · ${n.label}</td>
  </tr></table>
</td></tr>`;
}

// Mail al directivo, con el PDF adjunto.
export function mailInforme(d, { contactoEmail } = {}) {
  const nivel = getNivel(Number(d.score_global));
  const etapas = ETAPAS_DATA.map((e) => ({ ...e, score: d.scores?.[e.id] || 0 }));
  const top = topRecomendaciones(d.scores || {});
  const nombre = String(d.nombre || "").trim().split(/\s+/)[0];
  const critica = etapasCriticas(d.scores || {})[0];
  const subject = `${d.universidad}: dónde se están perdiendo inscriptos`;
  const hablemosHref = contactoEmail
    ? `mailto:${contactoEmail}?subject=${encodeURIComponent(`Diagnóstico del proceso de inscripción — ${d.universidad}`)}`
    : null;

  const body = `
<tr><td class="px" style="background:${NAVY_DK};padding:32px 36px;">
  <div style="font-family:${MONO};font-size:12px;letter-spacing:1.5px;text-transform:uppercase;color:${SLATE};">CampusLatina & CIeLatam</div>
  <div style="font-family:${SERIF};font-size:26px;line-height:1.2;color:#ffffff;margin:10px 0 18px;">Diagnóstico del <em style="color:${EMERALD};">proceso de inscripción</em></div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
    <td style="vertical-align:bottom;">
      <div style="font-size:16px;color:#ffffff;font-weight:500;">${esc(d.universidad)}</div>
      <div style="font-size:12px;color:#9AA0C8;margin-top:2px;">${esc([d.nombre, d.cargo, d.pais].filter(Boolean).join(" · "))}</div>
    </td>
    <td align="right" style="vertical-align:bottom;white-space:nowrap;">
      <div class="score" style="font-family:${SERIF};font-size:48px;line-height:1;color:${nivelDarkColor(nivel.label)};">${f1(d.score_global)}</div>
      <div style="font-family:${MONO};font-size:12px;letter-spacing:1px;text-transform:uppercase;color:${nivelDarkColor(nivel.label)};">${nivel.label} · de 5</div>
    </td>
  </tr></table>
</td></tr>

<tr><td class="px" style="padding:28px 36px 8px;">
  <p style="font-size:15px;line-height:1.65;margin:0 0 12px;">Hola ${esc(nombre)},</p>
  <p style="font-size:15px;line-height:1.65;margin:0 0 12px;">Gracias por completar el diagnóstico. <strong>El momento donde más inscriptos se pierden es ${esc(critica.name)}</strong> <span style="color:${MUTED};">(${esc(critica.pregunta)})</span>.</p>
  <p style="font-size:15px;line-height:1.65;margin:0 0 12px;">El puntaje global es <strong>${f1(d.score_global)} de 5</strong>, nivel <strong style="color:${nivel.color};">${nivel.label}</strong>. Abajo están las 3 acciones para empezar.</p>
  <p style="font-size:15px;line-height:1.65;margin:0;"><strong>El informe completo va adjunto en PDF</strong>, con el análisis de cada etapa y el plan de acción, listo para compartir con el equipo directivo.</p>
</td></tr>

<tr><td class="px" style="padding:20px 36px 4px;">
  <div style="font-family:${MONO};font-size:12px;letter-spacing:1.5px;text-transform:uppercase;color:${SLATE_TXT};margin-bottom:6px;">Las 7 etapas del recorrido del aspirante</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0">${etapas.map(filaEtapa).join("")}</table>
</td></tr>

<tr><td class="px" style="padding:24px 36px 8px;">
  <div style="font-family:${MONO};font-size:12px;letter-spacing:1.5px;text-transform:uppercase;color:${SLATE_TXT};margin-bottom:10px;">Las 3 acciones para empezar</div>
  ${top.map(({ etapa, rec }, i) => `
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:10px;background:${CREAM};border-radius:10px;"><tr>
    <td style="width:34px;vertical-align:top;padding:14px 0 14px 14px;font-family:${SERIF};font-size:22px;color:${EMERALD_TXT};line-height:1;">${i + 1}</td>
    <td style="padding:12px 14px;">
      <div style="font-family:${MONO};font-size:12px;letter-spacing:1px;text-transform:uppercase;color:${getNivel(etapa.score).color};">${esc(etapa.name)} · ${f1(etapa.score)}/5</div>
      <div style="font-size:14px;line-height:1.55;color:${NAVY};margin-top:3px;">${esc(rec.texto)}</div>
      <div style="font-family:${MONO};font-size:12px;color:${EMERALD_TXT};margin-top:4px;">+${f1(rec.impacto)} pts · ${esc(rec.accion)}</div>
    </td>
  </tr></table>`).join("")}
</td></tr>

<tr><td class="px" style="padding:16px 36px 32px;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${NAVY_DK};border-radius:12px;"><tr><td style="padding:24px;">
    <div style="font-family:${SERIF};font-size:20px;line-height:1.3;color:#ffffff;">¿Quiere inscribir <em style="color:${EMERALD};">más estudiantes</em> el próximo ciclo?</div>
    <p style="font-size:14px;line-height:1.6;color:#B8BCD8;margin:8px 0 18px;">${AUTORIDAD} Responda este mail y revisamos juntos su diagnóstico.</p>
    ${hablemosHref ? `<a href="${esc(hablemosHref)}" style="display:inline-block;background:${EMERALD};color:${NAVY_DK};font-weight:700;font-size:14px;text-decoration:none;padding:14px 26px;border-radius:10px;">Escríbanos →</a>` : ""}
  </td></tr></table>
</td></tr>`;

  const text = [
    `Hola ${nombre},`,
    ``,
    `Gracias por completar el diagnóstico del proceso de inscripción de ${d.universidad}.`,
    `El momento donde más inscriptos se pierden es ${critica.name} (${critica.pregunta}).`,
    `Puntaje global: ${f1(d.score_global)} de 5 · ${nivel.label}`,
    ``,
    `Las 7 etapas:`,
    ...etapas.map((e) => `  ${e.num}. ${e.name}: ${f1(e.score)} · ${getNivel(e.score).label}`),
    ``,
    `Las 3 acciones para empezar:`,
    ...top.map(({ etapa, rec }, i) => `  ${i + 1}. [${etapa.name}] ${rec.texto} (+${f1(rec.impacto)} pts)`),
    ``,
    `El informe completo va adjunto en PDF.`,
    ``,
    `¿Quiere inscribir más estudiantes el próximo ciclo? Responda este mail y revisamos juntos su diagnóstico.`,
    `— CampusLatina`,
  ].join("\n");

  return { subject, html: layout({ preheader: `Donde más inscriptos se pierden: ${critica.name}. El informe completo va adjunto en PDF.`, body }), text };
}

// Aviso interno a CampusLatina con los datos del prospecto (formato de la spec, sección 6.2).
export function mailInterno(d, { adminUrl } = {}) {
  const nivel = getNivel(Number(d.score_global));
  const criticas = etapasCriticas(d.scores || {}).slice(0, 2);
  const waNum = String(d.whatsapp || "").replace(/\D/g, "");
  const subject = `🎯 Nuevo diagnóstico — ${d.universidad} (${d.pais}) · ${f1(d.score_global)}/5`;
  const row = (icon, label, value) => `<tr><td style="padding:6px 0;width:28px;font-size:16px;">${icon}</td><td style="padding:6px 0;width:110px;font-family:${MONO};font-size:12px;letter-spacing:1px;text-transform:uppercase;color:${SLATE_TXT};">${label}</td><td style="padding:6px 0;font-size:14px;color:${NAVY};">${value}</td></tr>`;

  const body = `
<tr><td class="px" style="background:${NAVY_DK};padding:24px 36px;">
  <div style="font-family:${MONO};font-size:12px;letter-spacing:1.5px;text-transform:uppercase;color:${EMERALD};">🎯 Nuevo diagnóstico completado</div>
  <div style="font-family:${SERIF};font-size:24px;color:#ffffff;margin-top:8px;">${esc(d.universidad)}</div>
  <div style="font-family:${SERIF};font-size:36px;color:${nivelDarkColor(nivel.label)};margin-top:6px;">${f1(d.score_global)}<span style="font-size:16px;color:#9AA0C8;">/5 · ${nivel.label}</span></div>
</td></tr>
<tr><td class="px" style="padding:24px 36px 8px;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
    ${row("🏛️", "Universidad", esc(d.universidad))}
    ${row("🌎", "País", esc(d.pais))}
    ${row("👤", "Directivo", `${esc(d.nombre)}${d.cargo ? ` — ${esc(d.cargo)}` : ""}`)}
    ${row("📧", "Email", `<a href="mailto:${esc(d.email)}" style="color:${NAVY};">${esc(d.email)}</a>`)}
    ${row("📱", "WhatsApp", waNum ? `<a href="https://wa.me/${waNum}" style="color:${NAVY};">${esc(d.whatsapp)}</a>` : esc(d.whatsapp))}
  </table>
</td></tr>
<tr><td class="px" style="padding:12px 36px 8px;">
  <div style="font-family:${MONO};font-size:12px;letter-spacing:1.5px;text-transform:uppercase;color:${SLATE_TXT};margin-bottom:6px;">Etapas críticas</div>
  ${criticas.map((e) => `<div style="font-size:14px;line-height:1.8;">• ${esc(e.name)}: <strong style="color:${getNivel(e.score).color};">${f1(e.score)}</strong></div>`).join("")}
</td></tr>
<tr><td class="px" style="padding:16px 36px 32px;">
  ${adminUrl ? `<a href="${esc(adminUrl)}" style="display:inline-block;background:${NAVY};color:#ffffff;font-weight:700;font-size:14px;text-decoration:none;padding:12px 22px;border-radius:10px;">Ver en el panel →</a>` : ""}
  <div style="font-size:13px;color:${MUTED};margin-top:12px;">El informe PDF que recibió el directivo va adjunto.</div>
</td></tr>`;

  const text = [
    `🎯 Nuevo diagnóstico completado`,
    ``,
    `🏛️ Universidad: ${d.universidad}`,
    `🌎 País: ${d.pais}`,
    `👤 ${d.nombre}${d.cargo ? ` — ${d.cargo}` : ""}`,
    `📧 ${d.email}`,
    `📱 ${d.whatsapp}`,
    ``,
    `📊 Score global: ${f1(d.score_global)}/5 · ${nivel.label}`,
    ``,
    `Etapas críticas:`,
    ...criticas.map((e) => `• ${e.name}: ${f1(e.score)}`),
    ``,
    adminUrl ? `→ Ver en el panel: ${adminUrl}` : "",
  ].join("\n");

  return { subject, html: layout({ preheader: `${d.nombre} · ${d.pais} · ${f1(d.score_global)}/5`, body }), text };
}
