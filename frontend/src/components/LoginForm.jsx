import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../axios';
import './LoginForm.css';

function LoginForm() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const response = await api.post('/api/auth/login', { username, password });
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('role', response.data.role);
      const userRole = JSON.parse(atob(response.data.token.split('.')[1])).role;
      console.log(userRole);
      if (userRole === 'Admin') {
        navigate('/admin');
      } else {
        navigate('/user');
      }
    } catch {
      setMessage('Invalid credentials');
    }
  };

  return (
    <div className="login-page">
      <section className="login-hero" aria-label="Healthcare access portal">
        <div className="login-brand">
          <span className="login-brand-mark">HC</span>
          <span>CareSlot Health</span>
        </div>
        <div className="login-hero-copy">
          <p className="login-kicker">Secure clinical scheduling</p>
          <h1>Coordinate care with a calmer, clearer dashboard.</h1>
          <p>
            Manage availability and bookings through a focused healthcare portal
            designed for fast daily work.
          </p>
        </div>
        <div className="login-metrics" aria-hidden="true">
          <div>
            <strong>24/7</strong>
            <span>Care access</span>
          </div>
          <div>
            <strong>HIPAA</strong>
            <span>Ready workflow</span>
          </div>
        </div>
      </section>

      <section className="login-panel" aria-label="Login form">
        <p className="login-eyebrow">Welcome back</p>
        <h2 className="login-title">Login to your account</h2>
        <form className="login-form" onSubmit={handleLogin}>
          <label className="login-field">
            <span>Username</span>
            <input
              type="text"
              placeholder="Enter your username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="login-input"
            />
          </label>
          <label className="login-field">
            <span>Password</span>
            <input
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="login-input"
            />
          </label>
          <button type="submit" className="login-button">Login</button>
        </form>
        {message && <p className="login-message">{message}</p>}
      </section>
    </div>
  );
}

export default LoginForm;
