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
  const [editingProductId, setEditingProductId] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deletingProductId, setDeletingProductId] = useState(null)
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

  function cancelEdit() {
    setEditingProductId(null)
    setProduct({ ...emptyProduct })
  }

  function startEdit(item) {
    setEditingProductId(item._id)
    setProduct({
      name: item.name || '',
      description: item.description || '',
      category: item.category || '',
      price: item.price ?? '',
      image_url: item.image_url || '',
      ingredients: Array.isArray(item.ingredients)
        ? item.ingredients.join(', ')
        : item.ingredients || '',
      prep_time: item.prep_time || '',
      special_notes: item.special_notes || '',
      available: item.available ?? true,
    })
    setMessage('')
  }

  async function saveProduct(event) {
    event.preventDefault()
    setSaving(true)
    setMessage('')

    try {
      const isEditing = editingProductId !== null
      const response = await fetch(
        isEditing
          ? `${API_URL}/edit-product/${encodeURIComponent(editingProductId)}`
          : `${API_URL}/create-product`,
        {
          method: isEditing ? 'PATCH' : 'POST',
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
        },
      )
      const result = await response.json()
      if (!response.ok) {
        throw new Error(result.error || `Could not ${isEditing ? 'update' : 'create'} product.`)
      }

      if (isEditing) {
        setProducts((currentProducts) =>
          currentProducts.map((item) => (item._id === result._id ? result : item)),
        )
      } else {
        setProducts((currentProducts) => [...currentProducts, result])
      }
      setEditingProductId(null)
      setProduct({ ...emptyProduct })
      setMessage(isEditing ? 'Product updated.' : 'Product created.')
    } catch (error) {
      console.error('Error saving product:', error)
      setMessage(error.message || 'Could not save product.')
    } finally {
      setSaving(false)
    }
  }

  async function deleteProduct(item) {
    if (!window.confirm(`Delete "${item.name}"? This action cannot be undone.`)) {
      return
    }

    setDeletingProductId(item._id)
    setMessage('')
    try {
      const response = await fetch(
        `${API_URL}/delete-product/${encodeURIComponent(item._id)}`,
        {
          method: 'DELETE',
          credentials: 'include',
        },
      )
      const result = await response.json()
      if (!response.ok) {
        throw new Error(result.error || 'Could not delete product.')
      }

      setProducts((currentProducts) =>
        currentProducts.filter((productItem) => productItem._id !== item._id),
      )
      if (editingProductId === item._id) {
        cancelEdit()
      }
      setMessage('Product deleted.')
    } catch (error) {
      console.error('Error deleting product:', error)
      setMessage(error.message || 'Could not delete product.')
    } finally {
      setDeletingProductId(null)
    }
  }

  return (
    <main>
      <h1>Products</h1>

      <form onSubmit={saveProduct}>
        <h2>{editingProductId ? 'Edit product' : 'Add a product'}</h2>
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
          {saving ? 'Saving...' : editingProductId ? 'Update product' : 'Create product'}
        </button>
        {editingProductId && (
          <button type="button" onClick={cancelEdit} disabled={saving}>
            Cancel edit
          </button>
        )}
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
            <button
              type="button"
              onClick={() => startEdit(item)}
              disabled={saving || deletingProductId !== null}
            >
              Edit
            </button>
            <button
              type="button"
              onClick={() => deleteProduct(item)}
              disabled={saving || deletingProductId !== null}
            >
              {deletingProductId === item._id ? 'Deleting...' : 'Delete'}
            </button>
          </article>
        ))}
      </section>
    </main>
  )
}

export default Products