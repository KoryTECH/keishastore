-- ============================================================
-- KEISHA STORE · 02 — ROW LEVEL SECURITY
-- Run SECOND, after 01_schema.sql.
-- This is the actual "jail": with only the publishable key,
-- the public can read the shop, but only admins can manage it.
-- Idempotent: safe to re-run.
-- ============================================================

-- ------------------------------------------------------------
-- 1. Enable RLS everywhere
-- ------------------------------------------------------------
alter table public.profiles    enable row level security;
alter table public.products    enable row level security;
alter table public.orders      enable row level security;
alter table public.order_items enable row level security;

-- ------------------------------------------------------------
-- 2. Clean slate for policies (so re-running never duplicates)
-- ------------------------------------------------------------
drop policy if exists "profiles select own"        on public.profiles;
drop policy if exists "profiles select all (admin)" on public.profiles;
drop policy if exists "profiles update own"        on public.profiles;

drop policy if exists "products read public"   on public.products;
drop policy if exists "products write admin"   on public.products;

drop policy if exists "orders insert public"   on public.orders;
drop policy if exists "orders select"          on public.orders;
drop policy if exists "orders update admin"    on public.orders;
drop policy if exists "orders delete admin"    on public.orders;

drop policy if exists "order items insert public" on public.order_items;
drop policy if exists "order items select"        on public.order_items;

-- ------------------------------------------------------------
-- 3. PROFILES
--    - users read/update only their own row
--    - admins read everything
--    - is_admin escalation is blocked by the trigger in 01
-- ------------------------------------------------------------
create policy "profiles select own" on public.profiles
  for select using (auth.uid() = id);

create policy "profiles select all (admin)" on public.profiles
  for select using (public.is_store_admin());

create policy "profiles update own" on public.profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);

-- ------------------------------------------------------------
-- 4. PRODUCTS
--    - anyone (anon with publishable key included) can read
--    - only real admins can create / edit / delete
-- ------------------------------------------------------------
create policy "products read public" on public.products
  for select using (true);

create policy "products write admin" on public.products
  for all using (public.is_store_admin()) with check (public.is_store_admin());

-- ------------------------------------------------------------
-- 5. ORDERS
--    - guest checkout: anyone can create (publishable key only)
--    - a customer can only see orders tied to their account
--    - only admins can view all, update status, or delete
-- ------------------------------------------------------------
create policy "orders insert public" on public.orders
  for insert with check (true);

create policy "orders select" on public.orders
  for select using (
    public.is_store_admin()
    or (user_id is not null and user_id = auth.uid())
  );

create policy "orders update admin" on public.orders
  for update using (public.is_store_admin()) with check (public.is_store_admin());

create policy "orders delete admin" on public.orders
  for delete using (public.is_store_admin());

-- ------------------------------------------------------------
-- 6. ORDER ITEMS
--    - created together with the order at checkout
--    - visible to admins, or to the account that owns the order
-- ------------------------------------------------------------
create policy "order items insert public" on public.order_items
  for insert with check (true);

create policy "order items select" on public.order_items
  for select using (
    exists (
      select 1 from public.orders o
      where o.id = order_id
        and (public.is_store_admin() or (o.user_id is not null and o.user_id = auth.uid()))
    )
  );

-- ------------------------------------------------------------
-- KNOWN LIMITATION (normal for guest checkout):
-- the "orders insert public / order items insert public" policies
-- mean anyone with the publishable key can spam `pending` orders.
-- Mitigate later with Supabase Auth Captcha / rate limiting.
-- The good news: spammers still can't READ anything, and unread
-- pending orders cost you nothing.
-- ============================================================
