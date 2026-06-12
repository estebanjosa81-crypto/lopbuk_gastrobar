'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { api } from '@/lib/api'
import { toast } from 'sonner'

// ── Types ─────────────────────────────────────────────────────────────────────

export interface SuperadminOrder {
  id: string
  orderNumber: string
  tenantId: string
  commerceName: string
  commerceLogo: string | null
  customerName: string
  customerPhone: string
  customerEmail: string | null
  total: number
  subtotal: number
  shippingCost: number
  discount: number
  status: 'pendiente' | 'confirmado' | 'preparando' | 'enviado' | 'entregado' | 'cancelado'
  paymentMethod: string | null
  assignedTo: string | null
  assignedName: string | null
  address: string | null
  municipality: string | null
  department: string | null
  neighborhood: string | null
  notes: string | null
  createdAt: string
  updatedAt: string
}

export interface OrderItem {
  id: number
  productName: string
  productImage: string | null
  quantity: number
  unitPrice: number
  totalPrice: number
  size: string | null
  color: string | null
}

export interface StatusHistoryEntry {
  fromStatus: string | null
  toStatus: string
  changedByName: string
  note: string | null
  createdAt: string
}

export interface OrderSummaryCounts {
  pendiente: number
  confirmado: number
  preparando: number
  enviado: number
  entregado: number
  cancelado: number
}

export interface OrderFilters {
  tenantId: string
  status: string
  assigned: string
  search: string
  dateFrom: string
  dateTo: string
}

// SLA thresholds in minutes
const SLA_YELLOW_MIN = 10
const SLA_RED_MIN = 30

export function getSlaColor(createdAt: string): 'green' | 'yellow' | 'red' {
  const ageMin = (Date.now() - new Date(createdAt).getTime()) / 60_000
  if (ageMin < SLA_YELLOW_MIN) return 'green'
  if (ageMin < SLA_RED_MIN)    return 'yellow'
  return 'red'
}

