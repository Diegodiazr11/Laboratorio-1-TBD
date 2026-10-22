import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axiosClient from '../api/Axios';
import { useAuth } from '../context/AuthContext';

export default function AccommodationDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [accommodation, setAccommodation] = useState(null);
  const [reviewsData, setReviewsData] = useState({ average_rating: 0, reviews: [] });
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [guestsCount, setGuestsCount] = useState(1);

  const [loading, setLoading] = useState(true);
  const [reserving, setReserving] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchDetailAndReviews();
  }, [id]);

  const fetchDetailAndReviews = async () => {
    setLoading(true);
    try {
      const detailRes = await axiosClient.get(`/alojamientos/${id}`);
      setAccommodation(detailRes.data);

      const reviewsRes = await axiosClient.get(`/alojamientos/${id}/resenas`);
      setReviewsData(reviewsRes.data);
    } catch (err) {
      console.warn('Backend no disponible. Cargando datos de prueba (Mock)...');
      
      // Datos Mock para probar el diseño sin backend
      setAccommodation({
        id: id,
        title: 'Cabaña Exclusiva con Jacuzzi y Vista a la Montaña',
        city: 'Pucón',
        description: 'Hermosa cabaña completamente equipada en un entorno natural privilegiado. Cuenta con tinaja caliente privada, chimenea a leña, terraza con parrilla y acceso directo a senderos.',
        type: 'Cabaña',
        capacity: 4,
        price_per_night: 65000,
        cancellation_policy: 'Flexible: Cancelación gratuita hasta 48 horas antes del check-in.',
      });

      setReviewsData({
        average_rating: 4.8,
        reviews: [
          { id: 1, user_name: 'Camila Torres', rating: 5, comment: 'Increíble lugar para descansar. La tinaja caliente en la noche es genial.', created_at: '2026-02-14' },
          { id: 2, user_name: 'Matías Silva', rating: 4, comment: 'Muy bien equipado y limpio. La vista es insuperable.', created_at: '2026-01-28' },
        ],
      });
    } finally {
      setLoading(false);
    }
  };

  // Cálculo de noches estadas
  const calculateNights = () => {
    if (!startDate || !endDate) return 0;
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = end - start;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  };

  const nights = calculateNights();
  const pricePerNight = accommodation?.price_per_night || accommodation?.precio_noche || 0;
  const totalPrice = nights * pricePerNight;

  const handleBooking = async (e) => {
    e.preventDefault();
    if (!user) {
      navigate('/login');
      return;
    }

    if (nights <= 0) {
      setError('La fecha de salida debe ser posterior a la fecha de llegada.');
      return;
    }

    setReserving(true);
    setError('');
    setMessage('');

    try {
      await axiosClient.post('/reservas/confirmar', {
        accommodation_id: id,
        start_date: startDate,
        end_date: endDate,
        guests_count: guestsCount,
      });

      setMessage('¡Reserva confirmada con éxito!');
      setTimeout(() => navigate('/mis-reservas'), 2000);
    } catch (err) {
      setError(
        err.response?.data?.message || 'Error al procesar la reserva.'
      );
    } finally {
      setReserving(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center">
        <p className="text-gray-500 font-medium animate-pulse">Cargando información del alojamiento...</p>
      </div>
    );
  }

  if (!accommodation) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center">
        <p className="text-red-600 font-medium">No se encontró la información de este alojamiento.</p>
        <button
          onClick={() => navigate('/')}
          className="mt-4 px-4 py-2 bg-gray-900 text-white text-sm font-semibold rounded-lg"
        >
          Volver al buscador
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <button
        onClick={() => navigate('/')}
        className="inline-flex items-center gap-2 text-sm font-semibold text-gray-600 hover:text-gray-900 mb-6 transition-colors cursor-pointer"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
        Volver al buscador
      </button>

      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 mb-2">
          {accommodation.title || accommodation.nombre}
        </h1>
        <div className="flex items-center gap-4 text-sm text-gray-600">
          <span className="flex items-center gap-1 font-medium">
            <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            {accommodation.city || accommodation.ciudad}
          </span>
          <span>•</span>
          <span className="flex items-center gap-1 font-semibold text-gray-900">
            <svg className="w-4 h-4 text-amber-500 fill-amber-500" viewBox="0 0 24 24">
              <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
            </svg>
            {reviewsData.average_rating ? Number(reviewsData.average_rating).toFixed(1) : 'Nuevo'}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-10 rounded-2xl overflow-hidden bg-gray-100 h-64 sm:h-80 md:h-96">
        <div className="md:col-span-2 bg-gray-200 flex items-center justify-center text-gray-400 font-medium">
          Fotografía Principal
        </div>
        <div className="hidden md:grid grid-rows-2 gap-3">
          <div className="bg-gray-200 flex items-center justify-center text-gray-400 text-xs font-medium">
            Vista Interior
          </div>
          <div className="bg-gray-200 flex items-center justify-center text-gray-400 text-xs font-medium">
            Vista Exterior
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        
        <div className="lg:col-span-2 space-y-8">
          
          <section className="bg-white p-6 rounded-2xl border border-gray-100 shadow-xs space-y-6">
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-3">Acerca de este alojamiento</h2>
              <p className="text-gray-600 leading-relaxed text-sm">
                {accommodation.description || accommodation.descripcion}
              </p>
            </div>

            <hr className="border-gray-100" />

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
              <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                <p className="text-gray-500 font-medium">Tipo</p>
                <p className="font-bold text-gray-900 text-sm mt-0.5">{accommodation.type || accommodation.tipo}</p>
              </div>
              <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                <p className="text-gray-500 font-medium">Capacidad</p>
                <p className="font-bold text-gray-900 text-sm mt-0.5">{accommodation.capacity || accommodation.capacidad} personas</p>
              </div>
              <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                <p className="text-gray-500 font-medium">Precio / Noche</p>
                <p className="font-bold text-gray-900 text-sm mt-0.5">${pricePerNight}</p>
              </div>
              <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                <p className="text-gray-500 font-medium">Cancelación</p>
                <p className="font-bold text-gray-900 text-sm mt-0.5">Flexible</p>
              </div>
            </div>

            <div className="p-4 bg-rose-50/50 rounded-xl border border-rose-100 text-xs text-rose-800">
              <span className="font-bold">Política de cancelación:</span> {accommodation.cancellation_policy || accommodation.politica_cancelacion}
            </div>
          </section>

          <section className="bg-white p-6 rounded-2xl border border-gray-100 shadow-xs">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">Reseñas de Huéspedes</h2>
              <div className="flex items-center gap-1.5 text-sm font-bold text-gray-900">
                <svg className="w-5 h-5 text-amber-500 fill-amber-500" viewBox="0 0 24 24">
                  <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                </svg>
                <span>{reviewsData.average_rating ? Number(reviewsData.average_rating).toFixed(1) : 'N/A'}</span>
              </div>
            </div>

            {reviewsData.reviews && reviewsData.reviews.length > 0 ? (
              <div className="space-y-4">
                {reviewsData.reviews.map((rev) => (
                  <div key={rev.id} className="p-4 rounded-xl border border-gray-100 bg-gray-50/50 space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-gray-900 text-sm">{rev.user_name || rev.usuario}</span>
                      <div className="flex items-center gap-1 text-xs font-bold text-amber-600">
                        <svg className="w-3.5 h-3.5 fill-amber-500" viewBox="0 0 24 24">
                          <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                        </svg>
                        <span>{rev.rating} / 5</span>
                      </div>
                    </div>
                    <p className="text-xs text-gray-600">{rev.comment || rev.comentario}</p>
                    <p className="text-[10px] text-gray-400">
                      {new Date(rev.created_at || rev.fecha).toLocaleDateString()}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-gray-500 italic">Este alojamiento aún no cuenta con reseñas registradas.</p>
            )}
          </section>
        </div>

        <div className="lg:col-span-1">
          <div className="sticky top-20 bg-white p-6 rounded-2xl border border-gray-200 shadow-md">
            
            <div className="flex justify-between items-baseline mb-6">
              <div>
                <span className="text-2xl font-extrabold text-gray-900">${pricePerNight}</span>
                <span className="text-xs text-gray-500"> / noche</span>
              </div>
            </div>

            {error && (
              <div className="bg-red-50 text-red-600 p-3 rounded-xl text-xs font-medium border border-red-100 mb-4 text-center">
                {error}
              </div>
            )}
            {message && (
              <div className="bg-emerald-50 text-emerald-600 p-3 rounded-xl text-xs font-medium border border-emerald-100 mb-4 text-center">
                {message}
              </div>
            )}

            <form onSubmit={handleBooking} className="space-y-4">
              <div className="grid grid-cols-2 gap-2 border border-gray-200 rounded-xl p-2 bg-gray-50">
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">
                    Llegada
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    required
                    className="w-full text-xs bg-transparent outline-none text-gray-900 font-medium"
                  />
                </div>
                <div className="border-l border-gray-200 pl-2">
                  <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">
                    Salida
                  </label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    required
                    className="w-full text-xs bg-transparent outline-none text-gray-900 font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Huéspedes
                </label>
                <input
                  type="number"
                  min="1"
                  max={accommodation.capacity || accommodation.capacidad}
                  value={guestsCount}
                  onChange={(e) => setGuestsCount(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-rose-500 outline-none transition text-xs text-gray-900"
                />
              </div>

              {nights > 0 && (
                <div className="pt-4 border-t border-gray-100 space-y-2 text-xs">
                  <div className="flex justify-between text-gray-600">
                    <span>${pricePerNight} x {nights} noches</span>
                    <span>${totalPrice}</span>
                  </div>
                  <div className="flex justify-between font-extrabold text-gray-900 text-sm pt-2 border-t border-gray-100">
                    <span>Total a pagar</span>
                    <span>${totalPrice}</span>
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={reserving}
                className="w-full bg-rose-600 hover:bg-rose-700 disabled:bg-rose-400 text-white font-bold py-3 rounded-xl shadow-xs transition-colors cursor-pointer text-sm mt-2"
              >
                {reserving
                  ? 'Procesando...'
                  : user
                  ? 'Confirmar Reserva'
                  : 'Iniciar Sesión para Reservar'}
              </button>
            </form>

          </div>
        </div>

      </div>
    </div>
  );
}