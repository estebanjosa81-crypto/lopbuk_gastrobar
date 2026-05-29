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
  secondaryBannerId?: number
  secondaryBannerImage: string
  secondaryBannerTitle: string
  secondaryBannerSubtitle: string
  secondaryBannerLink: string
  announcementText: string
  announcementLink: string
  announcementBgColor: string
  announcementTextColor: string
  announcementActive: boolean
  announcementSpeed: number
  socialWhatsapp: string
  socialInstagram: string
  socialFacebook: string
  socialTiktok: string
  schedule: string
  locationMapUrl: string
  termsContent: string
  privacyContent: string
  shippingTerms: string
  paymentMethods: string
  department: string
  municipality: string
  productCardStyle: string
  showInfoModule: boolean
  infoModuleDescription: string
  metaPixelId: string
  allowContraentrega: boolean
  cartMinPurchase: number
  cartDeliveryFee: number
  contactPageEnabled: boolean
  contactPageTitle: string
  contactPageDescription: string
  contactPageImage: string
  ageGateEnabled: boolean
  ageGateDescription: string
}

const DEFAULT: BuilderState = {
  logoUrl: '',
  heroBannerImage: '',
  heroBannerTitle: '',
  heroBannerSubtitle: '',
  heroBannerLink: '',
  secondaryBannerImage: '',
  secondaryBannerTitle: '',
  secondaryBannerSubtitle: '',
  secondaryBannerLink: '',
  announcementText: '',
  announcementLink: '',
  announcementBgColor: '#000000',
  announcementTextColor: '#ffffff',
  announcementActive: false,
  announcementSpeed: 3,
  socialWhatsapp: '',
  socialInstagram: '',
  socialFacebook: '',
  socialTiktok: '',
  schedule: '',
  locationMapUrl: '',
  termsContent: '',
  privacyContent: '',
  shippingTerms: '',
  paymentMethods: '',
  department: '',
  municipality: '',
  productCardStyle: 'style1',
  showInfoModule: false,
  infoModuleDescription: '',
  metaPixelId: '',
  allowContraentrega: false,
  cartMinPurchase: 0,
  cartDeliveryFee: 0,
  contactPageEnabled: false,
  contactPageTitle: '',
  contactPageDescription: '',
  contactPageImage: '',
  ageGateEnabled: false,
  ageGateDescription: '',
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

function TextArea({ value, onChange, placeholder, rows = 3 }: { value: string; onChange: (v: string) => void; placeholder?: string; rows?: number }) {
  return (
    <textarea
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      rows={rows}
      style={{ width: '100%', padding: '8px 10px', border: '1.5px solid #e5e7eb', borderRadius: 8, fontSize: 13, color: '#1f2937', outline: 'none', boxSizing: 'border-box', background: 'white', fontFamily: 'inherit', resize: 'vertical', lineHeight: 1.35 }}
    />
  )
}

function NumberInput({ value, onChange, placeholder }: { value: number; onChange: (v: number) => void; placeholder?: string }) {
  return (
    <input
      type="number"
      min={0}
      value={Number.isFinite(value) ? value : 0}
      onChange={e => onChange(Math.max(0, Number(e.target.value) || 0))}
      placeholder={placeholder}
      style={{ width: '100%', padding: '8px 10px', border: '1.5px solid #e5e7eb', borderRadius: 8, fontSize: 13, color: '#1f2937', outline: 'none', boxSizing: 'border-box', background: 'white', fontFamily: 'inherit' }}
    />
  )
}

function SelectInput({ value, onChange, children }: { value: string; onChange: (v: string) => void; children: React.ReactNode }) {
  return (
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      style={{ width: '100%', padding: '8px 10px', border: '1.5px solid #e5e7eb', borderRadius: 8, fontSize: 13, color: '#1f2937', outline: 'none', boxSizing: 'border-box', background: 'white', fontFamily: 'inherit' }}
    >
      {children}
    </select>
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
  const origin = typeof window !== 'undefined' ? window.location.origin : ''
  const storeUrl = slug ? `${origin}/?store=${encodeURIComponent(slug)}&preview=home` : null
  const publicStoreUrl = slug ? `${origin}/?store=${encodeURIComponent(slug)}` : null

  // Load settings
  useEffect(() => {
    ;(async () => {
      try {
        const res = await api.getStoreCustomization()
        if (res.success && res.data) {
          const { storeInfo: si, banners, announcementBar: ab } = res.data
          const hero = (banners ?? []).find((b: any) => b.position === 'hero1')
          const secondary = (banners ?? []).find((b: any) => b.position === 'hero4')
          setState({
            logoUrl:              si?.logoUrl              ?? '',
            heroBannerId:         hero?.id,
            heroBannerImage:      hero?.imageUrl           ?? '',
            heroBannerTitle:      hero?.title              ?? '',
            heroBannerSubtitle:   hero?.subtitle           ?? '',
            heroBannerLink:       hero?.linkUrl            ?? '',
            secondaryBannerId:       secondary?.id,
            secondaryBannerImage:    secondary?.imageUrl    ?? '',
            secondaryBannerTitle:    secondary?.title       ?? '',
            secondaryBannerSubtitle: secondary?.subtitle    ?? '',
            secondaryBannerLink:     secondary?.linkUrl     ?? '',
            announcementText:     ab?.text                 ?? '',
            announcementLink:     ab?.linkUrl              ?? '',
            announcementBgColor:  ab?.bgColor              ?? '#000000',
            announcementTextColor:ab?.textColor            ?? '#ffffff',
            announcementActive:   ab?.isActive             ?? false,
            announcementSpeed:    ab?.scrollSpeed          ?? 3,
            socialWhatsapp:       si?.socialWhatsapp       ?? '',
            socialInstagram:      si?.socialInstagram      ?? '',
            socialFacebook:       si?.socialFacebook       ?? '',
            socialTiktok:         si?.socialTiktok         ?? '',
            schedule:             si?.schedule             ?? '',
            locationMapUrl:       si?.locationMapUrl       ?? '',
            termsContent:         si?.termsContent         ?? '',
            privacyContent:       si?.privacyContent       ?? '',
            shippingTerms:        si?.shippingTerms        ?? '',
            paymentMethods:       si?.paymentMethods       ?? '',
            department:           si?.department           ?? '',
            municipality:         si?.municipality         ?? '',
            productCardStyle:     si?.productCardStyle     ?? 'style1',
            showInfoModule:       !!si?.showInfoModule,
            infoModuleDescription:si?.infoModuleDescription ?? '',
            metaPixelId:          si?.metaPixelId          ?? '',
            allowContraentrega:   si?.allowContraentrega   ?? false,
            cartMinPurchase:      Number(res.data.cartMinPurchase || 0),
            cartDeliveryFee:      Number(res.data.cartDeliveryFee || 0),
            contactPageEnabled:   !!si?.contactPageEnabled,
            contactPageTitle:     si?.contactPageTitle     ?? '',
            contactPageDescription: si?.contactPageDescription ?? '',
            contactPageImage:     si?.contactPageImage     ?? '',
            ageGateEnabled:       !!si?.ageGateEnabled,
            ageGateDescription:   si?.ageGateDescription   ?? '',
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
          schedule:          state.schedule,
          locationMapUrl:    state.locationMapUrl,
          termsContent:      state.termsContent,
          privacyContent:    state.privacyContent,
          shippingTerms:     state.shippingTerms,
          paymentMethods:    state.paymentMethods,
          socialWhatsapp:    state.socialWhatsapp,
          socialInstagram:   state.socialInstagram,
          socialFacebook:    state.socialFacebook,
          socialTiktok:      state.socialTiktok,
          department:        state.department,
          municipality:      state.municipality,
          productCardStyle:  state.productCardStyle,
          showInfoModule:    state.showInfoModule,
          infoModuleDescription: state.infoModuleDescription,
          metaPixelId:       state.metaPixelId,
          allowContraentrega:state.allowContraentrega,
        }),
        state.heroBannerImage ? api.updateBanner({
          id:       state.heroBannerId,
          position: 'hero1',
          imageUrl: state.heroBannerImage,
          title:    state.heroBannerTitle,
          subtitle: state.heroBannerSubtitle,
          linkUrl:  state.heroBannerLink,
        }) : Promise.resolve(),
        state.secondaryBannerImage ? api.updateBanner({
          id:       state.secondaryBannerId,
          position: 'hero4',
          imageUrl: state.secondaryBannerImage,
          title:    state.secondaryBannerTitle,
          subtitle: state.secondaryBannerSubtitle,
          linkUrl:  state.secondaryBannerLink,
        }) : Promise.resolve(),
        api.updateAnnouncementBar({
          text:      state.announcementText,
          linkUrl:   state.announcementLink,
          bgColor:   state.announcementBgColor,
          textColor: state.announcementTextColor,
          isActive:  state.announcementActive,
          scrollSpeed: state.announcementSpeed,
        }),
        api.updateCartSettings({
          cartMinPurchase: state.cartMinPurchase,
          cartDeliveryFee: state.cartDeliveryFee,
        }),
        api.updateContactPage({
          contactPageEnabled: state.contactPageEnabled,
          contactPageTitle: state.contactPageTitle,
          contactPageDescription: state.contactPageDescription,
          contactPageImage: state.contactPageImage,
          socialWhatsapp: state.socialWhatsapp,
          socialInstagram: state.socialInstagram,
          socialFacebook: state.socialFacebook,
          socialTiktok: state.socialTiktok,
        }),
        api.updateAgeGate({
          ageGateEnabled: state.ageGateEnabled,
          ageGateDescription: state.ageGateDescription,
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

        {publicStoreUrl && (
          <a href={publicStoreUrl} target="_blank" rel="noopener noreferrer" style={btnBase}>
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

              <Section id="secondary-banner" open={openSection === 'secondary-banner'} onToggle={toggleSection} emoji="🧱" title="Segundo Banner">
                <Field label="Imagen del segundo banner">
                  <TextInput value={state.secondaryBannerImage} onChange={v => set('secondaryBannerImage', v)} placeholder="https://... url de imagen" />
                </Field>
                <Field label="Título">
                  <TextInput value={state.secondaryBannerTitle} onChange={v => set('secondaryBannerTitle', v)} placeholder="Nueva colección, combos, promociones..." />
                </Field>
                <Field label="Subtítulo">
                  <TextInput value={state.secondaryBannerSubtitle} onChange={v => set('secondaryBannerSubtitle', v)} placeholder="Texto de apoyo" />
                </Field>
                <Field label="Enlace (opcional)">
                  <TextInput value={state.secondaryBannerLink} onChange={v => set('secondaryBannerLink', v)} placeholder="https://..." />
                </Field>
              </Section>

              <Section id="announcement" open={openSection === 'announcement'} onToggle={toggleSection} emoji="📢" title="Barra de Anuncios">
                <Field label="Texto del anuncio">
                  <TextInput value={state.announcementText} onChange={v => set('announcementText', v)} placeholder="¡Envíos gratis hoy!" />
                </Field>
                <Field label="Enlace del anuncio">
                  <TextInput value={state.announcementLink} onChange={v => set('announcementLink', v)} placeholder="https://... opcional" />
                </Field>
                <div style={{ display: 'flex', gap: 10, marginBottom: 14 }}>
                  <ColorPicker label="Fondo"  value={state.announcementBgColor}   onChange={v => set('announcementBgColor', v)} />
                  <ColorPicker label="Texto"  value={state.announcementTextColor} onChange={v => set('announcementTextColor', v)} />
                </div>
                <Field label="Velocidad de movimiento">
                  <SelectInput value={String(state.announcementSpeed)} onChange={v => set('announcementSpeed', Number(v))}>
                    <option value="0">Sin movimiento</option>
                    <option value="1">Muy lento</option>
                    <option value="2">Lento</option>
                    <option value="3">Normal</option>
                    <option value="4">Rápido</option>
                    <option value="5">Muy rápido</option>
                  </SelectInput>
                </Field>
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

              <Section id="info-module" open={openSection === 'info-module'} onToggle={toggleSection} emoji="ℹ️" title="Módulo de Información">
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, padding: '8px 0', marginBottom: 10 }}>
                  <div>
                    <span style={{ fontSize: 13, color: '#374151', fontWeight: 500 }}>Mostrar módulo informativo</span>
                    <p style={{ fontSize: 11, color: '#9ca3af', margin: '2px 0 0' }}>Bloque para contar beneficios, historia o instrucciones.</p>
                  </div>
                  <Toggle value={state.showInfoModule} onChange={v => set('showInfoModule', v)} />
                </div>
                <Field label="Descripción del módulo">
                  <TextArea value={state.infoModuleDescription} onChange={v => set('infoModuleDescription', v)} placeholder="Ej: Productos frescos, atención personalizada, pagos seguros..." rows={4} />
                </Field>
              </Section>

              <Section id="contact-page" open={openSection === 'contact-page'} onToggle={toggleSection} emoji="☎️" title="Página de Contacto">
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, padding: '8px 0', marginBottom: 10 }}>
                  <div>
                    <span style={{ fontSize: 13, color: '#374151', fontWeight: 500 }}>Activar página de contacto</span>
                    <p style={{ fontSize: 11, color: '#9ca3af', margin: '2px 0 0' }}>Crea una página tipo link-in-bio para redes.</p>
                  </div>
                  <Toggle value={state.contactPageEnabled} onChange={v => set('contactPageEnabled', v)} />
                </div>
                <Field label="Título">
                  <TextInput value={state.contactPageTitle} onChange={v => set('contactPageTitle', v)} placeholder="Contáctanos" />
                </Field>
                <Field label="Descripción">
                  <TextArea value={state.contactPageDescription} onChange={v => set('contactPageDescription', v)} placeholder="Pedidos, reservas, asesoría..." />
                </Field>
                <Field label="Imagen principal">
                  <TextInput value={state.contactPageImage} onChange={v => set('contactPageImage', v)} placeholder="https://... imagen de contacto" />
                </Field>
              </Section>

              <Section id="cart" open={openSection === 'cart'} onToggle={toggleSection} emoji="🛒" title="Carrito y Domicilios">
                <Field label="Compra mínima para domicilio">
                  <NumberInput value={state.cartMinPurchase} onChange={v => set('cartMinPurchase', v)} placeholder="0" />
                </Field>
                <Field label="Tarifa de domicilio">
                  <NumberInput value={state.cartDeliveryFee} onChange={v => set('cartDeliveryFee', v)} placeholder="0" />
                </Field>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, padding: '8px 0' }}>
                  <div>
                    <span style={{ fontSize: 13, color: '#374151', fontWeight: 500 }}>Permitir contraentrega</span>
                    <p style={{ fontSize: 11, color: '#9ca3af', margin: '2px 0 0' }}>Pago en efectivo al recibir</p>
                  </div>
                  <Toggle value={state.allowContraentrega} onChange={v => set('allowContraentrega', v)} />
                </div>
              </Section>

              <Section id="legal" open={openSection === 'legal'} onToggle={toggleSection} emoji="📄" title="Textos Legales">
                <Field label="Términos y condiciones">
                  <TextArea value={state.termsContent} onChange={v => set('termsContent', v)} placeholder="Políticas de compra, cambios y garantías..." rows={4} />
                </Field>
                <Field label="Política de privacidad">
                  <TextArea value={state.privacyContent} onChange={v => set('privacyContent', v)} placeholder="Tratamiento de datos personales..." rows={4} />
                </Field>
                <Field label="Condiciones de envío">
                  <TextArea value={state.shippingTerms} onChange={v => set('shippingTerms', v)} placeholder="Zonas, tiempos, costos y restricciones..." rows={4} />
                </Field>
              </Section>

              <Section id="settings" open={openSection === 'settings'} onToggle={toggleSection} emoji="⚙️" title="Configuración">
                <Field label="Horario de atención">
                  <TextInput value={state.schedule} onChange={v => set('schedule', v)} placeholder="Lun–Vie 8am–6pm" />
                </Field>
                <Field label="URL de Google Maps">
                  <TextInput value={state.locationMapUrl} onChange={v => set('locationMapUrl', v)} placeholder="https://maps.google.com/..." />
                </Field>
                <Field label="Departamento">
                  <TextInput value={state.department} onChange={v => set('department', v)} placeholder="Antioquia, Cundinamarca..." />
                </Field>
                <Field label="Municipio">
                  <TextInput value={state.municipality} onChange={v => set('municipality', v)} placeholder="Medellín, Bogotá..." />
                </Field>
                <Field label="Métodos de pago visibles">
                  <TextInput value={state.paymentMethods} onChange={v => set('paymentMethods', v)} placeholder="Nequi, tarjeta, efectivo, transferencia..." />
                </Field>
                <Field label="Estilo de tarjeta de producto">
                  <SelectInput value={state.productCardStyle} onChange={v => set('productCardStyle', v)}>
                    <option value="style1">Estilo 1 - Clásico</option>
                    <option value="style2">Estilo 2 - Editorial</option>
                    <option value="style3">Estilo 3 - Compacto</option>
                  </SelectInput>
                </Field>
                <Field label="Meta Pixel ID">
                  <TextInput value={state.metaPixelId} onChange={v => set('metaPixelId', v)} placeholder="1234567890" />
                </Field>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, padding: '8px 0' }}>
                  <div>
                    <span style={{ fontSize: 13, color: '#374151', fontWeight: 500 }}>Verificación de edad</span>
                    <p style={{ fontSize: 11, color: '#9ca3af', margin: '2px 0 0' }}>Solicita confirmación antes de entrar.</p>
                  </div>
                  <Toggle value={state.ageGateEnabled} onChange={v => set('ageGateEnabled', v)} />
                </div>
                <Field label="Texto de verificación de edad">
                  <TextArea value={state.ageGateDescription} onChange={v => set('ageGateDescription', v)} placeholder="Debes ser mayor de edad para continuar." />
                </Field>
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
