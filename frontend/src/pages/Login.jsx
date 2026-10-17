import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { API_URL } from '../api'
import { clearDashboardTheme, storeDashboardTheme, themeFromSettings } from '../dashboardTheme'

const Login = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const handleChange = (event) => {
    const { name, value } = event.target
    setFormData((currentFormData) => ({
      ...currentFormData,
      [name]: value,
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.email.trim() || !formData.password) {
      alert('Please fill all the fields');
      return;
    }

    try {
      const response = await fetch(`${API_URL}/login`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        const settingsResponse = await fetch(`${API_URL}/get-settings`, {
          credentials: 'include',
        })
        const settings = await settingsResponse.json()
        if (!settingsResponse.ok) {
          throw new Error(settings.error || 'Could not load hotel settings.')
        }
        const theme = themeFromSettings(settings)
        sessionStorage.setItem('account', JSON.stringify(data.user));
        storeDashboardTheme(theme)
        alert(data.message || 'Login successful');
        navigate('/dashboard');
      } else {
        alert(data.error || data.message || 'Login failed');
      }
    } catch (error) {
      sessionStorage.removeItem('account')
      clearDashboardTheme()
      console.error('Error logging in:', error);
      alert(error.message || 'Server error, please try again');
    }
  };

  return (
    <div className="login-page">
      <section className="login-story" aria-label="Restaurant workspace">
        <div className="login-story__brand">
          <span>R</span>
          <strong>Aura Grand Smart Restaurant</strong>
        </div>
        <div className="login-story__content">
          <span className="login-story__eyebrow">MADE FOR HOSPITALITY</span>
          <h1>Run your restaurant with clarity.</h1>
          <p>Orders, menu, tables and your daily operations — thoughtfully brought together in one workspace.</p>
        </div>
        <div className="login-story__foot">
          <span>01</span>
          <span>Everything in its place</span>
          <span>●</span>
        </div>
        <div className="login-story__decoration" aria-hidden="true">R</div>
      </section>
      <main className="login-panel">
        <div className="login-card">
          <span className="login-card__eyebrow">STAFF PORTAL</span>
          <h2>Welcome back</h2>
          <p className="login-card__intro">Sign in to continue to your restaurant workspace.</p>
          <form onSubmit={handleSubmit}>
            <label htmlFor="email">Email address</label>
            <input
              type="email"
              id="email"
              name="email"
              autoComplete="username"
              placeholder="you@restaurant.com"
              value={formData.email}
              onChange={handleChange}
              required
            />
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              name="password"
              autoComplete="current-password"
              placeholder="Enter your password"
              value={formData.password}
              onChange={handleChange}
              required
            />
            <button type="submit">Sign in <span aria-hidden="true">→</span></button>
          </form>
          <p className="login-card__security"><span aria-hidden="true">◈</span> Secure access for restaurant staff</p>
        </div>
      </main>
    </div>
  )
}

export default Login

//scrypt:32768:8:1$Yu8rANaUC5SoVsjQ$a3abeef28ad48e5e5382d046e7511044376f79f98880df20be25854d1b0ca399b611d9df64235f59cfaa09d320be66f23b8252fe4efa897bc8096dd03716a262