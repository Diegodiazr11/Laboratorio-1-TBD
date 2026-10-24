import React, { useState } from 'react';
import axiosClient from '../api/Axios';

const AdminCatalogos = () => {
  const [ciudad, setCiudad] = useState('');
  const [tipo, setTipo] = useState({ nombre: '', descripcion: '' });
  const [politica, setPolitica] = useState({
    nombre: 'FLEXIBLE',
    diasAntelacionTotal: '',
    diasAntelacionParcial: '',
    pctReembolsoParcial: '',
    descripcion: ''
  });

  const handleCrearCiudad = async (e) => {
    e.preventDefault();
    try {
      await axiosClient.post('/ciudades', { nombre: ciudad });
      alert('Ciudad creada con éxito');
      setCiudad('');
    } catch (error) {
      console.error(error);
      alert('Error al crear la ciudad');
    }
  };

  const handleCrearTipo = async (e) => {
    e.preventDefault();
    try {
      await axiosClient.post('/tipos-alojamiento', tipo);
      alert('Tipo de alojamiento creado con éxito');
      setTipo({ nombre: '', descripcion: '' });
    } catch (error) {
      console.error(error);
      alert('Error al crear el tipo de alojamiento');
    }
  };

  const handleCrearPolitica = async (e) => {
    e.preventDefault();
    try {
      // Usamos los nombres exactos que espera tu backend (revisa tu DTO si usan snake_case o camelCase)
      await axiosClient.post('/politicas-cancelacion', {
        nombre: politica.nombre,
        dias_antelacion_total: politica.diasAntelacionTotal,
        dias_antelacion_parcial: politica.diasAntelacionParcial,
        pct_reembolso_parcial: politica.pctReembolsoParcial,
        descripcion: politica.descripcion
      });
      alert('Política de cancelación creada con éxito');
      setPolitica({
        nombre: 'FLEXIBLE',
        diasAntelacionTotal: '',
        diasAntelacionParcial: '',
        pctReembolsoParcial: '',
        descripcion: ''
      });
    } catch (error) {
      console.error(error);
      alert('Error al crear la política de cancelación');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Gestión de Catálogos</h1>
          <p className="text-sm text-gray-500 mt-1">Crea nuevas ciudades, tipos de alojamiento y políticas para el sistema.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Formulario Ciudad */}
          <section className="bg-white p-6 shadow-sm rounded-xl border border-gray-200 h-fit">
            <h2 className="text-lg font-semibold text-gray-800 border-b border-gray-100 pb-3 mb-4">Nueva Ciudad</h2>
            <form onSubmit={handleCrearCiudad} className="flex flex-col gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Nombre de la ciudad</label>
                <input 
                  type="text" 
                  value={ciudad} 
                  onChange={(e) => setCiudad(e.target.value)}
                  className="w-full border border-gray-300 px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-rose-500 text-sm transition-shadow"
                  placeholder="Ej. Pucón"
                  required 
                />
              </div>
              <button type="submit" className="w-full sm:w-auto mt-2 bg-rose-600 hover:bg-rose-700 text-white font-medium px-5 py-2.5 rounded-lg shadow-sm transition-colors text-sm">
                Guardar Ciudad
              </button>
            </form>
          </section>

          {/* Formulario Tipo de Alojamiento */}
          <section className="bg-white p-6 shadow-sm rounded-xl border border-gray-200 h-fit">
            <h2 className="text-lg font-semibold text-gray-800 border-b border-gray-100 pb-3 mb-4">Nuevo Tipo de Alojamiento</h2>
            <form onSubmit={handleCrearTipo} className="flex flex-col gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Nombre</label>
                <input 
                  type="text" 
                  value={tipo.nombre} 
                  onChange={(e) => setTipo({...tipo, nombre: e.target.value})}
                  className="w-full border border-gray-300 px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-rose-500 text-sm transition-shadow"
                  placeholder="Ej. Glamping"
                  required 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Descripción</label>
                <textarea 
                  value={tipo.descripcion} 
                  onChange={(e) => setTipo({...tipo, descripcion: e.target.value})}
                  className="w-full border border-gray-300 px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-rose-500 text-sm transition-shadow resize-none"
                  rows="3"
                  placeholder="Describe este tipo de alojamiento..."
                  required
                />
              </div>
              <button type="submit" className="w-full sm:w-auto mt-2 bg-rose-600 hover:bg-rose-700 text-white font-medium px-5 py-2.5 rounded-lg shadow-sm transition-colors text-sm">
                Guardar Tipo
              </button>
            </form>
          </section>

          {/* Formulario Política de Cancelación */}
          <section className="bg-white p-6 shadow-sm rounded-xl border border-gray-200 lg:col-span-2">
            <h2 className="text-lg font-semibold text-gray-800 border-b border-gray-100 pb-3 mb-4">Nueva Política de Cancelación</h2>
            <form onSubmit={handleCrearPolitica} className="grid grid-cols-1 md:grid-cols-3 gap-5">
              
              <div className="md:col-span-1">
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Nivel de Política</label>
                <select 
                  value={politica.nombre} 
                  onChange={(e) => setPolitica({...politica, nombre: e.target.value})}
                  className="w-full border border-gray-300 px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-rose-500 text-sm bg-white"
                >
                  <option value="FLEXIBLE">Flexible</option>
                  <option value="MODERADA">Moderada</option>
                  <option value="ESTRICTA">Estricta</option>
                </select>
              </div>

              <div className="md:col-span-1">
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Días antelación total (100%)</label>
                <input 
                  type="number" 
                  value={politica.diasAntelacionTotal} 
                  onChange={(e) => setPolitica({...politica, diasAntelacionTotal: e.target.value})}
                  className="w-full border border-gray-300 px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-rose-500 text-sm transition-shadow"
                  placeholder="Ej. 14"
                  min="0"
                  required 
                />
              </div>

              <div className="md:col-span-1">
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Días antelación parcial</label>
                <input 
                  type="number" 
                  value={politica.diasAntelacionParcial} 
                  onChange={(e) => setPolitica({...politica, diasAntelacionParcial: e.target.value})}
                  className="w-full border border-gray-300 px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-rose-500 text-sm transition-shadow"
                  placeholder="Ej. 7"
                  min="0"
                  required 
                />
              </div>

              <div className="md:col-span-1">
                <label className="block text-sm font-medium text-gray-700 mb-1.5">% Reembolso parcial</label>
                <input 
                  type="number" 
                  value={politica.pctReembolsoParcial} 
                  onChange={(e) => setPolitica({...politica, pctReembolsoParcial: e.target.value})}
                  className="w-full border border-gray-300 px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-rose-500 text-sm transition-shadow"
                  placeholder="Ej. 50"
                  min="0"
                  max="100"
                  step="0.01"
                  required 
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Descripción detallada</label>
                <textarea 
                  value={politica.descripcion} 
                  onChange={(e) => setPolitica({...politica, descripcion: e.target.value})}
                  className="w-full border border-gray-300 px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-rose-500 text-sm transition-shadow resize-none"
                  rows="2"
                  placeholder="Ej. Reembolso del 100% si se cancela 14 días antes..."
                  required
                />
              </div>

              <div className="md:col-span-3 flex justify-end mt-2">
                <button type="submit" className="w-full md:w-auto bg-rose-600 hover:bg-rose-700 text-white font-medium px-6 py-2.5 rounded-lg shadow-sm transition-colors text-sm">
                  Guardar Política
                </button>
              </div>
            </form>
          </section>

        </div>
      </div>
    </div>
  );
};

export default AdminCatalogos;