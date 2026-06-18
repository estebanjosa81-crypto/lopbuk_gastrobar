'use client'

import { useEffect, useState, useCallback } from 'react'
import { api } from '@/lib/api'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import {
  Home, Users, TrendingUp, Calendar, FileText, Plus, Edit2, Trash2,
  X, Check, Search, Building2, Eye, EyeOff, Star, Phone, Mail,
  MapPin, ChevronRight, RefreshCw, AlertCircle, Wrench,
  DollarSign, ArrowRight,
} from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────

type Tab = 'dashboard' | 'properties' | 'owners' | 'crm' | 'visits' | 'contracts' | 'maintenances'

const COP = (n: number) =>
  new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n)

const TYPE_LABELS: Record<string, string> = {
  casa: 'Casa', apartamento: 'Apartamento', local: 'Local',
  oficina: 'Oficina', bodega: 'Bodega', lote: 'Lote',
  finca: 'Finca', consultorio: 'Consultorio', hotel: 'Hotel', proyecto: 'Proyecto',
}

const STAGE_COLORS: Record<string, string> = {
  nuevo:        'bg-gray-100 text-gray-700',
  contactado:   'bg-blue-100 text-blue-700',
  interesado:   'bg-indigo-100 text-indigo-700',
  visita:       'bg-purple-100 text-purple-700',
  negociacion:  'bg-amber-100 text-amber-700',
  cierre:       'bg-green-100 text-green-700',
  posventa:     'bg-emerald-100 text-emerald-700',
  perdido:      'bg-red-100 text-red-700',
}

const STAGES = ['nuevo','contactado','interesado','visita','negociacion','cierre','posventa','perdido']

const PROP_STATUS_COLORS: Record<string, string> = {
  disponible:      'bg-green-100 text-green-700',
  vendido:         'bg-gray-100 text-gray-700',
  arrendado:       'bg-blue-100 text-blue-700',
  reservado:       'bg-amber-100 text-amber-700',
  en_negociacion:  'bg-purple-100 text-purple-700',
  en_mantenimiento:'bg-orange-100 text-orange-700',
  inactivo:        'bg-red-100 text-red-700',
}

const FEATURES = [
  'piscina','ascensor','vigilancia','terraza','patio','balcon',
  'aire_acondicionado','parqueadero','bodega','amoblado','mascotas',
  'gym','sauna','salon_comunal','cancha','porteria',
]
const FEATURE_LABELS: Record<string, string> = {
  piscina: 'Piscina', ascensor: 'Ascensor', vigilancia: 'Vigilancia',
  terraza: 'Terraza', patio: 'Patio', balcon: 'Balcón',
  aire_acondicionado: 'A/C', parqueadero: 'Parqueadero', bodega: 'Bodega',
  amoblado: 'Amoblado', mascotas: 'Mascotas OK', gym: 'Gimnasio',
  sauna: 'Sauna', salon_comunal: 'Salón comunal', cancha: 'Cancha',
  porteria: 'Portería',
}

// ─── Property Form ────────────────────────────────────────────────────────────

const EMPTY_PROP = {
  code: '', title: '', description: '',
  property_type: 'apartamento', operation_type: 'venta',
  status: 'disponible', price: '', admin_fee: '',
  address: '', city: '', neighborhood: '', state_province: '',
  stratum: '', area_m2: '', built_area_m2: '',
  bedrooms: '0', bathrooms: '0', garages: '0', floors: '1', age_years: '',
  owner_id: '', assigned_agent_id: '',
  cover_image_url: '', seo_slug: '',
  features: [] as string[],
  is_featured: false, is_published: false,
}

