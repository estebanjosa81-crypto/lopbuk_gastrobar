'use client'

// Preloader del portafolio: muestra DAIMUZ + redes configuradas y luego se desvanece.
import { useEffect, useState } from 'react'

type Socials = { instagram?: string | null; whatsapp?: string | null; email?: string | null }

export function PortfolioPreloader({
  brand = 'DAIMUZ',
  tagline = 'Soluciones de gestión para tu negocio',
  accent = '#6366f1',
  socials = {},
  durationMs = 2200,
}: { brand?: string; tagline?: string; accent?: string; socials?: Socials; durationMs?: number }) {
  const [fading, setFading] = useState(false)
  const [gone, setGone] = useState(false)

  useEffect(() => {
    const t1 = setTimeout(() => setFading(true), durationMs)
    const t2 = setTimeout(() => setGone(true), durationMs + 700)
    return () => { clearTimeout(t1); clearTimeout(t2) }
  }, [durationMs])

  if (gone) return null

  const iconStyle: React.CSSProperties = { color: '#cbd5e1', transition: 'color .2s, transform .2s' }

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 100,
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        background: '#06060d',
        opacity: fading ? 0 : 1, filter: fading ? 'blur(8px)' : 'none',
        transition: 'opacity .7s ease, filter .7s ease', pointerEvents: fading ? 'none' : 'auto',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 18 }}>
        <span style={{ width: 14, height: 14, borderRadius: '50%', background: accent, boxShadow: `0 0 24px ${accent}` }} />
        <h1 style={{ fontSize: 'clamp(40px, 9vw, 86px)', fontWeight: 900, letterSpacing: '0.04em', color: '#fff', margin: 0 }}>{brand}</h1>
      </div>
      <p style={{ color: '#94a3b8', fontSize: 15, marginBottom: 26 }}>{tagline}</p>

      <div style={{ display: 'flex', gap: 22, alignItems: 'center' }}>
        {socials.instagram && (
          <a href={socials.instagram} target="_blank" rel="noopener noreferrer" aria-label="Instagram" style={iconStyle}>
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="2" width="20" height="20" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none"/></svg>
          </a>
        )}
        {socials.whatsapp && (
          <a href={`https://wa.me/${socials.whatsapp.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer" aria-label="WhatsApp" style={iconStyle}>
            <svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor"><path d="M.057 24l1.687-6.163a11.867 11.867 0 01-1.587-5.945C.16 5.335 5.495 0 12.05 0a11.82 11.82 0 018.413 3.488 11.82 11.82 0 013.48 8.414c-.003 6.557-5.338 11.892-11.893 11.892a11.9 11.9 0 01-5.688-1.448L.057 24zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884a9.86 9.86 0 001.599 5.39l-.999 3.648 3.889-1.337zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.5-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/></svg>
          </a>
        )}
        {socials.email && (
          <a href={`mailto:${socials.email}`} aria-label="Email" style={iconStyle}>
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/></svg>
          </a>
        )}
      </div>

      <div style={{ marginTop: 30, width: 130, height: 2, background: 'rgba(255,255,255,.1)', borderRadius: 2, overflow: 'hidden' }}>
        <div style={{ width: '40%', height: '100%', background: accent, animation: 'pf-load 1s ease-in-out infinite' }} />
      </div>
      <style>{`@keyframes pf-load { 0%{margin-left:-40%} 100%{margin-left:130%} }`}</style>
    </div>
  )
}

export default PortfolioPreloader
