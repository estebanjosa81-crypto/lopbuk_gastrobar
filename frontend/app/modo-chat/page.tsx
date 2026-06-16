'use client'

// Modo Chat Daimuz. En escritorio: chat + panel de administración (KPIs en vivo).
// En móvil: solo el chat. Ambos con botón para volver al modo operativo (panel).
// Al entrar muestra el loader de cajas por estética.
import { useCallback, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { api } from '@/lib/api'
import { BoxLoader } from '@/components/box-loader'

type Msg = { role: 'user' | 'assistant'; content: string }
type Pending = { tool: string; args: any; label: string }

const A = '#6366f1'
const money = (n: number) => '$' + Number(n || 0).toLocaleString('es-CO')
const MODULE_LABEL: Record<string, string> = { restbar: 'Mesas / Restbar', inventory: 'Inventario', sales: 'Ventas / POS' }

const SUGGESTIONS = [
  { icon: '📊', text: '¿Cómo van mis ventas hoy y este mes?' },
  { icon: '📦', text: '¿Qué productos están por agotarse?' },
  { icon: '🧾', text: '¿Tengo pedidos pendientes?' },
  { icon: '🍽️', text: '¿Qué mesas están ocupadas?' },
  { icon: '➕', text: 'Abre la mesa 5' },
  { icon: '🧠', text: 'Dame un resumen del negocio con recomendaciones' },
]

export default function ModoChatDaimuz() {
  const router = useRouter()
  const [entering, setEntering] = useState(true)
  const [messages, setMessages] = useState<Msg[]>([])
  const [input, setInput] = useState('')
  const [busy, setBusy] = useState(false)
  const [pending, setPending] = useState<Pending | null>(null)
  const [refreshTarget, setRefreshTarget] = useState<string | null>(null)
  const [overview, setOverview] = useState<any>(null)
  const endRef = useRef<HTMLDivElement>(null)

  useEffect(() => { const t = setTimeout(() => setEntering(false), 900); return () => clearTimeout(t) }, [])
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages, pending, busy])

  const loadOverview = useCallback(async () => {
    const r = await api.getDaimuzOverview()
    if (r.success && r.data) setOverview(r.data)
  }, [])
  useEffect(() => { loadOverview() }, [loadOverview])

  const ask = async (text: string) => {
    if (!text.trim() || busy) return
    setInput(''); setPending(null)
    const history = messages.slice(-8)
    setMessages(m => [...m, { role: 'user', content: text }])
    setBusy(true)
    try {
      const r = await api.daimuzChatRestbar(text, history)
      if (r.success && r.data) {
        setMessages(m => [...m, { role: 'assistant', content: r.data!.reply }])
        if (r.data.pendingAction) setPending(r.data.pendingAction)
      } else {
        setMessages(m => [...m, { role: 'assistant', content: r.error || 'No pude responder.' }])
      }
    } finally { setBusy(false) }
  }

  const confirm = async () => {
    if (!pending || busy) return
    setBusy(true)
    const action = pending
    setPending(null)
    try {
      const r = await api.daimuzChatExecute(action.tool, action.args)
      setMessages(m => [...m, { role: 'assistant', content: r.success ? `✅ ${r.data?.message || 'Hecho.'}` : `⚠️ ${r.error || 'No se pudo ejecutar.'}` }])
      if (r.success && r.data?.refresh) { setRefreshTarget(r.data.refresh); loadOverview() }
    } finally { setBusy(false) }
  }

  if (entering) {
    return <div className="min-h-screen flex items-center justify-center bg-background"><BoxLoader /></div>
  }

  const empty = messages.length === 0

  const Kpi = ({ label, value, hint, accent }: { label: string; value: string; hint?: string; accent?: string }) => (
    <div className="rounded-xl border border-border bg-card p-3">
      <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="text-lg font-black mt-0.5" style={accent ? { color: accent } : undefined}>{value}</p>
      {hint && <p className="text-[11px] text-muted-foreground">{hint}</p>}
    </div>
  )

  return (
    <div className="h-screen flex flex-col bg-background text-foreground">
      {/* Header */}
      <header className="px-4 py-3 border-b border-border flex items-center gap-3">
        <button onClick={() => router.push('/')} className="text-sm font-semibold rounded-lg border border-border px-3 py-1.5 hover:bg-accent flex items-center gap-1">
          ← Volver al panel
        </button>
        <span className="grid place-items-center w-8 h-8 rounded-lg text-white" style={{ background: A }}>💬</span>
        <div>
          <h1 className="font-black leading-none">Chat Daimuz</h1>
          <p className="text-[11px] text-muted-foreground">Tu negocio, por conversación</p>
        </div>
      </header>

      <div className="flex-1 min-h-0 flex">
        {/* Columna de chat */}
        <section className="flex-1 flex flex-col min-h-0">
          <div className="flex-1 overflow-y-auto px-4 py-6">
            <div className="max-w-2xl mx-auto w-full">
              {empty ? (
                <div className="mt-6 text-center">
                  <div className="text-5xl mb-3">💬</div>
                  <h2 className="text-xl font-black mb-1">¿Qué necesitas de tu negocio?</h2>
                  <p className="text-sm text-muted-foreground mb-6">Pídeme estadísticas, análisis o que opere tus mesas, inventario y ventas. Solo escribe.</p>
                  <div className="grid sm:grid-cols-2 gap-2 text-left">
                    {SUGGESTIONS.map(s => (
                      <button key={s.text} onClick={() => ask(s.text)} className="flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-2.5 text-sm hover:border-foreground/30 transition-colors">
                        <span>{s.icon}</span><span>{s.text}</span>
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {messages.map((m, i) => (
                    <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[82%] rounded-2xl px-4 py-2.5 text-sm whitespace-pre-wrap ${m.role === 'user' ? 'text-white' : 'bg-card border border-border'}`} style={m.role === 'user' ? { background: A } : undefined}>
                        {m.content}
                      </div>
                    </div>
                  ))}
                  {pending && (
                    <div className="flex justify-start">
                      <div className="max-w-[85%] rounded-2xl border-2 p-4" style={{ borderColor: A }}>
                        <p className="text-sm font-semibold mb-1">Confirmar acción</p>
                        <p className="text-sm text-muted-foreground mb-3">{pending.label}</p>
                        <div className="flex gap-2">
                          <button onClick={confirm} disabled={busy} className="rounded-lg px-4 py-2 text-sm font-semibold text-white disabled:opacity-60" style={{ background: A }}>{busy ? 'Ejecutando…' : 'Confirmar'}</button>
                          <button onClick={() => setPending(null)} disabled={busy} className="rounded-lg px-4 py-2 text-sm font-semibold border border-border">Cancelar</button>
                        </div>
                      </div>
                    </div>
                  )}
                  {busy && !pending && <div className="text-xs text-muted-foreground px-1">Pensando…</div>}
                </div>
              )}
              <div ref={endRef} />
            </div>
          </div>

          {refreshTarget && (
            <div className="max-w-2xl mx-auto w-full px-4 pb-2 lg:hidden">
              <div className="flex items-center justify-between rounded-xl border border-green-500/30 bg-green-500/10 px-3 py-2 text-sm">
                <span>✅ {MODULE_LABEL[refreshTarget] || refreshTarget} actualizado</span>
                <button onClick={() => { setRefreshTarget(null); router.push('/') }} className="text-xs font-semibold underline">Abrir panel ↗</button>
              </div>
            </div>
          )}

          <div className="border-t border-border p-3">
            <div className="max-w-2xl mx-auto flex gap-2">
              <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && ask(input)} placeholder="Escribe lo que quieres hacer o saber…" className="flex-1 rounded-xl bg-card border border-border px-4 py-3 text-sm outline-none" />
              <button onClick={() => ask(input)} disabled={busy || !input.trim()} className="rounded-xl px-5 font-semibold text-white disabled:opacity-50" style={{ background: A }}>Enviar</button>
            </div>
          </div>
        </section>

        {/* Panel de administración (solo escritorio) */}
        <aside className="hidden lg:flex w-[340px] shrink-0 flex-col border-l border-border bg-muted/20 overflow-y-auto">
          <div className="p-4 border-b border-border flex items-center justify-between">
            <h2 className="font-bold text-sm">Panel del negocio</h2>
            <button onClick={loadOverview} className="text-[11px] font-semibold text-muted-foreground hover:text-foreground">Actualizar</button>
          </div>
          <div className="p-4 grid grid-cols-2 gap-2">
            <Kpi label="Ventas hoy" value={money(overview?.ventasHoy || 0)} hint={`${overview?.ventasHoyN || 0} ventas`} accent={A} />
            <Kpi label="Ventas mes" value={money(overview?.ventasMes || 0)} hint={`${overview?.ventasMesN || 0} ventas`} />
            <Kpi label="Pedidos pend." value={String(overview?.pedidosPendientes ?? 0)} accent={(overview?.pedidosPendientes || 0) > 0 ? '#f59e0b' : undefined} />
            <Kpi label="Stock crítico" value={String(overview?.stockCritico ?? 0)} accent={(overview?.stockCritico || 0) > 0 ? '#f87171' : undefined} />
            <Kpi label="Mesas ocupadas" value={`${overview?.mesasOcupadas ?? 0}/${overview?.mesasTotal ?? 0}`} />
          </div>
          <div className="px-4 pb-4">
            <p className="text-[11px] uppercase tracking-wide text-muted-foreground mb-2">Acciones rápidas</p>
            <div className="flex flex-col gap-1.5">
              {['¿Tengo pedidos pendientes?', '¿Qué productos están por agotarse?', '¿Qué mesas están ocupadas?'].map(t => (
                <button key={t} onClick={() => ask(t)} className="text-left text-xs rounded-lg border border-border bg-card px-3 py-2 hover:border-foreground/30">{t}</button>
              ))}
            </div>
            {refreshTarget && (
              <div className="mt-4 rounded-xl border border-green-500/30 bg-green-500/10 px-3 py-2 text-xs">
                ✅ {MODULE_LABEL[refreshTarget] || refreshTarget} actualizado ·{' '}
                <button onClick={() => router.push('/')} className="font-semibold underline">Abrir panel ↗</button>
              </div>
            )}
          </div>
        </aside>
      </div>
    </div>
  )
}