function PropertyForm({
  initial, owners, onSave, onCancel,
}: {
  initial?: any; owners: any[];
  onSave: (data: any) => Promise<void>; onCancel: () => void;
}) {
  const [form, setForm] = useState<typeof EMPTY_PROP>({ ...EMPTY_PROP, ...initial })
  const [loading, setLoading] = useState(false)

  const set = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }))
  const toggleFeature = (f: string) => {
    setForm(prev => ({
      ...prev,
      features: prev.features.includes(f)
        ? prev.features.filter(x => x !== f)
        : [...prev.features, f],
    }))
  }

  const submit = async () => {
    if (!form.code || !form.title || !form.price) {
      toast.error('Código, título y precio son requeridos')
      return
    }
    setLoading(true)
    try {
      await onSave({
        ...form,
        price: Number(form.price),
        admin_fee: form.admin_fee ? Number(form.admin_fee) : undefined,
        stratum: form.stratum ? Number(form.stratum) : undefined,
        area_m2: form.area_m2 ? Number(form.area_m2) : undefined,
        built_area_m2: form.built_area_m2 ? Number(form.built_area_m2) : undefined,
        bedrooms: Number(form.bedrooms),
        bathrooms: Number(form.bathrooms),
        garages: Number(form.garages),
        floors: Number(form.floors),
        age_years: form.age_years ? Number(form.age_years) : undefined,
        owner_id: form.owner_id || undefined,
      })
    } finally { setLoading(false) }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={onCancel}>
      <div
        className="bg-white w-full sm:max-w-2xl sm:rounded-2xl max-h-[95svh] overflow-y-auto p-5"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold">{initial?.id ? 'Editar inmueble' : 'Nuevo inmueble'}</h3>
          <button onClick={onCancel}><X className="w-5 h-5 text-gray-500" /></button>
        </div>

        <div className="space-y-4">
          {/* Basic */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-500 block mb-1">Código *</label>
              <input className="input" value={form.code} onChange={e => set('code', e.target.value)} placeholder="AP-001" />
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1">Tipo</label>
              <select className="input" value={form.property_type} onChange={e => set('property_type', e.target.value)}>
                {Object.entries(TYPE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs text-gray-500 block mb-1">Título *</label>
            <input className="input" value={form.title} onChange={e => set('title', e.target.value)} placeholder="Apartamento 2 habitaciones en el centro" />
          </div>

          <div>
            <label className="text-xs text-gray-500 block mb-1">Descripción</label>
            <textarea className="input min-h-[80px]" value={form.description} onChange={e => set('description', e.target.value)} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-500 block mb-1">Operación</label>
              <select className="input" value={form.operation_type} onChange={e => set('operation_type', e.target.value)}>
                <option value="venta">Venta</option>
                <option value="arriendo">Arriendo</option>
                <option value="venta_arriendo">Venta / Arriendo</option>
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1">Estado</label>
              <select className="input" value={form.status} onChange={e => set('status', e.target.value)}>
                {Object.keys(PROP_STATUS_COLORS).map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-500 block mb-1">Precio *</label>
              <input type="number" className="input" value={form.price} onChange={e => set('price', e.target.value)} placeholder="350000000" />
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1">Cuota adm.</label>
              <input type="number" className="input" value={form.admin_fee} onChange={e => set('admin_fee', e.target.value)} placeholder="180000" />
            </div>
          </div>

          {/* Location */}
          <h4 className="font-semibold text-sm text-gray-700 pt-2 border-t">Ubicación</h4>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-500 block mb-1">Ciudad</label>
              <input className="input" value={form.city} onChange={e => set('city', e.target.value)} />
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1">Barrio</label>
              <input className="input" value={form.neighborhood} onChange={e => set('neighborhood', e.target.value)} />
            </div>
          </div>
          <div>
            <label className="text-xs text-gray-500 block mb-1">Dirección</label>
            <input className="input" value={form.address} onChange={e => set('address', e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-500 block mb-1">Departamento</label>
              <input className="input" value={form.state_province} onChange={e => set('state_province', e.target.value)} />
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1">Estrato</label>
              <select className="input" value={form.stratum} onChange={e => set('stratum', e.target.value)}>
                <option value="">—</option>
                {[1,2,3,4,5,6].map(n => <option key={n} value={n}>{n}</option>)}
              </select>
            </div>
          </div>

          {/* Specs */}
          <h4 className="font-semibold text-sm text-gray-700 pt-2 border-t">Especificaciones</h4>
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Área total m²', key: 'area_m2' },
              { label: 'Área const. m²', key: 'built_area_m2' },
              { label: 'Antigüedad años', key: 'age_years' },
            ].map(f => (
              <div key={f.key}>
                <label className="text-xs text-gray-500 block mb-1">{f.label}</label>
                <input type="number" className="input" value={(form as any)[f.key]} onChange={e => set(f.key, e.target.value)} />
              </div>
            ))}
          </div>
          <div className="grid grid-cols-4 gap-3">
            {[
              { label: 'Habitaciones', key: 'bedrooms' },
              { label: 'Baños', key: 'bathrooms' },
              { label: 'Garajes', key: 'garages' },
              { label: 'Pisos', key: 'floors' },
            ].map(f => (
              <div key={f.key}>
                <label className="text-xs text-gray-500 block mb-1">{f.label}</label>
                <input type="number" min="0" className="input" value={(form as any)[f.key]} onChange={e => set(f.key, e.target.value)} />
              </div>
            ))}
          </div>

          {/* Features */}
          <h4 className="font-semibold text-sm text-gray-700 pt-2 border-t">Características</h4>
          <div className="flex flex-wrap gap-2">
            {FEATURES.map(f => (
              <button
                key={f} type="button"
                onClick={() => toggleFeature(f)}
                className={cn(
                  'text-xs px-2.5 py-1 rounded-full border transition-colors',
                  form.features.includes(f)
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-gray-600 border-gray-300 hover:border-blue-400'
                )}
              >
                {FEATURE_LABELS[f]}
              </button>
            ))}
          </div>

          {/* Owner + media */}
          <h4 className="font-semibold text-sm text-gray-700 pt-2 border-t">Propietario y publicación</h4>
          <div>
            <label className="text-xs text-gray-500 block mb-1">Propietario</label>
            <select className="input" value={form.owner_id} onChange={e => set('owner_id', e.target.value)}>
              <option value="">Sin asignar</option>
              {owners.map(o => <option key={o.id} value={o.id}>{o.full_name}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-500 block mb-1">URL imagen principal</label>
            <input className="input" value={form.cover_image_url} onChange={e => set('cover_image_url', e.target.value)} placeholder="https://..." />
          </div>
          <div>
            <label className="text-xs text-gray-500 block mb-1">Slug URL (SEO)</label>
            <input className="input" value={form.seo_slug} onChange={e => set('seo_slug', e.target.value)} placeholder="apartamento-centro-2-hab" />
          </div>
          <div className="flex gap-4">
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input type="checkbox" checked={form.is_published} onChange={e => set('is_published', e.target.checked)} />
              Publicar en portal
            </label>
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input type="checkbox" checked={form.is_featured} onChange={e => set('is_featured', e.target.checked)} />
              Destacado
            </label>
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button onClick={onCancel} className="flex-1 border border-gray-300 text-gray-700 py-2.5 rounded-xl text-sm font-medium">
            Cancelar
          </button>
          <button onClick={submit} disabled={loading} className="flex-1 bg-blue-600 disabled:opacity-50 text-white py-2.5 rounded-xl text-sm font-medium">
            {loading ? 'Guardando...' : 'Guardar'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Owner Form ───────────────────────────────────────────────────────────────

const OWNER_DEFAULT = {
  full_name: '', document_type: 'cedula', document: '',
  phone: '', email: '', address: '', city: '',
  bank_name: '', bank_account: '', bank_account_type: 'ahorros', notes: '',
}

function OwnerForm({ initial, onSave, onCancel }: { initial?: any; onSave: (d: any) => Promise<void>; onCancel: () => void }) {
  const [form, setForm] = useState<typeof OWNER_DEFAULT>({ ...OWNER_DEFAULT, ...(initial ?? {}) })
  const [loading, setLoading] = useState(false)

  const submit = async () => {
    if (!form.full_name) { toast.error('Nombre requerido'); return }
    setLoading(true)
    try { await onSave(form) } finally { setLoading(false) }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={onCancel}>
      <div className="bg-white w-full sm:max-w-md sm:rounded-2xl p-5 max-h-[90svh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold">{initial?.id ? 'Editar propietario' : 'Nuevo propietario'}</h3>
          <button onClick={onCancel}><X className="w-5 h-5 text-gray-500" /></button>
        </div>
        <div className="space-y-3">
          <input className="input" placeholder="Nombre completo *" value={form.full_name} onChange={e => setForm(f => ({...f, full_name: e.target.value}))} />
          <div className="grid grid-cols-2 gap-3">
            <select className="input" value={form.document_type} onChange={e => setForm(f => ({...f, document_type: e.target.value}))}>
              <option value="cedula">Cédula</option>
              <option value="nit">NIT</option>
              <option value="pasaporte">Pasaporte</option>
              <option value="otro">Otro</option>
            </select>
            <input className="input" placeholder="Número documento" value={form.document} onChange={e => setForm(f => ({...f, document: e.target.value}))} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <input className="input" placeholder="Teléfono" value={form.phone} onChange={e => setForm(f => ({...f, phone: e.target.value}))} />
            <input className="input" placeholder="Email" type="email" value={form.email} onChange={e => setForm(f => ({...f, email: e.target.value}))} />
          </div>
          <input className="input" placeholder="Dirección" value={form.address} onChange={e => setForm(f => ({...f, address: e.target.value}))} />
          <input className="input" placeholder="Ciudad" value={form.city} onChange={e => setForm(f => ({...f, city: e.target.value}))} />
          <h4 className="text-sm font-semibold text-gray-600 pt-1 border-t">Datos bancarios</h4>
          <input className="input" placeholder="Banco" value={form.bank_name} onChange={e => setForm(f => ({...f, bank_name: e.target.value}))} />
          <div className="grid grid-cols-2 gap-3">
            <input className="input" placeholder="No. cuenta" value={form.bank_account} onChange={e => setForm(f => ({...f, bank_account: e.target.value}))} />
            <select className="input" value={form.bank_account_type} onChange={e => setForm(f => ({...f, bank_account_type: e.target.value}))}>
              <option value="ahorros">Ahorros</option>
              <option value="corriente">Corriente</option>
            </select>
          </div>
          <textarea className="input" placeholder="Notas" value={form.notes} onChange={e => setForm(f => ({...f, notes: e.target.value}))} />
        </div>
        <div className="flex gap-3 mt-5">
          <button onClick={onCancel} className="flex-1 border border-gray-300 text-gray-700 py-2.5 rounded-xl text-sm">Cancelar</button>
          <button onClick={submit} disabled={loading} className="flex-1 bg-blue-600 disabled:opacity-50 text-white py-2.5 rounded-xl text-sm">
            {loading ? 'Guardando...' : 'Guardar'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Lead Form ────────────────────────────────────────────────────────────────

const LEAD_DEFAULT = {
  full_name: '', phone: '', email: '', source: 'directo',
  interested_in: 'venta', budget_min: '', budget_max: '',
  property_type_pref: '', city_pref: '', stage: 'nuevo',
  property_id: '', notes: '',
}

function LeadForm({ initial, properties, onSave, onCancel }: { initial?: any; properties: any[]; onSave: (d: any) => Promise<void>; onCancel: () => void }) {
  const [form, setForm] = useState<typeof LEAD_DEFAULT>({
    ...LEAD_DEFAULT,
    ...(initial ?? {}),
    budget_min: initial?.budget_min != null ? String(initial.budget_min) : '',
    budget_max: initial?.budget_max != null ? String(initial.budget_max) : '',
  })
  const [loading, setLoading] = useState(false)

  const submit = async () => {
    if (!form.full_name) { toast.error('Nombre requerido'); return }
    setLoading(true)
    try { await onSave({ ...form, budget_min: form.budget_min ? Number(form.budget_min) : undefined, budget_max: form.budget_max ? Number(form.budget_max) : undefined }) }
    finally { setLoading(false) }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={onCancel}>
      <div className="bg-white w-full sm:max-w-lg sm:rounded-2xl p-5 max-h-[90svh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold">{initial?.id ? 'Editar lead' : 'Nuevo lead'}</h3>
          <button onClick={onCancel}><X className="w-5 h-5 text-gray-500" /></button>
        </div>
        <div className="space-y-3">
          <input className="input" placeholder="Nombre completo *" value={form.full_name} onChange={e => setForm(f => ({...f, full_name: e.target.value}))} />
          <div className="grid grid-cols-2 gap-3">
            <input className="input" placeholder="Teléfono" value={form.phone} onChange={e => setForm(f => ({...f, phone: e.target.value}))} />
            <input className="input" placeholder="Email" value={form.email} onChange={e => setForm(f => ({...f, email: e.target.value}))} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-500 block mb-1">Fuente</label>
              <select className="input" value={form.source} onChange={e => setForm(f => ({...f, source: e.target.value}))}>
                {['web','instagram','tiktok','referido','portal','whatsapp','directo','otro'].map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1">Interés</label>
              <select className="input" value={form.interested_in} onChange={e => setForm(f => ({...f, interested_in: e.target.value}))}>
                <option value="venta">Comprar</option>
                <option value="arriendo">Arrendar</option>
                <option value="ambos">Ambos</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <input type="number" className="input" placeholder="Presupuesto mín" value={form.budget_min} onChange={e => setForm(f => ({...f, budget_min: e.target.value}))} />
            <input type="number" className="input" placeholder="Presupuesto máx" value={form.budget_max} onChange={e => setForm(f => ({...f, budget_max: e.target.value}))} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-500 block mb-1">Tipo inmueble buscado</label>
              <select className="input" value={form.property_type_pref} onChange={e => setForm(f => ({...f, property_type_pref: e.target.value}))}>
                <option value="">Cualquiera</option>
                {Object.entries(TYPE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </div>
            <input className="input" placeholder="Ciudad preferida" value={form.city_pref} onChange={e => setForm(f => ({...f, city_pref: e.target.value}))} />
          </div>
          <div>
            <label className="text-xs text-gray-500 block mb-1">Etapa</label>
            <select className="input" value={form.stage} onChange={e => setForm(f => ({...f, stage: e.target.value}))}>
              {STAGES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-500 block mb-1">Inmueble de interés</label>
            <select className="input" value={form.property_id} onChange={e => setForm(f => ({...f, property_id: e.target.value}))}>
              <option value="">Sin asignar</option>
              {properties.map(p => <option key={p.id} value={p.id}>{p.code} — {p.title}</option>)}
            </select>
          </div>
          <textarea className="input" placeholder="Notas" value={form.notes} onChange={e => setForm(f => ({...f, notes: e.target.value}))} />
        </div>
        <div className="flex gap-3 mt-5">
          <button onClick={onCancel} className="flex-1 border border-gray-300 text-gray-700 py-2.5 rounded-xl text-sm">Cancelar</button>
          <button onClick={submit} disabled={loading} className="flex-1 bg-blue-600 disabled:opacity-50 text-white py-2.5 rounded-xl text-sm">
            {loading ? 'Guardando...' : 'Guardar'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Lead Detail ──────────────────────────────────────────────────────────────

function LeadDetail({ lead, onClose, onUpdate }: { lead: any; onClose: () => void; onUpdate: () => void }) {
  const [detail, setDetail] = useState<any>(lead)
  const [activity, setActivity] = useState('')
  const [actType, setActType] = useState('nota')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    api.getRELeadById(lead.id).then(r => { if (r.success && r.data) setDetail(r.data) })
  }, [lead.id])

  const addActivity = async () => {
    if (!activity.trim()) return
    setLoading(true)
    await api.addRELeadActivity(lead.id, { activity_type: actType, description: activity })
    const r = await api.getRELeadById(lead.id)
    if (r.success && r.data) setDetail(r.data)
    setActivity('')
    setLoading(false)
    onUpdate()
  }

  const moveStage = async (stage: string) => {
    await api.updateRELead(lead.id, { stage })
    const r = await api.getRELeadById(lead.id)
    if (r.success && r.data) setDetail(r.data)
    onUpdate()
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={onClose}>
      <div className="bg-white w-full sm:max-w-lg sm:rounded-2xl p-5 max-h-[95svh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-bold">{detail.full_name}</h3>
          <button onClick={onClose}><X className="w-5 h-5 text-gray-500" /></button>
        </div>

        <div className="flex gap-2 mb-4">
          {detail.phone && <a href={`tel:${detail.phone}`} className="flex items-center gap-1 text-xs bg-green-50 text-green-700 px-2 py-1 rounded-full"><Phone className="w-3 h-3" />{detail.phone}</a>}
          {detail.email && <span className="flex items-center gap-1 text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded-full"><Mail className="w-3 h-3" />{detail.email}</span>}
        </div>

        <div className="mb-4">
          <p className="text-xs text-gray-500 mb-2">Etapa del pipeline</p>
          <div className="flex flex-wrap gap-1.5">
            {STAGES.map(s => (
              <button
                key={s}
                onClick={() => moveStage(s)}
                className={cn(
                  'text-xs px-2.5 py-1 rounded-full font-medium transition-all',
                  detail.stage === s ? STAGE_COLORS[s] : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                )}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {detail.property_title && (
          <p className="text-sm text-gray-600 mb-3">
            <Building2 className="w-4 h-4 inline mr-1 text-gray-400" />
            {detail.property_title}
          </p>
        )}

        {/* Activity log */}
        <h4 className="font-semibold text-sm mb-2 border-t pt-3">Historial</h4>
        <div className="space-y-2 max-h-[180px] overflow-y-auto mb-3">
          {(detail.activities ?? []).map((a: any) => (
            <div key={a.id} className="text-xs bg-gray-50 rounded-lg p-2">
              <span className="font-medium text-gray-700">{a.activity_type}</span>
              <span className="text-gray-400 ml-2">{new Date(a.created_at).toLocaleDateString('es-CO')}</span>
              <p className="text-gray-600 mt-0.5">{a.description}</p>
            </div>
          ))}
          {!detail.activities?.length && <p className="text-xs text-gray-400 italic">Sin actividad registrada</p>}
        </div>

        {/* Add activity */}
        <div className="flex gap-2 mt-2">
          <select className="input text-xs py-1.5 w-28 shrink-0" value={actType} onChange={e => setActType(e.target.value)}>
            {['nota','llamada','whatsapp','email','visita','tarea'].map(t => <option key={t} value={t}>{t}</option>)}
          </select>
          <input
            className="input text-xs flex-1 py-1.5" placeholder="Registrar actividad..."
            value={activity} onChange={e => setActivity(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && addActivity()}
          />
          <button onClick={addActivity} disabled={loading || !activity.trim()} className="bg-blue-600 text-white px-3 rounded-xl text-xs disabled:opacity-40">
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Dashboard Tab ────────────────────────────────────────────────────────────

function DashboardTab({ stats }: { stats: any }) {
  if (!stats) return <div className="flex justify-center py-10"><RefreshCw className="animate-spin w-6 h-6 text-gray-300" /></div>
  const { properties: p, leads: l, visits: v, contracts: c } = stats

  const statCards = [
    { label: 'Total inmuebles', value: p.total_properties, sub: `${p.available} disponibles`, color: 'text-blue-600', bg: 'bg-blue-50', icon: Building2 },
    { label: 'Leads activos', value: l.total_leads, sub: `${l.en_negociacion} en negociación`, color: 'text-purple-600', bg: 'bg-purple-50', icon: Users },
    { label: 'Visitas', value: v.total, sub: `${v.programadas} programadas`, color: 'text-amber-600', bg: 'bg-amber-50', icon: Calendar },
    { label: 'Contratos', value: c.total, sub: `${c.activos} activos`, color: 'text-green-600', bg: 'bg-green-50', icon: FileText },
  ]

  return (
    <div className="p-4 space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {statCards.map(s => {
          const Icon = s.icon
          return (
            <div key={s.label} className={cn('rounded-2xl p-4', s.bg)}>
              <Icon className={cn('w-5 h-5 mb-2', s.color)} />
              <div className={cn('text-2xl font-bold', s.color)}>{s.value ?? 0}</div>
              <div className="text-xs text-gray-600 font-medium">{s.label}</div>
              <div className="text-xs text-gray-500">{s.sub}</div>
            </div>
          )
        })}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-2">
        {[
          { label: 'Vendidos', value: p.sold, color: 'bg-gray-100 text-gray-700' },
          { label: 'Arrendados', value: p.rented, color: 'bg-blue-100 text-blue-700' },
          { label: 'Reservados', value: p.reserved, color: 'bg-amber-100 text-amber-700' },
          { label: 'Leads cerrados', value: l.cerrados, color: 'bg-green-100 text-green-700' },
        ].map(s => (
          <div key={s.label} className={cn('rounded-xl px-3 py-2 text-center', s.color)}>
            <div className="text-xl font-bold">{s.value ?? 0}</div>
            <div className="text-xs font-medium">{s.label}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function RealEstate() {
  const [tab, setTab] = useState<Tab>('dashboard')

  // Data
  const [stats, setStats] = useState<any>(null)
  const [properties, setProperties] = useState<any[]>([])
  const [owners, setOwners] = useState<any[]>([])
  const [leads, setLeads] = useState<any[]>([])
  const [visits, setVisits] = useState<any[]>([])
  const [contracts, setContracts] = useState<any[]>([])
  const [maintenances, setMaintenances] = useState<any[]>([])

  // UI
  const [search, setSearch] = useState('')
  const [editingProp, setEditingProp] = useState<any | null>(null)
  const [showPropForm, setShowPropForm] = useState(false)
  const [editingOwner, setEditingOwner] = useState<any | null>(null)
  const [showOwnerForm, setShowOwnerForm] = useState(false)
  const [editingLead, setEditingLead] = useState<any | null>(null)
  const [showLeadForm, setShowLeadForm] = useState(false)
  const [selectedLead, setSelectedLead] = useState<any | null>(null)
  const [stageFilter, setStageFilter] = useState<string>('')

  const load = useCallback(async () => {
    if (tab === 'dashboard') {
      const r = await api.getREStats()
      if (r.success) setStats(r.data)
    } else if (tab === 'properties') {
      const [pr, or] = await Promise.all([api.getREProperties(), api.getREOwners()])
      if (pr.success) setProperties(pr.data ?? [])
      if (or.success) setOwners(or.data ?? [])
    } else if (tab === 'owners') {
      const r = await api.getREOwners()
      if (r.success) setOwners(r.data ?? [])
    } else if (tab === 'crm') {
      const [lr, pr] = await Promise.all([api.getRELeads(), api.getREProperties()])
      if (lr.success) setLeads(lr.data ?? [])
      if (pr.success) setProperties(pr.data ?? [])
    } else if (tab === 'visits') {
      const [vr, pr] = await Promise.all([api.getREVisits(), api.getREProperties()])
      if (vr.success) setVisits(vr.data ?? [])
      if (pr.success) setProperties(pr.data ?? [])
    } else if (tab === 'contracts') {
      const r = await api.getREContracts()
      if (r.success) setContracts(r.data ?? [])
    } else if (tab === 'maintenances') {
      const r = await api.getREMaintenances()
      if (r.success) setMaintenances(r.data ?? [])
    }
  }, [tab])

  useEffect(() => {
    load()
    if (tab === 'owners' && owners.length === 0) {
      api.getREOwners().then(r => { if (r.success) setOwners(r.data ?? []) })
    }
    if (tab !== 'properties' && properties.length === 0) {
      api.getREProperties().then(r => { if (r.success) setProperties(r.data ?? []) })
    }
  }, [tab])

  // Property CRUD
  const saveProp = async (data: any) => {
    if (editingProp?.id) {
      const r = await api.updateREProperty(editingProp.id, data)
      if (r.success) { toast.success('Inmueble actualizado'); setShowPropForm(false); load() }
      else toast.error(r.error ?? 'Error')
    } else {
      const r = await api.createREProperty(data)
      if (r.success) { toast.success('Inmueble creado'); setShowPropForm(false); load() }
      else toast.error(r.error ?? 'Error')
    }
  }
  const deleteProp = async (id: string) => {
    if (!confirm('¿Eliminar inmueble?')) return
    const r = await api.deleteREProperty(id)
    if (r.success) { toast.success('Inmueble eliminado'); load() }
    else toast.error(r.error ?? 'Error')
  }
  const togglePublish = async (p: any) => {
    await api.updateREProperty(p.id, { is_published: !p.is_published })
    load()
  }

  // Owner CRUD
  const saveOwner = async (data: any) => {
    if (editingOwner?.id) {
      const r = await api.updateREOwner(editingOwner.id, data)
      if (r.success) { toast.success('Propietario actualizado'); setShowOwnerForm(false); load() }
      else toast.error(r.error ?? 'Error')
    } else {
      const r = await api.createREOwner(data)
      if (r.success) { toast.success('Propietario creado'); setShowOwnerForm(false); load() }
      else toast.error(r.error ?? 'Error')
    }
  }

  // Lead CRUD
  const saveLead = async (data: any) => {
    if (editingLead?.id) {
      const r = await api.updateRELead(editingLead.id, data)
      if (r.success) { toast.success('Lead actualizado'); setShowLeadForm(false); load() }
      else toast.error(r.error ?? 'Error')
    } else {
      const r = await api.createRELead(data)
      if (r.success) { toast.success('Lead creado'); setShowLeadForm(false); load() }
      else toast.error(r.error ?? 'Error')
    }
  }
  const deleteLead = async (id: string) => {
    if (!confirm('¿Eliminar lead?')) return
    const r = await api.deleteRELead(id)
    if (r.success) { toast.success('Lead eliminado'); load() }
  }

  const tabs: { id: Tab; label: string; icon: any }[] = [
    { id: 'dashboard',    label: 'Inicio',       icon: TrendingUp },
    { id: 'properties',   label: 'Inmuebles',    icon: Building2 },
    { id: 'owners',       label: 'Propietarios', icon: Home },
    { id: 'crm',          label: 'CRM',          icon: Users },
    { id: 'visits',       label: 'Visitas',      icon: Calendar },
    { id: 'contracts',    label: 'Contratos',    icon: FileText },
    { id: 'maintenances', label: 'Mant.',        icon: Wrench },
  ]

  const filteredProps = properties.filter(p =>
    !search || p.title.toLowerCase().includes(search.toLowerCase()) || p.code.toLowerCase().includes(search.toLowerCase())
  )
  const filteredLeads = leads.filter(l => {
    if (stageFilter && l.stage !== stageFilter) return false
    if (search && !l.full_name.toLowerCase().includes(search.toLowerCase()) && !(l.phone ?? '').includes(search)) return false
    return true
  })

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Tab bar */}
      <div className="bg-white border-b overflow-x-auto">
        <div className="flex min-w-max">
          {tabs.map(t => {
            const Icon = t.icon
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-3 text-xs font-medium whitespace-nowrap border-b-2 transition-colors',
                  tab === t.id
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                )}
              >
                <Icon className="w-4 h-4" />{t.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">

        {/* Dashboard */}
        {tab === 'dashboard' && <DashboardTab stats={stats} />}

        {/* Properties */}
        {tab === 'properties' && (
          <div className="p-4">
            <div className="flex gap-2 mb-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input className="input pl-9" placeholder="Buscar por código o título..." value={search} onChange={e => setSearch(e.target.value)} />
              </div>
              <button onClick={() => { setEditingProp(null); setShowPropForm(true) }} className="bg-blue-600 text-white px-3 py-2 rounded-xl flex items-center gap-1 text-sm font-medium">
                <Plus className="w-4 h-4" /> Nuevo
              </button>
            </div>
            <div className="space-y-2">
              {filteredProps.map(p => (
                <div key={p.id} className="bg-white rounded-xl border p-3 flex items-center gap-3">
                  {p.cover_image_url ? (
                    <img src={p.cover_image_url} alt="" className="w-14 h-14 rounded-lg object-cover shrink-0" />
                  ) : (
                    <div className="w-14 h-14 rounded-lg bg-gray-100 shrink-0 flex items-center justify-center">
                      <Building2 className="w-6 h-6 text-gray-300" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-mono text-gray-500">{p.code}</span>
                      <span className={cn('text-xs px-1.5 py-0.5 rounded-full font-medium', PROP_STATUS_COLORS[p.status] ?? 'bg-gray-100 text-gray-700')}>
                        {p.status}
                      </span>
                      {p.is_featured ? <Star className="w-3 h-3 text-amber-500 fill-amber-500" /> : null}
                    </div>
                    <p className="font-semibold text-gray-900 text-sm leading-tight truncate">{p.title}</p>
                    {p.city && <p className="text-xs text-gray-500">{p.neighborhood ? `${p.neighborhood}, ` : ''}{p.city}</p>}
                    <p className="text-sm font-bold text-blue-600 mt-0.5">{COP(p.price)}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1.5 shrink-0">
                    <button onClick={() => togglePublish(p)} title={p.is_published ? 'Publicado' : 'No publicado'}>
                      {p.is_published ? <Eye className="w-4 h-4 text-green-500" /> : <EyeOff className="w-4 h-4 text-gray-300" />}
                    </button>
                    <button onClick={() => { setEditingProp(p); setShowPropForm(true) }}>
                      <Edit2 className="w-4 h-4 text-gray-400" />
                    </button>
                    <button onClick={() => deleteProp(p.id)}>
                      <Trash2 className="w-4 h-4 text-red-400" />
                    </button>
                  </div>
                </div>
              ))}
              {filteredProps.length === 0 && (
                <div className="text-center py-10 text-gray-400">
                  <Building2 className="w-10 h-10 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">Sin inmuebles</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Owners */}
        {tab === 'owners' && (
          <div className="p-4">
            <div className="flex justify-end mb-4">
              <button onClick={() => { setEditingOwner(null); setShowOwnerForm(true) }} className="bg-blue-600 text-white px-3 py-2 rounded-xl flex items-center gap-1 text-sm font-medium">
                <Plus className="w-4 h-4" /> Nuevo propietario
              </button>
            </div>
            <div className="space-y-2">
              {owners.map(o => (
                <div key={o.id} className="bg-white rounded-xl border p-3 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                    <span className="text-blue-600 font-bold text-sm">{o.full_name.charAt(0)}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 text-sm">{o.full_name}</p>
                    <div className="flex flex-wrap gap-2 text-xs text-gray-500 mt-0.5">
                      {o.phone && <span><Phone className="w-3 h-3 inline mr-0.5" />{o.phone}</span>}
                      {o.email && <span><Mail className="w-3 h-3 inline mr-0.5" />{o.email}</span>}
                      {o.properties_count > 0 && <span className="text-blue-600 font-medium">{o.properties_count} inmueble{o.properties_count !== 1 ? 's' : ''}</span>}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => { setEditingOwner(o); setShowOwnerForm(true) }}>
                      <Edit2 className="w-4 h-4 text-gray-400" />
                    </button>
                  </div>
                </div>
              ))}
              {owners.length === 0 && (
                <div className="text-center py-10 text-gray-400">
                  <Home className="w-10 h-10 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">Sin propietarios</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* CRM / Leads */}
        {tab === 'crm' && (
          <div className="p-4">
            <div className="flex gap-2 mb-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input className="input pl-9" placeholder="Buscar lead..." value={search} onChange={e => setSearch(e.target.value)} />
              </div>
              <button onClick={() => { setEditingLead(null); setShowLeadForm(true) }} className="bg-blue-600 text-white px-3 py-2 rounded-xl flex items-center gap-1 text-sm font-medium shrink-0">
                <Plus className="w-4 h-4" /> Lead
              </button>
            </div>
            <div className="flex gap-1.5 overflow-x-auto mb-3 pb-1">
              <button onClick={() => setStageFilter('')} className={cn('text-xs px-2.5 py-1 rounded-full font-medium whitespace-nowrap', !stageFilter ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-600')}>
                Todos ({leads.length})
              </button>
              {STAGES.map(s => {
                const count = leads.filter(l => l.stage === s).length
                return (
                  <button key={s} onClick={() => setStageFilter(s === stageFilter ? '' : s)}
                    className={cn('text-xs px-2.5 py-1 rounded-full font-medium whitespace-nowrap', stageFilter === s ? STAGE_COLORS[s] : 'bg-gray-100 text-gray-600')}>
                    {s} ({count})
                  </button>
                )
              })}
            </div>
            <div className="space-y-2">
              {filteredLeads.map(l => (
                <div key={l.id} className="bg-white rounded-xl border p-3 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-purple-100 flex items-center justify-center shrink-0">
                    <span className="text-purple-600 font-bold text-sm">{l.full_name.charAt(0)}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-gray-900 text-sm">{l.full_name}</p>
                      <span className={cn('text-xs px-1.5 py-0.5 rounded-full font-medium', STAGE_COLORS[l.stage] ?? 'bg-gray-100 text-gray-600')}>{l.stage}</span>
                    </div>
                    <div className="flex flex-wrap gap-2 text-xs text-gray-500 mt-0.5">
                      {l.phone && <span><Phone className="w-3 h-3 inline" /> {l.phone}</span>}
                      {l.property_title && <span><Building2 className="w-3 h-3 inline" /> {l.property_title}</span>}
                      {l.source && <span>via {l.source}</span>}
                    </div>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button onClick={() => setSelectedLead(l)} className="text-blue-600">
                      <ChevronRight className="w-5 h-5" />
                    </button>
                    <button onClick={() => { setEditingLead(l); setShowLeadForm(true) }}>
                      <Edit2 className="w-4 h-4 text-gray-400" />
                    </button>
                    <button onClick={() => deleteLead(l.id)}>
                      <Trash2 className="w-4 h-4 text-red-400" />
                    </button>
                  </div>
                </div>
              ))}
              {filteredLeads.length === 0 && (
                <div className="text-center py-10 text-gray-400">
                  <Users className="w-10 h-10 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">Sin leads{stageFilter ? ` en etapa "${stageFilter}"` : ''}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Visits */}
        {tab === 'visits' && (
          <div className="p-4">
            <div className="flex justify-end mb-4">
              <button
                onClick={async () => {
                  const propertyId = prompt('ID del inmueble:')
                  if (!propertyId) return
                  const scheduled = prompt('Fecha y hora (YYYY-MM-DD HH:MM):')
                  if (!scheduled) return
                  const r = await api.createREVisit({ property_id: propertyId, scheduled_at: scheduled })
                  if (r.success) { toast.success('Visita agendada'); load() }
                  else toast.error(r.error ?? 'Error')
                }}
                className="bg-blue-600 text-white px-3 py-2 rounded-xl flex items-center gap-1 text-sm font-medium"
              >
                <Plus className="w-4 h-4" /> Agendar visita
              </button>
            </div>
            <div className="space-y-2">
              {visits.map(v => (
                <div key={v.id} className="bg-white rounded-xl border p-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-semibold text-gray-900 text-sm">{v.property_title}</p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        <Calendar className="w-3 h-3 inline mr-0.5" />
                        {new Date(v.scheduled_at).toLocaleString('es-CO', { dateStyle: 'medium', timeStyle: 'short' })}
                        {v.client_name && ` — ${v.client_name}`}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={cn('text-xs px-2 py-0.5 rounded-full font-medium', ({
                        programada: 'bg-blue-100 text-blue-700',
                        confirmada: 'bg-indigo-100 text-indigo-700',
                        realizada:  'bg-green-100 text-green-700',
                        cancelada:  'bg-red-100 text-red-700',
                        no_show:    'bg-gray-100 text-gray-700',
                      } as Record<string, string>)[v.status] ?? 'bg-gray-100 text-gray-700')}>
                        {v.status}
                      </span>
                      {v.status === 'programada' && (
                        <button
                          onClick={async () => {
                            await api.updateREVisitStatus(v.id, 'realizada')
                            load()
                          }}
                          title="Marcar realizada"
                        >
                          <Check className="w-4 h-4 text-green-500" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              {visits.length === 0 && (
                <div className="text-center py-10 text-gray-400">
                  <Calendar className="w-10 h-10 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">Sin visitas registradas</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Contracts */}
        {tab === 'contracts' && (
          <div className="p-4">
            <div className="space-y-2">
              {contracts.map(c => (
                <div key={c.id} className="bg-white rounded-xl border p-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono text-gray-500">{c.contract_number}</span>
                        <span className={cn('text-xs px-1.5 py-0.5 rounded-full font-medium', ({
                          borrador:   'bg-gray-100 text-gray-600',
                          activo:     'bg-green-100 text-green-700',
                          vencido:    'bg-red-100 text-red-700',
                          terminado:  'bg-gray-100 text-gray-600',
                          cancelado:  'bg-red-100 text-red-700',
                        } as Record<string, string>)[c.status] ?? 'bg-gray-100 text-gray-600')}>
                          {c.status}
                        </span>
                      </div>
                      <p className="font-semibold text-gray-900 text-sm mt-0.5">{c.property_title}</p>
                      <p className="text-xs text-gray-500">{c.contract_type} — {c.client_name}</p>
                      {c.canon && <p className="text-sm font-bold text-blue-600 mt-0.5">{COP(c.canon)}/mes</p>}
                      {c.sale_price && <p className="text-sm font-bold text-blue-600 mt-0.5">{COP(c.sale_price)}</p>}
                    </div>
                    {c.status === 'borrador' && (
                      <button
                        onClick={async () => {
                          const r = await api.updateREContractStatus(c.id, 'activo')
                          if (r.success) { toast.success('Contrato activado'); load() }
                        }}
                        className="bg-green-600 text-white text-xs px-2.5 py-1 rounded-lg"
                      >
                        Activar
                      </button>
                    )}
                  </div>
                </div>
              ))}
              {contracts.length === 0 && (
                <div className="text-center py-10 text-gray-400">
                  <FileText className="w-10 h-10 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">Sin contratos</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Maintenances */}
        {tab === 'maintenances' && (
          <div className="p-4">
            <div className="flex justify-end mb-4">
              <button
                onClick={async () => {
                  const propertyId = prompt('ID del inmueble:')
                  if (!propertyId) return
                  const title = prompt('Título del reporte:')
                  if (!title) return
                  const r = await api.createREMaintenance({ property_id: propertyId, title })
                  if (r.success) { toast.success('Solicitud creada'); load() }
                }}
                className="bg-blue-600 text-white px-3 py-2 rounded-xl flex items-center gap-1 text-sm font-medium"
              >
                <Plus className="w-4 h-4" /> Nueva solicitud
              </button>
            </div>
            <div className="space-y-2">
              {maintenances.map(m => (
                <div key={m.id} className="bg-white rounded-xl border p-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className={cn('text-xs px-1.5 py-0.5 rounded-full font-medium', ({
                          baja:    'bg-gray-100 text-gray-600',
                          media:   'bg-blue-100 text-blue-700',
                          alta:    'bg-amber-100 text-amber-700',
                          urgente: 'bg-red-100 text-red-700',
                        } as Record<string, string>)[m.priority] ?? 'bg-gray-100 text-gray-600')}>
                          {m.priority}
                        </span>
                        <span className="text-xs text-gray-500">{m.status}</span>
                      </div>
                      <p className="font-semibold text-gray-900 text-sm mt-0.5">{m.title}</p>
                      <p className="text-xs text-gray-500">{m.property_title}</p>
                    </div>
                    {m.status !== 'completado' && (
                      <button
                        onClick={async () => {
                          await api.updateREMaintenanceStatus(m.id, 'completado')
                          load()
                        }}
                        title="Marcar completado"
                      >
                        <Check className="w-4 h-4 text-green-500" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
              {maintenances.length === 0 && (
                <div className="text-center py-10 text-gray-400">
                  <Wrench className="w-10 h-10 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">Sin solicitudes de mantenimiento</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      {showPropForm && (
        <PropertyForm
          initial={editingProp ? { ...editingProp, features: editingProp.features ?? [] } : undefined}
          owners={owners}
          onSave={saveProp}
          onCancel={() => setShowPropForm(false)}
        />
      )}
      {showOwnerForm && (
        <OwnerForm
          initial={editingOwner}
          onSave={saveOwner}
          onCancel={() => setShowOwnerForm(false)}
        />
      )}
      {showLeadForm && (
        <LeadForm
          initial={editingLead}
          properties={properties}
          onSave={saveLead}
          onCancel={() => setShowLeadForm(false)}
        />
      )}
      {selectedLead && (
        <LeadDetail
          lead={selectedLead}
          onClose={() => setSelectedLead(null)}
          onUpdate={load}
        />
      )}
    </div>
  )
}
