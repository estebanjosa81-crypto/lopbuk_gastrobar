'use client'

// Página de inicio pública del restaurante: portada + logo + estado abierto/cerrado,
// promos/eventos (banners), platos destacados y CTAs a "Ver menú" y "Reservar".
// Reutiliza el endpoint existente /storefront/store-config/:slug (sin tablas nuevas).
import { useEffect, useState, useCallback } from 'react'
import { useParams } from 'next/navigation'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'
const money = (n: number) => '$' + Number(n || 0).toLocaleString('es-CO')

type Banner = { id: string; imageUrl?: string | null; videoUrl?: string | null; title?: string | null; subtitle?: string | null; linkUrl?: string | null }
type Featured = { id: string | number; name: string; description?: string | null; price?: number; salePrice?: number; imageUrl?: string | null; images?: string[] | null; image_url?: string | null }

const imgOf = (p: Featured) => p.imageUrl || (Array.isArray(p.images) ? p.images[0] : null) || p.image_url || null
const priceOf = (p: Featured) => Number(p.price ?? p.salePrice ?? 0)

export default function RestaurantHome() {
  const { slug } = useParams<{ slug: string }>()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [name, setName] = useState('Restaurante')
  const [info, setInfo] = useState<any>(null)
  const [banners, setBanners] = useState<Banner[]>([])
  const [featured, setFeatured] = useState<Featured[]>([])
  const [openState, setOpenState] = useState<'open' | 'closed'>('open')
  const [nextOpen, setNextOpen] = useState<string | null>(null)
  const [accent, setAccent] = useState('#6366f1')

  const load = useCallback(async () => {
    try {
      const r = await fetch(`${API_URL}/storefront/store-config/${slug}`)
      const j = await r.json()
      if (!r.ok || !j.success) { setError(j?.error || 'Restaurante no disponible'); return }
      const d = j.data
      setInfo(d.storeInfo || null)
      setName(d.storeInfo?.name || 'Restaurante')
      setBanners((d.banners || []).filter((b: Banner) => b.imageUrl || b.title))
      setFeatured((d.featuredProducts || []).slice(0, 6))
      setOpenState(d.openState || 'open')
      setNextOpen(d.nextOpenLabel || null)
      const tc = d.themeColors || {}
      setAccent(tc.accent || tc.primary || tc.brand || '#6366f1')
    } catch { setError('No se pudo conectar') }
    finally { setLoading(false) }
  }, [slug])

  useEffect(() => { if (slug) load() }, [slug, load])

  if (loading) return <div className="min-h-screen flex items-center justify-center text-gray-400" style={{ background: '#0b0b14' }}>Cargando…</div>
  if (error) return (
    <div className="min-h-screen flex flex-col items-center justify-center text-center px-6" style={{ background: '#0b0b14', color: '#fff' }}>
      <div className="text-5xl mb-3">🍽️</div>
      <h1 className="text-xl font-bold mb-1">Restaurante no disponible</h1>
      <p className="text-gray-400 text-sm">{error}</p>
    </div>
  )

  const cover = info?.cardCoverUrl || null
  const logo = info?.logoUrl || null
  const desc = info?.cardDescription || info?.infoModuleDescription || null
  const wa = info?.socialWhatsapp || null
  const ig = info?.socialInstagram || null

  return (
    <div className="min-h-screen text-white" style={{ background: '#0b0b14' }}>
      {/* Hero */}
      <div className="relative">
        <div className="h-60 sm:h-80 w-full overflow-hidden">
          {cover
            ? <img src={cover} alt={name} className="w-full h-full object-cover" />
            : <div className="w-full h-full" style={{ background: `linear-gradient(135deg, ${accent}55, #0b0b14)` }} />}
          <div className="absolute inset-0" style={{ background: 'linear-gradient(transparent 30%, #0b0b14)' }} />
        </div>

        <div className="px-5 -mt-16 relative max-w-2xl mx-auto">
          <div className="flex items-end gap-4">
            {logo && <img src={logo} alt={name} className="w-20 h-20 rounded-2xl object-cover border-2 border-white/15 shadow-xl" />}
            <div className="pb-1">
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full mb-2"
                style={{ color: openState === 'open' ? '#22c55e' : '#f87171', background: (openState === 'open' ? '#22c55e' : '#f87171') + '22' }}>
                <span className="w-1.5 h-1.5 rounded-full" style={{ background: openState === 'open' ? '#22c55e' : '#f87171' }} />
                {openState === 'open' ? 'Abierto ahora' : (nextOpen ? `Cerrado · ${nextOpen}` : 'Cerrado')}
              </span>
              <h1 className="text-2xl sm:text-3xl font-black leading-tight">{name}</h1>
            </div>
          </div>
          {desc && <p className="text-gray-400 text-sm mt-3">{desc}</p>}
        </div>
      </div>

      {/* CTAs principales */}
      <div className="px-5 mt-6 max-w-2xl mx-auto grid grid-cols-2 gap-3">
        <a href={`/menu/${slug}`} className="rounded-2xl py-4 text-center font-bold shadow-lg" style={{ background: accent }}>
          <div className="text-2xl mb-0.5">📖</div>Ver menú
        </a>
        <a href={`/reservar/${slug}`} className="rounded-2xl py-4 text-center font-bold border border-white/15 bg-white/[0.04]">
          <div className="text-2xl mb-0.5">📅</div>Reservar mesa
        </a>
      </div>

      {/* Promos / Eventos */}
      {banners.length > 0 && (
        <div className="mt-8 max-w-2xl mx-auto">
          <h2 className="px-5 text-xs font-bold uppercase tracking-widest text-gray-400 mb-3">Promociones y eventos</h2>
          <div className="flex gap-3 overflow-x-auto px-5 pb-2 snap-x">
            {banners.map(b => {
              const card = (
                <div className="relative min-w-[78%] sm:min-w-[60%] snap-start rounded-2xl overflow-hidden border border-white/10 bg-white/[0.03]">
                  {b.imageUrl
                    ? <img src={b.imageUrl} alt={b.title || 'Promo'} className="w-full h-40 object-cover" />
                    : <div className="w-full h-40" style={{ background: `linear-gradient(135deg, ${accent}66, transparent)` }} />}
                  {(b.title || b.subtitle) && (
                    <div className="absolute inset-x-0 bottom-0 p-3" style={{ background: 'linear-gradient(transparent, rgba(0,0,0,.8))' }}>
                      {b.title && <p className="font-bold leading-tight">{b.title}</p>}
                      {b.subtitle && <p className="text-xs text-gray-300">{b.subtitle}</p>}
                    </div>
                  )}
                </div>
              )
              return b.linkUrl
                ? <a key={b.id} href={b.linkUrl} target="_blank" rel="noopener noreferrer" className="contents">{card}</a>
                : <div key={b.id} className="contents">{card}</div>
            })}
          </div>
        </div>
      )}

      {/* Destacados */}
      {featured.length > 0 && (
        <div className="mt-8 max-w-2xl mx-auto">
          <div className="px-5 flex items-center justify-between mb-3">
            <h2 className="text-xs font-bold uppercase tracking-widest text-gray-400">Destacados</h2>
            <a href={`/menu/${slug}`} className="text-xs font-semibold" style={{ color: accent }}>Ver todo →</a>
          </div>
          <div className="grid grid-cols-2 gap-3 px-5">
            {featured.map(p => (
              <a key={p.id} href={`/menu/${slug}`} className="rounded-2xl overflow-hidden border border-white/10 bg-white/[0.03]">
                {imgOf(p)
                  ? <img src={imgOf(p)!} alt={p.name} className="w-full h-28 object-cover" />
                  : <div className="w-full h-28 flex items-center justify-center text-2xl bg-white/5">🍽️</div>}
                <div className="p-2.5">
                  <p className="font-semibold text-sm leading-tight line-clamp-1">{p.name}</p>
                  {priceOf(p) > 0 && <p className="text-sm font-bold mt-0.5" style={{ color: accent }}>{money(priceOf(p))}</p>}
                </div>
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Info */}
      <div className="mt-8 max-w-2xl mx-auto px-5 pb-12 space-y-2 text-sm text-gray-300">
        {info?.schedule && <p>🕒 {String(info.schedule)}</p>}
        {info?.address && <p>📍 {info.address}</p>}
        {info?.phone && <p>📞 <a href={`tel:${info.phone}`} className="underline">{info.phone}</a></p>}
        <div className="flex gap-3 pt-2">
          {wa && <a href={`https://wa.me/${String(wa).replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" className="text-xs font-semibold rounded-full px-3 py-1.5 border border-white/15">WhatsApp</a>}
          {ig && <a href={ig.startsWith('http') ? ig : `https://instagram.com/${ig.replace(/^@/, '')}`} target="_blank" rel="noopener noreferrer" className="text-xs font-semibold rounded-full px-3 py-1.5 border border-white/15">Instagram</a>}
        </div>
      </div>
    </div>
  )
}
