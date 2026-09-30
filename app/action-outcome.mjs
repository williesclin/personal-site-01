const DATE=/^\d{4}-\d{2}-\d{2}$/;
const SYMBOL=/^[A-Z0-9.-]{1,12}$/;
const CURRENCY=/^[A-Z]{3}$/;
const clamp=(v,min,max)=>Math.max(min,Math.min(max,v));
export function validDate(value){
 return typeof value==='string'&&DATE.test(value)&&new Date(value+'T00:00:00Z').toISOString().slice(0,10)===value;
}
export function addDays(date,days){
 const d=new Date(date+'T00:00:00Z');d.setUTCDate(d.getUTCDate()+days);return d.toISOString().slice(0,10);
}
export function validateMarketImport(value,{maxRecords=5000,now=new Date()}={}){
 if(!value||typeof value!=='object'||!Array.isArray(value.records)||value.records.length<1||value.records.length>maxRecords)throw new Error('Market import requires 1–5000 records.');
 const today=new Date(now).toISOString().slice(0,10);
 const rights=value.rightsStatus==='approved'?'approved':'review_required';
 const quality=value.qualityStatus==='pending'?'pending':'verified';
 const seen=new Set();
 const records=value.records.map((raw,i)=>{
  if(!raw||typeof raw!=='object')throw new Error('Invalid market record '+(i+1));
  const symbol=String(raw.symbol||'').trim().toUpperCase(),sessionDate=String(raw.sessionDate||raw.date||'').trim();
  const adjustedClose=Number(raw.adjustedClose??raw.adjusted_close),currency=String(raw.currency||'USD').trim().toUpperCase();
  const source=String(raw.source||value.source||'').trim().slice(0,120),sourceUrl=String(raw.sourceUrl||raw.source_url||value.sourceUrl||'').trim().slice(0,1000);
  const retrievedAt=String(raw.retrievedAt||raw.retrieved_at||value.retrievedAt||new Date().toISOString());
  if(!SYMBOL.test(symbol)||!validDate(sessionDate)||!Number.isFinite(adjustedClose)||adjustedClose<=0||!CURRENCY.test(currency)||!source||!Number.isFinite(Date.parse(retrievedAt)))throw new Error('Invalid market record '+(i+1));
  if(sessionDate>today)throw new Error('Future market session is not allowed.');
  const key=symbol+'|'+sessionDate+'|'+source;if(seen.has(key))throw new Error('Duplicate market record '+key);seen.add(key);
  return {symbol,session_date:sessionDate,adjusted_close:adjustedClose,currency,source,source_url:sourceUrl||null,retrieved_at:new Date(retrievedAt).toISOString(),quality_status:quality,rights_status:rights};
 });
 return {records,rightsStatus:rights,qualityStatus:quality};
}
export function evaluateSnapshot(snapshot,marketRows,today){
 const decisionDate=snapshot.decision_date;
 if(!validDate(decisionDate)||!validDate(today))throw new Error('Invalid evaluation date');
 const horizons=(snapshot.evidence?.evaluation?.horizonsDays||[7,30,90,180]).filter(x=>Number.isInteger(x)&&x>0);
 const allRows=(marketRows||[]).filter(r=>r&&validDate(r.session_date)&&Number(r.adjusted_close)>0&&r.quality_status==='verified'&&r.rights_status==='approved').sort((a,b)=>a.session_date.localeCompare(b.session_date));
 const rows=allRows.filter(r=>r.symbol===snapshot.symbol),benchmarkSymbol=snapshot.evidence?.evaluation?.benchmarkSymbol||null,benchmarkRows=benchmarkSymbol?allRows.filter(r=>r.symbol===benchmarkSymbol):[];
 const entry=rows.find(r=>r.session_date>decisionDate),benchmarkEntry=benchmarkRows.find(r=>r.session_date>decisionDate);
 const existing=snapshot.outcome?.horizons&&typeof snapshot.outcome.horizons==='object'?snapshot.outcome.horizons:{};
 const outcome={...(snapshot.outcome||{}),method:'next-session-adjusted-close-v1',horizons:{...existing}};
 let evaluated=0;
 if(entry){
  outcome.entryDate=entry.session_date;outcome.entryAdjustedClose=Number(entry.adjusted_close);outcome.currency=entry.currency;outcome.source=entry.source;
  for(const horizon of horizons){
   const key=String(horizon);if(outcome.horizons[key])continue;
   const targetDate=addDays(decisionDate,horizon);if(targetDate>today)continue;
   const end=rows.find(r=>r.session_date>=targetDate);
   if(!end)continue;
   const rawReturn=Number(end.adjusted_close)/Number(entry.adjusted_close)-1;
   const benchmarkEnd=benchmarkEntry?benchmarkRows.find(r=>r.session_date>=targetDate):null,benchmarkReturn=benchmarkEntry&&benchmarkEnd?Number(benchmarkEnd.adjusted_close)/Number(benchmarkEntry.adjusted_close)-1:null;
   const excessReturn=benchmarkReturn==null?null:rawReturn-benchmarkReturn;
   outcome.horizons[key]={targetDate,endDate:end.session_date,endAdjustedClose:Number(end.adjusted_close),return:Number(rawReturn.toFixed(8)),benchmarkSymbol,benchmarkEntryDate:benchmarkEntry?.session_date||null,benchmarkEndDate:benchmarkEnd?.session_date||null,benchmarkReturn:benchmarkReturn==null?null:Number(benchmarkReturn.toFixed(8)),excessReturn:excessReturn==null?null:Number(excessReturn.toFixed(8))};
   evaluated++;
  }
 }
 const pending=horizons.filter(h=>!outcome.horizons[String(h)]);
 const complete=pending.length===0;
 let nextEvaluationDate=null;
 if(!complete){
  const nextH=pending[0],target=addDays(decisionDate,nextH);
  nextEvaluationDate=target<=today?addDays(today,1):target;
 }
 return {outcome,evaluated,complete,nextEvaluationDate};
}
export function signalDirection(score){
 const n=Number(score);if(!Number.isFinite(n))return 0;return n>=55?1:n<=45?-1:0;
}
export function summarizeEvaluations(snapshots,modelIds,horizons){
 const out=[];
 for(const modelId of modelIds)for(const horizon of horizons){
  const samples=[],dates=new Set(),symbols=new Set();
  for(const row of snapshots||[]){
   const result=row.outcome?.horizons?.[String(horizon)];if(!result||!Number.isFinite(Number(result.return))||!Number.isFinite(Number(result.excessReturn)))continue;
   const signal=(row.evidence?.signals||[]).find(s=>s.id===modelId&&s.available&&Number.isFinite(Number(s.score))&&['shadow','validated'].includes(s.status));
   if(!signal)continue;const direction=signalDirection(signal.score);if(!direction)continue;
   const directional=Number(result.excessReturn)*direction;samples.push(directional);dates.add(row.decision_date);symbols.add(row.symbol);
  }
  if(!samples.length)continue;
  const hit=samples.filter(v=>v>0).length/samples.length,avg=samples.reduce((a,b)=>a+b,0)/samples.length;
  out.push({modelId,horizonDays:horizon,sampleCount:samples.length,hitRate:Number(hit.toFixed(6)),avgExcessReturn:Number(avg.toFixed(8)),distinctDates:dates.size,distinctSymbols:symbols.size,benchmarkReady:true});
 }
 return out;
}
export function candidateReadiness(summaries,{minimumModels=4,minimumSamples=30,minimumDates=20,minimumSymbols=10,horizonDays=90}={}){
 const eligible=(summaries||[]).filter(s=>s.horizonDays===horizonDays&&s.sampleCount>=minimumSamples&&s.distinctDates>=minimumDates&&s.distinctSymbols>=minimumSymbols&&s.benchmarkReady===true);
 return {ready:new Set(eligible.map(x=>x.modelId)).size>=minimumModels,eligible,reason:eligible.length>=minimumModels?'Benchmark-adjusted evidence gate met.':'Candidate weights stay blocked until enough benchmark-adjusted, time-spread evidence exists.'};
}
export function releaseReadiness(rows,config){
 const summaries=(rows||[]).map(row=>{
  const details=row?.details&&typeof row.details==='object'?row.details:{};
  return {
   modelId:String(row?.model_id||details.modelId||''),
   horizonDays:Number(row?.horizon_days??details.horizonDays),
   sampleCount:Number(row?.sample_count??details.sampleCount),
   hitRate:Number(row?.hit_rate??details.hitRate),
   avgExcessReturn:Number(row?.avg_excess_return??details.avgExcessReturn),
   distinctDates:Number(details.distinctDates),
   distinctSymbols:Number(details.distinctSymbols),
   benchmarkReady:details.benchmarkReady===true
  };
 });
 return candidateReadiness(summaries,{minimumModels:Number(config?.thresholds?.minimumModels)||4,horizonDays:90});
}
