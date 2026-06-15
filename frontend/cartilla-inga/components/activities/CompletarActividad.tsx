import React from 'react';
import { CheckCircle, XCircle } from 'lucide-react';
import { useActividad } from '../../hooks/useActividad';
import { ActividadCompletar } from '../../types';

interface Props {
  actividad: ActividadCompletar;
}

export const CompletarActividad: React.FC<Props> = ({ actividad }) => {
  const {
    respuestaSeleccionada,
    mostrarResultado,
    verificarRespuesta
  } = useActividad();

  return (
    <div className="space-y-3">
      {actividad.opciones.map((opcion, idx) => {
        const esCorrecta = opcion === actividad.respuestaCorrecta;
        const estaSeleccionada = respuestaSeleccionada === opcion;

        return (
          <button
            key={idx}
            onClick={() => !mostrarResultado && verificarRespuesta(opcion)}
            disabled={mostrarResultado}
            className={`w-full p-4 rounded-xl border-2 transition text-left font-medium flex items-center justify-between ${
              mostrarResultado
                ? estaSeleccionada
                  ? esCorrecta
                    ? 'bg-green-100 border-green-500 text-green-800'
                    : 'bg-red-100 border-red-500 text-red-800'
                  : esCorrecta
                  ? 'bg-green-50 border-green-300'
                  : 'bg-gray-50 border-gray-200'
                : 'bg-white border-gray-300 hover:border-emerald-500 hover:bg-emerald-50'
            }`}
          >
            <span>{opcion}</span>
            {mostrarResultado && estaSeleccionada && (
              esCorrecta
                ? <CheckCircle className="w-6 h-6 text-green-600" />
                : <XCircle className="w-6 h-6 text-red-600" />
            )}
          </button>
        );
      })}
    </div>
  );
};
