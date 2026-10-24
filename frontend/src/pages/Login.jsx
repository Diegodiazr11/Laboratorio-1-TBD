import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axiosClient from '../api/Axios';

const decodeJwt = (token) => {
  try {
    const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    const json = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + c.charCodeAt(0).toString(16).padStart(2, '0'))
        .join('')
    );
    return JSON.parse(json);
  } catch {
    return {};
  }
};

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const response = await axiosClient.post('/auth/login', { email, password });
      const { token } = response.data;
      const claims = decodeJwt(token);

      const user = {
        id: claims.id,
        email: claims.sub,
        nombre: claims.sub?.split('@')[0],
        rol: claims.rol,
      };
      login(user, token);

      if (user.rol === 'ADMINISTRADOR') navigate('/admin/dashboard');
      else if (user.rol === 'ANFITRION') navigate('/anfitrion/propiedades');
      else navigate('/');
    } catch (err) {
      setError('Credenciales inválidas');
    }
  };

  return (
    <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center px-4 sm:px-6 lg:px-8 py-12">
      <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-md border border-gray-100">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-extrabold text-gray-900 mt-2">Iniciar Sesión</h2>
          <p className="text-sm text-gray-500 mt-1">
            Ingresa a tu cuenta para gestionar tus reservas o propiedades
          </p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-xl text-sm font-medium border border-red-100 mb-6 text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
              Correo Electrónico:
            </label>
            <input
              type="email"
              placeholder="ejemplo@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-rose-500 outline-none transition text-sm text-gray-900"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
              Contraseña:
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder={showPassword ? 'Contrasena.12' : '••••••••'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full pl-3 pr-20 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-rose-500 outline-none transition text-sm text-gray-900"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-500 hover:text-gray-700 uppercase tracking-wider focus:outline-none cursor-pointer select-none"
              >
                {showPassword ? 'Ocultar' : 'Mostrar'}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-rose-600 hover:bg-rose-700 text-white font-bold py-2.5 rounded-lg shadow-xs transition-colors cursor-pointer text-sm mt-2"
          >
            Entrar
          </button>
        </form>

        <p className="text-center text-sm text-gray-600 mt-6 pt-4 border-t border-gray-100">
          ¿No tienes cuenta?{' '}
          <Link to="/register" className="font-semibold text-rose-600 hover:text-rose-700 hover:underline">
            Regístrate aquí
          </Link>
        </p>
      </div>
    </div>
  );
}