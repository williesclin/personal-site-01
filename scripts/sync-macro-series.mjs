import {writeFile,rename} from 'node:fs/promises';

const endpoint='https://api.bls.gov/publicAPI/v2/timeseries/data/';
const now=new Date(),endYear=now.getUTCFullYear(),startYear=endYear-9;
const ids=['CUUR0000SA0','LNS14000000'];
const response=await fetch(endpoint,{
 method:'POST',
 headers:{'Content-Type':'application/json','User-Agent':'QuantPathLabs/1.0 (+https://quantpathlabs.com; official-source research)'},
 body:JSON.stringify({seriesid:ids,startyear:String(startYear),endyear:String(endYear)}),
 signal:AbortSignal.timeout(45000)
});
if(!response.ok)throw Error('BLS HTTP '+response.status);
const body=await response.json();
if(body?.status!=='REQUEST_SUCCEEDED')throw Error('BLS request failed');
const series=body?.Results?.series||body?.Results?.[0]?.series;
if(!Array.isArray(series)||series.length<2)throw Error('BLS series missing');
function monthly(id){
 const raw=series.find(s=>s.seriesID===id)?.data||[];
 const rows=raw.filter(x=>/^M(0[1-9]|1[0-2])$/.test(x.period)&&Number.isFinite(Number(x.value))).map(x=>({
  date:x.year+'-'+x.period.slice(1),
  value:Number(x.value),
  preliminary:(x.footnotes||[]).some(f=>String(f?.text||'').toLowerCase().includes('preliminary'))
 })).sort((a,b)=>a.date.localeCompare(b.date));
 if(rows.length<24)throw Error('Insufficient BLS rows for '+id);
 return rows;
}
const cpiIndex=monthly('CUUR0000SA0'),byDate=new Map(cpiIndex.map(x=>[x.date,x.value]));
const cpiYoY=cpiIndex.flatMap(x=>{
 const [y,m]=x.date.split('-'),prior=byDate.get(String(Number(y)-1)+'-'+m);
 if(!(prior>0))return [];
 return [{date:x.date,value:Number(((x.value/prior-1)*100).toFixed(4)),preliminary:x.preliminary}];
});
const unemployment=monthly('LNS14000000').map(x=>({...x,value:Number(x.value.toFixed(2))}));
if(cpiYoY.length<12||unemployment.length<24)throw Error('Derived macro coverage incomplete');
const output={
 version:1,
 retrievedAt:new Date().toISOString(),
 source:'U.S. Bureau of Labor Statistics Public Data API',
 sourceUrl:'https://api.bls.gov/publicAPI/v2/timeseries/data/',
 coverage:{startYear,endYear},
 series:[
  {id:'us-cpi',seriesId:'CUUR0000SA0',label:{en:'U.S. CPI year-over-year',zh:'美國 CPI 年增率'},unit:'%',frequency:'monthly',transformation:'12-month percent change calculated from CPI-U All Items NSA index',rows:cpiYoY},
  {id:'us-jobs',seriesId:'LNS14000000',label:{en:'U.S. unemployment rate',zh:'美國失業率'},unit:'%',frequency:'monthly',transformation:'level; seasonally adjusted',rows:unemployment}
 ]
};
const path=new URL('../data/macro-series.json',import.meta.url),tmp=new URL('../data/macro-series.json.tmp',import.meta.url);
await writeFile(tmp,JSON.stringify(output,null,2)+'\n');await rename(tmp,path);
console.log(JSON.stringify({retrievedAt:output.retrievedAt,series:output.series.map(s=>({id:s.id,rows:s.rows.length,last:s.rows.at(-1)}))}));
