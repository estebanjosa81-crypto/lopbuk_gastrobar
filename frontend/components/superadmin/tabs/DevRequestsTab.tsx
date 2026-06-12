'use client'

import {
  Clock, DollarSign, Loader2, MessageSquarePlus, RefreshCw, Save, Wrench,
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import { useDevRequests } from '../hooks/useDevRequests'

const STATUS_COLORS: Record<string, string> = {
  pendiente:   'text-gray-400 bg-gray-400/10 border-gray-400/20',
  en_revision: 'text-blue-400 bg-blue-400/10 border-blue-400/20',
  cotizado:    'text-yellow-400 bg-yellow-400/10 border-yellow-400/20',
  aprobado:    'text-emerald-400 bg-emerald-400/10 border-emerald-400/20',
  en_progreso: 'text-cyan-400 bg-cyan-400/10 border-cyan-400/20',
  completado:  'text-green-400 bg-green-400/10 border-green-400/20',
  rechazado:   'text-red-400 bg-red-400/10 border-red-400/20',
}

const STATUS_LABEL: Record<string, string> = {
  pendiente: 'Pendiente', en_revision: 'En revisión', cotizado: 'Cotizado',
  aprobado: 'Aprobado', en_progreso: 'En progreso', completado: 'Completado', rechazado: 'Rechazado',
}

const PRIO_COLORS: Record<string, string> = {
  baja: 'text-green-400', media: 'text-yellow-400', alta: 'text-red-400',
}

const TYPE_LABEL: Record<string, string> = {
  objetivo: '🎯', mejora: '✨', actualizacion: '🔄', bug: '🐛', otro: '❓',
}

export function DevRequestsTab() {
  const {
    devRequests, devRequestsLoading, fetchDevRequests,
    devHourlyRate, setDevHourlyRate, devWhatsapp, setDevWhatsapp,
    savingDevRate, handleSaveDevRate,
    quotingId, setQuotingId, quoteForm, setQuoteForm, openQuote, handleQuote,
    statusUpdateId, setStatusUpdateId, statusUpdateValue, setStatusUpdateValue,
    statusUpdateNotes, setStatusUpdateNotes, statusUpdateReject, setStatusUpdateReject,
    openStatusUpdate, handleStatusUpdate,
  } = useDevRequests()

  return (
    <div className="space-y-6">

      {/* Config tarifa */}
      <Card className="border-border bg-card">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-yellow-400" />
            Tarifa del Desarrollador
          </CardTitle>
          <CardDescription>
            Define el precio por hora que se usará para calcular el costo de cada solicitud
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-end gap-3 max-w-xl">
            <div className="flex-1 min-w-[180px] space-y-1.5">
              <Label className="text-xs">Precio por hora (COP)</Label>
              <Input
                type="number" min={0}
                value={devHourlyRate}
                onChange={e => setDevHourlyRate(e.target.value)}
                placeholder="Ej: 100000"
              />
            </div>
            <div className="flex-1 min-w-[200px] space-y-1.5">
              <Label className="text-xs flex items-center gap-1">
                <span>📱</span> WhatsApp de contacto
              </Label>
              <Input
                value={devWhatsapp}
                onChange={e => setDevWhatsapp(e.target.value)}
                placeholder="573001234567 (con código país)"
              />
            </div>
            <Button onClick={handleSaveDevRate} disabled={savingDevRate} className="gap-2 shrink-0">
              {savingDevRate ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Guardar
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            El número de WhatsApp aparecerá como opción de contacto cuando el comerciante reciba una cotización.
          </p>
        </CardContent>
      </Card>

      {/* Lista de solicitudes */}
      <Card className="border-border bg-card">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <MessageSquarePlus className="h-5 w-5 text-primary" />
              Solicitudes de Comerciantes
            </CardTitle>
            <Button variant="outline" size="sm" onClick={fetchDevRequests} className="gap-1">
              <RefreshCw className="h-3.5 w-3.5" />
              Actualizar
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {devRequestsLoading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : devRequests.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">
              <MessageSquarePlus className="h-10 w-10 mx-auto mb-2 opacity-30" />
              <p className="text-sm">No hay solicitudes aún</p>
            </div>
          ) : (
            <div className="space-y-3">
              {devRequests.map((req: any) => (
                <div key={req.id} className="rounded-lg border border-border bg-muted/30 p-4 space-y-3">
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="text-sm">{TYPE_LABEL[req.type] || '❓'}</span>
                        <span className="font-medium text-sm truncate">{req.title}</span>
                        <span className={`text-xs font-semibold ${PRIO_COLORS[req.priority] || 'text-muted-foreground'}`}>
                          {req.priority?.toUpperCase()}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {req.tenantName || req.tenantId} · {req.requesterName} · {new Date(req.createdAt).toLocaleDateString('es-CO')}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 flex-wrap">
                      <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${STATUS_COLORS[req.status] || ''}`}>
                        {STATUS_LABEL[req.status] || req.status}
                      </span>
                      {req.totalPrice !== null && (
                        <span className="text-xs font-bold text-yellow-400">
                          ${req.totalPrice.toLocaleString('es-CO')}
                        </span>
                      )}
                    </div>
                  </div>

                  <p className="text-sm text-muted-foreground line-clamp-2">{req.description}</p>

                  {req.estimatedHours !== null && (
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{req.estimatedHours}h</span>
                      <span className="flex items-center gap-1"><DollarSign className="h-3 w-3" />${(req.pricePerHour || 0).toLocaleString('es-CO')}/h</span>
                    </div>
                  )}

                  {req.adminNotes && (
                    <div className="rounded bg-blue-400/5 border border-blue-400/20 px-3 py-2">
                      <p className="text-xs text-blue-400 font-medium mb-0.5">Notas internas</p>
                      <p className="text-xs text-muted-foreground whitespace-pre-wrap">{req.adminNotes}</p>
                    </div>
                  )}

                  <div className="flex items-center gap-2 flex-wrap pt-1">
                    {req.status === 'pendiente' && (
                      <Button size="sm" variant="outline" className="h-7 text-xs gap-1" onClick={() => openQuote(req)}>
                        <DollarSign className="h-3 w-3" /> Cotizar
                      </Button>
                    )}
                    <Button size="sm" variant="outline" className="h-7 text-xs gap-1" onClick={() => openStatusUpdate(req)}>
                      <Wrench className="h-3 w-3" /> Cambiar estado
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog: Cotizar */}
      <Dialog open={!!quotingId} onOpenChange={() => setQuotingId(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-yellow-400" /> Cotizar Solicitud
            </DialogTitle>
            <DialogDescription>Define las horas estimadas y el precio por hora</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Horas estimadas</Label>
                <Input type="number" min={0.5} step={0.5}
                  value={quoteForm.estimatedHours}
                  onChange={e => setQuoteForm(p => ({ ...p, estimatedHours: e.target.value }))}
                  placeholder="Ej: 8"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Precio/hora (COP)</Label>
                <Input type="number" min={0}
                  value={quoteForm.pricePerHour}
                  onChange={e => setQuoteForm(p => ({ ...p, pricePerHour: e.target.value }))}
                  placeholder="Ej: 100000"
                />
              </div>
            </div>
            {quoteForm.estimatedHours && quoteForm.pricePerHour && (
              <div className="rounded-lg bg-yellow-400/10 border border-yellow-400/20 p-3 text-center">
                <p className="text-xs text-muted-foreground">Total estimado</p>
                <p className="text-xl font-bold text-yellow-400">
                  ${(Number(quoteForm.estimatedHours) * Number(quoteForm.pricePerHour)).toLocaleString('es-CO')}
                </p>
              </div>
            )}
            <div className="space-y-1.5">
              <Label className="text-xs">Notas para el comerciante (opcional)</Label>
              <Textarea
                value={quoteForm.adminNotes}
                onChange={e => setQuoteForm(p => ({ ...p, adminNotes: e.target.value }))}
                placeholder="Detalles adicionales sobre el alcance o condiciones..."
                rows={3} className="resize-none text-sm"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setQuotingId(null)}>Cancelar</Button>
            <Button onClick={handleQuote} className="gap-2">
              <DollarSign className="h-4 w-4" /> Enviar cotización
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog: Actualizar estado */}
      <Dialog open={!!statusUpdateId} onOpenChange={() => setStatusUpdateId(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Wrench className="h-5 w-5" /> Actualizar Estado
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-xs">Nuevo estado</Label>
              <select
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                value={statusUpdateValue}
                onChange={e => setStatusUpdateValue(e.target.value)}
              >
                <option value="pendiente">Pendiente</option>
                <option value="en_revision">En revisión</option>
                <option value="cotizado">Cotizado</option>
                <option value="aprobado">Aprobado</option>
                <option value="en_progreso">En progreso</option>
                <option value="completado">Completado</option>
                <option value="rechazado">Rechazado</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Notas (opcional)</Label>
              <Textarea
                value={statusUpdateNotes}
                onChange={e => setStatusUpdateNotes(e.target.value)}
                placeholder="Comentario para el comerciante..."
                rows={3} className="resize-none text-sm"
              />
            </div>
            {statusUpdateValue === 'rechazado' && (
              <div className="space-y-1.5">
                <Label className="text-xs text-red-400">Motivo de rechazo *</Label>
                <Textarea
                  value={statusUpdateReject}
                  onChange={e => setStatusUpdateReject(e.target.value)}
                  placeholder="Explica por qué se rechaza la solicitud..."
                  rows={2} className="resize-none text-sm border-red-400/30"
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setStatusUpdateId(null)}>Cancelar</Button>
            <Button onClick={handleStatusUpdate} className="gap-2">
              <Save className="h-4 w-4" /> Guardar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  )
}
