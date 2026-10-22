// Genera el contenido indexable (HTML estático, sin JavaScript) a partir de los datos del diagnóstico:
//   /guia/                    guía de las 7 etapas (página pilar)
//   /guia/<etapa>/            una página por etapa
//   /sitemap.xml  /robots.txt  /llms.txt  /llms-full.txt
// Se ejecuta en el build, después de vite build. Una sola fuente de verdad: src/data/*.
import { mkdirSync, writeFileSync } from "node:fs";
import { ETAPAS_DATA } from "../src/data/etapas.js";
import { FRICCIONES } from "../src/data/fricciones.js";
import { RECS } from "../src/data/recs.js";
import { NIVEL_DESC, AUTORIDAD } from "../src/data/textos.js";
import { siteHeaderHTML, SITE_HEADER_CSS } from "../src/data/siteHeader.js";
import { NOTAS, notasDeEtapa } from "../src/data/notas.js";
import { GA_SNIPPET } from "../src/lib/analytics.js";
import { trazosCampo } from "../src/lib/informePdf.js";

const SITE = "https://diagnostico.campuslatina.com";
const HOY = new Date().toISOString().slice(0, 10);
// Misma entidad que en campuslatina.com (mismo @id), para que buscadores e IA la reconozcan como una sola.
const ORG = { "@type": "Organization", "@id": "https://campuslatina.com/#organizacion", name: "Campus Latina", alternateName: "CampusLatina", url: "https://campuslatina.com/", logo: "https://campuslatina.com/logo.png", sameAs: ["https://www.linkedin.com/company/campuslatina"] };
const NIVELES = [["Inicial", "1.0–1.9"], ["En desarrollo", "2.0–3.0"], ["Consolidado", "3.1–4.0"], ["Avanzado", "4.1–5.0"]];
const NIVEL_POR_LETRA = { A: "Inicial", B: "En desarrollo", C: "Consolidado", D: "Avanzado" };

// Título y descripción de cada etapa pensados para búsqueda (qué problema resuelve cada página).
const SEO = {
  descubrimiento: { slug: "descubrimiento", t: "Descubrimiento: cómo lograr que los aspirantes encuentren su universidad", d: "Cómo aparecer donde los aspirantes buscan dónde estudiar (Google, redes, IA y recomendaciones) y darles un paso siguiente claro." },
  exploracion: { slug: "exploracion", t: "Exploración: cómo ayudar a los aspirantes a entender y comparar su oferta", d: "Qué necesita encontrar un aspirante cuando investiga su universidad: oferta clara, evidencia concreta y una guía hacia el próximo paso." },
  activacion: { slug: "activacion", t: "Activación: cómo responder a tiempo las consultas de aspirantes", d: "El primer contacto es donde más rápido se enfría el interés. Tiempos de respuesta, canales, primera respuesta y registro de cada consulta." },
  acompanamiento: { slug: "acompanamiento", t: "Acompañamiento: cómo sostener el interés de los aspirantes mientras deciden", d: "Secuencias de seguimiento, contenido útil por perfil y herramientas para asesores: cómo acompañar al aspirante desde la consulta hasta la decisión." },
  decision: { slug: "decision", t: "Decisión: cómo resolver las dudas finales de los aspirantes", d: "Costos visibles, mecanismos que reducen el miedo a equivocarse y un camino claro para inscribirse: lo que define la decisión final." },
  inscripcion: { slug: "inscripcion", t: "Inscripción: cómo simplificar el trámite para no perder inscriptos", d: "La decisión ya está tomada, pero la burocracia puede tirarla abajo. Digitalización, estado del trámite y soporte durante la inscripción." },
  retencion: { slug: "retencion-temprana", t: "Retención temprana: cómo lograr que los inscriptos lleguen al primer día", d: "Entre la inscripción y el primer día muchos se arrepienten o no aparecen. Bienvenida, información progresiva y detección de inscriptos que se enfrían." },
};

