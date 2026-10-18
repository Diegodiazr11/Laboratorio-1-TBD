import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth} from '../context/AuthContext';
import axiosClient from '../api/Axios';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axiosClient.post('/auth/login', { email, password });
      const { user, token } = response.data;
      
      login(user, token);
      
      if (user.role === 'ADMIN') navigate('/admin/dashboard');
      else if (user.role === 'ANFITRION') navigate('/anfitrion/propiedades')
      else navigate('/');
      
    } catch (err) {
      setError('Credenciales inválidas o error de conexión con el backend');
    }
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '400px', margin: '0 auto' }}>
      <h2>Iniciar Sesión</h2>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <form onSubmit={handleSubmit}>
        <div>
          <label>Correo Electrónico:</label>
          <input 
            type="email" 
            value={email} 
            onChange={(e) => setEmail(e.target.value)} 
            required 
          />
        </div>
        <div style={{ marginTop: '1rem' }}>
          <label>Contraseña:</label>
          <input 
            type="password" 
            value={password} 
            onChange={(e) => setPassword(e.target.value)} 
            required 
          />
        </div>
        <button type="submit" style={{ marginTop: '1rem' }}>Entrar</button>
      </form>
      <p style={{ marginTop: '1rem', textAlign: 'center' }}>
        ¿No tienes cuenta? <Link to="/register">Registrate aquí</Link>
      </p>
    </div>
  );
}