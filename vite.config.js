import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

// En desarrollo, /api/* lo atienden las mismas Netlify Functions cargadas por Vite,
// con las variables de .env.local. Los mails NO se envían: se muestran en la consola (MAIL_SOLO_LOG).
function apiLocal() {
  const rutas = [
    [/^\/api\/diagnostico$/, "diagnostico", () => ({})],
    [/^\/api\/d\/([^/]+)(?:\/([^/]+))?$/, "diagnostico", (m) => ({ clave: m[1], accion: m[2] })],
    [/^\/api\/(notify|guardar|admin-data|admin-test|admin-cliente|admin-login|admin-logout)$/, null, () => ({})],
    // Con `npm run taller:local` el informe lo atiende la base local (scripts/taller-local.mjs).
    ...(process.env.TALLER_LOCAL ? [] : [[/^\/api\/taller\/informe$/, "taller-informe", () => ({})]]),
  ];
  return {
    name: "api-local",
    apply: "serve",
    configureServer(server) {
      Object.assign(process.env, loadEnv("development", process.cwd(), ""), { MAIL_SOLO_LOG: "1" });
      server.middlewares.use(async (req, res, next) => {
        const url = new URL(req.url, "http://localhost");
        const ruta = rutas.map(([re, fn, params]) => { const m = url.pathname.match(re); return m && { fn: fn || m[1], params: params(m) }; }).find(Boolean);
        if (!ruta) return next();
        try {
          const { default: handler } = await server.ssrLoadModule(`/netlify/functions/${ruta.fn}.mjs`);
          const chunks = [];
          for await (const c of req) chunks.push(c);
          const body = chunks.length ? Buffer.concat(chunks) : undefined;
          const r = await handler(new Request(url, { method: req.method, headers: req.headers, body }), { params: ruta.params });
          res.statusCode = r.status;
          r.headers.forEach((v, k) => res.setHeader(k, v));
          res.end(Buffer.from(await r.arrayBuffer()));
        } catch (err) {
          console.error("[api-local]", err);
          res.statusCode = 500;
          res.end(JSON.stringify({ error: String(err) }));
        }
      });
    },
  };
}

// Diagnóstico colectivo (taller en vivo): /s, /f, /p y /realcup2026 son otra app, servida con taller.html.
// En producción lo resuelven los redirects de netlify.toml; acá, en dev y en preview.
function tallerRutas() {
  const RUTA = /^\/(s|f|p|realcup2026)(\/[^.?]*)?(\?.*)?$/;
  const reescribir = (req, _res, next) => {
    if (RUTA.test(req.url)) req.url = "/taller.html";
    next();
  };
  return {
    name: "taller-rutas",
    configureServer(server) { server.middlewares.use(reescribir); },
    configurePreviewServer(server) { server.middlewares.use(reescribir); },
  };
}

export default defineConfig(async () => ({
  plugins: [
    react(),
    apiLocal(),
    tallerRutas(),
    // `npm run taller:local`: base Postgres local en lugar de Supabase (scripts/taller-local.mjs).
    ...(process.env.TALLER_LOCAL ? [(await import("./scripts/taller-local.mjs")).tallerLocal()] : []),
  ],
  build: {
    rollupOptions: { input: { main: "index.html", taller: "taller.html" } },
  },
}));
