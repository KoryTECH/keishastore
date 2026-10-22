import { useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { SlidersHorizontal } from 'lucide-react'
import { useAdmin } from '../context/AdminContext.jsx'
import { useCart } from '../context/CartContext.jsx'
import ProductCard from '../components/ProductCard.jsx'
import Toast from '../components/Toast.jsx'
import { CATEGORIES } from '../data/products.js'

const TYPES = [
  { value: 'all', label: 'All products' },
  { value: 'ebook', label: 'E-books' },
  { value: 'course', label: 'Courses' },
]

export default function Shop() {
  const { products } = useAdmin()
  const [params, setParams] = useSearchParams()
  const [sort, setSort] = useState('popular')
  const { add } = useCart()
  const [toast, setToast] = useState('')

  const showToast = (msg) => {
    setToast(msg)
    window.clearTimeout(showToast._t)
    showToast._t = window.setTimeout(() => setToast(''), 2200)
  }

  const type = params.get('type') || 'all'
  const category = params.get('category') || 'all'
  const query = params.get('q') || ''

  const filtered = useMemo(() => {
    let list = products.filter(
      (p) =>
        (type === 'all' || p.type === type) &&
        (category === 'all' || p.category === category) &&
        (!query || p.title.toLowerCase().includes(query.toLowerCase()) || p.author.toLowerCase().includes(query.toLowerCase())),
    )
    switch (sort) {
      case 'price-asc':
        list = [...list].sort((a, b) => a.price - b.price)
        break
      case 'price-desc':
        list = [...list].sort((a, b) => b.price - a.price)
        break
      case 'rating':
        list = [...list].sort((a, b) => b.rating - a.rating)
        break
      default:
        list = [...list].sort((a, b) => b.reviews - a.reviews)
    }
    return list
  }, [products, type, category, query, sort])

  const setParam = (key, value) => {
    const next = new URLSearchParams(params)
    if (!value || value === 'all') next.delete(key)
    else next.set(key, value)
    setParams(next, { replace: true })
  }

  return (
    <>
      <div className="page-head">
        <div className="container">
          <div className="breadcrumb">
            <Link to="/">Home</Link>
            <span className="sep">/</span>
            <span>Shop</span>
          </div>
          <h1 className="display">The Shelf</h1>
          <p className="muted" style={{ margin: '8px 0 0', maxWidth: 520 }}>
            Every e-book and course on the shelf, ready to download the moment you check out.
          </p>
        </div>
      </div>

      <section className="section-tight">
        <div className="container">
          <div className="shop-layout">
            {/* ---------- Filters ---------- */}
            <aside className="filter-card">
              <h5 style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <SlidersHorizontal size={14} /> Filters
              </h5>

              <div className="filter-group">
                <h5>Format</h5>
                <div className="chip-row">
                  {TYPES.map((t) => (
                    <button
                      key={t.value}
                      className={`chip${type === t.value ? ' active' : ''}`}
                      onClick={() => setParam('type', t.value)}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="filter-group">
                <h5>Category</h5>
                <div className="chip-row">
                  <button
                    className={`chip${category === 'all' ? ' active' : ''}`}
                    onClick={() => setParam('category', 'all')}
                  >
                    All
                  </button>
                  {CATEGORIES.map((c) => (
                    <button
                      key={c.name}
                      className={`chip${category === c.name ? ' active' : ''}`}
                      onClick={() => setParam('category', c.name)}
                    >
                      {c.name}
                    </button>
                  ))}
                </div>
              </div>

              <div className="filter-group">
                <h5>Results</h5>
                <p className="muted small" style={{ margin: 0 }}>
                  <b style={{ color: 'var(--green-950)' }}>{filtered.length}</b> product
                  {filtered.length === 1 ? '' : 's'} on the shelf
                </p>
              </div>
            </aside>

            {/* ---------- Grid ---------- */}
            <div>
              <div className="sort-row">
                <span className="muted small">
                  Showing <b style={{ color: 'var(--green-950)' }}>{filtered.length}</b> of {products.length} products
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <label htmlFor="sort">Sort by</label>
                  <select id="sort" className="select" value={sort} onChange={(e) => setSort(e.target.value)}>
                    <option value="popular">Most popular</option>
                    <option value="rating">Highest rated</option>
                    <option value="price-asc">Price: low to high</option>
                    <option value="price-desc">Price: high to low</option>
                  </select>
                </span>
              </div>

              {filtered.length === 0 ? (
                <div className="empty-state">
                  <h3>Nothing matches those filters</h3>
                  <p>Try removing a category or switching format.</p>
                  <button className="btn btn-outline" onClick={() => setParams({}, { replace: true })}>
                    Clear filters
                  </button>
                </div>
              ) : (
                <div className="product-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(230px, 1fr))' }}>
                  {filtered.map((p) => (
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
              )}
            </div>
          </div>
        </div>
      </section>

      <Toast message={toast} />
    </>
  )
}
