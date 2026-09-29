// Genera public/og.png (1200×630, para compartir en redes/buscadores) y public/apple-touch-icon.png (180×180)
// con tipografías y colores de marca. Paso 1: PDF con react-pdf. Paso 2: PNG con scripts/pdf-to-png.swift (macOS).
// Uso: node scripts/og-image.mjs && swift scripts/pdf-to-png.swift
import React from "react";
import { Document, Page, Text, View, Font, renderToFile } from "@react-pdf/renderer";
import * as FONTS from "../netlify/lib/fonts.generated.js";

const h = React.createElement;
Font.register({ family: "DM Sans", fonts: [{ src: FONTS.DM_SANS_400 }, { src: FONTS.DM_SANS_700, fontWeight: 700 }] });
Font.register({ family: "DM Serif Display", fonts: [{ src: FONTS.DM_SERIF_400 }, { src: FONTS.DM_SERIF_400_ITALIC, fontStyle: "italic" }] });
Font.register({ family: "Space Mono", fonts: [{ src: FONTS.SPACE_MONO_700, fontWeight: 700 }] });
Font.registerHyphenationCallback((w) => [w]);

const NAVY_DK = "#0E1240", EMERALD = "#00C896", SLATE = "#8B94C8", WHITE = "#FFFFFF";

const og = h(Document, null, h(Page, { size: [1200, 630], style: { backgroundColor: NAVY_DK, padding: 72, justifyContent: "space-between" } },
  h(View, { style: { flexDirection: "row", alignItems: "center" } },
    h(Text, { style: { fontFamily: "Space Mono", fontWeight: 700, fontSize: 22, letterSpacing: 3, color: SLATE } }, "CAMPUSLATINA & CIELATAM"),
    h(Text, { style: { fontFamily: "Space Mono", fontWeight: 700, fontSize: 20, color: NAVY_DK, backgroundColor: EMERALD, borderRadius: 30, paddingVertical: 6, paddingHorizontal: 18, marginLeft: 20 } }, "GRATIS"),
  ),
  h(View, null,
    h(Text, { style: { fontFamily: "DM Serif Display", fontSize: 76, lineHeight: 1.08, color: WHITE } }, "¿Por qué se inscriben"),
    h(Text, { style: { fontFamily: "DM Serif Display", fontStyle: "italic", fontSize: 76, lineHeight: 1.08, color: EMERALD } }, "menos estudiantes"),
    h(Text, { style: { fontFamily: "DM Serif Display", fontSize: 76, lineHeight: 1.08, color: WHITE } }, "de los esperados?"),
  ),
  h(View, { style: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end" } },
    h(Text, { style: { fontFamily: "DM Sans", fontSize: 28, color: "#C5C9E6", width: 760, lineHeight: 1.4 } }, "Diagnóstico del proceso de inscripción: descubra en 10 minutos dónde pierde aspirantes su universidad."),
    h(Text, { style: { fontFamily: "Space Mono", fontWeight: 700, fontSize: 20, color: EMERALD } }, "diagnostico.campuslatina.com"),
  ),
));

const icono = h(Document, null, h(Page, { size: [180, 180], style: { backgroundColor: NAVY_DK, alignItems: "center", justifyContent: "center" } },
  h(View, { style: { width: 96, height: 96, borderRadius: 48, borderWidth: 14, borderColor: EMERALD } }),
));

await renderToFile(og, "public/og.pdf");
await renderToFile(icono, "public/apple-touch-icon.pdf");
console.log("PDF listos: public/og.pdf, public/apple-touch-icon.pdf");
