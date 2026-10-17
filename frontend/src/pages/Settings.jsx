import { useEffect, useState } from 'react'
import { API_URL } from '../api'
import { storeDashboardTheme, themeFromSettings } from '../dashboardTheme'

function displayLabel(key) {
  return key.replaceAll('_', ' ').replace(/\b\w/g, (character) => character.toUpperCase())
}

function colorSettingKey(settings, names, fallback) {
  return names.find((name) => Object.hasOwn(settings, name)) || fallback
}

function pickerValue(value) {
  if (typeof value !== 'string') return '#000000'
  if (/^#[\da-f]{6}$/i.test(value)) return value
  const shortHex = value.match(/^#([\da-f])([\da-f])([\da-f])$/i)
  return shortHex ? `#${shortHex[1]}${shortHex[1]}${shortHex[2]}${shortHex[2]}${shortHex[3]}${shortHex[3]}` : '#000000'
}

const Settings = () => {
  const [settings, setSettings] = useState({})
  const [draft, setDraft] = useState({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [savingTheme, setSavingTheme] = useState(false)
  const [changingPassword, setChangingPassword] = useState(false)
  const [passwords, setPasswords] = useState({ current_password: '', new_password: '' })
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const primaryColorKey = colorSettingKey(
    settings,
    ['primary_color', 'primaryColor', 'primary'],
    'primary_color',
  )
  const secondaryColorKey = colorSettingKey(
    settings,
    ['secondary_color', 'secondaryColor', 'secondary'],
    'secondary_color',
  )

  useEffect(() => {
    let active = true

    async function loadSettings() {
      try {
        const response = await fetch(`${API_URL}/get-settings`, {
          credentials: 'include',
        })
        const result = await response.json()
        if (!response.ok) {
          throw new Error(result.error || 'Could not load settings.')
        }
        if (active) {
          setSettings(result)
          setDraft(Object.fromEntries(
            Object.entries(result).map(([key, value]) => [
              key,
              typeof value === 'object' && value !== null
                ? JSON.stringify(value, null, 2)
                : String(value ?? ''),
            ]),
          ))
        }
      } catch (loadError) {
        console.error('Error loading settings:', loadError)
        if (active) setError(loadError.message || 'Could not load settings.')
      } finally {
        if (active) setLoading(false)
      }
    }

    loadSettings()
    return () => {
      active = false
    }
  }, [])

  async function saveSettings(event) {
    event.preventDefault()
    setSaving(true)
    setError('')
    setMessage('')

    try {
      const updates = {}
      for (const [key, value] of Object.entries(draft)) {
        const original = settings[key]
        if (typeof original === 'boolean') {
          updates[key] = value === 'true'
        } else if (typeof original === 'number') {
          updates[key] = Number(value)
          if (!Number.isFinite(updates[key])) {
            throw new Error(`${displayLabel(key)} must be a valid number.`)
          }
        } else if (original !== null && typeof original === 'object') {
          try {
            updates[key] = JSON.parse(value)
          } catch {
            throw new Error(`${displayLabel(key)} must contain valid JSON.`)
          }
        } else {
          updates[key] = value
        }
      }

      const response = await fetch(`${API_URL}/update-settings`, {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      })
      const result = await response.json()
      if (!response.ok) {
        throw new Error(result.error || 'Could not save settings.')
      }

      try {
        storeDashboardTheme(themeFromSettings(result))
      } catch (themeError) {
        sessionStorage.removeItem('dashboardTheme')
        setError(`Settings saved, but the dashboard theme is invalid: ${themeError.message}`)
      }
      setSettings(result)
      setDraft(Object.fromEntries(
        Object.entries(result).map(([key, value]) => [
          key,
          typeof value === 'object' && value !== null
            ? JSON.stringify(value, null, 2)
            : String(value ?? ''),
        ]),
      ))
      setMessage('Settings saved.')
    } catch (saveError) {
      console.error('Error saving settings:', saveError)
      setError(saveError.message || 'Could not save settings.')
    } finally {
      setSaving(false)
    }
  }

  async function saveTheme(event) {
    event.preventDefault()
    setSavingTheme(true)
    setError('')
    setMessage('')

    try {
      const updates = {
        [primaryColorKey]: draft[primaryColorKey] || '',
        [secondaryColorKey]: draft[secondaryColorKey] || '',
      }
      const response = await fetch(`${API_URL}/update-settings`, {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      })
      const result = await response.json()
      if (!response.ok) {
        throw new Error(result.error || 'Could not save the dashboard colors.')
      }

      const theme = themeFromSettings(result)
      storeDashboardTheme(theme)
      setSettings(result)
      setDraft((current) => ({
        ...current,
        [primaryColorKey]: String(result[primaryColorKey] || ''),
        [secondaryColorKey]: String(result[secondaryColorKey] || ''),
      }))
      setMessage('Dashboard colors saved and applied.')
    } catch (themeError) {
      console.error('Error saving dashboard colors:', themeError)
      setError(themeError.message || 'Could not save dashboard colors.')
    } finally {
      setSavingTheme(false)
    }
  }

  async function changePassword(event) {
    event.preventDefault()
    setChangingPassword(true)
    setError('')
    setMessage('')

    try {
      const response = await fetch(`${API_URL}/change-password`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(passwords),
      })
      const result = await response.json()
      if (!response.ok) {
        throw new Error(result.error || 'Could not change password.')
      }

      setPasswords({ current_password: '', new_password: '' })
      setMessage(result.message || 'Password changed successfully.')
    } catch (passwordError) {
      console.error('Error changing password:', passwordError)
      setError(passwordError.message || 'Could not change password.')
    } finally {
      setChangingPassword(false)
    }
  }

  return (
    <main>
      <h1>Settings</h1>
      {error && <p role="alert">{error}</p>}
      {message && <p role="status">{message}</p>}

      <section aria-labelledby="hotel-settings-heading">
        <h2 id="hotel-settings-heading">Hotel settings</h2>
        {loading && <p>Loading settings...</p>}
        {!loading && Object.keys(draft).length === 0 && (
          <p>No hotel settings are configured yet.</p>
        )}
        {!loading && (
          <div className="settings-theme-panel">
            <div className="settings-theme-panel__heading">
              <div>
                <span>PERSONALIZE YOUR WORKSPACE</span>
                <h3>Dashboard colors</h3>
                <p>Choose the two brand colors used across your staff workspace.</p>
              </div>
              <div
                className="settings-theme-preview"
                style={{
                  '--preview-primary': pickerValue(draft[primaryColorKey]),
                  '--preview-secondary': pickerValue(draft[secondaryColorKey]),
                }}
                aria-hidden="true"
              >
                <i /><i /><i />
              </div>
            </div>
            <form className="settings-theme-form" onSubmit={saveTheme}>
              <label>
                Primary color
                <span className="settings-theme-input">
                  <input
                    type="color"
                    value={pickerValue(draft[primaryColorKey])}
                    onChange={(event) =>
                      setDraft((current) => ({ ...current, [primaryColorKey]: event.target.value }))
                    }
                    aria-label="Choose primary dashboard color"
                  />
                  <input
                    type="text"
                    value={draft[primaryColorKey] || ''}
                    onChange={(event) =>
                      setDraft((current) => ({ ...current, [primaryColorKey]: event.target.value }))
                    }
                    aria-label="Primary color value"
                    placeholder="#d4fe70"
                    required
                  />
                </span>
              </label>
              <label>
                Secondary color
                <span className="settings-theme-input">
                  <input
                    type="color"
                    value={pickerValue(draft[secondaryColorKey])}
                    onChange={(event) =>
                      setDraft((current) => ({ ...current, [secondaryColorKey]: event.target.value }))
                    }
                    aria-label="Choose secondary dashboard color"
                  />
                  <input
                    type="text"
                    value={draft[secondaryColorKey] || ''}
                    onChange={(event) =>
                      setDraft((current) => ({ ...current, [secondaryColorKey]: event.target.value }))
                    }
                    aria-label="Secondary color value"
                    placeholder="#3c6047"
                    required
                  />
                </span>
              </label>
              <button type="submit" disabled={savingTheme}>
                {savingTheme ? 'Applying colors...' : 'Save and apply colors'}
              </button>
            </form>
          </div>
        )}
        {!loading && Object.keys(draft).length > 0 && (
          <form onSubmit={saveSettings}>
            {Object.entries(draft).map(([key, value]) => {
              const original = settings[key]
              const label = displayLabel(key)

              if (typeof original === 'boolean') {
                return (
                  <label key={key}>
                    <input
                      type="checkbox"
                      checked={value === 'true'}
                      onChange={(event) =>
                        setDraft((current) => ({
                          ...current,
                          [key]: String(event.target.checked),
                        }))
                      }
                    />
                    {label}
                  </label>
                )
              }

              return (
                <label key={key}>
                  {label}
                  {original !== null && typeof original === 'object' ? (
                    <textarea
                      value={value}
                      onChange={(event) =>
                        setDraft((current) => ({ ...current, [key]: event.target.value }))
                      }
                      rows={4}
                    />
                  ) : (
                    <input
                      type={typeof original === 'number' ? 'number' : 'text'}
                      step={typeof original === 'number' ? 'any' : undefined}
                      value={value}
                      onChange={(event) =>
                        setDraft((current) => ({ ...current, [key]: event.target.value }))
                      }
                    />
                  )}
                </label>
              )
            })}
            <button type="submit" disabled={saving}>
              {saving ? 'Saving...' : 'Save settings'}
            </button>
          </form>
        )}
      </section>

      <section aria-labelledby="password-heading">
        <h2 id="password-heading">Change staff password</h2>
        <form onSubmit={changePassword}>
          <label>
            Current password
            <input
              type="password"
              autoComplete="current-password"
              value={passwords.current_password}
              onChange={(event) =>
                setPasswords((current) => ({ ...current, current_password: event.target.value }))
              }
              required
            />
          </label>
          <label>
            New password
            <input
              type="password"
              autoComplete="new-password"
              minLength={8}
              value={passwords.new_password}
              onChange={(event) =>
                setPasswords((current) => ({ ...current, new_password: event.target.value }))
              }
              required
            />
          </label>
          <button type="submit" disabled={changingPassword}>
            {changingPassword ? 'Updating...' : 'Change password'}
          </button>
        </form>
      </section>
    </main>
  )
}

export default Settings
