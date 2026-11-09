-- ============================================================
-- KEISHA STORE · 12 — DOWNLOAD LOG
-- Run in the Supabase SQL Editor. Idempotent: safe to re-run.
--
-- Every time a customer (or you) actually pulls a file, the app
-- writes one row here: which product, which account, when.
--   · signed-in users may add rows for THEMSELVES only
--     (user_id must equal their own id — no spoofing others)
--   · only admins may read the log
-- The dashboard shows the count + recent activity automatically.
-- ============================================================

create table if not exists public.downloads (
  id         uuid primary key default gen_random_uuid(),
  product_id text not null,
  user_id    uuid references public.profiles (id) on delete set null,
  email      text,
  created_at timestamptz not null default now()
);

alter table public.downloads enable row level security;

drop policy if exists "downloads insert own"   on public.downloads;
drop policy if exists "downloads select admin" on public.downloads;

-- only signed-in users write, and only their own rows
create policy "downloads insert own" on public.downloads
  for insert to authenticated
  with check (user_id = (select auth.uid()));

-- only admins read the log
create policy "downloads select admin" on public.downloads
  for select using (public.is_store_admin());

create index if not exists downloads_recent_idx
  on public.downloads (created_at desc);

-- ============================================================
-- Done. The dashboard Dashboard card + "Recent Downloads" table
-- pick this up automatically.
-- ============================================================
