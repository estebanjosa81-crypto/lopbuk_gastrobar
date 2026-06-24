'use client'

/**
 * VaultSection — el Vault del OS (V1). El usuario ingresa su Access Pass y
 * DESBLOQUEA INTERFACES OCULTAS (no solo productos): tema secreto, catálogo
 * oculto, sala de coach, drops, leaderboard. Reveal con misterio/FOMO.
 */
import { useState } from 'react'
import { Loader2, KeyRound, Lock, Sparkles, Check, Flame } from 'lucide-react'
import { api } from '@/lib/api'
import { useVaultUnlocks, refreshVaultUnlocks } from '../hooks/useVaultUnlocks'
import AccessGate from '../AccessGate'
import DropsSection from './DropsSection'
import CoachSection from './CoachSection'
import AchievementShelf from '../AchievementShelf'

export const UNLOCK_META: Record<string, { label: string; emoji: string; desc: string }> = {
  secret_theme: { label: 'Tema secreto', emoji: '🌑', desc: 'Una piel oculta del OS.' },
  hidden_catalog: { label: 'Catálogo oculto', emoji: '🗝️', desc: 'Productos que nadie más ve.' },
  coach_room: { label: 'Sala de coach', emoji: '🥷', desc: 'Coaching privado de élite.' },
  drops: { label: 'Drops exclusivos', emoji: '🔥', desc: 'Lanzamientos por tiempo limitado.' },
  leaderboard: { label: 'Leaderboard', emoji: '🏆', desc: 'El ranking interno de DAIMUZ.' },
  inner_circle: { label: 'Inner Circle', emoji: '👑', desc: 'El círculo más exclusivo.' },
}
const meta = (k: string) => UNLOCK_META[k] || { label: k, emoji: '✨', desc: 'Interfaz desbloqueada.' }

