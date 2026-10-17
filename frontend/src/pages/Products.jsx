import { useEffect, useState } from 'react'
import { API_URL } from '../api'

const emptyProduct = {
  name: '',
  description: '',
  category: '',
  price: '',
  image_url: '',
  ingredients: '',
  prep_time: '',
  special_notes: '',
  available: true,
}

const Products = () => {
  const [products, setProducts] = useState([])
  const [product, setProduct] = useState(emptyProduct)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    async function loadProducts() {
      try {
        const response = await fetch(`${API_URL}/get-products`, {
          credentials: 'include',
        })
        const result = await response.json()
        if (!response.ok) {
          throw new Error(result.error || 'Could not load products.')
        }
        setProducts(result)
      } catch (error) {
        console.error('Error loading products:', error)
        setMessage(error.message || 'Could not load products.')
      } finally {
        setLoading(false)
      }
    }

    loadProducts()
  }, [])

  function updateField(event) {
    const { name, value, type, checked } = event.target
    setProduct((currentProduct) => ({
      ...currentProduct,
      [name]: type === 'checkbox' ? checked : value,
    }))
  }

  async function createProduct(event) {
    event.preventDefault()
    setSaving(true)
    setMessage('')

    try {
      const response = await fetch(`${API_URL}/create-product`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...product,
          price: Number(product.price),
          ingredients: product.ingredients
            .split(',')
            .map((ingredient) => ingredient.trim())
            .filter(Boolean),
        }),
      })
      const result = await response.json()
      if (!response.ok) {
        throw new Error(result.error || 'Could not create product.')
      }

      setProducts((currentProducts) => [...currentProducts, result])
      setProduct({ ...emptyProduct })
      setMessage('Product created.')
    } catch (error) {
      console.error('Error creating product:', error)
      setMessage(error.message || 'Could not create product.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <main>
      <h1>Products</h1>

      <form onSubmit={createProduct}>
        <h2>Add a product</h2>
        <label>
          Name
          <input name="name" value={product.name} onChange={updateField} required />
        </label>
        <label>
          Description
          <input name="description" value={product.description} onChange={updateField} required />
        </label>
        <label>
          Category
          <input name="category" value={product.category} onChange={updateField} required />
        </label>
        <label>
          Price
          <input
            name="price"
            type="number"
            min="0"
            step="0.01"
            value={product.price}
            onChange={updateField}
            required
          />
        </label>
        <label>
          Image URL
          <input name="image_url" type="url" value={product.image_url} onChange={updateField} />
        </label>
        <label>
          Ingredients (comma-separated)
          <input name="ingredients" value={product.ingredients} onChange={updateField} />
        </label>
        <label>
          Preparation time
          <input name="prep_time" value={product.prep_time} onChange={updateField} />
        </label>
        <label>
          Special notes
          <input name="special_notes" value={product.special_notes} onChange={updateField} />
        </label>
        <label>
          <input
            name="available"
            type="checkbox"
            checked={product.available}
            onChange={updateField}
          />
          Available
        </label>
        <button type="submit" disabled={saving}>
          {saving ? 'Saving...' : 'Create product'}
        </button>
      </form>

      {message && <p role="status">{message}</p>}
      {loading && <p>Loading products...</p>}
      {!loading && !message && products.length === 0 && <p>No products found.</p>}

      <section aria-label="Products">
        {products.map((item) => (
          <article key={item._id}>
            {item.image_url && <img src={item.image_url} alt={item.name} />}
            <p>{item.category}</p>
            <h2>{item.name}</h2>
            <p>₹{item.price}</p>
            <p>{item.description}</p>
            {item.ingredients?.length > 0 && <p>Ingredients: {item.ingredients.join(', ')}</p>}
            {item.prep_time && <p>Preparation time: {item.prep_time}</p>}
            {item.special_notes && <p>{item.special_notes}</p>}
            <p>{item.available ? 'Available' : 'Unavailable'}</p>
          </article>
        ))}
      </section>
    </main>
  )
}

export default Products