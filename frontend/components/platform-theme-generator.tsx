'use client'

import { useEffect, useRef, useState } from 'react'
import { api } from '@/lib/api'
import { toast } from 'sonner'
import { applyAdminAccent, type ThemePalette } from '@/lib/theme-vars'
import { parsePlatformPalette, PLATFORM_THEME_KEY } from '@/lib/platform-theme'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Palette, Sparkles, Loader2, Check, RotateCcw, Upload, Wand2 } from 'lucide-react'

const SWATCHES: { key: keyof ThemePalette['colors']; label: string }[] = [
  { key: 'primary', label: 'Primario (CTA)' },
  { key: 'primary_hover', label: 'Primario hover' },
  { key: 'secondary', label: 'Secundario' },
  { key: 'background_store', label: 'Fondo home' },
  { key: 'surface_store', label: 'Superficie' },
  { key: 'text_main', label: 'Texto' },
  { key: 'admin_accent', label: 'Acento panel' },
]

// Paleta base para edición manual (cuando aún no se ha generado con IA).
const DEFAULT_PALETTE: ThemePalette = {
  theme_type: 'light',
  colors: {
    primary: '#007BFF', primary_hover: '#0069D9', secondary: '#6C757D',
    background_store: '#F8F9FA', surface_store: '#F5F5F5', text_main: '#212529', admin_accent: '#2196F3',
  },
} as ThemePalette

const isHex = (v: string) => /^#?[0-9a-fA-F]{6}$/.test(v.trim())
const normHex = (v: string) => (v.startsWith('#') ? v : `#${v}`).toUpperCase()

/**
 * Colorimetría de la PLATAFORMA (superadmin). Genera una paleta desde el logo
 * de la plataforma y la guarda en platform_settings (clave platform_theme_colors).
 * Esa paleta tiñe la página de inicio (marketplace) y el login, y sirve de acento
 * por defecto en los paneles de comercios sin paleta propia.
 */
