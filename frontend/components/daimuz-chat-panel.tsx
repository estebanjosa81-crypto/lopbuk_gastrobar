'use client'

// Panel del DAIMUZ Chat (boceto funcional). Activo solo en plan Empresarial.
// Modo Operativo (gestionas módulos) vs Modo ControlChat (la IA opera el negocio).
// El chat usa el asistente autenticado del comerciante (/assistant).
import { useEffect, useRef, useState } from 'react'
import { useAuthStore } from '@/lib/auth-store'
import { api } from '@/lib/api'

type Msg = { role: 'user' | 'assistant'; content: string }

export function DaimuzChatPanel() {
  const { user } = useAuthStore()
  const plan = (user as any)?.tenantPlan as string | undefined
  const isEmpresarial = plan === 'empresarial' || user?.role === 'superadmin'

  const [controlChat, setControlChat] = useState(false)
  const [history, setHistory] = useState<Msg[]>([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const logRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    logRef.current?.scrollTo({ top: logRef.current.scrollHeight, behavior: 'smooth' })
  }, [history, sending])

  const send = async () => {
    const text = input.trim()
    if (!text || sending) return
    setInput('')
    const next = [...history, { role: 'user' as const, content: text }]
    setHistory(next); setSending(true)
    try {
      const res = await api.platformAssistantSend(text, next.slice(-8))
      const reply = res?.success ? (res.data?.reply || 'Listo.') : (res?.error || 'El asistente no está disponible. Actívalo en Integraciones.')
      setHistory(h => [...h, { role: 'assistant', content: reply }])
    } catch {
      setHistory(h => [...h, { role: 'assistant', content: 'No me pude conectar. Intenta de nuevo.' }])
    } finally { setSending(false) }
  }

  if (!isEmpresarial) {
    return (
      <div className="max-w-xl mx-auto mt-16 rounded-2xl border border-border bg-card p-8 text-center">
        <div className="text-4xl mb-3">🤖</div>
        <h2 className="text-xl font-bold mb-2">DAIMUZ Chat</h2>
        <p className="text-sm text-muted-foreground mb-4">
          El DAIMUZ Chat (modo ControlChat) está disponible en el <strong>plan Empresarial</strong>.
          Deja que la IA opere tu negocio: publicar productos, ofertas y configurar tu tienda por chat.
        </p>
        <span className="inline-block text-xs font-semibold px-3 py-1 rounded-full bg-amber-500/15 text-amber-500">
          Requiere plan Empresarial
        </span>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto p-4 sm:p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">🤖 DAIMUZ Chat</h1>
          <p className="text-sm text-muted-foreground">Tu negocio, operado por IA.</p>
        </div>
        <span className="text-xs font-semibold px-3 py-1 rounded-full bg-primary/15 text-primary">Plan Empresarial</span>
      </div>

      {/* Toggle de modo */}
      <div className="rounded-2xl border border-border bg-card p-4 flex items-center justify-between gap-4">
        <div>
          <p className="font-semibold text-sm">Modo {controlChat ? 'ControlChat' : 'Operativo'}</p>
          <p className="text-xs text-muted-foreground">
            {controlChat
              ? 'La IA puede operar tu negocio y publicaciones (boceto — pronto ejecutará acciones reales).'
              : 'Tú gestionas los módulos a mano. Activa ControlChat para delegar en la IA.'}
          </p>
        </div>
        <button
          onClick={() => setControlChat(v => !v)}
          aria-pressed={controlChat}
          className="relative w-12 h-7 rounded-full transition-colors shrink-0"
          style={{ background: controlChat ? 'var(--primary, #6366f1)' : 'rgba(148,163,184,.4)' }}
        >
          <span className="absolute top-0.5 left-0.5 w-6 h-6 rounded-full bg-white transition-transform" style={{ transform: controlChat ? 'translateX(20px)' : 'none' }} />
        </button>
      </div>

      {/* Explicador de modos */}
      <div className="grid sm:grid-cols-2 gap-3">
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="font-semibold text-sm mb-1">🛠️ Operativo</p>
          <p className="text-xs text-muted-foreground">Control total: activas y usas tus módulos (POS, inventario, tienda…) según tu necesidad.</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="font-semibold text-sm mb-1">🤖 ControlChat</p>
          <p className="text-xs text-muted-foreground">Le escribes y la IA se encarga: publica productos, ofertas y configura tu negocio por ti.</p>
        </div>
      </div>

      {/* Chat */}
      <div className="rounded-2xl border border-border bg-card overflow-hidden">
        <div ref={logRef} className="h-72 overflow-y-auto p-4 space-y-2">
          {history.length === 0 && (
            <p className="text-sm text-muted-foreground text-center mt-20">
              Escríbele: «¿cómo van mis ventas hoy?» o «publica una oferta del 20%».
            </p>
          )}
          {history.map((m, i) => (
            <div key={i} className={`text-sm leading-relaxed px-3 py-2 rounded-2xl max-w-[85%] ${m.role === 'user' ? 'ml-auto bg-primary text-primary-foreground rounded-br-sm' : 'mr-auto bg-muted text-foreground rounded-bl-sm'}`}>
              {m.content}
            </div>
          ))}
          {sending && <div className="text-xs text-muted-foreground">DAIMUZ está escribiendo…</div>}
        </div>
        <form className="flex gap-2 p-3 border-t border-border" onSubmit={(e) => { e.preventDefault(); send() }}>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Escríbele a DAIMUZ Chat…"
            className="flex-1 rounded-full border border-input bg-background px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-ring"
          />
          <button type="submit" disabled={sending || !input.trim()} className="rounded-full bg-primary text-primary-foreground px-5 font-semibold text-sm disabled:opacity-50">Enviar</button>
        </form>
      </div>
      <p className="text-[11px] text-muted-foreground text-center">
        El asistente debe estar habilitado por el administrador (Integraciones) con una clave de IA.
      </p>
    </div>
  )
}

export default DaimuzChatPanel
