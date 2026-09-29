export const ACTION_MODEL_LIBRARY=[
 {id:'fundamental',label:{en:'Fundamental',zh:'基本面'},purpose:{en:'Annual/TTM growth, margins and cash-flow quality',zh:'年度／TTM 成長、利潤率與現金流品質'}},
 {id:'valuation',label:{en:'Valuation',zh:'估值'},purpose:{en:'Relative and historical valuation',zh:'相對與歷史估值'}},
 {id:'momentum',label:{en:'Momentum',zh:'動能'},purpose:{en:'Price trend and relative strength',zh:'價格趨勢與相對強弱'}},
 {id:'event',label:{en:'Event',zh:'事件'},purpose:{en:'Filings, earnings and material news',zh:'申報、財報與重大事件'}},
 {id:'macro',label:{en:'Macro',zh:'總經'},purpose:{en:'Rates, inflation, FX and regime context',zh:'利率、通膨、匯率與市場環境'}},
 {id:'risk',label:{en:'Risk',zh:'風險'},purpose:{en:'Volatility, drawdown and concentration',zh:'波動、回撤與集中度'}}
];
export const ACTION_STATES=['add-review','hold','trim-review','exit-review','watch','opportunity','no-action'];
export const DEFAULT_ACTION_CONFIG={
 version:1,
 mode:'shadow',
 updatedAt:'2026-09-29T00:00:00Z',
 note:'Initial action-intelligence architecture. Shadow only until multi-model evidence and outcome validation are connected.',
 thresholds:{minimumModels:4,minimumConfidence:70,addReview:72,trimReview:38},
 evaluation:{horizonsDays:[7,30,90,180],benchmark:'asset-appropriate',transactionCosts:false},
 models:[
  {id:'fundamental',weight:22,enabled:true,status:'shadow'},
  {id:'valuation',weight:16,enabled:true,status:'draft'},
  {id:'momentum',weight:20,enabled:true,status:'draft'},
  {id:'event',weight:16,enabled:true,status:'draft'},
  {id:'macro',weight:12,enabled:true,status:'draft'},
  {id:'risk',weight:14,enabled:true,status:'draft'}
 ]
};
const clamp=(v,min,max)=>Math.max(min,Math.min(max,v));
function number(v){return typeof v==='number'&&Number.isFinite(v)?v:null}
export function normalizeActionConfig(value){
 const source=value&&typeof value==='object'?value:{},models=Array.isArray(source.models)?source.models:[];
 const allowed=new Set(ACTION_MODEL_LIBRARY.map(x=>x.id)),seen=new Set();
 const nextModels=models.filter(m=>m&&allowed.has(m.id)&&!seen.has(m.id)&&(seen.add(m.id),true)).map(m=>({
  id:m.id,weight:clamp(Math.round(Number(m.weight)||0),0,100),enabled:m.enabled!==false,status:['draft','shadow','validated'].includes(m.status)?m.status:'draft'
 }));
 for(const d of DEFAULT_ACTION_CONFIG.models)if(!seen.has(d.id))nextModels.push({...d});
 const th=source.thresholds||{},evaluation=source.evaluation||{};
 const next={
  version:Number.isInteger(source.version)&&source.version>0?source.version:1,
  mode:['shadow','released'].includes(source.mode)?source.mode:'shadow',
  updatedAt:typeof source.updatedAt==='string'?source.updatedAt:new Date().toISOString(),
  note:typeof source.note==='string'?source.note.slice(0,1000):'',
  thresholds:{
   minimumModels:clamp(Math.round(Number(th.minimumModels)||4),2,6),
   minimumConfidence:clamp(Math.round(Number(th.minimumConfidence)||70),50,95),
   addReview:clamp(Math.round(Number(th.addReview)||72),55,95),
   trimReview:clamp(Math.round(Number(th.trimReview)||38),5,45)
  },
  evaluation:{
   horizonsDays:Array.isArray(evaluation.horizonsDays)?evaluation.horizonsDays.filter(x=>[7,30,90,180,365].includes(Number(x))).map(Number).slice(0,5):[7,30,90,180],
   benchmark:typeof evaluation.benchmark==='string'&&evaluation.benchmark.length<=80?evaluation.benchmark:'asset-appropriate',
   transactionCosts:evaluation.transactionCosts===true
  },
  models:nextModels
 };
 if(next.mode==='released'){
  const enabled=next.models.filter(m=>m.enabled);
  if(enabled.length<next.thresholds.minimumModels||enabled.some(m=>m.status!=='validated'))throw new Error('Released mode requires the minimum enabled models to be validated.');
 }
 return next;
}
function metricValue(row,key){return number(row?.[key]?.value)}
function pct(a,b){return a!=null&&b!=null&&b!==0?(a-b)/Math.abs(b):null}
function fundamentalSignal(company){
 const latest=company?.years?.[0],prior=company?.years?.[1];
 if(!latest||!prior)return {available:false,score:null,reasons:['Insufficient annual periods']};
 const rev=metricValue(latest,'revenue'),prevRev=metricValue(prior,'revenue');
 const income=metricValue(latest,'netIncome'),cash=metricValue(latest,'operatingCashFlow'),prevCash=metricValue(prior,'operatingCashFlow');
 const growth=pct(rev,prevRev),margin=rev&&income!=null?income/rev:null,cashGrowth=pct(cash,prevCash);
 if(growth==null&&margin==null&&cashGrowth==null)return {available:false,score:null,reasons:['Required financial facts unavailable']};
 let score=50;const reasons=[];
 if(growth!=null){score+=clamp(growth*100, -25, 25);reasons.push(`Revenue YoY ${(growth*100).toFixed(1)}%`);}
 if(margin!=null){score+=clamp(margin*35,-12,18);reasons.push(`Net margin ${(margin*100).toFixed(1)}%`);}
 if(cashGrowth!=null){score+=clamp(cashGrowth*45,-15,15);reasons.push(`Operating cash flow YoY ${(cashGrowth*100).toFixed(1)}%`);}
 return {available:true,score:Math.round(clamp(score,0,100)),reasons};
}
export function buildActionReview({watchlist=[],companies=[],config=DEFAULT_ACTION_CONFIG,retrievedAt=null}={}){
 const cfg=normalizeActionConfig(config),companyMap=new Map(companies.map(c=>[c.symbol,c]));
 const enabled=cfg.models.filter(m=>m.enabled),rows=[];
 for(const symbol of watchlist){
  const company=companyMap.get(symbol),fund=fundamentalSignal(company);
  const signals=enabled.map(m=>m.id==='fundamental'
   ?{id:m.id,available:fund.available,score:fund.score,weight:m.weight,status:m.status,reasons:fund.reasons}
   :{id:m.id,available:false,score:null,weight:m.weight,status:m.status,reasons:['Model input or validated model output is not connected yet.']});
  const available=signals.filter(s=>s.available&&s.score!=null&&s.status==='validated');
  const weightTotal=available.reduce((n,s)=>n+s.weight,0);
  const score=weightTotal?Math.round(available.reduce((n,s)=>n+s.score*s.weight,0)/weightTotal):null;
  const confidence=Math.round(available.length/Math.max(1,enabled.length)*100);
  const enough=available.length>=cfg.thresholds.minimumModels&&confidence>=cfg.thresholds.minimumConfidence&&score!=null;
  let action='no-action';
  if(cfg.mode==='released'&&enough)action=score>=cfg.thresholds.addReview?'add-review':score<=cfg.thresholds.trimReview?'trim-review':'hold';
  rows.push({symbol,covered:!!company,action,score,confidence,enoughEvidence:enough,availableModels:available.length,totalModels:enabled.length,signals,
   nextStep:!company?'Add a verified instrument data source.':available.length<cfg.thresholds.minimumModels?'Connect and validate more model dimensions.':'Review the evidence and model agreement before any portfolio decision.'});
 }
 return {
  generatedAt:new Date().toISOString(),retrievedAt,mode:cfg.mode,configVersion:cfg.version,thresholds:cfg.thresholds,
  outcomeTracking:{ready:false,reason:'Price/total-return history and realized portfolio actions are not yet connected to the evaluation loop.'},
  rows
 };
}
