-- QuantPath normalized research warehouse.
-- User/auth data stays in quantpath-members. Research facts live in quantpath-research.
create table if not exists public.ref_sources (
  source_key text primary key,
  name text not null,
  category text not null check (category in ('regulator','government','issuer','protocol','market','lottery','editorial')),
  base_url text not null,
  rights_status text not null check (rights_status in ('approved','review_required','blocked')),
  refresh_cadence text,
  notes jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);
create table if not exists public.ref_instruments (
  symbol text primary key check (symbol ~ '^[A-Z0-9.-]{1,16}$'),
  name text not null,
  asset_class text not null check (asset_class in ('stock','etf','crypto','stablecoin','currency','lottery')),
  market text,currency text,sector text,instrument_group text,
  source_key text references public.ref_sources(source_key),
  metadata jsonb not null default '{}'::jsonb,
  active boolean not null default true,
  updated_at timestamptz not null default now()
);
create table if not exists public.fundamental_facts (
  symbol text not null references public.ref_instruments(symbol),
  period_type text not null check (period_type in ('annual','quarter','ttm')),
  period_start date not null,period_end date not null,metric text not null,value numeric not null,
  unit text not null default 'USD',filed_on date,accession text,source_tag text,source_form text,
  source_key text not null references public.ref_sources(source_key),
  is_derived boolean not null default false,derivation text,retrieved_at timestamptz not null,
  primary key(symbol,period_type,period_end,metric)
);
create index if not exists fundamental_facts_metric_idx on public.fundamental_facts(metric,period_end);
create index if not exists fundamental_facts_symbol_period_idx on public.fundamental_facts(symbol,period_type,period_end desc);
create table if not exists public.fund_profiles (
  symbol text primary key references public.ref_instruments(symbol),
  expense_ratio_pct numeric,benchmark text,exposure text,currency text,market text,fund_group text,
  scope jsonb not null default '{}'::jsonb,risk jsonb not null default '{}'::jsonb,fee_note jsonb not null default '{}'::jsonb,
  issuer_url text,reviewed_on date,source_key text references public.ref_sources(source_key),updated_at timestamptz not null default now()
);
create table if not exists public.macro_series (
  series_key text primary key,name_en text not null,name_zh text not null,unit text not null,frequency text not null,
  transformation text,source_key text not null references public.ref_sources(source_key),metadata jsonb not null default '{}'::jsonb,updated_at timestamptz not null default now()
);
create table if not exists public.macro_observations (
  series_key text not null references public.macro_series(series_key),observation_date date not null,value numeric not null,
  preliminary boolean not null default false,retrieved_at timestamptz not null,primary key(series_key,observation_date)
);
create index if not exists macro_observations_date_idx on public.macro_observations(observation_date desc);
create table if not exists public.fx_observations (
  source_key text not null references public.ref_sources(source_key),observation_date date not null,pair text not null,value numeric not null check(value>0),
  is_derived boolean not null default false,derivation text,retrieved_at timestamptz not null,primary key(source_key,observation_date,pair)
);
create index if not exists fx_observations_pair_date_idx on public.fx_observations(pair,observation_date desc);
create table if not exists public.digital_facts (
  symbol text not null references public.ref_instruments(symbol),observation_date date not null,metric text not null,value numeric not null,unit text not null,
  source_key text not null references public.ref_sources(source_key),status text not null check(status in ('verified','source_only','review_required')),
  retrieved_at timestamptz not null,metadata jsonb not null default '{}'::jsonb,primary key(symbol,observation_date,metric,source_key)
);
create index if not exists digital_facts_symbol_date_idx on public.digital_facts(symbol,observation_date desc);
create table if not exists public.market_prices (
  symbol text not null references public.ref_instruments(symbol),session_date date not null,
  price_type text not null check(price_type in ('close','adjusted_close','nav','reference')),value numeric not null check(value>0),
  currency text not null check(currency ~ '^[A-Z]{3}$'),source_key text not null references public.ref_sources(source_key),
  quality_status text not null check(quality_status in ('verified','pending','rejected')),
  rights_status text not null check(rights_status in ('approved','review_required','blocked')),retrieved_at timestamptz not null,
  metadata jsonb not null default '{}'::jsonb,primary key(symbol,session_date,price_type,source_key)
);
create index if not exists market_prices_symbol_date_idx on public.market_prices(symbol,session_date desc);
create table if not exists public.lottery_games (
  game_key text primary key,country text not null,name text not null,source_key text not null references public.ref_sources(source_key),
  source_url text not null,coverage_start date,coverage_end date,retrieved_at timestamptz,metadata jsonb not null default '{}'::jsonb,updated_at timestamptz not null default now()
);
create table if not exists public.lottery_draws (
  game_key text not null references public.lottery_games(game_key),draw_id text not null,draw_date date not null,numbers integer[] not null,
  special integer,multiplier integer,prizes jsonb not null default '[]'::jsonb,retrieved_at timestamptz not null,primary key(game_key,draw_id)
);
create index if not exists lottery_draws_game_date_idx on public.lottery_draws(game_key,draw_date desc);
create table if not exists public.ops_ingestion_runs (
  id bigint generated always as identity primary key,dataset_key text not null,source_key text references public.ref_sources(source_key),
  started_at timestamptz not null,completed_at timestamptz,status text not null check(status in ('success','partial','blocked','failed')),
  record_count integer not null default 0 check(record_count>=0),coverage_start date,coverage_end date,checksum text,details jsonb not null default '{}'::jsonb
);
create index if not exists ops_ingestion_runs_dataset_idx on public.ops_ingestion_runs(dataset_key,started_at desc);
create table if not exists public.ops_dataset_status (
  dataset_key text primary key,domain text not null check(domain in ('catalog','fundamental','fund','macro','fx','digital','market','lottery','model')),
  status text not null check(status in ('ready','partial','blocked','stale')),record_count bigint not null default 0,
  coverage_start date,coverage_end date,last_retrieved_at timestamptz,rights_status text,source_keys text[] not null default '{}',
  notes jsonb not null default '{}'::jsonb,updated_at timestamptz not null default now()
);
do $$
declare t text;
begin
 foreach t in array array['ref_sources','ref_instruments','fundamental_facts','fund_profiles','macro_series','macro_observations','fx_observations','digital_facts','market_prices','lottery_games','lottery_draws','ops_ingestion_runs','ops_dataset_status']
 loop
  execute format('alter table public.%I enable row level security',t);
  execute format('revoke all on public.%I from public,anon,authenticated',t);
  execute format('grant all on public.%I to service_role',t);
 end loop;
end $$;
create or replace view public.warehouse_coverage as
select dataset_key,domain,status,record_count,coverage_start,coverage_end,last_retrieved_at,rights_status,source_keys,notes,updated_at
from public.ops_dataset_status;
revoke all on public.warehouse_coverage from public,anon,authenticated;
grant select on public.warehouse_coverage to service_role;
