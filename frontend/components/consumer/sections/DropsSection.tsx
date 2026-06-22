'use client'

/**
 * DropsSection — Drops como EVENTOS (V2). Ventana + escasez de cupos en vivo
 * (Socket.io) + claim. "🔥 Protein Drop · ⏳ 200 cupos · 👑 Solo Vault Access".
 * Vive dentro del Vault, tras el gate `drops`.
 */
import { useEffect, useMemo, useState } from 'react'
import { Loader2, Flame, Clock, Users, Check, Lock, Zap } from 'lucide-react'
import { api } from '@/lib/api'
import { getVaultSocket } from '@/lib/socket'

const COP = (n: number) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(Number(n) || 0)

function useNow(tickMs = 1000) {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => { const t = setInterval(() => setNow(Date.now()), tickMs); return () => clearInterval(t) }, [tickMs])
  return now
}
function fmtCountdown(ms: number) {
  if (ms <= 0) return '00:00:00'
  const s = Math.floor(ms / 1000)
  const d = Math.floor(s / 86400)
  const h = Math.floor((s % 86400) / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = s % 60
  const pad = (n: number) => String(n).padStart(2, '0')
  return d > 0 ? `${d}d ${pad(h)}:${pad(m)}:${pad(sec)}` : `${pad(h)}:${pad(m)}:${pad(sec)}`
}

export default function DropsSection() {
  const [drops, setDrops] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const load = async () => { const r = await api.getDrops(); if (r.success) setDrops(r.data || []); setLoading(false) }
  useEffect(() => { load() }, [])

  // Socket: cupos en vivo de todos los drops mostrados.
  const ids = useMemo(() => drops.map(d => d.id).join(','), [drops])
  useEffect(() => {
    if (!ids) return
    const socket = getVaultSocket()
    const idList = ids.split(',')
    idList.forEach(id => socket.emit('drop:join', id))
    const onUpdate = (p: { dropId: string; slotsTaken: number; totalSlots: number; soldOut: boolean }) => {
      setDrops(prev => prev.map(d => d.id === p.dropId
        ? { ...d, slotsTaken: p.slotsTaken, slotsLeft: Math.max(0, p.totalSlots - p.slotsTaken), state: p.soldOut ? 'sold_out' : d.state }
        : d))
    }
    socket.on('drop:update', onUpdate)
    return () => { idList.forEach(id => socket.emit('drop:leave', id)); socket.off('drop:update', onUpdate) }
  }, [ids])

  if (loading) return <div className="flex justify-center py-10 text-neutral-300"><Loader2 className="w-6 h-6 animate-spin" /></div>
  if (drops.length === 0) return <p className="text-sm text-neutral-400 text-center py-8">No hay drops activos ahora. Vuelve pronto. 🔥</p>

  return (
    <div className="space-y-4">
      {drops.map(d => <DropCard key={d.id} drop={d} onClaimed={load} />)}
    </div>
  )
}

function DropCard({ drop, onClaimed }: { drop: any; onClaimed: () => void }) {
  const now = useNow()
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState('')
  const [claimed, setClaimed] = useState(!!drop.claimed)

  const startsAt = new Date(drop.startsAt).getTime()
  const endsAt = new Date(drop.endsAt).getTime()
  const upcoming = now < startsAt
  const ended = now > endsAt || drop.state === 'ended'
  const soldOut = drop.slotsLeft <= 0 || drop.state === 'sold_out'
  const live = !upcoming && !ended && !soldOut
  const pct = drop.totalSlots ? Math.min(100, Math.round((drop.slotsTaken / drop.totalSlots) * 100)) : 0

  const hasPrice = drop.productRef?.priceCop != null && Number(drop.productRef.priceCop) > 0

  const claim = async () => {
    if (busy) return
    setBusy(true); setMsg('')
    const r = await api.claimDrop(drop.id)
    setBusy(false)
    if (r.success && r.data) {
      setClaimed(true)
      api.trackConsumerEvent('drop_claimed', { dropId: drop.id }).catch(() => {})
      onClaimed()
    } else setMsg(r.error || 'No se pudo reclamar el cupo.')
  }

  const pay = async () => {
    if (busy) return
    setBusy(true); setMsg('')
    const r = await api.checkoutDrop(drop.id)
    if (r.success && r.data?.checkoutUrl) { window.location.href = r.data.checkoutUrl; return }
    setBusy(false); setMsg(r.error || 'No se pudo iniciar el pago.')
  }

  // Sala de espera: drop próximo a abrir (≤10 min).
  const waitingRoom = upcoming && (startsAt - now) <= 10 * 60 * 1000

  // Pulso visual cuando quedan pocos cupos
  const scarce = live && drop.slotsLeft > 0 && drop.slotsLeft <= Math.max(3, Math.ceil(drop.totalSlots * 0.1))

  return (
    <div className="rounded-2xl overflow-hidden border border-black/[0.08] bg-white shadow-sm">
      {/* Banner */}
      <div className="relative h-32 bg-neutral-900">
        {drop.imageUrl
          ? <img src={drop.imageUrl} alt={drop.title} className="w-full h-full object-cover opacity-90" />
          : <div className="w-full h-full flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #7c2d12 0%, #111827 100%)' }}><Flame className="w-10 h-10 text-amber-400/80" /></div>}
        <div className="absolute top-2 left-2 flex gap-1.5">
          {waitingRoom ? <span className="text-[10px] font-bold bg-violet-500 text-white rounded-full px-2 py-0.5 flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" /> SALA DE ESPERA</span>
            : upcoming && <span className="text-[10px] font-bold bg-sky-500 text-white rounded-full px-2 py-0.5">PRÓXIMO</span>}
          {live && <span className="text-[10px] font-bold bg-red-500 text-white rounded-full px-2 py-0.5 flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" /> EN VIVO</span>}
          {soldOut && !ended && <span className="text-[10px] font-bold bg-neutral-700 text-white rounded-full px-2 py-0.5">AGOTADO</span>}
          {ended && <span className="text-[10px] font-bold bg-neutral-500 text-white rounded-full px-2 py-0.5">CERRADO</span>}
          {drop.requiresUnlock && <span className="text-[10px] font-bold bg-amber-400 text-neutral-900 rounded-full px-2 py-0.5">👑 ACCESS</span>}
        </div>
      </div>

      <div className="p-4">
        <p className="font-extrabold text-neutral-900">{drop.title}</p>
        {drop.subtitle && <p className="text-sm text-neutral-500">{drop.subtitle}</p>}
        {drop.productRef?.priceCop != null && <p className="text-sm font-bold text-neutral-800 mt-1">{COP(drop.productRef.priceCop)}</p>}

        {/* Countdown */}
        <div className="flex items-center gap-1.5 mt-3 text-sm">
          <Clock className="w-4 h-4 text-neutral-400" />
          {upcoming ? <span className="text-neutral-600">Abre en <b className="tabular-nums">{fmtCountdown(startsAt - now)}</b></span>
            : ended ? <span className="text-neutral-400">Finalizado</span>
              : <span className="text-neutral-600">Cierra en <b className="tabular-nums">{fmtCountdown(endsAt - now)}</b></span>}
        </div>

        {/* Cupos */}
        <div className="mt-3">
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="flex items-center gap-1 text-neutral-500"><Users className="w-3.5 h-3.5" /> {drop.slotsTaken}/{drop.totalSlots} cupos</span>
            <span className={`font-bold ${scarce ? 'text-red-500' : 'text-neutral-600'}`}>{soldOut ? 'Sin cupos' : `Quedan ${drop.slotsLeft}`}</span>
          </div>
          <div className="h-2 rounded-full bg-neutral-100 overflow-hidden">
            <div className={`h-full rounded-full transition-all ${scarce ? 'bg-red-500' : 'bg-neutral-900'}`} style={{ width: `${pct}%` }} />
          </div>
        </div>

        {/* CTA */}
        <div className="mt-3">
          {claimed && hasPrice ? (
            <button onClick={pay} disabled={busy} className="w-full rounded-xl bg-neutral-900 text-white font-bold py-2.5 disabled:opacity-60 flex items-center justify-center gap-2">
              {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <>Pagar y asegurar · {COP(drop.productRef.priceCop)}</>}
            </button>
          ) : claimed ? (
            <div className="rounded-xl bg-emerald-50 border border-emerald-100 py-2.5 text-center text-emerald-700 text-sm font-semibold flex items-center justify-center gap-1.5"><Check className="w-4 h-4" /> Cupo reservado</div>
          ) : !drop.hasAccess ? (
            <div className="rounded-xl bg-neutral-100 py-2.5 text-center text-neutral-500 text-sm font-medium flex items-center justify-center gap-1.5"><Lock className="w-4 h-4" /> Requiere Access Pass</div>
          ) : upcoming ? (
            <div className="rounded-xl bg-neutral-100 py-2.5 text-center text-neutral-500 text-sm font-medium">Prepárate… abre pronto</div>
          ) : ended || soldOut ? (
            <div className="rounded-xl bg-neutral-100 py-2.5 text-center text-neutral-400 text-sm font-medium">{soldOut ? '¡Se agotó!' : 'Cerrado'}</div>
          ) : (
            <button onClick={claim} disabled={busy}
              className="w-full rounded-xl bg-gradient-to-r from-red-500 to-orange-500 text-white font-bold py-2.5 disabled:opacity-60 flex items-center justify-center gap-2 active:scale-[0.99]">
              {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Zap className="w-4 h-4" /> Reclamar mi cupo</>}
            </button>
          )}
          {msg && <p className="text-xs text-red-500 mt-1.5 text-center">{msg}</p>}
        </div>
      </div>
    </div>
  )
}
