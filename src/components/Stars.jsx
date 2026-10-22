import { Star } from 'lucide-react'

export default function Stars({ value = 0, count }) {
  return (
    <span className="star-row" aria-label={`Rated ${value} out of 5`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          size={13}
          fill={n <= Math.round(value) ? 'var(--gold)' : 'none'}
          color={n <= Math.round(value) ? 'var(--gold)' : '#C9C4B8'}
        />
      ))}
      {count != null && <span className="pc-rating-count">({count})</span>}
    </span>
  )
}
