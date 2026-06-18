import React from 'react';
import { BookOpen, Award, X, LogIn, ShieldCheck, Home, Users, BookMarked, Languages, Search, Menu } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useNavigation } from '../../hooks/useNavigation';

const NAV_ITEMS = [
  { label: 'Inicio',    icon: Home,       action: 'inicio'    },
  { label: 'Módulos',   icon: BookMarked, action: 'modulos'   },
  { label: 'Traductor', icon: Languages,  action: 'traductor' },
  { label: 'Comunidad', icon: Users,      action: 'comunidad' },
] as const;

export const Header: React.FC = () => {
  const { usuarioAutenticado, userRole, puntos, solicitarAutenticacion, setMostrarModalStats } = useAuth();
  const { menuAbierto, setMenuAbierto, vistaActual, volverAInicio, irAComunidad, irAAdmin, irATraductor } = useNavigation();

  const handleNav = (action: typeof NAV_ITEMS[number]['action']) => {
    if      (action === 'inicio'    ) volverAInicio();
    else if (action === 'comunidad' ) irAComunidad();
    else if (action === 'modulos'   ) setMenuAbierto(true);
    else if (action === 'traductor' ) irATraductor();
  };

  const activeFor = (action: string) => {
    if (action === 'inicio'    ) return vistaActual === 'inicio';
    if (action === 'comunidad' ) return vistaActual === 'comunidad';
    if (action === 'modulos'   ) return vistaActual === 'modulo';
    if (action === 'traductor' ) return vistaActual === 'traductor';
    return false;
  };

  return (
    <header className="sticky top-0 z-40 shadow-md">

      {/* CAPA 1 — Barra GOV.CO */}
      <div className="bg-[#1A1A1A] px-4 py-1 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="bg-[#F0A500] text-[#1A1A1A] text-[10px] font-bold px-2 py-0.5 rounded tracking-wide">
            GOV.CO
          </span>
          <span className="text-[#ABABAB] text-[11px] hidden sm:block">
            Plataforma oficial de preservación cultural — Pueblo Inga
          </span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-[#ABABAB] text-[11px] hidden md:block cursor-pointer hover:text-[#F0A500] transition">
            Accesibilidad
          </span>
          <span className="text-[#ABABAB] text-[11px] hidden sm:block cursor-pointer hover:text-[#F0A500] transition">
            Contáctenos
          </span>
          {usuarioAutenticado ? (
            <>
              {userRole === 'admin' && (
                <button
                  onClick={irAAdmin}
                  className="text-[#ABABAB] text-[11px] hover:text-[#F0A500] transition flex items-center gap-1"
                >
                  <ShieldCheck className="w-3 h-3" />
                  <span className="hidden sm:inline">Admin</span>
                </button>
              )}
              <button
                onClick={() => setMostrarModalStats(true)}
                className="text-[#F0A500] text-[11px] font-semibold flex items-center gap-1"
              >
                <Award className="w-3 h-3" /> {puntos} pts
              </button>
            </>
          ) : (
            <button
              onClick={solicitarAutenticacion}
              className="text-[#ABABAB] text-[11px] hover:text-[#F0A500] transition flex items-center gap-1"
            >
              <LogIn className="w-3 h-3" /> Ingresar
            </button>
          )}
        </div>
      </div>

      {/* CAPA 2 — Header blanco: logo + búsqueda */}
      <div className="bg-white border-b border-[#D9D9D9] px-4 py-3 flex items-center justify-between gap-4">
        <button
          onClick={volverAInicio}
          className="flex items-center gap-3 hover:opacity-80 transition flex-shrink-0"
        >
          <div className="w-10 h-10 bg-[#00833E] rounded-md flex items-center justify-center flex-shrink-0">
            <BookOpen className="w-5 h-5 text-white" />
          </div>
          <div className="text-left">
            <div className="text-sm font-semibold text-[#005C2A] leading-tight">Cartilla Digital Inga</div>
            <div className="text-[11px] text-[#6B6B6B]">Pueblo Inga · Mocoa, Putumayo</div>
          </div>
        </button>

        <div className="hidden sm:flex items-center border border-[#D9D9D9] rounded-full overflow-hidden bg-[#F5F5F5] flex-shrink-0">
          <input
            type="text"
            placeholder="Buscar módulos, palabras Inga..."
            className="border-none bg-transparent px-4 py-2 text-sm outline-none w-48 md:w-60 text-[#1A1A1A] placeholder:text-[#6B6B6B]"
          />
          <button className="bg-[#00833E] hover:bg-[#005C2A] px-3 py-2.5 text-white transition flex-shrink-0">
            <Search className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* CAPA 3 — Barra de navegación verde */}
      <nav className="bg-[#00833E] overflow-x-auto">
        <div className="flex items-stretch">
          {NAV_ITEMS.map(({ label, icon: Icon, action }) => (
            <button
              key={action}
              onClick={() => handleNav(action)}
              className={`relative flex items-center gap-1.5 text-[12.5px] font-medium px-4 py-2.5 whitespace-nowrap border-r border-white/10 transition-colors
                ${activeFor(action)
                  ? 'bg-[#005C2A] text-white'
                  : 'text-white/90 hover:bg-[#005C2A] hover:text-white'
                }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {label}
              {activeFor(action) && (
                <span className="absolute bottom-0 left-0 right-0 h-[3px] bg-[#F0A500]" />
              )}
            </button>
          ))}

          {/* Botón menú módulos */}
          <button
            onClick={() => setMenuAbierto(!menuAbierto)}
            className="ml-auto flex items-center gap-1.5 px-4 py-2.5 text-white/80 hover:text-white hover:bg-[#005C2A] text-xs transition border-l border-white/10 flex-shrink-0"
          >
            {menuAbierto ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            <span className="hidden sm:inline">Todos los módulos</span>
          </button>
        </div>
      </nav>

    </header>
  );
};
