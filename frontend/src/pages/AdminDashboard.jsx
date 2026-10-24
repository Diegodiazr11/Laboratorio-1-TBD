import { useState, useEffect } from 'react';
import axiosClient from '../api/Axios';

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'users' | 'properties'
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [actionMessage, setActionMessage] = useState('');

  // Estados de datos provenientes del Backend
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalProperties: 0,
    pendingProperties: 0,
    totalBookings: 0,
  });
  const [users, setUsers] = useState([]);
  const [properties, setProperties] = useState([]);

  useEffect(() => {
    fetchAdminData();
  }, []);

  // Carga inicial de datos desde el backend
  const fetchAdminData = async () => {
    setLoading(true);
    setError('');
    try {
      const [statsRes, usersRes, propsRes] = await Promise.all([
        axiosClient.get('/admin/stats'),
        axiosClient.get('/admin/users'),
        axiosClient.get('/admin/properties'),
      ]);

      setStats(statsRes.data);
      setUsers(usersRes.data);
      setProperties(propsRes.data);
    } catch (err) {
      console.error('Error al cargar datos del administrador:', err);
      setError(
        err.response?.data?.message || 'Error de conexión al cargar la información del panel.'
      );
    } finally {
      setLoading(false);
    }
  };

  // Cambiar estado de usuario (Activar / Suspender)
  const handleUserStatusToggle = async (userId, currentStatus) => {
    const newStatus = currentStatus === 'ACTIVO' ? 'SUSPENDIDO' : 'ACTIVO';
    setError('');
    setActionMessage('');

    try {
      await axiosClient.put(`/admin/users/${userId}/status`, { status: newStatus });
      
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, status: newStatus } : u))
      );
      setActionMessage('Estado del usuario actualizado correctamente.');
    } catch (err) {
      setError(err.response?.data?.message || 'No se pudo actualizar el estado del usuario.');
    }
  };

  // Moderar propiedad (Aprobar / Rechazar)
  const handlePropertyStatus = async (propertyId, newStatus) => {
    setError('');
    setActionMessage('');

    try {
      await axiosClient.put(`/admin/properties/${propertyId}/status`, { status: newStatus });
      
      setProperties((prev) =>
        prev.map((p) => (p.id === propertyId ? { ...p, status: newStatus } : p))
      );

      // Actualizar contadores locales
      if (newStatus === 'APROBADA') {
        setStats((prev) => ({
          ...prev,
          pendingProperties: Math.max(0, prev.pendingProperties - 1),
        }));
      }

      setActionMessage(`Propiedad ${newStatus.toLowerCase()} con éxito.`);
    } catch (err) {
      setError(err.response?.data?.message || 'No se pudo actualizar el estado de la propiedad.');
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center">
        <p className="text-gray-500 font-medium animate-pulse">Cargando panel de administración...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header del Dashboard */}
      <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900">Panel de Administración</h1>
          <p className="text-sm text-gray-500 mt-1">
            Gestión de usuarios, revisión de publicaciones y monitoreo de la plataforma.
          </p>
        </div>

        {/* Pestañas de Navegación */}
        <div className="flex bg-gray-100 p-1 rounded-xl border border-gray-200 text-xs font-bold">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-4 py-2 rounded-lg transition-colors cursor-pointer ${
              activeTab === 'overview'
                ? 'bg-white text-gray-900 shadow-xs'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Métricas
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`px-4 py-2 rounded-lg transition-colors cursor-pointer ${
              activeTab === 'users'
                ? 'bg-white text-gray-900 shadow-xs'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Usuarios ({users.length})
          </button>
          <button
            onClick={() => setActiveTab('properties')}
            className={`px-4 py-2 rounded-lg transition-colors cursor-pointer relative ${
              activeTab === 'properties'
                ? 'bg-white text-gray-900 shadow-xs'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Propiedades
            {stats.pendingProperties > 0 && (
              <span className="ml-1.5 px-1.5 py-0.5 text-[10px] bg-rose-600 text-white rounded-full">
                {stats.pendingProperties}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Alertas de Error / Éxito */}
      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-xl border border-red-100 font-medium mb-6 text-center text-sm">
          {error}
        </div>
      )}
      {actionMessage && (
        <div className="bg-emerald-50 text-emerald-600 p-4 rounded-xl border border-emerald-100 font-medium mb-6 text-center text-sm">
          {actionMessage}
        </div>
      )}

      {/* Tarjetas de Métricas Principales (KPIs) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Total Usuarios</p>
            <p className="text-2xl font-extrabold text-gray-900 mt-1">{stats.totalUsers || 0}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Alojamientos Publicados</p>
            <p className="text-2xl font-extrabold text-gray-900 mt-1">{stats.totalProperties || 0}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Pendientes Revisión</p>
            <p className="text-2xl font-extrabold text-rose-600 mt-1">{stats.pendingProperties || 0}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Reservas Totales</p>
            <p className="text-2xl font-extrabold text-gray-900 mt-1">{stats.totalBookings || 0}</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        </div>
      </div>

      {/* Pestaña 1: Vista General de Métricas */}
      {activeTab === 'overview' && (
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-xs">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Estado General del Sistema</h2>
          <p className="text-sm text-gray-600 mb-4">
            Selecciona las pestañas de la parte superior para administrar los usuarios registrados o moderar las publicaciones que envían los anfitriones antes de ser visibles en el buscador general.
          </p>
          <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-500 flex justify-between items-center">
            <span>Conexión con la API Backend: Activa</span>
            <button 
              onClick={fetchAdminData} 
              className="text-rose-600 font-bold hover:underline cursor-pointer"
            >
              Actualizar Datos
            </button>
          </div>
        </div>
      )}

      {/* Pestaña 2: Tabla de Usuarios */}
      {activeTab === 'users' && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-xs overflow-hidden">
          <div className="p-5 border-b border-gray-100 flex justify-between items-center">
            <h2 className="text-lg font-bold text-gray-900">Usuarios Registrados</h2>
            <span className="text-xs text-gray-500 font-medium">{users.length} registros</span>
          </div>

          {users.length === 0 ? (
            <div className="p-8 text-center text-gray-500 text-sm">
              No hay usuarios registrados en el sistema.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 text-[11px] font-bold text-gray-500 uppercase tracking-wider border-b border-gray-100">
                    <th className="p-4">Usuario</th>
                    <th className="p-4">Rol</th>
                    <th className="p-4">Estado</th>
                    <th className="p-4">Registro</th>
                    <th className="p-4 text-right">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-sm text-gray-700">
                  {users.map((u) => {
                    const status = u.status || u.estado || 'ACTIVO';
                    return (
                      <tr key={u.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="p-4 font-medium text-gray-900">
                          {u.name || u.nombre}
                          <span className="block text-xs font-normal text-gray-500">{u.email}</span>
                        </td>
                        <td className="p-4">
                          <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-gray-100 text-gray-700">
                            {u.role || u.rol}
                          </span>
                        </td>
                        <td className="p-4">
                          <span
                            className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                              status === 'ACTIVO'
                                ? 'bg-emerald-50 text-emerald-700'
                                : 'bg-red-50 text-red-700'
                            }`}
                          >
                            {status}
                          </span>
                        </td>
                        <td className="p-4 text-xs text-gray-500">
                          {u.createdAt || u.created_at || 'N/A'}
                        </td>
                        <td className="p-4 text-right">
                          <button
                            onClick={() => handleUserStatusToggle(u.id, status)}
                            className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                              status === 'ACTIVO'
                                ? 'bg-red-50 hover:bg-red-100 text-red-600'
                                : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700'
                            }`}
                          >
                            {status === 'ACTIVO' ? 'Suspender' : 'Activar'}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Pestaña 3: Moderación de Propiedades */}
      {activeTab === 'properties' && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-xs overflow-hidden">
          <div className="p-5 border-b border-gray-100 flex justify-between items-center">
            <h2 className="text-lg font-bold text-gray-900">Moderación de Propiedades</h2>
            <span className="text-xs text-gray-500 font-medium">{properties.length} propiedades</span>
          </div>

          {properties.length === 0 ? (
            <div className="p-8 text-center text-gray-500 text-sm">
              No hay propiedades registradas o pendientes de aprobación.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 text-[11px] font-bold text-gray-500 uppercase tracking-wider border-b border-gray-100">
                    <th className="p-4">Propiedad</th>
                    <th className="p-4">Anfitrión</th>
                    <th className="p-4">Ciudad</th>
                    <th className="p-4">Precio / Noche</th>
                    <th className="p-4">Estado</th>
                    <th className="p-4 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-sm text-gray-700">
                  {properties.map((p) => {
                    const status = p.status || p.estado || 'PENDIENTE';
                    return (
                      <tr key={p.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="p-4 font-bold text-gray-900">{p.title || p.nombre}</td>
                        <td className="p-4 text-xs text-gray-600">{p.host || p.anfitrion_nombre || 'Desconocido'}</td>
                        <td className="p-4 text-xs text-gray-600">{p.city || p.ciudad}</td>
                        <td className="p-4 font-semibold text-gray-900">
                          ${p.price || p.price_per_night || p.precio_noche}
                        </td>
                        <td className="p-4">
                          <span
                            className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                              status === 'APROBADA'
                                ? 'bg-emerald-50 text-emerald-700'
                                : status === 'RECHAZADA'
                                ? 'bg-red-50 text-red-700'
                                : 'bg-amber-50 text-amber-700'
                            }`}
                          >
                            {status}
                          </span>
                        </td>
                        <td className="p-4 text-right space-x-2">
                          {status === 'PENDIENTE' && (
                            <>
                              <button
                                onClick={() => handlePropertyStatus(p.id, 'APROBADA')}
                                className="text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
                              >
                                Aprobar
                              </button>
                              <button
                                onClick={() => handlePropertyStatus(p.id, 'RECHAZADA')}
                                className="text-xs font-semibold bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
                              >
                                Rechazar
                              </button>
                            </>
                          )}
                          {status !== 'PENDIENTE' && (
                            <span className="text-xs text-gray-400 italic">Procesado</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}