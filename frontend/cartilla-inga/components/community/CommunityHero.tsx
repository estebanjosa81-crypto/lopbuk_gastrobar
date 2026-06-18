import React from 'react';
import { Users } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const CommunityHero: React.FC = () => {
  const { miembrosActivos } = useApp();

  return (
    <div className="bg-gradient-to-r from-purple-600 via-pink-600 to-purple-700 text-white rounded-3xl shadow-2xl overflow-hidden">
      <div className="p-8 md:p-12">
        <div className="flex items-center gap-3 mb-4">
          <Users className="w-10 h-10" />
          <span className="bg-yellow-400 text-purple-900 px-4 py-1 rounded-full text-sm font-bold">
            {miembrosActivos} miembros activos
          </span>
        </div>
        <h1 className="text-4xl md:text-5xl font-bold mb-4">
          Comunidad Inga
        </h1>
        <p className="text-xl text-purple-100 mb-2 max-w-2xl">
          Conéctate con otros aprendices, comparte tu progreso y celebra nuestra lengua ancestral juntos.
        </p>
      </div>
      <div className="h-2 bg-gradient-to-r from-amber-400 via-orange-400 to-red-400"></div>
    </div>
  );
};
