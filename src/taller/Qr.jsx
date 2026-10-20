// Código QR en SVG. Aparte de componentes.jsx para que el celular no descargue el generador.
import { useEffect, useState } from "react";
import QRCode from "qrcode";

export function Qr({ texto, color = "#0A2329", tamano = 220 }) {
  const [svg, setSvg] = useState("");
  useEffect(() => {
    let vivo = true;
    QRCode.toString(texto, { type: "svg", margin: 0, errorCorrectionLevel: "M", color: { dark: color, light: "#0000" } })
      .then((s) => { if (vivo) setSvg(s); });
    return () => { vivo = false; };
  }, [texto, color]);
  return (
    <div role="img" aria-label={`Código QR para entrar: ${texto}`} className="t-qr"
      style={{ width: tamano, height: tamano, lineHeight: 0 }} dangerouslySetInnerHTML={{ __html: svg }} />
  );
}
