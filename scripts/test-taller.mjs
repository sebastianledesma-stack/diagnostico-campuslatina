// Prueba la migración 003 (taller en vivo) sobre un Postgres en memoria, llamando a las funciones
// con el rol anon, igual que los teléfonos, y los cálculos de la sala (src/taller/sala.js).
// Uso: node scripts/test-taller.mjs
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { abrirBase, llamar } from "./taller-local.mjs";
import { pendientes, datosDesdeTablas } from "./taller-reenviar.mjs";

const db = await abrirBase();
// Idempotente: correrla dos veces no rompe nada.
await db.exec(readFileSync(new URL("../supabase/migrations/003_taller.sql", import.meta.url), "utf8"));

const rpc = (fn, args) => llamar(db, fn, args);
const falla = async (fn, args, mensaje) => {
  await assert.rejects(() => rpc(fn, args), (err) => err.message.includes(mensaje), `${fn} debería fallar con ${mensaje}`);
};
const comoServidor = async (sql, params) => (await db.query(sql, params)).rows[0]?.r;
let ok = 0;
const paso = (t) => { ok++; console.log(`✓ ${t}`); };

// ── Crear sesión
await falla("taller_crear", { p_nombre: "REALCUP", p_clave: "123" }, "clave_corta");
const { codigo } = await rpc("taller_crear", { p_nombre: "REALCUP 2026 · Guayaquil", p_clave: "secreta1" });
assert.match(codigo, /^[A-HJ-NP-Z2-9]{4}$/);
const propio = await rpc("taller_crear", { p_nombre: "Prueba", p_clave: "secreta2", p_codigo: "realcup", p_demo: true });
assert.equal(propio.codigo, "REALCUP");
await falla("taller_crear", { p_nombre: "Otra", p_clave: "secreta3", p_codigo: "REALCUP" }, "codigo_en_uso");
await falla("taller_crear", { p_nombre: "Otra", p_clave: "secreta3", p_codigo: "R-1" }, "codigo_invalido");
paso("crear sesión con código al azar o propio");

// ── Alta sin datos: escanear el QR alcanza
await falla("taller_estado", { p_codigo: "ZZZZ" }, "sesion_no_encontrada");
const A = crypto.randomUUID(), B = crypto.randomUUID();
let e = await rpc("taller_estado", { p_codigo: codigo.toLowerCase(), p_participante: A });
assert.equal(e.fase, "espera");
assert.equal(e.registrado, true);
await rpc("taller_estado", { p_codigo: codigo, p_participante: A }); // volver a consultar no duplica
await rpc("taller_estado", { p_codigo: codigo, p_participante: B });
paso("alta automática al escanear, sin datos y sin duplicar");

// ── Pantalla del expositor con clave
await falla("taller_panel", { p_codigo: codigo, p_clave: "otra-clave" }, "clave_incorrecta");
let p = await rpc("taller_panel", { p_codigo: codigo, p_clave: "secreta1" });
assert.equal(p.participantes.length, 2);
assert.equal(p.conectados, 2);
assert.ok(!("id" in p.participantes[0]) && !("email" in p.participantes[0]), "ni el id ni el email viajan a la pantalla");
const sinCambios = await rpc("taller_panel", { p_codigo: codigo, p_clave: "secreta1", p_version: p.version });
assert.equal(sinCambios.sin_cambios, true);
paso("pantalla del expositor protegida con clave y consulta liviana si no hubo cambios");

