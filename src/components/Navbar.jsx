import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Search, ShoppingBag, LibraryBig, Menu, X } from 'lucide-react'
import { useCart } from '../context/CartContext.jsx'
import { useAuth } from '../context/AuthContext.jsx'

const LINKS = [
  { to: '/', label: 'Home', n: '01' },
  { to: '/shop', label: 'Shop', n: '02' },
  { to: '/shop?type=course', label: 'Courses', n: '03' },
  { to: '/shop?type=ebook', label: 'E-books', n: '04' },
]

export default function Navbar() {
  const { count } = useCart()
  const { user, signOut } = useAuth()
  const location = useLocation()
  const [menuOpen, setMenuOpen] = useState(false)

  const isActive = (to) => {
    const [path, search] = to.split('?')
    if (path !== location.pathname) return false
    if (!search) return !location.search
    return location.search.includes(search)
  }

  // Close the panel whenever the route changes
  useEffect(() => {
    setMenuOpen(false)
  }, [location.pathname, location.search])

  const handleSignOut = async () => {
    setMenuOpen(false)
    await signOut()
  }

  return (
    <header className="nav">
      <div className="container nav-inner">
        <Link to="/" className="brand" onClick={() => setMenuOpen(false)}>
          <span className="brand-mark">
            <LibraryBig size={19} />
          </span>
          <span className="brand-name">
            Keisha Store
            <span className="brand-sub">Books &amp; Courses</span>
          </span>
        </Link>

        {/* desktop links */}
        <nav className="nav-links">
          {LINKS.map((l) => (
            <Link key={l.label} to={l.to} className={`nav-link${isActive(l.to) ? ' active' : ''}`}>
              <span className="nav-link-n">{l.n}</span>
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="nav-actions">
          <button className="nav-icon-btn nav-search" aria-label="Search" title="Search (coming soon)">
            <Search size={19} />
          </button>
          <Link to="/cart" className="nav-icon-btn" aria-label={`Cart, ${count} items`}>
            <ShoppingBag size={19} />
            {count > 0 && <span className="cart-count">{count}</span>}
          </Link>
          {user ? (
            <button
              className="nav-auth-link"
              onClick={handleSignOut}
              title="Sign out"
            >
              Sign Out
            </button>
          ) : (
            <Link to="/login" className="nav-auth-link">
              Sign In
            </Link>
          )}
          <button
            className="nav-icon-btn nav-burger"
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((v) => !v)}
          >
            {menuOpen ? <X size={19} /> : <Menu size={19} />}
          </button>
        </div>
      </div>

      {/* mobile slide-down menu */}
      {menuOpen && (
        <nav className="nav-menu">
          <span className="tool-label">Menu</span>
          {LINKS.map((l) => (
            <Link key={l.label} to={l.to} className={`nav-link${isActive(l.to) ? ' active' : ''}`}>
              <span className="nav-link-n">{l.n}</span>
              {l.label}
            </Link>
          ))}
          {user && (
            <button className="nav-link" onClick={handleSignOut}>
              <span className="nav-link-n">05</span>
              Sign Out
            </button>
          )}
        </nav>
      )}
    </header>
  )
}
