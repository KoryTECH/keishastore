import { useEffect, useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import {
  LibraryBig,
  LayoutDashboard,
  Package,
  ShoppingCart,
  Store,
  LogOut,
  Trash2,
  Plus,
  TrendingUp,
  DollarSign,
  ClipboardList,
  ShieldCheck,
  Link2,
  FileUp,
  FileDown,
  Send,
  MessageSquare,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext.jsx'
import { useAdmin } from '../context/AdminContext.jsx'
import Toast from '../components/Toast.jsx'
import ConfirmModal from '../components/ConfirmModal.jsx'
import Stars from '../components/Stars.jsx'
import { money, getTypeLabel, CATEGORIES, COVER_GRADIENTS } from '../data/products.js'

const TABS = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'products', label: 'Products', icon: Package },
  { id: 'orders', label: 'Orders', icon: ShoppingCart },
  { id: 'reviews', label: 'Reviews', icon: MessageSquare },
  { id: 'newsletter', label: 'Newsletter', icon: Send },
]

export default function Admin() {
  const { user, profile, isAdmin, loading } = useAuth()

  // restore-circle: wait for Supabase to tell us who this is
  if (loading) {
    return (
      <div className="admin-boot" role="status">
        <span className="brand-mark" style={{ width: 52, height: 52 }}>
          <LibraryBig size={24} />
        </span>
        Checking your credentials…
      </div>
    )
  }

  // not signed in at all -> the auth page (returns here after)
  if (!user) return <Navigate to="/login?next=/admin" replace />

  // signed up but not the store owner -> straight back to the shop
  if (profile && !isAdmin) return <Navigate to="/" replace />

  return <AdminPanel />
}

/* ================= SHELL + TABS ================= */
function AdminPanel() {
  const { signOut } = useAuth()
  const navigate = useNavigate()
  const [tab, setTab] = useState('dashboard')

  return (
    <div className="admin-shell">
      <aside className="admin-side">
        <Link to="/" className="brand">
          <span className="brand-mark" style={{ background: 'var(--green-700)' }}>
            <LibraryBig size={19} />
          </span>
          <span className="brand-name" style={{ color: 'var(--cream)' }}>
            Keisha Store
            <span className="brand-sub">Admin Panel</span>
          </span>
        </Link>
        {TABS.map((t) => {
          const Icon = t.icon
          return (
            <button key={t.id} className={`admin-nav-item${tab === t.id ? ' active' : ''}`} onClick={() => setTab(t.id)}>
              <Icon size={17} /> {t.label}
            </button>
          )
        })}
        <div className="admin-side-foot">
          <Link to="/" className="admin-nav-item">
            <Store size={17} /> View Store
          </Link>
          <button
            className="admin-nav-item"
            onClick={async () => {
              await signOut()
              navigate('/')
            }}
          >
            <LogOut size={17} /> Sign Out
          </button>
        </div>
      </aside>

      <main className="admin-main">
        {tab === 'dashboard' && <Dashboard setTab={setTab} />}
        {tab === 'products' && <ProductsTab />}
        {tab === 'orders' && <OrdersTab />}
        {tab === 'reviews' && <ReviewsTab />}
        {tab === 'newsletter' && <NewsletterTab />}
      </main>
    </div>
  )
}

