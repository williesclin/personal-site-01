import {DIMENSIONS} from './research-dimensions.mjs';
import {AI_COMPANIES,AI_SECTORS} from './ai-universe.mjs';
import {ETFS} from './etf-catalog.mjs';
import {macroIndicators} from './research-path-data.mjs';

export const MAX_COMPARE=8;
export const defaultChart=()=>({metric:'revenue',second:'netMargin',mode:'trend',sector:'all',selected:['NVDA']});
export const defaultResearchLayout=()=>({
 version:2,
 onlyWatch:false,
 amount:'10000',
 yearFrom:'all',
 yearTo:'latest',
 selectedFunds:['IVV'],
 benchmark:'VTI',
 macroIds:['us-cpi','us-rate'],
 chart:defaultChart()
});
const validAmount=value=>typeof value==='string'&&value.length<=30&&(value.trim()===''||(Number.isFinite(Number(value))&&Number(value)>=0&&Number(value)<=1e9));
const validYear=value=>value==='all'||value==='latest'||(/^\d{4}$/.test(value)&&Number(value)>=1990&&Number(value)<=2100);
function validChart(c){
 return !!c&&Object.hasOwn(DIMENSIONS,c.metric)&&Object.hasOwn(DIMENSIONS,c.second)&&['trend','bar','scatter'].includes(c.mode)&&(c.sector==='all'||Object.hasOwn(AI_SECTORS,c.sector))&&Array.isArray(c.selected)&&c.selected.length<=MAX_COMPARE&&new Set(c.selected).size===c.selected.length&&!c.selected.some(s=>!AI_COMPANIES.some(x=>x.symbol===s));
}
export function validateLayout(layout){
 if(!layout||typeof layout!=='object')throw Error('Invalid research layout');
 if(layout.version===1){
  if(typeof layout.onlyWatch!=='boolean'||!validAmount(layout.amount)||!validChart(layout.chart))throw Error('Invalid research layout');
  return {...defaultResearchLayout(),onlyWatch:layout.onlyWatch,amount:layout.amount,chart:{...layout.chart,selected:[...layout.chart.selected]}};
 }
 if(layout.version!==2||typeof layout.onlyWatch!=='boolean'||!validAmount(layout.amount)||!validYear(layout.yearFrom)||!validYear(layout.yearTo)||!validChart(layout.chart))throw Error('Invalid research layout');
 const funds=layout.selectedFunds,macros=layout.macroIds;
 if(!Array.isArray(funds)||funds.length>MAX_COMPARE||new Set(funds).size!==funds.length||funds.some(s=>!ETFS.some(f=>f.symbol===s)))throw Error('Invalid fund selection');
 if(!ETFS.some(f=>f.symbol===layout.benchmark))throw Error('Invalid benchmark');
 if(!Array.isArray(macros)||macros.length>6||new Set(macros).size!==macros.length||macros.some(id=>!macroIndicators.some(x=>x.id===id)))throw Error('Invalid macro selection');
 return {
  version:2,
  onlyWatch:layout.onlyWatch,
  amount:layout.amount,
  yearFrom:layout.yearFrom,
  yearTo:layout.yearTo,
  selectedFunds:[...funds],
  benchmark:layout.benchmark,
  macroIds:[...macros],
  chart:{metric:layout.chart.metric,second:layout.chart.second,mode:layout.chart.mode,sector:layout.chart.sector,selected:[...layout.chart.selected]}
 };
}
export const layoutForSaved=s=>s.layout?validateLayout(s.layout):defaultResearchLayout();
