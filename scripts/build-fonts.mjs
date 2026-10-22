// Genera netlify/lib/fonts.generated.js con las tipografías y el logo de la marca, para que el PDF y las
// imágenes para compartir los incluyan sin depender de archivos sueltos en la function.
// Uso: node scripts/build-fonts.mjs  (solo hace falta volver a correrlo si cambian las fuentes o el logo)
import { readFileSync, writeFileSync } from "node:fs";

const fonts = {
  SCHIBSTED_400: "scripts/fuentes-pdf/schibsted-grotesk-400.ttf",
  SCHIBSTED_600: "scripts/fuentes-pdf/schibsted-grotesk-600.ttf",
  SCHIBSTED_700: "scripts/fuentes-pdf/schibsted-grotesk-700.ttf",
  NEWSREADER_ITALIC: "scripts/fuentes-pdf/newsreader-italic-400.ttf",
};

// Logo: grupos { fill, transform, paths } del SVG sobre oscuro (ala en tres tonos de agua, nombre en blanco).
// Cada path es { d, fill }: las plumas del ala traen su propio tono; el nombre hereda el del grupo.
function grupos(svg) {
  return [...svg.matchAll(/<g fill="([^"]+)"><g transform="([^"]+)">(.*?)<\/g><\/g>/g)].map(([, fill, transform, cuerpo]) => ({
    fill, transform, paths: [...cuerpo.matchAll(/<path(?: fill="([^"]+)")? d="([^"]+)"\/>/g)].map((m) => ({ d: m[2], fill: m[1] || fill })),
  }));
}
const svg = readFileSync("public/campus-latina-sobre-oscuro.svg", "utf8");
const logo = { viewBox: svg.match(/viewBox="([^"]+)"/)[1], grupos: grupos(svg) };
if (logo.grupos.length !== 2) throw new Error("El logo cambió de estructura: revisar grupos()");

let out = "// Archivo generado por scripts/build-fonts.mjs — no editar a mano.\n// Fuentes: Schibsted Grotesk y Newsreader (SIL Open Font License), en TTF: el PDF no lee bien los WOFF2 de /public/fonts.\n";
for (const [name, path] of Object.entries(fonts)) {
  out += `export const ${name} = "data:font/ttf;base64,${readFileSync(path).toString("base64")}";\n`;
}
out += `export const LOGO_SOBRE_OSCURO = ${JSON.stringify(logo)};\n`;
writeFileSync("netlify/lib/fonts.generated.js", out);
console.log("netlify/lib/fonts.generated.js", (out.length / 1024).toFixed(0) + " KB");
