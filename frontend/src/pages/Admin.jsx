import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { API_URL } from '../api'

const EMPTY_STAFF_FORM = {
  name: '',
  phone: '',
  email: '',
  hotel_name: '',
  database_name: '',
  password: '',
  status: true,
}

const Admin = () => {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [admin, setAdmin] = useState(null)
  const [signingOut, setSigningOut] = useState(false)
  const [staff, setStaff] = useState([])
  const [staffLoading, setStaffLoading] = useState(false)
  const [staffError, setStaffError] = useState('')
  const [staffUpdatingId, setStaffUpdatingId] = useState(null)
  const [showCreateStaff, setShowCreateStaff] = useState(false)
  const [newStaff, setNewStaff] = useState(EMPTY_STAFF_FORM)
  const [creatingStaff, setCreatingStaff] = useState(false)
  const [createStaffError, setCreateStaffError] = useState('')

  useEffect(() => {
    if (!admin) return undefined

    const controller = new AbortController()
    async function loadStaff() {
      setStaffLoading(true)
      setStaffError('')

      try {
        const response = await fetch(`${API_URL}/admin/hotel-staff`, {
          credentials: 'include',
          signal: controller.signal,
        })
        const result = await response.json()
        if (!response.ok) throw new Error(result.error || 'Could not load hotel staff.')
        if (!Array.isArray(result.staff)) throw new Error('The staff list response was invalid.')
        setStaff(result.staff)
      } catch (loadError) {
        if (loadError.name === 'AbortError') return
        console.error('Could not load hotel staff:', loadError)
        setStaffError(loadError.message || 'Could not load hotel staff.')
      } finally {
        if (!controller.signal.aborted) setStaffLoading(false)
      }
    }

    loadStaff()
    return () => controller.abort()
  }, [admin])

  async function updateStaffAccess(member, status) {
    const previousStatus = member.status
    setStaffError('')
    setStaffUpdatingId(member.id)
    setStaff((currentStaff) => currentStaff.map((staffMember) => (
      staffMember.id === member.id ? { ...staffMember, status } : staffMember
    )))

    try {
      const response = await fetch(
        `${API_URL}/admin/hotel-staff/${encodeURIComponent(member.id)}/access`,
        {
          method: 'PATCH',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status }),
        },
      )
      const result = await response.json()
      if (!response.ok) throw new Error(result.error || 'Could not update staff access.')
      if (result.status !== status) throw new Error('The staff access update was not confirmed.')
    } catch (updateError) {
      console.error('Could not update staff access:', updateError)
      setStaff((currentStaff) => currentStaff.map((staffMember) => (
        staffMember.id === member.id
          ? { ...staffMember, status: previousStatus }
          : staffMember
      )))
      setStaffError(updateError.message || 'Could not update staff access.')
    } finally {
      setStaffUpdatingId(null)
    }
  }

  async function createStaff(event) {
    event.preventDefault()
    setCreatingStaff(true)
    setCreateStaffError('')

    try {
      const response = await fetch(`${API_URL}/admin/hotel-staff`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newStaff),
      })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error || 'Could not create hotel staff account.')
      if (!result.staff?.id) throw new Error('The new staff account response was invalid.')

      setStaff((currentStaff) => (
        [...currentStaff, result.staff].sort((first, second) => first.name.localeCompare(second.name))
      ))
      setNewStaff(EMPTY_STAFF_FORM)
      setShowCreateStaff(false)
    } catch (createError) {
      console.error('Could not create hotel staff account:', createError)
      setCreateStaffError(createError.message || 'Could not create hotel staff account.')
    } finally {
      setCreatingStaff(false)
    }
  }

  async function signIn(event) {
    event.preventDefault()
    setLoading(true)
    setError('')

    try {
      const response = await fetch(`${API_URL}/admin-login`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error || 'Sign-in failed.')
      window.alert('Login successful!')
      setAdmin(result.user)
      setPassword('')
    } catch (signInError) {
      console.error('Admin sign-in failed:', signInError)
      setError(signInError.message || 'Could not sign in. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  async function signOut() {
    setSigningOut(true)
    setError('')
    try {
      const response = await fetch(`${API_URL}/admin-logout`, {
        method: 'POST',
        credentials: 'include',
      })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error || 'Could not sign out.')
      setAdmin(null)
      setStaff([])
      setEmail('')
      navigate('/admin', { replace: true })
    } catch (signOutError) {
      console.error('Admin sign-out failed:', signOutError)
      setError(signOutError.message || 'Could not sign out.')
    } finally {
      setSigningOut(false)
    }
  }

  return (
    <main style={styles.page}>
      {admin ? (
        <section style={styles.console}>
          <header style={styles.consoleHeader}>
            <div>
              <p style={styles.eyebrow}>AURA GRAND SMART RESTAURANT</p>
              <h1 style={styles.title}>Admin console</h1>
              <p style={styles.description}>
                Welcome back, {admin.name || admin.email}. Manage your restaurant workspace.
              </p>
            </div>
            <button
              type="button"
              onClick={signOut}
              disabled={signingOut}
              style={styles.signOut}
            >
              {signingOut ? 'Signing out…' : 'Sign out'}
            </button>
          </header>
          {error && <p role="alert" style={styles.error}>{error}</p>}
          <section style={styles.staffSection} aria-labelledby="staff-heading">
            <div style={styles.sectionHeading}>
              <div>
                <p style={styles.eyebrow}>TEAM DIRECTORY</p>
                <h2 id="staff-heading" style={styles.sectionTitle}>Hotel staff</h2>
              </div>
              <div style={styles.staffActions}>
                {!staffLoading && !staffError && (
                  <span style={styles.staffCount}>{staff.length} {staff.length === 1 ? 'account' : 'accounts'}</span>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setCreateStaffError('')
                    setShowCreateStaff(true)
                  }}
                  style={styles.addStaffButton}
                >
                  <span aria-hidden="true">＋</span> Add hotel staff
                </button>
              </div>
            </div>
            {staffLoading ? (
              <p style={styles.staffMessage}>Loading hotel staff…</p>
            ) : staffError ? (
              <p role="alert" style={styles.error}>{staffError}</p>
            ) : staff.length === 0 ? (
              <p style={styles.staffMessage}>No hotel staff accounts are available.</p>
            ) : (
              <div style={styles.staffGrid}>
                {staff.map((member) => (
                  <article key={member.id} style={styles.staffCard}>
                    <span style={styles.staffAvatar} aria-hidden="true">
                      {(member.name || 'S').trim().charAt(0).toUpperCase()}
                    </span>
                    <span style={styles.staffDetails}>
                      <strong style={styles.staffName}>{member.name || 'Unnamed staff'}</strong>
                      <small style={styles.staffEmail}>{member.email || 'No email listed'}</small>
                      <small style={styles.staffDatabase}>{member.phone || 'No phone listed'}</small>
                      <small style={styles.staffDatabase}>
                        {member.hotel_name || 'Hotel'} · {member.database_name || 'No workspace assigned'}
                      </small>
                    </span>
                    <span style={styles.staffMeta}>
                      <span style={styles.staffRole}>{member.role || 'Staff'}</span>
                      <label style={styles.staffAccess}>
                        <input
                          type="checkbox"
                          checked={member.status}
                          disabled={staffUpdatingId !== null}
                          onChange={(event) => updateStaffAccess(member, event.target.checked)}
                          style={styles.staffCheckbox}
                        />
                        <span>
                          {staffUpdatingId === member.id
                            ? 'Saving…'
                            : 'Allow this staff account to log in'}
                        </span>
                      </label>
                    </span>
                  </article>
                ))}
              </div>
            )}
          </section>
          {showCreateStaff && (
            <div style={styles.modalBackdrop}>
              <section
                role="dialog"
                aria-modal="true"
                aria-labelledby="create-staff-title"
                style={styles.staffModal}
              >
                <button
                  type="button"
                  aria-label="Close"
                  disabled={creatingStaff}
                  onClick={() => setShowCreateStaff(false)}
                  style={styles.modalClose}
                >
                  ×
                </button>
                <h2 id="create-staff-title" style={styles.modalTitle}>Add hotel staff</h2>
                <p style={styles.modalDescription}>
                  Creates a separate database with the same empty collection and index structure as Irani Restaurant.
                </p>
                <form onSubmit={createStaff} style={styles.staffForm}>
                  <label style={styles.formField}>
                    <span>Staff name</span>
                    <input
                      autoComplete="name"
                      required
                      value={newStaff.name}
                      onChange={(event) => setNewStaff({ ...newStaff, name: event.target.value })}
                      style={styles.formFieldInput}
                    />
                  </label>
                  <label style={styles.formField}>
                    <span>Phone number</span>
                    <input
                      type="tel"
                      autoComplete="tel"
                      required
                      value={newStaff.phone}
                      onChange={(event) => setNewStaff({ ...newStaff, phone: event.target.value })}
                      style={styles.formFieldInput}
                    />
                  </label>
                  <label style={styles.formField}>
                    <span>Login email</span>
                    <input
                      type="email"
                      autoComplete="email"
                      required
                      value={newStaff.email}
                      onChange={(event) => setNewStaff({ ...newStaff, email: event.target.value })}
                      style={styles.formFieldInput}
                    />
                  </label>
                  <label style={styles.formField}>
                    <span>Hotel name</span>
                    <input
                      required
                      value={newStaff.hotel_name}
                      onChange={(event) => setNewStaff({ ...newStaff, hotel_name: event.target.value })}
                      style={styles.formFieldInput}
                    />
                  </label>
                  <label style={styles.formField}>
                    <span>Allotted database name</span>
                    <input
                      required
                      pattern="[a-z][a-z0-9_]{0,62}"
                      title="Use lowercase letters, numbers, and underscores; start with a letter."
                      value={newStaff.database_name}
                      onChange={(event) => setNewStaff({
                        ...newStaff,
                        database_name: event.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''),
                      })}
                      style={styles.formFieldInput}
                    />
                    <small>Use a unique name such as irani_restaurant.</small>
                  </label>
                  <label style={styles.formField}>
                    <span>Default password</span>
                    <input
                      type="password"
                      autoComplete="new-password"
                      minLength={8}
                      required
                      value={newStaff.password}
                      onChange={(event) => setNewStaff({ ...newStaff, password: event.target.value })}
                      style={styles.formFieldInput}
                    />
                  </label>
                  <label style={styles.createStatus}>
                    <input
                      type="checkbox"
                      checked={newStaff.status}
                      onChange={(event) => setNewStaff({ ...newStaff, status: event.target.checked })}
                    />
                    Allow this staff account to log in
                  </label>
                  {createStaffError && <p role="alert" style={styles.error}>{createStaffError}</p>}
                  <div style={styles.modalActions}>
                    <button
                      type="button"
                      disabled={creatingStaff}
                      onClick={() => setShowCreateStaff(false)}
                      style={styles.cancelButton}
                    >
                      Cancel
                    </button>
                    <button type="submit" disabled={creatingStaff} style={styles.createButton}>
                      {creatingStaff ? 'Creating…' : 'Create account'}
                    </button>
                  </div>
                </form>
              </section>
            </div>
          )}
        </section>
      ) : (
        <section style={styles.card}>
          <div style={styles.mark} aria-hidden="true">A</div>
          <p style={styles.eyebrow}>AURA GRAND SMART RESTAURANT</p>
          <>
            <h1 style={styles.title}>Admin sign in</h1>
            <p style={styles.description}>Sign in with your administrator email and password.</p>
            <form onSubmit={signIn} style={styles.form}>
              <label htmlFor="admin-email" style={styles.label}>Email address</label>
              <input
                id="admin-email"
                type="email"
                autoComplete="username"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="admin@example.com"
                style={styles.input}
              />
              <label htmlFor="admin-password" style={styles.label}>Password</label>
              <input
                id="admin-password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Enter your password"
                style={styles.input}
              />
              {error && <p role="alert" style={styles.error}>{error}</p>}
              <button type="submit" disabled={loading} style={styles.button}>
                {loading ? 'Signing in…' : 'Sign in'}
              </button>
            </form>
          </>
        </section>
      )}
    </main>
  )
}

