-- Append verified public SEC filing metadata to the private research warehouse.
-- The public manifest pins the full feed hash and exact filing ID set; failures roll back.
create extension if not exists http with schema extensions;
create extension if not exists pg_cron;
create schema if not exists quantpath_ops;
revoke all on schema quantpath_ops from public, anon, authenticated;

create table if not exists quantpath_ops.evidence_sync_runs (
  id bigint generated always as identity primary key,
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  status text not null check (status in ('running', 'success', 'unchanged', 'failed')),
  manifest_hash text,
  source_count integer,
  local_count integer,
  source_ids_sha256 text,
  local_ids_sha256 text,
  error_code text
);
alter table quantpath_ops.evidence_sync_runs enable row level security;
revoke all on quantpath_ops.evidence_sync_runs from public, anon, authenticated;
grant select, insert, update on quantpath_ops.evidence_sync_runs to service_role;
grant usage, select on sequence quantpath_ops.evidence_sync_runs_id_seq to service_role;

create or replace function quantpath_ops.sync_evidence_from_github() returns jsonb
language plpgsql security invoker set search_path = '' as $$
declare
  run_id bigint;
  response extensions.http_response;
  manifest jsonb;
  feed jsonb;
  d jsonb;
  document_id text;
  ticker text;
  source_ids_sha256 text;
  local_facts jsonb;
  inserted_count integer := 0;
  inserted_one integer := 0;
  result_status text;
