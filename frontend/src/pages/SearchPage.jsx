import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axiosClient from '../api/Axios'; 

export default function SearchPage() {
  const [city, setCity] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [guests, setGuests] = useState(1);

  const [accommodations, setAccommodations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSearch = async (e) => {
    if (e) e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await axiosClient.get('/alojamientos/search', {
        params: {
          city: city || undefined,
          startDate: startDate || undefined,
          endDate: endDate || undefined,
          guests: guests || undefined,
        },
      });

      setAccommodations(response.data);
    } catch (err) {
      console.error('Error al consultar la API:', err);
      setError('Ocurrió un error al realizar la búsqueda');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    handleSearch();
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-extrabold text-gray-900 text-center mb-8">
        Encuentra tu próximo alojamiento
      </h1>

      <form 
        onSubmit={handleSearch} 
        className="bg-white p-6 rounded-2xl shadow-md border border-gray-100 grid grid-cols-1 md:grid-cols-4 gap-4 mb-10 items-end"
      >
        <div className="flex flex-col">
          <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
            Ciudad
          </label>
          <input
            type="text"
            placeholder="Ej. Santiago, Viña del Mar"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-rose-500 outline-none transition text-sm text-gray-900"
          />
        </div>

        <div className="flex flex-col">
          <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
            Fecha de llegada
          </label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-rose-500 outline-none transition text-sm text-gray-900"
          />
        </div>

        <div className="flex flex-col">
          <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
            Fecha de salida
          </label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-rose-500 outline-none transition text-sm text-gray-900"
          />
        </div>

        <div className="flex flex-col">
          <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
            Huéspedes
          </label>
          <div className="flex gap-2">
            <input
              type="number"
              min="1"
              value={guests}
              onChange={(e) => setGuests(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-rose-500 outline-none transition text-sm text-gray-900"
            />
            <button 
              type="submit"
              className="bg-rose-600 hover:bg-rose-700 text-white font-bold py-2 px-5 rounded-lg shadow-xs transition-colors cursor-pointer text-sm whitespace-nowrap"
            >
              Buscar
            </button>
          </div>
        </div>
      </form>

      {loading && (
        <div className="text-center py-12">
          <p className="text-gray-500 font-medium animate-pulse">
            Buscando alojamientos en el servidor...
          </p>
        </div>
      )}

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-xl text-center mb-6 font-medium border border-red-100">
          {error}
        </div>
      )}

      {!loading && accommodations.length === 0 && (
        <div className="text-center py-12 bg-gray-50 rounded-2xl border border-gray-100">
          <p className="text-gray-600 font-medium">
            No se encontraron alojamientos con los criterios seleccionados.
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {accommodations.map((item) => (
          <div 
            key={item.id} 
            className="bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-xs hover:shadow-md transition-shadow duration-200 flex flex-col"
          >

            <div className="p-5 flex-1 flex flex-col justify-between">
              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-1 line-clamp-1">
                  {item.title || item.nombre}
                </h3>
                <p className="text-sm text-gray-500 mb-1">
                  {item.city || item.ciudad}
                </p>
                <p className="text-sm text-gray-500 mb-3">
                  Capacidad: {item.capacity || item.capacidad} personas
                </p>
              </div>

              <div>
                <p className="text-lg font-extrabold text-gray-900 mb-4">
                  ${item.price_per_night || item.precio_noche}{' '}
                  <span className="text-sm font-normal text-gray-500">/ noche</span>
                </p>

                <Link 
                  to={`/alojamiento/${item.id}`} 
                  className="block text-center w-full bg-gray-900 hover:bg-gray-800 text-white font-medium py-2.5 rounded-xl transition-colors text-sm"
                >
                  Ver Detalle y Reservar
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}