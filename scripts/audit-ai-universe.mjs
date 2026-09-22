// Read-only public-source audit. Scratch output is not a published financial snapshot.
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {AI_COMPANIES} from '../app/ai-universe.mjs';
import {normalizeCompany} from '../app/equity-engine.mjs';
const dir=process.env.QP_AUDIT_DIR||'/tmp/quantpath-ai50-audit';await mkdir(dir,{recursive:true});
const ua={'User-Agent':'QuantPathLabs/1.0 (+https://quantpathlabs.com)'};
async function get(url,path){try{return JSON.parse(await readFile(path,'utf8'))}catch{}const r=await fetch(url,{headers:ua,signal:AbortSignal.timeout(45000)});if(!r.ok)throw Error(`${r.status} ${url}`);const d=await r.json();await writeFile(path,JSON.stringify(d));await new Promise(r=>setTimeout(r,1100));return d;}
const now=new Date().toISOString(),results=[];
for(const c of AI_COMPANIES){try{
 const raw=await get(`https://data.sec.gov/api/xbrl/companyfacts/CIK${c.cik}.json`,`${dir}/${c.symbol}-facts.json`);
 const normalized=normalizeCompany(raw,c,now.slice(0,10));
 const sub=await get(`https://data.sec.gov/submissions/CIK${c.cik}.json`,`${dir}/${c.symbol}-submissions.json`);
 if(!sub.tickers.includes(c.symbol))throw Error('Current ticker mismatch');
 const r=sub.filings.recent,i=r.form.indexOf('10-K');if(i<0)throw Error('No recent 10-K');
 const url=`https://www.sec.gov/Archives/edgar/data/${Number(c.cik)}/${r.accessionNumber[i].replaceAll('-','')}/${r.primaryDocument[i]}`;
 results.push({symbol:c.symbol,years:normalized.years.length,latest:normalized.years[0].end,name:sub.name,exchanges:sub.exchanges,filingDate:r.filingDate[i],filingURL:url,normalized});console.log(c.symbol,normalized.years.length,normalized.years[0].end,url);
 }catch(e){results.push({symbol:c.symbol,error:e.message});console.log('FAILED',c.symbol,e.message)}}
await writeFile(`${dir}/audit.json`,JSON.stringify({retrievedAt:now,results},null,2));
if(results.some(r=>r.error))process.exitCode=1;
