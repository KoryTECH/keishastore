-- ============================================================
-- KEISHA STORE · 01 — SCHEMA
-- Run this FIRST in the Supabase SQL Editor.
-- Idempotent: safe to re-run.
-- ============================================================

-- ------------------------------------------------------------
-- 1. PROFILES — one row per signed-up user, holds the admin flag
-- ------------------------------------------------------------
create table if not exists public.profiles (
  id         uuid primary key references auth.users (id) on delete cascade,
  full_name  text,
  is_admin   boolean not null default false,
  created_at timestamptz not null default now()
);

-- Helper: is the current logged-in user an admin?
-- SECURITY DEFINER so RLS on profiles can't cause recursion.
create or replace function public.is_store_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and is_admin = true
  );
$$;

-- Auto-create a profile on every new signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name)
  values (
    new.id,
    coalesce(
      new.raw_user_meta_data ->> 'full_name',
      split_part(new.email, '@', 1)
    )
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Anti-escalation guard: a regular user can edit their own profile
-- but can NEVER flip is_admin to true (even via the REST API with
-- the publishable key). Runs in the SQL editor (auth.uid() null)
-- for bootstrap, but always fires for real authenticated users.
create or replace function public.prevent_admin_escalation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    return new; -- running from SQL Editor / service role (setup)
  end if;

  if new.id <> old.id then
    raise exception 'Cannot change profile owner';
  end if;

  if new.is_admin <> old.is_admin and not public.is_store_admin() then
    raise exception 'Only admins can change admin status';
  end if;

  return new;
end;
$$;

drop trigger if exists profiles_guard on public.profiles;
create trigger profiles_guard
  before update on public.profiles
  for each row execute function public.prevent_admin_escalation();

-- ------------------------------------------------------------
-- 2. PRODUCTS
-- id is a short text code ('p01', ...) matching the storefront/cart
-- ------------------------------------------------------------
create table if not exists public.products (
  id          text primary key default 'ks-' || substr(md5(random()::text), 1, 6),
  title       text not null,
  author      text not null,
  type        text not null default 'ebook' check (type in ('ebook', 'course')),
  category    text not null,
  price       numeric(10,2) not null check (price >= 0),
  old_price   numeric(10,2),
  rating      numeric(2,1) not null default 0 check (rating between 0 and 5),
  reviews     integer not null default 0,
  pages       integer,          -- e-books only
  lessons     integer,          -- courses only
  hours       numeric(4,1),     -- courses only
  gradient    integer not null default 0,
  description text not null default '',
  created_at  timestamptz not null default now()
);

-- ------------------------------------------------------------
-- 3. ORDERS + ORDER ITEMS
-- Orders support guest checkout (user_id is null) and logged-in
-- checkout (user_id set). Items are normalized into their own
-- table so the admin dashboard can show real order lines.
-- ------------------------------------------------------------
create table if not exists public.orders (
  id         text primary key,   -- order ref e.g. 'KS-1050'
  user_id    uuid references public.profiles (id) on delete set null,
  customer   text not null,
  email      text not null,
  total      numeric(10,2) not null check (total >= 0),
  status     text not null default 'pending'
             check (status in ('pending', 'paid', 'refunded')),
  created_at timestamptz not null default now()
);

create table if not exists public.order_items (
  id         uuid primary key default gen_random_uuid(),
  order_id   text not null references public.orders (id) on delete cascade,
  product_id text not null references public.products (id),
  qty        integer not null check (qty > 0),
  price      numeric(10,2) not null check (price >= 0)
);

-- ============================================================
-- Done. Now run 02_rls.sql (security), then 03_seed.sql, then
-- 04_admin_setup.sql after you have signed up for an account.
-- ============================================================
