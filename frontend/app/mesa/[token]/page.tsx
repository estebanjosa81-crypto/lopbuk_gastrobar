'use client'

// Vista pública del cliente: escanea el QR de la mesa → entra con su nombre →
// ve el menú (con disponibilidad real) → pide desde su móvil → sigue el estado
// de su pedido en vivo. El pedido entra a la comanda real (KDS). La sesión se
// invalida cuando se cobra/cancela.
import { useEffect, useState, useCallback, useRef } from 'react'
import { useParams } from 'next/navigation'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'
const A = '#6366f1'
const money = (n: number) => '$' + Number(n || 0).toLocaleString('es-CO')

type Item = { id: string; name: string; price: number; availableInMenu: boolean; category: string; imageUrl?: string | null; description?: string | null }
type OrderItem = { name: string; quantity: number; status: string; notes?: string | null }

const STATUS: Record<string, { label: string; icon: string; color: string }> = {
  pendiente: { label: 'Pendiente', icon: '🕓', color: '#9ca3af' },
  en_preparacion: { label: 'En preparación', icon: '👨‍🍳', color: '#f59e0b' },
  preparando: { label: 'En preparación', icon: '👨‍🍳', color: '#f59e0b' },
  listo: { label: 'Listo', icon: '✅', color: '#22c55e' },
  entregado: { label: 'Entregado', icon: '🍽️', color: '#6366f1' },
}
const stat = (s: string) => STATUS[s] || { label: s || 'Pendiente', icon: '🕓', color: '#9ca3af' }

