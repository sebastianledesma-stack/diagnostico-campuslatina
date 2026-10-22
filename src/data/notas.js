// Notas publicadas en campuslatina.com/notas y las etapas del diagnóstico con las que se relacionan.
// Las páginas de la guía enlazan a estas notas y cada nota enlaza de vuelta a sus etapas
// (repo campuslatina-web). Al publicar una nota nueva, agregarla acá.
const WEB = "https://campuslatina.com/notas";

export const NOTAS = [
  { url: `${WEB}/construir-para-el-movimiento`, titulo: "Construir para el movimiento", fecha: "2026-09", etapas: [] },
  { url: `${WEB}/bot-no-es-la-solucion-proceso-admisiones`, titulo: "El bot no es la solución. El proceso que lo rodea, sí", fecha: "2026-08", etapas: ["activacion", "acompanamiento"] },
  { url: `${WEB}/cultura-de-evidencias-universidades`, titulo: "Por qué la mayoría de las universidades decide sin datos y qué hacer al respecto", fecha: "2026-08", etapas: [] },
  { url: `${WEB}/como-elige-el-estudiante-latinoamericano-2026`, titulo: "Lo que los datos de 2026 confirman sobre cómo elige el estudiante latinoamericano", fecha: "2026-07", etapas: ["descubrimiento", "exploracion"] },
  { url: `${WEB}/universidad-visibilidad-ia-llm`, titulo: "Qué pasa cuando un joven le pregunta a una IA qué estudiar y su universidad no aparece", fecha: "2026-07", etapas: ["descubrimiento"] },
  { url: `${WEB}/el-diseno-del-proceso-es-la-estrategia`, titulo: "El diseño del proceso es la estrategia", fecha: "2026-06", etapas: ["activacion", "acompanamiento"] },
  { url: `${WEB}/por-que-el-aspirante-abandona-antes-de-inscribirse`, titulo: "Por qué el aspirante abandona antes de inscribirse y cómo evitarlo", fecha: "2026-06", etapas: ["acompanamiento", "inscripcion", "retencion"] },
];

export const notasDeEtapa = (id) => NOTAS.filter((n) => n.etapas.includes(id));
