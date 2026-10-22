// Genera las imágenes de marca a partir de HTML, con Google Chrome sin ventana (macOS):
//   public/og.png                    1200×630  vista previa al compartir (redes, WhatsApp, buscadores)
//   public/apple-touch-icon.png      180×180   ícono al guardar el sitio en el celular
//   public/email/logo-sobre-oscuro.png        logo para la cabecera oscura de los mails (2x)
//   public/email/campo.png                    franja del campo de líneas para los mails (2x)
// Uso: node scripts/og-image.mjs   (CHROME=/ruta/a/chrome si no está en /Applications)
import { mkdirSync, writeFileSync, readFileSync, cpSync, rmSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { trazosCampo } from "../src/lib/informePdf.js";

const CHROME = process.env.CHROME || "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const TINTA = "#0A2329", AGUA = "#7FD6DE", AMBAR_LUZ = "#FFAE4A", SLATE = "#A9C2C6";

// Carpeta temporal con las fuentes y el logo, para que el HTML las cargue desde archivos locales.
const tmp = join(tmpdir(), "campuslatina-imagenes");
rmSync(tmp, { recursive: true, force: true });
mkdirSync(tmp, { recursive: true });
cpSync("public/fonts", join(tmp, "fonts"), { recursive: true });
writeFileSync(join(tmp, "marca.css"), readFileSync("public/marca.css", "utf8").replaceAll("url(/fonts/", "url(fonts/"));
const logo = readFileSync("public/campus-latina-sobre-oscuro.svg", "utf8");
const ala = logo.match(/<g fill="#9FE3EA"><g transform="[^"]+">(.*?)<\/g><\/g>/)[1]; // el isotipo en sus tres tonos, en coordenadas 0–100

// Campo de líneas en SVG (mismo trazado que la tapa del informe). `grosor` engrosa las líneas en formatos chicos.
function campo(w, h, grosor = 1) {
  const { lineas, puntos } = trazosCampo(w, h);
  return `<svg viewBox="0 0 ${w} ${h}" preserveAspectRatio="none" style="position:absolute;inset:0;width:100%;height:100%">${
    lineas.map((l) => `<path d="${l.d}" stroke="${AGUA}" stroke-opacity="${l.opacidad}" stroke-width="${l.ancho * grosor}" fill="none"/>`).join("")}${
    puntos.map((p) => `<circle cx="${p.cx}" cy="${p.cy}" r="${p.r * grosor}" fill="${p.llega ? AMBAR_LUZ : AGUA}"/>`).join("")}</svg>`;
}

function foto(salida, ancho, alto, cuerpo, { escala = 1, transparente = false } = {}) {
  const archivo = join(tmp, salida.replace(/\W+/g, "-") + ".html");
  writeFileSync(archivo, `<!doctype html><html><head><meta charset="utf-8"><link rel="stylesheet" href="marca.css"><style>
*{box-sizing:border-box;margin:0}html,body{width:${ancho}px;height:${alto}px;overflow:hidden;${transparente ? "background:transparent" : `background:${TINTA}`}}
body{font-family:'Schibsted Grotesk',sans-serif;color:#fff;position:relative}
.hi{font-family:Newsreader,serif;font-style:italic;font-weight:400;background:linear-gradient(transparent 64%,rgba(240,140,26,.8) 64%,rgba(240,140,26,.8) 90%,transparent 90%)}
.lbl{font-family:'CL Etiquetas',sans-serif;letter-spacing:.14em;text-transform:uppercase}</style></head><body>${cuerpo}</body></html>`);
  mkdirSync(resolve(salida, ".."), { recursive: true });
  execFileSync(CHROME, ["--headless", "--disable-gpu", "--hide-scrollbars", "--allow-file-access-from-files", `--force-device-scale-factor=${escala}`,
    `--window-size=${ancho},${alto}`, ...(transparente ? ["--default-background-color=00000000"] : []), "--virtual-time-budget=4000",
    `--screenshot=${resolve(salida)}`, `file://${archivo}`], { stdio: "ignore" });
  console.log(salida, `${ancho * escala}×${alto * escala}`);
}

foto("public/og.png", 1200, 630, `
  <div style="position:absolute;left:0;right:0;bottom:0;height:330px">${campo(600, 165)}</div>
  <div style="position:absolute;left:80px;top:72px;width:190px">${logo}</div>
  <div style="position:absolute;left:80px;top:196px;width:900px">
    <div class="lbl" style="font-size:20px;color:${SLATE}">Diagnóstico gratuito · 10 minutos</div>
    <div style="font-weight:700;font-size:68px;line-height:1.04;letter-spacing:-.035em;margin-top:18px">¿Por qué se inscriben <span class="hi">menos estudiantes</span> de los esperados?</div>
  </div>
  <div class="lbl" style="position:absolute;left:80px;bottom:56px;font-size:19px;color:${AGUA}">diagnostico.campuslatina.com</div>`);

foto("public/apple-touch-icon.png", 180, 180, `
  <svg viewBox="0 0 100 100" style="position:absolute;left:38px;top:38px;width:104px;height:104px">${ala}</svg>`);

foto("public/email/logo-sobre-oscuro.png", 120, 34, `<div style="width:120px">${logo}</div>`, { escala: 2, transparente: true });
foto("public/email/campo.png", 600, 110, campo(600, 110, 1.6), { escala: 2 });
