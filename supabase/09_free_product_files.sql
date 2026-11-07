-- ============================================================
-- KEISHA STORE · 09 — PRODUCT FILES (uploads + downloads)
-- REVISED: free products now REQUIRE SIGN-IN too.
-- Run in the Supabase SQL Editor. Idempotent: safe to re-run.
--
-- Access rules for the private `product-files` bucket:
--   · admins      — full read/upsert/delete of everything
--   · signed-in   — a file is readable when
--                     (a) they own a PAID order containing it, OR
--                     (b) the product costs $0 (free, login-only)
--   · logged-out  — nothing. Every download needs an account.
-- ============================================================

alter table public.products
  add column if not exists file_path text;

insert into storage.buckets (id, name, public)
values ('product-files', 'product-files', false)
on conflict (id) do nothing;

drop policy if exists "product files admin"        on storage.objects;
drop policy if exists "product files paid read"    on storage.objects;
drop policy if exists "product files free read"    on storage.objects;

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

-- Free products: any SIGNED-IN account can read the file.
-- (Previously this allowed `anon` too — revised per store rules.)
create policy "product files free read" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'product-files'
    and exists (
      select 1
      from public.products p
      where p.file_path = storage.objects.name
        and p.price = 0
    )
  );

-- ============================================================
-- Done. Re-run safely — old anonymous access is withdrawn by
-- replacing the free-read policy above.
-- ============================================================
