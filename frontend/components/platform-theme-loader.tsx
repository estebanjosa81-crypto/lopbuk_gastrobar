'use client'

import { useEffect } from 'react'
import { applyPlatformAccentDefault } from '@/lib/platform-theme'

/**
 * Aplica el acento de marca de la PLATAFORMA como color por defecto del panel
 * (--primary / --ring) en login y en cualquier panel que no tenga una paleta
 * propia. Un comercio con su propia paleta lo sobrescribe luego en merchant-panel.
 *
 * Se monta a nivel de layout (app-wide), junto a DynamicFavicon.
 */
export function PlatformThemeLoader() {
  useEffect(() => {
    applyPlatformAccentDefault().catch(() => {})
  }, [])
  return null
}
