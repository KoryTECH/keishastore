// ---- Cover gradients (generated covers, no images needed) ----
// Products now live in the Supabase `products` table — this file only
// keeps UI helpers that don't belong to the database.
export const COVER_GRADIENTS = [
  ['#163527', '#2E5540'],
  ['#1F3D2B', '#3A6B50'],
  ['#20402E', '#4C7A57'],
  ['#2A4A3B', '#58866A'],
  ['#18302A', '#39635C'],
  ['#294D35', '#4F8563'],
]

export const CATEGORIES = [
  { name: 'Fiction', icon: 'BookOpen', desc: 'Stories to escape' },
  { name: 'Non-Fiction', icon: 'Globe', desc: 'Real-world knowledge' },
  { name: 'Business', icon: 'Briefcase', desc: 'Build and grow' },
  { name: 'Self-Help', icon: 'Sparkles', desc: 'Better yourself' },
  { name: 'Design', icon: 'PenTool', desc: 'Craft beautiful work' },
  { name: 'Marketing', icon: 'Megaphone', desc: 'Find your audience' },
]

// ---- Helpers ----
export const money = (n) => `$${n.toFixed(2)}`

export const getTypeLabel = (type) => (type === 'course' ? 'Course' : 'E-book')

export const getIncludes = (product) =>
  product.type === 'course'
    ? [
        `${product.lessons} on-demand video lessons (${product.hours}h total)`,
        'Downloadable workbook and practical templates',
        'Lifetime access, including future updates',
        'Private community of students',
      ]
    : [
        `${product.pages}-page PDF + EPUB editions`,
        'Instant download right after checkout',
        'Read on any device, yours forever',
        'Free lifetime content updates',
      ]
