-- ============================================================
-- KEISHA STORE · 99 — REMOVE ALL SEED / DEMO DATA (OPTIONAL)
-- Only needed if you ran 03_seed.sql and now want the store
-- completely empty (real products only). Run in the SQL Editor.
--
-- Order matters: order_items -> orders -> products, because of
-- the foreign keys between them. Safe to re-run.
-- ============================================================

-- 1. Remove the demo order lines and orders (est. refs KS-1042 … KS-1035)
delete from public.order_items where order_id like 'KS-10%';
delete from public.orders       where id       like 'KS-10%';

-- 2. Remove the demo products (ref codes p01 … p14)
delete from public.products     where id like 'p%';

-- 3. Verify — both queries should return 0
select count(*) as products_left from public.products;
select count(*) as orders_left   from public.orders;

-- NOTE: products YOU add later through the admin panel have ids like
-- 'ks-a1b2c3', not 'p01', and orders from real checkouts use refs
-- you generate — those are structured differently from the seeds,
-- so this cleanup script never touches your real data by accident.
