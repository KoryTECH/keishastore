import { createContext, useContext, useCallback, useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabase.js'

const AdminContext = createContext(null)

// Postgres uses snake_case; the app uses camelCase.
const toApp = (row) => ({
  id: row.id,
  title: row.title,
  author: row.author,
  type: row.type,
  category: row.category,
  price: Number(row.price),
  oldPrice: row.old_price == null ? null : Number(row.old_price),
  rating: Number(row.rating ?? 0),
  reviews: Number(row.reviews ?? 0),
  pages: row.pages ?? null,
  lessons: row.lessons ?? null,
  hours: row.hours == null ? null : Number(row.hours),
  gradient: row.gradient ?? 0,
  description: row.description ?? '',
})

const toDb = (p) => ({
  title: p.title,
  author: p.author,
  type: p.type,
  category: p.category,
  price: p.price,
  old_price: p.oldPrice ?? null,
  rating: p.rating ?? 0,
  reviews: p.reviews ?? 0,
  pages: p.pages ?? null,
  lessons: p.lessons ?? null,
  hours: p.hours ?? null,
  gradient: p.gradient ?? 0,
  description: p.description ?? '',
})

const fmtDate = (ts) =>
  new Date(ts).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })

export function AdminProvider({ children }) {
  const [products, setProducts] = useState([])
  const [loadingProducts, setLoadingProducts] = useState(true)
  const [productsError, setProductsError] = useState('')

  const [orders, setOrders] = useState([])
  const [loadingOrders, setLoadingOrders] = useState(true)

  // ---------- catalog ----------
  const fetchProducts = useCallback(async () => {
    setLoadingProducts(true)
    setProductsError('')
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: true })
    if (error) setProductsError(error.message)
    setProducts((data ?? []).map(toApp))
    setLoadingProducts(false)
  }, [])

  const addProduct = useCallback(async (product) => {
    const { data, error } = await supabase
      .from('products')
      .insert(toDb(product))
      .select('*')
      .single()
    if (error) throw error
    setProducts((prev) => [toApp(data), ...prev])
    return toApp(data)
  }, [])

  const deleteProduct = useCallback(async (id) => {
    const { error } = await supabase.from('products').delete().eq('id', id)
    if (error) throw error
    setProducts((prev) => prev.filter((p) => p.id !== id))
  }, [])

  const productById = useCallback(
    (id) => products.find((p) => p.id === id),
    [products],
  )

  // ---------- orders (for the admin dashboard) ----------
  const fetchOrders = useCallback(async () => {
    setLoadingOrders(true)
    const { data } = await supabase
      .from('orders')
      .select('*, order_items (*)')
      .order('created_at', { ascending: false })
    setOrders(
      (data ?? []).map((o) => ({
        id: o.id,
        customer: o.customer,
        email: o.email,
        total: Number(o.total),
        status: o.status,
        date: fmtDate(o.created_at),
        items: (o.order_items ?? []).map((it) => ({ id: it.product_id, qty: it.qty })),
      })),
    )
    setLoadingOrders(false)
  }, [])

  // Called by Checkout — inserts the order + its items. Works for
  // guests (user_id null) and logged-in users (user_id attached).
  const addOrder = useCallback(async ({ id, customer, email, items, total, status }) => {
    const { data: { user } } = await supabase.auth.getUser()

    const { error } = await supabase.from('orders').insert({
      id,
      user_id: user?.id ?? null,
      customer,
      email,
      total,
      status: status ?? 'paid',
    })
    if (error) throw error

    const rows = items.map((it) => ({
      order_id: id,
      product_id: it.id,
      qty: it.qty,
      price: productById(it.id)?.price ?? 0,
    }))
    if (rows.length > 0) {
      const { error: itemsError } = await supabase.from('order_items').insert(rows)
      if (itemsError) throw itemsError
    }

    // refresh the dashboard list (silently — only admins can read)
    fetchOrders().catch(() => {})
    return { id }
  }, [productById, fetchOrders])

  // Called by the admin Orders tab — mark orders paid/refunded etc.
  const updateOrderStatus = useCallback(async (id, status) => {
    const { error } = await supabase.from('orders').update({ status }).eq('id', id)
    if (error) throw error
    setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, status } : o)))
  }, [])

  useEffect(() => {
    fetchProducts()
    fetchOrders()
  }, [fetchProducts, fetchOrders])

  // ---------- stats ----------
  const stats = useCallback(() => {
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
  }, [orders, products.length])

  const api = useMemo(
    () => ({
      products,
      loadingProducts,
      productsError,
      productById,
      addProduct,
      deleteProduct,
      refreshProducts: fetchProducts,
      orders,
      loadingOrders,
      refreshOrders: fetchOrders,
      addOrder,
      updateOrderStatus,
      stats,
    }),
    [
      products,
      loadingProducts,
      productsError,
      productById,
      addProduct,
      deleteProduct,
      fetchProducts,
      orders,
      loadingOrders,
      fetchOrders,
      addOrder,
      updateOrderStatus,
      stats,
    ],
  )

  return <AdminContext.Provider value={api}>{children}</AdminContext.Provider>
}

export function useAdmin() {
  const ctx = useContext(AdminContext)
  if (!ctx) throw new Error('useAdmin must be used inside AdminProvider')
  return ctx
}
