-- Private append-only human evidence; no member entitlement changes.
create table quantpath_ops.document_reviews (
 id uuid primary key default gen_random_uuid(),
 document_id text not null references public.research_documents(id),
 content_hash text not null check(content_hash ~ '^[a-f0-9]{64}$'),
 source_url text not null,
 reviewer_code text not null check(reviewer_code ~ '^[A-Za-z0-9_-]{3,64}$'),
 taxonomy_version text not null check(taxonomy_version='filing-topic-v1'),
 method text not null default 'human' check(method='human'),
 topic text not null check(topic in ('financial_results','financing','governance','business_update','other','uncertain')),
 sentiment text not null check(sentiment in ('positive','negative','mixed','neutral','not_assessable')),
 evidence_note text not null check(length(trim(evidence_note)) between 20 and 2000),
 reviewed_at timestamptz not null check(reviewed_at <= now()),
 inserted_at timestamptz not null default now(),
 unique(document_id,content_hash,reviewer_code,taxonomy_version)
);
alter table quantpath_ops.document_reviews enable row level security;
revoke all on quantpath_ops.document_reviews from public,anon,authenticated;
create function quantpath_ops.validate_document_review() returns trigger
language plpgsql set search_path='' as $$
begin
 if TG_OP <> 'INSERT' then raise exception 'Review records are append-only'; end if;
 if not exists(select 1 from public.research_documents d where d.id=new.document_id and d.content_hash=new.content_hash and d.canonical_url=new.source_url and new.reviewed_at>=d.first_seen_at) then
  raise exception 'Unknown or changed source';
 end if;
 return new;
end $$;
create trigger validate_document_review before insert or update or delete on quantpath_ops.document_reviews for each row execute function quantpath_ops.validate_document_review();
revoke all on function quantpath_ops.validate_document_review() from public,anon,authenticated;
comment on table quantpath_ops.document_reviews is 'Private human evidence only. Identity strings are not proof of independent human review. Operator attestation required; never auto-release a model.';
