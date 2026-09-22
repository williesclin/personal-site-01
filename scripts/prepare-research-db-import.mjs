// Produce reviewable SQL for the already-authorized database connection.
// No database credentials are accepted or written. Run after the validated equity workflow.
// Existing daily operations execute these batches via the verified Supabase connection.
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {validateEquities} from '../app/equity-engine.mjs';
const data=validateEquities(JSON.parse(await readFile(new URL('../data/equities.json',import.meta.url),'utf8')));
if(createHash('sha256').update(JSON.stringify(data.companies)).digest('hex')!==data.hash)throw Error('Snapshot hash mismatch');
const evidence=JSON.parse(await readFile(new URL('../data/research-evidence.json',import.meta.url),'utf8'));
const dir=process.env.QP_DB_IMPORT_DIR||'/tmp/quantpath-research-import';await mkdir(dir,{recursive:true});
const q=v=>v===null?'null':"'"+String(v).replaceAll("'","''")+"'",j=v=>q(JSON.stringify(v))+'::jsonb';
let batches=[];
batches.push(evidence.issuers.map(c=>`insert into public.research_issuers(symbol,cik,name,sector,ai_role,market,reviewed_at,evidence_url) values(${[c.symbol,c.cik,c.name,c.sector].map(q)},${j(c.aiRole)},${q(c.market)},${q(c.reviewedAt)},${q(c.evidenceURL)}) on conflict(symbol) do update set name=excluded.name,sector=excluded.sector,ai_role=excluded.ai_role,reviewed_at=excluded.reviewed_at,evidence_url=excluded.evidence_url;`).join('\n'));
batches.push(`insert into public.research_ingestions(hash,retrieved_at,as_of,source,company_count,method) values(${q(data.hash)},${q(data.retrievedAt)},${q(data.asOf)},'SEC EDGAR companyfacts',${data.companies.length},${q(data.method)}) on conflict do nothing;`);
for(const c of data.companies)batches.push(c.years.map(r=>`insert into public.research_financial_periods(snapshot_hash,symbol,period_start,period_end,unit,facts) values(${q(data.hash)},${q(c.symbol)},${q(r.start)},${q(r.end)},'USD',${j(r)}) on conflict do nothing;`).join('\n'));
batches.push(evidence.sources.map(s=>`insert into public.research_sources(id,name,kind,url,status,rights_scope,checked_at,coverage_note) values(${[s.id,s.name,s.kind,s.url,s.status,s.rightsScope,s.checkedAt].map(q)},${j(s.coverageNote)}) on conflict(id) do update set checked_at=excluded.checked_at,coverage_note=excluded.coverage_note,status=excluded.status;`).join('\n'));
batches.push(evidence.documents.map(d=>`insert into public.research_documents(id,source_id,canonical_url,title,summary,kind,published_on,published_at,event_on,retrieved_at,language,content_hash,rights_scope) values(${[d.id,d.sourceId,d.url,d.title].map(q)},${j(d.summary)},${[d.kind,d.publishedOn,d.publishedAt,d.eventOn,d.retrievedAt,d.language,d.contentHash,d.rightsScope].map(q)}) on conflict do nothing;\n`+d.symbols.map(symbol=>`insert into public.research_document_entities(document_id,symbol,method) values(${q(d.id)},${q(symbol)},${q(d.kind==='filing'?'issuer_cik':'human_reviewed')}) on conflict do nothing;`).join('\n')).join('\n'));
// Backfilled items do not become a complete historical attention series. Null is intentional.
batches.push(`insert into public.research_attention_daily(symbol,local_date,timezone,news_count,filing_count,source_count,social_mentions,coverage_status,denominator,evidence_ids) select symbol,(now() at time zone 'Asia/Taipei')::date,'Asia/Taipei',null,null,null,null,'partial','No complete observation window; historical backfill excluded','[]'::jsonb from public.research_issuers on conflict do nothing;`);
const periods=data.companies.reduce((n,c)=>n+c.years.length,0);
batches.push(`do $$ begin if (select count(*) from public.research_financial_periods where snapshot_hash=${q(data.hash)})<>${periods} or (select count(distinct symbol) from public.research_financial_periods where snapshot_hash=${q(data.hash)})<>${data.companies.length} then raise exception 'Incomplete snapshot'; end if; end $$; update public.research_ingestions set completed_at=coalesce(completed_at,now()) where hash=${q(data.hash)};`);
for(let i=0;i<batches.length;i++)await writeFile(`${dir}/${String(i).padStart(3,'0')}.sql`,'begin;\n'+batches[i]+'\ncommit;\n');
console.log(JSON.stringify({batches:batches.length,directory:dir,hash:data.hash,companies:data.companies.length}));