export function PlatformThemeGenerator({ logoUrl }: { logoUrl?: string | null }) {
  const [palette, setPalette] = useState<ThemePalette | null>(null)
  const [saved, setSaved] = useState<ThemePalette | null>(null)
  const [generating, setGenerating] = useState(false)
  const [saving, setSaving] = useState(false)
  const [provider, setProvider] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    api.getPlatformSettings().then(res => {
      const current = parsePlatformPalette((res.data as any)?.[PLATFORM_THEME_KEY])
      if (current) { setSaved(current); setPalette(current) }
    }).catch(() => {})
  }, [])

  const runGenerate = async (payload: { imageBase64?: string; logoUrl?: string }) => {
    setError(null); setGenerating(true)
    try {
      const res = await api.generateStoreTheme(payload)
      if (res.success && res.data?.palette) {
        setPalette(res.data.palette)
        setProvider(res.data.provider)
      } else {
        setError(res.error || 'No se pudo generar la paleta')
      }
    } catch (e: any) {
      setError(e?.message || 'Error al generar la paleta')
    } finally {
      setGenerating(false)
    }
  }

  const handleGenerateFromLogo = () => {
    if (logoUrl && !logoUrl.startsWith('/')) runGenerate({ logoUrl })
    else fileRef.current?.click()
  }

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    const dataUrl = await new Promise<string>((resolve, reject) => {
      const r = new FileReader(); r.onload = () => resolve(r.result as string); r.onerror = reject; r.readAsDataURL(file)
    })
    runGenerate({ imageBase64: dataUrl })
  }

  const handleSave = async () => {
    if (!palette) return
    setSaving(true)
    const res = await api.updatePlatformSetting(PLATFORM_THEME_KEY, JSON.stringify(palette))
    if (res.success) {
      setSaved(palette)
      applyAdminAccent(palette.colors.admin_accent)
      toast.success('Colorimetría de la plataforma aplicada y guardada')
    } else {
      toast.error(res.error || 'No se pudo guardar la colorimetría')
    }
    setSaving(false)
  }

  const handleReset = async () => {
    const res = await api.updatePlatformSetting(PLATFORM_THEME_KEY, '')
    if (res.success) {
      setSaved(null); setPalette(null); setProvider(null)
      applyAdminAccent(null)
      toast.success('Colorimetría restablecida al diseño base')
    } else {
      toast.error(res.error || 'No se pudo restablecer')
    }
  }

  // Edición manual de un color de la paleta.
  const setColor = (key: keyof ThemePalette['colors'], value: string) => {
    setPalette(p => p ? { ...p, colors: { ...p.colors, [key]: value } } : p)
  }

  const dirty = palette && JSON.stringify(palette) !== JSON.stringify(saved)

  return (
    <Card className="border-border bg-card">
      <CardHeader className="pb-3">
        <CardTitle className="text-base lg:text-lg flex items-center gap-2">
          <Palette className="h-5 w-5 text-muted-foreground" />
          Colorimetría de la plataforma (IA)
        </CardTitle>
        <CardDescription>
          La IA analiza el logo de la plataforma y genera una paleta accesible. Tiñe la página de inicio
          (marketplace) y el login, y se usa como acento por defecto en los paneles de comercios sin paleta propia.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />

        <div className="flex flex-wrap items-center gap-2">
          <Button size="sm" onClick={handleGenerateFromLogo} disabled={generating}>
            {generating
              ? <><Loader2 className="mr-1.5 h-4 w-4 animate-spin" />Analizando logo...</>
              : <><Wand2 className="mr-1.5 h-4 w-4" />Generar colorimetría con IA</>}
          </Button>
          <Button size="sm" variant="outline" onClick={() => fileRef.current?.click()} disabled={generating}>
            <Upload className="mr-1.5 h-4 w-4" /> Subir otro logo
          </Button>
          <Button size="sm" variant="outline" onClick={() => setPalette(p => p ?? DEFAULT_PALETTE)} disabled={generating}>
            <Palette className="mr-1.5 h-4 w-4" /> {palette ? 'Editar colores' : 'Crear paleta manual'}
          </Button>
          {saved && (
            <Button size="sm" variant="ghost" onClick={handleReset} className="text-destructive/80 hover:text-destructive">
              <RotateCcw className="mr-1.5 h-4 w-4" /> Restablecer
            </Button>
          )}
          {provider && !generating && (
            <span className="text-[11px] text-muted-foreground flex items-center gap-1">
              <Check className="h-3.5 w-3.5 text-green-500" /> {provider === 'gemini' ? 'Gemini' : provider === 'groq' ? 'Groq' : 'OpenAI'}
            </span>
          )}
        </div>

        {(!logoUrl || logoUrl.startsWith('/')) && (
          <p className="text-[11px] text-muted-foreground">
            El logo actual es un preset DAIMUZ local. Para generar desde él, súbelo como imagen con &quot;Subir otro logo&quot;.
          </p>
        )}

        {error && <p className="text-xs text-destructive bg-destructive/10 rounded-md px-3 py-2">{error}</p>}

        {palette && (
          <>
            <div className="rounded-lg border border-border overflow-hidden">
              <div className="p-4" style={{ background: palette.colors.background_store, color: palette.colors.text_main }}>
                <div className="rounded-lg p-3 mb-3" style={{ background: palette.colors.surface_store }}>
                  <p className="text-sm font-semibold" style={{ color: palette.colors.text_main }}>Vista previa de la home</p>
                  <p className="text-xs opacity-70" style={{ color: palette.colors.text_main }}>Tarjeta de comercio de ejemplo</p>
                </div>
                <button className="text-sm font-semibold px-4 py-2 rounded-lg text-white" style={{ background: palette.colors.primary }}>Explorar tiendas</button>
                <span className="ml-2 text-xs px-2 py-1 rounded" style={{ background: palette.colors.secondary, color: '#fff' }}>Etiqueta</span>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
              {SWATCHES.map(s => (
                <div key={s.key} className="rounded-lg border border-border overflow-hidden">
                  {/* Bloque de color = selector nativo (clic para abrir la paleta del color) */}
                  <label className="relative block h-10 cursor-pointer" title={`Editar ${s.label}`} style={{ background: palette.colors[s.key] }}>
                    <input
                      type="color"
                      value={isHex(palette.colors[s.key] || '') ? normHex(palette.colors[s.key]) : '#000000'}
                      onChange={e => setColor(s.key, e.target.value.toUpperCase())}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      aria-label={`Color ${s.label}`}
                    />
                  </label>
                  <div className="p-1.5">
                    <p className="text-[10px] font-medium leading-tight">{s.label}</p>
                    {/* Campo hex editable para precisión */}
                    <input
                      type="text"
                      value={palette.colors[s.key] || ''}
                      onChange={e => { const v = e.target.value; setColor(s.key, isHex(v) ? normHex(v) : v) }}
                      className="w-full mt-0.5 text-[9px] font-mono uppercase bg-transparent outline-none text-muted-foreground focus:text-foreground"
                      spellCheck={false}
                      aria-label={`Hex ${s.label}`}
                    />
                  </div>
                </div>
              ))}
            </div>
            <p className="text-[11px] text-muted-foreground -mt-1">Haz clic en cada color para abrir el selector, o escribe el código hex. Luego pulsa “Aplicar y guardar”.</p>

            <div className="flex items-center gap-2">
              <Button size="sm" onClick={handleSave} disabled={saving || !dirty}>
                {saving ? <><Loader2 className="mr-1.5 h-4 w-4 animate-spin" />Guardando...</> : <><Sparkles className="mr-1.5 h-4 w-4" />Aplicar y guardar</>}
              </Button>
              {!dirty && saved && <span className="text-[11px] text-muted-foreground">Colorimetría aplicada</span>}
              <span className="text-[11px] text-muted-foreground ml-auto">Modo: {palette.theme_type === 'dark' ? 'Oscuro' : 'Claro'}</span>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}
