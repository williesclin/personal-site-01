-- Subscription truth is service-managed. Existing profiles, plans and records are unchanged.
create table public.memberships (
 user_id uuid primary key references auth.users(id) on delete cascade,
 plan text not null check (plan in ('research','pro')),
 status text not null check (status in ('pending','active','canceling','past_due','expired','revoked')),
 period_start timestamptz not null,
 period_end timestamptz not null,
 updated_at timestamptz not null default now(),
 check (period_end > period_start)
);
alter table public.memberships enable row level security;
revoke all on public.memberships from public, anon, authenticated;
grant select on public.memberships to authenticated;
grant all on public.memberships to service_role;
create policy membership_self_read on public.memberships for select to authenticated using ((select auth.uid())=user_id);

create table public.research_state (
 user_id uuid primary key references auth.users(id) on delete cascade,
 payload jsonb not null default '{"watchlist":[],"saved":[]}'::jsonb,
 check (jsonb_typeof(payload)='object' and payload ? 'watchlist' and payload ? 'saved'),
 check (jsonb_typeof(payload->'watchlist')='array' and jsonb_typeof(payload->'saved')='array'),
 check (octet_length(payload::text)<=65536),
 check (jsonb_array_length(payload->'watchlist')<=200 and jsonb_array_length(payload->'saved')<=30)
);
alter table public.research_state enable row level security;
revoke all on public.research_state from public, anon, authenticated;
grant select,insert,update,delete on public.research_state to authenticated;
grant all on public.research_state to service_role;
create policy research_self_read on public.research_state for select to authenticated using ((select auth.uid())=user_id);
create policy research_self_delete on public.research_state for delete to authenticated using ((select auth.uid())=user_id);
create policy research_paid_insert on public.research_state for insert to authenticated with check (
 (select auth.uid())=user_id and exists (
 select 1 from public.memberships m where m.user_id=(select auth.uid()) and m.status in ('active','canceling') and m.period_start<=now() and m.period_end>now()
 and jsonb_array_length(payload->'watchlist')<=case when m.plan='pro' then 200 else 30 end
 and jsonb_array_length(payload->'saved')<=case when m.plan='pro' then 30 else 5 end));
create policy research_paid_update on public.research_state for update to authenticated using ((select auth.uid())=user_id) with check (
 (select auth.uid())=user_id and exists (
 select 1 from public.memberships m where m.user_id=(select auth.uid()) and m.status in ('active','canceling') and m.period_start<=now() and m.period_end>now()
 and jsonb_array_length(payload->'watchlist')<=case when m.plan='pro' then 200 else 30 end
 and jsonb_array_length(payload->'saved')<=case when m.plan='pro' then 30 else 5 end));
