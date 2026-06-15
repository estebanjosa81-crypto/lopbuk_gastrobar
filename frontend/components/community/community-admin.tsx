'use client'

/**
 * CommunityAdmin — panel del rol comunidad_admin (/comunidad/admin).
 * Mis publicaciones · Nueva/editar (media + adjuntar productos) · Moderar
 * comentarios · Estadísticas.
 */
import React, { useEffect, useState, useCallback } from 'react'
import { toast } from 'sonner'
import {
  FileText, Plus, BarChart3, MessageSquare, Trash2, Pencil, Eye, EyeOff, Loader2,
  Image as ImageIcon, Video, Film, X, Search, ShoppingBag, Save, LogOut, ExternalLink,
} from 'lucide-react'
import { useAuthStore } from '@/lib/auth-store'
import { getCloudinaryConfig } from '@/components/ui/cloudinary-upload'
import { communityApi, formatCOP, type CommunityPost, type Category, type PublicProductLite } from './api'

const CATS: { v: Category; l: string }[] = [
  { v: 'noticia', l: 'Noticia' }, { v: 'video', l: 'Video' }, { v: 'tutorial', l: 'Tutorial' }, { v: 'app', l: 'App' }, { v: 'oferta', l: 'Oferta' },
]
type Tab = 'posts' | 'editor' | 'comments' | 'stats'

export function CommunityAdmin() {
  const { user, logout } = useAuthStore()
  const [tab, setTab] = useState<Tab>('posts')
  const [editing, setEditing] = useState<CommunityPost | null>(null)

  const go = (t: Tab) => { setTab(t); if (t !== 'editor') setEditing(null) }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className="w-60 bg-white border-r min-h-screen p-4 hidden md:flex flex-col">
        <div className="font-extrabold text-lg mb-6">DAIMUZ <span className="text-cyan-600">Comunidad</span></div>
        <nav className="space-y-1 flex-1">
          <NavBtn active={tab === 'posts'} onClick={() => go('posts')} icon={<FileText className="w-4 h-4" />}>Mis publicaciones</NavBtn>
          <NavBtn active={tab === 'editor' && !editing} onClick={() => { setEditing(null); setTab('editor') }} icon={<Plus className="w-4 h-4" />}>Nueva publicación</NavBtn>
          <NavBtn active={tab === 'comments'} onClick={() => go('comments')} icon={<MessageSquare className="w-4 h-4" />}>Comentarios</NavBtn>
          <NavBtn active={tab === 'stats'} onClick={() => go('stats')} icon={<BarChart3 className="w-4 h-4" />}>Estadísticas</NavBtn>
        </nav>
        <a href="/comunidad" target="_blank" className="text-sm text-cyan-700 inline-flex items-center gap-1.5 px-3 py-2 hover:bg-cyan-50 rounded-lg">Ver feed <ExternalLink className="w-3.5 h-3.5" /></a>
        <button onClick={() => logout()} className="text-sm text-gray-500 inline-flex items-center gap-1.5 px-3 py-2 hover:bg-gray-100 rounded-lg"><LogOut className="w-4 h-4" /> Salir</button>
      </aside>

      {/* Mobile tabs */}
      <div className="md:hidden fixed bottom-0 inset-x-0 bg-white border-t z-20 flex">
        {([['posts', FileText], ['editor', Plus], ['comments', MessageSquare], ['stats', BarChart3]] as const).map(([t, Icon]) => (
          <button key={t} onClick={() => go(t as Tab)} className={`flex-1 py-2.5 flex justify-center ${tab === t ? 'text-cyan-600' : 'text-gray-400'}`}><Icon className="w-5 h-5" /></button>
        ))}
      </div>

      <main className="flex-1 min-w-0 pb-16 md:pb-0">
        <div className="p-5 md:p-8 max-w-3xl mx-auto">
          <p className="text-sm text-gray-400 mb-4">Hola, {user?.name || 'admin'}</p>
          {tab === 'posts' && <PostsList onNew={() => { setEditing(null); setTab('editor') }} onEdit={p => { setEditing(p); setTab('editor') }} />}
          {tab === 'editor' && <PostEditor post={editing} onDone={() => setTab('posts')} />}
          {tab === 'comments' && <CommentsModeration />}
          {tab === 'stats' && <Stats />}
        </div>
      </main>
    </div>
  )
}

