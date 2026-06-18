'use client'

// Panel de staff: cola de la rocola del local. Reproduce, marca como sonada o salta.
import { useEffect, useState, useCallback, useRef } from 'react'
import { api } from '@/lib/api'
import { toast } from 'sonner'

type Song = { id: string; title: string; url?: string | null; requestedBy?: string | null; status: 'queued' | 'playing' | 'played' | 'skipped'; createdAt?: string }

export default function JukeboxStaffPage() {
  const [queue, setQueue] = useState<Song[]>([])
  const [loading, setLoading] = useState(true)
  const pollRef = useRef<any>(null)

  const load = useCallback(async () => {
    const r = await api.getJukeboxQueue()
    if (r.success) setQueue((r.data?.queue || []) as Song[])
    setLoading(false)
  }, [])

  useEffect(() => {
    load()
    pollRef.current = setInterval(load, 8000)
    return () => { if (pollRef.current) clearInterval(pollRef.current) }
  }, [load])

  const setStatus = async (id: string, status: Song['status']) => {
    setQueue(prev => status === 'played' || status === 'skipped'
      ? prev.filter(s => s.id !== id)
      : prev.map(s => ({ ...s, status: s.id === id ? status : (status === 'playing' && s.status === 'playing' ? 'queued' : s.status) })))
    const r = await api.updateJukeboxStatus(id, status)
    if (!r.success) { toast.error(r.error ?? 'Error'); load() }
  }

  return (
    <div className="min-h-screen bg-background text-foreground p-5 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-2xl font-black">🎵 Rocola del local</h1>
        <button onClick={load} className="text-xs font-semibold rounded-full px-3 py-1.5 border border-border hover:bg-accent">Actualizar</button>
      </div>

      {loading ? (
        <p className="text-muted-foreground text-center py-10">Cargando…</p>
      ) : queue.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-5xl mb-3">🎧</div>
          <p className="text-muted-foreground">No hay canciones en la cola.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {queue.map((s, i) => (
            <div key={s.id} className={`flex items-center gap-3 rounded-xl border p-3 ${s.status === 'playing' ? 'border-purple-500/60 bg-purple-500/10' : 'border-border bg-card'}`}>
              <span className="w-6 text-center font-bold text-muted-foreground">{s.status === 'playing' ? '▶️' : i + 1}</span>
              <div className="flex-1 min-w-0">
                <p className="font-semibold truncate">{s.title}</p>
                <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                  {s.requestedBy && <span>Pedida por {s.requestedBy}</span>}
                  {s.url && <a href={s.url} target="_blank" rel="noopener noreferrer" className="underline text-purple-400">abrir link</a>}
                </div>
              </div>
              {s.status !== 'playing' && (
                <button onClick={() => setStatus(s.id, 'playing')} title="Reproducir"
                  className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-purple-600 text-white">▶ Sonar</button>
              )}
              <button onClick={() => setStatus(s.id, 'played')} title="Marcar como sonada"
                className="px-2.5 py-1.5 rounded-lg text-xs font-semibold border border-border hover:bg-accent">✓</button>
              <button onClick={() => setStatus(s.id, 'skipped')} title="Saltar"
                className="px-2.5 py-1.5 rounded-lg text-xs font-semibold border border-border hover:bg-accent text-muted-foreground">✕</button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
