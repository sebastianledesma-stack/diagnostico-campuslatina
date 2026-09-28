import { useEffect, useMemo, useState, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { NAVY, NAVY_DK, EMERALD, SLATE, CREAM, WHITE } from "../theme.js";
import { ETAPAS_DATA } from "../data/etapas.js";
import { getNivel, fmt1 } from "../lib/scoring.js";
import { supabase, authRedirectError, isRecoveryLink } from "../lib/supabase.js";

const NIVELES = ["Inicial", "En desarrollo", "Consolidado", "Avanzado"];
const PAGE_SIZE = 25;
const MUTED = "#6A7090";
const LINE = "#E8E6DF";

const mono = (size = 9, color = SLATE) => ({ fontFamily: "'Space Mono',monospace", fontSize: size, letterSpacing: ".12em", textTransform: "uppercase", color });
const input = { padding: "10px 12px", border: "1.5px solid #D4D2CC", borderRadius: 8, fontSize: 14, fontFamily: "'DM Sans',sans-serif", color: NAVY, background: WHITE, outline: "none", minHeight: 44, width: "100%" };
const btn = (primary) => ({ minHeight: 44, padding: "0 18px", borderRadius: 8, border: primary ? "none" : `1px solid ${LINE}`, background: primary ? NAVY : WHITE, color: primary ? WHITE : NAVY, fontSize: 14, fontWeight: 600, fontFamily: "'DM Sans',sans-serif", cursor: "pointer", whiteSpace: "nowrap" });
const fmtFecha = (iso) => new Date(iso).toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit", year: "numeric" });
const fmtFechaHora = (iso) => new Date(iso).toLocaleString("es-AR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });

// ── AUTH ─────────────────────────────────────────────────
function useSession() {
  const [session, setSession] = useState(undefined);
  useEffect(() => {
    if (!supabase) { setSession(null); return; }
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => sub.subscription.unsubscribe();
  }, []);
  return session;
}

function Shell({ children, email, onLogout }) {
  return (
    <div style={{ minHeight: "100vh", background: CREAM, fontFamily: "'DM Sans',sans-serif", color: NAVY }}>
      <div style={{ background: NAVY_DK, padding: "14px 20px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        <div>
          <span style={mono(9, EMERALD)}>CampusLatina · Panel</span>
          <div style={{ fontFamily: "'DM Serif Display',serif", fontSize: 20, color: WHITE }}>Diagnósticos de inscripción</div>
        </div>
        {email && (
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ fontSize: 12, color: "rgba(255,255,255,.55)" }}>{email}</span>
            <button onClick={onLogout} style={{ ...btn(false), background: "transparent", color: WHITE, borderColor: "rgba(255,255,255,.2)", minHeight: 36 }}>Salir</button>
          </div>
        )}
      </div>
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "24px 16px 48px" }}>{children}</div>
    </div>
  );
}

const alerta = { fontSize: 13, color: "#CC3333", background: "#FFF0F0", borderRadius: 8, padding: "10px 12px", margin: "0 0 14px", lineHeight: 1.5 };
const ok = { fontSize: 14, color: "#3A4070", background: "rgba(0,200,150,.08)", borderRadius: 8, padding: "10px 12px", margin: "0 0 14px", lineHeight: 1.6 };
const label = { ...mono(10, NAVY), fontWeight: 700, display: "block", marginBottom: 6 };

function Card({ titulo, children }) {
  return (
    <div style={{ maxWidth: 420, margin: "40px auto", background: WHITE, border: `1px solid ${LINE}`, borderRadius: 14, padding: "28px 24px" }}>
      <span style={mono(9, EMERALD)}>Acceso restringido</span>
      <div style={{ fontFamily: "'DM Serif Display',serif", fontSize: 24, margin: "6px 0 16px" }}>{titulo}</div>
      {children}
    </div>
  );
}

function traducirError(error) {
  if (error.status === 429 || /security purposes|rate limit/i.test(error.message)) return "Hiciste varios pedidos seguidos. Esperá un minuto y volvé a intentar.";
  if (/invalid login credentials/i.test(error.message)) return "Email o contraseña incorrectos.";
  if (/email not confirmed/i.test(error.message)) return "Tu usuario todavía no está confirmado en Supabase.";
  if (/should be different/i.test(error.message)) return "La contraseña nueva tiene que ser distinta de la anterior.";
  if (/at least|weak|short/i.test(error.message)) return "La contraseña es muy corta o débil. Usá al menos 8 caracteres.";
  return error.message;
}

