// Cálculos de la sala a partir de las filas anónimas ({ n, r: { "<etapa>_<q>": "B" } }).
// Usan la misma lógica que el diagnóstico individual (src/lib/scoring.js): el puntaje de una etapa
// es el promedio de sus respuestas, y las ideas para subir son las mismas acciones del diagnóstico.
// Sin React: lo usan el teléfono, la pantalla del expositor y el PDF.
import { ETAPAS_DATA } from "../data/etapas.js";
import { calcScore, accionesDeEtapa, getNivel } from "../lib/scoring.js";

const promedio = (xs) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null);
const desvio = (xs) => { const m = promedio(xs); return xs.length ? Math.sqrt(promedio(xs.map((x) => (x - m) ** 2))) : null; };
const etapaDe = (eid) => ETAPAS_DATA.find((e) => e.id === eid);
const valor = (r, eid, q) => etapaDe(eid).preguntas[q].opciones.find((o) => o.letra === r[`${eid}_${q}`])?.valor ?? null;
const respondio = (r, e) => e.preguntas.some((_, q) => r[`${e.id}_${q}`]);

// Quienes respondieron al menos una pregunta de la etapa.
export const conRespuestas = (filas, eid) => filas.filter((f) => respondio(f.r, etapaDe(eid)));
// Quienes respondieron las 4 (contador "31 de 46").
export const completaron = (filas, eid) => filas.filter((f) => etapaDe(eid).preguntas.every((_, q) => f.r[`${eid}_${q}`]));

// Puntaje de la sala en una etapa: promedio de los puntajes de cada participante. Null sin respuestas.
export const puntajeEtapa = (filas, eid) => promedio(conRespuestas(filas, eid).map((f) => calcScore(f.r, eid)));

// Cuántos eligieron cada opción de una pregunta, con el porcentaje sobre quienes la respondieron.
export function distribucion(filas, eid, q) {
  const pregunta = etapaDe(eid).preguntas[q];
  const n = { A: 0, B: 0, C: 0, D: 0 };
  filas.forEach((f) => { const l = f.r[`${eid}_${q}`]; if (l in n) n[l]++; });
  const total = n.A + n.B + n.C + n.D;
  const max = Math.max(n.A, n.B, n.C, n.D);
  return {
    total,
    opciones: pregunta.opciones.map((o) => ({ ...o, n: n[o.letra], pct: total ? n[o.letra] / total : 0, mayoria: total > 0 && n[o.letra] === max })),
  };
}

// ── Ideas para subir ─────────────────────────────────────────────

// La respuesta "de la sala" en cada pregunta: la opción más elegida (en un empate, la más baja).
export function respuestasSala(filas, eid) {
  const r = {};
  etapaDe(eid).preguntas.forEach((_, q) => {
    const d = distribucion(filas, eid, q);
    if (d.total) r[`${eid}_${q}`] = d.opciones.find((o) => o.mayoria).letra;
  });
  return r;
}

// Las mismas ideas que el diagnóstico le da a una universidad (accionesDeEtapa), aplicadas a la
// respuesta de la sala. Clave: r<i> (acción de arranque i de src/data/recs.js) o n<q> (próximo
// nivel de la pregunta q). `sube`: cuánto subiría el puntaje de la sala esa idea sola.
export function ideasEtapa(filas, eid) {
  const rs = respuestasSala(filas, eid);
  if (!Object.keys(rs).length) return [];
  const e = etapaDe(eid);
  return accionesDeEtapa(rs, eid).map((a) => {
    const opciones = e.preguntas[a.q].opciones;
    const actual = opciones.findIndex((o) => o.letra === rs[`${eid}_${a.q}`]);
    const idea = a.tipo === "arranque"
      ? { clave: `r${a.ri}`, tipo: a.tipo, q: a.q, texto: a.texto, detalle: a.accion, impacto: a.impacto }
      : { clave: `n${a.q}`, tipo: a.tipo, q: a.q, texto: a.texto, detalle: a.accion, objetivo: opciones[actual + 1].valor };
    return { ...idea, pregunta: e.preguntas[a.q].texto, sube: puntajeConIdeas(filas, eid, [idea]) - puntajeEtapa(filas, eid) };
  });
}

// Lo que gana un participante con una idea. Acción de arranque: suma su impacto a quien respondió
// A o B en esa pregunta (regla del diagnóstico). Próximo nivel: lleva a ese nivel a quien está debajo.
function ganancia(r, eid, idea) {
  const v = valor(r, eid, idea.q);
  if (v == null) return 0;
  if (idea.tipo === "arranque") return v < 4 ? idea.impacto : 0;
  return v < idea.objetivo ? (idea.objetivo - v) / 4 : 0;
}

