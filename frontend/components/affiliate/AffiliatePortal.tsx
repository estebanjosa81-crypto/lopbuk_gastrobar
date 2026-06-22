'use client'

/**
 * AffiliatePortal — portal del Promotor/Curador (V4). Auth propia (affiliateToken).
 * El afiliado es CURADOR: emite Vault Keys que desbloquean interfaces ocultas del
 * OS, ve su tier/comisión y su posición en el leaderboard.
 */
import { useEffect, useState } from 'react'
import { Loader2, KeyRound, Trophy, Wallet, LogOut, Plus, Copy, Check, Crown } from 'lucide-react'
import { api } from '@/lib/api'

const COP = (n: number) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(Number(n) || 0)
const TIER_META: Record<string, { label: string; cls: string; emoji: string }> = {
  bronze: { label: 'Bronce', cls: 'bg-amber-100 text-amber-800', emoji: '🥉' },
  silver: { label: 'Plata', cls: 'bg-neutral-200 text-neutral-700', emoji: '🥈' },
  gold: { label: 'Oro', cls: 'bg-yellow-100 text-yellow-800', emoji: '🥇' },
}
// Interfaces que un curador puede repartir (subconjunto seguro).
const CURATOR_UNLOCKS: Record<string, string> = {
  drops: '🔥 Drops', hidden_catalog: '🗝️ Catálogo oculto', secret_theme: '🌑 Tema secreto', inner_circle: '👑 Inner Circle',
}

export default function AffiliatePortal() {
  const [loading, setLoading] = useState(true)
  const [me, setMe] = useState<any>(null)

  useEffect(() => { api.getAffiliateMe().then(r => { if (r.success) setMe(r.data) }).finally(() => setLoading(false)) }, [])

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-neutral-950"><Loader2 className="w-7 h-7 animate-spin text-amber-400" /></div>
  if (!me) return <AuthView onAuthed={setMe} />
  return <Dashboard me={me} onLogout={async () => { await api.affiliateLogout(); setMe(null) }} />
}

function AuthView({ onAuthed }: { onAuthed: (a: any) => void }) {
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [form, setForm] = useState({ name: '', email: '', password: '', handle: '' })
  const [err, setErr] = useState(''); const [busy, setBusy] = useState(false)

  const submit = async () => {
    setErr(''); setBusy(true)
    try {
      const r = mode === 'login'
        ? await api.affiliateLogin(form.email, form.password)
        : await api.affiliateRegister({ name: form.name, email: form.email, password: form.password, handle: form.handle || undefined })
      if (r.success && r.data?.affiliate) { onAuthed(r.data.affiliate); return }
      setErr(r.error || 'No se pudo continuar.')
    } finally { setBusy(false) }
  }

  return (
    <div className="min-h-screen bg-neutral-950 text-white flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="flex items-center gap-2 justify-center mb-6"><KeyRound className="w-6 h-6 text-amber-400" /><h1 className="text-xl font-extrabold">Portal Curador</h1></div>
        <div className="bg-neutral-900 rounded-2xl p-6 border border-white/10 space-y-3">
          <p className="text-sm text-white/60 text-center mb-2">{mode === 'login' ? 'Entra a tu panel de promotor' : 'Crea tu cuenta de curador'}</p>
          {mode === 'register' && <input placeholder="Nombre" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="w-full rounded-xl bg-neutral-800 border border-white/10 px-3 py-2.5 text-sm focus:outline-none focus:border-amber-400" />}
          <input placeholder="Email" type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className="w-full rounded-xl bg-neutral-800 border border-white/10 px-3 py-2.5 text-sm focus:outline-none focus:border-amber-400" />
          <input placeholder="Contraseña" type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} onKeyDown={e => e.key === 'Enter' && submit()} className="w-full rounded-xl bg-neutral-800 border border-white/10 px-3 py-2.5 text-sm focus:outline-none focus:border-amber-400" />
          {mode === 'register' && <input placeholder="@usuario (opcional)" value={form.handle} onChange={e => setForm({ ...form, handle: e.target.value })} className="w-full rounded-xl bg-neutral-800 border border-white/10 px-3 py-2.5 text-sm focus:outline-none focus:border-amber-400" />}
          {err && <p className="text-sm text-red-400">{err}</p>}
          <button onClick={submit} disabled={busy} className="w-full rounded-xl bg-amber-400 text-neutral-900 font-bold py-2.5 disabled:opacity-60 flex items-center justify-center gap-2">{busy ? <Loader2 className="w-4 h-4 animate-spin" /> : mode === 'login' ? 'Entrar' : 'Crear cuenta'}</button>
          <button onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setErr('') }} className="w-full text-center text-xs text-white/50 hover:text-white pt-1">{mode === 'login' ? '¿No tienes cuenta? Regístrate' : '¿Ya tienes cuenta? Inicia sesión'}</button>
        </div>
      </div>
    </div>
  )
}

