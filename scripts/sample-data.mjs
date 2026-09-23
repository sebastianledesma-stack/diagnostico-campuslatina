// Fila de ejemplo de `diagnosticos` para probar PDF y mails sin Supabase.
import { ETAPAS_DATA } from "../src/data/etapas.js";
import { calcResultados } from "../src/lib/scoring.js";

export function sampleDiagnostico() {
  const letras = ["A", "B", "C", "D"];
  const respuestas = {};
  ETAPAS_DATA.forEach((e, ei) => e.preguntas.forEach((_, pi) => { respuestas[`${e.id}_${pi}`] = letras[(ei + pi) % 4]; }));
  return {
    id: "00000000-0000-4000-8000-000000000000",
    created_at: new Date().toISOString(),
    universidad: "Universidad Nacional de Córdoba",
    pais: "Argentina",
    nombre: "María González",
    cargo: "Vicerrectora de Desarrollo Institucional",
    email: "maria@universidad.edu",
    whatsapp: "+54 9 351 555-1234",
    respuestas,
    ...calcResultados(respuestas),
    mail_enviado: false,
    notif_enviada: false,
  };
}
