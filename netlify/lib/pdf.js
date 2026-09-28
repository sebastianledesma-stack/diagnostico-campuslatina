// Genera el informe PDF del lado del servidor (@react-pdf/renderer) a partir de una fila de `diagnosticos`.
// Mismo contenido que el PDF imprimible del frontend (solapa "Descargar PDF"), con tipografías de marca.
// Sin emojis: las fuentes embebidas no los incluyen.
import React from "react";
import { Document, Page, Text, View, StyleSheet, Font, renderToBuffer } from "@react-pdf/renderer";
import { NAVY, NAVY_DK, EMERALD, SLATE, CREAM, ORANGE, WHITE } from "../../src/theme.js";
import { ETAPAS_DATA } from "../../src/data/etapas.js";
import { FRICCIONES } from "../../src/data/fricciones.js";
import { RECS, SCORE_POTENTIALS } from "../../src/data/recs.js";
import { getNivel, calcGlobalPotential, etapasCriticas } from "../../src/lib/scoring.js";
import * as FONTS from "./fonts.generated.js";
import { NIVEL_DESC, lecturaDiagnostico, AUTORIDAD } from "../../src/data/textos.js";

const h = React.createElement;

Font.register({ family: "DM Sans", fonts: [
  { src: FONTS.DM_SANS_400 },
  { src: FONTS.DM_SANS_500, fontWeight: 500 },
  { src: FONTS.DM_SANS_700, fontWeight: 700 },
]});
Font.register({ family: "DM Serif Display", fonts: [
  { src: FONTS.DM_SERIF_400 },
  { src: FONTS.DM_SERIF_400_ITALIC, fontStyle: "italic" },
]});
Font.register({ family: "Space Mono", fonts: [
  { src: FONTS.SPACE_MONO_400 },
  { src: FONTS.SPACE_MONO_700, fontWeight: 700 },
]});
Font.registerHyphenationCallback((w) => [w]); // no cortar palabras con guiones

const TEXT = "#3A4070";
const MUTED = "#6A7090";
const LINE = "#E8E6DF";
const GREEN = "#2E7D32";

const s = StyleSheet.create({
  page: { fontFamily: "DM Sans", fontSize: 10, color: NAVY, paddingTop: 36, paddingBottom: 56, backgroundColor: WHITE },
  header: { backgroundColor: NAVY_DK, marginTop: -36, paddingVertical: 26, paddingHorizontal: 40, flexDirection: "row", justifyContent: "space-between" },
  mono: { fontFamily: "Space Mono", fontSize: 7, letterSpacing: 1.2, textTransform: "uppercase" },
  content: { paddingHorizontal: 40, paddingTop: 24 },
  sectionTitle: { fontFamily: "DM Serif Display", fontSize: 17, color: NAVY, marginTop: 22, marginBottom: 10, paddingBottom: 5, borderBottomWidth: 2, borderBottomColor: EMERALD },
  th: { fontFamily: "Space Mono", fontSize: 7, color: WHITE, textTransform: "uppercase", letterSpacing: 0.8, paddingVertical: 7, paddingHorizontal: 9 },
  td: { fontSize: 9.5, paddingVertical: 7, paddingHorizontal: 9 },
  footer: { position: "absolute", bottom: 20, left: 40, right: 40, flexDirection: "row", justifyContent: "space-between", borderTopWidth: 1, borderTopColor: LINE, paddingTop: 8 },
});

const COLS = [{ flex: 3 }, { flex: 1.3, textAlign: "center" }, { flex: 1.8 }, { flex: 1.2, textAlign: "center" }];

function Bar({ score, potential, color }) {
  return h(View, { style: { height: 5, backgroundColor: LINE, borderRadius: 3, marginTop: 5, position: "relative" } },
    potential != null && h(View, { style: { position: "absolute", left: 0, top: 0, height: 5, width: `${(potential / 5) * 100}%`, backgroundColor: "#BFEFE0", borderRadius: 3 } }),
    h(View, { style: { position: "absolute", left: 0, top: 0, height: 5, width: `${(score / 5) * 100}%`, backgroundColor: color, borderRadius: 3 } }),
  );
}

