import { Routes, Route } from 'react-router-dom'
import { CartProvider } from './context/CartContext.jsx'
import { AdminProvider } from './context/AdminContext.jsx'
import TopBar from './components/TopBar.jsx'
import Navbar from './components/Navbar.jsx'
import Footer from './components/Footer.jsx'
import ScrollToTop from './components/ScrollToTop.jsx'
import Home from './pages/Home.jsx'
import Shop from './pages/Shop.jsx'
import ProductDetail from './pages/ProductDetail.jsx'
import Cart from './pages/Cart.jsx'
import Checkout from './pages/Checkout.jsx'
import Admin from './pages/Admin.jsx'

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
    <AdminProvider>
      <CartProvider>
        <ScrollToTop />
        <Routes>
          <Route path="/" element={<Storefront><Home /></Storefront>} />
          <Route path="/shop" element={<Storefront><Shop /></Storefront>} />
          <Route path="/product/:id" element={<Storefront><ProductDetail /></Storefront>} />
          <Route path="/cart" element={<Storefront><Cart /></Storefront>} />
          <Route path="/checkout" element={<Storefront><Checkout /></Storefront>} />
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
      </CartProvider>
    </AdminProvider>
  )
}
