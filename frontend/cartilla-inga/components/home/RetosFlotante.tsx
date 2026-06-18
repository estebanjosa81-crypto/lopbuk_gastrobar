import React, { useState } from 'react';
import { Flame, CheckCircle, X, Star, Trophy, ChevronUp } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const RetosFlotante: React.FC = () => {
  const { retos } = useApp();
  const [abierto, setAbierto] = useState(false);

  const completados = retos.filter(r => r.completado).length;
  const total = retos.length;
  const pendientes = retos.filter(r => !r.completado);

  return (
    <div className="fixed bottom-4 right-4 z-40 lg:hidden">
      {/* Panel expandido */}
      {abierto && (
        <div className="absolute bottom-16 right-0 w-[calc(100vw-2rem)] max-w-sm bg-white rounded-2xl shadow-2xl border-2 border-amber-200 overflow-hidden animate-slide-up">
          {/* Header */}
          <div className="bg-gradient-to-r from-amber-500 to-orange-500 p-4 text-white flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Flame className="w-5 h-5" />
              <span className="font-bold">Retos del Día</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1 text-sm">
                <Trophy className="w-3.5 h-3.5" />
                <span className="font-bold">{completados}/{total}</span>
              </div>
              <button
                onClick={() => setAbierto(false)}
                className="p-1 hover:bg-white/20 rounded-lg transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Progress */}
          <div className="px-4 pt-3">
            <div className="w-full bg-gray-100 rounded-full h-2">
              <div
                className="bg-amber-500 rounded-full h-2 transition-all duration-500"
                style={{ width: `${Math.round((completados / total) * 100)}%` }}
              />
            </div>
          </div>

          {/* Lista de retos */}
          <div className="p-3 max-h-72 overflow-y-auto space-y-2">
            {retos.map((reto) => (
              <div
                key={reto.id}
                className={`w-full text-left p-3 rounded-xl border-2 flex items-start gap-2.5 ${
                  reto.completado
                    ? 'bg-green-50 border-green-200'
                    : 'bg-white border-gray-100'
                }`}
              >
                {reto.completado ? (
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                ) : (
                  <div className="w-5 h-5 rounded-full border-2 border-gray-300 flex-shrink-0 mt-0.5" />
                )}
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium leading-snug ${reto.completado ? 'text-green-800' : 'text-gray-800'}`}>
                    {reto.titulo}
                  </p>
                  {reto.meta && (
                    <div className="mt-1.5 mb-1">
                      <div className="w-full bg-gray-100 rounded-full h-1.5">
                        <div
                          className={`rounded-full h-1.5 transition-all ${reto.completado ? 'bg-green-500' : 'bg-amber-400'}`}
                          style={{ width: `${reto.progreso || 0}%` }}
                        />
                      </div>
                      <p className="text-[10px] text-gray-400 mt-0.5">{reto.actual || 0}/{reto.meta}</p>
                    </div>
                  )}
                  <div className={`flex items-center gap-1 text-xs ${reto.completado ? 'text-green-600' : 'text-amber-600'}`}>
                    <Star className="w-3 h-3" />
                    +{reto.puntos} pts
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Burbuja flotante */}
      <button
        onClick={() => setAbierto(!abierto)}
        className="relative bg-gradient-to-r from-amber-500 to-orange-500 text-white w-14 h-14 rounded-full shadow-lg flex items-center justify-center hover:shadow-xl transition-all active:scale-95"
      >
        {abierto ? (
          <ChevronUp className="w-6 h-6" />
        ) : (
          <Flame className="w-6 h-6" />
        )}
        {/* Badge de pendientes */}
        {pendientes.length > 0 && !abierto && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold">
            {pendientes.length}
          </span>
        )}
      </button>
    </div>
  );
};
