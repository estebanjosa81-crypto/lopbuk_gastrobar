'use client'

/**
 * DropsTab — Panel superadmin de Drops (V2). Programa eventos con ventana,
 * cupos y acceso gateado por Vault unlock; lista, cancela y ve el avance.
 */
import { useEffect, useState, useCallback } from 'react'
import { RefreshCw, Flame, Plus, Ban, Power } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { api } from '@/lib/api'

const COP = (n: number) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(Number(n) || 0)
const fmt = (d?: string) => (d ? new Date(d).toLocaleString('es-CO', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—')
const UNLOCKS = ['', 'drops', 'inner_circle', 'secret_theme', 'hidden_catalog', 'coach_room', 'leaderboard']

function state(d: any): { label: string; cls: string } {
  if (d.status === 'cancelled') return { label: 'Cancelado', cls: 'bg-red-100 text-red-700' }
  const now = Date.now(), s = new Date(d.startsAt).getTime(), e = new Date(d.endsAt).getTime()
  if (now < s) return { label: 'Próximo', cls: 'bg-sky-100 text-sky-700' }
  if (now > e) return { label: 'Cerrado', cls: 'bg-neutral-200 text-neutral-500' }
  if (d.slotsTaken >= d.totalSlots) return { label: 'Agotado', cls: 'bg-amber-100 text-amber-700' }
  return { label: 'En vivo', cls: 'bg-emerald-100 text-emerald-700' }
}

export function DropsTab() {
  const [drops, setDrops] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState('')
  const [creating, setCreating] = useState(false)

  const [f, setF] = useState({ title: '', subtitle: '', imageUrl: '', requiresUnlock: 'drops', startsAt: '', endsAt: '', totalSlots: '', priceCop: '' })

  const load = useCallback(async () => {
    setLoading(true)
    const r = await api.adminListDrops()
    if (r.success) setDrops(r.data || [])
    setLoading(false)
  }, [])
  useEffect(() => { load() }, [load])

  const create = async () => {
    if (!f.title.trim() || !f.startsAt || !f.endsAt || !f.totalSlots) { setErr('Completa título, fechas y cupos.'); return }
    setCreating(true); setErr('')
    const r = await api.adminCreateDrop({
      title: f.title.trim(), subtitle: f.subtitle.trim() || undefined, imageUrl: f.imageUrl.trim() || undefined,
      requiresUnlock: f.requiresUnlock || null,
      startsAt: new Date(f.startsAt).toISOString(), endsAt: new Date(f.endsAt).toISOString(),
      totalSlots: Number(f.totalSlots),
      productRef: f.priceCop ? { priceCop: Number(f.priceCop) } : undefined,
    })
    setCreating(false)
    if (!r.success) { setErr(r.error || 'No se pudo crear'); return }
    setF({ title: '', subtitle: '', imageUrl: '', requiresUnlock: 'drops', startsAt: '', endsAt: '', totalSlots: '', priceCop: '' })
    load()
  }

  const setStatus = async (id: string, status: 'scheduled' | 'cancelled') => { await api.adminUpdateDrop(id, { status }); load() }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Flame className="h-5 w-5 text-red-500" /> Nuevo Drop</CardTitle>
          <CardDescription>Un evento con ventana de tiempo, cupos contados y acceso gateado por Vault.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-3">
            <div><Label className="text-xs">Título</Label><Input value={f.title} onChange={e => setF({ ...f, title: e.target.value })} placeholder="Protein Drop" /></div>
            <div><Label className="text-xs">Subtítulo</Label><Input value={f.subtitle} onChange={e => setF({ ...f, subtitle: e.target.value })} placeholder="Edición limitada" /></div>
          </div>
          <div><Label className="text-xs">Imagen (URL)</Label><Input value={f.imageUrl} onChange={e => setF({ ...f, imageUrl: e.target.value })} placeholder="https://…" /></div>
          <div className="grid sm:grid-cols-2 gap-3">
            <div><Label className="text-xs">Inicio</Label><Input type="datetime-local" value={f.startsAt} onChange={e => setF({ ...f, startsAt: e.target.value })} /></div>
            <div><Label className="text-xs">Fin</Label><Input type="datetime-local" value={f.endsAt} onChange={e => setF({ ...f, endsAt: e.target.value })} /></div>
          </div>
          <div className="grid sm:grid-cols-3 gap-3">
            <div><Label className="text-xs">Cupos</Label><Input value={f.totalSlots} onChange={e => setF({ ...f, totalSlots: e.target.value.replace(/[^0-9]/g, '') })} placeholder="200" /></div>
            <div><Label className="text-xs">Precio COP (opcional)</Label><Input value={f.priceCop} onChange={e => setF({ ...f, priceCop: e.target.value.replace(/[^0-9]/g, '') })} placeholder="—" /></div>
            <div>
              <Label className="text-xs">Requiere unlock</Label>
              <select value={f.requiresUnlock} onChange={e => setF({ ...f, requiresUnlock: e.target.value })} className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm">
                {UNLOCKS.map(u => <option key={u || 'open'} value={u}>{u || 'Abierto a todos'}</option>)}
              </select>
            </div>
          </div>
          {err && <p className="text-sm text-red-500">{err}</p>}
          <Button onClick={create} disabled={creating}>
            {creating ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <Plus className="h-4 w-4 mr-2" />} Programar drop
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Drops</CardTitle>
            <Button variant="outline" size="sm" onClick={load} disabled={loading}><RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /></Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-10"><RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" /></div>
          ) : drops.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-10">Aún no has programado drops.</p>
          ) : (
            <div className="space-y-2">
              {drops.map(d => {
                const st = state(d)
                const pct = d.totalSlots ? Math.round((d.slotsTaken / d.totalSlots) * 100) : 0
                return (
                  <div key={d.id} className="border rounded-xl p-3">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-bold text-foreground">{d.title}</p>
                          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${st.cls}`}>{st.label}</span>
                          {d.requiresUnlock && <span className="text-[10px] bg-muted rounded-full px-2 py-0.5">👑 {d.requiresUnlock}</span>}
                        </div>
                        <p className="text-[11px] text-muted-foreground">{fmt(d.startsAt)} → {fmt(d.endsAt)}{d.productRef?.priceCop != null ? ` · ${COP(d.productRef.priceCop)}` : ''}</p>
                      </div>
                      <div className="shrink-0">
                        {d.status === 'cancelled'
                          ? <Button size="sm" variant="outline" onClick={() => setStatus(d.id, 'scheduled')}><Power className="h-3.5 w-3.5 mr-1" /> Reactivar</Button>
                          : <Button size="sm" variant="outline" className="text-red-600" onClick={() => setStatus(d.id, 'cancelled')}><Ban className="h-3.5 w-3.5 mr-1" /> Cancelar</Button>}
                      </div>
                    </div>
                    <div className="mt-2">
                      <div className="flex justify-between text-[11px] text-muted-foreground mb-1"><span>{d.slotsTaken}/{d.totalSlots} cupos</span><span>{pct}%</span></div>
                      <div className="h-1.5 rounded-full bg-muted overflow-hidden"><div className="h-full bg-foreground rounded-full" style={{ width: `${Math.min(100, pct)}%` }} /></div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
