'use client'

/**
 * AccessGate — gatea una interfaz oculta tras una Vault Key (V1).
 * Si el usuario tiene el desbloqueo `requires`, muestra `children`; si no, un
 * teaser "bloqueado" (o `fallback`). No filtra contenido sensible solo — el
 * backend también valida; esto es la capa de experiencia (misterio/FOMO).
 */
import { ReactNode } from 'react'
import { Lock } from 'lucide-react'
import { useVaultUnlocks } from './hooks/useVaultUnlocks'

export default function AccessGate({
  requires, children, fallback, teaserTitle = 'Contenido bloqueado', teaserText = 'Necesitas un Access Pass para abrir esta sección.', onLockedClick,
}: {
  requires: string
  children: ReactNode
  fallback?: ReactNode
  teaserTitle?: string
  teaserText?: string
  onLockedClick?: () => void
}) {
  const { has, loading } = useVaultUnlocks()

  if (loading) return null
  if (has(requires)) return <>{children}</>
  if (fallback !== undefined) return <>{fallback}</>

  return (
    <button
      onClick={onLockedClick}
      className="w-full text-left rounded-2xl border border-dashed border-neutral-300 bg-neutral-50 p-5 flex items-center gap-3 hover:bg-neutral-100 transition-colors"
    >
      <div className="w-10 h-10 rounded-xl bg-neutral-900 text-white flex items-center justify-center shrink-0">
        <Lock className="w-5 h-5" />
      </div>
      <div className="min-w-0">
        <p className="font-bold text-neutral-800">{teaserTitle}</p>
        <p className="text-sm text-neutral-500">{teaserText}</p>
      </div>
    </button>
  )
}
