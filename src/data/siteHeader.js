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

// Mismo diseño que el nav de campuslatina.com (identidad petróleo y ámbar), con zonas táctiles de 44 px.
export const SITE_HEADER_CSS = `
.cl-nav{position:sticky;top:0;z-index:1000;background:rgba(255,255,255,.97);border-bottom:1px solid #D5E3E5;font-family:'Schibsted Grotesk',system-ui,sans-serif}
.cl-nav-in{max-width:1200px;margin:0 auto;padding:0 clamp(20px,5vw,64px);height:72px;display:flex;align-items:center;justify-content:space-between}
.cl-logo{display:flex;align-items:center;min-height:44px;text-decoration:none}
.cl-logo img{height:42px;width:auto;display:block}
.cl-links{display:flex;align-items:center;gap:40px}
.cl-links a{font-size:15px;color:#4D6166;text-decoration:none;transition:color .2s;display:inline-flex;align-items:center;justify-content:center;min-height:44px;min-width:44px}
.cl-links a:hover{color:#0A2329}
.cl-links .cl-cta{display:inline-flex;align-items:center;min-height:44px;background:#0B6470;color:#fff;padding:0 18px;border-radius:0;font-weight:600;font-size:15px;border:none;cursor:pointer;font-family:inherit}
.cl-links .cl-cta:hover{background:#084E58;color:#fff}
.cl-ham{display:none;flex-direction:column;justify-content:center;align-items:center;gap:5px;background:none;border:none;cursor:pointer;width:44px;height:44px;padding:0}
.cl-ham span{width:22px;height:2px;background:#0A2329;display:block}
.cl-drawer{position:absolute;top:72px;left:0;right:0;background:#fff;border-bottom:1px solid #D5E3E5;display:flex;flex-direction:column;padding:8px clamp(20px,5vw,64px) 24px;gap:0;transform:translateY(-12px);opacity:0;visibility:hidden;pointer-events:none;transition:transform .25s ease,opacity .25s ease,visibility 0s linear .25s}
.cl-drawer.open{transform:translateY(0);opacity:1;visibility:visible;pointer-events:auto;transition:transform .25s ease,opacity .25s ease,visibility 0s}
.cl-drawer a,.cl-drawer button{color:#0A2329;text-decoration:none;font-size:18px;padding:14px 0;min-height:44px;border:none;border-bottom:1px solid #D5E3E5;background:none;text-align:left;font-family:inherit;cursor:pointer}
.cl-drawer .cl-cta{margin-top:16px;background:#0B6470;color:#fff;text-align:center;font-weight:600;border-bottom:none}
@media (max-width:860px){.cl-links a:not(.cl-cta){display:none}.cl-links .cl-cta{display:none}.cl-ham{display:flex}}
`;

// Versión HTML (páginas estáticas): el menú de celular se abre con un script mínimo.
export function siteHeaderHTML() {
  const links = NAV_LINKS.map((l) => `<a href="${l.href}">${l.texto}</a>`).join("");
  return `<nav class="cl-nav" aria-label="CampusLatina">
  <div class="cl-nav-in">
    <a class="cl-logo" href="${WEB}/"><img src="/campus-latina.svg" alt="Campus Latina" width="148" height="42"></a>
    <div class="cl-links">${links}<a class="cl-cta" href="${NAV_CTA.href}">${NAV_CTA.texto}</a></div>
    <button class="cl-ham" id="cl-ham" aria-label="Menú" aria-expanded="false" aria-controls="cl-drawer"><span></span><span></span><span></span></button>
  </div>
  <div class="cl-drawer" id="cl-drawer"><a href="${WEB}/">Inicio</a>${links}<a class="cl-cta" href="${NAV_CTA.href}">${NAV_CTA.texto}</a></div>
</nav>
<script>(function(){var h=document.getElementById('cl-ham'),d=document.getElementById('cl-drawer');h.addEventListener('click',function(){var o=d.classList.toggle('open');h.setAttribute('aria-expanded',o)});})();</script>`;
}
