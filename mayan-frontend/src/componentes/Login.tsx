// components/Login.tsx
import { useState } from 'react';
import axios from 'axios';

interface LoginProps {
  onLoginSuccess: () => void;
}

export const Login: React.FC<LoginProps> = ({ onLoginSuccess }) => {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

const handleLogin = async (e: React.FormEvent) => {
  e.preventDefault();
  setLoading(true);
  setError('');

  try {
    // CAMBIA ESTA LÍNEA - Usa ruta relativa para el proxy
    const response = await axios.post(
      '/api/v4/auth/token/login/',  // ← SIN http://localhost:80
      { username, password },
      { 
        timeout: 10000,
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
    
    if (response.data.auth_token) {
      localStorage.setItem('mayan_token', response.data.auth_token);
      console.log('✅ Token guardado:', response.data.auth_token.substring(0, 20) + '...');
      onLoginSuccess();
    } else {
      setError('No se recibió token del servidor');
    }
  } catch (error: any) {
    console.error('Login error completo:', error);
    
    // DEBUG: Muestra más información
    console.log('URL intentada:', error.config?.url);
    console.log('Base URL:', error.config?.baseURL);
    
    if (error.code === 'ECONNABORTED') {
      setError('Timeout: El servidor no respondió en 10 segundos');
    } else if (error.message?.includes('Network Error')) {
      setError('Error de red. Verifica que el proxy de Vite esté configurado en vite.config.ts');
    } else if (error.response?.status === 400) {
      setError('Usuario o contraseña incorrectos');
    } else if (error.response?.data) {
      setError(`Error del servidor: ${JSON.stringify(error.response.data)}`);
    } else {
      setError(`Error: ${error.message}`);
    }
  } finally {
    setLoading(false);
  }
};

  return (
    <div style={{
      maxWidth: '400px',
      margin: '50px auto',
      padding: '30px',
      border: '1px solid #ddd',
      borderRadius: '10px',
      backgroundColor: '#fff'
    }}>
      <h2 style={{ textAlign: 'center', marginBottom: '20px' }}>🔐 Login Mayan EDMS</h2>
      
      <form onSubmit={handleLogin}>
        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
            Usuario:
          </label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            style={{
              width: '100%',
              padding: '10px',
              border: '1px solid #ccc',
              borderRadius: '5px'
            }}
            required
          />
        </div>
        
        <div style={{ marginBottom: '20px' }}>
          <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
            Contraseña:
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{
              width: '100%',
              padding: '10px',
              border: '1px solid #ccc',
              borderRadius: '5px'
            }}
            required
          />
        </div>
        
        {error && (
          <div style={{
            padding: '10px',
            backgroundColor: '#fee',
            border: '1px solid #f99',
            borderRadius: '5px',
            marginBottom: '15px',
            color: '#c00'
          }}>
            {error}
          </div>
        )}
        
        <button
          type="submit"
          disabled={loading}
          style={{
            width: '100%',
            padding: '12px',
            backgroundColor: loading ? '#ccc' : '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            fontSize: '16px',
            cursor: loading ? 'not-allowed' : 'pointer'
          }}
        >
          {loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
        </button>
      </form>
      
      <div style={{ marginTop: '20px', padding: '15px', backgroundColor: '#f5f5f5', borderRadius: '5px' }}>
        <p style={{ margin: '0 0 10px 0', fontWeight: 'bold' }}>📋 Credenciales por defecto:</p>
        <ul style={{ margin: '0', paddingLeft: '20px' }}>
          <li><strong>Usuario:</strong> <code>admin</code></li>
          <li><strong>Contraseña:</strong> <code>admin</code> (o la que configuraste)</li>
        </ul>
        <p style={{ margin: '10px 0 0 0', fontSize: '14px', color: '#666' }}>
          Si no funcionan, verifica las credenciales en tu instalación de Mayan.
        </p>
      </div>
    </div>
  );
};