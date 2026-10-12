// Lógica de scoring. getNivel y calcScore son copia literal de app_diagnostico_v3.jsx.
// Este módulo no depende de React: lo usan el frontend y las Netlify Functions.
import { ORANGE_TXT } from "../theme.js";
import { ETAPAS_DATA } from "../data/etapas.js";
import { RECS } from "../data/recs.js";

// Un solo redondeo para todo el producto: los puntajes se muestran con 1 decimal
// y el nivel se asigna sobre ese mismo valor, así lo que se lee coincide con la etiqueta.
export const r1=(n)=>Math.round((Number(n)||0)*10)/10;
export const fmt1=(n)=>r1(n).toFixed(1);

export function getNivel(score){
  score=r1(score);
  if(score<=1.9) return {label:"Inicial",color:"#CC3333",bg:"#FFF0F0"};
  if(score<=3.0) return {label:"En desarrollo",color:ORANGE_TXT,bg:"#FFF3E8"};
  if(score<=4.0) return {label:"Consolidado",color:"#2E7D32",bg:"#F0FBF4"};
  return {label:"Avanzado",color:"#185FA5",bg:"#EEF2FF"};
}

export function calcScore(respuestas,etapaId){
  const e=ETAPAS_DATA.find(x=>x.id===etapaId);
  if(!e) return 0;
  const vals=e.preguntas.map((p,i)=>{const r=respuestas[`${etapaId}_${i}`];const op=p.opciones.find(o=>o.letra===r);return op?op.valor:0;}).filter(v=>v>0);
  if(!vals.length) return 0;
  return parseFloat((vals.reduce((a,b)=>a+b,0)/vals.length).toFixed(2));
}

// Promedio de las 7 etapas (misma fórmula que usaba Report).
export function calcGlobal(scores){
  return parseFloat((ETAPAS_DATA.reduce((a,e)=>a+(scores[e.id]||0),0)/ETAPAS_DATA.length).toFixed(2));
}

// Acciones de una etapa, marcando las que ya están cubiertas: la pregunta que mejora cada acción
// ya está en C o D (valor ≥ 4). Esas no se recomiendan ni suman puntos.
export function recsDeEtapa(respuestas,eid){
  const e=ETAPAS_DATA.find(x=>x.id===eid);
  return (RECS[eid]||[]).map((r,ri)=>{
    const letra=respuestas?.[`${eid}_${r.q}`];
    const valor=e?.preguntas[r.q]?.opciones.find(o=>o.letra===letra)?.valor||0;
    return {...r,ri,cubierta:valor>=4};
  });
}

// Puntaje de una etapa sumando las acciones marcadas que no estén cubiertas (tope 5).
// `checked` null = todas las pendientes. Un único cálculo para el potencial (solapas Etapas,
// Resumen, PDF) y para la proyección de la solapa Acciones: marcar todo da el potencial.
export function calcEtapaProjected(scores,checked,eid,respuestas){
  const extra=recsDeEtapa(respuestas,eid).reduce((sum,r)=>!r.cubierta&&(!checked||checked[`${eid}-${r.ri}`])?sum+r.impacto:sum,0);
  return Math.min(5,parseFloat(((scores?.[eid]||0)+extra).toFixed(2)));
}
export const potencialEtapa=(scores,eid,respuestas)=>calcEtapaProjected(scores,null,eid,respuestas);
export function calcGlobalPotential(scores,respuestas){
  return parseFloat((ETAPAS_DATA.reduce((a,e)=>a+potencialEtapa(scores,e.id,respuestas),0)/ETAPAS_DATA.length).toFixed(2));
}

// Todo lo que se persiste en Supabase a partir de las respuestas.
export function calcResultados(respuestas){
  const scores={};
  ETAPAS_DATA.forEach(e=>{scores[e.id]=calcScore(respuestas,e.id);});
  const score_global=calcGlobal(scores);
  return {scores,score_global,nivel:getNivel(score_global).label};
}

// Etapas ordenadas de peor a mejor puntaje.
export function etapasCriticas(scores){
  return ETAPAS_DATA.map(e=>({...e,score:scores[e.id]||0})).sort((a,b)=>a.score-b.score);
}

// Top 3 recomendaciones prioritarias: la de mayor impacto de cada etapa, empezando por las más
// bajas y salteando las acciones que la universidad ya tiene cubiertas.
export function topRecomendaciones(scores,n=3,respuestas){
  return etapasCriticas(scores).map(e=>{
    const rec=recsDeEtapa(respuestas,e.id).filter(r=>!r.cubierta).sort((a,b)=>b.impacto-a.impacto)[0];
    return rec&&{etapa:e,rec};
  }).filter(Boolean).slice(0,n);
}