function Login() {
  const [modo, setModo] = useState("clave"); // clave | recuperar
  const [email, setEmail] = useState("");
  const [clave, setClave] = useState("");
  const [estado, setEstado] = useState("idle"); // idle | enviando | enviado | error
  const [msg, setMsg] = useState("");

  const ingresar = async (e) => {
    e.preventDefault();
    setEstado("enviando");
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim().toLowerCase(), password: clave });
    if (error) { setEstado("error"); setMsg(traducirError(error)); return; }
    // onAuthStateChange lleva al panel
  };

  const recuperar = async (e) => {
    e.preventDefault();
    setEstado("enviando");
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), { redirectTo: `${window.location.origin}/admin` });
    if (error) { setEstado("error"); setMsg(traducirError(error)); return; }
    setEstado("enviado");
  };

  const cambiarModo = (m) => { setModo(m); setEstado("idle"); setMsg(""); setClave(""); };
  const campoEmail = (
    <>
      <label htmlFor="admin-email" style={label}>Email</label>
      <input id="admin-email" type="email" autoComplete="username" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="vos@campuslatina.com" style={{ ...input, background: CREAM }} />
    </>
  );
  const linkBtn = { background: "none", border: "none", padding: 0, color: NAVY, textDecoration: "underline", cursor: "pointer", fontSize: 13, fontFamily: "'DM Sans',sans-serif", marginTop: 14 };

  if (modo === "recuperar") {
    return (
      <Card titulo="Crear o recuperar contraseña">
        {estado === "enviado" ? (
          <p style={ok}>Si <strong>{email}</strong> tiene acceso, te llegó un mail con un link para elegir tu contraseña. Usá el último mail que recibas.</p>
        ) : (
          <form onSubmit={recuperar}>
            <p style={{ fontSize: 14, color: MUTED, lineHeight: 1.6, marginTop: 0 }}>Te mandamos un link por mail para que elijas una contraseña nueva.</p>
            {campoEmail}
            {estado === "error" && <p role="alert" style={{ ...alerta, margin: "10px 0 0" }}>{msg}</p>}
            <button type="submit" disabled={estado === "enviando"} style={{ ...btn(true), width: "100%", marginTop: 16, opacity: estado === "enviando" ? 0.6 : 1 }}>
              {estado === "enviando" ? "Enviando…" : "Enviarme el link →"}
            </button>
          </form>
        )}
        <button type="button" onClick={() => cambiarModo("clave")} style={linkBtn}>← Volver a ingresar</button>
      </Card>
    );
  }

  return (
    <Card titulo="Ingresar al panel">
      {authRedirectError && (
        <p role="alert" style={alerta}>
          {authRedirectError.code === "otp_expired"
            ? "Ese link ya se usó o venció. Pedí uno nuevo y abrí el último mail que te llegue."
            : `No pudimos iniciar sesión: ${authRedirectError.message || authRedirectError.code}`}
        </p>
      )}
      <form onSubmit={ingresar}>
        {campoEmail}
        <label htmlFor="admin-clave" style={{ ...label, marginTop: 14 }}>Contraseña</label>
        <input id="admin-clave" type="password" autoComplete="current-password" required value={clave} onChange={(e) => setClave(e.target.value)} style={{ ...input, background: CREAM }} />
        {estado === "error" && <p role="alert" style={{ ...alerta, margin: "10px 0 0" }}>{msg}</p>}
        <button type="submit" disabled={estado === "enviando"} style={{ ...btn(true), width: "100%", marginTop: 16, opacity: estado === "enviando" ? 0.6 : 1 }}>
          {estado === "enviando" ? "Ingresando…" : "Ingresar →"}
        </button>
      </form>
      <button type="button" onClick={() => cambiarModo("recuperar")} style={linkBtn}>¿Primera vez u olvidaste tu contraseña?</button>
    </Card>
  );
}

