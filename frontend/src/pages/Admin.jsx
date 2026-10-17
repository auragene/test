import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { API_URL } from '../api'

const Admin = () => {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [admin, setAdmin] = useState(null)
  const [signingOut, setSigningOut] = useState(false)

  async function signIn(event) {
    event.preventDefault()
    setLoading(true)
    setError('')

    try {
      const response = await fetch(`${API_URL}/admin-login`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error || 'Sign-in failed.')
      setAdmin(result.user)
      setPassword('')
    } catch (signInError) {
      console.error('Admin sign-in failed:', signInError)
      setError(signInError.message || 'Could not sign in. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  async function signOut() {
    setSigningOut(true)
    setError('')
    try {
      const response = await fetch(`${API_URL}/admin-logout`, {
        method: 'POST',
        credentials: 'include',
      })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error || 'Could not sign out.')
      setAdmin(null)
      setEmail('')
      navigate('/admin', { replace: true })
    } catch (signOutError) {
      console.error('Admin sign-out failed:', signOutError)
      setError(signOutError.message || 'Could not sign out.')
    } finally {
      setSigningOut(false)
    }
  }

  return (
    <main style={styles.page}>
      {admin ? (
        <section style={styles.console}>
          <header style={styles.consoleHeader}>
            <div>
              <p style={styles.eyebrow}>AURA GRAND SMART RESTAURANT</p>
              <h1 style={styles.title}>Admin console</h1>
              <p style={styles.description}>
                Welcome back, {admin.name || admin.email}. Manage your restaurant workspace.
              </p>
            </div>
            <button
              type="button"
              onClick={signOut}
              disabled={signingOut}
              style={styles.signOut}
            >
              {signingOut ? 'Signing out…' : 'Sign out'}
            </button>
          </header>
          {error && <p role="alert" style={styles.error}>{error}</p>}
          <div style={styles.sectionHeading}>
            <div>
              <p style={styles.eyebrow}>QUICK ACCESS</p>
              <h2 style={styles.sectionTitle}>Restaurant workspace</h2>
            </div>
            <span style={styles.signedIn}><i /> Admin signed in</span>
          </div>
          <nav style={styles.grid} aria-label="Restaurant admin navigation">
            {[
              { to: '/dashboard', icon: '▦', title: 'Overview', text: 'See your restaurant workspace.' },
              { to: '/orders', icon: '▤', title: 'Orders', text: 'Review and move orders through service.' },
              { to: '/products', icon: '◈', title: 'Menu & products', text: 'Manage items available to guests.' },
              { to: '/tables', icon: '▧', title: 'Tables & QR codes', text: 'Manage dining tables and QR links.' },
              { to: '/settings', icon: '⚙', title: 'Settings', text: 'Update restaurant preferences and colors.' },
            ].map((item) => (
              <Link key={item.to} to={item.to} style={styles.linkCard}>
                <span style={styles.linkIcon} aria-hidden="true">{item.icon}</span>
                <span>
                  <strong style={styles.linkTitle}>{item.title}</strong>
                  <small style={styles.linkText}>{item.text}</small>
                </span>
                <span style={styles.arrow} aria-hidden="true">↗</span>
              </Link>
            ))}
          </nav>
        </section>
      ) : (
        <section style={styles.card}>
          <div style={styles.mark} aria-hidden="true">A</div>
          <p style={styles.eyebrow}>AURA GRAND SMART RESTAURANT</p>
          <>
            <h1 style={styles.title}>Admin sign in</h1>
            <p style={styles.description}>Sign in with your administrator email and password.</p>
            <form onSubmit={signIn} style={styles.form}>
              <label htmlFor="admin-email" style={styles.label}>Email address</label>
              <input
                id="admin-email"
                type="email"
                autoComplete="username"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="admin@example.com"
                style={styles.input}
              />
              <label htmlFor="admin-password" style={styles.label}>Password</label>
              <input
                id="admin-password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Enter your password"
                style={styles.input}
              />
              {error && <p role="alert" style={styles.error}>{error}</p>}
              <button type="submit" disabled={loading} style={styles.button}>
                {loading ? 'Signing in…' : 'Sign in'}
              </button>
            </form>
          </>
        </section>
      )}
    </main>
  )
}

const styles = {
  page: {
    display: 'grid',
    minHeight: '100vh',
    placeItems: 'center',
    padding: 24,
    background: '#f5f7f7',
    fontFamily: 'Inter, ui-sans-serif, system-ui, sans-serif',
  },
  card: {
    width: 'min(100%, 420px)',
    padding: '38px 34px',
    border: '1px solid #e5ebe8',
    borderRadius: 18,
    background: '#fff',
    boxShadow: '0 18px 50px rgb(35 52 57 / 8%)',
  },
  console: {
    width: '100%',
    maxWidth: 1020,
    margin: '0 auto',
    padding: 26,
    border: '1px solid #e5ebe8',
    borderRadius: 18,
    background: '#fff',
    boxShadow: '0 14px 38px rgb(35 52 57 / 5%)',
  },
  consoleHeader: {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 18,
    paddingBottom: 22,
    borderBottom: '1px solid #e8edeb',
  },
  signOut: {
    minHeight: 38,
    padding: '0 14px',
    border: '1px solid #e2e9e6',
    borderRadius: 9,
    background: '#fff',
    color: '#53635b',
    cursor: 'pointer',
    fontSize: 11,
    fontWeight: 650,
  },
  sectionHeading: {
    display: 'flex',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: 15,
    margin: '24px 0 14px',
  },
  sectionTitle: {
    margin: '5px 0 0',
    color: '#263238',
    fontFamily: 'Georgia, serif',
    fontSize: 21,
    fontWeight: 500,
  },
  signedIn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 7,
    color: '#78868a',
    fontSize: 10,
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 240px), 1fr))',
    gap: 12,
  },
  linkCard: {
    display: 'flex',
    minHeight: 92,
    alignItems: 'center',
    gap: 12,
    padding: 14,
    border: '1px solid #e6ece9',
    borderRadius: 12,
    background: '#fff',
    color: '#263238',
    textDecoration: 'none',
  },
  linkIcon: {
    display: 'grid',
    width: 38,
    height: 38,
    flex: '0 0 auto',
    placeItems: 'center',
    borderRadius: 11,
    background: 'color-mix(in srgb, var(--brand-primary, #3c6047) 10%, white)',
    color: 'var(--brand-primary, #3c6047)',
    fontSize: 17,
  },
  linkTitle: {
    display: 'block',
    fontSize: 12,
  },
  linkText: {
    display: 'block',
    marginTop: 5,
    color: '#78868a',
    fontSize: 10,
    lineHeight: 1.5,
  },
  arrow: {
    marginLeft: 'auto',
    color: 'var(--brand-secondary, #697b57)',
    fontSize: 16,
  },
  mark: {
    display: 'grid',
    width: 44,
    height: 44,
    placeItems: 'center',
    borderRadius: 14,
    background: 'var(--brand-primary, #3c6047)',
    color: '#fff',
    fontFamily: 'Georgia, serif',
    fontSize: 22,
  },
  eyebrow: {
    margin: '23px 0 9px',
    color: 'var(--brand-primary, #3c6047)',
    fontSize: 9,
    fontWeight: 750,
    letterSpacing: '0.15em',
  },
  title: {
    margin: '0 0 8px',
    color: '#263238',
    fontFamily: 'Georgia, serif',
    fontSize: 30,
    fontWeight: 500,
  },
  description: {
    margin: '0 0 24px',
    color: '#78868a',
    fontSize: 13,
    lineHeight: 1.6,
  },
  form: {
    display: 'grid',
    gap: 10,
  },
  label: {
    marginTop: 5,
    color: '#39474b',
    fontSize: 11,
    fontWeight: 650,
  },
  input: {
    width: '100%',
    height: 44,
    padding: '0 12px',
    border: '1px solid #dfe6e6',
    borderRadius: 9,
    outlineColor: 'var(--brand-primary, #3c6047)',
    background: '#fbfcfc',
    color: '#263238',
    fontSize: 13,
  },
  error: {
    margin: '4px 0',
    color: '#a13c34',
    fontSize: 12,
  },
  button: {
    height: 45,
    marginTop: 8,
    border: 0,
    borderRadius: 9,
    background: 'var(--brand-primary, #3c6047)',
    color: '#fff',
    cursor: 'pointer',
    fontSize: 13,
    fontWeight: 700,
  },
}

export default Admin
