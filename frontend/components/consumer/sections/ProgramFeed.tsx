'use client'

/**
 * ProgramFeed — feed async del programa (T4). El coach deja feedback/check-ins/ajustes;
 * el usuario responde. NO es chat WhatsApp: es un feed de coaching (premium, escalable).
 */
import { useEffect, useRef, useState } from 'react'
import { Loader2, Send, MessageSquare, Compass, Star, CheckCircle2 } from 'lucide-react'
import { api } from '@/lib/api'

const KIND_META: Record<string, { label: string; color: string }> = {
  announcement: { label: 'Anuncio', color: '#0ea5e9' },
  feedback: { label: 'Feedback', color: '#10b981' },
  checkin: { label: 'Check-in', color: '#f59e0b' },
  adjustment: { label: 'Ajuste', color: '#8b5cf6' },
  task: { label: 'Tarea', color: '#ef4444' },
  reply: { label: '', color: '#111827' },
}

export default function ProgramFeed({ program, onBrowse }: { program: any; onBrowse: () => void }) {
  const [feed, setFeed] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const [canReview, setCanReview] = useState(false)
  const [reviewed, setReviewed] = useState(false)
  const endRef = useRef<HTMLDivElement>(null)

  const load = async () => {
    const r = await api.getBookingFeed(program.bookingId)
    if (r.success) setFeed(r.data || [])
    setLoading(false)
  }
  useEffect(() => { load() /* eslint-disable-next-line */ }, [program.bookingId])
  useEffect(() => {
    api.getReviewableBookings().then(r => {
      if (r.success) setCanReview((r.data || []).some((b: any) => b.bookingId === program.bookingId))
    }).catch(() => {})
  }, [program.bookingId])
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [feed])

  const send = async () => {
    const body = text.trim()
    if (!body || sending) return
    setSending(true); setText('')
    setFeed(f => [...f, { id: `tmp-${Date.now()}`, author: 'user', kind: 'reply', body, createdAt: new Date().toISOString() }])
    try { await api.replyBookingFeed(program.bookingId, body); await load() } finally { setSending(false) }
  }

  return (
    <div className="p-4 sm:p-6 max-w-2xl mx-auto">
      {/* Header del programa */}
      <div className="rounded-2xl p-4 text-white mb-4" style={{ background: 'linear-gradient(135deg, #0f172a 0%, #0c4a6e 100%)' }}>
        <p className="text-[11px] uppercase tracking-wide text-sky-300 font-bold">🔥 Programa activo</p>
        <p className="font-bold text-lg">{program.title}</p>
        <p className="text-xs text-white/60">Coach {program.trainerName}{program.totalWeeks ? ` · Semana ${program.week}/${program.totalWeeks}` : ` · Semana ${program.week}`}</p>
        <button onClick={onBrowse} className="mt-2 text-[11px] text-white/70 hover:text-white inline-flex items-center gap-1"><Compass className="w-3.5 h-3.5" /> Ver otros entrenadores</button>
      </div>

      {/* Reseña del programa */}
      {reviewed ? (
        <div className="mb-4 rounded-xl bg-emerald-50 border border-emerald-100 p-3 flex items-center gap-2 text-emerald-700 text-sm">
          <CheckCircle2 className="w-4 h-4" /> ¡Gracias por calificar a tu coach!
        </div>
      ) : canReview ? (
        <ReviewCard bookingId={program.bookingId} trainerName={program.trainerName} onDone={() => { setReviewed(true); setCanReview(false) }} />
      ) : null}

      {/* Feed */}
      {loading ? (
        <div className="flex justify-center py-10 text-neutral-300"><Loader2 className="w-6 h-6 animate-spin" /></div>
      ) : feed.length === 0 ? (
        <div className="text-center text-neutral-400 py-10"><MessageSquare className="w-8 h-8 mx-auto mb-1" /><p className="text-sm">Tu coach te escribirá pronto.</p></div>
      ) : (
        <div className="space-y-3">
          {feed.map(e => {
            const mine = e.author === 'user'
            const meta = KIND_META[e.kind] || KIND_META.feedback
            return (
              <div key={e.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 ${mine ? 'bg-neutral-900 text-white' : 'bg-white border border-black/[0.06] shadow-sm'}`}>
                  {!mine && meta.label && <p className="text-[10px] font-bold uppercase mb-0.5" style={{ color: meta.color }}>{meta.label}</p>}
                  <p className="text-sm whitespace-pre-wrap">{e.body}</p>
                </div>
              </div>
            )
          })}
          <div ref={endRef} />
        </div>
      )}

      {/* Responder */}
      <div className="sticky bottom-0 mt-4 flex gap-2 bg-neutral-50/80 backdrop-blur py-2">
        <input value={text} onChange={e => setText(e.target.value)} onKeyDown={e => e.key === 'Enter' && send()} placeholder="Escribe a tu coach…" className="flex-1 rounded-xl border border-neutral-200 px-3 py-2.5 text-sm focus:outline-none focus:border-sky-400" />
        <button onClick={send} disabled={sending || !text.trim()} className="rounded-xl bg-neutral-900 text-white px-4 disabled:opacity-50 flex items-center justify-center"><Send className="w-4 h-4" /></button>
      </div>
    </div>
  )
}

// Califica al coach (1 vez por programa pagado).
function ReviewCard({ bookingId, trainerName, onDone }: { bookingId: string; trainerName?: string; onDone: () => void }) {
  const [open, setOpen] = useState(false)
  const [rating, setRating] = useState(0)
  const [hover, setHover] = useState(0)
  const [comment, setComment] = useState('')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')

  const submit = async () => {
    if (!rating) { setErr('Elige una calificación.'); return }
    setBusy(true); setErr('')
    try {
      const r = await api.createTrainerReview({ bookingId, rating, comment: comment.trim() || undefined })
      if (r.success) { onDone(); api.trackConsumerEvent('coach_review_submitted', { bookingId, rating }).catch(() => {}) }
      else setErr(r.error || 'No se pudo enviar.')
    } finally { setBusy(false) }
  }

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="mb-4 w-full rounded-xl bg-amber-50 border border-amber-100 p-3 flex items-center justify-center gap-2 text-amber-700 text-sm font-medium hover:bg-amber-100">
        <Star className="w-4 h-4 fill-amber-400 text-amber-400" /> Califica a {trainerName ? `tu coach ${trainerName}` : 'tu coach'}
      </button>
    )
  }

  return (
    <div className="mb-4 rounded-xl bg-white border border-black/[0.07] p-4 shadow-sm">
      <p className="text-sm font-bold text-neutral-800 mb-2">¿Cómo fue tu transformación?</p>
      <div className="flex items-center gap-1 mb-3">
        {[1, 2, 3, 4, 5].map(i => (
          <button key={i} onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(0)} onClick={() => setRating(i)}>
            <Star className={`w-7 h-7 ${i <= (hover || rating) ? 'text-amber-400 fill-amber-400' : 'text-neutral-300'}`} />
          </button>
        ))}
      </div>
      <textarea value={comment} onChange={e => setComment(e.target.value)} rows={2} placeholder="Cuéntale a otros cómo te fue (opcional)…"
        className="w-full rounded-xl border border-neutral-200 px-3 py-2 text-sm focus:outline-none focus:border-sky-400 resize-none" />
      {err && <p className="text-xs text-red-500 mt-1">{err}</p>}
      <div className="flex gap-2 mt-2">
        <button onClick={() => setOpen(false)} className="flex-1 rounded-xl border border-neutral-200 text-sm font-medium py-2 hover:bg-neutral-50">Ahora no</button>
        <button onClick={submit} disabled={busy} className="flex-1 rounded-xl bg-neutral-900 text-white text-sm font-semibold py-2 hover:bg-black disabled:opacity-50 flex items-center justify-center gap-2">
          {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Enviar reseña'}
        </button>
      </div>
    </div>
  )
}
