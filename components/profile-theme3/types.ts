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
    // image_text
    imageUrl?: string
    text?: string
    layout?: 'left' | 'right'
    // video
    url?: string
    title?: string
    // gif
    caption?: string
    // description
    body?: string
    // gallery
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
