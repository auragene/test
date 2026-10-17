import { useEffect, useState } from 'react'
import { API_URL } from '../api'

const Settings = () => {
  const [settings, setSettings] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    async function loadSettings() {
      try {
        const response = await fetch(`${API_URL}/get-settings`, {
          credentials: 'include',
        })
        const result = await response.json()
        if (!response.ok) {
          throw new Error(result.error || 'Could not load settings.')
        }
        setSettings(result)
      } catch (loadError) {
        console.error('Error loading settings:', loadError)
        setError(loadError.message || 'Could not load settings.')
      } finally {
        setLoading(false)
      }
    }

    loadSettings()
  }, [])

  function formatValue(value) {
    if (typeof value === 'boolean') {
      return value ? 'Yes' : 'No'
    }
    if (value === null || value === undefined || value === '') {
      return 'Not set'
    }
    if (typeof value === 'object') {
      return JSON.stringify(value)
    }
    return String(value)
  }

  return (
    <main>
      <h1>Settings</h1>
      {loading && <p>Loading settings...</p>}
      {error && <p role="alert">{error}</p>}
      {!loading && !error && settings && Object.keys(settings).length === 0 && (
        <p>No settings are configured.</p>
      )}
      {!loading && !error && settings && Object.keys(settings).length > 0 && (
        <dl>
          {Object.entries(settings).map(([key, value]) => (
            <div key={key}>
              <dt>{key.replaceAll('_', ' ')}</dt>
              <dd>{formatValue(value)}</dd>
            </div>
          ))}
        </dl>
      )}
    </main>
  )
}

export default Settings
