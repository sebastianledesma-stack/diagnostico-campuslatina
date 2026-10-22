// Informe imprimible de ejemplo en HTML, para pasarlo a PDF con Chrome sin ventana:
//   node scripts/informe-pdf.mjs salida.html [origen de fuentes y logo]
//   "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --headless --no-pdf-header-footer --print-to-pdf=salida.pdf salida.html
import { writeFileSync } from "node:fs";
import { datosInforme, htmlInforme } from "../src/lib/informePdf.js";

const salida = process.argv[2] || "informe-ejemplo.html";
const origen = process.argv[3] || "https://diagnostico.campuslatina.com";
const patron = { descubrimiento: "ABBC", exploracion: "CDCD", activacion: "CCDB", acompanamiento: "BCBC", decision: "CBCB", inscripcion: "CDBC", retencion: "DCCC" };
const respuestas = {};
Object.entries(patron).forEach(([id, letras]) => [...letras].forEach((l, k) => { respuestas[`${id}_${k}`] = l; }));
const registro = { universidad: "Universidad del Litoral Sur", nombre: "Laura Gómez", cargo: "Secretaria académica", pais: "Argentina", target: true };
writeFileSync(salida, htmlInforme(datosInforme(respuestas), registro, { origen, imprimir: false }));
console.log(salida);
