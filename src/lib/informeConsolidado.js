// Informe consolidado: la lectura regional de todos los diagnósticos, sin nombrar a ninguna institución.
// Lo arma el panel (/admin → Informe consolidado) con las filas que ya cargó y se imprime igual que el
// informe individual (HTML A4 en otra pestaña). Con `institucion`, la misma lectura marca además las
// respuestas de esa institución, para enviársela a quien participó.
import { ETAPAS_DATA } from "../data/etapas.js";
import { NIVEL_DESC, AUTORIDAD } from "../data/textos.js";
import { calcResultados, getNivel, fmt1 } from "./scoring.js";
import { campo, escalon, esc } from "./informePdf.js";

const TINTA = "#0A2329", PETROLEO = "#0B6470", AGUA = "#7FD6DE", AMBAR = "#F08C1A", AMBAR_LUZ = "#FFAE4A", AMBAR_CLARO = "#FFCF8A", GRIS = "#4D6166", LINEA = "#D5E3E5", BRUMA = "#EAF3F4", SLATE = "#A9C2C6";
// Escala de petróleo de claro a oscuro: niveles (Inicial → Avanzado) y respuestas (A → D). Nunca rojo ni ámbar.
const TONOS = ["#D5E6E8", "#93C3CA", "#2F7F8A", "#0A4F59"];
const NIVELES = ["Inicial", "En desarrollo", "Consolidado", "Avanzado"];
const LETRAS = ["A", "B", "C", "D"];
// Ningún grupo (país, tamaño) con menos instituciones que esto se muestra por separado.
export const MIN_GRUPO = 5;

const num2 = (n) => String(n).padStart(2, "0");
const media = (v) => (v.length ? v.reduce((a, b) => a + b, 0) / v.length : 0);
const sinPunto = (s) => String(s).replace(/\.$/, "");
const conSigno = (n) => `${n > 0.05 ? "+" : n < -0.05 ? "−" : ""}${fmt1(Math.abs(n))}`;
const fechaLarga = (d) => new Date(d).toLocaleDateString("es-AR", { day: "numeric", month: "long", year: "numeric" });
function cuantil(v, p) {
  const s = [...v].sort((a, b) => a - b);
  if (!s.length) return 0;
  const i = (s.length - 1) * p, lo = Math.floor(i), hi = Math.ceil(i);
  return s[lo] + (s[hi] - s[lo]) * (i - lo);
}
// Porcentajes enteros que suman 100 (resto mayor).
function porcentajes(cuenta) {
  const total = cuenta.reduce((a, b) => a + b, 0);
  if (!total) return cuenta.map(() => 0);
  const exactos = cuenta.map((c) => (c * 100) / total);
  const pcts = exactos.map(Math.floor);
  let resto = 100 - pcts.reduce((a, b) => a + b, 0);
  exactos.map((e, i) => [e - pcts[i], i]).sort((a, b) => b[0] - a[0]).forEach(([, i]) => { if (resto > 0 && cuenta[i]) { pcts[i]++; resto--; } });
  return pcts;
}

// ── QUÉ DIAGNÓSTICOS ENTRAN ───────────────────────────────
const normalizar = (s) => String(s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
export const claveInstitucion = (r) => `${normalizar(r.universidad)}|${normalizar(r.pais)}`;

// Completos, sin los marcados como test y dentro del período. Una institución cuenta una sola vez:
// si completó el diagnóstico más de una vez, se toma el más reciente.
export function baseConsolidado(rows, { desde, hasta } = {}) {
  const d = desde ? new Date(`${desde}T00:00:00`) : null;
  const h = hasta ? new Date(`${hasta}T23:59:59.999`) : null;
  const delPeriodo = rows.filter((r) => (!d || new Date(r.created_at) >= d) && (!h || new Date(r.created_at) <= h));
  const completos = delPeriodo.filter((r) => !r.es_test && r.estado !== "en_curso" && r.respuestas);
  const porInstitucion = new Map();
  [...completos].sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).forEach((r) => {
    if (!porInstitucion.has(claveInstitucion(r))) porInstitucion.set(claveInstitucion(r), r);
  });
  const filas = [...porInstitucion.values()];
  return {
    filas,
    completos: completos.length,
    repetidos: completos.length - filas.length,
    enCurso: delPeriodo.filter((r) => !r.es_test && r.estado === "en_curso").length,
    tests: delPeriodo.filter((r) => r.es_test).length,
    paises: new Set(filas.map((r) => r.pais)).size,
  };
}

// ── LOS NÚMEROS ───────────────────────────────────────────
const TAMANOS = [
  { desde: 0, hasta: 5000, rangos: ["lt1k", "1k-5k"] },
  { desde: 5000, hasta: 40000, rangos: ["5k-15k", "15k-40k"] },
  { desde: 40000, hasta: null, rangos: ["gt40k"] },
];
const miles = (n) => n.toLocaleString("es-AR");
const textoTamano = (g) => (g.desde === 0 ? `Hasta ${miles(g.hasta)} estudiantes` : g.hasta == null ? `Más de ${miles(g.desde)} estudiantes` : `De ${miles(g.desde)} a ${miles(g.hasta)} estudiantes`);