// Se muestra al entrar desde el link de "crear/recuperar contraseña".
function NuevaClave({ email, onListo }) {
  const [clave, setClave] = useState("");
  const [repetir, setRepetir] = useState("");
  const [estado, setEstado] = useState("idle");
  const [msg, setMsg] = useState("");

  const guardar = async (e) => {
    e.preventDefault();
    if (clave.length < 8) { setEstado("error"); setMsg("Usá al menos 8 caracteres."); return; }
    if (clave !== repetir) { setEstado("error"); setMsg("Las contraseñas no coinciden."); return; }
    setEstado("enviando");
    const { error } = await supabase.auth.updateUser({ password: clave });
    if (error) { setEstado("error"); setMsg(traducirError(error)); return; }
    onListo();
  };

  return (
    <Card titulo="Elegí tu contraseña">
      <form onSubmit={guardar}>
        <p style={{ fontSize: 14, color: MUTED, lineHeight: 1.6, marginTop: 0 }}>Para <strong>{email}</strong>. Mínimo 8 caracteres.</p>
        <input type="email" autoComplete="username" value={email} readOnly hidden />
        <label htmlFor="nueva-clave" style={label}>Contraseña nueva</label>
        <input id="nueva-clave" type="password" autoComplete="new-password" required value={clave} onChange={(e) => setClave(e.target.value)} style={{ ...input, background: CREAM }} />
        <label htmlFor="repetir-clave" style={{ ...label, marginTop: 14 }}>Repetila</label>
        <input id="repetir-clave" type="password" autoComplete="new-password" required value={repetir} onChange={(e) => setRepetir(e.target.value)} style={{ ...input, background: CREAM }} />
        {estado === "error" && <p role="alert" style={{ ...alerta, margin: "10px 0 0" }}>{msg}</p>}
        <button type="submit" disabled={estado === "enviando"} style={{ ...btn(true), width: "100%", marginTop: 16, opacity: estado === "enviando" ? 0.6 : 1 }}>
          {estado === "enviando" ? "Guardando…" : "Guardar y entrar →"}
        </button>
      </form>
    </Card>
  );
}

