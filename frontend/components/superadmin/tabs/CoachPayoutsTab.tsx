'use client'

/**
 * CoachPayoutsTab — Panel superadmin de retiros de coaches (T5).
 * Aprueba (procesar), marca pagados o rechaza las solicitudes de retiro.
 */
import { useEffect, useState, useCallback } from 'react'
import { RefreshCw, Wallet, Check, X, Clock } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { api } from '@/lib/api'

const COP = (n: number) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(Number(n) || 0)
const fmtDate = (d?: string) => (d ? new Date(d).toLocaleString('es-CO', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—')

const STATUS: Record<string, { label: string; cls: string }> = {
  requested: { label: 'Solicitado', cls: 'bg-amber-100 text-amber-700' },
  processing: { label: 'En proceso', cls: 'bg-sky-100 text-sky-700' },
  paid: { label: 'Pagado', cls: 'bg-emerald-100 text-emerald-700' },
  rejected: { label: 'Rechazado', cls: 'bg-red-100 text-red-700' },
}
const FILTERS = ['', 'requested', 'processing', 'paid', 'rejected']

export function CoachPayoutsTab() {
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [filter, setFilter] = useState('')
  const [busyId, setBusyId] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    const r = await api.adminListTrainerWithdrawals(filter || undefined)
    if (r.success) setItems(r.data || [])
    setLoading(false)
  }, [filter])
  useEffect(() => { load() }, [load])

  const act = async (id: string, status: 'processing' | 'paid' | 'rejected') => {
    if (status === 'rejected' && !confirm('¿Rechazar este retiro?')) return
    if (status === 'paid' && !confirm('¿Confirmas que ya pagaste este retiro? Se descontará del saldo del coach.')) return
    setBusyId(id)
    const note = status === 'rejected' ? (prompt('Motivo (opcional):') || undefined) : undefined
    const r = await api.adminProcessTrainerWithdrawal(id, status, note)
    setBusyId(null)
    if (!r.success) { alert(r.error || 'No se pudo actualizar'); return }
    load()
  }

  const totalPending = items.filter(i => ['requested', 'processing'].includes(i.status)).reduce((s, i) => s + (i.amountCop || 0), 0)

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div>
            <CardTitle className="flex items-center gap-2"><Wallet className="h-5 w-5 text-primary" /> Retiros de coaches</CardTitle>
            <CardDescription>Solicitudes de pago de los entrenadores. Por pagar: {COP(totalPending)}.</CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={load} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-1.5 flex-wrap">
          {FILTERS.map(f => (
            <button key={f || 'all'} onClick={() => setFilter(f)}
              className={`text-xs font-medium px-3 py-1.5 rounded-full ${filter === f ? 'bg-foreground text-background' : 'bg-muted text-muted-foreground hover:text-foreground'}`}>
              {f ? (STATUS[f]?.label || f) : 'Todos'}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-12"><RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" /></div>
        ) : items.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-12">No hay retiros{filter ? ` en estado "${STATUS[filter]?.label}"` : ''}.</p>
        ) : (
          <div className="space-y-2">
            {items.map(w => {
              const st = STATUS[w.status] || STATUS.requested
              const isFinal = w.status === 'paid' || w.status === 'rejected'
              return (
                <div key={w.id} className="border rounded-xl p-3 flex items-center justify-between gap-3 flex-wrap">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-foreground">{COP(w.amountCop)}</p>
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${st.cls}`}>{st.label}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">{w.trainerName} · {w.paymentMethod}</p>
                    <p className="text-[11px] text-muted-foreground flex items-center gap-1"><Clock className="h-3 w-3" />{fmtDate(w.createdAt)} · saldo coach {COP(w.trainerBalanceCop)}</p>
                    {w.note && <p className="text-[11px] text-muted-foreground italic">{w.note}</p>}
                  </div>
                  {!isFinal && (
                    <div className="flex gap-1.5 shrink-0">
                      {w.status === 'requested' && (
                        <Button size="sm" variant="outline" disabled={busyId === w.id} onClick={() => act(w.id, 'processing')}>
                          <Clock className="h-3.5 w-3.5 mr-1" /> Procesar
                        </Button>
                      )}
                      <Button size="sm" disabled={busyId === w.id} onClick={() => act(w.id, 'paid')} className="bg-emerald-600 hover:bg-emerald-700">
                        <Check className="h-3.5 w-3.5 mr-1" /> Pagado
                      </Button>
                      <Button size="sm" variant="outline" disabled={busyId === w.id} onClick={() => act(w.id, 'rejected')} className="text-red-600">
                        <X className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
