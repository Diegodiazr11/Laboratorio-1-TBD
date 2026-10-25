import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axiosClient from '../api/Axios';
import { useAuth } from '../context/AuthContext';
import CalendarioDisponibilidad from '../components/CalendarioDisponibilidad'

const pad = (n) => String(n).padStart(2, '0');

const normalizarFecha = (valor) => {
  if (!valor) return null;
  if (Array.isArray(valor)) return `${valor[0]}-${pad(valor[1])}-${pad(valor[2])}`;
  return String(valor).slice(0, 10);
};

const expandirBloqueo = (b) => {
  const unica = normalizarFecha(b.fecha);
  if (unica) return [unica];

  const inicio = normalizarFecha(b.fechaInicio);
  const fin = normalizarFecha(b.fechaFin);
  if (!inicio || !fin) return [];

  const dias = [];
  const cursor = new Date(`${inicio}T00:00:00`);
  const limite = new Date(`${fin}T00:00:00`);
  while (cursor <= limite) {
    dias.push(`${cursor.getFullYear()}-${pad(cursor.getMonth() + 1)}-${pad(cursor.getDate())}`);
    cursor.setDate(cursor.getDate() + 1);
  }
  return dias;
};

const aFecha = (str) => new Date(`${str}T00:00:00`);

const mensajeDeError = (err, porDefecto) => {
  const data = err.response?.data;
  if (typeof data === 'string' && data) return data;
  return data?.message || data?.error || porDefecto;
};

