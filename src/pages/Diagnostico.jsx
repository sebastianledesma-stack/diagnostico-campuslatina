import { useState, useRef, useEffect, useCallback, lazy, Suspense } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { NAVY, NAVY_DK, EMERALD, SLATE, CREAM, WHITE, EMERALD_TXT, SLATE_TXT, MUTED, TEXT, LINE, BTN_PRIMARY, BTN_DARK, BTN_DISABLED, TOUCH, AMBAR_LUZ, PETROLEO } from "../theme.js";
import { montarCampo } from "../lib/campo.js";
import { PAISES_LATAM } from "../data/paises.js";
import { ETAPAS_DATA } from "../data/etapas.js";
import { calcScore, calcResultados, etapasCriticas } from "../lib/scoring.js";
import { crearDiagnostico, leerDiagnostico, guardarEtapa, invitarColega, finalizarDiagnostico, leerQuien, guardarQuien, etapaCompleta } from "../lib/api.js";
import { RANGOS_ALUMNOS } from "../data/calificacion.js";
import { Tablero, InvitarVentana, QuienVentana, Cargando, NoEncontrado } from "./Tablero.jsx";
import { track } from "../lib/analytics.js";
import { Informe } from "./Informe.jsx";
import { PAIS_A_ISO } from "../lib/telefono.js";
import { useIsDesktop } from "../lib/useIsDesktop.js";
import SiteHeader from "../components/SiteHeader.jsx";
const PhoneField=lazy(()=>import("../components/PhoneField.jsx"));

function isValidEmail(e){return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);}

function Mono({children,color=SLATE_TXT,size=12,className,style}){
  return <span className={className} style={{fontFamily:"'CL Etiquetas',sans-serif",fontSize:size,letterSpacing:".12em",textTransform:"uppercase",color,...style}}>{children}</span>;
}
const num2=(n)=>String(n).padStart(2,"0");
const titular=(tam)=>({fontFamily:"'CL Titulos',sans-serif",fontWeight:700,fontSize:tam,lineHeight:1.04,letterSpacing:"-.03em",margin:0,textWrap:"balance"});
// Fondo de líneas de la marca para pantallas oscuras (decorativo). `orden` (0 a 1, o una función)
// ordena el haz; cuando cambia, las líneas se acomodan de a poco.
function CampoFondo({orden=0}){
  const ref=useRef(null);
  const meta=useRef(orden); meta.current=orden;
  useEffect(()=>{
    let actual=typeof meta.current==="function"?meta.current():meta.current;
    return montarCampo(ref.current,{linea:EMERALD,destaque:AMBAR_LUZ,orden:()=>{
      const m=typeof meta.current==="function"?meta.current():meta.current;
      actual+=(m-actual)*0.04; return actual;
    }});
  },[]);
  return <canvas ref={ref} aria-hidden="true" style={{position:"absolute",inset:0,width:"100%",height:"100%",display:"block",pointerEvents:"none"}}/>;
}

