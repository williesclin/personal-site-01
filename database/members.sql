-- Run in the MEMBER Supabase project's SQL editor. Never run this in the research project.
begin;
create schema private;
revoke all on schema private from public;
grant usage on schema private to authenticated;
create table public.profiles (
 id uuid primary key references auth.users(id) on delete cascade,
 email text not null,
 verified boolean not null default false,
 role text not null default 'member' check(role in ('member','admin')),
 monthly_budget integer not null default 0 check(monthly_budget between 0 and 1000000)
);
create or replace function private.new_profile() returns trigger language plpgsql security definer set search_path='' as $$
begin insert into public.profiles(id,email,verified) values(new.id,new.email,new.email_confirmed_at is not null); return new; end; $$;
create trigger on_auth_user_created after insert on auth.users for each row execute procedure private.new_profile();
create function private.sync_profile() returns trigger language plpgsql security definer set search_path='' as $$ begin update public.profiles set email=new.email,verified=(new.email_confirmed_at is not null) where id=new.id;return new;end;$$;
create trigger on_auth_user_updated after update of email,email_confirmed_at on auth.users for each row execute procedure private.sync_profile();
-- Handles users created before migration.
insert into public.profiles(id,email,verified) select id,email,email_confirmed_at is not null from auth.users on conflict do nothing;
create function private.verified_member() returns boolean language sql stable security definer set search_path='' as $$
 select exists(select 1 from auth.users where id=auth.uid() and email_confirmed_at is not null);
$$;
create function private.is_admin() returns boolean language sql stable security definer set search_path='' as $$
 select private.verified_member() and exists(select 1 from public.profiles where id=auth.uid() and role='admin');
$$;
revoke all on function private.verified_member(),private.is_admin() from public;
grant execute on function private.verified_member(),private.is_admin() to authenticated;
alter table public.profiles enable row level security;
create policy profile_read on public.profiles for select to authenticated using(private.verified_member() and (id=auth.uid() or private.is_admin()));
create policy profile_budget on public.profiles for update to authenticated using(id=auth.uid() and private.verified_member()) with check(id=auth.uid() and private.verified_member());
revoke all on public.profiles from anon,authenticated;
grant select on public.profiles to authenticated;
grant update(monthly_budget) on public.profiles to authenticated;
create table public.plans(id uuid primary key,user_id uuid not null references auth.users(id) on delete cascade,payload jsonb not null,created_at timestamptz default now());
create table public.records(id uuid primary key,user_id uuid not null references auth.users(id) on delete cascade,payload jsonb not null,created_at timestamptz default now());
alter table public.plans enable row level security;
alter table public.records enable row level security;
create policy own_plans on public.plans for all to authenticated using(user_id=auth.uid() and private.verified_member()) with check(user_id=auth.uid() and private.verified_member());
create policy own_records on public.records for all to authenticated using(user_id=auth.uid() and private.verified_member()) with check(user_id=auth.uid() and private.verified_member());
revoke all on public.plans,public.records from anon;
grant select,insert,update,delete on public.plans,public.records to authenticated;
create table public.articles(id uuid primary key,payload jsonb not null);
alter table public.articles enable row level security;
create policy article_read on public.articles for select to authenticated using(private.verified_member() and ((payload->>'published')::boolean or private.is_admin()));
create policy article_admin on public.articles for all to authenticated using(private.is_admin()) with check(private.is_admin());
revoke all on public.articles from anon;
grant select,insert,update,delete on public.articles to authenticated;
revoke all on function private.new_profile(),private.sync_profile() from public,anon,authenticated;
create index plans_user_created on public.plans(user_id,created_at desc);
create index records_user_created on public.records(user_id,created_at desc);
commit;
-- Grant the first admin ONLY from the SQL editor after the owner verifies their email:
-- update public.profiles set role='admin' where id='<verified-owner-user-uuid>';
-- Neither signup metadata nor frontend state can assign roles.
