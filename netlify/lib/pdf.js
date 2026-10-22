// Genera el informe PDF del lado del servidor (@react-pdf/renderer) a partir de una fila de `diagnosticos`.
// Es el PDF que va adjunto en el mail. Mismo diseño que el imprimible de la solapa Informe
// (src/lib/informePdf.js): tapa oscura con el campo de líneas, resumen de las 7 etapas y análisis de cada una.
// Sin emojis: las fuentes embebidas no los incluyen.
import React from "react";
import { Document, Page, Text, View, StyleSheet, Font, Svg, G, Path, Circle, Rect, Line, renderToBuffer } from "@react-pdf/renderer";
import { getNivel, fmt1, r1, accionesDeEtapa } from "../../src/lib/scoring.js";
import { FRICCIONES } from "../../src/data/fricciones.js";
import { NIVEL_DESC, lecturaDiagnostico, AUTORIDAD, VALIDAR } from "../../src/data/textos.js";
import { datosInforme, trazosCampo } from "../../src/lib/informePdf.js";
import * as MARCA from "./fonts.generated.js";

const h = React.createElement;

Font.register({ family: "Schibsted Grotesk", fonts: [
  { src: MARCA.SCHIBSTED_400 },
  { src: MARCA.SCHIBSTED_600, fontWeight: 600 },
  { src: MARCA.SCHIBSTED_700, fontWeight: 700 },
]});
Font.register({ family: "Newsreader", fonts: [{ src: MARCA.NEWSREADER_ITALIC, fontStyle: "italic" }] });
Font.registerHyphenationCallback((w) => [w]); // no cortar palabras con guiones

const TINTA = "#0A2329", PETROLEO = "#0B6470", AGUA = "#7FD6DE", AMBAR = "#F08C1A", AMBAR_LUZ = "#FFAE4A";
const GRIS = "#4D6166", LINEA = "#D5E3E5", SLATE = "#A9C2C6", TEXTO = "#1F3A40", BLANCO = "#FFFFFF";
const ORDEN_NIVEL = { "Inicial": 1, "En desarrollo": 2, "Consolidado": 3, "Avanzado": 4 };
const mm = (v) => v * 2.8346;
const num2 = (n) => String(n).padStart(2, "0");
const capital = (t) => t.charAt(0).toUpperCase() + t.slice(1);

const s = StyleSheet.create({
  pagina: { fontFamily: "Schibsted Grotesk", fontSize: 9.5, color: TINTA, paddingTop: mm(16), paddingBottom: mm(20) },
  cuerpo: { paddingHorizontal: mm(18) },
  parrafo: { fontSize: 9.5, lineHeight: 1.45 }, // con fontSize explícito: sin él, react-pdf calcula el interlineado sobre 18 pt
  lbl: { fontFamily: "Schibsted Grotesk", fontWeight: 600, fontSize: 6.8, lineHeight: 1.3, letterSpacing: 0.8, textTransform: "uppercase", color: GRIS, marginBottom: mm(2) },
  h2: { fontWeight: 700, fontSize: 21, lineHeight: 1.1, letterSpacing: -0.6, marginTop: mm(1), marginBottom: mm(4) },
  resaltado: { fontFamily: "Newsreader", fontStyle: "italic", fontWeight: 400, backgroundColor: "#FFE6C2" },
  regla: { borderTopWidth: 1.5, borderTopColor: TINTA, paddingTop: mm(3) },
  fila: { flexDirection: "row", alignItems: "center", borderBottomWidth: 0.5, borderBottomColor: LINEA, paddingVertical: mm(1.7) },
  pie: { position: "absolute", bottom: mm(9), left: mm(18), right: mm(18), flexDirection: "row", justifyContent: "space-between", fontSize: 7.5, color: GRIS },
});

const Etiqueta = (texto, extra) => h(Text, { style: [s.lbl, extra] }, texto);

function Logo({ ancho }) {
  const { viewBox, grupos } = MARCA.LOGO_SOBRE_OSCURO;
  const [, , w, alto] = viewBox.split(" ").map(Number);
  return h(Svg, { viewBox, width: ancho, height: (ancho * alto) / w },
    grupos.map((g, i) => h(G, { key: i, transform: g.transform, fill: g.fill }, g.paths.map((p, k) => h(Path, { key: k, d: p.d, fill: p.fill })))));
}

