import { useState, useEffect } from 'react';
import axiosClient from '../api/Axios';

const mensajeDeError = (err, porDefecto) => {
  const data = err.response?.data;
  if (typeof data === 'string' && data) return data;
  return data?.message || data?.error || porDefecto;
};

const formatearFecha = (str) =>
  str ? new Date(`${str}T00:00:00`).toLocaleDateString('es-CL') : '-';

const FORM_VACIO = {
  titulo: '',
  tipoId: '',
  ciudadId: '',
  politicaId: '',
  capacidadMax: 2,
  precioBaseNoche: '',
  estadiaMinima: 1,
};

export default function HostProperties() {
  const [activeTab, setActiveTab] = useState('properties');
  const [properties, setProperties] = useState([]);
  const [reservations, setReservations] = useState([]);

  const [tiposAlojamiento, setTiposAlojamiento] = useState([]);
  const [ciudades, setCiudades] = useState([]);
  const [politicas, setPoliticas] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState(FORM_VACIO);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const valoresIniciales = (tipos, ciudadesLista, politicasLista) => ({
    ...FORM_VACIO,
    tipoId: tipos[0]?.id || '',
    ciudadId: ciudadesLista[0]?.id || '',
    politicaId: politicasLista[0]?.id || '',
  });

  const fetchInitialData = async () => {
    setLoading(true);
    setError('');
    try {
      const [propsRes, tiposRes, ciudadesRes, politicasRes] = await Promise.all([
        axiosClient.get('/alojamientos/mis-publicaciones'),
        axiosClient.get('/tipos-alojamiento'),
        axiosClient.get('/ciudades'),
        axiosClient.get('/politicas-cancelacion'),
      ]);

      setProperties(propsRes.data);
      setTiposAlojamiento(tiposRes.data);
      setCiudades(ciudadesRes.data);
      setPoliticas(politicasRes.data);
      setFormData(valoresIniciales(tiposRes.data, ciudadesRes.data, politicasRes.data));
    } catch (err) {
      console.error('Error al cargar datos:', err.response?.status, err.response?.data);
      setError(mensajeDeError(err, 'Error al cargar los datos desde el servidor.'));
    }

    try {
      const resRes = await axiosClient.get('/reservas/mis-alojamientos');
      setReservations(resRes.data);
    } catch (err) {
      console.error('Error al cargar reservas:', err.response?.status);
      setReservations([]);
    }

    setLoading(false);
  };

  const handleInputChange = (e) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value === '' ? '' : type === 'number' || name.endsWith('Id') ? Number(value) : value,
    }));
  };

  const handleCreateProperty = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    setMessage('');

    const payload = {
      titulo: formData.titulo.trim(),
      tipoId: Number(formData.tipoId),
      ciudadId: Number(formData.ciudadId),
      politicaId: Number(formData.politicaId),
      capacidadMax: Number(formData.capacidadMax),
      precioBaseNoche: Number(formData.precioBaseNoche),
      estadiaMinima: Number(formData.estadiaMinima) || 1,
    };

    try {
      await axiosClient.post('/alojamientos', payload);
      setMessage('Propiedad creada. Quedó pendiente hasta que un administrador la apruebe.');
      setShowModal(false);
      setFormData(valoresIniciales(tiposAlojamiento, ciudades, politicas));

      const propsRes = await axiosClient.get('/alojamientos/mis-publicaciones');
      setProperties(propsRes.data);
    } catch (err) {
      console.error('Error al crear:', err.response?.status, err.response?.data);
      setError(mensajeDeError(err, 'No se pudo registrar la propiedad.'));
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status?.toUpperCase()) {
      case 'PUBLICADO':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'CONFIRMADA':
        return 'bg-teal-50 text-teal-700 border-teal-200';
      case 'COMPLETADA':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'PENDIENTE':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'SUSPENDIDO':
        return 'bg-orange-50 text-orange-700 border-orange-200';
      case 'CANCELADA':
        return 'bg-red-50 text-red-700 border-red-200';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  const textoEstado = (status) => {
    if (status === 'PENDIENTE') return 'Esperando aprobación del administrador';
    if (status === 'SUSPENDIDO') return 'Publicación suspendida';
    return 'Publicación activa';
  };

  const nombreDe = (lista, id) => lista.find((x) => x.id === id)?.nombre;
  const tituloDe = (id) => properties.find((p) => p.id === id)?.titulo || `Alojamiento #${id}`;

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center">
        <p className="text-gray-500 font-medium animate-pulse">Cargando datos de la plataforma...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900">Panel de Anfitrión</h1>
          <p className="text-sm text-gray-500 mt-1">
            Administra tus publicaciones y revisa las reservas de tus huéspedes.
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center justify-center gap-2 bg-rose-600 hover:bg-rose-700 text-white font-bold px-5 py-2.5 rounded-xl shadow-xs transition-colors cursor-pointer text-sm"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
          </svg>
          Publicar Nueva Propiedad
        </button>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-xl border border-red-100 font-medium mb-6 text-center text-sm">
          {error}
        </div>
      )}
      {message && (
        <div className="bg-emerald-50 text-emerald-600 p-4 rounded-xl border border-emerald-100 font-medium mb-6 text-center text-sm">
          {message}
        </div>
      )}

      <div className="flex border-b border-gray-200 mb-8">
        <button
          onClick={() => setActiveTab('properties')}
          className={`pb-4 px-4 font-bold text-sm transition-all cursor-pointer border-b-2 ${
            activeTab === 'properties'
              ? 'border-rose-600 text-rose-600'
              : 'border-transparent text-gray-500 hover:text-gray-800'
          }`}
        >
          Mis Propiedades ({properties.length})
        </button>
        <button
          onClick={() => setActiveTab('reservations')}
          className={`pb-4 px-4 font-bold text-sm transition-all cursor-pointer border-b-2 ${
            activeTab === 'reservations'
              ? 'border-rose-600 text-rose-600'
              : 'border-transparent text-gray-500 hover:text-gray-800'
          }`}
        >
          Reservas Recibidas ({reservations.length})
        </button>
      </div>

      {activeTab === 'properties' &&
        (properties.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-2xl border border-gray-100">
            <p className="text-gray-600 font-medium text-sm">Aún no has publicado ningún alojamiento.</p>
            <button
              onClick={() => setShowModal(true)}
              className="mt-3 text-xs font-bold text-rose-600 hover:underline cursor-pointer"
            >
              Publicar la primera propiedad ahora
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {properties.map((prop) => {
              const status = prop.estadoPublicacion || 'PENDIENTE';
              return (
                <div
                  key={prop.id}
                  className="bg-white rounded-2xl border border-gray-100 shadow-xs hover:shadow-md transition-shadow p-6 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex justify-between items-start gap-2 mb-3">
                      <h3 className="font-bold text-gray-900 text-lg line-clamp-1">{prop.titulo}</h3>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase ${getStatusBadge(status)}`}
                      >
                        {status}
                      </span>
                    </div>

                    <div className="space-y-1.5 text-xs text-gray-600 mb-6">
                      <p>
                        <strong className="text-gray-800">Tipo:</strong>{' '}
                        {nombreDe(tiposAlojamiento, prop.tipoId) || '-'}
                      </p>
                      <p>
                        <strong className="text-gray-800">Ciudad:</strong>{' '}
                        {nombreDe(ciudades, prop.ciudadId) || '-'}
                      </p>
                      <p>
                        <strong className="text-gray-800">Cancelación:</strong>{' '}
                        {nombreDe(politicas, prop.politicaId) || '-'}
                      </p>
                      <p>
                        <strong className="text-gray-800">Capacidad Máxima:</strong> {prop.capacidadMax} personas
                      </p>
                      <p>
                        <strong className="text-gray-800">Estadía Mínima:</strong> {prop.estadiaMinima || 1}{' '}
                        noche(s)
                      </p>
                      <p className="text-base font-extrabold text-gray-900 pt-2 border-t border-gray-100">
                        ${Number(prop.precioBaseNoche).toLocaleString('es-CL')}{' '}
                        <span className="text-xs font-normal text-gray-500">/ noche</span>
                      </p>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-gray-50 text-right">
                    <span className="text-[11px] text-gray-400 italic">{textoEstado(status)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        ))}

      {activeTab === 'reservations' &&
        (reservations.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-2xl border border-gray-100">
            <p className="text-gray-600 font-medium text-sm">No has recibido reservas por el momento.</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 text-[11px] font-bold text-gray-500 uppercase tracking-wider border-b border-gray-100">
                    <th className="p-4">Alojamiento</th>
                    <th className="p-4">Huésped</th>
                    <th className="p-4">Fechas</th>
                    <th className="p-4">Personas</th>
                    <th className="p-4">Monto Total</th>
                    <th className="p-4">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-xs text-gray-700">
                  {reservations.map((res) => (
                    <tr key={res.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="p-4 font-bold text-gray-900">{tituloDe(res.alojamientoId)}</td>
                      <td className="p-4 text-gray-600">Huésped #{res.huespedId}</td>
                      <td className="p-4 text-gray-600">
                        {formatearFecha(res.fechaCheckin)} al {formatearFecha(res.fechaCheckout)}
                      </td>
                      <td className="p-4 text-gray-600">{res.numHuespedes} huéspedes</td>
                      <td className="p-4 font-bold text-gray-900">
                        ${Number(res.total || 0).toLocaleString('es-CL')}
                      </td>
                      <td className="p-4">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold border uppercase ${getStatusBadge(res.estado)}`}
                        >
                          {res.estado}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))}

      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-gray-100 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900">Publicar Nueva Propiedad</h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600 font-bold text-lg cursor-pointer"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleCreateProperty} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Título de la Publicación
                </label>
                <input
                  type="text"
                  name="titulo"
                  placeholder="Ej. Cabaña Rústica con Tinaja"
                  value={formData.titulo}
                  onChange={handleInputChange}
                  required
                  maxLength={150}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-rose-500 outline-none text-xs text-gray-900"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Tipo</label>
                  <select
                    name="tipoId"
                    value={formData.tipoId}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-rose-500 outline-none text-xs text-gray-900 bg-white"
                  >
                    {tiposAlojamiento.map((tipo) => (
                      <option key={tipo.id} value={tipo.id}>
                        {tipo.nombre}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Ciudad</label>
                  <select
                    name="ciudadId"
                    value={formData.ciudadId}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-rose-500 outline-none text-xs text-gray-900 bg-white"
                  >
                    {ciudades.map((ciudad) => (
                      <option key={ciudad.id} value={ciudad.id}>
                        {ciudad.nombre}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Política</label>
                  <select
                    name="politicaId"
                    value={formData.politicaId}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-rose-500 outline-none text-xs text-gray-900 bg-white"
                  >
                    {politicas.map((pol) => (
                      <option key={pol.id} value={pol.id}>
                        {pol.nombre}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                    Capacidad Máx.
                  </label>
                  <input
                    type="number"
                    name="capacidadMax"
                    min="1"
                    value={formData.capacidadMax}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-rose-500 outline-none text-xs text-gray-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                    Precio/Noche ($)
                  </label>
                  <input
                    type="number"
                    name="precioBaseNoche"
                    min="1"
                    placeholder="50000"
                    value={formData.precioBaseNoche}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-rose-500 outline-none text-xs text-gray-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                    Estadía Mín.
                  </label>
                  <input
                    type="number"
                    name="estadiaMinima"
                    min="1"
                    value={formData.estadiaMinima}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-rose-500 outline-none text-xs text-gray-900"
                  />
                </div>
              </div>

              <p className="text-[11px] text-gray-500">
                Tu propiedad quedará en estado pendiente hasta que un administrador la apruebe.
              </p>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-xl transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-xs transition-colors cursor-pointer disabled:bg-gray-300"
                >
                  {submitting ? 'Creando...' : 'Crear Propiedad'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}