// ── WELCOME ──────────────────────────────────────────────
function Welcome({onStart}){
  const [enCurso,setEnCurso]=useState(null);
  useEffect(()=>{try{setEnCurso(JSON.parse(localStorage.getItem("diag-en-curso")||"null"));}catch{/* nada que retomar */}},[]);
  // Responsive con CSS (clases wl-* en index.html), no con JavaScript: así el HTML prerenderizado
  // es uno solo para celular y escritorio (sin contenido duplicado para buscadores).
  // Precarga el selector de teléfono (pesado) con la primera interacción: llega antes del registro sin frenar la carga.
  useEffect(()=>{const pre=()=>{import("../components/PhoneField.jsx");};const ev=["pointerdown","keydown","touchstart"];ev.forEach(e=>addEventListener(e,pre,{once:true,passive:true}));return()=>ev.forEach(e=>removeEventListener(e,pre));},[]);

  const BENEFICIOS=[
    ["Dónde se van los aspirantes","Los 7 momentos del recorrido, de un vistazo: dónde el proceso es fuerte y dónde se pierden inscriptos."],
    ["Por qué se van","Las trabas concretas que frenan a los aspirantes en cada momento."],
    ["Qué resolver primero","Las acciones de cada etapa, ordenadas por el impacto que tienen en la inscripción."],
    ["Cuánto se puede mejorar","Elija las acciones que su equipo puede implementar y vea cuánto sube el puntaje."],
  ];
  const btn={width:"100%",maxWidth:420,...BTN_DARK,border:"none",borderRadius:0,minHeight:TOUCH+8,padding:"14px 24px",lineHeight:1.3,textAlign:"center",fontSize:16,fontWeight:700,fontFamily:"'Schibsted Grotesk',sans-serif",cursor:"pointer"};
  const regla="1px solid rgba(255,255,255,.16)";

  return(
    <div className="cl-oscuro" style={{minHeight:"100vh",background:NAVY_DK,display:"flex",flexDirection:"column",position:"relative"}}>
      <SiteHeader onCta={onStart}/>
      <div style={{position:"relative",flex:1,display:"flex",flexDirection:"column",overflow:"hidden"}}>
      <CampoFondo/>
      <main className="wl" style={{flex:1,display:"flex",flexDirection:"column",justifyContent:"center",padding:"44px 20px 40px",position:"relative",maxWidth:680,margin:"0 auto",width:"100%"}}>
        <div className="wl-head">
          <div className="cl-sube" style={{"--i":0,display:"flex",alignItems:"center",gap:12,flexWrap:"wrap"}}>
            <Mono color={SLATE}>CampusLatina & CIeLatam</Mono>
            <span style={{fontFamily:"'CL Etiquetas',sans-serif",fontSize:11,letterSpacing:".12em",textTransform:"uppercase",color:EMERALD,border:`1px solid ${EMERALD}`,padding:"3px 9px"}}>Gratis</span>
          </div>
          <h1 className="wl-h1 cl-sube" style={{"--i":1,...titular("clamp(34px,6vw,60px)"),lineHeight:1.02,letterSpacing:"-.035em",color:WHITE,margin:"16px 0 20px"}}>
            ¿Por qué se inscriben <em className="cl-hi-oscuro">menos estudiantes</em> de los esperados?
          </h1>
          <p className="wl-lead cl-sube" style={{"--i":2,fontSize:17,color:"rgba(255,255,255,.72)",lineHeight:1.65,marginBottom:30,maxWidth:500}}>
            En 10 minutos, descubra en qué momento su universidad pierde aspirantes, desde la primera búsqueda en Google hasta el primer día de clases, y qué resolver primero.
          </p>
        </div>
        {enCurso?.clave&&(
          <a href={`/d/${enCurso.clave}`} className="cl-sube" style={{"--i":3,display:"flex",alignItems:"center",justifyContent:"space-between",gap:12,maxWidth:420,minHeight:TOUCH,marginBottom:14,padding:"10px 16px",background:"rgba(255,255,255,.06)",borderLeft:`2px solid ${EMERALD}`,color:WHITE,textDecoration:"none",fontSize:15}}>
            <span>Tiene un diagnóstico en curso{enCurso.universidad?<> de <strong>{enCurso.universidad}</strong></>:null}</span>
            <span style={{color:EMERALD,fontWeight:700,whiteSpace:"nowrap"}}>Continuar →</span>
          </a>
        )}
        <div className="wl-cta cl-sube" style={{"--i":3}}>
          <button type="button" onClick={onStart} style={{...btn,marginBottom:36}}>Descubrir dónde se pierden inscriptos{" "}→</button>
        </div>
        <div className="wl-ben cl-sube" style={{"--i":4,borderTop:regla,paddingTop:20,marginBottom:32}}>
          <Mono color={EMERALD}>Lo que va a saber al terminar</Mono>
          <ol className="wl-ben-grid" style={{listStyle:"none",padding:0,margin:"16px 0 0",display:"flex",flexDirection:"column",gap:16}}>
            {BENEFICIOS.map(([title,desc],i)=>(
              <li key={title} style={{display:"grid",gridTemplateColumns:"34px minmax(0,1fr)",alignItems:"baseline"}}>
                <Mono color={EMERALD}>{num2(i+1)}</Mono>
                <div>
                  <div style={{fontSize:16,color:WHITE,fontWeight:600}}>{title}</div>
                  <div style={{fontSize:14,color:"rgba(255,255,255,.6)",lineHeight:1.5,marginTop:3}}>{desc}</div>
                </div>
              </li>
            ))}
          </ol>
        </div>
        <div className="wl-jue cl-sube" style={{"--i":5,borderLeft:`2px solid ${EMERALD}`,paddingLeft:18,marginBottom:32}}>
          <Mono color={EMERALD}>Más publicidad no alcanza</Mono>
          <p style={{fontSize:16,color:"rgba(255,255,255,.75)",lineHeight:1.65,margin:"8px 0 0"}}>
            Si el proceso pierde aspirantes en el camino, invertir en campañas es llenar un balde agujereado. Este diagnóstico muestra dónde está el agujero.
          </p>
          <p style={{fontSize:15,color:"rgba(255,255,255,.6)",lineHeight:1.65,margin:"10px 0 0"}}>
            Lo creamos en CampusLatina: ayudamos a inscribir a más de 200.000 estudiantes en Argentina, y ahora llevamos esa experiencia al resto de Latinoamérica.
          </p>
        </div>
        <div className="wl-datos cl-sube" style={{"--i":6,display:"grid",gridTemplateColumns:"repeat(3,minmax(0,1fr))",marginBottom:32}}>
          {[["28","preguntas"],["7","etapas"],["10 min","duración"]].map(([val,label],i)=>(
            <div key={label} style={{padding:i?"2px 0 2px 18px":"2px 18px 2px 0",borderLeft:i?regla:"none"}}>
              <div style={{...titular(34),letterSpacing:"-.04em",color:WHITE,lineHeight:1}}>{val}</div>
              <Mono color={SLATE} style={{display:"block",marginTop:8}}>{label}</Mono>
            </div>
          ))}
        </div>
        <div className="wl-cta2">
          <button type="button" onClick={onStart} style={btn}>Empezar el diagnóstico{" "}→</button>
        </div>
        <p className="wl-guia" style={{margin:"8px 0 0",fontSize:15}}>
          <a href="/guia/" style={{color:"rgba(255,255,255,.8)",textUnderlineOffset:3,display:"inline-flex",alignItems:"center",minHeight:44}}>Leer la guía: las 7 etapas del proceso de inscripción →</a>
        </p>
      </main>
      </div>
    </div>
  );
}

