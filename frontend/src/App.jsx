import { BrowserRouter, Routes, Route } from "react-router-dom";
import React from "react";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Orders from "./pages/Orders";  
import Products from "./pages/Products";
import Settings from "./pages/Settings";
import Tables from "./pages/Tables";
import Customer from "./pages/Customer";
function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/orders" element={<Orders />} />
        <Route path="/products" element={<Products />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/tables" element={<Tables />} />
        <Route path="/customer/table/:tableId" element={<Customer />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;

// import { useEffect, useState } from 'react'
// import './App.css'

// const PRODUCTS_URL = 'https://test-gcej.onrender.com/products'

// const emptyProduct = {
//   name: '',
//   description: '',
//   image_url: '',
//   category: '',
//   price: '',
//   available: true,
//   ingredients: '',
//   prep_time: '',
//   special_notes: '',
// }

// function App() {
//   const [products, setProducts] = useState([])
//   const [product, setProduct] = useState(emptyProduct)
//   const [loading, setLoading] = useState(true)
//   const [message, setMessage] = useState('')
//   const [saving, setSaving] = useState(false)

//   useEffect(() => {
//     async function loadProducts() {
//       try {
//         const response = await fetch(PRODUCTS_URL)
//         if (!response.ok) throw new Error('Could not load the menu.')
//         setProducts(await response.json())
//       } catch (error) {
//         console.error(error)
//         setMessage('Could not load the menu.')
//       } finally {
//         setLoading(false)
//       }
//     }

//     loadProducts()
//   }, [])

//   function updateField(event) {
//     const { name, value, type, checked } = event.target
//     setProduct({
//       ...product,
//       [name]: type === 'checkbox' ? checked : value,
//     })
//   }

//   async function createProduct(event) {
//     event.preventDefault()
//     setSaving(true)
//     setMessage('')

//     try {
//       const newProduct = {
//         ...product,
//         price: Number(product.price),
//         ingredients: product.ingredients
//           .split(',')
//           .map((ingredient) => ingredient.trim())
//           .filter(Boolean),
//       }

//       const response = await fetch(PRODUCTS_URL, {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify(newProduct),
//       })

//       const result = await response.json()
//       if (!response.ok) throw new Error(result.message || 'Could not create product.')

//       setProducts([...products, result])
//       setProduct({ ...emptyProduct })
//       setMessage('Product created.')
//     } catch (error) {
//       console.error(error)
//       setMessage(error.message || 'Could not create product.')
//     } finally {
//       setSaving(false)
//     }
//   }

//   return (
//     <main className="menu-page">
//       <h1>Our Menu</h1>

//       <form onSubmit={createProduct}>
//         <h2>Add a product</h2>

//         <label>
//           Name
//           <input name="name" value={product.name} onChange={updateField} required />
//         </label>
//         <label>
//           Description
//           <input name="description" value={product.description} onChange={updateField} required />
//         </label>
//         <label>
//           Category
//           <input name="category" value={product.category} onChange={updateField} required />
//         </label>
//         <label>
//           Price
//           <input name="price" type="number" min="0" value={product.price} onChange={updateField} required />
//         </label>
//         <label>
//           Image URL
//           <input name="image_url" value={product.image_url} onChange={updateField} />
//         </label>
//         <label>
//           Ingredients (separate with commas)
//           <input name="ingredients" value={product.ingredients} onChange={updateField} />
//         </label>
//         <label>
//           Preparation time
//           <input name="prep_time" value={product.prep_time} onChange={updateField} />
//         </label>
//         <label>
//           Special notes
//           <input name="special_notes" value={product.special_notes} onChange={updateField} />
//         </label>
//         <label>
//           <input name="available" type="checkbox" checked={product.available} onChange={updateField} />
//           Available
//         </label>
//         <button type="submit" disabled={saving}>
//           {saving ? 'Saving...' : 'Create product'}
//         </button>
//       </form>

//       {message && <p>{message}</p>}
//       {loading && <p>Loading menu...</p>}
//       {!loading && products.length === 0 && <p>No menu items found.</p>}

//       <section className="product-grid">
//         {products.map((item) => (
//           <article className="product-card" key={item._id}>
//             {item.image_url && (
//               <img className="product-card__image" src={item.image_url} alt={item.name} />
//             )}
//             <div className="product-card__content">
//               <p className="product-card__category">{item.category}</p>
//               <div className="product-card__title-row">
//                 <h2>{item.name}</h2>
//                 <p className="product-card__price">₹{item.price}</p>
//               </div>
//               <p className="product-card__description">{item.description}</p>
//               <p>Ingredients: {item.ingredients?.join(', ')}</p>
//               <p>Preparation time: {item.prep_time}</p>
//               <p>{item.special_notes}</p>
//               <p>{item.available ? 'Available' : 'Unavailable'}</p>
//             </div>
//           </article>
//         ))}
//       </section>
//     </main>
//   )
// }

// export default App
