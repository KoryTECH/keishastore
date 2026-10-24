import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  ArrowRight,
  BookOpen,
  Globe,
  Briefcase,
  Sparkles,
  PenTool,
  Megaphone,
  Star,
} from 'lucide-react'
import { useCart } from '../context/CartContext.jsx'
import { useAdmin } from '../context/AdminContext.jsx'
import ProductCard from '../components/ProductCard.jsx'
import BookCover from '../components/BookCover.jsx'
import Toast from '../components/Toast.jsx'
import { CATEGORIES } from '../data/products.js'

const CAT_ICONS = {
  BookOpen,
  Globe,
  Briefcase,
  Sparkles,
  PenTool,
  Megaphone,
}

const PROOF_AVATARS = [
  { initials: 'KJ', bg: '#3A6B50' },
  { initials: 'DM', bg: '#C9A24B' },
  { initials: 'SO', bg: '#2E5540' },
  { initials: 'TL', bg: '#58866A' },
]

export default function Home() {
  const { add } = useCart()
  const { products } = useAdmin()
  const navigate = useNavigate()
  const [toast, setToast] = useState('')

  const showToast = (msg) => {
    setToast(msg)
    window.clearTimeout(showToast._t)
    showToast._t = window.setTimeout(() => setToast(''), 2200)
  }

  const addToCart = (product) => {
    add(product.id)
    showToast(`${product.title} added to cart`)
  }

  const bestsellers = [...products]
    .sort((a, b) => b.reviews - a.reviews)
    .slice(0, 6)
  const heroProducts = [products.find((p) => p.id === 'p05') || products[4],
    products.find((p) => p.id === 'p02') || products[1],
    products.find((p) => p.id === 'p01') || products[0]].filter(Boolean)

  return (
    <>
      {/* ================= HERO — centered masthead ================= */}
      <section className="hero">
        <div className="container hero-mast fade-up">
          <span className="eyebrow no-line">The spring catalogue · Est. 2026</span>
          <h1>
            Books for every mind, <em>courses</em> for every skill.
          </h1>
          <p className="hero-sub">
            Keisha Store is a curated digital shelf — pick an e-book to get lost in, or a course
            that quietly changes the way you work. Download instantly, learn today.
          </p>
          <div className="hero-cta">
            <button className="btn btn-primary" onClick={() => navigate('/shop')}>
              Shop Now <ArrowRight size={15} />
            </button>
            <Link to="/shop?type=course" className="btn btn-outline">
              Explore Courses
            </Link>
          </div>
          <div className="hero-proof">
            <span className="avatar-stack">
              {PROOF_AVATARS.map((a) => (
                <span key={a.initials} className="avatar" style={{ background: a.bg }}>
                  {a.initials}
                </span>
              ))}
            </span>
            <span className="hero-proof-text">
              <span className="star-row" style={{ display: 'inline-flex', gap: 2, verticalAlign: '-2px' }}>
                {[1, 2, 3, 4, 5].map((n) => (
                  <Star key={n} size={12} fill="var(--gold)" color="var(--gold)" />
                ))}
              </span>{' '}
              Loved by <strong>10,000+ readers &amp; learners</strong>
            </span>
          </div>
        </div>

        {/* full-width shelf stage */}
        <div className="hero-stage">
          <span className="hero-glyph" aria-hidden="true">K</span>
          <span className="hero-mono-label">Instant download ✳ Small press ✳ Lifetime access</span>
          <div className="hero-badge">
            New<br />Arrivals<br />
            <span>This Week</span>
          </div>
          <div className="container hero-stage-inner">
            {heroProducts.map((p) => (
              <Link
                key={p.id}
                to={`/product/${p.id}`}
                className="bcov-wrap"
                aria-label={p.title}
              >
                <BookCover product={p} />
              </Link>
            ))}
          </div>
          <div className="container">
            <div className="hero-shelf" />
            <div className="hero-shelf-feet">
              <span /><span /><span />
            </div>
          </div>
        </div>
      </section>

      {/* ================= FEATURES — numbered ledger ================= */}
      <div className="container features">
        <div className="features-card">
          <div className="feature">
            <span className="feature-num">01</span>
            <div>
              <h4>Instant Download</h4>
              <p>Your files and lessons unlock the second you check out.</p>
            </div>
          </div>
          <div className="feature">
            <span className="feature-num">02</span>
            <div>
              <h4>Lifetime Access</h4>
              <p>Buy once. Yours forever, including free updates.</p>
            </div>
          </div>
          <div className="feature">
            <span className="feature-num">03</span>
            <div>
              <h4>Secure Checkout</h4>
              <p>Encrypted payments you can trust, every order.</p>
            </div>
          </div>
          <div className="feature">
            <span className="feature-num">04</span>
            <div>
              <h4>Any Device</h4>
              <p>Read and watch anywhere — phone, tablet or desktop.</p>
            </div>
          </div>
        </div>
      </div>

      {/* ================= CATEGORIES — ruled index list ================= */}
      <section className="section">
        <div className="container">
          <div className="section-head">
            <div>
              <span className="eyebrow">Browse by category</span>
              <h2>Find your next read</h2>
            </div>
            <Link to="/shop" className="head-link">
              View all categories <ArrowRight size={13} />
            </Link>
          </div>
          <ul className="cat-index">
            {CATEGORIES.map((cat, i) => {
              const Icon = CAT_ICONS[cat.icon] || BookOpen
              const n = products.filter((p) => p.category === cat.name).length
              return (
                <li key={cat.name} style={{ display: 'contents' }}>
                  <Link className="cat-row" to={`/shop?category=${encodeURIComponent(cat.name)}`}>
                    <span className="cat-n">{String(i + 1).padStart(2, '0')}.</span>
                    <span className="cat-name">
                      <Icon size={16} style={{ display: 'inline', verticalAlign: '-2px', color: 'var(--gold-deep)', marginRight: 10 }} />
                      {cat.name}
                    </span>
                    <span className="cat-desc">{cat.desc}</span>
                    <span className="cat-count">{n} items</span>
                    <span className="cat-arrow"><ArrowRight size={17} /></span>
                  </Link>
                </li>
              )
            })}
          </ul>
        </div>
      </section>

      {/* ================= BESTSELLERS ================= */}
      <section className="section" style={{ paddingTop: 0 }}>
        <div className="container">
          <div className="section-head">
            <div>
              <span className="eyebrow">Bestsellers</span>
              <h2>Readers&apos; all-time favorites</h2>
            </div>
            <Link to="/shop" className="head-link">
              View all books <ArrowRight size={13} />
            </Link>
          </div>
          <div className="product-grid">
            {bestsellers.map((p) => (
              <ProductCard key={p.id} product={p} onAdded={() => addToCart(p)} />
            ))}
          </div>
        </div>
      </section>

      {/* ================= MANTRA ================= */}
      <div className="container-mantra" style={{ padding: '10px 24px 70px' }}>
        <div className="mantra">
          <p className="mantra-quote">“Buy once, keep forever — <span style={{ color: 'var(--gold-deep)' }}>knowledge is the only asset</span> that compounds.”</p>
          <span className="mantra-note">Keisha Store · Digital Shelf</span>
        </div>
      </div>

      {/* ================= NEWSLETTER — full band ================= */}
      <section style={{ paddingTop: 0 }}>
        <div className="container">
          <div className="newsletter fade-up">
            <div className="newsletter-inner">
              <span className="eyebrow">The reading community</span>
              <h3>Get updates, exclusive <em>deals</em> &amp; free picks</h3>
              <p>
                Join the newsletter and be first to hear about new arrivals, hidden gems and
                seasonal discounts.
              </p>
              <form
                className="newsletter-form"
                onSubmit={(e) => {
                  e.preventDefault()
                  showToast('Subscribed — welcome to the community')
                  e.target.reset()
                }}
              >
                <input type="email" required placeholder="Enter your email" />
                <button className="btn btn-gold" type="submit">Subscribe</button>
              </form>
              <p className="newsletter-note">No spam, unsubscribe anytime.</p>
            </div>
          </div>
        </div>
      </section>

      <Toast message={toast} />
    </>
  )
}
