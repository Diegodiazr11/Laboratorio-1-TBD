import { useState, useEffect } from 'react';
import axiosClient from '../api/Axios';

const mensajeDeError = (err, porDefecto) => {
  const data = err.response?.data;
  if (typeof data === 'string' && data) return data;
  return data?.message || data?.error || porDefecto;
};

const pad = (n) => String(n).padStart(2, '0');
const dinero = (n) => `$${Number(n || 0).toLocaleString('es-CL')}`;

const campo = (fila, snake, camel) => fila[snake] ?? fila[camel];

const claveMes = (valor) => {
  if (!valor) return '';
  if (Array.isArray(valor)) return `${valor[0]}-${pad(valor[1])}`;
  return String(valor).slice(0, 7);
};

const nombreMes = (clave) => {
  const [anio, mes] = clave.split('-');
  return new Date(Number(anio), Number(mes) - 1, 1).toLocaleDateString('es-CL', {
    month: 'long',
    year: 'numeric',
  });
};

function Kpi({ titulo, valor, destacado }) {
  return (
    <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs">
      <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">{titulo}</p>
      <p className={`text-2xl font-extrabold mt-1 ${destacado ? 'text-rose-600' : 'text-gray-900'}`}>{valor}</p>
    </div>
  );
}

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [avisos, setAvisos] = useState([]);
  const [actionMessage, setActionMessage] = useState('');

  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [properties, setProperties] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [ciudades, setCiudades] = useState([]);

  const [reportRows, setReportRows] = useState([]);
  const [reportLoaded, setReportLoaded] = useState(false);
  const [reportLoading, setReportLoading] = useState(false);
  const [mesFiltro, setMesFiltro] = useState('');
  const [ciudadFiltro, setCiudadFiltro] = useState('');

  useEffect(() => {
    fetchAdminData();
  }, []);

  useEffect(() => {
    if (activeTab === 'reports' && !reportLoaded) cargarReporte();
  }, [activeTab]);


  const cargarResenas = async (alojamientos) => {
    const conResenas = alojamientos.filter((a) => a.estadoPublicacion !== 'PENDIENTE');
    const resultados = await Promise.allSettled(
      conResenas.map((a) => axiosClient.get(`/resenas/alojamientos/${a.id}`))
    );
    const lista = resultados.flatMap((r, i) =>
      r.status === 'fulfilled'
        ? r.value.data.map((rev) => ({ ...rev, alojamientoId: conResenas[i].id }))
        : []
    );
    setReviews(lista);
  };

  const cargarEstadisticas = async () => {
    try {
      const res = await axiosClient.get('/admin/estadisticas');
      setStats(res.data);
    } catch (err) {
      console.error('Error al cargar estadísticas:', err.response?.status);
      setStats(null);
    }
  };

  const fetchAdminData = async () => {
    setLoading(true);
    setError('');

    const [usersRes, propsRes, ciudadesRes] = await Promise.allSettled([
      axiosClient.get('/admin/usuarios'),
      axiosClient.get('/admin/propiedades'),
      axiosClient.get('/ciudades'),
    ]);

    const nuevosAvisos = [];

    if (usersRes.status === 'fulfilled') setUsers(usersRes.value.data);
    else nuevosAvisos.push('No se pudieron cargar los usuarios.');

    if (propsRes.status === 'fulfilled') {
      setProperties(propsRes.value.data);
      await cargarResenas(propsRes.value.data);
    } else {
      nuevosAvisos.push('No se pudieron cargar los alojamientos.');
    }

    if (ciudadesRes.status === 'fulfilled') setCiudades(ciudadesRes.value.data);

    await cargarEstadisticas();
    setAvisos(nuevosAvisos);
    setLoading(false);
  };

  const cargarReporte = async () => {
    setReportLoading(true);
    try {
      const res = await axiosClient.get('/admin/reportes/ocupacion-ingresos');
      setReportRows(res.data);
      setReportLoaded(true);

      const meses = [...new Set(res.data.map((f) => claveMes(campo(f, 'mes', 'mes'))))].sort();
      const hoy = new Date();
      const claveHoy = `${hoy.getFullYear()}-${pad(hoy.getMonth() + 1)}`;
      setMesFiltro((prev) => prev || (meses.includes(claveHoy) ? claveHoy : 'todos'));
    } catch (err) {
      console.error('Error al cargar el reporte:', err.response?.status, err.response?.data);
      setError(mensajeDeError(err, 'No se pudo cargar el reporte de ocupación e ingresos.'));
    } finally {
      setReportLoading(false);
    }
  };


  const handleRefrescarReporte = async () => {
    setError('');
    setActionMessage('');
    try {
      const res = await axiosClient.post('/admin/reportes/ocupacion-ingresos/refrescar');
      setActionMessage(res.data?.mensaje || 'Reporte actualizado.');
      await cargarReporte();
    } catch (err) {
      setError(mensajeDeError(err, 'No se pudo actualizar el reporte.'));
    }
  };

  const handleUserStatusToggle = async (userId, estadoActual) => {
    const nuevoEstado = estadoActual === 'ACTIVO' ? 'INACTIVO' : 'ACTIVO';
    setError('');
    setActionMessage('');
    try {
      await axiosClient.put(`/admin/usuarios/${userId}/estado`, { status: nuevoEstado });
      setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, estado: nuevoEstado, status: nuevoEstado } : u)));
      setActionMessage('Estado del usuario actualizado correctamente.');
      cargarEstadisticas();
    } catch (err) {
      console.error('Error al cambiar estado de usuario:', err.response?.status, err.response?.data);
      setError(mensajeDeError(err, 'No se pudo actualizar el estado del usuario.'));
    }
  };

  const handlePropertyStatus = async (propertyId, nuevoEstado) => {
    setError('');
    setActionMessage('');
    try {
      await axiosClient.put(`/admin/propiedades/${propertyId}/estado`, { status: nuevoEstado });
      setProperties((prev) =>
        prev.map((p) => (p.id === propertyId ? { ...p, estadoPublicacion: nuevoEstado } : p))
      );
      setActionMessage(`Alojamiento ${nuevoEstado.toLowerCase()} con éxito.`);
      cargarEstadisticas();
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

  const estadisticas = stats ?? {
    totalUsers: users.length,
    totalProperties: properties.filter((p) => p.estadoPublicacion === 'PUBLICADO').length,
    pendingProperties: properties.filter((p) => p.estadoPublicacion === 'PENDIENTE').length,
    totalBookings: '-',
  };

  const nombreCiudad = (id) => ciudades.find((c) => c.id === id)?.nombre || '-';
  const nombreAnfitrion = (id) => users.find((u) => u.id === id)?.nombre || `Usuario #${id}`;
  const tituloAlojamiento = (id) => properties.find((p) => p.id === id)?.titulo || `Alojamiento #${id}`;

  const mesesReporte = [...new Set(reportRows.map((f) => claveMes(campo(f, 'mes', 'mes'))))].sort();
  const ciudadesReporte = [...new Set(reportRows.map((f) => campo(f, 'ciudad', 'ciudad')))].sort();

  const filasReporte = reportRows.filter(
    (f) =>
      (mesFiltro === 'todos' || !mesFiltro || claveMes(campo(f, 'mes', 'mes')) === mesFiltro) &&
      (!ciudadFiltro || campo(f, 'ciudad', 'ciudad') === ciudadFiltro)
  );

  const totalOcupadas = filasReporte.reduce((s, f) => s + Number(campo(f, 'noches_ocupadas', 'nochesOcupadas') || 0), 0);
  const totalDisponibles = filasReporte.reduce((s, f) => s + Number(campo(f, 'noches_disponibles', 'nochesDisponibles') || 0), 0);
  const totalIngresos = filasReporte.reduce((s, f) => s + Number(campo(f, 'ingresos_netos', 'ingresosNetos') || 0), 0);
  const ocupacionGlobal = totalDisponibles > 0 ? (100 * totalOcupadas) / totalDisponibles : 0;

  const tabClase = (tab) =>
    `px-4 py-2 rounded-lg transition-colors cursor-pointer ${
      activeTab === tab ? 'bg-white text-gray-900 shadow-xs' : 'text-gray-600 hover:text-gray-900'
    }`;

  const inputClase =
    'px-3 py-2 border border-gray-300 rounded-lg text-xs text-gray-900 bg-white outline-none focus:ring-2 focus:ring-rose-500';

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center">
        <p className="text-gray-500 font-medium animate-pulse">Cargando panel de administración...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900">Panel de Administración</h1>
          <p className="text-sm text-gray-500 mt-1">
            Gestión de usuarios, revisión de publicaciones y monitoreo de la plataforma.
          </p>
        </div>

        <div className="flex flex-wrap bg-gray-100 p-1 rounded-xl border border-gray-200 text-xs font-bold">
          <button onClick={() => setActiveTab('overview')} className={tabClase('overview')}>
            Métricas
          </button>
          <button onClick={() => setActiveTab('users')} className={tabClase('users')}>
            Usuarios ({users.length})
          </button>
          <button onClick={() => setActiveTab('properties')} className={tabClase('properties')}>
            Alojamientos
            {estadisticas.pendingProperties > 0 && (
              <span className="ml-1.5 px-1.5 py-0.5 text-[10px] bg-rose-600 text-white rounded-full">
                {estadisticas.pendingProperties}
              </span>
            )}
          </button>
          <button onClick={() => setActiveTab('reviews')} className={tabClase('reviews')}>
            Reseñas ({reviews.length})
          </button>
          <button onClick={() => setActiveTab('reports')} className={tabClase('reports')}>
            Reportes
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
        <Kpi titulo="Total Usuarios" valor={estadisticas.totalUsers} />
        <Kpi titulo="Alojamientos Publicados" valor={estadisticas.totalProperties} />
        <Kpi titulo="Pendientes Revisión" valor={estadisticas.pendingProperties} destacado />
        <Kpi titulo="Reservas Totales" valor={estadisticas.totalBookings} />
      </div>

      {activeTab === 'overview' && (
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-xs">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Estado General del Sistema</h2>
          <p className="text-sm text-gray-600 mb-4">
            Usa las pestañas de la parte superior para administrar usuarios, moderar alojamientos y reseñas, o
            consultar el reporte de ocupación e ingresos.
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
                    <th className="p-4 text-right">Acción</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-sm text-gray-700">
                  {users.map((u) => {
                    const estado = u.estado ?? u.status ?? 'ACTIVO';
                    const rol = u.rol ?? u.role;
                    return (
                      <tr key={u.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="p-4 font-medium text-gray-900">
                          {u.nombre ?? u.name}
                          <span className="block text-xs font-normal text-gray-500">{u.email}</span>
                        </td>
                        <td className="p-4">
                          <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-gray-100 text-gray-700">
                            {rol}
                          </span>
                        </td>
                        <td className="p-4">
                          <span
                            className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                              estado === 'ACTIVO' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
                            }`}
                          >
                            {estado}
                          </span>
                        </td>
                        <td className="p-4 text-right">
                          {rol !== 'ADMINISTRADOR' && (
                            <button
                              onClick={() => handleUserStatusToggle(u.id, estado)}
                              className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                                estado === 'ACTIVO'
                                  ? 'bg-red-50 hover:bg-red-100 text-red-600'
                                  : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700'
                              }`}
                            >
                              {estado === 'ACTIVO' ? 'Desactivar' : 'Activar'}
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
                    const estado = p.estadoPublicacion || 'PENDIENTE';
                    return (
                      <tr key={p.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="p-4 font-bold text-gray-900">{p.titulo}</td>
                        <td className="p-4 text-xs text-gray-600">{nombreAnfitrion(p.anfitrionId)}</td>
                        <td className="p-4 text-xs text-gray-600">{nombreCiudad(p.ciudadId)}</td>
                        <td className="p-4 font-semibold text-gray-900">{dinero(p.precioBaseNoche)}</td>
                        <td className="p-4">
                          <span
                            className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                              estado === 'PUBLICADO'
                                ? 'bg-emerald-50 text-emerald-700'
                                : estado === 'SUSPENDIDO'
                                ? 'bg-orange-50 text-orange-700'
                                : 'bg-amber-50 text-amber-700'
                            }`}
                          >
                            {estado}
                          </span>
                        </td>
                        <td className="p-4 text-right space-x-2">
                          {estado !== 'PUBLICADO' && (
                            <button
                              onClick={() => handlePropertyStatus(p.id, 'PUBLICADO')}
                              className="text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
                            >
                              {estado === 'PENDIENTE' ? 'Aprobar' : 'Reactivar'}
                            </button>
                          )}
                          {estado !== 'SUSPENDIDO' && (
                            <button
                              onClick={() => handlePropertyStatus(p.id, 'SUSPENDIDO')}
                              className="text-xs font-semibold bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
                            >
                              {estado === 'PENDIENTE' ? 'Rechazar' : 'Suspender'}
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

      {activeTab === 'reports' && (
        <div className="space-y-6">
          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs flex flex-col md:flex-row md:items-end gap-4">
            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Mes</label>
              <select value={mesFiltro} onChange={(e) => setMesFiltro(e.target.value)} className={inputClase}>
                <option value="todos">Todos los meses</option>
                {mesesReporte.map((m) => (
                  <option key={m} value={m}>
                    {nombreMes(m)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Ciudad</label>
              <select value={ciudadFiltro} onChange={(e) => setCiudadFiltro(e.target.value)} className={inputClase}>
                <option value="">Todas las ciudades</option>
                {ciudadesReporte.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <button
              onClick={handleRefrescarReporte}
              disabled={reportLoading}
              className="md:ml-auto text-xs font-bold bg-rose-600 hover:bg-rose-700 disabled:bg-gray-300 text-white px-4 py-2.5 rounded-lg transition-colors cursor-pointer"
            >
              {reportLoading ? 'Actualizando...' : 'Actualizar reporte'}
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            <Kpi titulo="Ocupación" valor={`${ocupacionGlobal.toFixed(1)}%`} />
            <Kpi titulo="Noches ocupadas / disponibles" valor={`${totalOcupadas} / ${totalDisponibles}`} />
            <Kpi titulo="Ingresos netos" valor={dinero(totalIngresos)} />
          </div>

          <div className="bg-white rounded-2xl border border-gray-100 shadow-xs overflow-hidden">
            <div className="p-5 border-b border-gray-100 flex justify-between items-center">
              <h2 className="text-lg font-bold text-gray-900">Ocupación e Ingresos por Ciudad y Tipo</h2>
              <span className="text-xs text-gray-500 font-medium">{filasReporte.length} filas</span>
            </div>

            {reportLoading && reportRows.length === 0 ? (
              <div className="p-8 text-center text-gray-500 text-sm animate-pulse">Generando reporte...</div>
            ) : filasReporte.length === 0 ? (
              <div className="p-8 text-center text-gray-500 text-sm">No hay datos para los filtros elegidos.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50 text-[11px] font-bold text-gray-500 uppercase tracking-wider border-b border-gray-100">
                      <th className="p-4">Mes</th>
                      <th className="p-4">Ciudad</th>
                      <th className="p-4">Tipo</th>
                      <th className="p-4">Alojamientos</th>
                      <th className="p-4">Noches ocupadas</th>
                      <th className="p-4">Ocupación</th>
                      <th className="p-4 text-right">Ingresos netos</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-xs text-gray-700">
                    {filasReporte.map((f, i) => {
                      const pct = Number(campo(f, 'porcentaje_ocupacion', 'porcentajeOcupacion') || 0);
                      return (
                        <tr key={i} className="hover:bg-gray-50/50 transition-colors">
                          <td className="p-4 capitalize">{nombreMes(claveMes(campo(f, 'mes', 'mes')))}</td>
                          <td className="p-4 font-bold text-gray-900">{campo(f, 'ciudad', 'ciudad')}</td>
                          <td className="p-4">{campo(f, 'tipo_alojamiento', 'tipoAlojamiento')}</td>
                          <td className="p-4">{campo(f, 'total_alojamientos', 'totalAlojamientos')}</td>
                          <td className="p-4">
                            {campo(f, 'noches_ocupadas', 'nochesOcupadas')} /{' '}
                            {campo(f, 'noches_disponibles', 'nochesDisponibles')}
                          </td>
                          <td className="p-4 min-w-[140px]">
                            <div className="flex items-center gap-2">
                              <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-rose-500 rounded-full"
                                  style={{ width: `${Math.min(100, pct)}%` }}
                                />
                              </div>
                              <span className="w-12 text-right font-semibold">{pct.toFixed(1)}%</span>
                            </div>
                          </td>
                          <td className="p-4 text-right font-bold text-gray-900">
                            {dinero(campo(f, 'ingresos_netos', 'ingresosNetos'))}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}