function mapOrder(raw: any): SuperadminOrder {
  return {
    id:            raw.id,
    orderNumber:   raw.order_number,
    tenantId:      raw.tenant_id,
    commerceName:  raw.commerce_name ?? raw.tenant_id,
    commerceLogo:  raw.commerce_logo ?? null,
    customerName:  raw.customer_name,
    customerPhone: raw.customer_phone,
    customerEmail: raw.customer_email ?? null,
    total:         Number(raw.total),
    subtotal:      Number(raw.subtotal),
    shippingCost:  Number(raw.shipping_cost),
    discount:      Number(raw.discount),
    status:        raw.status,
    paymentMethod: raw.payment_method ?? null,
    assignedTo:    raw.assigned_to ?? null,
    assignedName:  raw.assigned_name ?? null,
    address:       raw.address ?? null,
    municipality:  raw.municipality ?? null,
    department:    raw.department ?? null,
    neighborhood:  raw.neighborhood ?? null,
    notes:         raw.notes ?? null,
    createdAt:     raw.created_at,
    updatedAt:     raw.updated_at,
  }
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useOrders() {
  const [orders, setOrders] = useState<SuperadminOrder[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const LIMIT = 30

  // Filters
  const [filters, setFilters] = useState<OrderFilters>({
    tenantId: '', status: '', assigned: '', search: '', dateFrom: '', dateTo: '',
  })

  // Summary (polling)
  const [summary, setSummary] = useState<OrderSummaryCounts>({
    pendiente: 0, confirmado: 0, preparando: 0, enviado: 0, entregado: 0, cancelado: 0,
  })
  const lastLatestId = useRef<string | null>(null)

  // Selected order detail drawer
  const [selectedOrder, setSelectedOrder] = useState<SuperadminOrder | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [drawerItems, setDrawerItems] = useState<OrderItem[]>([])
  const [drawerHistory, setDrawerHistory] = useState<StatusHistoryEntry[]>([])
  const [isLoadingDrawer, setIsLoadingDrawer] = useState(false)

  // Status change dialog
  const [changingStatusOrder, setChangingStatusOrder] = useState<SuperadminOrder | null>(null)
  const [newStatus, setNewStatus] = useState('')
  const [statusNote, setStatusNote] = useState('')
  const [isSavingStatus, setIsSavingStatus] = useState(false)

  // ── Fetch bandeja ──────────────────────────────────────────────────────────

  const fetchOrders = useCallback(async (pageNum = 1) => {
    setIsLoading(true)
    const result = await api.getSuperadminOrders({
      tenant_id: filters.tenantId   || undefined,
      status:    filters.status     || undefined,
      assigned:  (filters.assigned  || undefined) as any,
      search:    filters.search     || undefined,
      date_from: filters.dateFrom   || undefined,
      date_to:   filters.dateTo     || undefined,
      page: pageNum,
      limit: LIMIT,
    })
    if (result.success && result.data) {
      setOrders((result.data.orders as any[]).map(mapOrder))
      setTotal(result.data.total)
      setPage(pageNum)
    }
    setIsLoading(false)
  }, [filters])

  // ── SSE summary (reemplaza polling) ───────────────────────────────────────

  useEffect(() => {
    fetchOrders(1)

    if (typeof window === 'undefined') return

    const url = api.getSseUrl('/superadmin/events')
    let es: EventSource | null = null
    let fallbackTimer: ReturnType<typeof setInterval> | null = null

    const onMessage = (evt: MessageEvent) => {
      try {
        const data = JSON.parse(evt.data) as { counts: OrderSummaryCounts; latestId: string | null }
        setSummary(data.counts)
        if (lastLatestId.current !== null && data.latestId !== lastLatestId.current) {
          toast.info('Nuevo pedido recibido')
          fetchOrders(1)
        }
        lastLatestId.current = data.latestId
      } catch { /* ignore parse error */ }
    }

    const connect = () => {
      try {
        es = new EventSource(url, { withCredentials: true })
        es.onmessage = onMessage
        es.onerror = () => {
          // EventSource auto-reconnects; start a 30s fallback poll in case SSE is blocked
          if (!fallbackTimer) {
            fallbackTimer = setInterval(async () => {
              const r = await api.getSuperadminOrdersSummary()
              if (r.success && r.data) onMessage({ data: JSON.stringify(r.data) } as MessageEvent)
            }, 30_000)
          }
        }
        es.onopen = () => {
          // SSE connected — cancel fallback polling
          if (fallbackTimer) { clearInterval(fallbackTimer); fallbackTimer = null }
        }
      } catch {
        // EventSource not available (e.g. test env); fall back to polling
        fallbackTimer = setInterval(async () => {
          const r = await api.getSuperadminOrdersSummary()
          if (r.success && r.data) onMessage({ data: JSON.stringify(r.data) } as MessageEvent)
        }, 30_000)
      }
    }

    connect()

    return () => {
      es?.close()
      if (fallbackTimer) clearInterval(fallbackTimer)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchOrders])

  // ── Order detail drawer ────────────────────────────────────────────────────

  const openDrawer = useCallback(async (order: SuperadminOrder) => {
    setSelectedOrder(order)
    setDrawerOpen(true)
    setIsLoadingDrawer(true)
    setDrawerItems([])
    setDrawerHistory([])
    const result = await api.getSuperadminOrderItems(order.id)
    if (result.success && result.data) {
      setDrawerItems((result.data.items as any[]).map((i: any) => ({
        id:           i.id,
        productName:  i.product_name,
        productImage: i.product_image ?? null,
        quantity:     i.quantity,
        unitPrice:    Number(i.unit_price),
        totalPrice:   Number(i.total_price),
        size:         i.size ?? null,
        color:        i.color ?? null,
      })))
      setDrawerHistory((result.data.history as any[]).map((h: any) => ({
        fromStatus:    h.from_status ?? null,
        toStatus:      h.to_status,
        changedByName: h.changed_by_name ?? 'Superadmin',
        note:          h.note ?? null,
        createdAt:     h.created_at,
      })))
    }
    setIsLoadingDrawer(false)
  }, [])

  const closeDrawer = useCallback(() => {
    setDrawerOpen(false)
    setSelectedOrder(null)
  }, [])

  // ── Change status ──────────────────────────────────────────────────────────

  const openStatusDialog = useCallback((order: SuperadminOrder) => {
    setChangingStatusOrder(order)
    setNewStatus('')
    setStatusNote('')
  }, [])

  const closeStatusDialog = useCallback(() => {
    setChangingStatusOrder(null)
    setNewStatus('')
    setStatusNote('')
  }, [])

  const handleSaveStatus = useCallback(async () => {
    if (!changingStatusOrder || !newStatus) return
    setIsSavingStatus(true)
    const result = await api.patchSuperadminOrderStatus(changingStatusOrder.id, newStatus, statusNote)
    if (result.success) {
      toast.success(`Estado actualizado a "${newStatus}"`)
      setOrders(prev => prev.map(o =>
        o.id === changingStatusOrder.id ? { ...o, status: newStatus as SuperadminOrder['status'] } : o
      ))
      if (selectedOrder?.id === changingStatusOrder.id) {
        setSelectedOrder(prev => prev ? { ...prev, status: newStatus as SuperadminOrder['status'] } : prev)
      }
      closeStatusDialog()
      // SSE will update summary automatically; locally optimistic-update count via setSummary
    } else {
      toast.error(result.error || 'Error al cambiar estado')
    }
    setIsSavingStatus(false)
  }, [changingStatusOrder, newStatus, statusNote, selectedOrder, closeStatusDialog])

  // ── Assign to me ───────────────────────────────────────────────────────────

  const handleAssignToMe = useCallback(async (order: SuperadminOrder) => {
    const isAssigned = !!order.assignedTo
    const result = await api.patchSuperadminOrderAssign(order.id, isAssigned)
    if (result.success) {
      toast.success(isAssigned ? 'Pedido desasignado' : 'Pedido asignado a ti')
      fetchOrders(page)
    } else {
      toast.error('Error al asignar pedido')
    }
  }, [fetchOrders, page])

  return {
    // List
    orders, isLoading, total, page, LIMIT,
    fetchOrders,
    // Filters
    filters, setFilters,
    // Summary
    summary,
    // Drawer
    selectedOrder, drawerOpen, drawerItems, drawerHistory, isLoadingDrawer,
    openDrawer, closeDrawer,
    // Status dialog
    changingStatusOrder, newStatus, setNewStatus, statusNote, setStatusNote,
    isSavingStatus,
    openStatusDialog, closeStatusDialog, handleSaveStatus,
    // Assign
    handleAssignToMe,
  }
}
