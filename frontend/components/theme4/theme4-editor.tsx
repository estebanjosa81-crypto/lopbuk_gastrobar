'use client'

/**
 * Theme4Editor — panel del comercio para el Tema 4 (Servicios Profesionales).
 * Config general (tipo, hero, contacto, secciones activables) + gestores CRUD
 * de cada sección. Las secciones especializadas dependen del tipo de negocio.
 */
import React, { useEffect, useState, useCallback } from 'react'
import { toast } from 'sonner'
import {
  Loader2, Plus, Save, Trash2, Pencil, X, Eye, ExternalLink,
  Settings, Image as ImageIcon, BarChart3, Wrench, Bus, Code, Footprints, Users, Star, Phone,
} from 'lucide-react'
import { CloudinaryUpload } from '@/components/ui/cloudinary-upload'
import { theme4Api, type Theme4Config } from './types'

// ── Esquemas de formulario por entidad ─────────────────────────────────────────
type FieldType = 'text' | 'textarea' | 'number' | 'image' | 'list' | 'select' | 'checkbox'
interface FieldDef { key: string; label: string; type: FieldType; options?: { v: string; l: string }[] }

const SCHEMAS: Record<string, { label: string; icon: React.ElementType; fields: FieldDef[] }> = {
  services: { label: 'Servicios', icon: Wrench, fields: [
    { key: 'icon', label: 'Icono (truck, code, zap, shield, clock, users, award, rocket, star)', type: 'text' },
    { key: 'title', label: 'Título', type: 'text' }, { key: 'description', label: 'Descripción', type: 'textarea' },
    { key: 'priceLabel', label: 'Precio (texto)', type: 'text' }, { key: 'isFeatured', label: 'Destacado', type: 'checkbox' },
    { key: 'orderIndex', label: 'Orden', type: 'number' },
  ] },
  stats: { label: 'Stats', icon: BarChart3, fields: [
    { key: 'icon', label: 'Icono', type: 'text' }, { key: 'value', label: 'Valor (ej. 12)', type: 'text' },
    { key: 'label', label: 'Etiqueta (ej. Vehículos)', type: 'text' }, { key: 'orderIndex', label: 'Orden', type: 'number' },
  ] },
  steps: { label: 'Proceso', icon: Footprints, fields: [
    { key: 'stepNumber', label: 'Número', type: 'number' }, { key: 'title', label: 'Título', type: 'text' },
    { key: 'description', label: 'Descripción', type: 'textarea' },
  ] },
  team: { label: 'Equipo', icon: Users, fields: [
    { key: 'name', label: 'Nombre', type: 'text' }, { key: 'role', label: 'Cargo', type: 'text' },
    { key: 'photoUrl', label: 'Foto', type: 'image' }, { key: 'bio', label: 'Bio', type: 'textarea' },
    { key: 'linkedinUrl', label: 'LinkedIn', type: 'text' }, { key: 'orderIndex', label: 'Orden', type: 'number' },
  ] },
  testimonials: { label: 'Testimonios', icon: Star, fields: [
    { key: 'author', label: 'Autor', type: 'text' }, { key: 'role', label: 'Cargo/Empresa', type: 'text' },
    { key: 'avatarUrl', label: 'Avatar', type: 'image' }, { key: 'rating', label: 'Rating (1-5)', type: 'number' },
    { key: 'text', label: 'Texto', type: 'textarea' }, { key: 'orderIndex', label: 'Orden', type: 'number' },
  ] },
  fleet: { label: 'Flota', icon: Bus, fields: [
    { key: 'name', label: 'Nombre', type: 'text' },
    { key: 'vehicleType', label: 'Tipo', type: 'select', options: [{ v: 'bus', l: 'Bus' }, { v: 'van', l: 'Van' }, { v: 'car', l: 'Auto' }, { v: 'other', l: 'Otro' }] },
    { key: 'capacity', label: 'Capacidad', type: 'number' }, { key: 'photoUrl', label: 'Foto', type: 'image' },
    { key: 'features', label: 'Características (coma)', type: 'list' }, { key: 'orderIndex', label: 'Orden', type: 'number' },
  ] },
  routes: { label: 'Rutas', icon: Bus, fields: [
    { key: 'origin', label: 'Origen', type: 'text' }, { key: 'destination', label: 'Destino', type: 'text' },
    { key: 'stops', label: 'Paradas (coma)', type: 'list' }, { key: 'departureTime', label: 'Salida', type: 'text' },
    { key: 'arrivalTime', label: 'Llegada', type: 'text' }, { key: 'price', label: 'Precio', type: 'number' },
    { key: 'bookingUrl', label: 'Link de reserva', type: 'text' }, { key: 'orderIndex', label: 'Orden', type: 'number' },
  ] },
  projects: { label: 'Proyectos', icon: Code, fields: [
    { key: 'title', label: 'Título', type: 'text' }, { key: 'category', label: 'Categoría', type: 'text' },
    { key: 'description', label: 'Descripción', type: 'textarea' }, { key: 'screenshotUrls', label: 'Screenshots (URLs, coma)', type: 'list' },
    { key: 'techStack', label: 'Stack (coma)', type: 'list' }, { key: 'liveUrl', label: 'Live demo', type: 'text' },
    { key: 'caseStudyUrl', label: 'Caso de estudio', type: 'text' }, { key: 'isFeatured', label: 'Destacado', type: 'checkbox' },
    { key: 'orderIndex', label: 'Orden', type: 'number' },
  ] },
}

