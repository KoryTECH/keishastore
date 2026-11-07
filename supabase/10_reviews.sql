-- ============================================================
-- KEISHA STORE · 10 — PRODUCT REVIEWS (moderated)
-- Run in the Supabase SQL Editor. Idempotent: safe to re-run.
--
-- How it works:
--   · Anyone can SUBMIT a review for a real product. It lands
--     as `approved = false` — invisible to the public.
--   · Admin approves / unapproves / deletes from the dashboard.
--     Only `approved = true` rows are readable by the public.
--   · Deleting a product deletes its reviews with it (FK cascade).
-- ============================================================

create table if not exists public.reviews (
  id         uuid primary key default gen_random_uuid(),
  product_id text not null references public.products (id) on delete cascade,
  name       text not null,
  user_id    uuid references public.profiles (id) on delete set null,
  rating     integer not null check (rating between 1 and 5),
  body       text not null check (char_length(btrim(body)) between 5 and 800),
  approved   boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.reviews enable row level security;

drop policy if exists "reviews insert public"    on public.reviews;
drop policy if exists "reviews select"           on public.reviews;
drop policy if exists "reviews update admin"     on public.reviews;
drop policy if exists "reviews delete admin"     on public.reviews;

-- anyone can submit a review, but ONLY for a product that exists,
-- with sane lengths already enforced by the table checks
create policy "reviews insert public" on public.reviews
  for insert with check (
    exists (select 1 from public.products p where p.id = product_id)
  );

-- public sees only approved reviews; admins see the whole queue
create policy "reviews select" on public.reviews
  for select using (
    approved = true
    or public.is_store_admin()
  );

-- approve / unapprove — admins only
create policy "reviews update admin" on public.reviews
  for update using (public.is_store_admin()) with check (public.is_store_admin());

create policy "reviews delete admin" on public.reviews
  for delete using (public.is_store_admin());

-- ============================================================
-- Done. Approving a review in the dashboard also refreshes the
-- product's star rating + review count automatically.
-- ============================================================
