'use client'

import { useEffect, useState, useCallback } from 'react'
import { api } from '@/lib/api'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import {
  Calendar, Clock, Users, Phone, Mail, MessageCircle,
  Check, X, CheckCircle2, AlertCircle, Settings, Copy,
  Plus, Trash2, CalendarCheck, RefreshCw, User, FileText,
  UtensilsCrossed, PartyPopper, MapPin, ToggleLeft, ToggleRight,
} from 'lucide-react'

const formatCOP = (n: number) =>
  new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n)

const formatDate = (dateStr: string) => {
  if (!dateStr) return ''
  const [y, m, d] = dateStr.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString('es-CO', {
    weekday: 'short', day: 'numeric', month: 'short',
  })
}

const STATUS_STYLES: Record<string, { label: string; color: string }> = {
  pendiente:  { label: 'Pendiente',   color: 'bg-amber-500/20 text-amber-400 border-amber-500/30' },
  confirmada: { label: 'Confirmada',  color: 'bg-green-500/20 text-green-400 border-green-500/30' },
  cancelada:  { label: 'Cancelada',   color: 'bg-red-500/20 text-red-400 border-red-500/30' },
  completada: { label: 'Completada',  color: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
  no_show:    { label: 'No asistió',  color: 'bg-zinc-600/20 text-zinc-400 border-zinc-600/30' },
}

const SLOT_OPTIONS = [15, 30, 60, 90, 120]

type SubTab = 'gestion' | 'configuracion'

interface Reservation {
  id: string
  reservation_number: string
  customer_name: string
  customer_phone: string
  customer_email?: string
  reservation_date: string
  reservation_time: string
  guests_count: number
  occasion?: string
  notes?: string
  preOrderItems: { menuItemId: string; name: string; quantity: number; unitPrice: number }[]
  pre_order_notes?: string
  status: string
  rejection_reason?: string
  notified_whatsapp: number
  table_number?: string
  table_area?: string
}

interface Settings {
  enabled: boolean
  whatsapp: string
  openTime: string
  closeTime: string
  slotMinutes: number
  maxAdvanceDays: number
  minAdvanceHours: number
  occasions: string[]
  slug?: string
}

const DEFAULT_SETTINGS: Settings = {
  enabled: false, whatsapp: '', openTime: '12:00', closeTime: '22:00',
  slotMinutes: 60, maxAdvanceDays: 30, minAdvanceHours: 2, occasions: [],
}

export function RestBarReservations() {
  const [subTab, setSubTab] = useState<SubTab>('gestion')
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [dateFilter, setDateFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS)
  const [savingSettings, setSavingSettings] = useState(false)
  const [newOccasion, setNewOccasion] = useState('')
  const [cancelId, setCancelId] = useState<string | null>(null)
  const [cancelReason, setCancelReason] = useState('')

  const fetchReservations = useCallback(async () => {
    setLoading(true)
    try {
      const res = await api.getRestbarReservations({
        date: dateFilter || undefined,
        status: statusFilter || undefined,
      })
      if (res.success) {
        setReservations((res as any).reservations || [])
        setTotal((res as any).total || 0)
      }
    } catch { toast.error('Error al cargar reservas') }
    finally { setLoading(false) }
  }, [dateFilter, statusFilter])

  const fetchSettings = useCallback(async () => {
    try {
      const res = await api.getRestbarReservationSettings()
      if (res.success && res.data) {
        const d = res.data
        setSettings({
          enabled: !!d.enabled,
          whatsapp: d.whatsapp || '',
          openTime: (d.openTime || '12:00:00').slice(0, 5),
          closeTime: (d.closeTime || '22:00:00').slice(0, 5),
          slotMinutes: d.slotMinutes || 60,
          maxAdvanceDays: d.maxAdvanceDays || 30,
          minAdvanceHours: d.minAdvanceHours || 2,
          occasions: d.occasions || [],
          slug: d.slug,
        })
      }
    } catch { /* silencioso */ }
  }, [])

  useEffect(() => {
    fetchReservations()
  }, [fetchReservations])

  useEffect(() => {
    fetchSettings()
  }, [fetchSettings])

  const handleConfirm = async (id: string) => {
    try {
      await api.confirmRestbarReservation(id)
      toast.success('Reserva confirmada')
      fetchReservations()
    } catch { toast.error('Error al confirmar') }
  }

  const handleCancel = async () => {
    if (!cancelId) return
    try {
      await api.cancelRestbarReservation(cancelId, cancelReason)
      toast.success('Reserva cancelada')
      setCancelId(null)
      setCancelReason('')
      fetchReservations()
    } catch { toast.error('Error al cancelar') }
  }

  const handleComplete = async (id: string) => {
    try {
      await api.completeRestbarReservation(id)
      toast.success('Reserva completada')
      fetchReservations()
    } catch { toast.error('Error') }
  }

  const handleNoShow = async (id: string) => {
    try {
      await api.noShowRestbarReservation(id)
      toast.success('Marcada como no asistió')
      fetchReservations()
    } catch { toast.error('Error') }
  }

  const handleWhatsApp = async (r: Reservation) => {
    if (!settings.whatsapp) { toast.error('Configura el número de WhatsApp en Configuración'); return; }
    const preOrder = r.preOrderItems?.length
      ? `\nPre-pedido: ${r.preOrderItems.map(i => `${i.quantity}× ${i.name}`).join(', ')}`
      : ''
    const msg = encodeURIComponent(
      `🍽️ Nueva reserva ${r.reservation_number}\n` +
      `Cliente: ${r.customer_name} · ${r.customer_phone}\n` +
      `Fecha: ${formatDate(r.reservation_date)} · ${r.reservation_time.slice(0, 5)}\n` +
      `Mesa: ${r.table_number || 'Sin asignar'}${r.table_area ? ` (${r.table_area})` : ''} · ${r.guests_count} personas` +
      (r.occasion ? `\nOcasión: ${r.occasion}` : '') +
      (r.notes ? `\nNotas: ${r.notes}` : '') +
      preOrder
    )
    const phone = settings.whatsapp.replace(/\D/g, '')
    window.open(`https://wa.me/${phone}?text=${msg}`, '_blank')
    if (!r.notified_whatsapp) {
      try { await api.markRestbarReservationWhatsappNotified(r.id) } catch { /* silencioso */ }
      fetchReservations()
    }
  }

  const saveSettings = async () => {
    setSavingSettings(true)
    try {
      const result = await api.updateRestbarReservationSettings({
        enabled: settings.enabled,
        whatsapp: settings.whatsapp,
        openTime: settings.openTime,
        closeTime: settings.closeTime,
        slotMinutes: settings.slotMinutes,
        maxAdvanceDays: settings.maxAdvanceDays,
        minAdvanceHours: settings.minAdvanceHours,
        occasions: settings.occasions,
      })
      if (result.success) {
        toast.success('Configuración guardada')
        await fetchSettings()
      } else {
        toast.error(result.error || 'Error al guardar configuración')
      }
    } catch { toast.error('Error de conexión al guardar') }
    finally { setSavingSettings(false) }
  }

  const addOccasion = () => {
    const trimmed = newOccasion.trim()
    if (!trimmed || settings.occasions.includes(trimmed)) return
    setSettings(s => ({ ...s, occasions: [...s.occasions, trimmed] }))
    setNewOccasion('')
  }

  const removeOccasion = (occ: string) =>
    setSettings(s => ({ ...s, occasions: s.occasions.filter(o => o !== occ) }))

  const reservationLink = settings.slug
    ? `${typeof window !== 'undefined' ? window.location.origin : ''}/reservar/${settings.slug}`
    : ''

  const copyLink = () => {
    if (!reservationLink) return
    navigator.clipboard.writeText(reservationLink)
    toast.success('Link copiado')
  }

  const pendingCount = reservations.filter(r => r.status === 'pendiente').length

  return (
    <div className="space-y-4">
      {/* Sub-tabs */}
      <div className="flex gap-1 p-1 bg-muted/40 rounded-lg w-fit">
        {([
          { id: 'gestion', label: 'Gestión', icon: CalendarCheck },
          { id: 'configuracion', label: 'Configuración', icon: Settings },
        ] as const).map(t => (
          <button
            key={t.id}
            onClick={() => setSubTab(t.id)}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all',
              subTab === t.id ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
            )}
          >
            <t.icon className="h-3.5 w-3.5" />
            {t.label}
            {t.id === 'gestion' && pendingCount > 0 && (
              <span className="ml-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-amber-500 text-[10px] font-bold text-white">
                {pendingCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── SUB-TAB: GESTIÓN ── */}
      {subTab === 'gestion' && (
        <div className="space-y-4">
          {/* Filtros */}
          <div className="flex flex-wrap gap-3 items-center">
            <div className="flex items-center gap-2 bg-muted/40 border border-border rounded-lg px-3 py-1.5">
              <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
              <input
                type="date"
                value={dateFilter}
                onChange={e => setDateFilter(e.target.value)}
                className="bg-transparent text-sm text-foreground focus:outline-none"
              />
            </div>
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="bg-muted/40 border border-border rounded-lg px-3 py-1.5 text-sm text-foreground focus:outline-none"
            >
              <option value="">Todos los estados</option>
              {Object.entries(STATUS_STYLES).map(([k, v]) => (
                <option key={k} value={k}>{v.label}</option>
              ))}
            </select>
            <button
              onClick={fetchReservations}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-muted/40 border border-border text-sm text-muted-foreground hover:text-foreground"
            >
              <RefreshCw className={cn('h-3.5 w-3.5', loading && 'animate-spin')} />
              Actualizar
            </button>
            <span className="text-xs text-muted-foreground ml-auto">{total} reserva(s)</span>
          </div>

          {/* Lista de reservas */}
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : reservations.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <CalendarCheck className="h-10 w-10 mx-auto mb-3 opacity-30" />
              <p className="text-sm">Sin reservas para este filtro</p>
            </div>
          ) : (
            <div className="space-y-3">
              {reservations.map(r => {
                const st = STATUS_STYLES[r.status] || STATUS_STYLES.pendiente
                const preOrderTotal = r.preOrderItems?.reduce((s, i) => s + i.quantity * i.unitPrice, 0) || 0
                return (
                  <div key={r.id} className="bg-card border border-border rounded-xl p-4 space-y-3">
                    {/* Header */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-xs font-mono font-bold text-muted-foreground shrink-0">{r.reservation_number}</span>
                        <span className={cn('text-[11px] font-semibold px-2 py-0.5 rounded-full border', st.color)}>
                          {st.label}
                        </span>
                        {!r.notified_whatsapp && r.status === 'pendiente' && (
                          <span className="text-[10px] bg-amber-500/20 text-amber-400 border border-amber-500/30 px-1.5 py-0.5 rounded-full font-semibold">
                            Nuevo
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1 shrink-0 text-xs text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        <span>{formatDate(r.reservation_date)}</span>
                        <Clock className="h-3 w-3 ml-1" />
                        <span>{r.reservation_time.slice(0, 5)}</span>
                      </div>
                    </div>

                    {/* Info */}
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <InfoItem icon={<User className="h-3.5 w-3.5" />} text={r.customer_name} />
                      <InfoItem icon={<Phone className="h-3.5 w-3.5" />} text={r.customer_phone} />
                      <InfoItem icon={<Users className="h-3.5 w-3.5" />} text={`${r.guests_count} personas`} />
                      <InfoItem icon={<MapPin className="h-3.5 w-3.5" />} text={r.table_number ? `Mesa ${r.table_number}${r.table_area ? ` · ${r.table_area}` : ''}` : 'Sin mesa'} />
                      {r.occasion && <InfoItem icon={<PartyPopper className="h-3.5 w-3.5" />} text={r.occasion} />}
                      {r.customer_email && <InfoItem icon={<Mail className="h-3.5 w-3.5" />} text={r.customer_email} />}
                    </div>

                    {r.notes && (
                      <div className="flex items-start gap-2 text-xs text-muted-foreground bg-muted/30 rounded-lg p-2">
                        <FileText className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                        <span>{r.notes}</span>
                      </div>
                    )}

                    {r.preOrderItems?.length > 0 && (
                      <div className="bg-muted/30 rounded-lg p-3 space-y-1">
                        <p className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground flex items-center gap-1.5">
                          <UtensilsCrossed className="h-3 w-3" /> Pre-pedido · {formatCOP(preOrderTotal)}
                        </p>
                        <div className="space-y-0.5">
                          {r.preOrderItems.map((item, i) => (
                            <p key={i} className="text-xs text-foreground">
                              {item.quantity}× {item.name}
                              <span className="text-muted-foreground ml-1">— {formatCOP(item.unitPrice)}</span>
                            </p>
                          ))}
                        </div>
                        {r.pre_order_notes && (
                          <p className="text-xs text-muted-foreground italic mt-1">{r.pre_order_notes}</p>
                        )}
                      </div>
                    )}

                    {r.rejection_reason && (
                      <p className="text-xs text-red-400 bg-red-500/10 rounded-lg px-3 py-2">
                        Motivo cancelación: {r.rejection_reason}
                      </p>
                    )}

                    {/* Acciones */}
                    <div className="flex flex-wrap gap-2 pt-1">
                      <button
                        onClick={() => handleWhatsApp(r)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-500/10 text-green-400 border border-green-500/20 text-xs font-semibold hover:bg-green-500/20"
                      >
                        <MessageCircle className="h-3.5 w-3.5" /> WhatsApp
                      </button>

                      {r.status === 'pendiente' && (
                        <button
                          onClick={() => handleConfirm(r.id)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-500/10 text-green-400 border border-green-500/20 text-xs font-semibold hover:bg-green-500/20"
                        >
                          <Check className="h-3.5 w-3.5" /> Confirmar
                        </button>
                      )}

                      {r.status === 'confirmada' && (
                        <>
                          <button
                            onClick={() => handleComplete(r.id)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20 text-xs font-semibold hover:bg-blue-500/20"
                          >
                            <CheckCircle2 className="h-3.5 w-3.5" /> Completada
                          </button>
                          <button
                            onClick={() => handleNoShow(r.id)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-500/10 text-zinc-400 border border-zinc-500/20 text-xs font-semibold hover:bg-zinc-500/20"
                          >
                            <AlertCircle className="h-3.5 w-3.5" /> No asistió
                          </button>
                        </>
                      )}

                      {(r.status === 'pendiente' || r.status === 'confirmada') && (
                        <button
                          onClick={() => { setCancelId(r.id); setCancelReason('') }}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/10 text-red-400 border border-red-500/20 text-xs font-semibold hover:bg-red-500/20"
                        >
                          <X className="h-3.5 w-3.5" /> Cancelar
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* ── SUB-TAB: CONFIGURACIÓN ── */}
      {subTab === 'configuracion' && (
        <div className="space-y-5 max-w-lg">

          {/* Activar reservas */}
          <SettingBlock title="Reservas online">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-foreground">Activar reservas</p>
                <p className="text-xs text-muted-foreground">Permitir que los clientes reserven online</p>
              </div>
              <button
                onClick={() => setSettings(s => ({ ...s, enabled: !s.enabled }))}
                className={cn('transition-colors', settings.enabled ? 'text-primary' : 'text-muted-foreground/40')}
              >
                {settings.enabled
                  ? <ToggleRight className="h-8 w-8" />
                  : <ToggleLeft className="h-8 w-8" />}
              </button>
            </div>
          </SettingBlock>

          {/* WhatsApp */}
          <SettingBlock title="Notificaciones">
            <label className="block text-xs text-muted-foreground mb-1">Número WhatsApp (con código de país)</label>
            <input
              type="tel"
              placeholder="573001234567"
              value={settings.whatsapp}
              onChange={e => setSettings(s => ({ ...s, whatsapp: e.target.value }))}
              className="w-full bg-muted/40 border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            />
            <p className="text-[11px] text-muted-foreground mt-1">Ej: 573001234567 (sin + ni espacios)</p>
          </SettingBlock>

          {/* Horario */}
          <SettingBlock title="Horario de atención">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-muted-foreground mb-1">Apertura</label>
                <input type="time" value={settings.openTime}
                  onChange={e => setSettings(s => ({ ...s, openTime: e.target.value }))}
                  className="w-full bg-muted/40 border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs text-muted-foreground mb-1">Cierre</label>
                <input type="time" value={settings.closeTime}
                  onChange={e => setSettings(s => ({ ...s, closeTime: e.target.value }))}
                  className="w-full bg-muted/40 border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none"
                />
              </div>
            </div>
            <div className="mt-3">
              <label className="block text-xs text-muted-foreground mb-1">Duración de cada slot</label>
              <div className="flex gap-2 flex-wrap">
                {SLOT_OPTIONS.map(s => (
                  <button key={s}
                    onClick={() => setSettings(st => ({ ...st, slotMinutes: s }))}
                    className={cn('px-3 py-1 rounded-lg text-xs font-semibold border transition-all',
                      settings.slotMinutes === s
                        ? 'bg-primary/15 text-primary border-primary/30'
                        : 'bg-muted/40 text-muted-foreground border-border hover:text-foreground'
                    )}
                  >
                    {s < 60 ? `${s} min` : `${s / 60}h`}
                  </button>
                ))}
              </div>
            </div>
          </SettingBlock>

          {/* Anticipación */}
          <SettingBlock title="Reglas de anticipación">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-muted-foreground mb-1">Días máx. anticipación</label>
                <input type="number" min={1} max={365} value={settings.maxAdvanceDays}
                  onChange={e => setSettings(s => ({ ...s, maxAdvanceDays: Number(e.target.value) }))}
                  className="w-full bg-muted/40 border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs text-muted-foreground mb-1">Horas mín. anticipación</label>
                <input type="number" min={0} max={72} value={settings.minAdvanceHours}
                  onChange={e => setSettings(s => ({ ...s, minAdvanceHours: Number(e.target.value) }))}
                  className="w-full bg-muted/40 border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none"
                />
              </div>
            </div>
          </SettingBlock>

          {/* Ocasiones */}
          <SettingBlock title="Ocasiones disponibles">
            <div className="flex flex-wrap gap-2 mb-3">
              {settings.occasions.map(occ => (
                <span key={occ} className="flex items-center gap-1 bg-primary/10 text-primary border border-primary/20 text-xs font-semibold px-2 py-1 rounded-full">
                  {occ}
                  <button onClick={() => removeOccasion(occ)} className="hover:text-destructive ml-0.5">
                    <Trash2 className="h-3 w-3" />
                  </button>
                </span>
              ))}
              {settings.occasions.length === 0 && (
                <p className="text-xs text-muted-foreground">Sin ocasiones configuradas</p>
              )}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Ej: Cumpleaños"
                value={newOccasion}
                onChange={e => setNewOccasion(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addOccasion()}
                className="flex-1 bg-muted/40 border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none"
              />
              <button onClick={addOccasion}
                className="flex items-center gap-1 px-3 py-2 bg-primary/10 text-primary border border-primary/20 rounded-lg text-sm hover:bg-primary/20"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
          </SettingBlock>

          {/* Link compartible */}
          {reservationLink && (
            <SettingBlock title="Link de reservas">
              <p className="text-xs text-muted-foreground mb-2">Comparte este link en tu página de contacto</p>
              <div className="flex items-center gap-2 bg-muted/40 border border-border rounded-lg px-3 py-2">
                <p className="flex-1 text-xs text-foreground font-mono truncate">{reservationLink}</p>
                <button onClick={copyLink} className="shrink-0 text-muted-foreground hover:text-primary">
                  <Copy className="h-4 w-4" />
                </button>
              </div>
            </SettingBlock>
          )}

          <button
            onClick={saveSettings}
            disabled={savingSettings}
            className="w-full flex items-center justify-center gap-2 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-semibold hover:bg-primary/90 disabled:opacity-50"
          >
            {savingSettings ? 'Guardando…' : 'Guardar configuración'}
          </button>
        </div>
      )}

      {/* Modal cancelar */}
      {cancelId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
          <div className="bg-card border border-border rounded-2xl p-6 w-full max-w-sm space-y-4">
            <h3 className="font-bold text-foreground">Cancelar reserva</h3>
            <textarea
              placeholder="Motivo de cancelación (opcional)"
              rows={3}
              value={cancelReason}
              onChange={e => setCancelReason(e.target.value)}
              className="w-full bg-muted/40 border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none resize-none"
            />
            <div className="flex gap-3">
              <button onClick={() => setCancelId(null)} className="flex-1 py-2 rounded-lg bg-muted/40 text-muted-foreground text-sm font-semibold hover:bg-muted/60">
                Volver
              </button>
              <button onClick={handleCancel} className="flex-1 py-2 rounded-lg bg-destructive/10 text-destructive border border-destructive/20 text-sm font-semibold hover:bg-destructive/20">
                Cancelar reserva
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function SettingBlock({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-card border border-border rounded-xl p-4 space-y-3">
      <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">{title}</p>
      {children}
    </div>
  )
}

function InfoItem({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
      <span className="shrink-0 text-foreground/40">{icon}</span>
      <span className="truncate">{text}</span>
    </div>
  )
}
