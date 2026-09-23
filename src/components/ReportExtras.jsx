// Agregados al informe pedidos por la spec (secciones 2 y 4.1), con los tokens visuales del v3.
import { NAVY, NAVY_DK, EMERALD, SLATE, ORANGE, WHITE } from "../theme.js";

const CONTACT_EMAIL = import.meta.env.VITE_CONTACT_EMAIL || "";
const CONTACT_WHATSAPP = (import.meta.env.VITE_CONTACT_WHATSAPP || "").replace(/\D/g, "");

const monoStyle = {fontFamily:"'Space Mono',monospace",fontSize:8,letterSpacing:".12em",textTransform:"uppercase"};

// Estado del envío del mail con el PDF: "pendiente" | "enviado" | "error"
export function EnvioBanner({email,estado}){
  if(!email) return null;
  const cfg={
    pendiente:{color:SLATE,icon:"✉️",texto:<>Te estamos enviando el informe en PDF a <strong>{email}</strong></>},
    enviado:{color:EMERALD,icon:"✅",texto:<>Te enviamos el informe en PDF a <strong>{email}</strong></>},
    error:{color:ORANGE,icon:"⚠️",texto:<>No pudimos enviar el mail a <strong>{email}</strong>. Podés descargar el PDF desde la solapa “Descargar PDF”.</>},
  }[estado]||null;
  if(!cfg) return null;
  return(
    <div role="status" style={{maxWidth:680,margin:"0 auto",padding:"12px 18px 0"}}>
      <div style={{display:"flex",gap:10,alignItems:"center",background:WHITE,border:`1px solid ${cfg.color}55`,borderLeft:`3px solid ${cfg.color}`,borderRadius:10,padding:"10px 14px"}}>
        <span style={{fontSize:16,flexShrink:0}} aria-hidden="true">{cfg.icon}</span>
        <p style={{fontSize:13,color:NAVY,lineHeight:1.5,margin:0,fontFamily:"'DM Sans',sans-serif",wordBreak:"break-word"}}>{cfg.texto}</p>
      </div>
    </div>
  );
}

function contactoHref(universidad){
  const msg=`Hola! Acabo de completar el diagnóstico de madurez en diagnostico.campuslatina.com. Mi universidad es ${universidad||"—"} y quiero saber más.`;
  if(CONTACT_WHATSAPP) return `https://wa.me/${CONTACT_WHATSAPP}?text=${encodeURIComponent(msg)}`;
  if(CONTACT_EMAIL) return `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(`Diagnóstico de madurez — ${universidad||""}`)}&body=${encodeURIComponent(msg)}`;
  return null;
}

// CTA fijo al pie de todas las solapas del informe.
export function ContactoCTA({universidad}){
  const href=contactoHref(universidad);
  return(
    <div style={{maxWidth:680,margin:"0 auto",padding:"4px 18px 18px"}}>
      <div style={{background:NAVY_DK,borderRadius:14,padding:"20px 18px",position:"relative",overflow:"hidden"}}>
        <div style={{position:"absolute",right:-60,top:-60,width:200,height:200,borderRadius:"50%",background:"radial-gradient(circle, rgba(0,200,150,.12) 0%, transparent 70%)"}}/>
        <div style={{position:"relative"}}>
          <span style={{...monoStyle,color:EMERALD}}>CampusLatina</span>
          <div style={{fontFamily:"'DM Serif Display',serif",fontSize:20,color:WHITE,lineHeight:1.25,margin:"6px 0 8px"}}>¿Querés ayuda para implementar <em style={{color:EMERALD}}>estas mejoras</em>?</div>
          <p style={{fontSize:13,color:"rgba(255,255,255,.6)",lineHeight:1.65,margin:"0 0 16px",fontFamily:"'DM Sans',sans-serif"}}>
            CampusLatina trabaja con universidades de LATAM para optimizar cada etapa del proceso de atracción — desde el primer clic hasta el primer día de clases. Si querés profundizar en estos resultados, hablemos.
          </p>
          {href&&(
            <a href={href} target="_blank" rel="noopener noreferrer"
              style={{display:"inline-flex",alignItems:"center",justifyContent:"center",minHeight:48,padding:"0 24px",borderRadius:10,background:EMERALD,color:NAVY_DK,fontSize:14,fontWeight:700,fontFamily:"'DM Sans',sans-serif",textDecoration:"none"}}>
              {CONTACT_WHATSAPP?"Escribinos por WhatsApp →":"Escribinos →"}
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
