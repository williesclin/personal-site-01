import {readFile,writeFile,rename} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {COMPANIES,normalizeCompany,validateEquities} from '../app/equity-engine.mjs';
const retrievedAt=new Date().toISOString(),asOf=retrievedAt.slice(0,10),companies=[];
for(const c of COMPANIES){
 const url=`https://data.sec.gov/api/xbrl/companyfacts/CIK${c.cik}.json`;
 const r=await fetch(url,{headers:{'User-Agent':process.env.SEC_USER_AGENT||'QuantPathLabs/1.0 (+https://quantpathlabs.com)'},signal:AbortSignal.timeout(45000)});
 if(!r.ok)throw Error(`SEC ${c.symbol}: HTTP ${r.status}; previous snapshot retained`);
 companies.push(normalizeCompany(await r.json(),c,asOf));
 await new Promise(resolve=>setTimeout(resolve,1100));
}
const data={schemaVersion:1,asOf,retrievedAt,method:'annual-us-gaap-v2',companies,hash:createHash('sha256').update(JSON.stringify(companies)).digest('hex')};
validateEquities(data);
const path=new URL('../data/equities.json',import.meta.url);
let old;try{old=JSON.parse(await readFile(path,'utf8'));}catch(e){if(e.code!=='ENOENT')throw e;}
if(old)for(const c of old.companies){const next=companies.find(n=>n.symbol===c.symbol);if(next.years[0].end<c.years[0].end)throw Error('Annual coverage regressed');}
await writeFile(new URL('../data/equities.json.tmp',import.meta.url),JSON.stringify(data,null,2)+'\n');
await rename(new URL('../data/equities.json.tmp',import.meta.url),path);
console.log(companies.map(c=>`${c.symbol}: ${c.years.length} annual periods through ${c.years[0].end}`).join('\n'));