// ── MÉTRICAS ─────────────────────────────────────────────
function Metricas({ rows }) {
  const m = useMemo(() => {
    const total = rows.length;
    const hace30 = Date.now() - 30 * 864e5;
    const ultimoMes = rows.filter((r) => new Date(r.created_at).getTime() >= hace30).length;
    const promedio = total ? rows.reduce((a, r) => a + Number(r.score_global), 0) / total : 0;
    const porNivel = NIVELES.map((n) => ({ n, c: rows.filter((r) => r.nivel === n).length }));
    const paises = Object.entries(rows.reduce((a, r) => ((a[r.pais] = (a[r.pais] || 0) + 1), a), {})).sort((a, b) => b[1] - a[1]).slice(0, 5);
    const etapas = ETAPAS_DATA.map((e) => ({ ...e, avg: total ? rows.reduce((a, r) => a + Number(r.scores?.[e.id] || 0), 0) / total : 0 })).sort((a, b) => a.avg - b.avg);
    return { total, ultimoMes, promedio, porNivel, paises, critica: total ? etapas[0] : null };
  }, [rows]);

  const card = { background: WHITE, border: `1px solid ${LINE}`, borderRadius: 12, padding: "14px 16px" };
  const big = { fontFamily: "'DM Serif Display',serif", fontSize: 30, lineHeight: 1.1, marginTop: 4 };
  const maxNivel = Math.max(1, ...m.porNivel.map((x) => x.c));
  const maxPais = Math.max(1, ...m.paises.map((x) => x[1]));

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: 12, marginBottom: 20 }}>
      <div style={card}>
        <span style={mono(8)}>Total diagnósticos</span>
        <div style={big}>{m.total}</div>
        <div style={{ fontSize: 12, color: MUTED }}>{m.ultimoMes} en los últimos 30 días</div>
      </div>
      <div style={card}>
        <span style={mono(8)}>Promedio global</span>
        <div style={{ ...big, color: m.total ? getNivel(m.promedio).color : NAVY }}>{m.total ? fmt1(m.promedio) : "—"}</div>
        <div style={{ fontSize: 12, color: MUTED }}>{m.total ? getNivel(m.promedio).label : "Sin datos"}</div>
      </div>
      <div style={card}>
        <span style={mono(8)}>Etapa más crítica</span>
        <div style={{ ...big, fontSize: 22 }}>{m.critica ? `${m.critica.emoji} ${m.critica.name}` : "—"}</div>
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
  const headers = ["id", "fecha", "universidad", "pais", "nombre", "cargo", "email", "whatsapp", "score_global", "nivel",
    ...ETAPAS_DATA.map((e) => `score_${e.id}`), "mail_enviado", "notif_enviada", ...preguntas];
  const cell = (v) => {
    const s = v == null ? "" : String(v);
    return /[";\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const lines = rows.map((r) => [
    r.id, fmtFechaHora(r.created_at), r.universidad, r.pais, r.nombre, r.cargo, r.email, r.whatsapp,
    fmt1(r.score_global), r.nivel,
    ...ETAPAS_DATA.map((e) => fmt1(r.scores?.[e.id] || 0)),
    r.mail_enviado ? "sí" : "no", r.notif_enviada ? "sí" : "no",
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
function Detalle({ d, onClose }) {
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const nivel = getNivel(Number(d.score_global));
  const waNum = String(d.whatsapp || "").replace(/\D/g, "");
  const nombre = String(d.nombre || "").split(/\s+/)[0];
  const waMsg = `¡Hola, ${nombre}! Soy de CampusLatina. Vi que completó el diagnóstico del proceso de inscripción de ${d.universidad} (puntaje ${fmt1(d.score_global)} de 5). ¿Le parece si conversamos sobre los resultados?`;

  return (
    <div role="dialog" aria-modal="true" aria-label={`Diagnóstico de ${d.universidad}`} onClick={onClose}
      style={{ position: "fixed", inset: 0, background: "rgba(14,18,64,.55)", zIndex: 200, display: "flex", justifyContent: "flex-end" }}>
      <div onClick={(e) => e.stopPropagation()} style={{ width: "100%", maxWidth: 640, height: "100%", overflowY: "auto", background: CREAM }}>
        <div style={{ background: NAVY_DK, padding: "20px", position: "sticky", top: 0, zIndex: 1 }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
            <div>
              <span style={mono(8)}>{fmtFechaHora(d.created_at)}</span>
              <div style={{ fontFamily: "'DM Serif Display',serif", fontSize: 22, color: WHITE, lineHeight: 1.2, marginTop: 4 }}>{d.universidad}</div>
              <div style={{ fontSize: 12, color: "rgba(255,255,255,.5)" }}>{d.pais}</div>
            </div>
            <div style={{ textAlign: "right", flexShrink: 0 }}>
              <button onClick={onClose} aria-label="Cerrar" style={{ background: "none", border: "none", color: WHITE, fontSize: 22, cursor: "pointer", minHeight: 44, minWidth: 44 }}>✕</button>
              <div style={{ fontFamily: "'DM Serif Display',serif", fontSize: 36, color: EMERALD, lineHeight: 1 }}>{fmt1(d.score_global)}</div>
              <span style={mono(8, EMERALD)}>{nivel.label}</span>
            </div>
          </div>
        </div>

        <div style={{ padding: 20, display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ background: WHITE, border: `1px solid ${LINE}`, borderRadius: 12, padding: 16 }}>
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
            </div>
            <div style={{ fontSize: 12, color: MUTED, marginTop: 10 }}>
              Informe por mail: {d.mail_enviado ? "✅ enviado" : "⚠️ no enviado"} · Aviso interno: {d.notif_enviada ? "✅" : "⚠️"}
            </div>
          </div>

          <div style={{ background: WHITE, border: `1px solid ${LINE}`, borderRadius: 12, padding: 16 }}>
            <span style={mono(8)}>Puntaje por etapa</span>
            <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 8 }}>
              {ETAPAS_DATA.map((e) => {
                const s = Number(d.scores?.[e.id] || 0);
                const n = getNivel(s);
                return (
                  <div key={e.id}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 3 }}>
                      <span>{e.emoji} {e.name}</span>
                      <span style={mono(9, n.color)}>{fmt1(s)} · {n.label}</span>
                    </div>
                    <div style={{ height: 6, background: LINE, borderRadius: 3 }}><div style={{ height: "100%", width: `${(s / 5) * 100}%`, background: n.color, borderRadius: 3 }} /></div>
                  </div>
                );
              })}
            </div>
          </div>

          <div style={{ background: WHITE, border: `1px solid ${LINE}`, borderRadius: 12, padding: 16 }}>
            <span style={mono(8)}>Respuestas</span>
            {ETAPAS_DATA.map((e) => (
              <div key={e.id} style={{ marginTop: 14 }}>
                <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 6 }}>{e.emoji} {e.num}. {e.name}</div>
                {e.preguntas.map((p, i) => {
                  const letra = d.respuestas?.[`${e.id}_${i}`];
                  const op = p.opciones.find((o) => o.letra === letra);
                  return (
                    <div key={i} style={{ padding: "10px 12px", background: CREAM, borderRadius: 8, marginBottom: 6 }}>
                      <div style={{ fontSize: 12, color: MUTED, lineHeight: 1.5 }}>{p.texto}</div>
                      <div style={{ display: "flex", gap: 8, marginTop: 6, alignItems: "flex-start" }}>
                        <span style={{ flexShrink: 0, width: 22, height: 22, borderRadius: "50%", background: op ? getNivel(op.valor).color : SLATE, color: WHITE, fontFamily: "'Space Mono',monospace", fontSize: 10, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center" }}>{letra || "?"}</span>
                        <span style={{ fontSize: 13, color: NAVY, lineHeight: 1.5 }}>{op ? op.texto : "Sin respuesta"}</span>
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
  { key: "cargo", label: "Cargo" },
  { key: "score_global", label: "Score" },
  { key: "nivel", label: "Nivel" },
  { key: "mail_enviado", label: "Mail" },
];

function comparar(a, b, key) {
  if (key === "score_global") return Number(a[key]) - Number(b[key]);
  if (key === "created_at") return new Date(a[key]) - new Date(b[key]);
  if (key === "nivel") return NIVELES.indexOf(a[key]) - NIVELES.indexOf(b[key]);
  if (key === "mail_enviado") return Number(a[key]) - Number(b[key]);
  return String(a[key] || "").localeCompare(String(b[key] || ""), "es", { sensitivity: "base" });
}

function Panel({ session }) {
  const [rows, setRows] = useState(null);
  const [error, setError] = useState("");
  const [f, setF] = useState({ q: "", pais: "", nivel: "", desde: "", hasta: "" });
  const [sort, setSort] = useState({ key: "created_at", dir: "desc" });
  const [page, setPage] = useState(0);
  const [params, setParams] = useSearchParams();
  const selId = params.get("id");

  const cargar = useCallback(async () => {
    setError("");
    try {
      const res = await fetch("/api/admin-data", { headers: { Authorization: `Bearer ${session.access_token}` } });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || `Error ${res.status}`);
      setRows(data.diagnosticos);
    } catch (err) {
      setError(err.message);
      setRows([]);
    }
  }, [session.access_token]);

  useEffect(() => { cargar(); }, [cargar]);
  useEffect(() => { setPage(0); }, [f, sort]);

  const paises = useMemo(() => [...new Set((rows || []).map((r) => r.pais))].sort((a, b) => a.localeCompare(b, "es")), [rows]);

  const filtrados = useMemo(() => {
    if (!rows) return [];
    const q = f.q.trim().toLowerCase();
    const desde = f.desde ? new Date(`${f.desde}T00:00:00`) : null;
    const hasta = f.hasta ? new Date(`${f.hasta}T23:59:59.999`) : null;
    return rows
      .filter((r) => !q || `${r.universidad} ${r.nombre}`.toLowerCase().includes(q))
      .filter((r) => !f.pais || r.pais === f.pais)
      .filter((r) => !f.nivel || r.nivel === f.nivel)
      .filter((r) => !desde || new Date(r.created_at) >= desde)
      .filter((r) => !hasta || new Date(r.created_at) <= hasta)
      .sort((a, b) => comparar(a, b, sort.key) * (sort.dir === "asc" ? 1 : -1));
  }, [rows, f, sort]);

  const totalPages = Math.max(1, Math.ceil(filtrados.length / PAGE_SIZE));
  const pagina = filtrados.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  const seleccionado = selId && rows ? rows.find((r) => r.id === selId) : null;
  const abrir = (id) => setParams(id ? { id } : {});
  const set = (k) => (e) => setF((p) => ({ ...p, [k]: e.target.value }));
  const hayFiltros = Object.values(f).some(Boolean);

  const toggleSort = (key) => setSort((s) => ({ key, dir: s.key === key && s.dir === "desc" ? "asc" : "desc" }));

  if (rows === null) return <p style={{ color: MUTED }}>Cargando diagnósticos…</p>;

  return (
    <>
      {error && (
        <div role="alert" style={{ background: "#FFF0F0", border: "1px solid #CC333355", borderRadius: 10, padding: "12px 14px", marginBottom: 16, fontSize: 14, color: "#CC3333" }}>
          {error === "Sin acceso al panel" ? "Tu email no tiene acceso al panel. Pedí que lo agreguen a ADMIN_EMAILS." : `No pudimos cargar los diagnósticos: ${error}`}
        </div>
      )}

      <Metricas rows={rows} />

      <div style={{ background: WHITE, border: `1px solid ${LINE}`, borderRadius: 12, padding: 14, marginBottom: 12, display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))", gap: 10, alignItems: "end" }}>
        <label style={{ gridColumn: "span 2" }}>
          <span style={mono(8)}>Buscar universidad o nombre</span>
          <input value={f.q} onChange={set("q")} placeholder="Ej: Córdoba, María…" style={{ ...input, marginTop: 4 }} />
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
          {filtrados.length} de {rows.length} diagnósticos
          {hayFiltros && <button onClick={() => setF({ q: "", pais: "", nivel: "", desde: "", hasta: "" })} style={{ background: "none", border: "none", color: NAVY, textDecoration: "underline", cursor: "pointer", fontSize: 13, marginLeft: 8 }}>Limpiar filtros</button>}
        </span>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={cargar} style={btn(false)}>Actualizar</button>
          <button onClick={() => exportarCSV(filtrados)} disabled={!filtrados.length} style={{ ...btn(true), opacity: filtrados.length ? 1 : 0.5 }}>Exportar CSV</button>
        </div>
      </div>

      <div style={{ background: WHITE, border: `1px solid ${LINE}`, borderRadius: 12, overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13, minWidth: 900 }}>
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
              <tr><td colSpan={COLUMNAS.length + 1} style={{ padding: 28, textAlign: "center", color: MUTED }}>{rows.length ? "Ningún diagnóstico coincide con los filtros." : "Todavía no hay diagnósticos."}</td></tr>
            )}
            {pagina.map((r) => {
              const n = getNivel(Number(r.score_global));
              return (
                <tr key={r.id} onClick={() => abrir(r.id)} style={{ borderBottom: `1px solid #F0EEEA`, cursor: "pointer" }}>
                  <td style={{ padding: "10px 12px", whiteSpace: "nowrap", fontFamily: "'Space Mono',monospace", fontSize: 11 }}>{fmtFecha(r.created_at)}</td>
                  <td style={{ padding: "10px 12px", fontWeight: 600 }}>{r.universidad}</td>
                  <td style={{ padding: "10px 12px" }}>{r.pais}</td>
                  <td style={{ padding: "10px 12px" }}>{r.nombre}</td>
                  <td style={{ padding: "10px 12px", color: MUTED }}>{r.cargo || "—"}</td>
                  <td style={{ padding: "10px 12px", fontFamily: "'DM Serif Display',serif", fontSize: 17, color: n.color }}>{fmt1(r.score_global)}</td>
                  <td style={{ padding: "10px 12px" }}><span style={{ background: n.bg, color: n.color, borderRadius: 6, padding: "3px 8px", fontSize: 11, whiteSpace: "nowrap" }}>{r.nivel}</span></td>
                  <td style={{ padding: "10px 12px" }} title={r.mail_enviado ? "Informe enviado" : "Informe no enviado"}>{r.mail_enviado ? "✅" : "⚠️"}</td>
                  <td style={{ padding: "6px 12px" }}>
                    <button onClick={(e) => { e.stopPropagation(); abrir(r.id); }} style={{ ...btn(false), minHeight: 34, padding: "0 12px", fontSize: 12 }}>Ver</button>
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

      {seleccionado && <Detalle d={seleccionado} onClose={() => abrir(null)} />}
    </>
  );
}

export default function Admin() {
  const session = useSession();
  const [recuperando, setRecuperando] = useState(isRecoveryLink);
  const logout = () => supabase.auth.signOut();

  // Si el evento llega después de montar (no siempre pasa: el cliente puede procesar el link antes).
  useEffect(() => {
    if (!supabase) return;
    const { data: sub } = supabase.auth.onAuthStateChange((ev) => { if (ev === "PASSWORD_RECOVERY") setRecuperando(true); });
    return () => sub.subscription.unsubscribe();
  }, []);

  useEffect(() => { document.title = "Panel · Diagnósticos CampusLatina"; }, []);

  if (!supabase) return <Shell><p>Falta configurar <code>VITE_SUPABASE_URL</code> y <code>VITE_SUPABASE_ANON_KEY</code>.</p></Shell>;
  if (session === undefined) return <Shell><p style={{ color: MUTED }}>Cargando…</p></Shell>;
  if (!session) return <Shell><Login /></Shell>;
  if (recuperando) return <Shell><NuevaClave email={session.user.email} onListo={() => setRecuperando(false)} /></Shell>;
  return <Shell email={session.user.email} onLogout={logout}><Panel session={session} /></Shell>;
}
