import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axiosClient from '../api/Axios'; 

export default function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();


  const validations = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /[0-9]/.test(password),
    special: /[^A-Za-z0-9]/.test(password),
  };


  const isPasswordValid = Object.values(validations).every(Boolean);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!isPasswordValid) {
      setError('La contraseña no cumple con todos los requisitos de seguridad.');
      return;
    }

    setLoading(true);

    try {

      await axiosClient.post('/auth/register', {
        nombre: name.trim(),
        email: email.trim(),
        password,
        rol: role,
      });

      navigate('/login');
    } catch (err) {
      setError(
        err.response?.data?.message || 'Ocurrió un error al registrar el usuario'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center px-4 sm:px-6 lg:px-8 py-12">
      <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-md border border-gray-100">
        
        <div className="text-center mb-6">
          <h2 className="text-2xl font-extrabold text-gray-900 mt-2">
            Crear Cuenta
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            Regístrate para reservar o publicar tus alojamientos
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
              Nombre Completo:
            </label>
            <input
              type="text"
              placeholder="Nicolas Meza"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-rose-500 outline-none transition text-sm text-gray-900"
            />
          </div>

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
                placeholder={showPassword ? 'Contrasena.12' : "••••••••" }
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

            {password.length > 0 && (
              <div className="mt-3 p-3 bg-gray-50 rounded-xl border border-gray-100 text-xs space-y-1.5">
                <p className="font-semibold text-gray-700 mb-1">Requisitos de la contraseña:</p>
                
                <div className={`flex items-center gap-1.5 ${validations.length ? 'text-emerald-600 font-medium' : 'text-gray-400'}`}>
                  <span>{validations.length ? '✓' : '○'}</span>
                  <span>Mínimo 8 caracteres</span>
                </div>

                <div className={`flex items-center gap-1.5 ${validations.uppercase ? 'text-emerald-600 font-medium' : 'text-gray-400'}`}>
                  <span>{validations.uppercase ? '✓' : '○'}</span>
                  <span>Al menos 1 mayúscula (A-Z)</span>
                </div>

                <div className={`flex items-center gap-1.5 ${validations.lowercase ? 'text-emerald-600 font-medium' : 'text-gray-400'}`}>
                  <span>{validations.lowercase ? '✓' : '○'}</span>
                  <span>Al menos 1 minúscula (a-z)</span>
                </div>

                <div className={`flex items-center gap-1.5 ${validations.number ? 'text-emerald-600 font-medium' : 'text-gray-400'}`}>
                  <span>{validations.number ? '✓' : '○'}</span>
                  <span>Al menos 1 número (0-9)</span>
                </div>

                <div className={`flex items-center gap-1.5 ${validations.special ? 'text-emerald-600 font-medium' : 'text-gray-400'}`}>
                  <span>{validations.special ? '✓' : '○'}</span>
                  <span>Al menos 1 carácter especial (@, #, $, !, %, etc.)</span>
                </div>
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
              ¿Cómo deseas usar la plataforma?
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setRole('HUESPED')}
                className={`p-3 border-2 rounded-xl text-left transition-all cursor-pointer flex flex-col justify-between ${
                  role === 'HUESPED'
                    ? 'border-rose-600 bg-rose-50/50 ring-1 ring-rose-600'
                    : 'border-gray-200 hover:border-gray-300 bg-white'
                }`}
              >
                <div>
                  <p className="font-bold text-gray-900 text-xs">Huésped</p>
                  <p className="text-[10px] text-gray-500">Reservar alojamientos</p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setRole('ANFITRION')}
                className={`p-3 border-2 rounded-xl text-left transition-all cursor-pointer flex flex-col justify-between ${
                  role === 'ANFITRION'
                    ? 'border-rose-600 bg-rose-50/50 ring-1 ring-rose-600'
                    : 'border-gray-200 hover:border-gray-300 bg-white'
                }`}
              >
                <div>
                  <p className="font-bold text-gray-900 text-xs">Anfitrión</p>
                  <p className="text-[10px] text-gray-500">Publicar propiedades</p>
                </div>
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || !isPasswordValid || !email?.trim() || !name?.trim() || !role?.trim()}
            className="w-full bg-rose-600 hover:bg-rose-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-bold py-2.5 rounded-lg shadow-xs transition-colors cursor-pointer text-sm mt-2"
          >
            {loading ? 'Registrando...' : 'Registrarse'}
          </button>
        </form>

        <p className="text-center text-sm text-gray-600 mt-6 pt-4 border-t border-gray-100">
          ¿Ya tienes cuenta?{' '}
          <Link to="/login" className="font-semibold text-rose-600 hover:text-rose-700 hover:underline">
            Inicia sesión aquí
          </Link>
        </p>
      </div>
    </div>
  );
}