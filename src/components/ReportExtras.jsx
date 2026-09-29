// Agregados al informe pedidos por la spec (secciones 2 y 4.1), con los tokens visuales del v3.
import { NAVY_DK, EMERALD, WHITE, MUTED, BTN_PRIMARY, TOUCH } from "../theme.js";
import { AUTORIDAD } from "../data/textos.js";

const CONTACT_EMAIL = import.meta.env.VITE_CONTACT_EMAIL || "";
const CONTACT_WHATSAPP = (import.meta.env.VITE_CONTACT_WHATSAPP || "").replace(/\D/g, "");

const monoStyle = {fontFamily:"'Space Mono',monospace",fontSize:11,letterSpacing:".12em",textTransform:"uppercase"};

// Nota discreta (dentro de la pestaña PDF) sobre la copia enviada por mail.
// Estado: "pendiente" | "enviado" | "error"
export function EnvioNota({email,estado}){
  if(!email) return null;
  const texto={
    pendiente:<>También le estamos enviando una copia a <strong>{email}</strong>.</>,
    enviado:<>También le enviamos una copia a <strong>{email}</strong>.</>,
    error:<>No pudimos enviar la copia a <strong>{email}</strong>. Descárguela desde este botón.</>,
  }[estado];
  if(!texto) return null;
  return <p role="status" style={{fontSize:14,color:estado==="error"?"#B3261E":MUTED,lineHeight:1.5,margin:"12px 0 0",textAlign:"center",wordBreak:"break-word"}}>{texto}</p>;
}

function contactoHref(universidad){
  const msg=`Hola, acabo de completar el diagnóstico del proceso de inscripción en diagnostico.campuslatina.com. Mi universidad es ${universidad||"—"} y me gustaría revisar los resultados con ustedes.`;
  if(CONTACT_WHATSAPP) return `https://wa.me/${CONTACT_WHATSAPP}?text=${encodeURIComponent(msg)}`;
  if(CONTACT_EMAIL) return `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(`Diagnóstico del proceso de inscripción — ${universidad||""}`)}&body=${encodeURIComponent(msg)}`;
  return null;
}

// CTA fijo al pie de todas las solapas del informe.
export function ContactoCTA({universidad,ancho=680}){
  const href=contactoHref(universidad);
  return(
    <div style={{maxWidth:ancho,margin:"0 auto",padding:"4px 18px 18px"}}>
      <div style={{background:NAVY_DK,borderRadius:14,padding:"20px 18px",position:"relative",overflow:"hidden"}}>
        <div style={{position:"absolute",right:-60,top:-60,width:200,height:200,borderRadius:"50%",background:"radial-gradient(circle, rgba(0,200,150,.12) 0%, transparent 70%)"}}/>
        <div style={{position:"relative"}}>
          <span style={{...monoStyle,color:EMERALD}}>CampusLatina</span>
          <div style={{fontFamily:"'DM Serif Display',serif",fontSize:20,color:WHITE,lineHeight:1.25,margin:"6px 0 8px"}}>¿Quiere inscribir <em style={{color:EMERALD}}>más estudiantes</em> el próximo ciclo?</div>
          <p style={{fontSize:15,color:"rgba(255,255,255,.6)",lineHeight:1.65,margin:"0 0 16px",fontFamily:"'DM Sans',sans-serif"}}>
            {AUTORIDAD} Responda el mail con su informe o escríbanos, y lo revisamos juntos.
          </p>
          {href&&(
            <a href={href} target="_blank" rel="noopener noreferrer"
              style={{display:"inline-flex",alignItems:"center",justifyContent:"center",minHeight:48,padding:"0 24px",borderRadius:10,background:EMERALD,color:NAVY_DK,fontSize:16,fontWeight:700,fontFamily:"'DM Sans',sans-serif",textDecoration:"none"}}>
              {CONTACT_WHATSAPP?"Escríbanos por WhatsApp →":"Escríbanos →"}
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
