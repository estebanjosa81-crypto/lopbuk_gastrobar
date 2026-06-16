'use client'

// Botón del mesero para generar el QR de la mesa (sesión del cliente).
import { useState } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { api } from '@/lib/api'
import { toast } from 'sonner'

export function TableQrButton({ tableId, tableNumber }: { tableId: string; tableNumber?: string | number }) {
  const [open, setOpen] = useState(false)
  const [url, setUrl] = useState('')
  const [busy, setBusy] = useState(false)

  const generate = async () => {
    setBusy(true)
    try {
      const res = await api.createTableQrSession(tableId)
      if (res.success && (res.data as any)?.token) {
        const origin = typeof window !== 'undefined' ? window.location.origin : ''
        setUrl(`${origin}/mesa/${(res.data as any).token}`)
        setOpen(true)
      } else {
        toast.error(res.error || 'No se pudo generar el QR')
      }
    } finally { setBusy(false) }
  }

  return (
    <>
      <button
        onClick={(e) => { e.stopPropagation(); generate() }}
        disabled={busy}
        className="w-full rounded-lg border border-sky-500/30 py-1 text-[11px] text-sky-400 font-medium hover:bg-sky-500/10 transition-colors flex items-center justify-center gap-1 disabled:opacity-50"
      >
        {busy ? 'Generando…' : '📱 QR de mesa'}
      </button>

      {open && (
        <div className="fixed inset-0 z-[60] bg-black/70 flex items-center justify-center p-4" onClick={() => setOpen(false)}>
          <div className="bg-white text-gray-900 rounded-2xl p-6 text-center max-w-xs w-full" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-bold text-lg mb-1">QR — Mesa {tableNumber}</h3>
            <p className="text-xs text-gray-500 mb-4">El cliente lo escanea, entra con su nombre y pide desde su celular.</p>
            <div className="flex justify-center mb-4"><QRCodeSVG value={url} size={210} /></div>
            <a href={url} target="_blank" rel="noopener noreferrer" className="block text-xs text-indigo-600 underline mb-4 break-all">Abrir vista del cliente</a>
            <button onClick={() => setOpen(false)} className="w-full rounded-lg bg-gray-900 text-white py-2.5 font-semibold">Cerrar</button>
          </div>
        </div>
      )}
    </>
  )
}
