// Prerender en build: genera el HTML real de "/" para buscadores y crawlers de IA que no ejecutan JavaScript.
import { renderToString } from "react-dom/server";
import { StaticRouter } from "react-router-dom/server";
import App from "./App.jsx";

export function render(url, { desk = false } = {}) {
  globalThis.__PRERENDER_DESK__ = desk;
  return renderToString(
    <StaticRouter location={url}>
      <App />
    </StaticRouter>
  );
}
