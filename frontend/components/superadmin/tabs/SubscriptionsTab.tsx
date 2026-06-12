'use client'

import { BadgeDollarSign, Check, CreditCard, KeyRound, RefreshCw, Save, ShieldCheck } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useSubscriptions } from '../hooks/useSubscriptions'

export function SubscriptionsTab() {
  const { mpPrices, setMpPrices, mpPlanIds, isSavingPrices, isSyncingPlans, mpMsg, handleSaveMpPrices, handleSyncMpPlans } = useSubscriptions()

  return (
    <div className="space-y-6">

      {/* Paso 1 — Access Token */}
      <Card className="border-border bg-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-base lg:text-lg flex items-center gap-2">
            <KeyRound className="h-5 w-5 text-muted-foreground" />
            Paso 1 — Access Token
          </CardTitle>
          <CardDescription>
            El Access Token se configura en la pestaña <strong>Integraciones</strong> (campo "Access Token MercadoPago").
            Usa el token de <strong>Pruebas</strong> (TEST-...) para probar o el de <strong>Producción</strong> para cobros reales.
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Paso 2 — Webhook */}
      <Card className="border-border bg-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-base lg:text-lg flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-muted-foreground" />
            Paso 2 — Configurar Webhook en MercadoPago
          </CardTitle>
          <CardDescription>
            En tu panel de MercadoPago Developers → <strong>Notificaciones → Webhooks</strong>,
            agrega esta URL y marca el evento <strong>subscription_preapproval</strong>:
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 p-3 rounded-lg bg-muted border border-border">
            <code className="text-xs text-foreground flex-1 break-all">
              {process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'}/subscriptions/webhook
            </code>
            <button
              type="button"
              className="shrink-0 text-xs text-primary hover:underline"
              onClick={() => {
                navigator.clipboard.writeText(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'}/subscriptions/webhook`)
                // toast handled by browser copy
              }}
            >
              Copiar
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Paso 3 — Precios */}
      <Card className="border-border bg-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-base lg:text-lg flex items-center gap-2">
            <BadgeDollarSign className="h-5 w-5 text-muted-foreground" />
            Paso 3 — Precios de suscripción (COP / mes)
          </CardTitle>
          <CardDescription>
            Define el precio mensual de cada plan. Guárdalos antes de sincronizar con MercadoPago.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {([
            { key: 'basico' as const,      label: 'Plan Básico',      placeholder: '49900' },
            { key: 'profesional' as const,  label: 'Plan Profesional', placeholder: '99900' },
            { key: 'empresarial' as const,  label: 'Plan Empresarial', placeholder: '199900' },
          ]).map(({ key, label, placeholder }) => (
            <div key={key} className="flex items-center gap-3">
              <Label className="w-40 shrink-0 text-sm">{label}</Label>
              <div className="flex items-center gap-2 flex-1">
                <span className="text-sm text-muted-foreground">$</span>
                <Input
                  type="number"
                  value={mpPrices[key]}
                  onChange={e => setMpPrices(p => ({ ...p, [key]: e.target.value }))}
                  placeholder={placeholder}
                  className="text-sm"
                />
                <span className="text-sm text-muted-foreground whitespace-nowrap">COP / mes</span>
              </div>
            </div>
          ))}
          <Button onClick={handleSaveMpPrices} disabled={isSavingPrices} variant="outline" size="sm" className="mt-2">
            {isSavingPrices
              ? <><RefreshCw className="h-3.5 w-3.5 mr-2 animate-spin" /> Guardando…</>
              : <><Save className="h-3.5 w-3.5 mr-2" /> Guardar precios</>}
          </Button>
        </CardContent>
      </Card>

      {/* Paso 4 — Sincronizar */}
      <Card className="border-border bg-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-base lg:text-lg flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-muted-foreground" />
            Paso 4 — Sincronizar planes con MercadoPago
          </CardTitle>
          <CardDescription>
            Crea los planes de suscripción recurrente en MercadoPago. Cada vez que cambies los precios
            debes volver a sincronizar para que MP use los nuevos montos.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-3 gap-3">
            {(['basico', 'profesional', 'empresarial'] as const).map(key => (
              <div key={key} className="rounded-lg border border-border p-3 space-y-1">
                <p className="text-xs font-semibold capitalize text-foreground">{key}</p>
                {mpPlanIds[key] ? (
                  <>
                    <div className="flex items-center gap-1 text-green-500">
                      <Check className="h-3 w-3" />
                      <span className="text-[10px] font-medium">Plan activo en MP</span>
                    </div>
                    <p className="text-[10px] font-mono text-muted-foreground truncate">{mpPlanIds[key]}</p>
                  </>
                ) : (
                  <p className="text-[10px] text-muted-foreground">Sin sincronizar</p>
                )}
              </div>
            ))}
          </div>
          <Button onClick={handleSyncMpPlans} disabled={isSyncingPlans} className="w-full sm:w-auto">
            {isSyncingPlans
              ? <><RefreshCw className="h-4 w-4 mr-2 animate-spin" /> Sincronizando con MercadoPago…</>
              : <><RefreshCw className="h-4 w-4 mr-2" /> Sincronizar planes con MercadoPago</>}
          </Button>
        </CardContent>
      </Card>

      {mpMsg && (
        <div className={`flex items-center gap-2 p-3 rounded-lg text-sm ${
          mpMsg.type === 'ok'
            ? 'bg-green-500/15 text-green-400 border border-green-500/20'
            : 'bg-destructive/15 text-destructive border border-destructive/20'
        }`}>
          {mpMsg.type === 'ok' ? <Check className="h-4 w-4" /> : <ShieldCheck className="h-4 w-4" />}
          {mpMsg.text}
        </div>
      )}

    </div>
  )
}
