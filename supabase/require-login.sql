-- One-time migration for databases created from the older schema.sql, which let
-- anyone with the site's public key read/write/delete. Run once in the Supabase
-- dashboard: SQL Editor → New query → paste → Run. Safe to run more than once.

-- 1. Take all access away from the public (not signed-in) role.
revoke all on public.inventory_items, public.equipment, public.uploads from anon;
grant select, insert, update, delete on public.inventory_items, public.equipment, public.uploads to authenticated;

-- 2. Remove the old open policies.
drop policy if exists "read inventory"   on public.inventory_items;
drop policy if exists "insert inventory" on public.inventory_items;
drop policy if exists "update inventory" on public.inventory_items;
drop policy if exists "delete inventory" on public.inventory_items;
drop policy if exists "read equipment"   on public.equipment;
drop policy if exists "insert equipment" on public.equipment;
drop policy if exists "update equipment" on public.equipment;
drop policy if exists "delete equipment" on public.equipment;
drop policy if exists "read uploads"     on public.uploads;
drop policy if exists "insert uploads"   on public.uploads;
drop policy if exists "delete uploads"   on public.uploads;

-- 3. Signed-in users only (dropped first so a re-run doesn't fail).
drop policy if exists "signed-in users read inventory"   on public.inventory_items;
drop policy if exists "signed-in users insert inventory" on public.inventory_items;
drop policy if exists "signed-in users update inventory" on public.inventory_items;
drop policy if exists "signed-in users delete inventory" on public.inventory_items;
drop policy if exists "signed-in users read equipment"   on public.equipment;
drop policy if exists "signed-in users insert equipment" on public.equipment;
drop policy if exists "signed-in users update equipment" on public.equipment;
drop policy if exists "signed-in users delete equipment" on public.equipment;
drop policy if exists "signed-in users read uploads"     on public.uploads;
drop policy if exists "signed-in users insert uploads"   on public.uploads;
drop policy if exists "signed-in users delete uploads"   on public.uploads;

create policy "signed-in users read inventory"   on public.inventory_items for select to authenticated using (true);
create policy "signed-in users insert inventory" on public.inventory_items for insert to authenticated with check (true);
create policy "signed-in users update inventory" on public.inventory_items for update to authenticated using (true) with check (true);
create policy "signed-in users delete inventory" on public.inventory_items for delete to authenticated using (true);

create policy "signed-in users read equipment"   on public.equipment for select to authenticated using (true);
create policy "signed-in users insert equipment" on public.equipment for insert to authenticated with check (true);
create policy "signed-in users update equipment" on public.equipment for update to authenticated using (true) with check (true);
create policy "signed-in users delete equipment" on public.equipment for delete to authenticated using (true);

create policy "signed-in users read uploads"   on public.uploads for select to authenticated using (true);
create policy "signed-in users insert uploads" on public.uploads for insert to authenticated with check (true);
create policy "signed-in users delete uploads" on public.uploads for delete to authenticated using (true);
