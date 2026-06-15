import React from 'react';
import { Play, Users, BookOpen, Globe, Award } from 'lucide-react';
import { useNavigation } from '../../hooks/useNavigation';

export const HeroSection: React.FC = () => {
  const { irAModulo, irAComunidad } = useNavigation();

  return (
    <div className="relative bg-emerald-950 text-white rounded-2xl overflow-hidden">
      {/* Decoración de fondo */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-16 -right-16 w-72 h-72 rounded-full bg-emerald-800/30" />
        <div className="absolute -bottom-10 -left-10 w-48 h-48 rounded-full bg-emerald-900/60" />
        <div className="absolute top-1/2 right-1/4 w-2 h-2 rounded-full bg-amber-400/40" />
        <div className="absolute top-8 right-1/3 w-1 h-1 rounded-full bg-emerald-400/50" />
      </div>

      <div className="relative grid grid-cols-1 md:grid-cols-2 gap-0">
        {/* Columna izquierda — texto principal */}
        <div className="px-7 py-10 md:px-12 md:py-12">
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold tracking-widest uppercase text-emerald-400 mb-5">
            <span className="w-4 h-px bg-emerald-400 inline-block" />
            Mocoa, Putumayo
          </span>
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold leading-tight mb-4 text-white">
            Aprende la lengua<br />
            <span className="text-emerald-400">de nuestros mayores</span>
          </h1>
          <p className="text-emerald-300/70 text-sm md:text-base mb-8 max-w-md leading-relaxed">
            Videos, actividades interactivas y la sabiduría ancestral del pueblo Inga, ahora en digital.
          </p>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => irAModulo('saludos')}
              className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 active:bg-emerald-600 text-white px-6 py-2.5 rounded-lg font-semibold text-sm transition shadow-lg shadow-emerald-900/50"
            >
              <Play className="w-4 h-4" />
              Comenzar ahora
            </button>
            <button
              onClick={irAComunidad}
              className="flex items-center gap-2 border border-emerald-700 hover:border-emerald-500 hover:bg-emerald-900/40 text-emerald-300 hover:text-white px-6 py-2.5 rounded-lg font-semibold text-sm transition"
            >
              <Users className="w-4 h-4" />
              Comunidad
            </button>
          </div>
        </div>

        {/* Columna derecha — tarjeta de información */}
        <div className="hidden md:flex items-center justify-center px-8 py-10 border-l border-emerald-900/60">
          <div className="w-full max-w-xs space-y-4">
            {/* Frase destacada */}
            <div className="bg-emerald-900/50 border border-emerald-800/60 rounded-xl p-5">
              <p className="text-xs text-emerald-500 uppercase tracking-wider mb-2 font-semibold">Frase Inga</p>
              <p className="text-white font-bold text-lg leading-snug">"Nukanchipa simi — nuestra lengua viva"</p>
              <p className="text-emerald-400/70 text-sm mt-1 italic">Nuestro idioma, nuestra vida</p>
            </div>

            {/* Mini stats */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { icon: BookOpen, label: '12 módulos', color: 'text-emerald-400' },
                { icon: Globe, label: 'Inga oral', color: 'text-amber-400' },
                { icon: Award, label: 'Gratuito', color: 'text-green-400' },
              ].map(({ icon: Icon, label, color }) => (
                <div key={label} className="bg-emerald-900/40 rounded-lg p-3 text-center border border-emerald-800/40">
                  <Icon className={`w-4 h-4 mx-auto mb-1 ${color}`} />
                  <p className="text-xs text-emerald-300/70 leading-tight">{label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Barra inferior decorativa */}
      <div className="h-1 bg-gradient-to-r from-emerald-600 via-amber-400 to-emerald-600" />
    </div>
  );
};