// ── Responder
await falla("taller_responder", { p_codigo: codigo, p_participante: A, p_respuestas: { descubrimiento_0: "B" } }, "etapa_cerrada");
p = await rpc("taller_control", { p_codigo: codigo, p_clave: "secreta1", p_accion: "abrir", p_etapa: 1 });
assert.equal(p.fase, "abierta");
let r = await rpc("taller_responder", {
  p_codigo: codigo, p_participante: A,
  p_respuestas: { descubrimiento_0: "B", descubrimiento_1: "Z", exploracion_0: "A", descubrimiento_9: "C" },
});
assert.deepEqual(r.aceptadas, ["descubrimiento_0"]);
await rpc("taller_responder", { p_codigo: codigo, p_participante: A, p_respuestas: { descubrimiento_0: "B" } });
await rpc("taller_responder", { p_codigo: codigo, p_participante: A, p_respuestas: { descubrimiento_0: "C", descubrimiento_1: "D" } });
// Quien responde sin haber consultado antes (por ejemplo, desde la cola sin conexión) queda dado de alta.
const C = crypto.randomUUID();
await rpc("taller_responder", { p_codigo: codigo, p_participante: C, p_respuestas: { descubrimiento_0: "A" } });
e = await rpc("taller_estado", { p_codigo: codigo, p_participante: A });
assert.deepEqual(e.mias, { descubrimiento_0: "C", descubrimiento_1: "D" });
const p2 = await rpc("taller_panel", { p_codigo: codigo, p_clave: "secreta1", p_version: p.version });
assert.ok(!p2.sin_cambios, "una respuesta nueva cambia la huella");
assert.equal(p2.participantes.length, 3);
paso("responder solo la etapa abierta, reenviar sin duplicar y retomar");

// ── Nada llega a los teléfonos antes de "Mostrar resultados"
let res = await rpc("taller_resultados", { p_codigo: codigo });
assert.ok(res.participantes.every((x) => Object.keys(x.r).length === 0));
assert.equal(e.publico, null);
p = await rpc("taller_control", { p_codigo: codigo, p_clave: "secreta1", p_accion: "mostrar" });
assert.deepEqual([p.fase, p.vista, p.reveladas], ["resultados", "resultado", [1]]);
await falla("taller_responder", { p_codigo: codigo, p_participante: A, p_respuestas: { descubrimiento_2: "B" } }, "etapa_cerrada");
res = await rpc("taller_resultados", { p_codigo: codigo });
assert.deepEqual(res.participantes[2].r, { descubrimiento_0: "A" });
e = await rpc("taller_estado", { p_codigo: codigo, p_participante: A });
assert.ok(e.publico && e.publico === res.publico, "el teléfono sabe que hay resultados nuevos");
paso("mostrar resultados cierra la etapa y recién ahí llegan a los teléfonos");

// ── Vistas de los resultados e ideas elegidas entre todos
p = await rpc("taller_vista", { p_codigo: codigo, p_clave: "secreta1", p_vista: "mapa" });
assert.equal(p.vista, "mapa");
await falla("taller_vista", { p_codigo: codigo, p_clave: "secreta1", p_vista: "estadisticas" }, "datos_invalidos");
p = await rpc("taller_elegir", { p_codigo: codigo, p_clave: "secreta1", p_etapa: 1, p_claves: ["r0", "n2", "r0"] });
assert.deepEqual(p.elegidas, { descubrimiento: ["n2", "r0"] });
res = await rpc("taller_resultados", { p_codigo: codigo });
assert.deepEqual(res.elegidas, { descubrimiento: ["n2", "r0"] });
assert.notEqual(res.publico, e.publico, "elegir ideas cambia la huella pública");
await falla("taller_elegir", { p_codigo: codigo, p_clave: "secreta1", p_etapa: 1, p_claves: ["x9"] }, "datos_invalidos");
p = await rpc("taller_elegir", { p_codigo: codigo, p_clave: "secreta1", p_etapa: 1, p_claves: [] });
assert.deepEqual(p.elegidas, {});
paso("vistas de resultados e ideas elegidas por la sala");

// ── Reabrir oculta otra vez los resultados de esa etapa; el cierre muestra todo
p = await rpc("taller_control", { p_codigo: codigo, p_clave: "secreta1", p_accion: "abrir", p_etapa: 1 });
assert.deepEqual(p.reveladas, []);
await falla("taller_control", { p_codigo: codigo, p_clave: "secreta1", p_accion: "abrir", p_etapa: 8 }, "etapa_invalida");
p = await rpc("taller_control", { p_codigo: codigo, p_clave: "secreta1", p_accion: "mostrar", p_etapa: 1, p_vista: "ideas" });
assert.equal(p.vista, "ideas");
p = await rpc("taller_control", { p_codigo: codigo, p_clave: "secreta1", p_accion: "cierre" });
assert.deepEqual([p.fase, p.vista, p.reveladas], ["cierre", "resumen", [1, 2, 3, 4, 5, 6, 7]]);
p = await rpc("taller_vista", { p_codigo: codigo, p_clave: "secreta1", p_vista: "estadisticas" });
assert.equal(p.vista, "estadisticas");
paso("reabrir, volver atrás y cierre con sus vistas");

