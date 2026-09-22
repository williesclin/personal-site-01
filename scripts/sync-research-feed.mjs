// SEC filing metadata only. No issuer article bodies, social posts or copyrighted headlines.
import {readFile,writeFile,rename} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {AI_COMPANIES} from '../app/ai-universe.mjs';
const output=new URL('../data/research-feed.json',import.meta.url);
const now=new Date(),at=now.toISOString();const previous=JSON.parse(await readFile(output,'utf8').catch(()=>'{"documents":[],"runs":[]}'));
const sha=s=>createHash('sha256').update(s).digest('hex');
const documents=new Map(previous.documents.map(d=>[d.id,d]));const failures=[];let succeeded=0;
for(const company of AI_COMPANIES){
 try{
  const response=await fetch(`https://data.sec.gov/submissions/CIK${company.cik}.json`,{headers:{'User-Agent':'QuantPath Labs research contact@quantpathlabs.com','Accept':'application/json'},signal:AbortSignal.timeout(30000)});
  if(!response.ok)throw Error(`HTTP ${response.status}`);const data=await response.json();if(String(data.cik).padStart(10,'0')!==company.cik)throw Error('CIK mismatch');
  const r=data.filings?.recent;if(!r||!Array.isArray(r.accessionNumber))throw Error('Missing filings');
  for(let i=0;i<r.accessionNumber.length;i++){
   const form=r.form[i],date=r.filingDate[i];if(!['8-K','8-K/A','10-Q','10-Q/A','10-K','10-K/A'].includes(form)||date<new Date(now.getTime()-30*86400000).toISOString().slice(0,10))continue;
   if(date>at.slice(0,10))throw Error('Future filing date');const accession=r.accessionNumber[i];if(!/^\d{10}-\d{2}-\d{6}$/.test(accession))throw Error('Accession format');
   const url=`https://www.sec.gov/Archives/edgar/data/${Number(company.cik)}/${accession.replaceAll('-','')}/${accession}-index.html`,id=sha(url);
   if(documents.has(id))continue;
   documents.set(id,{id,sourceId:'sec-edgar',url,title:`${company.name} · ${form} · ${date}`,summary:{en:`SEC ${form} filing by ${company.name}. Read the original filing before drawing conclusions.`, 'zh-hant':`${company.name} 向 SEC 提交 ${form} 申報。請回查原始文件後再作判斷。`},kind:'filing',publishedOn:date,publishedAt:null,eventOn:r.reportDate[i]||null,retrievedAt:at,firstObservedAt:at,backfill:!previous.startedAt,language:'en',contentHash:sha(`${accession}|${form}|${date}`),rightsScope:'SEC public filing metadata and original links only; no filing body redistribution',symbols:[company.symbol],form,items:r.items?.[i]||'',accession,acceptedAt:r.acceptanceDateTime?.[i]||null});
  }
  succeeded++;
 }catch(e){failures.push({symbol:company.symbol,error:String(e.message).slice(0,180)})}
 await new Promise(r=>setTimeout(r,1100));
}
const run={at,succeeded,expected:AI_COMPANIES.length,status:failures.length?'partial':'success',failures};
// Keep prior observations on errors; never substitute 0 or erase history.
const feed={version:1,startedAt:previous.startedAt||at,retrievedAt:at,coverage:'SEC filing metadata for 50 US-listed issuers; rolling 30-day discovery, retained observations; not global news or social attention',socialStatus:'not_connected',newsStatus:'rights_review',documents:[...documents.values()].sort((a,b)=>b.publishedOn.localeCompare(a.publishedOn)),runs:[run,...previous.runs].slice(0,120)};
await writeFile(new URL('../data/research-feed.next.json',import.meta.url),JSON.stringify(feed,null,2)+'\n');await rename(new URL('../data/research-feed.next.json',import.meta.url),output);
console.log(JSON.stringify({status:run.status,succeeded,documents:documents.size,failures}));if(succeeded===0)process.exitCode=1;
