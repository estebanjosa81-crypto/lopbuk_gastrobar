'use client';

import React from 'react';
import { AppProvider } from './context/AppContext';
import { Header, SideMenu, StatsModal } from './components/layout';
import { VistaInicio, VistaModulo, VistaComunidad, VistaAuth, VistaTraductor } from './views';
import { useNavigation } from './hooks/useNavigation';
import { useAuth } from './hooks/useAuth';

/**
 * Experiencia de una CARTILLA ACTIVA (scope: cartilla-(slug)).
 * Se monta dentro de Lopbuk; el GoogleOAuthProvider lo aporta el layout raíz.
 */
const AppContent: React.FC<{ onVolverCatalogo?: () => void }> = ({ onVolverCatalogo }) => {
  const { vistaActual } = useNavigation();
  const { mostrarModalStats, setMostrarModalStats } = useAuth();

  if (vistaActual === 'auth') return <VistaAuth />;

  return (
    <div className="min-h-screen bg-[#F5F5F5]">
      <Header />
      <SideMenu />
      <StatsModal isOpen={mostrarModalStats} onClose={() => setMostrarModalStats(false)} />

      {onVolverCatalogo && (
        <div className="container mx-auto px-4 pt-4">
          <button
            onClick={onVolverCatalogo}
            className="text-sm text-emerald-700 hover:text-emerald-900 font-medium inline-flex items-center gap-1"
          >
            ← Volver al catálogo de cartillas
          </button>
        </div>
      )}

      {vistaActual === 'inicio' && <VistaInicio />}

      {vistaActual !== 'inicio' && (
        <div className="container mx-auto px-4 py-6">
          {vistaActual === 'modulo' && <VistaModulo />}
          {vistaActual === 'comunidad' && <VistaComunidad />}
          {vistaActual === 'traductor' && <VistaTraductor />}
        </div>
      )}
    </div>
  );
};

interface Props {
  /** Slug o id de la cartilla a abrir. */
  cartillaSlug: string;
  /** Callback para volver al catálogo global. */
  onVolverCatalogo?: () => void;
}

const CartillaIngaDigital: React.FC<Props> = ({ cartillaSlug, onVolverCatalogo }) => {
  return (
    <AppProvider cartillaSlug={cartillaSlug}>
      <AppContent onVolverCatalogo={onVolverCatalogo} />
    </AppProvider>
  );
};

export default CartillaIngaDigital;
