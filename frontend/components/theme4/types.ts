// Tema 4 — tipos, cliente API y helpers.
import { api } from '@/lib/api'

export const API_URL = process.env.NEXT_PUBLIC_API_URL || '/api'

export type BusinessType = 'transport' | 'software' | 'general'

export interface Theme4Config {
  businessType: BusinessType
  heroVideoUrl?: string | null; heroImageUrl?: string | null
  heroTitle?: string | null; heroSubtitle?: string | null
  ctaLabel?: string | null; ctaUrl?: string | null
  aboutText?: string | null; accentColor?: string | null
  whatsapp?: string | null; email?: string | null; phone?: string | null
  address?: string | null; mapUrl?: string | null
  showStats: boolean; showServices: boolean; showProcess: boolean; showTeam: boolean
  showTestimonials: boolean; showContact: boolean; showCommunity: boolean
  likes: number; saves: number; isPublished: boolean
}
export interface Service { id: string; icon?: string; title: string; description?: string; priceLabel?: string; isFeatured?: boolean; orderIndex?: number; isActive?: boolean }
export interface Fleet { id: string; name: string; vehicleType: string; capacity?: number; photoUrl?: string; features?: string[]; orderIndex?: number; isActive?: boolean }
export interface RouteItem { id: string; origin: string; destination: string; stops?: string[]; departureTime?: string; arrivalTime?: string; vehicleId?: string; price?: number; bookingUrl?: string; orderIndex?: number; isActive?: boolean }
export interface Project { id: string; title: string; description?: string; category?: string; screenshotUrls?: string[]; techStack?: string[]; liveUrl?: string; caseStudyUrl?: string; isFeatured?: boolean; orderIndex?: number; isActive?: boolean }
export interface Stat { id: string; icon?: string; label: string; value: string; orderIndex?: number; isActive?: boolean }
export interface Step { id: string; stepNumber: number; title: string; description?: string; icon?: string; isActive?: boolean }
export interface TeamMember { id: string; name: string; role?: string; photoUrl?: string; bio?: string; linkedinUrl?: string; orderIndex?: number; isActive?: boolean }
export interface Testimonial { id: string; author: string; role?: string; avatarUrl?: string; rating: number; text: string; orderIndex?: number; isActive?: boolean }

export interface Theme4Data {
  tenant: { id: string; name: string; slug: string; logoUrl?: string | null }
  config: Theme4Config
  services: Service[]; fleet: Fleet[]; routes: RouteItem[]; projects: Project[]
  stats: Stat[]; steps: Step[]; team: TeamMember[]; testimonials: Testimonial[]
  reaction: { liked: boolean; saved: boolean }
}

export async function t4Req<T = any>(path: string, options: RequestInit = {}): Promise<T> {
  const token = api.getToken?.()
  const res = await fetch(`${API_URL}/theme4${path}`, {
    ...options, credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}), ...(options.headers || {}) },
  })
  const body = await res.json().catch(() => ({}))
  if (!res.ok || body?.success === false) { const e: any = new Error(body?.error || 'Error'); e.status = res.status; throw e }
  return (body?.data ?? body) as T
}

export const theme4Api = {
  getPublic: (slug: string) => t4Req<Theme4Data>(`/${encodeURIComponent(slug)}`),
  react: (slug: string, type: 'like' | 'save') => t4Req<{ active: boolean; likes: number; saves: number; type: string }>(`/${encodeURIComponent(slug)}/react`, { method: 'POST', body: JSON.stringify({ type }) }),
  // editor
  getMine: () => t4Req<Omit<Theme4Data, 'tenant' | 'reaction'>>('/admin/me'),
  saveConfig: (data: Partial<Theme4Config>) => t4Req<Theme4Config>('/config', { method: 'PUT', body: JSON.stringify(data) }),
  create: (entity: string, data: any) => t4Req(`/${entity}`, { method: 'POST', body: JSON.stringify(data) }),
  update: (entity: string, id: string, data: any) => t4Req(`/${entity}/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  remove: (entity: string, id: string) => t4Req(`/${entity}/${id}`, { method: 'DELETE' }),
}

export const formatCOP = (n: number) => {
  try { return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n) }
  catch { return `$${n}` }
}
export const ytEmbed = (url?: string | null): string | null => {
  if (!url) return null
  const m = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|v\/|shorts\/))([\w-]{11})/)
  if (m) return `https://www.youtube.com/embed/${m[1]}?autoplay=1&mute=1&loop=1&controls=0&playlist=${m[1]}`
  return null
}
