import { createContext, useContext, useMemo, useState } from 'react'
import { SEED_PRODUCTS, SEED_ORDERS } from '../data/products.js'

const ADMIN_PASSWORD = 'admin123'

const AdminContext = createContext(null)

function loadStore(key, seed) {
  try {
    const raw = window.localStorage.getItem(key)
    return raw ? JSON.parse(raw) : seed
  } catch {
    return seed
  }
}

export function AdminProvider({ children }) {
  const [products, setProducts] = useState(() => loadStore('keisha.products', SEED_PRODUCTS))
  const [orders, setOrders] = useState(() => loadStore('keisha.orders', SEED_ORDERS))
  const [isAdmin, setIsAdmin] = useState(() => {
    try {
      return window.localStorage.getItem('keisha.isAdmin') === '1'
    } catch {
      return false
    }
  })

  // ---- persistence ----
  const persist = (key, value) => {
    try {
      window.localStorage.setItem(key, JSON.stringify(value))
    } catch {
      /* storage unavailable */
    }
  }

  const api = useMemo(
    () => ({
      isAdmin,
      login(password) {
        const ok = password === ADMIN_PASSWORD
        setIsAdmin(ok)
        try {
          window.localStorage.setItem('keisha.isAdmin', ok ? '1' : '0')
        } catch {
          /* ignore */
        }
        return ok
      },
      logout() {
        setIsAdmin(false)
        try {
          window.localStorage.setItem('keisha.isAdmin', '0')
        } catch {
          /* ignore */
        }
      },

      // ---- catalog ----
      products,
      productById(id) {
        return products.find((p) => p.id === id)
      },
      addProduct(product) {
        setProducts((prev) => {
          const next = [{ ...product, id: `p${Date.now()}` }, ...prev]
          persist('keisha.products', next)
          return next
        })
      },
      deleteProduct(id) {
        setProducts((prev) => {
          const next = prev.filter((p) => p.id !== id)
          persist('keisha.products', next)
          return next
        })
      },

      // ---- orders ----
      orders,
      addOrder(order) {
        setOrders((prev) => {
          const next = [order, ...prev]
          persist('keisha.orders', next)
          return next
        })
      },

      // ---- computed stats ----
      stats() {
        const paid = orders.filter((o) => o.status === 'paid')
        const revenue = paid.reduce((sum, o) => sum + o.total, 0)
        const units = orders.reduce((sum, o) => sum + o.items.reduce((s, it) => s + it.qty, 0), 0)
        return {
          orderCount: orders.length,
          revenue,
          units,
          productCount: products.length,
          avgOrder: paid.length ? revenue / paid.length : 0,
          pending: orders.filter((o) => o.status === 'pending').length,
        }
      },
    }),
    [products, orders, isAdmin],
  )

  return <AdminContext.Provider value={api}>{children}</AdminContext.Provider>
}

export function useAdmin() {
  const ctx = useContext(AdminContext)
  if (!ctx) throw new Error('useAdmin must be used inside AdminProvider')
  return ctx
}
