'use client'

import { useState, useEffect } from 'react'
import {
  X, Monitor, Smartphone, Save, RefreshCw, ExternalLink,
  ChevronDown, ChevronRight, Loader2, Check,
} from 'lucide-react'
import { api } from '@/lib/api'
import { useAuthStore } from '@/lib/auth-store'

// ── Local state ─────────────────────────────────────────────────────────────

interface BuilderState {
  logoUrl: string
  heroBannerId?: number
  heroBannerImage: string
  heroBannerTitle: string
  heroBannerSubtitle: string
  heroBannerLink: string
  announcementText: string
  announcementBgColor: string
  announcementTextColor: string
  announcementActive: boolean
  socialWhatsapp: string
  socialInstagram: string
  socialFacebook: string
  socialTiktok: string
  schedule: string
  allowContraentrega: boolean
}

const DEFAULT: BuilderState = {
  logoUrl: '',
  heroBannerImage: '',
  heroBannerTitle: '',
  heroBannerSubtitle: '',
  heroBannerLink: '',
  announcementText: '',
  announcementBgColor: '#000000',
  announcementTextColor: '#ffffff',
  announcementActive: false,
  socialWhatsapp: '',
  socialInstagram: '',
  socialFacebook: '',
  socialTiktok: '',
  schedule: '',
  allowContraentrega: false,
}

// ── Small reusable UI pieces ─────────────────────────────────────────────────

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <label style={{ display: 'block', fontSize: 10.5, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 5 }}>
      {children}
    </label>
  )
}

function TextInput({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <input
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      style={{ width: '100%', padding: '8px 10px', border: '1.5px solid #e5e7eb', borderRadius: 8, fontSize: 13, color: '#1f2937', outline: 'none', boxSizing: 'border-box', background: 'white', fontFamily: 'inherit' }}
    />
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <FieldLabel>{label}</FieldLabel>
      {children}
    </div>
  )
}

function Toggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!value)}
      style={{ width: 40, height: 22, borderRadius: 11, border: 'none', cursor: 'pointer', background: value ? '#6366f1' : '#d1d5db', transition: 'background 0.2s', position: 'relative', flexShrink: 0 }}
    >
      <div style={{ position: 'absolute', top: 2, left: value ? 20 : 2, width: 18, height: 18, borderRadius: '50%', background: 'white', transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
    </button>
  )
}

function ColorPicker({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div style={{ flex: 1 }}>
      <FieldLabel>{label}</FieldLabel>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, border: '1.5px solid #e5e7eb', borderRadius: 8, padding: '5px 8px', background: 'white' }}>
        <input type="color" value={value} onChange={e => onChange(e.target.value)}
          style={{ width: 24, height: 24, border: 'none', borderRadius: 4, cursor: 'pointer', padding: 0, background: 'none' }} />
        <span style={{ fontSize: 12, color: '#6b7280', fontFamily: 'monospace' }}>{value}</span>
      </div>
    </div>
  )
}

// ── Accordion section ────────────────────────────────────────────────────────

