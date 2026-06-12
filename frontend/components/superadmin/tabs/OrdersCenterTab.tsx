'use client'

import { useState } from 'react'
import {
  useOrders, getSlaColor,
  type SuperadminOrder, type OrderFilters,
} from '../hooks/useOrders'
import { KanbanView } from '../shared/KanbanView'
import {
  RefreshCw, Search, X, ChevronLeft, ChevronRight,
  User, MapPin, Phone, Mail, Package, Clock,
  ShoppingBag, CheckCircle, Truck, XCircle, AlertTriangle,
  LayoutGrid, List, CheckSquare, Square, UserCheck, Ban, Zap, Loader2,
} from 'lucide-react'
import Image from 'next/image'

// ── Status config ─────────────────────────────────────────────────────────────

const STATUS_LABEL: Record<string, string> = {
  pendiente:  'Pendiente',
  confirmado: 'Confirmado',
  preparando: 'Preparando',
  enviado:    'En camino',
  entregado:  'Entregado',
  cancelado:  'Cancelado',
}

const STATUS_COLOR: Record<string, string> = {
  pendiente:  'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
  confirmado: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
  preparando: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
  enviado:    'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300',
  entregado:  'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
  cancelado:  'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
}

// Left border color for table rows
const ROW_BORDER: Record<string, string> = {
  pendiente:  'border-l-4 border-l-yellow-400',
  confirmado: 'border-l-4 border-l-blue-400',
  preparando: 'border-l-4 border-l-purple-400',
  enviado:    'border-l-4 border-l-indigo-400',
  entregado:  'border-l-4 border-l-green-400',
  cancelado:  'border-l-4 border-l-red-400',
}

const NEXT_STATES: Record<string, string[]> = {
  pendiente:  ['confirmado', 'cancelado'],
  confirmado: ['preparando', 'cancelado'],
  preparando: ['enviado',    'cancelado'],
  enviado:    ['entregado',  'cancelado'],
  entregado:  [],
  cancelado:  [],
}

const SLA_COLORS = {
  green:  'bg-green-500',
  yellow: 'bg-yellow-400',
  red:    'bg-red-500',
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function SlaDot({ createdAt, status }: { createdAt: string; status: string }) {
  if (status === 'entregado' || status === 'cancelado') return null
  const color = getSlaColor(createdAt)
  return (
    <span
      title={color === 'green' ? '<10 min' : color === 'yellow' ? '10–30 min' : '>30 min'}
      className={`inline-block h-2.5 w-2.5 rounded-full flex-shrink-0 ${SLA_COLORS[color]}`}
    />
  )
}

function StatusChip({ status }: { status: string }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLOR[status] ?? 'bg-muted text-muted-foreground'}`}>
      {STATUS_LABEL[status] ?? status}
    </span>
  )
}

function paymentLabel(method: string | null) {
  if (!method) return 'Contraentrega'
  if (method.startsWith('Factura:')) return 'Factura'
  return method.charAt(0).toUpperCase() + method.slice(1)
}

function fmt(n: number) {
  return `$${n.toLocaleString('es-CO')}`
}

function timeAgo(iso: string) {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000)
  if (diff < 60)    return `${diff}s`
  if (diff < 3600)  return `${Math.floor(diff / 60)}min`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`
  return `${Math.floor(diff / 86400)}d`
}

function timeAgoColored(iso: string, status: string) {
  if (status === 'entregado' || status === 'cancelado') {
    return <span className="text-xs text-muted-foreground">{timeAgo(iso)}</span>
  }
  const color = getSlaColor(iso)
  const cls = color === 'green' ? 'text-green-500' : color === 'yellow' ? 'text-yellow-500 font-semibold' : 'text-red-500 font-bold animate-pulse'
  return <span className={`text-xs ${cls}`}>{timeAgo(iso)}</span>
}

// ── Filter bar ────────────────────────────────────────────────────────────────

