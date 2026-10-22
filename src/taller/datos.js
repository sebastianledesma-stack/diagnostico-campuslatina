// Textos del taller. Las etapas, preguntas e ideas para subir son las mismas del diagnóstico
// (src/data y src/lib/scoring.js): acá solo lo propio del taller.
export { ETAPAS_DATA } from "../data/etapas.js";

export const HERRAMIENTA = "Diagnóstico colectivo";
export const TALLER = "El viaje invisible del aspirante";
export const EVENTO_POR_DEFECTO = "REALCUP 2026 · Guayaquil";

// Consigna: anónimo, sin respuestas correctas, pero a conciencia (la discusión se alimenta de eso).
export const CONSIGNA_TITULO = "No hay respuestas correctas.";
export const CONSIGNA = "Responda a conciencia lo que cree que representa a una universidad (o a varias) de su región: lo que pasa con más frecuencia, no lo ideal.";

// El taller de REALCUP tiene su propia dirección, sin código: /realcup2026 (asistentes),
// /realcup2026/expositor y /realcup2026/pantalla. Las demás sesiones (ensayos) usan /s, /f y /p.
export const EVENTO = { codigo: "REALCUP", ruta: "/realcup2026", nombre: EVENTO_POR_DEFECTO };
export const rutaAsistente = (codigo) => (codigo === EVENTO.codigo ? EVENTO.ruta : `/s/${codigo}`);
export const rutaExpositor = (codigo) => (codigo === EVENTO.codigo ? `${EVENTO.ruta}/expositor` : `/f/${codigo}`);
export const rutaPantalla = (codigo) => (codigo === EVENTO.codigo ? `${EVENTO.ruta}/pantalla` : `/p/${codigo}`);

// Link que abre el QR. Sin protocolo para mostrarlo en pantalla.
export const urlParticipante = (codigo) => `${window.location.origin}${rutaAsistente(codigo)}`;
export const urlCorta = (codigo) => `${window.location.host}${rutaAsistente(codigo)}`;

// Los pasos de los resultados de una etapa y del cierre, en el orden en que se proyectan.
export const VISTAS_ETAPA = [
  { id: "resultado", texto: "Resultado" },
  { id: "ideas", texto: "Ideas para subir" },
];
// Los ids del cierre son los valores que acepta la base (003_taller.sql): "estadisticas" es el
// recorrido de hoy y "mapa" (libre desde que se sacó el mapa de calor), el recorrido con las ideas.
export const VISTAS_CIERRE = [
  { id: "resumen", texto: "El viaje" },
  { id: "estadisticas", texto: "El recorrido" },
  { id: "mapa", texto: "Con las ideas" },
];
