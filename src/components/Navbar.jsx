import { Link, useLocation } from 'react-router-dom'
import { Search, ShoppingBag, LibraryBig } from 'lucide-react'
import { useCart } from '../context/CartContext.jsx'

const LINKS = [
  { to: '/', label: 'Home' },
  { to: '/shop', label: 'Shop' },
  { to: '/shop?type=course', label: 'Courses' },
  { to: '/shop?type=ebook', label: 'E-books' },
]

export default function Navbar() {
  const { count } = useCart()
  const location = useLocation()

  const isActive = (to) => {
    const [path, search] = to.split('?')
    if (path !== location.pathname) return false
    if (!search) return !location.search
    return location.search.includes(search)
  }

  return (
    <header className="nav">
      <div className="container nav-inner">
        <Link to="/" className="brand">
          <span className="brand-mark">
            <LibraryBig size={20} />
          </span>
          <span className="brand-name">
            Keisha Store
            <span className="brand-sub">Books &amp; Courses</span>
          </span>
        </Link>

        <nav className="nav-links">
          {LINKS.map((l) => (
            <Link key={l.label} to={l.to} className={`nav-link${isActive(l.to) ? ' active' : ''}`}>
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="nav-actions">
          <button className="nav-icon-btn" aria-label="Search" title="Search (coming soon)">
            <Search size={19} />
          </button>
          <Link to="/cart" className="nav-icon-btn" aria-label={`Cart, ${count} items`}>
            <ShoppingBag size={19} />
            {count > 0 && <span className="cart-count">{count}</span>}
          </Link>
        </div>
      </div>
    </header>
  )
}