// ── Informe por email: solo el servidor, solo en el cierre, con topes
await assert.rejects(() => rpc("taller_envio_iniciar", { p_codigo: codigo, p_participante: A, p_email: "a@b.co" }), /permission denied/);
const iniciar = (email, quien = A, cod = codigo) =>
  comoServidor("select public.taller_envio_iniciar($1, $2, $3) as r", [cod, quien, email]);
await assert.rejects(() => iniciar("no-es-mail"), /email_invalido/);
await assert.rejects(() => iniciar("a@b.co", crypto.randomUUID()), /no_registrado/);
await assert.rejects(() => iniciar("a@b.co", A, "REALCUP"), /todavia_no|no_registrado/);
const env1 = await iniciar("Persona@Ejemplo.com");
assert.equal(env1.email, "persona@ejemplo.com");
assert.deepEqual(env1.mias, { descubrimiento_0: "C", descubrimiento_1: "D" });
assert.equal(env1.participantes.length, 3);
// El reenvío (scripts/taller-reenviar.mjs) rearma el PDF con los mismos datos que el primer envío.
const { id: sesionId, ...sesionFila } = (await db.query("select id, codigo, nombre, elegidas from public.taller_sesiones where codigo = $1", [codigo])).rows[0];
const tablas = {
  sesion: { id: sesionId, ...sesionFila },
  participantes: (await db.query("select id, orden, origen from public.taller_participantes where sesion_id = $1", [sesionId])).rows,
  respuestas: (await db.query("select participante_id, pregunta, letra from public.taller_respuestas where sesion_id = $1", [sesionId])).rows,
};
assert.deepEqual(datosDesdeTablas({ ...tablas, envio: { id: env1.envio, email: env1.email, participante_id: A } }), env1);
await db.query("select public.taller_envio_terminar($1, $2, true)", [env1.envio, "REALCUP/a.pdf"]);
await iniciar("persona@ejemplo.com");
await iniciar("persona@ejemplo.com");
await assert.rejects(() => iniciar("persona@ejemplo.com"), /demasiados_envios/);
p = await rpc("taller_panel", { p_codigo: codigo, p_clave: "secreta1" });
assert.equal(p.envios, 1);
const exp = await rpc("taller_exportar", { p_codigo: codigo, p_clave: "secreta1" });
assert.deepEqual([exp[0].email, exp[0].enviado], ["persona@ejemplo.com", true]);
await falla("taller_exportar", { p_codigo: codigo, p_clave: "mal-clave" }, "clave_incorrecta");
paso("informe por email: validaciones, topes y exportación con emails");

// ── Permisos: anon no toca las tablas ni las funciones internas
const comoAnon = (sql) => db.transaction(async (tx) => { await tx.exec("set local role anon"); return tx.query(sql); });
await assert.rejects(() => comoAnon("select * from public.taller_respuestas"), /permission denied/);
await assert.rejects(() => comoAnon("select * from public.taller_envios"), /permission denied/);
await assert.rejects(() => comoAnon(`select public.taller_sesion('${codigo}')`), /permission denied/);
await assert.rejects(() => comoAnon("update public.taller_sesiones set fase = 'cierre'"), /permission denied/);
paso("anon no puede leer tablas ni usar funciones internas");

