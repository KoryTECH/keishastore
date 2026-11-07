import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Check, ArrowRight, ShoppingBag, Zap, Download, Loader2 } from 'lucide-react'
import { useAdmin } from '../context/AdminContext.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { useCart } from '../context/CartContext.jsx'
import { supabase } from '../lib/supabase.js'
import BookCover from '../components/BookCover.jsx'
import Stars from '../components/Stars.jsx'
import ProductCard from '../components/ProductCard.jsx'
import Toast from '../components/Toast.jsx'
import { money, getTypeLabel, getIncludes } from '../data/products.js'

export default function ProductDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { productById, products } = useAdmin()
  const { user, profile } = useAuth()
  const { add } = useCart()
  const [toast, setToast] = useState('')
  const [dlBusy, setDlBusy] = useState(false)

  const product = productById(id)

  // ----- reviews: read-only list (approved only) + submission form -----
  const [reviewList, setReviewList] = useState(null) // null = loading
  const [rf, setRf] = useState({ name: profile?.full_name ?? '', rating: 5, body: '' })
  const [rBusy, setRBusy] = useState(false)
  const [rErr, setRErr] = useState('')
  const [rSent, setRSent] = useState(false)

  // Public reads are limited to approved rows by RLS — the same
  // fetch is safe for guests and signed-in readers.
  useEffect(() => {
    if (!product) return
    let cancelled = false
    setReviewList(null)
    ;(async () => {
      const { data } = await supabase
        .from('reviews')
        .select('id, name, rating, body, created_at')
        .eq('product_id', product.id)
        .eq('approved', true)
        .order('created_at', { ascending: false })
        .limit(20)
      if (!cancelled) setReviewList(data ?? [])
    })()
    return () => {
      cancelled = true
    }
  }, [product, products]) // refetch when catalog loads/reloads

  const submitReview = async (e) => {
    e.preventDefault()
    if (!product) return
    setRBusy(true)
    setRErr('')
    try {
      const { error } = await supabase.from('reviews').insert({
        product_id: product.id,
        name: rf.name.trim() || 'Anonymous reader',
        user_id: user?.id ?? null,
        rating: Number(rf.rating),
        body: rf.body.trim(),
      })
      if (error) throw error
      setRSent(true)
      setRf((f) => ({ ...f, body: '' }))
    } catch (err) {
      setRErr(err.message)
    } finally {
      setRBusy(false)
    }
  }

  // Free products (price 0) download directly — no cart, no login,
  // no order. The storage policy in 09_free_product_files.sql
  // lets anyone read files whose product costs $0.
  const isFree = product?.price === 0

  const downloadFree = async () => {
    if (!product?.filePath || dlBusy) return
    setDlBusy(true)
    try {
      const { data, error } = await supabase.storage
        .from('product-files')
        .createSignedUrl(product.filePath, 300)
      if (error) throw error
      window.open(data.signedUrl, '_blank', 'noopener,noreferrer')
    } catch (err) {
      showToast(`Download failed — ${err.message}`)
    } finally {
      setDlBusy(false)
    }
  }

  if (!product) {
    return (
      <section className="section">
        <div className="container">
          <div className="empty-state">
            <h3>That item is no longer on the shelf</h3>
            <p>It may have sold out, been unpublished, or the link is wrong.</p>
            <Link to="/shop" className="btn btn-primary">Back to shop</Link>
          </div>
        </div>
      </section>
    )
  }

  const showToast = (msg) => {
    setToast(msg)
    window.clearTimeout(showToast._t)
    showToast._t = window.setTimeout(() => setToast(''), 2200)
  }

  const onSale = product.oldPrice != null && product.oldPrice > product.price
  const percent = onSale ? Math.round(((product.oldPrice - product.price) / product.oldPrice) * 100) : 0
  const related = products
    .filter((p) => p.id !== product.id && p.category === product.category)
    .slice(0, 4)
  const fallbackRelated = products.filter((p) => p.id !== product.id).slice(0, 4)
  const rel = related.length >= 2 ? related : fallbackRelated

  return (
    <>
      <div className="page-head">
        <div className="container">
          <div className="breadcrumb">
            <Link to="/">Home</Link>
            <span className="sep">/</span>
            <Link to="/shop">Shop</Link>
            <span className="sep">/</span>
            <span>{product.title}</span>
          </div>
        </div>
      </div>

      <section className="section-tight">
        <div className="container">
          <div className="detail-layout fade-up">
            <div className="detail-cover">
              <div className="pc-cover" style={{ aspectRatio: '3/3.6' }}>
                <span className={`pc-type ${product.type}`}>{getTypeLabel(product.type)}</span>
                {onSale && <span className="pc-sale">-{percent}%</span>}
                <BookCover product={product} />
              </div>
            </div>

            <div className="detail-info">
              <span className={`pc-type ${product.type}`}>{getTypeLabel(product.type)}</span>
              <h1>{product.title}</h1>
              <p className="detail-by">
                by <b>{product.author}</b> · {product.category}
              </p>

              <span style={{ display: 'inline-flex', gap: 8, alignItems: 'center' }}>
                <Stars value={product.rating} />
                <span className="muted small">
                  {product.rating} · {product.reviews} reviews
                </span>
              </span>

              <p className="detail-desc">{product.description}</p>

              <div className="detail-price">
                <span className="now">{isFree ? 'Free' : money(product.price)}</span>
                {onSale && <span className="was">{money(product.oldPrice)}</span>}
                {onSale && <span className="save">Save {percent}%</span>}
              </div>

              <div className="detail-ctas">
                {isFree ? (
                  !user ? (
                    <button
                      className="btn btn-gold"
                      onClick={() => navigate(`/login?next=/product/${product.id}`)}
                    >
                      <Download size={15} /> Sign in to Download Free Copy
                    </button>
                  ) : product.filePath ? (
                    <button className="btn btn-gold" onClick={downloadFree} disabled={dlBusy}>
                      {dlBusy ? (
                        <Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} />
                      ) : (
                        <Download size={15} />
                      )}
                      Download Free Copy
                    </button>
                  ) : (
                    <span className="muted small" style={{ padding: '8px 0' }}>
                      Free copy — the file is being prepared. Check back shortly.
                    </span>
                  )
                ) : (
                  <>
                    <button
                      className="btn btn-primary"
                      onClick={() => {
                        add(product.id)
                        showToast(`${product.title} added to cart`)
                      }}
                    >
                      <ShoppingBag size={15} /> Add to Cart
                    </button>
                    <button
                      className="btn btn-gold"
                      onClick={() => {
                        add(product.id)
                        navigate('/checkout')
                      }}
                    >
                      <Zap size={15} /> Buy It Now
                    </button>
                  </>
                )}
              </div>

              <div className="includes">
                <h4>What you get</h4>
                <ul>
                  {getIncludes(product).map((line) => (
                    <li key={line}>
                      <Check size={15} /> {line}
                    </li>
                  ))}
                </ul>
              </div>

              {/* ---------- reviews ---------- */}
              <div className="includes" style={{ marginTop: 18 }}>
                <h4>
                  Reader reviews{' '}
                  {reviewList && (
                    <span className="muted" style={{ fontSize: 12, fontWeight: 400 }}>
                      ({reviewList.length})
                    </span>
                  )}
                </h4>

                {reviewList === null && <p className="muted small">Loading reviews…</p>}
                {reviewList?.length === 0 && (
                  <p className="muted small">No reviews yet — be the first reader to leave one.</p>
                )}
                {(reviewList ?? []).map((r) => (
                  <div
                    key={r.id}
                    style={{
                      padding: '12px 0',
                      borderBottom: '1px dashed var(--line-soft)',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        gap: 12,
                        alignItems: 'baseline',
                        flexWrap: 'wrap',
                      }}
                    >
                      <b style={{ fontSize: 14 }}>{r.name}</b>
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 8,
                        }}
                      >
                        <Stars value={Number(r.rating)} />
                        <span className="muted" style={{ fontSize: 11.5 }}>
                          {new Date(r.created_at).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </span>
                      </span>
                    </div>
                    <p style={{ margin: '6px 0 0', fontSize: 14, color: 'var(--body)' }}>
                      {r.body}
                    </p>
                  </div>
                ))}

                {/* submission form */}
                <form onSubmit={submitReview} style={{ marginTop: 18 }}>
                  {rSent ? (
                    <p
                      style={{
                        color: '#2E7D50',
                        fontSize: 13,
                        fontWeight: 600,
                        margin: 0,
                      }}
                    >
                      Thank you — your review is in! It appears here once Keisha gives it a
                      quick look. ✅
                    </p>
                  ) : (
                    <>
                      <h5
                        style={{
                          fontFamily: 'var(--font-display)',
                          fontWeight: 600,
                          fontSize: 15,
                          margin: '0 0 10px',
                        }}
                      >
                        Write a review
                      </h5>
                      {rErr && (
                        <div className="login-error" style={{ marginBottom: 12 }}>
                          {rErr}
                        </div>
                      )}
                      <div className="form-grid" style={{ gap: 12 }}>
                        <div className="field">
                          <label htmlFor="rv-name">Your name</label>
                          <input
                            id="rv-name"
                            maxLength={60}
                            placeholder="Ada O."
                            value={rf.name}
                            onChange={(e) => setRf((f) => ({ ...f, name: e.target.value }))}
                          />
                        </div>
                        <div className="field">
                          <label htmlFor="rv-rating">Rating</label>
                          <select
                            id="rv-rating"
                            value={rf.rating}
                            onChange={(e) =>
                              setRf((f) => ({ ...f, rating: Number(e.target.value) }))
                            }
                          >
                            <option value="5">5 — Loved it</option>
                            <option value="4">4 — Really good</option>
                            <option value="3">3 — Just okay</option>
                            <option value="2">2 — Not for me</option>
                            <option value="1">1 — Poor</option>
                          </select>
                        </div>
                        <div className="field full">
                          <label htmlFor="rv-body">Your review</label>
                          <textarea
                            id="rv-body"
                            rows={3}
                            maxLength={800}
                            placeholder="What did you think of this one? (min 5 characters)"
                            value={rf.body}
                            onChange={(e) => setRf((f) => ({ ...f, body: e.target.value }))}
                          />
                        </div>
                      </div>
                      <button
                        type="submit"
                        className="btn btn-outline btn-sm"
                        disabled={rBusy || rf.body.trim().length < 5}
                        style={{ marginTop: 12 }}
                      >
                        {rBusy ? 'Submitting…' : 'Submit Review'}
                      </button>
                    </>
                  )}
                </form>
              </div>
            </div>
          </div>
        </div>
      </section>

      {rel.length > 0 && (
        <section className="section" style={{ paddingTop: 10 }}>
          <div className="container">
            <div className="section-head">
              <div>
                <span className="eyebrow">Keep browsing</span>
                <h2>You may also like</h2>
              </div>
              <Link to="/shop" className="head-link">
                View all <ArrowRight size={13} />
              </Link>
            </div>
            <div className="product-grid">
              {rel.map((p) => (
                <ProductCard
                  key={p.id}
                  product={p}
                  onAdded={() => {
                    add(p.id)
                    showToast(`${p.title} added to cart`)
                  }}
                />
              ))}
            </div>
          </div>
        </section>
      )}

      <Toast message={toast} />
    </>
  )
}
