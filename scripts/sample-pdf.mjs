// Genera un PDF de ejemplo: node scripts/sample-pdf.mjs [ruta-salida.pdf]
import { writeFileSync } from "node:fs";
import { renderInformePDF } from "../netlify/lib/pdf.js";
import { sampleDiagnostico } from "./sample-data.mjs";

const out = process.argv[2] || "informe-ejemplo.pdf";
const d = sampleDiagnostico();
const buf = await renderInformePDF(d, { contacto: "hola@campuslatina.com" });
writeFileSync(out, buf);
console.log(out, (buf.length / 1024).toFixed(0) + " KB", "score", d.score_global, d.nivel);
