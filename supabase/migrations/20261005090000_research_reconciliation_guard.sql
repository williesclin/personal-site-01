-- Compare the exact SEC filing ID set in either QuantPath database with the public manifest.
-- The manifest remains public metadata; no database key is sent to GitHub or stored in the repo.
create extension if not exists http with schema extensions;
create extension if not exists pg_cron;
create schema if not exists quantpath_ops;
revoke all on schema quantpath_ops from public, anon, authenticated;

create table if not exists quantpath_ops.reconciliation_runs (
  id bigint generated always as identity primary key,
  checked_at timestamptz not null default now(),
  status text not null check (status in ('match', 'drift', 'legacy_manifest', 'failed')),
  source_count integer,
  local_count integer,
  source_ids_sha256 text,
  local_ids_sha256 text,
  details jsonb not null default '{}'::jsonb
);
alter table quantpath_ops.reconciliation_runs enable row level security;
revoke all on quantpath_ops.reconciliation_runs from public, anon, authenticated;
grant select, insert on quantpath_ops.reconciliation_runs to service_role;
grant usage, select on sequence quantpath_ops.reconciliation_runs_id_seq to service_role;

create or replace function quantpath_ops.local_filing_facts() returns jsonb
language plpgsql security invoker set search_path = '' as $$
declare result jsonb;
begin
  if to_regclass('public.research_filing_observations') is not null then
    execute $q$
      select jsonb_build_object(
        'documentCount', count(*),
        'issuerCount', count(distinct symbol),
        'backfillCount', count(*) filter (where backfill),
        'documentIdsSha256', encode(extensions.digest(convert_to(string_agg(document_id, ',' order by document_id), 'UTF8'), 'sha256'), 'hex')
      ) from public.research_filing_observations
    $q$ into result;
  elsif to_regclass('public.evidence_filing_observations') is not null then
    execute $q$
      select jsonb_build_object(
        'documentCount', count(*),
        'issuerCount', count(distinct symbol),
        'backfillCount', count(*) filter (where backfill),
        'documentIdsSha256', encode(extensions.digest(convert_to(string_agg(document_id, ',' order by document_id), 'UTF8'), 'sha256'), 'hex')
      ) from public.evidence_filing_observations
    $q$ into result;
  else
    raise exception 'No supported filing observation table';
  end if;
  return result;
end $$;
revoke all on function quantpath_ops.local_filing_facts() from public, anon, authenticated;
grant execute on function quantpath_ops.local_filing_facts() to service_role;

create or replace function quantpath_ops.reconcile_research_manifest() returns jsonb
language plpgsql security invoker set search_path = '' as $$
declare
  response extensions.http_response;
  manifest jsonb;
  local_facts jsonb;
  result_status text;
  details jsonb;
begin
  perform extensions.http_set_curlopt('CURLOPT_TIMEOUT_MS', '20000');
  perform extensions.http_set_curlopt('CURLOPT_CONNECTTIMEOUT_MS', '5000');
  select * into response from extensions.http_get('https://raw.githubusercontent.com/williesclin/personal-site-01/main/data/research-sync.json');
  if response.status <> 200 or length(response.content) > 8000 then
    raise exception 'Manifest HTTP % or invalid size', response.status;
  end if;
  manifest := response.content::jsonb;
  local_facts := quantpath_ops.local_filing_facts();
  if manifest->>'documentIdsSha256' is null then
    result_status := 'legacy_manifest';
  elsif manifest->>'version' is distinct from '1'
    or manifest->>'documentIdsSha256' !~ '^[0-9a-f]{64}$'
    or (manifest->>'documentCount')::integer < 1
    or (manifest->>'issuerCount')::integer < 1
    or (manifest->>'backfillCount')::integer < 0 then
    raise exception 'Invalid reconciliation manifest';
  elsif (manifest->>'documentCount')::integer = (local_facts->>'documentCount')::integer
    and (manifest->>'issuerCount')::integer = (local_facts->>'issuerCount')::integer
    and (manifest->>'backfillCount')::integer = (local_facts->>'backfillCount')::integer
    and manifest->>'documentIdsSha256' = local_facts->>'documentIdsSha256' then
    result_status := 'match';
  else
    result_status := 'drift';
  end if;
  details := jsonb_build_object('source', manifest, 'local', local_facts);
  insert into quantpath_ops.reconciliation_runs(status, source_count, local_count, source_ids_sha256, local_ids_sha256, details)
  values(result_status, nullif(manifest->>'documentCount','')::integer, (local_facts->>'documentCount')::integer, manifest->>'documentIdsSha256', local_facts->>'documentIdsSha256', details);
  return jsonb_build_object('status', result_status, 'source', manifest, 'local', local_facts);
exception when others then
  insert into quantpath_ops.reconciliation_runs(status, details)
  values('failed', jsonb_build_object('sqlstate', sqlstate, 'message', left(sqlerrm, 250)));
  return jsonb_build_object('status', 'failed', 'error_code', sqlstate || ': ' || left(sqlerrm, 250));
end $$;
revoke all on function quantpath_ops.reconcile_research_manifest() from public, anon, authenticated;
grant execute on function quantpath_ops.reconcile_research_manifest() to service_role;

do $$
begin
  if not exists (select 1 from cron.job where jobname = 'quantpath-research-reconcile') then
    perform cron.schedule('quantpath-research-reconcile', '7,22,37,52 * * * *', 'select quantpath_ops.reconcile_research_manifest();');
  end if;
end $$;
