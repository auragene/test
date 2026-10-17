import { useEffect, useMemo, useState } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
import { API_URL } from '../api'

function createSessionToken() {
  if (globalThis.crypto?.randomUUID) {
    return globalThis.crypto.randomUUID()
  }
  if (!globalThis.crypto?.getRandomValues) {
    throw new Error('This browser cannot create a secure ordering session.')
  }

  const bytes = globalThis.crypto.getRandomValues(new Uint8Array(16))
  bytes[6] = (bytes[6] & 0x0f) | 0x40
  bytes[8] = (bytes[8] & 0x3f) | 0x80
  const hex = [...bytes].map((byte) => byte.toString(16).padStart(2, '0')).join('')
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`
}

const Customer = () => {
  const { tableId } = useParams()
  const [searchParams] = useSearchParams()
  const tenant = searchParams.get('tenant') || ''

  const [table, setTable] = useState(null)
  const [settings, setSettings] = useState({})
  const [products, setProducts] = useState([])
  const [orders, setOrders] = useState([])
  const [cart, setCart] = useState({})
  const [sessionToken, setSessionToken] = useState('')
  const [specialInstructions, setSpecialInstructions] = useState('')
  const [loading, setLoading] = useState(true)
  const [placingOrder, setPlacingOrder] = useState(false)
  const [showMenu, setShowMenu] = useState(true)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true

    setLoading(true)
    setError('')
    setMessage('')
    setOrders([])
    setCart({})
    setSpecialInstructions('')
    setShowMenu(true)

    if (!tenant) {
      setError('This QR code is missing its restaurant information.')
      setLoading(false)
      return () => {
        active = false
      }
    }

    try {
      const token = createSessionToken()
      setSessionToken(token)
    } catch (storageError) {
      console.error('Could not create the customer session:', storageError)
      setError(storageError.message || 'Could not start your ordering session.')
      setLoading(false)
      return () => {
        active = false
      }
    }

    async function loadMenu() {
      try {
        const response = await fetch(
          `${API_URL}/customer/menu/${encodeURIComponent(tableId)}?tenant=${encodeURIComponent(tenant)}`,
        )
        const result = await response.json()
        if (!response.ok) {
          throw new Error(result.error || 'Could not load the menu.')
        }

        if (active) {
          setTable(result.table)
          setProducts(result.products)
          setSettings(result.settings || {})
        }
      } catch (loadError) {
        console.error('Could not load the customer menu:', loadError)
        if (active) setError(loadError.message || 'Could not load the menu.')
      } finally {
        if (active) setLoading(false)
      }
    }

    loadMenu()
    return () => {
      active = false
    }
  }, [tableId, tenant])

  useEffect(() => {
    if (!sessionToken || !tenant || !tableId) return

    let active = true
    async function refreshOrderStatuses() {
      try {
        const response = await fetch(
          `${API_URL}/customer/orders/${encodeURIComponent(tableId)}?tenant=${encodeURIComponent(tenant)}&session_token=${encodeURIComponent(sessionToken)}`,
        )
        const result = await response.json()
        if (!response.ok) {
          throw new Error(result.error || 'Could not refresh order statuses.')
        }
        if (active) {
          setOrders(result)
        }
      } catch (statusError) {
        console.error('Could not refresh order statuses:', statusError)
        if (active) setError(statusError.message || 'Could not refresh order statuses.')
      }
    }

    refreshOrderStatuses()
    const intervalId = window.setInterval(refreshOrderStatuses, 5000)
    return () => {
      active = false
      window.clearInterval(intervalId)
    }
  }, [sessionToken, tableId, tenant])

  const total = useMemo(
    () =>
      products.reduce(
        (sum, product) => sum + (Number(product.price) || 0) * (cart[product._id] || 0),
        0,
      ),
    [cart, products],
  )

  function changeQuantity(productId, amount) {
    setCart((currentCart) => {
      const quantity = (currentCart[productId] || 0) + amount
      const nextCart = { ...currentCart }
      if (quantity <= 0) {
        delete nextCart[productId]
      } else {
        nextCart[productId] = quantity
      }
      return nextCart
    })
  }

  async function placeOrder() {
    const items = Object.entries(cart)
      .filter(([, quantity]) => Number.isInteger(quantity) && quantity > 0)
      .map(([product_id, quantity]) => ({ product_id, quantity }))

    if (items.length === 0) {
      setError('Add at least one item before placing your order.')
      return
    }

    setPlacingOrder(true)
    setError('')
    setMessage('')
    try {
      const response = await fetch(
        `${API_URL}/customer/orders/${encodeURIComponent(tableId)}?tenant=${encodeURIComponent(tenant)}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            session_token: sessionToken,
            items,
            special_instructions: specialInstructions,
          }),
        },
      )
      const result = await response.json()
      if (!response.ok) {
        throw new Error(result.error || 'Could not place the order.')
      }

      setCart({})
      setSpecialInstructions('')
      setOrders((currentOrders) => [result, ...currentOrders])
      setShowMenu(false)
      setMessage(`Order placed for ${result.customer_number}.`)
    } catch (orderError) {
      console.error('Could not place customer order:', orderError)
      setError(orderError.message || 'Could not place the order.')
    } finally {
      setPlacingOrder(false)
    }
  }

  return (
    <main
      className="customer-menu"
      style={{
        '--brand-primary': settings.primary_color || settings.primaryColor || settings.primary,
        '--brand-secondary':
          settings.secondary_color || settings.secondaryColor || settings.secondary,
      }}
    >
      <header>
        {settings.logo_url && (
          <img
            src={settings.logo_url}
            alt={settings.hotel_name || settings.restaurant_name || settings.name || 'Restaurant'}
            width="96"
          />
        )}
        <h1>
          {settings.hotel_name ||
            settings.restaurant_name ||
            settings.display_name ||
            settings.brand_name ||
            settings.name ||
            table?.table_name ||
            'Restaurant Menu'}
        </h1>
        {table?.table_name && <p>Table: {table.table_name}</p>}
        {settings.address && <p>{settings.address}</p>}
      </header>
      {loading && <p>Loading menu...</p>}
      {error && <p role="alert">{error}</p>}
      {message && <p role="status">{message}</p>}

      {orders.length > 0 && (
        <section aria-label="Your orders">
          <h2>Order status</h2>
          <p>Status refreshes automatically every 10 seconds.</p>
          {orders.map((order) => (
            <article key={order._id}>
              <h3>{order.customer_number}</h3>
              <p>
                Status: <strong>{order.status || 'pending'}</strong>
              </p>
              <ul>
                {(order.items || []).map((item, index) => (
                  <li key={`${item.product_id}-${index}`}>
                    {item.name} × {item.quantity}
                  </li>
                ))}
              </ul>
              <p>Total: ₹{order.total}</p>
            </article>
          ))}
        </section>
      )}

      {!showMenu && orders.length > 0 && (
        <button
          type="button"
          onClick={() => {
            setError('')
            setMessage('')
            setShowMenu(true)
          }}
        >
          Order more items
        </button>
      )}

      {showMenu && (
        <>
          <section aria-label="Available products">
            <h2>{orders.length > 0 ? 'Select more items' : 'Menu'}</h2>
            {!loading && !error && products.length === 0 && <p>No available products right now.</p>}
            {products.map((product) => (
              <article key={product._id}>
                {product.image_url && <img src={product.image_url} alt={product.name} />}
                <h3>{product.name}</h3>
                <p>{product.description}</p>
                <p>₹{product.price}</p>
                <div>
                  <button
                    type="button"
                    onClick={() => changeQuantity(product._id, -1)}
                    disabled={!cart[product._id]}
                    aria-label={`Remove one ${product.name}`}
                  >
                    -
                  </button>
                  <span aria-live="polite">{cart[product._id] || 0}</span>
                  <button
                    type="button"
                    onClick={() => changeQuantity(product._id, 1)}
                    aria-label={`Add one ${product.name}`}
                  >
                    +
                  </button>
                </div>
              </article>
            ))}
          </section>

          <section aria-label="Your order">
            <h2>Your order</h2>
            {products
              .filter((product) => cart[product._id] > 0)
              .map((product) => (
                <p key={product._id}>
                  {product.name} × {cart[product._id]} — ₹
                  {Number(product.price) * cart[product._id]}
                </p>
              ))}
            <p>Total: ₹{total}</p>
            <label>
              Special instructions
              <textarea
                value={specialInstructions}
                onChange={(event) => setSpecialInstructions(event.target.value)}
                maxLength={500}
              />
            </label>
            <button
              type="button"
              onClick={placeOrder}
              disabled={loading || placingOrder || !sessionToken || total <= 0}
            >
              {placingOrder ? 'Placing order...' : 'Place order'}
            </button>
          </section>
        </>
      )}
    </main>
  )
}

export default Customer