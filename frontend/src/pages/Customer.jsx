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
  const storageKey = `customer-order:${tenant}:${tableId}`

  const [table, setTable] = useState(null)
  const [products, setProducts] = useState([])
  const [cart, setCart] = useState({})
  const [sessionToken, setSessionToken] = useState('')
  const [specialInstructions, setSpecialInstructions] = useState('')
  const [loading, setLoading] = useState(true)
  const [placingOrder, setPlacingOrder] = useState(false)
  const [storageReady, setStorageReady] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true

    async function initializeCustomerPage() {
      setLoading(true)
      setError('')
      setMessage('')

      try {
        if (!tenant) {
          throw new Error('This QR code is missing its restaurant information.')
        }

        let token = localStorage.getItem(`${storageKey}:session`)
        if (!token) {
          token = createSessionToken()
          localStorage.setItem(`${storageKey}:session`, token)
        }

        let savedCart = {}
        const storedCart = localStorage.getItem(`${storageKey}:cart`)
        if (storedCart) {
          const parsedCart = JSON.parse(storedCart)
          if (parsedCart && typeof parsedCart === 'object' && !Array.isArray(parsedCart)) {
            savedCart = parsedCart
          }
        }

        const response = await fetch(
          `${API_URL}/customer/menu/${encodeURIComponent(tableId)}?tenant=${encodeURIComponent(tenant)}`,
        )
        const result = await response.json()
        if (!response.ok) {
          throw new Error(result.error || 'Could not load the menu.')
        }

        if (active) {
          setSessionToken(token)
          setCart(savedCart)
          setTable(result.table)
          setProducts(result.products)
          setStorageReady(true)
        }
      } catch (loadError) {
        console.error('Could not initialize customer ordering:', loadError)
        if (active) {
          setError(loadError.message || 'Could not load the menu.')
        }
      } finally {
        if (active) {
          setLoading(false)
        }
      }
    }

    initializeCustomerPage()
    return () => {
      active = false
    }
  }, [storageKey, tableId, tenant])

  useEffect(() => {
    if (!storageReady) return

    try {
      localStorage.setItem(`${storageKey}:cart`, JSON.stringify(cart))
    } catch (storageError) {
      console.error('Could not save the cart:', storageError)
      setError('Could not save your cart on this device.')
    }
  }, [cart, storageKey, storageReady])

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
      setMessage(`Order placed for ${result.customer_number}. Total: ₹${result.total}.`)
    } catch (orderError) {
      console.error('Could not place customer order:', orderError)
      setError(orderError.message || 'Could not place the order.')
    } finally {
      setPlacingOrder(false)
    }
  }

  return (
    <main>
      <h1>{table?.table_name ? `Menu - ${table.table_name}` : 'Restaurant Menu'}</h1>
      {loading && <p>Loading menu...</p>}
      {error && <p role="alert">{error}</p>}
      {message && <p role="status">{message}</p>}
      {!loading && !error && products.length === 0 && <p>No available products right now.</p>}

      <section aria-label="Available products">
        {products.map((product) => (
          <article key={product._id}>
            {product.image_url && <img src={product.image_url} alt={product.name} />}
            <h2>{product.name}</h2>
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
    </main>
  )
}

export default Customer