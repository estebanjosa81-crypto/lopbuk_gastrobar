'use client'

/**
 * CoachSection — la Coach Economy dentro del OS (T2/T7).
 * Hero aspiracional + ranking de top coaches (Transformation Score) + catálogo.
 * Al abrir un coach: score, reseñas y sus PROGRAMAS (no "sesiones"). Si el usuario
 * tiene un programa activo, entra directo a su feed (ProgramFeed) — toggle para explorar.
 */
import { useEffect, useState } from 'react'
import { ArrowLeft, Star, Loader2, Dumbbell, Crown, Clock, Trophy, Flame } from 'lucide-react'
import { api } from '@/lib/api'
import ProgramFeed from './ProgramFeed'

const COP = (n: number) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(Number(n) || 0)
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'
const ASSET = API_URL.replace(/\/api$/, '')
const abs = (u?: string | null) => (!u ? '' : u.startsWith('http') ? u : `${ASSET}${u}`)
const fmtDate = (d?: string) => (d ? new Date(d).toLocaleDateString('es-CO', { day: '2-digit', month: 'short' }) : '')

const KIND_LABEL: Record<string, string> = { programa: 'Programa', sesion: 'Sesión', mensual: 'Mensualidad', combo: 'Combo' }

function Stars({ value, size = 'w-3.5 h-3.5' }: { value: number; size?: string }) {
  return (
    <span className="inline-flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map(i => (
        <Star key={i} className={`${size} ${i <= Math.round(value) ? 'text-amber-400 fill-amber-400' : 'text-neutral-300'}`} />
      ))}
    </span>
  )
}

