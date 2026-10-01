// Google Analytics 4: misma propiedad que campuslatina.com, así se ve el recorrido completo
// (web principal → diagnóstico) y cuánto tráfico orgánico termina el test.
// Solo mide en producción y nunca en /admin. Nunca se envían datos personales:
// ni nombre, ni mail, ni teléfono, ni universidad.
export const GA_ID = "G-3R3PVW6BMY";

// Snippet para las páginas estáticas de la guía (scripts/build-seo.mjs). index.html tiene el mismo código.
export const GA_SNIPPET = `<script>
(function () {
  if (location.hostname !== "diagnostico.campuslatina.com" || location.pathname.indexOf("/admin") === 0) return;
  var s = document.createElement("script"); s.async = true;
  s.src = "https://www.googletagmanager.com/gtag/js?id=${GA_ID}"; document.head.appendChild(s);
  window.dataLayer = window.dataLayer || [];
  window.gtag = function () { dataLayer.push(arguments); };
  gtag("js", new Date());
  gtag("config", "${GA_ID}", { page_location: location.origin + location.pathname.replace(/^\\/d\\/[^/]+/, "/d/privado") });
})();
</script>`;

// Eventos del embudo: diagnostico_inicio → generate_lead (registro) → etapa_completada ×7
// → diagnostico_completo → informe_seccion / contacto_click.
export function track(evento, params = {}) {
  if (typeof window === "undefined" || typeof window.gtag !== "function") return;
  // Cada evento lleva la URL actual: sin esto, Analytics guardaría el link secreto /d/<clave>.
  const page_location = location.origin + location.pathname.replace(/^\/d\/[^/]+/, "/d/privado");
  window.gtag("event", evento, { page_location, ...params });
}
