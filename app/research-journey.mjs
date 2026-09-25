import {instruments} from './instrument-catalog.mjs';
import {researchCases} from './research-path-data.mjs';
export function validateJourney(j){
 if(j?.version!==1||!researchCases.some(c=>c.id===j.caseId)||!Array.isArray(j.symbols)||j.symbols.length<1||j.symbols.length>6||new Set(j.symbols).size!==j.symbols.length||j.symbols.some(s=>!instruments.some(x=>x.symbol===s))||!['annual','quarter','ttm'].includes(j.period)||!instruments.some(x=>x.type==='etf'&&x.symbol===j.benchmark)||typeof j.notes!=='string'||j.notes.length>2500)throw Error('Invalid research journey');
 return {version:1,caseId:j.caseId,symbols:[...j.symbols],period:j.period,benchmark:j.benchmark,notes:j.notes};
}
export const initialJourney=(caseId='inflation')=>{const c=researchCases.find(x=>x.id===caseId)||researchCases[0];return {version:1,caseId:c.id,symbols:[...c.symbols],period:'ttm',benchmark:'IVV',notes:''}};
export function journeyFromQuery(search){
 const p=new URLSearchParams(search),j=initialJourney(p.get('case')||'inflation');
 if(p.has('symbols'))j.symbols=p.get('symbols').split(',');if(p.has('period'))j.period=p.get('period');if(p.has('benchmark'))j.benchmark=p.get('benchmark');
 try{return validateJourney(j)}catch{return initialJourney(j.caseId)}
}
export function journeyQuery(j){const p=new URLSearchParams({case:j.caseId,symbols:j.symbols.join(','),period:j.period,benchmark:j.benchmark});return '?'+p;}
// Requires an aligned, corporate-action-adjusted total-return series and explicit rights.
export function comparableReturn(series,benchmark){
 if(!series||!benchmark||series.licensed!==true||benchmark.licensed!==true||series.kind!=='total-return'||benchmark.kind!=='total-return'||series.currency!==benchmark.currency||series.start!==benchmark.start||series.end!==benchmark.end||![series.startValue,series.endValue,benchmark.startValue,benchmark.endValue].every(x=>Number.isFinite(x)&&x>0))return null;
 const value=series.endValue/series.startValue-1,base=benchmark.endValue/benchmark.startValue-1;return {value,benchmark:base,excessPercentagePoints:(value-base)*100};
}
export function crossRates(row){return Number.isFinite(row.usdTwd)&&row.usdTwd>0&&Number.isFinite(row.usdJpy)&&row.usdJpy>0&&Number.isFinite(row.eurUsd)&&row.eurUsd>0?{...row,jpyTwd:row.usdTwd/row.usdJpy,eurTwd:row.eurUsd*row.usdTwd}:null;}
