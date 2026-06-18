'use client'

import { useState, useCallback, useEffect, useRef, useMemo } from 'react'
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

export interface Driver {
  id: string
  name: string
  email: string
  phone: string
}

export interface TenantOption {
  id: string
  name: string
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

  // View mode
  const [viewMode, setViewMode] = useState<'table' | 'kanban'>('table')

  // Tenant filter options
  const [tenantsList, setTenantsList] = useState<TenantOption[]>([])

  // Summary (SSE / polling)
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

  // Drivers for quick-assign in drawer
  const [drawerDrivers, setDrawerDrivers] = useState<Driver[]>([])
  const [isLoadingDrivers, setIsLoadingDrivers] = useState(false)

  // Status change dialog
  const [changingStatusOrder, setChangingStatusOrder] = useState<SuperadminOrder | null>(null)
  const [newStatus, setNewStatus] = useState('')
  const [statusNote, setStatusNote] = useState('')
  const [isSavingStatus, setIsSavingStatus] = useState(false)

  // Bulk selection
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [isBulkProcessing, setIsBulkProcessing] = useState(false)

  // ── Derived priority counts ────────────────────────────────────────────────

  const priorityStats = useMemo(() => {
    const activeOrders = orders.filter(o => o.status !== 'entregado' && o.status !== 'cancelado')
    return {
      sinAsignar: activeOrders.filter(o => !o.assignedTo).length,
      retrasados: activeOrders.filter(o => getSlaColor(o.createdAt) === 'red').length,
      enRiesgo:   activeOrders.filter(o => getSlaColor(o.createdAt) === 'yellow').length,
    }
  }, [orders])

  // ── Fetch tenants list ─────────────────────────────────────────────────────

  useEffect(() => {
    api.getSuperadminTenantsList().then(r => {
      if (r.success && r.data) setTenantsList(r.data as TenantOption[])
    })
  }, [])

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

