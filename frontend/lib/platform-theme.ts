/**
 * Paleta de marca de la PLATAFORMA (DAIMUZ), generada por el superadmin desde el
 * logo de la plataforma. Se guarda en platform_settings con la clave
 * `platform_theme_colors` (JSON) vía api.updatePlatformSetting.
 *
 * Alcance (según decisión de arquitectura):
 *  - Home / marketplace  → colorización completa (la tiñe landing-page).
 *  - Login + paneles      → solo el acento por defecto (cuando el comercio no
 *                           tiene paleta propia que lo sobrescriba).
 */
import { applyAdminAccent, type ThemePalette } from '@/lib/theme-vars'

export const PLATFORM_THEME_KEY = 'platform_theme_colors'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'

/** Parsea de forma segura el JSON de la paleta guardada. */
export function parsePlatformPalette(raw: unknown): ThemePalette | null {
  if (!raw || typeof raw !== 'string') return null
  try {
    const p = JSON.parse(raw)
    if (p && p.colors && typeof p.colors === 'object') return p as ThemePalette
  } catch { /* JSON inválido */ }
  return null
}

/** Lee la paleta de plataforma desde el endpoint público de platform-settings. */
export async function getPlatformPalette(): Promise<ThemePalette | null> {
  try {
    const res = await fetch(`${API_URL}/storefront/platform-settings`)
    const json = await res.json()
    if (json?.success && json?.data) {
      return parsePlatformPalette(json.data[PLATFORM_THEME_KEY])
    }
  } catch { /* sin conexión / sin settings */ }
  return null
}

/** Aplica el acento de plataforma como default en el panel (login/paneles). */
export async function applyPlatformAccentDefault(): Promise<ThemePalette | null> {
  const palette = await getPlatformPalette()
  applyAdminAccent(palette?.colors?.admin_accent ?? null)
  return palette
}
