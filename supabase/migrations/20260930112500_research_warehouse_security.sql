-- Service-role-only warehouse tables need explicit deny policies for anon/authenticated users.
do $$
declare t text;
begin
 foreach t in array array['ref_sources','ref_instruments','fundamental_facts','fund_profiles','macro_series','macro_observations','fx_observations','digital_facts','market_prices','lottery_games','lottery_draws','ops_ingestion_runs','ops_dataset_status']
 loop
  execute format('drop policy if exists deny_direct_%I on public.%I',t,t);
  execute format('create policy deny_direct_%I on public.%I for all to anon,authenticated using(false) with check(false)',t,t);
 end loop;
end $$;
delete from public.ops_dataset_status where dataset_key='digital_market_prices';
