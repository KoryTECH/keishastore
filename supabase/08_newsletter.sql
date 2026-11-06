-- ============================================================
-- KEISHA STORE · 08 — NEWSLETTER (subscribers + broadcasts)
-- Run in the Supabase SQL Editor. Idempotent: safe to re-run.
--
-- What this does:
--   1. `subscribers`  — emails collected from the footer/newsletter
--      forms. Anyone may subscribe; ONLY admins may read the list
--      (other visitors and even subscribers can't see anyone's email)
--      and only admins may remove entries.
--   2. `broadcasts`   — log of every email sent from the admin
--      Newsletter tab (subject, audience, counts) so you can see
--      what went out and when. Admin-only.
-- ============================================================

-- ------------------------------------------------------------
-- 1. SUBSCRIBERS
-- ------------------------------------------------------------
create table if not exists public.subscribers (
  id         uuid primary key default gen_random_uuid(),
  email      text not null unique,
  source     text not null default 'newsletter',
  created_at timestamptz not null default now()
);

-- basic sanity: it must look like an email
alter table public.subscribers
  drop constraint if exists subscribers_email_format;
alter table public.subscribers
  add constraint subscribers_email_format
  check (email ~* '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$');

-- always store lowercase so 'Ada@Gmail.com' and 'ada@gmail.com'
-- count as the same person
create or replace function public.normalize_subscriber_email()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.email := lower(btrim(new.email));
  return new;
end;
$$;

drop trigger if exists subscribers_email_norm on public.subscribers;
create trigger subscribers_email_norm
  before insert or update on public.subscribers
  for each row execute function public.normalize_subscriber_email();

alter table public.subscribers enable row level security;

drop policy if exists "subscribers insert public"  on public.subscribers;
drop policy if exists "subscribers select admin"   on public.subscribers;
drop policy if exists "subscribers delete admin"   on public.subscribers;

-- anyone (even logged-out visitors) can give us their email
create policy "subscribers insert public" on public.subscribers
  for insert with check (true);

-- ONLY admins can read the list, remove addresses, etc.
create policy "subscribers select admin" on public.subscribers
  for select using (public.is_store_admin());

create policy "subscribers delete admin" on public.subscribers
  for delete using (public.is_store_admin());

-- ------------------------------------------------------------
-- 2. BROADCASTS (send log)
-- ------------------------------------------------------------
create table if not exists public.broadcasts (
  id              uuid primary key default gen_random_uuid(),
  subject         text not null,
  body            text not null,
  audience        text not null check (audience in ('subscribers', 'everyone')),
  recipient_count integer not null default 0,
  sent_count      integer not null default 0,
  failed_count    integer not null default 0,
  created_at      timestamptz not null default now()
);

alter table public.broadcasts enable row level security;

drop policy if exists "broadcasts select admin" on public.broadcasts;

-- written by the Edge Function (service role, bypasses RLS);
-- readable in the dashboard by admins only.
create policy "broadcasts select admin" on public.broadcasts
  for select using (public.is_store_admin());

-- ============================================================
-- Done. Next: deploy the `send-broadcast` Edge Function and set
-- the Brevo secrets on Supabase (never in Vercel/static env).
-- ============================================================