// ── REGISTER ─────────────────────────────────────────────
function Register({onNext}){
  const desk=useIsDesktop();
  const [form,setForm]=useState({universidad:"",pais:"",alumnos_actuales:"",alumnos_meta:"",nombre:"",cargo:"",email:"",whatsapp:""});
  const [enviando,setEnviando]=useState(false);
  const [errorEnvio,setErrorEnvio]=useState("");
  const [emailError,setEmailError]=useState(false);
  const [telError,setTelError]=useState(false);
  // País sugerido para el teléfono: el elegido arriba, mientras el número siga vacío.
  const [telPais,setTelPais]=useState(undefined);
  const [telValido,setTelValido]=useState(false);
  const valid=form.universidad&&form.nombre&&form.email&&isValidEmail(form.email)&&form.pais&&form.alumnos_actuales&&form.alumnos_meta&&telValido;
  const enviar=async()=>{if(!valid||enviando)return;setEnviando(true);setErrorEnvio("");try{await onNext(form);}catch(err){setErrorEnvio(err.message&&err.status<500?"Revise los datos e intente de nuevo.":"No pudimos conectarnos. Revise su conexión e intente de nuevo.");setEnviando(false);}};

  const handleEmailBlur=()=>setEmailError(form.email.length>0&&!isValidEmail(form.email));
  const set=(k,v)=>{
    setForm(p=>({...p,[k]:v}));
    if(k==="email") setEmailError(false);
    if(k==="whatsapp") setTelError(false);
    if(k==="pais"&&!form.whatsapp) setTelPais(PAIS_A_ISO[v]);
  };

  const LabelField=({label,required,htmlFor})=>(
    <label htmlFor={htmlFor} style={{display:"block",marginBottom:6,fontFamily:"'CL Etiquetas',sans-serif",fontSize:12,letterSpacing:".1em",textTransform:"uppercase",color:NAVY,fontWeight:700,lineHeight:1.4}}>
      {label}{required&&<span aria-hidden="true" style={{color:EMERALD_TXT}}>{"\u00A0"}*</span>}
    </label>
  );
  const campo={display:"block",width:"100%",minHeight:TOUCH,padding:"11px 14px",border:"1.5px solid #8A9B9E",borderRadius:2,fontSize:16,fontFamily:"'Schibsted Grotesk',sans-serif",color:NAVY_DK,background:WHITE};

  return(
    <div style={{minHeight:"100vh",background:WHITE,display:"flex",flexDirection:"column"}}>
      <div className="cl-oscuro" style={{background:NAVY_DK,borderBottom:"1px solid rgba(255,255,255,.1)"}}>
        <div style={{maxWidth:1120,margin:"0 auto",padding:desk?"14px 32px":"14px 20px",display:"flex",alignItems:"center",gap:20}}>
          {desk&&<img src="/campus-latina-sobre-oscuro.svg" alt="Campus Latina" width="106" height="30"/>}
          <Mono color={SLATE}>Paso 1 de 2 · Datos institucionales</Mono>
        </div>
      </div>
      <div style={{flex:1,maxWidth:desk?1120:560,margin:"0 auto",padding:desk?"56px 32px":"32px 20px",width:"100%"}}>
        <div style={desk?{display:"grid",gridTemplateColumns:"minmax(0,1fr) minmax(0,1fr)",gridTemplateAreas:'"head dir" "intro dir" "inst dir" "inst btn"',gridTemplateRows:"auto auto 1fr auto",columnGap:56,rowGap:12,alignItems:"start"}:undefined}>
        <h1 className="cl-sube" style={{"--i":0,...titular(desk?48:32),color:NAVY_DK,marginBottom:desk?14:12,...(desk?{gridArea:"head"}:{})}}>Antes de empezar, <em className="cl-hi">cuéntenos sobre su institución</em></h1>
        <p className="cl-sube" style={{"--i":1,fontSize:17,color:MUTED,marginBottom:desk?24:28,lineHeight:1.6,...(desk?{gridArea:"intro"}:{})}}>Con estos datos armamos su informe personalizado y se lo enviamos en PDF por mail. Puede pausar cuando quiera e invitar a colegas a completar las etapas que conocen mejor.</p>

        <div className="cl-sube" style={{"--i":2,borderTop:`2px solid ${NAVY_DK}`,paddingTop:16,marginBottom:desk?0:32,...(desk?{gridArea:"inst"}:{})}}>
          <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:18}}>
            <Mono color={PETROLEO}>01</Mono>
            <span style={{fontFamily:"'CL Etiquetas',sans-serif",fontSize:12,letterSpacing:".12em",textTransform:"uppercase",color:NAVY,fontWeight:700}}>Datos de la institución</span>
          </div>
          <div style={{display:"flex",flexDirection:"column",gap:16}}>
            <div>
              <LabelField label="Nombre de la universidad o institución" required htmlFor="f-universidad"/>
              <input id="f-universidad" required autoComplete="organization" value={form.universidad} onChange={e=>set("universidad",e.target.value)} placeholder="Ej: Universidad Nacional de Córdoba" style={campo}/>
            </div>
            {[["alumnos_actuales","Estudiantes que tiene hoy"],["alumnos_meta","Estudiantes que quiere tener en 3 a 5 años"]].map(([k,l])=>(
              <div key={k}>
                <LabelField label={l} required htmlFor={`f-${k}`}/>
                <div style={{position:"relative"}}>
                  <select id={`f-${k}`} required value={form[k]} onChange={e=>set(k,e.target.value)} style={{...campo,color:form[k]?NAVY:MUTED,appearance:"none",cursor:"pointer"}}>
                    <option value="">Seleccione un rango</option>
                    {RANGOS_ALUMNOS.map(r=><option key={r.id} value={r.id}>{r.texto}</option>)}
                  </select>
                  <span aria-hidden="true" style={{position:"absolute",right:14,top:"50%",transform:"translateY(-50%)",color:NAVY,pointerEvents:"none",fontSize:14}}>▾</span>
                </div>
              </div>
            ))}
            <div>
              <LabelField label="País" required htmlFor="f-pais"/>
              <div style={{position:"relative"}}>
                <select id="f-pais" required autoComplete="country-name" value={form.pais} onChange={e=>set("pais",e.target.value)}
                  style={{...campo,color:form.pais?NAVY:MUTED,appearance:"none",cursor:"pointer"}}>
                  <option value="">Seleccione el país</option>
                  {PAISES_LATAM.map(p=><option key={p} value={p} disabled={p.startsWith("—")}>{p}</option>)}
                </select>
                <span style={{position:"absolute",right:14,top:"50%",transform:"translateY(-50%)",color:NAVY,pointerEvents:"none",fontSize:14}}>▾</span>
              </div>
            </div>
          </div>
        </div>

        <div className="cl-sube" style={{"--i":3,borderTop:`2px solid ${NAVY_DK}`,paddingTop:16,marginBottom:desk?0:28,...(desk?{gridArea:"dir"}:{})}}>
          <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:18}}>
            <Mono color={PETROLEO}>02</Mono>
            <span style={{fontFamily:"'CL Etiquetas',sans-serif",fontSize:12,letterSpacing:".12em",textTransform:"uppercase",color:NAVY,fontWeight:700}}>Datos del directivo que responde</span>
          </div>
          <div style={{display:"flex",flexDirection:"column",gap:16}}>
            {[
              {key:"nombre",label:"Nombre completo",required:true,placeholder:"Ej: María González",type:"text",ac:"name"},
              {key:"cargo",label:"Cargo",required:false,placeholder:"Ej: Vicerrectora de Desarrollo Institucional",type:"text",ac:"organization-title"},
            ].map(f=>(
              <div key={f.key}>
                <LabelField label={f.label} required={f.required} htmlFor={`f-${f.key}`}/>
                <input id={`f-${f.key}`} type={f.type} required={f.required} autoComplete={f.ac} value={form[f.key]} onChange={e=>set(f.key,e.target.value)} placeholder={f.placeholder} style={campo}/>
              </div>
            ))}
            <div>
              <LabelField label="Correo electrónico" required htmlFor="f-email"/>
              <input id="f-email" type="email" required autoComplete="email" inputMode="email" value={form.email} onChange={e=>set("email",e.target.value)} onBlur={handleEmailBlur} placeholder="Ej: maria@universidad.edu"
                aria-invalid={emailError} aria-describedby={emailError?"f-email-error":undefined}
                style={{...campo,borderColor:emailError?"#CC3333":"#8A9B9E"}}/>
              {emailError&&<p id="f-email-error" role="alert" style={{fontSize:14,color:"#CC3333",margin:"5px 0 0",fontWeight:500}}>Ingrese un correo electrónico válido (ej: nombre@universidad.edu)</p>}
            </div>
            <div>
              <LabelField label="WhatsApp" required htmlFor="f-whatsapp"/>
              <Suspense fallback={<div className="cl-phone" aria-hidden="true"/>}>
              <PhoneField key={telPais||"sin-pais"} id="f-whatsapp" value={form.whatsapp} defaultCountry={telPais}
                onChange={(v,ok)=>{set("whatsapp",v);setTelValido(ok);}} onBlur={()=>setTelError(!!form.whatsapp&&!telValido)}
                invalid={telError} describedBy={telError?"f-whatsapp-error":"f-whatsapp-ayuda"}/>
              </Suspense>
              {telError
                ?<p id="f-whatsapp-error" role="alert" style={{fontSize:14,color:"#CC3333",margin:"5px 0 0",fontWeight:500}}>El número parece incompleto. Revise la cantidad de dígitos para el país elegido.</p>
                :<p id="f-whatsapp-ayuda" style={{fontSize:14,color:MUTED,margin:"5px 0 0"}}>Elija el país en la lista y escriba el número: el formato se completa solo.</p>}
            </div>
          </div>
        </div>


        <div style={desk?{gridArea:"btn"}:undefined}>
        <button type="button" onClick={enviar} disabled={!valid||enviando}
          style={{width:"100%",minHeight:TOUCH+4,borderRadius:2,border:"none",
            ...(valid&&!enviando?BTN_PRIMARY:BTN_DISABLED),
            fontSize:16,fontFamily:"'Schibsted Grotesk',sans-serif",fontWeight:700,
            cursor:valid?"pointer":"not-allowed",
            transition:"background .2s"
          }}>
          {enviando?"Preparando su diagnóstico…":"Empezar el diagnóstico →"}
        </button>
        {errorEnvio&&<p role="alert" style={{textAlign:"center",fontSize:14,color:"#B3261E",marginTop:10,fontWeight:500}}>{errorEnvio}</p>}
        {!valid&&<p style={{textAlign:"center",fontSize:14,color:TEXT,marginTop:10,fontWeight:500}}>Complete los campos obligatorios (*) para continuar</p>}
        </div>
        </div>
      </div>
    </div>
  );
}

