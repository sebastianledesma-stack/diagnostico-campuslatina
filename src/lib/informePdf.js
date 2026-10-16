// Datos del informe y su versión imprimible (A4): tapa oscura con el campo de líneas, resumen por etapa
// y el análisis de cada etapa. No depende de React: lo usan la solapa Informe (abre el HTML en otra
// pestaña e imprime) y scripts/informe-pdf.mjs (PDF de muestra con Chrome sin ventana).
import { ETAPAS_DATA } from "../data/etapas.js";
import { FRICCIONES } from "../data/fricciones.js";
import { getNivel, calcScore, accionesDeEtapa, recsDeEtapa, sinAcciones, r1, fmt1, potencialEtapa, calcGlobalPotential } from "./scoring.js";
import { NIVEL_DESC, lecturaDiagnostico, AUTORIDAD } from "../data/textos.js";

const TINTA = "#0A2329", PETROLEO = "#0B6470", AGUA = "#7FD6DE", CORAL = "#FF6B4A", CORAL_CLARO = "#FFB9A8", GRIS = "#4D6166", LINEA = "#D5E3E5", BRUMA = "#EAF3F4", SLATE = "#A9C2C6";
const ORDEN_NIVEL = { "Inicial": 1, "En desarrollo": 2, "Consolidado": 3, "Avanzado": 4 };
const num2 = (n) => String(n).padStart(2, "0");
const capital = (s) => s.charAt(0).toUpperCase() + s.slice(1);
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
const x = (s) => ((Math.max(1, Math.min(5, s)) - 1) / 4) * 100;

// Todo lo que el informe necesita a partir de las respuestas.
export function datosInforme(respuestas) {
  const scores = {};
  ETAPAS_DATA.forEach((e) => { scores[e.id] = calcScore(respuestas, e.id); });
  const etapas = ETAPAS_DATA.map((e) => ({ ...e, score: scores[e.id], pot: potencialEtapa(scores, e.id, respuestas) }));
  const global = parseFloat((etapas.reduce((a, e) => a + e.score, 0) / etapas.length).toFixed(2));
  const potencial = calcGlobalPotential(scores, respuestas);
  return {
    respuestas, scores, etapas, global, potencial,
    hayMejora: r1(potencial) > r1(global),
    peor: etapas.reduce((a, e) => (e.score < a.score ? e : a)),
    mejor: etapas.reduce((a, e) => (e.score > a.score ? e : a)),
    todoEnD: sinAcciones(respuestas),
    cubiertas: ETAPAS_DATA.reduce((n, e) => n + recsDeEtapa(respuestas, e.id).filter((r) => r.cubierta).length, 0),
  };
}

// Campo de líneas quieto (SVG) para la tapa: líneas que nacen dispersas y convergen abajo a la derecha.
function campo(w = 210, h = 120) {
  let s = 7; const R = () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; };
  const lineas = [], puntos = [];
  const en = (p, t) => { const u = 1 - t; return [0, 1].map((k) => u * u * u * p[0][k] + 3 * u * u * t * p[1][k] + 3 * u * t * t * p[2][k] + t * t * t * p[3][k]); };
  for (let i = 0; i < 52; i++) {
    const y0 = h * (0.02 + R() * 0.98), ye = h * (0.74 + (R() - 0.5) * 0.05);
    const p = [[-2, y0], [w * (0.22 + R() * 0.2), y0 + (R() - 0.5) * h * 0.45], [w * (0.58 + R() * 0.16), ye + (R() - 0.5) * h * 0.06], [w + 2, ye]];
    lineas.push(`<path d="M${p[0].join(" ")} C${p[1].join(" ")} ${p[2].join(" ")} ${p[3].join(" ")}" stroke="${AGUA}" stroke-opacity="${(0.1 + R() * 0.3).toFixed(2)}" stroke-width="${(0.12 + R() * 0.22).toFixed(2)}" fill="none"/>`);
    if (i % 5 === 0) { const t = 0.15 + R() * 0.6, [px, py] = en(p, t); puntos.push(`<circle cx="${px.toFixed(1)}" cy="${py.toFixed(1)}" r="${(0.5 + R() * 0.5).toFixed(2)}" fill="${AGUA}" fill-opacity=".8"/>`); }
    if (i % 13 === 0) { const [px, py] = en(p, 0.9 + R() * 0.08); puntos.push(`<circle cx="${px.toFixed(1)}" cy="${py.toFixed(1)}" r=".9" fill="${CORAL}"/>`); }
  }
  return `<svg class="campo" viewBox="0 0 ${w} ${h}" preserveAspectRatio="none" aria-hidden="true">${lineas.join("")}${puntos.join("")}</svg>`;
}