export default function CoachSection({ onBook }: { onBook?: (offer: any, trainer: any) => void }) {
  const [trainers, setTrainers] = useState<any[]>([])
  const [ranking, setRanking] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [sel, setSel] = useState<any | null>(null)
  const [loadingSel, setLoadingSel] = useState(false)
  const [booking, setBooking] = useState<string | null>(null)
  const [bookErr, setBookErr] = useState('')
  const [activeProgram, setActiveProgram] = useState<any>(null)
  const [browse, setBrowse] = useState(false)

  useEffect(() => {
    api.getActiveProgram().then(r => { if (r.success) setActiveProgram(r.data) }).catch(() => {})
  }, [])

  useEffect(() => {
    Promise.all([api.getPublicTrainers(), api.getCoachRanking(5)]).then(([t, r]) => {
      if (t.success) setTrainers(t.data || [])
      if (r.success) setRanking(r.data || [])
    }).finally(() => setLoading(false))
  }, [])

  const startBooking = async (offer: any) => {
    if (booking) return
    setBooking(offer.id); setBookErr('')
    try {
      onBook?.(offer, sel)
      api.trackConsumerEvent('coach_program_started', { offerId: offer.id }).catch(() => {})
      const r = await api.createTrainerBooking(offer.id)
      if (r.success && r.data?.checkoutUrl) { window.location.href = r.data.checkoutUrl; return }
      setBookErr(r.error || 'No se pudo iniciar la contratación.')
    } catch (e: any) {
      setBookErr(e?.message || 'No se pudo iniciar la contratación.')
    } finally { setBooking(null) }
  }

  const openTrainer = async (id: string) => {
    setLoadingSel(true)
    try { const r = await api.getPublicTrainer(id); if (r.success) setSel(r.data) }
    finally { setLoadingSel(false) }
  }

  // Programa activo → feed de coaching (a menos que el usuario quiera explorar).
  if (activeProgram && !browse) {
    return <ProgramFeed program={activeProgram} onBrowse={() => setBrowse(true)} />
  }

  if (loading) return <div className="flex justify-center py-16 text-neutral-300"><Loader2 className="w-7 h-7 animate-spin" /></div>

  // ── Detalle de un entrenador ──
  if (sel) {
    return (
      <div className="p-6 max-w-3xl mx-auto">
        <button onClick={() => setSel(null)} className="text-sm text-neutral-500 hover:text-neutral-900 flex items-center gap-1.5 mb-4"><ArrowLeft className="w-4 h-4" /> Entrenadores</button>
        <div className="flex items-center gap-4">
          <div className="w-20 h-20 rounded-2xl bg-neutral-100 overflow-hidden shrink-0">
            {sel.photoUrl ? <img src={abs(sel.photoUrl)} alt={sel.name} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-neutral-300"><Dumbbell className="w-8 h-8" /></div>}
          </div>
          <div className="min-w-0">
            <h2 className="text-xl font-extrabold text-neutral-900">{sel.name}</h2>
            <div className="text-xs text-neutral-500 flex items-center gap-2 mt-1">
              <Stars value={sel.ratingAvg || 0} />
              {sel.ratingAvg > 0 && <span className="font-medium text-neutral-700">{sel.ratingAvg.toFixed(1)}</span>}
              <span className="text-neutral-400">({sel.reviewsCount || 0})</span>
            </div>
            <div className="flex items-center gap-3 mt-1.5 text-[11px]">
              <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-700 font-semibold rounded-full px-2 py-0.5"><Flame className="w-3 h-3" /> Score {sel.transformationScore || 0}</span>
              <span className="text-neutral-500">{sel.sessionsCount || 0} transformaciones</span>
            </div>
            {Array.isArray(sel.specialties) && sel.specialties.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-1.5">{sel.specialties.map((s: string) => <span key={s} className="text-[10px] bg-neutral-100 text-neutral-600 rounded-full px-2 py-0.5">{s}</span>)}</div>
            )}
          </div>
        </div>
        {sel.bio && <p className="text-sm text-neutral-600 mt-3">{sel.bio}</p>}

        <h3 className="text-sm font-bold text-neutral-800 mt-6 mb-2">Programas</h3>
        <div className="space-y-3">
          {(sel.offers || []).length === 0 && <p className="text-sm text-neutral-400">Aún sin programas publicados.</p>}
          {(sel.offers || []).map((o: any) => (
            <div key={o.id} className="rounded-2xl border border-black/[0.07] bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <span className="text-[10px] font-bold uppercase tracking-wide text-amber-600">{KIND_LABEL[o.kind] || o.kind}</span>
                {o.durationDays ? <span className="text-[11px] text-neutral-400 flex items-center gap-1"><Clock className="w-3 h-3" />{o.durationDays} días</span> : null}
              </div>
              <p className="text-base font-bold text-neutral-900 mt-1">{o.title}</p>
              {o.description && <p className="text-sm text-neutral-600 mt-1 line-clamp-3">{o.description}</p>}
              <div className="flex items-center justify-between mt-3">
                <span className="text-lg font-extrabold text-neutral-900">{COP(o.priceCop)}</span>
                <button onClick={() => startBooking(o)} disabled={!!booking} className="rounded-lg bg-neutral-900 text-white text-sm font-semibold px-4 py-2 hover:bg-black disabled:opacity-60 inline-flex items-center gap-2">
                  {booking === o.id ? <><Loader2 className="w-4 h-4 animate-spin" /> Redirigiendo…</> : 'Empezar transformación'}
                </button>
              </div>
            </div>
          ))}
        </div>
        {bookErr && <p className="text-sm text-red-500 mt-3">{bookErr}</p>}

        {/* Reseñas */}
        {Array.isArray(sel.reviews) && sel.reviews.length > 0 && (
          <div className="mt-7">
            <h3 className="text-sm font-bold text-neutral-800 mb-2">Lo que dicen sus clientes</h3>
            <div className="space-y-2">
              {sel.reviews.map((rv: any) => (
                <div key={rv.id} className="rounded-xl border border-black/[0.06] bg-white p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-neutral-800">{rv.userName}</span>
                    <Stars value={rv.rating} size="w-3 h-3" />
                  </div>
                  {rv.comment && <p className="text-sm text-neutral-600 mt-1">{rv.comment}</p>}
                  <p className="text-[10px] text-neutral-400 mt-1">{fmtDate(rv.createdAt)}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    )
  }

  // ── Catálogo (hero + ranking + grid) ──
  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Hero */}
      <div className="rounded-2xl p-5 mb-5 text-white" style={{ background: 'linear-gradient(135deg, #0f172a 0%, #0c4a6e 100%)' }}>
        <h2 className="text-xl font-extrabold flex items-center gap-2"><Crown className="w-5 h-5 text-amber-400" /> Entrena con un coach</h2>
        <p className="text-sm text-white/70 mt-0.5">Programas de transformación guiados, dentro de tu OS. Tu coach te acompaña con feedback real.</p>
        {activeProgram && (
          <button onClick={() => setBrowse(false)} className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold bg-white/15 hover:bg-white/25 rounded-full px-3 py-1.5">
            <Flame className="w-3.5 h-3.5 text-amber-300" /> Ir a mi programa activo
          </button>
        )}
      </div>

      {/* Ranking de top coaches */}
      {ranking.length > 0 && (
        <div className="mb-6">
          <h3 className="text-sm font-bold text-neutral-800 mb-2 flex items-center gap-1.5"><Trophy className="w-4 h-4 text-amber-500" /> Top coaches</h3>
          <div className="flex gap-3 overflow-x-auto pb-1">
            {ranking.map(t => (
              <button key={t.id} onClick={() => openTrainer(t.id)} className="shrink-0 w-36 text-left rounded-2xl border border-black/[0.07] bg-white p-3 shadow-sm hover:shadow-md transition-all">
                <div className="flex items-center justify-between">
                  <div className="w-12 h-12 rounded-xl bg-neutral-100 overflow-hidden">
                    {t.photoUrl ? <img src={abs(t.photoUrl)} alt={t.name} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-neutral-300"><Dumbbell className="w-5 h-5" /></div>}
                  </div>
                  <span className={`text-[11px] font-extrabold ${t.rank === 1 ? 'text-amber-500' : 'text-neutral-400'}`}>#{t.rank}</span>
                </div>
                <p className="font-bold text-sm text-neutral-900 truncate mt-2">{t.name}</p>
                <p className="text-[11px] text-amber-600 font-semibold flex items-center gap-1"><Flame className="w-3 h-3" /> {t.transformationScore}</p>
              </button>
            ))}
          </div>
        </div>
      )}

      {loadingSel && <div className="flex justify-center py-4 text-neutral-300"><Loader2 className="w-6 h-6 animate-spin" /></div>}

      <h3 className="text-sm font-bold text-neutral-800 mb-2">Todos los coaches</h3>
      {trainers.length === 0 ? (
        <p className="text-center text-neutral-400 py-16 text-sm">Aún no hay entrenadores disponibles.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {trainers.map(t => (
            <button key={t.id} onClick={() => openTrainer(t.id)} className="text-left rounded-2xl border border-black/[0.07] bg-white p-4 shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5 flex gap-3">
              <div className="w-16 h-16 rounded-xl bg-neutral-100 overflow-hidden shrink-0">
                {t.photoUrl ? <img src={abs(t.photoUrl)} alt={t.name} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-neutral-300"><Dumbbell className="w-7 h-7" /></div>}
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-bold text-neutral-900 truncate">{t.name}</p>
                <div className="text-xs text-neutral-500 flex items-center gap-1.5 mt-0.5">
                  <Stars value={t.ratingAvg || 0} size="w-3 h-3" />
                  <span className="text-neutral-400">({t.reviewsCount || 0})</span>
                </div>
                <div className="flex items-center gap-2 mt-1 text-[11px]">
                  <span className="inline-flex items-center gap-0.5 text-amber-600 font-semibold"><Flame className="w-3 h-3" />{t.transformationScore || 0}</span>
                  <span className="text-neutral-400">{t.offersCount} programa{t.offersCount === 1 ? '' : 's'}</span>
                </div>
                {t.fromPrice != null && <p className="text-sm font-semibold text-neutral-800 mt-1">desde {COP(t.fromPrice)}</p>}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
