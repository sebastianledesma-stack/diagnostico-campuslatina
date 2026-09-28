// Paleta de marca (fondos, rellenos, botones). No cambiar.
export const NAVY = "#1A1F5E";
export const NAVY_DK = "#0E1240";
export const EMERALD = "#00C896";
export const SLATE = "#8B94C8";
export const CREAM = "#F5F4F0";
export const ORANGE = "#E8833A";
export const WHITE = "#FFFFFF";

// Colores de TEXTO sobre fondos claros (crema o blanco), con contraste WCAG AA (≥ 4.5:1).
// EMERALD, ORANGE y SLATE sirven como texto solo sobre NAVY/NAVY_DK; sobre fondo claro usar estos.
export const EMERALD_TXT = "#007A5C"; // 4.8:1 sobre crema
export const ORANGE_TXT = "#A94F16";  // 5.0:1 sobre crema
export const SLATE_TXT = "#5A6190";   // 5.4:1 sobre crema (etiquetas)
export const TEXT = "#3A4070";        // 8.9:1 cuerpo de texto
export const MUTED = "#565C80";       // 5.9:1 texto secundario
export const LINE = "#E8E6DF";        // bordes y separadores

// Escala tipográfica (px). Mínimo legible: 11 para etiquetas en mayúsculas, 15 para lectura.
export const FS = { label: 11, small: 13, body: 15, lead: 17, h3: 20, h2: 24 };

// Botón principal único: verde de marca con texto azul oscuro (8.2:1).
export const BTN_PRIMARY = { background: EMERALD, color: NAVY_DK };
export const BTN_DISABLED = { background: "#DEDCD5", color: MUTED };
export const TOUCH = 48; // alto mínimo de botones y controles táctiles

// Color de cada nivel para usar SOBRE fondos azules (NAVY / NAVY_DK), todos ≥ 6.5:1.
const NIVEL_DARK = { "Inicial": "#FF8A80", "En desarrollo": "#F29A55", "Consolidado": "#6FD08C", "Avanzado": "#8AB8FF" };
export const nivelDarkColor = (label) => NIVEL_DARK[label] || WHITE;
