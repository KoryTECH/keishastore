import { createContext, useContext, useCallback, useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabase.js'
import { useAuth } from './AuthContext.jsx'

const AdminContext = createContext(null)

// Round the averaged star rating to one decimal, same as the
// numeric(2,1) column in the database.
const round1 = (n) => Math.round(Number(n) * 10) / 10

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
  filePath: row.file_path ?? '',
  imagePath: row.image_path ?? '',
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
  // The session has to hydrate before RLS reports who we really are.
  // Admin-only reads below refetch whenever `user` flips — reviews,
  // subscribers, broadcasts and orders otherwise stay stuck at the
  // anonymous (empty) snapshot taken during boot.
  const { user } = useAuth()

  const [products, setProducts] = useState([])
  const [loadingProducts, setLoadingProducts] = useState(true)
  const [productsError, setProductsError] = useState('')

  const [orders, setOrders] = useState([])
  const [loadingOrders, setLoadingOrders] = useState(true)

  // ---------- newsletter (admin-only reads, gated by RLS) ----------
  const [subscribers, setSubscribers] = useState([])
  const [loadingSubscribers, setLoadingSubscribers] = useState(true)
  const [broadcasts, setBroadcasts] = useState([])
  const [loadingBroadcasts, setLoadingBroadcasts] = useState(true)

  const fetchSubscribers = useCallback(async () => {
    setLoadingSubscribers(true)
    const { data } = await supabase
      .from('subscribers')
      .select('id, email, created_at')
      .order('created_at', { ascending: false })
    setSubscribers(
      (data ?? []).map((s) => ({ id: s.id, email: s.email, date: fmtDate(s.created_at) })),
    )
    setLoadingSubscribers(false)
  }, [])

  const fetchBroadcasts = useCallback(async () => {
    setLoadingBroadcasts(true)
    const { data } = await supabase
      .from('broadcasts')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(20)
    setBroadcasts(data ?? [])
    setLoadingBroadcasts(false)
  }, [])

  // ---------- reviews (moderated queue — admins see all rows) ----------
  const [reviews, setReviews] = useState([])
  const [loadingReviews, setLoadingReviews] = useState(true)

  const fetchReviews = useCallback(async () => {
    setLoadingReviews(true)
    const { data } = await supabase
      .from('reviews')
      .select('*')
      .order('created_at', { ascending: false })
    setReviews(
      (data ?? []).map((r) => ({
        id: r.id,
        productId: r.product_id,
        name: r.name,
        userId: r.user_id,
        rating: Number(r.rating),
        body: r.body,
        approved: r.approved,
        date: fmtDate(r.created_at),
      })),
    )
    setLoadingReviews(false)
  }, [])

  // After approving/unapproving, refresh the product's rating +
  // review count from its approved reviews so shelf stars stay true.
  const recomputeProductStars = useCallback(async (productId) => {
    const { data } = await supabase
      .from('reviews')
      .select('rating')
      .eq('product_id', productId)
      .eq('approved', true)
    const list = data ?? []
    const avg = list.length
      ? round1(list.reduce((s, r) => s + Number(r.rating), 0) / list.length)
      : 0
    await supabase
      .from('products')
      .update({ rating: avg, reviews: list.length })
      .eq('id', productId)
    setProducts((prev) =>
      prev.map((p) => (p.id === productId ? { ...p, rating: avg, reviews: list.length } : p)),
    )
  }, [])

  const setReviewApproved = useCallback(
    async (id, approved) => {
      const { error } = await supabase.from('reviews').update({ approved }).eq('id', id)
      if (error) throw error
      const row = (await supabase.from('reviews').select('product_id').eq('id', id).single()).data
      setReviews((prev) => prev.map((r) => (r.id === id ? { ...r, approved } : r)))
      if (row?.product_id) await recomputeProductStars(row.product_id)
    },
    [recomputeProductStars],
  )

  const deleteReview = useCallback(async (id) => {
    const { data, error } = await supabase
      .from('reviews')
      .delete()
      .eq('id', id)
      .select('product_id')
      .single()
    if (error) throw error
    setReviews((prev) => prev.filter((r) => r.id !== id))
    if (data?.product_id) await recomputeProductStars(data.product_id)
  }, [recomputeProductStars])

  // ---------- download log (who opened a file, and when) ----------
  const [downloads, setDownloads] = useState([])
  const [loadingDownloads, setLoadingDownloads] = useState(true)

  const fetchDownloads = useCallback(async () => {
    setLoadingDownloads(true)
    const { data } = await supabase
      .from('downloads')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100)
    setDownloads(data ?? [])
    setLoadingDownloads(false)
  }, [])

  // Called by the storefront right after a download link is minted.
  // Best-effort: a logging failure never blocks the download itself.
  const logDownload = useCallback(
    async (productId, email) => {
      const {
        data: { user: current },
      } = await supabase.auth.getUser()
      if (!current) return
      await supabase.from('downloads').insert({
        product_id: productId,
        user_id: current.id,
        email: email ?? current.email ?? null,
      })
      fetchDownloads().catch(() => {})
    },
    [fetchDownloads],
  )

  // Sends through the `send-broadcast` Edge Function — the Brevo
  // key never leaves the server. Returns { total, sent, failed }.
  const sendBroadcast = useCallback(async ({ subject, body, audience }) => {
    const { data, error } = await supabase.functions.invoke('send-broadcast', {
      body: { subject, body, audience },
    })
    if (error || data?.error) throw new Error(data?.error ?? error.message)
    fetchBroadcasts().catch(() => {})
    return data
  }, [fetchBroadcasts])

  // Live audience sizes ({ subscribers, everyone }) — signup emails
  // are counted server-side (service role required to read auth).
  const fetchAudienceCounts = useCallback(async () => {
    const { data, error } = await supabase.functions.invoke('send-broadcast', {
      body: { action: 'counts' },
    })
    // A non-2xx reply hides the message in error.context — unwrap it
    // so the dashboard shows the server's own reason.
    if (error && typeof error.context?.json === 'function') {
      const payload = await error.context.json().catch(() => null)
      throw new Error(payload?.error ?? error.message)
    }
    if (error || data?.error) throw new Error(data?.error ?? error.message)
    return data
  }, [])

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

  // Uploads a deliverable (PDF/e-book/course file) to the private
  // `product-files` bucket and points the product at it. Replaces
  // any previous file (upsert: true). Admin-only via storage RLS.
  const uploadProductFile = useCallback(async (productId, file) => {
    const path = `${productId}/${file.name}`
    const { error } = await supabase.storage
      .from('product-files')
      .upload(path, file, { upsert: true })
    if (error) throw error

    const { data, error: updateError } = await supabase
      .from('products')
      .update({ file_path: path })
      .eq('id', productId)
      .select('*')
      .single()
    if (updateError) throw updateError

    setProducts((prev) => prev.map((p) => (p.id === productId ? toApp(data) : p)))
    return toApp(data)
  }, [])

  // Cover image → PUBLIC `product-images` bucket (anyone may look
  // at covers; only admins change them — policy 11).
  const uploadProductImage = useCallback(async (productId, file) => {
    const path = `${productId}/${file.name}`
    const { error } = await supabase.storage
      .from('product-images')
      .upload(path, file, { upsert: true, contentType: file.type })
    if (error) throw error

    const { data, error: updateError } = await supabase
      .from('products')
      .update({ image_path: path })
      .eq('id', productId)
      .select('*')
      .single()
    if (updateError) throw updateError

    setProducts((prev) => prev.map((p) => (p.id === productId ? toApp(data) : p)))
    return toApp(data)
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
  }, [fetchProducts])

  useEffect(() => {
    fetchOrders()
    fetchSubscribers().catch(() => {})
    fetchBroadcasts().catch(() => {})
    fetchReviews().catch(() => {})
    fetchDownloads().catch(() => {})
  }, [user, fetchOrders, fetchSubscribers, fetchBroadcasts, fetchReviews, fetchDownloads])

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
      uploadProductFile,
      uploadProductImage,
      refreshProducts: fetchProducts,
      orders,
      loadingOrders,
      refreshOrders: fetchOrders,
      addOrder,
      updateOrderStatus,
      stats,
      subscribers,
      loadingSubscribers,
      refreshSubscribers: fetchSubscribers,
      broadcasts,
      loadingBroadcasts,
      refreshBroadcasts: fetchBroadcasts,
      sendBroadcast,
      fetchAudienceCounts,
      reviews,
      loadingReviews,
      refreshReviews: fetchReviews,
      setReviewApproved,
      deleteReview,
      downloads,
      loadingDownloads,
      refreshDownloads: fetchDownloads,
      logDownload,
    }),
    [
      products,
      loadingProducts,
      productsError,
      productById,
      addProduct,
      deleteProduct,
      uploadProductFile,
      uploadProductImage,
      fetchProducts,
      orders,
      loadingOrders,
      fetchOrders,
      addOrder,
      updateOrderStatus,
      stats,
      subscribers,
      loadingSubscribers,
      fetchSubscribers,
      broadcasts,
      loadingBroadcasts,
      fetchBroadcasts,
      sendBroadcast,
      fetchAudienceCounts,
      reviews,
      loadingReviews,
      fetchReviews,
      setReviewApproved,
      deleteReview,
      downloads,
      loadingDownloads,
      fetchDownloads,
      logDownload,
    ],
  )

  return <AdminContext.Provider value={api}>{children}</AdminContext.Provider>
}

export function useAdmin() {
  const ctx = useContext(AdminContext)
  if (!ctx) throw new Error('useAdmin must be used inside AdminProvider')
  return ctx
}
