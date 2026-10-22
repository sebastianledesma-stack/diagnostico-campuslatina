// Agregados al informe pedidos por la spec (secciones 2 y 4.1), con los tokens visuales del v3.
import { useEffect, useRef } from "react";
import { NAVY_DK, EMERALD, WHITE, MUTED, AMBAR_LUZ } from "../theme.js";
import { montarCampo } from "../lib/campo.js";
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
  const campo=useRef(null);
  useEffect(()=>montarCampo(campo.current,{linea:EMERALD,destaque:AMBAR_LUZ}),[]);
  return(
    <section className="cl-oscuro" style={{background:NAVY_DK,position:"relative",overflow:"hidden"}}>
      <canvas ref={campo} aria-hidden="true" style={{position:"absolute",inset:0,width:"100%",height:"100%",display:"block",pointerEvents:"none"}}/>
      <div style={{position:"relative",maxWidth:ancho,margin:"0 auto",padding:"clamp(44px,7vw,80px) clamp(20px,3vw,32px) clamp(52px,8vw,96px)"}}>
        <span style={{...monoStyle,fontSize:12,color:EMERALD}}>Campus Latina</span>
        <h2 style={{fontFamily:"'CL Titulos',sans-serif",fontWeight:700,fontSize:"clamp(30px,4.2vw,48px)",lineHeight:1.04,letterSpacing:"-.03em",color:WHITE,margin:"14px 0 18px",maxWidth:680,textWrap:"balance"}}>
          {target&&alto?<>Validemos su resultado <em className="cl-hi-oscuro">con datos</em></>
            :target?<>Revisemos su diagnóstico <em className="cl-hi-oscuro">en 45 minutos</em></>:<>¿Quiere inscribir <em className="cl-hi-oscuro">más estudiantes</em> el próximo ciclo?</>}
        </h2>
        <p style={{fontSize:"clamp(16px,1.5vw,19px)",color:"rgba(255,255,255,.72)",lineHeight:1.6,margin:"0 0 28px",maxWidth:580,fontFamily:"'Schibsted Grotesk',sans-serif"}}>
          {target&&alto
            ?<>Comparemos sus números con lo que vemos en otras universidades, en una videollamada de 45 minutos. {AUTORIDAD}</>
            :target
            ?<>Una videollamada para recorrer sus resultados y definir por dónde empezar. Sin compromiso. {AUTORIDAD}</>
            :<>{AUTORIDAD} Responda el mail con su informe o escríbanos, y lo revisamos juntos.</>}
        </p>
        {href&&(
          <a href={href} target="_blank" rel="noopener noreferrer" onClick={()=>track(target?"reunion_click":"contacto_click",{canal:target?(AGENDA_URL?"agenda":"mail"):(CONTACT_WHATSAPP?"whatsapp":"mail")})}
            style={{display:"inline-flex",alignItems:"center",justifyContent:"center",minHeight:52,padding:"0 28px",background:EMERALD,color:NAVY_DK,fontSize:16,fontWeight:700,fontFamily:"'Schibsted Grotesk',sans-serif",textDecoration:"none"}}>
            {target?"Agendar la reunión →":CONTACT_WHATSAPP?"Escríbanos por WhatsApp →":"Escríbanos →"}
          </a>
        )}
      </div>
    </section>
  );
}
