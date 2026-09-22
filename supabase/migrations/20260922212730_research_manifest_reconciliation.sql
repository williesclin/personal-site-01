-- Avoid duplicating financial facts in Git: a manifest pins the two source files.
create or replace function quantpath_ops.sync_research_from_github() returns jsonb
language plpgsql security invoker set search_path='' as $$
declare run_id bigint;response extensions.http_response;manifest jsonb;equities jsonb;feed jsonb;payload text;manifest_hash text;result jsonb;
begin
 if not pg_try_advisory_xact_lock(20260922,50) then return jsonb_build_object('status','already_running');end if;
 insert into quantpath_ops.sync_runs(status) values('running') returning id into run_id;
 begin
  perform extensions.http_set_curlopt('CURLOPT_TIMEOUT_MS','20000');
  perform extensions.http_set_curlopt('CURLOPT_CONNECTTIMEOUT_MS','5000');
  select * into response from extensions.http_get('https://raw.githubusercontent.com/williesclin/personal-site-01/main/data/research-sync.json');
  if response.status<>200 or length(response.content)>4000 then raise exception 'Manifest HTTP % or invalid size',response.status;end if;
  manifest:=response.content::jsonb;manifest_hash:=encode(extensions.digest(convert_to(response.content,'UTF8'),'sha256'),'hex');
  if manifest->>'version' is distinct from '1' or manifest->>'equitiesSha256' !~ '^[0-9a-f]{64}$' or manifest->>'feedSha256' !~ '^[0-9a-f]{64}$' then raise exception 'Invalid manifest';end if;
  if exists(select 1 from quantpath_ops.sync_runs where status in('success','unchanged') and envelope_hash=manifest_hash) then
   update quantpath_ops.sync_runs set status='unchanged',finished_at=now(),envelope_hash=manifest_hash where id=run_id;return jsonb_build_object('status','unchanged','run_id',run_id);
  end if;
  select * into response from extensions.http_get('https://raw.githubusercontent.com/williesclin/personal-site-01/main/data/equities.json');
  if response.status<>200 or length(response.content)>4000000 or encode(extensions.digest(convert_to(response.content,'UTF8'),'sha256'),'hex') is distinct from manifest->>'equitiesSha256' then raise exception 'Financial source mismatch; retaining previous snapshot';end if;
  equities:=response.content::jsonb;
  select * into response from extensions.http_get('https://raw.githubusercontent.com/williesclin/personal-site-01/main/data/research-feed.json');
  if response.status<>200 or length(response.content)>4000000 or encode(extensions.digest(convert_to(response.content,'UTF8'),'sha256'),'hex') is distinct from manifest->>'feedSha256' then raise exception 'Filing source mismatch; retaining previous snapshot';end if;
  feed:=response.content::jsonb;payload:=jsonb_build_object('version',1,'equities',equities,'feed',feed)::text;
  result:=quantpath_ops.import_research_envelope(jsonb_build_object('sha256',encode(extensions.digest(convert_to(payload,'UTF8'),'sha256'),'hex'),'payload',payload));
  update quantpath_ops.sync_runs set status='success',finished_at=now(),envelope_hash=manifest_hash,financial_hash=result->>'financial_hash',company_count=(result->>'companies')::integer,document_count=(result->>'documents')::integer where id=run_id;
  return result||jsonb_build_object('status','success','run_id',run_id,'manifest_hash',manifest_hash);
 exception when others then
  update quantpath_ops.sync_runs set status='failed',finished_at=now(),error_code=sqlstate||': '||left(sqlerrm,250) where id=run_id;
  return jsonb_build_object('status','failed','run_id',run_id,'error_code',sqlstate||': '||left(sqlerrm,250));
 end;
end $$;
revoke all on function quantpath_ops.sync_research_from_github() from public,anon,authenticated;
