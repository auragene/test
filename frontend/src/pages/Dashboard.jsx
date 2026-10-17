import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { API_URL } from '../api'
import './Dashboard.css'

const Dashboard = () => {
  const navigate = useNavigate()
  const [settings, setSettings] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  let account = {}
  try {
    account = JSON.parse(sessionStorage.getItem('account') || '{}')
  } catch (error) {
    console.error('Could not read the signed-in account:', error)
  }
  const hotelName =
    settings?.hotel_name || settings?.restaurant_name || settings?.display_name ||
    account.hotel_name || account.hotelName || account.name || account.database || 'Your Hotel'
  const hotelInitial = hotelName.charAt(0).toUpperCase()

  useEffect(() => {
    let active = true

    async function loadDashboardSettings() {
      try {
        const response = await fetch(`${API_URL}/get-settings`, {
          credentials: 'include',
        })
        const result = await response.json()

        if (response.status === 401) {
          sessionStorage.removeItem('account')
          navigate('/login', { replace: true })
          return
        }
        if (!response.ok) {
          throw new Error(result.error || 'Could not load dashboard settings.')
        }

        const primaryColor = result.primary_color || result.primaryColor || result.primary
        const secondaryColor =
          result.secondary_color || result.secondaryColor || result.secondary
        if (
          typeof primaryColor !== 'string' ||
          !CSS.supports('color', primaryColor) ||
          typeof secondaryColor !== 'string' ||
          !CSS.supports('color', secondaryColor)
        ) {
          throw new Error('Set valid primary and secondary colors in Settings to use the dashboard.')
        }

        if (active) {
          setSettings({ ...result, primary_color: primaryColor, secondary_color: secondaryColor })
        }
      } catch (loadError) {
        console.error('Error loading dashboard settings:', loadError)
        if (active) setError(loadError.message || 'Could not load dashboard settings.')
      } finally {
        if (active) setLoading(false)
      }
    }

    loadDashboardSettings()
    return () => {
      active = false
    }
  }, [navigate])

  async function logout() {
    try {
      const response = await fetch(`${API_URL}/logout`, {
        method: 'POST',
        credentials: 'include',
      })
      const result = await response.json()
      if (!response.ok) {
        throw new Error(result.error || 'Could not log out.')
      }
      sessionStorage.removeItem('account')
      navigate('/login', { replace: true })
    } catch (logoutError) {
      console.error('Error logging out:', logoutError)
      setError(logoutError.message || 'Could not log out.')
    }
  }

  if (loading) {
    return <main className="dashboard-status" role="status">Checking your sign-in and loading the dashboard...</main>
  }
  if (error) {
    return (
      <main className="dashboard-status" role="alert">
        <p>{error}</p>
        <button type="button" onClick={() => navigate('/settings')}>Open Settings</button>
      </main>
    )
  }

  return (
    <div
      className="dashboard-shell"
      style={{
        '--dashboard-primary': settings.primary_color,
        '--dashboard-secondary': settings.secondary_color,
      }}
    >
      <aside className="dashboard-sidebar">
        <a className="dashboard-brand" href="/dashboard">
          <span className="dashboard-brand__mark">{hotelInitial}</span>
          <span>
            <strong>{hotelName}</strong>
            <small>HOTEL MANAGEMENT</small>
          </span>
        </a>

        <p className="dashboard-sidebar__label">WORKSPACE</p>
        <nav className="dashboard-nav" aria-label="Main navigation">
          <a className="dashboard-nav__link dashboard-nav__link--active" href="/dashboard">
            <span aria-hidden="true">▦</span>
            Dashboard
          </a>
          <a className="dashboard-nav__link" href="/orders">
            <span aria-hidden="true">▤</span>
            Orders
          </a>
          <a className="dashboard-nav__link" href="/products">
            <span aria-hidden="true">◈</span>
            Products
          </a>
          <a className="dashboard-nav__link" href="/tables">
            <span aria-hidden="true">▦</span>
            Tables
          </a>
          <a className="dashboard-nav__link" href="/settings">
            <span aria-hidden="true">⚙</span>
            Settings
          </a>
        </nav>

        <div className="dashboard-sidebar__footer">
          <div className="dashboard-user">
            <span className="dashboard-user__avatar">{hotelInitial}</span>
            <span>
              <strong>{hotelName}</strong>
              <small>Administrator</small>
            </span>
          </div>
          <button className="dashboard-logout" type="button" onClick={logout}>
            <span aria-hidden="true">↪</span>
            Logout
          </button>
        </div>
      </aside>

      <main className="dashboard-main">
        <header className="dashboard-topbar">
          <div>
            <p className="dashboard-eyebrow">SATURDAY, OCTOBER 17</p>
            <p className="dashboard-topbar__hotel">{hotelName}</p>
          </div>
          <button className="dashboard-sound-button" type="button">
            <span aria-hidden="true">◖</span>
            Enable Sound
          </button>
        </header>

        <section className="dashboard-welcome">
          <div>
            <p className="dashboard-eyebrow">YOUR RESTAURANT AT A GLANCE</p>
            <h1>Good Afternoon, {hotelName}!</h1>
            <p>Here&apos;s what&apos;s happening at {hotelName} today.</p>
          </div>
          <div className="dashboard-welcome__ornament" aria-hidden="true">✳</div>
        </section>

        <section className="dashboard-stats" aria-label="Today's overview">
          <article className="dashboard-stat-card">
            <div className="dashboard-stat-card__top">
              <span className="dashboard-stat-card__icon dashboard-stat-card__icon--orders">▤</span>
              <span className="dashboard-stat-card__caption">TODAY</span>
            </div>
            <p className="dashboard-stat-card__label">Today&apos;s Orders</p>
            <strong className="dashboard-stat-card__value">0</strong>
          </article>
          <article className="dashboard-stat-card">
            <div className="dashboard-stat-card__top">
              <span className="dashboard-stat-card__icon dashboard-stat-card__icon--pending">◷</span>
              <span className="dashboard-stat-card__caption">IN QUEUE</span>
            </div>
            <p className="dashboard-stat-card__label">Pending</p>
            <strong className="dashboard-stat-card__value">0</strong>
          </article>
          <article className="dashboard-stat-card">
            <div className="dashboard-stat-card__top">
              <span className="dashboard-stat-card__icon dashboard-stat-card__icon--preparing">◌</span>
              <span className="dashboard-stat-card__caption">IN KITCHEN</span>
            </div>
            <p className="dashboard-stat-card__label">Preparing</p>
            <strong className="dashboard-stat-card__value">0</strong>
          </article>
          <article className="dashboard-stat-card">
            <div className="dashboard-stat-card__top">
              <span className="dashboard-stat-card__icon dashboard-stat-card__icon--ready">✓</span>
              <span className="dashboard-stat-card__caption">TO SERVE</span>
            </div>
            <p className="dashboard-stat-card__label">Ready</p>
            <strong className="dashboard-stat-card__value">0</strong>
          </article>
          <article className="dashboard-stat-card">
            <div className="dashboard-stat-card__top">
              <span className="dashboard-stat-card__icon dashboard-stat-card__icon--served">♧</span>
              <span className="dashboard-stat-card__caption">COMPLETED</span>
            </div>
            <p className="dashboard-stat-card__label">Served</p>
            <strong className="dashboard-stat-card__value">0</strong>
          </article>
        </section>

        <section className="dashboard-lower-grid">
          <article className="dashboard-panel dashboard-revenue">
            <div className="dashboard-panel__heading">
              <div>
                <p className="dashboard-eyebrow">DAILY PERFORMANCE</p>
                <h2>Today&apos;s Revenue</h2>
              </div>
              <span className="dashboard-panel__icon" aria-hidden="true">↗</span>
            </div>
            <p className="dashboard-revenue__amount">₹0</p>
            <p className="dashboard-muted">Revenue from orders placed today</p>
            <div className="dashboard-chart-placeholder" aria-label="Revenue chart placeholder">
              <span>₹0</span>
              <span>₹0</span>
              <span>₹0</span>
              <span>₹0</span>
              <span>₹0</span>
            </div>
            <div className="dashboard-chart-labels" aria-hidden="true">
              <span>9 AM</span><span>12 PM</span><span>3 PM</span><span>6 PM</span><span>9 PM</span>
            </div>
          </article>

          <article className="dashboard-panel dashboard-tables">
            <div className="dashboard-panel__heading">
              <div>
                <p className="dashboard-eyebrow">LIVE FLOOR PLAN</p>
                <h2>Active Tables</h2>
              </div>
              <a className="dashboard-panel__link" href="/tables">View all <span aria-hidden="true">→</span></a>
            </div>
            <div className="dashboard-table-list">
              <div className="dashboard-table-row">
                <span className="dashboard-table-row__icon">A1</span>
                <span><strong>Table A1</strong><small>Ready for guests</small></span>
                <span className="dashboard-table-row__status">Waiting</span>
              </div>
              <div className="dashboard-table-row">
                <span className="dashboard-table-row__icon">A2</span>
                <span><strong>Table A2</strong><small>Ready for guests</small></span>
                <span className="dashboard-table-row__status">Waiting</span>
              </div>
              <div className="dashboard-table-row">
                <span className="dashboard-table-row__icon">A3</span>
                <span><strong>Table A3</strong><small>Ready for guests</small></span>
                <span className="dashboard-table-row__status">Waiting</span>
              </div>
            </div>
          </article>
        </section>
      </main>
    </div>
  )
}

export default Dashboard