// ── AVANCE ───────────────────────────────────────────────
// Las 7 etapas como 7 tramos: llenos en agua los terminados, en blanco lo que va de la etapa actual.
function Recorrido({etapa,etapasScores,fraccion=0.1,respondidas}){
  return(
    <div role="progressbar" aria-label="Avance del diagnóstico" aria-valuemin={0} aria-valuemax={28} aria-valuenow={respondidas}
      style={{display:"flex",gap:4,flex:1,maxWidth:460,minWidth:120}}>
      {ETAPAS_DATA.map(e=>{
        const lista=!!etapasScores&&etapasScores[e.id]>0, actual=e.num===etapa.num;
        return(
          <span key={e.id} style={{flex:1,height:3,background:"rgba(255,255,255,.14)",position:"relative",overflow:"hidden"}}>
            <span style={{position:"absolute",inset:0,background:actual?WHITE:EMERALD,transformOrigin:"left",transform:`scaleX(${actual?Math.max(fraccion,lista?1:0):lista?1:0})`,transition:"transform .6s cubic-bezier(.2,.7,.2,1)"}}/>
          </span>
        );
      })}
    </div>
  );
}

function BarraSuperior({desk,etapa,etapasScores,fraccion,respondidas,derecha,transparente}){
  return(
    <div className="cl-oscuro" style={{position:"relative",zIndex:2,background:transparente?"transparent":NAVY_DK,borderBottom:"1px solid rgba(255,255,255,.1)"}}>
      <div style={{maxWidth:1120,margin:"0 auto",padding:desk?"14px 32px":"14px 20px",display:"flex",alignItems:"center",gap:desk?28:16}}>
        {desk&&<img src="/campus-latina-sobre-oscuro.svg" alt="Campus Latina" width="106" height="30" style={{flexShrink:0}}/>}
        <Recorrido etapa={etapa} etapasScores={etapasScores} fraccion={fraccion} respondidas={respondidas}/>
        <span style={{marginLeft:"auto",whiteSpace:"nowrap"}}>{derecha}</span>
      </div>
    </div>
  );
}

// ── PROGRESO LATERAL (solo escritorio) ─────────────────────
const GRID_DESK={display:"grid",gridTemplateColumns:"250px minmax(0,720px)",justifyContent:"center",gap:64,width:"100%",maxWidth:1120,margin:"0 auto"};
function ConProgreso({desk,etapa,etapasScores,respondidas,children}){
  if(!desk) return children;
  return(
    <div style={{...GRID_DESK,flex:1,padding:"clamp(24px,4.5svh,48px) 32px 0"}}>
      <aside aria-label="Su avance">
        <div style={{position:"sticky",top:28}}>
          <Mono color={MUTED}>Su avance</Mono>
          <div style={{...titular(48),letterSpacing:"-.045em",color:NAVY_DK,lineHeight:1,margin:"12px 0 4px"}}>{respondidas}<span style={{fontSize:18,color:MUTED,letterSpacing:0,fontWeight:500}}> de 28</span></div>
          <div style={{fontSize:14,color:MUTED,marginBottom:22}}>respuestas</div>
          <ol style={{listStyle:"none",padding:0,margin:0,borderTop:`1px solid ${LINE}`}}>
            {ETAPAS_DATA.map(e=>{
              const actual=e.num===etapa.num;
              const lista=!actual&&!!etapasScores&&etapasScores[e.id]>0;
              return(
                <li key={e.id} aria-current={actual?"step":undefined} style={{position:"relative",display:"grid",gridTemplateColumns:"34px minmax(0,1fr)",alignItems:"baseline",padding:"12px 8px 12px 12px",borderBottom:`1px solid ${LINE}`,background:actual?"#F3F8F8":"transparent"}}>
                  <span aria-hidden="true" style={{position:"absolute",left:0,top:0,bottom:0,width:3,background:PETROLEO,transform:`scaleY(${actual?1:0})`,transition:"transform .35s"}}/>
                  <Mono color={actual||lista?PETROLEO:"#9FB3B7"}>{num2(e.num)}</Mono>
                  <span style={{minWidth:0}}>
                    <span style={{fontSize:15,fontWeight:actual?700:500,color:actual||lista?NAVY_DK:MUTED}}>{e.name}</span>
                    {lista&&<span style={{fontSize:13,color:MUTED}}> · lista</span>}
                    {actual&&<span style={{display:"block",fontSize:13,color:PETROLEO,marginTop:2}}>{e.pregunta}</span>}
                  </span>
                </li>
              );
            })}
          </ol>
        </div>
      </aside>
      <div>{children}</div>
    </div>
  );
}

