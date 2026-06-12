'use client'

import { Bot, Check, Eye, EyeOff, ImageIcon, RefreshCw, Save } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useIntegrations } from '../hooks/useIntegrations'

export function IntegrationsTab() {
  const {
    integrations, setIntegrations,
    showOpenAIKey, setShowOpenAIKey,
    showUploadPreset, setShowUploadPreset,
    isSavingIntegrations, integrationsMsg, handleSaveIntegrations,
    platformAssistant, togglingAssistant, toggleAssistant,
    chatbotTenants, isLoadingChatbotTenants, togglingTenantId,
    fetchChatbotTenants, handleToggleChatbot,
  } = useIntegrations()

  return (
    <div className="space-y-6">

      {/* Cloudinary */}
      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <ImageIcon className="h-5 w-5 text-muted-foreground" />
            Cloudinary — Subida de Imágenes
          </CardTitle>
          <CardDescription>
            Credenciales globales para todos los comercios. Configurado aquí, funciona en toda la plataforma.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg bg-blue-500/10 border border-blue-500/20 p-3 text-xs space-y-1">
            <p className="font-medium text-blue-600 dark:text-blue-400">¿Cómo obtener las credenciales?</p>
            <ol className="list-decimal list-inside space-y-0.5 text-muted-foreground">
              <li>Crea cuenta en <strong>cloudinary.com</strong> y copia tu <strong>Cloud Name</strong> del dashboard</li>
              <li>Ve a <strong>Settings → Upload → Upload presets</strong> y crea uno con <strong>Signing Mode: Unsigned</strong></li>
            </ol>
          </div>

          {integrationsMsg && (
            <div className={`rounded-lg p-3 text-sm ${integrationsMsg.type === 'ok' ? 'bg-green-500/10 text-green-600' : 'bg-destructive/10 text-destructive'}`}>
              {integrationsMsg.text}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Cloud Name</Label>
              <Input
                placeholder="ej: dxy123abc"
                value={integrations.cloudinaryCloudName}
                onChange={e => setIntegrations(p => ({ ...p, cloudinaryCloudName: e.target.value }))}
                className="font-mono text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Upload Preset (Unsigned)</Label>
              <div className="relative">
                <Input
                  type={showUploadPreset ? 'text' : 'password'}
                  placeholder="ej: perfumeria_uploads"
                  value={integrations.cloudinaryUploadPreset}
                  onChange={e => setIntegrations(p => ({ ...p, cloudinaryUploadPreset: e.target.value }))}
                  className="font-mono text-sm pr-10"
                />
                <button type="button" onClick={() => setShowUploadPreset(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  {showUploadPreset ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 p-2.5 rounded-lg bg-secondary/40 text-sm">
            <div className={`w-2 h-2 rounded-full flex-shrink-0 ${integrations.cloudinaryCloudName && integrations.cloudinaryUploadPreset ? 'bg-green-500' : 'bg-amber-400'}`} />
            <span className="text-muted-foreground text-xs">
              {integrations.cloudinaryCloudName && integrations.cloudinaryUploadPreset
                ? `Activo — Cloud: ${integrations.cloudinaryCloudName}`
                : 'Sin configurar'}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* OpenAI / Gemini */}
      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Bot className="h-5 w-5 text-muted-foreground" />
            OpenAI / Gemini — Chatbot IA
          </CardTitle>
          <CardDescription>
            API Key de IA. Requerida para activar el chatbot en cualquier comercio.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label>API Key de IA (Google Gemini u OpenAI)</Label>
            <div className="relative">
              <Input
                type={showOpenAIKey ? 'text' : 'password'}
                placeholder="AIzaSy... (Gemini) o sk-proj-... (OpenAI)"
                value={integrations.openaiApiKey}
                onChange={e => setIntegrations(p => ({ ...p, openaiApiKey: e.target.value }))}
                className="font-mono text-sm pr-10"
              />
              <button type="button" onClick={() => setShowOpenAIKey(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                {showOpenAIKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            <p className="text-xs text-muted-foreground">
              Google Gemini (gratis): <strong>aistudio.google.com/apikey</strong> — OpenAI (pago): <strong>platform.openai.com/api-keys</strong>
            </p>
          </div>

          <div className="flex items-center gap-2 p-2.5 rounded-lg bg-secondary/40 text-sm">
            <div className={`w-2 h-2 rounded-full flex-shrink-0 ${integrations.openaiApiKey ? 'bg-green-500' : 'bg-amber-400'}`} />
            <span className="text-muted-foreground text-xs">
              {integrations.openaiApiKey ? 'API Key configurada — el chatbot puede activarse en comercios' : 'Sin configurar — el chatbot no funcionará'}
            </span>
          </div>
        </CardContent>
      </Card>

      <Button onClick={handleSaveIntegrations} disabled={isSavingIntegrations} className="gap-2">
        {isSavingIntegrations ? <RefreshCw className="h-4 w-4 animate-spin" /> : integrationsMsg?.type === 'ok' ? <Check className="h-4 w-4" /> : <Save className="h-4 w-4" />}
        Guardar Integraciones
      </Button>

      {/* Asistente de plataforma */}
      <Card className="border-border bg-card">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              <Bot className="h-5 w-5 text-muted-foreground" />
              Asistente de Plataforma
            </CardTitle>
            <CardDescription>
              Actívalo en toda la infraestructura. El usuario verá un asistente de ayuda. Requiere la API Key de IA configurada arriba.
            </CardDescription>
          </div>
          <button
            onClick={toggleAssistant}
            disabled={togglingAssistant}
            className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors flex-shrink-0 ${platformAssistant ? 'bg-green-500' : 'bg-muted-foreground/30'}`}
          >
            <span className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${platformAssistant ? 'translate-x-6' : 'translate-x-1'}`} />
          </button>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 p-2.5 rounded-lg bg-secondary/40 text-sm">
            <div className={`w-2 h-2 rounded-full flex-shrink-0 ${platformAssistant ? 'bg-green-500' : 'bg-amber-400'}`} />
            <span className="text-muted-foreground text-xs">
              {platformAssistant ? 'Activo — el asistente aparece para los usuarios de la plataforma' : 'Desactivado — los usuarios no ven el asistente'}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Chatbot por comercio */}
      <Card className="border-border bg-card">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              <Bot className="h-5 w-5 text-muted-foreground" />
              Chatbot IA por Comercio
            </CardTitle>
            <CardDescription>Activa o desactiva el chatbot para cada comercio. El comerciante configura su base de conocimiento.</CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={fetchChatbotTenants} disabled={isLoadingChatbotTenants}>
            <RefreshCw className={`h-4 w-4 ${isLoadingChatbotTenants ? 'animate-spin' : ''}`} />
          </Button>
        </CardHeader>
        <CardContent>
          {isLoadingChatbotTenants ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : chatbotTenants.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">No hay comercios activos</p>
          ) : (
            <div className="space-y-2">
              {chatbotTenants.map(tenant => (
                <div key={tenant.id} className="flex items-center justify-between p-3 rounded-lg border bg-secondary/20">
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{tenant.name}</p>
                    <p className="text-xs text-muted-foreground">/{tenant.slug}</p>
                    {tenant.chatbotEnabled && tenant.botName && (
                      <p className="text-xs text-green-600 dark:text-green-400 mt-0.5">Bot: {tenant.botName}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${tenant.chatbotEnabled ? 'bg-green-500/15 text-green-600' : 'bg-muted text-muted-foreground'}`}>
                      {tenant.chatbotEnabled ? 'Activo' : 'Inactivo'}
                    </span>
                    <button
                      type="button"
                      disabled={togglingTenantId === tenant.id}
                      onClick={() => handleToggleChatbot(tenant.id, !!tenant.chatbotEnabled)}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors disabled:opacity-50 ${tenant.chatbotEnabled ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'}`}
                    >
                      <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${tenant.chatbotEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

    </div>
  )
}
