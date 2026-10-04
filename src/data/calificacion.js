// Calificación de la universidad: tamaño actual y meta a 3–5 años.
// Define qué ofrece el informe al final: reunión de 45 minutos (target) o contacto por mail.
// La usan el formulario, el informe, los mails y el panel. Cambiar el umbral acá.

export const RANGOS_ALUMNOS = [
  { id: "lt1k", texto: "Menos de 1.000", min: 0 },
  { id: "1k-5k", texto: "Entre 1.000 y 5.000", min: 1000 },
  { id: "5k-15k", texto: "Entre 5.000 y 15.000", min: 5000 },
  { id: "15k-40k", texto: "Entre 15.000 y 40.000", min: 15000 },
  { id: "gt40k", texto: "Más de 40.000", min: 40000 },
];

// Quién recibe la oferta de reunión de 45 min (target). Ajustar acá cuando haya más datos:
//   · más de 5.000 estudiantes hoy → siempre
//   · entre 1.000 y 5.000 → solo si la meta a 3–5 años es al menos un rango más grande
//   · menos de 1.000 → no (reciben el informe y la invitación a escribir)
export const TARGET_SIEMPRE_DESDE = 5000;
export const TARGET_SI_CRECE_DESDE = 1000;

const rango = (id) => RANGOS_ALUMNOS.find((r) => r.id === id);
const orden = (id) => RANGOS_ALUMNOS.findIndex((r) => r.id === id);
export const textoRango = (id) => rango(id)?.texto || "—";
export const esRangoValido = (id) => !!rango(id);
export function esTarget(actuales, meta) {
  const min = rango(actuales)?.min ?? -1;
  if (min >= TARGET_SIEMPRE_DESDE) return true;
  return min >= TARGET_SI_CRECE_DESDE && orden(meta) > orden(actuales);
}
