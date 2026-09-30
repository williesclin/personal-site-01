-- Shared research evidence belongs in quantpath-research, not the member/auth database.
create table if not exists public.evidence_sources (
 id text primary key,name text not null,kind text not null check(kind in ('filing','news','social')),url text not null,status text not null,
 rights_scope text,checked_at timestamptz not null,coverage_note jsonb not null default '{}'::jsonb
);
create table if not exists public.evidence_documents (
 id text primary key,source_id text not null references public.evidence_sources(id),canonical_url text not null unique,title text not null,
 summary jsonb not null default '{}'::jsonb,kind text not null check(kind in ('filing','news')),published_on date not null,published_at timestamptz,event_on date,
 first_seen_at timestamptz not null,retrieved_at timestamptz not null,language text,content_hash text,rights_scope text
);
create table if not exists public.evidence_document_entities (
 document_id text not null references public.evidence_documents(id) on delete cascade,symbol text not null references public.ref_instruments(symbol),method text not null,
 primary key(document_id,symbol)
);
create table if not exists public.evidence_filing_observations (
 document_id text primary key references public.evidence_documents(id) on delete cascade,symbol text not null references public.ref_instruments(symbol),
 form text not null,accession text not null unique,items text,first_observed_at timestamptz not null,backfill boolean not null,category text not null,classifier text not null
);
create table if not exists public.evidence_attention_daily (
 symbol text not null references public.ref_instruments(symbol),local_date date not null,timezone text not null,news_count integer,filing_count integer,source_count integer,
 social_mentions integer,coverage_status text not null,denominator text,calculated_at timestamptz not null,evidence_ids jsonb not null default '[]'::jsonb,
 primary key(symbol,local_date)
);
create table if not exists public.research_model_runs (
 id uuid primary key,task text not null,model_version text not null,dataset_cutoff timestamptz not null,status text not null,baseline jsonb,evaluation jsonb,created_at timestamptz not null
);
create table if not exists public.research_classifications (
 document_id text not null references public.evidence_documents(id) on delete cascade,run_id uuid not null references public.research_model_runs(id) on delete cascade,
 label text not null,confidence numeric,evidence jsonb not null default '{}'::jsonb,review_status text not null,primary key(document_id,run_id,label)
);
create table if not exists public.research_alert_events (
 id uuid primary key,symbol text not null references public.ref_instruments(symbol),run_id uuid references public.research_model_runs(id),rule_version text not null,
 observed_at timestamptz not null,evidence jsonb not null default '{}'::jsonb,dedup_key text not null unique,severity text not null,message jsonb not null default '{}'::jsonb,
 delivery text not null,release_status text not null
);
alter table public.ops_dataset_status drop constraint if exists ops_dataset_status_domain_check;
alter table public.ops_dataset_status add constraint ops_dataset_status_domain_check check(domain in ('catalog','fundamental','fund','macro','fx','digital','market','lottery','evidence','model'));
do $$
declare t text;
begin
 foreach t in array array['evidence_sources','evidence_documents','evidence_document_entities','evidence_filing_observations','evidence_attention_daily','research_model_runs','research_classifications','research_alert_events']
 loop
  execute format('alter table public.%I enable row level security',t);
  execute format('revoke all on public.%I from public,anon,authenticated',t);
  execute format('grant all on public.%I to service_role',t);
  execute format('drop policy if exists deny_direct_%I on public.%I',t,t);
  execute format('create policy deny_direct_%I on public.%I for all to anon,authenticated using(false) with check(false)',t,t);
 end loop;
end $$;
