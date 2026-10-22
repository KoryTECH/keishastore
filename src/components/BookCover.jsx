import { COVER_GRADIENTS } from '../data/products.js'

/**
 * Generated book-style cover — no image files needed.
 * Colors rotate through the forest-green family; gold rules and
 * cream typography keep the "premium publisher" look.
 */
export default function BookCover({ product, compact = false }) {
  const [c1, c2] = COVER_GRADIENTS[(product.gradient ?? product.id?.length ?? 0) % COVER_GRADIENTS.length]

  return (
    <div
      className="bcov"
      style={{ background: `linear-gradient(160deg, ${c1} 0%, ${c2} 100%)` }}
      aria-label={`${product.title} cover`}
    >
      <div className="bcov-cat">{product.type === 'course' ? 'Video Course' : 'E-Book Edition'}</div>
      <h3 className="bcov-title" style={compact ? { fontSize: 14 } : undefined}>
        {product.title}
      </h3>
      <div className="bcov-rule" />
      <div className="bcov-author">{product.author}</div>
    </div>
  )
}
