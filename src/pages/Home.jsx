import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Download,
  Infinity as InfinityIcon,
  ShieldCheck,
  MonitorSmartphone,
  ArrowRight,
  BookOpen,
  Globe,
  Briefcase,
  Sparkles,
  PenTool,
  Megaphone,
  BadgeCheck,
  Star,
  Users,
  Award,
  TrendingUp,
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
      {/* ================= HERO ================= */}
      <section className="hero">
        <div className="container hero-inner">
          <div className="hero-copy fade-up">
            <span className="eyebrow">Discover. Read. Grow.</span>
            <h1>
              Books for every mind,<br />
              <em>courses</em> for every skill.
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
              <span className="hero-proof-text" style={{ display: 'grid' }}>
                <span style={{ display: 'inline-flex', gap: 2 }}>
                  {[1, 2, 3, 4, 5].map((n) => (
                    <Star key={n} size={12} fill="var(--gold)" color="var(--gold)" />
                  ))}
                </span>
                Loved by <strong>10,000+ readers &amp; learners</strong>
              </span>
            </div>
          </div>

          <div className="hero-visual">
            <div className="hero-card" />
            <span className="hero-ring" />
            <div className="hero-covers">
              {heroProducts.map((p, i) => (
                <div
                  key={p.id}
                  className="bcov-wrap"
                  style={{
                    transform: `rotate(${(i - 1) * 7}deg) translateY(${i === 1 ? -22 : 8}px)`,
                    zIndex: i === 1 ? 3 : 2,
                    width: '31%',
                    boxShadow: '0 24px 60px rgba(10, 20, 15, 0.4)',
                    borderRadius: 10,
                  }}
                >
                  <BookCover product={p} />
                </div>
              ))}
            </div>
            <div className="hero-badge">
              New<br />Arrivals<br />
              <span>This Week</span>
            </div>
          </div>
        </div>
      </section>

      {/* ================= FEATURES ================= */}
      <div className="container features">
        <div className="features-card">
          <div className="feature">
            <span className="feature-icon"><Download size={19} /></span>
            <div>
              <h4>Instant Download</h4>
              <p>Your files and lessons unlock the second you check out.</p>
            </div>
          </div>
          <div className="feature">
            <span className="feature-icon"><InfinityIcon size={19} /></span>
            <div>
              <h4>Lifetime Access</h4>
              <p>Buy once. Yours forever, including free updates.</p>
            </div>
          </div>
          <div className="feature">
            <span className="feature-icon"><ShieldCheck size={19} /></span>
            <div>
              <h4>Secure Checkout</h4>
              <p>Encrypted payments you can trust, every order.</p>
            </div>
          </div>
          <div className="feature">
            <span className="feature-icon"><MonitorSmartphone size={19} /></span>
            <div>
              <h4>Any Device</h4>
              <p>Read and watch anywhere — phone, tablet or desktop.</p>
            </div>
          </div>
        </div>
      </div>

      {/* ================= CATEGORIES ================= */}
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
          <div className="cat-grid">
            {CATEGORIES.map((cat) => {
              const Icon = CAT_ICONS[cat.icon] || BookOpen
              const n = products.filter((p) => p.category === cat.name).length
              return (
                <Link
                  key={cat.name}
                  to={`/shop?category=${encodeURIComponent(cat.name)}`}
                  className="cat-tile"
                >
                  <span className="cat-icon">
                    <Icon size={22} color="var(--gold-soft)" />
                  </span>
                  <span className="cat-name">{cat.name}</span>
                  <span className="cat-count">{cat.desc} · {n} items</span>
                </Link>
              )
            })}
          </div>
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

      {/* ================= NEWSLETTER ================= */}
      <section className="section" style={{ paddingTop: 0 }}>
        <div className="container">
          <div className="newsletter">
            <div>
              <span className="eyebrow no-line" style={{ color: 'var(--gold-soft)' }}>
                Be part of our reading community
              </span>
              <h3>Get updates, exclusive deals &amp; free picks</h3>
              <p>
                Join the newsletter and be first to hear about new arrivals, hidden gems and
                seasonal discounts.
              </p>
            </div>
            <form
              className="newsletter-form"
              onSubmit={(e) => {
                e.preventDefault()
                showToast('Subscribed — welcome to the community')
                e.target.reset()
              }}
              style={{ display: 'grid', gap: 12 }}
            >
              <input type="email" required placeholder="Enter your email" />
              <button className="btn btn-gold" type="submit">Subscribe</button>
            </form>
            <p className="newsletter-note">No spam, unsubscribe anytime.</p>
          </div>
        </div>
      </section>

      {/* ================= TRUST BAR ================= */}
      <div className="container">
        <div className="trustbar">
          <div className="trust-item">
            <BadgeCheck size={20} />
            <span>Handpicked books &amp; courses</span>
          </div>
          <div className="trust-item">
            <Users size={20} />
            <span>Trusted by 10,000+ readers</span>
          </div>
          <div className="trust-item">
            <Award size={20} />
            <span>Quality you can trust</span>
          </div>
          <div className="trust-item">
            <TrendingUp size={20} />
            <span>Skills that stay forever</span>
          </div>
        </div>
      </div>

      <Toast message={toast} />
    </>
  )
}
