// Estado del teléfono del asistente. Pensado para wifi de hotel:
//  · El id anónimo y las respuestas sin enviar quedan en localStorage, así quien recarga o pierde
//    la conexión retoma donde estaba sin duplicar nada. No se pide ningún dato para entrar.
//  · Cada respuesta va a una cola que se envía enseguida y se reintenta sola en cada consulta.
//  · El estado de la sala se consulta cada 3 s (cada 6 s mientras responde) y al volver a la app.
import { useCallback, useEffect, useReducer, useRef, useState } from "react";
import * as api from "./api.js";

const KEY = (codigo) => `taller-p-${codigo}`;

// crypto.randomUUID solo existe en https; en la red local de prueba (http) se arma a mano.
function uuid() {
  if (crypto.randomUUID) return crypto.randomUUID();
  const b = crypto.getRandomValues(new Uint8Array(16));
  b[6] = (b[6] & 0x0f) | 0x40;
  b[8] = (b[8] & 0x3f) | 0x80;
  const h = Array.from(b, (x) => x.toString(16).padStart(2, "0")).join("");
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
}

function leerLocal(codigo) {
  let d = null;
  try { d = JSON.parse(localStorage.getItem(KEY(codigo)) || "null"); } catch { /* sin acceso: se arranca de cero */ }
  return { id: d?.id || uuid(), cola: d?.cola || {}, email: d?.email || "" };
}
function guardarLocal(codigo, d) {
  try { localStorage.setItem(KEY(codigo), JSON.stringify(d)); } catch { /* modo privado: vale solo esta pestaña */ }
}

export function useParticipante(codigo) {
  const local = useRef(null);
  if (!local.current) local.current = leerLocal(codigo);
  const [, render] = useReducer((x) => x + 1, 0);
  const [est, setEst] = useState(null);
  const [res, setRes] = useState(null);
  const [error, setError] = useState(null);
  const [sinRed, setSinRed] = useState(false);
  const [perdidas, setPerdidas] = useState(false);
  const publico = useRef(null);
  const enviando = useRef(false);

  const persistir = useCallback(() => { guardarLocal(codigo, local.current); render(); }, [codigo]);

  const enviarCola = useCallback(async () => {
    const L = local.current;
    if (enviando.current || !Object.keys(L.cola).length) return;
    enviando.current = true;
    try {
      while (Object.keys(L.cola).length) {
        const lote = { ...L.cola };
        try {
          const r = await api.responder(codigo, L.id, lote);
          const aceptadas = Object.fromEntries(r.aceptadas.map((k) => [k, lote[k]]));
          if (r.aceptadas.length < Object.keys(lote).length) setPerdidas(true); // eran de una etapa ya cerrada
          for (const k of Object.keys(lote)) if (L.cola[k] === lote[k]) delete L.cola[k];
          setEst((e) => e && { ...e, mias: { ...e.mias, ...aceptadas } });
          setSinRed(false);
        } catch (err) {
          if (err.codigo === "etapa_cerrada") {
            for (const k of Object.keys(lote)) if (L.cola[k] === lote[k]) delete L.cola[k];
            setPerdidas(true);
          } else {
            if (api.esTransitorio(err)) setSinRed(true);
            else L.cola = {}; // un error de datos no se arregla reintentando: no trabar la cola
            break;
          }
        } finally {
          persistir();
        }
      }
    } finally {
      enviando.current = false;
    }
  }, [codigo, persistir]);

  useEffect(() => {
    let vivo = true;
    let timer;
    let enCurso = false;
    const tick = async () => {
      if (enCurso) return;
      enCurso = true;
      clearTimeout(timer);
      let fase = null;
      try {
        const e = await api.estado(codigo, local.current.id);
        if (!vivo) return;
        fase = e.fase;
        setEst(e);
        setSinRed(false);
        setError(null);
        if (e.publico && e.publico !== publico.current) {
          const r = await api.resultados(codigo);
          if (!vivo) return;
          publico.current = r.publico;
          setRes(r);
        }
        await enviarCola();
      } catch (err) {
        if (!vivo) return;
        if (!api.esTransitorio(err)) { setError(err); return; }
        setSinRed(true);
      } finally {
        enCurso = false;
      }
      if (vivo) timer = setTimeout(tick, fase === "abierta" ? 6000 : 3000);
    };
    const alVolver = () => { if (!document.hidden) tick(); };
    document.addEventListener("visibilitychange", alVolver);
    window.addEventListener("online", alVolver);
    tick();
    return () => {
      vivo = false;
      clearTimeout(timer);
      document.removeEventListener("visibilitychange", alVolver);
      window.removeEventListener("online", alVolver);
    };
  }, [codigo, enviarCola]);

  const responder = useCallback((pregunta, letra) => {
    local.current.cola[pregunta] = letra;
    persistir();
    enviarCola();
  }, [persistir, enviarCola]);

  // Pide el PDF por email. Recuerda el email en el teléfono para no tener que escribirlo de nuevo.
  const pedirInforme = useCallback(async (email) => {
    local.current.email = email;
    persistir();
    return api.pedirInforme(codigo, local.current.id, email);
  }, [codigo, persistir]);

  const cola = local.current.cola;
  return {
    est, res, error, sinRed, perdidas,
    respuestas: { ...(est?.mias || {}), ...cola },
    pendientes: Object.keys(cola).length,
    email: local.current.email,
    responder, pedirInforme,
  };
}
