import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { ShieldCheck, BookOpen, GraduationCap, CheckCircle2, ArrowRight } from 'lucide-react'
import { useCart } from '../context/CartContext.jsx'
import { useAdmin } from '../context/AdminContext.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import BookCover from '../components/BookCover.jsx'
import Toast from '../components/Toast.jsx'
import { money, getTypeLabel } from '../data/products.js'

export default function Checkout() {
  const navigate = useNavigate()
  const { items, clear } = useCart()
  const { productById, addOrder } = useAdmin()
  const { user, loading: authLoading } = useAuth()

  const [form, setForm] = useState({ name: '', email: '' })
  const [placed, setPlaced] = useState(null) // { ref, total, email } after success
  const [toast, setToast] = useState('')

  const showToast = (msg) => {
    setToast(msg)
    window.clearTimeout(showToast._t)
    showToast._t = window.setTimeout(() => setToast(''), 2800)
  }

  // ---- Only signed-in users may check out (same guard as the UI) ----
  if (authLoading) {
    return (
      <section className="section">
        <div className="container">
          <div className="empty-state">
            <h3>Just a second…</h3>
            <p>Checking your session.</p>
          </div>
        </div>
      </section>
    )
  }
  if (!user) return <Navigate to="/login?next=/checkout" replace />

  const lines = items
    .map((it) => ({ ...it, product: productById(it.id) }))
    .filter((l) => l.product)
  const subtotal = lines.reduce((sum, l) => sum + l.product.price * l.qty, 0)

  // ---- Redirect to shop if cart is empty (and nothing was just placed) ----
  if (!placed && lines.length === 0) {
    return (
      <section className="section">
        <div className="container">
          <div className="empty-state">
            <h3>There is nothing to check out</h3>
            <p>Add an e-book or course to your cart first.</p>
            <Link to="/shop" className="btn btn-primary">Browse the shelf</Link>
          </div>
        </div>
      </section>
    )
  }

  // ---- Success state ----
  if (placed) {
    return (
      <section className="section">
        <div className="container" style={{ maxWidth: 640 }}>
          <div className="panel success-panel fade-up">
            <div className="success-icon">
              <CheckCircle2 size={34} />
            </div>
            <h2>Order placed, thank you</h2>
            <p>
              We got it, <b>{placed.name}</b> — your order ref is below. Payment instructions
              will arrive at <b>{placed.email}</b>, and your downloads unlock the moment payment
              is confirmed.
            </p>
            <div className="order-ref">Order ref: {placed.ref}</div>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
              <Link to="/shop" className="btn btn-primary">
                Continue Shopping
              </Link>
              <Link to="/" className="btn btn-outline">
                Back Home
              </Link>
            </div>
            <p className="muted small" style={{ marginTop: 22 }}>
              Order total: <b style={{ color: 'var(--green-950)' }}>{money(placed.total)}</b> · payment on confirmation
            </p>
          </div>
        </div>
      </section>
    )
  }

  // ---- Checkout form ----
  const canPay = form.name.trim() && /.+@.+\..+/.test(form.email)

  const placeOrder = async (e) => {
    e.preventDefault()
    if (!canPay) return
    const ref = `KS-${Date.now().toString().slice(-6)}`
    try {
      await addOrder({
        id: ref,
        customer: form.name.trim(),
        email: form.email.trim(),
        items: items.map((it) => ({ id: it.id, qty: it.qty })),
        total: subtotal,
        status: 'pending',
      })
      setPlaced({ ref, total: subtotal, email: form.email.trim(), name: form.name.trim() })
      clear()
    } catch (err) {
      showToast(`Order could not be saved — ${err.message}`)
    }
  }

  const bind = (key) => ({
    value: form[key],
    onChange: (e) => setForm((f) => ({ ...f, [key]: e.target.value })),
  })

  return (
    <>
      <div className="page-head">
        <div className="container">
          <div className="breadcrumb">
            <Link to="/">Home</Link>
            <span className="sep">/</span>
            <Link to="/cart">Cart</Link>
            <span className="sep">/</span>
            <span>Checkout</span>
          </div>
          <h1 className="display">Checkout</h1>
          <p className="muted" style={{ margin: '8px 0 0' }}>
            One quick step and your order is in — no card needed here.
          </p>
        </div>
      </div>

      <section className="section-tight">
        <div className="container">
          <form className="checkout-grid" onSubmit={placeOrder}>
            {/* ---------- Left: steps ---------- */}
            <div>
              <div className="panel">
                <h3>
                  <span className="step-n">1</span> Contact details
                </h3>
                <div className="form-grid">
                  <div className="field full">
                    <label htmlFor="ck-name">Full name</label>
                    <input id="ck-name" placeholder="Ada Obi" required {...bind('name')} />
                  </div>
                  <div className="field full">
                    <label htmlFor="ck-email">Email for delivery</label>
                    <input id="ck-email" type="email" placeholder="you@email.com" required {...bind('email')} />
                  </div>
                </div>

                <div className="secure-line">
                  <ShieldCheck size={14} />
                  No card details are collected on the site — payment is confirmed after you order.
                </div>
              </div>

              <div className="panel" style={{ marginTop: 20 }}>
                <h3>
                  <span className="step-n">2</span> What happens after you order
                </h3>
                {[
                  { icon: BookOpen, text: 'We email you simple payment instructions — pay by transfer or any method you prefer.' },
                  { icon: GraduationCap, text: 'Once we confirm payment, your e-books and course access unlock immediately.' },
                ].map((row) => (
                  <div key={row.text} style={{ display: 'flex', gap: 12, alignItems: 'center', color: 'var(--body)', fontSize: 14, padding: '6px 0' }}>
                    <row.icon size={17} style={{ color: 'var(--gold-deep)', flexShrink: 0 }} />
                    {row.text}
                  </div>
                ))}
              </div>
            </div>

            {/* ---------- Right: summary ---------- */}
            <aside className="summary-card">
              <h3>Your Order</h3>
              {lines.map(({ product, qty }) => (
                <div key={product.id} style={{ display: 'flex', gap: 12, alignItems: 'center', padding: '9px 0', borderBottom: '1px dashed var(--line-soft)' }}>
                  <span style={{ width: 46, flexShrink: 0, display: 'block', borderRadius: 6, overflow: 'hidden' }}>
                    <BookCover product={product} compact />
                  </span>
                  <span style={{ flex: 1, minWidth: 0 }}>
                    <span style={{ display: 'block', fontSize: 13, fontWeight: 700, color: 'var(--ink)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {product.title}
                    </span>
                    <span className="muted" style={{ fontSize: 11.5 }}>
                      {getTypeLabel(product.type)} × {qty}
                    </span>
                  </span>
                  <b style={{ fontSize: 13.5 }}>{money(product.price * qty)}</b>
                </div>
              ))}

              <div className="sum-row" style={{ marginTop: 12 }}>
                <span>Subtotal</span>
                <span>{money(subtotal)}</span>
              </div>
              <div className="sum-row">
                <span>Delivery</span>
                <span className="free">Instant · Free</span>
              </div>
              <div className="sum-row total">
                <span>Total</span>
                <span className="val">{money(subtotal)}</span>
              </div>

              <button type="submit" className="btn btn-gold btn-block" style={{ marginTop: 18 }} disabled={!canPay}>
                Place Order · {money(subtotal)}
              </button>

              <div className="sum-note">
                <ShieldCheck size={16} />
                <span>Your order is saved to Keisha&apos;s dashboard right away — payment comes after, from the instructions email.</span>
              </div>

              <button
                type="button"
                className="btn btn-outline btn-block btn-sm"
                style={{ marginTop: 6 }}
                onClick={() => navigate('/cart')}
              >
                <ArrowRight size={13} style={{ transform: 'rotate(180deg)' }} /> Back to cart
              </button>
            </aside>
          </form>
        </div>
      </section>

      <Toast message={toast} />
    </>
  )
}
