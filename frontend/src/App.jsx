import { useEffect, useState } from 'react'
import './App.css'

function App() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    async function loadProducts() {
      try {
        const response = await fetch('https://test-gcej.onrender.com//products')

        if (!response.ok) {
          throw new Error('Could not load the menu.')
        }

        const data = await response.json()
        setProducts(data)
      } catch (err) {
        console.error(err)
        setError('Could not load the menu. Check that the backend is running.')
      } finally {
        setLoading(false)
      }
    }

    loadProducts()
  }, [])

  return (
    <main className="menu-page">
      <h1>Our Menu</h1>

      {loading && <p>Loading menu...</p>}
      {error && <p className="page-message--error">{error}</p>}
      {!loading && !error && products.length === 0 && <p>No menu items found.</p>}

      <section className="product-grid">
        {products.map((product) => (
          <article className="product-card" key={product._id}>
            {product.image_url && (
              <img
                className="product-card__image"
                src={product.image_url}
                alt={product.name}
              />
            )}

            <div className="product-card__content">
              <p className="product-card__category">{product.category}</p>
              <div className="product-card__title-row">
                <h2>{product.name}</h2>
                <p className="product-card__price">₹{product.price}</p>
              </div>
              <p className="product-card__description">{product.description}</p>
              <p>Ingredients: {product.ingredients?.join(', ')}</p>
              <p>Preparation time: {product.prep_time}</p>
              <p>{product.special_notes}</p>
              <p>{product.available ? 'Available' : 'Unavailable'}</p>
            </div>
          </article>
        ))}
      </section>
    </main>
  )
}

export default App