const FAQ = [
  ["¿Qué es el proceso de inscripción universitaria?", "Es el recorrido completo de un aspirante desde que busca opciones de estudio hasta que llega a su primer día de clases. En este diagnóstico se divide en 7 etapas: descubrimiento, exploración, activación, acompañamiento, decisión, inscripción y retención temprana."],
  ["¿Por qué una universidad pierde aspirantes en el camino?", "Porque cada etapa tiene fricciones propias: aparecer poco o sin un paso siguiente claro, responder tarde, no hacer seguimiento, ocultar costos, trámites presenciales o silencio después de la inscripción. Un problema en una etapa afecta a todas las que vienen después."],
  ["¿Cómo se calcula el puntaje del diagnóstico?", "Son 28 preguntas, 4 por etapa, cada una con 4 opciones que describen niveles crecientes de desarrollo del proceso (valen 1, 2, 4 y 5 puntos). El puntaje de cada etapa es el promedio de sus respuestas y el puntaje global es el promedio de las 7 etapas, de 1 a 5."],
  ["¿Qué significa cada nivel?", NIVELES.map(([n, r]) => `${n} (${r}): ${NIVEL_DESC[n]}.`).join(" ")],
  ["¿Cuánto tarda y cuánto cuesta?", "Lleva unos 10 minutos y es gratuito. Al terminar se ve el informe en pantalla y se recibe por mail en PDF."],
  ["¿Qué incluye el informe?", "El puntaje global y por etapa, la etapa donde más inscriptos se pierden, las fricciones detectadas, 3 recomendaciones por etapa ordenadas por impacto y una calculadora para ver cuánto puede subir el puntaje."],
  ["¿Quién creó este diagnóstico?", `CampusLatina, junto con CIeLatam. ${AUTORIDAD}`],
];

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const url = (p) => SITE + p;
const etapaUrl = (e) => `/guia/${SEO[e.id].slug}/`;
const ld = (obj) => `<script type="application/ld+json">${JSON.stringify(obj).replace(/</g, "\\u003c")}</script>`;

