"use client"

import { useEffect, useRef, useState, useCallback } from 'react'
import { MapPin, Navigation, Locate, RefreshCw, Route, Phone, Layers } from 'lucide-react'

const TILE_LAYERS: Record<string, { label: string; url: string; preview: string }> = {
  voyager: {
    label: 'Calles',
    url: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
    preview: '🗺️',
  },
  dark: {
    label: 'Oscuro',
    url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    preview: '🌑',
  },
  satellite: {
    label: 'Satélite',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    preview: '🛰️',
  },
  osm: {
    label: 'OSM',
    url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
    preview: '🌍',
  },
  topo: {
    label: 'Topo',
    url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
    preview: '⛰️',
  },
}

export interface OrderPoint {
  id: string
  orderNumber: string
  customerName: string
  customerPhone: string
  address: string
  municipality: string
  neighborhood: string | null
  status: string
  total: number
  latitude: number
  longitude: number
}

const STATUS_COLORS: Record<string, string> = {
  pendiente:  '#f59e0b',
  confirmado: '#3b82f6',
  preparando: '#a855f7',
  enviado:    '#6366f1',
  entregado:  '#22c55e',
  cancelado:  '#ef4444',
}

const STATUS_LABELS: Record<string, string> = {
  pendiente:  'Pendiente',
  confirmado: 'Confirmado',
  preparando: 'Preparando',
  enviado:    'Enviado',
  entregado:  'Entregado',
  cancelado:  'Cancelado',
}

const formatCOP = (v: number) =>
  new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(v)

const formatDist = (m: number) =>
  m < 1000 ? `${Math.round(m)} m` : `${(m / 1000).toFixed(1)} km`

const formatDur = (s: number) => {
  const m = Math.round(s / 60)
  return m < 60 ? `${m} min` : `${Math.floor(m / 60)}h ${m % 60}min`
}

interface RouteInfo { distance: number; duration: number }

interface OrdersMapProps {
  orders: OrderPoint[]
  height?: number | string
  focusOrderId?: string | null
}

// Draw a pin-shaped marker HTML
function pinHtml(color: string, label: string, pulse: boolean) {
  return `
    <div style="position:relative;width:36px;height:46px;transform:translate(-50%,-100%)">
      ${pulse ? `<div style="position:absolute;inset:0;top:3px;border-radius:50%;background:${color};opacity:0.2;animation:mpulse 1.8s cubic-bezier(0,0,.2,1) infinite"></div>` : ''}
      <div style="position:absolute;left:3px;right:3px;top:2px;bottom:12px;border-radius:50%;background:${color};box-shadow:0 2px 10px ${color}60,0 0 0 2.5px white"></div>
      <div style="position:absolute;left:3px;right:3px;top:2px;bottom:12px;display:flex;align-items:center;justify-content:center">
        <span style="color:white;font-weight:800;font-size:11px;letter-spacing:-0.5px;line-height:1">${label}</span>
      </div>
      <div style="position:absolute;bottom:0;left:50%;transform:translateX(-50%);width:0;height:0;border-left:7px solid transparent;border-right:7px solid transparent;border-top:13px solid ${color}"></div>
    </div>
    <style>@keyframes mpulse{75%,100%{transform:scale(2.4);opacity:0}}</style>
  `
}

// Store/home pin
function storePinHtml() {
  return `
    <div style="position:relative;width:42px;height:52px;transform:translate(-50%,-100%)">
      <div style="position:absolute;left:3px;right:3px;top:2px;bottom:13px;border-radius:50%;background:#0f172a;box-shadow:0 2px 10px rgba(15,23,42,.5),0 0 0 2.5px white"></div>
      <div style="position:absolute;left:3px;right:3px;top:2px;bottom:13px;display:flex;align-items:center;justify-content:center">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
      </div>
      <div style="position:absolute;bottom:0;left:50%;transform:translateX(-50%);width:0;height:0;border-left:8px solid transparent;border-right:8px solid transparent;border-top:14px solid #0f172a"></div>
    </div>
  `
}

