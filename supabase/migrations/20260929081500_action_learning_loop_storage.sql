-- Daily Action Intelligence learning loop.
-- Research project only; direct anon/authenticated access remains denied.
alter table public.action_outcomes
  add column if not exists decision_date date,
  add column if not exists next_evaluation_date date,
  add column if not exists evaluation_complete boolean not null default false;

update public.action_outcomes
set decision_date = (generated_at at time zone 'UTC')::date
where decision_date is null;

alter table public.action_outcomes alter column decision_date set not null;

create unique index if not exists action_outcomes_symbol_day_config_uidx
  on public.action_outcomes(symbol, decision_date, config_version);

create table if not exists public.action_market_observations (
  symbol text not null check (symbol ~ '^[A-Z0-9.-]{1,12}$'),
  session_date date not null,
  adjusted_close numeric not null check (adjusted_close > 0),
  currency text not null check (currency ~ '^[A-Z]{3}$'),
  source text not null check (char_length(source) between 1 and 120),
  source_url text,
  retrieved_at timestamptz not null,
  quality_status text not null default 'verified' check (quality_status in ('verified','pending','rejected')),
  rights_status text not null default 'review_required' check (rights_status in ('approved','review_required','blocked')),
  imported_at timestamptz not null default now(),
  primary key(symbol, session_date, source)
);
create index if not exists action_market_observations_lookup_idx on public.action_market_observations(symbol,session_date);

create table if not exists public.action_daily_runs (
  run_date date primary key,
  run_at timestamptz not null default now(),
  snapshot_count integer not null default 0 check (snapshot_count >= 0),
  evaluated_count integer not null default 0 check (evaluated_count >= 0),
  candidate_count integer not null default 0 check (candidate_count >= 0),
  status text not null check (status in ('success','partial','blocked','failed')),
  details jsonb not null default '{}'::jsonb
);

create table if not exists public.action_model_candidates (
  id bigint generated always as identity primary key,
  base_config_version integer not null,
  proposed_config jsonb not null check (jsonb_typeof(proposed_config)='object'),
  metrics jsonb not null default '{}'::jsonb,
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  created_at timestamptz not null default now(),
  reviewed_at timestamptz,
  reviewed_by text
);

alter table public.action_market_observations enable row level security;
alter table public.action_daily_runs enable row level security;
alter table public.action_model_candidates enable row level security;
revoke all on public.action_market_observations from public,anon,authenticated;
revoke all on public.action_daily_runs from public,anon,authenticated;
revoke all on public.action_model_candidates from public,anon,authenticated;
grant all on public.action_market_observations to service_role;
grant all on public.action_daily_runs to service_role;
grant all on public.action_model_candidates to service_role;

drop policy if exists deny_direct_action_model_configs on public.action_model_configs;
create policy deny_direct_action_model_configs on public.action_model_configs for all to anon,authenticated using(false) with check(false);
drop policy if exists deny_direct_action_outcomes on public.action_outcomes;
create policy deny_direct_action_outcomes on public.action_outcomes for all to anon,authenticated using(false) with check(false);
drop policy if exists deny_direct_action_model_evaluations on public.action_model_evaluations;
create policy deny_direct_action_model_evaluations on public.action_model_evaluations for all to anon,authenticated using(false) with check(false);
drop policy if exists deny_direct_action_market_observations on public.action_market_observations;
create policy deny_direct_action_market_observations on public.action_market_observations for all to anon,authenticated using(false) with check(false);
drop policy if exists deny_direct_action_daily_runs on public.action_daily_runs;
create policy deny_direct_action_daily_runs on public.action_daily_runs for all to anon,authenticated using(false) with check(false);
drop policy if exists deny_direct_action_model_candidates on public.action_model_candidates;
create policy deny_direct_action_model_candidates on public.action_model_candidates for all to anon,authenticated using(false) with check(false);
drop policy if exists deny_direct_lab_state on public.lab_state;
create policy deny_direct_lab_state on public.lab_state for all to anon,authenticated using(false) with check(false);