function NavBtn({ active, onClick, icon, children }: { active: boolean; onClick: () => void; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <button onClick={onClick} className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium inline-flex items-center gap-2 ${active ? 'bg-cyan-50 text-cyan-700' : 'text-gray-600 hover:bg-gray-100'}`}>
      {icon} {children}
    </button>
  )
}

// ── Lista de publicaciones ────────────────────────────────────────────────────
function PostsList({ onNew, onEdit }: { onNew: () => void; onEdit: (p: CommunityPost) => void }) {
  const [posts, setPosts] = useState<CommunityPost[]>([])
  const [loading, setLoading] = useState(true)
  const load = useCallback(async () => { setLoading(true); try { setPosts(await communityApi.myPosts()) } catch { /* */ } finally { setLoading(false) } }, [])
  useEffect(() => { load() }, [load])

  const publicar = async (p: CommunityPost) => {
    try { await communityApi.updatePost(p.id, { status: p.status === 'published' ? 'draft' : 'published' }); toast.success(p.status === 'published' ? 'Pasado a borrador' : 'Publicado'); load() }
    catch (e: any) { toast.error(e.message) }
  }
  const eliminar = async (p: CommunityPost) => { if (!confirm('¿Eliminar publicación?')) return; try { await communityApi.deletePost(p.id); load() } catch (e: any) { toast.error(e.message) } }

  if (loading) return <Loader2 className="w-6 h-6 animate-spin text-cyan-600" />
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Mis publicaciones</h1>
        <button onClick={onNew} className="bg-cyan-600 text-white px-4 py-2 rounded-lg inline-flex items-center gap-1.5"><Plus className="w-4 h-4" /> Nueva</button>
      </div>
      {posts.length === 0 ? <p className="text-gray-400 py-10 text-center">Sin publicaciones aún.</p> :
        <div className="space-y-2">
          {posts.map(p => (
            <div key={p.id} className="bg-white border rounded-xl p-4 flex items-center gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2"><h3 className="font-semibold truncate">{p.title}</h3><span className="text-[11px] uppercase text-gray-400">{p.category}</span></div>
                <p className="text-xs text-gray-500 mt-0.5">{p.status === 'published' ? `Publicada · ❤️ ${p.likes} · 💬 ${p.comments}` : 'Borrador'}</p>
              </div>
              <button title={p.status === 'published' ? 'Despublicar' : 'Publicar'} onClick={() => publicar(p)} className="p-2 rounded-lg hover:bg-gray-100 text-gray-600">{p.status === 'published' ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}</button>
              <button onClick={() => onEdit(p)} className="p-2 rounded-lg hover:bg-gray-100 text-gray-600"><Pencil className="w-4 h-4" /></button>
              <button onClick={() => eliminar(p)} className="p-2 rounded-lg hover:bg-red-50 text-red-500"><Trash2 className="w-4 h-4" /></button>
            </div>
          ))}
        </div>}
    </div>
  )
}

// ── Editor ────────────────────────────────────────────────────────────────────
interface MediaItem { mediaType: 'image' | 'video' | 'gif'; url: string }
interface AdItem { productId: string; tenantId: string; name: string; imageUrl: string | null; salePrice: number; storeName: string }

function PostEditor({ post, onDone }: { post: CommunityPost | null; onDone: () => void }) {
  const [title, setTitle] = useState(post?.title || '')
  const [body, setBody] = useState(post?.body || '')
  const [category, setCategory] = useState<Category>(post?.category || 'noticia')
  const [media, setMedia] = useState<MediaItem[]>(post?.media?.map(m => ({ mediaType: m.mediaType, url: m.url })) || [])
  const [ads, setAds] = useState<AdItem[]>(post?.ads?.map(a => ({ productId: a.productId, tenantId: a.tenantId, name: a.name, imageUrl: a.imageUrl, salePrice: a.salePrice, storeName: a.storeName || '' })) || [])
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [showProducts, setShowProducts] = useState(false)
  const fileRef = React.useRef<HTMLInputElement>(null)
  const fileType = React.useRef<'image' | 'gif'>('image')

  const pickFile = (type: 'image' | 'gif') => { fileType.current = type; fileRef.current?.click() }
  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return
    setUploading(true)
    try {
      const { cloudName, uploadPreset } = await getCloudinaryConfig()
      if (!cloudName || !uploadPreset) throw new Error('Cloudinary no configurado (Integraciones)')
      const fd = new FormData(); fd.append('file', file); fd.append('upload_preset', uploadPreset)
      const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, { method: 'POST', body: fd })
      const data = await res.json(); if (!res.ok) throw new Error(data?.error?.message || 'Error')
      setMedia(m => [...m, { mediaType: fileType.current, url: data.secure_url }])
    } catch (e: any) { toast.error(e.message) } finally { setUploading(false); if (fileRef.current) fileRef.current.value = '' }
  }
  const addVideo = () => { const url = prompt('URL del video (YouTube o MP4):'); if (url?.trim()) setMedia(m => [...m, { mediaType: 'video', url: url.trim() }]) }

  const guardar = async (status: 'draft' | 'published') => {
    if (!title.trim()) { toast.error('El título es requerido'); return }
    setSaving(true)
    const payload = { title, body, category, status, media, ads: ads.map(a => ({ productId: a.productId, tenantId: a.tenantId })) }
    try {
      if (post) await communityApi.updatePost(post.id, payload)
      else await communityApi.createPost(payload)
      toast.success(status === 'published' ? 'Publicado' : 'Borrador guardado')
      onDone()
    } catch (e: any) { toast.error(e.message) } finally { setSaving(false) }
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">{post ? 'Editar publicación' : 'Nueva publicación'}</h1>
      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onFile} />

      <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Título" className="w-full border rounded-lg px-4 py-3 text-lg font-semibold outline-none focus:border-cyan-500" />
      <textarea value={body} onChange={e => setBody(e.target.value)} placeholder="Contenido…" className="w-full border rounded-lg px-4 py-3 h-40 outline-none focus:border-cyan-500" />

      {/* Media */}
      <div className="space-y-2">
        <div className="flex gap-2 flex-wrap">
          <button onClick={() => pickFile('image')} disabled={uploading} className="px-3 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-sm inline-flex items-center gap-1.5 disabled:opacity-60">{uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ImageIcon className="w-4 h-4" />} Imagen</button>
          <button onClick={addVideo} className="px-3 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-sm inline-flex items-center gap-1.5"><Video className="w-4 h-4" /> Video</button>
          <button onClick={() => pickFile('gif')} disabled={uploading} className="px-3 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-sm inline-flex items-center gap-1.5 disabled:opacity-60"><Film className="w-4 h-4" /> GIF</button>
        </div>
        {media.length > 0 && (
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
            {media.map((m, i) => (
              <div key={i} className="relative group border rounded-lg overflow-hidden aspect-square bg-gray-100">
                {m.mediaType === 'video' ? <div className="w-full h-full flex items-center justify-center text-gray-400"><Video className="w-6 h-6" /></div> : <img src={m.url} alt="" className="w-full h-full object-cover" />}
                <button onClick={() => setMedia(media.filter((_, j) => j !== i))} className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-0.5"><X className="w-3 h-3" /></button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Category */}
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">Categoría</label>
        <div className="flex gap-2 flex-wrap">
          {CATS.map(c => <button key={c.v} onClick={() => setCategory(c.v)} className={`px-3 py-1.5 rounded-full text-sm ${category === c.v ? 'bg-cyan-600 text-white' : 'bg-gray-100 text-gray-700'}`}>{c.l}</button>)}
        </div>
      </div>

      {/* Ads */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-xs font-medium text-gray-600">Productos adjuntos (anuncios)</label>
          <button onClick={() => setShowProducts(true)} className="text-sm text-cyan-700 inline-flex items-center gap-1"><ShoppingBag className="w-4 h-4" /> Adjuntar productos</button>
        </div>
        {ads.length > 0 && (
          <div className="grid sm:grid-cols-2 gap-2">
            {ads.map(a => (
              <div key={a.productId} className="flex items-center gap-2 border rounded-lg p-2">
                <div className="w-10 h-10 rounded bg-gray-100 overflow-hidden shrink-0">{a.imageUrl && <img src={a.imageUrl} alt="" className="w-full h-full object-cover" />}</div>
                <div className="flex-1 min-w-0"><p className="text-sm truncate">{a.name}</p><p className="text-xs text-gray-400">{a.storeName} · {formatCOP(Number(a.salePrice))}</p></div>
                <button onClick={() => setAds(ads.filter(x => x.productId !== a.productId))} className="text-red-500"><X className="w-4 h-4" /></button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex items-center gap-2 pt-2">
        <button onClick={() => guardar('published')} disabled={saving} className="px-5 py-2.5 rounded-lg bg-cyan-600 text-white font-medium inline-flex items-center gap-2 disabled:opacity-60">{saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Publicar</button>
        <button onClick={() => guardar('draft')} disabled={saving} className="px-5 py-2.5 rounded-lg bg-gray-100 text-gray-700 font-medium">Guardar borrador</button>
        <button onClick={onDone} className="ml-auto px-4 py-2.5 text-gray-500">Cancelar</button>
      </div>

      {showProducts && <ProductPicker selected={ads} onClose={() => setShowProducts(false)} onChange={setAds} />}
    </div>
  )
}

// ── Selector de productos públicos ────────────────────────────────────────────
function ProductPicker({ selected, onClose, onChange }: { selected: AdItem[]; onClose: () => void; onChange: (ads: AdItem[]) => void }) {
  const [q, setQ] = useState('')
  const [items, setItems] = useState<PublicProductLite[]>([])
  const [loading, setLoading] = useState(false)
  const sel = new Set(selected.map(a => a.productId))

  const search = useCallback(async (term: string) => {
    setLoading(true)
    try { setItems(await communityApi.searchProducts(term)) } catch { setItems([]) } finally { setLoading(false) }
  }, [])
  useEffect(() => { const t = setTimeout(() => search(q), 350); return () => clearTimeout(t) }, [q, search])

  const toggle = (p: PublicProductLite) => {
    if (sel.has(p.id)) onChange(selected.filter(a => a.productId !== p.id))
    else onChange([...selected, { productId: p.id, tenantId: p.tenantId, name: p.name, imageUrl: p.imageUrl, salePrice: p.salePrice, storeName: p.storeName }])
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="font-bold">Adjuntar productos de tiendas públicas</h3>
          <button onClick={onClose} className="p-1 rounded hover:bg-gray-100"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-4 border-b">
          <div className="relative"><Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input autoFocus value={q} onChange={e => setQ(e.target.value)} placeholder="Buscar producto…" className="w-full pl-9 pr-3 py-2 border rounded-lg outline-none focus:border-cyan-500" /></div>
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          {loading ? <Loader2 className="w-6 h-6 animate-spin text-cyan-600 mx-auto" /> :
            items.length === 0 ? <p className="text-center text-gray-400 py-8">Sin resultados.</p> :
            <div className="grid sm:grid-cols-2 gap-2">
              {items.map(p => {
                const on = sel.has(p.id)
                return (
                  <button key={p.id} onClick={() => toggle(p)} className={`flex items-center gap-2 border rounded-lg p-2 text-left ${on ? 'border-cyan-500 bg-cyan-50' : 'hover:bg-gray-50'}`}>
                    <div className="w-12 h-12 rounded bg-gray-100 overflow-hidden shrink-0">{p.imageUrl && <img src={p.imageUrl} alt="" className="w-full h-full object-cover" />}</div>
                    <div className="flex-1 min-w-0"><p className="text-sm font-medium truncate">{p.name}</p><p className="text-xs text-gray-400 truncate">{p.storeName} · {formatCOP(Number(p.salePrice))}</p></div>
                    {on && <span className="text-cyan-600 text-xs font-semibold">✓</span>}
                  </button>
                )
              })}
            </div>}
        </div>
        <div className="p-4 border-t flex justify-end"><button onClick={onClose} className="px-4 py-2 rounded-lg bg-cyan-600 text-white">Listo ({selected.length})</button></div>
      </div>
    </div>
  )
}

// ── Moderación de comentarios ─────────────────────────────────────────────────
function CommentsModeration() {
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const load = useCallback(async () => { setLoading(true); try { setItems(await communityApi.myComments()) } catch { /* */ } finally { setLoading(false) } }, [])
  useEffect(() => { load() }, [load])
  const ocultar = async (id: string) => { try { await communityApi.moderateComment(id); setItems(items.filter(c => c.id !== id)) } catch (e: any) { toast.error(e.message) } }

  if (loading) return <Loader2 className="w-6 h-6 animate-spin text-cyan-600" />
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Comentarios</h1>
      {items.length === 0 ? <p className="text-gray-400 py-10 text-center">No hay comentarios.</p> :
        <div className="space-y-2">
          {items.map(c => (
            <div key={c.id} className="bg-white border rounded-xl p-3 flex items-start gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-sm"><span className="font-semibold">{c.user}</span> <span className="text-gray-400 text-xs">en “{c.postTitle}”</span></p>
                <p className="text-sm text-gray-700 mt-0.5">{c.body}</p>
              </div>
              <button onClick={() => ocultar(c.id)} className="text-red-500 p-1.5 rounded hover:bg-red-50" title="Ocultar"><Trash2 className="w-4 h-4" /></button>
            </div>
          ))}
        </div>}
    </div>
  )
}

// ── Estadísticas ──────────────────────────────────────────────────────────────
function Stats() {
  const [s, setS] = useState<any>(null)
  useEffect(() => { communityApi.adminStats().then(setS).catch(() => {}) }, [])
  const cards = [
    { label: 'Publicaciones', value: s?.published, sub: `${s?.posts ?? 0} en total` },
    { label: 'Me gusta', value: s?.likes },
    { label: 'Guardados', value: s?.saves },
    { label: 'Comentarios', value: s?.comments },
  ]
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Estadísticas</h1>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {cards.map(c => (
          <div key={c.label} className="bg-white border rounded-xl p-4">
            <p className="text-3xl font-extrabold text-gray-900">{c.value ?? '—'}</p>
            <p className="text-sm text-gray-500">{c.label}</p>
            {c.sub && <p className="text-xs text-gray-400 mt-0.5">{c.sub}</p>}
          </div>
        ))}
      </div>
    </div>
  )
}

export default CommunityAdmin
