import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

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
      const response = await fetch('https://test-gcej.onrender.com/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        alert(data.message);
        navigate('/dashboard');
      } else {
        alert(`Error: ${data.message}`);
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