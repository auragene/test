import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { API_URL } from '../api'
import { clearDashboardTheme, readDashboardTheme } from '../dashboardTheme'
import LoadingSpinner from '../components/LoadingSpinner'
import './Dashboard.css'

const EMPTY_SUMMARY = {
  total: 0,
  pending: 0,
  preparing: 0,
  ready: 0,
  served: 0,
  revenue: 0,
}
const ACTIVE_TABLE_WINDOW_MS = 90 * 1000

function isToday(order) {
  const timestamp = order.created_at || order.order_date || order.timestamp
  const orderDate = new Date(timestamp)
  const today = new Date()

  return !Number.isNaN(orderDate.getTime()) &&
    orderDate.getFullYear() === today.getFullYear() &&
    orderDate.getMonth() === today.getMonth() &&
    orderDate.getDate() === today.getDate()
}

function getOrderTotal(order) {
  if (order.total !== undefined && order.total !== null) return Number(order.total) || 0
  return (order.items || []).reduce(
    (total, item) => total + Number(item.price || 0) * Number(item.quantity || 0),
    0,
  )
}

function summarizeTodayOrders(orders) {
  return orders.filter(isToday).reduce((summary, order) => {
    const status = order.status || 'pending'
    summary.total += 1
    summary.revenue += getOrderTotal(order)

    if (status === 'pending') summary.pending += 1
    if (status === 'preparing') summary.preparing += 1
    if (status === 'ready') summary.ready += 1
    if (status === 'served' || status === 'completed') summary.served += 1

    return summary
  }, { ...EMPTY_SUMMARY })
}

function getActiveTables(tables) {
  const now = Date.now()
  return tables
    .filter((table) => {
      const lastActivity = new Date(table.last_customer_activity_at)
      return !Number.isNaN(lastActivity.getTime()) && now - lastActivity.getTime() <= ACTIVE_TABLE_WINDOW_MS
    })
    .sort((firstTable, secondTable) =>
      (firstTable.table_name || '').localeCompare(secondTable.table_name || '', undefined, {
        numeric: true,
        sensitivity: 'base',
      }),
    )
}

const Dashboard = () => {
  const navigate = useNavigate()
  const [theme] = useState(readDashboardTheme)
  const [userName, setUserName] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [orderSummary, setOrderSummary] = useState(EMPTY_SUMMARY)
  const [activeTables, setActiveTables] = useState([])

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

        const ordersResponse = await fetch(`${API_URL}/get-orders`, {
          credentials: 'include',
        })
        const ordersResult = await ordersResponse.json()

        if (ordersResponse.status === 401) {
          sessionStorage.removeItem('account')
          clearDashboardTheme()
          navigate('/login', { replace: true })
          return
        }
        if (!ordersResponse.ok) {
          throw new Error(ordersResult.error || 'Could not load today\'s orders.')
        }

        const tablesResponse = await fetch(`${API_URL}/get-tables`, {
          credentials: 'include',
        })
        const tablesResult = await tablesResponse.json()

        if (tablesResponse.status === 401) {
          sessionStorage.removeItem('account')
          clearDashboardTheme()
          navigate('/login', { replace: true })
          return
        }
        if (!tablesResponse.ok) {
          throw new Error(tablesResult.error || 'Could not load active tables.')
        }

        if (active) {
          setUserName(userResult.name)
          setOrderSummary(summarizeTodayOrders(ordersResult))
          setActiveTables(getActiveTables(tablesResult))
        }
      } catch (loadError) {
        console.error('Error loading dashboard settings:', loadError)
        if (active) setError(loadError.message || 'Could not load dashboard settings.')
      } finally {
        if (active) setLoading(false)
      }
    }

    loadDashboardSettings()
    const refreshId = window.setInterval(loadDashboardSettings, 30000)
    return () => {
      active = false
      window.clearInterval(refreshId)
    }
  }, [navigate])

  if (loading) {
    return (
      <main className="dashboard-status dashboard-status--loading" role="status">
        <LoadingSpinner size={18} color="var(--brand-primary)" />
        <span>Loading overview…</span>
      </main>
    )
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


        <section className="dashboard-stats" aria-label="Today's overview">
          <article className="dashboard-stat-card">
            <div className="dashboard-stat-card__top">
              <span className="dashboard-stat-card__icon dashboard-stat-card__icon--orders">▤</span>
              <span className="dashboard-stat-card__caption">TODAY</span>
            </div>
            <p className="dashboard-stat-card__label">Today&apos;s Orders</p>
            <strong className="dashboard-stat-card__value">{orderSummary.total}</strong>
          </article>
          <article className="dashboard-stat-card">
            <div className="dashboard-stat-card__top">
              <span className="dashboard-stat-card__icon dashboard-stat-card__icon--pending">◷</span>
              <span className="dashboard-stat-card__caption">IN QUEUE</span>
            </div>
            <p className="dashboard-stat-card__label">Pending</p>
            <strong className="dashboard-stat-card__value">{orderSummary.pending}</strong>
          </article>
          <article className="dashboard-stat-card">
            <div className="dashboard-stat-card__top">
              <span className="dashboard-stat-card__icon dashboard-stat-card__icon--preparing">◌</span>
              <span className="dashboard-stat-card__caption">IN KITCHEN</span>
            </div>
            <p className="dashboard-stat-card__label">Preparing</p>
            <strong className="dashboard-stat-card__value">{orderSummary.preparing}</strong>
          </article>
          <article className="dashboard-stat-card">
            <div className="dashboard-stat-card__top">
              <span className="dashboard-stat-card__icon dashboard-stat-card__icon--ready">✓</span>
              <span className="dashboard-stat-card__caption">TO SERVE</span>
            </div>
            <p className="dashboard-stat-card__label">Ready</p>
            <strong className="dashboard-stat-card__value">{orderSummary.ready}</strong>
          </article>
          <article className="dashboard-stat-card">
            <div className="dashboard-stat-card__top">
              <span className="dashboard-stat-card__icon dashboard-stat-card__icon--served">♧</span>
              <span className="dashboard-stat-card__caption">COMPLETED</span>
            </div>
            <p className="dashboard-stat-card__label">Served</p>
            <strong className="dashboard-stat-card__value">{orderSummary.served}</strong>
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
            <p className="dashboard-revenue__amount">₹{orderSummary.revenue.toFixed(2)}</p>
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
              {activeTables.length === 0 ? (
                <p className="dashboard-tables__empty">No guests are currently viewing a menu.</p>
              ) : activeTables.map((table) => (
                <div className="dashboard-table-row" key={table._id}>
                  <span className="dashboard-table-row__icon">{table.table_name || '—'}</span>
                  <span>
                    <strong>{table.table_name || 'Unnamed table'}</strong>
                    <small>Customer is viewing the menu</small>
                  </span>
                  <span className="dashboard-table-row__status">Active</span>
                </div>
              ))}
            </div>
          </article>
        </section>
      </main>
    </div>
  )
}

export default Dashboard
