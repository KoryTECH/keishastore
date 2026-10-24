-- ============================================================
-- KEISHA STORE · 03 — SEED DATA
-- Run THIRD, after 01 + 02.
-- Loads your current 14 products and 8 sample orders.
-- Idempotent: safe to re-run (won't duplicate).
-- ============================================================

-- ---------- PRODUCTS ----------
insert into public.products (id, title, author, type, category, price, old_price, rating, reviews, pages, lessons, hours, gradient, description)
values
  ('p01', 'The Quiet Authority', 'Maya Coleman', 'ebook', 'Self-Help', 18.00, 24.00, 4.8, 143, 148, null, null, 2,
   'Stop performing confidence and start owning it. The Quiet Authority is a practical field guide for building calm, unshakable presence — at work, in rooms you lead, and in every conversation that matters.'),
  ('p02', 'Branding From Zero', 'Jonas Reed', 'course', 'Design', 49.99, null, 4.9, 98, null, 12, 4.5, 0,
   'A start-to-finish system for building a brand identity people remember. Positioning, palette, type, voice and a full visual system — built live from a blank page.'),
  ('p03', 'Cashflow Calm', 'Priya Nair', 'ebook', 'Business', 14.99, null, 4.7, 76, 96, null, null, 4,
   'Money stress is a systems problem, not a discipline problem. Learn the simple weekly cashflow routine that keeps your business funded, predictable and painless.'),
  ('p04', 'Sell With Story', 'Marcus Bell', 'course', 'Marketing', 39.99, 54.99, 4.8, 210, null, 9, 3.2, 1,
   'The most reliable way to sell is to make people feel something first. This course hands you the exact storytelling framework behind 8-figure launch emails, ads and sales pages.'),
  ('p05', 'Sunday Audience', 'Amara Diallo', 'ebook', 'Fiction', 6.99, 12.99, 4.6, 301, 212, null, null, 5,
   'A quiet, devastating novel about the last choir of a closing church — and the town that suddenly hears it. Winner of the Indies Silver Medal for literary fiction.'),
  ('p06', 'The Client Engine', 'Jonas Reed', 'course', 'Business', 59.99, null, 4.9, 87, null, 14, 5.4, 3,
   'Build a referral-powered pipeline that never dries up. Outreach scripts, pricing calculators and the cadence that fills your calendar without cold DM panic.'),
  ('p07', 'Words That Make It Real', 'Elena Ruiz', 'ebook', 'Non-Fiction', 9.99, null, 4.5, 52, 118, null, null, 0,
   'Ideas are cheap; finished things are priceless. A short, sharp manual on turning half-thoughts into shipped essays, books and talks people remember.'),
  ('p08', 'Deep Focus Classroom', 'Tomás Rivera', 'course', 'Self-Help', 34.99, null, 4.7, 130, null, 10, 2.8, 1,
   'A 4-week reset for your attention. Science-backed routines, environmental design and daily drills that restore the kind of focus your work actually deserves.'),
  ('p09', 'Minimal Budget Marketing', 'Marcus Bell', 'ebook', 'Marketing', 12.99, null, 4.6, 64, 104, null, null, 5,
   'You do not need a bigger budget — you need a sharper message. 27 plays for getting seen, trusted and chosen when you are the smallest brand in the room.'),
  ('p10', 'Pitch & Publish', 'Elena Ruiz', 'course', 'Non-Fiction', 44.99, 59.99, 4.8, 91, null, 11, 4.1, 2,
   'From proposal to printed book. Learn the pitching craft editors wish every author knew, plus the self-publishing route done properly when a traditional deal is not right for you.'),
  ('p11', 'The Cartographer''s Daughter', 'N. Hartwell', 'ebook', 'Fiction', 8.99, null, 4.7, 188, 268, null, null, 4,
   'In a country that has erased its own borders, a mapmaker''s daughter inherits an impossible commission: draw the nation back to itself. Historical fiction at its most luminous.'),
  ('p12', 'Momentum Habits', 'Maya Coleman', 'ebook', 'Self-Help', 7.99, 12.99, 4.5, 220, 88, null, null, 3,
   'Motivation is weather; momentum is a machine. Build tiny, compounding routines that keep moving on the days you do not feel like it.'),
  ('p13', 'Typography That Sells', 'Ada Osei', 'course', 'Design', 29.99, null, 4.6, 44, null, 8, 2.5, 0,
   'Type is the voice of your layout. Master hierarchy, rhythm and pairing decisions that quietly make every design you ship look expensive.'),
  ('p14', 'The Side Income Playbook', 'Priya Nair', 'ebook', 'Business', 16.99, null, 4.8, 175, 132, null, null, 5,
   'Twelve vetted models for earning in your off hours — with honest timelines, real margins and the exact first steps for each. No hustle theatre, just math.')
on conflict (id) do nothing;

-- ---------- SAMPLE ORDERS ----------
-- Wipe only our seeded refs first so re-running stays clean
delete from public.order_items where order_id like 'KS-10%';
delete from public.orders      where id       like 'KS-10%';

insert into public.orders (id, user_id, customer, email, total, status, created_at) values
  ('KS-1042', null, 'Keira Johnson', 'keira@mail.com',     25.99, 'paid',     '2026-10-20 14:22:00+00'),
  ('KS-1041', null, 'Daniel Okafor',  'd.okafor@mail.com',  59.99, 'paid',     '2026-10-20 09:05:00+00'),
  ('KS-1040', null, 'Sofia Marin',    'sofia.m@mail.com',   62.98, 'paid',     '2026-10-19 18:41:00+00'),
  ('KS-1039', null, 'Liam Chen',      'liamc@mail.com',      6.99, 'paid',     '2026-10-19 11:12:00+00'),
  ('KS-1038', null, 'Hana Suzuki',    'hana.s@mail.com',    39.99, 'pending',  '2026-10-18 20:33:00+00'),
  ('KS-1037', null, 'Grace Mensah',   'grace.m@mail.com',   62.99, 'refunded', '2026-10-17 16:27:00+00'),
  ('KS-1036', null, 'Rob Ellis',      'rob.ellis@mail.com', 29.99, 'paid',     '2026-10-16 10:02:00+00'),
  ('KS-1035', null, 'Tara Singh',     'tara.singh@mail.com',41.97, 'paid',     '2026-10-15 13:48:00+00');

insert into public.order_items (order_id, product_id, qty, price) values
  ('KS-1042', 'p01', 1, 18.00),
  ('KS-1042', 'p12', 1,  7.99),
  ('KS-1041', 'p06', 1, 59.99),
  ('KS-1040', 'p02', 1, 49.99),
  ('KS-1040', 'p09', 1, 12.99),
  ('KS-1039', 'p05', 1,  6.99),
  ('KS-1038', 'p04', 1, 39.99),
  ('KS-1037', 'p10', 1, 44.99),
  ('KS-1037', 'p01', 1, 18.00),
  ('KS-1036', 'p13', 1, 29.99),
  ('KS-1035', 'p07', 1,  9.99),
  ('KS-1035', 'p03', 1, 14.99),
  ('KS-1035', 'p14', 1, 16.99);
