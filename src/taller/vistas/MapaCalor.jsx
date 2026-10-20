// Mapa de calor de la sala en SVG: filas = participantes anónimos; columnas = las 4 preguntas de una
// etapa, las 28 agrupadas por etapa o las 7 etapas (celular). Color por puntaje de 1 a 5, de pálido a
// intenso: más intenso es más desarrollado, así la fuga se ve como una banda pálida. Sin semáforo ni
// coral (coral nunca marca pérdida): la etapa más baja de la sala va recuadrada. Las filas van de
// mayor a menor promedio para que el patrón se lea de un vistazo.
import { ETAPAS_DATA } from "../datos.js";
import { calcScore, fmt1 } from "../../lib/scoring.js";
import { diagnostico } from "../sala.js";
import { ESCALAS, colorDe } from "../colores.js";

export { colorDe };

const promedio = (xs) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null);
const valorDe = (p, letra) => p.opciones.find((o) => o.letra === letra)?.valor ?? null;

// Columnas según el modo. `s` es la etapa a la que pertenece la columna (para separar bloques).
function columnasDe(etapa, porEtapa) {
  if (etapa) {
    const e = ETAPAS_DATA.find((x) => x.id === etapa);
    return e.preguntas.map((p, q) => ({ s: q, etapa: e, q, valor: (f) => valorDe(p, f.r[`${e.id}_${q}`]) }));
  }
  if (porEtapa) {
    return ETAPAS_DATA.map((e, s) => ({ s, etapa: e, valor: (f) => (e.preguntas.some((_, q) => f.r[`${e.id}_${q}`]) ? calcScore(f.r, e.id) : null) }));
  }
  return ETAPAS_DATA.flatMap((e, s) => e.preguntas.map((p, q) => ({ s, etapa: e, q, valor: (f) => valorDe(p, f.r[`${e.id}_${q}`]) })));
}

