import React from 'react';
import { BookOpen, Award, X, Users, Home, LogOut, LogIn, ChevronRight, Languages } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useNavigation } from '../../hooks/useNavigation';
import { useApp } from '../../context/AppContext';
import { getIcon } from '../../utils/iconMap';

const COLOR_BG: Record<string, string> = {
  emerald: 'bg-emerald-500',
  green:   'bg-green-500',
  amber:   'bg-amber-500',
  purple:  'bg-purple-500',
  pink:    'bg-pink-500',
};

const COLOR_RING: Record<string, string> = {
  emerald: 'ring-emerald-300',
  green:   'ring-green-300',
  amber:   'ring-amber-300',
  purple:  'ring-purple-300',
  pink:    'ring-pink-300',
};

export const SideMenu: React.FC = () => {
  const { modulos } = useApp();
  const { usuarioAutenticado, puntos, handleLogout, solicitarAutenticacion } = useAuth();
  const {
    menuAbierto, setMenuAbierto, moduloActivo, vistaActual,
    irAModulo, volverAInicio, irAComunidad, irATraductor,
  } = useNavigation();

  if (!menuAbierto) return null;

  const cerrar = () => setMenuAbierto(false);

  return (
    <div className="fixed inset-0 z-50 flex" onClick={cerrar}>
      {/* Panel */}
      <div
        className="bg-white w-[85vw] max-w-[320px] h-full shadow-2xl flex flex-col overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* ── Header ── */}
        <div className="bg-emerald-900 px-5 pt-5 pb-4 shrink-0">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-emerald-300" />
              <span className="text-white font-bold text-base">Cartilla Inga</span>
            </div>
            <button onClick={cerrar} className="p-1.5 hover:bg-white/10 rounded-lg transition">
              <X className="w-5 h-5 text-emerald-200" />
            </button>
          </div>

          {/* Usuario / puntos */}
          {usuarioAutenticado ? (
            <div className="bg-white/10 rounded-xl px-4 py-3 flex items-center justify-between">
              <div className="min-w-0">
                <p className="text-emerald-200 text-xs">Tu progreso</p>
                <p className="text-white font-semibold text-sm">Estudiante activo</p>
              </div>
              <div className="flex items-center gap-1.5 bg-amber-400/20 border border-amber-400/30 rounded-full px-3 py-1.5 shrink-0">
                <Award className="w-4 h-4 text-amber-300" />
                <span className="text-amber-200 font-bold text-sm">{puntos} pts</span>
              </div>
            </div>
          ) : (
            <button
              onClick={() => { solicitarAutenticacion(); cerrar(); }}
              className="w-full bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl px-4 py-3 text-left transition"
            >
              <p className="text-white font-semibold text-sm">Iniciar sesión</p>
              <p className="text-emerald-300 text-xs mt-0.5">Guarda tu progreso →</p>
            </button>
          )}
        </div>

        {/* ── Lista de módulos ── */}
        <div className="flex-1 overflow-y-auto">
          <div className="px-4 pt-4 pb-2">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
              Módulos de aprendizaje
            </p>
            <div className="space-y-1.5">
              {modulos.map((modulo, idx) => {
                const Icono = getIcon(modulo.icono);
                const activo = moduloActivo === modulo.clave && vistaActual === 'modulo';
                const bgColor = COLOR_BG[modulo.color] ?? COLOR_BG.emerald;
                const ringColor = COLOR_RING[modulo.color] ?? COLOR_RING.emerald;

                return (
                  <button
                    key={modulo.clave}
                    onClick={() => { irAModulo(modulo.clave); cerrar(); }}
                    className={`w-full text-left px-3 py-3 rounded-xl transition flex items-center gap-3 group ${
                      activo
                        ? 'bg-emerald-50 border border-emerald-200'
                        : 'hover:bg-slate-50 border border-transparent'
                    }`}
                  >
                    {/* Ícono con color del módulo */}
                    <div className={`${bgColor} ${activo ? `ring-2 ${ringColor}` : ''} p-2 rounded-xl shrink-0 shadow-sm`}>
                      <Icono className="w-4 h-4 text-white" />
                    </div>

                    {/* Texto */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-bold text-slate-300">#{idx + 1}</span>
                        <p className={`text-sm font-semibold truncate ${
                          activo ? 'text-emerald-800' : 'text-slate-800 group-hover:text-emerald-700'
                        }`}>
                          {modulo.titulo}
                        </p>
                      </div>
                      <p className="text-xs text-slate-400 truncate italic mt-0.5">
                        {modulo.frase} · {modulo.traduccion}
                      </p>
                    </div>

                    {/* Flecha */}
                    <ChevronRight className={`w-4 h-4 shrink-0 transition ${
                      activo ? 'text-emerald-500' : 'text-slate-200 group-hover:text-slate-400'
                    }`} />
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* ── Navegación inferior ── */}
        <div className="px-4 pb-5 pt-3 border-t border-slate-100 space-y-2 shrink-0 bg-white">
          <button
            onClick={() => { volverAInicio(); cerrar(); }}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2.5 rounded-xl transition flex items-center justify-center gap-2 text-sm"
          >
            <Home className="w-4 h-4" /> Inicio
          </button>
          <button
            onClick={() => { irATraductor(); cerrar(); }}
            className={`w-full font-semibold py-2.5 rounded-xl transition flex items-center justify-center gap-2 text-sm ${
              vistaActual === 'traductor'
                ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            <Languages className="w-4 h-4" /> Traductor Inga
          </button>
          <button
            onClick={() => { irAComunidad(); cerrar(); }}
            className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold py-2.5 rounded-xl transition flex items-center justify-center gap-2 text-sm"
          >
            <Users className="w-4 h-4" /> Comunidad
          </button>
          {usuarioAutenticado ? (
            <button
              onClick={() => { handleLogout(); cerrar(); }}
              className="w-full text-slate-400 hover:text-red-500 font-medium py-2 rounded-xl transition flex items-center justify-center gap-2 text-sm"
            >
              <LogOut className="w-4 h-4" /> Cerrar sesión
            </button>
          ) : (
            <button
              onClick={() => { solicitarAutenticacion(); cerrar(); }}
              className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold py-2.5 rounded-xl transition flex items-center justify-center gap-2 text-sm"
            >
              <LogIn className="w-4 h-4" /> Iniciar sesión
            </button>
          )}
        </div>
      </div>

      {/* Overlay oscuro a la derecha */}
      <div className="flex-1 bg-black/50 backdrop-blur-sm" />
    </div>
  );
};
