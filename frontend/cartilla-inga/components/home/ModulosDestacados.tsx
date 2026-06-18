import React from 'react';
import { ArrowRight } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { getIcon } from '../../utils/iconMap';

const HEADER_GRADIENT: Record<string, string> = {
  emerald: 'from-emerald-500 to-emerald-600',
  green:   'from-green-500   to-green-600',
  amber:   'from-amber-500   to-amber-600',
  purple:  'from-purple-500  to-purple-600',
  pink:    'from-pink-500    to-pink-600',
};

const FRASE_PILL: Record<string, string> = {
  emerald: 'bg-emerald-50 text-emerald-700 ring-emerald-100',
  green:   'bg-green-50   text-green-700   ring-green-100',
  amber:   'bg-amber-50   text-amber-700   ring-amber-100',
  purple:  'bg-purple-50  text-purple-700  ring-purple-100',
  pink:    'bg-pink-50    text-pink-700    ring-pink-100',
};

const HOVER_BORDER: Record<string, string> = {
  emerald: 'hover:border-emerald-200',
  green:   'hover:border-green-200',
  amber:   'hover:border-amber-200',
  purple:  'hover:border-purple-200',
  pink:    'hover:border-pink-200',
};

export const ModulosDestacados: React.FC = () => {
  const { modulos, irAModulo } = useApp();

  return (
    <div>
      {/* Header de sección */}
      <div className="flex items-baseline justify-between mb-5">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Módulos de aprendizaje</h2>
          <p className="text-sm text-slate-400 mt-0.5">Explora la lengua y cultura Inga</p>
        </div>
        <span className="shrink-0 text-xs font-semibold text-slate-400 bg-slate-100 px-2.5 py-1 rounded-full">
          {modulos.length} módulos
        </span>
      </div>

      {/* Grid */}
      <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
        {modulos.map((modulo, idx) => {
          const Icono       = getIcon(modulo.icono);
          const gradient    = HEADER_GRADIENT[modulo.color] ?? HEADER_GRADIENT.emerald;
          const frasePill   = FRASE_PILL[modulo.color]     ?? FRASE_PILL.emerald;
          const hoverBorder = HOVER_BORDER[modulo.color]   ?? HOVER_BORDER.emerald;

          return (
            <button
              key={modulo.clave}
              onClick={() => irAModulo(modulo.clave)}
              className={`group text-left bg-white rounded-2xl border border-slate-100 ${hoverBorder} shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-200 overflow-hidden flex flex-col`}
            >
              {/* ── Header colorido ── */}
              <div className={`bg-gradient-to-br ${gradient} px-4 pt-4 pb-5 flex items-start justify-between relative overflow-hidden`}>
                {/* Círculo decorativo */}
                <div className="pointer-events-none absolute -bottom-4 -right-4 w-20 h-20 bg-white/10 rounded-full" />
                <div className="pointer-events-none absolute -top-3 right-8 w-10 h-10 bg-white/10 rounded-full" />

                {/* Ícono */}
                <div className="bg-white/20 backdrop-blur-sm p-2.5 rounded-xl border border-white/20 shadow-sm relative z-10">
                  <Icono className="w-5 h-5 text-white" />
                </div>

                {/* Número */}
                <span className="text-white/50 text-xs font-bold mt-1 relative z-10">
                  #{idx + 1}
                </span>
              </div>

              {/* ── Cuerpo ── */}
              <div className="px-4 pt-3 pb-4 flex-1 flex flex-col gap-2">
                {/* Título */}
                <div>
                  {/* Separar "Español — Inga" si tiene guión */}
                  {modulo.titulo.includes('—') ? (() => {
                    const [esp, inga] = modulo.titulo.split('—').map(s => s.trim());
                    return (
                      <>
                        <h3 className="font-bold text-slate-800 text-sm leading-tight">{esp}</h3>
                        <p className="text-xs font-medium text-slate-400 mt-0.5 italic">{inga}</p>
                      </>
                    );
                  })() : (
                    <h3 className="font-bold text-slate-800 text-sm leading-tight">{modulo.titulo}</h3>
                  )}
                </div>

                {/* Descripción */}
                <p className="text-xs text-slate-500 leading-relaxed line-clamp-2 flex-1">
                  {modulo.descripcion}
                </p>

                {/* Footer: frase + flecha */}
                <div className="flex items-center justify-between mt-1 pt-2.5 border-t border-slate-50">
                  <span className={`text-xs font-semibold italic px-2.5 py-1 rounded-full ring-1 ${frasePill}`}>
                    "{modulo.frase}"
                  </span>
                  <div className="bg-slate-50 group-hover:bg-emerald-50 p-1.5 rounded-lg transition-colors">
                    <ArrowRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-emerald-500 group-hover:translate-x-0.5 transition-all" />
                  </div>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
