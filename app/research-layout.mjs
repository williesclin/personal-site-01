import {DIMENSIONS} from './research-dimensions.mjs';
import {AI_COMPANIES,AI_SECTORS} from './ai-universe.mjs';
export const defaultChart=()=>({metric:'revenue',second:'netMargin',mode:'trend',sector:'all',selected:['NVDA']});
export function validateLayout(layout){
 if(!layout||layout.version!==1||typeof layout.onlyWatch!=='boolean'||typeof layout.amount!=='string'||!layout.amount.trim()||layout.amount.length>30||!Number.isFinite(Number(layout.amount))||Number(layout.amount)<0||Number(layout.amount)>1e9)throw Error('Invalid research layout');
 const c=layout.chart;
 if(!c||!Object.hasOwn(DIMENSIONS,c.metric)||!Object.hasOwn(DIMENSIONS,c.second)||!['trend','bar','scatter'].includes(c.mode)||!(c.sector==='all'||Object.hasOwn(AI_SECTORS,c.sector))||!Array.isArray(c.selected)||c.selected.length>5||new Set(c.selected).size!==c.selected.length||c.selected.some(s=>!AI_COMPANIES.some(x=>x.symbol===s)))throw Error('Invalid chart layout');
 return {version:1,onlyWatch:layout.onlyWatch,amount:layout.amount,chart:{metric:c.metric,second:c.second,mode:c.mode,sector:c.sector,selected:[...c.selected]}};
}
export const layoutForSaved=s=>s.layout?validateLayout(s.layout):{version:1,onlyWatch:false,amount:'10000',chart:defaultChart()};