// Escalón de 4 barras (nivel) y tramo de 1 a 5 (hoy y con el plan), como en el informe en pantalla.
const escalon = (score) => {
  const n = ORDEN_NIVEL[getNivel(score).label];
  return `<svg class="esc" viewBox="0 0 17 10" aria-hidden="true">${[1, 2, 3, 4].map((k) => `<rect x="${(k - 1) * 4.4}" y="${10 - 2.5 * k}" width="3" height="${2.5 * k}" fill="${k <= n ? PETROLEO : LINEA}"/>`).join("")}</svg>`;
};
const tramo = (hoy, plan) => {
  const sube = r1(plan) > r1(hoy);
  return `<svg class="tramo" viewBox="-3 0 106 10" preserveAspectRatio="none" aria-hidden="true">
    <line x1="0" x2="100" y1="5" y2="5" stroke="${LINEA}" stroke-width="1" vector-effect="non-scaling-stroke"/>
    <line x1="0" x2="${x(hoy)}" y1="5" y2="5" stroke="${PETROLEO}" stroke-width="2" vector-effect="non-scaling-stroke"/>
    ${sube ? `<line x1="${x(hoy)}" x2="${x(plan)}" y1="5" y2="5" stroke="${CORAL}" stroke-width="2" stroke-dasharray="3 3" vector-effect="non-scaling-stroke"/>` : ""}
  </svg><span class="pt" style="left:${x(hoy)}%"></span>${sube ? `<span class="pt plan" style="left:${x(plan)}%"></span>` : ""}`;
};