const styles = {
  page: {
    display: 'grid',
    minHeight: '100vh',
    placeItems: 'center',
    padding: 24,
    background: '#f5f7f7',
    fontFamily: 'Inter, ui-sans-serif, system-ui, sans-serif',
  },
  card: {
    width: 'min(100%, 420px)',
    padding: '38px 34px',
    border: '1px solid #e5ebe8',
    borderRadius: 18,
    background: '#fff',
    boxShadow: '0 18px 50px rgb(35 52 57 / 8%)',
  },
  console: {
    width: '100%',
    maxWidth: 1020,
    margin: '0 auto',
    padding: 26,
    border: '1px solid #e5ebe8',
    borderRadius: 18,
    background: '#fff',
    boxShadow: '0 14px 38px rgb(35 52 57 / 5%)',
  },
  consoleHeader: {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 18,
    paddingBottom: 22,
    borderBottom: '1px solid #e8edeb',
  },
  signOut: {
    minHeight: 38,
    padding: '0 14px',
    border: '1px solid #e2e9e6',
    borderRadius: 9,
    background: '#fff',
    color: '#53635b',
    cursor: 'pointer',
    fontSize: 11,
    fontWeight: 650,
  },
  sectionHeading: {
    display: 'flex',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: 15,
    margin: '24px 0 14px',
  },
  staffSection: {
    marginTop: 24,
    padding: 18,
    border: '1px solid #e6ece9',
    borderRadius: 13,
    background: '#fbfcfb',
  },
  staffCount: {
    color: '#78868a',
    fontSize: 11,
  },
  staffActions: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
  },
  addStaffButton: {
    display: 'inline-flex',
    minHeight: 36,
    alignItems: 'center',
    gap: 6,
    padding: '0 12px',
    border: 0,
    borderRadius: 9,
    background: 'var(--brand-primary, #3c6047)',
    color: '#fff',
    cursor: 'pointer',
    fontSize: 11,
    fontWeight: 700,
    whiteSpace: 'nowrap',
  },
  modalBackdrop: {
    position: 'fixed',
    inset: 0,
    zIndex: 20,
    display: 'grid',
    overflowY: 'auto',
    placeItems: 'center',
    padding: 18,
    background: 'rgb(23 34 29 / 48%)',
    backdropFilter: 'blur(4px)',
  },
  staffModal: {
    position: 'relative',
    width: 'min(100%, 640px)',
    maxHeight: 'min(90vh, 760px)',
    overflowY: 'auto',
    padding: '25px 26px 22px',
    border: '1px solid #e5ebe8',
    borderRadius: 15,
    background: '#fff',
    boxShadow: '0 24px 70px rgb(0 0 0 / 18%)',
  },
  modalClose: {
    position: 'absolute',
    top: 11,
    right: 12,
    width: 32,
    height: 32,
    border: 0,
    background: 'transparent',
    color: '#78868a',
    cursor: 'pointer',
    fontSize: 23,
  },
  modalTitle: {
    margin: 0,
    color: '#263238',
    fontFamily: 'Georgia, serif',
    fontSize: 22,
    fontWeight: 500,
  },
  modalDescription: {
    margin: '6px 28px 20px 0',
    color: '#78868a',
    fontSize: 11,
    lineHeight: 1.5,
  },
  staffForm: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
    gap: '12px 14px',
  },
  formField: {
    display: 'grid',
    alignContent: 'start',
    gap: 6,
    color: '#53635b',
    fontSize: 10,
    fontWeight: 650,
  },
  formFieldInput: {
    height: 41,
    minWidth: 0,
    padding: '0 10px',
    border: '1px solid #dfe6e6',
    borderRadius: 8,
    outlineColor: 'var(--brand-primary, #3c6047)',
    background: '#fff',
    color: '#263238',
    fontSize: 12,
    fontWeight: 400,
  },
  createStatus: {
    display: 'inline-flex',
    gridColumn: '1 / -1',
    alignItems: 'center',
    gap: 7,
    color: '#53635b',
    cursor: 'pointer',
    fontSize: 11,
  },
  modalActions: {
    display: 'flex',
    gridColumn: '1 / -1',
    justifyContent: 'flex-end',
    gap: 9,
    marginTop: 5,
  },
  cancelButton: {
    minHeight: 38,
    padding: '0 13px',
    border: '1px solid #e2e9e6',
    borderRadius: 8,
    background: '#fff',
    color: '#53635b',
    cursor: 'pointer',
    fontSize: 11,
    fontWeight: 650,
  },
  createButton: {
    minHeight: 38,
    padding: '0 15px',
    border: 0,
    borderRadius: 8,
    background: 'var(--brand-primary, #3c6047)',
    color: '#fff',
    cursor: 'pointer',
    fontSize: 11,
    fontWeight: 700,
  },
  staffMessage: {
    margin: '12px 0 2px',
    color: '#78868a',
    fontSize: 12,
  },
  staffGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 300px), 1fr))',
    gap: 10,
  },
  staffCard: {
    display: 'flex',
    minWidth: 0,
    alignItems: 'center',
    gap: 11,
    padding: 12,
    border: '1px solid #e6ece9',
    borderRadius: 11,
    background: '#fff',
  },
  staffAvatar: {
    display: 'grid',
    width: 36,
    height: 36,
    flex: '0 0 auto',
    placeItems: 'center',
    borderRadius: 11,
    background: 'color-mix(in srgb, var(--brand-primary, #3c6047) 10%, white)',
    color: 'var(--brand-primary, #3c6047)',
    fontSize: 14,
    fontWeight: 700,
  },
  staffDetails: {
    display: 'grid',
    minWidth: 0,
    gap: 3,
  },
  staffName: {
    overflow: 'hidden',
    color: '#263238',
    fontSize: 12,
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  staffEmail: {
    overflow: 'hidden',
    color: '#78868a',
    fontSize: 10,
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  staffDatabase: {
    overflow: 'hidden',
    color: '#78868a',
    fontSize: 9,
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  staffRole: {
    alignSelf: 'flex-end',
    padding: '5px 8px',
    borderRadius: 20,
    background: 'color-mix(in srgb, var(--brand-secondary, #697b57) 12%, white)',
    color: 'var(--brand-secondary, #697b57)',
    fontSize: 9,
    fontWeight: 650,
  },
  staffMeta: {
    display: 'grid',
    flex: '0 0 auto',
    justifyItems: 'end',
    gap: 9,
    marginLeft: 'auto',
  },
  staffAccess: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    color: '#53635b',
    cursor: 'pointer',
    fontSize: 9,
    whiteSpace: 'nowrap',
  },
  staffCheckbox: {
    width: 15,
    height: 15,
    margin: 0,
    accentColor: 'var(--brand-primary, #3c6047)',
    cursor: 'pointer',
  },
  sectionTitle: {
    margin: '5px 0 0',
    color: '#263238',
    fontFamily: 'Georgia, serif',
    fontSize: 21,
    fontWeight: 500,
  },
  signedIn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 7,
    color: '#78868a',
    fontSize: 10,
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 240px), 1fr))',
    gap: 12,
  },
  linkCard: {
    display: 'flex',
    minHeight: 92,
    alignItems: 'center',
    gap: 12,
    padding: 14,
    border: '1px solid #e6ece9',
    borderRadius: 12,
    background: '#fff',
    color: '#263238',
    textDecoration: 'none',
  },
  linkIcon: {
    display: 'grid',
    width: 38,
    height: 38,
    flex: '0 0 auto',
    placeItems: 'center',
    borderRadius: 11,
    background: 'color-mix(in srgb, var(--brand-primary, #3c6047) 10%, white)',
    color: 'var(--brand-primary, #3c6047)',
    fontSize: 17,
  },
  linkTitle: {
    display: 'block',
    fontSize: 12,
  },
  linkText: {
    display: 'block',
    marginTop: 5,
    color: '#78868a',
    fontSize: 10,
    lineHeight: 1.5,
  },
  arrow: {
    marginLeft: 'auto',
    color: 'var(--brand-secondary, #697b57)',
    fontSize: 16,
  },
  mark: {
    display: 'grid',
    width: 44,
    height: 44,
    placeItems: 'center',
    borderRadius: 14,
    background: 'var(--brand-primary, #3c6047)',
    color: '#fff',
    fontFamily: 'Georgia, serif',
    fontSize: 22,
  },
  eyebrow: {
    margin: '23px 0 9px',
    color: 'var(--brand-primary, #3c6047)',
    fontSize: 9,
    fontWeight: 750,
    letterSpacing: '0.15em',
  },
  title: {
    margin: '0 0 8px',
    color: '#263238',
    fontFamily: 'Georgia, serif',
    fontSize: 30,
    fontWeight: 500,
  },
  description: {
    margin: '0 0 24px',
    color: '#78868a',
    fontSize: 13,
    lineHeight: 1.6,
  },
  form: {
    display: 'grid',
    gap: 10,
  },
  label: {
    marginTop: 5,
    color: '#39474b',
    fontSize: 11,
    fontWeight: 650,
  },
  input: {
    width: '100%',
    height: 44,
    padding: '0 12px',
    border: '1px solid #dfe6e6',
    borderRadius: 9,
    outlineColor: 'var(--brand-primary, #3c6047)',
    background: '#fbfcfc',
    color: '#263238',
    fontSize: 13,
  },
  error: {
    margin: '4px 0',
    color: '#a13c34',
    fontSize: 12,
  },
  button: {
    height: 45,
    marginTop: 8,
    border: 0,
    borderRadius: 9,
    background: 'var(--brand-primary, #3c6047)',
    color: '#fff',
    cursor: 'pointer',
    fontSize: 13,
    fontWeight: 700,
  },
}

export default Admin
