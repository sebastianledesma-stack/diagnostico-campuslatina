// Genera netlify/lib/fonts.generated.js con las tipografías de marca en base64,
// para que el PDF las embeba sin depender de archivos sueltos en la function.
// Uso: node scripts/build-fonts.mjs  (solo hace falta volver a correrlo si cambian las fuentes)
import { readFileSync, writeFileSync } from "node:fs";

const F = "node_modules/@fontsource";
const fonts = {
  DM_SANS_400: `${F}/dm-sans/files/dm-sans-latin-400-normal.woff`,
  DM_SANS_500: `${F}/dm-sans/files/dm-sans-latin-500-normal.woff`,
  DM_SANS_700: `${F}/dm-sans/files/dm-sans-latin-700-normal.woff`,
  DM_SERIF_400: `${F}/dm-serif-display/files/dm-serif-display-latin-400-normal.woff`,
  DM_SERIF_400_ITALIC: `${F}/dm-serif-display/files/dm-serif-display-latin-400-italic.woff`,
  SPACE_MONO_400: `${F}/space-mono/files/space-mono-latin-400-normal.woff`,
  SPACE_MONO_700: `${F}/space-mono/files/space-mono-latin-700-normal.woff`,
};

let out = "// Archivo generado por scripts/build-fonts.mjs — no editar a mano.\n// Fuentes: Google Fonts vía @fontsource (SIL Open Font License).\n";
for (const [name, path] of Object.entries(fonts)) {
  out += `export const ${name} = "data:font/woff;base64,${readFileSync(path).toString("base64")}";\n`;
}
writeFileSync("netlify/lib/fonts.generated.js", out);
console.log("netlify/lib/fonts.generated.js", (out.length / 1024).toFixed(0) + " KB");
