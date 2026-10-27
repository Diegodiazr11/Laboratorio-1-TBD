import { useState, useEffect } from 'react';
import axiosClient from '../api/Axios';

const mensajeDeError = (err, porDefecto) => {
  const data = err.response?.data;
  if (typeof data === 'string' && data) return data;
  return data?.message || data?.error || porDefecto;
};

const formatearFecha = (str) =>
  str ? new Date(`${str}T00:00:00`).toLocaleDateString('es-CL') : '-';

export default function MyReservations() {
  const [reservations, setReservations] = useState([]);
  const [alojamientos, setAlojamientos] = useState({});
  const [ciudades, setCiudades] = useState([]);
  const [tipos, setTipos] = useState([]);
  const [reservasConResena, setReservasConResena] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const [selectedRes, setSelectedRes] = useState(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');

  useEffect(() => {
    cargarTodo();
  }, []);

  const cargarTodo = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await axiosClient.get('/reservas/mias');
      setReservations(response.data);
    } catch (err) {
      console.error('Error al cargar reservas:', err.response?.status, err.response?.data);
      setError(mensajeDeError(err, 'Error al cargar tus reservas.'));
      setLoading(false);
      return;
    }

    // Datos para mostrar nombre, ciudad y tipo (la reserva solo trae alojamientoId)
    try {
      const [alojRes, ciudadesRes, tiposRes] = await Promise.all([
        axiosClient.get('/alojamientos'),
        axiosClient.get('/ciudades'),
        axiosClient.get('/tipos-alojamiento'),
      ]);
      setAlojamientos(Object.fromEntries(alojRes.data.map((a) => [a.id, a])));
      setCiudades(ciudadesRes.data);
      setTipos(tiposRes.data);
    } catch (err) {
      console.error('Error al cargar alojamientos:', err.response?.status);
    }

    // Reseñas ya publicadas, para no ofrecer reseñar dos veces la misma reserva
    try {
      const resenasRes = await axiosClient.get('/resenas/misresenas');
      setReservasConResena(resenasRes.data.map((r) => r.reservaId));
    } catch {
      setReservasConResena([]);
    }

    setLoading(false);
  };

  const recargarReservas = async () => {
    try {
      const response = await axiosClient.get('/reservas/mias');
      setReservations(response.data);
    } catch (err) {
      setError(mensajeDeError(err, 'Error al actualizar tus reservas.'));
    }
  };

  const handleCancel = async (reservationId) => {
    if (!window.confirm('¿Estás seguro de que deseas cancelar esta reserva?')) return;

    setError('');
    setMessage('');

    try {
      const response = await axiosClient.post(`/reservas/${reservationId}/cancelar`);
      const data = response.data;
      setMessage(
        (typeof data === 'string' ? data : data?.message) || 'Reserva cancelada correctamente.'
      );
      recargarReservas();
    } catch (err) {
      console.error('Error al cancelar:', err.response?.status, err.response?.data);
      setError(mensajeDeError(err, 'Error al cancelar la reserva.'));
    }
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!selectedRes) return;

    setError('');
    setMessage('');

    try {
      // SUPUESTO: campos según la tabla "resena"; confirma el DTO de tu ResenaController
      await axiosClient.post('/resenas', {
        reservaId: selectedRes.id,
        calificacion: Number(rating),
        comentario: comment.trim(),
      });

      setMessage('¡Reseña publicada con éxito!');
      setReservasConResena((prev) => [...prev, selectedRes.id]);
      setSelectedRes(null);
      setComment('');
      setRating(5);
    } catch (err) {
      console.error('Error al publicar reseña:', err.response?.status, err.response?.data);
      setError(mensajeDeError(err, 'Error al publicar la reseña.'));
    }
  };

  const getStatusBadge = (status) => {
    switch (status?.toUpperCase()) {
      case 'CONFIRMADA':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'PENDIENTE':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'COMPLETADA':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'CANCELADA':
        return 'bg-red-50 text-red-700 border-red-200';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center">
        <p className="text-gray-500 font-medium animate-pulse">Cargando tus reservas...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-extrabold text-gray-900 mb-8">Mis Reservas</h1>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-xl border border-red-100 font-medium mb-6 text-center">
          {error}
        </div>
      )}
      {message && (
        <div className="bg-emerald-50 text-emerald-600 p-4 rounded-xl border border-emerald-100 font-medium mb-6 text-center">
          {message}
        </div>
      )}

      {reservations.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-2xl border border-gray-100">
          <p className="text-gray-600 font-medium">No tienes reservas registradas.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {reservations.map((res) => {
            const currentStatus = res.estado;
            const aloj = alojamientos[res.alojamientoId];
            const ciudad = ciudades.find((c) => c.id === aloj?.ciudadId)?.nombre;
            const tipo = tipos.find((t) => t.id === aloj?.tipoId)?.nombre;
            const yaTieneResena = reservasConResena.includes(res.id);

            return (
              <div
                key={res.id}
                className="bg-white rounded-2xl border border-gray-100 shadow-xs hover:shadow-md transition-shadow p-6 flex flex-col justify-between"
              >
                <div>
                  <div className="flex justify-between items-start gap-2 mb-1">
                    <h3 className="font-bold text-gray-900 text-lg line-clamp-1">
                      {aloj?.titulo || `Alojamiento #${res.alojamientoId}`}
                    </h3>
                    <span
                      className={`text-xs font-bold px-2.5 py-1 rounded-full border uppercase ${getStatusBadge(currentStatus)}`}
                    >
                      {currentStatus}
                    </span>
                  </div>

                  {tipo && (
                    <p className="text-xs text-rose-600 font-semibold mb-4 uppercase tracking-wide">{tipo}</p>
                  )}

                  <div className="space-y-1.5 text-sm text-gray-600 mb-6">
                    <p className="flex items-center gap-1 font-medium text-gray-800">
                      📍 {ciudad || 'Ciudad no disponible'}
                    </p>
                    <p className="flex flex-wrap items-center gap-x-2">
                      <span>
                        <strong className="font-medium text-gray-800">Desde:</strong>{' '}
                        {formatearFecha(res.fechaCheckin)}
                      </span>
                      <span>
                        <strong className="font-medium text-gray-800">Hasta:</strong>{' '}
                        {formatearFecha(res.fechaCheckout)}
                      </span>
                    </p>
                    <p>Huéspedes: {res.numHuespedes}</p>
                    <p className="text-base font-extrabold text-gray-900 pt-2 border-t border-gray-100">
                      Total: ${Number(res.total || 0).toLocaleString('es-CL')}
                    </p>
                  </div>
                </div>

                <div className="pt-2 border-t border-gray-50 flex gap-2">
                  {(currentStatus === 'CONFIRMADA' || currentStatus === 'PENDIENTE') && (
                    <button
                      className="w-full bg-red-50 hover:bg-red-100 text-red-600 font-semibold py-2 px-4 rounded-xl text-sm transition-colors cursor-pointer"
                      onClick={() => handleCancel(res.id)}
                    >
                      Cancelar Reserva
                    </button>
                  )}

                  {currentStatus === 'COMPLETADA' && !yaTieneResena && (
                    <button
                      className="w-full bg-rose-600 hover:bg-rose-700 text-white font-semibold py-2 px-4 rounded-xl text-sm transition-colors cursor-pointer shadow-xs"
                      onClick={() => setSelectedRes(res)}
                    >
                      Dejar Reseña
                    </button>
                  )}

                  {currentStatus === 'COMPLETADA' && yaTieneResena && (
                    <p className="w-full text-center text-xs text-gray-400 italic py-2">
                      Ya dejaste una reseña
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {selectedRes && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-gray-100">
            <h2 className="text-xl font-bold text-gray-900 mb-1">Dejar Reseña</h2>
            <p className="text-xs text-gray-500 mb-4">
              Para:{' '}
              <strong className="text-gray-800">
                {alojamientos[selectedRes.alojamientoId]?.titulo || 'este alojamiento'}
              </strong>
            </p>

            <form onSubmit={handleReviewSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Calificación:
                </label>
                <select
                  value={rating}
                  onChange={(e) => setRating(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-rose-500 outline-none transition text-sm text-gray-900 bg-white"
                >
                  <option value="5">5 ⭐ - Excelente</option>
                  <option value="4">4 ⭐ - Muy Bueno</option>
                  <option value="3">3 ⭐ - Regular</option>
                  <option value="2">2 ⭐ - Malo</option>
                  <option value="1">1 ⭐ - Pésimo</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Comentario:
                </label>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  required
                  rows="4"
                  placeholder="Cuenta tu experiencia..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-rose-500 outline-none transition text-sm text-gray-900 resize-none"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedRes(null)}
                  className="px-4 py-2 text-sm font-semibold text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-xl transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-xs transition-colors cursor-pointer"
                >
                  Enviar Reseña
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}