// Estilo del manual de marca: fondo blanco, titulares en Schibsted con la palabra destacada en cursiva
// y resaltador, filetes en lugar de tarjetas y el campo de líneas en el cierre.
const CSS = `
*,*::before,*::after{box-sizing:border-box}
html,body{margin:0;background:#fff;color:#0A2329;-webkit-text-size-adjust:100%}
body{font:17px/1.7 'Schibsted Grotesk',system-ui,sans-serif}
a{color:#0B6470;text-underline-offset:3px}
a:focus-visible{outline:2px solid #0B6470;outline-offset:2px}
main{max-width:780px;margin:0 auto;padding:40px 20px 64px}
.crumbs{font-size:14px;color:#4D6166;margin-bottom:14px}
.crumbs a{color:#4D6166;display:inline-flex;align-items:center;min-height:44px}
.eyebrow{font:600 12px/1.4 'CL Etiquetas',sans-serif;letter-spacing:.12em;text-transform:uppercase;color:#4D6166;margin:0}
h1{font:700 clamp(34px,5.5vw,54px)/1.04 'Schibsted Grotesk',sans-serif;letter-spacing:-.03em;margin:12px 0 22px;text-wrap:balance}
h1 em,h2 em{font-family:Newsreader,Georgia,serif;font-weight:400;font-style:italic;background:linear-gradient(transparent 60%,#FFCF8A 60%,#FFCF8A 92%,transparent 92%);padding:0 .06em}
h2{font:700 28px/1.15 'Schibsted Grotesk',sans-serif;letter-spacing:-.02em;margin:56px 0 16px;padding-top:16px;border-top:2px solid #0A2329;text-wrap:balance}
h3{font-size:19px;line-height:1.35;margin:0 0 6px}
.lead{font-size:20px;line-height:1.6;color:#1F3A40}
.card{border-top:1px solid #D5E3E5;padding:22px 0 10px;margin:0}
.muted{color:#4D6166}
ul,ol{padding-left:22px}
li{margin:8px 0}
.niveles{width:100%;border-collapse:collapse;font-size:16px;margin:12px 0}
.niveles th,.niveles td{text-align:left;padding:12px 12px 12px 0;border-bottom:1px solid #D5E3E5;vertical-align:top}
.niveles th{font:600 12px/1.3 'CL Etiquetas',sans-serif;letter-spacing:.1em;text-transform:uppercase;color:#4D6166;border-bottom:2px solid #0A2329}
.esc{display:inline-flex;align-items:flex-end;gap:2px;height:12px;margin-right:8px;vertical-align:-1px}
.esc i{width:4px;background:#D5E3E5}.esc i.on{background:#0B6470}
.esc i:nth-child(1){height:25%}.esc i:nth-child(2){height:50%}.esc i:nth-child(3){height:75%}.esc i:nth-child(4){height:100%}
.opcion{display:grid;grid-template-columns:132px 1fr;gap:4px 16px;padding:10px 0;border-top:1px solid #EAF3F4}
.opcion b{font:600 12px/1.9 'CL Etiquetas',sans-serif;letter-spacing:.08em;text-transform:uppercase;color:#4D6166}
@media (max-width:560px){.opcion{grid-template-columns:1fr}}
.imp{font-weight:700;font-size:14px;color:#0B6470;white-space:nowrap}
.cta-box{position:relative;overflow:hidden;background:#0A2329;color:#fff;padding:40px 32px 48px;margin:64px 0 8px}
.cta-box svg{position:absolute;left:0;right:0;bottom:0;width:100%;height:65%;pointer-events:none}
.cta-box>:not(svg){position:relative}
.cta-box h2{color:#fff;margin:0 0 10px;border:0;padding:0;font-size:30px}
.cta-box p{color:rgba(255,255,255,.75);margin:0 0 24px;max-width:520px}
.cta-box a{display:inline-block;background:#7FD6DE;color:#0A2329;font-weight:700;text-decoration:none;padding:15px 24px}
.nav-etapas{display:flex;justify-content:space-between;gap:12px;flex-wrap:wrap;margin-top:32px;padding-top:16px;border-top:1px solid #D5E3E5;font-size:16px}
.nav-etapas a{display:inline-flex;align-items:center;min-height:48px;text-decoration:none;font-weight:700;color:#0A2329}
.nav-etapas a:hover{color:#0B6470}
.etapas-lista{list-style:none;padding:0;margin:0;border-top:2px solid #0A2329}
.etapas-lista li{margin:0}
.etapas-lista a{display:grid;grid-template-columns:64px 1fr;gap:2px 12px;padding:18px 8px 18px 0;border-bottom:1px solid #D5E3E5;text-decoration:none;color:#0A2329;transition:background .2s}
.etapas-lista a:hover{background:#F3F8F8}
.etapas-lista .n{grid-row:span 2;font:700 34px/1 'Schibsted Grotesk',sans-serif;letter-spacing:-.04em;color:#0B6470}
.etapas-lista strong{font-size:19px;line-height:1.35}
.etapas-lista .r{color:#4D6166;font-size:15px;line-height:1.55}
details{border-bottom:1px solid #D5E3E5;padding:16px 0;margin:0}
details:first-of-type{border-top:1px solid #D5E3E5}
summary{cursor:pointer;font-weight:700}
footer{border-top:1px solid #D5E3E5;padding:24px 20px 40px;text-align:center;font-size:14px;color:#4D6166}
footer a{display:inline-flex;align-items:center;min-height:44px}
`;

// Campo de líneas quieto para el bloque de cierre (mismo trazado que la tapa del informe).
const campoSvg = () => {
  const { lineas, puntos } = trazosCampo(300, 110);
  return `<svg viewBox="0 0 300 110" preserveAspectRatio="none" aria-hidden="true">${lineas.map((l) => `<path d="${l.d}" stroke="#7FD6DE" stroke-opacity="${l.opacidad}" stroke-width="${l.ancho * 2.2}" fill="none" vector-effect="non-scaling-stroke"/>`).join("")}${puntos.filter((q) => q.llega).map((q) => `<circle cx="${q.cx}" cy="${q.cy}" r="1.4" fill="#FFAE4A"/>`).join("")}</svg>`;
};
const num2 = (n) => String(n).padStart(2, "0");
const escalon = (n) => `<span class="esc" aria-hidden="true">${[1, 2, 3, 4].map((k) => `<i${k <= n ? ' class="on"' : ""}></i>`).join("")}</span>`;