export default function MesaPage() {
  const { token } = useParams<{ token: string }>()
  const [phase, setPhase] = useState<'loading' | 'invalid' | 'join' | 'menu' | 'track'>('loading')
  const [error, setError] = useState('')
  const [brand, setBrand] = useState('Restaurante')
  const [tableNumber, setTableNumber] = useState('')
  const [menu, setMenu] = useState<Item[]>([])
  const [name, setName] = useState('')
  const [cart, setCart] = useState<Record<string, number>>({})
  const [busy, setBusy] = useState(false)
  const [justSent, setJustSent] = useState(false)
  const [giftTables, setGiftTables] = useState<{ id: string; number: string | number; area?: string }[]>([])
  const [giftTarget, setGiftTarget] = useState<{ id: string; number: string | number } | null>(null)
  const [showGiftPicker, setShowGiftPicker] = useState(false)
  const [juke, setJuke] = useState<{ enabled: boolean; threshold: number; total: number; unlocked: boolean; queue: any[] } | null>(null)
  const [songTitle, setSongTitle] = useState('')
  const [songUrl, setSongUrl] = useState('')
  const [loyalty, setLoyalty] = useState<{ enabled: boolean; balance: number; accountName: string | null; rewards: any[] } | null>(null)
  const [loyPhone, setLoyPhone] = useState('')
  const [redeemed, setRedeemed] = useState<{ code: string; reward: string } | null>(null)
  const [orderItems, setOrderItems] = useState<OrderItem[]>([])
  const [orderTotal, setOrderTotal] = useState(0)
  const pollRef = useRef<any>(null)

  const load = useCallback(async () => {
    try {
      const r = await fetch(`${API_URL}/restbar-qr/session/${token}`)
      const j = await r.json()
      if (!r.ok || !j.success) { setError(j?.error || 'Mesa no disponible'); setPhase('invalid'); return }
      setBrand(j.data.brand); setTableNumber(j.data.tableNumber); setMenu(j.data.menu || [])
      // Persistencia: si el cliente ya entró a esta mesa, restaura su sesión (no re-pedir nombre al recargar).
      let savedName = ''
      try { savedName = localStorage.getItem(`mesa_name_${token}`) || '' } catch { /* SSR / bloqueado */ }
      if (savedName) { setName(savedName); setPhase('menu') }
      else setPhase('join')
    } catch { setError('No se pudo conectar'); setPhase('invalid') }
  }, [token])

  useEffect(() => { if (token) load() }, [token, load])

  const pollOrder = useCallback(async () => {
    try {
      const r = await fetch(`${API_URL}/restbar-qr/session/${token}/order`)
      const j = await r.json()
      if (r.status === 410) { try { localStorage.removeItem(`mesa_name_${token}`) } catch { /* */ }; setPhase('invalid'); return }
      if (r.ok && j.success) { setOrderItems(j.data.items || []); setOrderTotal(j.data.total || 0) }
    } catch { /* reintenta en el próximo ciclo */ }
  }, [token])

  const loadJukebox = useCallback(async () => {
    try {
      const r = await fetch(`${API_URL}/restbar-qr/session/${token}/jukebox`)
      const j = await r.json()
      if (r.ok && j.success) setJuke(j.data)
    } catch { /* reintenta luego */ }
  }, [token])

  const sendSong = async () => {
    if (!songTitle.trim() || busy) return
    setBusy(true)
    try {
      const r = await fetch(`${API_URL}/restbar-qr/session/${token}/jukebox`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), title: songTitle.trim(), url: songUrl.trim() }),
      })
      const j = await r.json()
      if (!r.ok || !j.success) { setError(j?.error || 'No se pudo agregar la canción'); return }
      setSongTitle(''); setSongUrl(''); setError('')
      await loadJukebox()
    } finally { setBusy(false) }
  }

    const loadLoyalty = useCallback(async (phone: string) => {
    try {
      const r = await fetch(`${API_URL}/restbar-qr/session/${token}/loyalty?phone=${encodeURIComponent(phone)}`)
      const j = await r.json()
      if (r.ok && j.success) setLoyalty(j.data)
    } catch { /* ignore */ }
  }, [token])

  const redeem = async (rewardId: string) => {
    if (!loyPhone.trim() || busy) return
    setBusy(true)
    try {
      const r = await fetch(`${API_URL}/restbar-qr/session/${token}/loyalty/redeem`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: loyPhone.trim(), name: name.trim(), rewardId }),
      })
      const j = await r.json()
      if (!r.ok || !j.success) { setError(j?.error || 'No se pudo canjear'); return }
      setRedeemed({ code: j.data.code, reward: j.data.reward }); setError('')
      await loadLoyalty(loyPhone.trim())
    } finally { setBusy(false) }
  }

    // Polling del consumo/total de la mesa: activo en menú y seguimiento (así cualquiera
  // que llega a la mesa ve el total). La rocola solo se consulta en seguimiento.
  useEffect(() => {
    if (phase !== 'menu' && phase !== 'track') { if (pollRef.current) clearInterval(pollRef.current); return }
    pollOrder(); if (phase === 'track') loadJukebox()
    pollRef.current = setInterval(() => { pollOrder(); if (phase === 'track') loadJukebox() }, 7000)
    return () => { if (pollRef.current) clearInterval(pollRef.current) }
  }, [phase, pollOrder, loadJukebox])

  const join = async () => {
    if (!name.trim() || busy) return
    setBusy(true)
    try {
      const r = await fetch(`${API_URL}/restbar-qr/session/${token}/join`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: name.trim() }),
      })
      const j = await r.json()
      if (!r.ok || !j.success) { setError(j?.error || 'No se pudo unir'); if (r.status === 410) setPhase('invalid'); return }
      try { localStorage.setItem(`mesa_name_${token}`, name.trim()) } catch { /* bloqueado */ }
      setPhase('menu')
    } finally { setBusy(false) }
  }

  const qty = (id: string) => cart[id] || 0
  const inc = (id: string) => setCart(c => ({ ...c, [id]: (c[id] || 0) + 1 }))
  const dec = (id: string) => setCart(c => { const n = (c[id] || 0) - 1; const x = { ...c }; if (n <= 0) delete x[id]; else x[id] = n; return x })
  const cartCount = Object.values(cart).reduce((a, b) => a + b, 0)
  const cartTotal = menu.reduce((sum, it) => sum + qty(it.id) * it.price, 0)

  const sendOrder = async () => {
    if (!cartCount || busy) return
    setBusy(true)
    try {
      const items = Object.entries(cart).map(([menuItemId, quantity]) => ({ menuItemId, quantity }))
      const r = await fetch(`${API_URL}/restbar-qr/session/${token}/order`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: name.trim(), items }),
      })
      const j = await r.json()
      if (!r.ok || !j.success) { setError(j?.error || 'No se pudo enviar'); if (r.status === 410) setPhase('invalid'); return }
      setCart({}); setJustSent(true); setPhase('track')
    } finally { setBusy(false) }
  }

  const openGiftPicker = async () => {
    try {
      const r = await fetch(`${API_URL}/restbar-qr/session/${token}/tables`)
      const j = await r.json()
      if (r.status === 410) { setPhase('invalid'); return }
      if (r.ok && j.success) { setGiftTables(j.data.tables || []); setShowGiftPicker(true) }
    } catch { setError('No se pudieron cargar las mesas') }
  }

  const sendGift = async () => {
    if (!giftTarget || !cartCount || busy) return
    setBusy(true)
    try {
      const items = Object.entries(cart).map(([menuItemId, quantity]) => ({ menuItemId, quantity }))
      const r = await fetch(`${API_URL}/restbar-qr/session/${token}/gift`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), targetTableId: giftTarget.id, items }),
      })
      const j = await r.json()
      if (!r.ok || !j.success) { setError(j?.error || 'No se pudo enviar el regalo'); if (r.status === 410) setGiftTarget(null); return }
      setCart({}); setGiftTarget(null); setError('')
      alert(`🎁 ${j.data?.message || 'Regalo enviado'}`)
    } finally { setBusy(false) }
  }

    const cats = Array.from(new Set(menu.map(m => m.category || 'Menú')))

  return (
    <div className="min-h-screen text-white" style={{ background: '#0b0b14' }}>
      {/* Header */}
      <div className="sticky top-0 z-20 px-5 py-4 backdrop-blur-md flex items-center justify-between" style={{ background: 'rgba(11,11,20,.85)', borderBottom: '1px solid rgba(255,255,255,.08)' }}>
        <div>
          <p className="text-xs uppercase tracking-widest" style={{ color: A }}>{brand}</p>
          <h1 className="text-lg font-bold">{tableNumber ? `Mesa ${tableNumber}` : 'Tu mesa'}</h1>
        </div>
        {(phase === 'menu' || phase === 'track') && (
          <div className="flex items-center gap-2.5">
            {orderTotal > 0 && (
              <div className="text-right leading-none">
                <p className="text-[9px] uppercase tracking-wider text-gray-400 mb-0.5">Total mesa</p>
                <p className="text-sm font-extrabold" style={{ color: A }}>{money(orderTotal)}</p>
              </div>
            )}
            <button
              onClick={() => setPhase(phase === 'track' ? 'menu' : 'track')}
              className="text-xs font-semibold rounded-full px-3 py-1.5 border border-white/15 hover:bg-white/10 whitespace-nowrap"
            >
              {phase === 'track' ? '+ Pedir más' : 'Mi pedido'}
            </button>
          </div>
        )}
      </div>

      {phase === 'loading' && <div className="p-10 text-center text-gray-400">Cargando…</div>}

      {phase === 'invalid' && (
        <div className="p-8 text-center mt-10">
          <div className="text-5xl mb-3">🔒</div>
          <h2 className="text-xl font-bold mb-2">Mesa no disponible</h2>
          <p className="text-gray-400 text-sm">{error || 'Este QR ya no está activo. Pídele al mesero uno nuevo.'}</p>
        </div>
      )}

      {phase === 'join' && (
        <div className="p-6 mt-8 max-w-sm mx-auto">
          <div className="text-5xl text-center mb-4">👋</div>
          <h2 className="text-2xl font-bold text-center mb-2">¡Bienvenido!</h2>
          <p className="text-gray-400 text-sm text-center mb-6">¿Con qué nombre entras a la mesa?</p>
          <input
            value={name} onChange={e => setName(e.target.value)} placeholder="Tu nombre"
            onKeyDown={e => e.key === 'Enter' && join()}
            className="w-full rounded-xl bg-white/5 border border-white/15 px-4 py-3 text-base outline-none mb-3"
          />
          {error && <p className="text-red-400 text-sm mb-3">{error}</p>}
          <button onClick={join} disabled={busy || !name.trim()} className="w-full rounded-xl py-3 font-semibold disabled:opacity-50" style={{ background: A }}>
            {busy ? 'Entrando…' : 'Entrar a la mesa'}
          </button>
        </div>
      )}

      {phase === 'menu' && (
        <div className="px-4 pb-28 pt-3 max-w-lg mx-auto">
          {error && <p className="text-red-400 text-sm mb-2">{error}</p>}
          <div className="flex items-center justify-between mb-3 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2">
            <span className="text-xs text-gray-400">{giftTarget ? `🎁 Regalando a Mesa ${giftTarget.number}` : '¿Invitar a otra mesa?'}</span>
            {giftTarget
              ? <button onClick={() => setGiftTarget(null)} className="text-xs font-semibold text-red-400">Cancelar</button>
              : <button onClick={openGiftPicker} className="text-xs font-semibold" style={{ color: A }}>🎁 Regalar a otra mesa</button>}
          </div>
          {cats.map(cat => (
            <div key={cat} className="mb-5">
              <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-2">{cat}</h3>
              <div className="space-y-2">
                {menu.filter(m => (m.category || 'Menú') === cat).map(it => {
                  const out = !it.availableInMenu
                  return (
                    <div key={it.id} className={`flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-3 ${out ? 'opacity-50' : ''}`}>
                      {it.imageUrl
                        ? <img src={it.imageUrl} alt={it.name} className="w-14 h-14 rounded-lg object-cover" />
                        : <div className="w-14 h-14 rounded-lg bg-white/5 flex items-center justify-center text-xl">🍽️</div>}
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm leading-tight">{it.name}</p>
                        {it.description && <p className="text-[11px] text-gray-500 line-clamp-1">{it.description}</p>}
                        <p className="text-sm font-bold mt-0.5" style={{ color: A }}>{money(it.price)}</p>
                      </div>
                      {out ? (
                        <span className="text-[11px] font-semibold text-red-400 px-2">Agotado</span>
                      ) : qty(it.id) > 0 ? (
                        <div className="flex items-center gap-2">
                          <button onClick={() => dec(it.id)} className="w-8 h-8 rounded-full bg-white/10 text-lg leading-none">−</button>
                          <span className="w-5 text-center font-bold">{qty(it.id)}</span>
                          <button onClick={() => inc(it.id)} className="w-8 h-8 rounded-full text-lg leading-none" style={{ background: A }}>+</button>
                        </div>
                      ) : (
                        <button onClick={() => inc(it.id)} className="px-3 h-8 rounded-full text-sm font-semibold" style={{ background: A }}>Agregar</button>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
          {menu.length === 0 && <p className="text-gray-500 text-center mt-10">El menú aún no está disponible.</p>}

          {cartCount > 0 && (
            <div className="fixed bottom-0 inset-x-0 p-4 z-20" style={{ background: 'linear-gradient(transparent, #0b0b14 30%)' }}>
              <button onClick={giftTarget ? sendGift : sendOrder} disabled={busy} className="w-full max-w-lg mx-auto flex items-center justify-between rounded-xl px-5 py-3.5 font-semibold disabled:opacity-60" style={{ background: giftTarget ? '#ec4899' : A }}>
                <span>{busy ? 'Enviando…' : giftTarget ? `🎁 Regalar a Mesa ${giftTarget.number} (${cartCount})` : `Enviar pedido (${cartCount})`}</span>
                <span>{money(cartTotal)}</span>
              </button>
            </div>
          )}

          {showGiftPicker && (
            <div className="fixed inset-0 z-30 bg-black/70 flex items-end sm:items-center justify-center p-4" onClick={() => setShowGiftPicker(false)}>
              <div className="bg-[#14141f] border border-white/10 rounded-2xl p-5 w-full max-w-sm" onClick={e => e.stopPropagation()}>
                <h3 className="font-bold text-lg mb-1">🎁 Regalar a otra mesa</h3>
                <p className="text-xs text-gray-400 mb-4">Elige la mesa. Luego agrega los productos y envía el regalo a su comanda.</p>
                {giftTables.length === 0 ? (
                  <p className="text-gray-500 text-sm text-center py-6">No hay otras mesas ocupadas ahora.</p>
                ) : (
                  <div className="space-y-2 max-h-72 overflow-y-auto">
                    {giftTables.map(t => (
                      <button key={t.id} onClick={() => { setGiftTarget({ id: t.id, number: t.number }); setShowGiftPicker(false) }}
                        className="w-full flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 hover:bg-white/[0.07]">
                        <span className="font-semibold">Mesa {t.number}</span>
                        {t.area && <span className="text-xs text-gray-500">{t.area}</span>}
                      </button>
                    ))}
                  </div>
                )}
                <button onClick={() => setShowGiftPicker(false)} className="w-full mt-4 rounded-xl py-2.5 font-semibold border border-white/15">Cerrar</button>
              </div>
            </div>
          )}
        </div>
      )}

      {phase === 'track' && (
        <div className="px-4 pb-10 pt-4 max-w-lg mx-auto">
          {justSent && (
            <div className="text-center mb-5">
              <div className="text-5xl mb-2">✅</div>
              <h2 className="text-xl font-bold">¡Pedido enviado a cocina!</h2>
              <p className="text-gray-400 text-sm">Sigue su estado aquí abajo en tiempo real.</p>
            </div>
          )}
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold uppercase tracking-widest text-gray-400">Tu pedido</h3>
            <span className="text-[11px] text-gray-500">Se actualiza solo</span>
          </div>

          {orderItems.length === 0 ? (
            <p className="text-gray-500 text-center mt-8 text-sm">Aún no hay platos en tu pedido.</p>
          ) : (
            <div className="space-y-2">
              {orderItems.map((it, i) => {
                const s = stat(it.status)
                return (
                  <div key={i} className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-3">
                    <span className="w-7 h-7 rounded-lg bg-white/5 flex items-center justify-center text-sm font-bold">{it.quantity}×</span>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm leading-tight">{it.name}</p>
                      {it.notes && <p className="text-[11px] text-gray-500 line-clamp-1">{it.notes}</p>}
                    </div>
                    <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full whitespace-nowrap" style={{ color: s.color, background: s.color + '22' }}>
                      {s.icon} {s.label}
                    </span>
                  </div>
                )
              })}
              <div className="flex items-center justify-between pt-3 mt-1 border-t border-white/10">
                <span className="text-sm text-gray-400">Total</span>
                <span className="text-lg font-bold" style={{ color: A }}>{money(orderTotal)}</span>
              </div>
            </div>
          )}

          {juke && juke.enabled && (
            <div className="mt-8 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
              <h3 className="text-sm font-bold mb-1">🎵 Pide tu canción</h3>
              {!juke.unlocked ? (
                <>
                  <p className="text-xs text-gray-400 mb-2">Llega a {money(juke.threshold)} de consumo para desbloquear la rocola. Vas en {money(juke.total)}.</p>
                  <div className="h-2 rounded-full bg-white/10 overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${Math.min(100, juke.threshold ? (juke.total / juke.threshold) * 100 : 0)}%`, background: '#a855f7' }} />
                  </div>
                </>
              ) : (
                <>
                  <p className="text-xs text-gray-400 mb-3">¡Desbloqueada! Pide una canción para la mesa.</p>
                  <input value={songTitle} onChange={e => setSongTitle(e.target.value)} placeholder="Nombre de la canción / artista"
                    className="w-full rounded-xl bg-white/5 border border-white/15 px-3 py-2.5 text-sm outline-none mb-2" />
                  <input value={songUrl} onChange={e => setSongUrl(e.target.value)} placeholder="Link de YouTube/Spotify (opcional)"
                    className="w-full rounded-xl bg-white/5 border border-white/15 px-3 py-2.5 text-sm outline-none mb-2" />
                  <button onClick={sendSong} disabled={busy || !songTitle.trim()} className="w-full rounded-xl py-2.5 font-semibold disabled:opacity-50" style={{ background: '#a855f7' }}>
                    {busy ? 'Enviando…' : '🎶 Agregar a la cola'}
                  </button>
                </>
              )}
              {juke.queue && juke.queue.length > 0 && (
                <div className="mt-4">
                  <p className="text-[11px] font-bold uppercase tracking-widest text-gray-500 mb-2">En cola</p>
                  <div className="space-y-1.5">
                    {juke.queue.map((q: any, i: number) => (
                      <div key={i} className="flex items-center gap-2 text-sm">
                        <span>{q.status === 'playing' ? '▶️' : '🎵'}</span>
                        <span className="flex-1 min-w-0 truncate">{q.title}</span>
                        {q.requestedBy && <span className="text-[11px] text-gray-500">{q.requestedBy}</span>}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="mt-8 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
            <h3 className="text-sm font-bold mb-1">⭐ Puntos y recompensas</h3>
            {redeemed ? (
              <div className="text-center py-3">
                <div className="text-4xl mb-2">🎁</div>
                <p className="font-bold">{redeemed.reward}</p>
                <p className="text-xs text-gray-400 mb-2">Muestra este código al mesero:</p>
                <p className="text-2xl font-black tracking-widest" style={{ color: '#f59e0b' }}>{redeemed.code}</p>
                <button onClick={() => setRedeemed(null)} className="mt-3 text-xs font-semibold text-gray-400">Ver mis puntos</button>
              </div>
            ) : !loyalty ? (
              <>
                <p className="text-xs text-gray-400 mb-2">Consulta tus puntos con tu teléfono.</p>
                <div className="flex gap-2">
                  <input value={loyPhone} onChange={e => setLoyPhone(e.target.value)} placeholder="Tu teléfono" inputMode="tel"
                    className="flex-1 rounded-xl bg-white/5 border border-white/15 px-3 py-2.5 text-sm outline-none" />
                  <button onClick={() => loyPhone.trim() && loadLoyalty(loyPhone.trim())} className="rounded-xl px-4 font-semibold text-sm" style={{ background: '#f59e0b' }}>Ver</button>
                </div>
              </>
            ) : (
              <>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs text-gray-400">{loyalty.accountName ? `Hola, ${loyalty.accountName}` : 'Tu saldo'}</span>
                  <span className="text-lg font-black" style={{ color: '#f59e0b' }}>{loyalty.balance} pts</span>
                </div>
                {loyalty.rewards.length === 0 ? (
                  <p className="text-xs text-gray-500">Aún no hay recompensas disponibles.</p>
                ) : (
                  <div className="space-y-2">
                    {loyalty.rewards.map((rw: any) => {
                      const can = loyalty.balance >= rw.pointsCost
                      return (
                        <div key={rw.id} className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.02] p-2.5">
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-sm leading-tight">{rw.name}</p>
                            {rw.description && <p className="text-[11px] text-gray-500 line-clamp-1">{rw.description}</p>}
                            <p className="text-[11px] font-bold mt-0.5" style={{ color: '#f59e0b' }}>{rw.pointsCost} pts</p>
                          </div>
                          <button onClick={() => redeem(rw.id)} disabled={!can || busy}
                            className="px-3 h-8 rounded-full text-xs font-semibold disabled:opacity-40"
                            style={{ background: can ? '#f59e0b' : '#3f3f46' }}>
                            {can ? 'Canjear' : 'Faltan pts'}
                          </button>
                        </div>
                      )
                    })}
                  </div>
                )}
                <button onClick={() => { setLoyalty(null); setLoyPhone('') }} className="mt-3 text-xs font-semibold text-gray-400">Usar otro teléfono</button>
              </>
            )}
          </div>

          <button onClick={() => { setError(''); setJustSent(false); setPhase('menu') }} className="w-full mt-6 rounded-xl py-3 font-semibold" style={{ background: A }}>
            + Pedir algo más
          </button>
        </div>
      )}
    </div>
  )
}
