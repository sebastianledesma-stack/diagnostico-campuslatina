import { useEffect, useMemo, useState, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { NAVY, NAVY_DK, EMERALD, SLATE, CREAM, WHITE, ORANGE_TXT } from "../theme.js";
import { ETAPAS_DATA } from "../data/etapas.js";
import { getNivel, fmt1 } from "../lib/scoring.js";
import { textoRango, RANGOS_ALUMNOS } from "../data/calificacion.js";
import { baseConsolidado, datosConsolidado, htmlConsolidado, MIN_GRUPO } from "../lib/informeConsolidado.js";

const NIVELES = ["Inicial", "En desarrollo", "Consolidado", "Avanzado"];
const PAGE_SIZE = 25;
const MUTED = "#5E7377";
const LINE = "#D5E3E5";

const mono = (size = 9, color = SLATE) => ({ fontFamily: "'CL Etiquetas',sans-serif", fontSize: size, letterSpacing: ".12em", textTransform: "uppercase", color });
const input = { padding: "10px 12px", border: "1.5px solid #CBDADC", borderRadius:2, fontSize: 14, fontFamily: "'Schibsted Grotesk',sans-serif", color: NAVY, background: WHITE, outline: "none", minHeight: 44, width: "100%" };
const btn = (primary) => ({ minHeight: 44, padding: "0 18px", borderRadius:2, border: primary ? "none" : `1px solid ${LINE}`, background: primary ? NAVY : WHITE, color: primary ? WHITE : NAVY, fontSize: 14, fontWeight: 600, fontFamily: "'Schibsted Grotesk',sans-serif", cursor: "pointer", whiteSpace: "nowrap" });
const fmtFecha = (iso) => new Date(iso).toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit", year: "numeric" });
const enCurso = (r) => r.estado === "en_curso";
// Etapas con sus 4 respuestas (vale también para diagnósticos en curso).
const etapasListas = (r) => ETAPAS_DATA.filter((e) => e.preguntas.every((_, i) => r.respuestas?.[`${e.id}_${i}`])).length;
// Sugerencia (no se marca sola): email de Campus Latina o «test»/«prueba»/«demo» en la universidad o el nombre.
const pareceTest = (r) => /@(campuslatina|campusargentina)\.com$/i.test(r.email || "") || /\b(tests?|pruebas?|demo|testing)\b/i.test(`${r.universidad} ${r.nombre}`);
const fmtFechaHora = (iso) => new Date(iso).toLocaleString("es-AR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });

// ── ACCESO ───────────────────────────────────────────────
// Una clave compartida: /api/admin-login la valida y deja una cookie de sesión (HttpOnly) por 30 días.
function Shell({ children, onLogout }) {
  return (
    <div style={{ minHeight: "100vh", background: CREAM, fontFamily: "'Schibsted Grotesk',sans-serif", color: NAVY }}>
      <div style={{ background: NAVY_DK, padding: "14px 20px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        <div>
          <span style={mono(9, EMERALD)}>Campus Latina · Panel</span>
          <div style={{ fontFamily: "'CL Titulos',serif", fontSize: 20, color: WHITE }}>Diagnósticos de inscripción</div>
        </div>
        {onLogout && <button onClick={onLogout} style={{ ...btn(false), background: "transparent", color: WHITE, borderColor: "rgba(255,255,255,.2)", minHeight: 36 }}>Salir</button>}
      </div>
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "24px 16px 48px" }}>{children}</div>
    </div>
  );
}

const alerta = { fontSize: 13, color: "#CC3333", background: "#FFF0F0", borderRadius:2, padding: "10px 12px", margin: "0 0 14px", lineHeight: 1.5 };
const label = { ...mono(10, NAVY), fontWeight: 700, display: "block", marginBottom: 6 };

function Card({ titulo, children }) {
  return (
    <div style={{ maxWidth: 420, margin: "40px auto", background: WHITE, border: `1px solid ${LINE}`, borderRadius:2, padding: "28px 24px" }}>
      <span style={mono(9, EMERALD)}>Acceso restringido</span>
      <div style={{ fontFamily: "'CL Titulos',serif", fontSize: 24, margin: "6px 0 16px" }}>{titulo}</div>
      {children}
    </div>
  );
}

function Login({ onListo }) {
  const [clave, setClave] = useState("");
  const [estado, setEstado] = useState("idle"); // idle | enviando | error
  const [msg, setMsg] = useState("");

  const ingresar = async (e) => {
    e.preventDefault();
    setEstado("enviando");
    try {
      const res = await fetch("/api/admin-login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ clave }) });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || `Error ${res.status}`);
      onListo();
    } catch (err) {
      setEstado("error");
      setMsg(err.message === "Clave incorrecta" ? "La clave no es correcta." : `No pudimos ingresar: ${err.message}`);
      setClave("");
    }
  };

  return (
    <Card titulo="Ingresar al panel">
      <form onSubmit={ingresar}>
        {/* Usuario fijo y oculto: así el gestor de contraseñas del navegador puede recordar la clave. */}
        <input type="text" name="username" autoComplete="username" value="panel-diagnosticos" readOnly hidden />
        <label htmlFor="admin-clave" style={label}>Clave de acceso</label>
        <input id="admin-clave" type="password" autoComplete="current-password" required autoFocus value={clave} onChange={(e) => setClave(e.target.value)} style={{ ...input, background: CREAM }} />
        {estado === "error" && <p role="alert" style={{ ...alerta, margin: "10px 0 0" }}>{msg}</p>}
        <button type="submit" disabled={estado === "enviando"} style={{ ...btn(true), width: "100%", marginTop: 16, opacity: estado === "enviando" ? 0.6 : 1 }}>
          {estado === "enviando" ? "Ingresando…" : "Ingresar →"}
        </button>
      </form>
    </Card>
  );
}

// ── MÉTRICAS ─────────────────────────────────────────────
function Metricas({ rows: todasLasFilas }) {
  const m = useMemo(() => {
    const hace30 = Date.now() - 30 * 864e5;
    const ultimoMes = todasLasFilas.filter((r) => new Date(r.created_at).getTime() >= hace30).length;
    const enCursoN = todasLasFilas.filter(enCurso).length;
    const targetN = todasLasFilas.filter((r) => r.target).length;
    const todos = todasLasFilas.length;
    const rows = todasLasFilas.filter((r) => !enCurso(r)); // los puntajes salen solo de diagnósticos completos
    const total = rows.length;
    const promedio = total ? rows.reduce((a, r) => a + Number(r.score_global), 0) / total : 0;
    const porNivel = NIVELES.map((n) => ({ n, c: rows.filter((r) => r.nivel === n).length }));
    const paises = Object.entries(rows.reduce((a, r) => ((a[r.pais] = (a[r.pais] || 0) + 1), a), {})).sort((a, b) => b[1] - a[1]).slice(0, 5);
    const etapas = ETAPAS_DATA.map((e) => ({ ...e, avg: total ? rows.reduce((a, r) => a + Number(r.scores?.[e.id] || 0), 0) / total : 0 })).sort((a, b) => a.avg - b.avg);
    return { todos, total, enCursoN, targetN, ultimoMes, promedio, porNivel, paises, critica: total ? etapas[0] : null };
  }, [todasLasFilas]);

  const card = { background: WHITE, border: `1px solid ${LINE}`, borderRadius:2, padding: "14px 16px" };
  const big = { fontFamily: "'CL Titulos',serif", fontSize: 30, lineHeight: 1.1, marginTop: 4 };
  const maxNivel = Math.max(1, ...m.porNivel.map((x) => x.c));
  const maxPais = Math.max(1, ...m.paises.map((x) => x[1]));

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: 12, marginBottom: 20 }}>
      <div style={card}>
        <span style={mono(8)}>Diagnósticos</span>
        <div style={big}>{m.total} <span style={{ fontSize: 16, color: MUTED }}>completos</span></div>
        <div style={{ fontSize: 12, color: MUTED }}>{m.enCursoN} en curso · {m.targetN} target · {m.ultimoMes} iniciados en 30 días</div>
      </div>
      <div style={card}>
        <span style={mono(8)}>Promedio global</span>
        <div style={{ ...big, color: m.total ? getNivel(m.promedio).color : NAVY }}>{m.total ? fmt1(m.promedio) : "—"}</div>
        <div style={{ fontSize: 12, color: MUTED }}>{m.total ? getNivel(m.promedio).label : "Sin datos"}</div>
      </div>
      <div style={card}>
        <span style={mono(8)}>Etapa más crítica</span>
        <div style={{ ...big, fontSize: 22 }}>{m.critica ? `${m.critica.num}. ${m.critica.name}` : "—"}</div>
        <div style={{ fontSize: 12, color: m.critica ? getNivel(m.critica.avg).color : MUTED }}>{m.critica ? `Promedio ${fmt1(m.critica.avg)}/5` : "Sin datos"}</div>
      </div>
      <div style={card}>
        <span style={mono(8)}>Por nivel</span>
        <div style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 5 }}>
          {m.porNivel.map(({ n, c }) => {
            const color = getNivel({ Inicial: 1, "En desarrollo": 2.5, Consolidado: 3.5, Avanzado: 4.5 }[n]).color;
            return (
              <div key={n} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12 }}>
                <span style={{ width: 92, color }}>{n}</span>
                <div style={{ flex: 1, height: 6, background: LINE, borderRadius: 3 }}><div style={{ height: "100%", width: `${(c / maxNivel) * 100}%`, background: color, borderRadius: 3 }} /></div>
                <span style={{ ...mono(9, NAVY), width: 24, textAlign: "right" }}>{c}</span>
              </div>
            );
          })}
        </div>
      </div>
      <div style={card}>
        <span style={mono(8)}>Top 5 países</span>
        <div style={{ marginTop: 8, display: "flex", flexDirection: "column", gap: 5 }}>
          {m.paises.length === 0 && <span style={{ fontSize: 12, color: MUTED }}>Sin datos</span>}
          {m.paises.map(([p, c]) => (
            <div key={p} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12 }}>
              <span style={{ width: 92, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p}</span>
              <div style={{ flex: 1, height: 6, background: LINE, borderRadius: 3 }}><div style={{ height: "100%", width: `${(c / maxPais) * 100}%`, background: EMERALD, borderRadius: 3 }} /></div>
              <span style={{ ...mono(9, NAVY), width: 24, textAlign: "right" }}>{c}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── CSV ──────────────────────────────────────────────────
function exportarCSV(rows) {
  const preguntas = ETAPAS_DATA.flatMap((e) => e.preguntas.map((_, i) => `${e.id}_${i}`));
  const headers = ["id", "fecha", "estado", "etapas_listas", "universidad", "pais", "alumnos_hoy", "alumnos_meta_3a5_anios", "target", "nombre", "cargo", "email", "whatsapp", "colegas", "score_global", "nivel",
    ...ETAPAS_DATA.map((e) => `score_${e.id}`), "mail_enviado", "notif_enviada", "test", ...preguntas];
  const cell = (v) => {
    const s = v == null ? "" : String(v);
    return /[";\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const lines = rows.map((r) => [
    r.id, fmtFechaHora(r.created_at), enCurso(r) ? "en curso" : "completo", etapasListas(r), r.universidad, r.pais,
    textoRango(r.alumnos_actuales), textoRango(r.alumnos_meta), r.target ? "sí" : "no", r.nombre, r.cargo, r.email, r.whatsapp,
    (r.colaboradores || []).map((c) => `${c.nombre} <${c.email}>`).join(", "),
    enCurso(r) ? "" : fmt1(r.score_global), r.nivel || "",
    ...ETAPAS_DATA.map((e) => (enCurso(r) ? "" : fmt1(r.scores?.[e.id] || 0))),
    r.mail_enviado ? "sí" : "no", r.notif_enviada ? "sí" : "no", r.es_test ? "sí" : "no",
    ...preguntas.map((k) => r.respuestas?.[k] || ""),
  ].map(cell).join(";"));
  // BOM + ";" para que Excel en español lo abra con acentos y columnas bien separadas.
  const blob = new Blob(["﻿" + [headers.join(";"), ...lines].join("\r\n")], { type: "text/csv;charset=utf-8" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `diagnosticos-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

// ── DETALLE ──────────────────────────────────────────────
function Detalle({ d, onClose, onTest }) {
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const nivel = getNivel(Number(d.score_global));
  const waNum = String(d.whatsapp || "").replace(/\D/g, "");
  const nombre = String(d.nombre || "").split(/\s+/)[0];
  const waMsg = enCurso(d)
    ? `¡Hola, ${nombre}! Soy de Campus Latina. Vi que empezó el diagnóstico del proceso de inscripción de ${d.universidad}. ¿Lo podemos ayudar a completarlo?`
    : `¡Hola, ${nombre}! Soy de Campus Latina. Vi que completó el diagnóstico del proceso de inscripción de ${d.universidad} (puntaje ${fmt1(d.score_global)} de 5). ¿Le parece si conversamos sobre los resultados?`;

  return (
    <div role="dialog" aria-modal="true" aria-label={`Diagnóstico de ${d.universidad}`} onClick={onClose}
      style={{ position: "fixed", inset: 0, background: "rgba(10,35,41,.55)", zIndex: 200, display: "flex", justifyContent: "flex-end" }}>
      <div onClick={(e) => e.stopPropagation()} style={{ width: "100%", maxWidth: 640, height: "100%", overflowY: "auto", background: CREAM }}>
        <div style={{ background: NAVY_DK, padding: "20px", position: "sticky", top: 0, zIndex: 1 }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
            <div>
              <span style={mono(8)}>{fmtFechaHora(d.created_at)}</span>
              <div style={{ fontFamily: "'CL Titulos',serif", fontSize: 22, color: WHITE, lineHeight: 1.2, marginTop: 4 }}>{d.universidad}</div>
              <div style={{ fontSize: 12, color: "rgba(255,255,255,.5)" }}>{d.pais}</div>
            </div>
            <div style={{ textAlign: "right", flexShrink: 0 }}>
              <button onClick={onClose} aria-label="Cerrar" style={{ background: "none", border: "none", color: WHITE, fontSize: 22, cursor: "pointer", minHeight: 44, minWidth: 44 }}>✕</button>
              {enCurso(d) ? <>
                <div style={{ fontFamily: "'CL Titulos',serif", fontSize: 30, color: WHITE, lineHeight: 1 }}>{etapasListas(d)}/7</div>
                <span style={mono(8, EMERALD)}>En curso</span>
              </> : <>
                <div style={{ fontFamily: "'CL Titulos',serif", fontSize: 36, color: EMERALD, lineHeight: 1 }}>{fmt1(d.score_global)}</div>
                <span style={mono(8, EMERALD)}>{nivel.label}</span>
              </>}
            </div>
          </div>
        </div>

        <div style={{ padding: 20, display: "flex", flexDirection: "column", gap: 14 }}>
          {d.es_test && (
            <div style={{ background: "#FFF3E8", border: "1px solid #F2C9A5", borderRadius:2, padding: "12px 14px", fontSize: 14, lineHeight: 1.5, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
              <span>Marcado como test: no cuenta en las métricas, el CSV ni el informe consolidado.</span>
              <button onClick={() => onTest(d, false)} style={{ ...btn(false), minHeight: 36 }}>Restaurar</button>
            </div>
          )}
          <div style={{ background: WHITE, border: `1px solid ${LINE}`, borderRadius:2, padding: 16 }}>
            <span style={mono(8)}>Directivo</span>
            <div style={{ fontSize: 16, fontWeight: 600, marginTop: 4 }}>{d.nombre}</div>
            {d.cargo && <div style={{ fontSize: 13, color: MUTED }}>{d.cargo}</div>}
            <div style={{ fontSize: 14, marginTop: 8, lineHeight: 1.8 }}>
              📧 <a href={`mailto:${d.email}`} style={{ color: NAVY }}>{d.email}</a><br />
              📱 {d.whatsapp}
            </div>
            <div style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap" }}>
              {waNum && <a href={`https://wa.me/${waNum}?text=${encodeURIComponent(waMsg)}`} target="_blank" rel="noopener noreferrer" style={{ ...btn(true), background: EMERALD, color: NAVY_DK, display: "inline-flex", alignItems: "center", textDecoration: "none" }}>Contactar por WhatsApp →</a>}
              <a href={`mailto:${d.email}?subject=${encodeURIComponent(`Su diagnóstico del proceso de inscripción — ${d.universidad}`)}`} style={{ ...btn(false), display: "inline-flex", alignItems: "center", textDecoration: "none" }}>Escribir mail</a>
              {!d.es_test && <button onClick={() => onTest(d, true)} style={{ ...btn(false), color: MUTED }}>Marcar como test</button>}
            </div>
            <div style={{ fontSize: 12, color: MUTED, marginTop: 10 }}>
              Informe por mail: {d.mail_enviado ? "✅ enviado" : enCurso(d) ? "pendiente (faltan etapas)" : "⚠️ no enviado"} · Aviso interno: {d.notif_enviada ? "✅" : enCurso(d) ? "pendiente" : "⚠️"}
            </div>
          </div>

          <div style={{ background: WHITE, border: `1px solid ${LINE}`, borderRadius:2, padding: 16 }}>
            <span style={mono(8)}>Calificación</span>
            <div style={{ fontSize: 14, marginTop: 8, lineHeight: 1.8 }}>
              🎓 Alumnos hoy: <strong>{textoRango(d.alumnos_actuales)}</strong><br />
              📈 Meta a 3–5 años: <strong>{textoRango(d.alumnos_meta)}</strong><br />
              🎯 {d.target ? <strong>Target: se le ofrece la reunión de 45 min</strong> : d.alumnos_actuales ? "No target: se le ofrece escribir por mail" : "Sin datos (diagnóstico anterior a la calificación)"}
            </div>
            {(d.colaboradores || []).length > 0 && (
              <div style={{ fontSize: 14, marginTop: 10, lineHeight: 1.7 }}>
                <span style={mono(8)}>Colegas invitados</span>
                {d.colaboradores.map((c) => (
                  <div key={c.id}>👥 {c.nombre} · <a href={`mailto:${c.email}`} style={{ color: NAVY }}>{c.email}</a>{c.etapas?.length ? <span style={{ color: MUTED }}> · {c.etapas.map((id) => ETAPAS_DATA.find((e) => e.id === id)?.name).filter(Boolean).join(", ")}</span> : null}</div>
                ))}
              </div>
            )}
          </div>

          <div style={{ background: WHITE, border: `1px solid ${LINE}`, borderRadius:2, padding: 16 }}>
            <span style={mono(8)}>{enCurso(d) ? "Etapas" : "Puntaje por etapa"}</span>
            <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 8 }}>
              {ETAPAS_DATA.map((e) => {
                const s = Number(d.scores?.[e.id] || 0);
                const n = getNivel(s);
                const por = d.etapas_por?.[e.id]?.nombre;
                return (
                  <div key={e.id}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 3 }}>
                      <span>{e.num}. {e.name}{por ? <span style={{ color: MUTED }}> · {por}</span> : null}</span>
                      <span style={mono(9, n.color)}>{enCurso(d) ? (d.respuestas?.[`${e.id}_3`] ? "Respondida" : "Pendiente") : `${fmt1(s)} · ${n.label}`}</span>
                    </div>
                    <div style={{ height: 6, background: LINE, borderRadius: 3 }}><div style={{ height: "100%", width: `${(s / 5) * 100}%`, background: n.color, borderRadius: 3 }} /></div>
                  </div>
                );
              })}
            </div>
          </div>

          <div style={{ background: WHITE, border: `1px solid ${LINE}`, borderRadius:2, padding: 16 }}>
            <span style={mono(8)}>Respuestas</span>
            {ETAPAS_DATA.map((e) => (
              <div key={e.id} style={{ marginTop: 14 }}>
                <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 6 }}>{e.num}. {e.name}</div>
                {e.preguntas.map((p, i) => {
                  const letra = d.respuestas?.[`${e.id}_${i}`];
                  const op = p.opciones.find((o) => o.letra === letra);
                  return (
                    <div key={i} style={{ padding: "10px 12px", background: CREAM, borderRadius:2, marginBottom: 6 }}>
                      <div style={{ fontSize: 12, color: MUTED, lineHeight: 1.5 }}>{p.texto}</div>
                      <div style={{ display: "flex", gap: 8, marginTop: 6, alignItems: "flex-start" }}>
                        <span style={{ flexShrink: 0, width: 22, height: 22, borderRadius: "50%", background: op ? getNivel(op.valor).color : SLATE, color: WHITE, fontFamily: "'CL Etiquetas',sans-serif", fontSize: 10, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center" }}>{letra || "?"}</span>
                        <span style={{ fontSize: 13, color: NAVY, lineHeight: 1.5 }}>{op ? <><strong>{op.etiqueta}</strong> {op.texto}</> : "Sin respuesta"}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── TABLA ────────────────────────────────────────────────
const COLUMNAS = [
  { key: "created_at", label: "Fecha" },
  { key: "universidad", label: "Universidad" },
  { key: "pais", label: "País" },
  { key: "nombre", label: "Nombre" },
  { key: "alumnos_actuales", label: "Tamaño" },
  { key: "score_global", label: "Score" },
  { key: "nivel", label: "Nivel" },
  { key: "mail_enviado", label: "Mail" },
];

function comparar(a, b, key) {
  if (key === "score_global") return (enCurso(a) ? -1 : Number(a[key])) - (enCurso(b) ? -1 : Number(b[key]));
  if (key === "alumnos_actuales") return RANGOS_ALUMNOS.findIndex((x) => x.id === a[key]) - RANGOS_ALUMNOS.findIndex((x) => x.id === b[key]);
  if (key === "created_at") return new Date(a[key]) - new Date(b[key]);
  if (key === "nivel") return NIVELES.indexOf(a[key]) - NIVELES.indexOf(b[key]);
  if (key === "mail_enviado") return Number(a[key]) - Number(b[key]);
  return String(a[key] || "").localeCompare(String(b[key] || ""), "es", { sensitivity: "base" });
}

// ── SOLAPAS ──────────────────────────────────────────────
function Solapas({ vista, ir, cantidades }) {
  const items = [["diagnosticos", "Diagnósticos"], ["informe", "Informe consolidado"], ["tests", "Tests"]];
  return (
    <div role="tablist" aria-label="Secciones del panel" style={{ display: "flex", gap: 4, borderBottom: `1px solid ${LINE}`, marginBottom: 20, overflowX: "auto" }}>
      {items.map(([id, texto]) => {
        const activa = vista === id;
        return (
          <button key={id} role="tab" aria-selected={activa} onClick={() => ir(id)}
            style={{ background: "none", border: "none", borderBottom: `3px solid ${activa ? NAVY : "transparent"}`, marginBottom: -1, padding: "0 14px", minHeight: 48, fontSize: 15, fontWeight: activa ? 700 : 500, color: activa ? NAVY : MUTED, cursor: "pointer", whiteSpace: "nowrap", fontFamily: "'Schibsted Grotesk',sans-serif" }}>
            {texto}{cantidades[id] != null && <span style={{ ...mono(9, activa ? NAVY : MUTED), marginLeft: 8 }}>{cantidades[id]}</span>}
          </button>
        );
      })}
    </div>
  );
}

// Aviso abajo de la pantalla después de marcar o restaurar, con la opción de deshacer.
function Aviso({ aviso, onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, 7000);
    return () => clearTimeout(t);
  }, [aviso, onClose]);
  return (
    <div role="status" style={{ position: "fixed", left: "50%", bottom: 20, transform: "translateX(-50%)", zIndex: 300, width: "calc(100% - 32px)", maxWidth: 560, background: NAVY_DK, color: WHITE, borderRadius: 2, padding: "12px 14px 12px 18px", display: "flex", alignItems: "center", gap: 12, boxShadow: "0 6px 24px rgba(10,35,41,.3)", fontSize: 14, lineHeight: 1.5 }}>
      <span style={{ flex: 1 }}>{aviso.texto}</span>
      <button onClick={() => { aviso.deshacer(); onClose(); }} style={{ ...btn(false), background: "transparent", color: EMERALD, borderColor: "rgba(255,255,255,.25)", minHeight: 36 }}>Deshacer</button>
    </div>
  );
}

// ── INFORME CONSOLIDADO ──────────────────────────────────
function InformeConsolidado({ rows }) {
  const [periodo, setPeriodo] = useState({ desde: "", hasta: "" });
  const [instId, setInstId] = useState("");
  const base = useMemo(() => baseConsolidado(rows, periodo), [rows, periodo]);
  const instituciones = useMemo(() => [...base.filas].sort((a, b) => a.universidad.localeCompare(b.universidad, "es", { sensitivity: "base" })), [base]);
  const institucion = instituciones.find((r) => r.id === instId) || null;
  // Si el período deja afuera a la institución elegida, se vuelve a la versión general.
  useEffect(() => { if (instId && !institucion) setInstId(""); }, [instId, institucion]);
  const datos =useMemo(() => (base.filas.length ? datosConsolidado(base.filas, { institucion }) : null), [base, institucion]);
  const vistaPrevia = useMemo(() => (datos ? htmlConsolidado(datos, { origen: window.location.origin, imprimir: false }) : ""), [datos]);
  const descargar = () => {
    const win = window.open("", "_blank");
    if (win) { win.document.write(htmlConsolidado(datos, { origen: window.location.origin })); win.document.close(); }
  };
  const set = (k) => (e) => setPeriodo((p) => ({ ...p, [k]: e.target.value }));
  const card = { background: WHITE, border: `1px solid ${LINE}`, borderRadius: 2, padding: 16, marginBottom: 12 };
  const n = base.filas.length;

  return (
    <>
      <div style={card}>
        <span style={mono(8)}>Informe regional · sin nombres de instituciones ni de personas</span>
        <div style={{ fontFamily: "'CL Titulos',serif", fontSize: 22, margin: "4px 0 6px" }}>La salud de la inscripción universitaria en Latinoamérica</div>
        <p style={{ fontSize: 14, color: MUTED, lineHeight: 1.6, margin: 0, maxWidth: 780 }}>
          Junta todos los diagnósticos completos en una lectura regional para compartir con todas las universidades, hayan respondido o no.
          La versión personalizada agrega las respuestas de una institución frente a la región, para enviársela a quien participó.
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))", gap: 10, alignItems: "end", marginTop: 14 }}>
          <label>
            <span style={mono(8)}>Desde</span>
            <input type="date" value={periodo.desde} onChange={set("desde")} style={{ ...input, marginTop: 4 }} />
          </label>
          <label>
            <span style={mono(8)}>Hasta</span>
            <input type="date" value={periodo.hasta} onChange={set("hasta")} style={{ ...input, marginTop: 4 }} />
          </label>
          <label style={{ gridColumn: "span 2" }}>
            <span style={mono(8)}>Versión</span>
            <select value={instId} onChange={(e) => setInstId(e.target.value)} style={{ ...input, marginTop: 4 }}>
              <option value="">General, para compartir con todas</option>
              {instituciones.map((r) => <option key={r.id} value={r.id}>Personalizada · {r.universidad} ({r.pais})</option>)}
            </select>
          </label>
          <button onClick={descargar} disabled={!datos} style={{ ...btn(true), opacity: datos ? 1 : 0.5 }}>Descargar PDF</button>
        </div>
      </div>

      <div style={{ ...card, fontSize: 14, lineHeight: 1.6 }}>
        <strong>{n} {n === 1 ? "institución" : "instituciones"}</strong> de {base.paises} {base.paises === 1 ? "país" : "países"} · {base.completos} diagnósticos completos
        <div style={{ color: MUTED, fontSize: 13 }}>
          No entran: {base.repetidos} repetidos (de cada institución se toma el más reciente), {base.enCurso} en curso y {base.tests} marcados como test.
        </div>
        {n > 0 && n < 10 && (
          <p style={{ ...alerta, color: ORANGE_TXT, background: "#FFF3E8", margin: "10px 0 0" }}>
            Con {n} {n === 1 ? "institución" : "instituciones"} el informe es preliminar: conviene tener al menos 10 antes de compartirlo. Las aperturas por país y por tamaño aparecen solo con grupos de {MIN_GRUPO} o más.
          </p>
        )}
        {n > 0 && (
          <details style={{ marginTop: 10 }}>
            <summary style={{ cursor: "pointer", fontSize: 13, color: NAVY }}>Ver qué instituciones entran (solo en el panel: el informe no las nombra)</summary>
            <div style={{ columns: "280px", columnGap: 24, fontSize: 13, marginTop: 8 }}>
              {instituciones.map((r) => (
                <div key={r.id} style={{ breakInside: "avoid", padding: "3px 0" }}>
                  {r.universidad} <span style={{ color: MUTED }}>· {r.pais} · {fmtFecha(r.created_at)} · {fmt1(r.score_global)}</span>
                </div>
              ))}
            </div>
          </details>
        )}
      </div>

      {datos ? (
        // allow-same-origin para que carguen las fuentes de marca; sin allow-scripts, el HTML no ejecuta nada.
        <iframe title="Vista previa del informe consolidado" sandbox="allow-same-origin" srcDoc={vistaPrevia}
          style={{ width: "100%", height: "80vh", border: `1px solid ${LINE}`, display: "block", background: "#C9D6D8" }} />
      ) : (
        <p style={{ color: MUTED }}>Todavía no hay diagnósticos completos en este período.</p>
      )}
    </>
  );
}

// ── PANEL ────────────────────────────────────────────────
const SIN_FILTROS = { q: "", estado: "", pais: "", nivel: "", desde: "", hasta: "" };

function Panel({ onSinSesion }) {
  const [rows, setRows] = useState(null);
  const [error, setError] = useState("");
  const [aviso, setAviso] = useState(null);
  const [f, setF] = useState(SIN_FILTROS);
  const [sort, setSort] = useState({ key: "created_at", dir: "desc" });
  const [page, setPage] = useState(0);
  const [params, setParams] = useSearchParams();
  const selId = params.get("id");
  const vista = ["informe", "tests"].includes(params.get("vista")) ? params.get("vista") : "diagnosticos";

  const cargar = useCallback(async () => {
    setError("");
    try {
      const res = await fetch("/api/admin-data");
      if (res.status === 401) return onSinSesion();
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || `Error ${res.status}`);
      setRows(data.diagnosticos);
    } catch (err) {
      setError(`No pudimos cargar los diagnósticos: ${err.message}`);
      setRows([]);
    }
  }, [onSinSesion]);

  // Se marca en pantalla al instante y se vuelve atrás si el servidor no lo guarda.
  const marcarTest = useCallback(async (r, valor) => {
    setError("");
    setRows((rs) => rs.map((x) => (x.id === r.id ? { ...x, es_test: valor } : x)));
    try {
      const res = await fetch("/api/admin-test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: r.id, es_test: valor }),
      });
      if (res.status === 401) { setRows((rs) => rs.map((x) => (x.id === r.id ? { ...x, es_test: r.es_test } : x))); return onSinSesion(); }
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || `Error ${res.status}`);
      setAviso({
        texto: valor ? `«${r.universidad}» pasó a Tests: ya no cuenta en las métricas, el CSV ni el informe.` : `«${r.universidad}» volvió a Diagnósticos.`,
        deshacer: () => marcarTest({ ...r, es_test: valor }, !valor),
      });
    } catch (err) {
      setRows((rs) => rs.map((x) => (x.id === r.id ? { ...x, es_test: r.es_test } : x)));
      setError(`No pudimos ${valor ? "marcarlo como test" : "quitarle la marca de test"}: ${err.message}`);
    }
  }, [onSinSesion]);
  const cerrarAviso = useCallback(() => setAviso(null), []);

  useEffect(() => { cargar(); }, [cargar]);
  useEffect(() => { setPage(0); }, [f, sort, vista]);

  const reales = useMemo(() => (rows || []).filter((r) => !r.es_test), [rows]);
  const tests = useMemo(() => (rows || []).filter((r) => r.es_test), [rows]);
  const sugeridos = useMemo(() => reales.filter(pareceTest), [reales]);
  const lista = vista === "tests" ? tests : reales;
  const paises = useMemo(() => [...new Set((rows || []).map((r) => r.pais))].sort((a, b) => a.localeCompare(b, "es")), [rows]);

  const filtrados = useMemo(() => {
    const q = f.q.trim().toLowerCase();
    const desde = f.desde ? new Date(`${f.desde}T00:00:00`) : null;
    const hasta = f.hasta ? new Date(`${f.hasta}T23:59:59.999`) : null;
    return lista
      .filter((r) => !q || `${r.universidad} ${r.nombre}`.toLowerCase().includes(q))
      .filter((r) => !f.estado || (f.estado === "target" ? r.target : f.estado === "posible_test" ? pareceTest(r) : f.estado === "en_curso" ? enCurso(r) : !enCurso(r)))
      .filter((r) => !f.pais || r.pais === f.pais)
      .filter((r) => !f.nivel || r.nivel === f.nivel)
      .filter((r) => !desde || new Date(r.created_at) >= desde)
      .filter((r) => !hasta || new Date(r.created_at) <= hasta)
      .sort((a, b) => comparar(a, b, sort.key) * (sort.dir === "asc" ? 1 : -1));
  }, [lista, f, sort]);

  const totalPages = Math.max(1, Math.ceil(filtrados.length / PAGE_SIZE));
  const pagina = filtrados.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  const seleccionado = selId && rows ? rows.find((r) => r.id === selId) : null;
  const ir = (v) => { setF(SIN_FILTROS); setParams(v === "diagnosticos" ? {} : { vista: v }); };
  const abrir = (id) => setParams((p) => {
    const n = new URLSearchParams(p);
    if (id) n.set("id", id); else n.delete("id");
    return n;
  });
  const set = (k) => (e) => setF((p) => ({ ...p, [k]: e.target.value }));
  const hayFiltros = Object.values(f).some(Boolean);

  const toggleSort = (key) => setSort((s) => ({ key, dir: s.key === key && s.dir === "desc" ? "asc" : "desc" }));

  if (rows === null) return <p style={{ color: MUTED }}>Cargando diagnósticos…</p>;

  return (
    <>
      {error && (
        <div role="alert" style={{ background: "#FFF0F0", border: "1px solid #CC333355", borderRadius:2, padding: "12px 14px", marginBottom: 16, fontSize: 14, color: "#CC3333" }}>{error}</div>
      )}

      <Solapas vista={vista} ir={ir} cantidades={{ diagnosticos: reales.length, tests: tests.length }} />

      {vista === "informe" ? <InformeConsolidado rows={rows} /> : <>
      {vista === "diagnosticos" ? <Metricas rows={reales} /> : (
        <p style={{ fontSize: 14, color: MUTED, lineHeight: 1.6, margin: "0 0 16px", maxWidth: 760 }}>
          Los diagnósticos marcados como test no cuentan en las métricas, el CSV ni el informe consolidado. Quedan guardados acá por si hace falta revisarlos o restaurarlos.
        </p>
      )}

      {vista === "diagnosticos" && sugeridos.length > 0 && f.estado !== "posible_test" && (
        <div style={{ background: "#FFF3E8", border: "1px solid #F2C9A5", borderRadius:2, padding: "12px 14px", marginBottom: 12, fontSize: 14, lineHeight: 1.5, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          <span>{sugeridos.length === 1 ? "1 diagnóstico parece" : `${sugeridos.length} diagnósticos parecen`} de prueba (email de Campus Latina o «test» en el nombre). Revisalos y marcalos como test para que no cuenten en el informe.</span>
          <button onClick={() => setF({ ...SIN_FILTROS, estado: "posible_test" })} style={{ ...btn(false), minHeight: 36 }}>Ver cuáles</button>
        </div>
      )}

      <div style={{ background: WHITE, border: `1px solid ${LINE}`, borderRadius:2, padding: 14, marginBottom: 12, display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))", gap: 10, alignItems: "end" }}>
        <label style={{ gridColumn: "span 2" }}>
          <span style={mono(8)}>Buscar universidad o nombre</span>
          <input value={f.q} onChange={set("q")} placeholder="Ej: Córdoba, María…" style={{ ...input, marginTop: 4 }} />
        </label>
        <label>
          <span style={mono(8)}>Estado</span>
          <select value={f.estado} onChange={set("estado")} style={{ ...input, marginTop: 4 }}>
            <option value="">Todos</option>
            <option value="completo">Completos</option>
            <option value="en_curso">En curso</option>
            <option value="target">Solo target</option>
            {vista === "diagnosticos" && <option value="posible_test">Parecen test</option>}
          </select>
        </label>
        <label>
          <span style={mono(8)}>País</span>
          <select value={f.pais} onChange={set("pais")} style={{ ...input, marginTop: 4 }}>
            <option value="">Todos</option>
            {paises.map((p) => <option key={p}>{p}</option>)}
          </select>
        </label>
        <label>
          <span style={mono(8)}>Nivel</span>
          <select value={f.nivel} onChange={set("nivel")} style={{ ...input, marginTop: 4 }}>
            <option value="">Todos</option>
            {NIVELES.map((n) => <option key={n}>{n}</option>)}
          </select>
        </label>
        <label>
          <span style={mono(8)}>Desde</span>
          <input type="date" value={f.desde} onChange={set("desde")} style={{ ...input, marginTop: 4 }} />
        </label>
        <label>
          <span style={mono(8)}>Hasta</span>
          <input type="date" value={f.hasta} onChange={set("hasta")} style={{ ...input, marginTop: 4 }} />
        </label>
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, marginBottom: 10, flexWrap: "wrap" }}>
        <span style={{ fontSize: 13, color: MUTED }}>
          {filtrados.length} de {lista.length} {vista === "tests" ? "tests" : "diagnósticos"}
          {hayFiltros && <button onClick={() => setF(SIN_FILTROS)} style={{ background: "none", border: "none", color: NAVY, textDecoration: "underline", cursor: "pointer", fontSize: 13, marginLeft: 8 }}>Limpiar filtros</button>}
        </span>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={cargar} style={btn(false)}>Actualizar</button>
          <button onClick={() => exportarCSV(filtrados)} disabled={!filtrados.length} style={{ ...btn(true), opacity: filtrados.length ? 1 : 0.5 }}>Exportar CSV</button>
        </div>
      </div>

      <div style={{ background: WHITE, border: `1px solid ${LINE}`, borderRadius:2, overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, minWidth: 980 }}>
          <thead>
            <tr style={{ background: NAVY }}>
              {COLUMNAS.map((c) => (
                <th key={c.key} scope="col" aria-sort={sort.key === c.key ? (sort.dir === "asc" ? "ascending" : "descending") : "none"} style={{ padding: 0, textAlign: "left" }}>
                  <button onClick={() => toggleSort(c.key)} style={{ ...mono(9, WHITE), background: "none", border: "none", cursor: "pointer", padding: "12px 12px", width: "100%", textAlign: "left", whiteSpace: "nowrap" }}>
                    {c.label} {sort.key === c.key ? (sort.dir === "asc" ? "▲" : "▼") : ""}
                  </button>
                </th>
              ))}
              <th scope="col" style={{ ...mono(9, WHITE), padding: "12px", textAlign: "left" }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {pagina.length === 0 && (
              <tr><td colSpan={COLUMNAS.length + 1} style={{ padding: 28, textAlign: "center", color: MUTED }}>
                {lista.length ? "Ningún diagnóstico coincide con los filtros." : vista === "tests" ? "Todavía no hay diagnósticos marcados como test." : "Todavía no hay diagnósticos."}
              </td></tr>
            )}
            {pagina.map((r) => {
              const n = getNivel(Number(r.score_global));
              return (
                <tr key={r.id} onClick={() => abrir(r.id)} style={{ borderBottom: `1px solid #F0F5F6`, cursor: "pointer" }}>
                  <td style={{ padding: "10px 12px", whiteSpace: "nowrap", fontFamily: "'CL Etiquetas',sans-serif", fontSize: 11 }}>{fmtFecha(r.created_at)}</td>
                  <td style={{ padding: "10px 12px", fontWeight: 600 }}>
                    {r.universidad}
                    {!r.es_test && pareceTest(r) && <span title="Email de Campus Latina o «test» en el nombre" style={{ marginLeft: 8, background: "#FFF3E8", color: ORANGE_TXT, borderRadius: 2, padding: "2px 6px", fontSize: 11, fontWeight: 500, whiteSpace: "nowrap" }}>¿Test?</span>}
                  </td>
                  <td style={{ padding: "10px 12px" }}>{r.pais}</td>
                  <td style={{ padding: "10px 12px" }}>{r.nombre}</td>
                  <td style={{ padding: "10px 12px", whiteSpace: "nowrap" }}>{r.target ? "🎯 " : ""}{r.alumnos_actuales ? textoRango(r.alumnos_actuales) : "—"}</td>
                  {enCurso(r) ? <>
                    <td style={{ padding: "10px 12px", fontFamily: "'CL Etiquetas',sans-serif", fontSize: 12, color: MUTED }}>{etapasListas(r)}/7</td>
                    <td style={{ padding: "10px 12px" }}><span style={{ background: "#EEF4F5", color: NAVY, borderRadius:2, padding: "3px 8px", fontSize: 11, whiteSpace: "nowrap" }}>En curso</span></td>
                  </> : <>
                    <td style={{ padding: "10px 12px", fontFamily: "'CL Titulos',serif", fontSize: 17, color: n.color }}>{fmt1(r.score_global)}</td>
                    <td style={{ padding: "10px 12px" }}><span style={{ background: n.bg, color: n.color, borderRadius:2, padding: "3px 8px", fontSize: 11, whiteSpace: "nowrap" }}>{r.nivel}</span></td>
                  </>}
                  <td style={{ padding: "10px 12px" }} title={r.mail_enviado ? "Informe enviado" : enCurso(r) ? "Faltan etapas" : "Informe no enviado"}>{r.mail_enviado ? "✅" : enCurso(r) ? "…" : "⚠️"}</td>
                  <td style={{ padding: "6px 12px", whiteSpace: "nowrap" }}>
                    <button onClick={(e) => { e.stopPropagation(); abrir(r.id); }} style={{ ...btn(false), minHeight: 34, padding: "0 12px", fontSize: 12 }}>Ver</button>
                    <button onClick={(e) => { e.stopPropagation(); marcarTest(r, !r.es_test); }}
                      aria-label={`${r.es_test ? "Restaurar" : "Es test"}: ${r.universidad}`}
                      title={r.es_test ? "Volver a contarlo en las métricas y el informe" : "Que no cuente en las métricas, el CSV ni el informe"}
                      style={{ ...btn(false), minHeight: 34, padding: "0 12px", fontSize: 12, marginLeft: 6, color: MUTED }}>{r.es_test ? "Restaurar" : "Es test"}</button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 12, marginTop: 14 }}>
          <button onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={page === 0} style={{ ...btn(false), opacity: page === 0 ? 0.4 : 1 }}>← Anterior</button>
          <span style={mono(9, NAVY)}>{page + 1} / {totalPages}</span>
          <button onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1} style={{ ...btn(false), opacity: page >= totalPages - 1 ? 0.4 : 1 }}>Siguiente →</button>
        </div>
      )}
      </>}

      {seleccionado && <Detalle d={seleccionado} onClose={() => abrir(null)} onTest={marcarTest} />}
      {aviso && <Aviso aviso={aviso} onClose={cerrarAviso} />}
    </>
  );
}

export default function Admin() {
  // El panel prueba la sesión al cargar los datos: sin cookie válida, /api/admin-data responde 401 y se pide la clave.
  const [acceso, setAcceso] = useState("panel"); // panel | clave
  const pedirClave = useCallback(() => setAcceso("clave"), []);
  const salir = async () => {
    await fetch("/api/admin-logout", { method: "POST" }).catch(() => {});
    setAcceso("clave");
  };

  useEffect(() => { document.title = "Panel · Diagnósticos Campus Latina"; }, []);

  if (acceso === "clave") return <Shell><Login onListo={() => setAcceso("panel")} /></Shell>;
  return <Shell onLogout={salir}><Panel onSinSesion={pedirClave} /></Shell>;
}
