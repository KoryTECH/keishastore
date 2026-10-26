import { useEffect, useState } from 'react'
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom'
import { LibraryBig, Mail } from 'lucide-react'
import { useAuth } from '../context/AuthContext.jsx'

export default function Login() {
  const { user, loading, signIn } = useAuth()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const next = params.get('next') || '/'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  // Already signed in? Send them on their way.
  if (!loading && user) return <Navigate to={next} replace />

  const submit = async (e) => {
    e.preventDefault()
    setBusy(true)
    setError('')
    const { error: err } = await signIn({ email: email.trim(), password })
    setBusy(false)
    if (err) {
      setError(err.message)
      return
    }
    navigate(next, { replace: true })
  }

  return (
    <div className="admin-login">
      <form className="admin-login-card fade-up" onSubmit={submit}>
        <div className="brand">
          <span className="brand-mark">
            <LibraryBig size={19} />
          </span>
          <span className="brand-name">
            Keisha Store
            <span className="brand-sub">Welcome Back</span>
          </span>
        </div>
        <h1>Sign in to your account</h1>
        <p>Access your cart perks, order history and the admin dashboard.</p>

        {error && <div className="login-error">{error}</div>}

        <div className="field" style={{ textAlign: 'left', marginBottom: 16 }}>
          <label htmlFor="login-email">Email</label>
          <input
            id="login-email"
            type="email"
            placeholder="you@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoFocus
          />
        </div>
        <div className="field" style={{ textAlign: 'left', marginBottom: 20 }}>
          <label htmlFor="login-pass">Password</label>
          <input
            id="login-pass"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        <button type="submit" className="btn btn-primary btn-block" disabled={busy}>
          <Mail size={15} /> {busy ? 'Signing in…' : 'Sign In'}
        </button>

        <p className="auth-alt">
          New around here? <Link to={`/signup${next !== '/' ? `?next=${encodeURIComponent(next)}` : ''}`}>Create an account</Link>
          <span style={{ display: 'block', marginTop: 8 }}>
            Just browsing? <Link to="/">Back to the store</Link>
          </span>
        </p>
      </form>
    </div>
  )
}
