// Lógica de scoring. getNivel y calcScore son copia literal de app_diagnostico_v3.jsx.
// Este módulo no depende de React: lo usan el frontend y las Netlify Functions.
import { ORANGE_TXT } from "../theme.js";
import { ETAPAS_DATA } from "../data/etapas.js";
import { RECS, SCORE_POTENTIALS } from "../data/recs.js";

export function getNivel(score){
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

export function calcGlobalPotential(){
  return parseFloat((ETAPAS_DATA.reduce((a,e)=>a+SCORE_POTENTIALS[e.id],0)/ETAPAS_DATA.length).toFixed(2));
}

// Puntaje proyectado de una etapa según las recomendaciones marcadas.
// Antes vivía dentro de Report y leía `checked` del estado; ahora lo recibe por parámetro.
export function calcEtapaProjected(scores,checked,eid){
  const recs=RECS[eid]||[];
  const extra=recs.reduce((sum,r,ri)=>checked[`${eid}-${ri}`]?sum+r.impacto:sum,0);
  return Math.min(5,parseFloat((scores[eid]+extra).toFixed(2)));
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

// Top 3 recomendaciones prioritarias: la de mayor impacto de cada una de las 3 etapas más bajas.
export function topRecomendaciones(scores,n=3){
  return etapasCriticas(scores).slice(0,n).map(e=>{
    const rec=[...(RECS[e.id]||[])].sort((a,b)=>b.impacto-a.impacto)[0];
    return {etapa:e,rec};
  });
}
