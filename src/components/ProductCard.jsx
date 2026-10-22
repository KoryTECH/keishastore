import { Link, useNavigate } from 'react-router-dom'
import BookCover from './BookCover.jsx'
import Stars from './Stars.jsx'
import { money, getTypeLabel } from '../data/products.js'

export default function ProductCard({ product, onAdded }) {
  const navigate = useNavigate()
  const onSale = product.oldPrice != null && product.oldPrice > product.price
  const percent = onSale ? Math.round(((product.oldPrice - product.price) / product.oldPrice) * 100) : 0

  return (
    <article className="product-card">
      <div className="pc-cover">
        <span className={`pc-type ${product.type}`}>{getTypeLabel(product.type)}</span>
        {onSale && <span className="pc-sale">-{percent}%</span>}
        <Link to={`/product/${product.id}`} aria-label={product.title}>
          <BookCover product={product} />
        </Link>
      </div>

      <div className="pc-body">
        <Link to={`/product/${product.id}`}>
          <h3 className="pc-title">{product.title}</h3>
        </Link>
        <p className="pc-author">
          by <b>{product.author}</b>
        </p>

        <span className="pc-stars" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <Stars value={product.rating} />
          <span className="pc-rating-count">({product.reviews})</span>
        </span>

        <div className="pc-price">
          <span className={`now ${onSale ? 'gold' : ''}`}>{money(product.price)}</span>
          {onSale && <span className="was">{money(product.oldPrice)}</span>}
        </div>

        <button
          className="btn btn-primary btn-sm btn-block"
          onClick={(e) => {
            e.stopPropagation()
            onAdded()
          }}
        >
          Add To Cart
        </button>
      </div>
    </article>
  )
}
