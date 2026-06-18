import React, { useState } from 'react';
import {
  AlertCircle, BookMarked, Play, Languages, Users, Flame, Trophy,
  Globe, ChevronRight, BookOpen, Target, Star, Mail, Phone,
  CheckCircle,
} from 'lucide-react';
import { BannerCarrusel } from '../components/home/BannerCarrusel';
import { ModulosDestacados } from '../components/home/ModulosDestacados';
import { RetosDiarios } from '../components/home/RetosDiarios';
import { StatsSection } from '../components/home/StatsSection';
import { TopAprendices } from '../components/home/TopAprendices';
import { useAuth } from '../hooks/useAuth';
import { useNavigation } from '../hooks/useNavigation';
import { useApp } from '../context/AppContext';

// ─── Accesos rápidos ─────────────────────────────────────────────────────────

const QUICK_ACCESS = [
  { icon: BookMarked, label: 'Módulos',    action: 'modulos'    },
  { icon: Play,       label: 'Comenzar',   action: 'comenzar'   },
  { icon: Languages,  label: 'Traductor',  action: 'traductor'  },
  { icon: Users,      label: 'Comunidad',  action: 'comunidad'  },
  { icon: Flame,      label: 'Retos',      action: 'retos'      },
  { icon: Trophy,     label: 'Mi ranking', action: 'ranking'    },
  { icon: Target,     label: 'Actividades',action: 'actividades'},
] as const;

// ─── Tabs ────────────────────────────────────────────────────────────────────

const TABS = [
  { label: 'Módulos de aprendizaje', icon: BookMarked },
  { label: 'Retos del día',          icon: Flame      },
  { label: 'Sobre la lengua Inga',   icon: Globe      },
] as const;

// ─── Sobre la lengua (inline) ────────────────────────────────────────────────

