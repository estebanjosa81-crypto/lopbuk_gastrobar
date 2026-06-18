'use client'

/**
 * StatusBadge — badge de estado consistente para comercios y pedidos.
 * Mapea estados conocidos a un color; cae a neutro si no lo reconoce.
 */
const TONE: Record<string, string> = {
  // genéricos
  activo: 'bg-emerald-500/15 text-emerald-600 border-emerald-500/30',
  inactivo: 'bg-zinc-500/15 text-zinc-500 border-zinc-500/30',
  suspendido: 'bg-amber-500/15 text-amber-600 border-amber-500/30',
  eliminado: 'bg-destructive/15 text-destructive border-destructive/30',
  oculto: 'bg-zinc-500/15 text-zinc-500 border-zinc-500/30',
  // pedidos
  nuevo: 'bg-blue-500/15 text-blue-600 border-blue-500/30',
  confirmado: 'bg-emerald-500/15 text-emerald-600 border-emerald-500/30',
  en_preparacion: 'bg-amber-500/15 text-amber-600 border-amber-500/30',
  en_camino: 'bg-violet-500/15 text-violet-600 border-violet-500/30',
  entregado: 'bg-emerald-600/15 text-emerald-700 border-emerald-600/30',
  cancelado: 'bg-destructive/15 text-destructive border-destructive/30',
  pendiente: 'bg-amber-500/15 text-amber-600 border-amber-500/30',
}

const LABELS: Record<string, string> = {
  en_preparacion: 'En preparación',
  en_camino: 'En camino',
}

export function StatusBadge({ status, className = '' }: { status: string; className?: string }) {
  const key = (status || '').toLowerCase()
  const tone = TONE[key] || 'bg-muted text-muted-foreground border-border'
  const label = LABELS[key] || (status ? status.charAt(0).toUpperCase() + status.slice(1) : '—')
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium ${tone} ${className}`}>
      {label}
    </span>
  )
}