begin
  if not pg_try_advisory_xact_lock(20261006, 1) then
    return jsonb_build_object('status', 'already_running');
  end if;

  insert into quantpath_ops.evidence_sync_runs(status)
  values ('running') returning id into run_id;

  begin
    perform extensions.http_set_curlopt('CURLOPT_TIMEOUT_MS', '20000');
    perform extensions.http_set_curlopt('CURLOPT_CONNECTTIMEOUT_MS', '5000');

    select * into response
    from extensions.http_get('https://raw.githubusercontent.com/williesclin/personal-site-01/main/data/research-sync.json');
    if response.status <> 200 or length(response.content) > 8000 then
      raise exception 'Manifest HTTP % or invalid size', response.status;
    end if;
    manifest := response.content::jsonb;
    if manifest->>'version' is distinct from '1'
      or manifest->>'feedSha256' !~ '^[0-9a-f]{64}$'
      or manifest->>'documentIdsSha256' !~ '^[0-9a-f]{64}$'
      or (manifest->>'documentCount')::integer < 1
      or (manifest->>'issuerCount')::integer < 1
      or (manifest->>'backfillCount')::integer < 0 then
      raise exception 'Invalid research manifest';
    end if;

    select * into response
    from extensions.http_get('https://raw.githubusercontent.com/williesclin/personal-site-01/main/data/research-feed.json');
    if response.status <> 200 or length(response.content) > 4000000
      or encode(extensions.digest(convert_to(response.content, 'UTF8'), 'sha256'), 'hex') is distinct from manifest->>'feedSha256' then
      raise exception 'Research feed HTTP %, size or hash mismatch', response.status;
    end if;
    feed := response.content::jsonb;
    if feed->>'version' is distinct from '1'
      or jsonb_typeof(feed->'documents') is distinct from 'array'
      or jsonb_array_length(feed->'documents') <> (manifest->>'documentCount')::integer
      or jsonb_array_length(feed->'documents') > 20000 then
      raise exception 'Research feed coverage mismatch';
    end if;
    if not exists (select 1 from public.evidence_sources where id = 'sec-edgar') then
      raise exception 'SEC evidence source is not configured';
    end if;

    select encode(extensions.digest(convert_to(string_agg(value->>'id', ',' order by value->>'id'), 'UTF8'), 'sha256'), 'hex')
    into source_ids_sha256
    from jsonb_array_elements(feed->'documents');
    if source_ids_sha256 is distinct from manifest->>'documentIdsSha256'
      or (select count(distinct value->>'id') from jsonb_array_elements(feed->'documents')) <> (manifest->>'documentCount')::integer then
      raise exception 'Research feed ID set mismatch';
    end if;

    for d in select value from jsonb_array_elements(feed->'documents') loop
      document_id := d->>'id';
      ticker := d->'symbols'->>0;
      if d->>'sourceId' is distinct from 'sec-edgar'
        or d->>'kind' is distinct from 'filing'
        or d->>'url' !~ '^https://www[.]sec[.]gov/Archives/edgar/data/[0-9]+/[0-9]+/[0-9-]+-index[.]html$'
        or encode(extensions.digest(convert_to(d->>'url', 'UTF8'), 'sha256'), 'hex') is distinct from document_id
        or jsonb_array_length(d->'symbols') <> 1
        or d->>'form' not in ('8-K','8-K/A','10-K','10-K/A','10-Q','10-Q/A')
        or d->>'accession' !~ '^[0-9]{10}-[0-9]{2}-[0-9]{6}$'
        or not exists (select 1 from public.ref_instruments where symbol = ticker) then
        raise exception 'Invalid filing source for document %', left(coalesce(document_id, ''), 64);
      end if;
      if (d->>'publishedOn')::date > current_date
        or (d->>'firstObservedAt')::timestamptz > now() + interval '5 minutes'
        or (d->>'retrievedAt')::timestamptz > now() + interval '5 minutes' then
        raise exception 'Future filing observation';
      end if;

      insert into public.evidence_documents(
        id, source_id, canonical_url, title, summary, kind, published_on, published_at,
        event_on, first_seen_at, retrieved_at, language, content_hash, rights_scope
      ) values (
        document_id, 'sec-edgar', d->>'url', d->>'title', d->'summary', 'filing',
        (d->>'publishedOn')::date, nullif(d->>'publishedAt','')::timestamptz,
        nullif(d->>'eventOn','')::date, (d->>'firstObservedAt')::timestamptz,
        (d->>'retrievedAt')::timestamptz, d->>'language', d->>'contentHash', d->>'rightsScope'
      ) on conflict do nothing;

      insert into public.evidence_document_entities(document_id, symbol, method)
      values (document_id, ticker, 'issuer_cik') on conflict do nothing;

      insert into public.evidence_filing_observations(
        document_id, symbol, form, accession, items, first_observed_at, backfill, category, classifier
      ) values (
        document_id, ticker, d->>'form', d->>'accession', coalesce(d->>'items',''),
        (d->>'firstObservedAt')::timestamptz, (d->>'backfill')::boolean,
        case when d->>'form' like '10-K%' then 'annual_filing'
             when d->>'form' like '10-Q%' then 'quarterly_filing'
             else 'current_report' end,
        'sec-form-rule-v1'
      ) on conflict do nothing;
      get diagnostics inserted_one = row_count;
      inserted_count := inserted_count + inserted_one;
    end loop;

    local_facts := quantpath_ops.local_filing_facts();
    if (local_facts->>'documentCount')::integer <> (manifest->>'documentCount')::integer
      or (local_facts->>'issuerCount')::integer <> (manifest->>'issuerCount')::integer
      or (local_facts->>'backfillCount')::integer <> (manifest->>'backfillCount')::integer
      or local_facts->>'documentIdsSha256' is distinct from manifest->>'documentIdsSha256' then
      raise exception 'Post-import filing set mismatch';
    end if;

    result_status := case when inserted_count = 0 then 'unchanged' else 'success' end;
    update quantpath_ops.evidence_sync_runs
    set status = result_status,
        finished_at = now(),
        manifest_hash = encode(extensions.digest(convert_to(manifest::text, 'UTF8'), 'sha256'), 'hex'),
        source_count = (manifest->>'documentCount')::integer,
        local_count = (local_facts->>'documentCount')::integer,
        source_ids_sha256 = manifest->>'documentIdsSha256',
        local_ids_sha256 = local_facts->>'documentIdsSha256'
    where id = run_id;
    return jsonb_build_object('status', result_status, 'run_id', run_id, 'inserted', inserted_count, 'source', manifest, 'local', local_facts);
  exception when others then
    update quantpath_ops.evidence_sync_runs
    set status = 'failed', finished_at = now(), error_code = sqlstate || ': ' || left(sqlerrm, 250)
    where id = run_id;
    return jsonb_build_object('status', 'failed', 'run_id', run_id, 'error_code', sqlstate || ': ' || left(sqlerrm, 250));
  end;
end $$;
revoke all on function quantpath_ops.sync_evidence_from_github() from public, anon, authenticated;
grant execute on function quantpath_ops.sync_evidence_from_github() to service_role;

do $$
begin
  if not exists (select 1 from cron.job where jobname = 'quantpath-research-evidence-sync') then
    perform cron.schedule(
      'quantpath-research-evidence-sync',
      '6,21,36,51 * * * *',
      'select quantpath_ops.sync_evidence_from_github();'
    );
  end if;
end $$;
