import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { API_URL } from '../api'
import { clearDashboardTheme, readDashboardTheme } from '../dashboardTheme'
import './Orders.css'

const ACTIVE_COLUMNS = [
  { status: 'pending', label: 'Order Placed', action: 'Accept' },
  { status: 'accepted', label: 'Accepted', action: 'Start Preparing' },
  { status: 'preparing', label: 'Preparing', action: 'Ready for Pickup' },
  { status: 'ready', label: 'Ready for Pickup', action: 'Mark Served' },
]
const NEXT_STATUS = {
  pending: 'accepted',
  accepted: 'preparing',
  preparing: 'ready',
  ready: 'served',
}

function orderTime(order) {
  const value = order.created_at || order.order_date || order.timestamp
  if (!value) return ''
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? '' : date.toLocaleString()
}

function orderTotal(order) {
  if (order.total !== undefined && order.total !== null) return Number(order.total) || 0
  return (order.items || []).reduce(
    (total, item) => total + Number(item.price || 0) * Number(item.quantity || 0),
    0,
  )
}

const Orders = () => {
  const navigate = useNavigate()
  const [orders, setOrders] = useState([])
  const [theme] = useState(readDashboardTheme)
  const [loading, setLoading] = useState(true)
  const [updatingOrderId, setUpdatingOrderId] = useState(null)
  const [showServed, setShowServed] = useState(false)
  const [message, setMessage] = useState('')
  const [soundEnabled, setSoundEnabled] = useState(false)
  const [resettingServed, setResettingServed] = useState(false)

  const loadOrders = useCallback(async (showLoading = false) => {
    if (showLoading) setLoading(true)
    try {
      const response = await fetch(`${API_URL}/get-orders`, { credentials: 'include' })
      const result = await response.json()
      if (response.status === 401) {
        sessionStorage.removeItem('account')
        clearDashboardTheme()
        navigate('/login', { replace: true })
        return
      }
      if (!response.ok) throw new Error(result.error || 'Could not load orders.')
      setOrders(result)
      setMessage('')
    } catch (error) {
      console.error('Error loading orders:', error)
      setMessage(error.message || 'Could not load orders.')
    } finally {
      if (showLoading) setLoading(false)
    }
  }, [navigate])

  useEffect(() => {
    let active = true

    async function loadUserAndTheme() {
      try {
        if (!theme) {
          throw new Error('Dashboard colors are missing from this session. Please sign in again.')
        }
        const response = await fetch(`${API_URL}/dashboard-user`, { credentials: 'include' })
        const result = await response.json()
        if (response.status === 401) {
          sessionStorage.removeItem('account')
          clearDashboardTheme()
          navigate('/login', { replace: true })
          return
        }
        if (!response.ok) throw new Error(result.error || 'Could not load your account.')
        if (!active) return
      } catch (error) {
        console.error('Could not load Orders page settings:', error)
        if (active) setMessage(error.message || 'Could not load Orders page settings.')
      } finally {
        if (active) setLoading(false)
      }
    }

    loadUserAndTheme()
    return () => {
      active = false
    }
  }, [navigate, theme])

  useEffect(() => {
    if (!theme) return undefined
    loadOrders(true)
    const intervalId = window.setInterval(() => loadOrders(), 5000)
    return () => window.clearInterval(intervalId)
  }, [loadOrders, theme])

  async function updateStatus(orderId, status) {
    setUpdatingOrderId(orderId)
    setMessage('')
    try {
      const response = await fetch(
        `${API_URL}/update-order-status/${encodeURIComponent(orderId)}`,
        {
          method: 'PATCH',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status }),
        },
      )
      const result = await response.json()
      if (response.status === 401) {
        sessionStorage.removeItem('account')
        clearDashboardTheme()
        navigate('/login', { replace: true })
        return
      }
      if (!response.ok) throw new Error(result.error || 'Could not update order status.')
      setOrders((current) =>
        current.map((order) => (order._id === result._id ? result : order)),
      )
      setMessage(`Order moved to ${result.status}.`)
    } catch (error) {
      console.error('Error updating order status:', error)
      setMessage(error.message || 'Could not update order status.')
    } finally {
      setUpdatingOrderId(null)
    }
  }

  async function resetServedOrders() {
    const servedCount = orders.filter((order) => ['served', 'completed'].includes(order.status)).length
    if (!servedCount || !window.confirm(`Delete all ${servedCount} served orders? This cannot be undone.`)) {
      return
    }

    setResettingServed(true)
    setMessage('')
    try {
      const response = await fetch(`${API_URL}/reset-served-orders`, {
        method: 'DELETE',
        credentials: 'include',
      })
      const result = await response.json()
      if (response.status === 401) {
        sessionStorage.removeItem('account')
        clearDashboardTheme()
        navigate('/login', { replace: true })
        return
      }
      if (!response.ok) throw new Error(result.error || 'Could not reset served orders.')

      setOrders((current) =>
        current.filter((order) => !['served', 'completed'].includes(order.status)),
      )
      setMessage(`${result.deleted_count || 0} served order(s) reset.`)
    } catch (error) {
      console.error('Error resetting served orders:', error)
      setMessage(error.message || 'Could not reset served orders.')
    } finally {
      setResettingServed(false)
    }
  }

  const visibleOrders = showServed
    ? orders.filter((order) => ['served', 'completed'].includes(order.status))
    : orders.filter((order) => !['served', 'completed'].includes(order.status))

  if (loading && !theme) {
    return <main className="orders-status" role="status">Checking your sign-in and loading orders...</main>
  }
  if (!theme) {
    return (
      <main className="orders-status" role="alert">
        <p>{message || 'Could not load the Orders page.'}</p>
        <button type="button" onClick={() => navigate('/settings')}>Open Settings</button>
      </main>
    )
  }

  return (
    <main
      className="orders-main"
      style={{
        '--orders-primary': theme.primary,
        '--orders-secondary': theme.secondary,
      }}
    >
        <section className="orders-workspace">
          <div className="orders-toolbar">
            <div className="orders-tabs" aria-label="Order views">
              <button
                className={!showServed ? 'is-selected' : ''}
                type="button"
                onClick={() => setShowServed(false)}
              >
                Active Orders
              </button>
              <button
                className={showServed ? 'is-selected' : ''}
                type="button"
                onClick={() => setShowServed(true)}
              >
                Served ({orders.filter((order) => ['served', 'completed'].includes(order.status)).length})
              </button>
            </div>
            <div className="orders-toolbar__actions">
              {showServed && (
                <button
                  className="orders-reset-served"
                  type="button"
                  onClick={resetServedOrders}
                  disabled={resettingServed || visibleOrders.length === 0}
                >
                  {resettingServed ? 'Resetting...' : 'Reset served orders'}
                </button>
              )}
              <button type="button" onClick={() => setSoundEnabled((enabled) => !enabled)}>
                <span aria-hidden="true">◖</span> {soundEnabled ? 'Disable Sound' : 'Enable Sound'}
              </button>
              <button type="button" onClick={() => loadOrders(true)}>
                <span aria-hidden="true">⟳</span> Refresh
              </button>
            </div>
          </div>

          {!showServed ? (
            <section className="orders-board" aria-label="Active orders by status">
              {ACTIVE_COLUMNS.map((column, index) => {
                const columnOrders = visibleOrders.filter(
                  (order) => (order.status || 'pending') === column.status,
                )
                return (
                  <section
                    className={`orders-column orders-column--${index + 1}`}
                    key={column.status}
                    aria-label={`${column.label}: ${columnOrders.length} orders`}
                  >
                    <header className="orders-column__heading">
                      <h2>{column.label}</h2>
                      <span>{columnOrders.length}</span>
                    </header>
                    <div className="orders-column__stack">
                      {columnOrders.length === 0 ? (
                        <p className="orders-empty">No orders</p>
                      ) : columnOrders.map((order) => (
                        <article className="order-card" key={order._id}>
                          <header className="order-card__heading">
                            <div>
                              <strong>Table {order.table_name || order.table_id || '—'}</strong>
                              <small>Customer {order.customer_number || '—'}</small>
                            </div>
                            <span className="order-card__badge">{column.label}</span>
                          </header>
                          {orderTime(order) && <p className="order-card__time">Ordered {orderTime(order)}</p>}
                          <ul className="order-card__items">
                            {(order.items || []).map((item, itemIndex) => (
                              <li key={`${item.product_id || item.name}-${itemIndex}`}>
                                <span>{item.name} <small>× {item.quantity}</small></span>
                                <strong>₹{(Number(item.price || 0) * Number(item.quantity || 0)).toFixed(2)}</strong>
                              </li>
                            ))}
                          </ul>
                          {order.special_instructions && (
                            <p className="order-card__instructions">{order.special_instructions}</p>
                          )}
                          <footer className="order-card__footer">
                            <span>Total<strong>₹{orderTotal(order).toFixed(2)}</strong></span>
                            <button
                              type="button"
                              onClick={() => updateStatus(order._id, NEXT_STATUS[column.status])}
                              disabled={updatingOrderId === order._id}
                            >
                              {updatingOrderId === order._id ? 'Updating…' : column.action}
                            </button>
                          </footer>
                        </article>
                      ))}
                    </div>
                  </section>
                )
              })}
            </section>
          ) : (
            <section className="orders-served" aria-label="Served orders">
              {visibleOrders.length === 0 ? <p className="orders-empty">No served orders</p> : (
                visibleOrders.map((order) => (
                  <article className="order-card order-card--served" key={order._id}>
                    <header className="order-card__heading">
                      <div>
                        <strong>Table {order.table_name || order.table_id || '—'}</strong>
                        <small>Customer {order.customer_number || '—'}</small>
                      </div>
                      <span className="order-card__badge">Served</span>
                    </header>
                    {orderTime(order) && <p className="order-card__time">Ordered {orderTime(order)}</p>}
                    <ul className="order-card__items">
                      {(order.items || []).map((item, itemIndex) => (
                        <li key={`${item.product_id || item.name}-${itemIndex}`}>
                          <span>{item.name} <small>× {item.quantity}</small></span>
                          <strong>₹{(Number(item.price || 0) * Number(item.quantity || 0)).toFixed(2)}</strong>
                        </li>
                      ))}
                    </ul>
                    <footer className="order-card__footer">
                      <span>Total<strong>₹{orderTotal(order).toFixed(2)}</strong></span>
                    </footer>
                  </article>
                ))
              )}
            </section>
          )}
          {message && <p className="orders-message" role="status">{message}</p>}
          {loading && <p className="orders-message" role="status">Refreshing orders...</p>}
        </section>
    </main>
  )
}

export default Orders