// ── STAGE INTRO ───────────────────────────────────────────
// Portada oscura de cada etapa. El campo de líneas se ordena a medida que avanzan las respuestas.
function StageIntro({etapa,onStart,etapasScores,respondidas,onTablero,onInvitar}){
  const desk=useIsDesktop();
  const enlace={minHeight:44,padding:"0 2px",border:"none",background:"none",color:"rgba(255,255,255,.75)",fontSize:15,fontFamily:"'Schibsted Grotesk',sans-serif",textDecoration:"underline",textUnderlineOffset:3,cursor:"pointer"};
  const acciones=(
    <>
      <button type="button" onClick={onStart} style={{width:desk?"auto":"100%",padding:"0 34px",minHeight:TOUCH+8,border:"none",...BTN_DARK,fontSize:16,fontFamily:"'Schibsted Grotesk',sans-serif",fontWeight:700,cursor:"pointer"}}>
        Empezar etapa {etapa.num} →
      </button>
      <div style={{display:"flex",flexWrap:"wrap",justifyContent:desk?"flex-start":"center",gap:"0 22px",marginTop:6}}>
        <button type="button" onClick={onTablero} style={enlace}>← Ver las 7 etapas</button>
        <button type="button" onClick={onInvitar} style={{...enlace,color:EMERALD,fontWeight:600}}>Pedirle esta etapa a un colega</button>
      </div>
    </>
  );
  return(
    <div className="cl-oscuro" style={{minHeight:"100vh",background:NAVY_DK,color:WHITE,display:"flex",flexDirection:"column",position:"relative",overflow:"hidden"}}>
      <CampoFondo orden={0.15+0.85*(respondidas/28)}/>
      <BarraSuperior desk={desk} etapa={etapa} etapasScores={etapasScores} fraccion={0.04} respondidas={respondidas} transparente
        derecha={<Mono color={SLATE}>{respondidas} de 28 respuestas</Mono>}/>
      <main key={etapa.id} style={{position:"relative",flex:1,display:"flex",flexDirection:"column",justifyContent:"center",maxWidth:1120,margin:"0 auto",width:"100%",padding:desk?"48px 32px 72px":"32px 20px 28px"}}>
        <div style={{display:"grid",gridTemplateColumns:desk?"auto minmax(0,1fr)":"1fr",gap:desk?56:10,alignItems:"end"}}>
          <span aria-hidden="true" className="cl-sube" style={{"--i":0,...titular(desk?240:120),lineHeight:.78,letterSpacing:"-.06em",color:EMERALD}}>{num2(etapa.num)}</span>
          <div style={{paddingBottom:desk?10:0}}>
            <Mono className="cl-sube" color={SLATE} style={{"--i":1}}>Etapa {etapa.num} de 7</Mono>
            <h1 className="cl-sube" style={{"--i":2,...titular(desk?64:40),color:WHITE,margin:"10px 0 12px"}}>{etapa.name}</h1>
            <p className="cl-sube" style={{"--i":3,fontFamily:"Newsreader,Georgia,serif",fontStyle:"italic",fontSize:desk?30:24,lineHeight:1.2,color:WHITE,margin:0}}><span className="cl-hi-oscuro">{etapa.pregunta}</span></p>
          </div>
        </div>
        <p className="cl-sube" style={{"--i":4,fontSize:desk?20:17,lineHeight:1.6,color:"rgba(255,255,255,.78)",maxWidth:640,margin:desk?"44px 0 0":"28px 0 0"}}>{etapa.resumen}</p>
        <p className="cl-sube" style={{"--i":5,fontSize:15,color:SLATE,lineHeight:1.55,maxWidth:560,margin:"16px 0 0"}}>
          <strong style={{color:WHITE}}>4 preguntas.</strong> Elija la opción que describe cómo está su institución <em>hoy</em>, no cómo le gustaría que estuviera.
        </p>
        {desk&&<div className="cl-sube" style={{"--i":6,marginTop:40}}>{acciones}</div>}
      </main>
      {!desk&&(
        <div style={{position:"sticky",bottom:0,zIndex:10,background:"rgba(10,35,41,.94)",backdropFilter:"blur(6px)",WebkitBackdropFilter:"blur(6px)",borderTop:"1px solid rgba(255,255,255,.1)",padding:"12px 20px calc(8px + env(safe-area-inset-bottom))"}}>
          <div style={{maxWidth:580,margin:"0 auto"}}>{acciones}</div>
        </div>
      )}
    </div>
  );
}

