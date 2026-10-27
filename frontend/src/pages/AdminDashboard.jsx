import { useState, useEffect } from 'react';
import axiosClient from '../api/Axios';

const mensajeDeError = (err, porDefecto) => {
  const data = err.response?.data;
  if (typeof data === 'string' && data) return data;
  return data?.message || data?.error || porDefecto;
};

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('overview'); 
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [avisos, setAvisos] = useState([]);
  const [actionMessage, setActionMessage] = useState('');

  const [users, setUsers] = useState([]);
  const [properties, setProperties] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [ciudades, setCiudades] = useState([]);

  useEffect(() => {
    fetchAdminData();
  }, []);

  const cargarResenas = async (alojamientos) => {
    const conReseñas = alojamientos.filter((a) => a.estadoPublicacion !== 'PENDIENTE');
    const resultados = await Promise.allSettled(
      conReseñas.map((a) => axiosClient.get(`/resenas/alojamientos/${a.id}`))
    );
    const lista = resultados.flatMap((r, i) =>
      r.status === 'fulfilled'
        ? r.value.data.map((rev) => ({ ...rev, alojamientoId: conReseñas[i].id }))
        : []
    );
    setReviews(lista);
  };

  const fetchAdminData = async () => {
    setLoading(true);
    setError('');
    setAvisos([]);

    const [usersRes, propsRes, resRes, ciudadesRes] = await Promise.allSettled([
      axiosClient.get('/admin/usuarios'),      
      axiosClient.get('/admin/propiedades'),    
      axiosClient.get('/reservas/admin'),    
      axiosClient.get('/ciudades'),            
    ]);

    const nuevosAvisos = [];

    if (usersRes.status === 'fulfilled') setUsers(usersRes.value.data);
    else {
      console.error('Error al cargar usuarios:', usersRes.reason?.response?.status);
      nuevosAvisos.push('No se pudieron cargar los usuarios.');
    }

    if (propsRes.status === 'fulfilled') {
      setProperties(propsRes.value.data);
      await cargarResenas(propsRes.value.data);
    } else {
      console.error('Error al cargar alojamientos:', propsRes.reason?.response?.status);
      nuevosAvisos.push('No se pudieron cargar los alojamientos.');
    }

    if (resRes.status === 'fulfilled') setReservations(resRes.value.data);
    else {
      console.error('Error al cargar reservas:', resRes.reason?.response?.status);
      nuevosAvisos.push('No se pudieron cargar las reservas.');
    }

    if (ciudadesRes.status === 'fulfilled') setCiudades(ciudadesRes.value.data);

    setAvisos(nuevosAvisos);
    setLoading(false);
  };

  const stats = {
    totalUsers: users.length,
    totalProperties: properties.filter((p) => p.estadoPublicacion === 'PUBLICADO').length,
    pendingProperties: properties.filter((p) => p.estadoPublicacion === 'PENDIENTE').length,
    totalBookings: reservations.length,
  };

  const nombreCiudad = (id) => ciudades.find((c) => c.id === id)?.nombre || '-';
  const nombreAnfitrion = (id) => users.find((u) => u.id === id)?.nombre || `Usuario #${id}`;

  const handlePropertyStatus = async (propertyId, nuevoEstado) => {
    setError('');
    setActionMessage('');

    try {
      await axiosClient.patch(`/admin/alojamientos/${propertyId}/estado`, null, {
        params: { estado: nuevoEstado },
      });

      setProperties((prev) =>
        prev.map((p) => (p.id === propertyId ? { ...p, estadoPublicacion: nuevoEstado } : p))
      );
      setActionMessage(`Alojamiento ${nuevoEstado.toLowerCase()} con éxito.`);
    } catch (err) {
      console.error('Error al cambiar estado de alojamiento:', err.response?.status, err.response?.data);
      setError(mensajeDeError(err, 'No se pudo actualizar el estado del alojamiento.'));
    }
  };

  const handleReviewModeration = async (reviewId, accion) => {
    setError('');
    setActionMessage('');

    try {
      await axiosClient.patch(`/resenas/admin/${reviewId}/${accion}`);

      const nuevoEstado = accion === 'ocultar' ? 'OCULTA' : 'VISIBLE';
      setReviews((prev) => prev.map((r) => (r.id === reviewId ? { ...r, estado: nuevoEstado } : r)));
      setActionMessage(accion === 'ocultar' ? 'Reseña ocultada.' : 'Reseña visible nuevamente.');
    } catch (err) {
      console.error('Error al moderar reseña:', err.response?.status, err.response?.data);
      setError(mensajeDeError(err, 'No se pudo moderar la reseña.'));
    }
  };

  const tituloAlojamiento = (id) => properties.find((p) => p.id === id)?.titulo || `Alojamiento #${id}`;

  const tabClase = (tab) =>
    `px-4 py-2 rounded-lg transition-colors cursor-pointer ${
      activeTab === tab ? 'bg-white text-gray-900 shadow-xs' : 'text-gray-600 hover:text-gray-900'
    }`;

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center">
        <p className="text-gray-500 font-medium animate-pulse">Cargando panel de administración...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900">Panel de Administración</h1>
          <p className="text-sm text-gray-500 mt-1">
            Gestión de usuarios, revisión de publicaciones y monitoreo de la plataforma.
          </p>
        </div>

        <div className="flex bg-gray-100 p-1 rounded-xl border border-gray-200 text-xs font-bold">
          <button onClick={() => setActiveTab('overview')} className={tabClase('overview')}>
            Métricas
          </button>
          <button onClick={() => setActiveTab('users')} className={tabClase('users')}>
            Usuarios ({users.length})
          </button>
          <button onClick={() => setActiveTab('properties')} className={tabClase('properties')}>
            Alojamientos
            {stats.pendingProperties > 0 && (
              <span className="ml-1.5 px-1.5 py-0.5 text-[10px] bg-rose-600 text-white rounded-full">
                {stats.pendingProperties}
              </span>
            )}
          </button>
          <button onClick={() => setActiveTab('reviews')} className={tabClase('reviews')}>
            Reseñas ({reviews.length})
          </button>
        </div>
      </div>

      {avisos.length > 0 && (
        <div className="bg-amber-50 text-amber-700 p-4 rounded-xl border border-amber-100 font-medium mb-6 text-sm">
          {avisos.map((a) => (
            <p key={a}>{a}</p>
          ))}
        </div>
      )}
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

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Total Usuarios</p>
          <p className="text-2xl font-extrabold text-gray-900 mt-1">{stats.totalUsers}</p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Alojamientos Publicados</p>
          <p className="text-2xl font-extrabold text-gray-900 mt-1">{stats.totalProperties}</p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Pendientes Revisión</p>
          <p className="text-2xl font-extrabold text-rose-600 mt-1">{stats.pendingProperties}</p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Reservas Totales</p>
          <p className="text-2xl font-extrabold text-gray-900 mt-1">{stats.totalBookings}</p>
        </div>
      </div>

      {activeTab === 'overview' && (
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-xs">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Estado General del Sistema</h2>
          <p className="text-sm text-gray-600 mb-4">
            Usa las pestañas de la parte superior para administrar los usuarios registrados o moderar los
            alojamientos que envían los anfitriones antes de ser visibles en el buscador.
          </p>
          <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-500 flex justify-between items-center">
            <span>Datos cargados desde el servidor</span>
            <button onClick={fetchAdminData} className="text-rose-600 font-bold hover:underline cursor-pointer">
              Actualizar Datos
            </button>
          </div>
        </div>
      )}

      {activeTab === 'users' && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-xs overflow-hidden">
          <div className="p-5 border-b border-gray-100 flex justify-between items-center">
            <h2 className="text-lg font-bold text-gray-900">Usuarios Registrados</h2>
            <span className="text-xs text-gray-500 font-medium">{users.length} registros</span>
          </div>

          {users.length === 0 ? (
            <div className="p-8 text-center text-gray-500 text-sm">No hay usuarios para mostrar.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 text-[11px] font-bold text-gray-500 uppercase tracking-wider border-b border-gray-100">
                    <th className="p-4">Usuario</th>
                    <th className="p-4">Rol</th>
                    <th className="p-4">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-sm text-gray-700">
                  {users.map((u) => {
                    const status = u.estado || 'ACTIVO';
                    return (
                      <tr key={u.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="p-4 font-medium text-gray-900">
                          {u.nombre}
                          <span className="block text-xs font-normal text-gray-500">{u.email}</span>
                        </td>
                        <td className="p-4">
                          <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-gray-100 text-gray-700">
                            {u.rol}
                          </span>
                        </td>
                        <td className="p-4">
                          <span
                            className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                              status === 'ACTIVO' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
                            }`}
                          >
                            {status}
                          </span>
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

      {activeTab === 'properties' && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-xs overflow-hidden">
          <div className="p-5 border-b border-gray-100 flex justify-between items-center">
            <h2 className="text-lg font-bold text-gray-900">Moderación de Alojamientos</h2>
            <span className="text-xs text-gray-500 font-medium">{properties.length} alojamientos</span>
          </div>

          {properties.length === 0 ? (
            <div className="p-8 text-center text-gray-500 text-sm">No hay alojamientos para mostrar.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 text-[11px] font-bold text-gray-500 uppercase tracking-wider border-b border-gray-100">
                    <th className="p-4">Alojamiento</th>
                    <th className="p-4">Anfitrión</th>
                    <th className="p-4">Ciudad</th>
                    <th className="p-4">Precio / Noche</th>
                    <th className="p-4">Estado</th>
                    <th className="p-4 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-sm text-gray-700">
                  {properties.map((p) => {
                    const status = p.estadoPublicacion || 'PENDIENTE';
                    return (
                      <tr key={p.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="p-4 font-bold text-gray-900">{p.titulo}</td>
                        <td className="p-4 text-xs text-gray-600">{nombreAnfitrion(p.anfitrionId)}</td>
                        <td className="p-4 text-xs text-gray-600">{nombreCiudad(p.ciudadId)}</td>
                        <td className="p-4 font-semibold text-gray-900">
                          ${Number(p.precioBaseNoche).toLocaleString('es-CL')}
                        </td>
                        <td className="p-4">
                          <span
                            className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                              status === 'PUBLICADO'
                                ? 'bg-emerald-50 text-emerald-700'
                                : status === 'SUSPENDIDO'
                                ? 'bg-red-50 text-red-700'
                                : 'bg-amber-50 text-amber-700'
                            }`}
                          >
                            {status}
                          </span>
                        </td>
                        <td className="p-4 text-right space-x-2">
                          {status !== 'PUBLICADO' && (
                            <button
                              onClick={() => handlePropertyStatus(p.id, 'PUBLICADO')}
                              className="text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
                            >
                              {status === 'PENDIENTE' ? 'Aprobar' : 'Reactivar'}
                            </button>
                          )}
                          {status !== 'SUSPENDIDO' && (
                            <button
                              onClick={() => handlePropertyStatus(p.id, 'SUSPENDIDO')}
                              className="text-xs font-semibold bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
                            >
                              Suspender
                            </button>
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

      {activeTab === 'reviews' && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-xs overflow-hidden">
          <div className="p-5 border-b border-gray-100 flex justify-between items-center">
            <h2 className="text-lg font-bold text-gray-900">Moderación de Reseñas</h2>
            <span className="text-xs text-gray-500 font-medium">{reviews.length} reseñas</span>
          </div>

          {reviews.length === 0 ? (
            <div className="p-8 text-center text-gray-500 text-sm">No hay reseñas para mostrar.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 text-[11px] font-bold text-gray-500 uppercase tracking-wider border-b border-gray-100">
                    <th className="p-4">Alojamiento</th>
                    <th className="p-4">Calificación</th>
                    <th className="p-4">Comentario</th>
                    <th className="p-4">Fecha</th>
                    <th className="p-4">Estado</th>
                    <th className="p-4 text-right">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-sm text-gray-700">
                  {reviews.map((rev) => {
                    const estado = rev.estado || 'VISIBLE';
                    return (
                      <tr key={rev.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="p-4 font-bold text-gray-900">{tituloAlojamiento(rev.alojamientoId)}</td>
                        <td className="p-4 text-amber-600 font-bold">{rev.calificacion} / 5</td>
                        <td className="p-4 text-xs text-gray-600 max-w-xs">{rev.comentario || '-'}</td>
                        <td className="p-4 text-xs text-gray-500">
                          {rev.fecha ? new Date(rev.fecha).toLocaleDateString('es-CL') : '-'}
                        </td>
                        <td className="p-4">
                          <span
                            className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                              estado === 'VISIBLE' ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-600'
                            }`}
                          >
                            {estado}
                          </span>
                        </td>
                        <td className="p-4 text-right">
                          {estado === 'VISIBLE' ? (
                            <button
                              onClick={() => handleReviewModeration(rev.id, 'ocultar')}
                              className="text-xs font-semibold bg-red-50 hover:bg-red-100 text-red-600 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
                            >
                              Ocultar
                            </button>
                          ) : (
                            <button
                              onClick={() => handleReviewModeration(rev.id, 'mostrar')}
                              className="text-xs font-semibold bg-emerald-50 hover:bg-emerald-100 text-emerald-700 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
                            >
                              Mostrar
                            </button>
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