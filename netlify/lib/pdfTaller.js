// PDF del Diagnóstico colectivo que recibe cada asistente por email (@react-pdf/renderer):
//  1. Su mirada: su puntaje en cada etapa al lado del de la sala, y dónde queda entre todos
//     (un punto por persona, sin decir quién es quién).
//  2. La sala: las 7 etapas hoy y con las ideas elegidas, y dónde hubo más y menos acuerdo.
//  3. El mapa de calor de la sala.
//  4. Ideas para subir de cada etapa, con las que eligió la sala.
// Identidad Campus Latina (petróleo con ámbar, Schibsted Grotesk). Sin nada comercial.
import React from "react";
import { Document, Page, Text, View, Svg, Path, Rect, Circle, Line, G, StyleSheet, Font, renderToBuffer } from "@react-pdf/renderer";
import { ETAPAS_DATA } from "../../src/data/etapas.js";
import { getNivel, fmt1 } from "../../src/lib/scoring.js";
import { diagnostico, miMirada, estadisticas, ideasEtapa, puntajeEtapa, puntajeConIdeas } from "../../src/taller/sala.js";
import { colorDe } from "../../src/taller/colores.js";
import * as F from "./fonts-taller.generated.js";

const h = React.createElement;

Font.register({ family: "Schibsted", fonts: [
  { src: F.SCHIBSTED_400 },
  { src: F.SCHIBSTED_600, fontWeight: 600 },
  { src: F.SCHIBSTED_700, fontWeight: 700 },
]});
Font.register({ family: "Newsreader", fonts: [{ src: F.NEWSREADER_ITALIC, fontStyle: "italic" }] });
Font.registerHyphenationCallback((w) => [w]); // no cortar palabras con guiones

const C = { petroleo: "#0B6470", profundo: "#123A42", noche: "#0A2329", texto: "#1F3A40", gris: "#4D6166", linea: "#D5E3E5", bruma: "#EAF3F4", ambar: "#F08C1A", ambarClaro: "#FFCF8A", punto: "#A8CDD1" };
const ANCHO = 515; // ancho útil de la hoja A4 con márgenes de 40 pt

const s = StyleSheet.create({
  pagina: { fontFamily: "Schibsted", fontSize: 9.5, color: C.texto, paddingTop: 36, paddingBottom: 54, paddingHorizontal: 40 },
  etiqueta: { fontWeight: 600, fontSize: 7.5, letterSpacing: 1, textTransform: "uppercase", color: C.gris },
  h1: { fontWeight: 700, fontSize: 22, color: C.profundo, marginTop: 4 },
  h2: { fontWeight: 700, fontSize: 14, color: C.profundo, marginTop: 18, marginBottom: 6 },
  cursiva: { fontFamily: "Newsreader", fontStyle: "italic", fontWeight: 400 },
  parrafo: { fontSize: 9.5, lineHeight: 1.45, color: C.texto },
  fila: { flexDirection: "row", alignItems: "center", borderTopWidth: 0.6, borderTopColor: C.linea, paddingVertical: 5 },
  pie: { position: "absolute", bottom: 22, left: 40, right: 40, flexDirection: "row", justifyContent: "space-between", fontSize: 7.5, color: C.gris, borderTopWidth: 0.6, borderTopColor: C.linea, paddingTop: 6 },
});

// Isotipo (las 3 plumas, cada una en su tono) y nombre: el logo, discreto, como fuente de la herramienta.
function Logo() {
  return h(View, { style: { flexDirection: "row", alignItems: "center" } },
    h(Svg, { viewBox: "6 4 91 90", width: 20, height: 20 },
      h(Path, { d: "M6 94C15 58 44 24 97 4C91 16 87 24 84 32C62 43 37 62 6 94Z", fill: C.petroleo }),
      h(Path, { d: "M6 94C35 66 60 48 94 39C90 47 87 53 83 59C62 65 37 77 6 94Z", fill: "#2D8E98" }),
      h(Path, { d: "M6 94C39 80 63 71 91 68C87 75 83 80 78 85C57 87 35 89 6 94Z", fill: "#64BCC5" })),
    h(View, { style: { marginLeft: 5 } },
      h(Text, { style: { fontWeight: 700, fontSize: 8.5, lineHeight: 1, color: C.profundo } }, "Campus"),
      h(Text, { style: { fontWeight: 700, fontSize: 8.5, lineHeight: 1, color: C.profundo } }, "Latina")));
}

