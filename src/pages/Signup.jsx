import { useState } from 'react'
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom'
import { LibraryBig, Mail, UserRound } from 'lucide-react'
import { useAuth } from '../context/AuthContext.jsx'

export default function Signup() {
  const { user, loading, signUp } = useAuth()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const next = params.get('next') || '/'

  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [confirmSent, setConfirmSent] = useState(false)
  const [busy, setBusy] = useState(false)

  if (confirmSent) {
    return (
      <div className="admin-login">
        <div className="admin-login-card fade-up">
          <div className="brand">
            <span className="brand-mark">
              <LibraryBig size={19} />
            </span>
            <span className="brand-name">
              Keisha Store
              <span className="brand-sub">Check Your Inbox</span>
            </span>
          </div>
          <h1>One last step — confirm your email</h1>
          <p>
            We sent a confirmation link to <b>{email}</b>. Click it, then come back here and sign
            in.
          </p>
          <Link to="/login" className="btn btn-primary btn-block">
            <Mail size={15} /> Go to Sign In
          </Link>
        </div>
      </div>
    )
  }

  if (!loading && user) return <Navigate to={next} replace />

  const submit = async (e) => {
    e.preventDefault()
    setBusy(true)
    setError('')
    const { data, error: err } = await signUp({
      email: email.trim(),
      password,
      fullName: fullName.trim(),
    })
    setBusy(false)
    if (err) {
      setError(err.message)
      return
    }
    // If email confirmation is enabled Supabase returns no session —
    // show the "check your inbox" state instead of logging in.
    if (data.session) navigate(next, { replace: true })
    else setConfirmSent(true)
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
            <span className="brand-sub">Join The Shelf</span>
          </span>
        </div>
        <h1>Create your account</h1>
        <p>Saves nothing sensitive — it powers order tracking and your library.</p>

        {error && <div className="login-error">{error}</div>}

        <div className="field" style={{ textAlign: 'left', marginBottom: 16 }}>
          <label htmlFor="signup-name">Full name</label>
          <input
            id="signup-name"
            type="text"
            placeholder="Ada Obi"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
            autoFocus
          />
        </div>
        <div className="field" style={{ textAlign: 'left', marginBottom: 16 }}>
          <label htmlFor="signup-email">Email</label>
          <input
            id="signup-email"
            type="email"
            placeholder="you@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div className="field" style={{ textAlign: 'left', marginBottom: 20 }}>
          <label htmlFor="signup-pass">Password</label>
          <input
            id="signup-pass"
            type="password"
            placeholder="At least 6 characters"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
          />
        </div>

        <button type="submit" className="btn btn-primary btn-block" disabled={busy}>
          <UserRound size={15} /> {busy ? 'Creating…' : 'Create Account'}
        </button>

        <p className="auth-alt">
          Already have an account? <Link to={`/login${next !== '/' ? `?next=${encodeURIComponent(next)}` : ''}`}>Sign in</Link>
          <span style={{ display: 'block', marginTop: 8 }}>
            <Link to="/">Back to the store</Link>
          </span>
        </p>
      </form>
    </div>
  )
}