// ── Simular respuestas: solo en sesiones de prueba, de a poco y sin pasarse del total
await falla("taller_simular", { p_codigo: codigo, p_clave: "secreta1" }, "no_es_prueba");
let sim = await rpc("taller_simular", { p_codigo: "REALCUP", p_clave: "secreta2", p_cantidad: 4, p_total: 6 });
assert.deepEqual(sim, { agregados: 4, respondieron: 0 });
await rpc("taller_simular", { p_codigo: "REALCUP", p_clave: "secreta2", p_cantidad: 4, p_total: 6 });
await rpc("taller_control", { p_codigo: "REALCUP", p_clave: "secreta2", p_accion: "abrir", p_etapa: 3 });
sim = await rpc("taller_simular", { p_codigo: "REALCUP", p_clave: "secreta2", p_cantidad: 4, p_total: 6 });
assert.deepEqual(sim, { agregados: 0, respondieron: 4 });
sim = await rpc("taller_simular", { p_codigo: "REALCUP", p_clave: "secreta2", p_cantidad: 4, p_total: 6 });
assert.equal(sim.respondieron, 2, "solo quedaban 2 sin responder");
p = await rpc("taller_panel", { p_codigo: "REALCUP", p_clave: "secreta2" });
assert.ok(p.participantes.every((f) => f.origen === "simulado" && Object.keys(f.r).length === 4));
assert.equal(p.conectados, 6);
paso("simular respuestas en sesiones de prueba");

// ── Cálculos de la sala, con la misma regla de ideas del diagnóstico
const sala = await import("../src/taller/sala.js");
const fila = (n, r) => ({ n, r });
const filas = [
  fila(1, { activacion_0: "A", activacion_1: "A", activacion_2: "A", activacion_3: "A" }), // 1
  fila(2, { activacion_0: "D", activacion_1: "D", activacion_2: "D", activacion_3: "D" }), // 5
  fila(3, { activacion_0: "B", activacion_1: "C", activacion_2: "B", activacion_3: "B" }), // 2.5
  fila(4, { activacion_0: "B" }), // 2 (respondió una sola)
];
const cerca = (a, b) => assert.ok(Math.abs(a - b) < 1e-9, `${a} ≠ ${b}`);
cerca(sala.puntajeEtapa(filas, "activacion"), 2.625);
assert.equal(sala.puntajeEtapa(filas, "retencion"), null);
assert.equal(sala.completaron(filas, "activacion").length, 3);
const d = sala.distribucion(filas, "activacion", 0);
assert.deepEqual(d.opciones.map((o) => o.n), [1, 2, 0, 1]);
// Respuesta de la sala: la más elegida; en empate, la más baja.
assert.deepEqual(sala.respuestasSala(filas, "activacion"), { activacion_0: "B", activacion_1: "A", activacion_2: "A", activacion_3: "A" });
const ideas = sala.ideasEtapa(filas, "activacion");
// Como en el diagnóstico: preguntas en A/B con acción de arranque (recs.js: q1, q0, q2) y, para la
// pregunta 3 (sin acción de arranque), el próximo nivel desde A.
assert.deepEqual(ideas.map((i) => i.clave), ["r0", "r1", "r2", "n3"]);
// WhatsApp (+0.8, pregunta 1): suma solo a quien respondió A o B → 0.8 / 4 participantes.
cerca(ideas[0].sube, 0.2);
// Próximo nivel en la pregunta 3 (A → B, valor 2): sube a quien está en A (el 1) → (2-1)/4 / 4.
cerca(ideas[3].sube, 0.25 / 4);
cerca(sala.puntajeConIdeas(filas, "activacion", ["r0", "r1"]), (1 + 0.8 + 0.7 + 5 + Math.min(5, 2.5 + 0.7) + 2 + 0.7) / 4);
const dx = sala.diagnostico(filas, { activacion: ["r0"] });
assert.equal(dx.fuga, null, "con una sola etapa respondida no hay fuga que señalar");
cerca(dx.etapas[2].conIdeas, 2.625 + 0.2);
const dx2 = sala.diagnostico([...filas, fila(5, { retencion_0: "D", retencion_1: "C" })]);
assert.equal(dx2.fuga.id, "activacion");
// Mirada propia: frente a todos, sin saber quién es quién.
const mia = sala.miMirada({ activacion_0: "D", activacion_1: "C", activacion_2: "C", activacion_3: "D" }, filas);
cerca(mia.etapas[2].yo, 4.5);
cerca(mia.etapas[2].sala, 2.625);
cerca(mia.etapas[2].ubicacion, 3 / 4);
assert.equal(mia.etapas[0].yo, null);
const est = sala.estadisticas(filas);
assert.equal(est.participantes, 4);
assert.equal(est.niveles["Inicial"], 1);
assert.equal(est.acuerdo.length, 3);
paso("cálculos de la sala: puntaje, ideas, mirada propia y estadísticas");

