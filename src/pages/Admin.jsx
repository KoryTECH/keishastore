import { useState } from 'react'
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
  FileUp,
  Send,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext.jsx'
import { useAdmin } from '../context/AdminContext.jsx'
import Toast from '../components/Toast.jsx'
import ConfirmModal from '../components/ConfirmModal.jsx'
import { money, getTypeLabel, CATEGORIES, COVER_GRADIENTS } from '../data/products.js'

const TABS = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'products', label: 'Products', icon: Package },
  { id: 'orders', label: 'Orders', icon: ShoppingCart },
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
        {tab === 'newsletter' && <NewsletterTab />}
      </main>
    </div>
  )
}

/* ================= DASHBOARD ================= */
function Dashboard({ setTab }) {
  const { stats, products, orders, loadingOrders } = useAdmin()
  const s = stats()

  const cards = [
    {
      label: 'Total Orders',
      value: s.orderCount,
      sub: `${s.pending} pending payment${s.pending === 1 ? '' : 's'}`,
      icon: ClipboardList,
    },
    { label: 'Total Earnings', value: money(s.revenue), sub: 'Refunds excluded', icon: DollarSign, gold: true },
    { label: 'Units Sold', value: s.units, sub: 'Books + courses delivered', icon: TrendingUp },
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
  } = useAdmin()
  const [audience, setAudience] = useState('subscribers')
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const [confirming, setConfirming] = useState(false)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const [toast, setToast] = useState('')

  const showToast = (msg) => {
    setToast(msg)
    window.clearTimeout(showToast._t)
    showToast._t = window.setTimeout(() => setToast(''), 4200)
  }

  // audience size preview (deduped: a customer who subscribed counts once)
  const subscriberEmails = subscribers.map((s) => s.email)
  const everyoneEmails = [...new Set([...subscriberEmails, ...orders.map((o) => o.email)])]
  const recipientCount = audience === 'subscribers' ? subscriberEmails.length : everyoneEmails.length

  const canSend = subject.trim() && body.trim() && recipientCount > 0

  const doSend = async () => {
    setBusy(true)
    setErr('')
    try {
      const result = await sendBroadcast({ subject: subject.trim(), body: body.trim(), audience })
      showToast(
        result.failed > 0
          ? `Sent to ${result.sent} of ${result.total} — ${result.failed} failed (Brevo daily limit?)`
          : `Delivered to all ${result.sent} ${recipientCount === 1 ? 'person' : 'people'} 🎉`,
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
      desc: 'Everyone who gave us their email on the storefront',
      count: subscriberEmails.length,
    },
    {
      id: 'everyone',
      label: 'Subscribers + past customers',
      desc: 'Adds everyone who has ever placed an order',
      count: everyoneEmails.length,
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

        <div className="form-grid">
          <div className="field full">
            <label htmlFor="nl-subject">Subject line</label>
            <input
              id="nl-subject"
              placeholder="e.g. New arrivals this week 📚"
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
          <div className="modal-row"><span>Audience</span><b>{audience === 'everyone' ? 'Subscribers + customers' : 'Subscribers'}</b></div>
          <div className="modal-row"><span>Recipients</span><b>{recipientCount}</b></div>
          <div className="modal-row"><span>Subject</span><b>{subject.trim()}</b></div>
        </div>
      </ConfirmModal>

      <Toast message={toast} />
    </>
  )
}

/* ================= PRODUCTS ================= */
function ProductsTab() {
  const { products, orders, loadingProducts, addProduct, deleteProduct, uploadProductFile } = useAdmin()
  const [toast, setToast] = useState('')
  const [showForm, setShowForm] = useState(false)
  // Confirmation dialogs: pendingAdd holds { product, file } until
  // confirmed; pendingDelete holds the product the trash icon hit.
  const [pendingAdd, setPendingAdd] = useState(null)
  const [pendingDelete, setPendingDelete] = useState(null)
  const [busy, setBusy] = useState(false)

  const showToast = (msg) => {
    setToast(msg)
    window.clearTimeout(showToast._t)
    showToast._t = window.setTimeout(() => setToast(''), 2600)
  }

  const salesFor = (id) =>
    orders.reduce(
      (sum, o) => sum + (o.items.find((it) => it.id === id)?.qty || 0),
      0,
    )

  const confirmAdd = async () => {
    const { product, file } = pendingAdd
    setBusy(true)
    try {
      const saved = await addProduct(product)
      if (file) await uploadProductFile(saved.id, file)
      showToast(`"${saved.title}" is live on the shelf`)
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
            onSaved={(product, file) => setPendingAdd({ product, file })}
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

      {/* confirm: add product (optionally with its file) */}
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
            <div className="modal-row"><span>Price</span><b>{money(pendingAdd.product.price)}</b></div>
            <div className="modal-row"><span>File</span><b>{pendingAdd.file ? pendingAdd.file.name : 'None — add later'}</b></div>
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

  const bind = (key) => ({
    value: f[key],
    onChange: (e) => setF((prev) => ({ ...prev, [key]: e.target.value })),
  })

  const submit = async (e) => {
    e.preventDefault()
    const price = Number(f.price)
    if (!f.title.trim() || !f.author.trim() || !price || price <= 0) {
      setErr('Give the product a title, an author and a valid price.')
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
      }, file)
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
          <label htmlFor="np-file">Product file — PDF, e-book, course materials (delivered after payment)</label>
          <input
            id="np-file"
            type="file"
            accept=".pdf,.epub,.mobi,.zip,.doc,.docx,.mp3,.mp4"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            style={{ padding: '10px 14px', fontSize: 13 }}
          />
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