function Campo({ ancho, alto }) {
  const { lineas, puntos } = trazosCampo(210, 125);
  return h(Svg, { viewBox: "0 0 210 125", preserveAspectRatio: "none", width: ancho, height: alto, style: { position: "absolute", left: 0, bottom: 0 } },
    lineas.map((l, i) => h(Path, { key: `l${i}`, d: l.d, stroke: AGUA, strokeOpacity: l.opacidad, strokeWidth: l.ancho, fill: "none" })),
    puntos.map((p, i) => h(Circle, { key: `p${i}`, cx: p.cx, cy: p.cy, r: p.r, fill: p.llega ? AMBAR_LUZ : AGUA, fillOpacity: p.llega ? 1 : 0.8 })));
}

// Escalón de 4 barras (nivel) y tramo de 1 a 5 (hoy y con el plan), como en el informe en pantalla.
function Escalon({ score }) {
  const n = ORDEN_NIVEL[getNivel(score).label];
  return h(Svg, { width: 13, height: 8, style: { marginRight: 4 } },
    [1, 2, 3, 4].map((k) => h(Rect, { key: k, x: (k - 1) * 3.4, y: 8 - 2 * k, width: 2.3, height: 2 * k, fill: k <= n ? PETROLEO : LINEA })));
}
function Tramo({ hoy, plan, ancho = 96 }) {
  const x = (v) => 4 + ((Math.max(1, Math.min(5, v)) - 1) / 4) * (ancho - 8);
  const sube = r1(plan) > r1(hoy);
  return h(Svg, { width: ancho, height: 9 },
    h(Line, { x1: 4, x2: ancho - 4, y1: 4.5, y2: 4.5, stroke: LINEA, strokeWidth: 0.8 }),
    h(Line, { x1: 4, x2: x(hoy), y1: 4.5, y2: 4.5, stroke: PETROLEO, strokeWidth: 1.6 }),
    sube && h(Line, { x1: x(hoy), x2: x(plan), y1: 4.5, y2: 4.5, stroke: AMBAR, strokeWidth: 1.6, strokeDasharray: "2.5 2.5" }),
    sube && h(Circle, { cx: x(plan), cy: 4.5, r: 2.6, fill: BLANCO, stroke: AMBAR, strokeWidth: 1.2 }),
    h(Circle, { cx: x(hoy), cy: 4.5, r: 3, fill: PETROLEO }));
}

// Tres cifras en fila separadas por filetes (franja de resultados del manual).
function Foco({ items }) {
  return h(View, { style: { flexDirection: "row" } }, items.map((it, i) => h(View, { key: i, style: { flex: 1, paddingLeft: i ? mm(4) : 0, paddingRight: mm(4), borderLeftWidth: i ? 0.5 : 0, borderLeftColor: LINEA } },
    Etiqueta(it.etiqueta, { minHeight: 19 }),
    h(Text, { style: { fontWeight: 700, fontSize: 24, letterSpacing: -1, color: PETROLEO, lineHeight: 1, marginVertical: mm(1.5) } }, it.valor),
    h(Text, { style: { fontSize: 9.5 } }, it.texto))));
}

function Tapa({ d, registro, fecha }) {
  const quien = [registro.nombre, registro.cargo, registro.pais].filter(Boolean).join(" · ");
  const dato = { fontWeight: 700, fontSize: 76, lineHeight: 1, letterSpacing: -3.5, marginTop: mm(1) };
  return h(Page, { size: "A4", style: { backgroundColor: TINTA, color: BLANCO, fontFamily: "Schibsted Grotesk", padding: mm(20), position: "relative" } },
    h(Campo, { ancho: mm(210), alto: mm(125) }),
    h(Logo, { ancho: mm(39) }),
    h(View, { style: { marginTop: mm(42) } },
      Etiqueta(`Diagnóstico del proceso de inscripción · ${fecha}`, { color: SLATE }),
      h(Text, { style: { fontWeight: 700, fontSize: 30, lineHeight: 1.05, letterSpacing: -0.9, marginTop: mm(3), marginBottom: mm(3), maxWidth: mm(160) } }, registro.universidad || "Su institución"),
      quien ? h(Text, { style: { color: SLATE, fontSize: 10 } }, quien) : null,
      h(View, { style: { flexDirection: "row", alignItems: "flex-end", marginTop: mm(24) } },
        h(View, null, Etiqueta("Hoy", { color: SLATE }), h(Text, { style: dato }, fmt1(d.global)), h(Text, { style: { color: SLATE, fontSize: 10, marginTop: mm(6) } }, `de 5 · ${getNivel(d.global).label}`)),
        d.hayMejora ? h(View, { style: { width: mm(20), height: 1, backgroundColor: SLATE, marginHorizontal: mm(9), marginBottom: mm(17) } }) : null,
        d.hayMejora ? h(View, null, Etiqueta("Con el plan", { color: SLATE }), h(Text, { style: [dato, { color: AMBAR_LUZ }] }, fmt1(d.potencial)), h(Text, { style: { color: SLATE, fontSize: 10, marginTop: mm(6) } }, getNivel(d.potencial).label)) : null,
      ),
    ),
    h(Text, { style: { position: "absolute", left: mm(20), bottom: mm(12), fontSize: 7.5, color: SLATE, letterSpacing: 0.3 } }, "CampusLatina × CIeLatam × Salesforce"),
  );
}

