'use client'

/**
 * ProfileEditor — Panel del comercio para el TEMA 3 (Perfil Público).
 * Edita datos fijos, agrega/edita/elimina secciones por tipo y las reordena
 * con drag & drop (HTML5) o botones ↑/↓. Publica/oculta el perfil.
 */
import React, { useEffect, useState, useCallback } from 'react'
import { api } from '@/lib/api'
import { toast } from 'sonner'
import {
  Loader2, Plus, Save, Trash2, Pencil, ChevronUp, ChevronDown, GripVertical,
  Eye, EyeOff, ExternalLink, Image as ImageIcon, Video, FileText, Images, Film, X,
} from 'lucide-react'
import { API_URL } from './types'
import type { ProfileData, ProfileSection, SectionType, ProfilePayload } from './types'
import { ProfileThemeThree } from './profile-theme-three'
import { CloudinaryUpload, getCloudinaryConfig } from '@/components/ui/cloudinary-upload'

async function req<T = any>(path: string, options: RequestInit = {}): Promise<T> {
  const token = api.getToken?.()
  const res = await fetch(`${API_URL}/profile${path}`, {
    ...options,
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}), ...(options.headers || {}) },
  })
  const body = await res.json().catch(() => ({}))
  if (!res.ok || body?.success === false) throw new Error(body?.error || 'Error')
  return (body?.data ?? body) as T
}

const SECTION_META: Record<SectionType, { label: string; icon: React.ReactNode; def: any }> = {
  image_text:  { label: 'Imagen + Texto', icon: <ImageIcon className="w-4 h-4" />, def: { imageUrl: '', text: '', layout: 'left' } },
  video:       { label: 'Video',          icon: <Video className="w-4 h-4" />,     def: { url: '', title: '' } },
  gif:         { label: 'GIF',            icon: <Film className="w-4 h-4" />,      def: { url: '', caption: '' } },
  description: { label: 'Descripción',    icon: <FileText className="w-4 h-4" />,  def: { title: '', body: '' } },
  gallery:     { label: 'Galería',        icon: <Images className="w-4 h-4" />,    def: { title: '', images: [] } },
}