// Por tamaño: un grupo con menos de MIN_GRUPO instituciones se une con su vecino más chico.
function gruposTamano(inst) {
  const grupos = TAMANOS.map((t) => ({ ...t, inst: inst.filter((x) => t.rangos.includes(x.fila.alumnos_actuales)) })).filter((g) => g.inst.length);
  for (let i; grupos.length > 1 && (i = grupos.findIndex((g) => g.inst.length < MIN_GRUPO)) !== -1;) {
    const j = i === 0 ? 1 : i === grupos.length - 1 ? i - 1 : grupos[i - 1].inst.length <= grupos[i + 1].inst.length ? i - 1 : i + 1;
    const a = Math.min(i, j);
    grupos.splice(a, 2, { desde: grupos[a].desde, hasta: grupos[a + 1].hasta, inst: [...grupos[a].inst, ...grupos[a + 1].inst] });
  }
  return grupos.length > 1 && grupos.every((g) => g.inst.length >= MIN_GRUPO) ? grupos.map((g) => ({ texto: textoTamano(g), inst: g.inst })) : [];
}

// Por país: los países con al menos MIN_GRUPO instituciones; el resto, junto como «Otros países»
// (si ese grupo queda chico, se le suma el país más chico de los que se muestran).
function gruposPais(inst) {
  const porPais = new Map();
  inst.forEach((x) => porPais.set(x.fila.pais, [...(porPais.get(x.fila.pais) || []), x]));
  const mostrados = [...porPais].filter(([, xs]) => xs.length >= MIN_GRUPO).sort((a, b) => b[1].length - a[1].length);
  let resto = [...porPais].filter(([, xs]) => xs.length < MIN_GRUPO).flatMap(([, xs]) => xs);
  while (resto.length > 0 && resto.length < MIN_GRUPO && mostrados.length) resto = resto.concat(mostrados.pop()[1]);
  const grupos = mostrados.map(([pais, xs]) => ({ texto: pais, inst: xs }));
  if (resto.length >= MIN_GRUPO) grupos.push({ texto: "Otros países", inst: resto });
  return grupos.length > 1 ? grupos : [];
}

const resumenGrupo = ({ texto, inst }) => ({
  texto, n: inst.length, global: media(inst.map((x) => x.score_global)),
  etapas: Object.fromEntries(ETAPAS_DATA.map((e) => [e.id, media(inst.map((x) => x.scores[e.id]))])),
});

// Todo lo que el informe necesita a partir de las filas de la base (una por institución).
export function datosConsolidado(filas, { institucion = null } = {}) {
  const inst = filas.map((fila) => ({ fila, ...calcResultados(fila.respuestas || {}) }));
  const n = inst.length;
  const global = media(inst.map((x) => x.score_global));
  const etapas = ETAPAS_DATA.map((e) => {
    const vals = inst.map((x) => x.scores[e.id]);
    return {
      ...e, prom: media(vals), p25: cuantil(vals, 0.25), p75: cuantil(vals, 0.75),
      niveles: NIVELES.map((nv) => vals.filter((v) => getNivel(v).label === nv).length),
      preguntas: e.preguntas.map((p, q) => {
        const letras = inst.map((x) => x.fila.respuestas?.[`${e.id}_${q}`]).filter((l) => LETRAS.includes(l));
        const cuenta = LETRAS.map((l) => letras.filter((x) => x === l).length);
        const total = letras.length;
        return {
          q, texto: p.texto, opciones: p.opciones, cuenta, total,
          bajo: total ? (cuenta[0] + cuenta[1]) / total : 0,
          alto: total ? (cuenta[2] + cuenta[3]) / total : 0,
          prom: total ? cuenta.reduce((a, c, i) => a + c * p.opciones[i].valor, 0) / total : 0,
          moda: cuenta.indexOf(Math.max(...cuenta)),
        };
      }),
    };
  });
  const preguntas = etapas.flatMap((e) => e.preguntas.map((p) => ({ ...p, etapa: e })));
  // Las prácticas menos extendidas (más respuestas A o B), una por etapa; y la más extendida.
  const vistas = new Set();
  const brechas = [...preguntas].sort((a, b) => b.bajo - a.bajo || a.prom - b.prom).filter((p) => {
    if (vistas.has(p.etapa.id)) return false;
    vistas.add(p.etapa.id);
    return true;
  }).slice(0, 3);
  const fortaleza = [...preguntas].sort((a, b) => b.alto - a.alto || b.prom - a.prom)[0];

  let suyo = null;
  if (institucion) {
    const r = calcResultados(institucion.respuestas || {});
    const otros = inst.filter((x) => x.fila.id !== institucion.id);
    const difs = etapas.map((e) => ({ etapa: e, dif: r.scores[e.id] - e.prom }));
    suyo = {
      ...r, universidad: institucion.universidad, respuestas: institucion.respuestas || {},
      supera: otros.length >= MIN_GRUPO - 1 ? otros.filter((x) => x.score_global < r.score_global).length / otros.length : null,
      ventaja: difs.reduce((a, b) => (b.dif > a.dif ? b : a)),
      oportunidad: difs.reduce((a, b) => (b.dif < a.dif ? b : a)),
      arriba: difs.filter((x) => x.dif > 0.05).length,
    };
  }

  const fechas = filas.map((r) => new Date(r.created_at).getTime());
  return {
    n, global, etapas, brechas, fortaleza, suyo,
    niveles: NIVELES.map((nv) => inst.filter((x) => getNivel(x.score_global).label === nv).length),
    peor: etapas.reduce((a, e) => (e.prom < a.prom ? e : a)),
    mejor: etapas.reduce((a, e) => (e.prom > a.prom ? e : a)),
    tamanos: gruposTamano(inst).map(resumenGrupo),
    paises: gruposPais(inst).map(resumenGrupo),
    desde: n ? Math.min(...fechas) : null,
    hasta: n ? Math.max(...fechas) : null,
  };
}

