import { createContext, useContext, useState, useEffect, useCallback } from 'react';

const AuthContext = createContext();


const SESSION_MS = 10 * 60 * 1000;

const limpiarSesion = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  localStorage.removeItem('expiresAt');
};

const leerSesionGuardada = () => {
  const token = localStorage.getItem('token');
  const expiresAt = Number(localStorage.getItem('expiresAt'));

  if (!token || !expiresAt || Date.now() >= expiresAt) {
    limpiarSesion();
    return { token: null, user: null };
  }

  try {
    const raw = localStorage.getItem('user');
    const user = raw && raw !== 'undefined' ? JSON.parse(raw) : null;
    if (!user) {
      limpiarSesion();
      return { token: null, user: null };
    }
    return { token, user };
  } catch {
    limpiarSesion();
    return { token: null, user: null };
  }
};

export const AuthProvider = ({ children }) => {
  const [sesion] = useState(leerSesionGuardada);
  const [user, setUser] = useState(sesion.user);
  const [token, setToken] = useState(sesion.token);

  const logout = useCallback(() => {
    setUser(null);
    setToken(null);
    limpiarSesion();
  }, []);

  const login = (userData, jwtToken) => {
    setUser(userData);
    setToken(jwtToken);
    localStorage.setItem('token', jwtToken);
    localStorage.setItem('expiresAt', String(Date.now() + SESSION_MS));
    if (userData) {
      localStorage.setItem('user', JSON.stringify(userData));
    }
  };

  useEffect(() => {
    if (!token) return;

    const expiresAt = Number(localStorage.getItem('expiresAt'));
    const restante = expiresAt - Date.now();

    if (!expiresAt || restante <= 0) {
      logout();
      return;
    }

    const timer = setTimeout(logout, restante);
    return () => clearTimeout(timer);
  }, [token, logout]);

  return (
    <AuthContext.Provider value={{ user, token, loading: false, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);