// ── QUESTION ─────────────────────────────────────────────
function Question({preguntaIdx,etapa,pregunta,selected,onSelect,onNext,onBack,isLast,esFinal,etapasScores,hechas,guardando,errorGuardar,revision}){
  const desk=useIsDesktop();
  const barra=(
    // En escritorio la barra también queda pegada abajo: en notebooks bajas el botón no sale de la pantalla.
    <div style={desk?{position:"sticky",bottom:0,zIndex:5,padding:"14px 0 18px",background:"rgba(255,255,255,.96)",backdropFilter:"blur(6px)",WebkitBackdropFilter:"blur(6px)"}:{position:"sticky",bottom:0,zIndex:10,background:"rgba(255,255,255,.96)",backdropFilter:"blur(6px)",WebkitBackdropFilter:"blur(6px)",borderTop:`1px solid ${LINE}`}}>
      <div style={desk?{display:"flex",gap:16,alignItems:"center",maxWidth:560}:{maxWidth:640,margin:"0 auto",padding:"10px 16px calc(10px + env(safe-area-inset-bottom))",display:"flex",gap:10,alignItems:"center"}}>
          <button type="button" onClick={onBack} style={{minHeight:TOUCH,padding:"0 12px 0 0",border:"none",background:"none",color:NAVY_DK,cursor:"pointer",fontSize:16,fontFamily:"'Schibsted Grotesk',sans-serif",whiteSpace:"nowrap"}}>← Atrás</button>
          <button type="button" onClick={()=>selected&&!guardando&&onNext()} disabled={!selected||guardando} aria-disabled={!selected||guardando}
            style={{flex:1,minHeight:TOUCH+4,border:"none",...(selected&&!guardando?BTN_PRIMARY:BTN_DISABLED),cursor:selected&&!guardando?"pointer":"not-allowed",fontSize:16,fontFamily:"'Schibsted Grotesk',sans-serif",fontWeight:700,transition:"background .2s, color .2s"}}>
            {!selected?"Elija una opción":guardando?"Guardando…":isLast?(revision?"Guardar cambios →":esFinal?"Guardar y ver el diagnóstico →":"Guardar etapa →"):"Siguiente →"}
          </button>
      </div>
      {errorGuardar&&<p role="alert" style={{maxWidth:640,margin:"0 auto",padding:"0 16px 10px",fontSize:14,color:"#B3261E",textAlign:desk?"left":"center"}}>{errorGuardar}</p>}
    </div>
  );
  const TOTAL=28;
  const qid=`pregunta-${etapa.id}-${preguntaIdx}`;
  return(
    <div style={{minHeight:"100vh",background:WHITE,display:"flex",flexDirection:"column"}}>
      <BarraSuperior desk={desk} etapa={etapa} etapasScores={etapasScores} fraccion={(preguntaIdx+1)/4} respondidas={hechas}
        derecha={<span style={{display:"inline-flex",gap:14}}>{desk&&<Mono color={EMERALD}>{num2(etapa.num)} · {etapa.name}</Mono>}<Mono color={SLATE}>{hechas+1} / {TOTAL}</Mono></span>}/>
      <ConProgreso desk={desk} etapa={etapa} etapasScores={etapasScores} respondidas={hechas}>
      <div key={qid} style={desk?{paddingTop:4}:{flex:1,maxWidth:640,margin:"0 auto",padding:"28px 20px 24px",width:"100%"}}>
        {revision&&<p role="status" style={{margin:"0 0 20px",padding:"12px 16px",background:"#F3F8F8",borderLeft:`3px solid ${PETROLEO}`,fontSize:15,color:NAVY_DK,lineHeight:1.5}}>
          <strong>Revisando {etapa.name}.</strong> Sus respuestas guardadas están marcadas: cambie lo que necesite y guarde al final.
        </p>}
        <Mono className="cl-sube" color={MUTED} style={{"--i":0}}>{desk?`Pregunta ${preguntaIdx+1} de 4`:`${num2(etapa.num)} · ${etapa.name} · ${preguntaIdx+1} de 4`}</Mono>
        <h2 id={qid} className="cl-sube" style={{"--i":1,...titular(desk?"clamp(24px,4.6svh,34px)":25),lineHeight:1.15,color:NAVY_DK,marginTop:12}}>{pregunta.texto}</h2>
        {pregunta.ayuda&&<p id={`${qid}-ayuda`} className="cl-sube" style={{"--i":2,fontSize:16,color:MUTED,lineHeight:1.55,margin:"12px 0 0"}}>{pregunta.ayuda}</p>}
        <div role="radiogroup" aria-labelledby={qid} aria-describedby={pregunta.ayuda?`${qid}-ayuda`:undefined} style={{marginTop:desk?32:24,borderTop:`1px solid ${LINE}`}}>
          {pregunta.opciones.map((op,k)=>{
            const isSel=selected===op.letra;
            return(
              <button key={op.letra} type="button" role="radio" aria-checked={isSel} onClick={()=>onSelect(op.letra)} className="cl-lado cl-fila"
                style={{"--i":k+2,position:"relative",display:"grid",gridTemplateColumns:"40px minmax(0,1fr)",gap:12,alignItems:"start",textAlign:"left",width:"100%",padding:desk?"clamp(12px,2.2svh,18px) 14px clamp(12px,2.2svh,18px) 16px":"18px 14px 18px 16px",background:isSel?"#F3F8F8":"transparent",border:"none",borderBottom:`1px solid ${LINE}`,cursor:"pointer",fontFamily:"'Schibsted Grotesk',sans-serif"}}>
                <span aria-hidden="true" style={{position:"absolute",left:0,top:0,bottom:0,width:3,background:PETROLEO,transform:`scaleY(${isSel?1:0})`,transition:"transform .3s cubic-bezier(.2,.7,.2,1)"}}/>
                <span aria-hidden="true" style={{...titular(28),lineHeight:1,color:isSel?PETROLEO:"#A9BBBE",transition:"color .25s"}}>{op.letra}</span>
                <span style={{fontSize:16,color:TEXT,lineHeight:1.5}}>
                  <strong style={{display:"block",color:NAVY_DK,fontWeight:700,fontSize:17,marginBottom:2}}>{op.etiqueta}</strong>
                  {op.texto}
                </span>
              </button>
            );
          })}
        </div>
        {desk&&barra}
      </div>
      </ConProgreso>
      {!desk&&barra}
    </div>
  );
}

