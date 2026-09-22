-- Fixed public GitHub source; no new API keys or client write privileges.
create extension if not exists http with schema extensions;
create extension if not exists pg_cron;
create schema if not exists quantpath_ops;
revoke all on schema quantpath_ops from public,anon,authenticated;
create table quantpath_ops.sync_runs (
 id bigint generated always as identity primary key, started_at timestamptz not null default now(),
 finished_at timestamptz, status text not null check(status in('running','success','unchanged','failed')),
 envelope_hash text, financial_hash text, company_count integer, document_count integer, error_code text
);
alter table quantpath_ops.sync_runs enable row level security;
revoke all on quantpath_ops.sync_runs from public,anon,authenticated;
create table quantpath_ops.feed_runs (
 observed_at timestamptz primary key,status text not null,succeeded integer not null,expected integer not null,
 failures jsonb not null
);
alter table quantpath_ops.feed_runs enable row level security;
revoke all on quantpath_ops.feed_runs from public,anon,authenticated;
-- Only structured SEC form metadata enters this separate continuously observed stream.
create table public.research_filing_observations (
 document_id text primary key references public.research_documents(id), symbol text not null references public.research_issuers(symbol),
 form text not null check(form in('8-K','8-K/A','10-K','10-K/A','10-Q','10-Q/A')),
 accession text not null unique check(accession ~ '^[0-9]{10}-[0-9]{2}-[0-9]{6}$'),
 items text not null, first_observed_at timestamptz not null, backfill boolean not null,
 category text not null check(category in('annual_filing','quarterly_filing','current_report')),
 classifier text not null default 'sec-form-rule-v1' check(classifier='sec-form-rule-v1')
);
alter table public.research_filing_observations enable row level security;
revoke all on public.research_filing_observations from public,anon,authenticated;
grant select on public.research_filing_observations to authenticated;
grant all on public.research_filing_observations to service_role;
create policy paid_filing_read on public.research_filing_observations for select to authenticated using(exists(select 1 from public.memberships m where m.user_id=(select auth.uid()) and m.plan in('research','pro') and m.status in('active','canceling') and m.period_start<=now() and m.period_end>now()));
create index research_observations_symbol_time on public.research_filing_observations(symbol,first_observed_at desc);
-- Alerts remain internal until separately released; these are factual rules, not AI predictions.
alter table public.research_alert_events add column release_status text not null default 'draft' check(release_status in('draft','released','withdrawn'));
create function quantpath_ops.import_research_envelope(envelope jsonb) returns jsonb
language plpgsql security invoker set search_path='' as $$
declare p jsonb; e jsonb; f jsonb; c jsonb; y jsonb; d jsonb; r jsonb; h text; n integer:=0; docs integer:=0; ticker text; id text;
begin
 if length(envelope->>'payload')>4000000 or envelope->>'sha256' !~ '^[0-9a-f]{64}$' or encode(extensions.digest(convert_to(envelope->>'payload','UTF8'),'sha256'),'hex') is distinct from envelope->>'sha256' then raise exception 'Envelope integrity check failed'; end if;
 p:=(envelope->>'payload')::jsonb; e:=p->'equities';f:=p->'feed';h:=e->>'hash';
 if p->>'version' is distinct from '1' or f->>'version' is distinct from '1' or h !~ '^[0-9a-f]{64}$' or jsonb_array_length(e->'companies')<>50 or jsonb_array_length(f->'documents')>20000 then raise exception 'Invalid coverage or schema'; end if;
 if (e->>'retrievedAt')::timestamptz>now()+interval '5 minutes' or (f->>'retrievedAt')::timestamptz>now()+interval '5 minutes' then raise exception 'Future retrieval time'; end if;
 if (select count(distinct value->>'symbol') from jsonb_array_elements(e->'companies'))<>50 then raise exception 'Duplicate issuers'; end if;
 insert into public.research_ingestions(hash,retrieved_at,as_of,source,company_count,method)
 values(h,(e->>'retrievedAt')::timestamptz,(e->>'asOf')::date,'SEC EDGAR companyfacts',50,e->>'method') on conflict do nothing;
 for c in select value from jsonb_array_elements(e->'companies') loop
  ticker:=c->>'symbol';
  if not exists(select 1 from public.research_issuers i where i.symbol=ticker and i.cik=c->>'cik') or jsonb_array_length(c->'years') not between 3 and 8 then raise exception 'Issuer or annual coverage mismatch'; end if;
  for y in select value from jsonb_array_elements(c->'years') loop
   if (y->>'end')::date-(y->>'start')::date not between 349 and 380 or (y->>'end')::date>(e->>'asOf')::date or jsonb_typeof(y->'revenue'->'value') is distinct from 'number' then raise exception 'Invalid annual period'; end if;
   insert into public.research_financial_periods(snapshot_hash,symbol,period_start,period_end,unit,facts) values(h,ticker,(y->>'start')::date,(y->>'end')::date,'USD',y) on conflict do nothing;n:=n+1;
  end loop;
 end loop;
 if (select count(*) from public.research_financial_periods where snapshot_hash=h)<>n or (select count(distinct symbol) from public.research_financial_periods where snapshot_hash=h)<>50 then raise exception 'Incomplete financial import'; end if;
 update public.research_ingestions set completed_at=coalesce(completed_at,now()) where hash=h;
 for d in select value from jsonb_array_elements(f->'documents') loop
  id:=d->>'id';ticker:=d->'symbols'->>0;
  if d->>'sourceId' is distinct from 'sec-edgar' or d->>'kind' is distinct from 'filing' or d->>'url' !~ '^https://www[.]sec[.]gov/Archives/edgar/data/[0-9]+/[0-9]+/[0-9-]+-index[.]html$' or encode(extensions.digest(convert_to(d->>'url','UTF8'),'sha256'),'hex') is distinct from id or jsonb_array_length(d->'symbols')<>1 or not exists(select 1 from public.research_issuers where symbol=ticker) then raise exception 'Invalid filing source'; end if;
  if (d->>'publishedOn')::date>current_date or (d->>'firstObservedAt')::timestamptz>now()+interval '5 minutes' then raise exception 'Future observation'; end if;
  insert into public.research_documents(id,source_id,canonical_url,title,summary,kind,published_on,published_at,event_on,retrieved_at,language,content_hash,rights_scope)
  values(id,'sec-edgar',d->>'url',d->>'title',d->'summary','filing',(d->>'publishedOn')::date,null,nullif(d->>'eventOn','')::date,(d->>'retrievedAt')::timestamptz,'en',d->>'contentHash',d->>'rightsScope') on conflict do nothing;
  insert into public.research_document_entities(document_id,symbol,method) values(id,ticker,'issuer_cik') on conflict do nothing;
  insert into public.research_filing_observations(document_id,symbol,form,accession,items,first_observed_at,backfill,category)
  values(id,ticker,d->>'form',d->>'accession',coalesce(d->>'items',''),(d->>'firstObservedAt')::timestamptz,(d->>'backfill')::boolean,case when d->>'form' like '10-K%' then 'annual_filing' when d->>'form' like '10-Q%' then 'quarterly_filing' else 'current_report' end) on conflict do nothing;
  -- Retrospective discovery never becomes a new-filing notification.
  if not (d->>'backfill')::boolean and (d->>'publishedOn')::date>=((d->>'firstObservedAt')::timestamptz at time zone 'America/New_York')::date-1 then
   insert into public.research_alert_events(symbol,rule_version,observed_at,evidence,dedup_key,severity,message)
   values(ticker,'sec-filing-observed-v1',(d->>'firstObservedAt')::timestamptz,jsonb_build_object('document_id',id,'url',d->>'url','form',d->>'form'),'sec-filing:'||id,'info',jsonb_build_object('en',ticker||' filed '||(d->>'form')||'. Review the original filing.','zh-hant',ticker||' 提交 '||(d->>'form')||'，請回查原始申報。')) on conflict do nothing;
  end if;docs:=docs+1;
 end loop;
 for r in select value from jsonb_array_elements(f->'runs') loop
  insert into quantpath_ops.feed_runs(observed_at,status,succeeded,expected,failures) values((r->>'at')::timestamptz,r->>'status',(r->>'succeeded')::integer,(r->>'expected')::integer,r->'failures') on conflict do nothing;
 end loop;
 return jsonb_build_object('financial_hash',h,'companies',50,'periods',n,'documents',docs,'envelope_hash',envelope->>'sha256');
