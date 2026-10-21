// Cliente de la API del taller: las funciones taller_* de supabase/migrations/003_taller.sql,
// llamadas directo a Supabase (o a la base local con `npm run taller:local`). El informe por email
// es la única excepción: pasa por el servidor (/api/taller/informe) porque arma el PDF y envía el mail.
const BASE = (import.meta.env.VITE_TALLER_API_URL || import.meta.env.VITE_SUPABASE_URL || "").replace(/\/$/, "");
const KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || "local";

export class ErrorTaller extends Error {
  constructor(codigo, status) {
    super(codigo);
    this.codigo = codigo;
    this.status = status;
  }
}

// Con wifi de hotel un pedido puede quedar colgado: se corta a los `espera` ms y cuenta como sin conexión.
async function pedir(url, { headers = {}, body, espera = 8000 } = {}) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), espera);
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...headers },
      body: JSON.stringify(body),
      signal: ctrl.signal,
    });
    const data = await res.json().catch(() => null);
    if (!res.ok) throw new ErrorTaller(data?.message || data?.error || `http_${res.status}`, res.status);
    return data;
  } catch (err) {
    if (err instanceof ErrorTaller) throw err;
    throw new ErrorTaller("sin_conexion", 0);
  } finally {
    clearTimeout(t);
  }
}

export const rpc = (fn, args = {}, opciones = {}) =>
  pedir(`${BASE}/rest/v1/rpc/${fn}`, { ...opciones, headers: { apikey: KEY, Authorization: `Bearer ${KEY}` }, body: args });

// Errores que vale la pena reintentar solos (red o servidor), a diferencia de los de datos.
export const esTransitorio = (err) => err?.codigo === "sin_conexion" || err?.status >= 500;

const MENSAJES = {
  sin_conexion: "No hay conexión. Se reintenta solo.",
  sesion_no_encontrada: "No hay ninguna sesión con ese código.",
  clave_incorrecta: "La clave no es correcta.",
  clave_corta: "La clave tiene que tener al menos 6 caracteres.",
  codigo_en_uso: "Ese código ya está en uso. Pruebe con otro o déjelo vacío.",
  codigo_invalido: "El código lleva de 4 a 8 letras o números, sin espacios.",
  nombre_invalido: "Falta el nombre del evento.",
  demasiadas_sesiones: "Se crearon muchas sesiones en la última hora. Espere unos minutos.",
  datos_invalidos: "Faltan datos o no son válidos.",
  sesion_llena: "La sesión ya tiene el máximo de participantes.",
  etapa_cerrada: "La etapa ya se cerró.",
  etapa_invalida: "Esa etapa no existe.",
  no_es_prueba: "Solo se puede simular en una sesión de prueba.",
  email_invalido: "Revise el email: no parece válido.",
  todavia_no: "El informe se puede pedir cuando termina el taller.",
  no_registrado: "No encontramos sus respuestas en esta sesión.",
  demasiados_envios: "Ya se pidió el informe varias veces. Revise su correo (y la carpeta de spam).",
  envio_fallido: "No se pudo enviar el correo. Intente de nuevo en un momento.",
};
export const mensaje = (err) => MENSAJES[err?.codigo] || "Algo falló. Intente de nuevo.";

// ── Teléfonos
export const estado = (codigo, participante = null) => rpc("taller_estado", { p_codigo: codigo, p_participante: participante });
export const responder = (codigo, participante, respuestas) =>
  rpc("taller_responder", { p_codigo: codigo, p_participante: participante, p_respuestas: respuestas });
export const resultados = (codigo) => rpc("taller_resultados", { p_codigo: codigo });
export const pedirInforme = (codigo, participante, email) =>
  pedir("/api/taller/informe", { body: { codigo, participante, email }, espera: 45000 });

// ── Expositores
export const crearSesion = ({ nombre, clave, codigo, demo }) =>
  rpc("taller_crear", { p_nombre: nombre, p_clave: clave, p_codigo: codigo || null, p_demo: demo });
export const panel = (codigo, clave, version = null) => rpc("taller_panel", { p_codigo: codigo, p_clave: clave, p_version: version });
export const control = (codigo, clave, accion, etapa = null, vista = null) =>
  rpc("taller_control", { p_codigo: codigo, p_clave: clave, p_accion: accion, p_etapa: etapa, p_vista: vista });
export const vista = (codigo, clave, valor) => rpc("taller_vista", { p_codigo: codigo, p_clave: clave, p_vista: valor });
export const elegir = (codigo, clave, etapa, claves) => rpc("taller_elegir", { p_codigo: codigo, p_clave: clave, p_etapa: etapa, p_claves: claves });
export const exportar = (codigo, clave) => rpc("taller_exportar", { p_codigo: codigo, p_clave: clave });
// Hasta 15 asistentes ficticios en total, de a 3 por llamada.
export const simular = (codigo, clave, cantidad = 3, total = 15) =>
  rpc("taller_simular", { p_codigo: codigo, p_clave: clave, p_cantidad: cantidad, p_total: total });
