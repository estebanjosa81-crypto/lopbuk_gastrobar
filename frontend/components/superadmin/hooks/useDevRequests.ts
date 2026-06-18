'use client'

import { useState, useCallback, useEffect } from 'react'
import { api } from '@/lib/api'
import { toast } from 'sonner'

export function useDevRequests() {
  const [devRequests, setDevRequests] = useState<any[]>([])
  const [devRequestsLoading, setDevRequestsLoading] = useState(false)
  const [devHourlyRate, setDevHourlyRate] = useState('')
  const [devWhatsapp, setDevWhatsapp] = useState('')
  const [savingDevRate, setSavingDevRate] = useState(false)

  // Quote dialog
  const [quotingId, setQuotingId] = useState<string | null>(null)
  const [quoteForm, setQuoteForm] = useState({ estimatedHours: '', pricePerHour: '', adminNotes: '' })

  // Status update dialog
  const [statusUpdateId, setStatusUpdateId] = useState<string | null>(null)
  const [statusUpdateValue, setStatusUpdateValue] = useState('')
  const [statusUpdateNotes, setStatusUpdateNotes] = useState('')
  const [statusUpdateReject, setStatusUpdateReject] = useState('')

  const fetchDevRequests = useCallback(async () => {
    setDevRequestsLoading(true)
    const [reqRes, settingsRes] = await Promise.all([
      api.getAllDevRequests(),
      api.getDevSettings(),
    ])
    if (reqRes.success && reqRes.data) setDevRequests(reqRes.data)
    if (settingsRes.success && settingsRes.data) {
      setDevHourlyRate(String(settingsRes.data.hourlyRate || ''))
      setDevWhatsapp(settingsRes.data.whatsapp || '')
    }
    setDevRequestsLoading(false)
  }, [])

  useEffect(() => { fetchDevRequests() }, [fetchDevRequests])

  const handleSaveDevRate = async () => {
    setSavingDevRate(true)
    const res = await api.updateDevSettings({ hourlyRate: Number(devHourlyRate), whatsapp: devWhatsapp })
    if (res.success) toast.success('Configuración guardada')
    else toast.error(res.error || 'Error al guardar')
    setSavingDevRate(false)
  }

  const openQuote = (req: any) => {
    setQuotingId(req.id)
    setQuoteForm({ estimatedHours: '', pricePerHour: devHourlyRate, adminNotes: '' })
  }

  const handleQuote = async () => {
    if (!quotingId) return
    const res = await api.quoteDevRequest(quotingId, {
      estimatedHours: Number(quoteForm.estimatedHours),
      pricePerHour: Number(quoteForm.pricePerHour),
      adminNotes: quoteForm.adminNotes || undefined,
    })
    if (res.success) {
      toast.success('Cotización enviada')
      setQuotingId(null)
      setQuoteForm({ estimatedHours: '', pricePerHour: '', adminNotes: '' })
      fetchDevRequests()
    } else {
      toast.error(res.error || 'Error al cotizar')
    }
  }

  const openStatusUpdate = (req: any) => {
    setStatusUpdateId(req.id)
    setStatusUpdateValue(req.status)
    setStatusUpdateNotes(req.adminNotes || '')
    setStatusUpdateReject('')
  }

  const handleStatusUpdate = async () => {
    if (!statusUpdateId || !statusUpdateValue) return
    const res = await api.updateDevRequestStatus(statusUpdateId, {
      status: statusUpdateValue,
      adminNotes: statusUpdateNotes || undefined,
      rejectionReason: statusUpdateReject || undefined,
    })
    if (res.success) {
      toast.success('Estado actualizado')
      setStatusUpdateId(null)
      setStatusUpdateValue('')
      setStatusUpdateNotes('')
      setStatusUpdateReject('')
      fetchDevRequests()
    } else {
      toast.error(res.error || 'Error al actualizar')
    }
  }

  return {
    devRequests, devRequestsLoading, fetchDevRequests,
    devHourlyRate, setDevHourlyRate,
    devWhatsapp, setDevWhatsapp,
    savingDevRate, handleSaveDevRate,
    quotingId, setQuotingId, quoteForm, setQuoteForm, openQuote, handleQuote,
    statusUpdateId, setStatusUpdateId, statusUpdateValue, setStatusUpdateValue,
    statusUpdateNotes, setStatusUpdateNotes, statusUpdateReject, setStatusUpdateReject,
    openStatusUpdate, handleStatusUpdate,
  }
}
