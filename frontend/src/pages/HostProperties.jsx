import { useState, useEffect } from 'react';
import axiosClient from '../api/Axios';

export default function HostProperties() {
  const [activeTab, setActiveTab] = useState('properties');
  const [properties, setProperties] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'Cabaña',
    city: '',
    address: '',
    capacity: 2,
    price_per_night: '',
    cancellation_policy: 'Flexible: Cancelación gratuita hasta 48 hrs antes.',
  });

  useEffect(() => {
    fetchHostData();
  }, []);

  const fetchHostData = async () => {
    setLoading(true);
    setError('');
    try {
      const [propsRes, resRes] = await Promise.all([
        axiosClient.get('/anfitrion/propiedades'),
        axiosClient.get('/anfitrion/reservas'),
      ]);
      setProperties(propsRes.data);
      setReservations(resRes.data);
    } catch (err) {
      setError(
        err.response?.data?.message || 'Error al cargar la información del anfitrión.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCreateProperty = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    setMessage('');

    try {
      await axiosClient.post('/alojamientos', formData);
      setMessage('Propiedad enviada a revisión con éxito.');
      setShowModal(false);
      resetForm();
      fetchHostData();
    } catch (err) {
      setError(
        err.response?.data?.message || 'No se pudo registrar la propiedad.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      type: 'Cabaña',
      city: '',
      address: '',
      capacity: 2,
      price_per_night: '',
      cancellation_policy: 'Flexible: Cancelación gratuita hasta 48 hrs antes.',
    });
  };

  const getStatusBadge = (status) => {
    switch (status?.toUpperCase()) {
      case 'APROBADA':
      case 'CONFIRMADA':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'PENDIENTE':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'RECHAZADA':
      case 'CANCELADA':
        return 'bg-red-50 text-red-700 border-red-200';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center">
        <p className="text-gray-500 font-medium animate-pulse">Cargando panel de anfitrión...</p>
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

      {activeTab === 'properties' && (
        properties.length === 0 ? (
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
              const status = prop.status || prop.estado || 'PENDIENTE';
              return (
                <div
                  key={prop.id}
                  className="bg-white rounded-2xl border border-gray-100 shadow-xs hover:shadow-md transition-shadow p-6 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex justify-between items-start gap-2 mb-3">
                      <h3 className="font-bold text-gray-900 text-lg line-clamp-1">
                        {prop.title || prop.nombre}
                      </h3>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase ${getStatusBadge(status)}`}>
                        {status}
                      </span>
                    </div>

                    <div className="space-y-1.5 text-xs text-gray-600 mb-6">
                      <p><strong className="text-gray-800">Tipo:</strong> {prop.type || prop.tipo}</p>
                      <p><strong className="text-gray-800">Ubicación:</strong> {prop.city || prop.ciudad}</p>
                      <p><strong className="text-gray-800">Dirección:</strong> {prop.address || prop.direccion || 'No especificada'}</p>
                      <p><strong className="text-gray-800">Capacidad:</strong> {prop.capacity || prop.capacidad} personas</p>
                      <p className="text-base font-extrabold text-gray-900 pt-2 border-t border-gray-100">
                        ${prop.price_per_night || prop.precio_noche} <span className="text-xs font-normal text-gray-500">/ noche</span>
                      </p>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-gray-50 text-right">
                    <span className="text-[11px] text-gray-400 italic">
                      {status === 'PENDIENTE' ? 'Esperando aprobación del administrador' : 'Publicación activa'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )
      )}

      {activeTab === 'reservations' && (
        reservations.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-2xl border border-gray-100">
            <p className="text-gray-600 font-medium text-sm">No has recibido reservas por el momento.</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 text-[11px] font-bold text-gray-500 uppercase tracking-wider border-b border-gray-100">
                    <th className="p-4">Propiedad</th>
                    <th className="p-4">Huésped</th>
                    <th className="p-4">Fechas</th>
                    <th className="p-4">Personas</th>
                    <th className="p-4">Monto Total</th>
                    <th className="p-4">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-xs text-gray-700">
                  {reservations.map((res) => {
                    const status = res.status || res.estado || 'CONFIRMADA';
                    return (
                      <tr key={res.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="p-4 font-bold text-gray-900">
                          {res.accommodation_name || res.alojamiento_nombre}
                        </td>
                        <td className="p-4">
                          <span className="font-medium text-gray-900 block">
                            {res.guest_name || res.huesped_nombre}
                          </span>
                          <span className="text-gray-400">
                            {res.guest_email || res.huesped_email}
                          </span>
                        </td>
                        <td className="p-4 text-gray-600">
                          {res.start_date || res.fecha_inicio} al {res.end_date || res.fecha_fin}
                        </td>
                        <td className="p-4 text-gray-600">
                          {res.guests_count || res.huespedes_cantidad} huéspedes
                        </td>
                        <td className="p-4 font-bold text-gray-900">
                          ${res.total_price || res.precio_total}
                        </td>
                        <td className="p-4">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border uppercase ${getStatusBadge(status)}`}>
                            {status}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )
      )}

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
                  name="title"
                  placeholder="Ej. Cabaña Rústica con Tinaja"
                  value={formData.title}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-rose-500 outline-none text-xs text-gray-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                    Tipo de Inmueble
                  </label>
                  <select
                    name="type"
                    value={formData.type}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-rose-500 outline-none text-xs text-gray-900 bg-white"
                  >
                    <option value="Cabaña">Cabaña</option>
                    <option value="Departamento">Departamento</option>
                    <option value="Casa">Casa</option>
                    <option value="Habitación">Habitación</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                    Ciudad / Destino
                  </label>
                  <input
                    type="text"
                    name="city"
                    placeholder="Ej. Pucón"
                    value={formData.city}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-rose-500 outline-none text-xs text-gray-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Dirección
                </label>
                <input
                  type="text"
                  name="address"
                  placeholder="Ej. Av. Principal 123"
                  value={formData.address}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-rose-500 outline-none text-xs text-gray-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                    Capacidad Máxima
                  </label>
                  <input
                    type="number"
                    name="capacity"
                    min="1"
                    value={formData.capacity}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-rose-500 outline-none text-xs text-gray-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                    Precio por Noche ($)
                  </label>
                  <input
                    type="number"
                    name="price_per_night"
                    placeholder="50000"
                    value={formData.price_per_night}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-rose-500 outline-none text-xs text-gray-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Descripción Corta
                </label>
                <textarea
                  name="description"
                  rows="3"
                  placeholder="Describe los servicios y atractivos de la propiedad..."
                  value={formData.description}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-rose-500 outline-none text-xs text-gray-900 resize-none"
                />
              </div>

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
                  {submitting ? 'Guardando...' : 'Enviar a Revisión'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}