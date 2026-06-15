'use client'

// Robot flotante (Spline) conectado al asistente público de DAIMUZ.
// Nube de respuesta ARRIBA del robot (no lo tapa), chat debajo.
import { useEffect, useRef, useState, createElement, type CSSProperties } from 'react'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'
const SPLINE_VIEWER_SRC = 'https://unpkg.com/@splinetool/viewer/build/spline-viewer.js'
const DEFAULT_SCENE = 'https://prod.spline.design/FcZ66SFMX1YbF-0I/scene.splinecode'

type Msg = { role: 'user' | 'assistant'; content: string }

export function RobotAssistant({
  sceneUrl = DEFAULT_SCENE,
  accent = '#6366f1',
  robotHeight = 280,
}: { sceneUrl?: string; accent?: string; robotHeight?: number }) {
  const [ready, setReady] = useState(false)
  const [input, setInput] = useState('')
  const [history, setHistory] = useState<Msg[]>([])
  const [bubble, setBubble] = useState<string>('¡Hola! Soy DAIMUZ 👋 ¿En qué te ayudo?')
  const [typing, setTyping] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const existing = document.querySelector(`script[src="${SPLINE_VIEWER_SRC}"]`)
    if (existing) { setReady(true); return }
    const sc = document.createElement('script')
    sc.type = 'module'; sc.src = SPLINE_VIEWER_SRC
    sc.onload = () => setReady(true); sc.onerror = () => setReady(false)
    document.head.appendChild(sc)
  }, [])

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [history, typing])

  const revealBubble = (full: string) => {
    let i = 0; setBubble('')
    const step = () => { i += 2; setBubble(full.slice(0, i)); if (i < full.length) setTimeout(step, 16) }
    step()
  }

  const send = async () => {
    const text = input.trim()
    if (!text || typing) return
    setInput('')
    const nextHistory = [...history, { role: 'user' as const, content: text }]
    setHistory(nextHistory)
    setBubble('…'); setTyping(true)
    try {
      const res = await fetch(`${API_URL}/chatbot/platform-assistant/message`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, history: nextHistory.slice(-8) }),
      })
      const json = await res.json()
      const reply = json?.data?.reply || json?.error || 'No pude responder ahora mismo.'
      setHistory(h => [...h, { role: 'assistant', content: reply }])
      revealBubble(reply)
    } catch {
      const reply = 'Ups, no me pude conectar. Intenta de nuevo.'
      setHistory(h => [...h, { role: 'assistant', content: reply }]); setBubble(reply)
    } finally { setTyping(false) }
  }

  const accentStyle = { ['--ra-accent' as string]: accent } as CSSProperties

  return (
    <div className="ra-wrap" style={accentStyle}>
      <style>{`
        .ra-wrap { width: 100%; max-width: 440px; margin: 0 auto; }
        /* Nube de respuesta — arriba, nunca tapa al robot */
        .ra-cloud-row { display: flex; justify-content: center; min-height: 84px; padding: 0 6px; }
        .ra-cloud {
          position: relative; background: #fff; color: #0f172a;
          border-radius: 22px; padding: 12px 18px; max-width: 100%;
          font-size: 14px; line-height: 1.45; text-align: center;
          box-shadow: 0 16px 40px rgba(0,0,0,.35); animation: ra-pop .3s ease both;
        }
        .ra-cloud::before, .ra-cloud::after { content:''; position:absolute; background:#fff; border-radius:50%; }
        .ra-cloud::before { width:16px; height:16px; left:18%; bottom:-6px; }
        .ra-cloud::after  { width:10px; height:10px; left:12%; bottom:-15px; }
        .ra-dots span { display:inline-block; width:6px; height:6px; border-radius:50%; background:#94a3b8; margin:0 2px; animation: ra-blink 1s infinite; }
        .ra-dots span:nth-child(2){animation-delay:.2s}.ra-dots span:nth-child(3){animation-delay:.4s}
        @keyframes ra-blink {0%,80%,100%{opacity:.3}40%{opacity:1}}
        @keyframes ra-pop {from{opacity:0;transform:translateY(8px) scale(.96)}to{opacity:1;transform:translateY(0) scale(1)}}
        .ra-stage { position: relative; width: 100%; }
        .ra-stage spline-viewer { width: 100%; height: 100%; display: block; }
        .ra-fallback { width:100%; height:100%; display:flex; align-items:center; justify-content:center; font-size:64px; }
        .ra-log { max-height: 120px; overflow-y: auto; display:flex; flex-direction:column; gap:6px; margin: 8px 0; }
        .ra-msg { font-size:13px; line-height:1.4; padding:7px 12px; border-radius:14px; max-width:85%; }
        .ra-msg.user { align-self:flex-end; background: var(--ra-accent); color:#fff; border-bottom-right-radius:4px; }
        .ra-msg.bot  { align-self:flex-start; background: rgba(255,255,255,.08); color:#e5e7eb; border-bottom-left-radius:4px; }
        .ra-form { display:flex; gap:8px; }
        .ra-input { flex:1; border-radius:999px; border:1px solid rgba(255,255,255,.18); background:rgba(255,255,255,.06); color:#fff; padding:11px 16px; font-size:14px; outline:none; }
        .ra-input::placeholder { color: rgba(255,255,255,.45); }
        .ra-send { border:none; border-radius:999px; padding:0 18px; color:#fff; font-weight:700; cursor:pointer; background: var(--ra-accent); }
        .ra-send:disabled { opacity:.5; cursor:not-allowed; }
      `}</style>

      <div className="ra-cloud-row">
        <div className="ra-cloud">
          {bubble === '…' ? <span className="ra-dots"><span /><span /><span /></span> : bubble}
        </div>
      </div>

      <div className="ra-stage" style={{ height: robotHeight }}>
        {ready
          ? createElement('spline-viewer' as any, { url: sceneUrl, 'events-target': 'global' })
          : <div className="ra-fallback" aria-hidden="true">🤖</div>}
      </div>

      <div>
        {history.length > 0 && (
          <div className="ra-log" ref={scrollRef}>
            {history.map((m, i) => (
              <div key={i} className={`ra-msg ${m.role === 'user' ? 'user' : 'bot'}`}>{m.content}</div>
            ))}
          </div>
        )}
        <form className="ra-form" onSubmit={(e) => { e.preventDefault(); send() }}>
          <input className="ra-input" value={input} onChange={(e) => setInput(e.target.value)} placeholder="Escríbele al robot…" aria-label="Mensaje para el asistente" />
          <button className="ra-send" type="submit" disabled={typing || !input.trim()}>Enviar</button>
        </form>
      </div>
    </div>
  )
}

export default RobotAssistant
