import { useState, useRef, useEffect, useCallback, lazy, Suspense } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { NAVY, NAVY_DK, EMERALD, SLATE, CREAM, WHITE, EMERALD_TXT, ORANGE_TXT, SLATE_TXT, MUTED, TEXT, LINE, BTN_PRIMARY, BTN_DISABLED, TOUCH, nivelDarkColor } from "../theme.js";
import { PAISES_LATAM } from "../data/paises.js";
import { ETAPAS_DATA } from "../data/etapas.js";
import { FRICCIONES } from "../data/fricciones.js";
import { getNivel, calcScore, calcEtapaProjected as projectEtapa, recsDeEtapa, r1, fmt1, potencialEtapa, calcGlobalPotential, calcResultados, etapasCriticas } from "../lib/scoring.js";
import { crearDiagnostico, leerDiagnostico, guardarEtapa, invitarColega, finalizarDiagnostico, leerQuien, guardarQuien, etapaCompleta } from "../lib/api.js";
import { RANGOS_ALUMNOS } from "../data/calificacion.js";
import { Tablero, InvitarVentana, QuienVentana, Cargando, NoEncontrado } from "./Tablero.jsx";
import { track } from "../lib/analytics.js";
import { EnvioNota, ContactoCTA } from "../components/ReportExtras.jsx";
import { NIVEL_DESC, lecturaDiagnostico } from "../data/textos.js";
import { PAIS_A_ISO } from "../lib/telefono.js";
import { useIsDesktop } from "../lib/useIsDesktop.js";
import SiteHeader from "../components/SiteHeader.jsx";
const PhoneField=lazy(()=>import("../components/PhoneField.jsx"));

const nd=(score)=>nivelDarkColor(getNivel(score).label);
function isValidEmail(e){return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);}

function Mono({children,color=SLATE_TXT,size=11}){
  return <span style={{fontFamily:"'Space Mono',monospace",fontSize:size,letterSpacing:".12em",textTransform:"uppercase",color}}>{children}</span>;
}
function NivelPill({score}){
  const n=getNivel(score);
  return <span style={{display:"inline-flex",alignItems:"center",gap:4,background:n.bg,borderRadius:6,padding:"3px 9px"}}>
    <span style={{fontFamily:"'DM Serif Display',serif",fontSize:16,color:n.color,lineHeight:1}}>{fmt1(score)}</span>
    <span style={{fontFamily:"'Space Mono',monospace",fontSize:11,color:n.color,letterSpacing:".07em",textTransform:"uppercase"}}>{n.label}</span>
  </span>;
}

function RadarChart({scores}){
  const ref=useRef(null);
  const W=320,H=290;
  useEffect(()=>{
    const canvas=ref.current;if(!canvas)return;
    // Nítido en pantallas de alta densidad
    const dpr=window.devicePixelRatio||1;
    canvas.width=W*dpr;canvas.height=H*dpr;
    const ctx=canvas.getContext("2d");
    ctx.setTransform(dpr,0,0,dpr,0,0);
    const cx=W/2,cy=H/2,R=95;
    const labels=ETAPAS_DATA.map(e=>e.name);
    const vals=ETAPAS_DATA.map(e=>scores[e.id]||0);
    const N=labels.length;
    const angle=i=>(i/N)*2*Math.PI-Math.PI/2;
    ctx.clearRect(0,0,W,H);
    for(let lv=1;lv<=5;lv++){ctx.beginPath();for(let i=0;i<N;i++){const r=(lv/5)*R,x=cx+r*Math.cos(angle(i)),y=cy+r*Math.sin(angle(i));i===0?ctx.moveTo(x,y):ctx.lineTo(x,y);}ctx.closePath();ctx.strokeStyle="rgba(90,97,144,.22)";ctx.lineWidth=1;ctx.stroke();}
    for(let i=0;i<N;i++){ctx.beginPath();ctx.moveTo(cx,cy);ctx.lineTo(cx+R*Math.cos(angle(i)),cy+R*Math.sin(angle(i)));ctx.strokeStyle="rgba(90,97,144,.25)";ctx.lineWidth=1;ctx.stroke();}
    ctx.beginPath();vals.forEach((v,i)=>{const r=(v/5)*R,x=cx+r*Math.cos(angle(i)),y=cy+r*Math.sin(angle(i));i===0?ctx.moveTo(x,y):ctx.lineTo(x,y);});ctx.closePath();ctx.fillStyle="rgba(0,200,150,.2)";ctx.fill();ctx.strokeStyle=EMERALD_TXT;ctx.lineWidth=2.5;ctx.stroke();
    vals.forEach((v,i)=>{const r=(v/5)*R,x=cx+r*Math.cos(angle(i)),y=cy+r*Math.sin(angle(i));ctx.beginPath();ctx.arc(x,y,4.5,0,2*Math.PI);ctx.fillStyle=EMERALD_TXT;ctx.fill();ctx.strokeStyle=WHITE;ctx.lineWidth=1.5;ctx.stroke();});
    ctx.font="600 12px 'DM Sans', sans-serif";ctx.textAlign="center";ctx.textBaseline="middle";
    labels.forEach((label,i)=>{const r=R+22,x=cx+r*Math.cos(angle(i)),y=cy+r*Math.sin(angle(i));ctx.fillStyle=TEXT;const words=label.split(" ");if(words.length>1){ctx.fillText(words[0],x,y-7);ctx.fillText(words.slice(1).join(" "),x,y+7);}else ctx.fillText(label,x,y);});
  },[scores]);
  const desc="Radar de puntajes por etapa: "+ETAPAS_DATA.map(e=>`${e.name} ${fmt1(scores[e.id]||0)} de 5`).join(", ")+".";
  return <canvas ref={ref} role="img" aria-label={desc} style={{width:"100%",maxWidth:W,height:"auto",aspectRatio:`${W} / ${H}`}}/>;
}

