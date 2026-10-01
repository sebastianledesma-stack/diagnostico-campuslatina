// Calificación de la universidad: tamaño actual y meta a 3 años.
// Define qué ofrece el informe al final: reunión de 45 minutos (target) o contacto por mail.
// La usan el formulario, el informe, los mails y el panel. Cambiar el umbral acá.

export const RANGOS_ALUMNOS = [
  { id: "lt1k", texto: "Menos de 1.000", min: 0 },
  { id: "1k-5k", texto: "Entre 1.000 y 5.000", min: 1000 },
  { id: "5k-15k", texto: "Entre 5.000 y 15.000", min: 5000 },
  { id: "15k-40k", texto: "Entre 15.000 y 40.000", min: 15000 },
  { id: "gt40k", texto: "Más de 40.000", min: 40000 },
];

// Umbral provisorio: se ofrece la reunión a partir de este tamaño actual.
export const TARGET_MIN_ALUMNOS = 1000;

const rango = (id) => RANGOS_ALUMNOS.find((r) => r.id === id);
export const textoRango = (id) => rango(id)?.texto || "—";
export const esRangoValido = (id) => !!rango(id);
export const esTarget = (actuales) => (rango(actuales)?.min ?? -1) >= TARGET_MIN_ALUMNOS;