export default function AccommodationDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [accommodation, setAccommodation] = useState(null);
  const [ciudades, setCiudades] = useState([]);
  const [tipos, setTipos] = useState([]);
  const [politicas, setPoliticas] = useState([]);
  const [promedio, setPromedio] = useState(null);
  const [resenas, setResenas] = useState([]);
  const [fechasBloqueadas, setFechasBloqueadas] = useState(new Set());
  const [calendarioError, setCalendarioError] = useState(false);

  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [guestsCount, setGuestsCount] = useState(1);

  const [loading, setLoading] = useState(true);
  const [reserving, setReserving] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    cargarDatos();
  }, [id]);

  const cargarDatos = async () => {
    setLoading(true);
    setLoadError('');
    try {
      const [alojRes, ciudadesRes, tiposRes] = await Promise.all([
        axiosClient.get('/alojamientos'),
        axiosClient.get('/ciudades'),
        axiosClient.get('/tipos-alojamiento'),
      ]);

      const encontrado = alojRes.data.find((a) => a.id === Number(id));
      setAccommodation(encontrado || null);
      setCiudades(ciudadesRes.data);
      setTipos(tiposRes.data);

      try {
        const politicasRes = await axiosClient.get('/politicas-cancelacion');
        setPoliticas(politicasRes.data);
      } catch {
        setPoliticas([]);
      }

      try {
        const calendarioRes = await axiosClient.get(`/alojamientos/${id}/calendario`);
        setFechasBloqueadas(new Set(calendarioRes.data.flatMap(expandirBloqueo)));
        setCalendarioError(false);
      } catch (err) {
        console.error('Error al cargar el calendario:', err.response?.status);
        setFechasBloqueadas(new Set());
        setCalendarioError(true);
      }

      try {
        const resenasRes = await axiosClient.get(`/alojamientos/${id}/resenas`);
        setPromedio(resenasRes.data.calificacionPromedio);
        setResenas(
          (resenasRes.data.historialResenas || []).filter((r) => !r.estado || r.estado === 'VISIBLE')
        );
      } catch {
        setPromedio(null);
        setResenas([]);
      }
    } catch (err) {
      console.error('Error al cargar el alojamiento:', err.response?.status, err.response?.data);
      setLoadError(mensajeDeError(err, 'No se pudo cargar la información del alojamiento.'));
    } finally {
      setLoading(false);
    }
  };

  const nombreCiudad = ciudades.find((c) => c.id === accommodation?.ciudadId)?.nombre;
  const nombreTipo = tipos.find((t) => t.id === accommodation?.tipoId)?.nombre;
  const politica = politicas.find((p) => p.id === accommodation?.politicaId);
  const nombrePolitica = politica?.nombre;

  const nights =
    startDate && endDate
      ? Math.max(0, Math.round((aFecha(endDate) - aFecha(startDate)) / (1000 * 60 * 60 * 24)))
      : 0;
  const pricePerNight = Number(accommodation?.precioBaseNoche || 0);
  const totalEstimado = nights * pricePerNight;
  const formato = (n) => `$${Number(n).toLocaleString('es-CL')}`;
  const hoy = new Date().toISOString().split('T')[0];

  const handleBooking = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (!user) {
      navigate('/login');
      return;
    }
    if (user.rol !== 'HUESPED') {
      setError('Solo los usuarios con rol Huésped pueden reservar.');
      return;
    }
    if (nights <= 0) {
      setError('La fecha de salida debe ser posterior a la fecha de llegada.');
      return;
    }
    if (nights < accommodation.estadiaMinima) {
      setError(`La estadía mínima es de ${accommodation.estadiaMinima} noche(s).`);
      return;
    }
    const noche = aFecha(startDate);
    const salida = aFecha(endDate);
    while (noche < salida) {
      const clave = `${noche.getFullYear()}-${pad(noche.getMonth() + 1)}-${pad(noche.getDate())}`;
      if (fechasBloqueadas.has(clave)) {
        setError('Las fechas elegidas incluyen noches no disponibles. Revisa el calendario.');
        return;
      }
      noche.setDate(noche.getDate() + 1);
    }
    if (Number(guestsCount) > accommodation.capacidadMax) {
      setError(`La capacidad máxima es de ${accommodation.capacidadMax} personas.`);
      return;
    }

    setReserving(true);
    try {
      try {
        const disponibles = await axiosClient.get('/alojamientos/buscar', {
          params: {
            ciudadId: accommodation.ciudadId,
            checkin: startDate,
            checkout: endDate,
            huespedes: Number(guestsCount),
          },
        });
        if (!disponibles.data.some((a) => a.id === accommodation.id)) {
          setError('El alojamiento no está disponible en las fechas elegidas.');
          setReserving(false);
          return;
        }
      } catch (err) {
        console.error('No se pudo verificar la disponibilidad:', err.response?.status);
      }

      await axiosClient.post('/reservas', {
        alojamientoId: accommodation.id,
        fechaCheckin: startDate,
        fechaCheckout: endDate,
        numHuespedes: Number(guestsCount),
      });

      setMessage('¡Reserva creada con éxito!');
      setTimeout(() => navigate('/mis-reservas'), 2000);
    } catch (err) {
      console.error('Error al reservar:', err.response?.status, err.response?.data);
      setError(mensajeDeError(err, 'Error al procesar la reserva.'));
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

  if (loadError || !accommodation) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center">
        <p className="text-red-600 font-medium">
          {loadError || 'No se encontró la información de este alojamiento.'}
        </p>
        <button
          onClick={() => navigate('/')}
          className="mt-4 px-4 py-2 bg-gray-900 text-white text-sm font-semibold rounded-lg cursor-pointer"
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
        <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 mb-2">{accommodation.titulo}</h1>
        <div className="flex items-center gap-4 text-sm text-gray-600">
          <span className="flex items-center gap-1 font-medium">📍 {nombreCiudad || 'Ciudad no disponible'}</span>
          <span>•</span>
          <span className="flex items-center gap-1 font-semibold text-gray-900">
            <svg className="w-4 h-4 text-amber-500 fill-amber-500" viewBox="0 0 24 24">
              <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
            </svg>
            {promedio ? Number(promedio).toFixed(1) : 'Nuevo'}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        <div className="lg:col-span-2 space-y-8">
          <section className="bg-white p-6 rounded-2xl border border-gray-100 shadow-xs space-y-6">
            <h2 className="text-xl font-bold text-gray-900">Información del alojamiento</h2>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
              <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                <p className="text-gray-500 font-medium">Tipo</p>
                <p className="font-bold text-gray-900 text-sm mt-0.5">{nombreTipo || '-'}</p>
              </div>
              <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                <p className="text-gray-500 font-medium">Capacidad</p>
                <p className="font-bold text-gray-900 text-sm mt-0.5">{accommodation.capacidadMax} personas</p>
              </div>
              <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                <p className="text-gray-500 font-medium">Estadía mínima</p>
                <p className="font-bold text-gray-900 text-sm mt-0.5">{accommodation.estadiaMinima} noche(s)</p>
              </div>
              <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                <p className="text-gray-500 font-medium">Cancelación</p>
                <p className="font-bold text-gray-900 text-sm mt-0.5">{nombrePolitica || '-'}</p>
              </div>
            </div>

            {politica && (
              <div className="p-4 bg-rose-50/50 rounded-xl border border-rose-100 text-xs text-rose-800 space-y-1">
                <p className="font-bold">Política de cancelación {nombrePolitica}</p>
                <p>
                  {politica.descripcion}
                </p>
              </div>
            )}
          </section>

          <section className="bg-white p-6 rounded-2xl border border-gray-100 shadow-xs">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Disponibilidad</h2>
            {calendarioError ? (
              <p className="text-xs text-gray-500 italic">
                No se pudo cargar el calendario de disponibilidad. Al reservar se verificarán las fechas.
              </p>
            ) : (
              <CalendarioDisponibilidad fechasBloqueadas={fechasBloqueadas} />
            )}
          </section>

          <section className="bg-white p-6 rounded-2xl border border-gray-100 shadow-xs">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">Reseñas de Huéspedes</h2>
              <div className="flex items-center gap-1.5 text-sm font-bold text-gray-900">
                <svg className="w-5 h-5 text-amber-500 fill-amber-500" viewBox="0 0 24 24">
                  <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                </svg>
                <span>{promedio ? Number(promedio).toFixed(1) : 'N/A'}</span>
              </div>
            </div>

            {resenas.length > 0 ? (
              <div className="space-y-4">
                {resenas.map((rev) => (
                  <div key={rev.id} className="p-4 rounded-xl border border-gray-100 bg-gray-50/50 space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-gray-900 text-sm">Huésped</span>
                      <div className="flex items-center gap-1 text-xs font-bold text-amber-600">
                        <svg className="w-3.5 h-3.5 fill-amber-500" viewBox="0 0 24 24">
                          <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                        </svg>
                        <span>{rev.calificacion} / 5</span>
                      </div>
                    </div>
                    {rev.comentario && <p className="text-xs text-gray-600">{rev.comentario}</p>}
                    {rev.fecha && (
                      <p className="text-[10px] text-gray-400">{new Date(rev.fecha).toLocaleDateString('es-CL')}</p>
                    )}
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
                <span className="text-2xl font-extrabold text-gray-900">{formato(pricePerNight)}</span>
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
                    min={hoy}
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
                    min={startDate || hoy}
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
                  max={accommodation.capacidadMax}
                  value={guestsCount}
                  onChange={(e) => setGuestsCount(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-rose-500 outline-none transition text-xs text-gray-900"
                />
              </div>

              {nights > 0 && (
                <div className="pt-4 border-t border-gray-100 space-y-2 text-xs">
                  <div className="flex justify-between text-gray-600">
                    <span>
                      {formato(pricePerNight)} x {nights} noche(s)
                    </span>
                    <span>{formato(totalEstimado)}</span>
                  </div>
                  <div className="flex justify-between font-extrabold text-gray-900 text-sm pt-2 border-t border-gray-100">
                    <span>Total estimado</span>
                    <span>{formato(totalEstimado)}</span>
                  </div>
                  <p className="text-[10px] text-gray-400">
                    El total final se calcula en el servidor y puede variar si hay tarifas de temporada.
                  </p>
                </div>
              )}

              <button
                type="submit"
                disabled={reserving}
                className="w-full bg-rose-600 hover:bg-rose-700 disabled:bg-rose-400 text-white font-bold py-3 rounded-xl shadow-xs transition-colors cursor-pointer text-sm mt-2"
              >
                {reserving ? 'Procesando...' : user ? 'Confirmar Reserva' : 'Iniciar Sesión para Reservar'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}