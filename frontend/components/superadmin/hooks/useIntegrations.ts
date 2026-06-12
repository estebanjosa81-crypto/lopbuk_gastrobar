'use client'

import { useState, useCallback, useEffect } from 'react'
import { api } from '@/lib/api'
import { toast } from 'sonner'
import { clearCloudinaryCache } from '@/components/ui/cloudinary-upload'

export function useIntegrations() {
  const [integrations, setIntegrations] = useState({
    cloudinaryCloudName: '',
    cloudinaryUploadPreset: '',
    openaiApiKey: '',
  })
  const [showOpenAIKey, setShowOpenAIKey] = useState(false)
  const [showUploadPreset, setShowUploadPreset] = useState(false)
  const [isSavingIntegrations, setIsSavingIntegrations] = useState(false)
  const [integrationsMsg, setIntegrationsMsg] = useState<{ type: 'ok' | 'error'; text: string } | null>(null)

  // Platform assistant
  const [platformAssistant, setPlatformAssistant] = useState(false)
  const [togglingAssistant, setTogglingAssistant] = useState(false)

  // Chatbot per-tenant
  const [chatbotTenants, setChatbotTenants] = useState<any[]>([])
  const [isLoadingChatbotTenants, setIsLoadingChatbotTenants] = useState(false)
  const [togglingTenantId, setTogglingTenantId] = useState<string | null>(null)

  const fetchIntegrations = useCallback(async () => {
    const result = await api.getSuperadminIntegrations()
    if (result.success && result.data) {
      setIntegrations({
        cloudinaryCloudName: result.data.cloudinaryCloudName || '',
        cloudinaryUploadPreset: result.data.cloudinaryUploadPreset || '',
        openaiApiKey: result.data.openaiApiKey || '',
      })
    }
    const pa = await api.getPlatformAssistant()
    if (pa.success) setPlatformAssistant(!!pa.data?.enabled)
  }, [])

  const fetchChatbotTenants = useCallback(async () => {
    setIsLoadingChatbotTenants(true)
    const result = await api.getSuperadminChatbotTenants()
    if (result.success && result.data) setChatbotTenants(result.data as any[])
    setIsLoadingChatbotTenants(false)
  }, [])

  useEffect(() => {
    fetchIntegrations()
    fetchChatbotTenants()
  }, [fetchIntegrations, fetchChatbotTenants])

  const handleSaveIntegrations = async () => {
    setIsSavingIntegrations(true)
    const result = await api.updateSuperadminIntegrations(integrations)
    if (result.success) {
      clearCloudinaryCache()
      setIntegrationsMsg({ type: 'ok', text: 'Integraciones guardadas correctamente' })
    } else {
      setIntegrationsMsg({ type: 'error', text: result.error || 'Error al guardar' })
    }
    setIsSavingIntegrations(false)
    setTimeout(() => setIntegrationsMsg(null), 4000)
  }

  const toggleAssistant = async () => {
    setTogglingAssistant(true)
    const next = !platformAssistant
    const r = await api.setPlatformAssistant(next)
    if (r.success) setPlatformAssistant(next)
    setTogglingAssistant(false)
  }

  const handleToggleChatbot = async (tenantId: string, currentEnabled: boolean) => {
    setTogglingTenantId(tenantId)
    const result = await api.toggleChatbotForTenant(tenantId, !currentEnabled)
    if (result.success) {
      setChatbotTenants(prev => prev.map(t => t.id === tenantId ? { ...t, chatbotEnabled: !currentEnabled } : t))
      toast.success(!currentEnabled ? 'Chatbot activado' : 'Chatbot desactivado')
    } else {
      toast.error('Error al actualizar el chatbot')
    }
    setTogglingTenantId(null)
  }

  return {
    integrations, setIntegrations,
    showOpenAIKey, setShowOpenAIKey,
    showUploadPreset, setShowUploadPreset,
    isSavingIntegrations, integrationsMsg, handleSaveIntegrations,
    platformAssistant, togglingAssistant, toggleAssistant,
    chatbotTenants, isLoadingChatbotTenants, togglingTenantId,
    fetchChatbotTenants, fetchIntegrations, handleToggleChatbot,
  }
}
