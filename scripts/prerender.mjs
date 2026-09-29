// Inyecta en dist/index.html el HTML prerenderizado de la home. La bienvenida es responsive con CSS,
// así que hay un único HTML para celular y escritorio. Después React toma el control (createRoot).
import { readFileSync, writeFileSync } from "node:fs";
import { render } from "../dist-ssr/entry-server.js";

const file = "dist/index.html";
let html = readFileSync(file, "utf8");
const markup = render("/");
if (!html.includes('<div id="root"></div>')) throw new Error("No se encontró #root vacío en dist/index.html");
html = html.replace('<div id="root"></div>', `<div id="root">${markup}</div>`);
writeFileSync(file, html);
console.log(`prerender: "/" → ${Math.round(markup.length / 1024)} KB de HTML`);
