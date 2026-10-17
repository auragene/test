import { useEffect, useState } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { API_URL } from '../api'

const CUSTOMER_APP_URL = import.meta.env.VITE_CUSTOMER_APP_URL || window.location.origin

function getTableCustomerUrl(tableId, tenant) {
  return `${CUSTOMER_APP_URL}/customer/table/${encodeURIComponent(tableId)}?tenant=${encodeURIComponent(tenant)}`
}

const Tables = () => {
  const [tables, setTables] = useState([])
  const [tableName, setTableName] = useState('')
  const [editingTableId, setEditingTableId] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deletingTableId, setDeletingTableId] = useState(null)
  const [message, setMessage] = useState('')
  const [tenant, setTenant] = useState('')

  useEffect(() => {
    try {
      const account = JSON.parse(sessionStorage.getItem('account') || 'null')
      setTenant(account?.database || account?.database_name || '')
    } catch (error) {
      console.error('Could not read the signed-in account:', error)
      setMessage('Could not read the signed-in account. Please sign in again.')
    }
  }, [])

  useEffect(() => {
    async function loadTables() {
      try {
        const response = await fetch(`${API_URL}/get-tables`, {
          credentials: 'include',
        })
        const result = await response.json()
        if (!response.ok) {
          throw new Error(result.error || 'Could not load tables.')
        }
        setTables(result)
      } catch (error) {
        console.error('Error loading tables:', error)
        setMessage(error.message || 'Could not load tables.')
      } finally {
        setLoading(false)
      }
    }

    loadTables()
  }, [])

  function cancelEdit() {
    setEditingTableId(null)
    setTableName('')
  }

  function startEdit(table) {
    setEditingTableId(table._id)
    setTableName(table.table_name || '')
    setMessage('')
  }

  async function saveTable(event) {
    event.preventDefault()
    setSaving(true)
    setMessage('')

    const isEditing = editingTableId !== null
    try {
      const response = await fetch(
        isEditing
          ? `${API_URL}/edit-table/${encodeURIComponent(editingTableId)}`
          : `${API_URL}/create-table`,
        {
          method: isEditing ? 'PATCH' : 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ table_name: tableName.trim() }),
        },
      )
      const result = await response.json()
      if (!response.ok) {
        throw new Error(result.error || `Could not ${isEditing ? 'update' : 'create'} table.`)
      }

      if (isEditing) {
        setTables((currentTables) =>
          currentTables.map((table) => (table._id === result._id ? result : table)),
        )
      } else {
        setTables((currentTables) => [...currentTables, result])
      }
      cancelEdit()
      setMessage(isEditing ? 'Table name updated.' : 'Table created.')
    } catch (error) {
      console.error('Error saving table:', error)
      setMessage(error.message || 'Could not save table.')
    } finally {
      setSaving(false)
    }
  }

  async function deleteTable(table) {
    const displayName = table.table_name || 'this table'
    if (!window.confirm(`Delete "${displayName}"? This action cannot be undone.`)) {
      return
    }

    setDeletingTableId(table._id)
    setMessage('')
    try {
      const response = await fetch(
        `${API_URL}/delete-table/${encodeURIComponent(table._id)}`,
        {
          method: 'DELETE',
          credentials: 'include',
        },
      )
      const result = await response.json()
      if (!response.ok) {
        throw new Error(result.error || 'Could not delete table.')
      }

      setTables((currentTables) => currentTables.filter((item) => item._id !== table._id))
      if (editingTableId === table._id) {
        cancelEdit()
      }
      setMessage('Table deleted.')
    } catch (error) {
      console.error('Error deleting table:', error)
      setMessage(error.message || 'Could not delete table.')
    } finally {
      setDeletingTableId(null)
    }
  }

  return (
    <main>
      <h1>Tables</h1>
      <form onSubmit={saveTable}>
        <h2>{editingTableId ? 'Edit table name' : 'Add a table'}</h2>
        <label>
          Table name
          <input
            name="table_name"
            value={tableName}
            onChange={(event) => setTableName(event.target.value)}
            required
          />
        </label>
        <button type="submit" disabled={saving}>
          {saving ? 'Saving...' : editingTableId ? 'Update table name' : 'Create table'}
        </button>
        {editingTableId && (
          <button type="button" onClick={cancelEdit} disabled={saving}>
            Cancel edit
          </button>
        )}
      </form>

      {message && <p role="status">{message}</p>}
      {!tenant && !message && (
        <p role="alert">Restaurant information is unavailable. Please sign in again to generate QR codes.</p>
      )}
      {loading && <p>Loading tables...</p>}
      {!loading && !message && tables.length === 0 && <p>No tables found.</p>}

      <section aria-label="Tables">
        {tables.map((table) => (
          <article key={table._id}>
            <h2>{table.table_name || 'Unnamed table'}</h2>
            {tenant && (
              <div>
                <p>Scan to open this table's menu</p>
                <QRCodeSVG
                  value={getTableCustomerUrl(table._id, tenant)}
                  title={`QR code for ${table.table_name || 'table'}`}
                  size={180}
                />
                <p>
                  <a
                    href={getTableCustomerUrl(table._id, tenant)}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {getTableCustomerUrl(table._id, tenant)}
                  </a>
                </p>
              </div>
            )}
            <button
              type="button"
              onClick={() => startEdit(table)}
              disabled={saving || deletingTableId !== null}
            >
              Edit name
            </button>
            <button
              type="button"
              onClick={() => deleteTable(table)}
              disabled={saving || deletingTableId !== null}
            >
              {deletingTableId === table._id ? 'Deleting...' : 'Delete'}
            </button>
          </article>
        ))}
      </section>
    </main>
  )
}

export default Tables
