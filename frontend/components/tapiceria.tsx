'use client'

import { useState, useEffect, useCallback } from 'react'
import { api } from '@/lib/api'

// ── Constants ────────────────────────────────────────────────────────────────

const STATUS_LIST = ['recibido','cotizado','aprobado','en_proceso','listo','entregado','cancelado'] as const
type WOStatus = typeof STATUS_LIST[number]

const STATUS_LABEL: Record<WOStatus, string> = {
  recibido: 'Recibido', cotizado: 'Cotizado', aprobado: 'Aprobado',
  en_proceso: 'En proceso', listo: 'Listo', entregado: 'Entregado', cancelado: 'Cancelado',
}

const STATUS_COLOR: Record<WOStatus, string> = {
  recibido:   'bg-gray-100 text-gray-700',
  cotizado:   'bg-blue-100 text-blue-700',
  aprobado:   'bg-indigo-100 text-indigo-700',
  en_proceso: 'bg-yellow-100 text-yellow-700',
  listo:      'bg-green-100 text-green-700',
  entregado:  'bg-emerald-100 text-emerald-700',
  cancelado:  'bg-red-100 text-red-700',
}

const ITEM_TYPES = ['vehiculo','moto','silla','sofa','bote','camion','otro']
const JOB_TYPES  = ['tapizado_completo','tapizado_parcial','reparacion','restauracion','tapizado_techo','alfombrado','otro']
const PAY_METHODS = ['efectivo','tarjeta','transferencia','nequi','otro']

const EMPTY_WO = {
  customer_name: '', customer_phone: '', item_description: '',
  item_type: 'vehiculo', job_type: 'tapizado_completo',
  fabric_description: '', quoted_price: '', advance_paid: '',
  promised_at: '', assigned_to: '', notes: '',
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function fmt(n: number) {
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n)
}

function fmtDate(d: string | null | undefined) {
  if (!d) return '—'
  return new Date(d + 'T00:00:00').toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' })
}

function isOverdue(promised_at: string | null, status: string) {
  if (!promised_at || ['entregado','cancelado'].includes(status)) return false
  return new Date(promised_at) < new Date(new Date().toDateString())
}

// ── Sub-components ───────────────────────────────────────────────────────────

