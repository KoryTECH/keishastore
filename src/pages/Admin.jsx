import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  LibraryBig,
  LayoutDashboard,
  Package,
  ShoppingCart,
  Store,
  LogOut,
  Lock,
  Trash2,
  Plus,
  TrendingUp,
  DollarSign,
  ClipboardList,
  ShieldCheck,
} from 'lucide-react'
import { useAdmin } from '../context/AdminContext.jsx'
import Toast from '../components/Toast.jsx'
import { money, getTypeLabel, CATEGORIES, COVER_GRADIENTS } from '../data/products.js'

const TABS = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'products', label: 'Products', icon: Package },
  { id: 'orders', label: 'Orders', icon: ShoppingCart },
]

export default function Admin() {
  const { isAdmin } = useAdmin()
  return isAdmin ? <AdminPanel /> : <AdminLogin />
}

/* ================= LOGIN ================= */
function AdminLogin() {
  const { login } = useAdmin()
  const [password, setPassword] = useState('')
  const [error, setError] = useState(false)

  const submit = (e) => {
    e.preventDefault()
    if (login(password)) {
      setPassword('')
      setError(false)
    } else {
      setError(true)
    }
  }

  return (
    <div className="admin-login">
      <form className="admin-login-card fade-up" onSubmit={submit}>
        <div className="brand">
          <span className="brand-mark">
            <LibraryBig size={20} />
          </span>
          <span className="brand-name">
            Keisha Store
            <span className="brand-sub">Owner Access</span>
          </span>
        </div>
        <h1>Sign in to your dashboard</h1>
        <p>Manage products, orders and earnings from one place.</p>

        {error && <div className="login-error">Wrong password. Try again.</div>}

        <div className="field" style={{ textAlign: 'left', marginBottom: 16 }}>
          <label htmlFor="admin-pass">Password</label>
          <input
            id="admin-pass"
            type="password"
            placeholder="Enter admin password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoFocus
          />
        </div>
        <button type="submit" className="btn btn-primary btn-block">
          <Lock size={14} /> Enter Dashboard
        </button>
        <div className="admin-hint">
          Demo password: <code>admin123</code> (replaced by real auth + database later)
        </div>
        <Link to="/" className="link-gold small" style={{ display: 'inline-block', marginTop: 14 }}>
          Back to store
        </Link>
      </form>
    </div>
  )
}

/* ================= PANEL (shell + tabs) ================= */
function AdminPanel() {
  const { logout } = useAdmin()
  const [tab, setTab] = useState('dashboard')

  return (
    <div className="admin-shell">
      <aside className="admin-side">
        <Link to="/" className="brand">
          <span className="brand-mark" style={{ background: 'var(--green-700)' }}>
            <LibraryBig size={20} />
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
          <button className="admin-nav-item" onClick={logout}>
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
  const { stats, orders, products } = useAdmin()
  const s = stats()

  const cards = [
    {
      label: 'Total Orders',
      value: s.orderCount,
      sub: `${s.pending} pending payment${s.pending === 1 ? '' : 's'}`,
      icon: ClipboardList,
    },
    { label: 'Total Earnings', value: money(s.revenue), sub: 'After refunds excluded', icon: DollarSign, gold: true },
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
  const { products, orders, addProduct, deleteProduct } = useAdmin()
  const [toast, setToast] = useState('')
  const [showForm, setShowForm] = useState(false)

  const showToast = (msg) => {
    setToast(msg)
    window.clearTimeout(showToast._t)
    showToast._t = window.setTimeout(() => setToast(''), 2200)
  }

  const salesFor = (id) =>
    orders.reduce(
      (sum, o) => sum + (o.items.find((it) => it.id === id)?.qty || 0),
      0,
    )

  return (
    <>
      <div className="admin-head">
        <div>
          <h1>Products</h1>
          <span className="muted">{products.length} live on the shelf — add books or courses.</span>
        </div>
        <button className="btn btn-primary btn-sm" onClick={() => setShowForm((v) => !v)}>
          <Plus size={14} /> {showForm ? 'Close form' : 'Add Product'}
        </button>
      </div>

      {showForm && (
        <div className="table-card card-pad fade-up" style={{ marginBottom: 26 }}>
          <AddProductForm
            onSaved={(p) => {
              addProduct(p)
              showToast(`"${p.title}" is live on the shelf`)
              setShowForm(false)
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
            {products.map((p) => (
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
                    onClick={() => {
                      deleteProduct(p.id)
                      showToast(`"${p.title}" removed from the shelf`)
                    }}
                  >
                    <Trash2 size={15} />
                  </button>
                </td>
              </tr>
            ))}
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

  const bind = (key) => ({
    value: f[key],
    onChange: (e) => setF((prev) => ({ ...prev, [key]: e.target.value })),
  })

  const submit = (e) => {
    e.preventDefault()
    const price = Number(f.price)
    if (!f.title.trim() || !f.author.trim() || !price || price <= 0) {
      setErr('Give the product a title, an author and a valid price.')
      return
    }
    const gradient = Math.floor(Math.random() * COVER_GRADIENTS.length)
    onSaved({
      title: f.title.trim(),
      author: f.author.trim(),
      type: f.type,
      category: f.category,
      price,
      oldPrice: Number(f.oldPrice) || null,
      rating: 0,
      reviews: 0,
      gradient,
      description: f.description.trim() || 'A fresh addition to the Keisha Store shelf. Full description coming soon.',
      ...(f.type === 'course' ? { lessons: 10, hours: 4 } : { pages: 100 }),
    })
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
        <button type="submit" className="btn btn-primary">
          <Plus size={14} /> Add Product to Shelf
        </button>
      </div>
    </form>
  )
}

/* ================= ORDERS ================= */
function OrdersTab() {
  const { orders, products } = useAdmin()

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
          </tbody>
        </table>
      </div>
    </>
  )
}