// ── WELCOME ──────────────────────────────────────────────
function Welcome({onStart}){
  const [enCurso,setEnCurso]=useState(null);
  useEffect(()=>{try{setEnCurso(JSON.parse(localStorage.getItem("diag-en-curso")||"null"));}catch{/* nada que retomar */}},[]);
  // Responsive con CSS (clases wl-* en index.html), no con JavaScript: así el HTML prerenderizado
  // es uno solo para celular y escritorio (sin contenido duplicado para buscadores).
  // Precarga el selector de teléfono (pesado) mientras se lee la bienvenida.
  useEffect(()=>{const t=setTimeout(()=>{import("../components/PhoneField.jsx");},1500);return()=>clearTimeout(t);},[]);

  const BENEFICIOS=[
    ["🗺","Dónde se van los aspirantes","Los 7 momentos del recorrido, de un vistazo: dónde el proceso es fuerte y dónde se pierden inscriptos."],
    ["🔬","Por qué se van","Las trabas concretas que frenan a los aspirantes en cada momento."],
    ["🎯","Qué resolver primero","3 acciones por etapa, ordenadas por el impacto que tienen en la inscripción."],
    ["📈","Cuánto se puede mejorar","Elija las acciones que su equipo puede implementar y vea en tiempo real cuánto sube el puntaje."],
  ];
  const btn={width:"100%",maxWidth:420,...BTN_PRIMARY,border:"none",borderRadius:12,minHeight:TOUCH+4,padding:"14px 20px",lineHeight:1.3,textAlign:"center",fontSize:16,fontWeight:700,fontFamily:"'DM Sans',sans-serif",cursor:"pointer"};

  return(
    <div style={{minHeight:"100vh",background:NAVY_DK,display:"flex",flexDirection:"column",position:"relative"}}>
      <SiteHeader onCta={onStart}/>
      <div style={{position:"relative",flex:1,display:"flex",flexDirection:"column",overflow:"hidden"}}>
      <div style={{position:"absolute",inset:0,backgroundImage:`linear-gradient(rgba(139,148,200,.06) 1px,transparent 1px),linear-gradient(90deg,rgba(139,148,200,.06) 1px,transparent 1px)`,backgroundSize:"60px 60px"}}/>
      <div style={{position:"absolute",right:-80,top:"15%",width:400,height:400,borderRadius:"50%",background:"radial-gradient(circle, rgba(0,200,150,.08) 0%, transparent 70%)"}}/>
      <main className="wl" style={{flex:1,display:"flex",flexDirection:"column",justifyContent:"center",padding:"40px 20px 40px",position:"relative",maxWidth:680,margin:"0 auto",width:"100%"}}>
        <div className="wl-head">
          <div style={{display:"flex",alignItems:"center",gap:10,flexWrap:"wrap"}}>
            <Mono color={SLATE}>CampusLatina & CIeLatam</Mono>
            <span style={{fontFamily:"'Space Mono',monospace",fontSize:11,letterSpacing:".1em",textTransform:"uppercase",color:NAVY_DK,background:EMERALD,borderRadius:999,padding:"3px 10px",fontWeight:700}}>Gratis</span>
          </div>
          <h1 className="wl-h1" style={{fontFamily:"'DM Serif Display',serif",fontSize:"clamp(28px,5vw,48px)",color:WHITE,lineHeight:1.05,margin:"12px 0 16px"}}>
            ¿Por qué se inscriben<br/><em style={{color:EMERALD}}>menos estudiantes</em><br/>de los esperados?
          </h1>
          <p className="wl-lead" style={{fontSize:16,color:"rgba(255,255,255,.7)",lineHeight:1.7,marginBottom:28,maxWidth:480}}>
            En 10 minutos, descubra en qué momento su universidad pierde aspirantes — desde la primera búsqueda en Google hasta el primer día de clases — y qué resolver primero.
          </p>
        </div>
        {enCurso?.clave&&(
          <a href={`/d/${enCurso.clave}`} style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:12,maxWidth:420,minHeight:TOUCH,marginBottom:14,padding:"10px 16px",borderRadius:12,background:"rgba(255,255,255,.08)",border:"1px solid rgba(0,200,150,.4)",color:WHITE,textDecoration:"none",fontSize:15}}>
            <span>Tiene un diagnóstico en curso{enCurso.universidad?<> de <strong>{enCurso.universidad}</strong></>:null}</span>
            <span style={{color:EMERALD,fontWeight:700,whiteSpace:"nowrap"}}>Continuar →</span>
          </a>
        )}
        <div className="wl-cta">
          <button type="button" onClick={onStart} style={{...btn,marginBottom:32}}>Descubrir dónde se pierden inscriptos{"\u00A0"}→</button>
        </div>
        <div className="wl-ben" style={{background:"rgba(255,255,255,.05)",border:"1px solid rgba(255,255,255,.08)",borderRadius:12,padding:"20px 20px",marginBottom:24}}>
          <Mono color={EMERALD}>Lo que va a saber al terminar</Mono>
          <div className="wl-ben-grid" style={{marginTop:12,display:"flex",flexDirection:"column",gap:10}}>
            {BENEFICIOS.map(([icon,title,desc])=>(
              <div key={title} style={{display:"flex",gap:12,alignItems:"flex-start"}}>
                <span aria-hidden="true" style={{fontSize:18,flexShrink:0}}>{icon}</span>
                <div>
                  <div style={{fontSize:15,color:WHITE,fontWeight:600}}>{title}</div>
                  <div style={{fontSize:14,color:"rgba(255,255,255,.6)",lineHeight:1.5,marginTop:2}}>{desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="wl-jue" style={{background:"rgba(0,200,150,.08)",border:"1px solid rgba(0,200,150,.2)",borderRadius:10,padding:"14px 16px",marginBottom:28}}>
          <Mono color={EMERALD}>Más publicidad no alcanza</Mono>
          <p style={{fontSize:15,color:"rgba(255,255,255,.7)",lineHeight:1.65,margin:"6px 0 0"}}>
            Si el proceso pierde aspirantes en el camino, invertir en campañas es llenar un balde agujereado. Este diagnóstico muestra dónde está el agujero.
          </p>
          <p style={{fontSize:15,color:"rgba(255,255,255,.7)",lineHeight:1.65,margin:"8px 0 0"}}>
            Lo creamos en CampusLatina: ayudamos a inscribir a más de 180.000 estudiantes en Argentina, y ahora llevamos esa experiencia al resto de Latinoamérica.
          </p>
        </div>
        <div className="wl-datos" style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:10,marginBottom:28}}>
          {[["28","preguntas"],["7","etapas"],["~10 min","duración"]].map(([val,label])=>(
            <div key={label} style={{background:"rgba(255,255,255,.05)",borderRadius:10,padding:"14px 12px",textAlign:"center",border:"1px solid rgba(255,255,255,.08)"}}>
              <div style={{fontFamily:"'DM Serif Display',serif",fontSize:26,color:EMERALD,lineHeight:1}}>{val}</div>
              <Mono color={SLATE}>{label}</Mono>
            </div>
          ))}
        </div>
        <div className="wl-cta2">
          <button type="button" onClick={onStart} style={btn}>Empezar el diagnóstico{"\u00A0"}→</button>
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
    <label htmlFor={htmlFor} style={{display:"block",marginBottom:6,fontFamily:"'Space Mono',monospace",fontSize:12,letterSpacing:".1em",textTransform:"uppercase",color:NAVY,fontWeight:700,lineHeight:1.4}}>
      {label}{required&&<span aria-hidden="true" style={{color:EMERALD_TXT}}>{"\u00A0"}*</span>}
    </label>
  );
  const campo={display:"block",width:"100%",minHeight:TOUCH,padding:"11px 14px",border:"1.5px solid #8C8A93",borderRadius:8,fontSize:16,fontFamily:"'DM Sans',sans-serif",color:NAVY,background:CREAM};

  return(
    <div style={{minHeight:"100vh",background:CREAM,display:"flex",flexDirection:"column"}}>
      <div style={{background:NAVY_DK,padding:"14px 20px"}}>
        <span style={{fontFamily:"'Space Mono',monospace",fontSize:12,letterSpacing:".12em",textTransform:"uppercase",color:"rgba(255,255,255,.5)"}}>Paso 1 de 2 — Datos institucionales</span>
      </div>
      <div style={{flex:1,maxWidth:desk?1040:540,margin:"0 auto",padding:desk?"48px 32px":"36px 20px",width:"100%"}}>
        <div style={desk?{display:"grid",gridTemplateColumns:"minmax(0,1fr) minmax(0,1fr)",gridTemplateAreas:'"head dir" "intro dir" "inst dir" "inst btn"',gridTemplateRows:"auto auto 1fr auto",columnGap:32,rowGap:12,alignItems:"start"}:undefined}>
        <div style={{fontFamily:"'DM Serif Display',serif",fontSize:desk?34:24,color:NAVY,marginBottom:6,...(desk?{gridArea:"head"}:{})}}>Antes de empezar,<br/><em style={{color:EMERALD_TXT}}>cuéntenos sobre su institución</em></div>
        <p style={{fontSize:16,color:"#3A4070",marginBottom:desk?8:28,lineHeight:1.65,...(desk?{gridArea:"intro"}:{})}}>Con estos datos armamos su informe personalizado y se lo enviamos en PDF por mail. Puede pausar cuando quiera e invitar a colegas a completar las etapas que conocen mejor.</p>

        <div style={{background:WHITE,border:`1px solid ${LINE}`,borderRadius:14,padding:desk?"26px 26px":"22px 20px",marginBottom:desk?0:14,...(desk?{gridArea:"inst"}:{})}}>
          <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:16,paddingBottom:12,borderBottom:"1px solid #E8E6DF"}}>
            <div style={{width:6,height:6,borderRadius:"50%",background:EMERALD,flexShrink:0}}/>
            <span style={{fontFamily:"'Space Mono',monospace",fontSize:12,letterSpacing:".12em",textTransform:"uppercase",color:NAVY,fontWeight:700}}>Datos de la institución</span>
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

        <div style={{background:WHITE,border:`1px solid ${LINE}`,borderRadius:14,padding:desk?"26px 26px":"22px 20px",marginBottom:desk?0:24,...(desk?{gridArea:"dir"}:{})}}>
          <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:16,paddingBottom:12,borderBottom:"1px solid #E8E6DF"}}>
            <div style={{width:6,height:6,borderRadius:"50%",background:SLATE,flexShrink:0}}/>
            <span style={{fontFamily:"'Space Mono',monospace",fontSize:12,letterSpacing:".12em",textTransform:"uppercase",color:NAVY,fontWeight:700}}>Datos del directivo que responde</span>
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
                style={{...campo,borderColor:emailError?"#CC3333":"#8C8A93"}}/>
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
          style={{width:"100%",minHeight:TOUCH+4,borderRadius:10,border:"none",
            ...(valid&&!enviando?BTN_PRIMARY:BTN_DISABLED),
            fontSize:16,fontFamily:"'DM Sans',sans-serif",fontWeight:700,
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

// ── PROGRESO LATERAL (solo escritorio) ─────────────────────
const GRID_DESK={display:"grid",gridTemplateColumns:"250px minmax(0,720px)",justifyContent:"center",gap:56,width:"100%",maxWidth:1120,margin:"0 auto"};
function ConProgreso({desk,etapa,etapasScores,respondidas,children}){
  if(!desk) return children;
  const pct=Math.round((respondidas/28)*100);
  return(
    <div style={{...GRID_DESK,flex:1,padding:"40px 32px 32px"}}>
      <aside aria-label="Su avance">
        <div style={{position:"sticky",top:28}}>
          <Mono color={SLATE_TXT}>Su avance</Mono>
          <div style={{fontSize:15,color:NAVY,fontWeight:600,margin:"8px 0 8px"}}>{respondidas} de 28 respuestas</div>
          <div style={{height:6,background:LINE,borderRadius:3,marginBottom:22}}><div style={{height:"100%",width:`${pct}%`,background:EMERALD,borderRadius:3,transition:"width .4s"}}/></div>
          <ol style={{listStyle:"none",padding:0,margin:0,display:"flex",flexDirection:"column",gap:4}}>
            {ETAPAS_DATA.map(e=>{
              const current=e.num===etapa.num;
              const done=!current&&!!etapasScores&&etapasScores[e.id]>0;
              return(
                <li key={e.id} aria-current={current?"step":undefined} style={{display:"flex",alignItems:"center",gap:12,padding:"8px 10px",borderRadius:10,background:current?WHITE:"transparent",border:`1px solid ${current?LINE:"transparent"}`}}>
                  <span aria-hidden="true" style={{width:28,height:28,borderRadius:"50%",flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center",fontSize:current?15:12,fontWeight:700,fontFamily:"'Space Mono',monospace",background:current?EMERALD:done?"rgba(0,200,150,.15)":"transparent",border:`2px solid ${current?EMERALD:done?"rgba(0,122,92,.45)":"#B9B7C0"}`,color:current?NAVY_DK:done?EMERALD_TXT:MUTED}}>{done?"✓":current?e.emoji:e.num}</span>
                  <span style={{minWidth:0}}>
                    <span style={{display:"block",fontSize:14,fontWeight:current?700:500,color:current||done?NAVY:MUTED}}>{e.name}</span>
                    {current&&<span style={{display:"block",fontSize:13,color:EMERALD_TXT,marginTop:1}}>{e.pregunta}</span>}
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
function StageIntro({etapa,onStart,etapasScores,respondidas,onTablero,onInvitar}){
  const desk=useIsDesktop();
  const barra=(
    <div style={desk?{position:"sticky",bottom:0,zIndex:10,background:CREAM,padding:"16px 0 20px",marginTop:12}:{position:"sticky",bottom:0,zIndex:10,background:"rgba(245,244,240,.96)",backdropFilter:"blur(6px)",WebkitBackdropFilter:"blur(6px)",borderTop:`1px solid ${LINE}`}}>
      <div style={desk?undefined:{maxWidth:580,margin:"0 auto",padding:"10px 16px calc(10px + env(safe-area-inset-bottom))"}}>
          <button type="button" onClick={onStart} style={{width:desk?"auto":"100%",padding:desk?"0 36px":undefined,minHeight:TOUCH+4,borderRadius:10,border:"none",...BTN_PRIMARY,fontSize:16,fontFamily:"'DM Sans',sans-serif",fontWeight:700,cursor:"pointer"}}>
            Empezar etapa {etapa.num} →
          </button>
          <div style={{display:"flex",flexWrap:"wrap",justifyContent:desk?"flex-start":"center",gap:"0 18px",marginTop:4}}>
            <button type="button" onClick={onTablero} style={{minHeight:44,padding:"0 4px",border:"none",background:"none",color:NAVY,fontSize:15,fontFamily:"'DM Sans',sans-serif",textDecoration:"underline",textUnderlineOffset:3,cursor:"pointer"}}>← Ver las 7 etapas</button>
            <button type="button" onClick={onInvitar} style={{minHeight:44,padding:"0 4px",border:"none",background:"none",color:EMERALD_TXT,fontSize:15,fontWeight:600,fontFamily:"'DM Sans',sans-serif",textDecoration:"underline",textUnderlineOffset:3,cursor:"pointer"}}>Pedirle esta etapa a un colega</button>
          </div>
      </div>
    </div>
  );
  return(
    <div style={{minHeight:"100vh",background:CREAM,display:"flex",flexDirection:"column"}}>
      {/* Timeline header */}
      <div style={{background:NAVY_DK,padding:"12px 16px 12px"}}>
        {!desk&&<div aria-hidden="true" style={{display:"flex",gap:4,justifyContent:"center",marginBottom:8}}>
          {ETAPAS_DATA.map(e=>{
            const done=etapasScores&&etapasScores[e.id]>0;
            const current=e.num===etapa.num;
            return(
              <div key={e.id} style={{display:"flex",alignItems:"center",gap:4}}>
                <div style={{width:28,height:28,borderRadius:"50%",background:current?EMERALD:done?"rgba(0,200,150,.3)":"rgba(255,255,255,.1)",border:`2px solid ${current?EMERALD:done?"rgba(0,200,150,.5)":"rgba(255,255,255,.3)"}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,fontFamily:"'Space Mono',monospace",color:current?NAVY_DK:done?EMERALD:"rgba(255,255,255,.7)",fontWeight:700,flexShrink:0}}>
                  {done&&!current?"✓":e.num}
                </div>
                {e.num<7&&<div style={{width:12,height:2,background:done?"rgba(0,200,150,.4)":"rgba(255,255,255,.08)",borderRadius:1}}/>}
              </div>
            );
          })}
        </div>}
        <div style={{textAlign:"center"}}><Mono color={SLATE}>Etapa {etapa.num} de 7</Mono></div>
      </div>

      <ConProgreso desk={desk} etapa={etapa} etapasScores={etapasScores} respondidas={respondidas}>
      <div style={desk?{paddingTop:8}:{flex:1,maxWidth:580,margin:"0 auto",padding:"20px 16px 20px",width:"100%"}}>
        <div style={{display:"flex",alignItems:"center",gap:14,marginBottom:16}}>
          <div aria-hidden="true" style={{width:56,height:56,borderRadius:16,background:WHITE,border:`1px solid ${LINE}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:30,flexShrink:0}}>{etapa.emoji}</div>
          <div>
            <h1 style={{fontFamily:"'DM Serif Display',serif",fontWeight:400,fontSize:desk?38:30,color:NAVY,lineHeight:1.1,margin:0}}>{etapa.name}</h1>
            <div style={{fontSize:17,color:EMERALD_TXT,fontWeight:600,marginTop:4}}>{etapa.pregunta}</div>
          </div>
        </div>
        <div style={{background:WHITE,border:`1px solid ${LINE}`,borderRadius:14,padding:"16px 18px",marginBottom:14}}>
          <p style={{fontSize:16,color:NAVY,lineHeight:1.6,margin:0,fontWeight:500}}>{etapa.resumen}</p>
        </div>
        <p style={{display:"flex",gap:10,alignItems:"flex-start",fontSize:15,color:TEXT,lineHeight:1.55,margin:0,padding:"0 2px"}}>
          <span aria-hidden="true" style={{fontSize:18,lineHeight:1.3}}>📝</span>
          <span><strong style={{color:NAVY}}>4 preguntas.</strong> Elija la opción que describe cómo está su institución <em>hoy</em>, no cómo le gustaría que estuviera.</span>
        </p>
        {desk&&barra}
      </div>
      </ConProgreso>
      {!desk&&barra}
    </div>
  );
}

// ── QUESTION ─────────────────────────────────────────────
function Question({preguntaIdx,etapa,pregunta,selected,onSelect,onNext,onBack,isLast,esFinal,etapasScores,hechas,guardando,errorGuardar}){
  const desk=useIsDesktop();
  const barra=(
    <div style={desk?{position:"sticky",bottom:0,zIndex:10,background:CREAM,padding:"16px 0 20px",marginTop:8}:{position:"sticky",bottom:0,zIndex:10,background:"rgba(245,244,240,.96)",backdropFilter:"blur(6px)",WebkitBackdropFilter:"blur(6px)",borderTop:`1px solid ${LINE}`}}>
      <div style={desk?{display:"flex",gap:10,maxWidth:520}:{maxWidth:640,margin:"0 auto",padding:"10px 16px calc(10px + env(safe-area-inset-bottom))",display:"flex",gap:10}}>
          <button type="button" onClick={onBack} style={{minHeight:TOUCH,padding:"0 18px",borderRadius:10,border:`1px solid ${LINE}`,background:WHITE,color:NAVY,cursor:"pointer",fontSize:16,fontFamily:"'DM Sans',sans-serif"}}>← Atrás</button>
          <button type="button" onClick={()=>selected&&!guardando&&onNext()} disabled={!selected||guardando} aria-disabled={!selected||guardando}
            style={{flex:1,minHeight:TOUCH,borderRadius:10,border:"none",...(selected&&!guardando?BTN_PRIMARY:BTN_DISABLED),cursor:selected&&!guardando?"pointer":"not-allowed",fontSize:16,fontFamily:"'DM Sans',sans-serif",fontWeight:700,transition:"background .15s"}}>
            {!selected?"Elija una opción":guardando?"Guardando…":isLast?(esFinal?"Guardar y ver el diagnóstico →":"Guardar etapa →"):"Siguiente →"}
          </button>
      </div>
      {errorGuardar&&<p role="alert" style={{maxWidth:640,margin:"0 auto",padding:"0 16px 10px",fontSize:14,color:"#B3261E",textAlign:desk?"left":"center"}}>{errorGuardar}</p>}
    </div>
  );
  const globalIdx=hechas;
  const TOTAL=28;
  const pct=Math.round((globalIdx/TOTAL)*100);
  const qid=`pregunta-${etapa.id}-${preguntaIdx}`;
  return(
    <div style={{minHeight:"100vh",background:CREAM,display:"flex",flexDirection:"column"}}>
      {/* Header compacto */}
      <div style={{background:NAVY_DK}}>
        <div role="progressbar" aria-label="Progreso del diagnóstico" aria-valuemin={0} aria-valuemax={TOTAL} aria-valuenow={globalIdx+1} style={{height:4,background:"rgba(255,255,255,.08)"}}>
          <div style={{height:"100%",background:EMERALD,width:`${pct}%`,transition:"width .4s"}}/>
        </div>
        <div style={desk?{maxWidth:1120,margin:"0 auto",padding:"12px 32px"}:{maxWidth:640,margin:"0 auto",padding:"10px 16px 12px"}}>
          {!desk&&<div aria-hidden="true" style={{display:"flex",gap:3,justifyContent:"center",marginBottom:10}}>
            {ETAPAS_DATA.map(e=>{
              const done=!!etapasScores&&etapasScores[e.id]>0;
              const current=e.num===etapa.num;
              return(
                <div key={e.id} style={{display:"flex",alignItems:"center",gap:3}}>
                  <div style={{
                    width:current?30:22,height:current?30:22,borderRadius:"50%",
                    background:current?EMERALD:done?"rgba(0,200,150,.25)":"rgba(255,255,255,.08)",
                    border:`2px solid ${current?EMERALD:done?"rgba(0,200,150,.45)":"rgba(255,255,255,.18)"}`,
                    display:"flex",alignItems:"center",justifyContent:"center",
                    fontSize:current?14:11,fontFamily:"'Space Mono',monospace",
                    color:current?NAVY_DK:done?EMERALD:"rgba(255,255,255,.6)",
                    fontWeight:700,flexShrink:0,transition:"all .3s"
                  }}>
                    {done&&!current?"✓":current?e.emoji:e.num}
                  </div>
                  {e.num<7&&<div style={{width:8,height:2,background:done?"rgba(0,200,150,.35)":"rgba(255,255,255,.1)",borderRadius:1}}/>}
                </div>
              );
            })}
          </div>}
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"baseline",gap:8}}>
            <span style={{fontFamily:"'Space Mono',monospace",fontSize:12,color:EMERALD,letterSpacing:".08em",textTransform:"uppercase"}}>{etapa.name} · {preguntaIdx+1} de 4</span>
            <Mono color={SLATE}>{globalIdx+1} / {TOTAL}</Mono>
          </div>
        </div>
      </div>

      {/* Pregunta */}
      <ConProgreso desk={desk} etapa={etapa} etapasScores={etapasScores} respondidas={globalIdx}>
      <div style={desk?{paddingTop:4}:{flex:1,maxWidth:640,margin:"0 auto",padding:"22px 16px 24px",width:"100%"}}>
        <h2 id={qid} style={{fontFamily:"'DM Sans',sans-serif",fontWeight:700,fontSize:desk?26:21,color:NAVY,lineHeight:1.3,letterSpacing:"-.01em",margin:0}}>{pregunta.texto}</h2>
        {pregunta.ayuda&&<p id={`${qid}-ayuda`} style={{fontSize:15,color:MUTED,lineHeight:1.55,margin:"8px 0 0"}}>{pregunta.ayuda}</p>}
        <div style={{height:18}}/>
        <div role="radiogroup" aria-labelledby={qid} aria-describedby={pregunta.ayuda?`${qid}-ayuda`:undefined} style={{display:"flex",flexDirection:"column",gap:10}}>
          {pregunta.opciones.map(op=>{
            const isSel=selected===op.letra;
            return(
              <button key={op.letra} type="button" role="radio" aria-checked={isSel} onClick={()=>onSelect(op.letra)}
                style={{display:"flex",gap:14,alignItems:"flex-start",textAlign:"left",width:"100%",padding:"14px 16px",background:isSel?"rgba(0,200,150,.08)":WHITE,border:`2px solid ${isSel?EMERALD:LINE}`,borderRadius:12,cursor:"pointer",transition:"all .15s",fontFamily:"'DM Sans',sans-serif"}}>
                <span aria-hidden="true" style={{width:32,height:32,borderRadius:"50%",border:`2px solid ${isSel?EMERALD:"#9A98A0"}`,background:isSel?EMERALD:"transparent",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,fontFamily:"'Space Mono',monospace",fontSize:14,color:isSel?NAVY_DK:MUTED,fontWeight:700,transition:"all .15s"}}>
                  {isSel?"✓":op.letra}
                </span>
                <span style={{fontSize:16,color:isSel?NAVY:TEXT,lineHeight:1.5,paddingTop:4}}>
                  <strong style={{display:"block",color:NAVY,fontWeight:700}}>{op.etiqueta}</strong>
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
function Processing(){
  const [step,setStep]=useState(0);
  const steps=["Analizando las 7 etapas del journey...","Calculando puntajes por etapa...","Identificando fricciones en cada etapa...","Generando recomendaciones personalizadas...","Preparando su informe..."];
  useEffect(()=>{if(step<steps.length-1){const t=setTimeout(()=>setStep(s=>s+1),750);return()=>clearTimeout(t);}},[step]);
  const pct=Math.round(((step+1)/steps.length)*100);
  return(
    <div style={{minHeight:"100vh",background:NAVY_DK,display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",padding:32,position:"relative",overflow:"hidden"}}>
      <div style={{position:"absolute",inset:0,backgroundImage:`linear-gradient(rgba(139,148,200,.06) 1px,transparent 1px),linear-gradient(90deg,rgba(139,148,200,.06) 1px,transparent 1px)`,backgroundSize:"60px 60px"}}/>
      <div style={{position:"relative",textAlign:"center",maxWidth:400}}>
        <div style={{fontFamily:"'DM Serif Display',serif",fontSize:52,color:EMERALD,marginBottom:8}}>{pct}%</div>
        <div style={{height:4,background:"rgba(255,255,255,.1)",borderRadius:2,marginBottom:20,overflow:"hidden"}}>
          <div style={{height:"100%",width:`${pct}%`,background:EMERALD,borderRadius:2,transition:"width .6s"}}/>
        </div>
        <p style={{fontSize:16,color:"rgba(255,255,255,.6)",lineHeight:1.7}}>{steps[step]}</p>
      </div>
    </div>
  );
}

// ── REPORT ────────────────────────────────────────────────
function Report({registroData,respuestas,envio}){
  const [tab,setTab]=useState(0);
  const [checked,setChecked]=useState({});

  const scores={};
  ETAPAS_DATA.forEach(e=>{scores[e.id]=calcScore(respuestas,e.id);});
  const etapaScores=ETAPAS_DATA.map(e=>({...e,score:scores[e.id],nivel:getNivel(scores[e.id])}));
  const globalScore=parseFloat((Object.values(scores).reduce((a,b)=>a+b,0)/ETAPAS_DATA.length).toFixed(2));
  const globalNivel=getNivel(globalScore);
  // Potencial por etapa = puntaje actual + todas las acciones de arranque que no tiene cubiertas.
  // Es el mismo número que se ve en Acciones al marcarlas todas.
  const POT={}; ETAPAS_DATA.forEach(e=>{POT[e.id]=potencialEtapa(scores,e.id,respuestas);});
  const globalPotential=calcGlobalPotential(scores,respuestas);
  const hayMejora=r1(globalPotential)>r1(globalScore);
  const bottleneck=etapaScores.reduce((a,e)=>e.score<a.score?e:a);
  const best=etapaScores.reduce((a,e)=>e.score>a.score?e:a);

  // UNIFIED scoring: same function for both Recs and Recibir
  const calcEtapaProjected=(eid)=>projectEtapa(scores,checked,eid,respuestas);
  const projGlobal=parseFloat((ETAPAS_DATA.reduce((s,e)=>s+calcEtapaProjected(e.id),0)/ETAPAS_DATA.length).toFixed(2));
  const totalChecked=ETAPAS_DATA.reduce((n,e)=>n+recsDeEtapa(respuestas,e.id).filter(r=>!r.cubierta&&checked[`${e.id}-${r.ri}`]).length,0);
  const cubiertas=ETAPAS_DATA.reduce((n,e)=>n+recsDeEtapa(respuestas,e.id).filter(r=>r.cubierta).length,0);

  const TABS=["Resumen","Radar","Etapas","Acciones","PDF"];
  const desk=useIsDesktop();
  // En escritorio, bloques lado a lado; en celular, una columna como siempre.
  const g2=(cols,gap)=>desk?{display:"grid",gridTemplateColumns:cols,gap,alignItems:"start"}:undefined;

  // ── TAB: RESUMEN
  const TabResumen=()=>(
    <div>
      <div style={{background:NAVY_DK,padding:desk?"32px 32px 28px":"26px 20px 20px",position:"relative",overflow:"hidden",...(desk?{borderRadius:18,margin:"24px 18px 0"}:{})}}>
        <div style={{position:"absolute",inset:0,backgroundImage:`linear-gradient(rgba(139,148,200,.06) 1px,transparent 1px),linear-gradient(90deg,rgba(139,148,200,.06) 1px,transparent 1px)`,backgroundSize:"56px 56px"}}/>
        <div style={{position:"relative"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:12,marginBottom:16}}>
            <div>
              <Mono color={SLATE}>{new Date().toLocaleDateString("es-AR",{month:"long",year:"numeric"})}</Mono>
              <div style={{fontFamily:"'DM Serif Display',serif",fontSize:20,color:WHITE,marginTop:5,lineHeight:1.2}}>{registroData.universidad||"Su institución"}</div>
              <div style={{fontSize:14,color:"rgba(255,255,255,.7)",marginTop:4}}>{registroData.nombre}{registroData.cargo?` · ${registroData.cargo}`:""}{registroData.pais?` · ${registroData.pais}`:""}</div>
            </div>
            <div style={{textAlign:"right",flexShrink:0}}>
              <div style={{fontFamily:"'DM Serif Display',serif",fontSize:40,color:nd(globalScore),lineHeight:1}}>{fmt1(globalScore)}</div>
              <Mono color={SLATE}>de 5 · {globalNivel.label}</Mono>
            </div>
          </div>
          <div style={{background:"rgba(255,255,255,.06)",borderRadius:10,padding:"13px 16px",borderLeft:`3px solid ${EMERALD}`,marginBottom:14}}>
            <Mono color={EMERALD}>Qué dice su diagnóstico</Mono>
            <p style={{fontSize:15,color:"rgba(255,255,255,.7)",lineHeight:1.7,margin:"6px 0 0"}}>
              <strong style={{color:WHITE,fontWeight:500}}>{fmt1(globalScore)} de 5 · {globalNivel.label}: {NIVEL_DESC[globalNivel.label]}.</strong> {lecturaDiagnostico(globalScore,bottleneck)}
            </p>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
            <div style={{background:"rgba(255,255,255,.05)",borderRadius:8,padding:"11px 13px"}}>
              <Mono color={SLATE}>Donde mejor funciona</Mono>
              <div style={{fontSize:15,color:WHITE,fontWeight:500,marginTop:4}}>{best.name}</div>
              <div style={{fontFamily:"'DM Serif Display',serif",fontSize:20,color:nd(best.score)}}>{fmt1(best.score)}/5</div>
            </div>
            <div style={{background:"rgba(255,255,255,.05)",borderRadius:8,padding:"11px 13px",borderLeft:`3px solid ${nd(bottleneck.score)}`}}>
              <Mono color={SLATE}>Donde más inscriptos se pierden</Mono>
              <div style={{fontSize:15,color:WHITE,fontWeight:500,marginTop:4}}>{bottleneck.name}</div>
              <div style={{fontSize:13,color:"rgba(255,255,255,.5)",fontStyle:"italic"}}>{bottleneck.pregunta}</div>
              <div style={{fontFamily:"'DM Serif Display',serif",fontSize:20,color:nd(bottleneck.score)}}>{fmt1(bottleneck.score)}/5</div>
            </div>
          </div>
        </div>
      </div>
      <div style={desk?{padding:"24px 18px",display:"grid",gridTemplateColumns:"minmax(0,1.4fr) minmax(0,1fr)",gap:32,alignItems:"start"}:{padding:"16px 18px"}}>
        <div>
        <Mono color={SLATE_TXT}>El recorrido del aspirante — 7 etapas</Mono>
        <div style={{marginTop:12,display:"flex",flexDirection:"column",gap:7}}>
          {etapaScores.map((e,i)=>(
            <div key={e.id} style={{display:"flex",alignItems:"center",gap:10}}>
              <div style={{width:22,height:22,borderRadius:"50%",background:NAVY,color:EMERALD,fontFamily:"'Space Mono',monospace",fontSize:11,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>{e.emoji}</div>
              <div style={{flex:1}}>
                <div style={{display:"flex",justifyContent:"space-between",marginBottom:3}}>
                  <span style={{fontSize:14,color:NAVY,fontWeight:500}}>{e.name}</span>
                  <span style={{fontFamily:"'Space Mono',monospace",fontSize:11,color:e.nivel.color}}>{fmt1(e.score)} · {e.nivel.label}</span>
                </div>
                <div style={{height:5,background:"#E8E6DF",borderRadius:3}}>
                  <div style={{height:"100%",width:`${(e.score/5)*100}%`,background:e.nivel.color,borderRadius:3}}/>
                </div>
              </div>
              {i<etapaScores.length-1&&<span aria-hidden="true" style={{color:SLATE_TXT,fontSize:14}}>↓</span>}
            </div>
          ))}
        </div>
        </div>
        <div style={{marginTop:desk?30:16,background:CREAM,border:"1px solid #E8E6DF",borderRadius:10,padding:"13px 16px"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <div>
              <Mono color={SLATE_TXT}>Puntaje posible con todas las mejoras</Mono>
              <p style={{fontSize:14,color:"#3A4070",marginTop:3}}>Si se implementan todas las recomendaciones</p>
            </div>
            <div style={{textAlign:"right"}}>
              <div style={{fontFamily:"'DM Serif Display',serif",fontSize:24,color:"#2E7D32"}}>{fmt1(globalPotential)}</div>
              <Mono color="#2E7D32">{getNivel(globalPotential).label}</Mono>
            </div>
          </div>
          <div style={{marginTop:8,height:5,background:"#E8E6DF",borderRadius:3,position:"relative"}}>
            <div style={{height:"100%",width:`${(globalScore/5)*100}%`,background:getNivel(globalScore).color,borderRadius:3}}/>
            <div style={{position:"absolute",top:0,left:0,height:"100%",width:`${(globalPotential/5)*100}%`,background:"rgba(0,200,150,.3)",borderRadius:3,border:`1px dashed ${EMERALD}`}}/>
          </div>
          <div style={{display:"flex",justifyContent:"space-between",marginTop:3}}>
            <span style={{fontSize:13,color:getNivel(globalScore).color}}>Hoy: {fmt1(globalScore)}</span>
            <span style={{fontSize:13,color:EMERALD_TXT}}>{hayMejora?<>Potencial: {fmt1(globalPotential)} (+{fmt1(globalPotential-globalScore)} pts)</>:"Ya está en el máximo de referencia"}</span>
          </div>
        </div>
      </div>
    </div>
  );

  // ── TAB: RADAR
  const TabRadar=()=>{
    const matrix=[
      {nivel:"Avanzado",rango:"4.1–5.0",color:"#185FA5",desc:"Sistema automatizado, personalizado y en mejora continua."},
      {nivel:"Consolidado",rango:"3.1–4.0",color:"#2E7D32",desc:"Proceso definido, predecible y con métricas básicas."},
      {nivel:"En desarrollo",rango:"2.0–3.0",color:ORANGE_TXT,desc:"Hay intención pero sin sistema ni consistencia."},
      {nivel:"Inicial",rango:"1.0–1.9",color:"#CC3333",desc:"Sin proceso. Depende de personas y del azar."},
    ];
    return(
      <div style={{padding:18}}>
        <Mono color={EMERALD_TXT}>Visualización</Mono>
        <div style={{fontFamily:"'DM Serif Display',serif",fontSize:22,color:NAVY,margin:"5px 0 16px"}}>Dónde está <em style={{color:EMERALD_TXT}}>cada etapa</em></div>
        <div style={g2("minmax(0,1fr) minmax(0,1fr)",16)}>
        <div style={{background:WHITE,border:"1px solid #E8E6DF",borderRadius:14,padding:18,marginBottom:14,display:"flex",flexDirection:"column",alignItems:"center"}}>
          <RadarChart scores={scores}/>
        </div>
        {/* MATRIX */}
        <div style={{background:WHITE,border:"1px solid #E8E6DF",borderRadius:14,padding:"16px 18px"}}>
          <Mono color={SLATE_TXT}>Matriz de niveles — dónde está cada etapa</Mono>
          <div style={{marginTop:12,overflowX:"auto"}}>
            <table style={{width:"100%",borderCollapse:"collapse",fontSize:14}}>
              <thead>
                <tr>
                  <td style={{padding:"6px 8px",borderBottom:"1px solid #E8E6DF",fontFamily:"'Space Mono',monospace",fontSize:11,color:SLATE_TXT,textTransform:"uppercase",letterSpacing:".08em",minWidth:90}}>Nivel</td>
                  <td style={{padding:"6px 8px",borderBottom:"1px solid #E8E6DF",fontFamily:"'Space Mono',monospace",fontSize:11,color:SLATE_TXT,textTransform:"uppercase",letterSpacing:".08em",minWidth:60}}>Rango</td>
                  <td style={{padding:"6px 8px",borderBottom:"1px solid #E8E6DF",fontFamily:"'Space Mono',monospace",fontSize:11,color:SLATE_TXT,textTransform:"uppercase",letterSpacing:".08em"}}>Etapas en este nivel</td>
                </tr>
              </thead>
              <tbody>
                {matrix.map(m=>{
                  const etapasEnNivel=etapaScores.filter(e=>e.nivel.label===m.nivel);
                  return(
                    <tr key={m.nivel} style={{borderBottom:"1px solid #F0EEEA"}}>
                      <td style={{padding:"10px 8px"}}>
                        <span style={{display:"inline-flex",alignItems:"center",gap:6}}>
                          <div style={{width:8,height:8,borderRadius:"50%",background:m.color,flexShrink:0}}/>
                          <span style={{fontSize:14,fontWeight:600,color:m.color}}>{m.nivel}</span>
                        </span>
                      </td>
                      <td style={{padding:"10px 6px",fontFamily:"'Space Mono',monospace",fontSize:12,color:MUTED,whiteSpace:"nowrap"}}>{m.rango}</td>
                      <td style={{padding:"10px 8px"}}>
                        {etapasEnNivel.length===0
                          ?<span style={{fontSize:14,color:MUTED,fontStyle:"italic"}}>—</span>
                          :<div style={{display:"flex",flexWrap:"wrap",gap:4}}>
                            {etapasEnNivel.map(e=>(
                              <span key={e.id} style={{display:"inline-flex",alignItems:"center",gap:3,background:m.color+"15",borderRadius:5,padding:"2px 7px"}}>
                                <span style={{fontSize:13}}>{e.emoji}</span>
                                <span style={{fontSize:13,color:m.color,fontWeight:500}}>{e.name} {fmt1(e.score)}</span>
                              </span>
                            ))}
                          </div>
                        }
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
        </div>
      </div>
    );
  };

  // ── TAB: ETAPAS
  const TabEtapas=()=>{
    // Celular: acordeón. Escritorio: lista + detalle (arranca en la etapa donde más inscriptos se pierden).
    const [open,setOpen]=useState(desk?etapaScores.findIndex(e=>e.id===bottleneck.id):null);
    const cabecera=(e,activo)=>(
      <>
        <div style={{width:32,height:32,borderRadius:"50%",background:e.nivel.bg,display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,flexShrink:0}}>{e.emoji}</div>
        <div style={{flex:1,minWidth:0}}>
          <div style={{fontSize:16,fontWeight:activo&&desk?700:500,color:NAVY}}>{e.name}{!desk&&<span style={{fontWeight:400,color:MUTED,fontStyle:"italic"}}> · {e.pregunta}</span>}</div>
          <div style={{display:"flex",alignItems:"center",gap:8,marginTop:2}}>
            <div style={{height:5,width:56,background:LINE,borderRadius:3}}>
              <div style={{height:"100%",width:`${(e.score/5)*100}%`,background:e.nivel.color,borderRadius:2}}/>
            </div>
            <Mono color={e.nivel.color}>{fmt1(e.score)} · {e.nivel.label}</Mono>
          </div>
        </div>
      </>
    );
    const detalle=(e)=>(
      <>
        {/* Dos partes con título: qué le pasa al aspirante y qué mide esta etapa (antes iban en un solo párrafo). */}
        <div style={{display:"grid",gridTemplateColumns:desk?"1fr 1fr":"1fr",gap:12,paddingTop:desk?0:12,marginBottom:18}}>
          <div>
            <Mono color={SLATE_TXT}>El momento del aspirante</Mono>
            <p style={{fontSize:15,color:TEXT,lineHeight:1.65,margin:"6px 0 0"}}>{e.resumen}</p>
          </div>
          <div>
            <Mono color={SLATE_TXT}>Qué mide esta etapa</Mono>
            <p style={{fontSize:15,color:TEXT,lineHeight:1.65,margin:"6px 0 0"}}>{e.contexto}</p>
          </div>
        </div>
        <Mono color={SLATE_TXT}>Dónde se pierde valor</Mono>
        <div style={{marginTop:10,display:"flex",flexDirection:"column",gap:8}}>
          {(FRICCIONES[e.id]||[]).map((f,fi)=>(
            <div key={fi} style={{display:"flex",gap:10,padding:"10px 13px",background:CREAM,borderRadius:8}}>
              <span aria-hidden="true" style={{fontSize:16,flexShrink:0}}>{f.icon}</span>
              <p style={{fontSize:15,color:TEXT,lineHeight:1.55,margin:0}}>{f.texto}</p>
            </div>
          ))}
        </div>
        <div style={{marginTop:14,padding:"10px 14px",background:e.nivel.bg,borderRadius:8,borderLeft:`3px solid ${e.nivel.color}`,display:"flex",justifyContent:"space-between",flexWrap:"wrap",gap:8}}>
          <div>
            <Mono color={e.nivel.color}>Puntaje actual</Mono>
            <div style={{fontFamily:"'DM Serif Display',serif",fontSize:18,color:e.nivel.color,marginTop:2}}>{fmt1(e.score)}/5 · {e.nivel.label}</div>
          </div>
          <div style={{textAlign:"right"}}>
            <Mono color="#2E7D32">Potencial alcanzable</Mono>
            <div style={{fontFamily:"'DM Serif Display',serif",fontSize:18,color:"#2E7D32",marginTop:2}}>{fmt1(POT[e.id])}/5 · {getNivel(POT[e.id]).label}</div>
          </div>
        </div>
      </>
    );
    const titulo=(
      <>
        <Mono color={EMERALD_TXT}>Diagnóstico detallado</Mono>
        <div style={{fontFamily:"'DM Serif Display',serif",fontSize:22,color:NAVY,margin:"5px 0 6px"}}>Las 7 <em style={{color:EMERALD_TXT}}>etapas</em></div>
        <p style={{fontSize:15,color:MUTED,marginBottom:14,lineHeight:1.6}}>Un cuello de botella en cualquier etapa afecta todo lo que viene después.</p>
      </>
    );
    if(desk){
      const sel=etapaScores[open??0];
      return(
        <div style={{padding:18}}>
          {titulo}
          <div style={{display:"grid",gridTemplateColumns:"340px minmax(0,1fr)",gap:20,alignItems:"start"}}>
            <div role="tablist" aria-orientation="vertical" aria-label="Etapas" style={{display:"flex",flexDirection:"column",gap:8}}>
              {etapaScores.map((e,i)=>{
                const activo=(open??0)===i;
                return(
                  <button key={e.id} type="button" role="tab" aria-selected={activo} aria-controls="etapa-detalle" onClick={()=>setOpen(i)}
                    style={{display:"flex",alignItems:"center",gap:12,padding:"12px 14px",width:"100%",minHeight:TOUCH+16,background:activo?WHITE:"transparent",border:`1px solid ${activo?e.nivel.color+"66":LINE}`,borderLeft:`4px solid ${activo?e.nivel.color:"transparent"}`,borderRadius:12,textAlign:"left",cursor:"pointer",fontFamily:"'DM Sans',sans-serif"}}>
                    {cabecera(e,activo)}
                  </button>
                );
              })}
            </div>
            <section id="etapa-detalle" role="tabpanel" aria-label={sel.name} style={{background:WHITE,border:`1px solid ${sel.nivel.color}66`,borderRadius:14,padding:"22px 24px",position:"sticky",top:64}}>
              <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:14}}>
                <span aria-hidden="true" style={{fontSize:26}}>{sel.emoji}</span>
                <div>
                  <h3 style={{fontFamily:"'DM Serif Display',serif",fontWeight:400,fontSize:26,color:NAVY,margin:0,lineHeight:1.1}}>{sel.name}</h3>
                  <div style={{fontSize:15,color:EMERALD_TXT,fontWeight:600,marginTop:2}}>{sel.pregunta}</div>
                </div>
              </div>
              {detalle(sel)}
            </section>
          </div>
        </div>
      );
    }
    return(
      <div style={{padding:18}}>
        {titulo}
        {etapaScores.map((e,i)=>{
          const isOpen=open===i;
          return(
            <div key={e.id} style={{background:WHITE,border:`1px solid ${isOpen?e.nivel.color+"66":"#E8E6DF"}`,borderRadius:12,marginBottom:10,overflow:"hidden"}}>
              <button type="button" aria-expanded={isOpen} aria-controls={`etapa-${e.id}`} onClick={()=>setOpen(isOpen?null:i)}
                style={{display:"flex",alignItems:"center",gap:12,padding:"14px 16px",cursor:"pointer",width:"100%",minHeight:TOUCH+16,background:"none",border:"none",textAlign:"left",fontFamily:"'DM Sans',sans-serif"}}>
                {cabecera(e,isOpen)}
                <span aria-hidden="true" style={{color:MUTED,fontSize:18,transform:isOpen?"rotate(180deg)":"none",transition:"transform .2s"}}>▾</span>
              </button>
              {isOpen&&(
                <div id={`etapa-${e.id}`} style={{padding:"0 16px 16px",borderTop:`1px solid ${e.nivel.color}22`}}>
                  {detalle(e)}
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  // ── TAB: RECOMENDACIONES
  const TabRecs=()=>(
    <div style={{padding:18}}>
      <Mono color={EMERALD_TXT}>Plan de acción</Mono>
      <div style={{fontFamily:"'DM Serif Display',serif",fontSize:22,color:NAVY,margin:"5px 0 6px"}}>Para <em style={{color:EMERALD_TXT}}>subir de nivel</em></div>
      <p style={{fontSize:15,color:MUTED,marginBottom:14,lineHeight:1.6}}>Marque las acciones que su equipo puede implementar y vea cómo sube el puntaje en tiempo real.</p>

      <div style={{background:NAVY,borderRadius:14,padding:"16px 18px",marginBottom:16}}>
        <Mono color={SLATE}>Puntaje proyectado</Mono>
        <div style={{display:"flex",alignItems:"center",gap:10,marginTop:8,flexWrap:"wrap"}}>
          <div style={{fontFamily:"'DM Serif Display',serif",fontSize:36,color:nd(globalScore),lineHeight:1}}>{fmt1(globalScore)}</div>
          <span style={{color:SLATE,fontSize:18}}>→</span>
          <div style={{fontFamily:"'DM Serif Display',serif",fontSize:36,color:nd(projGlobal),lineHeight:1}}>{fmt1(projGlobal)}</div>
          <div>
            <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
              <span style={{fontFamily:"'Space Mono',monospace",fontSize:11,color:nd(globalScore),background:"rgba(255,255,255,.08)",padding:"2px 8px",borderRadius:8,letterSpacing:".07em",textTransform:"uppercase"}}>{globalNivel.label}</span>
              {r1(projGlobal)>r1(globalScore)&&<>
                <span style={{color:SLATE,fontSize:12}}>→</span>
                <span style={{fontFamily:"'Space Mono',monospace",fontSize:11,color:nd(projGlobal),background:"rgba(255,255,255,.08)",padding:"2px 8px",borderRadius:8,letterSpacing:".07em",textTransform:"uppercase"}}>{getNivel(projGlobal).label}</span>
              </>}
            </div>
            <Mono color={EMERALD}>{totalChecked} {totalChecked!==1?"acciones seleccionadas":"acción seleccionada"}{r1(projGlobal)>r1(globalScore)?` · +${fmt1(projGlobal-globalScore)} pts`:""}</Mono>
          </div>
        </div>
        <div style={{marginTop:12,height:7,background:"rgba(255,255,255,.1)",borderRadius:4,overflow:"hidden"}}>
          <div style={{height:"100%",display:"flex"}}>
            <div style={{width:`${(globalScore/5)*100}%`,background:nd(globalScore)}}/>
            {r1(projGlobal)>r1(globalScore)&&<div style={{width:`${((projGlobal-globalScore)/5)*100}%`,background:EMERALD}}/>}
          </div>
        </div>
        <p style={{fontSize:14,color:"rgba(255,255,255,.75)",lineHeight:1.55,margin:"12px 0 0"}}>
          Son acciones de arranque{cubiertas?` (no mostramos ${cubiertas===1?"una que ya tiene":`${cubiertas} que ya tiene`} resuelta${cubiertas===1?"":"s"})`:""}. Llegar a 5 implica tener todo el proceso automatizado y medido en las 7 etapas{registroData.target?": es lo que trabajamos en la reunión de 45 minutos.":"."}
        </p>
      </div>

      <div style={g2("minmax(0,1fr) minmax(0,1fr)",16)}>
      {etapaScores.map((e,ei)=>{
        const recs=recsDeEtapa(respuestas,e.id).filter(r=>!r.cubierta);
        const newScore=calcEtapaProjected(e.id);
        const changed=r1(newScore)>r1(e.score);
        return(
          <div key={e.id} style={{background:WHITE,border:"1px solid #E8E6DF",borderRadius:12,marginBottom:12}}>
            <div style={{padding:"12px 15px",borderBottom:"1px solid #F0EEEA",display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:8}}>
              <div style={{display:"flex",alignItems:"center",gap:8}}>
                <span style={{fontSize:16}}>{e.emoji}</span>
                <span style={{fontSize:16,fontWeight:500,color:NAVY}}>{e.name}</span>
              </div>
              <div style={{display:"flex",alignItems:"center",gap:6,flexWrap:"wrap"}}>
                <NivelPill score={e.score}/>
                {changed&&<><span style={{color:EMERALD_TXT,fontSize:14}}>→</span><NivelPill score={newScore}/><span style={{fontFamily:"'Space Mono',monospace",fontSize:11,color:EMERALD_TXT,background:"rgba(0,200,150,.1)",padding:"2px 6px",borderRadius:6}}>+{fmt1(newScore-e.score)}</span></>}
              </div>
            </div>
            <div style={{padding:"10px 15px",display:"flex",flexDirection:"column",gap:8}}>
              {!recs.length&&<p style={{margin:0,padding:"10px 2px",fontSize:15,color:TEXT,lineHeight:1.55}}>Esta etapa ya tiene las bases resueltas. El próximo salto es automatizar y medir.</p>}
              {recs.map(r=>{
                const ri=r.ri;
                const key=`${e.id}-${ri}`;
                const isCh=checked[key];
                return(
                  <button key={ri} type="button" role="checkbox" aria-checked={!!isCh} onClick={()=>setChecked(prev=>({...prev,[key]:!prev[key]}))}
                    style={{display:"flex",gap:12,alignItems:"flex-start",width:"100%",textAlign:"left",padding:"12px 14px",background:isCh?"rgba(0,200,150,.08)":CREAM,borderRadius:10,cursor:"pointer",border:`2px solid ${isCh?EMERALD:"transparent"}`,transition:"all .15s",fontFamily:"'DM Sans',sans-serif"}}>
                    <span aria-hidden="true" style={{width:24,height:24,borderRadius:6,border:`2px solid ${isCh?EMERALD:"#8C8A93"}`,background:isCh?EMERALD:WHITE,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,marginTop:1,transition:"all .15s"}}>
                      {isCh&&<span style={{color:NAVY_DK,fontSize:14,fontWeight:700}}>✓</span>}
                    </span>
                    <span style={{flex:1}}>
                      <span style={{display:"block",fontSize:15,color:TEXT,lineHeight:1.55}}>{r.texto}</span>
                      <span style={{display:"block",fontSize:12,color:isCh?EMERALD_TXT:MUTED,fontFamily:"'Space Mono',monospace",marginTop:4}}>+{fmt1(r.impacto)} pts · {r.accion}</span>
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
      </div>
    </div>
  );

  // ── TAB: INFORME PDF
  const TabRecibir=()=>{
    const [generating,setGenerating]=useState(false);
    const [done,setDone]=useState(false);
    const nivelColor=(s)=>{if(s<=1.9)return"#CC3333";if(s<=3.0)return"#E8833A";if(s<=4.0)return"#2E7D32";return"#185FA5";};
    const nivelLabel=(s)=>{if(s<=1.9)return"Inicial";if(s<=3.0)return"En desarrollo";if(s<=4.0)return"Consolidado";return"Avanzado";};

    const generatePDF=()=>{
      setGenerating(true);
      const etapasRows=etapaScores.map(e=>`
        <tr>
          <td style="padding:10px 12px;border-bottom:1px solid #E8E6DF;font-size:13px;color:#1A1F5E;font-weight:500;">${e.emoji} ${e.name}</td>
          <td style="padding:10px 12px;border-bottom:1px solid #E8E6DF;font-size:13px;color:${nivelColor(e.score)};font-weight:700;text-align:center;">${fmt1(e.score)}/5</td>
          <td style="padding:10px 12px;border-bottom:1px solid #E8E6DF;font-size:12px;color:${nivelColor(e.score)};">${nivelLabel(e.score)}</td>
          <td style="padding:10px 12px;border-bottom:1px solid #E8E6DF;font-size:12px;color:#2E7D32;">${fmt1(POT[e.id])}/5</td>
        </tr>
      `).join("");
      const etapasDetalle=etapaScores.map(e=>{
        const fricc=(FRICCIONES[e.id]||[]).map(f=>`<li style="margin-bottom:6px;color:#3A4070;font-size:13px;">${f.icon} ${f.texto}</li>`).join("");
        const recs=recsDeEtapa(respuestas,e.id).filter(r=>!r.cubierta).map((r,i)=>`<li style="margin-bottom:8px;color:#3A4070;font-size:13px;"><strong>${i+1}.</strong> ${r.texto} <span style="color:#00C896;">(+${fmt1(r.impacto)} pts)</span></li>`).join("");
        return`<div style="margin-bottom:28px;page-break-inside:avoid;"><div style="border-left:4px solid ${nivelColor(e.score)};padding-left:14px;margin-bottom:10px;"><div style="font-size:16px;font-weight:bold;color:#1A1F5E;">${e.emoji} ${e.num}. ${e.name}</div><div style="font-size:12px;color:${nivelColor(e.score)};margin-top:2px;">${fmt1(e.score)}/5 · ${nivelLabel(e.score)} → Potencial: ${fmt1(POT[e.id])}/5 · ${nivelLabel(POT[e.id])}</div></div><p style="font-size:13px;color:#3A4070;line-height:1.65;margin-bottom:6px;"><strong>El momento del aspirante:</strong> ${e.resumen}</p><p style="font-size:13px;color:#3A4070;line-height:1.65;margin-bottom:10px;"><strong>Qué mide esta etapa:</strong> ${e.contexto}</p><div style="margin-bottom:10px;"><div style="font-size:10px;font-weight:700;color:#8B94C8;letter-spacing:.1em;text-transform:uppercase;margin-bottom:5px;">Dónde se pierde valor</div><ul style="margin:0;padding-left:16px;">${fricc}</ul></div><div><div style="font-size:10px;font-weight:700;color:#8B94C8;letter-spacing:.1em;text-transform:uppercase;margin-bottom:5px;">Recomendaciones</div><ul style="margin:0;padding-left:16px;">${recs||'<li style="color:#3A4070;font-size:13px;">Esta etapa ya tiene las bases resueltas. El próximo salto es automatizar y medir.</li>'}</ul></div></div>`;
      }).join("");
      const fechaStr=new Date().toLocaleDateString("es-AR",{month:"long",year:"numeric"});
      const html=`<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"><title>Diagnóstico del proceso de inscripción — ${registroData.universidad||"Su institución"}</title><style>*{box-sizing:border-box;margin:0;padding:0;}body{font-family:Arial,Helvetica,sans-serif;color:#1A1F5E;background:white;font-size:14px;line-height:1.6;}@media print{body{-webkit-print-color-adjust:exact;print-color-adjust:exact;}}.header{background:#0E1240;color:white;padding:28px 44px;}.content{padding:32px 44px;}table{width:100%;border-collapse:collapse;}th{background:#1A1F5E;color:white;padding:9px 12px;font-size:11px;letter-spacing:.08em;text-transform:uppercase;text-align:left;}.section-title{font-size:20px;font-weight:bold;color:#1A1F5E;margin:28px 0 14px;padding-bottom:6px;border-bottom:2px solid #00C896;}.footer{background:#F5F4F0;padding:16px 44px;font-size:11px;color:#6A7090;text-align:center;border-top:1px solid #E8E6DF;margin-top:32px;}</style></head><body><div class="header"><div style="display:flex;justify-content:space-between;align-items:flex-start;"><div><div style="font-size:10px;letter-spacing:.15em;text-transform:uppercase;color:#8B94C8;margin-bottom:8px;">CampusLatina & CIeLatam & Salesforce · ${fechaStr}</div><div style="font-size:24px;font-weight:bold;color:white;line-height:1.1;margin-bottom:6px;">Diagnóstico del proceso<br/>de inscripción universitaria</div><div style="font-size:12px;color:rgba(255,255,255,.5);">${registroData.universidad||"Mi institución"}${registroData.nombre?" · "+registroData.nombre:""}${registroData.cargo?" · "+registroData.cargo:""}${registroData.pais?" · "+registroData.pais:""}</div></div><div style="text-align:right;"><div style="font-size:10px;letter-spacing:.1em;text-transform:uppercase;color:#8B94C8;margin-bottom:4px;">Puntaje global</div><div style="font-size:48px;color:#00C896;line-height:1;font-weight:bold;">${fmt1(globalScore)}</div><div style="font-size:11px;color:#00C896;text-transform:uppercase;">${globalNivel.label} · de 5</div></div></div></div><div class="content"><div style="background:#F0FBF7;border-left:4px solid #00C896;padding:14px 18px;border-radius:0 8px 8px 0;margin-bottom:28px;"><div style="font-size:10px;font-weight:700;color:#00C896;letter-spacing:.12em;text-transform:uppercase;margin-bottom:5px;">Qué dice su diagnóstico</div><p style="font-size:13px;color:#1A1F5E;line-height:1.7;"><strong>${fmt1(globalScore)} de 5 · ${globalNivel.label}: ${NIVEL_DESC[globalNivel.label]}.</strong> ${lecturaDiagnostico(globalScore,bottleneck)}</p></div><div class="section-title">Resumen por etapa</div><table><thead><tr><th>Etapa</th><th style="text-align:center;">Puntaje actual</th><th>Nivel actual</th><th>Potencial</th></tr></thead><tbody>${etapasRows}</tbody></table><div style="margin-top:10px;font-size:12px;color:#6A7090;">Puntaje global hoy: <strong style="color:#E8833A;">${fmt1(globalScore)}/5</strong> &nbsp;·&nbsp; Potencial: <strong style="color:#2E7D32;">${hayMejora?`${fmt1(globalPotential)}/5 (+${fmt1(globalPotential-globalScore)} pts)`:"ya en el máximo de referencia"}</strong></div><div class="section-title">Análisis detallado por etapa</div>${etapasDetalle}</div><div class="footer">Diagnóstico del proceso de inscripción universitaria · CampusLatina & CIeLatam & Salesforce · v1.0</div><script>window.onload=function(){setTimeout(function(){window.print();},400);}<\/script></body></html>`;
      const win=window.open("","_blank");
      if(win){win.document.write(html);win.document.close();}
      setTimeout(()=>{setGenerating(false);setDone(true);},800);
    };

    return(
      <div style={{padding:18}}>
        <Mono color={EMERALD_TXT}>Su diagnóstico</Mono>
        <div style={{fontFamily:"'DM Serif Display',serif",fontSize:22,color:NAVY,margin:"5px 0 16px"}}>Descargue el <em style={{color:EMERALD_TXT}}>informe completo</em></div>

        <div style={desk?{display:"grid",gridTemplateColumns:"minmax(0,1fr) minmax(0,1fr)",gridTemplateAreas:'"hoy mejora" "pdf mejora" "pdf bench"',gridTemplateRows:"auto auto 1fr",columnGap:16,rowGap:16,alignItems:"start"}:undefined}>
        <div style={{background:NAVY,borderRadius:14,padding:"20px 18px",marginBottom:desk?0:14,...(desk?{gridArea:"hoy"}:{})}}>
          <div style={{display:"grid",gridTemplateColumns:"1fr auto 1fr",alignItems:"center",gap:8}}>
            <div style={{textAlign:"center"}}>
              <Mono color={SLATE}>Hoy</Mono>
              <div style={{fontFamily:"'DM Serif Display',serif",fontSize:40,color:nd(globalScore),lineHeight:1,marginTop:4}}>{fmt1(globalScore)}</div>
              <Mono color={nd(globalScore)}>{globalNivel.label}</Mono>
            </div>
            <span style={{color:SLATE,fontSize:20}}>→</span>
            <div style={{textAlign:"center"}}>
              <Mono color={EMERALD}>Potencial</Mono>
              <div style={{fontFamily:"'DM Serif Display',serif",fontSize:40,color:EMERALD,lineHeight:1,marginTop:4}}>{fmt1(globalPotential)}</div>
              <Mono color={EMERALD}>{getNivel(globalPotential).label}</Mono>
            </div>
          </div>
          <p style={{fontSize:15,color:"rgba(255,255,255,.55)",textAlign:"center",marginTop:12,lineHeight:1.6}}>
            {hayMejora
              ?<>Implementando todas las recomendaciones se pueden sumar <span style={{color:EMERALD}}>+{fmt1(globalPotential-globalScore)} puntos</span>.</>
              :<>Su proceso ya está en el máximo de referencia de este diagnóstico. Las recomendaciones ayudan a sostenerlo.</>}
          </p>
          <div style={{marginTop:10,height:6,background:"rgba(255,255,255,.1)",borderRadius:3,overflow:"hidden"}}>
            <div style={{height:"100%",display:"flex"}}>
              <div style={{width:`${(globalScore/5)*100}%`,background:nd(globalScore)}}/>
              <div style={{width:`${((globalPotential-globalScore)/5)*100}%`,background:"rgba(0,200,150,.5)"}}/>
            </div>
          </div>
        </div>

        <div style={{background:WHITE,border:"1px solid #E8E6DF",borderRadius:14,padding:"16px 18px",marginBottom:desk?0:14,...(desk?{gridArea:"mejora"}:{})}}>
          <Mono color={SLATE_TXT}>Mejora proyectada por etapa</Mono>
          <div style={{marginTop:12,display:"flex",flexDirection:"column",gap:7}}>
            {[...etapaScores].sort((a,b)=>(POT[b.id]-b.score)-(POT[a.id]-a.score)).map(e=>{
              const gainN=r1(POT[e.id])-r1(e.score); const gain=fmt1(gainN);
              const n=getNivel(e.score);
              return(
                <div key={e.id} style={{display:"flex",alignItems:"center",gap:8}}>
                  <span style={{fontSize:16,flexShrink:0}}>{e.emoji}</span>
                  <div style={{flex:1}}>
                    <div style={{display:"flex",justifyContent:"space-between",marginBottom:3}}>
                      <span style={{fontSize:14,color:NAVY}}>{e.name}</span>
                      <span style={{fontFamily:"'Space Mono',monospace",fontSize:11,color:EMERALD_TXT}}>{gainN>0?`+${gain} pts`:"✓ al máximo"}</span>
                    </div>
                    <div style={{height:5,background:"#E8E6DF",borderRadius:3,position:"relative"}}>
                      <div style={{height:"100%",width:`${(e.score/5)*100}%`,background:n.color,borderRadius:3}}/>
                      <div style={{position:"absolute",top:0,left:`${(e.score/5)*100}%`,height:"100%",width:`${((POT[e.id]-e.score)/5)*100}%`,background:EMERALD+"99",borderRadius:"0 3px 3px 0"}}/>
                    </div>
                  </div>
                  <span style={{fontFamily:"'Space Mono',monospace",fontSize:12,color:EMERALD_TXT,flexShrink:0,width:30,textAlign:"right"}}>{fmt1(POT[e.id])}</span>
                </div>
              );
            })}
          </div>
        </div>

        <div style={{background:WHITE,border:"1px solid #E8E6DF",borderRadius:14,padding:"20px 18px",marginBottom:desk?0:14,...(desk?{gridArea:"pdf"}:{})}}>
          <Mono color={SLATE_TXT}>Informe completo en PDF</Mono>
          <p style={{fontSize:16,color:"#3A4070",marginTop:8,marginBottom:6,lineHeight:1.65}}>El PDF incluye el diagnóstico completo de cada etapa, las fricciones detectadas, el plan de acción y el puntaje potencial. Listo para imprimir o compartir con el equipo directivo.</p>
          <ul style={{listStyle:"none",padding:0,margin:"4px 0 18px",display:"flex",flexDirection:"column",gap:8}}>
            {[["📄","Las 7 etapas analizadas"],["🎯","Recomendaciones para cada etapa"],["🖨","Listo para imprimir o compartir"]].map(([ic,t])=>(
              <li key={t} style={{display:"flex",alignItems:"center",gap:10,fontSize:15,color:TEXT}}><span aria-hidden="true" style={{width:22,textAlign:"center"}}>{ic}</span>{t}</li>
            ))}
          </ul>
          {done?(
            <div style={{textAlign:"center",padding:"16px 0",background:"rgba(0,200,150,.06)",borderRadius:10,border:"1px solid rgba(0,200,150,.2)"}}>
              <div style={{fontSize:24,marginBottom:6}}>✅</div>
              <div style={{fontSize:16,color:EMERALD_TXT,fontWeight:600,marginBottom:4}}>¡PDF generado!</div>
              <p style={{fontSize:15,color:"#3A4070"}}>Se abrió en una nueva pestaña listo para imprimir o guardar.</p>
              <button type="button" onClick={()=>setDone(false)} style={{marginTop:12,minHeight:TOUCH,padding:"0 18px",borderRadius:10,border:`1px solid ${LINE}`,background:WHITE,color:NAVY,cursor:"pointer",fontSize:15,fontFamily:"'DM Sans',sans-serif"}}>Generar de nuevo</button>
            </div>
          ):(
            <button onClick={generatePDF} disabled={generating}
              style={{width:"100%",minHeight:TOUCH+4,borderRadius:10,border:"none",cursor:generating?"not-allowed":"pointer",...(generating?BTN_DISABLED:BTN_PRIMARY),fontSize:16,fontFamily:"'DM Sans',sans-serif",fontWeight:700,display:"flex",alignItems:"center",justifyContent:"center",gap:10}}>
              {generating?<><span>⏳</span> Generando PDF...</>:<><span>📥</span> Descargar informe en PDF</>}
            </button>
          )}
          <EnvioNota email={registroData.email} estado={envio}/>
        </div>

        <div style={{background:CREAM,border:"1px solid #E8E6DF",borderRadius:10,padding:"14px 16px",textAlign:"center",marginBottom:desk?0:14,...(desk?{gridArea:"bench"}:{})}}>
          <Mono color={SLATE_TXT}>Benchmark regional — próximamente</Mono>
          <p style={{fontSize:15,color:"#3A4070",lineHeight:1.65,marginTop:6}}>Cuando 10 o más universidades completen el diagnóstico, podrá ver cómo se compara su proceso con el de otras instituciones de LATAM.</p>
        </div>
        </div>
      </div>
    );
  };

  const TAB_COMPONENTS=[TabResumen,TabRadar,TabEtapas,TabRecs,TabRecibir];
  const CurrentTab=TAB_COMPONENTS[tab];
  const irATab=(i)=>{setTab(i);window.scrollTo(0,0);track("informe_seccion",{seccion:TABS[i]});};

  return(
    <div style={{fontFamily:"'DM Sans',sans-serif",background:CREAM,minHeight:"100vh"}}>
      <div role="tablist" aria-label="Secciones del informe" style={{position:"sticky",top:0,zIndex:100,background:NAVY_DK,display:"flex",justifyContent:"center",padding:"0 4px"}}>
        {TABS.map((t,i)=>(
          <button key={t} type="button" role="tab" aria-selected={tab===i} onClick={()=>irATab(i)}
            style={{flex:"1 1 0",maxWidth:130,minHeight:TOUCH,fontFamily:"'DM Sans',sans-serif",fontSize:14,fontWeight:tab===i?700:500,color:tab===i?EMERALD:"rgba(255,255,255,.75)",background:"none",border:"none",borderBottom:tab===i?`3px solid ${EMERALD}`:"3px solid transparent",cursor:"pointer",padding:"0 4px",whiteSpace:"nowrap"}}>{t}</button>
        ))}
      </div>
      <div style={{maxWidth:desk?1120:680,margin:"0 auto"}}><CurrentTab/></div>
      {tab===TABS.length-1&&<ContactoCTA universidad={registroData.universidad} target={registroData.target} ancho={desk?1120:680}/>}
      <div style={{maxWidth:desk?1120:680,margin:"0 auto",padding:desk?"8px 18px 20px":"8px 16px 20px",display:"grid",gridTemplateColumns:"1fr auto 1fr",alignItems:"center",gap:8}}>
        {tab>0?<button type="button" onClick={()=>irATab(tab-1)} style={{justifySelf:"start",minHeight:TOUCH,padding:"0 16px",borderRadius:10,border:`1px solid ${LINE}`,background:WHITE,color:NAVY,cursor:"pointer",fontSize:15,fontFamily:"'DM Sans',sans-serif"}}>← {TABS[tab-1]}</button>:<span/>}
        <Mono color={MUTED}>{tab+1} / {TABS.length}</Mono>
        {tab<TABS.length-1?<button type="button" onClick={()=>irATab(tab+1)} style={{justifySelf:"end",minHeight:TOUCH,padding:"0 16px",borderRadius:10,border:`1.5px solid ${NAVY}`,background:WHITE,color:NAVY,cursor:"pointer",fontSize:15,fontWeight:600,fontFamily:"'DM Sans',sans-serif"}}>{TABS[tab+1]} →</button>:<span/>}
      </div>
      <p style={{textAlign:"center",margin:0,padding:"0 16px 32px"}}><Mono color={MUTED}>CampusLatina × CIeLatam × Salesforce</Mono></p>
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

  const abrirEtapa=(i)=>{
    if(!quien){setVentana({tipo:"quien",etapa:i});return;}
    const e=ETAPAS_DATA[i];
    // Al revisar una etapa ya respondida, se parte de las respuestas guardadas.
    setBorrador(Object.fromEntries(e.preguntas.map((_,k)=>[`${e.id}_${k}`,diag.respuestas[`${e.id}_${k}`]]).filter(([,v])=>v)));
    setPos({etapa:i,pregunta:0,showIntro:true});
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
      track("etapa_completada",{etapa:e.id,numero:e.num,colega:!!invitado});
      const pendientes=ETAPAS_DATA.filter(x=>!etapaCompleta(x,d.respuestas));
      if(!pendientes.length){await finalizar();return;}
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
    {ventana?.tipo==="quien"&&<QuienVentana sugerido="" onCerrar={()=>setVentana(null)} onListo={(n)=>{guardarQuien(clave,n);setQuien(n);const i=ventana.etapa;setVentana(null);
      const e=ETAPAS_DATA[i];setBorrador(Object.fromEntries(e.preguntas.map((_,k)=>[`${e.id}_${k}`,diag.respuestas[`${e.id}_${k}`]]).filter(([,v])=>v)));setPos({etapa:i,pregunta:0,showIntro:true});setEstado("quiz");}}/>}
  </>;

  if(estado==="welcome") return <Welcome onStart={()=>{track("diagnostico_inicio");setEstado("register");}}/>;
  if(estado==="register") return <Register onNext={handleRegister}/>;
  if(estado==="cargando") return <Cargando/>;
  if(estado==="no-encontrado") return <NoEncontrado/>;
  if(estado==="error") return <Cargando texto="No pudimos cargar el diagnóstico. Revise su conexión y recargue la página."/>;
  if(estado==="processing") return <Processing/>;
  if(estado==="report") return <Report registroData={diag} respuestas={diag.respuestas} envio={envio}/>;
  if(estado==="tablero") return <>
    <Tablero diag={diag} quien={quien} misEtapas={misEtapas} aviso={aviso} onResponder={abrirEtapa}
      onInvitar={(etapas)=>setVentana({tipo:"invitar",etapas})} onCopiar={copiar}
      onFinalizar={finalizar} finalizando={finalizando} errorFinal={errorFinal}/>
    {ventanas}
  </>;

  const etapa=ETAPAS_DATA[pos.etapa];
  if(pos.showIntro) return <>
    {aviso&&<p role="status" style={{position:"fixed",top:12,left:"50%",transform:"translateX(-50%)",zIndex:150,margin:0,padding:"10px 16px",borderRadius:10,background:NAVY,color:WHITE,fontSize:15,fontWeight:600,boxShadow:"0 6px 20px rgba(14,18,64,.25)",maxWidth:"calc(100% - 32px)"}}>✓ {aviso}</p>}
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
      hechas={guardadasOtras+pos.pregunta} guardando={guardando} errorGuardar={errorGuardar}
    />
  );
}
