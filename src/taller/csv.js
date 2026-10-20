// CSV crudo del taller para los expositores: una fila por participante, con su email (si pidió el
// informe), el puntaje de cada etapa y la letra de las 28 respuestas. Mismo formato que el CSV de /admin.
import { ETAPAS_DATA } from "./datos.js";
import { calcScore, fmt1 } from "../lib/scoring.js";

const ORIGEN = { movil: "teléfono", simulado: "simulado" };

export function exportarCSV(codigo, filas) {
  const preguntas = ETAPAS_DATA.flatMap((e) => e.preguntas.map((_, i) => `${e.id}_${i}`));
  const headers = ["participante", "origen", "email", "informe_enviado", ...ETAPAS_DATA.map((e) => `puntaje_${e.id}`), ...preguntas];
  const cell = (v) => {
    const s = v == null ? "" : String(v);
    return /[";\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const respondio = (f, e) => e.preguntas.some((_, i) => f.r[`${e.id}_${i}`]);
  const lines = filas.map((f) => [
    f.n, ORIGEN[f.origen] || f.origen, f.email || "", f.email ? (f.enviado ? "sí" : "no") : "",
    ...ETAPAS_DATA.map((e) => (respondio(f, e) ? fmt1(calcScore(f.r, e.id)) : "")),
    ...preguntas.map((k) => f.r[k] || ""),
  ].map(cell).join(";"));
  // BOM + ";" para que Excel en español lo abra con acentos y columnas bien separadas.
  const blob = new Blob(["﻿" + [headers.join(";"), ...lines].join("\r\n")], { type: "text/csv;charset=utf-8" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `taller-${codigo}-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}
