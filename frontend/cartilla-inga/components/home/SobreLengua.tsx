import React from 'react';

export const SobreLengua: React.FC = () => {
  return (
    <div className="bg-slate-50 border border-slate-100 rounded-2xl p-7 md:p-10">
      <div className="max-w-3xl">
        <span className="text-xs font-semibold tracking-widest uppercase text-emerald-600 mb-3 block">
          Nuestra lengua
        </span>
        <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">¿Por qué aprender Inga?</h2>
        <div className="grid md:grid-cols-2 gap-6 text-gray-600 text-sm leading-relaxed">
          <p>
            La lengua Inga es parte fundamental de nuestra identidad cultural. A través de ella transmitimos conocimientos ancestrales, historias y la cosmovisión de nuestro pueblo del Putumayo.
          </p>
          <p>
            Cada palabra lleva siglos de sabiduría. El pueblo Inga habita principalmente en el Valle de Sibundoy, preservando tradiciones de medicina, tejido y agricultura que hoy te invitamos a descubrir.
          </p>
        </div>
      </div>
    </div>
  );
};
