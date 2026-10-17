import { useEffect, useState } from 'react'
import { API_URL } from '../api'

const VALID_STATUSES = ['pending', 'accepted', 'preparing', 'ready', 'served']

const Orders = () => {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [updatingOrderId, setUpdatingOrderId] = useState(null)
  const [showAllOrders, setShowAllOrders] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    let active = true

    async function loadOrders() {
      setLoading(true)
      setMessage('')
      try {
        const response = await fetch(
          `${API_URL}/get-orders${showAllOrders ? '' : '?active=true'}`,
          { credentials: 'include' },
        )
        const result = await response.json()
        if (!response.ok) {
          throw new Error(result.error || 'Could not load orders.')
        }
        if (active) setOrders(result)
      } catch (error) {
        console.error('Error loading orders:', error)
        if (active) setMessage(error.message || 'Could not load orders.')
      } finally {
        if (active) setLoading(false)
      }
    }

    loadOrders()
    return () => {
      active = false
    }
  }, [showAllOrders])

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
      if (!response.ok) {
        throw new Error(result.error || 'Could not update order status.')
      }

      setOrders((currentOrders) =>
        currentOrders.map((order) => (order._id === result._id ? result : order)),
      )
      setMessage(`Order status updated to ${result.status}.`)
      if (!showAllOrders && ['served', 'completed'].includes(result.status)) {
        setOrders((currentOrders) => currentOrders.filter((order) => order._id !== result._id))
      }
    } catch (error) {
      console.error('Error updating order status:', error)
      setMessage(error.message || 'Could not update order status.')
    } finally {
      setUpdatingOrderId(null)
    }
  }

  return (
    <main>
      <h1>Orders</h1>
      <label>
        <input
          type="checkbox"
          checked={showAllOrders}
          onChange={(event) => setShowAllOrders(event.target.checked)}
        />
        Show served and completed orders
      </label>

      {message && <p role="status">{message}</p>}
      {loading && <p>Loading orders...</p>}
      {!loading && !message && orders.length === 0 && <p>No orders found.</p>}

      <section aria-label="Orders">
        {orders.map((order) => (
          <article key={order._id}>
            <h2>Order {order.customer_number || order._id}</h2>
            <p>Table: {order.table_name}</p>
            <p>Status: {order.status || 'pending'}</p>
            <ul>
              {(order.items || []).map((item, index) => (
                <li key={`${item.product_id || item.name}-${index}`}>
                  {item.name} × {item.quantity} — ₹{Number(item.price) * Number(item.quantity)}
                </li>
              ))}
            </ul>
            <p>Total: ₹{order.total}</p>
            {order.special_instructions && <p>Instructions: {order.special_instructions}</p>}
            <label>
              Update status
              <select
                value={VALID_STATUSES.includes(order.status) ? order.status : 'pending'}
                onChange={(event) => updateStatus(order._id, event.target.value)}
                disabled={updatingOrderId === order._id}
              >
                {VALID_STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </label>
            {updatingOrderId === order._id && <p>Updating status...</p>}
          </article>
        ))}
      </section>
    </main>
  )
}

export default Orders