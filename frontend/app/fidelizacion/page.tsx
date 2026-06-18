'use client'

// Panel admin de fidelización (Fase 3): reglas de puntos, catálogo de recompensas,
// cuentas de clientes y otorgar puntos por consumo.
import { useEffect, useState, useCallback } from 'react'
import { api } from '@/lib/api'
import { toast } from 'sonner'

export default function LoyaltyAdminPage() {
  const [tab, setTab] = useState<'config' | 'rewards' | 'accounts'>('config')

  // Config
  const [enabled, setEnabled] = useState(true)
  const [ppt, setPpt] = useState(1)
  const [savingCfg, setSavingCfg] = useState(false)

  // Rewards
  const [rewards, setRewards] = useState<any[]>([])
  const [rName, setRName] = useState('')
  const [rDesc, setRDesc] = useState('')
  const [rCost, setRCost] = useState('')

  // Accounts
  const [accounts, setAccounts] = useState<any[]>([])
  const [search, setSearch] = useState('')
  const [earnPhone, setEarnPhone] = useState('')
  const [earnName, setEarnName] = useState('')
  const [earnAmount, setEarnAmount] = useState('')

  const loadCfg = useCallback(async () => {
    const r = await api.getLoyaltyConfig()
    if (r.success && r.data) { setEnabled(r.data.enabled); setPpt(r.data.pointsPerThousand) }
  }, [])
  const loadRewards = useCallback(async () => {
    const r = await api.getLoyaltyRewards()
    if (r.success) setRewards(r.data?.rewards || [])
  }, [])
  const loadAccounts = useCallback(async (q = '') => {
    const r = await api.getLoyaltyAccounts(q)
    if (r.success) setAccounts(r.data?.accounts || [])
  }, [])

  useEffect(() => { loadCfg(); loadRewards(); loadAccounts() }, [loadCfg, loadRewards, loadAccounts])

  const saveCfg = async () => {
    setSavingCfg(true)
    const r = await api.updateLoyaltyConfig({ enabled, pointsPerThousand: Number(ppt) })
    setSavingCfg(false)
    r.success ? toast.success('Configuración guardada') : toast.error(r.error ?? 'Error')
  }

  const addReward = async () => {
    if (!rName.trim() || !(Number(rCost) > 0)) { toast.error('Nombre y costo válido requeridos'); return }
    const r = await api.createLoyaltyReward({ name: rName.trim(), description: rDesc.trim(), pointsCost: Number(rCost) })
    if (r.success) { setRName(''); setRDesc(''); setRCost(''); loadRewards(); toast.success('Recompensa creada') }
    else toast.error(r.error ?? 'Error')
  }
  const toggleReward = async (rw: any) => {
    const r = await api.updateLoyaltyReward(rw.id, { isActive: rw.isActive ? 0 : 1 })
    if (r.success) loadRewards()
  }
  const delReward = async (id: string) => {
    const r = await api.deleteLoyaltyReward(id)
    if (r.success) loadRewards()
  }

  const doEarn = async () => {
    if (!earnPhone.trim() || !(Number(earnAmount) > 0)) { toast.error('Teléfono y monto requeridos'); return }
    const r = await api.loyaltyEarn({ phone: earnPhone.trim(), name: earnName.trim(), amount: Number(earnAmount) })
    if (r.success) { toast.success(`+${r.data?.points ?? 0} pts otorgados`); setEarnPhone(''); setEarnName(''); setEarnAmount(''); loadAccounts(search) }
    else toast.error(r.error ?? 'Error')
  }

  const TABS = [['config', '⚙️ Reglas'], ['rewards', '🎁 Recompensas'], ['accounts', '👤 Cuentas']] as const

  return (
    <div className="min-h-screen bg-background text-foreground p-5 max-w-3xl mx-auto">
      <h1 className="text-2xl font-black mb-1">⭐ Fidelización</h1>
      <p className="text-sm text-muted-foreground mb-5">Puntos por consumo y recompensas canjeables por tus clientes.</p>

      <div className="flex gap-2 mb-6">
        {TABS.map(([id, label]) => (
          <button key={id} onClick={() => setTab(id as any)}
            className={`px-3 py-2 rounded-lg text-sm font-semibold ${tab === id ? 'bg-amber-500 text-black' : 'border border-border'}`}>
            {label}
          </button>
        ))}
      </div>

      {tab === 'config' && (
        <div className="rounded-2xl border border-border bg-card p-5 max-w-md space-y-4">
          <label className="flex items-center justify-between">
            <span className="font-semibold">Programa activo</span>
            <input type="checkbox" checked={enabled} onChange={e => setEnabled(e.target.checked)} className="w-5 h-5 accent-amber-500" />
          </label>
          <div>
            <label className="block text-sm font-semibold mb-1">Puntos por cada $1.000 de consumo</label>
            <input type="number" min={0} step="0.5" value={ppt} onChange={e => setPpt(Number(e.target.value))}
              className="w-full rounded-lg bg-background border border-border px-3 py-2.5" />
            <p className="text-xs text-muted-foreground mt-1">Ej.: con 1, un consumo de $50.000 otorga 50 puntos.</p>
          </div>
          <button onClick={saveCfg} disabled={savingCfg} className="rounded-lg bg-amber-500 text-black font-semibold px-4 py-2.5 disabled:opacity-60">
            {savingCfg ? 'Guardando…' : 'Guardar'}
          </button>
        </div>
      )}

      {tab === 'rewards' && (
        <div className="space-y-5">
          <div className="rounded-2xl border border-border bg-card p-4 grid sm:grid-cols-4 gap-2 items-end">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold mb-1">Nombre</label>
              <input value={rName} onChange={e => setRName(e.target.value)} placeholder="Postre gratis" className="w-full rounded-lg bg-background border border-border px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1">Costo (pts)</label>
              <input type="number" value={rCost} onChange={e => setRCost(e.target.value)} className="w-full rounded-lg bg-background border border-border px-3 py-2 text-sm" />
            </div>
            <button onClick={addReward} className="rounded-lg bg-amber-500 text-black font-semibold px-4 py-2 text-sm">Agregar</button>
            <div className="sm:col-span-4">
              <input value={rDesc} onChange={e => setRDesc(e.target.value)} placeholder="Descripción (opcional)" className="w-full rounded-lg bg-background border border-border px-3 py-2 text-sm" />
            </div>
          </div>
          {rewards.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">Aún no hay recompensas.</p>
          ) : (
            <div className="space-y-2">
              {rewards.map(rw => (
                <div key={rw.id} className={`flex items-center gap-3 rounded-xl border p-3 ${rw.isActive ? 'border-border bg-card' : 'border-border bg-card opacity-50'}`}>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold">{rw.name}</p>
                    {rw.description && <p className="text-xs text-muted-foreground">{rw.description}</p>}
                  </div>
                  <span className="font-bold text-amber-500">{rw.pointsCost} pts</span>
                  <button onClick={() => toggleReward(rw)} className="text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-border">{rw.isActive ? 'Ocultar' : 'Activar'}</button>
                  <button onClick={() => delReward(rw.id)} className="text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-border text-red-400">Eliminar</button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === 'accounts' && (
        <div className="space-y-5">
          <div className="rounded-2xl border border-border bg-card p-4">
            <p className="font-semibold mb-2">Otorgar puntos por consumo</p>
            <div className="grid sm:grid-cols-4 gap-2 items-end">
              <input value={earnPhone} onChange={e => setEarnPhone(e.target.value)} placeholder="Teléfono" className="rounded-lg bg-background border border-border px-3 py-2 text-sm" />
              <input value={earnName} onChange={e => setEarnName(e.target.value)} placeholder="Nombre (opcional)" className="rounded-lg bg-background border border-border px-3 py-2 text-sm" />
              <input type="number" value={earnAmount} onChange={e => setEarnAmount(e.target.value)} placeholder="Monto $" className="rounded-lg bg-background border border-border px-3 py-2 text-sm" />
              <button onClick={doEarn} className="rounded-lg bg-amber-500 text-black font-semibold px-4 py-2 text-sm">Otorgar</button>
            </div>
          </div>
          <div className="flex gap-2">
            <input value={search} onChange={e => setSearch(e.target.value)} onKeyDown={e => e.key === 'Enter' && loadAccounts(search)} placeholder="Buscar por nombre o teléfono"
              className="flex-1 rounded-lg bg-background border border-border px-3 py-2 text-sm" />
            <button onClick={() => loadAccounts(search)} className="rounded-lg border border-border px-4 text-sm font-semibold">Buscar</button>
          </div>
          {accounts.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">Sin cuentas.</p>
          ) : (
            <div className="space-y-2">
              {accounts.map(a => (
                <div key={a.id} className="flex items-center gap-3 rounded-xl border border-border bg-card p-3">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold">{a.name || 'Sin nombre'}</p>
                    <p className="text-xs text-muted-foreground">{a.phone}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-black text-amber-500">{a.balance} pts</p>
                    <p className="text-[11px] text-muted-foreground">acumulado {a.totalEarned}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
