-- ============================================================
-- KEISHA STORE · 98 — FACTORY RESET: WIPE ALL TEST/DATA ROWS
-- Run in the Supabase SQL Editor.
--
-- ⚠️ READ BEFORE RUNNING ⚠️
-- This empties the store COMPLETELY: products, orders, order
-- items, subscribers, newsletter logs, and uploaded product
-- files. Use this ONLY when there are no real sales yet.
-- It does NOT touch: profiles (accounts/admin flags), tables,
-- RLS policies, or the storage bucket itself.
--
-- If you have even ONE real sale and want to keep it, do NOT
-- run this as-is — tell your dev to keep that order instead.
--
-- Safe to re-run.
-- ============================================================

-- ------------------------------------------------------------
-- 1. ORDERS: items cascade with orders (FK on delete cascade),
--    but delete explicitly anyway for clarity.
-- ------------------------------------------------------------
delete from public.order_items;
delete from public.orders;

-- ------------------------------------------------------------
-- 2. PRODUCTS — everything, seeds and admin-added test rows.
-- ------------------------------------------------------------
delete from public.products;

-- ------------------------------------------------------------
-- 3. NEWSLETTER — subscribers you collected + the send log
--    (your test subscriptions and test broadcasts included).
-- ------------------------------------------------------------
delete from public.subscribers;
delete from public.broadcasts;

-- ------------------------------------------------------------
-- 4. STORAGE — physically delete uploaded product files
--    (bucket itself stays, next uploads work as normal).
-- ------------------------------------------------------------
delete from storage.objects where bucket_id = 'product-files';

-- ------------------------------------------------------------
-- 5. VERIFY — every count here should be 0
-- ------------------------------------------------------------
select
  (select count(*) from public.products)    as products_left,
  (select count(*) from public.orders)      as orders_left,
  (select count(*) from public.order_items) as order_items_left,
  (select count(*) from public.subscribers) as subscribers_left,
  (select count(*) from public.broadcasts)  as broadcasts_left,
  (select count(*) from storage.objects where bucket_id = 'product-files') as stored_files_left;

-- Counts must all read 0. Accounts (profiles) are untouched,
-- so your admin login keeps working exactly as before.
