// Vuelve a sembrar la sesión de demo de la base local: 46 participantes sintéticos con las 28
// respuestas y la acción de cada mesa. Uso:
//   npm run taller:sembrar               demo al inicio (pantalla del QR, sin etapas abiertas)
//   npm run taller:sembrar -- --cierre   demo directo en el cierre (diagnóstico y mapa de calor)
// Con `npm run taller:local` corriendo, la pide al servidor; si no, abre la base directamente.
import { abrirBase, sembrarDemo, DEMO } from "./taller-local.mjs";

const cierre = process.argv.includes("--cierre");
let r;
try {
  const res = await fetch(`http://localhost:5175/taller-api/sembrar${cierre ? "?cierre=1" : ""}`, { method: "POST" });
  r = await res.json();
  if (!res.ok) throw new Error(r.message);
} catch (err) {
  if (err.cause?.code !== "ECONNREFUSED") throw err;
  const db = await abrirBase(".taller-local");
  r = await sembrarDemo(db, { cierre });
  await db.close();
}
console.log(`Demo sembrada: ${r.participantes} participantes en la sesión ${r.codigo}${cierre ? ", en el cierre" : ""}.`);
console.log(`Expositor: http://localhost:5175/f/${DEMO.codigo} · clave: la de DEMO en scripts/taller-local.mjs`);
