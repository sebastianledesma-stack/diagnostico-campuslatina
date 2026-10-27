// /f/<código> — Frontend del expositor (escritorio). Es lo que se proyecta en el salón, con los
// controles encima: aparecen al mover el mouse y se esconden solos a los 3 s. Se avanza como en una
// presentación: → (o el control remoto de diapositivas) pasa al paso siguiente del taller y ← vuelve.
//   Pantalla del QR → por cada etapa: abierta · resultado · ideas para subir → cierre: el viaje · el
//   recorrido · con las ideas.
import { useCallback, useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import * as api from "../api.js";
import { usePanel } from "../usePanel.js";
import { Escenario, AccesoFacilitador, SinSesion } from "../componentes.jsx";
import { leerClave, guardarClave, borrarClave } from "../claves.js";
import { ETAPAS_DATA, VISTAS_ETAPA, VISTAS_CIERRE, urlParticipante, rutaPantalla } from "../datos.js";
import { completaron, conRespuestas } from "../sala.js";
import { exportarCSV } from "../csv.js";
import { Pantalla, clavePantalla } from "../vistas/Pantalla.jsx";

// Los pasos del taller, en orden.
const PASOS = [
  { fase: "espera", etapa: 0, texto: "Pantalla del QR" },
  ...ETAPAS_DATA.flatMap((e) => [
    { fase: "abierta", etapa: e.num, texto: `Abrir etapa ${e.num}` },
    ...VISTAS_ETAPA.map((v) => ({ fase: "resultados", etapa: e.num, vista: v.id, texto: v.id === "resultado" ? "Mostrar resultados" : v.texto })),
  ]),
  ...VISTAS_CIERRE.map((v) => ({ fase: "cierre", vista: v.id, texto: v.id === "resumen" ? "Resultado final" : v.texto })),
];

// Texto del botón: en los resultados, con la etapa ("Etapa 3 · Mapa de calor").
const etiqueta = (p) => (p.fase === "resultados" ? `Etapa ${p.etapa} · ${p.texto}` : p.texto);

// Dónde está el taller en la lista de pasos. La pantalla del QR entre etapas queda "entre" la etapa
// anterior y la siguiente. Una vista que ya no existe (el mapa de calor) cuenta como la primera.
function posicion(d) {
  const i = (f) => PASOS.findIndex(f);
  const vista = (lista) => (lista.some((v) => v.id === d.vista) ? d.vista : lista[0].id);
  if (d.fase === "espera") return d.etapa === 0 ? 0 : i((p) => p.fase === "resultados" && p.etapa === d.etapa && p.vista === "ideas") + 0.5;
  if (d.fase === "abierta") return i((p) => p.fase === "abierta" && p.etapa === d.etapa);
  if (d.fase === "resultados") return i((p) => p.fase === "resultados" && p.etapa === d.etapa && p.vista === vista(VISTAS_ETAPA));
  return i((p) => p.fase === "cierre" && p.vista === vista(VISTAS_CIERRE));
}

export default function Expositor({ codigo: fijo }) {
  const params = useParams();
  const codigo = (fijo || params.codigo).toUpperCase();
  const [clave, setClave] = useState(() => leerClave(codigo));
  const { datos, error, enLinea, aplicar } = usePanel(codigo, clave);

  if (error?.codigo === "sesion_no_encontrada") return <SinSesion codigo={codigo} />;
  if (!clave || error?.codigo === "clave_incorrecta") {
    return (
      <AccesoFacilitador codigo={codigo} destino="la pantalla del expositor"
        aviso={clave ? "La clave guardada en este navegador ya no sirve. Vuelva a escribirla." : ""}
        onListo={(c) => { guardarClave(codigo, c); setClave(c); }} />
    );
  }
  if (!datos) return <Escenario />;
  return <Presentacion datos={datos} codigo={codigo} clave={clave} aplicar={aplicar} enLinea={enLinea} salir={() => { borrarClave(codigo); setClave(""); }} />;
}

function Presentacion({ datos, codigo, clave, aplicar, enLinea, salir }) {
  const [visible, setVisible] = useState(true);
  const [menu, setMenu] = useState(null); // "etapas" | "mas"
  const [ocupado, setOcupado] = useState(false);
  const [aviso, setAviso] = useState("");
  const [simulando, setSimulando] = useState(false);
  const temporizador = useRef(null);

  const pos = posicion(datos);
  const siguiente = PASOS.find((_, i) => i > pos);
  const anterior = [...PASOS].reverse().find((_, k) => PASOS.length - 1 - k < pos);

  // Los controles aparecen al mover el mouse y se esconden a los 3 s (salvo con un menú abierto).
  useEffect(() => {
    const mostrar = () => {
      setVisible(true);
      clearTimeout(temporizador.current);
      temporizador.current = setTimeout(() => setVisible(false), 3000);
    };
    mostrar();
    window.addEventListener("mousemove", mostrar);
    return () => { window.removeEventListener("mousemove", mostrar); clearTimeout(temporizador.current); };
  }, []);

  const ejecutar = useCallback(async (pedido) => {
    setOcupado(true);
    setAviso("");
    try { aplicar(await pedido()); } catch (err) { setAviso(api.mensaje(err)); }
    setOcupado(false);
  }, [aplicar]);

  const ir = useCallback((paso) => {
    if (!paso || ocupado) return;
    setMenu(null);
    ejecutar(() => {
      if (paso.fase === "espera") return api.control(codigo, clave, "espera");
      if (paso.fase === "abierta") return api.control(codigo, clave, "abrir", paso.etapa);
      if (paso.fase === "resultados") {
        return datos.fase === "resultados" && datos.etapa === paso.etapa
          ? api.vista(codigo, clave, paso.vista)
          : api.control(codigo, clave, "mostrar", paso.etapa, paso.vista);
      }
      return datos.fase === "cierre" ? api.vista(codigo, clave, paso.vista) : api.control(codigo, clave, "cierre", null, paso.vista);
    });
  }, [codigo, clave, datos.fase, datos.etapa, ejecutar, ocupado]);

  const elegir = useCallback((etapa, claves) => ejecutar(() => api.elegir(codigo, clave, etapa, claves)), [codigo, clave, ejecutar]);

  // Teclado y control remoto de diapositivas (envían flechas o Re Pág / Av Pág).
  useEffect(() => {
    const tecla = (ev) => {
      if (ev.target.closest?.("input, select, textarea")) return;
      if (["ArrowRight", "PageDown", " "].includes(ev.key)) { ev.preventDefault(); ir(siguiente); }
      else if (["ArrowLeft", "PageUp"].includes(ev.key)) { ev.preventDefault(); ir(anterior); }
      else if (ev.key === "f" || ev.key === "F") pantallaCompleta();
      else if (ev.key === "Escape") setMenu(null);
    };
    window.addEventListener("keydown", tecla);
    return () => window.removeEventListener("keydown", tecla);
  }, [ir, siguiente, anterior]);

  // Los avisos de error se van solos.
  useEffect(() => {
    if (!aviso) return undefined;
    const t = setTimeout(() => setAviso(""), 6000);
    return () => clearTimeout(t);
  }, [aviso]);

  // Simulación (solo sesiones de prueba): participantes ficticios que responden cada etapa abierta.
  useEffect(() => {
    if (!simulando) return undefined;
    const t = setInterval(() => {
      api.simular(codigo, clave).catch((err) => { if (!api.esTransitorio(err)) { setAviso(api.mensaje(err)); setSimulando(false); } });
    }, 1500);
    return () => clearInterval(t);
  }, [simulando, codigo, clave]);

  const mostrarControles = visible || menu || aviso;
  return (
    <>
      <Escenario cursor={mostrarControles ? "auto" : "none"}>
        <div key={clavePantalla(datos)} style={{ position: "absolute", inset: 0 }}>
          <Pantalla datos={datos} onElegir={elegir} />
        </div>
      </Escenario>
      <div className="t-controles" data-visible={mostrarControles ? "" : undefined}>
        {menu === "etapas" && <MenuEtapas datos={datos} ejecutar={ejecutar} codigo={codigo} clave={clave} />}
        {menu === "mas" && (
          <MenuMas datos={datos} codigo={codigo} clave={clave} simulando={simulando} setSimulando={setSimulando}
            irAlQr={() => ir(PASOS[0])} setAviso={setAviso} salir={salir} cerrar={() => setMenu(null)} />
        )}
        {aviso && <p className="t-controles-aviso" role="alert">{aviso}</p>}
        <div className="t-barra-expositor">
          <Estado datos={datos} enLinea={enLinea} simulando={simulando} />
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <button className="t-ctl" onClick={() => ir(anterior)} disabled={!anterior || ocupado} title="Paso anterior (←)">◀ {anterior ? etiqueta(anterior) : ""}</button>
            <button className="t-ctl t-ctl-principal" onClick={() => ir(siguiente)} disabled={!siguiente || ocupado} title="Paso siguiente (→)">
              {siguiente ? `${etiqueta(siguiente)} ▶` : "Fin del taller"}
            </button>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button className="t-ctl" aria-expanded={menu === "etapas"} onClick={() => setMenu(menu === "etapas" ? null : "etapas")}>Etapas</button>
            <button className="t-ctl" aria-expanded={menu === "mas"} onClick={() => setMenu(menu === "mas" ? null : "mas")}>Más</button>
            <button className="t-ctl" onClick={pantallaCompleta} title="Pantalla completa (F)">⛶</button>
          </div>
        </div>
      </div>
    </>
  );
}

function pantallaCompleta() {
  if (document.fullscreenElement) document.exitFullscreen?.();
  else document.documentElement.requestFullscreen?.().catch(() => {});
}

function Estado({ datos, enLinea, simulando }) {
  const e = ETAPAS_DATA[datos.etapa - 1];
  const total = datos.participantes.length;
  let detalle = `${total} ${total === 1 ? "persona" : "personas"}`;
  if (datos.fase === "abierta" && e) detalle = `${completaron(datos.participantes, e.id).length}/${total} respondieron`;
  if (datos.fase === "cierre") detalle += ` · ${datos.envios} ${datos.envios === 1 ? "informe enviado" : "informes enviados"}`;
  return (
    <p style={{ fontSize: 14, lineHeight: 1.35, minWidth: 220 }}>
      <span className="t-red" data-off={enLinea ? undefined : ""} style={{ color: "inherit" }}>{datos.codigo}{enLinea ? "" : " · Sin conexión, reintentando…"}</span>
      <span style={{ display: "block", color: "var(--pizarra)" }}>{detalle} · {datos.conectados} conectados{simulando ? " · simulando" : ""}</span>
    </p>
  );
}

// En las ideas: elegir todas o ninguna de una vez.
// Saltar a cualquier etapa: abrirla (o reabrirla) o ver sus resultados.
function MenuEtapas({ datos, ejecutar, codigo, clave }) {
  const total = datos.participantes.length;
  return (
    <div className="t-menu" role="menu" style={{ left: "50%", transform: "translateX(-50%)", width: 560 }}>
      {ETAPAS_DATA.map((e) => {
        const actual = datos.etapa === e.num && datos.fase !== "espera" && datos.fase !== "cierre";
        const revelada = datos.reveladas.includes(e.num);
        const hay = conRespuestas(datos.participantes, e.id).length > 0;
        const estado = actual && datos.fase === "abierta" ? "Abierta" : revelada ? "Resultados mostrados" : hay ? "Respondida" : "Sin abrir";
        const reabrir = revelada ? `Al reabrir la etapa ${e.num}, sus resultados se ocultan hasta que los vuelva a mostrar. ¿Seguir?` : "";
        return (
          <div key={e.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "8px 4px", borderTop: e.num > 1 ? "1px solid rgba(255,255,255,.1)" : 0 }}>
            <span style={{ flex: 1 }}>
              <strong style={{ fontWeight: 600 }}>{e.num}. {e.name}</strong>
              <span style={{ display: "block", fontSize: 13, color: "var(--pizarra)" }}>{estado}{hay ? ` · ${completaron(datos.participantes, e.id).length}/${total}` : ""}</span>
            </span>
            {!(actual && datos.fase === "abierta") && (
              <button className="t-ctl" onClick={() => { if (!reabrir || window.confirm(reabrir)) ejecutar(() => api.control(codigo, clave, "abrir", e.num)); }}>{hay ? "Reabrir" : "Abrir"}</button>
            )}
            {hay && <button className="t-ctl" onClick={() => ejecutar(() => api.control(codigo, clave, "mostrar", e.num))}>Resultados</button>}
          </div>
        );
      })}
      <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, paddingTop: 10, borderTop: "1px solid rgba(255,255,255,.1)" }}>
        <button className="t-ctl" onClick={() => ejecutar(() => api.control(codigo, clave, "cierre"))}>Resultado final</button>
      </div>
    </div>
  );
}

