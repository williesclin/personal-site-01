export const COMPANIES = [
 {symbol:'NVDA',cik:'0001045810',name:'NVIDIA'},
 {symbol:'MSFT',cik:'0000789019',name:'Microsoft'},
 {symbol:'AMD',cik:'0000002488',name:'Advanced Micro Devices'}
];
export const METRICS={revenue:['Revenues','RevenueFromContractWithCustomerExcludingAssessedTax','SalesRevenueNet'],netIncome:['NetIncomeLoss'],operatingCashFlow:['NetCashProvidedByUsedInOperatingActivities']};
const day=d=>typeof d==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(d)&&!Number.isNaN(Date.parse(d))&&new Date(d).toISOString().slice(0,10)===d;
export function normalizeCompany(raw,company,asOf){
 if(Number(raw.cik)!==Number(company.cik)||!day(asOf))throw Error('Invalid company or cutoff');
 const series={};
 for(const [metric,tags] of Object.entries(METRICS)){
  const periods=new Map();
  for(const tag of tags){
   for(const f of raw.facts?.['us-gaap']?.[tag]?.units?.USD||[]){
    const duration=(Date.parse(f.end)-Date.parse(f.start))/86400000+1;
    if(!['10-K','10-K/A'].includes(f.form)||!day(f.start)||!day(f.end)||!day(f.filed)||duration<350||duration>380||f.end>asOf||f.filed>asOf)continue;
    if(!Number.isFinite(f.val)||!/^\d{10}-\d{2}-\d{6}$/.test(f.accn))throw Error('Invalid annual fact');
    const key=f.start+'/'+f.end,prior=periods.get(key);
    if(prior&&prior.filed===f.filed&&prior.tag===tag&&prior.value!==f.val)throw Error('Conflicting annual facts');
    if(!prior||f.filed>prior.filed)periods.set(key,{start:f.start,end:f.end,value:f.val,filed:f.filed,accession:f.accn,tag,form:f.form});
   }
  }
  series[metric]=periods;
 }
 const periods=[...series.revenue.values()].sort((a,b)=>b.end.localeCompare(a.end)).slice(0,8);
 if(periods.length<3)throw Error('Insufficient annual revenue history');
 const years=periods.map(f=>({start:f.start,end:f.end,...Object.fromEntries(Object.keys(METRICS).map(k=>[k,series[k].get(f.start+'/'+f.end)||null]))}));
 return {...company,source:`https://data.sec.gov/api/xbrl/companyfacts/CIK${company.cik}.json`,years};
}
export function ratios(row,previous){
 const rev=row?.revenue?.value,net=row?.netIncome?.value,prev=previous?.revenue?.value;
 const adjacent=row&&previous&&Math.abs((Date.parse(row.start)-Date.parse(previous.end))/86400000-1)<2;
 return {margin:Number.isFinite(net)&&rev>0?net/rev*100:null,growth:adjacent&&rev>=0&&prev>0?(rev/prev-1)*100:null};
}
export function annualFee(amount,expensePercent){return typeof amount==='number'&&Number.isFinite(amount)&&amount>=0&&amount<=1e9&&typeof expensePercent==='number'&&Number.isFinite(expensePercent)&&expensePercent>=0&&expensePercent<=100?amount*expensePercent/100:null;}
export function validateEquities(data,{preview=false}={}){
 const definitions=preview?COMPANIES.slice(0,1):COMPANIES;
 if(preview&&data?.preview!==true)throw Error("Invalid preview");
 if(data?.schemaVersion!==1||!day(data.asOf)||!Number.isFinite(Date.parse(data.retrievedAt))||!Array.isArray(data.companies)||data.companies.length!==definitions.length)throw Error('Invalid equity snapshot');
 for(const definition of definitions){const c=data.companies.find(c=>c.symbol===definition.symbol);if(!c||c.cik!==definition.cik||c.source!==`https://data.sec.gov/api/xbrl/companyfacts/CIK${definition.cik}.json`||!Array.isArray(c.years)||c.years.length<3)throw Error('Incomplete company');
 const ends=new Set();for(const r of c.years){if(!day(r.start)||!day(r.end)||r.end>data.asOf||ends.has(r.end)||!r.revenue)throw Error('Invalid period');ends.add(r.end);for(const k of Object.keys(METRICS)){const f=r[k];if(f!==null&&(!f||!Number.isFinite(f.value)||f.start!==r.start||f.end!==r.end||!day(f.filed)||f.filed>data.asOf||!METRICS[k].includes(f.tag)||!/^\d{10}-\d{2}-\d{6}$/.test(f.accession)))throw Error('Invalid metric');}}
 }
 return data;
}
export function filingURL(cik,accession){return `https://www.sec.gov/Archives/edgar/data/${Number(cik)}/${accession.replaceAll('-','')}/${accession}-index.html`;}
