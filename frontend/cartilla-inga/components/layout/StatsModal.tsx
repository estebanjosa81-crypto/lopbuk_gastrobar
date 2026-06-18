import React from 'react';
import { X, Award, BookOpen, Flame, MessageCircle } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useApp } from '../../context/AppContext';

interface StatsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const StatsModal: React.FC<StatsModalProps> = ({ isOpen, onClose }) => {
  const { puntos, usuarioAutenticado, diasSeguidos, palabrasAprendidas } = useAuth();
  const { modulos } = useApp();

  if (!isOpen || !usuarioAutenticado) return null;

  const stats = {
    puntosTotal: puntos,
    modulos: modulos.length,
    diasRacha: diasSeguidos,
    palabras: palabrasAprendidas,
  };

  const statItems = [
    {
      icon: Award,
      value: stats.puntosTotal,
      label: 'Puntos Totales',
      color: 'emerald',
      bgColor: 'bg-emerald-100',
      textColor: 'text-emerald-600',
      iconBg: 'bg-emerald-50',
    },
    {
      icon: BookOpen,
      value: stats.modulos,
      label: 'Módulos',
      color: 'emerald',
      bgColor: 'bg-emerald-100',
      textColor: 'text-emerald-600',
      iconBg: 'bg-emerald-50',
    },
    {
      icon: Flame,
      value: stats.diasRacha,
      label: 'Días Seguidos',
      color: 'amber',
      bgColor: 'bg-amber-100',
      textColor: 'text-amber-600',
      iconBg: 'bg-amber-50',
    },
    {
      icon: MessageCircle,
      value: stats.palabras,
      label: 'Palabras',
      color: 'purple',
      bgColor: 'bg-purple-100',
      textColor: 'text-purple-600',
      iconBg: 'bg-purple-50',
    },
  ];

  return (
    <div
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-gradient-to-r from-emerald-600 to-green-600 p-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-white">Tu Progreso</h2>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-white/20 rounded-lg transition"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        <div className="p-4">
          <div className="grid grid-cols-2 gap-3">
            {statItems.map((item, index) => {
              const Icon = item.icon;
              return (
                <div
                  key={index}
                  className="bg-white border-2 border-gray-100 rounded-xl p-4 flex flex-col items-center shadow-sm hover:shadow-md transition"
                >
                  <div className={`${item.iconBg} p-2.5 rounded-full mb-2`}>
                    <Icon className={`w-5 h-5 ${item.textColor}`} />
                  </div>
                  <span className={`text-2xl font-bold ${item.textColor}`}>
                    {item.value}
                  </span>
                  <span className="text-xs text-gray-500 text-center mt-1">
                    {item.label}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="mt-4 bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-200 rounded-xl p-3">
            <div className="flex items-center gap-2">
              <Flame className="w-5 h-5 text-orange-500" />
              <span className="text-sm font-semibold text-gray-700">
                {stats.diasRacha > 0
                  ? `¡${stats.diasRacha} ${stats.diasRacha === 1 ? 'día' : 'días'} de racha! Sigue así`
                  : '¡Comienza tu racha de aprendizaje hoy!'
                }
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-full mt-4 bg-gradient-to-r from-emerald-600 to-green-600 text-white font-bold py-3 rounded-xl hover:from-emerald-700 hover:to-green-700 transition shadow-lg text-sm"
          >
            Seguir Aprendiendo
          </button>
        </div>
      </div>
    </div>
  );
};
