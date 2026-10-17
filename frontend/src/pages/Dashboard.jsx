import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { API_URL } from '../api'
import { clearDashboardTheme, readDashboardTheme } from '../dashboardTheme'
import './Dashboard.css'

const Dashboard = () => {
  const navigate = useNavigate()
  const [theme] = useState(readDashboardTheme)
  const [userName, setUserName] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true

    async function loadDashboardSettings() {
      try {
        const response = await fetch(`${API_URL}/dashboard-user`, {
          credentials: 'include',
        })
        const userResult = await response.json()

        if (response.status === 401) {
          sessionStorage.removeItem('account')
          clearDashboardTheme()
          navigate('/login', { replace: true })
          return
        }
        if (!response.ok) {
          throw new Error(userResult.error || 'Could not load the signed-in user.')
        }

        if (active) {
          setUserName(userResult.name)
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
  if (!theme) {
    return (
      <main className="dashboard-status" role="alert">
        <p>Dashboard colors are missing from this session. Please sign in again.</p>
        <button type="button" onClick={() => navigate('/login', { replace: true })}>Go to Login</button>
      </main>
    )
  }

  return (
    <div className="dashboard-shell">
      <main className="dashboard-main">
        <div className="dashboard-content-heading">
          <div>
            <p className="dashboard-eyebrow">YOUR RESTAURANT AT A GLANCE</p>
            <h1>Good afternoon, {userName}</h1>
            <p>Here&apos;s what&apos;s happening in your workspace today.</p>
          </div>
          <span aria-hidden="true">✳</span>
        </div>
        <section className="dashboard-welcome">
          <div>
            <p className="dashboard-eyebrow">TODAY&apos;S SERVICE</p>
            <h2>Service at a glance</h2>
            <p>Your daily overview, order activity and floor status.</p>
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