export function Theme4Editor() {
  const [loading, setLoading] = useState(true)
  const [config, setConfig] = useState<Theme4Config | null>(null)
  const [data, setData] = useState<Record<string, any[]>>({})
  const [tab, setTab] = useState('config')
  const [slug, setSlug] = useState<string>('')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const d = await theme4Api.getMine()
      setConfig(d.config as Theme4Config)
      setData({ services: d.services, stats: d.stats, steps: d.steps, team: d.team, testimonials: d.testimonials, fleet: d.fleet, routes: d.routes, projects: d.projects })
    } catch (e: any) { toast.error(e.message || 'Error al cargar') }
    finally { setLoading(false) }
  }, [])
  useEffect(() => { load() }, [load])

  if (loading || !config) return <div className="p-10 flex justify-center"><Loader2 className="w-7 h-7 animate-spin text-sky-600" /></div>

  const isTransport = config.businessType === 'transport'
  const isSoftware = config.businessType === 'software'

  const tabs = [
    { id: 'config', label: 'Config', icon: Settings },
    { id: 'services', label: 'Servicios', icon: Wrench },
    { id: 'stats', label: 'Stats', icon: BarChart3 },
    ...(isTransport ? [{ id: 'routes', label: 'Rutas', icon: Bus }, { id: 'fleet', label: 'Flota', icon: Bus }] : []),
    ...(isSoftware ? [{ id: 'projects', label: 'Proyectos', icon: Code }] : []),
    { id: 'steps', label: 'Proceso', icon: Footprints },
    { id: 'team', label: 'Equipo', icon: Users },
    { id: 'testimonials', label: 'Testimonios', icon: Star },
  ]

  return (
    <div className="p-5 md:p-8 max-w-4xl mx-auto space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-2xl font-bold">Tema 4 · Servicios Profesionales</h1>
          <p className="text-sm text-gray-500">Página pública adaptable para empresas de servicios.</p>
        </div>
        <a href="/panel/configuracion" className="text-xs text-gray-400">Activa el Tema 4 en Configuración → Tema de la tienda</a>
      </div>

      <div className="flex gap-1.5 overflow-x-auto pb-1 border-b">
        {tabs.map(t => {
          const I = t.icon
          return <button key={t.id} onClick={() => setTab(t.id)} className={`px-3 py-2 text-sm font-medium rounded-t-lg whitespace-nowrap inline-flex items-center gap-1.5 ${tab === t.id ? 'bg-sky-50 text-sky-700 border-b-2 border-sky-600' : 'text-gray-500'}`}><I className="w-4 h-4" />{t.label}</button>
        })}
      </div>

      {tab === 'config' ? <ConfigEditor config={config} onSaved={c => setConfig(c)} /> :
        <EntityManager entity={tab} schema={SCHEMAS[tab]} items={data[tab] || []} onChange={items => setData(d => ({ ...d, [tab]: items }))} />}
    </div>
  )
}

