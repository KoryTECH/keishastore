import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Trash2, Minus, Plus, Zap, ShieldCheck, BellRing } from 'lucide-react'
import { useAdmin } from '../context/AdminContext.jsx'
import { useCart } from '../context/CartContext.jsx'
import BookCover from '../components/BookCover.jsx'
import Toast from '../components/Toast.jsx'
import { money, getTypeLabel } from '../data/products.js'

export default function Cart() {
  const { items, setQty, remove } = useCart()
  const { productById } = useAdmin()
  const [toast, setToast] = useState('')

  const lines = items
    .map((it) => ({ ...it, product: productById(it.id) }))
    .filter((l) => l.product)
  const subtotal = lines.reduce((sum, l) => sum + l.product.price * l.qty, 0)
  const discount = 0 // promos wired up with the payment system

  const showToast = (msg) => {
    setToast(msg)
    window.clearTimeout(showToast._t)
    showToast._t = window.setTimeout(() => setToast(''), 2200)
  }

  return (
    <>
      <div className="page-head">
        <div className="container">
          <div className="breadcrumb">
            <Link to="/">Home</Link>
            <span className="sep">/</span>
            <span>Cart</span>
          </div>
          <h1 className="display">Your Cart</h1>
          <p className="muted" style={{ margin: '8px 0 0' }}>
            {lines.length === 0
              ? 'Your cart is waiting for its first read.'
              : `${lines.length} item${lines.length === 1 ? '' : 's'} · instant delivery after checkout`}
          </p>
        </div>
      </div>

      <section className="section-tight">
        <div className="container">
          {lines.length === 0 ? (
            <div className="empty-state fade-up">
              <BellRing size={0} style={{ display: 'none' }} />
              <h3>Your cart is empty</h3>
              <p>Pick up an e-book or course and carry on from here.</p>
              <Link to="/shop" className="btn btn-primary">
                Browse the shelf
              </Link>
            </div>
          ) : (
            <div className="cart-layout">
              <div className="cart-list">
                {lines.map(({ product, qty }) => (
                  <div className="cart-row" key={product.id}>
                    <Link to={`/product/${product.id}`} style={{ display: 'block' }}>
                      <BookCover product={product} compact />
                    </Link>
                    <div>
                      <span className={`type-tag ${product.type === 'course' ? 'type-course' : 'type-book'}`}>
                        {getTypeLabel(product.type)}
                      </span>
                      <h3 className="cart-row-title">
                        <Link to={`/product/${product.id}`}>{product.title}</Link>
                      </h3>
                      <p className="cart-row-meta">
                        by {product.author} · {product.category}
                      </p>
                    </div>
                    <div className="cart-row-actions">
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, border: '1px solid var(--line)', borderRadius: 999, padding: 4 }}>
                        <button className="icon-btn" style={{ border: 'none' }} aria-label="Decrease quantity" onClick={() => setQty(product.id, qty - 1)}>
                          <Minus size={13} />
                        </button>
                        <span style={{ minWidth: 20, textAlign: 'center', fontWeight: 700, fontSize: 13 }}>{qty}</span>
                        <button className="icon-btn" style={{ border: 'none' }} aria-label="Increase quantity" onClick={() => setQty(product.id, qty + 1)}>
                          <Plus size={13} />
                        </button>
                      </div>
                      <span className="cart-row-price">{money(product.price * qty)}</span>
                      <button
                        className="icon-btn"
                        aria-label={`Remove ${product.title}`}
                        onClick={() => {
                          remove(product.id)
                          showToast(`${product.title} removed from cart`)
                        }}
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <aside className="summary-card">
                <h3>Order Summary</h3>
                <div className="sum-row">
                  <span>Subtotal</span>
                  <span>{money(subtotal)}</span>
                </div>
                {discount > 0 && (
                  <div className="sum-row">
                    <span>Discount</span>
                    <span>−{money(discount)}</span>
                  </div>
                )}
                <div className="sum-row">
                  <span>Delivery</span>
                  <span style={{ color: 'var(--gold-deep)', fontWeight: 600 }}>Instant · Free</span>
                </div>
                <div className="sum-row total">
                  <span>Total</span>
                  <span className="val">{money(subtotal - discount)}</span>
                </div>

                <Link to="/checkout" className="btn btn-gold btn-block" style={{ marginTop: 18 }}>
                  <Zap size={15} /> Proceed to Checkout
                </Link>
                <Link to="/shop" className="btn btn-outline btn-block" style={{ marginTop: 10 }}>
                  Continue Shopping
                </Link>

                <div className="sum-note">
                  <ShieldCheck size={16} />
                  <span>Secure encrypted checkout — payment providers are wired up in the next phase.</span>
                </div>
              </aside>
            </div>
          )}
        </div>
      </section>

      <Toast message={toast} />
    </>
  )
}
