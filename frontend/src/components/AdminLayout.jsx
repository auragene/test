import { useState } from 'react'
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { API_URL } from '../api'
import { clearDashboardTheme } from '../dashboardTheme'
import '../App.css'

const NAV_ITEMS = [
  { to: '/dashboard', label: 'Overview', icon: '▦' },
  { to: '/orders', label: 'Orders', icon: '▤' },
  { to: '/products', label: 'Menu & products', icon: '◈' },
  { to: '/tables', label: 'Tables & QR', icon: '▧' },
  { to: '/settings', label: 'Settings', icon: '⚙' },
]
const PAGE_TITLES = {
  '/dashboard': 'Overview',
  '/orders': 'Orders',
  '/products': 'Menu & products',
  '/tables': 'Tables & QR codes',
  '/settings': 'Settings',
}

function getAccountName() {
  try {
    const account = JSON.parse(sessionStorage.getItem('account') || '{}')
    return account.name || account.email || 'Restaurant team'
  } catch (error) {
    console.error('Could not read the signed-in account:', error)
    return 'Restaurant team'
  }
}

const AdminLayout = ({ children }) => {
  const location = useLocation()
  const navigate = useNavigate()
  const [error, setError] = useState('')
  const accountName = getAccountName()

  async function logout() {
    try {
      const response = await fetch(`${API_URL}/logout`, {
        method: 'POST',
        credentials: 'include',
      })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error || 'Could not log out.')
      sessionStorage.removeItem('account')
      clearDashboardTheme()
      navigate('/login', { replace: true })
    } catch (logoutError) {
      console.error('Error logging out:', logoutError)
      setError(logoutError.message || 'Could not log out.')
    }
  }

  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <Link className="admin-brand" to="/dashboard">
          <span className="admin-brand__mark">R</span>
          <span>
            <strong>Aura Grand Smart Restaurant</strong>
            <small>STAFF WORKSPACE</small>
          </span>
        </Link>
        <p className="admin-sidebar__caption">WORKSPACE</p>
        <nav className="admin-nav" aria-label="Main navigation">
          {NAV_ITEMS.map((item) => (
            <NavLink
              className={({ isActive }) => `admin-nav__link${isActive ? ' is-active' : ''}`}
              key={item.to}
              to={item.to}
            >
              <span aria-hidden="true">{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="admin-sidebar__footer">
          <span className="admin-avatar">{accountName.charAt(0).toUpperCase()}</span>
          <span className="admin-sidebar__identity">
            <strong>{accountName}</strong>
            <small>Signed-in staff</small>
          </span>
          <button className="admin-logout" type="button" onClick={logout} aria-label="Log out">
            ↪
          </button>
        </div>
      </aside>
      <div className="admin-layout__main">
        <header className="admin-header">
          <div>
            <span className="admin-header__eyebrow">RESTAURANT WORKSPACE</span>
            <h1>{PAGE_TITLES[location.pathname] || 'Workspace'}</h1>
          </div>
          <span className="admin-header__online"><i /> Workspace active</span>
          <button
            className="admin-header__logout"
            type="button"
            onClick={logout}
            aria-label="Log out"
          >
            ↪
          </button>
        </header>
        <div className="admin-page">
          {error && <p className="admin-layout__error" role="alert">{error}</p>}
          {children || <Outlet />}
        </div>
      </div>
    </div>
  )
}

export default AdminLayout