function SobreLenguaInline() {
  return (
    <div className="space-y-4">
      <div className="bg-white rounded-md border border-[#D9D9D9] p-5">
        <h3 className="text-base font-bold text-[#005C2A] mb-2">¿Por qué aprender Inga?</h3>
        <p className="text-sm text-[#6B6B6B] leading-relaxed mb-3">
          La lengua Inga es parte fundamental de nuestra identidad cultural. A través de ella transmitimos
          conocimientos ancestrales, historias y la cosmovisión de nuestro pueblo del Putumayo.
        </p>
        <p className="text-sm text-[#6B6B6B] leading-relaxed">
          Cada palabra lleva siglos de sabiduría. El pueblo Inga habita principalmente en el Valle de Sibundoy,
          preservando tradiciones de medicina, tejido y agricultura que hoy te invitamos a descubrir.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {[
          { icon: BookOpen, title: 'Lengua viva', desc: 'El Inga se habla actualmente en Putumayo y el sur de Colombia' },
          { icon: Users,    title: 'Comunidad',   desc: 'Miles de personas preservan y transmiten esta lengua ancestral' },
          { icon: Star,     title: 'Patrimonio',  desc: 'Reconocida como patrimonio cultural inmaterial de Colombia' },
        ].map(({ icon: Icon, title, desc }) => (
          <div key={title} className="bg-white rounded-md border border-[#D9D9D9] p-4">
            <div className="w-8 h-8 rounded-full bg-[#E6F4ED] flex items-center justify-center mb-2">
              <Icon className="w-4 h-4 text-[#00833E]" />
            </div>
            <p className="text-sm font-semibold text-[#1A1A1A] mb-1">{title}</p>
            <p className="text-xs text-[#6B6B6B] leading-relaxed">{desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Footer institucional ────────────────────────────────────────────────────

function FooterInstitucional() {
  return (
    <footer className="bg-[#1B2B1E] text-[#C8D9CC] mt-8">
      <div className="max-w-7xl mx-auto px-4 py-6">

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 pb-5 border-b border-white/10">

          {/* Brand */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 bg-[#00833E] rounded flex items-center justify-center flex-shrink-0">
                <BookOpen className="w-4 h-4 text-white" />
              </div>
              <span className="text-white text-sm font-semibold">Cartilla Digital Inga</span>
            </div>
            <p className="text-[11px] text-[#8FAD95] leading-relaxed mb-3">
              Plataforma educativa interactiva para la preservación y enseñanza de la lengua Inga del Putumayo, Colombia.
            </p>
            <div className="flex items-center gap-1.5 text-[11px] text-[#8FAD95] mb-1">
              <Mail className="w-3 h-3" /> contacto@cartillainga.co
            </div>
            <div className="flex items-center gap-1.5 text-[11px] text-[#8FAD95]">
              <Phone className="w-3 h-3" /> Mocoa, Putumayo, Colombia
            </div>
          </div>

          {/* Plataforma */}
          <div>
            <div className="text-white text-xs font-semibold mb-3 pb-1.5 border-b-2 border-[#00833E] inline-block">
              Plataforma
            </div>
            {[
              'Módulos de aprendizaje',
              'Actividades interactivas',
              'Traductor Inga-Español',
              'Comunidad',
              'Retos diarios',
            ].map(l => (
              <div key={l} className="text-[11px] text-[#8FAD95] mb-1.5 hover:text-[#F0A500] cursor-pointer transition">
                {l}
              </div>
            ))}
          </div>

          {/* Institución */}
          <div>
            <div className="text-white text-xs font-semibold mb-3 pb-1.5 border-b-2 border-[#00833E] inline-block">
              Institución
            </div>
            {[
              'Pueblo Inga del Putumayo',
              'Quiénes somos',
              'Objetivos del proyecto',
              'Contacto',
              'Noticias y novedades',
            ].map(l => (
              <div key={l} className="text-[11px] text-[#8FAD95] mb-1.5 hover:text-[#F0A500] cursor-pointer transition">
                {l}
              </div>
            ))}
          </div>

          {/* Legal */}
          <div>
            <div className="text-white text-xs font-semibold mb-3 pb-1.5 border-b-2 border-[#00833E] inline-block">
              Legal
            </div>
            {[
              'Términos de uso',
              'Política de privacidad',
              'Habeas Data',
              'Mapa del sitio',
              'Accesibilidad web',
            ].map(l => (
              <div key={l} className="text-[11px] text-[#8FAD95] mb-1.5 hover:text-[#F0A500] cursor-pointer transition">
                {l}
              </div>
            ))}
          </div>
        </div>

        {/* Footer bottom */}
        <div className="flex flex-col sm:flex-row items-center justify-between pt-4 gap-3">
          <div className="text-[10px] text-[#6B8570]">
            © 2026 Cartilla Digital Inga. Todos los derechos reservados. Hecho con ♥ en Mocoa, Putumayo, Colombia.
          </div>
          <div className="flex items-center gap-3 text-[10px] text-[#8FAD95] font-bold">
            <span className="bg-[#F0A500] text-[#1A1A1A] px-1.5 py-0.5 rounded text-[10px] font-bold">
              GOV.CO
            </span>
            <span>COLOMBIA</span>
          </div>
        </div>

      </div>
    </footer>
  );
}

// ─── Vista principal ──────────────────────────────────────────────────────────

export const VistaInicio: React.FC = () => {
  const [tabActivo, setTabActivo] = useState(0);
  const { setMostrarModalStats } = useAuth();
  const { irAComunidad, irATraductor, irAModulo, setMenuAbierto } = useNavigation();
  const { retos } = useApp();

  const handleQuickAccess = (action: string) => {
    if (action === 'modulos'    ) setMenuAbierto(true);
    if (action === 'comenzar'   ) irAModulo('saludos');
    if (action === 'traductor'  ) irATraductor();
    if (action === 'comunidad'  ) irAComunidad();
    if (action === 'retos'      ) setTabActivo(1);
    if (action === 'ranking'    ) setMostrarModalStats(true);
    if (action === 'actividades') irAModulo('saludos');
  };

  const retosCompletados = retos.filter(r => r.completado).length;

  return (
    <div className="min-h-screen bg-[#F5F5F5]">

      {/* AVISO INSTITUCIONAL */}
      <div className="bg-[#FFF8E7] border-l-4 border-[#F0A500] px-4 py-2.5 flex items-center gap-3">
        <AlertCircle className="w-4 h-4 flex-shrink-0 text-[#F0A500]" />
        <p className="text-sm text-amber-900">
          <strong>Novedad:</strong> Nuevos módulos de lengua Inga disponibles para esta temporada.{' '}
          <button
            onClick={() => setMenuAbierto(true)}
            className="text-[#00833E] font-semibold hover:underline"
          >
            Ver módulos →
          </button>
        </p>
      </div>

      {/* HERO CAROUSEL */}
      <BannerCarrusel noRounded />

      {/* ACCESOS RÁPIDOS */}
      <div className="bg-white border-b border-[#D9D9D9]">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex gap-0 overflow-x-auto">
            {QUICK_ACCESS.map(({ icon: Icon, label, action }) => (
              <button
                key={action}
                onClick={() => handleQuickAccess(action)}
                className="group flex flex-col items-center gap-1.5 px-4 sm:px-5 py-3 flex-shrink-0 border-b-[3px] border-transparent hover:border-[#00833E] hover:bg-[#E6F4ED] transition-all"
              >
                <div className="w-9 h-9 rounded-full bg-[#E6F4ED] flex items-center justify-center text-[#00833E] group-hover:bg-[#00833E] group-hover:text-white transition-colors">
                  <Icon className="w-4 h-4" />
                </div>
                <span className="text-[10.5px] text-[#6B6B6B] text-center leading-tight max-w-16 whitespace-nowrap">
                  {label}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* TABS SECUNDARIOS */}
      <div className="bg-white border-b border-[#D9D9D9]">
        <div className="max-w-7xl mx-auto px-4 flex gap-0 overflow-x-auto">
          {TABS.map(({ label, icon: Icon }, i) => (
            <button
              key={label}
              onClick={() => setTabActivo(i)}
              className={`flex items-center gap-1.5 text-xs font-medium px-4 py-2.5 border-b-[3px] transition-colors whitespace-nowrap
                ${tabActivo === i
                  ? 'text-[#00833E] border-[#00833E]'
                  : 'text-[#6B6B6B] border-transparent hover:text-[#00833E]'
                }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* CONTENIDO PRINCIPAL */}
      <div className="max-w-7xl mx-auto px-4 py-5 grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* COLUMNA PRINCIPAL 2/3 */}
        <div className="lg:col-span-2">

          {/* Section label */}
          <div className="flex items-center gap-2 mb-4 text-[#00833E] text-xs font-bold uppercase tracking-wide">
            {React.createElement(TABS[tabActivo].icon, { className: 'w-3.5 h-3.5' })}
            {TABS[tabActivo].label}
            <span className="flex-1 h-px bg-[#00833E] opacity-20 ml-1" />
          </div>

          {tabActivo === 0 && <ModulosDestacados />}
          {tabActivo === 1 && <RetosDiarios />}
          {tabActivo === 2 && <SobreLenguaInline />}

        </div>

        {/* SIDEBAR 1/3 */}
        <div className="flex flex-col gap-4">

          {/* Estadísticas */}
          <StatsSection />

          {/* Retos del día — sidebar compacto */}
          {retos.length > 0 && (
            <div className="bg-white rounded-md border border-[#D9D9D9] overflow-hidden shadow-sm">
              <div className="bg-[#00833E] text-white text-xs font-semibold px-3.5 py-2.5 flex items-center gap-2">
                <Flame className="w-3.5 h-3.5" />
                Retos del día
                {retosCompletados > 0 && (
                  <span className="ml-auto bg-[#F0A500] text-[#1A1A1A] text-[10px] font-bold px-1.5 py-0.5 rounded">
                    {retosCompletados}/{retos.length}
                  </span>
                )}
              </div>
              <div className="p-3">
                {retos.slice(0, 3).map((r, i) => (
                  <div key={r.id} className="flex gap-3 py-2 border-b border-[#D9D9D9] last:border-0">
                    <div className="bg-[#E6F4ED] rounded px-2 py-1 text-center flex-shrink-0 min-w-10">
                      {r.completado ? (
                        <CheckCircle className="w-4 h-4 text-[#00833E] mx-auto" />
                      ) : (
                        <div className="text-base font-bold text-[#00833E] leading-none">{i + 1}</div>
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-[#1A1A1A] leading-snug truncate">{r.titulo}</p>
                      <p className="text-[11px] text-[#6B6B6B] mt-0.5">+{r.puntos} pts · {r.dificultad}</p>
                    </div>
                  </div>
                ))}
                <button
                  onClick={() => setTabActivo(1)}
                  className="w-full mt-2 text-xs text-[#00833E] font-semibold hover:underline text-center flex items-center justify-center gap-1"
                >
                  Ver todos los retos <ChevronRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          )}

          {/* Top Aprendices */}
          <TopAprendices />

          {/* Sobre la lengua — tarjeta lateral */}
          <div className="bg-white rounded-md border border-[#D9D9D9] overflow-hidden shadow-sm">
            <div className="bg-[#00833E] text-white text-xs font-semibold px-3.5 py-2.5 flex items-center gap-2">
              <Globe className="w-3.5 h-3.5" />
              Sobre la lengua Inga
            </div>
            <div className="p-3.5">
              <p className="text-[11.5px] text-[#6B6B6B] leading-relaxed">
                La lengua Inga es parte fundamental de la identidad cultural del Putumayo.
                A través de ella transmitimos conocimientos ancestrales del pueblo Inga.
              </p>
              <button
                onClick={() => setTabActivo(2)}
                className="flex items-center gap-1 text-[#00833E] text-xs font-semibold mt-2.5 hover:underline"
              >
                Leer más <ChevronRight className="w-3 h-3" />
              </button>
            </div>
          </div>

        </div>
      </div>

      <FooterInstitucional />
    </div>
  );
};