// ── Editor de configuración ─────────────────────────────────────────────────────
function ConfigEditor({ config, onSaved }: { config: Theme4Config; onSaved: (c: Theme4Config) => void }) {
  const [c, setC] = useState<Theme4Config>(config)
  const [saving, setSaving] = useState(false)
  const set = (k: keyof Theme4Config, v: any) => setC(p => ({ ...p, [k]: v }))

  const save = async () => {
    setSaving(true)
    try { const saved = await theme4Api.saveConfig(c); onSaved(saved); toast.success('Configuración guardada') }
    catch (e: any) { toast.error(e.message) } finally { setSaving(false) }
  }

  const toggles: { k: keyof Theme4Config; l: string }[] = [
    { k: 'showStats', l: 'Stats' }, { k: 'showServices', l: 'Servicios' }, { k: 'showProcess', l: 'Proceso' },
    { k: 'showTeam', l: 'Equipo' }, { k: 'showTestimonials', l: 'Testimonios' }, { k: 'showContact', l: 'Contacto' },
    { k: 'showCommunity', l: 'Barra comunidad' },
  ]

  return (
    <div className="space-y-5">
      <div className="bg-white border rounded-xl p-5 space-y-3">
        <h3 className="font-semibold">General</h3>
        <L label="Tipo de negocio">
          <select value={c.businessType} onChange={e => set('businessType', e.target.value)} className="inp">
            <option value="general">General</option><option value="transport">Transporte</option><option value="software">Software / Digital</option>
          </select>
        </L>
        <div className="grid sm:grid-cols-2 gap-3">
          <L label="Color de acento"><input type="color" value={c.accentColor || '#0ea5e9'} onChange={e => set('accentColor', e.target.value)} className="h-9 w-20 rounded border" /></L>
          <L label="Publicado"><label className="inline-flex items-center gap-2 text-sm"><input type="checkbox" checked={!!c.isPublished} onChange={e => set('isPublished', e.target.checked)} /> Visible en /t/(slug)</label></L>
        </div>
      </div>

      <div className="bg-white border rounded-xl p-5 space-y-3">
        <h3 className="font-semibold flex items-center gap-2"><ImageIcon className="w-4 h-4" /> Hero</h3>
        <div className="grid sm:grid-cols-2 gap-3">
          <L label="Título"><input className="inp" value={c.heroTitle || ''} onChange={e => set('heroTitle', e.target.value)} /></L>
          <L label="Subtítulo"><input className="inp" value={c.heroSubtitle || ''} onChange={e => set('heroSubtitle', e.target.value)} /></L>
        </div>
        <CloudinaryUpload label="Imagen de fondo del hero" value={c.heroImageUrl || ''} onChange={url => set('heroImageUrl', url)} previewClassName="h-24 w-full object-cover rounded-lg border" />
        <div className="grid sm:grid-cols-2 gap-3">
          <L label="Texto del botón (CTA)"><input className="inp" value={c.ctaLabel || ''} onChange={e => set('ctaLabel', e.target.value)} placeholder="Cotizar" /></L>
          <L label="Link del CTA (opcional)"><input className="inp" value={c.ctaUrl || ''} onChange={e => set('ctaUrl', e.target.value)} /></L>
        </div>
      </div>

      <div className="bg-white border rounded-xl p-5 space-y-3">
        <h3 className="font-semibold flex items-center gap-2"><Phone className="w-4 h-4" /> Contacto</h3>
        <div className="grid sm:grid-cols-3 gap-3">
          <L label="WhatsApp"><input className="inp" value={c.whatsapp || ''} onChange={e => set('whatsapp', e.target.value)} placeholder="573001234567" /></L>
          <L label="Email"><input className="inp" value={c.email || ''} onChange={e => set('email', e.target.value)} /></L>
          <L label="Teléfono"><input className="inp" value={c.phone || ''} onChange={e => set('phone', e.target.value)} /></L>
        </div>
        <L label="Dirección"><input className="inp" value={c.address || ''} onChange={e => set('address', e.target.value)} /></L>
        <L label="URL de mapa (embed de Google Maps, opcional)"><input className="inp" value={c.mapUrl || ''} onChange={e => set('mapUrl', e.target.value)} /></L>
      </div>

      <div className="bg-white border rounded-xl p-5 space-y-3">
        <h3 className="font-semibold">Secciones visibles</h3>
        <div className="flex flex-wrap gap-3">
          {toggles.map(t => (
            <label key={t.k} className="inline-flex items-center gap-2 text-sm border rounded-lg px-3 py-1.5">
              <input type="checkbox" checked={!!c[t.k]} onChange={e => set(t.k, e.target.checked)} /> {t.l}
            </label>
          ))}
        </div>
      </div>

      <button onClick={save} disabled={saving} className="px-5 py-2.5 rounded-lg bg-sky-600 text-white font-medium inline-flex items-center gap-2 disabled:opacity-60">
        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Guardar configuración
      </button>

      <style jsx>{`.inp{width:100%;border:1px solid #e5e7eb;border-radius:.5rem;padding:.5rem .75rem;font-size:.875rem;outline:none}.inp:focus{border-color:#0ea5e9}`}</style>
    </div>
  )
}
function L({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block"><span className="block text-xs font-medium text-gray-600 mb-1">{label}</span>{children}</label>
}

// ── Gestor genérico de entidades de lista ────────────────────────────────────
function EntityManager({ entity, schema, items, onChange }: { entity: string; schema: { label: string; fields: FieldDef[] }; items: any[]; onChange: (items: any[]) => void }) {
  const [editing, setEditing] = useState<any | null>(null)

  const save = async (form: any) => {
    try {
      if (form.id) { const r = await theme4Api.update(entity, form.id, form); onChange(items.map(i => i.id === form.id ? r : i)) }
      else { const r = await theme4Api.create(entity, form); onChange([...items, r]) }
      setEditing(null); toast.success('Guardado')
    } catch (e: any) { toast.error(e.message) }
  }
  const remove = async (id: string) => {
    if (!confirm('¿Eliminar?')) return
    try { await theme4Api.remove(entity, id); onChange(items.filter(i => i.id !== id)) } catch (e: any) { toast.error(e.message) }
  }

  const titleKey = schema.fields.find(f => ['title', 'name', 'origin', 'author', 'label', 'value'].includes(f.key))?.key || 'title'

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">{schema.label}</h3>
        <button onClick={() => setEditing({})} className="bg-sky-600 text-white px-4 py-2 rounded-lg text-sm inline-flex items-center gap-1.5"><Plus className="w-4 h-4" /> Agregar</button>
      </div>
      {items.length === 0 ? <p className="text-gray-400 text-sm py-8 text-center">Sin elementos.</p> :
        <div className="space-y-2">
          {items.map(it => (
            <div key={it.id} className="bg-white border rounded-xl p-3 flex items-center gap-3">
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{it[titleKey] || it.title || it.name || '—'}{entity === 'routes' && it.destination ? ` → ${it.destination}` : ''}</p>
                {!it.isActive && <span className="text-xs text-gray-400">(oculto)</span>}
              </div>
              <button onClick={() => setEditing(it)} className="p-2 rounded-lg hover:bg-gray-100 text-gray-600"><Pencil className="w-4 h-4" /></button>
              <button onClick={() => remove(it.id)} className="p-2 rounded-lg hover:bg-red-50 text-red-500"><Trash2 className="w-4 h-4" /></button>
            </div>
          ))}
        </div>}
      {editing && <EntityForm schema={schema} initial={editing} onClose={() => setEditing(null)} onSave={save} />}
    </div>
  )
}

