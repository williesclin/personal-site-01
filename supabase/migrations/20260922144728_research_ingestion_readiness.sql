alter table public.research_ingestions add column completed_at timestamptz;
drop policy paid_evidence_read on public.research_ingestions;
create policy paid_evidence_read on public.research_ingestions for select to authenticated using (
 completed_at is not null and exists(select 1 from public.memberships m where m.user_id=(select auth.uid()) and m.plan in('research','pro') and m.status in('active','canceling') and m.period_start<=now() and m.period_end>now()));
drop policy paid_evidence_read on public.research_financial_periods;
create policy paid_evidence_read on public.research_financial_periods for select to authenticated using (
 exists(select 1 from public.research_ingestions i where i.hash=snapshot_hash and i.completed_at is not null));
