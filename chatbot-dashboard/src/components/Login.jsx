// src/components/Login.jsx
import { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { FaEye, FaEyeSlash } from 'react-icons/fa';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post('https://localhost:7237/api/Auth/login', {
        email,
        password,
      });

      if (response.status === 200) {
        navigate('/home');
      }
    } catch (error) {
      alert('Login failed: ' + error.response.data);
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
            />
            <div style={styles.passwordContainer}>
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                style={{ ...styles.input, marginBottom: 0 }}
              />
              <span onClick={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </span>
            </div>
            <button type="submit" style={styles.button}>
              LOGIN
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

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
  eyeIcon: {
    position: 'absolute',
    top: '50%',
    right: '15px',
    transform: 'translateY(-50%)',
    cursor: 'pointer',
    color: '#888',
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

export default Login;

