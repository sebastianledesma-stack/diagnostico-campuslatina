// Header de campuslatina.com dentro del diagnóstico (mismos enlaces y diseño; fuente: data/siteHeader.js).
import { useState } from "react";
import { WEB, NAV_LINKS, NAV_CTA, SITE_HEADER_CSS } from "../data/siteHeader.js";

export default function SiteHeader({ onCta }) {
  const [abierto, setAbierto] = useState(false);
  // En la bienvenida el botón arranca el test; en otras pantallas es un enlace al inicio del diagnóstico.
  const cta = (extra = {}) => onCta
    ? <button type="button" className="cl-cta" onClick={() => { setAbierto(false); onCta(); }} {...extra}>{NAV_CTA.texto}</button>
    : <a className="cl-cta" href={NAV_CTA.href} {...extra}>{NAV_CTA.texto}</a>;
  return (
    <nav className="cl-nav" aria-label="CampusLatina">
      <style dangerouslySetInnerHTML={{ __html: SITE_HEADER_CSS }} />
      <div className="cl-nav-in">
        <a className="cl-logo" href={`${WEB}/`}><img src="/campus-latina.svg" alt="Campus Latina" width="148" height="42" /></a>
        <div className="cl-links">
          {NAV_LINKS.map((l) => <a key={l.href} href={l.href}>{l.texto}</a>)}
          {cta()}
        </div>
        <button type="button" className="cl-ham" aria-label="Menú" aria-expanded={abierto} aria-controls="cl-drawer" onClick={() => setAbierto((v) => !v)}>
          <span /><span /><span />
        </button>
      </div>
      <div className={`cl-drawer${abierto ? " open" : ""}`} id="cl-drawer">
        <a href={`${WEB}/`}>Inicio</a>
        {NAV_LINKS.map((l) => <a key={l.href} href={l.href}>{l.texto}</a>)}
        {cta()}
      </div>
    </nav>
  );
}