/* ================= DASHBOARD ================= */
function Dashboard({ setTab }) {
  const { stats, products, orders, loadingOrders, downloads, loadingDownloads, productById } = useAdmin()
  const s = stats()

  // downloads in the last 7 days (the list is capped at the latest 100)
  const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000
  const weekDownloads = downloads.filter((d) => new Date(d.created_at).getTime() > weekAgo).length

  const cards = [
    {
      label: 'Total Orders',
      value: s.orderCount,
      sub: `${s.pending} pending payment${s.pending === 1 ? '' : 's'}`,
      icon: ClipboardList,
    },
    { label: 'Total Earnings', value: money(s.revenue), sub: 'Refunds excluded', icon: DollarSign, gold: true },
    { label: 'Units Sold', value: s.units, sub: 'Books + courses delivered', icon: TrendingUp },
    { label: 'File Downloads', value: downloads.length, sub: `${weekDownloads} in the last 7 days`, icon: FileDown },
    { label: 'Live Products', value: s.productCount, sub: 'Across all categories', icon: Package },
  ]

  return (
    <>
      <div className="admin-head">
        <div>
          <h1>Dashboard</h1>
          <span className="muted">Here is how the shelf is doing right now.</span>
        </div>
        <button className="btn btn-primary btn-sm" onClick={() => setTab('products')}>
          <Plus size={14} /> Add Product
        </button>
      </div>

      <div className="stat-grid">
        {cards.map((c) => {
          const Icon = c.icon
          return (
            <div className="stat-card" key={c.label}>
              <span className={`stat-icon${c.gold ? ' gold' : ''}`}>
                <Icon size={20} />
              </span>
              <div className="stat-value">{c.value}</div>
              <div className="stat-label">{c.label}</div>
              <div className="stat-sub">{c.sub}</div>
            </div>
          )
        })}
      </div>

      <div className="table-card">
        <div className="table-head">
          <h3>Recent Orders</h3>
          <button className="btn btn-outline btn-sm" onClick={() => setTab('orders')}>
            View all orders
          </button>
        </div>
        <table className="nice">
          <thead>
            <tr>
              <th>Order</th>
              <th>Customer</th>
              <th>Items</th>
              <th>Total</th>
              <th>Status</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            {loadingOrders ? (
              <tr>
                <td colSpan="6" className="muted" style={{ textAlign: 'center', padding: 30 }}>
                  Loading orders…
                </td>
              </tr>
            ) : (
              <>
                {orders.length === 0 && (
                  <tr>
                    <td colSpan="6" className="muted" style={{ textAlign: 'center', padding: 30 }}>
                      No orders yet — they will show up here the moment the first sale lands.
                    </td>
                  </tr>
                )}
                {orders.slice(0, 6).map((o) => (
                  <tr key={o.id}>
                    <td><b>#{o.id}</b></td>
                    <td>{o.customer}</td>
                    <td className="muted">
                      {o.items
                        .map((it) => products.find((p) => p.id === it.id)?.title)
                        .filter(Boolean)
                        .slice(0, 2)
                        .join(', ') + (o.items.length > 2 ? ` +${o.items.length - 2} more` : '')}
                    </td>
                    <td><b>{money(o.total)}</b></td>
                    <td><StatusPill status={o.status} /></td>
                    <td className="muted">{o.date}</td>
                  </tr>
                ))}
              </>
            )}
          </tbody>
        </table>
      </div>

      <div className="table-card" style={{ marginTop: 24 }}>
        <div className="table-head">
          <h3>Recent Downloads</h3>
          <span className="muted" style={{ fontSize: 12 }}>Every time someone pulls a file, it lands here</span>
        </div>
        <table className="nice">
          <thead>
            <tr>
              <th>Product</th>
              <th>Email</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            {loadingDownloads ? (
              <tr>
                <td colSpan="3" className="muted" style={{ textAlign: 'center', padding: 30 }}>
                  Loading downloads…
                </td>
              </tr>
            ) : (
              <>
                {downloads.length === 0 && (
                  <tr>
                    <td colSpan="3" className="muted" style={{ textAlign: 'center', padding: 30 }}>
                      No downloads yet — grab a free copy yourself and watch it appear here.
                    </td>
                  </tr>
                )}
                {downloads.slice(0, 8).map((d) => (
                  <tr key={d.id}>
                    <td><b>{productById(d.product_id)?.title ?? 'Archived product'}</b></td>
                    <td className="muted">{d.email ?? 'Signed-in reader'}</td>
                    <td className="muted">
                      {new Date(d.created_at).toLocaleString([], {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                  </tr>
                ))}
              </>
            )}
          </tbody>
        </table>
      </div>
    </>
  )
}

function StatusPill({ status }) {
  return <span className={`status-pill status-${status}`}>{status}</span>
}

/* ================= NEWSLETTER ================= */
function NewsletterTab() {
  const {
    subscribers,
    loadingSubscribers,
    refreshSubscribers,
    broadcasts,
    loadingBroadcasts,
    orders,
    sendBroadcast,
    fetchAudienceCounts,
  } = useAdmin()
  const [audience, setAudience] = useState('subscribers')
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const [confirming, setConfirming] = useState(false)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const [toast, setToast] = useState('')
  const [liveCounts, setLiveCounts] = useState(null) // { subscribers, everyone } from the server
  const [countsErr, setCountsErr] = useState('')

  const showToast = (msg) => {
    setToast(msg)
    window.clearTimeout(showToast._t)
    showToast._t = window.setTimeout(() => setToast(''), 4200)
  }

  // client-side estimate (server counts add signup accounts, which
  // the browser can't see) — used as fallback/preload value
  const subscriberEmails = subscribers.map((s) => s.email)
  const clientEveryone = [...new Set([...subscriberEmails, ...orders.map((o) => o.email)])]

  useEffect(() => {
    let alive = true
    setCountsErr('')
    fetchAudienceCounts()
      .then((c) => alive && setLiveCounts(c))
      .catch((e) => {
        if (!alive) return
        setLiveCounts(null)
        setCountsErr(
          'Live audience counts could not load — the numbers below count only subscribers and past customers. Re-run "supabase functions deploy send-broadcast" so signup accounts are included.',
        )
      })
    return () => {
      alive = false
    }
  }, [fetchAudienceCounts])

  const audienceSizes = {
    subscribers: liveCounts?.subscribers ?? subscriberEmails.length,
    everyone: liveCounts?.everyone ?? clientEveryone.length,
  }
  const recipientCount = audienceSizes[audience]

  const canSend = subject.trim() && body.trim() && recipientCount > 0

  const doSend = async () => {
    setBusy(true)
    setErr('')
    try {
      const result = await sendBroadcast({ subject: subject.trim(), body: body.trim(), audience })
      showToast(
        result.failed > 0
          ? `Sent to ${result.sent} of ${result.total} — ${result.failed} failed (Brevo daily limit?)`
          : `Delivered to all ${result.sent} ${recipientCount === 1 ? 'person' : 'people'}.`,
      )
      if (result.failed === 0) {
        setSubject('')
        setBody('')
      }
      setConfirming(false)
    } catch (e) {
      setErr(e.message)
      setConfirming(false)
    } finally {
      setBusy(false)
    }
  }

  const AUDIENCES = [
    {
      id: 'subscribers',
      label: 'Subscribers only',
      desc: 'People who gave us their email on the storefront',
      count: audienceSizes.subscribers,
    },
    {
      id: 'everyone',
      label: 'Everyone on the platform',
      desc: 'Every signup account, plus subscribers and past customers without one — one deduped list',
      count: audienceSizes.everyone,
    },
  ]

  return (
    <>
      <div className="admin-head">
        <div>
          <h1>Newsletter</h1>
          <span className="muted">
            One source, many inboxes — write it once, send it to the whole list.
          </span>
        </div>
        <button className="btn btn-outline btn-sm" onClick={() => refreshSubscribers()}>
          Refresh list
        </button>
      </div>

      {/* ----- composer ----- */}
      <div className="table-card card-pad" style={{ marginBottom: 26 }}>
        <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 20, margin: '0 0 18px' }}>
          Send a broadcast
        </h3>

        {err && <div className="login-error" style={{ textAlign: 'left', marginBottom: 16 }}>{err}</div>}

        <label style={{ display: 'block', fontWeight: 700, fontSize: 12.5, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 10 }}>
          Who is this going to?
        </label>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 12, marginBottom: 20 }}>
          {AUDIENCES.map((a) => (
            <label
              key={a.id}
              className="pay-option"
              style={{
                display: 'flex',
                gap: 12,
                alignItems: 'flex-start',
                cursor: 'pointer',
                padding: '14px 16px',
                borderRadius: 10,
                border: audience === a.id ? '1.5px solid var(--gold)' : '1.5px solid var(--line-soft)',
                background: audience === a.id ? 'rgba(201, 162, 75, 0.08)' : 'transparent',
              }}
            >
              <input
                type="radio"
                name="broadcast-audience"
                checked={audience === a.id}
                onChange={() => setAudience(a.id)}
                style={{ marginTop: 3, accentColor: '#0D2118' }}
              />
              <span>
                <b style={{ fontSize: 13.5 }}>{a.label}</b>
                <span className="muted" style={{ display: 'block', fontSize: 12, marginTop: 2 }}>
                  {a.desc}
                </span>
                <span style={{ display: 'inline-block', marginTop: 8, fontSize: 11, fontWeight: 700, background: 'rgba(201,162,75,0.16)', color: 'var(--gold-deep)', borderRadius: 999, padding: '2px 10px' }}>
                  {a.count} {a.count === 1 ? 'person' : 'people'}
                </span>
              </span>
            </label>
          ))}
        </div>
        {countsErr && (
          <div className="login-error" style={{ textAlign: 'left', marginBottom: 20, fontSize: 13 }}>
            {countsErr}
          </div>
        )}

        <div className="form-grid">
          <div className="field full">
            <label htmlFor="nl-subject">Subject line</label>
            <input
              id="nl-subject"
              placeholder="e.g. New arrivals this week"
              maxLength={150}
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
            />
          </div>
          <div className="field full">
            <label htmlFor="nl-body">Message</label>
            <textarea
              id="nl-body"
              rows={6}
              maxLength={5000}
              placeholder="Write your update — new titles, prices, free picks…"
              value={body}
              onChange={(e) => setBody(e.target.value)}
            />
            <span className="muted" style={{ fontSize: 11.5, marginTop: 6, display: 'block' }}>
              Plain text is fine — Keisha&apos;s branded email wrapper is applied automatically.
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 14, marginTop: 18 }}>
          <span className="muted small">{recipientCount} recipient{recipientCount === 1 ? '' : 's'} · Brevo free tier ≈ 300 emails/day</span>
          <button className="btn btn-primary" disabled={!canSend} onClick={() => setConfirming(true)}>
            <Send size={14} /> Send Broadcast
          </button>
        </div>
      </div>

      {/* ----- subscribers ----- */}
      <div className="table-card" style={{ marginBottom: 26 }}>
        <div className="table-head">
          <h3>Subscriber List</h3>
          <span className="muted small">Only you can see these emails — RLS keeps them private</span>
        </div>
        <table className="nice">
          <thead>
            <tr><th>Email</th><th>Joined</th></tr>
          </thead>
          <tbody>
            {loadingSubscribers ? (
              <tr><td colSpan="2" className="muted" style={{ textAlign: 'center', padding: 26 }}>Loading subscribers…</td></tr>
            ) : subscribers.length === 0 ? (
              <tr><td colSpan="2" className="muted" style={{ textAlign: 'center', padding: 26 }}>
                Nobody has subscribed yet — the first join lands through the footer or homepage form.
              </td></tr>
            ) : (
              subscribers.slice(0, 12).map((s) => (
                <tr key={s.id}>
                  <td><b>{s.email}</b></td>
                  <td className="muted">{s.date}</td>
                </tr>
              ))
            )}
            {subscribers.length > 12 && (
              <tr><td colSpan="2" className="muted" style={{ padding: '10px 16px' }}>+ {subscribers.length - 12} more on the list</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* ----- sent log ----- */}
      <div className="table-card">
        <div className="table-head">
          <h3>Sent History</h3>
          <span className="muted small">Latest 20 broadcasts</span>
        </div>
        <table className="nice">
          <thead>
            <tr><th>Subject</th><th>Audience</th><th>Recipients</th><th>Sent</th><th>Failed</th><th>Date</th></tr>
          </thead>
          <tbody>
            {loadingBroadcasts ? (
              <tr><td colSpan="6" className="muted" style={{ textAlign: 'center', padding: 26 }}>Loading history…</td></tr>
            ) : broadcasts.length === 0 ? (
              <tr><td colSpan="6" className="muted" style={{ textAlign: 'center', padding: 26 }}>
                Nothing sent yet — your first broadcast will appear here.
              </td></tr>
            ) : (
              broadcasts.map((b) => (
                <tr key={b.id}>
                  <td><b>{b.subject}</b></td>
                  <td>{b.audience === 'everyone' ? 'Everyone' : 'Subscribers'}</td>
                  <td>{b.recipient_count}</td>
                  <td style={{ color: '#2E7D50', fontWeight: 700 }}>{b.sent_count}</td>
                  <td style={{ color: b.failed_count > 0 ? '#C0554C' : 'var(--muted)' }}>{b.failed_count}</td>
                  <td className="muted">{new Date(b.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <ConfirmModal
        open={confirming}
        title="Send this broadcast?"
        message={`${recipientCount} ${recipientCount === 1 ? 'person' : 'people'} will receive "${subject.trim()}" in their inbox. Email can't be unsent.`}
        confirmLabel={`Yes, send to ${recipientCount}`}
        busy={busy}
        onCancel={() => setConfirming(false)}
        onConfirm={doSend}
      >
        <div className="modal-rows">
          <div className="modal-row"><span>Audience</span><b>{audience === 'everyone' ? 'Everyone on the platform' : 'Subscribers only'}</b></div>
          <div className="modal-row"><span>Recipients</span><b>{recipientCount}</b></div>
          <div className="modal-row"><span>Subject</span><b>{subject.trim()}</b></div>
        </div>
      </ConfirmModal>

      <Toast message={toast} />
    </>
  )
}

/* ================= REVIEWS (moderation queue) ================= */
function ReviewsTab() {
  const {
    reviews,
    loadingReviews,
    refreshReviews,
    setReviewApproved,
    deleteReview,
    productById,
  } = useAdmin()
  const [toast, setToast] = useState('')
  const [pendingDelete, setPendingDelete] = useState(null) // { id, name }
  const [busy, setBusy] = useState(false)

  const showToast = (msg) => {
    setToast(msg)
    window.clearTimeout(showToast._t)
    showToast._t = window.setTimeout(() => setToast(''), 2600)
  }

  const pending = reviews.filter((r) => !r.approved)
  const live = reviews.filter((r) => r.approved)

  const act = async (fn, okMsg, failPre) => {
    setBusy(true)
    try {
      await fn()
      showToast(okMsg)
      setPendingDelete(null)
      return true
    } catch (err) {
      showToast(`${failPre} — ${err.message}`)
      return false
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <div className="admin-head">
        <div>
          <h1>Reviews</h1>
          <span className="muted">
            {pending.length} waiting for approval · {live.length} live on the shelf
          </span>
        </div>
        <button className="btn btn-outline btn-sm" onClick={() => refreshReviews()}>
          Refresh
        </button>
      </div>

      <div className="table-card">
        <div className="table-head">
          <h3>All Reviews</h3>
          <span className="muted small">Approving recomputes that product's stars automatically</span>
        </div>
        <table className="nice">
          <thead>
            <tr>
              <th>Product</th>
              <th>Reviewer</th>
              <th>Rating</th>
              <th>Review</th>
              <th>Status</th>
              <th>Date</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {loadingReviews ? (
              <tr>
                <td colSpan="7" className="muted" style={{ textAlign: 'center', padding: 30 }}>
                  Loading reviews…
                </td>
              </tr>
            ) : reviews.length === 0 ? (
              <tr>
                <td colSpan="7" className="muted" style={{ textAlign: 'center', padding: 30 }}>
                  No reviews yet — they land here when readers write them.
                </td>
              </tr>
            ) : (
              reviews.map((r) => {
                const p = productById(r.productId)
                return (
                  <tr key={r.id}>
                    <td>
                      <b>{p ? p.title : `Archived ${r.productId}`}</b>
                      <br />
                      <span className="muted small">{p ? p.author : ''}</span>
                    </td>
                    <td>{r.name}</td>
                    <td>
                      <Stars value={r.rating} />
                    </td>
                    <td style={{ maxWidth: 260 }}>
                      <span style={{ fontSize: 13 }}>{r.body}</span>
                    </td>
                    <td>
                      <span className={`chip ${r.approved ? 'chip-live' : 'chip-pending'}`}>
                        {r.approved ? 'Live' : 'Pending'}
                      </span>
                    </td>
                    <td className="muted">{r.date}</td>
                    <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                      {r.approved ? (
                        <button
                          className="btn btn-outline btn-sm"
                          disabled={busy}
                          onClick={() =>
                            act(
                              () => setReviewApproved(r.id, false),
                              `Review hidden — "${r.name}" is off the shelf again`,
                              'Could not hide review',
                            )
                          }
                        >
                          Unpublish
                        </button>
                      ) : (
                        <button
                          className="btn btn-primary btn-sm"
                          disabled={busy}
                          onClick={() =>
                            act(
                              () => setReviewApproved(r.id, true),
                              `Published — "${r.name}" is now live`,
                              'Could not approve review',
                            )
                          }
                        >
                          Approve
                        </button>
                      )}{' '}
                      <button
                        className="icon-btn"
                        aria-label="Delete review"
                        disabled={busy}
                        onClick={() => setPendingDelete({ id: r.id, name: r.name })}
                      >
                        <Trash2 size={15} />
                      </button>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      <ConfirmModal
        open={!!pendingDelete}
        title="Delete this review?"
        message="This permanently removes the review and re-tallies the product's star rating."
        confirmLabel="Yes, delete it"
        danger
        busy={busy}
        onCancel={() => setPendingDelete(null)}
        onConfirm={() =>
          act(
            () => deleteReview(pendingDelete.id),
            `Deleted "${pendingDelete.name}"'s review`,
            'Could not delete review',
          )
        }
      />

      <Toast message={toast} />
    </>
  )
}

/* ================= PRODUCTS ================= */
function ProductsTab() {
  const { products, orders, loadingProducts, addProduct, deleteProduct, uploadProductFile, uploadProductImage, sendBroadcast } = useAdmin()
  const [toast, setToast] = useState('')
  const [showForm, setShowForm] = useState(false)
  // Confirmation dialogs: pendingAdd holds { product, file, image,
  // notify } until confirmed; pendingDelete holds the product the
  // trash icon hit.
  const [pendingAdd, setPendingAdd] = useState(null)
  const [pendingDelete, setPendingDelete] = useState(null)
  const [busy, setBusy] = useState(false)

  const showToast = (msg) => {
    setToast(msg)
    window.clearTimeout(showToast._t)
    showToast._t = window.setTimeout(() => setToast(''), 3000)
  }

  const salesFor = (id) =>
    orders.reduce(
      (sum, o) => sum + (o.items.find((it) => it.id === id)?.qty || 0),
      0,
    )

  // Copy a direct link to this product's storefront page, ready to
  // paste into a WhatsApp chat, an email, anywhere.
  const copyLink = async (p) => {
    const url = `${window.location.origin}/product/${p.id}`
    try {
      await navigator.clipboard.writeText(url)
      showToast(`Link to "${p.title}" copied — paste it anywhere`)
    } catch {
      // clipboard permission denied (http or old browser) — fall back
      const input = document.createElement('input')
      input.value = url
      document.body.appendChild(input)
      input.select()
      document.execCommand('copy')
      input.remove()
      showToast(`Link to "${p.title}" copied — paste it anywhere`)
    }
  }

  const confirmAdd = async () => {
    const { product, file, image, notify } = pendingAdd
    setBusy(true)
    try {
      const saved = await addProduct(product)
      if (image) await uploadProductImage(saved.id, image)
      if (file) await uploadProductFile(saved.id, file)

      // paid product + "announce" picked → tell the whole list
      let announceNote = ''
      if (notify) {
        try {
          const result = await sendBroadcast({
            subject: `New arrival: ${saved.title}`,
            body: `Fresh on the Keisha Store shelf:\n\n${saved.title} by ${saved.author} — ${money(saved.price)}\n\n${saved.description}\n\nSee it here: ${window.location.origin}/product/${saved.id}\n\nHappy reading,\nKeisha`,
            audience: 'everyone',
          })
          announceNote = ` · announcement sent to ${result.sent}`
        } catch (annErr) {
          announceNote = ' (product is live, but the announcement failed)'
          console.error(annErr)
        }
      }

      showToast(`"${saved.title}" is live on the shelf${announceNote}`)
      setPendingAdd(null)
      setShowForm(false)
    } catch (err) {
      showToast(`Could not add product — ${err.message}`)
    } finally {
      setBusy(false)
    }
  }

  const confirmDelete = async () => {
    const p = pendingDelete
    setBusy(true)
    try {
      await deleteProduct(p.id)
      showToast(`"${p.title}" removed from the shelf`)
      setPendingDelete(null)
    } catch (err) {
      showToast(`Could not remove "${p.title}" — ${err.message}`)
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <div className="admin-head">
        <div>
          <h1>Products</h1>
          <span className="muted">{products.length} live in the database — add books or courses.</span>
        </div>
        <button className="btn btn-primary btn-sm" onClick={() => setShowForm((v) => !v)}>
          <Plus size={14} /> {showForm ? 'Close form' : 'Add Product'}
        </button>
      </div>

      {showForm && (
        <div className="table-card card-pad fade-up" style={{ marginBottom: 26 }}>
          <AddProductForm
            onSaved={(product, file, image) => setPendingAdd({ product, file, image, notify: product.price > 0 })}
          />
        </div>
      )}

      <div className="table-card">
        <div className="table-head">
          <h3>Product Catalog</h3>
          <span className="muted small">Tap the trash icon to remove a product</span>
        </div>
        <table className="nice">
          <thead>
            <tr>
              <th>Product</th>
              <th>Type</th>
              <th>Category</th>
              <th>Price</th>
              <th>File</th>
              <th>Units Sold</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {loadingProducts ? (
              <tr>
                <td colSpan="7" className="muted" style={{ textAlign: 'center', padding: 30 }}>
                  Loading products from the database…
                </td>
              </tr>
            ) : products.length === 0 ? (
              <tr>
                <td colSpan="7" className="muted" style={{ textAlign: 'center', padding: 30 }}>
                  The shelf is empty — add your first product above.
                </td>
              </tr>
            ) : (
              products.map((p) => (
                <tr key={p.id}>
                  <td>
                    <b>{p.title}</b>
                    <br />
                    <span className="muted small">by {p.author}</span>
                  </td>
                  <td>
                    <span className={`type-tag ${p.type === 'course' ? 'type-course' : 'type-book'}`}>
                      {getTypeLabel(p.type)}
                    </span>
                  </td>
                  <td>{p.category}</td>
                  <td><b>{money(p.price)}</b></td>
                  <td>
                    {p.filePath ? (
                      <span className="file-tag">
                        <FileUp size={12} /> Ready
                      </span>
                    ) : (
                      <span className="muted small">Not uploaded</span>
                    )}
                  </td>
                  <td>{salesFor(p.id)}</td>
                  <td style={{ textAlign: 'right' }}>
                    <button
                      className="icon-btn"
                      aria-label={`Copy link to ${p.title}`}
                      title="Copy the link to this book — paste it anywhere to send someone straight to its page"
                      onClick={() => copyLink(p)}
                    >
                      <Link2 size={15} />
                    </button>
                    <button
                      className="icon-btn"
                      aria-label={`Delete ${p.title}`}
                      onClick={() => setPendingDelete(p)}
                    >
                      <Trash2 size={15} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* confirm: add product (optionally with its file + cover) */}
      <ConfirmModal
        open={!!pendingAdd}
        title="Add this product?"
        message="It goes live on the public shelf immediately."
        confirmLabel="Yes, add it"
        busy={busy}
        onCancel={() => setPendingAdd(null)}
        onConfirm={confirmAdd}
      >
        {pendingAdd && (
          <div className="modal-rows">
            <div className="modal-row"><span>Title</span><b>{pendingAdd.product.title}</b></div>
            <div className="modal-row"><span>Type</span><b>{getTypeLabel(pendingAdd.product.type)}</b></div>
            <div className="modal-row"><span>Price</span><b>{pendingAdd.product.price > 0 ? money(pendingAdd.product.price) : 'Free'}</b></div>
            <div className="modal-row"><span>Cover</span><b>{pendingAdd.image ? pendingAdd.image.name : 'Generated design'}</b></div>
            <div className="modal-row"><span>File</span><b>{pendingAdd.file ? pendingAdd.file.name : 'None — add later'}</b></div>
            {pendingAdd.product.price > 0 && (
              <label style={{ display: 'flex', gap: 10, alignItems: 'flex-start', padding: '10px 0 2px', cursor: 'pointer', borderTop: '1px dashed var(--line-soft)', fontSize: 13 }}>
                <input
                  type="checkbox"
                  defaultChecked
                  onChange={(e) => setPendingAdd((prev) => (prev ? { ...prev, notify: e.target.checked } : prev))}
                />
                <span>
                  <b>Notify everyone about this new book</b>
                  <span className="muted" style={{ display: 'block', fontSize: 12 }}>
                    Sends "New arrival" to subscribers, past customers and signups
                  </span>
                </span>
              </label>
            )}
          </div>
        )}
      </ConfirmModal>

      {/* confirm: delete product */}
      <ConfirmModal
        open={!!pendingDelete}
        title="Remove this product?"
        message="It disappears from the public shop right away. Past orders keep their history — customers of past orders lose download access to this file, so only delete if it is not selling."
        confirmLabel="Yes, remove it"
        danger
        busy={busy}
        onCancel={() => setPendingDelete(null)}
        onConfirm={confirmDelete}
      >
        {pendingDelete && (
          <div className="modal-rows">
            <div className="modal-row"><span>Title</span><b>{pendingDelete.title}</b></div>
            <div className="modal-row"><span>Price</span><b>{money(pendingDelete.price)}</b></div>
          </div>
        )}
      </ConfirmModal>

      <Toast message={toast} />
    </>
  )
}

function AddProductForm({ onSaved }) {
  const [f, setF] = useState({
    title: '',
    author: '',
    type: 'ebook',
    category: 'Self-Help',
    price: '',
    oldPrice: '',
    description: '',
  })
  const [err, setErr] = useState('')
  const [saving, setSaving] = useState(false)
  const [file, setFile] = useState(null)
  const [image, setImage] = useState(null)

  const bind = (key) => ({
    value: f[key],
    onChange: (e) => setF((prev) => ({ ...prev, [key]: e.target.value })),
  })

  const submit = async (e) => {
    e.preventDefault()
    const price = Number(f.price)
    // $0 is VALID now — it means "free product". Only negative
    // or missing/NaN prices are rejected.
    if (!f.title.trim() || !f.author.trim() || Number.isNaN(price) || price < 0) {
      setErr('Give the product a title, an author and a valid price (0 = free).')
      return
    }
    setSaving(true)
    try {
      await onSaved({
        title: f.title.trim(),
        author: f.author.trim(),
        type: f.type,
        category: f.category,
        price,
        oldPrice: Number(f.oldPrice) || null,
        rating: 0,
        reviews: 0,
        gradient: Math.floor(Math.random() * COVER_GRADIENTS.length),
        description: f.description.trim() || 'A fresh addition to the Keisha Store shelf. Full description coming soon.',
        ...(f.type === 'course' ? { lessons: 10, hours: 4 } : { pages: 100 }),
      }, file, image)
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={submit}>
      <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: 20, margin: '0 0 20px' }}>
        Add a new product
      </h3>
      {err && <div className="login-error" style={{ textAlign: 'left', marginBottom: 16 }}>{err}</div>}
      <div className="form-grid">
        <div className="field full">
          <label htmlFor="np-title">Title</label>
          <input id="np-title" placeholder="e.g. Design Systems 101" {...bind('title')} />
        </div>
        <div className="field">
          <label htmlFor="np-author">Author / Instructor</label>
          <input id="np-author" placeholder="e.g. Keisha A." {...bind('author')} />
        </div>
        <div className="field">
          <label htmlFor="np-type">Type</label>
          <select id="np-type" {...bind('type')}>
            <option value="ebook">E-book</option>
            <option value="course">Course</option>
          </select>
        </div>
        <div className="field">
          <label htmlFor="np-cat">Category</label>
          <select id="np-cat" {...bind('category')}>
            {CATEGORIES.map((c) => (
              <option key={c.name} value={c.name}>{c.name}</option>
            ))}
          </select>
        </div>
        <div className="field">
          <label htmlFor="np-price">Price ($)</label>
          <input id="np-price" type="number" min="0" step="0.01" placeholder="19.99" {...bind('price')} />
        </div>
        <div className="field">
          <label htmlFor="np-old">Compare-at price ($) — optional</label>
          <input id="np-old" type="number" min="0" step="0.01" placeholder="29.99" {...bind('oldPrice')} />
        </div>
        <div className="field full">
          <label htmlFor="np-desc">Short description</label>
          <textarea id="np-desc" placeholder="What is this product and who is it for?" {...bind('description')} />
        </div>
        <div className="field full">
          <label htmlFor="np-cover">Cover image — PNG/JPG/WebP (replaces the generated design)</label>
          <input
            id="np-cover"
            type="file"
            accept="image/png,image/jpeg,image/webp"
            onChange={(e) => setImage(e.target.files?.[0] ?? null)}
            style={{ padding: '10px 14px', fontSize: 13 }}
          />
          <span className="muted" style={{ fontSize: 12, marginTop: 6, display: 'block' }}>
            Optional — without one, the shelf still shows Keisha&apos;s branded gradient cover.
            Square-ish images look best on the shelf.
          </span>
        </div>
        <div className="field full">
          <label htmlFor="np-file">Product file — PDF, e-book, course materials (delivered after payment)</label>
          <input
            id="np-file"
            type="file"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            style={{ padding: '10px 14px', fontSize: 13 }}
          />
          <span className="muted" style={{ fontSize: 12, marginTop: 6, display: 'block' }}>
            PDF, e-book, ZIP, DOC, MP3 or MP4 — any file type. If you're on a phone and don't see
            your PDF, save it out of WhatsApp first (open the PDF, tap the three-dot menu, then
            Save), then use My Files / Documents here.
          </span>
          <span className="muted" style={{ fontSize: 12, marginTop: 6, display: 'block' }}>
            Optional — customers download it from My Shelf once their order is marked paid. You can skip it now and re-add the product later with a file.
          </span>
        </div>
      </div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 18 }}>
        <button type="submit" className="btn btn-primary" disabled={saving}>
          <Plus size={14} /> {saving ? 'Saving…' : 'Add Product to Shelf'}
        </button>
      </div>
    </form>
  )
}

/* ================= ORDERS ================= */
function OrdersTab() {
  const { orders, products, loadingOrders, updateOrderStatus } = useAdmin()
  const [toast, setToast] = useState('')

  const showToast = (msg) => {
    setToast(msg)
    window.clearTimeout(showToast._t)
    showToast._t = window.setTimeout(() => setToast(''), 2600)
  }

  const changeStatus = async (o, status) => {
    const prev = o.status
    try {
      await updateOrderStatus(o.id, status)
      showToast(`Order #${o.id} marked ${status}`)
    } catch (err) {
      showToast(`Could not update order — ${err.message}`)
    }
  }

  const rows = orders
  const paid = rows.filter((o) => o.status === 'paid')

  return (
    <>
      <div className="admin-head">
        <div>
          <h1>Orders</h1>
          <span className="muted">
            {rows.length} total · {paid.length} paid · {money(paid.reduce((s, o) => s + o.total, 0))} collected
          </span>
        </div>
      </div>

      <div className="table-card">
        <div className="table-head">
          <h3>All Orders</h3>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }} className="muted small">
            <ShieldCheck size={14} /> Set the status when payment is confirmed off-site
          </span>
        </div>
        <table className="nice">
          <thead>
            <tr>
              <th>Order</th>
              <th>Customer</th>
              <th>Items</th>
              <th>Total</th>
              <th>Status</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            {loadingOrders ? (
              <tr>
                <td colSpan="6" className="muted" style={{ textAlign: 'center', padding: 30 }}>
                  Loading orders…
                </td>
              </tr>
            ) : (
              <>
                {rows.map((o) => (
                  <tr key={o.id}>
                    <td><b>#{o.id}</b></td>
                    <td>
                      {o.customer}
                      <br />
                      <span className="muted small">{o.email}</span>
                    </td>
                    <td className="muted">
                      {o.items
                        .map((it) => {
                          const p = products.find((pr) => pr.id === it.id)
                          return p ? `${p.title} × ${it.qty}` : null
                        })
                        .filter(Boolean)
                        .join(', ')}
                    </td>
                    <td><b>{money(o.total)}</b></td>
                    <td>
                      <select
                        className={`status-pill status-${o.status}`}
                        style={{
                          border: 'none',
                          cursor: 'pointer',
                          fontFamily: 'inherit',
                          padding: '6px 10px',
                          textTransform: 'uppercase',
                          outline: '2px solid transparent',
                        }}
                        value={o.status}
                        onChange={(e) => changeStatus(o, e.target.value)}
                        aria-label={`Status for order ${o.id}`}
                      >
                        <option value="pending">Pending</option>
                        <option value="paid">Paid</option>
                        <option value="refunded">Refunded</option>
                      </select>
                    </td>
                    <td className="muted">{o.date}</td>
                  </tr>
                ))}
                {rows.length === 0 && (
                  <tr>
                    <td colSpan="6" className="muted" style={{ textAlign: 'center', padding: 30 }}>
                      No orders yet — they will show up here the moment the first sale lands.
                    </td>
                  </tr>
                )}
              </>
            )}
          </tbody>
        </table>
      </div>

      <Toast message={toast} />
    </>
  )
}
