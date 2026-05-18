"use client";

import { useEffect, useRef, useState } from 'react';
import { Pencil } from 'lucide-react';

interface MiniMapProps {
  latitude: number;
  longitude: number;
  height?: number;
  onEdit?: () => void;
}

export function MiniMap({ latitude, longitude, height = 130, onEdit }: MiniMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const instanceRef = useRef<any>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const load = async () => {
      if (!document.querySelector('link[href*="leaflet"]')) {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
        document.head.appendChild(link);
      }
      setReady(true);
    };
    load();
  }, []);

  useEffect(() => {
    if (!ready || !mapRef.current || instanceRef.current) return;

    const init = async () => {
      const L = (await import('leaflet')).default;

      const map = L.map(mapRef.current!, {
        center: [latitude, longitude],
        zoom: 15,
        zoomControl: false,
        attributionControl: false,
        dragging: false,
        touchZoom: false,
        doubleClickZoom: false,
        scrollWheelZoom: false,
        boxZoom: false,
        keyboard: false,
      });

      // CartoDB dark tiles — matches the dark card design
      L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        maxZoom: 19,
      }).addTo(map);

      // Custom SVG pin with pulse ring
      const icon = L.divIcon({
        className: '',
        html: `
          <div style="position:relative;width:36px;height:36px;transform:translate(-50%,-50%)">
            <div style="position:absolute;inset:0;border-radius:50%;background:rgba(59,130,246,0.25);animation:ping 1.5s cubic-bezier(0,0,0.2,1) infinite"></div>
            <div style="position:absolute;inset:6px;border-radius:50%;background:#3b82f6;box-shadow:0 0 0 3px rgba(59,130,246,0.4)"></div>
          </div>
          <style>@keyframes ping{75%,100%{transform:scale(1.8);opacity:0}}</style>
        `,
        iconSize: [0, 0],
        iconAnchor: [0, 0],
      });

      L.marker([latitude, longitude], { icon }).addTo(map);
      instanceRef.current = map;
      setTimeout(() => map.invalidateSize(), 80);
    };

    init();

    return () => {
      if (instanceRef.current) {
        instanceRef.current.remove();
        instanceRef.current = null;
      }
    };
  }, [ready]); // eslint-disable-line react-hooks/exhaustive-deps

  // Re-center if coords change
  useEffect(() => {
    if (!instanceRef.current) return;
    instanceRef.current.setView([latitude, longitude], 15, { animate: false });
  }, [latitude, longitude]);

  return (
    <div className="relative overflow-hidden rounded-xl" style={{ height, isolation: 'isolate' }}>
      {/* Map */}
      <div ref={mapRef} className="absolute inset-0 w-full h-full" style={{ zIndex: 0 }} />

      {/* Subtle vignette overlay so the card edges fade nicely */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.55) 100%)',
          zIndex: 1,
        }}
      />

      {/* Edit button overlay */}
      {onEdit && (
        <button
          onClick={onEdit}
          className="absolute bottom-2.5 right-2.5 z-10 flex items-center gap-1.5 text-[11px] bg-black/60 backdrop-blur-md border border-white/20 text-white/80 hover:text-white hover:bg-black/80 px-2.5 py-1.5 rounded-lg transition-all"
        >
          <Pencil className="w-3 h-3" />
          Editar dirección
        </button>
      )}
    </div>
  );
}
