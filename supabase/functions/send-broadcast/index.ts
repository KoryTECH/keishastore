// Supabase Edge Function: send-broadcast
// ------------------------------------------------------------
// Sends one email to many recipients via Brevo. Callable ONLY by
// a signed-in admin (verified against profiles.is_admin server-side).
//
// POST body:  { subject, body, audience: 'subscribers' | 'everyone' }
//             or { action: 'counts' } for live audience sizes.
// Response:   { total, sent, failed }  |  { subscribers, everyone }
//
// "everyone" = subscribers ∪ past customers ∪ ALL signup accounts
// (auth.users read via service role — signup emails never leave
// the server).
//
// Secrets (set with `supabase secrets set ...` — NEVER in Vercel):
//   BREVO_API_KEY       — the API key v3 from Brevo (SMTP & API page)
//   BREVO_SENDER_EMAIL  — verified sender (e.g. you@gmail.com)
//   BREVO_SENDER_NAME   — display name, e.g. "Keisha Store"
// Auto-injected by Supabase: SUPABASE_URL, SUPABASE_ANON_KEY,
// SUPABASE_SERVICE_ROLE_KEY (bypasses RLS — server only).
// ------------------------------------------------------------

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS })

  const json = (data, status = 200) =>
    new Response(JSON.stringify(data), {
      status,
      headers: { ...CORS, 'Content-Type': 'application/json' },
    })

  try {
    // ---------- who is calling? must be a signed-in admin ----------
    const auth = req.headers.get('Authorization') ?? ''
    if (!auth.startsWith('Bearer ')) return json({ error: 'Not signed in.' }, 401)
    const anon = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!)
    const { data: userData, error: userError } = await anon.auth.getUser(auth.slice(7))
    if (userError || !userData?.user) return json({ error: 'Invalid session.' }, 401)

    const service = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )
    const { data: me } = await service
      .from('profiles')
      .select('is_admin')
      .eq('id', userData.user.id)
      .single()
    if (!me?.is_admin) return json({ error: 'Admins only.' }, 403)

    const { action, subject, body, audience = 'subscribers' } = await req.json()

    // ---------- preview counts (no email sent) ----------
    if (action === 'counts') {
      const counts = await gatherAudienceCounts(service)
      return json(counts)
    }

    // ---------- real send ----------
    const apiKey = Deno.env.get('BREVO_API_KEY')
    const senderEmail = Deno.env.get('BREVO_SENDER_EMAIL')
    const senderName = Deno.env.get('BREVO_SENDER_NAME') ?? 'Keisha Store'
    if (!apiKey || !senderEmail) {
      return json(
        { error: 'Email provider is not configured yet (missing BREVO secrets).' },
        500,
      )
    }

    const cleanSubject = String(subject ?? '').trim()
    const cleanBody = String(body ?? '').trim()
    if (!cleanSubject || cleanSubject.length > 150) {
      return json({ error: 'Write a subject line (max 150 characters).' }, 400)
    }
    if (!cleanBody || cleanBody.length > 5000) {
      return json({ error: 'Write a message (max 5000 characters).' }, 400)
    }
    if (!['subscribers', 'everyone'].includes(audience)) {
      return json({ error: 'Unknown audience.' }, 400)
    }

    const counts = await gatherAudienceCounts(service)
    const emails = audience === 'everyone' ? counts.allEmails : counts.subscriberEmails

    const recipients = emails.filter((e: string) => EMAIL_RE.test(e))
    if (recipients.length === 0) {
      return json({ error: 'Nobody to send to yet — the list is empty.' }, 400)
    }

    // ---------- send (Brevo supports single-recipient calls; batch 10 at a time) ----------
    const html =
      `<div style="font-family:Georgia,serif;max-width:560px;margin:0 auto;padding:24px;">` +
      `<div style="border-top:4px solid #C9A24B;margin-bottom:18px;"></div>` +
      `<h2 style="color:#0D2118;margin:0 0 12px;">${escapeHtml(cleanSubject)}</h2>` +
      `<div style="color:#333;font-size:15px;line-height:1.7;">${escapeHtml(cleanBody).replace(/\n/g, '<br/>')}</div>` +
      `<p style="color:#888;font-size:11px;margin-top:28px;">You received this because you subscribed at Keisha Store.</p>` +
      `</div>`

    let sent = 0
    const failed: string[] = []

    for (let i = 0; i < recipients.length; i += 10) {
      const batch = recipients.slice(i, i + 10)
      const results = await Promise.allSettled(
        batch.map((email: string) =>
          fetch('https://api.brevo.com/v3/smtp/email', {
            method: 'POST',
            headers: {
              'api-key': apiKey,
              'Content-Type': 'application/json',
              Accept: 'application/json',
            },
            body: JSON.stringify({
              sender: { name: senderName, email: senderEmail },
              to: [{ email }],
              subject: cleanSubject,
              textContent: cleanBody,
              htmlContent: html,
            }),
          }).then(async (res) => {
            if (!res.ok) throw new Error(await res.text())
          }),
        ),
      )
      results.forEach((r, idx) => {
        if (r.status === 'fulfilled') sent += 1
        else failed.push(batch[idx])
      })
    }

    // ---------- log it so the dashboard shows what went out ----------
    await service.from('broadcasts').insert({
      subject: cleanSubject,
      body: cleanBody,
      audience,
      recipient_count: recipients.length,
      sent_count: sent,
      failed_count: failed.length,
    })

    return json({ total: recipients.length, sent, failed: failed.length })
  } catch (err) {
    console.error('send-broadcast crashed:', err)
    return json({ error: err?.message ?? 'Unexpected error.' }, 500)
  }
})

// ------------------------------------------------------------
// Audience gathering — subscribers ∪ order emails ∪ signup emails
// ------------------------------------------------------------
async function gatherAudienceCounts(service: any) {
  const emails = new Set<string>()

  const { data: subs } = await service
    .from('subscribers')
    .select('email')
    .order('created_at', { ascending: true })
  ;(subs ?? []).forEach((s: { email: string }) => emails.add(s.email.toLowerCase()))

  const { data: orders } = await service.from('orders').select('email')
  ;(orders ?? []).forEach((o: { email: string }) => emails.add(o.email.toLowerCase()))

  const subscriberEmails = [...emails]

  // every signup account (auth.users), paged with the service client.
  // NOTE: listUsers returns a wrapper ({ users: [...] }) in current
  // supabase-js — handle both shapes defensively.
  const perPage = 200
  let page = 1
  while (true) {
    const { data: pageData, error } = await service.auth.admin.listUsers({ page, perPage })
    if (error || !pageData) break
    const list = Array.isArray(pageData) ? pageData : (pageData.users ?? [])
    ;(list as Array<{ email?: string | null }>).forEach((u) => {
      if (u.email) emails.add(u.email.toLowerCase())
    })
    if (list.length < perPage) break
    page += 1
  }

  const everyone = [...emails.filter((e) => EMAIL_RE.test(e))]

  return {
    subscriberEmails,
    everyoneEmails: everyone,
    allEmails: everyone,
    subscribers: subscriberEmails.length,
    everyone: everyone.length,
  }
}

function escapeHtml(s: string) {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}
