'use client'

import { useState, useEffect } from 'react'
import { api } from '@/lib/api'

/**
 * useSubscriptions — estado + fetch + acciones del tab de Suscripciones (MercadoPago).
 * Carga precios de planes desde platform_settings y los plan IDs desde la config MP.
 */
export function useSubscriptions() {
  const [mpPrices, setMpPrices] = useState({ basico: '', profesional: '', empresarial: '' })
  const [mpPlanIds, setMpPlanIds] = useState<Record<string, string | null>>({})
  const [isSavingPrices, setIsSavingPrices] = useState(false)
  const [isSyncingPlans, setIsSyncingPlans] = useState(false)
  const [mpMsg, setMpMsg] = useState<{ type: 'ok' | 'error'; text: string } | null>(null)

  useEffect(() => {
    api.getPlatformSettings().then(res => {
      if (res.success && res.data) {
        setMpPrices({
          basico:      res.data.plan_price_basico || '',
          profesional: res.data.plan_price_profesional || '',
          empresarial: res.data.plan_price_empresarial || '',
        })
      }
    })
    api.getSubscriptionConfig().then(res => {
      if (res.success && res.data?.planIds) setMpPlanIds(res.data.planIds)
    })
  }, [])

  const handleSaveMpPrices = async () => {
    setIsSavingPrices(true)
    try {
      await api.savePlanPrices(mpPrices)
      setMpMsg({ type: 'ok', text: 'Precios guardados correctamente' })
    } catch {
      setMpMsg({ type: 'error', text: 'Error al guardar los precios' })
    }
    setIsSavingPrices(false)
    setTimeout(() => setMpMsg(null), 4000)
  }

  const handleSyncMpPlans = async () => {
    setIsSyncingPlans(true)
    setMpMsg(null)
    const result = await api.syncMPPlans()
    if (result.success && result.data) {
      setMpPlanIds(result.data as Record<string, string>)
      setMpMsg({ type: 'ok', text: 'Planes sincronizados con MercadoPago correctamente' })
    } else {
      setMpMsg({ type: 'error', text: result.error || 'Error al sincronizar planes' })
    }
    setIsSyncingPlans(false)
    setTimeout(() => setMpMsg(null), 6000)
  }

  return { mpPrices, setMpPrices, mpPlanIds, isSavingPrices, isSyncingPlans, mpMsg, handleSaveMpPrices, handleSyncMpPlans }
}
