import { supabase } from './supabase.js'

// Used by the footer form and the homepage newsletter band.
// The `subscribers_email_norm` trigger lowercases + trims in the
// database, and the unique index makes re-subscribing harmless.
//
// Returns:
//   { status: 'subscribed' }  — fresh addition
//   { status: 'exists' }      — already on the list
//   { status: 'error', message } — RLS/network/validation failure
export async function subscribeToList(email) {
  const clean = String(email ?? '').trim().toLowerCase()
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clean)) {
    return { status: 'error', message: 'That email does not look right.' }
  }

  const { data, error } = await supabase
    .from('subscribers')
    .upsert({ email: clean }, { onConflict: 'email', ignoreDuplicates: true })
    .select('id')
    .single()

  if (error) {
    if (error.code === '23505') return { status: 'exists' } // unique violation just in case
    return { status: 'error', message: error.message }
  }

  // upsert with ignoreDuplicates returns no row when it already existed
  return data ? { status: 'subscribed' } : { status: 'exists' }
}