function Resumen({ d }) {
  const nivel = getNivel(d.global).label;
  const col = { num: { width: 24 }, etapa: { flex: 1, paddingRight: 6 }, nivel: { width: 92, flexDirection: "row", alignItems: "center" }, hoy: { width: 28, textAlign: "right" }, tramo: { width: 104, paddingLeft: 8 }, plan: { width: 28, textAlign: "right" } };
  const th = (t, estilo) => h(Text, { style: [s.lbl, { marginBottom: 0 }, estilo] }, t);
  return h(View, null,
    Etiqueta("Qué dice su diagnóstico"),
    h(Text, { style: s.h2 }, `${capital(NIVEL_DESC[nivel])}.`),
    h(Text, { style: { fontSize: 11, lineHeight: 1.55, color: TEXTO, maxWidth: mm(155), marginBottom: mm(7) } }, lecturaDiagnostico(d.global, d.peor)),
    h(Foco, { items: [
      { etiqueta: "Donde mejor funciona", valor: fmt1(d.mejor.score), texto: d.mejor.name },
      d.todoEnD ? { etiqueta: "Próximo paso", valor: "5.0", texto: "Validarlo con datos" } : { etiqueta: "Donde más inscriptos se pierden", valor: fmt1(d.peor.score), texto: d.peor.name },
      { etiqueta: "Con todas las acciones del plan", valor: fmt1(d.potencial), texto: d.hayMejora ? `+${fmt1(r1(d.potencial) - r1(d.global))} puntos sobre hoy` : "Máximo de referencia" },
    ] }),
    h(View, { style: { marginTop: mm(7) } },
      Etiqueta("Las 7 etapas del recorrido"),
      h(View, { style: [s.fila, { borderBottomWidth: 1.5, borderBottomColor: TINTA, paddingVertical: mm(1.5) }] },
        th("", col.num), th("Etapa", col.etapa), th("Nivel", col.nivel), th("Hoy", col.hoy), th("Hoy → con el plan", col.tramo), th("Plan", col.plan)),
      d.etapas.map((e) => h(View, { key: e.id, wrap: false, style: s.fila },
        h(Text, { style: [col.num, { fontWeight: 700, fontSize: 11, color: PETROLEO }] }, num2(e.num)),
        h(View, { style: col.etapa }, h(Text, { style: { fontWeight: 700 } }, e.name), h(Text, { style: { fontSize: 8, color: GRIS } }, e.pregunta)),
        h(View, { style: col.nivel }, h(Escalon, { score: e.score }), h(Text, { style: { fontSize: 8.5, color: GRIS } }, getNivel(e.score).label)),
        h(Text, { style: [col.hoy, { fontWeight: 700, fontSize: 11 }] }, fmt1(e.score)),
        h(View, { style: col.tramo }, h(Tramo, { hoy: e.score, plan: e.pot })),
        h(Text, { style: [col.plan, { fontWeight: 700, fontSize: 11, color: PETROLEO }] }, fmt1(e.pot)),
      )),
      h(Text, { style: { fontSize: 7.5, color: GRIS, marginTop: mm(2) } }, "El punto marca el puntaje de hoy; el aro, el puntaje si se aplican todas las acciones del plan. Escala de 1 a 5."),
    ),
    h(View, { style: [s.regla, { marginTop: mm(7) }], wrap: false },
      Etiqueta("Qué significa cada nivel"),
      h(View, { style: { flexDirection: "row", marginTop: mm(1) } }, Object.keys(ORDEN_NIVEL).map((n, i) => h(View, { key: n, style: { flex: 1, paddingLeft: i ? mm(3) : 0, paddingRight: mm(3), borderLeftWidth: i ? 0.5 : 0, borderLeftColor: LINEA } },
        h(View, { style: { flexDirection: "row", alignItems: "center", marginBottom: mm(1) } }, h(Escalon, { score: { "Inicial": 1.5, "En desarrollo": 2.5, "Consolidado": 3.5, "Avanzado": 4.5 }[n] }), h(Text, { style: { fontWeight: 700, fontSize: 9 } }, n)),
        h(Text, { style: { fontSize: 8, color: GRIS } }, `${capital(NIVEL_DESC[n])}.`)))),
    ),
  );
}

