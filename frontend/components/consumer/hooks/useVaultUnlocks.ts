'use client'

/**
 * useVaultUnlocks — desbloqueos del Vault (V1). Fuente única para gatear las
 * INTERFACES OCULTAS del OS (tema secreto, catálogo oculto, sala de coach, drops).
 * Lee `/vault/me/unlocks` y expone `has(key)`. Cache de módulo (se llama en gates).
 */
import { useEffect, useState } from 'react'
import { api } from '@/lib/api'

let cache: string[] | null = null
let cacheAt = 0
const TTL = 60_000

/** Invalida el cache (p.ej. tras canjear una Vault Key). */
export function refreshVaultUnlocks() { cache = null; cacheAt = 0 }

export interface VaultProfile {
  unlocks: string[]
  loading: boolean
  has: (key: string) => boolean
}

export function useVaultUnlocks(): VaultProfile {
  const [unlocks, setUnlocks] = useState<string[]>(cache || [])
  const [loading, setLoading] = useState(!cache)

  useEffect(() => {
    if (cache && Date.now() - cacheAt < TTL) { setUnlocks(cache); setLoading(false); return }
    let alive = true
    api.getVaultUnlocks().then(r => {
      if (!alive) return
      if (r.success) { cache = r.data || []; cacheAt = Date.now(); setUnlocks(cache) }
      setLoading(false)
    }).catch(() => { if (alive) setLoading(false) })
    return () => { alive = false }
  }, [])

  return { unlocks, loading, has: (key: string) => unlocks.includes(key) }
}
