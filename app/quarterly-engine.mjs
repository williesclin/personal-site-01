import {METRICS} from './equity-engine.mjs';
const days=(a,b)=>(Date.parse(b)-Date.parse(a))/86400000+1;
const next=d=>new Date(Date.parse(d)+86400000).toISOString().slice(0,10);
const validDate=d=>typeof d==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(d)&&new Date(d).toISOString().slice(0,10)===d;
// Latest reported facts, not point-in-time observations. Derived quarters retain both inputs.
export function normalizeQuarterly(raw,company,asOf){
 if(Number(raw.cik)!==Number(company.cik))throw Error('Issuer mismatch');
 const metrics={};
 for(const [metric,tags] of Object.entries(METRICS)){
  const facts=[];
  for(const tag of tags)for(const f of raw.facts?.['us-gaap']?.[tag]?.units?.USD||[]){
   if(!['10-Q','10-Q/A','10-K','10-K/A'].includes(f.form)||!validDate(f.start)||!validDate(f.end)||!validDate(f.filed)||f.end>asOf||f.filed>asOf||!Number.isFinite(f.val)||!/^\d{10}-\d{2}-\d{6}$/.test(f.accn))continue;
   if(days(f.start,f.end)<75||days(f.start,f.end)>380)continue;
   facts.push({start:f.start,end:f.end,value:f.val,filed:f.filed,accession:f.accn,tag,form:f.form,method:'reported'});
  }
  const quarters=new Map();
  const put=f=>{const k=f.start+'/'+f.end,p=quarters.get(k);if(!p||(p.method!=='reported'&&f.method==='reported')||(p.method===f.method&&f.filed>p.filed))quarters.set(k,f)};
  for(const f of facts)if(days(f.start,f.end)>=75&&days(f.start,f.end)<=105)put(f);
  for(const f of facts){
   if(days(f.start,f.end)<150)continue;
   const candidates=facts.filter(p=>p.start===f.start&&p.end<f.end&&p.tag===f.tag&&days(next(p.end),f.end)>=75&&days(next(p.end),f.end)<=105&&p.filed<=f.filed).sort((a,b)=>Number(b.accession===f.accession)-Number(a.accession===f.accession)||b.filed.localeCompare(a.filed));
   const p=candidates[0];if(p)put({...f,start:next(p.end),value:f.value-p.value,method:'difference',inputs:[f,p]});
  }
  metrics[metric]=quarters;
 }
 const revenue=[...metrics.revenue.values()].sort((a,b)=>b.end.localeCompare(a.end)||b.filed.localeCompare(a.filed));
 const ends=new Set();const periods=[];
 for(const f of revenue){if(ends.has(f.end))continue;ends.add(f.end);periods.push({start:f.start,end:f.end,...Object.fromEntries(Object.keys(METRICS).map(k=>[k,metrics[k].get(f.start+'/'+f.end)||null]))});if(periods.length===16)break;}
 return {...company,source:`https://data.sec.gov/api/xbrl/companyfacts/CIK${company.cik}.json`,quarters:periods,ttm:trailing(periods),status:periods.length?'available':'missing'};
}
export function trailing(quarters){
 const q=quarters.slice(0,4);if(q.length!==4||q.some((x,i)=>i>0&&next(x.end)!==q[i-1].start)||days(q[3].start,q[0].end)<350||days(q[3].start,q[0].end)>380)return null;
 return {start:q[3].start,end:q[0].end,...Object.fromEntries(Object.keys(METRICS).map(k=>[k,q.every(x=>Number.isFinite(x[k]?.value))?{value:q.reduce((s,x)=>s+x[k].value,0),method:'sum-four-quarters',inputs:q.map(x=>x[k])}:null]))};
}
export function validateQuarterly(data){
 if(data?.version!==1||!validDate(data.asOf)||!Number.isFinite(Date.parse(data.retrievedAt))||!Array.isArray(data.companies))throw Error('Invalid quarterly snapshot');
 const symbols=new Set();for(const c of data.companies){if(symbols.has(c.symbol)||!Array.isArray(c.quarters))throw Error('Invalid issuer');symbols.add(c.symbol);let previous=null;for(const q of c.quarters){if(!validDate(q.start)||!validDate(q.end)||q.end>data.asOf||days(q.start,q.end)<75||days(q.start,q.end)>105||(previous&&q.end>=previous))throw Error('Invalid quarter');previous=q.end;for(const k of Object.keys(METRICS)){const f=q[k];if(f!==null&&(!f||!Number.isFinite(f.value)||f.start!==q.start||f.end!==q.end||f.filed>data.asOf))throw Error('Invalid quarterly value');}}if(JSON.stringify(c.ttm)!==JSON.stringify(trailing(c.quarters)))throw Error('Invalid TTM');}
 return data;
}