function StatCard({ label, value, sub, color }: { label: string; value: number | string; sub?: string; color?: string }) {
  return (
    <div className={`rounded-xl border p-4 ${color ?? 'bg-card'}`}>
      <p className="text-xs text-muted-foreground mb-1">{label}</p>
      <p className="text-2xl font-bold">{value}</p>
      {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
    </div>
  )
}

function Badge({ status }: { status: string }) {
  const cls = (STATUS_COLOR as Record<string, string>)[status] ?? 'bg-gray-100 text-gray-700'
  const lbl = (STATUS_LABEL as Record<string, string>)[status] ?? status
  return <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${cls}`}>{lbl}</span>
}

// ── Main component ───────────────────────────────────────────────────────────

export function Tapiceria() {
  const [tab, setTab]         = useState<'dashboard' | 'orders'>('dashboard')
  const [orders, setOrders]   = useState<any[]>([])
  const [stats, setStats]     = useState<any>(null)
  const [loading, setLoading] = useState(false)

  // Filters
  const [filterStatus, setFilterStatus] = useState('')
  const [search, setSearch]             = useState('')

  // Selected order detail
  const [selected, setSelected] = useState<any | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)

  // New order form
  const [showForm, setShowForm]   = useState(false)
  const [form, setForm]           = useState<typeof EMPTY_WO>({ ...EMPTY_WO })
  const [formLoading, setFormLoading] = useState(false)

  // Payment form (inside drawer)
  const [payForm, setPayForm] = useState({ amount: '', payment_method: 'efectivo', notes: '' })
  const [payLoading, setPayLoading] = useState(false)

  // Material form (inside drawer)
  const [matForm, setMatForm] = useState({ product_name: '', quantity: '1', unit: 'unidad', unit_cost: '', notes: '' })
  const [matLoading, setMatLoading] = useState(false)

  // Status update in drawer
  const [statusLoading, setStatusLoading] = useState(false)

  const loadOrders = useCallback(async () => {
    setLoading(true)
    const filters: Record<string, string> = {}
    if (filterStatus) filters.status = filterStatus
    if (search)       filters.search = search
    const r = await api.getWorkOrders(filters)
    if (r.success) setOrders(r.data ?? [])
    setLoading(false)
  }, [filterStatus, search])

  const loadStats = useCallback(async () => {
    const r = await api.getWOStats()
    if (r.success) setStats(r.data)
  }, [])

  useEffect(() => {
    if (tab === 'dashboard') { loadStats(); }
    if (tab === 'orders')    { loadOrders(); }
  }, [tab, loadStats, loadOrders])

  const openDetail = async (id: string) => {
    setDetailLoading(true)
    const r = await api.getWorkOrderById(id)
    if (r.success) setSelected(r.data)
    setDetailLoading(false)
  }

  const refreshSelected = async () => {
    if (!selected) return
    const r = await api.getWorkOrderById(selected.id)
    if (r.success) {
      setSelected(r.data)
      setOrders(prev => prev.map(o => o.id === r.data.id ? r.data : o))
    }
  }

  // ── Submit new order ──────────────────────────────────────────────────────
  const submitOrder = async () => {
    if (!form.customer_name.trim() || !form.item_description.trim()) return
    setFormLoading(true)
    const r = await api.createWorkOrder({
      ...form,
      quoted_price:  form.quoted_price  ? Number(form.quoted_price)  : 0,
      advance_paid:  form.advance_paid  ? Number(form.advance_paid)  : 0,
      promised_at:   form.promised_at   || undefined,
      assigned_to:   form.assigned_to   || undefined,
    })
    setFormLoading(false)
    if (r.success) {
      setShowForm(false)
      setForm({ ...EMPTY_WO })
      loadOrders()
      loadStats()
    }
  }

  // ── Add payment ───────────────────────────────────────────────────────────
  const submitPayment = async () => {
    if (!selected || !payForm.amount) return
    setPayLoading(true)
    const r = await api.addWOPayment(selected.id, {
      amount: Number(payForm.amount),
      payment_method: payForm.payment_method,
      notes: payForm.notes || undefined,
    })
    setPayLoading(false)
    if (r.success) {
      setPayForm({ amount: '', payment_method: 'efectivo', notes: '' })
      refreshSelected()
    }
  }

  // ── Add material ──────────────────────────────────────────────────────────
  const submitMaterial = async () => {
    if (!selected || !matForm.product_name || !matForm.unit_cost) return
    setMatLoading(true)
    const r = await api.addWOMaterial(selected.id, {
      product_name: matForm.product_name,
      quantity: Number(matForm.quantity),
      unit: matForm.unit,
      unit_cost: Number(matForm.unit_cost),
      notes: matForm.notes || undefined,
    })
    setMatLoading(false)
    if (r.success) {
      setMatForm({ product_name: '', quantity: '1', unit: 'unidad', unit_cost: '', notes: '' })
      refreshSelected()
    }
  }

  // ── Delete material ───────────────────────────────────────────────────────
  const deleteMaterial = async (materialId: number) => {
    if (!selected) return
    await api.removeWOMaterial(selected.id, materialId)
    refreshSelected()
  }

  // ── Change status ─────────────────────────────────────────────────────────
  const changeStatus = async (status: string) => {
    if (!selected) return
    setStatusLoading(true)
    await api.updateWOStatus(selected.id, status)
    setStatusLoading(false)
    refreshSelected()
    loadStats()
  }

  // ── WhatsApp message ──────────────────────────────────────────────────────
  const sendWhatsApp = (wo: any) => {
    const phone = wo.customer_phone?.replace(/\D/g, '')
    if (!phone) return
    const balance = (wo.quoted_price ?? 0) - (wo.total_paid ?? 0)
    const msg = encodeURIComponent(
      `Hola ${wo.customer_name}, le informamos que su orden *${wo.order_number}* para *${wo.item_description}* ya está *lista* para retirar.\n` +
      (balance > 0 ? `Saldo pendiente: ${fmt(balance)}\n` : '') +
      `¡Gracias por elegirnos!`
    )
    window.open(`https://wa.me/57${phone}?text=${msg}`, '_blank')
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col h-full overflow-hidden">

      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b bg-background shrink-0">
        <div>
          <h1 className="text-xl font-bold">Tapicería</h1>
          <p className="text-xs text-muted-foreground">Órdenes de trabajo</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setTab('dashboard')}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${tab === 'dashboard' ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'}`}
          >
            Dashboard
          </button>
          <button
            onClick={() => setTab('orders')}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${tab === 'orders' ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'}`}
          >
            Órdenes
          </button>
          <button
            onClick={() => setShowForm(true)}
            className="px-3 py-1.5 rounded-md text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            + Nueva orden
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">

        {/* ── DASHBOARD TAB ─────────────────────────────────────────────── */}
        {tab === 'dashboard' && (
          <div className="p-6 space-y-6">
            {stats ? (
              <>
                {/* Status counts */}
                <div>
                  <h2 className="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wide">Estado de órdenes</h2>
                  <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
                    <StatCard label="Total" value={stats.counts?.total ?? 0} />
                    <StatCard label="Recibidas" value={stats.counts?.recibidas ?? 0} color="bg-gray-50" />
                    <StatCard label="En proceso" value={stats.counts?.en_proceso ?? 0} color="bg-yellow-50" />
                    <StatCard label="Listas" value={stats.counts?.listas ?? 0} color="bg-green-50" />
                    <StatCard label="Entregadas" value={stats.counts?.entregadas ?? 0} color="bg-emerald-50" />
                    <StatCard label="Canceladas" value={stats.counts?.canceladas ?? 0} color="bg-red-50" />
                    <StatCard label="Vencidas" value={stats.counts?.vencidas ?? 0} color="bg-orange-50 border-orange-200" />
                  </div>
                </div>

                {/* Revenue */}
                <div>
                  <h2 className="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wide">Cobros recibidos</h2>
                  <div className="grid grid-cols-3 gap-3">
                    <StatCard label="Hoy" value={fmt(stats.revenue?.hoy ?? 0)} color="bg-card" />
                    <StatCard label="Esta semana" value={fmt(stats.revenue?.semana ?? 0)} color="bg-card" />
                    <StatCard label="Este mes" value={fmt(stats.revenue?.mes ?? 0)} color="bg-card" />
                  </div>
                </div>

                {/* Due today */}
                {stats.due_today?.length > 0 && (
                  <div>
                    <h2 className="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wide">Para entregar hoy</h2>
                    <div className="grid gap-2">
                      {stats.due_today.map((wo: any) => (
                        <div
                          key={wo.id}
                          onClick={() => { setTab('orders'); openDetail(wo.id) }}
                          className="flex items-center justify-between p-3 rounded-lg border bg-green-50 hover:bg-green-100 cursor-pointer transition-colors"
                        >
                          <div>
                            <span className="font-semibold text-sm">{wo.order_number}</span>
                            <span className="mx-2 text-muted-foreground">·</span>
                            <span className="text-sm">{wo.customer_name}</span>
                            <span className="mx-2 text-muted-foreground">·</span>
                            <span className="text-sm text-muted-foreground">{wo.item_description}</span>
                          </div>
                          <Badge status={wo.status} />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Overdue */}
                {stats.overdue?.length > 0 && (
                  <div>
                    <h2 className="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wide">Órdenes vencidas</h2>
                    <div className="grid gap-2">
                      {stats.overdue.map((wo: any) => (
                        <div
                          key={wo.id}
                          onClick={() => { setTab('orders'); openDetail(wo.id) }}
                          className="flex items-center justify-between p-3 rounded-lg border bg-red-50 hover:bg-red-100 cursor-pointer transition-colors"
                        >
                          <div>
                            <span className="font-semibold text-sm">{wo.order_number}</span>
                            <span className="mx-2 text-muted-foreground">·</span>
                            <span className="text-sm">{wo.customer_name}</span>
                            <span className="mx-2 text-muted-foreground">·</span>
                            <span className="text-xs text-red-600">Prometido: {fmtDate(wo.promised_at)}</span>
                          </div>
                          <Badge status={wo.status} />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="flex justify-center py-16">
                <div className="h-7 w-7 animate-spin rounded-full border-4 border-primary border-t-transparent" />
              </div>
            )}
          </div>
        )}

        {/* ── ORDERS TAB ────────────────────────────────────────────────── */}
        {tab === 'orders' && (
          <div className="p-6 space-y-4">

            {/* Filters */}
            <div className="flex flex-wrap gap-2 items-center">
              <input
                className="input h-9 w-48 text-sm"
                placeholder="Buscar orden, cliente..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && loadOrders()}
              />
              <div className="flex gap-1 flex-wrap">
                <button
                  onClick={() => setFilterStatus('')}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${filterStatus === '' ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80'}`}
                >
                  Todas
                </button>
                {STATUS_LIST.map(s => (
                  <button
                    key={s}
                    onClick={() => setFilterStatus(s)}
                    className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${filterStatus === s ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80'}`}
                  >
                    {STATUS_LABEL[s]}
                  </button>
                ))}
              </div>
            </div>

            {/* Order list */}
            {loading ? (
              <div className="flex justify-center py-16">
                <div className="h-7 w-7 animate-spin rounded-full border-4 border-primary border-t-transparent" />
              </div>
            ) : orders.length === 0 ? (
              <div className="py-16 text-center text-muted-foreground text-sm">No hay órdenes.</div>
            ) : (
              <div className="grid gap-2">
                {orders.map(wo => {
                  const overdue = isOverdue(wo.promised_at, wo.status)
                  const balance = (wo.quoted_price ?? 0) - (wo.total_paid ?? 0)
                  return (
                    <div
                      key={wo.id}
                      onClick={() => openDetail(wo.id)}
                      className={`flex items-center justify-between p-4 rounded-lg border cursor-pointer hover:bg-muted/50 transition-colors ${overdue ? 'border-red-300 bg-red-50' : 'bg-card'}`}
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-sm">{wo.order_number}</span>
                          <Badge status={wo.status} />
                          {overdue && <span className="text-xs text-red-600 font-medium">VENCIDA</span>}
                        </div>
                        <p className="text-sm mt-0.5 truncate">{wo.customer_name}{wo.customer_phone ? ` · ${wo.customer_phone}` : ''}</p>
                        <p className="text-xs text-muted-foreground truncate">{wo.item_description}</p>
                        {wo.promised_at && (
                          <p className="text-xs text-muted-foreground">Entrega: {fmtDate(wo.promised_at)}</p>
                        )}
                      </div>
                      <div className="text-right shrink-0 ml-4">
                        <p className="text-sm font-semibold">{fmt(wo.quoted_price ?? 0)}</p>
                        {balance > 0 && <p className="text-xs text-red-500">Saldo: {fmt(balance)}</p>}
                        {wo.assigned_name && <p className="text-xs text-muted-foreground">{wo.assigned_name}</p>}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── NEW ORDER FORM (modal) ─────────────────────────────────────────── */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-background rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h2 className="font-bold text-lg">Nueva orden de trabajo</h2>
              <button onClick={() => setShowForm(false)} className="text-muted-foreground hover:text-foreground text-xl">✕</button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="text-xs font-medium mb-1 block">Cliente *</label>
                  <input className="input w-full" placeholder="Nombre del cliente" value={form.customer_name} onChange={e => setForm(f => ({ ...f, customer_name: e.target.value }))} />
                </div>
                <div>
                  <label className="text-xs font-medium mb-1 block">Teléfono</label>
                  <input className="input w-full" placeholder="Ej: 3001234567" value={form.customer_phone} onChange={e => setForm(f => ({ ...f, customer_phone: e.target.value }))} />
                </div>
                <div>
                  <label className="text-xs font-medium mb-1 block">Fecha prometida</label>
                  <input type="date" className="input w-full" value={form.promised_at} onChange={e => setForm(f => ({ ...f, promised_at: e.target.value }))} />
                </div>
                <div className="col-span-2">
                  <label className="text-xs font-medium mb-1 block">Descripción del artículo *</label>
                  <input className="input w-full" placeholder="Ej: Honda Civic 2020, sillas delanteras" value={form.item_description} onChange={e => setForm(f => ({ ...f, item_description: e.target.value }))} />
                </div>
                <div>
                  <label className="text-xs font-medium mb-1 block">Tipo de artículo</label>
                  <select className="input w-full" value={form.item_type} onChange={e => setForm(f => ({ ...f, item_type: e.target.value }))}>
                    {ITEM_TYPES.map(t => <option key={t} value={t}>{t.replace('_',' ')}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium mb-1 block">Tipo de trabajo</label>
                  <select className="input w-full" value={form.job_type} onChange={e => setForm(f => ({ ...f, job_type: e.target.value }))}>
                    {JOB_TYPES.map(t => <option key={t} value={t}>{t.replace(/_/g,' ')}</option>)}
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="text-xs font-medium mb-1 block">Material / Tela</label>
                  <input className="input w-full" placeholder="Ej: Cuero sintético negro" value={form.fabric_description} onChange={e => setForm(f => ({ ...f, fabric_description: e.target.value }))} />
                </div>
                <div>
                  <label className="text-xs font-medium mb-1 block">Precio cotizado</label>
                  <input type="number" className="input w-full" placeholder="0" value={form.quoted_price} onChange={e => setForm(f => ({ ...f, quoted_price: e.target.value }))} />
                </div>
                <div>
                  <label className="text-xs font-medium mb-1 block">Anticipo recibido</label>
                  <input type="number" className="input w-full" placeholder="0" value={form.advance_paid} onChange={e => setForm(f => ({ ...f, advance_paid: e.target.value }))} />
                </div>
                <div className="col-span-2">
                  <label className="text-xs font-medium mb-1 block">Notas</label>
                  <textarea className="input w-full resize-none" rows={2} placeholder="Observaciones adicionales" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
                </div>
              </div>
            </div>
            <div className="flex gap-2 justify-end px-6 py-4 border-t">
              <button onClick={() => setShowForm(false)} className="px-4 py-2 rounded-md text-sm border hover:bg-muted">Cancelar</button>
              <button
                onClick={submitOrder}
                disabled={formLoading || !form.customer_name || !form.item_description}
                className="px-4 py-2 rounded-md text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
              >
                {formLoading ? 'Guardando...' : 'Crear orden'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── ORDER DETAIL DRAWER ───────────────────────────────────────────── */}
      {(selected || detailLoading) && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/40" onClick={() => setSelected(null)} />
          <div className="relative bg-background w-full max-w-lg shadow-xl overflow-y-auto flex flex-col">

            {detailLoading ? (
              <div className="flex-1 flex items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
              </div>
            ) : selected && (
              <>
                {/* Drawer header */}
                <div className="flex items-center justify-between px-6 py-4 border-b shrink-0">
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="font-bold">{selected.order_number}</h2>
                      <Badge status={selected.status} />
                    </div>
                    <p className="text-xs text-muted-foreground">{selected.customer_name}{selected.customer_phone ? ` · ${selected.customer_phone}` : ''}</p>
                  </div>
                  <button onClick={() => setSelected(null)} className="text-muted-foreground hover:text-foreground text-xl">✕</button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-6">

                  {/* Info grid */}
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div><span className="text-muted-foreground">Artículo:</span> <span className="font-medium">{selected.item_description}</span></div>
                    <div><span className="text-muted-foreground">Tipo:</span> <span className="font-medium">{selected.item_type} · {selected.job_type?.replace(/_/g,' ')}</span></div>
                    {selected.fabric_description && <div className="col-span-2"><span className="text-muted-foreground">Material:</span> <span className="font-medium">{selected.fabric_description}</span></div>}
                    <div><span className="text-muted-foreground">Recibido:</span> <span className="font-medium">{new Date(selected.received_at).toLocaleDateString('es-CO')}</span></div>
                    <div><span className="text-muted-foreground">Prometido:</span> <span className={`font-medium ${isOverdue(selected.promised_at, selected.status) ? 'text-red-600' : ''}`}>{fmtDate(selected.promised_at)}</span></div>
                    <div><span className="text-muted-foreground">Cotizado:</span> <span className="font-semibold">{fmt(selected.quoted_price ?? 0)}</span></div>
                    <div><span className="text-muted-foreground">Cobrado:</span> <span className="font-semibold text-green-700">{fmt(selected.total_paid ?? 0)}</span></div>
                    <div><span className="text-muted-foreground">Materiales:</span> <span className="font-semibold text-orange-600">{fmt(selected.materials_cost ?? 0)}</span></div>
                    <div><span className="text-muted-foreground">Saldo:</span> <span className={`font-semibold ${(selected.quoted_price - selected.total_paid) > 0 ? 'text-red-600' : 'text-green-700'}`}>{fmt((selected.quoted_price ?? 0) - (selected.total_paid ?? 0))}</span></div>
                    {selected.notes && <div className="col-span-2"><span className="text-muted-foreground">Notas:</span> <span>{selected.notes}</span></div>}
                  </div>

                  {/* Status change */}
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Cambiar estado</p>
                    <div className="flex flex-wrap gap-2">
                      {STATUS_LIST.map(s => (
                        <button
                          key={s}
                          disabled={statusLoading || s === selected.status}
                          onClick={() => changeStatus(s)}
                          className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${s === selected.status ? 'ring-2 ring-primary ring-offset-1 opacity-100' : 'opacity-60 hover:opacity-100'} ${(STATUS_COLOR as Record<string,string>)[s]}`}
                        >
                          {STATUS_LABEL[s]}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* WhatsApp */}
                  {selected.customer_phone && (
                    <button
                      onClick={() => sendWhatsApp(selected)}
                      className="w-full flex items-center justify-center gap-2 rounded-lg border border-green-300 bg-green-50 hover:bg-green-100 py-2 text-sm font-medium text-green-800 transition-colors"
                    >
                      <span>📲</span> Notificar por WhatsApp
                    </button>
                  )}

                  {/* Materials */}
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Materiales usados</p>
                    {selected.materials?.length > 0 ? (
                      <div className="space-y-1 mb-3">
                        {selected.materials.map((m: any) => (
                          <div key={m.id} className="flex items-center justify-between p-2 rounded-lg bg-muted/50 text-sm">
                            <span>{m.product_name} × {m.quantity} {m.unit}</span>
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{fmt(m.total_cost)}</span>
                              <button onClick={() => deleteMaterial(m.id)} className="text-red-400 hover:text-red-600 text-xs">✕</button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : <p className="text-xs text-muted-foreground mb-3">Sin materiales registrados.</p>}

                    <div className="grid grid-cols-2 gap-2">
                      <input className="input text-sm" placeholder="Material / tela" value={matForm.product_name} onChange={e => setMatForm(f => ({ ...f, product_name: e.target.value }))} />
                      <input className="input text-sm" placeholder="Unidad (m, unidad...)" value={matForm.unit} onChange={e => setMatForm(f => ({ ...f, unit: e.target.value }))} />
                      <input type="number" className="input text-sm" placeholder="Cantidad" value={matForm.quantity} onChange={e => setMatForm(f => ({ ...f, quantity: e.target.value }))} />
                      <input type="number" className="input text-sm" placeholder="Costo unitario" value={matForm.unit_cost} onChange={e => setMatForm(f => ({ ...f, unit_cost: e.target.value }))} />
                      <button
                        onClick={submitMaterial}
                        disabled={matLoading || !matForm.product_name || !matForm.unit_cost}
                        className="col-span-2 py-1.5 rounded-md text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                      >
                        {matLoading ? 'Guardando...' : '+ Agregar material'}
                      </button>
                    </div>
                  </div>

                  {/* Payments */}
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Pagos recibidos</p>
                    {selected.payments?.length > 0 ? (
                      <div className="space-y-1 mb-3">
                        {selected.payments.map((p: any) => (
                          <div key={p.id} className="flex items-center justify-between p-2 rounded-lg bg-muted/50 text-sm">
                            <div>
                              <span className="font-medium">{fmt(p.amount)}</span>
                              <span className="text-muted-foreground ml-2">{p.payment_method}</span>
                            </div>
                            <span className="text-xs text-muted-foreground">{new Date(p.created_at).toLocaleDateString('es-CO')}</span>
                          </div>
                        ))}
                      </div>
                    ) : <p className="text-xs text-muted-foreground mb-3">Sin pagos registrados.</p>}

                    <div className="flex gap-2">
                      <input type="number" className="input text-sm flex-1" placeholder="Monto" value={payForm.amount} onChange={e => setPayForm(f => ({ ...f, amount: e.target.value }))} />
                      <select className="input text-sm w-36" value={payForm.payment_method} onChange={e => setPayForm(f => ({ ...f, payment_method: e.target.value }))}>
                        {PAY_METHODS.map(m => <option key={m} value={m}>{m}</option>)}
                      </select>
                      <button
                        onClick={submitPayment}
                        disabled={payLoading || !payForm.amount}
                        className="px-3 py-1.5 rounded-md text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 whitespace-nowrap"
                      >
                        {payLoading ? '...' : '+ Pago'}
                      </button>
                    </div>
                  </div>

                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
