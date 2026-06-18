// Tipos compartidos del Tema 3 — Perfil Público del Tenant.

export type SectionType = 'image_text' | 'video' | 'gif' | 'description' | 'gallery'

export interface ProfileData {
  id: string | null
  tenantId: string
  coverUrl: string | null
  profilePhotoUrl: string | null
  displayName: string | null
  tagline: string | null
  aboutText: string | null
  instagram: string | null
  whatsapp: string | null
  website: string | null
  accentColor: string | null
  isPublished: boolean
}

export interface ProfileSection {
  id: string
  sectionType: SectionType
  orderIndex: number
  isActive: boolean
  content: {
    imageUrl?: string
    text?: string
    layout?: 'left' | 'right'
    url?: string
    title?: string
    caption?: string
    body?: string
    images?: string[]
  }
}

export interface PublicProduct {
  id: string
  name: string
  category?: string
  brand?: string
  description?: string
  salePrice: number
  imageUrl?: string | null
  images?: string[]
  stock?: number
  isOnOffer?: boolean
  offerPrice?: number | null
  offerLabel?: string | null
}

export interface ProfilePayload {
  profile: ProfileData
  sections: ProfileSection[]
  tenant: { id: string; name: string; slug: string }
}

export const API_URL = process.env.NEXT_PUBLIC_API_URL || '/api'

export const ytEmbed = (url: string): string | null => {
  if (!url) return null
  const m = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|v\/|shorts\/))([\w-]{11})/)
  if (m) return `https://www.youtube.com/embed/${m[1]}`
  if (/^[\w-]{11}$/.test(url)) return `https://www.youtube.com/embed/${url}`
  return null
}

export const formatCOP = (n: number) => {
  try { return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n) }
  catch { return `$${n}` }
}