// ── PROCESSING ────────────────────────────────────────────
// Mientras se arma el informe, el campo de líneas pasa de disperso a ordenado.
function Processing(){
  const [step,setStep]=useState(0);
  const inicio=useRef(typeof performance!=="undefined"?performance.now():0);
  const steps=["Leyendo sus 28 respuestas","Calculando el puntaje de cada etapa","Buscando dónde se pierden aspirantes","Ordenando las acciones por impacto","Preparando su informe"];
  useEffect(()=>{if(step<steps.length-1){const t=setTimeout(()=>setStep(s=>s+1),700);return()=>clearTimeout(t);}},[step]);
  return(
    <div className="cl-oscuro" style={{minHeight:"100vh",background:NAVY_DK,color:WHITE,position:"relative",overflow:"hidden",display:"flex",alignItems:"center"}}>
      <CampoFondo orden={()=>Math.min(1,(performance.now()-inicio.current)/3200)}/>
      <div style={{position:"relative",maxWidth:1120,margin:"0 auto",padding:"48px 24px",width:"100%"}}>
        <Mono className="cl-sube" color={EMERALD} style={{"--i":0}}>Su diagnóstico</Mono>
        <h1 className="cl-sube" style={{"--i":1,...titular("clamp(36px,5.5vw,64px)"),color:WHITE,margin:"14px 0 36px"}}>Ordenando <em className="cl-hi-oscuro">el recorrido</em></h1>
        <ol role="status" aria-live="polite" style={{listStyle:"none",padding:0,margin:0,maxWidth:480,borderTop:"1px solid rgba(255,255,255,.12)"}}>
          {steps.map((s,i)=>(
            <li key={s} style={{display:"grid",gridTemplateColumns:"38px minmax(0,1fr) 22px",alignItems:"center",padding:"13px 0",borderBottom:"1px solid rgba(255,255,255,.12)",fontSize:16,color:i<step?"rgba(255,255,255,.55)":i===step?WHITE:"rgba(255,255,255,.28)",transition:"color .4s"}}>
              <Mono color={i<=step?EMERALD:"rgba(255,255,255,.28)"}>{num2(i+1)}</Mono>
              <span>{s}</span>
              <svg width="16" height="12" viewBox="0 0 16 12" aria-hidden="true"><path d="M1.5 6.5l4 4 9-9" fill="none" stroke={EMERALD} strokeWidth="2" pathLength="1" style={{strokeDasharray:1,strokeDashoffset:i<step?0:1,transition:"stroke-dashoffset .35s ease"}}/></svg>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}

// ── APP MAIN ─────────────────────────────────────────────
// "/"           bienvenida → formulario → crea el diagnóstico y pasa a /d/<clave>
// "/d/<clave>"  tablero de 7 etapas → cada etapa se guarda al terminarla → informe con las 7
export default function Diagnostico(){
  const {clave:claveUrl}=useParams();
  // La clave sale del link; si el navegador vuelve a "/" (botón Atrás) con un diagnóstico abierto,
  // se conserva y se restaura la URL. Antes, todo lo que se guardaba iba a un diagnóstico "inexistente".
  const [claveActual,setClaveActual]=useState(claveUrl||null);
  const clave=claveUrl||claveActual;
  const navigate=useNavigate();
  const [params]=useSearchParams();
  const [diag,setDiag]=useState(null);           // vista del servidor (respuestas guardadas, quién respondió)
  const [estado,setEstado]=useState(clave?"cargando":"welcome"); // welcome|register|cargando|no-encontrado|tablero|quiz|processing|report
  const [pos,setPos]=useState({etapa:0,pregunta:0,showIntro:true});
  const [borrador,setBorrador]=useState({});     // respuestas de la etapa en curso, antes de guardarla
  const [quien,setQuien]=useState(()=>clave?leerQuien(clave):"");
  const [ventana,setVentana]=useState(null);     // {tipo:"invitar",etapas} | {tipo:"quien",etapa}
  const [aviso,setAviso]=useState("");
  const [guardando,setGuardando]=useState(false);
  const [errorGuardar,setErrorGuardar]=useState("");
  const [finalizando,setFinalizando]=useState(false);
  const [errorFinal,setErrorFinal]=useState("");
  const [envio,setEnvio]=useState("pendiente");
  const [revision,setRevision]=useState(false); // revisando una etapa ya guardada

  useEffect(()=>{window.scrollTo(0,0);},[estado,pos.etapa,pos.pregunta,pos.showIntro]);
  useEffect(()=>{if(!aviso)return;const t=setTimeout(()=>setAviso(""),6000);return()=>clearTimeout(t);},[aviso]);

  // Colega invitado: el link trae ?inv=<id> y sus etapas quedan destacadas.
  const invitado=diag?.colaboradores?.find(c=>c.id===params.get("inv"));
  const misEtapas=invitado?.etapas||[];

  const cargar=useCallback(async()=>{
    if(!clave)return;
    try{
      const d=await leerDiagnostico(clave);
      setDiag(d);
      if(d.estado==="completo"){setEnvio(d.mail_enviado?"enviado":"pendiente");setEstado("report");}
      else setEstado(e=>e==="cargando"?"tablero":e);
    }catch(err){setEstado(err.status===404?"no-encontrado":"error");}
  },[clave]);
  useEffect(()=>{cargar();},[cargar]);
  useEffect(()=>{if(claveUrl&&claveUrl!==claveActual)setClaveActual(claveUrl);},[claveUrl,claveActual]);
  useEffect(()=>{
    if(!claveUrl&&claveActual&&!["welcome","register"].includes(estado))navigate(`/d/${claveActual}`,{replace:true});
  },[claveUrl,claveActual,estado,navigate]);
  // Recordar el diagnóstico en curso de este navegador, para ofrecer retomarlo desde la portada.
  useEffect(()=>{
    try{
      if(clave&&diag?.estado==="en_curso")localStorage.setItem("diag-en-curso",JSON.stringify({clave,universidad:diag.universidad}));
      if(clave&&diag?.estado==="completo"){const g=JSON.parse(localStorage.getItem("diag-en-curso")||"null");if(g?.clave===clave)localStorage.removeItem("diag-en-curso");}
    }catch{/* sin almacenamiento: no se ofrece retomar */}
  },[clave,diag?.estado,diag?.universidad]);

  // El nombre de quien responde: el del formulario, el de la invitación o el que escriba.
  useEffect(()=>{
    if(!clave||quien)return;
    const n=invitado?.nombre;
    if(n){setQuien(n);guardarQuien(clave,n);}
  },[clave,quien,invitado]);

  const respuestas={...(diag?.respuestas||{}),...borrador};
  const etapasScores=Object.fromEntries(ETAPAS_DATA.filter(e=>etapaCompleta(e,diag?.respuestas)).map(e=>[e.id,calcScore(diag.respuestas,e.id)]));
  const guardadas=Object.keys(diag?.respuestas||{}).length;

  const handleRegister=async(form)=>{
    const d=await crearDiagnostico(form);
    track("generate_lead",{pais:form.pais,alumnos:form.alumnos_actuales,target:d.target});
    guardarQuien(d.clave,form.nombre);
    setQuien(form.nombre);
    setDiag(d);
    setClaveActual(d.clave);
    setEstado("tablero");
    navigate(`/d/${d.clave}`);
  };

  const abrirEtapa=(i,nombre=quien)=>{
    if(!nombre){setVentana({tipo:"quien",etapa:i});return;}
    const e=ETAPAS_DATA[i];
    // Al revisar una etapa ya respondida, se parte de las respuestas guardadas y se va directo a las preguntas.
    const yaLista=etapaCompleta(e,diag.respuestas);
    setRevision(yaLista);
    setBorrador(Object.fromEntries(e.preguntas.map((_,k)=>[`${e.id}_${k}`,diag.respuestas[`${e.id}_${k}`]]).filter(([,v])=>v)));
    setPos({etapa:i,pregunta:0,showIntro:!yaLista});
    setErrorGuardar("");
    setEstado("quiz");
  };

  const finalizar=async()=>{
    setFinalizando(true);setErrorFinal("");setEstado("processing");
    const inicio=Date.now();
    try{
      const d=await finalizarDiagnostico(clave);
      const {score_global,nivel}=calcResultados(d.respuestas);
      track("diagnostico_completo",{puntaje:score_global,nivel,etapa_critica:etapasCriticas(calcResultados(d.respuestas).scores)[0]?.id,colegas:d.colaboradores.length});
      if(d.envio==="error")track("envio_error",{paso:"mail",motivo:"finalizar"});
      // La animación de "procesando" dura al menos 3 s: el informe no aparece de golpe.
      await new Promise(r=>setTimeout(r,Math.max(0,3000-(Date.now()-inicio))));
      setDiag(d);setEnvio(d.envio||"enviado");setEstado("report");
    }catch(err){
      setErrorFinal(err.status===409?"Todavía faltan etapas: actualizamos el tablero.":"No pudimos generar el informe. Revise su conexión e intente de nuevo.");
      await cargar();
      setEstado("tablero");
    }finally{setFinalizando(false);}
  };

  const guardarEtapaActual=async()=>{
    const e=ETAPAS_DATA[pos.etapa];
    const resp=Object.fromEntries(e.preguntas.map((_,k)=>[`${e.id}_${k}`,respuestas[`${e.id}_${k}`]]));
    setGuardando(true);setErrorGuardar("");
    try{
      const d=await guardarEtapa(clave,e.id,resp,quien);
      setDiag(d);setBorrador({});
      track("etapa_completada",{etapa:e.id,numero:e.num,colega:!!invitado,revision});
      const pendientes=ETAPAS_DATA.filter(x=>!etapaCompleta(x,d.respuestas));
      if(!pendientes.length&&!revision){await finalizar();return;}
      // Después de revisar, vuelve al tablero confirmando que se guardó.
      if(revision){setRevision(false);setAviso(`Guardamos los cambios en ${e.name}.`);setEstado("tablero");return;}
      // Sigue con la próxima etapa: primero las asignadas a esta persona; si no tiene, la siguiente pendiente.
      const prox=invitado?pendientes.find(x=>misEtapas.includes(x.id)):(pendientes.find(x=>x.num>e.num)||pendientes[0]);
      if(prox){setAviso(`Etapa ${e.num} guardada.`);setPos({etapa:prox.num-1,pregunta:0,showIntro:true});}
      else{setAviso(`¡Listo! Sus etapas quedaron guardadas.`);setEstado("tablero");}
    }catch(err){
      setErrorGuardar(err.status===409?"Este diagnóstico ya se completó.":err.status===404||err.status===400?"No encontramos este diagnóstico. Ábralo desde el link del mail y vuelva a responder esta etapa.":"No pudimos guardar la etapa. Revise su conexión y vuelva a intentar: sus respuestas no se perdieron.");
      if(err.status===409)cargar();
    }finally{setGuardando(false);}
  };

  const handleNext=()=>{
    const e=ETAPAS_DATA[pos.etapa];
    if(pos.pregunta>=e.preguntas.length-1)guardarEtapaActual();
    else setPos({...pos,pregunta:pos.pregunta+1,showIntro:false});
  };
  const handleBack=()=>{
    if(pos.pregunta>0)setPos({...pos,pregunta:pos.pregunta-1});
    else if(revision){setRevision(false);setBorrador({});setEstado("tablero");}
    else setPos({...pos,showIntro:true});
  };

  const invitar=async(datos)=>{
    const d=await invitarColega(clave,{...datos,de:quien||diag.nombre});
    setDiag(d);setVentana(null);
    setAviso(d.invitacion_enviada?`Le enviamos la invitación a ${datos.nombre}.`:`Agregamos a ${datos.nombre}, pero el mail no salió. Comparta el link con "Copiar link".`);
    track("colega_invitado",{etapas:datos.etapas.length});
  };
  const copiar=async()=>{
    const link=`${window.location.origin}/d/${clave}`;
    try{await navigator.clipboard.writeText(link);setAviso("Link copiado. Quien lo tenga puede ver y completar el diagnóstico.");}
    catch{window.prompt("Copie el link del diagnóstico:",link);}
    track("link_copiado");
  };

  const ventanas=<>
    {ventana?.tipo==="invitar"&&<InvitarVentana etapasIniciales={ventana.etapas} onCerrar={()=>setVentana(null)} onEnviar={invitar}/>}
    {ventana?.tipo==="quien"&&<QuienVentana sugerido="" onCerrar={()=>setVentana(null)} onListo={(n)=>{guardarQuien(clave,n);setQuien(n);const i=ventana.etapa;setVentana(null);abrirEtapa(i,n);}}/>}
  </>;

  if(estado==="welcome") return <Welcome onStart={()=>{track("diagnostico_inicio");setEstado("register");}}/>;
  if(estado==="register") return <Register onNext={handleRegister}/>;
  if(estado==="cargando") return <Cargando/>;
  if(estado==="no-encontrado") return <NoEncontrado/>;
  if(estado==="error") return <Cargando texto="No pudimos cargar el diagnóstico. Revise su conexión y recargue la página."/>;
  if(estado==="processing") return <Processing/>;
  if(estado==="report") return <Informe registroData={diag} respuestas={diag.respuestas} envio={envio}/>;
  if(estado==="tablero") return <>
    <Tablero diag={diag} quien={quien} misEtapas={misEtapas} aviso={aviso} onResponder={abrirEtapa}
      onInvitar={(etapas)=>setVentana({tipo:"invitar",etapas})} onCopiar={copiar}
      onFinalizar={finalizar} finalizando={finalizando} errorFinal={errorFinal}/>
    {ventanas}
  </>;

  const etapa=ETAPAS_DATA[pos.etapa];
  if(pos.showIntro) return <>
    {aviso&&<p role="status" style={{position:"fixed",top:12,left:"50%",transform:"translateX(-50%)",zIndex:150,margin:0,padding:"10px 16px",borderRadius:2,background:NAVY,color:WHITE,fontSize:15,fontWeight:600,boxShadow:"0 6px 20px rgba(10,35,41,.25)",maxWidth:"calc(100% - 32px)"}}>✓ {aviso}</p>}
    <StageIntro etapa={etapa} onStart={()=>setPos({...pos,showIntro:false})} etapasScores={etapasScores} respondidas={guardadas}
      onTablero={()=>{setBorrador({});setEstado("tablero");}} onInvitar={()=>setVentana({tipo:"invitar",etapas:[etapa.id]})}/>
    {ventanas}
  </>;

  const pregunta=etapa.preguntas[pos.pregunta];
  const key=`${etapa.id}_${pos.pregunta}`;
  const isLast=pos.pregunta===etapa.preguntas.length-1;
  const otrasPendientes=ETAPAS_DATA.filter(x=>x.id!==etapa.id&&!etapaCompleta(x,diag.respuestas)).length;
  const guardadasOtras=Object.keys(diag.respuestas).filter(k=>!k.startsWith(`${etapa.id}_`)).length;

  return(
    <Question
      preguntaIdx={pos.pregunta}
      etapa={etapa} pregunta={pregunta}
      selected={respuestas[key]||null} onSelect={(v)=>setBorrador(b=>({...b,[key]:v}))}
      onNext={handleNext} onBack={handleBack}
      isLast={isLast} esFinal={isLast&&otrasPendientes===0} etapasScores={etapasScores}
      hechas={guardadasOtras+pos.pregunta} guardando={guardando} errorGuardar={errorGuardar} revision={revision}
    />
  );
}
