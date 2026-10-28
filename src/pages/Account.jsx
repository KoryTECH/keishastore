import { useEffect, useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { Download, Clock, LogOut, Loader2 } from 'lucide-react'
import { supabase } from '../lib/supabase.js'
import { useAuth } from '../context/AuthContext.jsx'
import { useAdmin } from '../context/AdminContext.jsx'
import BookCover from '../components/BookCover.jsx'
import Toast from '../components/Toast.jsx'
import { money, getTypeLabel } from '../data/products.js'

// Signed URLs are short-lived — 5 minutes is plenty for a click.
const downloadFile = async (path) => {
  const { data, error } = await supabase.storage.from('product-files').createSignedUrl(path, 300)
  if (error) throw error
  window.open(data.signedUrl, '_blank', 'noopener,noreferrer')
}

export default function Account() {
  const { user, loading: authLoading, signOut } = useAuth()
  const { productById } = useAdmin()
  const [orders, setOrders] = useState([])
  const [loadingOrders, setLoadingOrders] = useState(true)
  const [error, setError] = useState('')
  const [busyPath, setBusyPath] = useState('')
  const [toast, setToast] = useState('')

  const showToast = (msg) => {
    setToast(msg)
    window.clearTimeout(showToast._t)
    showToast._t = window.setTimeout(() => setToast(''), 2800)
  }

  // Customers can read their own orders (RLS allows selecting your own rows).
  // Refetches whenever the user changes, and again when they revisit the page
  // (e.g. after the admin marks a pending order paid).
  useEffect(() => {
    if (!user) return
    let cancelled = false
    ;(async () => {
      setLoadingOrders(true)
      const { data, error: err } = await supabase
        .from('orders')
        .select('*, order_items (*)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
      if (cancelled) return
      if (err) setError(err.message)
      else setOrders(data ?? [])
      setLoadingOrders(false)
    })()
    return () => {
      cancelled = true
    }
  }, [user]) // refetch on sign-in/sign-out

  if (authLoading) {
    return (
      <section className="section">
        <div className="container">
          <div className="empty-state">
            <h3>Just a second…</h3>
            <p>Checking your session.</p>
          </div>
        </div>
      </section>
    )
  }
  if (!user) return <Navigate to="/login?next=/account" replace />

  const handleDownload = async (path) => {
    if (busyPath) return
    setBusyPath(path)
    try {
      await downloadFile(path)
    } catch (err) {
      showToast(`Download failed — ${err.message}`)
    } finally {
      setBusyPath('')
    }
  }

  const paidOrders = orders.filter((o) => o.status === 'paid')
  const pendingOrders = orders.filter((o) => o.status !== 'paid')
  const ownedIds = new Set(paidOrders.flatMap((o) => o.order_items.map((it) => it.product_id)))
  const ownedProducts = [...ownedIds].map((id) => productById(id)).filter(Boolean)

  return (
    <>
      <div className="page-head">
        <div className="container">
          <div className="breadcrumb">
            <Link to="/">Home</Link>
            <span className="sep">/</span>
            <span>My Shelf</span>
          </div>
          <h1 className="display">My Shelf</h1>
          <p className="muted" style={{ margin: '8px 0 0' }}>
            Signed in as {user.email} — everything you&apos;ve bought lives here.
          </p>
        </div>
      </div>

      <section className="section-tight">
        <div className="container" style={{ maxWidth: 780 }}>
          {/* --- purchased & downloadable --- */}
          {error ? (
            <div className="panel">
              <p className="c-red">{error}</p>
            </div>
          ) : loadingOrders ? (
            <div className="empty-state">
              <Loader2 size={22} style={{ animation: 'spin 1s linear infinite' }} />
              <p>Opening your shelf…</p>
            </div>
          ) : paidOrders.length === 0 ? (
            <div className="empty-state">
              <h3>Your shelf is empty</h3>
              <p>
                Once an order is paid, its e-books and courses appear here with instant
                download buttons.
              </p>
              <Link to="/shop" className="btn btn-primary">Browse the shelf</Link>
            </div>
          ) : (
            <>
              <div className="shelf-strip">
                {ownedProducts.map((p) => (
                  <div key={p.id} className="shelf-cover" title={p.title}>
                    <BookCover product={p} />
                  </div>
                ))}
              </div>

              {paidOrders.map((o) => (
                <div className="panel" key={o.id} style={{ marginBottom: 22 }}>
                  <div className="panel-head" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 12, flexWrap: 'wrap' }}>
                    <h3 style={{ margin: 0 }}>Order #{o.id}</h3>
                    <span className="muted small">{money(Number(o.total))}</span>
                  </div>

                  {(o.order_items ?? []).map((it) => {
                    const p = productById(it.product_id)
                    return (
                      <div className="dl-row" key={it.id}>
                        <span className="dl-cover">{p && <BookCover product={p} compact />}</span>
                        <span className="dl-info">
                          <b>{p ? p.title : `Product ${it.product_id}`}</b>
                          <span className="muted small">
                            {p ? getTypeLabel(p.type) : 'Archived listing'} · qty {it.qty}
                          </span>
                        </span>
                        {p?.filePath ? (
                          <button
                            className="btn btn-gold btn-sm"
                            onClick={() => handleDownload(p.filePath)}
                            disabled={busyPath === p.filePath}
                          >
                            {busyPath === p.filePath ? (
                              <Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} />
                            ) : (
                              <Download size={13} />
                            )}
                            Download
                          </button>
                        ) : (
                          <span className="muted small">File coming soon</span>
                        )}
                      </div>
                    )
                  })}
                </div>
              ))}
            </>
          )}

          {/* --- orders still waiting on payment --- */}
          {pendingOrders.length > 0 && !loadingOrders && (
            <div className="panel pending-note">
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                <Clock size={16} style={{ color: 'var(--gold-deep)' }} />
                <b>Awaiting payment confirmation</b>
              </div>
              {pendingOrders.map((o) => (
                <p key={o.id} style={{ margin: '4px 0' }}>
                  <b>#{o.id}</b> · {money(Number(o.total))} — downloads unlock as soon as we confirm
                  your payment. Check {o.email} for the instructions.
                </p>
              ))}
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'center', marginTop: 26 }}>
            <button className="btn btn-outline" onClick={() => signOut()}>
              <LogOut size={13} /> Sign Out
            </button>
          </div>
        </div>
      </section>

      <style>{`
        .shelf-strip { display: flex; gap: 14px; overflow-x: auto; padding: 2px 2px 14px; margin-bottom: 8px; }
        .shelf-cover { flex: 0 0 auto; width: 92px; border-radius: 8px; overflow: hidden; box-shadow: 0 10px 22px rgba(16,40,30,.16); }
        .dl-row { display: flex; align-items: center; gap: 14px; padding: 12px 0; border-top: 1px dashed var(--line-soft); }
        .dl-row:first-of-type { border-top: none; margin-top: 10px; }
        .dl-cover { width: 44px; flex-shrink: 0; border-radius: 5px; overflow: hidden; display: block; }
        .dl-info { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 2px; }
        .pending-note { border-left: 3px solid var(--gold); }
      `}</style>

      <Toast message={toast} />
    </>
  )
}