// ── PIEZAS ────────────────────────────────────────────────
const TITULAR = {
  "Inicial": "Conseguir inscriptos todavía depende <em>de personas y del azar</em>",
  "En desarrollo": "Hay intención en todo el recorrido, pero <em>todavía no un sistema</em>",
  "Consolidado": "La base está: el próximo salto es <em>automatizar y personalizar</em>",
  "Avanzado": "Procesos maduros: el desafío es <em>sostener la mejora</em>",
};

// Barra apilada al 100 % con la escala de petróleo. `marca`: el segmento de la institución (aro ámbar).
function pila(cuenta, { marca = -1, minTexto = 12, letras = false } = {}) {
  const pcts = porcentajes(cuenta);
  return `<div class="pila">${pcts.map((p, i) => (p
    ? `<span class="t${i}${i === marca ? " suyo" : ""}" style="width:${p}%">${p >= minTexto ? `${letras ? `<i>${LETRAS[i]}</i>` : ""}${p}%` : letras && p >= 5 ? `<i>${LETRAS[i]}</i>` : ""}</span>`
    : "")).join("")}</div>`;
}

// El recorrido: promedio de cada etapa (línea), la mitad central de las instituciones (banda)
// y, en la versión personalizada, la institución (línea punteada ámbar). Unidades ≈ mm.
function graficoRecorrido(d) {
  const x0 = 34, x1 = 166, yTop = 7, yBot = 50;
  const y = (v) => yBot - ((Math.max(1, Math.min(5, v)) - 1) / 4) * (yBot - yTop);
  const xs = d.etapas.map((_, i) => x0 + (i * (x1 - x0)) / (d.etapas.length - 1));
  const bandas = [[1, 1.95], [1.95, 3.05], [3.05, 4.05], [4.05, 5]];
  const fondo = bandas.map(([a, b], i) => `<rect x="${x0 - 9}" y="${y(b)}" width="${x1 - x0 + 18}" height="${y(a) - y(b)}" fill="${i % 2 ? BRUMA : "#F6FAFA"}"/>
    <text x="${x0 - 11}" y="${(y(a) + y(b)) / 2 + 0.8}" text-anchor="end" class="g-niv">${NIVELES[i]}</text>`).join("");
  const ida = xs.map((xx, i) => `${xx.toFixed(2)} ${y(d.etapas[i].p75).toFixed(2)}`);
  const vuelta = xs.map((xx, i) => `${xx.toFixed(2)} ${y(d.etapas[i].p25).toFixed(2)}`).reverse();
  const banda = `<path d="M${[...ida, ...vuelta].join(" L")} Z" fill="${AGUA}" fill-opacity=".42"/>`;
  const linea = (vals, attrs) => `<polyline points="${xs.map((xx, i) => `${xx.toFixed(2)},${y(vals[i]).toFixed(2)}`).join(" ")}" fill="none" ${attrs}/>`;
  const prom = d.etapas.map((e) => e.prom);
  const puntos = d.etapas.map((e, i) => {
    const baja = e.id === d.peor.id;
    return `<circle cx="${xs[i]}" cy="${y(e.prom)}" r="1.25" fill="${baja ? TINTA : PETROLEO}"/>
      <text x="${xs[i]}" y="${y(e.prom) - 2.6}" text-anchor="middle" class="g-val${baja ? " baja" : ""}">${fmt1(e.prom)}</text>`;
  }).join("");
  const suyo = d.suyo ? `${linea(d.etapas.map((e) => d.suyo.scores[e.id]), `stroke="${AMBAR}" stroke-width=".6" stroke-dasharray="1.6 1.1"`)}
    ${d.etapas.map((e, i) => `<circle cx="${xs[i]}" cy="${y(d.suyo.scores[e.id])}" r="1.05" fill="#fff" stroke="${AMBAR}" stroke-width=".55"/>`).join("")}` : "";
  const ejes = d.etapas.map((e, i) => {
    const partes = e.name.length > 12 ? e.name.split(" ") : [e.name];
    return `<text x="${xs[i]}" y="${yBot + 6}" text-anchor="middle" class="g-num">${num2(e.num)}</text>
      <text x="${xs[i]}" y="${yBot + 10}" text-anchor="middle" class="g-eta">${partes.map((t, k) => `<tspan x="${xs[i]}" dy="${k ? 3.1 : 0}">${t}</tspan>`).join("")}</text>`;
  }).join("");
  return `<svg class="grafico" viewBox="0 0 174 66" aria-label="Puntaje promedio de cada etapa del recorrido">${fondo}${banda}${linea(prom, `stroke="${PETROLEO}" stroke-width=".7"`)}${suyo}${puntos}${ejes}</svg>`;
}

