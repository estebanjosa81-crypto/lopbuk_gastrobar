"use client";

import { useEffect, useRef, useState } from 'react';
import { MapPin, Navigation, Loader2 } from 'lucide-react';

interface LocationPickerProps {
  latitude: number | null;
  longitude: number | null;
  onChange: (lat: number, lng: number) => void;
  hideButton?: boolean;
  readOnly?: boolean;
}

export function LocationPicker({ latitude: latProp, longitude: lngProp, onChange, hideButton = false, readOnly = false }: LocationPickerProps) {
  const latitude  = latProp  != null ? Number(latProp)  : null;
  const longitude = lngProp  != null ? Number(lngProp)  : null;
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [leafletLoaded, setLeafletLoaded] = useState(false);

  // Load Leaflet dynamically (SSR-safe)
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const loadLeaflet = async () => {
      try {
        // Load CSS
        if (!document.querySelector('link[href*="leaflet"]')) {
          const link = document.createElement('link');
          link.rel = 'stylesheet';
          link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
          document.head.appendChild(link);
        }

        // Load JS
        const L = (await import('leaflet')).default;

        // Fix default icon paths
        delete (L.Icon.Default.prototype as any)._getIconUrl;
        L.Icon.Default.mergeOptions({
          iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
          iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
          shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
        });

        setLeafletLoaded(true);
      } catch {
        setError('Error al cargar el mapa');
      }
    };

    loadLeaflet();
  }, []);

  // Initialize map
  useEffect(() => {
    if (!leafletLoaded || !mapRef.current || mapInstanceRef.current) return;

    const initMap = async () => {
      const L = (await import('leaflet')).default;

      const defaultLat = latitude || 4.711;  // Bogotá default
      const defaultLng = longitude || -74.0721;
      const defaultZoom = latitude ? 15 : 6;

      const map = L.map(mapRef.current!, {
        center: [defaultLat, defaultLng],
        zoom: defaultZoom,
        zoomControl: true,
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap',
        maxZoom: 19,
      }).addTo(map);

      // Add marker if we have coordinates
      if (latitude && longitude) {
        const marker = L.marker([latitude, longitude], { draggable: !readOnly }).addTo(map);
        if (!readOnly) {
          marker.on('dragend', () => {
            const pos = marker.getLatLng();
            onChange(pos.lat, pos.lng);
          });
        }
        markerRef.current = marker;
      }

      // Click on map to place/move marker (disabled in readOnly mode)
      if (!readOnly) {
        map.on('click', (e: any) => {
          const { lat, lng } = e.latlng;
          if (markerRef.current) {
            markerRef.current.setLatLng([lat, lng]);
          } else {
            const marker = L.marker([lat, lng], { draggable: true }).addTo(map);
            marker.on('dragend', () => {
              const pos = marker.getLatLng();
              onChange(pos.lat, pos.lng);
            });
            markerRef.current = marker;
          }
          onChange(lat, lng);
        });
      }

      mapInstanceRef.current = map;

      // Fix map size after render
      setTimeout(() => map.invalidateSize(), 100);
    };

    initMap();

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        markerRef.current = null;
      }
    };
  }, [leafletLoaded]); // eslint-disable-line react-hooks/exhaustive-deps

  // Sync map when coordinates change externally (e.g. from parent's "Usar mi ubicación")
  useEffect(() => {
    if (!mapInstanceRef.current || latitude == null || longitude == null) return;

    const updateMap = async () => {
      const L = (await import('leaflet')).default;
      mapInstanceRef.current.setView([latitude, longitude], 16, { animate: true });

      if (markerRef.current) {
        markerRef.current.setLatLng([latitude, longitude]);
      } else {
        const marker = L.marker([latitude, longitude], { draggable: !readOnly }).addTo(mapInstanceRef.current);
        if (!readOnly) {
          marker.on('dragend', () => {
            const pos = marker.getLatLng();
            onChange(pos.lat, pos.lng);
          });
        }
        markerRef.current = marker;
      }
    };

    updateMap();
  }, [latitude, longitude]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleUseMyLocation = () => {
    if (!navigator.geolocation) {
      setError('Tu navegador no soporta geolocalización');
      return;
    }

    setIsLocating(true);
    setError(null);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude: lat, longitude: lng } = position.coords;
        onChange(lat, lng);

        if (mapInstanceRef.current) {
          const L = (await import('leaflet')).default;
          mapInstanceRef.current.setView([lat, lng], 16);

          if (markerRef.current) {
            markerRef.current.setLatLng([lat, lng]);
          } else {
            const marker = L.marker([lat, lng], { draggable: true }).addTo(mapInstanceRef.current);
            marker.on('dragend', () => {
              const pos = marker.getLatLng();
              onChange(pos.lat, pos.lng);
            });
            markerRef.current = marker;
          }
        }

        setIsLocating(false);
      },
      (err) => {
        setIsLocating(false);
        if (err.code === 1) {
          setError('Permiso de ubicación denegado. Actívalo en la configuración del navegador.');
        } else {
          setError('No se pudo obtener tu ubicación. Intenta de nuevo.');
        }
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-gray-700 flex items-center gap-1.5">
          <MapPin className="h-4 w-4" />
          Ajusta el pin en el mapa
        </label>
        {!hideButton && (
          <button
            type="button"
            onClick={handleUseMyLocation}
            disabled={isLocating}
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {isLocating ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Navigation className="h-3.5 w-3.5" />
            )}
            {isLocating ? 'Buscando...' : 'Usar mi ubicación'}
          </button>
        )}
      </div>

      <div
        ref={mapRef}
        className="w-full rounded-lg border border-gray-300 overflow-hidden"
        style={{ height: '280px', zIndex: 1 }}
      />

      {error && (
        <p className="text-xs text-red-500">{error}</p>
      )}

      {latitude && longitude && (
        <p className="text-xs text-gray-400">
          {readOnly
            ? `📍 ${latitude.toFixed(5)}, ${longitude.toFixed(5)}`
            : `Coordenadas: ${latitude.toFixed(5)}, ${longitude.toFixed(5)} — Arrastra el pin para ajustar`}
        </p>
      )}

      {!latitude && !longitude && !error && (
        <p className="text-xs text-gray-400">
          Toca el mapa para ajustar el pin de entrega
        </p>
      )}
    </div>
  );
}
