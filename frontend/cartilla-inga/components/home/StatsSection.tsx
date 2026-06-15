import React from 'react';
import { Award, BookOpen, TrendingUp, Globe } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useApp } from '../../context/AppContext';

export const StatsSection: React.FC = () => {
  const { usuarioAutenticado, puntos, solicitarAutenticacion } = useAuth();
  const { modulos } = useApp();

  const stats = [
    {
      icon: Award,
      value: usuarioAutenticado ? puntos : '—',
      label: 'Tus puntos',
      needsAuth: true,
    },
    {
      icon: BookOpen,
      value: modulos.length,
      label: 'Módulos',
      needsAuth: false,
    },
    {
      icon: TrendingUp,
      value: usuarioAutenticado ? '—' : '—',
      label: 'Días seguidos',
      needsAuth: false,
    },
    {
      icon: Globe,
      value: '—',
      label: 'Palabras',
      needsAuth: false,
    },
  ];

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
      <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">Tu progreso</h2>
      <div className="grid grid-cols-2 gap-3">
        {stats.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <div key={i} className="flex items-start gap-3">
              <div className="flex-shrink-0 bg-emerald-50 rounded-lg p-2">
                <Icon className="w-4 h-4 text-emerald-600" />
              </div>
              <div>
                <p className="text-xl font-bold text-gray-900 leading-none">{stat.value}</p>
                <p className="text-xs text-gray-500 mt-0.5">{stat.label}</p>
                {stat.needsAuth && !usuarioAutenticado && (
                  <button
                    onClick={solicitarAutenticacion}
                    className="text-xs text-emerald-600 hover:underline mt-0.5"
                  >
                    Inicia sesión
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