function page({ path, title, description, body, jsonld = [], type = "article" }) {
  const full = `${title} | CampusLatina`;
  return `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(full)}</title>
<meta name="description" content="${esc(description)}">
<meta name="robots" content="index, follow, max-snippet:-1, max-image-preview:large">
<link rel="canonical" href="${url(path)}">
<link rel="alternate" hreflang="es" href="${url(path)}">
<link rel="alternate" hreflang="x-default" href="${url(path)}">
<meta property="og:type" content="${type}">
<meta property="og:site_name" content="Diagnóstico del proceso de inscripción · CampusLatina">
<meta property="og:locale" content="es_LA">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:url" content="${url(path)}">
<meta property="og:image" content="${url("/og.png")}">
<meta property="og:image:width" content="1200"><meta property="og:image:height" content="630">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(title)}">
<meta name="twitter:description" content="${esc(description)}">
<meta name="twitter:image" content="${url("/og.png")}">
<meta name="theme-color" content="#0A2329">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="apple-touch-icon" href="/apple-touch-icon.png">
<link rel="alternate" type="text/plain" title="Resumen para modelos de lenguaje" href="/llms.txt">
<link rel="stylesheet" href="/marca.css">
<style>${CSS}${SITE_HEADER_CSS}</style>
${jsonld.map(ld).join("\n")}
${GA_SNIPPET}
</head>
<body>
${siteHeaderHTML()}
<main>
${body}
</main>
<footer>Diagnóstico del proceso de inscripción universitaria · <a href="https://campuslatina.com">CampusLatina</a> &amp; CIeLatam · Actualizado ${HOY}</footer>
</body>
</html>`;
}

const ctaBox = (texto = "Descubra en qué etapa pierde inscriptos su universidad") => `
<section class="cta-box" aria-label="Diagnóstico gratuito">
  ${campoSvg()}
  <h2>${esc(texto)}</h2>
  <p>28 preguntas, unos 10 minutos. Recibe el informe en pantalla y en PDF por mail, con las 3 acciones prioritarias de cada etapa.</p>
  <a href="/">Hacer el diagnóstico gratis →</a>
</section>`;

const nivelesTabla = () => `
<table class="niveles">
  <thead><tr><th>Nivel</th><th>Puntaje</th><th>Qué significa</th></tr></thead>
  <tbody>${NIVELES.map(([n, r], i) => `<tr><td style="white-space:nowrap">${escalon(i + 1)}<strong>${n}</strong></td><td>${r}</td><td>${esc(NIVEL_DESC[n].charAt(0).toUpperCase() + NIVEL_DESC[n].slice(1))}.</td></tr>`).join("")}</tbody>
</table>`;

const lecturas = (notas, titulo) => notas.length ? `
<h2>${esc(titulo)}</h2>
<ul>${notas.map((n) => `<li><a href="${n.url}">${esc(n.titulo)}</a></li>`).join("")}</ul>` : "";

const out = (path, html) => { const dir = "dist" + path; mkdirSync(dir, { recursive: true }); writeFileSync(dir + "index.html", html); };