  // ── SSE summary ────────────────────────────────────────────────────────────

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
      } catch { /* ignore */ }
    }

    const connect = () => {
      try {
        es = new EventSource(url, { withCredentials: true })
        es.onmessage = onMessage
        es.onerror = () => {
          if (!fallbackTimer) {
            fallbackTimer = setInterval(async () => {
              const r = await api.getSuperadminOrdersSummary()
              if (r.success && r.data) onMessage({ data: JSON.stringify(r.data) } as MessageEvent)
            }, 30_000)
          }
        }
        es.onopen = () => {
          if (fallbackTimer) { clearInterval(fallbackTimer); fallbackTimer = null }
        }
      } catch {
        fallbackTimer = setInterval(async () => {
          const r = await api.getSuperadminOrdersSummary()
          if (r.success && r.data) onMessage({ data: JSON.stringify(r.data) } as MessageEvent)
        }, 30_000)
      }
    }

    connect()
    return () => { es?.close(); if (fallbackTimer) clearInterval(fallbackTimer) }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchOrders])

  // ── Order detail drawer ────────────────────────────────────────────────────

  const openDrawer = useCallback(async (order: SuperadminOrder) => {
    setSelectedOrder(order)
    setDrawerOpen(true)
    setIsLoadingDrawer(true)
    setDrawerItems([])
    setDrawerHistory([])
    setDrawerDrivers([])
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
    // Load drivers in background
    setIsLoadingDrivers(true)
    api.getSuperadminOrderDrivers(order.id).then(r => {
      if (r.success && r.data) setDrawerDrivers(r.data as Driver[])
      setIsLoadingDrivers(false)
    })
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
    } else {
      toast.error(result.error || 'Error al cambiar estado')
    }
    setIsSavingStatus(false)
  }, [changingStatusOrder, newStatus, statusNote, selectedOrder, closeStatusDialog])

  // Kanban status drag handler
  const handleKanbanStatusChange = useCallback(async (orderId: string, fromStatus: string, toStatus: string) => {
    if (fromStatus === toStatus) return
    const result = await api.patchSuperadminOrderStatus(orderId, toStatus)
    if (result.success) {
      setOrders(prev => prev.map(o =>
        o.id === orderId ? { ...o, status: toStatus as SuperadminOrder['status'] } : o
      ))
    } else {
      toast.error(result.error || 'Transición inválida')
    }
  }, [])

  // ── Assign ─────────────────────────────────────────────────────────────────

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

  const handleAssignToDriver = useCallback(async (orderId: string, driverId: string, driverName: string) => {
    const result = await api.patchSuperadminOrderAssignTo(orderId, driverId)
    if (result.success) {
      toast.success(`Pedido asignado a ${driverName}`)
      setOrders(prev => prev.map(o =>
        o.id === orderId ? { ...o, assignedTo: driverId, assignedName: driverName } : o
      ))
      if (selectedOrder?.id === orderId) {
        setSelectedOrder(prev => prev ? { ...prev, assignedTo: driverId, assignedName: driverName } : prev)
      }
    } else {
      toast.error('Error al asignar repartidor')
    }
  }, [selectedOrder])

  // ── Bulk selection ─────────────────────────────────────────────────────────

  const toggleSelect = useCallback((id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id); else next.add(id)
      return next
    })
  }, [])

  const selectAll = useCallback(() => {
    setSelectedIds(new Set(orders.map(o => o.id)))
  }, [orders])

  const clearSelection = useCallback(() => setSelectedIds(new Set()), [])

  const handleBulkStatusChange = useCallback(async (toStatus: string) => {
    if (!selectedIds.size) return
    setIsBulkProcessing(true)
    let success = 0; let fail = 0
    for (const id of selectedIds) {
      const order = orders.find(o => o.id === id)
      if (!order) continue
      const r = await api.patchSuperadminOrderStatus(id, toStatus)
      if (r.success) { success++; } else { fail++ }
    }
    if (success) toast.success(`${success} pedido(s) actualizados`)
    if (fail) toast.error(`${fail} pedido(s) fallaron`)
    clearSelection()
    fetchOrders(page)
    setIsBulkProcessing(false)
  }, [selectedIds, orders, clearSelection, fetchOrders, page])

  const handleBulkAssignToMe = useCallback(async () => {
    if (!selectedIds.size) return
    setIsBulkProcessing(true)
    let success = 0
    for (const id of selectedIds) {
      const r = await api.patchSuperadminOrderAssign(id, false)
      if (r.success) success++
    }
    toast.success(`${success} pedido(s) asignados`)
    clearSelection()
    fetchOrders(page)
    setIsBulkProcessing(false)
  }, [selectedIds, clearSelection, fetchOrders, page])

  const handleBulkCancel = useCallback(async () => {
    if (!selectedIds.size) return
    setIsBulkProcessing(true)
    let success = 0
    for (const id of selectedIds) {
      const order = orders.find(o => o.id === id)
      if (!order || order.status === 'entregado' || order.status === 'cancelado') continue
      const r = await api.patchSuperadminOrderStatus(id, 'cancelado')
      if (r.success) success++
    }
    toast.success(`${success} pedido(s) cancelados`)
    clearSelection()
    fetchOrders(page)
    setIsBulkProcessing(false)
  }, [selectedIds, orders, clearSelection, fetchOrders, page])

  return {
    // List
    orders, isLoading, total, page, LIMIT,
    fetchOrders,
    // View mode
    viewMode, setViewMode,
    // Filters
    filters, setFilters,
    tenantsList,
    // Summary
    summary,
    priorityStats,
    // Drawer
    selectedOrder, drawerOpen, drawerItems, drawerHistory, isLoadingDrawer,
    drawerDrivers, isLoadingDrivers,
    openDrawer, closeDrawer,
    // Status dialog
    changingStatusOrder, newStatus, setNewStatus, statusNote, setStatusNote,
    isSavingStatus,
    openStatusDialog, closeStatusDialog, handleSaveStatus,
    handleKanbanStatusChange,
    // Assign
    handleAssignToMe, handleAssignToDriver,
    // Bulk
    selectedIds, toggleSelect, selectAll, clearSelection,
    isBulkProcessing, handleBulkStatusChange, handleBulkAssignToMe, handleBulkCancel,
  }
}
