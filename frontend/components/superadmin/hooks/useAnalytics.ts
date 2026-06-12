'use client'

import { useState, useCallback, useEffect } from 'react'
import { api } from '@/lib/api'

// ── Sales timeline (existing) ─────────────────────────────────────────────────

export interface TenantTimeline {
  tenantId: string
  tenantName: string
  slug: string
  totalRevenue: number
  totalOrders: number
  timeline: { date: string; revenue: number; orderCount: number }[]
}

export interface TimelineData {
  tenants: TenantTimeline[]
  dateRange: string[]
}

// ── Platform KPIs (new) ───────────────────────────────────────────────────────

export interface PlatformAnalytics {
  currentRevenue: number
  prevRevenue: number
  currentOrders: number
  prevOrders: number
  avgTicket: number
  activeTenants: number
  newTenants: number
  topTenantName: string | null
  topTenantRevenue: number
  days: number
}

// ── Heatmap (new) ─────────────────────────────────────────────────────────────

export interface HeatmapCell {
  dayOfWeek: number  // 0 = Sunday … 6 = Saturday
  hour: number       // 0 – 23
  orderCount: number
}

export interface HeatmapData {
  cells: HeatmapCell[]
  maxCount: number
  days: number
}

// ── Helpers ───────────────────────────────────────────────────────────────────

export function getMaxRevenue(tenants: TenantTimeline[]) {
  return Math.max(...tenants.flatMap(t => t.timeline.map(d => d.revenue)), 1)
}

export function deltaPct(current: number, prev: number): number | null {
  if (prev === 0) return null
  return Math.round(((current - prev) / prev) * 100)
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useAnalytics() {
  const [period, setPeriod] = useState(30)

  // Sales timeline
  const [timelineData, setTimelineData] = useState<TimelineData | null>(null)
  const [isLoadingTimeline, setIsLoadingTimeline] = useState(false)

  // Platform KPIs
  const [platformData, setPlatformData] = useState<PlatformAnalytics | null>(null)
  const [isLoadingPlatform, setIsLoadingPlatform] = useState(false)

  // Heatmap
  const [heatmapData, setHeatmapData] = useState<HeatmapData | null>(null)
  const [isLoadingHeatmap, setIsLoadingHeatmap] = useState(false)

  const fetchTimeline = useCallback(async (days: number) => {
    setIsLoadingTimeline(true)
    const result = await api.getSalesTimeline(days)
    if (result.success && result.data) setTimelineData(result.data)
    setIsLoadingTimeline(false)
  }, [])

  const fetchPlatform = useCallback(async (days: number) => {
    setIsLoadingPlatform(true)
    const result = await api.getPlatformAnalytics(days)
    if (result.success && result.data) setPlatformData(result.data)
    setIsLoadingPlatform(false)
  }, [])

  const fetchHeatmap = useCallback(async (days: number) => {
    setIsLoadingHeatmap(true)
    const result = await api.getOrdersHeatmap(days)
    if (result.success && result.data) setHeatmapData(result.data)
    setIsLoadingHeatmap(false)
  }, [])

  const fetchAll = useCallback((days: number) => {
    fetchTimeline(days)
    fetchPlatform(days)
    fetchHeatmap(days)
  }, [fetchTimeline, fetchPlatform, fetchHeatmap])

  useEffect(() => { fetchAll(period) }, [fetchAll, period])

  // Backward-compat aliases used by the old AnalyticsTab
  const timelinePeriod    = period
  const setTimelinePeriod = setPeriod
  const isLoading = isLoadingTimeline || isLoadingPlatform || isLoadingHeatmap

  return {
    // Period
    period, setPeriod,
    // Compat
    timelinePeriod, setTimelinePeriod,
    // Timeline
    timelineData, isLoadingTimeline,
    // Platform KPIs
    platformData, isLoadingPlatform,
    // Heatmap
    heatmapData, isLoadingHeatmap,
    // Combined
    isLoading, fetchAll,
    // Helpers (kept for backward compat)
    fetchTimeline,
    getMaxRevenue,
  }
}