// Una práctica: el porcentaje grande y la pregunta.
function practica(p, { pct, texto, suyo }) {
  const letra = suyo?.respuestas?.[`${p.etapa.id}_${p.q}`];
  return `<div class="hz"><b>${pct}%</b><div><span class="lbl">${num2(p.etapa.num)} · ${p.etapa.name}</span><p class="hz-p">${p.texto}</p>
    <p class="hz-m">${texto}${letra ? ` <span class="tag-suyo">Su institución: ${letra}</span>` : ""}</p></div></div>`;
}

const tablaGrupos = (titulo, grupos, d, cabecera = "") => `<div class="grupo-seg">${cabecera}<span class="lbl">${titulo}</span>
  <table class="seg"><thead><tr><th>Grupo</th><th class="n">Inst.</th><th class="n">Global</th>${d.etapas.map((e) => `<th class="n">${num2(e.num)}</th>`).join("")}</tr></thead><tbody>
  ${[{ texto: "Todas las instituciones", n: d.n, global: d.global, etapas: Object.fromEntries(d.etapas.map((e) => [e.id, e.prom])), todas: true }, ...grupos].map((g) => {
    const baja = Math.min(...d.etapas.map((e) => Number(fmt1(g.etapas[e.id]))));
    return `<tr${g.todas ? ' class="todas"' : ""}><td>${esc(g.texto)}</td><td class="n">${g.n}</td><td class="n g">${fmt1(g.global)}</td>${d.etapas.map((e) => `<td class="n${Number(fmt1(g.etapas[e.id])) === baja ? " baja" : ""}">${fmt1(g.etapas[e.id])}</td>`).join("")}</tr>`;
  }).join("")}</tbody></table></div>`;

