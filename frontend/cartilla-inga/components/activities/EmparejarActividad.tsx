import React from 'react';
import { useActividad } from '../../hooks/useActividad';
import { ActividadEmparejar } from '../../types';

interface Props {
  actividad: ActividadEmparejar;
}

export const EmparejarActividad: React.FC<Props> = ({ actividad }) => {
  const {
    paresSeleccionados,
    palabraActiva,
    seleccionarPalabra
  } = useActividad();

  return (
    <div className="grid md:grid-cols-2 gap-4">
      <div className="space-y-2">
        <p className="font-semibold text-emerald-700 mb-2">Lengua Inga</p>
        {actividad.pares.map((par) => (
          <button
            key={`inga-${par.id}`}
            onClick={() => seleccionarPalabra(par.inga, 'inga')}
            disabled={paresSeleccionados.includes(par.inga)}
            className={`w-full p-3 rounded-lg border-2 transition font-medium ${
              paresSeleccionados.includes(par.inga)
                ? 'bg-green-100 border-green-500 text-green-800'
                : palabraActiva?.palabra === par.inga
                ? 'bg-amber-100 border-amber-500 scale-105'
                : 'bg-white border-emerald-300 hover:border-emerald-500 hover:bg-emerald-50'
            }`}
          >
            {par.inga}
          </button>
        ))}
      </div>
      <div className="space-y-2">
        <p className="font-semibold text-amber-700 mb-2">Español</p>
        {actividad.pares.map((par) => (
          <button
            key={`esp-${par.id}`}
            onClick={() => seleccionarPalabra(par.espanol, 'espanol')}
            disabled={paresSeleccionados.includes(par.espanol)}
            className={`w-full p-3 rounded-lg border-2 transition font-medium ${
              paresSeleccionados.includes(par.espanol)
                ? 'bg-green-100 border-green-500 text-green-800'
                : palabraActiva?.palabra === par.espanol
                ? 'bg-amber-100 border-amber-500 scale-105'
                : 'bg-white border-amber-300 hover:border-amber-500 hover:bg-amber-50'
            }`}
          >
            {par.espanol}
          </button>
        ))}
      </div>
    </div>
  );
};
