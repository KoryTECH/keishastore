import { Suspense, lazy } from 'react'
import { Routes, Route } from 'react-router-dom'
import { CartProvider } from './context/CartContext.jsx'
import { AdminProvider } from './context/AdminContext.jsx'
import { AuthProvider } from './context/AuthContext.jsx'
import TopBar from './components/TopBar.jsx'
import Navbar from './components/Navbar.jsx'
import Footer from './components/Footer.jsx'
import ScrollToTop from './components/ScrollToTop.jsx'
import Home from './pages/Home.jsx'
import Shop from './pages/Shop.jsx'
import ProductDetail from './pages/ProductDetail.jsx'
import Cart from './pages/Cart.jsx'

// Heavy, less-frequent pages load on demand — a shopper opening a
// product link shouldn't download the admin panel first.
const Checkout = lazy(() => import('./pages/Checkout.jsx'))
const Account = lazy(() => import('./pages/Account.jsx'))
const Login = lazy(() => import('./pages/Login.jsx'))
const Signup = lazy(() => import('./pages/Signup.jsx'))
const Admin = lazy(() => import('./pages/Admin.jsx'))

// Same brand mark as the HTML splash — inline SVG keeps the eager
// bundle free of extra imports.
function LibraryIcon() {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-20" />
      <path d="M8 7h8" />
      <path d="M8 11h8" />
    </svg>
  )
}

// Storefront layout with chrome; Admin renders its own full-bleed layout.
function Storefront({ children }) {
  return (
    <>
      <TopBar />
      <Navbar />
      {children}
      <Footer />
    </>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <AdminProvider>
        <CartProvider>
          <ScrollToTop />
          {/* Route chunks load on demand — this loader covers the gap,
              styled exactly like the opening splash so it feels seamless. */}
          <Suspense
            fallback={
              <div className="admin-boot" role="status">
                <span className="brand-mark" style={{ width: 52, height: 52 }}>
                  <LibraryIcon />
                </span>
                Opening the page…
              </div>
            }
          >
            <Routes>
              <Route path="/" element={<Storefront><Home /></Storefront>} />
              <Route path="/shop" element={<Storefront><Shop /></Storefront>} />
              <Route path="/product/:id" element={<Storefront><ProductDetail /></Storefront>} />
              <Route path="/cart" element={<Storefront><Cart /></Storefront>} />
              <Route path="/checkout" element={<Storefront><Checkout /></Storefront>} />
              <Route path="/account" element={<Storefront><Account /></Storefront>} />
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/admin" element={<Admin />} />
              <Route
              path="*"
              element={
                <Storefront>
                  <section className="section">
                    <div className="container">
                      <div className="empty-state">
                        <h3>Page not found</h3>
                        <p>The page you are looking for does not exist — maybe it moved shelves.</p>
                        <a href="/" className="btn btn-primary">Back home</a>
                      </div>
                    </div>
                  </section>
                </Storefront>
              }
            />
            </Routes>
          </Suspense>
        </CartProvider>
      </AdminProvider>
    </AuthProvider>
  )
}