// ── EL DOCUMENTO ──────────────────────────────────────────
export function htmlConsolidado(d, { origen = "", imprimir = true, fecha = new Date() } = {}) {
  const nivel = getNivel(d.global).label;
  const mes = fecha.toLocaleDateString("es-AR", { month: "long", year: "numeric" });
  const s = d.suyo;
  const universidad = s ? esc(s.universidad) : "";
  const lectura = `En promedio, las instituciones obtienen ${fmt1(d.global)} de 5: ${NIVEL_DESC[nivel]}. La etapa más sólida es ${d.mejor.name} (${fmt1(d.mejor.prom)}) y la más débil, ${d.peor.name} (${fmt1(d.peor.prom)}): ahí está, para la mayoría, el mayor margen para no perder aspirantes.`;
  const nivelSuyo = s ? NIVELES.indexOf(getNivel(s.score_global).label) : -1;
  const pctNiveles = porcentajes(d.niveles);

  const filasEtapas = d.etapas.map((e) => `<tr><td class="nn">${num2(e.num)}</td><td><strong>${e.name}</strong><span class="q">${e.pregunta}</span></td>
    <td class="n">${fmt1(e.prom)}</td><td class="niv">${escalon(e.prom)}${getNivel(e.prom).label}</td>
    <td class="dist">${pila(e.niveles, { marca: s ? NIVELES.indexOf(getNivel(s.scores[e.id]).label) : -1 })}</td>
    ${s ? `<td class="n s">${fmt1(s.scores[e.id])}<small>${conSigno(s.scores[e.id] - e.prom)}</small></td>` : ""}</tr>`).join("");

  const bloques = d.etapas.map((e) => `<section class="etapa">
    <header><span class="num">${num2(e.num)}</span><div><h3>${e.name}</h3><p class="preg"><span>${e.pregunta}</span></p></div>
      <div class="prom"><span class="lbl">Promedio</span><b>${fmt1(e.prom)}</b><small>${getNivel(e.prom).label}</small></div></header>
    ${e.preguntas.map((p) => {
      const letra = s?.respuestas?.[`${e.id}_${p.q}`];
      const i = LETRAS.indexOf(letra);
      return `<div class="pq"><p class="pt"><span>${p.q + 1}</span>${p.texto}</p>
        <div class="fila">${pila(p.cuenta, { marca: i, minTexto: 9, letras: true })}
        <p class="moda"><span class="mf">Más frecuente</span>${LETRAS[p.moda]} · ${sinPunto(p.opciones[p.moda].etiqueta)}${i >= 0 ? `<em>Su institución: ${letra} · ${sinPunto(p.opciones[i].etiqueta)}</em>` : ""}</p></div></div>`;
    }).join("")}
  </section>`).join("");

  const hayGrupos = d.tamanos.length || d.paises.length;

  return `<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"><title>Informe regional de la inscripción universitaria — ${mes}${s ? ` — ${universidad}` : ""}</title>
<link rel="stylesheet" href="${origen}/marca.css"><style>
/* Márgenes y pie en reglas separadas: Safari no conoce los recuadros del pie (@bottom-*) y, si van en la misma regla, descarta también los márgenes. */
@page{size:A4;margin:16mm 18mm 20mm}
@page :first{margin:0}
@supports (font:-apple-system-body){@page :first{margin:16mm 18mm 20mm}@media print{.tapa{width:auto;height:257mm}}}
@page{@bottom-left{content:"Campus Latina · Informe regional de la inscripción universitaria";font:8pt 'Schibsted Grotesk',Arial,sans-serif;color:${GRIS}}@bottom-right{content:counter(page);font:8pt 'Schibsted Grotesk',Arial,sans-serif;color:${GRIS}}}
@page :first{@bottom-left{content:none}@bottom-right{content:none}}
*{box-sizing:border-box;margin:0;padding:0}html{-webkit-print-color-adjust:exact;print-color-adjust:exact}
body{font-family:'Schibsted Grotesk',Arial,sans-serif;color:${TINTA};font-size:9.5pt;line-height:1.55}
/* En pantalla (vista previa del panel), cada parte se ve como una hoja. */
@media screen{html{background:#C9D6D8}body{width:210mm;margin:8mm auto}.tapa,.hoja{box-shadow:0 1px 6px rgba(10,35,41,.18);margin-bottom:8mm}.hoja{background:#fff;padding:16mm 18mm 20mm;min-height:297mm}}
@media print{.salto{break-before:page;page-break-before:always}.fin{margin-top:8mm}}
.lbl{display:block;font-family:'CL Etiquetas','Schibsted Grotesk',Arial,sans-serif;font-size:7pt;letter-spacing:.12em;text-transform:uppercase;color:${GRIS};margin:0 0 2mm}
.tapa{position:relative;width:210mm;height:297mm;background:${TINTA};color:#fff;padding:20mm 20mm;overflow:hidden;page-break-after:always}
.tapa img{height:11mm;position:relative}.tapa .lbl{color:${SLATE}}
.tapa .cuerpo{position:relative;margin-top:42mm}
.tapa h1{font-size:30pt;line-height:1.04;letter-spacing:-.03em;font-weight:700;margin:4mm 0 4mm;max-width:165mm}
.tapa .quien{color:${SLATE};font-size:10.5pt;max-width:140mm;line-height:1.5}
.tapa .cifras{display:flex;gap:20mm;margin-top:22mm;align-items:flex-end}
.dato{font-size:76pt;font-weight:700;line-height:.82;letter-spacing:-.05em}.dato.destaque{color:${AMBAR_LUZ}}
.tapa .sub{color:${SLATE};font-size:10pt;margin-top:3mm}
.campo{position:absolute;left:0;right:0;bottom:0;width:210mm;height:125mm}
.tapa .pie{position:absolute;left:20mm;bottom:12mm;font-size:7.5pt;color:${SLATE};letter-spacing:.04em}
h2{font-size:21pt;line-height:1.08;letter-spacing:-.03em;font-weight:700;margin:2mm 0 5mm;max-width:155mm}
h2 em,.preg span{font-family:Newsreader,Georgia,serif;font-style:italic;font-weight:400;background:linear-gradient(#fff 60%,${AMBAR_CLARO} 60%,${AMBAR_CLARO} 92%,#fff 92%)}
.lectura{font-size:11pt;line-height:1.55;color:#1F3A40;max-width:155mm;margin-bottom:5mm}
.sec{margin-top:6.5mm}.regla{border-top:1.5pt solid ${TINTA};padding-top:3mm}
.foco{display:grid;grid-template-columns:repeat(3,1fr);margin-top:3mm}.foco>div{padding:0 4mm;border-left:.5pt solid ${LINEA}}.foco>div:first-child{border-left:none;padding-left:0}
.foco .lbl{min-height:6.5mm}.foco b{display:block;font-size:24pt;letter-spacing:-.04em;color:${PETROLEO};line-height:1;margin:1.5mm 0}
.suyo-box{margin-top:2mm;border:.6mm solid ${AMBAR};padding:3.5mm 5mm 4mm}.suyo-box .foco b{font-size:21pt}.suyo-box>.lbl{color:${TINTA}}
.pila{display:flex;height:5.4mm;background:${BRUMA};overflow:hidden}
.pila span{display:flex;align-items:center;justify-content:center;gap:1mm;font-size:6.5pt;font-weight:600;white-space:nowrap;overflow:hidden;position:relative}
.pila i{font-style:normal;font-family:'CL Etiquetas',Arial,sans-serif;font-size:6pt;letter-spacing:.06em;opacity:.8}
.pila .t0{background:${TONOS[0]};color:${TINTA}}.pila .t1{background:${TONOS[1]};color:${TINTA}}.pila .t2{background:${TONOS[2]};color:#fff}.pila .t3{background:${TONOS[3]};color:#fff}
.pila .suyo{box-shadow:inset 0 0 0 .6mm ${AMBAR}}
.reparto .pila{height:8mm}.reparto .pila span{font-size:8pt}
.cols4{display:grid;grid-template-columns:repeat(4,1fr);margin-top:3mm}.cols4>div{padding:0 3mm;border-left:.5pt solid ${LINEA};font-size:8pt;color:${GRIS}}.cols4>div:first-child{border-left:none;padding-left:0}
.cols4 b{display:block;color:${TINTA};font-size:9pt;margin-bottom:1mm}.cols4 .cant{display:block;font-size:17pt;font-weight:700;letter-spacing:-.03em;color:${TINTA};line-height:1.1}
.esc{width:4.6mm;height:2.8mm;margin-right:1.6mm;vertical-align:-.2mm}
.tag-suyo{display:inline-block;background:${AMBAR_CLARO};color:${TINTA};font-size:7pt;font-weight:600;padding:.2mm 1.6mm;margin-left:1mm;white-space:nowrap}
.hallazgos{display:grid;gap:0;margin-top:1mm}.hz{display:grid;grid-template-columns:24mm 1fr;gap:4mm;padding:2.3mm 0;border-bottom:.5pt solid ${LINEA};break-inside:avoid}
.hz>b{font-size:24pt;letter-spacing:-.04em;color:${PETROLEO};line-height:1}.hz-p{font-size:10.5pt;font-weight:600;line-height:1.35}.hz-m{color:${GRIS};margin-top:.8mm}.hz .lbl{margin-bottom:1mm}
table{width:100%;border-collapse:collapse;margin-top:1mm}td,th{padding:1.9mm 1.5mm;border-bottom:.5pt solid ${LINEA};text-align:left;vertical-align:middle}
th{font-family:'CL Etiquetas','Schibsted Grotesk',Arial,sans-serif;font-size:6.5pt;letter-spacing:.1em;text-transform:uppercase;color:${GRIS};font-weight:600;border-bottom:1.5pt solid ${TINTA}}
.nn{font-weight:700;color:${PETROLEO};font-size:11pt;width:9mm}.q{display:block;color:${GRIS};font-size:8pt}
.niv{white-space:nowrap;font-size:8.5pt;color:${GRIS}}.n{text-align:right;font-weight:700;font-size:11pt;width:11mm}th.n{font-size:6.5pt}
.dist{width:46mm}.s{width:16mm;color:${TINTA}}.s small{display:block;font-size:7pt;font-weight:600;color:${GRIS}}
.grafico{display:block;width:100%;height:auto;margin:2mm 0 1mm}
.g-niv{font-family:'CL Etiquetas',Arial,sans-serif;font-size:2.1px;letter-spacing:.08em;text-transform:uppercase;fill:${GRIS}}
.g-val{font-size:2.6px;font-weight:700;fill:${PETROLEO}}.g-val.baja{fill:${TINTA}}
.g-num{font-size:2.6px;font-weight:700;fill:${PETROLEO}}.g-eta{font-size:2.4px;fill:${TINTA}}
.leyenda{display:flex;flex-wrap:wrap;gap:2mm 6mm;font-size:7.5pt;color:${GRIS};margin-top:1mm}.leyenda span{display:inline-flex;align-items:center;gap:1.5mm}
.leyenda .l-prom{width:6mm;height:.7mm;background:${PETROLEO}}.leyenda .l-banda{width:6mm;height:3mm;background:${AGUA};opacity:.6}.leyenda .l-suyo{width:6mm;border-top:.6mm dashed ${AMBAR}}
.leyenda .l-ton{width:3.4mm;height:3.4mm}
.ilus{font-size:7.5pt;color:${GRIS};margin-top:2mm}
.etapa{padding-top:3.5mm;margin-bottom:4.5mm;border-top:1.5pt solid ${TINTA};break-inside:avoid;page-break-inside:avoid}
.etapa header{display:grid;grid-template-columns:auto 1fr auto;gap:5mm;align-items:end;margin-bottom:1.5mm}
.num{font-size:28pt;font-weight:700;color:${PETROLEO};line-height:.8;letter-spacing:-.05em}
h3{font-size:14pt;letter-spacing:-.025em;line-height:1.1}.preg{font-size:11pt;margin-top:1mm}
.prom{text-align:right}.prom b{display:block;font-size:16pt;letter-spacing:-.04em;line-height:1}.prom small{display:block;font-size:7.5pt;color:${GRIS};margin-top:.6mm}.prom .lbl{margin-bottom:1mm}
.pq{padding:1.6mm 0;border-bottom:.5pt solid ${LINEA}}.pt{font-size:9pt;line-height:1.3;margin-bottom:1mm}.pt span{font-weight:700;color:${PETROLEO};margin-right:2mm}
.fila{display:grid;grid-template-columns:1fr 60mm;gap:5mm;align-items:center}.fila .pila{height:4.8mm}
.moda{font-size:8pt;line-height:1.35}.moda .mf{font-family:'CL Etiquetas',Arial,sans-serif;font-size:6pt;letter-spacing:.1em;text-transform:uppercase;color:${GRIS};margin-right:1.5mm}.moda em{display:block;font-style:normal;margin-top:.6mm;color:${TINTA};font-weight:600}
.moda em::before{content:"";display:inline-block;width:2.2mm;height:2.2mm;border:.5mm solid ${AMBAR};margin-right:1.4mm;vertical-align:-.2mm}
.seg td,.seg th{padding:1.6mm 1.2mm}.seg .n{width:auto;font-size:9pt;font-weight:400;color:${GRIS}}.seg th.n{font-size:6.5pt;font-weight:600}.seg .n.g{font-weight:700;color:${TINTA}}.seg .n.baja{font-weight:700;color:${TINTA};text-decoration:underline;text-decoration-thickness:.3mm;text-underline-offset:.8mm}
.seg .todas td{background:${BRUMA}}.grupo-seg{margin-bottom:6mm;break-inside:avoid}.bloque{break-inside:avoid;page-break-inside:avoid}
.usos{display:grid;grid-template-columns:1fr 1fr;gap:8mm}.usos p{color:#1F3A40}
.metodo{column-count:2;column-gap:8mm;font-size:8pt;color:${GRIS}}.metodo p{margin-bottom:2mm;break-inside:avoid}
.cierre{background:${TINTA};color:#fff;padding:10mm 12mm;margin-top:8mm;break-inside:avoid}.cierre h2{color:#fff;margin:2mm 0 3mm}.cierre h2 em{background:linear-gradient(${TINTA} 64%,#C2771D 64%,#C2771D 90%,${TINTA} 90%)}
.cierre p{color:rgba(255,255,255,.75);max-width:150mm}.cierre .lbl{color:${AGUA}}
</style></head><body>
<section class="tapa">
  ${campo(210, 125)}
  <img src="${origen}/campus-latina-sobre-oscuro.svg" alt="Campus Latina">
  <div class="cuerpo">
    <span class="lbl">Informe regional · ${mes}</span>
    <h1>La salud de la inscripción universitaria en Latinoamérica</h1>
    <div class="quien">${s ? `Con los resultados de ${universidad} frente a la región.` : "Qué hacen hoy las universidades en cada etapa del recorrido del aspirante, desde que las descubre hasta su primer día de clases."}</div>
    <div class="cifras">
      <div><span class="lbl">Promedio regional</span><div class="dato">${fmt1(d.global)}</div><div class="sub">de 5 · ${nivel}</div></div>
      ${s
        ? `<div><span class="lbl">Su institución</span><div class="dato destaque">${fmt1(s.score_global)}</div><div class="sub">${getNivel(s.score_global).label}</div></div>`
        : `<div><span class="lbl">La etapa más débil</span><div class="dato">${fmt1(d.peor.prom)}</div><div class="sub">${d.peor.name}</div></div>`}
    </div>
  </div>
  <div class="pie">Campus Latina × CIE LATAM × Salesforce</div>
</section>

<section class="hoja">
  <span class="lbl">Qué encontramos</span>
  <h2>${TITULAR[nivel]}.</h2>
  <p class="lectura">${lectura}</p>
  ${s ? `<div class="suyo-box"><span class="lbl">${universidad} frente a la región</span><div class="foco">
    <div><span class="lbl">Su puntaje global</span><b>${fmt1(s.score_global)}</b>${s.supera >= 0.5 ? `Supera al ${Math.round(s.supera * 100)}% de las instituciones` : `${conSigno(s.score_global - d.global)} frente al promedio regional`}</div>
    <div><span class="lbl">${s.ventaja.dif > 0.05 ? "Su mayor ventaja" : "Donde más se acerca al promedio"}</span><b>${conSigno(s.ventaja.dif)}</b>${s.ventaja.etapa.name}, frente al promedio</div>
    <div><span class="lbl">${s.oportunidad.dif < -0.05 ? "Su mayor oportunidad" : "Donde menos se destaca"}</span><b>${conSigno(s.oportunidad.dif)}</b>${s.oportunidad.etapa.name}, frente al promedio</div>
  </div></div>` : `<div class="foco">
    <div><span class="lbl">Promedio regional</span><b>${fmt1(d.global)}</b>${nivel}</div>
    <div><span class="lbl">Donde mejor funciona</span><b>${fmt1(d.mejor.prom)}</b>${d.mejor.name}</div>
    <div><span class="lbl">La etapa más débil</span><b>${fmt1(d.peor.prom)}</b>${d.peor.name}</div>
  </div>`}
  <div class="sec regla reparto"><span class="lbl">Cómo se reparten las instituciones por nivel</span>
    ${pila(d.niveles, { marca: nivelSuyo, minTexto: 8 })}
    <div class="cols4">${NIVELES.map((nv, i) => `<div><span class="cant">${pctNiveles[i]}%</span><b>${escalon({ "Inicial": 1.5, "En desarrollo": 2.5, "Consolidado": 3.5, "Avanzado": 4.5 }[nv])}${nv}${i === nivelSuyo ? ' <span class="tag-suyo">Su institución</span>' : ""}</b>${NIVEL_DESC[nv].charAt(0).toUpperCase() + NIVEL_DESC[nv].slice(1)}.</div>`).join("")}</div>
  </div>
  <div class="sec regla"><span class="lbl">Las prácticas menos extendidas</span>
    <div class="hallazgos">${d.brechas.map((p) => practica(p, { pct: Math.round(p.bajo * 100), texto: `de las instituciones responde «${sinPunto(p.opciones[0].etiqueta)}» o «${sinPunto(p.opciones[1].etiqueta)}».`, suyo: s })).join("")}</div>
  </div>
  <div class="sec bloque"><span class="lbl">La práctica más extendida</span>
    <div class="hallazgos">${practica(d.fortaleza, { pct: Math.round(d.fortaleza.alto * 100), texto: `de las instituciones responde «${sinPunto(d.fortaleza.opciones[2].etiqueta)}» o «${sinPunto(d.fortaleza.opciones[3].etiqueta)}».`, suyo: s })}</div>
  </div>
</section>

<section class="hoja salto">
  <span class="lbl">Las 7 etapas del recorrido</span>
  <h2>Dónde el recorrido <em>pierde aspirantes</em></h2>
  ${graficoRecorrido(d)}
  <div class="leyenda"><span><i class="l-prom"></i>Promedio de las instituciones</span><span><i class="l-banda"></i>La mitad central de las instituciones</span>${s ? `<span><i class="l-suyo"></i>${universidad}</span>` : ""}</div>
  <div class="sec"><table><thead><tr><th></th><th>Etapa</th><th class="n">Prom.</th><th>Nivel</th><th>Instituciones por nivel</th>${s ? '<th class="n">Suyo</th>' : ""}</tr></thead><tbody>${filasEtapas}</tbody></table>
  <div class="leyenda" style="margin-top:2.5mm">${NIVELES.map((nv, i) => `<span><i class="l-ton" style="background:${TONOS[i]}"></i>${nv}</span>`).join("")}${s ? `<span><i class="l-ton" style="box-shadow:inset 0 0 0 .6mm ${AMBAR}"></i>Nivel de su institución en la etapa</span>` : ""}</div>
  <p class="ilus">Escala de 1 a 5. La barra muestra qué parte de las instituciones está en cada nivel en esa etapa.${s ? " Debajo de su puntaje, la diferencia con el promedio." : ""}</p></div>
</section>

<section class="hoja salto">
  <span class="lbl">Pregunta por pregunta</span>
  <h2>Qué hacen hoy las instituciones <em>en cada etapa</em></h2>
  <div class="leyenda" style="margin-bottom:5mm">${LETRAS.map((l, i) => `<span><i class="l-ton" style="background:${TONOS[i]}"></i>${l}</span>`).join("")}<span>De la práctica menos desarrollada (A) a la más desarrollada (D). A y B valen 1 y 2 puntos; C y D, 4 y 5.</span>${s ? `<span><i class="l-ton" style="box-shadow:inset 0 0 0 .6mm ${AMBAR}"></i>Respuesta de su institución</span>` : ""}</div>
  ${bloques}
</section>

<section class="hoja fin">
  ${hayGrupos ? `${[d.tamanos.length && ["Por tamaño (estudiantes hoy)", d.tamanos], d.paises.length && ["Por país", d.paises]].filter(Boolean)
    .map(([titulo, grupos], i) => tablaGrupos(titulo, grupos, d, i ? "" : `<span class="lbl">Por grupo de instituciones</span><h2>El recorrido según <em>${d.tamanos.length && d.paises.length ? "tamaño y país" : d.tamanos.length ? "tamaño" : "país"}</em></h2>`)).join("")}
  <p class="ilus" style="margin:-4mm 0 8mm">${d.etapas.map((e) => `${num2(e.num)} ${e.name}`).join(" · ")}. Subrayada, la etapa más baja de cada grupo. Solo se muestran grupos de al menos ${MIN_GRUPO} instituciones.</p>` : ""}
  <div class="bloque${hayGrupos ? " sec regla" : ""}"><span class="lbl">Cómo usar este informe</span>
    ${s
      ? `<div class="usos"><div><p>El aro ámbar marca la respuesta de ${universidad} en cada pregunta y la línea punteada, su puntaje en cada etapa. Las etapas donde queda por debajo del promedio regional son las que más inscriptos pueden sumar.</p></div>
        <div><p>Su informe individual tiene, para cada etapa, las acciones concretas para mejorar el puntaje. Si quiere recorrerlo junto a esta lectura regional, escríbanos.</p></div></div>`
      : `<div class="usos"><div><span class="lbl">Si su institución participó</span><p>Ponga su informe al lado de este: las etapas donde su puntaje queda por debajo del promedio regional son las que más inscriptos pueden sumar.</p></div>
        <div><span class="lbl">Si todavía no hizo el diagnóstico</span><p>Son 10 minutos y el informe con su puntaje en cada etapa llega en el momento, sin costo: <strong>diagnostico.campuslatina.com</strong></p></div></div>`}
  </div>
  <div class="bloque sec regla"><span class="lbl">Metodología</span><div class="metodo">
    <p>El diagnóstico es una autoevaluación de 28 preguntas sobre las 7 etapas del recorrido del aspirante, respondida por los equipos directivos de cada institución. Cada respuesta vale 1, 2, 4 o 5 puntos (A, B, C o D); el puntaje de una etapa es el promedio de sus 4 preguntas y el global, el promedio de las 7 etapas.</p>
    <p>Base: ${d.n} ${d.n === 1 ? "institución" : "instituciones"} con el diagnóstico completo${d.desde ? `, entre el ${fechaLarga(d.desde)} y el ${fechaLarga(d.hasta)}` : ""}. Si una institución lo completó más de una vez, se toma el más reciente. No se incluyen diagnósticos incompletos ni pruebas internas.</p>
    <p>Los resultados se presentan siempre agregados y ningún dato identifica a una institución: los grupos con menos de ${MIN_GRUPO} instituciones no se muestran por separado. Al ser una autoevaluación, refleja cómo ve cada equipo su propio proceso.</p>
  </div></div>
  <div class="cierre"><span class="lbl">Campus Latina</span>${s
    ? `<h2>Revisemos su posición <em>frente a la región</em></h2><p>Una videollamada para recorrer sus resultados junto a los de la región y definir por dónde empezar. ${AUTORIDAD}</p><p style="margin-top:3mm;color:#fff">campuslatina.com</p>`
    : `<h2>¿Cómo está su institución <em>frente a la región</em>?</h2><p>Cada institución que hace el diagnóstico recibe su informe con el puntaje de cada etapa y las acciones para mejorarlo. ${AUTORIDAD}</p><p style="margin-top:3mm;color:#fff">diagnostico.campuslatina.com · campuslatina.com</p>`}</div>
</section>
${imprimir ? `<script>window.onload=function(){(document.fonts?document.fonts.ready:Promise.resolve()).then(function(){setTimeout(function(){window.print();},300);});};<\/script>` : ""}
</body></html>`;
}
