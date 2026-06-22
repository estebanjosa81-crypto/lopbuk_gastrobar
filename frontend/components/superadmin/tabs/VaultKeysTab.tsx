'use client'

/**
 * VaultKeysTab — Panel superadmin del Vault / Access Ecosystem (V1).
 * Emite "Vault Keys" que desbloquean interfaces ocultas del OS, lista y deshabilita.
 */
import { useEffect, useState, useCallback } from 'react'
import { RefreshCw, KeyRound, Plus, Copy, Check, Ban, Power } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { api } from '@/lib/api'

const UNLOCK_LABEL: Record<string, string> = {
  secret_theme: '🌑 Tema secreto', hidden_catalog: '🗝️ Catálogo oculto', coach_room: '🥷 Sala de coach',
  drops: '🔥 Drops', leaderboard: '🏆 Leaderboard', inner_circle: '👑 Inner Circle',
}
const fmtDate = (d?: string) => (d ? new Date(d).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' }) : '—')

export function VaultKeysTab() {
  const [keys, setKeys] = useState<any[]>([])
  const [types, setTypes] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState('')

  // Crear
  const [label, setLabel] = useState('')
  const [selected, setSelected] = useState<string[]>([])
  const [keyType, setKeyType] = useState('multi')
  const [maxRedemptions, setMaxRedemptions] = useState('')
  const [message, setMessage] = useState('')
  const [customCode, setCustomCode] = useState('')
  const [creating, setCreating] = useState(false)
  const [err, setErr] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    const [k, t] = await Promise.all([api.adminListVaultKeys(), api.getVaultUnlockTypes()])
    if (k.success) setKeys(k.data || [])
    if (t.success) setTypes(t.data || [])
    setLoading(false)
  }, [])
  useEffect(() => { load() }, [load])

  const toggle = (u: string) => setSelected(s => s.includes(u) ? s.filter(x => x !== u) : [...s, u])

  const create = async () => {
    if (!label.trim() || selected.length === 0) { setErr('Pon un nombre y al menos una interfaz.'); return }
    setCreating(true); setErr('')
    const r = await api.adminCreateVaultKey({
      label: label.trim(),
      unlocks: { keys: selected, message: message.trim() || undefined },
      keyType, code: customCode.trim() || undefined,
      maxRedemptions: maxRedemptions ? Number(maxRedemptions) : null,
    })
    setCreating(false)
    if (!r.success) { setErr(r.error || 'No se pudo crear'); return }
    setLabel(''); setSelected([]); setMaxRedemptions(''); setMessage(''); setCustomCode('')
    load()
  }

  const setStatus = async (id: string, status: 'active' | 'disabled') => {
    await api.adminUpdateVaultKey(id, { status }); load()
  }
  const copy = (code: string) => { navigator.clipboard?.writeText(code); setCopied(code); setTimeout(() => setCopied(''), 1500) }

  return (
    <div className="space-y-6">
      {/* Crear */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><KeyRound className="h-5 w-5 text-primary" /> Nueva Vault Key</CardTitle>
          <CardDescription>Un Access Pass que desbloquea interfaces ocultas del OS del cliente.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Nombre interno</Label>
              <Input value={label} onChange={e => setLabel(e.target.value)} placeholder="Ej. Founders Pass" />
            </div>
            <div>
              <Label className="text-xs">Código (opcional)</Label>
              <Input value={customCode} onChange={e => setCustomCode(e.target.value.toUpperCase())} placeholder="Auto: VAULT-XXXXX" />
            </div>
          </div>

          <div>
            <Label className="text-xs">Desbloquea</Label>
            <div className="flex flex-wrap gap-1.5 mt-1">
              {(types.length ? types : Object.keys(UNLOCK_LABEL)).map(u => (
                <button key={u} onClick={() => toggle(u)}
                  className={`text-xs font-medium px-2.5 py-1.5 rounded-full border ${selected.includes(u) ? 'bg-foreground text-background border-foreground' : 'bg-background text-muted-foreground border-input hover:text-foreground'}`}>
                  {UNLOCK_LABEL[u] || u}
                </button>
              ))}
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Tipo</Label>
              <select value={keyType} onChange={e => setKeyType(e.target.value)} className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm">
                <option value="multi">Multi-uso</option>
                <option value="one_use">Un solo uso</option>
                <option value="window">Por ventana</option>
              </select>
            </div>
            <div>
              <Label className="text-xs">Máx. canjes (opcional)</Label>
              <Input value={maxRedemptions} onChange={e => setMaxRedemptions(e.target.value.replace(/[^0-9]/g, ''))} placeholder="Ilimitado" />
            </div>
          </div>

          <div>
            <Label className="text-xs">Mensaje del reveal (opcional)</Label>
            <Input value={message} onChange={e => setMessage(e.target.value)} placeholder="Bienvenido al círculo…" />
          </div>

          {err && <p className="text-sm text-red-500">{err}</p>}
          <Button onClick={create} disabled={creating}>
            {creating ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <Plus className="h-4 w-4 mr-2" />} Emitir llave
          </Button>
        </CardContent>
      </Card>

      {/* Lista */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Llaves emitidas</CardTitle>
            <Button variant="outline" size="sm" onClick={load} disabled={loading}><RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /></Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-10"><RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" /></div>
          ) : keys.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-10">Aún no has emitido llaves.</p>
          ) : (
            <div className="space-y-2">
              {keys.map(k => (
                <div key={k.id} className="border rounded-xl p-3 flex items-center justify-between gap-3 flex-wrap">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <code className="text-sm font-bold bg-muted px-2 py-0.5 rounded">{k.code}</code>
                      <button onClick={() => copy(k.code)} className="text-muted-foreground hover:text-foreground">
                        {copied === k.code ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                      </button>
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${k.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-neutral-200 text-neutral-500'}`}>{k.status === 'active' ? 'Activa' : 'Deshabilitada'}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">{k.label}</p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {(k.unlocks || []).map((u: string) => <span key={u} className="text-[10px] bg-muted rounded-full px-2 py-0.5">{UNLOCK_LABEL[u] || u}</span>)}
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-1">
                      {k.redemptions} canje{k.redemptions === 1 ? '' : 's'}{k.maxRedemptions != null ? ` / ${k.maxRedemptions}` : ''} · {fmtDate(k.createdAt)}
                    </p>
                  </div>
                  <div className="shrink-0">
                    {k.status === 'active'
                      ? <Button size="sm" variant="outline" className="text-red-600" onClick={() => setStatus(k.id, 'disabled')}><Ban className="h-3.5 w-3.5 mr-1" /> Deshabilitar</Button>
                      : <Button size="sm" variant="outline" onClick={() => setStatus(k.id, 'active')}><Power className="h-3.5 w-3.5 mr-1" /> Reactivar</Button>}
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
