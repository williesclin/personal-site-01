-- Versioned facts and metadata only. No member grants, billing or external delivery.
create table public.research_issuers (
 symbol text primary key check (symbol ~ '^[A-Z.]{1,12}$'),
 cik text not null unique check (cik ~ '^[0-9]{10}$'),
 name text not null, sector text not null, ai_role jsonb not null,
 market text not null default 'US-listed', reviewed_at date not null,
 evidence_url text not null check (evidence_url like 'https://www.sec.gov/Archives/%')
);
create table public.research_ingestions (
 hash text primary key check (hash ~ '^[0-9a-f]{64}$'),
 retrieved_at timestamptz not null, recorded_at timestamptz not null default now(),
 as_of date not null, source text not null, company_count integer not null check(company_count>0),
 method text not null
);
create table public.research_financial_periods (
 snapshot_hash text not null references public.research_ingestions(hash),
 symbol text not null references public.research_issuers(symbol),
 period_start date not null, period_end date not null, unit text not null check(unit='USD'),
 facts jsonb not null check(jsonb_typeof(facts)='object'),
 primary key(snapshot_hash,symbol,period_end), check(period_end>period_start)
);
create index research_periods_symbol_date on public.research_financial_periods(symbol,period_end desc);
create table public.research_sources (
 id text primary key, name text not null, kind text not null check(kind in('filing','news','social')),
 url text not null check(url like 'https://%'),
 status text not null check(status in('manual_verified','connected','not_connected','paused')),
 rights_scope text not null, checked_at timestamptz not null,
 coverage_note jsonb not null
);
create table public.research_documents (
 id text primary key check(id ~ '^[0-9a-f]{64}$'),
 source_id text not null references public.research_sources(id),
 canonical_url text not null unique check(canonical_url like 'https://%'),
 title text not null check(length(title)<=500), summary jsonb not null,
 kind text not null check(kind in('filing','news')),
 published_on date not null, published_at timestamptz,
 event_on date, first_seen_at timestamptz not null default now(), retrieved_at timestamptz not null,
 language text not null, content_hash text not null check(content_hash ~ '^[0-9a-f]{64}$'),
 rights_scope text not null, check(published_at is null or published_at::date=published_on)
);
create index research_documents_published on public.research_documents(published_on desc,id);
create index research_documents_source on public.research_documents(source_id,published_on desc);
create table public.research_document_entities (
 document_id text not null references public.research_documents(id),
 symbol text not null references public.research_issuers(symbol),
 method text not null check(method in('issuer_cik','human_reviewed')),
 primary key(document_id,symbol)
);
create index research_entities_symbol on public.research_document_entities(symbol,document_id);
create table public.research_attention_daily (
 symbol text not null references public.research_issuers(symbol), local_date date not null,
 timezone text not null check(timezone='Asia/Taipei'),
 news_count integer check(news_count>=0), filing_count integer check(filing_count>=0),
 source_count integer check(source_count>=0), social_mentions integer check(social_mentions>=0),
 coverage_status text not null check(coverage_status in('partial','complete','not_connected')),
 denominator text not null, calculated_at timestamptz not null default now(),
 evidence_ids jsonb not null check(jsonb_typeof(evidence_ids)='array'),
 primary key(symbol,local_date), check(coverage_status<>'not_connected' or news_count is null)
);
create table public.research_model_runs (
 id uuid primary key default gen_random_uuid(), task text not null,
 model_version text not null, dataset_cutoff timestamptz not null,
 status text not null check(status in('draft','evaluated','released','rejected')),
 baseline jsonb, evaluation jsonb, created_at timestamptz not null default now(),
 check(status not in('evaluated','released') or (baseline is not null and evaluation is not null))
);
create table public.research_classifications (
 document_id text not null references public.research_documents(id),
 run_id uuid not null references public.research_model_runs(id),
 label text not null, confidence numeric check(confidence between 0 and 1),
 evidence jsonb not null, review_status text not null check(review_status in('pending','accepted','rejected')),
 primary key(document_id,run_id,label)
);
create index research_classifications_run on public.research_classifications(run_id);
create table public.research_alert_events (
 id uuid primary key default gen_random_uuid(), symbol text not null references public.research_issuers(symbol),
 run_id uuid references public.research_model_runs(id), rule_version text not null,
 observed_at timestamptz not null, evidence jsonb not null,
 dedup_key text not null unique, severity text not null check(severity in('info','review')),
 message jsonb not null, delivery text not null default 'in_app' check(delivery='in_app')
);
create index research_alerts_symbol_time on public.research_alert_events(symbol,observed_at desc);
create index research_alerts_run on public.research_alert_events(run_id);

-- Each policy reads the existing service-managed subscription truth. Cancellation
-- retains access until period_end; expired, future, client metadata and admin roles do not grant access.
do $$ declare tab text; begin
 foreach tab in array array['research_issuers','research_ingestions','research_financial_periods','research_sources','research_documents','research_document_entities','research_attention_daily','research_model_runs','research_classifications','research_alert_events'] loop
  execute format('alter table public.%I enable row level security',tab);
  execute format('revoke all on public.%I from public, anon, authenticated',tab);
  execute format('grant select on public.%I to authenticated',tab);
  execute format('grant all on public.%I to service_role',tab);
  execute format('create policy paid_evidence_read on public.%I for select to authenticated using (exists (select 1 from public.memberships m where m.user_id=(select auth.uid()) and m.plan in (''research'',''pro'') and m.status in (''active'',''canceling'') and m.period_start<=now() and m.period_end>now()))',tab);
 end loop;
end $$;
-- Unreleased AI outputs must remain internal, even to subscribers.
drop policy paid_evidence_read on public.research_model_runs;
drop policy paid_evidence_read on public.research_classifications;
drop policy paid_evidence_read on public.research_alert_events;
revoke select on public.research_model_runs,public.research_classifications,public.research_alert_events from authenticated;