function EntityForm({ schema, initial, onClose, onSave }: { schema: { label: string; fields: FieldDef[] }; initial: any; onClose: () => void; onSave: (f: any) => void }) {
  const [f, setF] = useState<any>(() => {
    const base: any = { ...initial }
    for (const fld of schema.fields) if (fld.type === 'list' && Array.isArray(base[fld.key])) base[fld.key] = base[fld.key].join(', ')
    return base
  })
  const set = (k: string, v: any) => setF((p: any) => ({ ...p, [k]: v }))

  const submit = () => {
    const out: any = { ...f }
    for (const fld of schema.fields) {
      if (fld.type === 'list') out[fld.key] = String(f[fld.key] || '').split(',').map(s => s.trim()).filter(Boolean)
      if (fld.type === 'number' && f[fld.key] !== undefined && f[fld.key] !== '') out[fld.key] = Number(f[fld.key])
    }
    onSave(out)
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b sticky top-0 bg-white"><h3 className="font-bold">{initial.id ? 'Editar' : 'Nuevo'} · {schema.label}</h3><button onClick={onClose}><X className="w-5 h-5" /></button></div>
        <div className="p-4 space-y-3">
          {schema.fields.map(fld => (
            <div key={fld.key}>
              <label className="block text-xs font-medium text-gray-600 mb-1">{fld.label}</label>
              {fld.type === 'textarea' ? <textarea className="inp2 h-20" value={f[fld.key] || ''} onChange={e => set(fld.key, e.target.value)} /> :
                fld.type === 'image' ? <CloudinaryUpload value={f[fld.key] || ''} onChange={url => set(fld.key, url)} previewClassName="h-20 w-20 object-cover rounded-lg border" /> :
                fld.type === 'checkbox' ? <label className="inline-flex items-center gap-2 text-sm"><input type="checkbox" checked={!!f[fld.key]} onChange={e => set(fld.key, e.target.checked)} /> Sí</label> :
                fld.type === 'select' ? <select className="inp2" value={f[fld.key] || ''} onChange={e => set(fld.key, e.target.value)}>{(fld.options || []).map(o => <option key={o.v} value={o.v}>{o.l}</option>)}</select> :
                <input type={fld.type === 'number' ? 'number' : 'text'} className="inp2" value={f[fld.key] ?? ''} onChange={e => set(fld.key, e.target.value)} />}
            </div>
          ))}
        </div>
        <div className="p-4 border-t flex justify-end gap-2 sticky bottom-0 bg-white">
          <button onClick={onClose} className="px-4 py-2 text-gray-600">Cancelar</button>
          <button onClick={submit} className="px-4 py-2 rounded-lg bg-sky-600 text-white font-medium inline-flex items-center gap-2"><Save className="w-4 h-4" /> Guardar</button>
        </div>
      </div>
      <style jsx>{`.inp2{width:100%;border:1px solid #e5e7eb;border-radius:.5rem;padding:.5rem .75rem;font-size:.875rem;outline:none}.inp2:focus{border-color:#0ea5e9}`}</style>
    </div>
  )
}

export default Theme4Editor