export function ProfileEditor() {
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState<ProfileData | null>(null)
  const [sections, setSections] = useState<ProfileSection[]>([])
  const [tenant, setTenant] = useState<{ id: string; name: string; slug: string } | null>(null)
  const [savingProfile, setSavingProfile] = useState(false)
  const [editingSection, setEditingSection] = useState<ProfileSection | null>(null)
  const [addOpen, setAddOpen] = useState(false)
  const [preview, setPreview] = useState(false)
  const [dragIdx, setDragIdx] = useState<number | null>(null)

  const cargar = useCallback(async () => {
    setLoading(true)
    try {
      const data = await req<ProfilePayload>('/')
      setProfile(data.profile)
      setSections([...data.sections].sort((a, b) => a.orderIndex - b.orderIndex))
      setTenant(data.tenant)
    } catch (e: any) { toast.error(e.message || 'Error al cargar el perfil') }
    finally { setLoading(false) }
  }, [])
  useEffect(() => { cargar() }, [cargar])

  const setP = (k: keyof ProfileData, v: any) => setProfile(p => p ? { ...p, [k]: v } : p)

  const guardarPerfil = async () => {
    if (!profile) return
    setSavingProfile(true)
    try {
      const saved = await req<ProfileData>('/', { method: 'PUT', body: JSON.stringify(profile) })
      setProfile(prev => prev ? { ...prev, ...saved } : saved)
      toast.success('Perfil guardado')
    } catch (e: any) { toast.error(e.message || 'No se pudo guardar') }
    finally { setSavingProfile(false) }
  }

  const togglePublicar = async () => {
    if (!profile) return
    const next = !profile.isPublished
    try {
      const saved = await req<ProfileData>('/', { method: 'PUT', body: JSON.stringify({ ...profile, isPublished: next }) })
      setProfile(prev => prev ? { ...prev, ...saved } : saved)
      toast.success(next ? 'Perfil publicado' : 'Perfil oculto')
    } catch (e: any) { toast.error(e.message) }
  }

  const agregar = async (type: SectionType) => {
    setAddOpen(false)
    try {
      const s = await req<ProfileSection>('/sections', { method: 'POST', body: JSON.stringify({ sectionType: type, content: SECTION_META[type].def }) })
      setSections(prev => [...prev, s])
      setEditingSection(s)
    } catch (e: any) { toast.error(e.message) }
  }

  const eliminar = async (id: string) => {
    if (!confirm('¿Eliminar esta sección?')) return
    try { await req(`/sections/${id}`, { method: 'DELETE' }); setSections(prev => prev.filter(s => s.id !== id)) }
    catch (e: any) { toast.error(e.message) }
  }

  const guardarSeccion = async (s: ProfileSection) => {
    try {
      const saved = await req<ProfileSection>(`/sections/${s.id}`, { method: 'PUT', body: JSON.stringify({ content: s.content, isActive: s.isActive }) })
      setSections(prev => prev.map(x => x.id === s.id ? saved : x))
      setEditingSection(null)
      toast.success('Sección guardada')
    } catch (e: any) { toast.error(e.message) }
  }

  const persistOrder = async (arr: ProfileSection[]) => {
    try { await req('/sections/order', { method: 'PUT', body: JSON.stringify({ order: arr.map(s => s.id) }) }) }
    catch (e: any) { toast.error(e.message) }
  }

  const mover = (idx: number, dir: -1 | 1) => {
    const j = idx + dir
    if (j < 0 || j >= sections.length) return
    const arr = [...sections]
    ;[arr[idx], arr[j]] = [arr[j], arr[idx]]
    arr.forEach((s, i) => (s.orderIndex = i))
    setSections(arr); persistOrder(arr)
  }

  const onDrop = (idx: number) => {
    if (dragIdx === null || dragIdx === idx) { setDragIdx(null); return }
    const arr = [...sections]
    const [moved] = arr.splice(dragIdx, 1)
    arr.splice(idx, 0, moved)
    arr.forEach((s, i) => (s.orderIndex = i))
    setSections(arr); setDragIdx(null); persistOrder(arr)
  }

  if (loading) return <div className="p-10 flex justify-center"><Loader2 className="w-7 h-7 animate-spin text-emerald-600" /></div>
  if (!profile) return <div className="p-6 text-gray-500">No se pudo cargar el perfil.</div>

  if (preview && tenant) {
    return (
      <div>
        <div className="p-3 border-b bg-white flex items-center justify-between sticky top-0 z-10">
          <span className="text-sm font-medium">Vista previa</span>
          <button onClick={() => setPreview(false)} className="text-sm text-emerald-700 inline-flex items-center gap-1"><X className="w-4 h-4" /> Cerrar</button>
        </div>
        <ProfileThemeThree slug={tenant.slug} data={{ profile, sections, tenant }} />
      </div>
    )
  }

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">Perfil público</h1>
          <p className="text-gray-500 text-sm">Tu página tipo red social: {tenant && <code className="text-emerald-700">/p/{tenant.slug}</code>}</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setPreview(true)} className="px-3 py-2 rounded-lg text-sm bg-gray-100 hover:bg-gray-200 inline-flex items-center gap-1.5"><Eye className="w-4 h-4" /> Vista previa</button>
          {tenant && <a href={`/p/${tenant.slug}`} target="_blank" className="px-3 py-2 rounded-lg text-sm text-emerald-700 hover:bg-emerald-50 inline-flex items-center gap-1.5">Abrir <ExternalLink className="w-3.5 h-3.5" /></a>}
          <button onClick={togglePublicar} className={`px-3 py-2 rounded-lg text-sm font-medium inline-flex items-center gap-1.5 ${profile.isPublished ? 'bg-emerald-600 text-white' : 'bg-gray-200 text-gray-700'}`}>
            {profile.isPublished ? <><Eye className="w-4 h-4" /> Publicado</> : <><EyeOff className="w-4 h-4" /> Oculto</>}
          </button>
        </div>
      </div>

      {/* Datos fijos */}
      <div className="bg-white border rounded-xl p-5 space-y-4">
        <h2 className="font-semibold">Datos del perfil</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          <CloudinaryUpload label="Foto de portada" value={profile.coverUrl || ''} onChange={url => setP('coverUrl', url)} previewClassName="h-24 w-full object-cover rounded-lg border" />
          <CloudinaryUpload label="Foto de perfil" value={profile.profilePhotoUrl || ''} onChange={url => setP('profilePhotoUrl', url)} previewClassName="h-20 w-20 object-cover rounded-full border" />
        </div>
        <div className="grid sm:grid-cols-2 gap-3">
          <L label="Nombre mostrado"><input className="inp" value={profile.displayName || ''} onChange={e => setP('displayName', e.target.value)} /></L>
          <L label="Tagline / descripción corta"><input className="inp" value={profile.tagline || ''} onChange={e => setP('tagline', e.target.value)} /></L>
        </div>
        <L label="Acerca de"><textarea className="inp h-24" value={profile.aboutText || ''} onChange={e => setP('aboutText', e.target.value)} /></L>
        <div className="grid sm:grid-cols-3 gap-3">
          <L label="Instagram"><input className="inp" value={profile.instagram || ''} onChange={e => setP('instagram', e.target.value)} placeholder="@usuario" /></L>
          <L label="WhatsApp"><input className="inp" value={profile.whatsapp || ''} onChange={e => setP('whatsapp', e.target.value)} placeholder="573001234567" /></L>
          <L label="Sitio web"><input className="inp" value={profile.website || ''} onChange={e => setP('website', e.target.value)} placeholder="midominio.com" /></L>
        </div>
        <div className="flex items-center gap-3">
          <L label="Color de acento"><input type="color" value={profile.accentColor || '#10b981'} onChange={e => setP('accentColor', e.target.value)} className="h-9 w-16 rounded border" /></L>
          <button onClick={guardarPerfil} disabled={savingProfile} className="ml-auto px-4 py-2 rounded-lg bg-emerald-600 text-white font-medium inline-flex items-center gap-2 disabled:opacity-60">
            {savingProfile ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Guardar datos
          </button>
        </div>
      </div>

      {/* Secciones */}
      <div className="bg-white border rounded-xl p-5 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">Secciones</h2>
          <div className="relative">
            <button onClick={() => setAddOpen(o => !o)} className="px-3 py-2 rounded-lg bg-emerald-600 text-white text-sm inline-flex items-center gap-1.5"><Plus className="w-4 h-4" /> Agregar sección</button>
            {addOpen && (
              <div className="absolute right-0 mt-1 w-52 bg-white border rounded-lg shadow-lg z-10 overflow-hidden">
                {(Object.keys(SECTION_META) as SectionType[]).map(t => (
                  <button key={t} onClick={() => agregar(t)} className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 inline-flex items-center gap-2">
                    {SECTION_META[t].icon} {SECTION_META[t].label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {sections.length === 0 ? (
          <p className="text-gray-500 text-sm py-6 text-center">Sin secciones. Agrega la primera con el botón de arriba.</p>
        ) : (
          <div className="space-y-2">
            {sections.map((s, idx) => (
              <div
                key={s.id}
                draggable
                onDragStart={() => setDragIdx(idx)}
                onDragOver={e => e.preventDefault()}
                onDrop={() => onDrop(idx)}
                className={`flex items-center gap-3 border rounded-lg p-3 bg-white ${dragIdx === idx ? 'opacity-50' : ''}`}
              >
                <GripVertical className="w-4 h-4 text-gray-300 cursor-grab shrink-0" />
                <span className="shrink-0 text-gray-500">{SECTION_META[s.sectionType].icon}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{SECTION_META[s.sectionType].label}</p>
                  <p className="text-xs text-gray-400 truncate">{sectionSummary(s)}</p>
                </div>
                <div className="flex items-center gap-0.5 shrink-0">
                  <button onClick={() => mover(idx, -1)} disabled={idx === 0} className="p-1.5 rounded hover:bg-gray-100 disabled:opacity-30"><ChevronUp className="w-4 h-4" /></button>
                  <button onClick={() => mover(idx, 1)} disabled={idx === sections.length - 1} className="p-1.5 rounded hover:bg-gray-100 disabled:opacity-30"><ChevronDown className="w-4 h-4" /></button>
                  <button onClick={() => setEditingSection(s)} className="p-1.5 rounded hover:bg-gray-100"><Pencil className="w-4 h-4" /></button>
                  <button onClick={() => eliminar(s.id)} className="p-1.5 rounded hover:bg-red-50 text-red-500"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {editingSection && (
        <SectionEditModal section={editingSection} onClose={() => setEditingSection(null)} onSave={guardarSeccion} />
      )}

      <style jsx>{`.inp{width:100%;border:1px solid #e5e7eb;border-radius:.5rem;padding:.5rem .75rem;font-size:.875rem;outline:none}.inp:focus{border-color:#10b981}`}</style>
    </div>
  )
}

function sectionSummary(s: ProfileSection): string {
  const c = s.content || {}
  if (s.sectionType === 'image_text') return c.text || c.imageUrl || '—'
  if (s.sectionType === 'video') return c.title || c.url || '—'
  if (s.sectionType === 'gif') return c.caption || c.url || '—'
  if (s.sectionType === 'description') return c.title || c.body || '—'
  if (s.sectionType === 'gallery') return `${(c.images || []).length} imágenes`
  return '—'
}

function L({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block"><span className="block text-xs font-medium text-gray-600 mb-1">{label}</span>{children}</label>
}

function SectionEditModal({ section, onClose, onSave }: { section: ProfileSection; onClose: () => void; onSave: (s: ProfileSection) => void }) {
  const [c, setC] = useState<any>({ ...section.content })
  const set = (k: string, v: any) => setC((p: any) => ({ ...p, [k]: v }))
  const t = section.sectionType

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b sticky top-0 bg-white">
          <h3 className="font-bold inline-flex items-center gap-2">{SECTION_META[t].icon} {SECTION_META[t].label}</h3>
          <button onClick={onClose} className="p-1 rounded hover:bg-gray-100"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-4 space-y-3">
          {t === 'image_text' && (<>
            <Field label="Imagen"><CloudinaryUpload value={c.imageUrl || ''} onChange={url => set('imageUrl', url)} previewClassName="h-24 w-full object-cover rounded-lg border" /></Field>
            <Field label="Texto"><textarea className="inp2 h-28" value={c.text || ''} onChange={e => set('text', e.target.value)} /></Field>
            <Field label="Posición de imagen">
              <select className="inp2" value={c.layout || 'left'} onChange={e => set('layout', e.target.value)}>
                <option value="left">Izquierda</option><option value="right">Derecha</option>
              </select>
            </Field>
          </>)}
          {t === 'video' && (<>
            <Field label="URL (YouTube o video)"><input className="inp2" value={c.url || ''} onChange={e => set('url', e.target.value)} /></Field>
            <Field label="Título"><input className="inp2" value={c.title || ''} onChange={e => set('title', e.target.value)} /></Field>
          </>)}
          {t === 'gif' && (<>
            <Field label="GIF"><CloudinaryUpload value={c.url || ''} onChange={url => set('url', url)} accept="image/gif,image/*" previewClassName="h-24 w-auto rounded-lg border" /></Field>
            <Field label="Leyenda"><input className="inp2" value={c.caption || ''} onChange={e => set('caption', e.target.value)} /></Field>
          </>)}
          {t === 'description' && (<>
            <Field label="Título"><input className="inp2" value={c.title || ''} onChange={e => set('title', e.target.value)} /></Field>
            <Field label="Cuerpo"><textarea className="inp2 h-32" value={c.body || ''} onChange={e => set('body', e.target.value)} /></Field>
          </>)}
          {t === 'gallery' && (<>
            <Field label="Título"><input className="inp2" value={c.title || ''} onChange={e => set('title', e.target.value)} /></Field>
            <GalleryEditor images={c.images || []} onChange={imgs => set('images', imgs)} />
          </>)}
        </div>
        <div className="p-4 border-t flex justify-end gap-2 sticky bottom-0 bg-white">
          <button onClick={onClose} className="px-4 py-2 rounded-lg text-gray-600 hover:bg-gray-100">Cancelar</button>
          <button onClick={() => onSave({ ...section, content: c })} className="px-4 py-2 rounded-lg bg-emerald-600 text-white font-medium inline-flex items-center gap-2"><Save className="w-4 h-4" /> Guardar</button>
        </div>
      </div>
      <style jsx>{`.inp2{width:100%;border:1px solid #e5e7eb;border-radius:.5rem;padding:.5rem .75rem;font-size:.875rem;outline:none}.inp2:focus{border-color:#10b981}`}</style>
    </div>
  )
}

function GalleryEditor({ images, onChange }: { images: string[]; onChange: (imgs: string[]) => void }) {
  const [url, setUrl] = useState('')
  const [uploading, setUploading] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const fileRef = React.useRef<HTMLInputElement>(null)

  const subir = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setErr(null); setUploading(true)
    try {
      const { cloudName, uploadPreset } = await getCloudinaryConfig()
      if (!cloudName || !uploadPreset) throw new Error('Cloudinary no configurado (Integraciones)')
      const fd = new FormData()
      fd.append('file', file); fd.append('upload_preset', uploadPreset)
      const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, { method: 'POST', body: fd })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error?.message || 'Error al subir')
      onChange([...images, data.secure_url])
    } catch (e: any) { setErr(e.message) }
    finally { setUploading(false); if (fileRef.current) fileRef.current.value = '' }
  }

  return (
    <div className="space-y-2">
      <span className="block text-xs font-medium text-gray-600">Imágenes</span>
      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={subir} />
      <div className="flex gap-2">
        <button type="button" onClick={() => fileRef.current?.click()} disabled={uploading}
          className="px-3 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-sm inline-flex items-center gap-1.5 disabled:opacity-60">
          {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />} Subir imagen
        </button>
        <input className="inp2 flex-1" value={url} onChange={e => setUrl(e.target.value)} placeholder="o pega una URL" />
        <button type="button" onClick={() => { if (url.trim()) { onChange([...images, url.trim()]); setUrl('') } }}
          className="px-3 rounded-lg bg-emerald-600 text-white">Agregar</button>
      </div>
      {err && <p className="text-xs text-red-500">{err}</p>}
      <div className="grid grid-cols-3 gap-2">
        {images.map((src, i) => (
          <div key={i} className="relative group">
            <img src={src} alt="" className="w-full aspect-square object-cover rounded-lg" />
            <button onClick={() => onChange(images.filter((_, j) => j !== i))} className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-0.5"><X className="w-3 h-3" /></button>
          </div>
        ))}
      </div>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block"><span className="block text-xs font-medium text-gray-600 mb-1">{label}</span>{children}</label>
}

export default ProfileEditor
