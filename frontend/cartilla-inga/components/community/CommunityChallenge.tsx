import React from 'react';
import { Sparkles } from 'lucide-react';

export const CommunityChallenge: React.FC = () => {
  return (
    <div className="bg-gradient-to-br from-pink-500 to-purple-600 rounded-2xl shadow-lg p-6 text-white sticky top-24">
      <div className="flex items-center gap-2 mb-3">
        <Sparkles className="w-5 h-5" />
        <h3 className="font-bold">Desafío Comunitario</h3>
      </div>
      <p className="text-sm text-purple-100 mb-4">
        ¡Aprendamos juntos 500 palabras nuevas esta semana!
      </p>
      <div className="bg-white/20 rounded-full h-3 mb-2 overflow-hidden">
        <div className="bg-white h-full rounded-full" style={{ width: '68%' }}></div>
      </div>
      <p className="text-sm text-center font-semibold">340 / 500 palabras</p>
    </div>
  );
};