// ── Páginas por etapa ─────────────────────────────────────────
const md = []; // contenido completo en Markdown para llms-full.txt
ETAPAS_DATA.forEach((e, i) => {
  const seo = SEO[e.id], path = etapaUrl(e);
  const prev = ETAPAS_DATA[i - 1], next = ETAPAS_DATA[i + 1];
  const fr = FRICCIONES[e.id] || [], recs = [...(RECS[e.id] || [])].sort((a, b) => b.impacto - a.impacto);
  const body = `
<nav class="crumbs" aria-label="Migas de pan"><a href="/">Diagnóstico</a> › <a href="/guia/">Guía de las 7 etapas</a> › ${esc(e.name)}</nav>
<p class="eyebrow">Etapa ${e.num} de 7 · ${esc(e.pregunta)}</p>
<h1>${esc(seo.t.split(":")[0])}: <em>${esc(seo.t.split(": ")[1])}</em></h1>
<p class="lead">${esc(e.resumen)}</p>
<p>${esc(e.contexto)}</p>

<h2>Dónde se pierden inscriptos en esta etapa</h2>
<ul>${fr.map((f) => `<li>${esc(f.texto)}</li>`).join("")}</ul>

<h2>Qué hacer: 3 acciones por impacto</h2>
<ol>${recs.map((r) => `<li><strong>${esc(r.texto)}</strong> <span class="imp">+${r.impacto.toFixed(1)} pts</span><br><span class="muted">${esc(r.accion)}.</span></li>`).join("")}</ol>

<h2>Las 4 preguntas del diagnóstico para esta etapa</h2>
<p class="muted">Cada respuesta describe un nivel del proceso. Sirven como autoevaluación rápida: ¿en cuál está hoy su institución?</p>
${e.preguntas.map((p, k) => `
<section class="card">
  <h3>${k + 1}. ${esc(p.texto)}</h3>
  <p class="muted">${esc(p.ayuda)}</p>
  ${p.opciones.map((o) => `<div class="opcion"><b>${NIVEL_POR_LETRA[o.letra]}</b><span><strong>${esc(o.etiqueta)}</strong> ${esc(o.texto)}</span></div>`).join("")}
</section>`).join("")}

${lecturas(notasDeEtapa(e.id), "Lecturas relacionadas")}

${ctaBox(`¿Cómo está su universidad en ${e.name.toLowerCase()}?`)}

<nav class="nav-etapas" aria-label="Otras etapas">
  ${prev ? `<a href="${etapaUrl(prev)}">← Etapa ${prev.num}: ${esc(prev.name)}</a>` : `<a href="/guia/">← Guía de las 7 etapas</a>`}
  ${next ? `<a href="${etapaUrl(next)}">Etapa ${next.num}: ${esc(next.name)} →</a>` : `<a href="/guia/">Volver a la guía →</a>`}
</nav>`;
  out(path, page({
    path, title: seo.t, description: seo.d, body,
    jsonld: [
      { "@context": "https://schema.org", "@type": "Article", headline: seo.t, description: seo.d, inLanguage: "es", url: url(path), mainEntityOfPage: url(path), image: url("/og.png"), author: ORG, publisher: ORG, datePublished: HOY, dateModified: HOY, isPartOf: { "@type": "WebSite", name: "Diagnóstico del proceso de inscripción", url: SITE }, about: "Proceso de inscripción universitaria" },
      { "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: [
        { "@type": "ListItem", position: 1, name: "Diagnóstico", item: url("/") },
        { "@type": "ListItem", position: 2, name: "Guía de las 7 etapas", item: url("/guia/") },
        { "@type": "ListItem", position: 3, name: e.name, item: url(path) },
      ] },
    ],
  }));
  md.push(`## Etapa ${e.num}: ${e.name} — ${e.pregunta}\nURL: ${url(path)}\n\n${e.resumen}\n\n${e.contexto}\n\n### Dónde se pierden inscriptos\n${fr.map((f) => `- ${f.texto}`).join("\n")}\n\n### Qué hacer (3 acciones por impacto)\n${recs.map((r) => `- ${r.texto} (+${r.impacto.toFixed(1)} pts: ${r.accion})`).join("\n")}\n\n### Preguntas del diagnóstico\n${e.preguntas.map((p, k) => `${k + 1}. ${p.texto} — ${p.ayuda}\n${p.opciones.map((o) => `   - ${NIVEL_POR_LETRA[o.letra]}: ${o.etiqueta} ${o.texto}`).join("\n")}`).join("\n")}\n`);
});