function InformePDF({ d, contacto }) {
  const scores = d.scores || {};
  const etapas = ETAPAS_DATA.map((e) => ({ ...e, score: scores[e.id] || 0, nivel: getNivel(scores[e.id] || 0) }));
  const globalScore = Number(d.score_global);
  const globalNivel = getNivel(globalScore);
  const globalPotential = calcGlobalPotential();
  const bottleneck = etapasCriticas(scores)[0];
  const fecha = new Date(d.created_at || Date.now()).toLocaleDateString("es-AR", { day: "numeric", month: "long", year: "numeric" });
  const sub = [d.nombre, d.cargo, d.pais].filter(Boolean).join(" · ");

  return h(Document, { title: `Diagnóstico del proceso de inscripción — ${d.universidad}`, author: "CampusLatina", language: "es" },
    h(Page, { size: "A4", style: s.page },
      // Header
      h(View, { style: s.header },
        h(View, { style: { flex: 1, paddingRight: 20 } },
          h(Text, { style: [s.mono, { color: SLATE }] }, `CampusLatina & CIeLatam · ${fecha}`),
          h(Text, { style: { fontFamily: "DM Serif Display", fontSize: 20, color: WHITE, marginTop: 8, lineHeight: 1.15 } }, "Diagnóstico del proceso de inscripción universitaria"),
          h(Text, { style: { fontSize: 12, color: WHITE, marginTop: 10, fontWeight: 500 } }, d.universidad),
          sub && h(Text, { style: { fontSize: 9, color: "#9AA0C8", marginTop: 2 } }, sub),
        ),
        h(View, { style: { alignItems: "flex-end" } },
          h(Text, { style: [s.mono, { color: SLATE }] }, "Puntaje global"),
          h(Text, { style: { fontFamily: "DM Serif Display", fontSize: 44, color: EMERALD, lineHeight: 1.1 } }, globalScore.toFixed(1)),
          h(Text, { style: [s.mono, { color: EMERALD }] }, `${globalNivel.label} · de 5`),
        ),
      ),

      h(View, { style: s.content },
        // Lectura
        h(View, { style: { backgroundColor: "#F0FBF7", borderLeftWidth: 3, borderLeftColor: EMERALD, padding: 12 } },
          h(Text, { style: [s.mono, { color: EMERALD, fontWeight: 700 }] }, "Qué dice su diagnóstico"),
          h(Text, { style: { fontSize: 10, color: NAVY, lineHeight: 1.6, marginTop: 5 } }, `${globalScore.toFixed(1)} de 5 · ${globalNivel.label}: ${NIVEL_DESC[globalNivel.label]}. ${lecturaDiagnostico(globalScore, bottleneck)}`),
        ),

        // Tabla resumen
        h(Text, { style: s.sectionTitle }, "Resumen por etapa"),
        h(View, { style: { flexDirection: "row", backgroundColor: NAVY } },
          ["Etapa", "Puntaje", "Nivel actual", "Potencial"].map((t, i) => h(Text, { key: t, style: [s.th, COLS[i]] }, t)),
        ),
        etapas.map((e, i) => h(View, { key: e.id, wrap: false, style: { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: LINE, backgroundColor: i % 2 ? CREAM : WHITE } },
          h(Text, { style: [s.td, COLS[0], { fontWeight: 500 }] }, `${e.num}. ${e.name}`),
          h(Text, { style: [s.td, COLS[1], { color: e.nivel.color, fontWeight: 700 }] }, `${e.score.toFixed(1)}/5`),
          h(Text, { style: [s.td, COLS[2], { color: e.nivel.color }] }, e.nivel.label),
          h(Text, { style: [s.td, COLS[3], { color: GREEN }] }, `${SCORE_POTENTIALS[e.id]}/5`),
        )),
        h(Text, { style: { marginTop: 8, fontSize: 9.5, color: MUTED } },
          "Puntaje global hoy: ",
          h(Text, { style: { color: ORANGE, fontWeight: 700 } }, `${globalScore.toFixed(1)}/5`),
          "   ·   Potencial: ",
          h(Text, { style: { color: GREEN, fontWeight: 700 } }, `${globalPotential.toFixed(1)}/5 (+${(globalPotential - globalScore).toFixed(1)} pts)`),
        ),

        // Detalle por etapa
        h(Text, { style: [s.sectionTitle, { marginTop: 0 }], break: true }, "Análisis detallado por etapa"),
        etapas.map((e) => h(View, { key: e.id, wrap: false, style: { marginBottom: 16 } },
          h(View, { style: { borderLeftWidth: 3, borderLeftColor: e.nivel.color, paddingLeft: 10, marginBottom: 6 } },
            h(Text, { style: { fontSize: 12.5, fontWeight: 700, color: NAVY } }, `${e.num}. ${e.name}`, h(Text, { style: { fontWeight: 400, color: MUTED } }, `  ·  ${e.pregunta}`)),
            h(Text, { style: { fontSize: 9, color: e.nivel.color, marginTop: 1 } },
              `${e.score.toFixed(1)}/5 · ${e.nivel.label}   —   Potencial: ${SCORE_POTENTIALS[e.id]}/5 · ${getNivel(SCORE_POTENTIALS[e.id]).label}`),
            h(Bar, { score: e.score, potential: SCORE_POTENTIALS[e.id], color: e.nivel.color }),
          ),
          h(Text, { style: { fontSize: 9.5, color: TEXT, lineHeight: 1.55, marginBottom: 6 } }, e.resumen),
          h(Text, { style: [s.mono, { color: SLATE, fontWeight: 700, marginBottom: 3 }] }, "Dónde se pierde valor"),
          (FRICCIONES[e.id] || []).map((f, fi) => h(View, { key: fi, style: { flexDirection: "row", marginBottom: 2 } },
            h(Text, { style: { width: 10, fontSize: 9.5, color: ORANGE } }, "•"),
            h(Text, { style: { flex: 1, fontSize: 9.5, color: TEXT, lineHeight: 1.45 } }, f.texto),
          )),
          h(Text, { style: [s.mono, { color: SLATE, fontWeight: 700, marginTop: 5, marginBottom: 3 }] }, "Recomendaciones"),
          (RECS[e.id] || []).map((r, ri) => h(View, { key: ri, style: { flexDirection: "row", marginBottom: 2 } },
            h(Text, { style: { width: 12, fontSize: 9.5, fontWeight: 700, color: NAVY } }, `${ri + 1}.`),
            h(Text, { style: { flex: 1, fontSize: 9.5, color: TEXT, lineHeight: 1.45 } },
              r.texto, " ", h(Text, { style: { color: "#009E77" } }, `(+${r.impacto.toFixed(1)} pts)`)),
          )),
        )),

        // CTA
        h(View, { wrap: false, style: { backgroundColor: NAVY_DK, borderRadius: 8, padding: 18, marginTop: 6 } },
          h(Text, { style: [s.mono, { color: EMERALD }] }, "CampusLatina"),
          h(Text, { style: { fontFamily: "DM Serif Display", fontSize: 16, color: WHITE, marginTop: 5 } }, "¿Quiere inscribir más estudiantes el próximo ciclo?"),
          h(Text, { style: { fontSize: 9.5, color: "#B8BCD8", lineHeight: 1.55, marginTop: 5 } },
            `${AUTORIDAD} Responda el mail con este informe y lo revisamos juntos.`),
          contacto && h(Text, { style: { fontSize: 10, color: EMERALD, marginTop: 8, fontWeight: 700 } }, contacto),
        ),
      ),

      h(View, { fixed: true, style: s.footer },
        h(Text, { style: [s.mono, { color: MUTED }] }, "Diagnóstico del proceso de inscripción universitaria · CampusLatina"),
        h(Text, { style: [s.mono, { color: MUTED }], render: ({ pageNumber, totalPages }) => `${pageNumber} / ${totalPages}` }),
      ),
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
