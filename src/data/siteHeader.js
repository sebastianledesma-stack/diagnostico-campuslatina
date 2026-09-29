// Header de la web principal (campuslatina.com), reutilizado en el subdominio del diagnóstico.
// Una sola fuente para la app React (components/SiteHeader.jsx) y las páginas estáticas de la guía
// (scripts/build-seo.mjs). Si cambia el menú de campuslatina.com, se cambia acá.
export const WEB = "https://campuslatina.com";

export const NAV_LINKS = [
  { href: `${WEB}/quienes-somos`, texto: "Por qué existimos" },
  { href: `${WEB}/como-trabajamos`, texto: "Cómo trabajamos" },
  { href: `${WEB}/notas/`, texto: "Notas" },
];
export const NAV_CTA = { href: "/", texto: "Diagnóstico gratuito →" };

// Mismo diseño que el nav de campuslatina.com (medidas y colores), con zonas táctiles de 44 px.
export const SITE_HEADER_CSS = `
.cl-nav{position:sticky;top:0;z-index:1000;background:#0E1240;border-bottom:1px solid rgba(255,255,255,.06);font-family:'DM Sans',system-ui,sans-serif}
.cl-nav-in{max-width:1160px;margin:0 auto;padding:0 48px;height:64px;display:flex;align-items:center;justify-content:space-between}
.cl-logo{display:flex;align-items:center;min-height:44px;text-decoration:none}
.cl-logo img{height:40px;width:auto;display:block;filter:brightness(0) invert(1)}
.cl-links{display:flex;align-items:center;gap:30px}
.cl-links a{font-size:14px;color:rgba(255,255,255,.72);text-decoration:none;transition:color .2s;display:inline-flex;align-items:center;justify-content:center;min-height:44px;min-width:44px}
.cl-links a:hover{color:#fff}
.cl-links .cl-cta{display:inline-flex;align-items:center;min-height:44px;background:#00C896;color:#0E1240;padding:0 18px;border-radius:9px;font-weight:700;font-size:14px;border:none;cursor:pointer;font-family:inherit}
.cl-links .cl-cta:hover{background:#00DFA8;color:#0E1240}
.cl-ham{display:none;flex-direction:column;justify-content:center;align-items:center;gap:4px;background:none;border:none;cursor:pointer;width:44px;height:44px;padding:0}
.cl-ham span{width:20px;height:1.6px;background:#fff;display:block}
.cl-drawer{position:absolute;top:64px;left:0;right:0;background:#0E1240;display:flex;flex-direction:column;padding:8px 24px 20px;gap:2px;transform:translateY(-12px);opacity:0;visibility:hidden;pointer-events:none;transition:transform .25s ease,opacity .25s ease,visibility 0s linear .25s;border-bottom:1px solid rgba(255,255,255,.06)}
.cl-drawer.open{transform:translateY(0);opacity:1;visibility:visible;pointer-events:auto;transition:transform .25s ease,opacity .25s ease,visibility 0s}
.cl-drawer a,.cl-drawer button{color:rgba(255,255,255,.8);text-decoration:none;font-size:15px;padding:13px 4px;min-height:44px;border:none;border-bottom:1px solid rgba(255,255,255,.06);background:none;text-align:left;font-family:inherit;cursor:pointer}
.cl-drawer .cl-cta{color:#00C896;font-weight:700}
@media (max-width:860px){.cl-nav-in{padding:0 20px}.cl-links a:not(.cl-cta){display:none}.cl-links .cl-cta{display:none}.cl-ham{display:flex}}
`;

// Versión HTML (páginas estáticas): el menú de celular se abre con un script mínimo.
export function siteHeaderHTML() {
  const links = NAV_LINKS.map((l) => `<a href="${l.href}">${l.texto}</a>`).join("");
  return `<nav class="cl-nav" aria-label="CampusLatina">
  <div class="cl-nav-in">
    <a class="cl-logo" href="${WEB}/"><img src="/campuslatina-logo.png" alt="Campus Latina" width="121" height="40"></a>
    <div class="cl-links">${links}<a class="cl-cta" href="${NAV_CTA.href}">${NAV_CTA.texto}</a></div>
    <button class="cl-ham" id="cl-ham" aria-label="Menú" aria-expanded="false" aria-controls="cl-drawer"><span></span><span></span><span></span></button>
  </div>
  <div class="cl-drawer" id="cl-drawer"><a href="${WEB}/">Inicio</a>${links}<a class="cl-cta" href="${NAV_CTA.href}">${NAV_CTA.texto}</a></div>
</nav>
<script>(function(){var h=document.getElementById('cl-ham'),d=document.getElementById('cl-drawer');h.addEventListener('click',function(){var o=d.classList.toggle('open');h.setAttribute('aria-expanded',o)});})();</script>`;
}