function Encabezado({ nombre, fecha }) {
  return h(View, { style: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", borderBottomWidth: 1.2, borderBottomColor: C.profundo, paddingBottom: 8, marginBottom: 14 } },
    h(Logo),
    h(Text, { style: { fontSize: 8, color: C.gris, textAlign: "right", lineHeight: 1.4 } }, `${nombre}\n${fecha}`));
}

function Pie({ nombre }) {
  return h(View, { style: s.pie, fixed: true },
    h(Text, null, `Diagnóstico colectivo · ${nombre}`),
    h(Text, { render: ({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}` }));
}

// Un punto por persona (anónimo), el propio resaltado y una línea en el promedio. Escala de 1 a 5.
function Ubicacion({ yo, sala, todos, ancho = ANCHO, alto = 18 }) {
  const x = (v) => 6 + ((v - 1) / 4) * (ancho - 12);
  return h(Svg, { width: ancho, height: alto },
    h(Line, { x1: x(1), x2: x(5), y1: alto / 2, y2: alto / 2, stroke: C.linea, strokeWidth: 1.2 }),
    ...[1, 2, 3, 4, 5].map((v) => h(Line, { key: `t${v}`, x1: x(v), x2: x(v), y1: alto / 2 - 2, y2: alto / 2 + 2, stroke: C.linea, strokeWidth: 0.8 })),
    ...todos.map((v, i) => h(Circle, { key: i, cx: x(v), cy: alto / 2, r: 2.4, fill: C.punto, fillOpacity: 0.8 })),
    sala != null && h(Line, { x1: x(sala), x2: x(sala), y1: 1.5, y2: alto - 1.5, stroke: C.profundo, strokeWidth: 1.4 }),
    yo != null && h(Circle, { cx: x(yo), cy: alto / 2, r: 4.6, fill: C.petroleo, stroke: "#FFFFFF", strokeWidth: 1.2 }));
}

function Barra({ valor, potencial, resaltar }) {
  return h(View, { style: { height: 6, backgroundColor: C.bruma, borderRadius: 3, marginTop: 3, position: "relative" } },
    potencial != null && potencial > valor && h(View, { style: { position: "absolute", left: 0, top: 0, height: 6, borderRadius: 3, width: `${(potencial / 5) * 100}%`, backgroundColor: C.ambarClaro } }),
    h(View, { style: { position: "absolute", left: 0, top: 0, height: 6, borderRadius: 3, width: `${((valor || 0) / 5) * 100}%`, backgroundColor: resaltar ? C.profundo : "#6FA7AE" } }));
}

// Mapa de calor: una fila por persona, las 28 preguntas en 7 bloques; la etapa más baja recuadrada.
function Mapa({ filas, dx, filaMax = 7, altoMax = 300 }) {
  const con = filas.filter((f) => Object.keys(f.r).length);
  const cols = ETAPAS_DATA.flatMap((e, b) => e.preguntas.map((p, q) => ({ b, valor: (f) => p.opciones.find((o) => o.letra === f.r[`${e.id}_${q}`])?.valor ?? null })));
  const prom = (f) => { const vs = cols.map((c) => c.valor(f)).filter((v) => v != null); return vs.reduce((a, v) => a + v, 0) / vs.length; };
  const orden = [...con].sort((a, b) => prom(b) - prom(a));
  const gap = 1, bloque = 8, cab = 24;
  const celda = (ANCHO - 6 * bloque - 21 * gap) / 28;
  const fila = Math.min(filaMax, altoMax / Math.max(orden.length, 1));
  const x = (i) => i * celda + (i - cols[i].b) * gap + cols[i].b * bloque;
  const xb = (b) => x(b * 4);
  const anchoB = 4 * celda + 3 * gap;
  const alto = cab + orden.length * (fila + 0.6) + 4;
  const fuga = dx.fuga ? ETAPAS_DATA.findIndex((e) => e.id === dx.fuga.id) : -1;
  return h(Svg, { width: ANCHO, height: alto },
    ...ETAPAS_DATA.map((e, b) => h(G, { key: e.id },
      h(Text, { x: xb(b) + anchoB / 2, y: 9, textAnchor: "middle", style: { fontSize: 6.5, fontFamily: "Schibsted", fontWeight: b === fuga ? 700 : 400 }, fill: C.profundo },
        e.name.length * 6.5 * 0.56 > anchoB ? e.name.split(" ")[0] : e.name),
      dx.etapas[b].puntaje != null && h(Text, { x: xb(b) + anchoB / 2, y: 19, textAnchor: "middle", style: { fontSize: 8, fontFamily: "Schibsted", fontWeight: 700 }, fill: C.profundo }, fmt1(dx.etapas[b].puntaje)))),
    ...orden.flatMap((f, r) => cols.map((c, i) => {
      const v = c.valor(f);
      return h(Rect, { key: `${r}-${i}`, x: x(i), y: cab + r * (fila + 0.6), width: celda, height: fila, fill: v == null ? "#FFFFFF" : colorDe(v, "claro"), stroke: v == null ? C.linea : undefined, strokeWidth: v == null ? 0.4 : 0 });
    })),
    fuga >= 0 && (() => {
      // El recuadro no se sale del ancho útil (la última etapa termina justo en el borde).
      const x1 = Math.max(0.8, xb(fuga) - 3);
      const x2 = Math.min(ANCHO - 0.8, xb(fuga) + anchoB + 3);
      return h(Rect, { x: x1, y: 0.8, width: x2 - x1, height: alto - 1.6, rx: 3, fill: "none", stroke: C.profundo, strokeWidth: 1.2 });
    })());
}

function Leyenda() {
  const caja = (v) => h(View, { style: { width: 12, height: 7, borderRadius: 1.5, backgroundColor: colorDe(v, "claro"), marginRight: 3 } });
  return h(View, { style: { flexDirection: "row", alignItems: "center", marginTop: 6, fontSize: 7.5, color: C.gris } },
    ...[["A", 1], ["B", 2], ["C", 4], ["D", 5]].map(([l, v]) => h(View, { key: l, style: { flexDirection: "row", alignItems: "center", marginRight: 10 } }, caja(v), h(Text, null, `${l} · ${v}`))),
    h(View, { style: { width: 12, height: 7, borderWidth: 1, borderColor: C.profundo, borderRadius: 1.5, marginRight: 3 } }), h(Text, null, "Etapa más baja de la sala"));
}

function SuMirada({ mia, n }) {
  const etapas = mia.etapas.filter((e) => e.yo != null);
  return h(View, null,
    h(Text, { style: s.h2 }, "Su mirada y la de la sala"),
    h(Text, { style: s.parrafo }, `Usted respondió pensando en una universidad típica de su región, igual que las otras ${n - 1} personas de la sala. Cada punto gris es una persona (sin identificar a nadie); el punto petróleo es usted y la línea, el promedio de la sala.${mia.respondidas < 7 ? ` La comparación es solo en ${mia.respondidas === 1 ? "la etapa que respondió" : `las ${mia.respondidas} etapas que respondió`}.` : ""}`),
    h(View, { style: { flexDirection: "row", marginTop: 12, alignItems: "flex-end" } },
      h(View, { style: { marginRight: 36 } }, h(Text, { style: s.etiqueta }, "Usted"), h(Text, { style: { fontSize: 34, fontWeight: 700, color: C.petroleo } }, fmt1(mia.yo))),
      h(View, { style: { marginRight: 36 } }, h(Text, { style: s.etiqueta }, "La sala"), h(Text, { style: { fontSize: 34, fontWeight: 700, color: C.profundo } }, fmt1(mia.sala))),
      mia.ubicacion != null && h(Text, { style: { ...s.parrafo, flex: 1, marginBottom: 6 } }, `Usted ve la universidad más desarrollada que ${Math.round(mia.ubicacion * 10)} de cada 10 personas de la sala (${getNivel(mia.yo).label.toLowerCase()} para usted, ${getNivel(mia.sala).label.toLowerCase()} para la sala).`)),
    h(View, { style: { marginTop: 8 } }, h(Ubicacion, { yo: mia.yo, sala: mia.sala, todos: mia.todos, alto: 22 })),
    h(View, { style: { marginTop: 14 } },
      ...etapas.map((e) => h(View, { key: e.id, style: { ...s.fila, flexDirection: "column", alignItems: "stretch" }, wrap: false },
        h(View, { style: { flexDirection: "row", justifyContent: "space-between" } },
          h(Text, { style: { fontWeight: 600, color: C.profundo } }, `${e.num}. ${e.name}`),
          h(Text, null, h(Text, { style: { fontWeight: 700, color: C.petroleo } }, `Usted ${fmt1(e.yo)}`), `  ·  Sala ${fmt1(e.sala)}  ·  ${diferencia(e.yo, e.sala)}`)),
        h(View, { style: { marginTop: 3 } }, h(Ubicacion, { yo: e.yo, sala: e.sala, todos: e.todos, alto: 14 }))))));
}

const diferencia = (yo, sala) => {
  const d = yo - sala;
  return Math.abs(d) < 0.05 ? "igual que la sala" : `${fmt1(Math.abs(d))} ${d > 0 ? "por encima" : "por debajo"}`;
};

function LaSala({ filas, elegidas, dx }) {
  const hayIdeas = dx.etapas.some((e) => e.eligieron > 0) && dx.globalConIdeas > dx.global;
  const est = estadisticas(filas);
  return h(View, null,
    h(Text, { style: s.h2 }, "La sala"),
    h(View, { style: { flexDirection: "row", alignItems: "flex-end" } },
      h(View, { style: { marginRight: 36 } }, h(Text, { style: s.etiqueta }, "Hoy"),
        h(Text, { style: { fontSize: 34, fontWeight: 700, color: C.profundo } }, fmt1(dx.global)),
        h(Text, { style: { fontWeight: 600 } }, getNivel(dx.global).label)),
      hayIdeas && h(View, null, h(Text, { style: s.etiqueta }, "Con las ideas que eligió la sala"),
        h(Text, { style: { fontSize: 34, fontWeight: 700, color: C.ambar } }, fmt1(dx.globalConIdeas)),
        h(Text, { style: { fontWeight: 600 } }, `+${fmt1(dx.globalConIdeas - dx.global)}`))),
    h(View, { style: { marginTop: 10 } },
      ...dx.etapas.map((e) => h(View, { key: e.id, style: { marginTop: 6 }, wrap: false },
        h(View, { style: { flexDirection: "row", justifyContent: "space-between" } },
          h(Text, { style: { fontWeight: dx.fuga?.id === e.id ? 700 : 400, color: C.profundo } }, `${e.num}. ${e.name}${dx.fuga?.id === e.id ? "  ·  acá se pierden más aspirantes" : ""}`),
          h(Text, { style: { fontWeight: 700 } }, e.puntaje == null ? "—" : `${fmt1(e.puntaje)}${hayIdeas && e.conIdeas > e.puntaje ? ` → ${fmt1(e.conIdeas)}` : ""}`)),
        h(Barra, { valor: e.puntaje, potencial: hayIdeas ? e.conIdeas : null, resaltar: dx.fuga?.id === e.id })))),
    h(View, { wrap: false },
      h(Text, { style: s.h2 }, "Dónde hubo más acuerdo y más desacuerdo"),
      h(Lista, { titulo: "Más acuerdo", items: est.acuerdo }),
      h(Lista, { titulo: "Más desacuerdo", items: est.desacuerdo })));
}

function MapaPagina({ filas, dx }) {
  return h(View, null,
    h(Text, { style: s.h2 }, "Mapa de calor de la sala"),
    h(Text, { style: { ...s.parrafo, color: C.gris, marginBottom: 8 } }, "Cada fila es una persona; cada columna, una pregunta, agrupadas por etapa. Más intenso, más desarrollado. Las filas van de la mirada más alta a la más baja."),
    h(Mapa, { filas, dx, filaMax: 11, altoMax: 600 }),
    h(Leyenda));
}

function Lista({ titulo, items }) {
  return h(View, { style: { marginTop: 6 } },
    h(Text, { style: s.etiqueta }, titulo),
    ...items.map((x, i) => h(Text, { key: i, style: { ...s.parrafo, marginTop: 3 } }, `${i + 1}. ${x.texto} (${x.etapa.name}, promedio ${fmt1(x.promedio)})`)));
}

function Ideas({ filas, elegidas }) {
  return h(View, null,
    h(Text, { style: s.h2 }, "Ideas para subir, etapa por etapa"),
    h(Text, { style: s.parrafo }, "Las mismas ideas del diagnóstico, aplicadas a lo que respondió la mayoría de la sala. El número es cuánto subiría el puntaje de la sala con cada una."),
    ...ETAPAS_DATA.map((e) => {
      const ideas = ideasEtapa(filas, e.id);
      const hoy = puntajeEtapa(filas, e.id);
      if (hoy == null) return null;
      const claves = (elegidas[e.id] || []).filter((c) => ideas.some((i) => i.clave === c));
      const con = claves.length ? puntajeConIdeas(filas, e.id, claves) : null;
      return h(View, { key: e.id, style: { marginTop: 12 }, wrap: false },
        h(View, { style: { flexDirection: "row", justifyContent: "space-between", alignItems: "baseline", borderBottomWidth: 0.6, borderBottomColor: C.linea, paddingBottom: 3 } },
          h(Text, { style: { fontWeight: 700, fontSize: 11, color: C.profundo } }, `${e.num}. ${e.name}  `, h(Text, { style: { ...s.cursiva, fontSize: 10, color: C.petroleo } }, e.pregunta)),
          h(Text, null, h(Text, { style: { fontWeight: 700 } }, fmt1(hoy)), con != null && con > hoy ? `  →  ${fmt1(con)} con lo elegido` : "")),
        ideas.length === 0
          ? h(Text, { style: { ...s.parrafo, marginTop: 4 } }, "La sala ya está en el nivel más alto en todas las preguntas.")
          : ideas.map((i) => h(View, { key: i.clave, style: { flexDirection: "row", marginTop: 5 } },
            h(Text, { style: { width: 34, fontWeight: 700, color: C.ambar } }, i.sube >= 0.05 ? `+${fmt1(i.sube)}` : "+0.0"),
            h(View, { style: { flex: 1 } },
              h(Text, { style: s.parrafo }, i.texto),
              h(Text, { style: { fontSize: 8, color: C.gris } }, `${i.detalle} · pregunta ${i.q + 1}${claves.includes(i.clave) ? "  ·  ELEGIDA POR LA SALA" : ""}`)))));
    }));
}

function Informe({ nombre, fecha, mias, participantes, elegidas }) {
  const filas = participantes;
  const n = filas.filter((f) => Object.keys(f.r).length).length;
  const dx = diagnostico(filas, elegidas);
  const mia = miMirada(mias, filas);
  return h(Document, { title: `Diagnóstico colectivo · ${nombre}`, author: "Campus Latina" },
    h(Page, { size: "A4", style: s.pagina },
      h(Encabezado, { nombre, fecha }),
      h(Text, { style: s.etiqueta }, "Diagnóstico colectivo"),
      h(Text, { style: s.h1 }, "El viaje ", h(Text, { style: { ...s.cursiva, color: C.petroleo } }, "invisible"), " del aspirante"),
      mia.yo != null
        ? h(SuMirada, { mia, n })
        : h(Text, { style: { ...s.parrafo, marginTop: 10 } }, "No llegó a responder ninguna etapa, así que este informe muestra solo la mirada de la sala."),
      h(Pie, { nombre })),
    h(Page, { size: "A4", style: s.pagina },
      h(Encabezado, { nombre, fecha }),
      h(LaSala, { filas, elegidas, dx }),
      h(Pie, { nombre })),
    h(Page, { size: "A4", style: s.pagina },
      h(Encabezado, { nombre, fecha }),
      h(MapaPagina, { filas, dx }),
      h(Pie, { nombre })),
    h(Page, { size: "A4", style: s.pagina },
      h(Encabezado, { nombre, fecha }),
      h(Ideas, { filas, elegidas }),
      h(Text, { style: { ...s.parrafo, color: C.gris, marginTop: 18 } }, "Cada respuesta vale de 1 a 5 (A = 1, B = 2, C = 4, D = 5); el puntaje de una etapa es el promedio de sus preguntas. Generado con el Diagnóstico colectivo de Campus Latina."),
      h(Pie, { nombre })));
}

// datos: { nombre, mias, participantes, elegidas } (taller_envio_iniciar). Devuelve un Buffer.
export async function generarInformeTaller(datos, fecha = new Date()) {
  const textoFecha = fecha.toLocaleDateString("es", { day: "numeric", month: "long", year: "numeric", timeZone: "America/Guayaquil" });
  return renderToBuffer(h(Informe, { ...datos, elegidas: datos.elegidas || {}, fecha: textoFecha }));
}