function Dashboard({ me, onLogout }: { me: any; onLogout: () => void }) {
  const [keys, setKeys] = useState<any[]>([])
  const [board, setBoard] = useState<any[]>([])
  const [copied, setCopied] = useState('')

  const load = async () => {
    const [k, b] = await Promise.all([api.getAffiliateVaultKeys(), api.getAffiliateLeaderboard()])
    if (k.success) setKeys(k.data || [])
    if (b.success) setBoard(b.data || [])
  }
  useEffect(() => { load() }, [])

  const tier = TIER_META[me.tier] || TIER_META.bronze
  const myRank = board.find(b => b.id === me.id)?.rank
  const copy = (c: string) => { navigator.clipboard?.writeText(c); setCopied(c); setTimeout(() => setCopied(''), 1500) }

  return (
    <div className="min-h-screen bg-neutral-100">
      <header className="bg-neutral-950 text-white px-4 sm:px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2"><KeyRound className="w-5 h-5 text-amber-400" /><div><p className="font-bold leading-tight">{me.name}</p><p className="text-[11px] text-white/50">Curador DAIMUZ</p></div></div>
        <button onClick={onLogout} className="text-white/50 hover:text-white flex items-center gap-1.5 text-sm"><LogOut className="w-4 h-4" /> Salir</button>
      </header>

      <main className="max-w-3xl mx-auto p-4 sm:p-6 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Stat icon={Crown} label="Tier" value={`${tier.emoji} ${tier.label}`} />
          <Stat icon={Trophy} label="Ranking" value={myRank ? `#${myRank}` : '—'} />
          <Stat icon={Wallet} label="Disponible" value={COP(me.balanceCop)} accent="text-emerald-600" />
          <Stat icon={KeyRound} label="Ventas/mes" value={String(me.monthlySales || 0)} />
        </div>

        <EmitKey onCreated={load} />

        {/* Mis llaves */}
        <div>
          <h3 className="text-sm font-bold text-neutral-800 mb-2">Tus Vault Keys</h3>
          {keys.length === 0 ? (
            <p className="text-sm text-neutral-400 text-center py-8">Aún no has emitido llaves. Crea la primera para repartir acceso.</p>
          ) : (
            <div className="space-y-2">
              {keys.map(k => (
                <div key={k.id} className="bg-white rounded-xl border border-black/[0.06] p-3 flex items-center justify-between gap-3 flex-wrap">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <code className="text-sm font-bold bg-neutral-100 px-2 py-0.5 rounded">{k.code}</code>
                      <button onClick={() => copy(k.code)} className="text-neutral-400 hover:text-neutral-700">{copied === k.code ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}</button>
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${k.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-neutral-200 text-neutral-500'}`}>{k.status === 'active' ? 'Activa' : 'Off'}</span>
                    </div>
                    <p className="text-xs text-neutral-500 mt-0.5">{k.label}</p>
                    <div className="flex flex-wrap gap-1 mt-1">{(k.unlocks || []).map((u: string) => <span key={u} className="text-[10px] bg-neutral-100 rounded-full px-2 py-0.5">{CURATOR_UNLOCKS[u] || u}</span>)}</div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-bold text-neutral-900">{k.redemptions}{k.maxRedemptions != null ? `/${k.maxRedemptions}` : ''}</p>
                    <p className="text-[10px] text-neutral-400">canjes</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

function EmitKey({ onCreated }: { onCreated: () => void }) {
  const [open, setOpen] = useState(false)
  const [label, setLabel] = useState('')
  const [selected, setSelected] = useState<string[]>(['drops'])
  const [max, setMax] = useState('')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')

  const toggle = (u: string) => setSelected(s => s.includes(u) ? s.filter(x => x !== u) : [...s, u])
  const submit = async () => {
    if (!label.trim() || selected.length === 0) { setErr('Pon un nombre y al menos una interfaz.'); return }
    setBusy(true); setErr('')
    const r = await api.createAffiliateVaultKey({ label: label.trim(), unlocks: { keys: selected }, maxRedemptions: max ? Number(max) : undefined })
    setBusy(false)
    if (!r.success) { setErr(r.error || 'No se pudo emitir'); return }
    setLabel(''); setSelected(['drops']); setMax(''); setOpen(false); onCreated()
  }

  if (!open) return <button onClick={() => setOpen(true)} className="w-full rounded-2xl bg-neutral-900 text-white font-semibold py-3 flex items-center justify-center gap-2 hover:bg-black"><Plus className="w-4 h-4" /> Emitir Vault Key</button>

  return (
    <div className="bg-white rounded-2xl border border-black/[0.07] p-4 space-y-3">
      <h3 className="font-bold text-neutral-900">Nueva Vault Key</h3>
      <input value={label} onChange={e => setLabel(e.target.value)} placeholder="Nombre (ej. Drop VIP de @tu_handle)" className="w-full rounded-xl border border-neutral-200 px-3 py-2.5 text-sm focus:outline-none focus:border-amber-400" />
      <div>
        <p className="text-xs font-medium text-neutral-500 mb-1">Desbloquea</p>
        <div className="flex flex-wrap gap-1.5">
          {Object.entries(CURATOR_UNLOCKS).map(([k, v]) => (
            <button key={k} onClick={() => toggle(k)} className={`text-xs font-medium px-2.5 py-1.5 rounded-full border ${selected.includes(k) ? 'bg-neutral-900 text-white border-neutral-900' : 'bg-white text-neutral-500 border-neutral-200'}`}>{v}</button>
          ))}
        </div>
      </div>
      <input inputMode="numeric" value={max} onChange={e => setMax(e.target.value.replace(/[^0-9]/g, ''))} placeholder="Máx. canjes (por defecto 100)" className="w-full rounded-xl border border-neutral-200 px-3 py-2.5 text-sm focus:outline-none focus:border-amber-400" />
      {err && <p className="text-sm text-red-500">{err}</p>}
      <div className="flex gap-2">
        <button onClick={() => setOpen(false)} className="flex-1 rounded-xl border border-neutral-200 text-sm font-medium py-2.5 hover:bg-neutral-50">Cancelar</button>
        <button onClick={submit} disabled={busy} className="flex-1 rounded-xl bg-amber-400 text-neutral-900 text-sm font-bold py-2.5 disabled:opacity-50 flex items-center justify-center gap-2">{busy ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Emitir'}</button>
      </div>
    </div>
  )
}

function Stat({ icon: Icon, label, value, accent }: { icon: any; label: string; value: string; accent?: string }) {
  return (
    <div className="bg-white rounded-2xl border border-black/[0.06] p-3">
      <Icon className={`w-4 h-4 ${accent || 'text-neutral-400'}`} />
      <p className={`text-base font-extrabold mt-1.5 ${accent || 'text-neutral-900'}`}>{value}</p>
      <p className="text-[11px] text-neutral-400">{label}</p>
    </div>
  )
}
