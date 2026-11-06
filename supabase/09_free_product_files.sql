-- ============================================================
-- KEISHA STORE · 09 — FREE PRODUCT DOWNLOADS
-- Run in the Supabase SQL Editor. Idempotent: safe to re-run.
--
-- What this does: lets ANY WORLD visitor (no account, no login,
-- no order) download files belonging to products priced at ₦/$0.
-- Paid products stay locked exactly as before: file read only
-- with a PAID order.
-- ============================================================

drop policy if exists "product files free read" on storage.objects;

create policy "product files free read" on storage.objects
  for select to anon, authenticated
  using (
    bucket_id = 'product-files'
    and exists (
      select 1
      from public.products p
      where p.file_path = storage.objects.name
        and p.price = 0
    )
  );

-- Done. A paid product's file STILL requires an order with
-- status = 'paid' (policy in 07). A $0 product's file opens to
-- everyone with the one-click "Download Free Copy" button.
