-- ============================================================
-- KEISHA STORE · 05 — RELAX ORDER ITEM FK (RECOMMENDED)
-- Run AFTER 01/02 (and 03 if you used it). One-time, idempotent.
--
-- Why: order_items.product_id had a hard foreign key into
-- products, which meant the admin could never delete a product
-- that appeared in any past order. Order lines should be a
-- historical snapshot instead (like real receipts), so we drop
-- that constraint. Prices/quantities are already copied onto
-- each order item at checkout, so history stays intact.
--
-- NOTE: this also applies to the 05 file itself for fresh
-- databases — 01_schema.sql has been updated to no longer add
-- this FK, so if you ever create a new project you can skip
-- this file.
-- ============================================================

alter table public.order_items
  drop constraint if exists order_items_product_id_fkey;

-- Verify: the constraint list should no longer contain
-- 'order_items_product_id_fkey'
select conname
from pg_constraint
where conrelid = 'public.order_items'::regclass;