end $$;
revoke all on function quantpath_ops.import_research_envelope(jsonb) from public,anon,authenticated;
create function quantpath_ops.sync_research_from_github() returns jsonb
language plpgsql security invoker set search_path='' as $$
declare run_id bigint;response extensions.http_response;envelope jsonb;result jsonb;
begin
 if not pg_try_advisory_xact_lock(20260922,50) then return jsonb_build_object('status','already_running');end if;
 insert into quantpath_ops.sync_runs(status) values('running') returning id into run_id;
 begin
  perform extensions.http_set_curlopt('CURLOPT_TIMEOUT_MS','20000');
  perform extensions.http_set_curlopt('CURLOPT_CONNECTTIMEOUT_MS','5000');
  select * into response from extensions.http_get('https://raw.githubusercontent.com/williesclin/personal-site-01/main/data/research-sync.json');
  if response.status<>200 or length(response.content)>5000000 then raise exception 'Source HTTP status % or invalid size',response.status;end if;
  envelope:=response.content::jsonb;
  if exists(select 1 from quantpath_ops.sync_runs where status in('success','unchanged') and envelope_hash=envelope->>'sha256') then
   update quantpath_ops.sync_runs set status='unchanged',finished_at=now(),envelope_hash=envelope->>'sha256' where id=run_id;return jsonb_build_object('status','unchanged','run_id',run_id);
  end if;
  result:=quantpath_ops.import_research_envelope(envelope);
  update quantpath_ops.sync_runs set status='success',finished_at=now(),envelope_hash=result->>'envelope_hash',financial_hash=result->>'financial_hash',company_count=(result->>'companies')::integer,document_count=(result->>'documents')::integer where id=run_id;
  return result||jsonb_build_object('status','success','run_id',run_id);
 exception when others then
  update quantpath_ops.sync_runs set status='failed',finished_at=now(),error_code=sqlstate||': '||left(sqlerrm,250) where id=run_id;
  return jsonb_build_object('status','failed','run_id',run_id,'error_code',sqlstate||': '||left(sqlerrm,250));
 end;
end $$;
revoke all on function quantpath_ops.sync_research_from_github() from public,anon,authenticated;
-- Scheduling is enabled only after the first successful import and replay check.
