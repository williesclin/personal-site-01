-- Run in the MEMBER Supabase project's SQL editor. Never run this in the research project.
begin;
create table public.profiles (
 id uuid primary key references auth.users(id) on delete cascade,
 email text not null,
 verified boolean not null default false,
 role text not null default 'member' check(role in ('member','admin')),
 monthly_budget integer not null default 0 check(monthly_budget between 0 and 1000000)
);
create or replace function public.new_profile() returns trigger language plpgsql security definer set search_path='' as $$
begin insert into public.profiles(id,email,verified) values(new.id,new.email,new.email_confirmed_at is not null); return new; end; $$;
create trigger on_auth_user_created after insert on auth.users for each row execute procedure public.new_profile();
create function public.sync_profile() returns trigger language plpgsql security definer set search_path='' as $$ begin update public.profiles set email=new.email,verified=(new.email_confirmed_at is not null) where id=new.id;return new;end;$$;
create trigger on_auth_user_updated after update of email,email_confirmed_at on auth.users for each row execute procedure public.sync_profile();
-- Handles users created before migration.
insert into public.profiles(id,email,verified) select id,email,email_confirmed_at is not null from auth.users on conflict do nothing;
create function public.verified_member() returns boolean language sql stable security definer set search_path='' as $$
 select exists(select 1 from auth.users where id=auth.uid() and email_confirmed_at is not null);
$$;
create function public.is_admin() returns boolean language sql stable security definer set search_path='' as $$
 select public.verified_member() and exists(select 1 from public.profiles where id=auth.uid() and role='admin');
$$;
revoke all on function public.verified_member(),public.is_admin() from public;
grant execute on function public.verified_member(),public.is_admin() to authenticated;
alter table public.profiles enable row level security;
create policy profile_read on public.profiles for select to authenticated using(public.verified_member() and (id=auth.uid() or public.is_admin()));
create policy profile_budget on public.profiles for update to authenticated using(id=auth.uid() and public.verified_member()) with check(id=auth.uid() and public.verified_member());
revoke all on public.profiles from anon,authenticated;
grant select on public.profiles to authenticated;
grant update(monthly_budget) on public.profiles to authenticated;
create table public.plans(id uuid primary key,user_id uuid not null references auth.users(id) on delete cascade,payload jsonb not null,created_at timestamptz default now());
create table public.records(id uuid primary key,user_id uuid not null references auth.users(id) on delete cascade,payload jsonb not null,created_at timestamptz default now());
alter table public.plans enable row level security;
alter table public.records enable row level security;
create policy own_plans on public.plans for all to authenticated using(user_id=auth.uid() and public.verified_member()) with check(user_id=auth.uid() and public.verified_member());
create policy own_records on public.records for all to authenticated using(user_id=auth.uid() and public.verified_member()) with check(user_id=auth.uid() and public.verified_member());
revoke all on public.plans,public.records from anon;
grant select,insert,update,delete on public.plans,public.records to authenticated;
create table public.articles(id uuid primary key,payload jsonb not null);
alter table public.articles enable row level security;
create policy article_read on public.articles for select to authenticated using(public.verified_member() and ((payload->>'published')::boolean or public.is_admin()));
create policy article_admin on public.articles for all to authenticated using(public.is_admin()) with check(public.is_admin());
revoke all on public.articles from anon;
grant select,insert,update,delete on public.articles to authenticated;
commit;
-- Grant the first admin ONLY from the SQL editor after the owner verifies their email:
-- update public.profiles set role='admin' where id='<verified-owner-user-uuid>';
-- Neither signup metadata nor frontend state can assign roles.
