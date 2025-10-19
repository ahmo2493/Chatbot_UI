// src/components/Login.jsx
import { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { FaEye, FaEyeSlash } from 'react-icons/fa';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? 'https://localhost:7237/api',
  withCredentials: true, // keep if your API sets auth cookies
});

const msgFromAxios = (e) =>
  e?.response?.data?.message ||
  (typeof e?.response?.data === 'string' ? e.response.data : '') ||
  e?.message ||
  'Request failed';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const res = await api.post('/Auth/login', { email, password });

      if (res.status === 200) {
        // Save identity for the Home header
        localStorage.setItem('userEmail', res.data?.email ?? email);

        // If you return a JWT, you can store it too:
        // if (res.data?.token) {
        //   localStorage.setItem('authToken', res.data.token);
        //   api.defaults.headers.common['Authorization'] = `Bearer ${res.data.token}`;
        // }

        navigate('/home', { replace: true });
      }
    } catch (error) {
      alert('Login failed: ' + msgFromAxios(error));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <div style={styles.card}>
          <h1 style={styles.header}>CHATBOT LOGIN</h1>
          <form onSubmit={handleLogin} style={styles.form}>
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={styles.input}
              autoComplete="username"
            />

            <div style={styles.passwordContainer}>
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                style={{ ...styles.input, marginBottom: 0, paddingRight: 44 }}
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={styles.eyeButton}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>

            <button type="submit" style={styles.button} disabled={loading}>
              {loading ? 'Logging in…' : 'LOGIN'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

const styles = {
  page: {
    backgroundColor: '#f0f2f5',
    minHeight: '100vh',
    width: '100vw',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    maxWidth: '400px',
    padding: '20px',
  },
  card: {
    background: '#ffffff',
    padding: '40px',
    borderRadius: '10px',
    boxShadow: '0 8px 20px rgba(0,0,0,0.1)',
    width: '100%',
    textAlign: 'center',
  },
  header: {
    marginBottom: '20px',
    fontSize: '24px',
    fontWeight: 'bold',
    color: '#333',
  },
  form: {
    position: 'relative',
  },
  input: {
    width: '100%',
    padding: '12px',
    marginBottom: '15px',
    borderRadius: '5px',
    border: '1px solid #ccc',
    boxSizing: 'border-box',
    outline: 'none',
    fontSize: '14px',
  },
  passwordContainer: {
    position: 'relative',
    marginBottom: '15px',
  },
  eyeButton: {
    position: 'absolute',
    top: '50%',
    right: '12px',
    transform: 'translateY(-50%)',
    background: 'transparent',
    border: 'none',
    cursor: 'pointer',
    color: '#888',
    padding: 4,
    display: 'grid',
    placeItems: 'center',
  },
  button: {
    width: '100%',
    padding: '12px',
    backgroundColor: '#007BFF',
    color: '#fff',
    fontSize: '16px',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
    transition: 'background-color 0.3s ease',
  },
};
