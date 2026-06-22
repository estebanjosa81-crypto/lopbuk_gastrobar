'use client'

/**
 * legend-badge.tsx — Badge LEGEND persistente y reutilizable (G7).
 * Úsalo en perfil, ranking, comentarios, etc. para señalar status premium.
 */
import { Crown } from 'lucide-react'

const MILESTONE_LABEL: Record<string, string> = {
  constante: 'Constante', elite: 'Elite', glow: 'Glow', founder: 'Founder',
}

export default function LegendBadge({ level, size = 'md', glow }: { level?: string; size?: 'sm' | 'md'; glow?: boolean }) {
  const top = level ? MILESTONE_LABEL[level] : undefined
  const sm = size === 'sm'
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full font-extrabold tracking-wide ${sm ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-xs'}`}
      style={{
        color: '#0e0e0e',
        background: 'linear-gradient(135deg, #F7E08A 0%, #D4AF37 55%, #B8860B 100%)',
        boxShadow: glow ? '0 0 10px rgba(212,175,55,0.7)' : undefined,
      }}
    >
      <Crown className={sm ? 'w-3 h-3' : 'w-3.5 h-3.5'} />
      LEGEND{top ? ` · ${top}` : ''}
    </span>
  )
}
