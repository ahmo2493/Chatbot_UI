// src/components/Home.jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';


const Home = () => {
  const [hover, setHover] = useState(false);
  const navigate = useNavigate();

  return (
    <div style={styles.container}>
      <h1 style={styles.header}>Welcome, Ahmo!</h1>
      <button
        style={{ ...styles.button, backgroundColor: hover ? '#0056b3' : '#007BFF' }}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        onClick={() => {
          const newProjectId = crypto.randomUUID(); // ✅ generates a new GUID
          navigate(`/edit-widget/${newProjectId}`);
        }}
      >
        Create Chatbot +
      </button>
    </div>
  );
};

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100vh',
    backgroundColor: '#f7faff',
    fontFamily: 'Segoe UI, Tahoma, Geneva, Verdana, sans-serif',
  },
  header: {
    marginBottom: '30px',
    fontSize: '26px',
    fontWeight: 'bold',
    color: '#333',
  },
  button: {
    padding: '15px 30px',
    fontSize: '16px',
    color: '#ffffff',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
    transition: 'background-color 0.3s ease, box-shadow 0.3s ease',
    boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
  },
};

export default Home;