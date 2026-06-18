import React from 'react';
import { Lock, Users } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

export const JoinCommunityCard: React.FC = () => {
  const { solicitarAutenticacion } = useAuth();

  return (
    <div className="bg-white rounded-2xl shadow-lg p-8 border-2 border-purple-200 text-center">
      <div className="bg-purple-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
        <Lock className="w-8 h-8 text-purple-600" />
      </div>
      <h3 className="text-2xl font-bold text-gray-800 mb-3">
        Únete a la Comunidad
      </h3>
      <p className="text-gray-600 mb-6">
        Crea una cuenta para participar en la comunidad, compartir tu progreso y conectar con otros aprendices de la lengua Inga.
      </p>
      <button
        onClick={solicitarAutenticacion}
        className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-8 py-3 rounded-xl font-bold hover:from-purple-700 hover:to-pink-700 transition shadow-lg inline-flex items-center gap-2"
      >
        <Users className="w-5 h-5" />
        Iniciar Sesión / Registrarse
      </button>
    </div>
  );
};
