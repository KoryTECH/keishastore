-- ============================================================
-- KEISHA STORE · 04 — ADMIN SETUP
-- Run LAST, and only AFTER you have signed up for an account
-- on your live site (a profile row is auto-created on signup).
-- ============================================================

-- STEP 1: replace the email below with the one you signed up with,
--         then run this whole file.
update public.profiles
set is_admin = true
where id in (
  select id from auth.users
  where email = 'YOUR_EMAIL_HERE@example.com'   -- <<< EDIT ME
);

-- STEP 2: verify — you should see your email with is_admin = true
select u.email, p.is_admin
from public.profiles p
join auth.users u on u.id = p.id
order by p.created_at;
