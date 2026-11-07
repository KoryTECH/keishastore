-- ============================================================
-- KEISHA STORE · 11 — COVER IMAGES
-- Run in the Supabase SQL Editor. Idempotent: safe to re-run.
--
-- What this does:
--   1. `image_path` column on products (points at a file in the
--      new bucket, e.g. 'p01/cover.png').
--   2. Creates a PUBLIC bucket `product-images` — covers must be
--      visible to every visitor, unlike the private book files.
--   3. Policies: the whole world can LOOK at covers, but only
--      admins can upload/replace/delete them.
-- ============================================================

alter table public.products
  add column if not exists image_path text;

insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do update set public = true;

drop policy if exists "product images admin"       on storage.objects;
drop policy if exists "product images public read" on storage.objects;

-- Whole world can LOOK (covers are part of the storefront)
create policy "product images public read" on storage.objects
  for select using (bucket_id = 'product-images');

-- Admins: upload, replace, delete
create policy "product images admin" on storage.objects
  for all to authenticated
  using (bucket_id = 'product-images' and public.is_store_admin())
  with check (bucket_id = 'product-images' and public.is_store_admin());

-- ============================================================
-- Done. Admin now picks a cover image on the Add Product form;
-- BookCover shows real art when a product has one and keeps the
-- generated gradient look otherwise.
-- ============================================================
