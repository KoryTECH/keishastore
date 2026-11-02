import { createClient } from '@supabase/supabase-js'

// Privacy switch: we stopped persisting data in localStorage.
// Sweep out anything earlier versions of the store left behind
// (old carts + old Supabase session tokens). Runs once per page load.
try {
  const legacy = ['keisha.cart']
  for (const key of Object.keys(window.localStorage)) {
    if (legacy.includes(key) || key.startsWith('sb-')) {
      window.localStorage.removeItem(key)
    }
  }
} catch {
  /* storage unavailable — nothing to sweep */
}

const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!url || !anonKey) {
  throw new Error(
    'Missing Supabase env vars. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to .env.local, then restart the dev server.',
  )
}

// Publishable (anon) key — safe to ship to the browser.
// All data protection comes from RLS in the database.
// Sign-in sessions live in sessionStorage: they survive refreshes
// within a tab, but leave nothing behind once the tab/browser closes.
export const supabase = createClient(url, anonKey, {
  auth: {
    storage: window.sessionStorage,
  },
})
