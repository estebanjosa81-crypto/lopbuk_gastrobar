import React from 'react';
import { Trophy, Crown, Medal, Star } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useApp } from '../../context/AppContext';

export const TopAprendices: React.FC = () => {
  const { usuarioAutenticado, puntos } = useAuth();
  const { topUsuarios } = useApp();

  if (!usuarioAutenticado || topUsuarios.length < 3) return null;

  return (
    <div className="bg-gradient-to-br from-yellow-400 via-amber-400 to-orange-500 rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden">
      <div className="p-4 sm:p-6 lg:p-8">
        {/* Header */}
        <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
          <Trophy className="w-7 h-7 sm:w-10 sm:h-10 text-white animate-pulse flex-shrink-0" />
          <div className="min-w-0">
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white">Top Aprendices</h2>
            <p className="text-amber-100 text-xs sm:text-sm truncate">¡Compite y gana puntos!</p>
          </div>
        </div>

        {/* Podio Top 3 */}
        <div className="grid grid-cols-3 gap-2 sm:gap-4 mb-4 sm:mb-6">
          {/* 2do lugar */}
          <div className="flex flex-col items-center order-1">
            <div className="bg-gray-300 text-gray-700 w-8 h-8 sm:w-12 sm:h-12 rounded-full flex items-center justify-center font-bold mb-1 sm:mb-2 shadow-lg text-sm sm:text-base">2</div>
            <div className="bg-white/90 backdrop-blur rounded-xl sm:rounded-2xl p-2 sm:p-4 w-full text-center hover:scale-105 transition shadow-xl">
              <div className="text-2xl sm:text-4xl mb-1 sm:mb-2">{topUsuarios[1].avatar}</div>
              <p className="font-bold text-gray-800 text-xs sm:text-sm mb-1 truncate px-1">{topUsuarios[1].nombre.split(' ')[0]}</p>
              <div className="bg-gradient-to-r from-gray-400 to-slate-400 text-white px-2 py-0.5 sm:px-3 sm:py-1 rounded-full text-[10px] sm:text-xs font-bold mb-1 sm:mb-2">{topUsuarios[1].puntos} pts</div>
              <Medal className="w-5 h-5 sm:w-8 sm:h-8 text-gray-400 mx-auto" />
            </div>
          </div>

          {/* 1er lugar */}
          <div className="flex flex-col items-center order-2 -mt-2 sm:-mt-0">
            <Crown className="w-8 h-8 sm:w-12 sm:h-12 text-yellow-300 mb-1 sm:mb-2 animate-bounce" />
            <div className="bg-gradient-to-br from-yellow-300 to-amber-300 rounded-xl sm:rounded-2xl p-2 sm:p-4 w-full text-center hover:scale-105 transition shadow-2xl border-2 sm:border-4 border-yellow-200">
              <div className="text-3xl sm:text-5xl mb-1 sm:mb-2">{topUsuarios[0].avatar}</div>
              <p className="font-bold text-gray-800 text-xs sm:text-sm mb-1 truncate px-1">{topUsuarios[0].nombre.split(' ')[0]}</p>
              <div className="bg-gradient-to-r from-yellow-500 to-amber-600 text-white px-2 py-0.5 sm:px-4 sm:py-2 rounded-full text-[10px] sm:text-sm font-bold mb-1 sm:mb-2 shadow-lg">{topUsuarios[0].puntos} pts</div>
              <Trophy className="w-6 h-6 sm:w-10 sm:h-10 text-yellow-600 mx-auto" />
            </div>
          </div>

          {/* 3er lugar */}
          <div className="flex flex-col items-center order-3">
            <div className="bg-orange-400 text-white w-8 h-8 sm:w-12 sm:h-12 rounded-full flex items-center justify-center font-bold mb-1 sm:mb-2 shadow-lg text-sm sm:text-base">3</div>
            <div className="bg-white/90 backdrop-blur rounded-xl sm:rounded-2xl p-2 sm:p-4 w-full text-center hover:scale-105 transition shadow-xl">
              <div className="text-2xl sm:text-4xl mb-1 sm:mb-2">{topUsuarios[2].avatar}</div>
              <p className="font-bold text-gray-800 text-xs sm:text-sm mb-1 truncate px-1">{topUsuarios[2].nombre.split(' ')[0]}</p>
              <div className="bg-gradient-to-r from-orange-400 to-amber-500 text-white px-2 py-0.5 sm:px-3 sm:py-1 rounded-full text-[10px] sm:text-xs font-bold mb-1 sm:mb-2">{topUsuarios[2].puntos} pts</div>
              <Star className="w-5 h-5 sm:w-8 sm:h-8 text-orange-400 mx-auto" />
            </div>
          </div>
        </div>

        {/* Posiciones 4 y 5 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
          {topUsuarios.slice(3, 5).map((usuario, index) => (
            <div key={usuario.id} className="bg-white/80 backdrop-blur rounded-lg sm:rounded-xl p-2 sm:p-3 flex items-center gap-2 sm:gap-3 hover:bg-white transition">
              <div className="bg-gray-200 text-gray-700 w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center font-bold text-xs sm:text-sm flex-shrink-0">{index + 4}</div>
              <div className="text-lg sm:text-2xl flex-shrink-0">{usuario.avatar}</div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-gray-800 text-xs sm:text-sm truncate">{usuario.nombre}</p>
                <p className="text-[10px] sm:text-xs text-gray-600">{usuario.nivel}</p>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="font-bold text-amber-700 text-sm sm:text-base">{usuario.puntos}</p>
                <p className="text-[10px] sm:text-xs text-gray-500">pts</p>
              </div>
            </div>
          ))}
        </div>

        {/* Tu posición */}
        <div className="mt-3 sm:mt-4 bg-white rounded-lg sm:rounded-xl p-3 sm:p-4 border-2 sm:border-3 border-emerald-400 shadow-xl">
          <p className="text-xs sm:text-sm font-semibold text-gray-600 mb-2">Tu Posición:</p>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="bg-emerald-500 text-white w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center font-bold text-sm">--</div>
              <div className="text-xl sm:text-2xl">👤</div>
              <p className="font-bold text-gray-800 text-sm sm:text-base">Tú</p>
            </div>
            <div className="text-right">
              <p className="text-2xl sm:text-3xl font-bold text-emerald-700">{puntos}</p>
              <p className="text-[10px] sm:text-xs text-gray-600">puntos</p>
            </div>
          </div>
          {topUsuarios[2] && puntos < topUsuarios[2].puntos && (
            <div className="mt-2 sm:mt-3 bg-emerald-50 p-2 rounded-lg">
              <p className="text-[10px] sm:text-xs text-emerald-700 text-center">
                ¡Gana {topUsuarios[2].puntos - puntos} pts más para el top 3! 🎯
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
