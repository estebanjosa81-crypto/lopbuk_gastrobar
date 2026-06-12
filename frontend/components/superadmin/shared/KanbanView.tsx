'use client'

import { useState } from 'react'
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
  useDroppable,
  useDraggable,
} from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'
import type { SuperadminOrder } from '../hooks/useOrders'
import { getSlaColor } from '../hooks/useOrders'
import {
  Clock, CheckCircle, Package, Truck, XCircle, ShoppingBag,
} from 'lucide-react'

// ── Status config ─────────────────────────────────────────────────────────────

const STATUS_COLUMNS = [
  { key: 'pendiente',  label: 'Pendientes',  icon: Clock,        border: 'border-t-yellow-400',  bg: 'bg-yellow-50 dark:bg-yellow-900/10',  count_color: 'text-yellow-600 dark:text-yellow-400' },
  { key: 'confirmado', label: 'Confirmados', icon: CheckCircle,  border: 'border-t-blue-400',    bg: 'bg-blue-50 dark:bg-blue-900/10',      count_color: 'text-blue-600 dark:text-blue-400' },
  { key: 'preparando', label: 'Preparando',  icon: Package,      border: 'border-t-purple-400',  bg: 'bg-purple-50 dark:bg-purple-900/10',  count_color: 'text-purple-600 dark:text-purple-400' },
  { key: 'enviado',    label: 'En camino',   icon: Truck,        border: 'border-t-indigo-400',  bg: 'bg-indigo-50 dark:bg-indigo-900/10',  count_color: 'text-indigo-600 dark:text-indigo-400' },
  { key: 'entregado',  label: 'Entregados',  icon: CheckCircle,  border: 'border-t-green-400',   bg: 'bg-green-50 dark:bg-green-900/10',    count_color: 'text-green-600 dark:text-green-400' },
  { key: 'cancelado',  label: 'Cancelados',  icon: XCircle,      border: 'border-t-red-400',     bg: 'bg-red-50 dark:bg-red-900/10',        count_color: 'text-red-600 dark:text-red-400' },
]

const VALID_TRANSITIONS: Record<string, string[]> = {
  pendiente:  ['confirmado', 'cancelado'],
  confirmado: ['preparando', 'cancelado'],
  preparando: ['enviado',    'cancelado'],
  enviado:    ['entregado',  'cancelado'],
  entregado:  [],
  cancelado:  [],
}

const SLA_DOT: Record<string, string> = {
  green:  'bg-green-500',
  yellow: 'bg-yellow-400',
  red:    'bg-red-500',
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

// ── Draggable card ────────────────────────────────────────────────────────────

function KanbanCard({
  order,
  onView,
  isDragOverlay = false,
}: {
  order: SuperadminOrder
  onView: () => void
  isDragOverlay?: boolean
}) {
  const sla = getSlaColor(order.createdAt)
  const isTerminal = order.status === 'entregado' || order.status === 'cancelado'
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: order.id,
    data: { status: order.status },
    disabled: isTerminal,
  })

  const style = transform ? { transform: CSS.Translate.toString(transform) } : undefined

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...(isTerminal ? {} : listeners)}
      {...(isTerminal ? {} : attributes)}
      className={`
        rounded-lg border border-border bg-background p-3 space-y-2 text-sm
        ${isDragging ? 'opacity-40 cursor-grabbing' : isTerminal ? 'cursor-default' : 'cursor-grab hover:shadow-md'}
        ${isDragOverlay ? 'shadow-2xl rotate-1 scale-105' : ''}
        transition-all duration-150
      `}
    >
      {/* Header row */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-1.5 min-w-0">
          {!isTerminal && (
            <span className={`inline-block h-2 w-2 rounded-full flex-shrink-0 ${SLA_DOT[sla]}`} />
          )}
          <button
            onClick={(e) => { e.stopPropagation(); onView() }}
            className="font-mono text-xs text-primary hover:underline truncate"
          >
            {order.orderNumber}
          </button>
        </div>
        <span className="text-xs text-muted-foreground flex-shrink-0">{timeAgo(order.createdAt)}</span>
      </div>

      {/* Commerce */}
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <ShoppingBag className="h-3 w-3 flex-shrink-0" />
        <span className="truncate">{order.commerceName}</span>
      </div>

      {/* Customer */}
      <div className="text-xs font-medium truncate">{order.customerName}</div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-1 border-t border-border/50">
        <span className="text-xs font-semibold">{fmt(order.total)}</span>
        {order.assignedName
          ? <span className="text-[10px] text-muted-foreground truncate max-w-[80px]">{order.assignedName}</span>
          : <span className="text-[10px] text-orange-500 italic">Sin asignar</span>
        }
      </div>
    </div>
  )
}

