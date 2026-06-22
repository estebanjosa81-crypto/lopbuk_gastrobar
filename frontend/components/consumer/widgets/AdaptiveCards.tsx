'use client'

/**
 * AdaptiveCards — Adaptive OS (F4.1). El Today muestra nudges priorizados que
 * reaccionan a las señales del usuario (coach, racha, drops, membresía, logros).
 * Cada tarjeta puede llevar a un tab del OS o descartarse (recordado en localStorage).
 */
import { useEffect, useState } from 'react'
import { X, ChevronRight } from 'lucide-react'
import { api } from '@/lib/api'
import type { ConsumerTab } from '../hooks/useConsumerData'

const KIND_STYLE: Record<string, string> = {
  coach: 'from-sky-500 to-cyan-500',
  drop: 'from-red-500 to-orange-500',
  streak: 'from-amber-500 to-orange-500',
  membership: 'from-amber-400 to-yellow-500',
  achievement: 'from-violet-500 to-fuchsia-500',
  program: 'from-emerald-500 to-teal-500',
}

const DISMISS_KEY = 'dz_adaptive_dismissed'
function loadDismissed(): Record<string, number> {
  try { return JSON.parse(localStorage.getItem(DISMISS_KEY) || '{}') } catch { return {} }
}
function saveDismissed(d: Record<string, number>) { try { localStorage.setItem(DISMISS_KEY, JSON.stringify(d)) } catch { /* noop */ } }

export default function AdaptiveCards({ onGoTo }: { onGoTo: (tab: ConsumerTab) => void }) {
  const [items, setItems] = useState<any[]>([])
  const [dismissed, setDismissed] = useState<Record<string, number>>({})

  useEffect(() => {
    setDismissed(loadDismissed())
    api.getAdaptiveNudges().then(r => { if (r.success) setItems(r.data || []) }).catch(() => {})
  }, [])

  // Olvida descartes de hace > 24h (para que un nudge persistente vuelva).
  const now = Date.now()
  const visible = items.filter(n => !(dismissed[n.id] && now - dismissed[n.id] < 24 * 3600 * 1000))
  if (visible.length === 0) return null

  const dismiss = (id: string) => { const d = { ...dismissed, [id]: Date.now() }; setDismissed(d); saveDismissed(d) }

  return (
    <div className="px-4 pt-3 space-y-2">
      {visible.map(n => {
        const grad = KIND_STYLE[n.kind] || 'from-neutral-700 to-neutral-900'
        const clickable = n.action?.type === 'tab'
        return (
          <div key={n.id} className={`relative rounded-2xl p-3.5 text-white bg-gradient-to-r ${grad} shadow-sm`}>
            <button onClick={() => dismiss(n.id)} className="absolute top-2 right-2 text-white/60 hover:text-white"><X className="w-4 h-4" /></button>
            <div className="flex items-start gap-3 pr-5">
              <div className="text-2xl leading-none mt-0.5">{n.emoji}</div>
              <div className="min-w-0 flex-1">
                <p className="font-bold leading-tight">{n.title}</p>
                <p className="text-sm text-white/80">{n.body}</p>
                {clickable && (
                  <button onClick={() => onGoTo(n.action.target as ConsumerTab)} className="mt-2 inline-flex items-center gap-1 text-xs font-semibold bg-white/20 hover:bg-white/30 rounded-full px-3 py-1">
                    {n.action.label || 'Abrir'} <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
