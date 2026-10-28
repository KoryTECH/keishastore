-- ============================================================
-- KEISHA STORE · 07 — PRODUCT FILES (uploads + paid downloads)
-- Run in the Supabase SQL Editor. Idempotent: safe to re-run.
--
-- What this does:
--   1. Adds a `file_path` column to products (points at a Storage
--      object like 'p01/my-ebook.pdf').
--   2. Creates a PRIVATE storage bucket `product-files`.
--   3. Locks it down:
--        · admins can upload / replace / delete / read anything
--        · a customer can read a file ONLY after they have an
--          order with status 'paid' containing that product.
--          Pending and refunded orders get no download.
-- ============================================================

-- ------------------------------------------------------------
-- 1. Column on products
-- ------------------------------------------------------------
alter table public.products
  add column if not exists file_path text;

-- ------------------------------------------------------------
-- 2. Private bucket (admin-managed files, no public access)
-- ------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('product-files', 'product-files', false)
on conflict (id) do nothing;

-- ------------------------------------------------------------
-- 3. Storage policies
-- ------------------------------------------------------------
drop policy if exists "product files admin"        on storage.objects;
drop policy if exists "product files paid read"    on storage.objects;

-- Admins: full control over everything in the bucket
create policy "product files admin" on storage.objects
  for all to authenticated
  using (bucket_id = 'product-files' and public.is_store_admin())
  with check (bucket_id = 'product-files' and public.is_store_admin());

-- Customers: read a file only when a PAID order of theirs contains it
create policy "product files paid read" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'product-files'
    and exists (
      select 1
      from public.order_items oi
      join public.orders o on o.id = oi.order_id
      join public.products p on p.id = oi.product_id
      where o.user_id = auth.uid()
        and o.status = 'paid'
        and p.file_path = storage.objects.name
    )
  );

-- ============================================================
-- Done. Admins now attach a file when adding a product, and
-- paying customers get a Download button on the My Shelf page.
-- ============================================================