function Etapa({ e, d }) {
  const lista = (items) => h(View, { style: { borderTopWidth: 0.5, borderTopColor: LINEA, marginBottom: mm(5) } }, items);
  const item = (key, izq, cuerpo, der) => h(View, { key, wrap: false, style: { flexDirection: "row", paddingVertical: mm(2), borderBottomWidth: 0.5, borderBottomColor: LINEA } },
    h(View, { style: { width: mm(8) } }, izq), h(View, { style: { flex: 1 } }, cuerpo), der ? h(View, { style: { paddingLeft: mm(3) } }, der) : null);
  const vacia = h(Text, { style: { color: GRIS, paddingVertical: mm(2) } }, "Esta etapa ya está en el nivel más alto que mide el diagnóstico.");
  const acciones = accionesDeEtapa(d.respuestas, e.id);
  const cifra = (etq, v, n, color) => h(View, { style: { marginLeft: mm(7) } }, Etiqueta(etq), h(Text, { style: { fontWeight: 700, fontSize: 20, letterSpacing: -0.8, lineHeight: 1, color } }, fmt1(v)), h(Text, { style: { fontSize: 7.5, color: GRIS, marginTop: 2 } }, n));
  return h(View, { style: { borderTopWidth: 1.5, borderTopColor: TINTA, paddingTop: mm(6), marginBottom: mm(8) } },
    h(View, { wrap: false, minPresenceAhead: 160 },
      h(View, { style: { flexDirection: "row", alignItems: "flex-end", marginBottom: mm(5) } },
        h(Text, { style: { fontWeight: 700, fontSize: 40, lineHeight: 0.85, letterSpacing: -2, color: PETROLEO, marginRight: mm(5) } }, num2(e.num)),
        h(View, { style: { flex: 1 } },
          h(Text, { style: { fontWeight: 700, fontSize: 17, letterSpacing: -0.4, lineHeight: 1.1 } }, e.name),
          h(Text, { style: { fontSize: 12, marginTop: 2 } }, h(Text, { style: s.resaltado }, e.pregunta))),
        cifra("Hoy", e.score, getNivel(e.score).label, TINTA),
        cifra("Con el plan", e.pot, getNivel(e.pot).label, PETROLEO)),
      h(View, { style: { flexDirection: "row", marginBottom: mm(5) } },
        h(View, { style: { flex: 1, paddingRight: mm(4) } }, Etiqueta("El momento del aspirante"), h(Text, { style: [s.parrafo, { color: TEXTO }] }, e.resumen)),
        h(View, { style: { flex: 1, paddingLeft: mm(4) } }, Etiqueta("Qué mide esta etapa"), h(Text, { style: [s.parrafo, { color: TEXTO }] }, e.contexto))),
    ),
    Etiqueta("Dónde suele perderse valor"),
    lista(e.score < 5 ? (FRICCIONES[e.id] || []).map((f, k) => item(k, h(Text, { style: [s.lbl, { color: PETROLEO, marginTop: 1.5 }] }, num2(k + 1)), h(Text, { style: s.parrafo }, f.texto))) : vacia),
    Etiqueta("Acciones recomendadas"),
    lista(acciones.length ? acciones.map((r, k) => item(k,
      h(View, { style: { width: mm(3), height: mm(3), borderWidth: 1, borderColor: PETROLEO, marginTop: 2 } }),
      h(View, null, r.tipo === "nivel" ? h(Text, { style: { fontSize: 8, color: GRIS, marginBottom: 1 } }, `Mejora: ${r.pregunta}`) : null, h(Text, { style: s.parrafo }, r.texto)),
      h(Text, { style: { fontWeight: 700, color: PETROLEO } }, `+${fmt1(r.impacto)}`))) : vacia),
  );
}