// ── Guía (página pilar) ───────────────────────────────────────
const guiaT = "Las 7 etapas del proceso de inscripción universitaria";
const guiaD = "Guía para universidades de Latinoamérica: dónde se pierden aspirantes, desde la primera búsqueda hasta el primer día de clases, y qué hacer.";
const guiaBody = `
<nav class="crumbs" aria-label="Migas de pan"><a href="/">Diagnóstico</a> › Guía de las 7 etapas</nav>
<p class="eyebrow">Guía para universidades</p>
<h1>Las 7 etapas del proceso de <em>inscripción universitaria</em></h1>
<p class="lead">Un aspirante recorre 7 momentos desde que busca dónde estudiar hasta que llega a su primer día de clases. En cada uno la universidad puede ganarlo o perderlo. Esta guía explica qué pasa en cada etapa, dónde se pierden inscriptos y qué hacer.</p>
<p>Más publicidad no alcanza: si el proceso pierde aspirantes en el camino, invertir en campañas es llenar un balde agujereado. ${esc(AUTORIDAD)}</p>

<h2>Las 7 etapas</h2>
<ol class="etapas-lista">
${ETAPAS_DATA.map((e) => `<li><a href="${etapaUrl(e)}"><span class="n">${num2(e.num)}</span><strong>${esc(e.name)} — ${esc(e.pregunta)}</strong><span class="r">${esc(e.resumen)}</span></a></li>`).join("\n")}
</ol>

<h2>Cómo se mide el proceso</h2>
<p>El diagnóstico evalúa cada etapa con 4 preguntas. Cada opción describe un nivel del proceso; el puntaje de la etapa es el promedio y el global es el promedio de las 7 etapas, de 1 a 5.</p>
${nivelesTabla()}

${ctaBox()}

${lecturas(NOTAS, "Notas de Campus Latina sobre admisión universitaria")}

<h2>Preguntas frecuentes</h2>
${FAQ.map(([q, a]) => `<details><summary>${esc(q)}</summary><p>${esc(a)}</p></details>`).join("\n")}
`;
out("/guia/", page({
  path: "/guia/", title: guiaT, description: guiaD, body: guiaBody,
  jsonld: [
    { "@context": "https://schema.org", "@type": "Article", headline: guiaT, description: guiaD, inLanguage: "es", url: url("/guia/"), mainEntityOfPage: url("/guia/"), image: url("/og.png"), author: ORG, publisher: ORG, datePublished: HOY, dateModified: HOY },
    { "@context": "https://schema.org", "@type": "ItemList", name: guiaT, itemListElement: ETAPAS_DATA.map((e) => ({ "@type": "ListItem", position: e.num, name: e.name, url: url(etapaUrl(e)) })) },
    { "@context": "https://schema.org", "@type": "FAQPage", mainEntity: FAQ.map(([q, a]) => ({ "@type": "Question", name: q, acceptedAnswer: { "@type": "Answer", text: a } })) },
    { "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: [
      { "@type": "ListItem", position: 1, name: "Diagnóstico", item: url("/") },
      { "@type": "ListItem", position: 2, name: "Guía de las 7 etapas", item: url("/guia/") },
    ] },
  ],
}));

// ── sitemap.xml ───────────────────────────────────────────────
const urls = [["/", "1.0", "monthly"], ["/guia/", "0.9", "monthly"], ...ETAPAS_DATA.map((e) => [etapaUrl(e), "0.8", "monthly"])];
writeFileSync("dist/sitemap.xml", `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(([p, pr, f]) => `  <url><loc>${url(p)}</loc><lastmod>${HOY}</lastmod><changefreq>${f}</changefreq><priority>${pr}</priority></url>`).join("\n")}
</urlset>
`);

