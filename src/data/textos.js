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
  if (score <= 2) return `Hoy, conseguir inscriptos depende más de personas y del azar que de un proceso. El primer lugar donde se pierden aspirantes es ${b.name}: ahí está la mejora más rápida.`;
  if (score <= 3) return `Hay una base, pero se pierden aspirantes en el camino, sobre todo en ${b.name}. Ordenar ese momento es lo que más inscriptos puede sumar.`;
  return `Hay una base sólida, pero todavía se pierden inscriptos en ${b.name}. Resolver ese momento y automatizar lo que hoy depende de la iniciativa de cada persona es el próximo salto.`;
}

export const AUTORIDAD = "Ayudamos a inscribir a más de 180.000 estudiantes en Argentina y ahora llevamos esa experiencia al resto de Latinoamérica.";
