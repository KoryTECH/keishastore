import { Link } from 'react-router-dom'
import { LibraryBig, Facebook, Instagram, Twitter, Youtube } from 'lucide-react'

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        <span className="footer-word" aria-hidden="true">
          Keisha <em>Store</em>
        </span>
        <div className="footer-grid">
          <div className="footer-brand">
            <Link to="/" className="brand">
              <span className="brand-mark">
                <LibraryBig size={20} />
              </span>
              <span className="brand-name">
                Keisha Store
                <span className="brand-sub">Books &amp; Courses</span>
              </span>
            </Link>
            <p>
              Carefully picked e-books and courses to help you learn a skill, start a project, or
              just disappear into a great story.
            </p>
            <div className="socials">
              <a href="#" className="social-btn" aria-label="Facebook"><Facebook size={15} /></a>
              <a href="#" className="social-btn" aria-label="Instagram"><Instagram size={15} /></a>
              <a href="#" className="social-btn" aria-label="Twitter"><Twitter size={15} /></a>
              <a href="#" className="social-btn" aria-label="YouTube"><Youtube size={15} /></a>
            </div>
          </div>

          <div>
            <h5>Shop</h5>
            <ul className="footer-links">
              <li><Link to="/shop">All Products</Link></li>
              <li><Link to="/shop?type=ebook">E-books</Link></li>
              <li><Link to="/shop?type=course">Courses</Link></li>
              <li><Link to="/cart">Cart</Link></li>
            </ul>
          </div>

          <div>
            <h5>Help</h5>
            <ul className="footer-links">
              <li><a href="#">FAQs</a></li>
              <li><a href="#">Refund Policy</a></li>
              <li><a href="#">Delivery &amp; Downloads</a></li>
              <li><a href="#">Contact Us</a></li>
            </ul>
          </div>

          <div className="footer-news">
            <h5>Newsletter</h5>
            <p>Join the mailing list for new releases and subscriber-only deals.</p>
            <form className="footer-form" onSubmit={(e) => e.preventDefault()}>
              <input type="email" placeholder="Enter your email" />
              <button type="submit">Subscribe</button>
            </form>
            <div className="payments" aria-label="Accepted payment methods">
              <span className="pay-pill">VISA</span>
              <span className="pay-pill">MASTERCARD</span>
              <span className="pay-pill">PAYPAL</span>
              <span className="pay-pill">APPLE PAY</span>
            </div>
          </div>
        </div>

        <div className="footer-bottom">
          <span>© 2026 Keisha Store. All rights reserved.</span>
          <span>
            Digital storefront <Link to="/admin" className="link-gold">Owner login</Link>
          </span>
        </div>
      </div>
    </footer>
  )
}
