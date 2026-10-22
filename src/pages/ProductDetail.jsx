import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Check, ArrowRight, ShoppingBag, Zap } from 'lucide-react'
import { useAdmin } from '../context/AdminContext.jsx'
import { useCart } from '../context/CartContext.jsx'
import BookCover from '../components/BookCover.jsx'
import Stars from '../components/Stars.jsx'
import ProductCard from '../components/ProductCard.jsx'
import Toast from '../components/Toast.jsx'
import { money, getTypeLabel, getIncludes } from '../data/products.js'

export default function ProductDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { productById, products } = useAdmin()
  const { add } = useCart()
  const [toast, setToast] = useState('')

  const product = productById(id)

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
                <span className="now">{money(product.price)}</span>
                {onSale && <span className="was">{money(product.oldPrice)}</span>}
                {onSale && <span className="save">Save {percent}%</span>}
              </div>

              <div className="detail-ctas">
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
