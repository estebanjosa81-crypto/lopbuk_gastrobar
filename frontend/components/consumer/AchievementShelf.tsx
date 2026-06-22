'use client'

/**
 * AchievementShelf — vitrina de logros del cliente (V3). Muestra el catálogo
 * con estado owned/bloqueado. Reusable en perfil y en el Vault.
 */
import { useEffect, useState } from 'react'
import { Loader2 } from 'lucide-react'
import { api } from '@/lib/api'

const RARITY: Record<string, { ring: string; bg: string; label: string }> = {
  common: { ring: 'border-neutral-200', bg: 'bg-neutral-50', label: 'Común' },
  rare: { ring: 'border-sky-200', bg: 'bg-sky-50', label: 'Raro' },
  epic: { ring: 'border-violet-200', bg: 'bg-violet-50', label: 'Épico' },
  legendary: { ring: 'border-amber-300', bg: 'bg-amber-50', label: 'Legendario' },
}

export default function AchievementShelf({ compact = false }: { compact?: boolean }) {
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.getMyAchievements().then(r => { if (r.success) setItems(r.data || []) }).finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="flex justify-center py-6 text-neutral-300"><Loader2 className="w-5 h-5 animate-spin" /></div>

  const owned = items.filter(i => i.owned).length

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-bold text-neutral-800">Logros</h3>
        <span className="text-[11px] text-neutral-400">{owned}/{items.length}</span>
      </div>
      <div className={`grid ${compact ? 'grid-cols-4 sm:grid-cols-6' : 'grid-cols-2 sm:grid-cols-3'} gap-2`}>
        {items.map(a => {
          const r = RARITY[a.rarity] || RARITY.common
          return (
            <div key={a.code} title={`${a.label} — ${a.desc}`}
              className={`rounded-xl border p-2.5 text-center transition ${a.owned ? `${r.ring} ${r.bg}` : 'border-neutral-200 bg-neutral-50 opacity-50 grayscale'}`}>
              <div className={`${compact ? 'text-xl' : 'text-2xl'} leading-none`}>{a.emoji}</div>
              {!compact && <p className="text-[11px] font-semibold text-neutral-700 mt-1 truncate">{a.label}</p>}
              {!compact && <p className="text-[9px] uppercase tracking-wide text-neutral-400">{a.owned ? r.label : 'Bloqueado'}</p>}
            </div>
          )
        })}
      </div>
    </div>
  )
}
