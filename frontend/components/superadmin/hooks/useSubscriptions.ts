'use client'

import { useState, useEffect } from 'react'
import { api } from '@/lib/api'

/**
 * useSubscriptions — estado + fetch + acciones del tab de Suscripciones (MercadoPago).
 * Carga precios de planes desde platform_settings y los plan IDs desde la config MP.
 */
export function useSubscriptions() {
  const [mpPrices, setMpPrices] = useState({ basico: '', profesional: '', empresarial: '' })
  const [planActive, setPlanActive] = useState({ basico: true, profesional: true, empresarial: true })
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
        setPlanActive({
          basico:      res.data.plan_active_basico !== '0',
          profesional: res.data.plan_active_profesional !== '0',
          empresarial: res.data.plan_active_empresarial !== '0',
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
      await api.savePlanActive(planActive)
      setMpMsg({ type: 'ok', text: 'Planes guardados correctamente' })
    } catch {
      setMpMsg({ type: 'error', text: 'Error al guardar los planes' })
    }
    setIsSavingPrices(false)
    setTimeout(() => setMpMsg(null), 4000)
  }

  const togglePlanActive = (key: 'basico' | 'profesional' | 'empresarial') => {
    setPlanActive(prev => ({ ...prev, [key]: !prev[key] }))
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

  return { mpPrices, setMpPrices, planActive, togglePlanActive, mpPlanIds, isSavingPrices, isSyncingPlans, mpMsg, handleSaveMpPrices, handleSyncMpPlans }
}