// ── robots.txt (buscadores y crawlers de IA habilitados explícitamente) ──
const bots = ["Googlebot", "Bingbot", "DuckDuckBot", "Applebot", "Applebot-Extended", "Google-Extended", "GPTBot", "OAI-SearchBot", "ChatGPT-User", "ClaudeBot", "Claude-SearchBot", "Claude-User", "anthropic-ai", "PerplexityBot", "Perplexity-User", "CCBot", "Meta-ExternalAgent", "Amazonbot", "cohere-ai", "YouBot"];
const reglas = "Allow: /\nDisallow: /admin\nDisallow: /api/\n";
writeFileSync("dist/robots.txt", `# Diagnóstico del proceso de inscripción · CampusLatina
# Contenido público: habilitado para buscadores y asistentes de IA.
${bots.map((b) => `User-agent: ${b}`).join("\n")}
${reglas}
User-agent: *
${reglas}
Sitemap: ${url("/sitemap.xml")}
`);

// ── llms.txt (https://llmstxt.org) y llms-full.txt ─────────────
writeFileSync("dist/llms.txt", `# Diagnóstico del proceso de inscripción universitaria — CampusLatina

> Autodiagnóstico gratuito para universidades de Latinoamérica: en 10 minutos (28 preguntas) muestra en qué etapa del recorrido del aspirante se pierden inscriptos y qué resolver primero. Creado por CampusLatina y CIeLatam.

El recorrido del aspirante se divide en 7 etapas: descubrimiento, exploración, activación, acompañamiento, decisión, inscripción y retención temprana. Cada etapa se evalúa con 4 preguntas de opciones que describen el nivel de desarrollo del proceso (puntaje de 1 a 5). Niveles: ${NIVELES.map(([n, r]) => `${n} (${r})`).join(", ")}. ${AUTORIDAD}

## Guía
- [Las 7 etapas del proceso de inscripción universitaria](${url("/guia/")}): qué pasa en cada etapa, dónde se pierden aspirantes y cómo se mide.
${ETAPAS_DATA.map((e) => `- [${SEO[e.id].t}](${url(etapaUrl(e))}): ${SEO[e.id].d}`).join("\n")}

## Herramienta
- [Diagnóstico gratuito](${url("/")}): 28 preguntas, informe en pantalla y en PDF por mail, con 3 acciones prioritarias por etapa.

## Notas de Campus Latina
${NOTAS.map((n) => `- [${n.titulo}](${n.url}) (${n.fecha})`).join("\n")}

## Optional
- [Contenido completo en texto](${url("/llms-full.txt")}): todas las etapas, fricciones, recomendaciones y preguntas del diagnóstico.
- [Campus Latina](https://campuslatina.com/llms.txt): quiénes somos y cómo trabajamos.
`);
writeFileSync("dist/llms-full.txt", `# Las 7 etapas del proceso de inscripción universitaria
Fuente: ${url("/guia/")} · CampusLatina & CIeLatam · Actualizado ${HOY}

${guiaD}

## Cómo se mide
Cada etapa se evalúa con 4 preguntas. Cada opción describe un nivel del proceso (valen 1, 2, 4 y 5 puntos). El puntaje de la etapa es el promedio de sus respuestas y el global es el promedio de las 7 etapas, de 1 a 5.
${NIVELES.map(([n, r]) => `- ${n} (${r}): ${NIVEL_DESC[n]}.`).join("\n")}

${md.join("\n")}
## Preguntas frecuentes
${FAQ.map(([q, a]) => `### ${q}\n${a}`).join("\n\n")}

## Hacer el diagnóstico
${url("/")} — gratuito, unos 10 minutos.
`);

// ── 404 ─────────────────────────────────────────────────────
writeFileSync("dist/404.html", page({ path: "/404", title: "Página no encontrada", description: "La página que busca no existe.", type: "website",
  body: `<h1>Página <em>no encontrada</em></h1><p class="lead">La dirección no existe o cambió.</p><p><a href="/">Hacer el diagnóstico gratis</a> · <a href="/guia/">Leer la guía de las 7 etapas</a></p>` }).replace('content="index, follow, max-snippet:-1, max-image-preview:large"', 'content="noindex"'));

console.log(`seo: /guia/ + ${ETAPAS_DATA.length} etapas, sitemap (${urls.length} URLs), robots.txt, llms.txt, llms-full.txt`);
