import { useState } from 'react';

const DIAS_SEMANA = ['Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sa', 'Do'];

const pad = (n) => String(n).padStart(2, '0');
const claveFecha = (anio, mes, dia) => `${anio}-${pad(mes + 1)}-${pad(dia)}`;

export default function CalendarioDisponibilidad({ fechasBloqueadas = new Set() }) {
  const hoy = new Date();
  const claveHoy = claveFecha(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());

  const [mesActual, setMesActual] = useState(new Date(hoy.getFullYear(), hoy.getMonth(), 1));

  const anio = mesActual.getFullYear();
  const mes = mesActual.getMonth();
  const diasEnMes = new Date(anio, mes + 1, 0).getDate();
  const desfase = (new Date(anio, mes, 1).getDay() + 6) % 7;

  const celdas = [
    ...Array.from({ length: desfase }, () => null),
    ...Array.from({ length: diasEnMes }, (_, i) => i + 1),
  ];

  const cambiarMes = (delta) => setMesActual(new Date(anio, mes + delta, 1));

  const nombreMes = mesActual.toLocaleDateString('es-CL', { month: 'long', year: 'numeric' });

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <button
          type="button"
          onClick={() => cambiarMes(-1)}
          className="px-3 py-1 text-sm font-bold text-gray-600 hover:bg-gray-100 rounded-lg cursor-pointer"
          aria-label="Mes anterior"
        >
          &lt;
        </button>
        <span className="text-sm font-bold text-gray-900 capitalize">{nombreMes}</span>
        <button
          type="button"
          onClick={() => cambiarMes(1)}
          className="px-3 py-1 text-sm font-bold text-gray-600 hover:bg-gray-100 rounded-lg cursor-pointer"
          aria-label="Mes siguiente"
        >
          &gt;
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-bold text-gray-400 mb-1">
        {DIAS_SEMANA.map((d) => (
          <div key={d}>{d}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1 text-center text-xs">
        {celdas.map((dia, i) => {
          if (dia === null) return <div key={`vacio-${i}`} />;

          const clave = claveFecha(anio, mes, dia);
          const ocupada = fechasBloqueadas.has(clave);
          const pasada = clave < claveHoy;

          let clases = 'bg-emerald-50 text-emerald-700';
          if (pasada) clases = 'text-gray-300';
          if (ocupada) clases = 'bg-red-100 text-red-700 line-through font-bold';
          if (clave === claveHoy) clases += ' ring-1 ring-gray-400';

          return (
            <div key={clave} className={`py-2 rounded-lg ${clases}`}>
              {dia}
            </div>
          );
        })}
      </div>

      <div className="flex flex-wrap gap-4 mt-4 text-[11px] text-gray-500">
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded bg-emerald-50 border border-emerald-200" /> Disponible
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded bg-red-100 border border-red-200" /> No disponible
        </span>
      </div>
    </div>
  );
}