export function OrdersMap({ orders, height = 540, focusOrderId }: OrdersMapProps) {
  const mapRef         = useRef<HTMLDivElement>(null)
  const instanceRef    = useRef<any>(null)
  const markersRef     = useRef<Record<string, any>>({})
  const routeLayerRef  = useRef<any>(null)
  const storeMarkerRef = useRef<any>(null)
  const tileLayerRef   = useRef<any>(null)

  const [ready,        setReady]        = useState(false)
  const [mapReady,     setMapReady]     = useState(false)  // true once Leaflet init finishes
  const [storePos,     setStorePos]     = useState<[number, number] | null>(null)
  const [selectedId,   setSelectedId]   = useState<string | null>(null)
  const [routeInfos,   setRouteInfos]   = useState<Record<string, RouteInfo>>({})
  const [loadingRoute, setLoadingRoute] = useState(false)
  const [loadingAll,   setLoadingAll]   = useState(false)
  const [locating,     setLocating]     = useState(false)
  const [activeLayer,  setActiveLayer]  = useState<keyof typeof TILE_LAYERS>('voyager')
  const [layerOpen,    setLayerOpen]    = useState(false)

  // ── Leaflet CSS ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (typeof window === 'undefined') return
    if (!document.querySelector('link[href*="leaflet@1.9.4"]')) {
      const l = document.createElement('link')
      l.rel = 'stylesheet'
      l.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css'
      document.head.appendChild(l)
    }
    setReady(true)
  }, [])

  // ── Init map ───────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!ready || !mapRef.current || instanceRef.current) return

    const init = async () => {
      const L = (await import('leaflet')).default
      const map = L.map(mapRef.current!, {
        center: [4.711, -74.072],
        zoom: 6,
        attributionControl: false,
        zoomControl: false,
      })
      tileLayerRef.current = L.tileLayer(TILE_LAYERS.voyager.url, { maxZoom: 19 }).addTo(map)
      L.control.zoom({ position: 'bottomright' }).addTo(map)
      instanceRef.current = map
      setTimeout(() => {
        map.invalidateSize()
        setMapReady(true) // trigger marker sync AFTER map is fully ready
      }, 150)
    }

    init()
    return () => {
      instanceRef.current?.remove()
      instanceRef.current = null
      markersRef.current = {}
      routeLayerRef.current = null
      storeMarkerRef.current = null
      setMapReady(false)
    }
  }, [ready])

  // ── Swap tile layer ────────────────────────────────────────────────────────
  useEffect(() => {
    if (!instanceRef.current || !mapReady) return
    const swap = async () => {
      const L = (await import('leaflet')).default
      const map = instanceRef.current
      if (tileLayerRef.current) {
        map.removeLayer(tileLayerRef.current)
      }
      tileLayerRef.current = L.tileLayer(TILE_LAYERS[activeLayer].url, { maxZoom: 19 }).addTo(map)
      tileLayerRef.current.bringToBack()
    }
    swap()
  }, [activeLayer, mapReady])

  // ── Order markers ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!instanceRef.current || !mapReady) return
    const map = instanceRef.current

    const sync = async () => {
      const L = (await import('leaflet')).default
      Object.values(markersRef.current).forEach((m: any) => m.remove())
      markersRef.current = {}

      if (!orders.length) return
      const bounds: [number, number][] = []

      orders.forEach((order, idx) => {
        const color = STATUS_COLORS[order.status] || '#6b7280'
        const pulse = order.status === 'enviado' || order.status === 'preparando'

        const icon = L.divIcon({
          className: '',
          html: pinHtml(color, String(idx + 1), pulse),
          iconSize: [0, 0],
          iconAnchor: [0, 0],
        })

        const lat = Number(order.latitude)
        const lng = Number(order.longitude)
        if (!lat || !lng) return
        const marker = L.marker([lat, lng], { icon }).addTo(map)
        marker.on('click', () => setSelectedId(order.id))
        markersRef.current[order.id] = marker
        bounds.push([lat, lng])
      })

      if (bounds.length === 1) map.setView(bounds[0], 15)
      else map.fitBounds(bounds, { padding: [70, 280] })
    }

    sync()
  }, [orders, mapReady])

  // ── Store marker ───────────────────────────────────────────────────────────
  useEffect(() => {
    if (!instanceRef.current || !ready) return

    const update = async () => {
      const L = (await import('leaflet')).default
      storeMarkerRef.current?.remove()
      storeMarkerRef.current = null
      if (!storePos) return

      const icon = L.divIcon({
        className: '',
        html: storePinHtml(),
        iconSize: [0, 0],
        iconAnchor: [0, 0],
      })

      storeMarkerRef.current = L.marker(storePos, { icon })
        .bindTooltip('Mi Tienda', { permanent: false, direction: 'top', offset: [0, -46] })
        .addTo(instanceRef.current)
    }

    update()
  }, [storePos, mapReady])

  // ── OSRM route fetcher ─────────────────────────────────────────────────────
  const fetchRoute = useCallback(async (orderId: string, silent = false) => {
    if (!storePos || !instanceRef.current) return null
    const order = orders.find(o => o.id === orderId)
    if (!order) return null
    if (!silent) setLoadingRoute(true)

    try {
      const [lat, lng] = storePos
      const url = `https://router.project-osrm.org/route/v1/driving/${lng},${lat};${Number(order.longitude)},${Number(order.latitude)}?overview=full&geometries=geojson`
      const res = await fetch(url)
      const data = await res.json()

      if (data.code === 'Ok' && data.routes[0]) {
        const route = data.routes[0]
        const info: RouteInfo = { distance: route.distance, duration: route.duration }
        setRouteInfos(prev => ({ ...prev, [orderId]: info }))
        return { geometry: route.geometry, info, order }
      }
    } catch { /* silent fail */ } finally {
      if (!silent) setLoadingRoute(false)
    }
    return null
  }, [storePos, orders])

  // Draw route on map
  const drawRoute = useCallback(async (orderId: string) => {
    const result = await fetchRoute(orderId)
    if (!result) return

    const L = (await import('leaflet')).default
    const map = instanceRef.current
    routeLayerRef.current?.remove()

    const color = STATUS_COLORS[result.order.status] || '#6366f1'
    routeLayerRef.current = L.geoJSON(result.geometry, {
      style: { color, weight: 5, opacity: 0.9, lineCap: 'round', lineJoin: 'round' },
    }).addTo(map)

    map.fitBounds(routeLayerRef.current.getBounds(), { padding: [60, 280] })
  }, [fetchRoute])

  // ── Selected order → zoom + route ─────────────────────────────────────────
  useEffect(() => {
    if (!selectedId || !instanceRef.current) return
    const marker = markersRef.current[selectedId]
    if (!marker) return

    if (storePos) {
      drawRoute(selectedId)
    } else {
      instanceRef.current.setView(marker.getLatLng(), 15, { animate: true })
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId])

  // ── Re-draw route if store position changes while order is selected ─────────
  useEffect(() => {
    if (!selectedId || !storePos) return
    drawRoute(selectedId)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storePos])

  // ── focusOrderId from parent ───────────────────────────────────────────────
  useEffect(() => {
    if (focusOrderId) setSelectedId(focusOrderId)
  }, [focusOrderId])

  // ── Calculate ALL routes ───────────────────────────────────────────────────
  const calcAllRoutes = useCallback(async () => {
    if (!storePos) return
    setLoadingAll(true)
    for (const order of orders) {
      await fetchRoute(order.id, true)
      await new Promise(r => setTimeout(r, 300)) // avoid rate-limit
    }
    setLoadingAll(false)
  }, [storePos, orders, fetchRoute])

  // ── Get GPS location ───────────────────────────────────────────────────────
  const handleLocate = () => {
    setLocating(true)
    navigator.geolocation.getCurrentPosition(
      pos => {
        const coords: [number, number] = [pos.coords.latitude, pos.coords.longitude]
        setStorePos(coords)
        instanceRef.current?.setView(coords, 13, { animate: true })
        setLocating(false)
      },
      () => setLocating(false),
      { enableHighAccuracy: true, timeout: 8000 }
    )
  }

  // ── Empty state ────────────────────────────────────────────────────────────
  if (!orders.length) {
    return (
      <div
        className="flex flex-col items-center justify-center rounded-xl border border-dashed text-muted-foreground bg-muted/20"
        style={{ height }}
      >
        <MapPin className="h-10 w-10 mb-3 opacity-25" />
        <p className="text-sm font-medium">Sin pedidos georeferenciados</p>
        <p className="text-xs mt-1 opacity-60">Los pedidos con ubicación de entrega aparecerán aquí</p>
      </div>
    )
  }

  const selectedOrder = orders.find(o => o.id === selectedId)
  const selectedRoute = selectedId ? routeInfos[selectedId] : null

  return (
    <div className="relative rounded-xl overflow-hidden border shadow-md" style={{ height, isolation: 'isolate' }}>
      {/* Map */}
      <div ref={mapRef} className="absolute inset-0 w-full h-full" />

      {/* ── Top-left toolbar ── */}
      <div className="absolute top-3 left-3 z-[1000] flex flex-wrap gap-2">
        {/* Locate button */}
        <button
          onClick={handleLocate}
          disabled={locating}
          title="Obtener mi ubicación actual"
          className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold shadow-lg border backdrop-blur-md transition-all ${
            storePos
              ? 'bg-slate-900 text-white border-slate-800 hover:bg-slate-800'
              : 'bg-white/95 text-slate-800 border-white/60 hover:bg-white'
          }`}
        >
          {locating
            ? <RefreshCw className="h-3.5 w-3.5 animate-spin" />
            : <Locate className="h-3.5 w-3.5" />
          }
          {storePos ? 'Tienda ubicada' : 'Ubicar mi tienda'}
        </button>

        {/* Calc all routes */}
        {storePos && (
          <button
            onClick={calcAllRoutes}
            disabled={loadingAll}
            title="Calcular distancia y tiempo a todos los pedidos"
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold shadow-lg border bg-white/95 backdrop-blur-md border-white/60 text-slate-800 hover:bg-white transition-all"
          >
            {loadingAll
              ? <RefreshCw className="h-3.5 w-3.5 animate-spin" />
              : <Route className="h-3.5 w-3.5" />
            }
            {loadingAll ? 'Calculando...' : 'Calcular todas las rutas'}
          </button>
        )}
      </div>

      {/* ── Layer picker ── */}
      <div className="absolute bottom-10 right-[268px] z-[1000]">
        <div className="relative">
          <button
            onClick={() => setLayerOpen(o => !o)}
            title="Cambiar capa del mapa"
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold shadow-lg border bg-white/95 backdrop-blur-md border-white/60 text-slate-800 hover:bg-white transition-all"
          >
            <Layers className="h-3.5 w-3.5" />
            {TILE_LAYERS[activeLayer].preview} {TILE_LAYERS[activeLayer].label}
          </button>

          {layerOpen && (
            <div className="absolute bottom-full mb-2 right-0 bg-white/98 dark:bg-gray-950/98 backdrop-blur-md rounded-xl shadow-2xl border border-border/50 overflow-hidden min-w-[130px]">
              <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest px-3 pt-2.5 pb-1.5">
                Capa del mapa
              </p>
              {Object.entries(TILE_LAYERS).map(([key, cfg]) => (
                <button
                  key={key}
                  onClick={() => { setActiveLayer(key as keyof typeof TILE_LAYERS); setLayerOpen(false) }}
                  className={`w-full text-left flex items-center gap-2.5 px-3 py-2 text-xs transition-colors ${
                    activeLayer === key
                      ? 'bg-primary/10 text-primary font-bold'
                      : 'hover:bg-muted/60 text-foreground/80'
                  }`}
                >
                  <span className="text-base leading-none">{cfg.preview}</span>
                  {cfg.label}
                  {activeLayer === key && (
                    <span className="ml-auto text-primary text-[10px] font-bold">✓</span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Loading route indicator ── */}
      {loadingRoute && (
        <div className="absolute top-3 left-1/2 -translate-x-1/2 z-[1000] bg-white/95 backdrop-blur-md shadow-lg border border-white/60 rounded-full px-4 py-2 flex items-center gap-2 text-xs font-semibold text-slate-700">
          <RefreshCw className="h-3.5 w-3.5 animate-spin text-primary" />
          Trazando ruta...
        </div>
      )}

      {/* ── Right sidebar ── */}
      <div className="absolute top-0 right-0 bottom-0 z-[1000] w-64 bg-white/96 dark:bg-gray-950/96 backdrop-blur-md border-l border-border/50 flex flex-col shadow-2xl">
        {/* Header */}
        <div className="px-3.5 py-3 border-b border-border/50 shrink-0">
          <div className="flex items-center justify-between mb-0.5">
            <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest">
              Pedidos · {orders.length}
            </span>
            <span className="text-[10px] font-semibold text-primary">
              {orders.filter(o => routeInfos[o.id]).length}/{orders.length} rutas
            </span>
          </div>
          {!storePos ? (
            <p className="text-[10px] text-amber-600 font-medium mt-0.5 flex items-center gap-1">
              <Locate className="h-3 w-3 shrink-0" />
              Activa "Ubicar mi tienda" para ver rutas
            </p>
          ) : (
            <p className="text-[10px] text-green-600 font-medium mt-0.5 flex items-center gap-1">
              <MapPin className="h-3 w-3 shrink-0" />
              Clic en un pedido para trazar la ruta
            </p>
          )}
        </div>

        {/* Order list */}
        <div className="flex-1 overflow-y-auto divide-y divide-border/40">
          {orders.map((order, idx) => {
            const color  = STATUS_COLORS[order.status] || '#6b7280'
            const ri     = routeInfos[order.id]
            const isSel  = selectedId === order.id

            return (
              <button
                key={order.id}
                onClick={() => setSelectedId(isSel ? null : order.id)}
                className={`w-full text-left px-3.5 py-3 transition-all ${
                  isSel
                    ? 'bg-primary/[0.06] dark:bg-primary/[0.12]'
                    : 'hover:bg-muted/50'
                }`}
              >
                <div className="flex items-start gap-2.5">
                  {/* Number badge */}
                  <div
                    className="w-6 h-6 rounded-full shrink-0 flex items-center justify-center text-white font-bold text-[11px] mt-0.5 shadow"
                    style={{ background: color }}
                  >
                    {idx + 1}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <span className="text-xs font-bold truncate">{order.orderNumber}</span>
                    </div>
                    <p className="text-[11px] text-foreground/75 truncate font-medium">{order.customerName}</p>
                    <p className="text-[10px] text-muted-foreground truncate">{order.address}{order.neighborhood ? `, ${order.neighborhood}` : ''}</p>

                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <span
                        className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                        style={{ background: `${color}18`, color }}
                      >
                        {STATUS_LABELS[order.status]}
                      </span>
                      {ri ? (
                        <span className="text-[10px] font-semibold text-primary/80">
                          {formatDist(ri.distance)} · {formatDur(ri.duration)}
                        </span>
                      ) : (
                        <span className="text-[10px] text-muted-foreground">
                          {formatCOP(Number(order.total) || 0)}
                        </span>
                      )}
                    </div>

                    {/* Expanded actions */}
                    {isSel && (
                      <div className="mt-2.5 space-y-1.5">
                        {ri && (
                          <div className="flex items-center gap-2 text-[11px] text-muted-foreground bg-muted/60 rounded-lg px-2.5 py-2">
                            <Route className="h-3.5 w-3.5 text-primary shrink-0" />
                            <span className="font-semibold text-foreground">{formatDist(ri.distance)}</span>
                            <span>·</span>
                            <span className="font-semibold text-foreground">{formatDur(ri.duration)}</span>
                            <span className="text-muted-foreground">en auto</span>
                          </div>
                        )}
                        <a
                          href={`https://www.google.com/maps/dir/?api=1${storePos ? `&origin=${storePos[0]},${storePos[1]}` : ''}&destination=${order.latitude},${order.longitude}&travelmode=driving`}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={e => e.stopPropagation()}
                          className="flex items-center justify-center gap-1.5 w-full text-[11px] font-bold py-2 rounded-lg bg-green-600 text-white hover:bg-green-700 transition-colors"
                        >
                          <Navigation className="h-3.5 w-3.5" />
                          Abrir ruta en Google Maps
                        </a>
                        <a
                          href={`https://wa.me/${order.customerPhone.replace(/\D/g, '')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={e => e.stopPropagation()}
                          className="flex items-center justify-center gap-1.5 w-full text-[11px] font-bold py-2 rounded-lg text-white hover:opacity-90 transition-colors"
                          style={{ background: '#25D366' }}
                        >
                          <Phone className="h-3.5 w-3.5" />
                          WhatsApp al cliente
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              </button>
            )
          })}
        </div>

        {/* Footer: total */}
        <div className="border-t border-border/50 px-3.5 py-2.5 shrink-0 bg-muted/30">
          <div className="flex justify-between items-center text-xs">
            <span className="text-muted-foreground font-medium">Total pedidos</span>
            <span className="font-bold text-foreground">
              {formatCOP(orders.reduce((acc, o) => acc + (Number(o.total) || 0), 0))}
            </span>
          </div>
          {Object.values(routeInfos).length > 0 && (
            <div className="flex justify-between items-center text-xs mt-1">
              <span className="text-muted-foreground font-medium">Distancia total</span>
              <span className="font-bold text-primary">
                {formatDist(Object.values(routeInfos).reduce((a, r) => a + r.distance, 0))}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* ── Bottom-left legend ── */}
      <div className="absolute bottom-10 left-3 z-[1000] bg-white/94 dark:bg-gray-950/94 backdrop-blur-md rounded-xl shadow-lg border border-border/50 px-3 py-2.5">
        <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mb-2">Estado</p>
        <div className="space-y-1.5">
          {Object.entries(STATUS_LABELS).map(([key, label]) => {
            const count = orders.filter(o => o.status === key).length
            if (!count) return null
            return (
              <div key={key} className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: STATUS_COLORS[key] }} />
                <span className="text-[11px] text-foreground/70 leading-none">{label}</span>
                <span className="text-[11px] font-bold text-foreground/40 ml-auto pl-2">{count}</span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
