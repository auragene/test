import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { API_URL } from '../api'

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
        sessionStorage.setItem('account', JSON.stringify(data.account));
        alert(data.message || 'Login successful');
        navigate('/dashboard');
      } else {
        alert(data.error || data.message || 'Login failed');
      }
    } catch (error) {
      console.error('Error logging in:', error);
      alert('Server error, please try again');
    }
  };

  return (
    <div>
      <h1>Login</h1>
      <form onSubmit={handleSubmit}>
        <div>
          <label htmlFor="email">Email Address:</label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
          />
        </div>
        <div>
          <label htmlFor="password">Password:</label>
          <input
            type="password"
            id="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            required
          />
        </div>
        <button type="submit">Login</button>
      </form>
    </div>
  )
}

export default Login

//scrypt:32768:8:1$Yu8rANaUC5SoVsjQ$a3abeef28ad48e5e5382d046e7511044376f79f98880df20be25854d1b0ca399b611d9df64235f59cfaa09d320be66f23b8252fe4efa897bc8096dd03716a262