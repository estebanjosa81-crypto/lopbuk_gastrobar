'use client'

/**
 * NotificationsBell — campana de notificaciones del comercio.
 * Muestra el contador de no leídas y un dropdown con las últimas.
 * Auto-actualiza cada 60s.
 */
import { useEffect, useRef, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Bell, Check, ShoppingBag } from 'lucide-react'
import { api } from '@/lib/api'

const API_URL = process.env.NEXT_PUBLIC_API_URL || '/api'

interface Notif { id: string; type: string; title: string; body: string | null; link: string | null; isRead: boolean; createdAt: string }

async function nReq<T = any>(path: string, options: RequestInit = {}): Promise<T> {
  const token = api.getToken?.()
  const res = await fetch(`${API_URL}/notifications${path}`, {
    ...options, credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}), ...(options.headers || {}) },
  })
  const body = await res.json().catch(() => ({}))
  if (!res.ok || body?.success === false) throw new Error(body?.error || 'Error')
  return (body?.data ?? body) as T
}

const timeAgo = (iso: string) => {
  const d = new Date(iso).getTime(); if (isNaN(d)) return ''
  const s = Math.floor((Date.now() - d) / 1000)
  if (s < 60) return 'ahora'; const m = Math.floor(s / 60); if (m < 60) return `${m} min`
  const h = Math.floor(m / 60); if (h < 24) return `${h} h`; return `${Math.floor(h / 24)} d`
}

export function NotificationsBell() {
  const router = useRouter()
  const [count, setCount] = useState(0)
  const [open, setOpen] = useState(false)
  const [items, setItems] = useState<Notif[] | null>(null)
  const ref = useRef<HTMLDivElement | null>(null)

  const loadCount = useCallback(async () => {
    try { const r = await nReq<{ count: number }>('/unread-count'); setCount(r.count) } catch { /* noop */ }
  }, [])

  useEffect(() => {
    loadCount()
    const t = setInterval(loadCount, 60_000)
    return () => clearInterval(t)
  }, [loadCount])

  useEffect(() => {
    const onClick = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false) }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  const toggle = async () => {
    const next = !open
    setOpen(next)
    if (next) { try { setItems(await nReq<Notif[]>('')) } catch { setItems([]) } }
  }

  const openNotif = async (n: Notif) => {
    try { if (!n.isRead) { await nReq(`/${n.id}/read`, { method: 'POST' }); setCount(c => Math.max(0, c - 1)) } } catch { /* */ }
    setItems(prev => prev?.map(x => x.id === n.id ? { ...x, isRead: true } : x) ?? prev)
    if (n.link) { if (n.link.startsWith('/')) router.push(n.link); else window.open(n.link, '_blank') }
    setOpen(false)
  }

  const markAll = async () => {
    try { await nReq('/read-all', { method: 'POST' }); setCount(0); setItems(prev => prev?.map(x => ({ ...x, isRead: true })) ?? prev) } catch { /* */ }
  }

  return (
    <div className="relative" ref={ref}>
      <button onClick={toggle} className="relative inline-flex items-center justify-center h-9 w-9 rounded-full hover:bg-accent text-muted-foreground" aria-label="Notificaciones">
        <Bell className="h-5 w-5" />
        {count > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-medium text-destructive-foreground">
            {count > 99 ? '99+' : count}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 max-h-[70vh] overflow-y-auto rounded-xl border bg-popover shadow-lg z-50">
          <div className="flex items-center justify-between px-4 py-2.5 border-b">
            <span className="font-semibold text-sm">Notificaciones</span>
            {count > 0 && <button onClick={markAll} className="text-xs text-primary inline-flex items-center gap-1"><Check className="h-3 w-3" /> Marcar leídas</button>}
          </div>
          {items === null ? (
            <p className="px-4 py-6 text-sm text-muted-foreground text-center">Cargando…</p>
          ) : items.length === 0 ? (
            <p className="px-4 py-8 text-sm text-muted-foreground text-center">Sin notificaciones.</p>
          ) : (
            <ul>
              {items.map(n => (
                <li key={n.id}>
                  <button onClick={() => openNotif(n)} className={`w-full text-left px-4 py-3 flex gap-3 hover:bg-accent transition ${n.isRead ? '' : 'bg-primary/5'}`}>
                    <span className="mt-0.5 text-muted-foreground"><ShoppingBag className="h-4 w-4" /></span>
                    <span className="flex-1 min-w-0">
                      <span className="block text-sm font-medium leading-snug">{n.title}</span>
                      {n.body && <span className="block text-xs text-muted-foreground mt-0.5">{n.body}</span>}
                      <span className="block text-[11px] text-muted-foreground/70 mt-1">{timeAgo(n.createdAt)}</span>
                    </span>
                    {!n.isRead && <span className="mt-1 h-2 w-2 rounded-full bg-primary shrink-0" />}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}

export default NotificationsBell
