import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const userRole = user?.role || user?.rol;

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          
          <Link 
            to="/" 
            className="text-xl font-bold text-rose-600 flex items-center gap-2 hover:opacity-90 transition-opacity"
          >
            <span>ArriendosTurismo</span>
          </Link>

          <div className="flex items-center space-x-4 sm:space-x-6 text-xs sm:text-sm">
            <Link 
              to="/" 
              className="text-gray-600 hover:text-rose-600 font-medium transition-colors"
            >
              Buscar Alojamientos
            </Link>

            {userRole === 'HUESPED' && (
              <Link 
                to="/mis-reservas" 
                className="text-gray-600 hover:text-rose-600 font-medium transition-colors"
              >
                Mis Reservas
              </Link>
            )}

            {userRole === 'ANFITRION' && (
              <Link 
                to="/anfitrion/propiedades" 
                className="text-gray-600 hover:text-rose-600 font-medium transition-colors"
              >
                Mis Propiedades
              </Link>
            )}

            {userRole === 'ADMIN' && (
              <Link 
                to="/admin/dashboard" 
                className="text-gray-600 hover:text-rose-600 font-medium transition-colors"
              >
                Panel Admin
              </Link>
            )}

            {user ? (
              <div className="flex items-center space-x-3 pl-3 sm:pl-4 border-l border-gray-200">
                <span className="hidden md:inline text-gray-700">
                  Hola, <strong className="font-semibold text-gray-900">{user.name || user.email}</strong>{' '}
                  <span className="text-[10px] bg-rose-100 text-rose-700 font-semibold px-2 py-0.5 rounded-full uppercase ml-1">
                    {userRole}
                  </span>
                </span>
                <button 
                  onClick={handleLogout}
                  className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
                >
                  Cerrar Sesión
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-2 pl-3 sm:pl-4 border-l border-gray-200">
                <Link 
                  to="/login" 
                  className="text-gray-700 hover:text-rose-600 font-medium px-3 py-1.5 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Iniciar Sesión
                </Link>
                <Link 
                  to="/register" 
                  className="bg-rose-600 hover:bg-rose-700 text-white font-medium px-4 py-1.5 rounded-lg shadow-xs transition-colors"
                >
                  Registrarse
                </Link>
              </div>
            )}
          </div>

        </div>
      </div>
    </nav>
  );
}