export function htmlInforme(d, registro, { origen = "", imprimir = true, fecha = new Date() } = {}) {
  const nivel = getNivel(d.global).label;
  const mes = fecha.toLocaleDateString("es-AR", { month: "long", year: "numeric" });
  const quien = [registro.nombre, registro.cargo, registro.pais].filter(Boolean).map(esc).join(" · ");
  const universidad = esc(registro.universidad || "Su institución");
  const filas = d.etapas.map((e) => `<tr><td class="nn">${num2(e.num)}</td><td><strong>${e.name}</strong><span class="q">${e.pregunta}</span></td>
    <td class="niv">${escalon(e.score)}${getNivel(e.score).label}</td><td class="n">${fmt1(e.score)}</td><td class="tr"><div class="trw">${tramo(e.score, e.pot)}</div></td><td class="n p">${fmt1(e.pot)}</td></tr>`).join("");
  const ganancias = [...d.etapas].sort((a, b) => (b.pot - b.score) - (a.pot - a.score)).filter((e) => r1(e.pot) > r1(e.score)).slice(0, 3);
  const detalle = d.etapas.map((e) => {
    const max = `<li class="vacia">Esta etapa ya está en el nivel más alto que mide el diagnóstico.</li>`;
    const fricc = e.score < 5 ? (FRICCIONES[e.id] || []).map((f, k) => `<li><span class="k">${num2(k + 1)}</span><span>${f.texto}</span></li>`).join("") : max;
    const recs = accionesDeEtapa(d.respuestas, e.id).map((r) => `<li><span class="box"></span><span>${r.tipo === "nivel" ? `<em class="mejora">Mejora: ${r.pregunta}</em>` : ""}${r.texto}</span><span class="pts">+${fmt1(r.impacto)}</span></li>`).join("") || max;
    return `<section class="etapa">
      <header><span class="num">${num2(e.num)}</span><div><h3>${e.name}</h3><p class="preg"><span>${e.pregunta}</span></p></div>
        <div class="hoyplan"><div><span class="lbl">Hoy</span><b>${fmt1(e.score)}</b><small>${getNivel(e.score).label}</small></div><div><span class="lbl">Con el plan</span><b class="p">${fmt1(e.pot)}</b><small>${getNivel(e.pot).label}</small></div></div></header>
      <div class="dos"><div><span class="lbl">El momento del aspirante</span><p>${e.resumen}</p></div><div><span class="lbl">Qué mide esta etapa</span><p>${e.contexto}</p></div></div>
      <span class="lbl">Dónde suele perderse valor</span><ol class="lista">${fricc}</ol>
      <span class="lbl">Acciones recomendadas</span><ol class="lista acc">${recs}</ol>
    </section>`;
  }).join("");

  return `<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"><title>Diagnóstico del proceso de inscripción — ${universidad}</title>
<link rel="stylesheet" href="${origen}/marca.css"><style>
@page{size:A4;margin:16mm 18mm 20mm;@bottom-left{content:"Campus Latina · Diagnóstico del proceso de inscripción";font:8pt 'Schibsted Grotesk',Arial,sans-serif;color:${GRIS}}@bottom-right{content:counter(page);font:8pt 'Schibsted Grotesk',Arial,sans-serif;color:${GRIS}}}
@page :first{margin:0;@bottom-left{content:none}@bottom-right{content:none}}
*{box-sizing:border-box;margin:0;padding:0}html{-webkit-print-color-adjust:exact;print-color-adjust:exact}
body{font-family:'Schibsted Grotesk',Arial,sans-serif;color:${TINTA};font-size:9.5pt;line-height:1.55}
.lbl{display:block;font-family:'CL Etiquetas','Schibsted Grotesk',Arial,sans-serif;font-size:7pt;letter-spacing:.12em;text-transform:uppercase;color:${GRIS};margin:0 0 2mm}
.tapa{position:relative;width:210mm;height:297mm;background:${TINTA};color:#fff;padding:20mm 20mm;overflow:hidden;page-break-after:always}
.tapa img{height:11mm;position:relative}.tapa .lbl{color:${SLATE}}
.tapa .cuerpo{position:relative;margin-top:42mm}
.tapa h1{font-size:30pt;line-height:1.04;letter-spacing:-.03em;font-weight:700;margin:4mm 0 3mm;max-width:160mm}
.tapa .quien{color:${SLATE};font-size:10pt}
.tapa .cifras{display:flex;gap:18mm;margin-top:24mm;align-items:flex-end}
.dato{font-size:76pt;font-weight:700;line-height:.82;letter-spacing:-.05em}.dato.coral{color:${CORAL}}
.tapa .sub{color:${SLATE};font-size:10pt;margin-top:3mm}
.tapa .flecha{width:20mm;height:1px;background:${SLATE};margin-bottom:12mm;position:relative}
.campo{position:absolute;left:0;right:0;bottom:0;width:210mm;height:125mm}
.tapa .pie{position:absolute;left:20mm;bottom:12mm;font-size:7.5pt;color:${SLATE};letter-spacing:.04em}
h2{font-size:21pt;line-height:1.08;letter-spacing:-.03em;font-weight:700;margin:2mm 0 5mm;max-width:150mm}
h2 em,.preg span{font-family:Newsreader,Georgia,serif;font-style:italic;font-weight:400;background:linear-gradient(transparent 60%,${CORAL_CLARO} 60%,${CORAL_CLARO} 92%,transparent 92%)}
.lectura{font-size:11pt;line-height:1.55;color:#1F3A40;max-width:155mm;margin-bottom:7mm}
.sec{margin-top:7mm}.foco .lbl{min-height:6.5mm}.regla{border-top:1.5pt solid ${TINTA};padding-top:3mm}
table{width:100%;border-collapse:collapse;margin-top:1mm}td,th{padding:1.9mm 1.5mm;border-bottom:.5pt solid ${LINEA};text-align:left;vertical-align:middle}
th{font-family:'CL Etiquetas','Schibsted Grotesk',Arial,sans-serif;font-size:6.5pt;letter-spacing:.1em;text-transform:uppercase;color:${GRIS};font-weight:600;border-bottom:1.5pt solid ${TINTA}}
.nn{font-weight:700;color:${PETROLEO};font-size:11pt;width:9mm}.q{display:block;color:${GRIS};font-size:8pt}
.niv{white-space:nowrap;font-size:8.5pt;color:${GRIS}}.esc{width:4.6mm;height:2.8mm;margin-right:1.6mm;vertical-align:-.2mm}
.n{text-align:right;font-weight:700;font-size:11pt;width:11mm}th.n{font-size:6.5pt}.p{color:${PETROLEO}}
.tr{width:34mm}.trw{position:relative;height:3mm}.tramo{position:absolute;inset:0;width:100%;height:100%;overflow:visible}
.pt{position:absolute;top:50%;width:2.2mm;height:2.2mm;margin:-1.1mm 0 0 -1.1mm;border-radius:50%;background:${PETROLEO}}.pt.plan{background:#fff;border:.5mm solid ${CORAL}}
.niveles{display:grid;grid-template-columns:repeat(4,1fr);gap:0;margin-top:3mm}.niveles div{padding:0 3mm;border-left:.5pt solid ${LINEA};font-size:8pt;color:${GRIS}}.niveles div:first-child{border-left:none;padding-left:0}
.niveles b{display:block;color:${TINTA};font-size:9pt;margin-bottom:1mm}
.foco{display:grid;grid-template-columns:repeat(3,1fr);margin-top:3mm}.foco div{padding:0 4mm;border-left:.5pt solid ${LINEA}}.foco div:first-child{border-left:none;padding-left:0}
.foco b{display:block;font-size:24pt;letter-spacing:-.04em;color:${PETROLEO};line-height:1;margin:1.5mm 0}
.etapa{padding-top:6mm;margin-bottom:8mm;border-top:1.5pt solid ${TINTA}}.etapa header,.dos,.lista li{break-inside:avoid}.lbl{break-after:avoid}.etapa header{break-after:avoid}
.etapa header{display:grid;grid-template-columns:auto 1fr auto;gap:5mm;align-items:end;margin-bottom:5mm}
.num{font-size:40pt;font-weight:700;color:${PETROLEO};line-height:.8;letter-spacing:-.05em}
h3{font-size:17pt;letter-spacing:-.025em;line-height:1.1}.preg{font-size:12pt;margin-top:1mm}
.hoyplan{display:flex;gap:7mm}.hoyplan b{display:block;font-size:20pt;letter-spacing:-.04em;line-height:1}.hoyplan small{display:block;font-size:7.5pt;color:${GRIS};margin-top:.8mm}
.dos{display:grid;grid-template-columns:1fr 1fr;gap:8mm;margin-bottom:5mm}.dos p{color:#1F3A40}
.lista{list-style:none;margin:0 0 5mm;border-top:.5pt solid ${LINEA}}.lista li{display:grid;grid-template-columns:8mm 1fr auto;gap:2mm;padding:2mm 0;border-bottom:.5pt solid ${LINEA}}
.lista .k{font-family:'CL Etiquetas',Arial,sans-serif;font-size:7pt;letter-spacing:.1em;color:${PETROLEO};padding-top:.6mm}
.lista .box{width:3mm;height:3mm;border:.4mm solid ${PETROLEO};margin-top:.8mm}
.lista .pts{font-weight:700;color:${PETROLEO}}.mejora{display:block;font-style:normal;color:${GRIS};font-size:8pt}.lista .vacia{display:block;color:${GRIS}}
.cierre{background:${TINTA};color:#fff;padding:10mm 12mm;margin-top:8mm;break-inside:avoid}.cierre h2{color:#fff;margin:2mm 0 3mm}.cierre h2 em{background:linear-gradient(transparent 64%,rgba(255,107,74,.6) 64%,rgba(255,107,74,.6) 90%,transparent 90%)}
.cierre p{color:rgba(255,255,255,.75);max-width:150mm}.cierre .lbl{color:${AGUA}}
.ilus{font-size:7.5pt;color:${GRIS};margin-top:2mm}
</style></head><body>
<section class="tapa">
  ${campo()}
  <img src="${origen}/campus-latina-sobre-oscuro.svg" alt="Campus Latina">
  <div class="cuerpo">
    <span class="lbl">Diagnóstico del proceso de inscripción · ${mes}</span>
    <h1>${universidad}</h1>
    <div class="quien">${quien}</div>
    <div class="cifras">
      <div><span class="lbl">Hoy</span><div class="dato">${fmt1(d.global)}</div><div class="sub">de 5 · ${nivel}</div></div>
      ${d.hayMejora ? `<div class="flecha"></div><div><span class="lbl">Con el plan</span><div class="dato coral">${fmt1(d.potencial)}</div><div class="sub">${getNivel(d.potencial).label}</div></div>` : ""}
    </div>
  </div>
  <div class="pie">CampusLatina × CIeLatam × Salesforce</div>
</section>

<section>
  <span class="lbl">Qué dice su diagnóstico</span>
  <h2>${capital(NIVEL_DESC[nivel])}.</h2>
  <p class="lectura">${lecturaDiagnostico(d.global, d.peor)}</p>
  <div class="foco">
    <div><span class="lbl">Donde mejor funciona</span><b>${fmt1(d.mejor.score)}</b>${d.mejor.name}</div>
    <div><span class="lbl">${d.todoEnD ? "Próximo paso" : "Donde más inscriptos se pierden"}</span><b>${d.todoEnD ? "5.0" : fmt1(d.peor.score)}</b>${d.todoEnD ? "Validarlo con datos" : d.peor.name}</div>
    <div><span class="lbl">Con todas las acciones del plan</span><b>${fmt1(d.potencial)}</b>${d.hayMejora ? `+${fmt1(r1(d.potencial) - r1(d.global))} puntos sobre hoy` : "Máximo de referencia"}</div>
  </div>
  <div class="sec"><span class="lbl">Las 7 etapas del recorrido</span>
  <table><thead><tr><th></th><th>Etapa</th><th>Nivel</th><th class="n">Hoy</th><th>Hoy → con el plan</th><th class="n">Plan</th></tr></thead><tbody>${filas}</tbody></table>
  <p class="ilus">El punto marca el puntaje de hoy; el aro, el puntaje si se aplican todas las acciones del plan. Escala de 1 a 5.</p></div>
  <div class="sec regla"><span class="lbl">Qué significa cada nivel</span><div class="niveles">
    ${Object.keys(ORDEN_NIVEL).map((n) => `<div><b>${escalon({ "Inicial": 1.5, "En desarrollo": 2.5, "Consolidado": 3.5, "Avanzado": 4.5 }[n])}${n}</b>${capital(NIVEL_DESC[n])}.</div>`).join("")}
  </div></div>
</section>

<section style="page-break-before:always">
  ${ganancias.length ? `<span class="lbl">Por dónde empezar</span><h2>Las etapas donde más <em>se puede ganar</em></h2>
  <div class="foco" style="margin-bottom:9mm">${ganancias.map((e) => `<div><span class="lbl">${num2(e.num)} · ${e.name}</span><b>+${fmt1(r1(e.pot) - r1(e.score))}</b>de ${fmt1(e.score)} a ${fmt1(e.pot)} con las acciones del plan</div>`).join("")}</div>` : ""}
  <span class="lbl">Análisis por etapa</span>
  ${detalle}
  <div class="cierre"><span class="lbl">CampusLatina</span>${registro.target
      ? `<h2>Revisemos su diagnóstico <em>en 45 minutos</em></h2><p>Una videollamada para recorrer sus resultados y definir por dónde empezar. ${AUTORIDAD}</p>`
      : `<h2>¿Quiere inscribir <em>más estudiantes</em> el próximo ciclo?</h2><p>${AUTORIDAD} Escríbanos y revisamos su diagnóstico juntos.</p>`}<p style="margin-top:3mm;color:#fff">campuslatina.com</p></div>
</section>
${imprimir ? `<script>window.onload=function(){(document.fonts?document.fonts.ready:Promise.resolve()).then(function(){setTimeout(function(){window.print();},300);});};<\/script>` : ""}
</body></html>`;
}