function Section({ id, open, onToggle, emoji, title, children }: {
  id: string; open: boolean; onToggle: (id: string) => void
  emoji: string; title: string; children: React.ReactNode
}) {
  return (
    <div style={{ borderBottom: '1px solid #f3f4f6' }}>
      <button
        onClick={() => onToggle(id)}
        style={{ width: '100%', padding: '13px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: open ? '#fafaff' : 'white', border: 'none', cursor: 'pointer', textAlign: 'left', transition: 'background 0.15s' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 17 }}>{emoji}</span>
          <span style={{ fontSize: 13.5, fontWeight: 600, color: '#111827' }}>{title}</span>
        </div>
        {open
          ? <ChevronDown size={14} color="#9ca3af" />
          : <ChevronRight size={14} color="#9ca3af" />}
      </button>
      {open && <div style={{ padding: '4px 20px 18px' }}>{children}</div>}
    </div>
  )
}

// ── Main component ───────────────────────────────────────────────────────────

interface StoreBuilderProps {
  onClose: () => void
}

export function StoreBuilder({ onClose }: StoreBuilderProps) {
  const { user } = useAuthStore()
  const [state, setState] = useState<BuilderState>(DEFAULT)
  const [loading, setLoading]   = useState(true)
  const [saving, setSaving]     = useState(false)
  const [saved, setSaved]       = useState(false)
  const [previewMode, setPreviewMode] = useState<'desktop' | 'mobile'>('desktop')
  const [iframeKey, setIframeKey]     = useState(0)
  const [openSection, setOpenSection] = useState('identity')

  const slug     = user?.tenantSlug
  const storeUrl = slug ? `${typeof window !== 'undefined' ? window.location.origin : ''}/menu/${slug}` : null

  // Load settings
  useEffect(() => {
    ;(async () => {
      try {
        const res = await api.getStoreCustomization()
        if (res.success && res.data) {
          const { storeInfo: si, banners, announcementBar: ab } = res.data
          const hero = (banners ?? []).find((b: any) => b.position === 'hero1')
          setState({
            logoUrl:              si?.logoUrl              ?? '',
            heroBannerId:         hero?.id,
            heroBannerImage:      hero?.imageUrl           ?? '',
            heroBannerTitle:      hero?.title              ?? '',
            heroBannerSubtitle:   hero?.subtitle           ?? '',
            heroBannerLink:       hero?.linkUrl            ?? '',
            announcementText:     ab?.text                 ?? '',
            announcementBgColor:  ab?.bgColor              ?? '#000000',
            announcementTextColor:ab?.textColor            ?? '#ffffff',
            announcementActive:   ab?.isActive             ?? false,
            socialWhatsapp:       si?.socialWhatsapp       ?? '',
            socialInstagram:      si?.socialInstagram      ?? '',
            socialFacebook:       si?.socialFacebook       ?? '',
            socialTiktok:         si?.socialTiktok         ?? '',
            schedule:             si?.schedule             ?? '',
            allowContraentrega:   si?.allowContraentrega   ?? false,
          })
        }
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  const set = (key: keyof BuilderState, value: string | boolean | number | undefined) =>
    setState(prev => ({ ...prev, [key]: value }))

  const toggleSection = (id: string) => setOpenSection(prev => prev === id ? '' : id)

  const save = async () => {
    setSaving(true)
    try {
      await Promise.all([
        api.updateStoreExtendedInfo({
          logoUrl:           state.logoUrl,
          socialWhatsapp:    state.socialWhatsapp,
          socialInstagram:   state.socialInstagram,
          socialFacebook:    state.socialFacebook,
          socialTiktok:      state.socialTiktok,
          schedule:          state.schedule,
          allowContraentrega:state.allowContraentrega,
        }),
        api.updateBanner({
          id:       state.heroBannerId,
          position: 'hero1',
          imageUrl: state.heroBannerImage,
          title:    state.heroBannerTitle,
          subtitle: state.heroBannerSubtitle,
          linkUrl:  state.heroBannerLink,
        }),
        api.updateAnnouncementBar({
          text:      state.announcementText,
          bgColor:   state.announcementBgColor,
          textColor: state.announcementTextColor,
          isActive:  state.announcementActive,
        }),
      ])
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
      setIframeKey(k => k + 1)
    } finally {
      setSaving(false)
    }
  }

  // ── Render ──────────────────────────────────────────────────────────────────

  const btnBase: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, fontWeight: 500, borderRadius: 8, border: '1px solid #e5e7eb', cursor: 'pointer', padding: '6px 11px', background: 'white', color: '#4b5563', textDecoration: 'none' }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', flexDirection: 'column', background: '#f8fafc', fontFamily: 'inherit' }}>

      {/* ── Top bar ── */}
      <div style={{ height: 56, background: 'white', borderBottom: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', padding: '0 16px', gap: 12, flexShrink: 0, boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
        <button onClick={onClose} style={{ ...btnBase, border: 'none', color: '#6b7280', padding: '6px 8px' }}>
          <X size={16} /> Salir
        </button>

        {/* Title */}
        <div style={{ flex: 1, textAlign: 'center' }}>
          <span style={{ fontSize: 14, fontWeight: 700, color: '#111827' }}>✨ Editor de Tienda</span>
        </div>

        {/* Preview toggle */}
        <div style={{ display: 'flex', background: '#f3f4f6', borderRadius: 8, padding: 3, gap: 2 }}>
          {(['desktop', 'mobile'] as const).map(mode => (
            <button key={mode} onClick={() => setPreviewMode(mode)}
              style={{ padding: '5px 10px', borderRadius: 6, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, fontWeight: 500, transition: 'all 0.15s', background: previewMode === mode ? 'white' : 'transparent', color: previewMode === mode ? '#111827' : '#9ca3af', boxShadow: previewMode === mode ? '0 1px 3px rgba(0,0,0,0.1)' : 'none' }}
            >
              {mode === 'desktop' ? <Monitor size={13} /> : <Smartphone size={13} />}
              {mode === 'desktop' ? 'Desktop' : 'Móvil'}
            </button>
          ))}
        </div>

        {storeUrl && (
          <a href={storeUrl} target="_blank" rel="noopener noreferrer" style={btnBase}>
            <ExternalLink size={12} /> Ver tienda
          </a>
        )}

        <button onClick={() => setIframeKey(k => k + 1)} style={btnBase} title="Recargar preview">
          <RefreshCw size={12} />
        </button>

        {/* Save */}
        <button onClick={save} disabled={saving}
          style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600, color: 'white', background: saved ? '#16a34a' : 'linear-gradient(135deg,#6366f1,#8b5cf6)', border: 'none', borderRadius: 8, padding: '8px 18px', cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.8 : 1, transition: 'background 0.3s', minWidth: 100, justifyContent: 'center' }}
        >
          {saving ? <Loader2 size={13} className="animate-spin" /> : saved ? <Check size={13} /> : <Save size={13} />}
          {saving ? 'Guardando…' : saved ? '¡Guardado!' : 'Guardar'}
        </button>
      </div>

      {/* ── Body ── */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

        {/* Left panel */}
        <div style={{ width: 300, background: 'white', borderRight: '1px solid #e5e7eb', overflowY: 'auto', flexShrink: 0 }}>
          {loading ? (
            <div style={{ padding: 48, display: 'flex', justifyContent: 'center' }}>
              <Loader2 size={26} color="#6366f1" className="animate-spin" />
            </div>
          ) : (
            <>
              <Section id="identity" open={openSection === 'identity'} onToggle={toggleSection} emoji="🏪" title="Identidad">
                <Field label="Logo de la tienda">
                  <TextInput value={state.logoUrl} onChange={v => set('logoUrl', v)} placeholder="https://... url del logo" />
                  {state.logoUrl && (
                    <img src={state.logoUrl} alt="Logo" style={{ marginTop: 8, height: 48, objectFit: 'contain', borderRadius: 6, border: '1px solid #f0f0f0' }} />
                  )}
                </Field>
              </Section>

              <Section id="banner" open={openSection === 'banner'} onToggle={toggleSection} emoji="🖼️" title="Banner Principal">
                <Field label="Imagen del banner">
                  <TextInput value={state.heroBannerImage} onChange={v => set('heroBannerImage', v)} placeholder="https://... url de imagen" />
                </Field>
                <Field label="Título">
                  <TextInput value={state.heroBannerTitle} onChange={v => set('heroBannerTitle', v)} placeholder="Bienvenido a mi tienda" />
                </Field>
                <Field label="Subtítulo">
                  <TextInput value={state.heroBannerSubtitle} onChange={v => set('heroBannerSubtitle', v)} placeholder="Los mejores productos" />
                </Field>
                <Field label="Enlace (opcional)">
                  <TextInput value={state.heroBannerLink} onChange={v => set('heroBannerLink', v)} placeholder="https://..." />
                </Field>
              </Section>

              <Section id="announcement" open={openSection === 'announcement'} onToggle={toggleSection} emoji="📢" title="Barra de Anuncios">
                <Field label="Texto del anuncio">
                  <TextInput value={state.announcementText} onChange={v => set('announcementText', v)} placeholder="¡Envíos gratis hoy!" />
                </Field>
                <div style={{ display: 'flex', gap: 10, marginBottom: 14 }}>
                  <ColorPicker label="Fondo"  value={state.announcementBgColor}   onChange={v => set('announcementBgColor', v)} />
                  <ColorPicker label="Texto"  value={state.announcementTextColor} onChange={v => set('announcementTextColor', v)} />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                  <span style={{ fontSize: 13, color: '#374151', fontWeight: 500 }}>Activar barra</span>
                  <Toggle value={state.announcementActive} onChange={v => set('announcementActive', v)} />
                </div>
                {state.announcementText && (
                  <div style={{ padding: '8px 12px', borderRadius: 6, background: state.announcementBgColor, color: state.announcementTextColor, fontSize: 12, textAlign: 'center', fontWeight: 500, wordBreak: 'break-word' }}>
                    {state.announcementText}
                  </div>
                )}
              </Section>

              <Section id="social" open={openSection === 'social'} onToggle={toggleSection} emoji="📱" title="Redes Sociales">
                <Field label="WhatsApp"><TextInput value={state.socialWhatsapp}  onChange={v => set('socialWhatsapp', v)}  placeholder="+57 300 000 0000" /></Field>
                <Field label="Instagram"><TextInput value={state.socialInstagram} onChange={v => set('socialInstagram', v)} placeholder="@tutienda" /></Field>
                <Field label="Facebook"><TextInput value={state.socialFacebook}  onChange={v => set('socialFacebook', v)}  placeholder="facebook.com/tutienda" /></Field>
                <Field label="TikTok"><TextInput value={state.socialTiktok}    onChange={v => set('socialTiktok', v)}    placeholder="@tutienda" /></Field>
              </Section>

              <Section id="settings" open={openSection === 'settings'} onToggle={toggleSection} emoji="⚙️" title="Configuración">
                <Field label="Horario de atención">
                  <TextInput value={state.schedule} onChange={v => set('schedule', v)} placeholder="Lun–Vie 8am–6pm" />
                </Field>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, padding: '8px 0' }}>
                  <div>
                    <span style={{ fontSize: 13, color: '#374151', fontWeight: 500 }}>Permitir contraentrega</span>
                    <p style={{ fontSize: 11, color: '#9ca3af', margin: '2px 0 0' }}>Pago en efectivo al recibir</p>
                  </div>
                  <Toggle value={state.allowContraentrega} onChange={v => set('allowContraentrega', v)} />
                </div>
              </Section>
            </>
          )}
        </div>

        {/* Right preview */}
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 28, background: '#f1f5f9', overflow: 'auto' }}>
          {!storeUrl ? (
            <div style={{ textAlign: 'center', color: '#9ca3af', fontSize: 14 }}>
              <p>No hay URL de tienda configurada</p>
              <p style={{ fontSize: 12, marginTop: 4 }}>Verifica que el slug del tenant esté asignado.</p>
            </div>
          ) : (
            <div style={{
              width: previewMode === 'desktop' ? '100%' : 390,
              maxWidth: previewMode === 'desktop' ? 1200 : 390,
              height: '100%',
              minHeight: 500,
              borderRadius: 16,
              overflow: 'hidden',
              boxShadow: '0 24px 60px rgba(0,0,0,0.15), 0 8px 20px rgba(0,0,0,0.07)',
              border: '1px solid rgba(0,0,0,0.06)',
              background: 'white',
              transition: 'width 0.35s ease, max-width 0.35s ease',
              flexShrink: 0,
            }}>
              <iframe
                key={iframeKey}
                src={storeUrl}
                style={{ width: '100%', height: '100%', border: 'none', display: 'block' }}
                title="Preview de tienda"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
