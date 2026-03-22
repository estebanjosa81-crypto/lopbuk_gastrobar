'use client'

import { useState, useEffect } from 'react'
import { api } from '@/lib/api'
import { formatCOP } from '@/lib/utils'
import type { Service } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { Calendar, Clock, CheckCircle, ChevronLeft, ChevronRight } from 'lucide-react'

interface Props {
  service: Service
  storeSlug: string
  onClose: () => void
}

const DAYS_SHORT = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']

const BUDGET_OPTIONS = [
  'Menos de $500.000',
  '$500.000 - $1.000.000',
  '$1.000.000 - $3.000.000',
  'Más de $3.000.000',
  'Sin presupuesto definido',
]

export function ServiceBookingModal({ service, storeSlug, onClose }: Props) {
  const [step, setStep] = useState<'calendar' | 'form' | 'success'>('calendar')

  // Calendar
  const [calDate, setCalDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState('')
  const [slots, setSlots] = useState<string[]>([])
  const [loadingSlots, setLoadingSlots] = useState(false)
  const [selectedSlot, setSelectedSlot] = useState('')

  // Form
  const [form, setForm] = useState({
    clientName: '', clientPhone: '', clientEmail: '', clientNotes: '',
    preferredDateRange: '', projectDescription: '', budgetRange: '',
  })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isCita = service.serviceType === 'cita'
  const isAsesoria = service.serviceType === 'asesoria'

  // For contact/asesoria types, skip to form directly
  useEffect(() => {
    if (!isCita) setStep('form')
  }, [isCita])

  // Load slots when date is selected
  useEffect(() => {
    if (!selectedDate || !isCita) return
    setLoadingSlots(true)
    setSlots([])
    setSelectedSlot('')
    api.getPublicSlots(service.id, storeSlug, selectedDate).then((res) => {
      if (res.success && res.data) setSlots(res.data)
    }).finally(() => setLoadingSlots(false))
  }, [selectedDate, service.id, storeSlug, isCita])

  const calYear = calDate.getFullYear()
  const calMonth = calDate.getMonth()
  const firstDay = new Date(calYear, calMonth, 1).getDay()
  const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate()
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const maxDate = new Date()
  maxDate.setDate(maxDate.getDate() + service.maxAdvanceDays)

  const isDaySelectable = (day: number) => {
    const d = new Date(calYear, calMonth, day)
    return d >= today && d <= maxDate
  }

  const handleDayClick = (day: number) => {
    if (!isDaySelectable(day)) return
    const dateStr = `${calYear}-${String(calMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    setSelectedDate(dateStr)
  }

  const handleSubmit = async () => {
    setError(null)
    if (!form.clientName.trim()) { setError('Nombre requerido'); return }
    if (!form.clientPhone.trim()) { setError('Teléfono requerido'); return }
    if (isCita && !selectedSlot) { setError('Selecciona un horario'); return }

    setSubmitting(true)
    try {
      const res = await api.createPublicBooking(storeSlug, {
        serviceId: service.id,
        clientName: form.clientName.trim(),
        clientPhone: form.clientPhone.trim(),
        clientEmail: form.clientEmail.trim() || undefined,
        clientNotes: form.clientNotes.trim() || undefined,
        ...(isCita && selectedDate && selectedSlot ? {
          bookingDate: selectedDate,
          startTime: selectedSlot.split('-')[0],
        } : {}),
        ...(isAsesoria ? {
          preferredDateRange: form.preferredDateRange || undefined,
          projectDescription: form.projectDescription || undefined,
          budgetRange: form.budgetRange || undefined,
        } : {}),
      })

      if (res.success) {
        setStep('success')
      } else {
        setError(res.error || 'No se pudo enviar la reserva')
      }
    } finally {
      setSubmitting(false)
    }
  }

  const priceLabel = () => {
    if (service.priceType === 'gratis') return 'Gratis'
    if (service.priceType === 'cotizacion') return 'Cotización'
    return `${service.priceType === 'desde' ? 'Desde ' : ''}${formatCOP(service.price)}`
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{service.name}</DialogTitle>
          <div className="flex items-center gap-2 text-sm text-muted-foreground pt-1">
            <span className="font-semibold text-foreground">{priceLabel()}</span>
            {service.durationMinutes && (
              <span className="flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" /> {service.durationMinutes} min
              </span>
            )}
            <Badge variant="outline" className="text-xs capitalize">{service.serviceType}</Badge>
          </div>
          {service.description && (
            <p className="text-sm text-muted-foreground">{service.description}</p>
          )}
        </DialogHeader>

        {/* ── Step: Calendar ──────────────────────────────────── */}
        {step === 'calendar' && isCita && (
          <div className="space-y-4 py-2">
            {/* Month navigation */}
            <div className="flex items-center justify-between">
              <Button variant="outline" size="icon" className="h-8 w-8"
                onClick={() => setCalDate(new Date(calYear, calMonth - 1, 1))}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="font-medium capitalize">
                {calDate.toLocaleDateString('es-CO', { month: 'long', year: 'numeric' })}
              </span>
              <Button variant="outline" size="icon" className="h-8 w-8"
                onClick={() => setCalDate(new Date(calYear, calMonth + 1, 1))}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>

            {/* Day headers */}
            <div className="grid grid-cols-7 text-center text-xs font-medium text-muted-foreground">
              {DAYS_SHORT.map((d) => <div key={d} className="py-1">{d}</div>)}
            </div>

            {/* Calendar grid */}
            <div className="grid grid-cols-7 gap-1">
              {Array.from({ length: firstDay }).map((_, i) => <div key={`e${i}`} />)}
              {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((day) => {
                const dateStr = `${calYear}-${String(calMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
                const selectable = isDaySelectable(day)
                const isSelected = selectedDate === dateStr
                const isToday = new Date().toDateString() === new Date(calYear, calMonth, day).toDateString()
                return (
                  <button key={day}
                    disabled={!selectable}
                    onClick={() => handleDayClick(day)}
                    className={`
                      h-9 w-full rounded-md text-sm font-medium transition-colors
                      ${!selectable ? 'text-muted-foreground/40 cursor-not-allowed' : 'hover:bg-accent cursor-pointer'}
                      ${isSelected ? 'bg-primary text-primary-foreground hover:bg-primary' : ''}
                      ${isToday && !isSelected ? 'border border-primary text-primary' : ''}
                    `}
                  >
                    {day}
                  </button>
                )
              })}
            </div>

            {/* Time slots */}
            {selectedDate && (
              <div className="space-y-2">
                <p className="text-sm font-medium">
                  Horarios disponibles — {new Date(selectedDate + 'T00:00:00').toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long' })}
                </p>
                {loadingSlots ? (
                  <div className="flex justify-center py-4">
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                  </div>
                ) : slots.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-3">
                    No hay horarios disponibles para este día
                  </p>
                ) : (
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                    {slots.map((slot) => {
                      const startTime = slot.split('-')[0]
                      const isSelected = selectedSlot === slot
                      return (
                        <button key={slot} onClick={() => setSelectedSlot(isSelected ? '' : slot)}
                          className={`
                            rounded-md border py-2 text-sm font-medium transition-colors
                            ${isSelected ? 'bg-primary text-primary-foreground border-primary' : 'hover:bg-accent border-border'}
                          `}
                        >
                          {startTime}
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>
            )}

            <DialogFooter>
              <Button variant="outline" onClick={onClose}>Cancelar</Button>
              <Button disabled={!selectedDate || !selectedSlot} onClick={() => setStep('form')}>
                Continuar <Calendar className="ml-2 h-4 w-4" />
              </Button>
            </DialogFooter>
          </div>
        )}

        {/* ── Step: Form ──────────────────────────────────────── */}
        {step === 'form' && (
          <div className="space-y-4 py-2">
            {isCita && selectedDate && selectedSlot && (
              <div className="rounded-md bg-primary/10 px-4 py-3 text-sm">
                <p className="font-semibold text-primary">
                  {new Date(selectedDate + 'T00:00:00').toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long' })}
                  {' '}&bull;{' '}{selectedSlot.split('-')[0]}
                </p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2 space-y-1.5">
                <Label>Nombre <span className="text-destructive">*</span></Label>
                <Input placeholder="Tu nombre completo" value={form.clientName}
                  onChange={(e) => setForm((p) => ({ ...p, clientName: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label>Teléfono <span className="text-destructive">*</span></Label>
                <Input placeholder="300 123 4567" value={form.clientPhone}
                  onChange={(e) => setForm((p) => ({ ...p, clientPhone: e.target.value }))} />
              </div>
              <div className="space-y-1.5">
                <Label>Email</Label>
                <Input type="email" placeholder="tu@email.com" value={form.clientEmail}
                  onChange={(e) => setForm((p) => ({ ...p, clientEmail: e.target.value }))} />
              </div>

              {isAsesoria && (
                <>
                  <div className="col-span-2 space-y-1.5">
                    <Label>¿Qué necesitas?</Label>
                    <Textarea rows={3} placeholder="Describe tu proyecto o necesidad..."
                      value={form.projectDescription}
                      onChange={(e) => setForm((p) => ({ ...p, projectDescription: e.target.value }))} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>¿Cuándo lo necesitas?</Label>
                    <Input placeholder="Ej: Próximo mes, urgente..." value={form.preferredDateRange}
                      onChange={(e) => setForm((p) => ({ ...p, preferredDateRange: e.target.value }))} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Presupuesto aproximado</Label>
                    <Select value={form.budgetRange}
                      onValueChange={(v) => setForm((p) => ({ ...p, budgetRange: v }))}>
                      <SelectTrigger className="h-9"><SelectValue placeholder="Seleccionar..." /></SelectTrigger>
                      <SelectContent>
                        {BUDGET_OPTIONS.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </>
              )}

              <div className="col-span-2 space-y-1.5">
                <Label>{isAsesoria ? 'Notas adicionales' : 'Notas (opcional)'}</Label>
                <Textarea rows={2} placeholder="Alguna indicación especial..."
                  value={form.clientNotes}
                  onChange={(e) => setForm((p) => ({ ...p, clientNotes: e.target.value }))} />
              </div>
            </div>

            {error && <p className="text-sm text-destructive bg-destructive/10 rounded px-3 py-2">{error}</p>}

            <DialogFooter>
              {isCita && (
                <Button variant="outline" onClick={() => setStep('calendar')}>
                  <ChevronLeft className="mr-1 h-4 w-4" /> Cambiar hora
                </Button>
              )}
              <Button variant="outline" onClick={onClose}>Cancelar</Button>
              <Button onClick={handleSubmit} disabled={submitting}>
                {submitting ? (
                  <><div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" /> Enviando...</>
                ) : (
                  isCita ? 'Confirmar reserva' : 'Enviar solicitud'
                )}
              </Button>
            </DialogFooter>
          </div>
        )}

        {/* ── Step: Success ───────────────────────────────────── */}
        {step === 'success' && (
          <div className="flex flex-col items-center justify-center py-8 text-center space-y-3">
            <div className="rounded-full bg-green-100 p-4">
              <CheckCircle className="h-10 w-10 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold">
              {isCita ? '¡Reserva enviada!' : '¡Solicitud recibida!'}
            </h3>
            <p className="text-sm text-muted-foreground max-w-xs">
              {isCita
                ? 'Tu cita está pendiente de confirmación. Te contactaremos para confirmarte el horario.'
                : 'Hemos recibido tu solicitud. Nos pondremos en contacto contigo pronto.'}
            </p>
            {service.cancellationHours > 0 && isCita && (
              <p className="text-xs text-muted-foreground">
                Cancelaciones con mínimo {service.cancellationHours}h de anticipación.
              </p>
            )}
            <Button onClick={onClose} className="mt-2">Cerrar</Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
