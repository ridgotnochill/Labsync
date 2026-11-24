-- Roles for LabPilot. Run once in the Supabase dashboard (SQL Editor → New query →
-- paste → Run) AFTER schema.sql / require-login.sql. Safe to run more than once.
--
--   admin, assistant, faculty → full access (view, upload, clear all data, Admin Panel)
--   student                   → view only
--
-- Every new account starts as 'student'. To change someone's role:
-- Table Editor → user_roles → edit the `role` cell.

create table if not exists public.user_roles (
  user_id uuid primary key references auth.users (id) on delete cascade,
  email   text not null default '',
  role    text not null default 'student' check (role in ('admin', 'assistant', 'faculty', 'student'))
);

alter table public.user_roles enable row level security;
revoke all on public.user_roles from anon, authenticated;
grant select on public.user_roles to authenticated;
-- The manage-users Edge Function (service role) reads and changes roles.
grant select, insert, update, delete on public.user_roles to service_role;

-- People can see their own role (the app reads it to show/hide buttons). Changing
-- roles is done in the dashboard, which bypasses these rules.
drop policy if exists "read own role" on public.user_roles;
create policy "read own role" on public.user_roles for select to authenticated using (user_id = auth.uid());

-- New accounts get a 'student' row automatically.
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.user_roles (user_id, email) values (new.id, coalesce(new.email, ''))
  on conflict (user_id) do nothing;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- Accounts that existed before roles were added start as 'admin'.
insert into public.user_roles (user_id, email, role)
select id, coalesce(email, ''), 'admin' from auth.users
on conflict (user_id) do nothing;

-- True when the signed-in user may change data.
create or replace function public.can_edit() returns boolean
language sql stable security definer set search_path = '' as $$
  select coalesce(
    (select role in ('admin', 'assistant', 'faculty') from public.user_roles where user_id = auth.uid()),
    false
  )
$$;
revoke all on function public.can_edit() from public, anon;
grant execute on function public.can_edit() to authenticated;

-- Everyone signed in can read; only editors can insert/update/delete.
drop policy if exists "signed-in users insert inventory" on public.inventory_items;
drop policy if exists "signed-in users update inventory" on public.inventory_items;
drop policy if exists "signed-in users delete inventory" on public.inventory_items;
drop policy if exists "signed-in users insert equipment" on public.equipment;
drop policy if exists "signed-in users update equipment" on public.equipment;
drop policy if exists "signed-in users delete equipment" on public.equipment;
drop policy if exists "signed-in users insert uploads"   on public.uploads;
drop policy if exists "signed-in users delete uploads"   on public.uploads;
drop policy if exists "editors insert inventory" on public.inventory_items;
drop policy if exists "editors update inventory" on public.inventory_items;
drop policy if exists "editors delete inventory" on public.inventory_items;
drop policy if exists "editors insert equipment" on public.equipment;
drop policy if exists "editors update equipment" on public.equipment;
drop policy if exists "editors delete equipment" on public.equipment;
drop policy if exists "editors insert uploads"   on public.uploads;
drop policy if exists "editors delete uploads"   on public.uploads;

create policy "editors insert inventory" on public.inventory_items for insert to authenticated with check (public.can_edit());
create policy "editors update inventory" on public.inventory_items for update to authenticated using (public.can_edit()) with check (public.can_edit());
create policy "editors delete inventory" on public.inventory_items for delete to authenticated using (public.can_edit());
create policy "editors insert equipment" on public.equipment for insert to authenticated with check (public.can_edit());
create policy "editors update equipment" on public.equipment for update to authenticated using (public.can_edit()) with check (public.can_edit());
create policy "editors delete equipment" on public.equipment for delete to authenticated using (public.can_edit());
create policy "editors insert uploads"   on public.uploads for insert to authenticated with check (public.can_edit());
create policy "editors delete uploads"   on public.uploads for delete to authenticated using (public.can_edit());