function FilterBar({
  filters,
  onChange,
  onSearch,
  tenantsList,
}: {
  filters: OrderFilters
  onChange: (f: Partial<OrderFilters>) => void
  onSearch: () => void
  tenantsList: { id: string; name: string }[]
}) {
  const hasFilters = !!(filters.search || filters.status || filters.assigned || filters.dateFrom || filters.dateTo || filters.tenantId)
  return (
    <div className="flex flex-wrap gap-2 items-end">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
        <input
          value={filters.search}
          onChange={e => onChange({ search: e.target.value })}
          onKeyDown={e => e.key === 'Enter' && onSearch()}
          placeholder="Pedido, cliente, teléfono…"
          className="h-9 pl-8 pr-3 text-sm rounded-md border border-input bg-background w-48 focus:outline-none focus:ring-2 focus:ring-ring"
        />
      </div>

      {/* Commerce */}
      {tenantsList.length > 0 && (
        <select
          value={filters.tenantId}
          onChange={e => { onChange({ tenantId: e.target.value }); onSearch() }}
          className="h-9 px-2 text-sm rounded-md border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring max-w-[160px]"
        >
          <option value="">Todos los comercios</option>
          {tenantsList.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
        </select>
      )}

      {/* Status */}
      <select
        value={filters.status}
        onChange={e => { onChange({ status: e.target.value }); onSearch() }}
        className="h-9 px-2 text-sm rounded-md border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring"
      >
        <option value="">Todos los estados</option>
        {Object.entries(STATUS_LABEL).map(([v, l]) => (
          <option key={v} value={v}>{l}</option>
        ))}
      </select>

      {/* Assigned */}
      <select
        value={filters.assigned}
        onChange={e => { onChange({ assigned: e.target.value }); onSearch() }}
        className="h-9 px-2 text-sm rounded-md border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring"
      >
        <option value="">Todos los asignados</option>
        <option value="me">Mis pedidos</option>
        <option value="unassigned">Sin asignar</option>
      </select>

      {/* Date range */}
      <input type="date" value={filters.dateFrom}
        onChange={e => { onChange({ dateFrom: e.target.value }); onSearch() }}
        className="h-9 px-2 text-sm rounded-md border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring" />
      <span className="text-muted-foreground text-sm self-center">—</span>
      <input type="date" value={filters.dateTo}
        onChange={e => { onChange({ dateTo: e.target.value }); onSearch() }}
        className="h-9 px-2 text-sm rounded-md border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring" />

      <button onClick={onSearch}
        className="h-9 px-4 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors">
        Buscar
      </button>

      {hasFilters && (
        <button
          onClick={() => { onChange({ search: '', status: '', assigned: '', dateFrom: '', dateTo: '', tenantId: '' }); onSearch() }}
          className="h-9 px-3 rounded-md border border-input text-sm text-muted-foreground hover:text-foreground flex items-center gap-1">
          <X className="h-3.5 w-3.5" /> Limpiar
        </button>
      )}
    </div>
  )
}

// ── Order row ─────────────────────────────────────────────────────────────────

function OrderRow({
  order,
  selected,
  onSelect,
  onView,
  onChangeStatus,
  onAssign,
}: {
  order: SuperadminOrder
  selected: boolean
  onSelect: () => void
  onView: () => void
  onChangeStatus: () => void
  onAssign: () => void
}) {
  return (
    <tr className={`border-b border-border hover:bg-muted/30 transition-colors ${ROW_BORDER[order.status] ?? ''}`}>
      {/* Checkbox */}
      <td className="px-2 py-3">
        <button onClick={onSelect} className="text-muted-foreground hover:text-foreground">
          {selected
            ? <CheckSquare className="h-4 w-4 text-primary" />
            : <Square className="h-4 w-4" />
          }
        </button>
      </td>
      <td className="px-3 py-3">
        <div className="flex items-center gap-2">
          <SlaDot createdAt={order.createdAt} status={order.status} />
          <button onClick={onView} className="font-mono text-xs text-primary hover:underline">
            {order.orderNumber}
          </button>
        </div>
        <div className="mt-0.5">{timeAgoColored(order.createdAt, order.status)}</div>
      </td>
      <td className="px-3 py-3">
        <div className="flex items-center gap-1.5">
          {order.commerceLogo ? (
            <Image src={order.commerceLogo} alt="" width={20} height={20} className="rounded-sm object-cover" />
          ) : (
            <ShoppingBag className="h-4 w-4 text-muted-foreground" />
          )}
          <span className="text-sm font-medium truncate max-w-[120px]">{order.commerceName}</span>
        </div>
      </td>
      <td className="px-3 py-3">
        <div className="text-sm font-medium">{order.customerName}</div>
        <div className="text-xs text-muted-foreground">{order.customerPhone}</div>
      </td>
      <td className="px-3 py-3"><StatusChip status={order.status} /></td>
      <td className="px-3 py-3 text-sm font-semibold">{fmt(order.total)}</td>
      <td className="px-3 py-3">
        <div className="text-xs">
          {order.assignedName
            ? <span className="text-foreground font-medium">{order.assignedName}</span>
            : <span className="text-orange-500 italic">Sin asignar</span>
          }
        </div>
      </td>
      <td className="px-3 py-3">
        <div className="flex items-center gap-1">
          <button onClick={onView} className="px-2 py-1 text-xs rounded-md border border-input hover:bg-muted">Ver</button>
          {NEXT_STATES[order.status]?.length > 0 && (
            <button onClick={onChangeStatus} className="px-2 py-1 text-xs rounded-md border border-input hover:bg-muted">Estado</button>
          )}
          <button onClick={onAssign} className="px-2 py-1 text-xs rounded-md border border-input hover:bg-muted">
            {order.assignedTo ? 'Desasignar' : 'Asignarme'}
          </button>
        </div>
      </td>
    </tr>
  )
}

// ── Detail drawer ─────────────────────────────────────────────────────────────

function DetailDrawer({
  order, items, history, isLoading, drivers, isLoadingDrivers,
  onClose, onChangeStatus, onAssign, onAssignToDriver,
}: {
  order: SuperadminOrder
  items: ReturnType<typeof useOrders>['drawerItems']
  history: ReturnType<typeof useOrders>['drawerHistory']
  isLoading: boolean
  drivers: ReturnType<typeof useOrders>['drawerDrivers']
  isLoadingDrivers: boolean
  onClose: () => void
  onChangeStatus: () => void
  onAssign: () => void
  onAssignToDriver: (driverId: string, driverName: string) => void
}) {
  const [showDrivers, setShowDrivers] = useState(false)

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative z-10 w-full max-w-lg bg-background shadow-2xl flex flex-col h-full overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border sticky top-0 bg-background z-10">
          <div>
            <div className="flex items-center gap-2">
              <SlaDot createdAt={order.createdAt} status={order.status} />
              <span className="font-semibold text-base">{order.orderNumber}</span>
              <StatusChip status={order.status} />
            </div>
            <div className="text-xs text-muted-foreground mt-0.5">
              {order.commerceName} · {new Date(order.createdAt).toLocaleString('es-CO')}
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-md hover:bg-muted">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-5 space-y-5 flex-1">
          {/* Customer */}
          <section>
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Cliente</h3>
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm"><User className="h-3.5 w-3.5 text-muted-foreground" />{order.customerName}</div>
              <div className="flex items-center gap-2 text-sm"><Phone className="h-3.5 w-3.5 text-muted-foreground" />{order.customerPhone}</div>
              {order.customerEmail && <div className="flex items-center gap-2 text-sm"><Mail className="h-3.5 w-3.5 text-muted-foreground" />{order.customerEmail}</div>}
              {(order.address || order.municipality) && (
                <div className="flex items-start gap-2 text-sm">
                  <MapPin className="h-3.5 w-3.5 text-muted-foreground mt-0.5 flex-shrink-0" />
                  <span>{[order.address, order.neighborhood, order.municipality, order.department].filter(Boolean).join(', ')}</span>
                </div>
              )}
            </div>
          </section>

          {/* Items */}
          <section>
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Productos</h3>
            {isLoading ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <RefreshCw className="h-3.5 w-3.5 animate-spin" /> Cargando…
              </div>
            ) : items.length === 0 ? (
              <p className="text-sm text-muted-foreground italic">Sin ítems</p>
            ) : (
              <div className="space-y-2">
                {items.map(item => (
                  <div key={item.id} className="flex items-center gap-3 rounded-lg border border-border p-2.5">
                    {item.productImage ? (
                      <Image src={item.productImage} alt={item.productName} width={40} height={40} className="rounded-md object-cover flex-shrink-0" />
                    ) : (
                      <div className="h-10 w-10 rounded-md bg-muted flex items-center justify-center flex-shrink-0">
                        <Package className="h-4 w-4 text-muted-foreground" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">{item.productName}</div>
                      <div className="text-xs text-muted-foreground">
                        {item.quantity} × {fmt(item.unitPrice)}
                        {item.size && ` · Talla ${item.size}`}
                        {item.color && ` · ${item.color}`}
                      </div>
                    </div>
                    <div className="text-sm font-semibold flex-shrink-0">{fmt(item.totalPrice)}</div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Totals */}
          <section className="rounded-lg border border-border p-3 space-y-1 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>{fmt(order.subtotal)}</span></div>
            {order.shippingCost > 0 && <div className="flex justify-between"><span className="text-muted-foreground">Envío</span><span>{fmt(order.shippingCost)}</span></div>}
            {order.discount > 0 && <div className="flex justify-between text-green-600"><span>Descuento</span><span>−{fmt(order.discount)}</span></div>}
            <div className="flex justify-between font-semibold text-base border-t border-border pt-1 mt-1">
              <span>Total</span><span>{fmt(order.total)}</span>
            </div>
            <div className="text-xs text-muted-foreground">{paymentLabel(order.paymentMethod)}</div>
          </section>

          {/* Notes */}
          {order.notes && (
            <section>
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Notas</h3>
              <p className="text-sm bg-muted rounded-md p-2">{order.notes}</p>
            </section>
          )}

          {/* Quick assign — repartidores */}
          <section>
            <button
              onClick={() => setShowDrivers(v => !v)}
              className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 flex items-center gap-1.5 hover:text-foreground transition-colors"
            >
              <Truck className="h-3.5 w-3.5" />
              Asignar Repartidor
              <ChevronRight className={`h-3 w-3 transition-transform ${showDrivers ? 'rotate-90' : ''}`} />
            </button>
            {showDrivers && (
              <div className="space-y-1.5">
                {isLoadingDrivers ? (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" /> Cargando repartidores…
                  </div>
                ) : drivers.length === 0 ? (
                  <p className="text-xs text-muted-foreground italic">Sin repartidores activos en este comercio</p>
                ) : (
                  drivers.map(d => (
                    <div key={d.id} className="flex items-center justify-between rounded-lg border border-border p-2.5 hover:bg-muted/50">
                      <div>
                        <div className="text-sm font-medium">{d.name}</div>
                        <div className="text-xs text-muted-foreground">{d.phone || d.email}</div>
                      </div>
                      <button
                        onClick={() => onAssignToDriver(d.id, d.name)}
                        disabled={order.assignedTo === d.id}
                        className="px-2 py-1 text-xs rounded-md bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
                      >
                        {order.assignedTo === d.id ? 'Asignado' : 'Asignar'}
                      </button>
                    </div>
                  ))
                )}
              </div>
            )}
          </section>

          {/* Status history */}
          {!isLoading && history.length > 0 && (
            <section>
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Historial de estados</h3>
              <ol className="relative border-l border-border ml-2 space-y-3">
                {history.map((h, i) => (
                  <li key={i} className="pl-4 relative">
                    <span className="absolute -left-1 top-1 h-2 w-2 rounded-full bg-primary" />
                    <div className="text-xs">
                      <span className="font-medium">{STATUS_LABEL[h.toStatus] ?? h.toStatus}</span>
                      <span className="text-muted-foreground"> · {h.changedByName}</span>
                    </div>
                    {h.note && <p className="text-xs text-muted-foreground italic">{h.note}</p>}
                    <div className="text-xs text-muted-foreground">{new Date(h.createdAt).toLocaleString('es-CO')}</div>
                  </li>
                ))}
              </ol>
            </section>
          )}
        </div>

        {/* Footer actions */}
        <div className="px-5 py-4 border-t border-border flex gap-2 sticky bottom-0 bg-background">
          {NEXT_STATES[order.status]?.length > 0 && (
            <button onClick={onChangeStatus}
              className="flex-1 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors">
              Cambiar estado
            </button>
          )}
          <button onClick={onAssign}
            className="flex-1 py-2 rounded-md border border-input text-sm font-medium hover:bg-muted transition-colors">
            {order.assignedTo ? 'Desasignar' : 'Asignarme'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Status change dialog ──────────────────────────────────────────────────────

function StatusDialog({
  order, newStatus, note, isSaving,
  onStatusChange, onNoteChange, onSave, onClose,
}: {
  order: SuperadminOrder; newStatus: string; note: string; isSaving: boolean
  onStatusChange: (s: string) => void; onNoteChange: (n: string) => void
  onSave: () => void; onClose: () => void
}) {
  const options = NEXT_STATES[order.status] ?? []
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative z-10 bg-background rounded-xl shadow-xl w-full max-w-md p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-lg">Cambiar estado</h2>
          <button onClick={onClose} className="p-1.5 rounded-md hover:bg-muted"><X className="h-4 w-4" /></button>
        </div>
        <div>
          <div className="text-sm text-muted-foreground mb-1">Pedido: <span className="font-mono font-medium text-foreground">{order.orderNumber}</span></div>
          <div className="text-sm text-muted-foreground">Estado actual: <StatusChip status={order.status} /></div>
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium">Nuevo estado</label>
          <div className="flex gap-2 flex-wrap">
            {options.map(s => (
              <button key={s} onClick={() => onStatusChange(s)}
                className={`px-3 py-1.5 rounded-md text-sm font-medium border transition-colors ${
                  newStatus === s ? 'bg-primary text-primary-foreground border-primary' : 'border-input hover:bg-muted'
                }`}>
                {STATUS_LABEL[s]}
              </button>
            ))}
          </div>
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium">Nota (opcional)</label>
          <textarea value={note} onChange={e => onNoteChange(e.target.value)} rows={2}
            placeholder="Motivo de cancelación, observación…"
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring" />
        </div>
        <div className="flex gap-2 justify-end">
          <button onClick={onClose} className="px-4 py-2 rounded-md border border-input text-sm hover:bg-muted">Cancelar</button>
          <button onClick={onSave} disabled={!newStatus || isSaving}
            className="px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-50 flex items-center gap-2">
            {isSaving && <RefreshCw className="h-3.5 w-3.5 animate-spin" />}
            Guardar
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Bulk action toolbar ───────────────────────────────────────────────────────

function BulkToolbar({
  count, onClear, onBulkStatus, onBulkAssign, onBulkCancel, isProcessing,
}: {
  count: number; onClear: () => void; onBulkStatus: (s: string) => void
  onBulkAssign: () => void; onBulkCancel: () => void; isProcessing: boolean
}) {
  const [showStatusPicker, setShowStatusPicker] = useState(false)
  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-background border border-border rounded-xl shadow-2xl px-4 py-3 flex items-center gap-3">
      <span className="text-sm font-semibold text-primary">{count} seleccionados</span>
      <div className="h-4 w-px bg-border" />
      <button onClick={onBulkAssign} disabled={isProcessing}
        className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-md border border-input hover:bg-muted disabled:opacity-50">
        <UserCheck className="h-3.5 w-3.5" /> Asignarme
      </button>
      <div className="relative">
        <button onClick={() => setShowStatusPicker(v => !v)} disabled={isProcessing}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-md border border-input hover:bg-muted disabled:opacity-50">
          <Zap className="h-3.5 w-3.5" /> Cambiar estado
        </button>
        {showStatusPicker && (
          <div className="absolute bottom-full mb-2 left-0 bg-background border border-border rounded-lg shadow-xl p-2 space-y-1 w-36">
            {['confirmado', 'preparando', 'enviado', 'entregado'].map(s => (
              <button key={s} onClick={() => { onBulkStatus(s); setShowStatusPicker(false) }}
                className="w-full text-left px-3 py-1.5 text-xs rounded-md hover:bg-muted">
                {STATUS_LABEL[s]}
              </button>
            ))}
          </div>
        )}
      </div>
      <button onClick={onBulkCancel} disabled={isProcessing}
        className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-md border border-red-200 text-red-600 hover:bg-red-50 disabled:opacity-50">
        <Ban className="h-3.5 w-3.5" /> Cancelar
      </button>
      {isProcessing && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
      <button onClick={onClear} className="p-1 rounded-md hover:bg-muted text-muted-foreground">
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  )
}

// ── Main tab ──────────────────────────────────────────────────────────────────

export function OrdersCenterTab() {
  const {
    orders, isLoading, total, page, LIMIT, fetchOrders,
    filters, setFilters, tenantsList,
    summary, priorityStats,
    viewMode, setViewMode,
    selectedOrder, drawerOpen, drawerItems, drawerHistory, isLoadingDrawer,
    drawerDrivers, isLoadingDrivers,
    openDrawer, closeDrawer,
    changingStatusOrder, newStatus, setNewStatus, statusNote, setStatusNote,
    isSavingStatus, openStatusDialog, closeStatusDialog, handleSaveStatus,
    handleKanbanStatusChange,
    handleAssignToMe, handleAssignToDriver,
    selectedIds, toggleSelect, selectAll, clearSelection,
    isBulkProcessing, handleBulkStatusChange, handleBulkAssignToMe, handleBulkCancel,
  } = useOrders()

  const totalPages = Math.ceil(total / LIMIT)
  const [pendingStatusFromDrawer, setPendingStatusFromDrawer] = useState(false)

  const hasRetrasados  = priorityStats.retrasados > 0
  const hasSinAsignar  = priorityStats.sinAsignar > 0
  const showAlertBanner = (hasRetrasados || hasSinAsignar) && orders.length > 0

  return (
    <div className="space-y-5">
      {/* Alert banner */}
      {showAlertBanner && (
        <div className="flex items-center gap-3 rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/30 px-4 py-2.5 text-sm">
          <AlertTriangle className="h-4 w-4 text-red-500 flex-shrink-0" />
          <span className="text-red-700 dark:text-red-400">
            {hasRetrasados && <><strong>{priorityStats.retrasados}</strong> pedido(s) con más de 30 min sin resolverse</>}
            {hasRetrasados && hasSinAsignar && ' · '}
            {hasSinAsignar && <><strong>{priorityStats.sinAsignar}</strong> pedido(s) sin asignar</>}
          </span>
          <button
            onClick={() => { setFilters(f => ({ ...f, assigned: 'unassigned' })); fetchOrders(1) }}
            className="ml-auto text-xs text-red-600 hover:text-red-800 underline">
            Ver sin asignar →
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-lg flex items-center gap-2">
            <ShoppingBag className="h-5 w-5 text-primary" />
            Centro de Pedidos
          </h3>
          <p className="text-xs text-muted-foreground">Vista unificada · SSE en tiempo real</p>
        </div>
        <div className="flex items-center gap-2">
          {/* View toggle */}
          <div className="flex items-center rounded-md border border-input overflow-hidden">
            <button
              onClick={() => setViewMode('table')}
              className={`px-3 py-1.5 text-sm flex items-center gap-1.5 transition-colors ${viewMode === 'table' ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'}`}
            >
              <List className="h-4 w-4" /> Tabla
            </button>
            <button
              onClick={() => setViewMode('kanban')}
              className={`px-3 py-1.5 text-sm flex items-center gap-1.5 transition-colors ${viewMode === 'kanban' ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'}`}
            >
              <LayoutGrid className="h-4 w-4" /> Kanban
            </button>
          </div>
          <button
            onClick={() => fetchOrders(page)}
            disabled={isLoading}
            className="p-2 rounded-md border border-input hover:bg-muted transition-colors" title="Actualizar">
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
        {[
          { key: 'pendiente',  label: 'Pendientes',  icon: Clock,       color: 'text-yellow-500' },
          { key: 'confirmado', label: 'Confirmados', icon: CheckCircle, color: 'text-blue-500' },
          { key: 'preparando', label: 'Preparando',  icon: Package,     color: 'text-purple-500' },
          { key: 'enviado',    label: 'En camino',   icon: Truck,       color: 'text-indigo-500' },
          { key: 'entregado',  label: 'Entregados',  icon: CheckCircle, color: 'text-green-500' },
          { key: 'cancelado',  label: 'Cancelados',  icon: XCircle,     color: 'text-red-500' },
        ].map(({ key, label, icon: Icon, color }) => (
          <button key={key}
            onClick={() => { setFilters(f => ({ ...f, status: f.status === key ? '' : key })); fetchOrders(1) }}
            className={`flex flex-col items-center gap-1 p-2 rounded-lg border transition-all ${
              filters.status === key ? 'border-primary bg-primary/5' : 'border-border hover:bg-muted'
            }`}>
            <Icon className={`h-4 w-4 ${color}`} />
            <span className="text-lg font-bold leading-none">{summary[key as keyof typeof summary]}</span>
            <span className="text-[10px] text-muted-foreground">{label}</span>
          </button>
        ))}
      </div>

      {/* Priority sub-stats */}
      {orders.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => { setFilters(f => ({ ...f, assigned: 'unassigned' })); fetchOrders(1) }}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs border transition-colors ${
              priorityStats.sinAsignar > 0 ? 'border-orange-300 bg-orange-50 text-orange-700 dark:bg-orange-950/30 dark:text-orange-400 hover:bg-orange-100' : 'border-border text-muted-foreground'
            }`}>
            <span className="font-semibold">{priorityStats.sinAsignar}</span> sin asignar
          </button>
          <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs border ${
            priorityStats.retrasados > 0 ? 'border-red-300 bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-400' : 'border-border text-muted-foreground'
          }`}>
            <span className="font-semibold">{priorityStats.retrasados}</span> retrasados &gt;30min
          </div>
          {priorityStats.enRiesgo > 0 && (
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs border border-yellow-300 bg-yellow-50 text-yellow-700 dark:bg-yellow-950/30 dark:text-yellow-400">
              <span className="font-semibold">{priorityStats.enRiesgo}</span> en riesgo 10–30min
            </div>
          )}
        </div>
      )}

      {/* Filters */}
      <FilterBar
        filters={filters}
        onChange={partial => setFilters(f => ({ ...f, ...partial }))}
        onSearch={() => fetchOrders(1)}
        tenantsList={tenantsList}
      />

      {/* Kanban or Table */}
      {viewMode === 'kanban' ? (
        <KanbanView
          orders={orders}
          onView={openDrawer}
          onStatusChange={handleKanbanStatusChange}
        />
      ) : (
        <>
          {/* Select all bar */}
          {orders.length > 0 && (
            <div className="flex items-center gap-3 px-1">
              <button onClick={selectedIds.size === orders.length ? clearSelection : selectAll}
                className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground">
                {selectedIds.size === orders.length
                  ? <CheckSquare className="h-3.5 w-3.5 text-primary" />
                  : <Square className="h-3.5 w-3.5" />
                }
                {selectedIds.size === 0 ? 'Seleccionar todo' : `${selectedIds.size} seleccionados`}
              </button>
              {selectedIds.size > 0 && (
                <button onClick={clearSelection} className="text-xs text-muted-foreground hover:text-foreground">Limpiar</button>
              )}
            </div>
          )}

          {/* Table */}
          <div className="rounded-lg border border-border overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-border bg-muted/50">
                <tr>
                  <th className="px-2 py-2.5 w-8" />
                  <th className="px-3 py-2.5 text-left text-xs font-semibold text-muted-foreground">Pedido</th>
                  <th className="px-3 py-2.5 text-left text-xs font-semibold text-muted-foreground">Comercio</th>
                  <th className="px-3 py-2.5 text-left text-xs font-semibold text-muted-foreground">Cliente</th>
                  <th className="px-3 py-2.5 text-left text-xs font-semibold text-muted-foreground">Estado</th>
                  <th className="px-3 py-2.5 text-left text-xs font-semibold text-muted-foreground">Total</th>
                  <th className="px-3 py-2.5 text-left text-xs font-semibold text-muted-foreground">Asignado</th>
                  <th className="px-3 py-2.5 text-left text-xs font-semibold text-muted-foreground">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr><td colSpan={8} className="py-12 text-center text-muted-foreground">
                    <RefreshCw className="h-5 w-5 animate-spin mx-auto mb-2" />Cargando pedidos…
                  </td></tr>
                ) : orders.length === 0 ? (
                  <tr><td colSpan={8} className="py-12 text-center text-muted-foreground">
                    <AlertTriangle className="h-5 w-5 mx-auto mb-2 opacity-50" />No hay pedidos con esos filtros
                  </td></tr>
                ) : (
                  orders.map(order => (
                    <OrderRow
                      key={order.id}
                      order={order}
                      selected={selectedIds.has(order.id)}
                      onSelect={() => toggleSelect(order.id)}
                      onView={() => openDrawer(order)}
                      onChangeStatus={() => openStatusDialog(order)}
                      onAssign={() => handleAssignToMe(order)}
                    />
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">{total} pedidos · página {page} de {totalPages}</span>
              <div className="flex gap-1">
                <button onClick={() => fetchOrders(page - 1)} disabled={page <= 1 || isLoading}
                  className="p-1.5 rounded-md border border-input hover:bg-muted disabled:opacity-40">
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button onClick={() => fetchOrders(page + 1)} disabled={page >= totalPages || isLoading}
                  className="p-1.5 rounded-md border border-input hover:bg-muted disabled:opacity-40">
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Bulk toolbar */}
      {selectedIds.size > 0 && (
        <BulkToolbar
          count={selectedIds.size}
          onClear={clearSelection}
          onBulkStatus={handleBulkStatusChange}
          onBulkAssign={handleBulkAssignToMe}
          onBulkCancel={handleBulkCancel}
          isProcessing={isBulkProcessing}
        />
      )}

      {/* Detail drawer */}
      {drawerOpen && selectedOrder && (
        <DetailDrawer
          order={selectedOrder}
          items={drawerItems}
          history={drawerHistory}
          isLoading={isLoadingDrawer}
          drivers={drawerDrivers}
          isLoadingDrivers={isLoadingDrivers}
          onClose={closeDrawer}
          onChangeStatus={() => { openStatusDialog(selectedOrder); setPendingStatusFromDrawer(true) }}
          onAssign={() => handleAssignToMe(selectedOrder)}
          onAssignToDriver={(dId, dName) => handleAssignToDriver(selectedOrder.id, dId, dName)}
        />
      )}

      {/* Status change dialog */}
      {changingStatusOrder && (
        <StatusDialog
          order={changingStatusOrder}
          newStatus={newStatus}
          note={statusNote}
          isSaving={isSavingStatus}
          onStatusChange={setNewStatus}
          onNoteChange={setStatusNote}
          onSave={async () => { await handleSaveStatus(); setPendingStatusFromDrawer(false) }}
          onClose={() => { closeStatusDialog(); setPendingStatusFromDrawer(false) }}
        />
      )}
    </div>
  )
}
