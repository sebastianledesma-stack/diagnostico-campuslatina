// Paleta de marca Campus Latina: verde petróleo con ámbar como destaque (manual de identidad).
// Los nombres se conservan para no tocar cada pantalla: NAVY y NAVY_DK son ahora petróleo noche,
// EMERALD es el celeste agua (acento sobre fondos oscuros) y AMBAR el color de destaque (AMBAR_LUZ sobre fondos oscuros).
export const NAVY = "#123A42";     // petróleo profundo: títulos sobre fondos claros, paneles oscuros
export const NAVY_DK = "#0A2329";  // petróleo noche: fondos oscuros
export const EMERALD = "#7FD6DE";  // celeste agua: acento sobre fondos oscuros
export const SLATE = "#A9C2C6";    // texto secundario sobre fondos oscuros
export const CREAM = "#EAF3F4";    // bruma: fondo claro de la app
export const ORANGE = "#E8833A";
export const WHITE = "#FFFFFF";
export const PETROLEO = "#0B6470"; // color principal: botones y acentos sobre fondos claros
export const AMBAR = "#F08C1A";      // destaque sobre fondos claros: el dato o la palabra que importa (nunca para pérdidas)
export const AMBAR_LUZ = "#FFAE4A";  // el mismo destaque sobre petróleo noche

// Colores de TEXTO sobre fondos claros (bruma o blanco), con contraste WCAG AA (≥ 4.5:1).
// EMERALD, ORANGE y SLATE sirven como texto solo sobre NAVY/NAVY_DK; sobre fondo claro usar estos.
export const EMERALD_TXT = "#0B6470"; // petróleo, 6.0:1 sobre bruma
export const ORANGE_TXT = "#A94F16";  // 5.0:1 sobre bruma
export const SLATE_TXT = "#4D6166";   // 5.9:1 sobre bruma (etiquetas)
export const TEXT = "#1F3A40";        // 11:1 cuerpo de texto
export const MUTED = "#4D6166";       // 5.9:1 texto secundario
export const LINE = "#D5E3E5";        // bordes y separadores

// Escala tipográfica (px). Mínimo legible: 11 para etiquetas en mayúsculas, 15 para lectura.
export const FS = { label: 11, small: 13, body: 15, lead: 17, h3: 20, h2: 24 };

// Botón principal: petróleo con texto blanco (6.8:1). Sobre fondos oscuros, BTN_DARK: celeste agua con texto petróleo noche.
export const BTN_PRIMARY = { background: PETROLEO, color: WHITE };
export const BTN_DARK = { background: EMERALD, color: NAVY_DK };
export const BTN_DISABLED = { background: "#DCE6E7", color: MUTED };
export const TOUCH = 48; // alto mínimo de botones y controles táctiles

// Color de cada nivel para usar SOBRE fondos oscuros (NAVY / NAVY_DK), todos ≥ 6.5:1.
const NIVEL_DARK = { "Inicial": "#FF8A80", "En desarrollo": "#F29A55", "Consolidado": "#6FD08C", "Avanzado": "#8AB8FF" };
export const nivelDarkColor = (label) => NIVEL_DARK[label] || WHITE;
