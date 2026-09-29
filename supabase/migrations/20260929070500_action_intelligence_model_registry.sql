-- QuantPath Action Intelligence model registry.
-- Applied to the separate RESEARCH project. Service-role access only.
create table if not exists public.action_model_configs (
 id bigint generated always as identity primary key,
 version integer not null unique check (version > 0),
 mode text not null check (mode in ('shadow','released')),
 config jsonb not null check (jsonb_typeof(config)='object'),
 created_by text not null,
 created_at timestamptz not null default now()
);
create table if not exists public.action_outcomes (
 id bigint generated always as identity primary key,
 symbol text not null check (symbol ~ '^[A-Z0-9.-]{1,12}$'),
 generated_at timestamptz not null,
 action text not null check (action in ('add-review','hold','trim-review','exit-review','watch','opportunity','no-action')),
 score numeric,
 confidence numeric,
 config_version integer not null,
 evidence jsonb not null default '{}'::jsonb,
 outcome jsonb not null default '{}'::jsonb,
 evaluated_at timestamptz,
 created_at timestamptz not null default now()
);
create table if not exists public.action_model_evaluations (
 id bigint generated always as identity primary key,
 model_id text not null,
 config_version integer not null,
 horizon_days integer not null check (horizon_days > 0),
 sample_count integer not null default 0 check (sample_count >= 0),
 hit_rate numeric,
 avg_excess_return numeric,
 max_drawdown numeric,
 details jsonb not null default '{}'::jsonb,
 evaluated_at timestamptz not null default now()
);
alter table public.action_model_configs enable row level security;
alter table public.action_outcomes enable row level security;
alter table public.action_model_evaluations enable row level security;
revoke all on public.action_model_configs from public,anon,authenticated;
revoke all on public.action_outcomes from public,anon,authenticated;
revoke all on public.action_model_evaluations from public,anon,authenticated;
grant all on public.action_model_configs to service_role;
grant all on public.action_outcomes to service_role;
grant all on public.action_model_evaluations to service_role;
insert into public.action_model_configs(version,mode,config,created_by)
values (
 1,
 'shadow',
 '{
   "version":1,
   "mode":"shadow",
   "updatedAt":"2026-09-29T00:00:00Z",
   "note":"Initial action-intelligence architecture. Shadow only until multi-model evidence and outcome validation are connected.",
   "thresholds":{"minimumModels":4,"minimumConfidence":70,"addReview":72,"trimReview":38},
   "evaluation":{"horizonsDays":[7,30,90,180],"benchmark":"VTI","benchmarkSymbol":"VTI","transactionCosts":false},
   "models":[
     {"id":"fundamental","weight":22,"enabled":true,"status":"shadow"},
     {"id":"valuation","weight":16,"enabled":true,"status":"draft"},
     {"id":"momentum","weight":20,"enabled":true,"status":"draft"},
     {"id":"event","weight":16,"enabled":true,"status":"draft"},
     {"id":"macro","weight":12,"enabled":true,"status":"draft"},
     {"id":"risk","weight":14,"enabled":true,"status":"draft"}
   ]
 }'::jsonb,
 'system'
)
on conflict (version) do nothing;
