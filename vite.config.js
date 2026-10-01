import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

// En desarrollo, /api/* lo atienden las mismas Netlify Functions cargadas por Vite,
// con las variables de .env.local. Los mails NO se envían: se muestran en la consola (MAIL_SOLO_LOG).
function apiLocal() {
  const rutas = [
    [/^\/api\/diagnostico$/, "diagnostico", () => ({})],
    [/^\/api\/d\/([^/]+)(?:\/([^/]+))?$/, "diagnostico", (m) => ({ clave: m[1], accion: m[2] })],
    [/^\/api\/(notify|guardar|admin-data)$/, null, () => ({})],
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

export default defineConfig({
  plugins: [react(), apiLocal()],
});