// Puntaje de la sala en la etapa si se aplicaran las ideas dadas (objetos o claves), tope 5 por persona.
export function puntajeConIdeas(filas, eid, ideas) {
  const base = conRespuestas(filas, eid);
  if (!base.length) return null;
  const lista = ideas.length && typeof ideas[0] === "string"
    ? ideasEtapa(filas, eid).filter((i) => ideas.includes(i.clave))
    : ideas;
  return promedio(base.map((f) => {
    const s = calcScore(f.r, eid);
    return Math.min(5, s + lista.reduce((t, i) => t + ganancia(f.r, eid, i), 0));
  }));
}

// ── La sala completa ─────────────────────────────────────────────

// Las 7 etapas, hoy y con las ideas que eligió la sala, y el promedio global.
// La etapa más baja es donde la sala pierde más aspirantes.
export function diagnostico(filas, elegidas = {}) {
  const etapas = ETAPAS_DATA.map((e) => {
    const puntaje = puntajeEtapa(filas, e.id);
    const claves = elegidas[e.id] || [];
    return { ...e, puntaje, conIdeas: claves.length ? puntajeConIdeas(filas, e.id, claves) : puntaje, eligieron: claves.length };
  });
  const conDatos = etapas.filter((e) => e.puntaje != null);
  // Con una sola etapa respondida no hay con qué comparar.
  const fuga = conDatos.length > 1 ? conDatos.reduce((a, b) => (b.puntaje < a.puntaje ? b : a)) : null;
  return {
    etapas,
    global: promedio(conDatos.map((e) => e.puntaje)),
    globalConIdeas: promedio(conDatos.map((e) => e.conIdeas)),
    respondidas: conDatos.length,
    fuga,
  };
}

// La mirada de una persona frente a la de la sala, sin decir quién es cada uno del resto.
// Por etapa: su puntaje, el promedio de la sala, todos los puntajes (anónimos, para ubicarse) y qué
// parte de la sala ve la etapa más baja que ella (0 a 1; los empates cuentan la mitad).
export function miMirada(mias, filas) {
  const ubicar = (yo, todos) => (yo == null || !todos.length ? null
    : (todos.filter((v) => v < yo).length + todos.filter((v) => v === yo).length / 2) / todos.length);
  const etapas = ETAPAS_DATA.map((e) => {
    const yo = respondio(mias, e) ? calcScore(mias, e.id) : null;
    const todos = conRespuestas(filas, e.id).map((f) => calcScore(f.r, e.id));
    return { ...e, yo, sala: promedio(todos), todos, ubicacion: ubicar(yo, todos) };
  });
  // El global se compara solo en las etapas que la persona respondió (si llegó tarde, no se la
  // compara contra etapas que no vio).
  const suyas = etapas.filter((e) => e.yo != null);
  const globalDe = (r) => promedio(suyas.filter((e) => respondio(r, e)).map((e) => calcScore(r, e.id)));
  const yo = promedio(suyas.map((e) => e.yo));
  const todos = filas.map((f) => globalDe(f.r)).filter((v) => v != null);
  return { etapas, yo, sala: promedio(suyas.filter((e) => e.sala != null).map((e) => e.sala)), todos, ubicacion: ubicar(yo, todos), respondidas: suyas.length };
}

// Estadísticas del cierre: participación, en qué nivel ve cada persona la universidad, las
// preguntas más fuertes y más débiles, y dónde la sala estuvo más y menos de acuerdo (desvío).
export function estadisticas(filas) {
  const con = filas.filter((f) => Object.keys(f.r).length);
  const niveles = { "Inicial": 0, "En desarrollo": 0, "Consolidado": 0, "Avanzado": 0 };
  // El promedio de cada persona (anónimo), para ubicar a toda la sala en la escala de 1 a 5.
  const personas = con.map((f) => promedio(ETAPAS_DATA.filter((e) => respondio(f.r, e)).map((e) => calcScore(f.r, e.id))));
  personas.forEach((g) => { niveles[getNivel(g).label]++; });
  const preguntas = ETAPAS_DATA.flatMap((e) => e.preguntas.map((p, q) => {
    const vs = con.map((f) => valor(f.r, e.id, q)).filter((v) => v != null);
    // Cuántos eligieron cada opción: con una opción dominante hay acuerdo; repartidas, desacuerdo.
    const letras = { A: 0, B: 0, C: 0, D: 0 };
    con.forEach((f) => { const l = f.r[`${e.id}_${q}`]; if (l in letras) letras[l]++; });
    return { etapa: e, q, texto: p.texto, n: vs.length, promedio: promedio(vs), desvio: desvio(vs), letras };
  })).filter((x) => x.n > 0);
  const porPromedio = [...preguntas].sort((a, b) => b.promedio - a.promedio);
  const porDesvio = [...preguntas].sort((a, b) => a.desvio - b.desvio);
  return {
    participantes: con.length,
    respuestas: con.reduce((t, f) => t + Object.keys(f.r).length, 0),
    niveles,
    personas,
    fuertes: porPromedio.slice(0, 3),
    debiles: porPromedio.slice(-3).reverse(),
    acuerdo: porDesvio.slice(0, 3),
    desacuerdo: porDesvio.slice(-3).reverse(),
  };
}