function Cierre({ d, registro, contacto }) {
  const validar = d.todoEnD;
  const [antes, resaltado] = validar ? [`${VALIDAR.titulo} `, ""] : registro.target ? ["Revisemos su diagnóstico ", "en 45 minutos"] : ["¿Quiere inscribir ", "más estudiantes"];
  const despues = !validar && !registro.target ? " el próximo ciclo?" : "";
  const texto = validar
    ? `${VALIDAR.texto} Tres números para validarlo: ${VALIDAR.metricas.map((m) => m.replace(/\.$/, "").toLowerCase()).join("; ")}.${registro.target ? ` ${VALIDAR.reunion}` : ""}`
    : registro.target
      ? `Una videollamada para recorrer sus resultados y definir por dónde empezar. Sin compromiso. Responda el mail con este informe para coordinarla. ${AUTORIDAD}`
      : `${AUTORIDAD} Responda el mail con este informe y lo revisamos juntos.`;
  return h(View, { wrap: false, style: { backgroundColor: TINTA, color: BLANCO, paddingVertical: mm(10), paddingHorizontal: mm(12), marginTop: mm(4) } },
    Etiqueta("CampusLatina", { color: AGUA }),
    h(Text, { style: { fontWeight: 700, fontSize: 19, lineHeight: 1.12, letterSpacing: -0.5, marginTop: mm(1), marginBottom: mm(3) } },
      antes, resaltado ? h(Text, { style: { fontFamily: "Newsreader", fontStyle: "italic", fontWeight: 400, color: BLANCO, textDecoration: "underline", textDecorationColor: AMBAR_LUZ } }, resaltado) : null, despues),
    h(Text, { style: { color: "#C9D6D8", lineHeight: 1.55, maxWidth: mm(150) } }, texto),
    h(Text, { style: { color: BLANCO, fontWeight: 700, marginTop: mm(3) } }, contacto || "campuslatina.com"),
  );
}

function InformePDF({ d: fila, contacto }) {
  const d = datosInforme(fila.respuestas || {});
  const fecha = new Date(fila.created_at || Date.now()).toLocaleDateString("es-AR", { month: "long", year: "numeric" });
  const ganancias = [...d.etapas].sort((a, b) => (b.pot - b.score) - (a.pot - a.score)).filter((e) => r1(e.pot) > r1(e.score)).slice(0, 3);
  return h(Document, { title: `Diagnóstico del proceso de inscripción — ${fila.universidad}`, author: "CampusLatina", language: "es" },
    h(Tapa, { d, registro: fila, fecha }),
    h(Page, { size: "A4", style: s.pagina },
      h(View, { style: s.cuerpo }, h(Resumen, { d })),
      h(View, { break: true, style: s.cuerpo },
        ganancias.length ? h(View, { style: { marginBottom: mm(9) } },
          Etiqueta("Por dónde empezar"),
          h(Text, { style: s.h2 }, "Las etapas donde más ", h(Text, { style: s.resaltado }, "se puede ganar")),
          h(Foco, { items: ganancias.map((e) => ({ etiqueta: `${num2(e.num)} · ${e.name}`, valor: `+${fmt1(r1(e.pot) - r1(e.score))}`, texto: `de ${fmt1(e.score)} a ${fmt1(e.pot)} con las acciones del plan` })) })) : null,
        Etiqueta("Análisis por etapa"),
        d.etapas.map((e) => h(Etapa, { key: e.id, e, d })),
        h(Cierre, { d, registro: fila, contacto }),
      ),
      // El pie va al final y la página no lleva lineHeight (lo llevan los párrafos, s.parrafo):
      // con lineHeight en la página, o con el pie antes del contenido, react-pdf no lo dibuja.
      h(View, { fixed: true, style: s.pie },
        h(Text, null, "Campus Latina · Diagnóstico del proceso de inscripción"),
        h(Text, { render: ({ pageNumber }) => `${pageNumber}` })),
    ),
  );
}

// d = fila de la tabla diagnosticos. Devuelve un Buffer con el PDF.
export async function renderInformePDF(d, { contacto } = {}) {
  return renderToBuffer(h(InformePDF, { d, contacto }));
}

export function nombreArchivoPDF(d) {
  const slug = String(d.universidad || "institucion").normalize("NFD").replace(/[̀-ͯ]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60) || "institucion";
  return `Diagnostico-Inscripcion-${slug}.pdf`;
}