// ── Droppable column ──────────────────────────────────────────────────────────

function KanbanColumn({
  col,
  orders,
  isOver,
  onView,
}: {
  col: typeof STATUS_COLUMNS[number]
  orders: SuperadminOrder[]
  isOver: boolean
  onView: (order: SuperadminOrder) => void
}) {
  const { setNodeRef } = useDroppable({ id: col.key })
  const Icon = col.icon

  return (
    <div
      ref={setNodeRef}
      className={`
        flex flex-col rounded-xl border border-border ${col.bg}
        border-t-4 ${col.border}
        min-h-[300px] transition-all duration-150
        ${isOver ? 'ring-2 ring-primary/40 scale-[1.01]' : ''}
      `}
    >
      {/* Column header */}
      <div className="px-3 py-2.5 border-b border-border/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Icon className={`h-3.5 w-3.5 ${col.count_color}`} />
            <span className="text-xs font-semibold">{col.label}</span>
          </div>
          <span className={`text-sm font-bold ${col.count_color}`}>{orders.length}</span>
        </div>
      </div>

      {/* Cards */}
      <div className="p-2 space-y-2 flex-1 overflow-y-auto max-h-[600px]">
        {orders.length === 0 ? (
          <div className="flex items-center justify-center h-20 text-xs text-muted-foreground/50 italic">
            Sin pedidos
          </div>
        ) : (
          orders.map(order => (
            <KanbanCard
              key={order.id}
              order={order}
              onView={() => onView(order)}
            />
          ))
        )}
      </div>
    </div>
  )
}

// ── Kanban board ──────────────────────────────────────────────────────────────

export function KanbanView({
  orders,
  onView,
  onStatusChange,
}: {
  orders: SuperadminOrder[]
  onView: (order: SuperadminOrder) => void
  onStatusChange: (orderId: string, fromStatus: string, toStatus: string) => void
}) {
  const [activeOrder, setActiveOrder] = useState<SuperadminOrder | null>(null)
  const [overColumn, setOverColumn] = useState<string | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  )

  const byStatus = STATUS_COLUMNS.reduce((acc, col) => {
    acc[col.key] = orders.filter(o => o.status === col.key)
    return acc
  }, {} as Record<string, SuperadminOrder[]>)

  const handleDragStart = (event: DragStartEvent) => {
    const order = orders.find(o => o.id === event.active.id)
    if (order) setActiveOrder(order)
  }

  const handleDragOver = (event: DragOverEvent) => {
    setOverColumn(event.over ? String(event.over.id) : null)
  }

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveOrder(null)
    setOverColumn(null)
    const { active, over } = event
    if (!over) return
    const fromStatus = (active.data.current as any)?.status as string
    const toStatus = String(over.id)
    if (fromStatus === toStatus) return
    const allowed = VALID_TRANSITIONS[fromStatus] ?? []
    if (!allowed.includes(toStatus)) return
    onStatusChange(String(active.id), fromStatus, toStatus)
  }

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3 pb-4">
        {STATUS_COLUMNS.map(col => (
          <KanbanColumn
            key={col.key}
            col={col}
            orders={byStatus[col.key] ?? []}
            isOver={overColumn === col.key}
            onView={onView}
          />
        ))}
      </div>
      <DragOverlay dropAnimation={null}>
        {activeOrder && (
          <KanbanCard order={activeOrder} onView={() => {}} isDragOverlay />
        )}
      </DragOverlay>
    </DndContext>
  )
}