function MenuMas({ datos, codigo, clave, simulando, setSimulando, irAlQr, setAviso, salir, cerrar }) {
  const [copiado, setCopiado] = useState(false);
  async function csv() {
    try { exportarCSV(codigo, await api.exportar(codigo, clave)); cerrar(); } catch (err) { setAviso(api.mensaje(err)); }
  }
  return (
    <div className="t-menu" role="menu" style={{ right: 16, width: 320 }}>
      <button className="t-menu-item" onClick={irAlQr}>Mostrar el QR</button>
      <button className="t-menu-item" onClick={() => navigator.clipboard?.writeText(urlParticipante(codigo)).then(() => { setCopiado(true); setTimeout(() => setCopiado(false), 2000); })}>
        {copiado ? "Link copiado" : "Copiar el link para asistentes"}
      </button>
      <a className="t-menu-item" href={rutaPantalla(codigo)} target="_blank" rel="noopener" onClick={cerrar}>Abrir pantalla espejo</a>
      <button className="t-menu-item" onClick={csv}>Exportar CSV (con emails)</button>
      {datos.demo && (
        <button className="t-menu-item" onClick={() => { setSimulando(!simulando); cerrar(); }}>{simulando ? "Detener la simulación" : "Simular respuestas (sesión de prueba)"}</button>
      )}
      <button className="t-menu-item" onClick={salir}>Salir</button>
    </div>
  );
}