// ── Sesión de demo sembrada: solo desde el SQL Editor (no desde la API) y siempre igual
// Qué pedidos quedan para reenviar: el último de cada persona, si falló o se cortó hace más de 2 minutos.
{
  const ahora = Date.parse("2026-11-12T15:00:00Z");
  const hace = (min) => new Date(ahora - min * 60000).toISOString();
  const envios = [
    { id: 1, participante_id: "a", email: "a@x.co", creado_at: hace(10), enviado_at: hace(9), error: null }, // salió
    { id: 2, participante_id: "b", email: "b@x.co", creado_at: hace(10), enviado_at: null, error: "no se pudo enviar el mail" }, // falló
    { id: 3, participante_id: "c", email: "c@x.co", creado_at: hace(10), enviado_at: null, error: "no se pudo enviar el mail" },
    { id: 4, participante_id: "c", email: "c2@x.co", creado_at: hace(6), enviado_at: hace(5), error: null }, // corrigió el email y salió
    { id: 5, participante_id: "d", email: "d@x.co", creado_at: hace(0.5), enviado_at: null, error: null }, // en curso
    { id: 6, participante_id: "e", email: "e@x.co", creado_at: hace(30), enviado_at: null, error: null }, // el servidor se cortó
    { id: 7, participante_id: "f", email: "f@x.co", creado_at: hace(21), enviado_at: hace(20), error: null },
    { id: 8, participante_id: "f", email: "f@x.co", creado_at: hace(3), enviado_at: null, error: "no se pudo enviar el mail" }, // a ese email ya le llegó
    { id: 9, participante_id: "g", email: "g@x.co", creado_at: hace(8), enviado_at: hace(7), error: null },
    { id: 10, participante_id: "g", email: "g2@x.co", creado_at: hace(4), enviado_at: null, error: "no se pudo enviar el mail" }, // corrigió y falló
  ];
  assert.deepEqual(pendientes(envios, { ahora }).map((e) => e.id), [2, 6, 10]);
  assert.deepEqual(pendientes(envios, { ahora, envio: 1 }).map((e) => e.id), [1]);
  assert.deepEqual(pendientes(envios, { ahora, envio: 99 }), []);
}
paso("reenvío del informe: pendientes y PDF rearmado con los mismos datos");
await assert.rejects(() => rpc("taller_sembrar", { p_codigo: "DEMO", p_clave: "demo2026" }), /permission denied/);
const sembrar = (cierre) => comoServidor("select public.taller_sembrar('DEMO', 'demo2026', p_cierre => $1) as r", [cierre]);
assert.deepEqual(await sembrar(false), { codigo: "DEMO", participantes: 46 });
p = await rpc("taller_panel", { p_codigo: "DEMO", p_clave: "demo2026" });
assert.deepEqual([p.fase, p.demo, p.conectados], ["espera", true, 46]);
assert.ok(p.participantes.every((f) => Object.keys(f.r).length === 28));
const huella = sala.diagnostico(p.participantes);
await sembrar(true);
p = await rpc("taller_panel", { p_codigo: "DEMO", p_clave: "demo2026" });
assert.equal(p.fase, "cierre");
assert.equal(p.participantes.length, 46, "volver a sembrar reemplaza la sesión, no la duplica");
assert.equal(Object.keys(p.elegidas).length, 7);
const huella2 = sala.diagnostico(p.participantes, p.elegidas);
cerca(huella2.global, huella.global);
assert.equal(huella2.fuga.id, huella.fuga.id, "la demo muestra siempre el mismo patrón");
assert.ok(huella2.globalConIdeas > huella2.global);
console.log(`  demo: ${huella.global.toFixed(2)} hoy, ${huella2.globalConIdeas.toFixed(2)} con las ideas de arranque, fuga en ${huella.fuga.name}`);
paso("sesión de demo sembrada");

console.log(`\n${ok} grupos de pruebas OK`);
