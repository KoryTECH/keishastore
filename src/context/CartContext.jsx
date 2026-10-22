import { createContext, useContext, useEffect, useMemo, useState } from 'react'

const CartContext = createContext(null)

const STORAGE_KEY = 'keisha.cart'

function load() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export function CartProvider({ children }) {
  const [items, setItems] = useState(load) // [{ id, qty }]

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
    } catch {
      /* storage unavailable */
    }
  }, [items])

  const api = useMemo(
    () => ({
      items,
      count: items.reduce((sum, it) => sum + it.qty, 0),
      add(id) {
        setItems((prev) => {
          const ceiling = 99 // sanity cap for quantity
          const found = prev.find((it) => it.id === id)
          if (found) {
            return prev.map((it) =>
              it.id === id ? { ...it, qty: Math.min(it.qty + 1, ceiling) } : it,
            )
          }
          return [...prev, { id, qty: 1 }]
        })
      },
      remove(id) {
        setItems((prev) => prev.filter((it) => it.id !== id))
      },
      setQty(id, qty) {
        setItems((prev) =>
          qty <= 0 ? prev.filter((it) => it.id !== id) : prev.map((it) => (it.id === id ? { ...it, qty } : it)),
        )
      },
      clear() {
        setItems([])
      },
      has(id) {
        return items.some((it) => it.id === id)
      },
    }),
    [items],
  )

  return <CartContext.Provider value={api}>{children}</CartContext.Provider>
}

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used inside CartProvider')
  return ctx
}