export default function VaultSection() {
  const { unlocks, loading } = useVaultUnlocks()
  const [code, setCode] = useState('')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const [reveal, setReveal] = useState<{ label: string; unlocks: string[]; message: string | null } | null>(null)

  const redeem = async () => {
    const c = code.trim()
    if (!c || busy) return
    setBusy(true); setErr(''); setReveal(null)
    try {
      const r = await api.redeemVaultKey(c)
      if (r.success && r.data) {
        refreshVaultUnlocks()
        setReveal({ label: r.data.label, unlocks: r.data.unlocks, message: r.data.message })
        setCode('')
        api.trackConsumerEvent('vault_key_redeemed', { unlocks: r.data.unlocks }).catch(() => {})
      } else setErr(r.error || 'No se pudo canjear la llave.')
    } finally { setBusy(false) }
  }

  return (
    <div className="p-4 sm:p-6 max-w-2xl mx-auto space-y-6">
      {/* Hero */}
      <div className="rounded-2xl p-5 text-white relative overflow-hidden" style={{ background: 'radial-gradient(120% 120% at 0% 0%, #1f2937 0%, #030712 70%)' }}>
        <div className="absolute -right-6 -top-6 opacity-10"><KeyRound className="w-28 h-28" /></div>
        <h2 className="text-xl font-extrabold flex items-center gap-2"><KeyRound className="w-5 h-5 text-amber-400" /> The Vault</h2>
        <p className="text-sm text-white/60 mt-0.5">Cada Access Pass abre una capa oculta del OS. ¿Tienes una llave?</p>
        <div className="flex gap-2 mt-3">
          <input value={code} onChange={e => setCode(e.target.value.toUpperCase())} onKeyDown={e => e.key === 'Enter' && redeem()}
            placeholder="VAULT-XXXXX" className="flex-1 rounded-xl bg-white/10 border border-white/15 px-3 py-2.5 text-sm tracking-widest placeholder:text-white/30 focus:outline-none focus:border-amber-400" />
          <button onClick={redeem} disabled={busy || !code.trim()} className="rounded-xl bg-amber-400 text-neutral-900 font-bold px-5 disabled:opacity-50 flex items-center gap-2">
            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Abrir'}
          </button>
        </div>
        {err && <p className="text-sm text-red-300 mt-2">{err}</p>}
      </div>

      {/* Reveal */}
      {reveal && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 animate-in fade-in zoom-in duration-300">
          <p className="text-sm font-bold text-amber-700 flex items-center gap-2"><Sparkles className="w-4 h-4" /> {reveal.label} desbloqueado</p>
          {reveal.message && <p className="text-sm text-amber-800/80 mt-1">{reveal.message}</p>}
          <div className="flex flex-wrap gap-2 mt-3">
            {reveal.unlocks.map(u => (
              <span key={u} className="text-xs font-semibold bg-white border border-amber-200 rounded-full px-2.5 py-1 text-amber-700">{meta(u).emoji} {meta(u).label}</span>
            ))}
          </div>
        </div>
      )}

      {/* Tus interfaces */}
      <div>
        <h3 className="text-sm font-bold text-neutral-800 mb-2">Tus interfaces</h3>
        {loading ? (
          <div className="flex justify-center py-6 text-neutral-300"><Loader2 className="w-6 h-6 animate-spin" /></div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {Object.keys(UNLOCK_META).map(k => {
              const owned = unlocks.includes(k)
              const m = meta(k)
              return (
                <div key={k} className={`rounded-2xl border p-4 flex items-center gap-3 ${owned ? 'border-emerald-200 bg-emerald-50' : 'border-dashed border-neutral-200 bg-neutral-50 opacity-80'}`}>
                  <div className="text-2xl">{m.emoji}</div>
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-neutral-800 truncate">{m.label}</p>
                    <p className="text-[11px] text-neutral-500">{m.desc}</p>
                  </div>
                  {owned
                    ? <span className="text-emerald-600 shrink-0"><Check className="w-5 h-5" /></span>
                    : <span className="text-neutral-300 shrink-0"><Lock className="w-4 h-4" /></span>}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Logros (V3) */}
      <div className="rounded-2xl border border-black/[0.06] bg-white p-4">
        <AchievementShelf />
      </div>

      {/* Sala de coach (interfaz oculta tras el unlock `coach_room`) */}
      <AccessGate
        requires="coach_room"
        teaserTitle="🥷 Sala de coach"
        teaserText="Coaching privado de élite. Consigue su Vault Key para entrar."
      >
        <div>
          <h3 className="text-sm font-bold text-neutral-800 mb-2 flex items-center gap-1.5">🥷 Sala de coach</h3>
          <div className="rounded-2xl border border-black/[0.06] bg-white overflow-hidden">
            <CoachSection />
          </div>
        </div>
      </AccessGate>

      {/* Drops (V2): interfaz oculta tras el unlock `drops` */}
      <AccessGate
        requires="drops"
        teaserTitle="🔥 Drops"
        teaserText="Lanzamientos por tiempo limitado y cupos contados. Consigue su Vault Key."
      >
        <div>
          <h3 className="text-sm font-bold text-neutral-800 mb-2 flex items-center gap-1.5"><Flame className="w-4 h-4 text-red-500" /> Drops activos</h3>
          <DropsSection />
        </div>
      </AccessGate>

      {/* Demo de interfaz gateada: Inner Circle */}
      <AccessGate
        requires="inner_circle"
        teaserTitle="👑 Inner Circle"
        teaserText="Una capa secreta del OS. Consigue su Vault Key para entrar."
      >
        <div className="rounded-2xl p-5 text-white" style={{ background: 'linear-gradient(135deg, #4c1d95 0%, #1e1b4b 100%)' }}>
          <p className="text-sm font-bold flex items-center gap-2">👑 Inner Circle</p>
          <p className="text-sm text-white/70 mt-1">Bienvenido al círculo. Aquí viven los drops privados, el leaderboard real y los beneficios que no se anuncian.</p>
        </div>
      </AccessGate>
    </div>
  )
}
