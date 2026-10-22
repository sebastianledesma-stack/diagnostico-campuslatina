// Textos compartidos entre el informe online, el PDF imprimible y el PDF del mail.
// Registro: español neutro, sin tuteo ni voseo.

// Qué significa cada nivel, en una línea (mismas ideas que la matriz del Radar).
export const NIVEL_DESC = {
  "Inicial": "sin proceso: depende de personas y del azar",
  "En desarrollo": "hay intención, pero sin sistema ni consistencia",
  "Consolidado": "proceso definido, predecible y con métricas básicas",
  "Avanzado": "proceso automatizado, personalizado y en mejora continua",
};

// Lectura del diagnóstico según el puntaje global y la etapa donde más inscriptos se pierden.
export function lecturaDiagnostico(score, b) {
  if (score >= 5) return "Las 7 etapas quedaron en el nivel más alto que mide el diagnóstico. El próximo paso es validarlo con números reales: una autoevaluación así suele ser optimista.";
  if (score <= 2) return `Hoy, conseguir inscriptos depende más de personas y del azar que de un proceso. El primer lugar donde se pierden aspirantes es ${b.name}: ahí está la mejora más rápida.`;
  if (score <= 3) return `Hay una base, pero se pierden aspirantes en el camino, sobre todo en ${b.name}. Ordenar ese momento es lo que más inscriptos puede sumar.`;
  return `Hay una base sólida, pero todavía se pierden inscriptos en ${b.name}. Resolver ese momento y automatizar lo que hoy depende de la iniciativa de cada persona es el próximo salto.`;
}

export const AUTORIDAD = "Ayudamos a inscribir a más de 200.000 estudiantes en Argentina y ahora llevamos esa experiencia al resto de Latinoamérica.";

// Cuando todas las respuestas están en D (puntaje 5): una autoevaluación así suele ser optimista,
// así que en lugar de acciones se propone validarla con números reales.
export const VALIDAR = {
  titulo: "Su proceso está en el nivel más alto que mide este diagnóstico",
  texto: "El próximo paso es comprobarlo con números reales. Si acompañan, su institución es un referente; si no, ahí está la brecha que una autoevaluación no ve.",
  metricas: [
    "Tiempo real de la primera respuesta a una consulta.",
    "Porcentaje de consultas que terminan en inscripción.",
    "Porcentaje de inscriptos que efectivamente empiezan a cursar.",
  ],
  reunion: "Comparemos sus números con lo que vemos en otras universidades.",
};
