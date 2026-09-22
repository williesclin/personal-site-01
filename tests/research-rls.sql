-- Transaction-only fixtures. No lasting user or paid entitlement is created.
begin;
insert into auth.users(id,email,email_confirmed_at,raw_user_meta_data) values('f0123456-aaaa-4bbb-8ccc-000000000050','qp-rls-fixture@example.invalid',now(),'{"plan":"pro"}');
set local role authenticated;
select set_config('request.jwt.claims','{"sub":"f0123456-aaaa-4bbb-8ccc-000000000050","role":"authenticated","user_metadata":{"plan":"pro"}}',true);
do $$ begin
 if (select count(*) from public.research_documents)<>0 then raise exception 'Free/client-metadata bypass'; end if;
 begin insert into public.research_issuers(symbol,cik,name,sector,ai_role,reviewed_at,evidence_url) values('BAD','0000000000','BAD','chips','{}',current_date,'https://www.sec.gov/Archives/test');raise exception 'Client write allowed';exception when insufficient_privilege then null;end;
end $$;
reset role;
insert into public.memberships(user_id,plan,status,period_start,period_end) values('f0123456-aaaa-4bbb-8ccc-000000000050','research','active',now()-interval '1 day',now()+interval '1 day');
set local role authenticated;
do $$ begin
 if (select count(*) from public.research_financial_periods)<395 then raise exception 'Paid financial read failed'; end if;
 if (select count(*) from public.research_documents)<51 then raise exception 'Paid source read failed'; end if;
 begin perform * from public.research_classifications;raise exception 'Unreleased AI exposed';exception when insufficient_privilege then null;end;
end $$;
reset role;
update public.memberships set status='canceling' where user_id='f0123456-aaaa-4bbb-8ccc-000000000050';
set local role authenticated;
do $$ begin if (select count(*) from public.research_documents)=0 then raise exception 'Paid-through cancellation denied';end if;end $$;
reset role;
update public.memberships set period_end=now() where user_id='f0123456-aaaa-4bbb-8ccc-000000000050';
set local role authenticated;
do $$ begin if (select count(*) from public.research_documents)<>0 then raise exception 'Expired entitlement bypass';end if;end $$;
reset role;
set local role anon;
do $$ begin begin perform * from public.research_documents;raise exception 'Anonymous evidence exposed';exception when insufficient_privilege then null;end;end $$;
reset role;
rollback;