// m: medidas. ancho; alto (opcional: si no, filaAlto fijo); celdaGap; bloqueGap (entre etapas);
// filaGap; cabeceraAlto; cabeceraDoble (nombre y promedio arriba); pieAlto; letra; filaMax; marco.
export function MapaCalor({ filas, etapa = null, porEtapa = false, tema = "oscuro", m, titulo = "Mapa de calor" }) {
  const esc = ESCALAS[tema];
  const cols = columnasDe(etapa, porEtapa);
  const conDatos = filas
    .filter((f) => cols.some((c) => c.valor(f) != null))
    .map((f) => ({ f, prom: promedio(cols.map((c) => c.valor(f)).filter((v) => v != null)) }))
    .sort((a, b) => b.prom - a.prom)
    .map((x) => x.f);
  if (!conDatos.length) return <p style={{ color: esc.suave }}>Todavía no hay respuestas.</p>;

  const n = cols.length;
  const bloques = cols[n - 1].s + 1;
  const bloqueGap = bloques === n ? m.celdaGap : m.bloqueGap; // una columna por bloque: sin separación extra
  const celdaW = (m.ancho - (bloques - 1) * bloqueGap - (n - bloques) * m.celdaGap) / n;
  const xDe = (i) => i * celdaW + (i - cols[i].s) * m.celdaGap + cols[i].s * bloqueGap;
  const xBloque = (s) => xDe(cols.findIndex((c) => c.s === s));
  const anchoBloque = (s) => { const cs = cols.filter((c) => c.s === s).length; return cs * celdaW + (cs - 1) * m.celdaGap; };

  const nFilas = conDatos.length;
  // En una sola etapa el promedio de cada pregunta ya va arriba: sin fila de promedios abajo.
  const pieAlto = etapa ? 0 : m.pieAlto;
  const fijo = m.cabeceraAlto + pieAlto + (nFilas - 1) * m.filaGap;
  const filaH = m.alto ? Math.min(m.filaMax, (m.alto - fijo) / nFilas) : m.filaAlto;
  const yFin = m.cabeceraAlto + nFilas * filaH + (nFilas - 1) * m.filaGap;
  const yPie = yFin + pieAlto * 0.25;
  const altoTotal = yFin + pieAlto;

  // La etapa más baja de la sala (solo cuando se ven varias etapas).
  const sala = diagnostico(conDatos);
  const fuga = !etapa && sala.fuga ? ETAPAS_DATA.findIndex((e) => e.id === sala.fuga.id) : -1;

  // Cabecera: en una etapa, cada pregunta y su promedio; si no, cada etapa y su puntaje.
  const cabeceras = etapa
    ? cols.map((c, i) => ({ x: xDe(i) + celdaW / 2, arriba: `Pregunta ${c.q + 1}`, abajo: promedio(conDatos.map(c.valor).filter((v) => v != null)), resaltar: false }))
    : ETAPAS_DATA.map((e, s) => ({
      x: xBloque(s) + anchoBloque(s) / 2,
      // Si el nombre no entra sobre su bloque, solo la primera palabra ("Retención temprana" → "Retención").
      arriba: !m.cabeceraDoble ? String(e.num) : e.name.length * m.letra * 0.56 > anchoBloque(s) ? e.name.split(" ")[0] : e.name,
      abajo: sala.etapas[s].puntaje, resaltar: s === fuga,
    }));

  return (
    <svg viewBox={`0 0 ${m.ancho} ${altoTotal}`} width="100%" role="img" style={{ display: "block", fontFamily: "inherit" }}
      aria-label={`${titulo}: ${nFilas} participantes${fuga >= 0 ? `. La etapa más baja es ${sala.fuga.name}` : ""}.`}>
      {cabeceras.map((c, k) => (
        <g key={k}>
          <text x={c.x} y={m.cabeceraAlto * (m.cabeceraDoble ? 0.36 : 0.62)} textAnchor="middle" fontSize={m.letra} fill={esc.texto} opacity={c.resaltar ? 1 : 0.75} fontWeight={c.resaltar ? 700 : 500}>{c.arriba}</text>
          {m.cabeceraDoble && c.abajo != null && (
            <text x={c.x} y={m.cabeceraAlto * 0.8} textAnchor="middle" fontSize={m.letra * 1.25} fontWeight="700" fill={esc.texto}>{fmt1(c.abajo)}</text>
          )}
        </g>
      ))}

      {conDatos.map((f, r) => {
        const fy = m.cabeceraAlto + r * (filaH + m.filaGap);
        return cols.map((c, i) => {
          const v = c.valor(f);
          return v == null
            ? <rect key={`${f.n}-${i}`} x={xDe(i) + 0.5} y={fy + 0.5} width={Math.max(celdaW - 1, 0.5)} height={Math.max(filaH - 1, 0.5)} fill={esc.vacio} stroke={esc.bordeVacio} strokeWidth="1" />
            : <rect key={`${f.n}-${i}`} x={xDe(i)} y={fy} width={celdaW} height={filaH} fill={colorDe(v, tema)} />;
        });
      })}

      {/* Pie: promedio de la sala en cada columna */}
      {pieAlto > 0 && cols.map((c, i) => {
        const v = promedio(conDatos.map(c.valor).filter((x) => x != null));
        const h = m.pieAlto * 0.62;
        return v == null ? null : (
          <g key={`pie-${i}`}>
            <rect x={xDe(i)} y={yPie} width={celdaW} height={h} rx={Math.min(4, h / 4)} fill={colorDe(v, tema)} />
            {celdaW >= m.letra * 2.1 && (
              <text x={xDe(i) + celdaW / 2} y={yPie + h * 0.68} textAnchor="middle" fontSize={m.letra * 0.8} fontWeight="700" fill={esc.textoCelda(v)}>{fmt1(v)}</text>
            )}
          </g>
        );
      })}

      {/* La etapa donde la sala pierde más aspirantes, recuadrada de arriba abajo, sin salirse del SVG */}
      {fuga >= 0 && (() => {
        const borde = (m.marco || 2) / 2;
        const x1 = Math.max(borde, xBloque(fuga) - bloqueGap * 0.35);
        const x2 = Math.min(m.ancho - borde, xBloque(fuga) + anchoBloque(fuga) + bloqueGap * 0.35);
        return <rect x={x1} y={borde} width={x2 - x1} height={altoTotal - 2 * borde} fill="none" stroke={esc.marco} strokeWidth={m.marco || 2} rx="6" />;
      })()}
    </svg>
  );
}

// Referencias del color, para poner al lado del mapa.
export function Leyenda({ tema = "oscuro", letra = 16, gap = 18, fuga = true }) {
  const esc = ESCALAS[tema];
  const items = [["A", 1], ["B", 2], ["C", 4], ["D", 5]];
  const caja = { display: "inline-block", width: letra * 1.4, height: letra * 0.9, borderRadius: 3, verticalAlign: "middle", marginRight: 8 };
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: `6px ${gap}px`, fontSize: letra, color: esc.suave, alignItems: "center" }}>
      {items.map(([l, v]) => <span key={l}><i style={{ ...caja, background: colorDe(v, tema) }} />{l} · {v}</span>)}
      <span><i style={{ ...caja, background: esc.vacio, border: `1px solid ${esc.bordeVacio}` }} />Sin respuesta</span>
      {fuga && <span><i style={{ ...caja, background: "none", border: `2px solid ${esc.marco}` }} />Etapa más baja de la sala</span>}
    </div>
  );
}
