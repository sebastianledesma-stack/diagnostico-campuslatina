// Calificación de la universidad: tamaño actual y cuánto quiere crecer en 3–5 años.
// Define qué ofrece el informe al final: reunión de 45 minutos (target) o contacto por mail.
// La usan el formulario, el informe, los mails y el panel. Cambiar el umbral acá.

export const RANGOS_ALUMNOS = [
  { id: "lt1k", texto: "Menos de 1.000", min: 0 },
  { id: "1k-5k", texto: "Entre 1.000 y 5.000", min: 1000 },
  { id: "5k-15k", texto: "Entre 5.000 y 15.000", min: 5000 },
  { id: "15k-40k", texto: "Entre 15.000 y 40.000", min: 15000 },
  { id: "gt40k", texto: "Más de 40.000", min: 40000 },
];

// Meta a 3–5 años: cuánto quiere crecer. Se guarda en la columna alumnos_meta.
// Hasta noviembre de 2026 la meta era un rango de RANGOS_ALUMNOS: esas filas siguen guardando
// el rango y se muestran como tal (textoMeta). `crece` dice si cuenta como querer crecer.
export const METAS_CRECIMIENTO = [
  { id: "mantener", texto: "Mantener la cantidad actual", crece: false },
  { id: "hasta50", texto: "Crecer hasta un 50%", crece: true },
  { id: "mas50", texto: "Crecer más de un 50%", crece: true },
];

// Quién recibe la oferta de reunión de 45 min (target). Ajustar acá cuando haya más datos:
//   · más de 5.000 estudiantes hoy → siempre
//   · entre 1.000 y 5.000 → solo si quiere crecer (cualquier opción con `crece`)
//   · menos de 1.000 → no (reciben el informe y la invitación a escribir)
export const TARGET_SIEMPRE_DESDE = 5000;
export const TARGET_SI_CRECE_DESDE = 1000;

const rango = (id) => RANGOS_ALUMNOS.find((r) => r.id === id);
const orden = (id) => RANGOS_ALUMNOS.findIndex((r) => r.id === id);
const metaDe = (id) => METAS_CRECIMIENTO.find((m) => m.id === id);
export const textoRango = (id) => rango(id)?.texto || "—";
export const esRangoValido = (id) => !!rango(id);
export const textoMeta = (id) => metaDe(id)?.texto || textoRango(id);
// Acepta también un rango por si alguien envía el formulario con la versión anterior abierta.
export const esMetaValida = (id) => !!metaDe(id) || esRangoValido(id);
export function esTarget(actuales, meta) {
  const min = rango(actuales)?.min ?? -1;
  if (min >= TARGET_SIEMPRE_DESDE) return true;
  const crece = metaDe(meta) ? metaDe(meta).crece : orden(meta) > orden(actuales);
  return min >= TARGET_SI_CRECE_DESDE && crece;
}
