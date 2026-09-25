-- Transaction-only account-state acceptance; all fixtures and writes are rolled back.
begin;
insert into auth.users(id,email,email_confirmed_at) values
 ('f0123456-aaaa-4bbb-8ccc-000000000051','qp-state-owner@example.invalid',now()),
 ('f0123456-aaaa-4bbb-8ccc-000000000052','qp-state-other@example.invalid',now());
insert into public.memberships(user_id,plan,status,period_start,period_end) values ('f0123456-aaaa-4bbb-8ccc-000000000051','research','active',now()-interval '1 hour',now()+interval '1 hour');
set local role authenticated;
select set_config('request.jwt.claims','{"sub":"f0123456-aaaa-4bbb-8ccc-000000000051","role":"authenticated"}',true);
insert into public.research_state(user_id,payload) values ('f0123456-aaaa-4bbb-8ccc-000000000051','{"watchlist":["NVDA","AMD"],"saved":[{"id":"roundtrip","name":"Test chart","query":"","year":"2025","metrics":["revenue"],"layout":{"version":1,"onlyWatch":true,"amount":"25000.50","chart":{"metric":"grossMargin","second":"researchIntensity","mode":"scatter","sector":"chips","selected":["NVDA","AMD"]}}}]}');
do $$ begin
 if (select payload#>>'{saved,0,layout,chart,mode}' from public.research_state where user_id='f0123456-aaaa-4bbb-8ccc-000000000051') <> 'scatter' then raise exception 'Layout failed roundtrip'; end if;
 begin update public.research_state set user_id='f0123456-aaaa-4bbb-8ccc-000000000052' where user_id='f0123456-aaaa-4bbb-8ccc-000000000051'; raise exception 'Owner reassignment accepted'; exception when insufficient_privilege then null; end;
end $$;
select set_config('request.jwt.claims','{"sub":"f0123456-aaaa-4bbb-8ccc-000000000052","role":"authenticated"}',true);
do $$ begin
 if (select count(*) from public.research_state) <> 0 then raise exception 'Cross-account read'; end if;
 begin insert into public.research_state(user_id,payload) values ('f0123456-aaaa-4bbb-8ccc-000000000052','{"watchlist":[],"saved":[]}');raise exception 'Free write accepted';exception when insufficient_privilege then null;end;
end $$;
reset role;
update public.memberships set period_end=now() where user_id='f0123456-aaaa-4bbb-8ccc-000000000051';
set local role authenticated;
select set_config('request.jwt.claims','{"sub":"f0123456-aaaa-4bbb-8ccc-000000000051","role":"authenticated"}',true);
do $$ begin begin update public.research_state set payload='{"watchlist":[],"saved":[]}' where user_id='f0123456-aaaa-4bbb-8ccc-000000000051';raise exception 'Expired write accepted';exception when insufficient_privilege then null;end;end $$;
reset role;
rollback;
select 'PASS: chart roundtrip, cross-account isolation, Free/expired write denial; all fixtures rolled back' as result;
