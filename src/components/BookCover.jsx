import { COVER_GRADIENTS } from '../data/products.js'
import { supabase } from '../lib/supabase.js'

// Small cache so repeated <img> URLs don't get rebuilt on every render.
const publicUrlCache = new Map()

/** Public URL for a cover in the `product-images` bucket (or null). */
export function coverImageUrl(imagePath) {
  if (!imagePath) return null
  if (!publicUrlCache.has(imagePath)) {
    const { data } = supabase.storage
      .from('product-images')
      .getPublicUrl(imagePath)
    publicUrlCache.set(imagePath, data?.publicUrl ?? null)
  }
  return publicUrlCache.get(imagePath)
}

/**
 * Book cover: real uploaded art when the product has one, otherwise
 * the generated forest-green/gold design. compact = smaller type.
 */
export default function BookCover({ product, compact = false }) {
  const [c1, c2] = COVER_GRADIENTS[(product.gradient ?? product.id?.length ?? 0) % COVER_GRADIENTS.length]

  const img = product.imagePath ? coverImageUrl(product.imagePath) : null
  const fallbackGradient = `linear-gradient(160deg, ${c1} 0%, ${c2} 100%)`

  if (img) {
    return (
      <div className="bcov" style={{ background: fallbackGradient, padding: 0 }}>
        <img
          src={img}
          alt={`${product.title} cover`}
          style={{ display: 'block', width: '100%', height: '100%', objectFit: 'cover' }}
          loading="lazy"
        />
      </div>
    )
  }

  return (
    <div
      className="bcov"
      style={{ background: fallbackGradient }}
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
