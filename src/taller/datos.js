// Textos del taller. Las etapas, preguntas e ideas para subir son las mismas del diagnóstico
// (src/data y src/lib/scoring.js): acá solo lo propio del taller.
export { ETAPAS_DATA } from "../data/etapas.js";

export const HERRAMIENTA = "Diagnóstico colectivo";
export const TALLER = "El viaje invisible del aspirante";
export const EVENTO_POR_DEFECTO = "REALCUP 2026 · Guayaquil";

// Consigna: anónimo, sin respuestas correctas, pero a conciencia (la discusión se alimenta de eso).
export const CONSIGNA_TITULO = "No hay respuestas correctas.";
export const CONSIGNA = "Responda a conciencia lo que cree que representa a una universidad (o a varias) de su región: lo que pasa con más frecuencia, no lo ideal.";

// Link que abre el QR. Sin protocolo para mostrarlo en pantalla.
export const urlParticipante = (codigo) => `${window.location.origin}/s/${codigo}`;
export const urlCorta = (codigo) => `${window.location.host}/s/${codigo}`;

// Los pasos de los resultados de una etapa y del cierre, en el orden en que se proyectan.
export const VISTAS_ETAPA = [
  { id: "resultado", texto: "Resultado" },
  { id: "mapa", texto: "Mapa de calor" },
  { id: "ideas", texto: "Ideas para subir" },
];
export const VISTAS_CIERRE = [
  { id: "resumen", texto: "Resumen" },
  { id: "mapa", texto: "Mapa de calor" },
  { id: "estadisticas", texto: "Estadísticas" },
];
