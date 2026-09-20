-- Run only in a SEPARATE RESEARCH Supabase project.
-- No member data, member login, or public grants in this project.
begin;
create table public.lab_state(id integer primary key check(id=1),state jsonb not null);
insert into public.lab_state values(1,'{"runs":[],"audit":[],"activeRun":null,"previousRun":null}');
alter table public.lab_state enable row level security;
revoke all on public.lab_state from public,anon,authenticated;
create function public.mutate_lab(action text,payload jsonb,actor text) returns jsonb language plpgsql security definer set search_path='' as $$
declare s jsonb; r jsonb; target text; next_runs jsonb; log_text text;
begin
 select state into s from public.lab_state where id=1 for update;
 if action='run' then
   if exists(select 1 from jsonb_array_elements(s->'runs') x where x->>'id'=payload->>'id') then raise exception 'Duplicate experiment'; end if;
   s=jsonb_set(s,'{runs}',jsonb_build_array(payload)||s->'runs');
   log_text='上傳報告 '||(payload->>'name')||' v'||(payload->>'version');
 elsif action in ('validate-run','publish-run') then
   target=payload->>'id';
   select x into r from jsonb_array_elements(s->'runs') x where x->>'id'=target;
   if r is null then raise exception 'Unknown experiment'; end if;
   if action='publish-run' and r->>'status'<>'已驗證' then raise exception 'Experiment is not verified'; end if;
   if action='validate-run' and r->>'status'<>'待驗證' then raise exception 'Invalid status transition'; end if;
   select jsonb_agg(case when x->>'id'=target then jsonb_set(x,'{status}',to_jsonb(case when action='publish-run' then '正式版本' else '已驗證' end)) when action='publish-run' and x->>'status'='正式版本' then jsonb_set(x,'{status}','"已驗證"'::jsonb) else x end order by ord) into next_runs from jsonb_array_elements(s->'runs') with ordinality as items(x,ord);
   s=jsonb_set(s,'{runs}',next_runs);
   if action='publish-run' then s=jsonb_set(s,'{previousRun}',s->'activeRun');s=jsonb_set(s,'{activeRun}',to_jsonb(target));end if;
   log_text=(case when action='publish-run' then '發布版本 ' else '確認驗證 ' end)||(r->>'name')||' v'||(r->>'version');
 else raise exception 'Unsupported action'; end if;
 s=jsonb_set(s,'{audit}',jsonb_build_array(jsonb_build_object('id',gen_random_uuid(),'at',now(),'actor',actor,'action',log_text))||s->'audit');
 update public.lab_state set state=s where id=1;
 return s;
end; $$;
revoke all on function public.mutate_lab(text,jsonb,text) from public,anon,authenticated;
grant all on public.lab_state to service_role;
grant execute on function public.mutate_lab(text,jsonb,text) to service_role;
commit;
