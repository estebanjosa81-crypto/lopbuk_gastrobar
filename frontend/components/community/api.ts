// Cliente del módulo COMUNIDAD (backend Lopbuk).
import { api } from '@/lib/api'

const API_URL = process.env.NEXT_PUBLIC_API_URL || '/api'

export async function cReq<T = any>(path: string, options: RequestInit = {}): Promise<T> {
  const token = api.getToken?.()
  const res = await fetch(`${API_URL}/community${path}`, {
    ...options,
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}), ...(options.headers || {}) },
  })
  const body = await res.json().catch(() => ({}))
  if (!res.ok || body?.success === false) {
    const err: any = new Error(body?.error || body?.message || 'Error')
    err.status = res.status
    throw err
  }
  return (body?.data ?? body) as T
}

export type Category = 'noticia' | 'video' | 'tutorial' | 'app' | 'oferta'

export interface PostMedia { id: string; mediaType: 'image' | 'video' | 'gif'; url: string; orderIndex: number }
export interface PostAd {
  id: string; productId: string; tenantId: string; name: string; salePrice: number;
  imageUrl: string | null; isOnOffer: boolean; offerPrice: number | null; storeSlug: string | null; storeName: string | null
}
export interface CommunityPost {
  id: string; title: string; body: string | null; category: Category; status: 'draft' | 'published'
  coverUrl: string | null; author: string; authorAvatar: string | null
  likes: number; saves: number; comments: number; createdAt: string; publishedAt: string | null
  media: PostMedia[]; ads: PostAd[]; liked: boolean; saved: boolean
}
export interface CommunityComment {
  id: string; postId?: string; userId?: string; body: string; parentId: string | null; createdAt: string; user: string; avatar?: string | null
}
export interface PublicProductLite {
  id: string; name: string; brand?: string; salePrice: number; imageUrl: string | null
  isOnOffer: boolean; offerPrice: number | null; tenantId: string; storeSlug: string; storeName: string
}

export const communityApi = {
  feed: (params: { sort?: string; category?: string; q?: string; page?: number } = {}) => {
    const qs = new URLSearchParams()
    if (params.sort) qs.set('sort', params.sort)
    if (params.category) qs.set('category', params.category)
    if (params.q) qs.set('q', params.q)
    if (params.page) qs.set('page', String(params.page))
    const s = qs.toString()
    return cReq<{ data: CommunityPost[]; page: number; total: number; hasMore: boolean }>(`/posts${s ? `?${s}` : ''}`)
  },
  post: (id: string) => cReq<CommunityPost>(`/posts/${id}`),
  react: (id: string, type: 'like' | 'save') => cReq<{ type: string; active: boolean; likes: number; saves: number }>(`/posts/${id}/react`, { method: 'POST', body: JSON.stringify({ type }) }),
  comments: (id: string) => cReq<CommunityComment[]>(`/posts/${id}/comments`),
  comment: (id: string, body: string, parentId?: string) => cReq<CommunityComment>(`/posts/${id}/comments`, { method: 'POST', body: JSON.stringify({ body, parentId }) }),
  searchProducts: (q: string) => cReq<PublicProductLite[]>(`/products/public?q=${encodeURIComponent(q)}`),

  // admin
  myPosts: () => cReq<CommunityPost[]>('/admin/posts'),
  createPost: (data: any) => cReq<{ id: string }>('/posts', { method: 'POST', body: JSON.stringify(data) }),
  updatePost: (id: string, data: any) => cReq<{ id: string }>(`/posts/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deletePost: (id: string) => cReq(`/posts/${id}`, { method: 'DELETE' }),
  myComments: () => cReq<any[]>('/admin/comments'),
  moderateComment: (id: string) => cReq(`/comments/${id}`, { method: 'DELETE' }),
  adminStats: () => cReq<{ posts: number; published: number; likes: number; saves: number; comments: number }>('/admin/stats'),

  // superadmin
  createAdmin: (data: { name: string; email: string; password: string }) => cReq('/admins', { method: 'POST', body: JSON.stringify(data) }),
  listAdmins: () => cReq<any[]>('/admins'),
  superStats: () => cReq<{ published: number; total: number; reactions: number; comments: number; admins: number }>('/superadmin/stats'),
}

export const formatCOP = (n: number) => {
  try { return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n) }
  catch { return `$${n}` }
}

export const timeAgo = (iso: string) => {
  const d = new Date(iso).getTime()
  if (isNaN(d)) return ''
  const s = Math.floor((Date.now() - d) / 1000)
  if (s < 60) return 'hace un momento'
  const m = Math.floor(s / 60); if (m < 60) return `hace ${m} min`
  const h = Math.floor(m / 60); if (h < 24) return `hace ${h} h`
  const days = Math.floor(h / 24); if (days < 7) return `hace ${days} d`
  return new Date(iso).toLocaleDateString('es-CO')
}

export const ytEmbed = (url: string): string | null => {
  if (!url) return null
  const m = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|v\/|shorts\/))([\w-]{11})/)
  if (m) return `https://www.youtube.com/embed/${m[1]}`
  return null
}
