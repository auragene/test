import { useEffect, useState } from 'react'
import { API_URL } from '../api'

const emptyProduct = {
  name: '',
  description: '',
  category: '',
  price: '',
  image_url: '',
  image_public_id: '',
  ingredients: '',
  prep_time: '',
  special_notes: '',
  available: true,
}

const productCategories = [
  'Appetizers',
  'Soups & Salads',
  'Main Course',
  'Breads',
  'Rice & Noodles',
  'Pizza & Pasta',
  'Burgers & Sandwiches',
  'Desserts',
  'Beverages',
  'Other',
]

const Products = () => {
  const [products, setProducts] = useState([])
  const [product, setProduct] = useState(emptyProduct)
  const [editingProductId, setEditingProductId] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploadingImage, setUploadingImage] = useState(false)
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
      image_public_id: item.image_public_id || '',
      ingredients: Array.isArray(item.ingredients)
        ? item.ingredients.join(', ')
        : item.ingredients || '',
      prep_time: item.prep_time || '',
      special_notes: item.special_notes || '',
      available: item.available ?? true,
    })
    setMessage('')
  }

  async function uploadImage(event) {
    const image = event.target.files?.[0]
    if (!image) return

    if (!image.type.startsWith('image/')) {
      setMessage('Choose a valid image file.')
      event.target.value = ''
      return
    }

    setUploadingImage(true)
    setMessage('')
    try {
      const formData = new FormData()
      formData.append('image', image)
      const response = await fetch(`${API_URL}/upload-product-image`, {
        method: 'POST',
        credentials: 'include',
        body: formData,
      })
      const result = await response.json()
      if (!response.ok) {
        throw new Error(result.error || 'Could not upload image.')
      }
      setProduct((currentProduct) => ({
        ...currentProduct,
        image_url: result.image_url,
        image_public_id: result.image_public_id,
      }))
      setMessage('Image uploaded. It will be saved with this product.')
    } catch (error) {
      console.error('Error uploading image:', error)
      setMessage(error.message || 'Could not upload image.')
    } finally {
      setUploadingImage(false)
      event.target.value = ''
    }
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
          <select name="category" value={product.category} onChange={updateField} required>
            <option value="" disabled>Select a category</option>
            {product.category && !productCategories.includes(product.category) && (
              <option value={product.category}>{product.category}</option>
            )}
            {productCategories.map((category) => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>
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
          Product image
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            onChange={uploadImage}
            disabled={saving || uploadingImage}
          />
        </label>
        {uploadingImage && <p>Uploading image...</p>}
        {product.image_url && (
          <img src={product.image_url} alt="Selected product preview" style={{ maxWidth: '180px' }} />
        )}
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
        <button type="submit" disabled={saving || uploadingImage}>
          {saving ? 'Saving...' : uploadingImage ? 'Uploading image...' : editingProductId ? 'Update product' : 'Create product'}
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
            <div className="product-card-actions">
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
            </div>
          </article>
        ))}
      </section>
    </main>
  )
}

export default Products
