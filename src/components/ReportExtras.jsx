// Agregados al informe pedidos por la spec (secciones 2 y 4.1), con los tokens visuales del v3.
import { NAVY_DK, EMERALD, WHITE, MUTED, BTN_PRIMARY, TOUCH } from "../theme.js";
import { track } from "../lib/analytics.js";
import { AUTORIDAD } from "../data/textos.js";

const CONTACT_EMAIL = import.meta.env.VITE_CONTACT_EMAIL || "";
const CONTACT_WHATSAPP = (import.meta.env.VITE_CONTACT_WHATSAPP || "").replace(/\D/g, "");
// Link público para agendar la reunión de 45 min. Sin él, el botón abre un mail pidiendo la reunión.
const AGENDA_URL = import.meta.env.VITE_AGENDA_URL || "";

const monoStyle = {fontFamily:"'CL Etiquetas',sans-serif",fontSize:11,letterSpacing:".12em",textTransform:"uppercase"};

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

function agendaHref(universidad){
  if(AGENDA_URL) return AGENDA_URL;
  if(CONTACT_EMAIL) return `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(`Quiero agendar la reunión de 45 minutos — ${universidad||""}`)}&body=${encodeURIComponent(`Hola, completamos el diagnóstico del proceso de inscripción de ${universidad||"nuestra universidad"} y queremos agendar la reunión de 45 minutos para revisar los resultados. Estos son algunos horarios que nos quedan cómodos: `)}`;
  return null;
}

// Cierre del informe: reunión de 45 min si la universidad es target (src/data/calificacion.js);
// si no, contacto por mail.
export function ContactoCTA({universidad,target,alto,ancho=680}){
  const href=target?agendaHref(universidad):contactoHref(universidad);
  return(
    <div style={{maxWidth:ancho,margin:"0 auto",padding:"4px 18px 18px"}}>
      <div style={{background:NAVY_DK,borderRadius:2,padding:"20px 18px",position:"relative",overflow:"hidden"}}>
        <div style={{position:"absolute",right:-60,top:-60,width:200,height:200,borderRadius:"50%",background:"radial-gradient(circle, rgba(127,214,222,.12) 0%, transparent 70%)"}}/>
        <div style={{position:"relative"}}>
          <span style={{...monoStyle,color:EMERALD}}>CampusLatina</span>
          <div style={{fontFamily:"'CL Titulos',serif",fontSize:20,color:WHITE,lineHeight:1.25,margin:"6px 0 8px"}}>
            {target&&alto?<>Validemos su resultado <em style={{color:EMERALD}}>con datos</em></>
              :target?<>Revisemos su diagnóstico <em style={{color:EMERALD}}>en 45 minutos</em></>:<>¿Quiere inscribir <em style={{color:EMERALD}}>más estudiantes</em> el próximo ciclo?</>}
          </div>
          <p style={{fontSize:15,color:"rgba(255,255,255,.7)",lineHeight:1.65,margin:"0 0 16px",fontFamily:"'Schibsted Grotesk',sans-serif"}}>
            {target&&alto
              ?<>Comparemos sus números con lo que vemos en otras universidades, en una videollamada de 45 minutos. {AUTORIDAD}</>
              :target
              ?<>Una videollamada para recorrer sus resultados y definir por dónde empezar. Sin compromiso. {AUTORIDAD}</>
              :<>{AUTORIDAD} Responda el mail con su informe o escríbanos, y lo revisamos juntos.</>}
          </p>
          {href&&(
            <a href={href} target="_blank" rel="noopener noreferrer" onClick={()=>track(target?"reunion_click":"contacto_click",{canal:target?(AGENDA_URL?"agenda":"mail"):(CONTACT_WHATSAPP?"whatsapp":"mail")})}
              style={{display:"inline-flex",alignItems:"center",justifyContent:"center",minHeight:48,padding:"0 24px",borderRadius:2,background:EMERALD,color:NAVY_DK,fontSize:16,fontWeight:700,fontFamily:"'Schibsted Grotesk',sans-serif",textDecoration:"none"}}>
              {target?"Agendar la reunión →":CONTACT_WHATSAPP?"Escríbanos por WhatsApp →":"Escríbanos →"}
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
