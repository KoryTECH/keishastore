# Supabase Setup — Keisha Store

Everything you need to wire the store to Supabase. Run the SQL files
**in order** in the Supabase SQL Editor (Dashboard → SQL Editor → New query).

## Run order

| Order | File | What it does |
|-------|------|--------------|
| 1 | `01_schema.sql` | Tables: `profiles`, `products`, `orders`, `order_items` + signup trigger + anti-escalation guard |
| 2 | `02_rls.sql` | Row Level Security — the actual security boundary for the publishable key |
| 3 | `03_seed.sql` | Loads the 14 current products + 8 sample orders |
| 4 | `04_admin_setup.sql` | Runtime after you sign up: edit `admin_email`, run it to promote your account |

## After the SQL

1. Create a project on supabase.com (or use existing).
2. Run files 1–3 in the SQL Editor.
3. Sign up on your store → then edit and run `04_admin_setup.sql` with your email.
4. Copy from Dashboard → Settings → API:
   - **Project URL** → `VITE_SUPABASE_URL`
   - **anon / publishable key** → `VITE_SUPABASE_ANON_KEY`
5. Create `.env.local` in the project root:

```
VITE_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
```

6. We then wire `AdminContext` / `CartContext` to read/write Supabase
   (cart stays in localStorage; orders are written at checkout).

## Security model (why the publishable key is safe to ship)

- The **publishable (anon) key is meant to be public** — RLS on the tables is what protects data:
  - Products: publicly readable, admin-only writable.
  - Orders/items: insert by anyone (guest checkout), read by admin or the owning account only.
  - `profiles.is_admin`: a database trigger blocks any non-admin from flipping it,
    even through the API directly. The `/admin` frontend redirect is UX only —
    the database is the jail, not the UI.
- Never put the `service_role` key anywhere in the frontend.
- Known limitation: guest checkout means the publishable key allows spamming
  `pending` orders. Consider Supabase Captcha later.

## Admin behavior once live

- Admin logs in with a normal Supabase Auth account, then visits `/admin`.
- Non-admins who visit `/admin` are redirected to the home page.
- Admin dashboard reads live products/orders from the database.
