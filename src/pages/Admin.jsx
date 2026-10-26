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
} from 'lucide-react'
import { useAuth } from '../context/AuthContext.jsx'
import { useAdmin } from '../context/AdminContext.jsx'
import Toast from '../components/Toast.jsx'
import { money, getTypeLabel, CATEGORIES, COVER_GRADIENTS } from '../data/products.js'

const TABS = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'products', label: 'Products', icon: Package },
  { id: 'orders', label: 'Orders', icon: ShoppingCart },
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

/* ================= PRODUCTS ================= */
function ProductsTab() {
  const { products, orders, loadingProducts, addProduct, deleteProduct } = useAdmin()
  const [toast, setToast] = useState('')
  const [showForm, setShowForm] = useState(false)

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

  const remove = async (p) => {
    try {
      await deleteProduct(p.id)
      showToast(`"${p.title}" removed from the shelf`)
    } catch (err) {
      showToast(`Could not remove "${p.title}" — ${err.message}`)
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
            onSaved={async (p) => {
              try {
                await addProduct(p)
                showToast(`"${p.title}" is live on the shelf`)
                setShowForm(false)
              } catch (err) {
                showToast(`Could not add product — ${err.message}`)
              }
            }}
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
              <th>Units Sold</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {loadingProducts ? (
              <tr>
                <td colSpan="6" className="muted" style={{ textAlign: 'center', padding: 30 }}>
                  Loading products from the database…
                </td>
              </tr>
            ) : products.length === 0 ? (
              <tr>
                <td colSpan="6" className="muted" style={{ textAlign: 'center', padding: 30 }}>
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
                  <td>{salesFor(p.id)}</td>
                  <td style={{ textAlign: 'right' }}>
                    <button
                      className="icon-btn"
                      aria-label={`Delete ${p.title}`}
                      onClick={() => remove(p)}
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
      })
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
  const { orders, products, loadingOrders } = useAdmin()

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
            <ShieldCheck size={14} /> Refunds and receipts arrive with the payment system
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
                    <td><StatusPill status={o.status} /></td>
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
    </>
  )
}
