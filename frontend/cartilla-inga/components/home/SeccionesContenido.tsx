import React, { useEffect, useState } from 'react';
import { ExternalLink, Images, BookOpen, Layout, Layers, Flag } from 'lucide-react';
import { seccionesPublicAPI, type SeccionPublicaAPI } from '../../services/api';

const TIPO_META: Record<string, { label: string; badge: string; icon: React.FC<React.SVGProps<SVGSVGElement>> }> = {
  portada:      { label: 'Portada',      badge: 'bg-amber-100 text-amber-700',   icon: Layout  },
  presentacion: { label: 'Presentación', badge: 'bg-blue-100 text-blue-700',     icon: Layers  },
  modulo:       { label: 'Módulo',       badge: 'bg-emerald-100 text-emerald-700', icon: BookOpen },
  galeria:      { label: 'Galería',      badge: 'bg-purple-100 text-purple-700', icon: Images  },
  cierre:       { label: 'Cierre',       badge: 'bg-slate-100 text-slate-600',   icon: Flag    },
};

function SeccionCard({ s }: { s: SeccionPublicaAPI }) {
  const meta = TIPO_META[s.tipo] ?? TIPO_META.presentacion;
  const BadgeIcon = meta.icon;
  const tieneImagen = !!s.imagen_url;

  const inner = (
    <div className={`bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden flex flex-col sm:flex-row transition ${s.link_url ? 'hover:shadow-md hover:border-emerald-200 cursor-pointer' : ''}`}>
      {/* Imagen */}
      {tieneImagen && (
        <div className="sm:w-5/12 shrink-0 overflow-hidden">
          <img
            src={s.imagen_url!}
            alt={s.imagen_alt ?? s.titulo}
            className="w-full h-52 sm:h-full object-cover"
          />
        </div>
      )}

      {/* Texto */}
      <div className={`flex-1 flex flex-col justify-center px-5 py-5 sm:px-7 sm:py-6 gap-3 ${!tieneImagen ? 'sm:px-8 sm:py-8' : ''}`}>
        {/* Badge tipo */}
        <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full w-fit ${meta.badge}`}>
          <BadgeIcon className="w-3 h-3" />
          {meta.label}
        </span>

        <div>
          <h3 className="text-xl font-bold text-slate-800 leading-snug">{s.titulo}</h3>
          {s.subtitulo && (
            <p className="text-emerald-700 font-medium text-sm mt-1">{s.subtitulo}</p>
          )}
          {s.contenido && (
            <p className="text-slate-600 text-sm mt-3 leading-relaxed whitespace-pre-wrap">
              {s.contenido}
            </p>
          )}
        </div>

        {s.link_url && (
          <div className="flex items-center gap-1.5 text-emerald-600 text-sm font-medium mt-1">
            <ExternalLink className="w-3.5 h-3.5" />
            Ver más
          </div>
        )}
      </div>
    </div>
  );

  if (s.link_url) {
    const esExterno = s.link_url.startsWith('http');
    return (
      <a
        href={s.link_url}
        target={esExterno ? '_blank' : undefined}
        rel={esExterno ? 'noopener noreferrer' : undefined}
        className="block"
      >
        {inner}
      </a>
    );
  }
  return inner;
}

export const SeccionesContenido: React.FC = () => {
  const [secciones, setSecciones] = useState<SeccionPublicaAPI[]>([]);

  useEffect(() => {
    seccionesPublicAPI.getActivas().then(setSecciones).catch(() => {});
  }, []);

  if (secciones.length === 0) return null;

  return (
    <div className="space-y-4">
      {secciones.map(s => (
        <SeccionCard key={s.id} s={s} />
      ))}
    </div>
  );
};
