// Genera netlify/lib/fonts-taller.generated.js con las tipografías de la identidad Campus Latina
// (Schibsted Grotesk y Newsreader cursiva, SIL Open Font License) en base64, para que el PDF del
// taller las embeba sin depender de archivos sueltos en la function.
// Uso: node scripts/build-fonts-taller.mjs  (solo hace falta volver a correrlo si cambian las fuentes)
import { readFileSync, writeFileSync } from "node:fs";

const fonts = {
  SCHIBSTED_400: "scripts/fuentes-pdf/schibsted-grotesk-400.ttf",
  SCHIBSTED_600: "scripts/fuentes-pdf/schibsted-grotesk-600.ttf",
  SCHIBSTED_700: "scripts/fuentes-pdf/schibsted-grotesk-700.ttf",
  NEWSREADER_ITALIC: "scripts/fuentes-pdf/newsreader-italic-400.ttf",
};

let out = "// Archivo generado por scripts/build-fonts-taller.mjs — no editar a mano.\n// Fuentes: Schibsted Grotesk y Newsreader (SIL Open Font License, licencias en scripts/fuentes-pdf).\n";
for (const [name, path] of Object.entries(fonts)) {
  out += `export const ${name} = "data:font/ttf;base64,${readFileSync(path).toString("base64")}";\n`;
}
writeFileSync("netlify/lib/fonts-taller.generated.js", out);
console.log("netlify/lib/fonts-taller.generated.js", (out.length / 1024).toFixed(0) + " KB");
