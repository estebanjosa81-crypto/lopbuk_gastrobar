'use client'

import { useEffect, useState, useCallback } from 'react'
import { Wifi, WifiOff, RefreshCw, CloudUpload, CheckCircle2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'

interface SyncStatus {
  isOnline: boolean
  isSyncing: boolean
  lastSyncAt: string | null
  pendingSales: number
  pendingPurchases: number
  isLocalInstance: boolean
}

export function SyncStatusBar() {
  const [status, setStatus] = useState<SyncStatus | null>(null)
  const [isTriggering, setIsTriggering] = useState(false)

  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/sync/status`, { credentials: 'include' })
      if (!res.ok) return
      const json = await res.json()
      setStatus(json.data)
    } catch {
      // backend puede no estar disponible
    }
  }, [])

  // Polling cada 10 segundos
  useEffect(() => {
    fetchStatus()
    const interval = setInterval(fetchStatus, 10_000)
    return () => clearInterval(interval)
  }, [fetchStatus])

  const handleTriggerSync = async () => {
    if (isTriggering || status?.isSyncing) return
    setIsTriggering(true)
    try {
      await fetch(`${API_URL}/sync/trigger`, {
        method: 'POST',
        credentials: 'include',
      })
      await fetchStatus()
    } finally {
      setIsTriggering(false)
    }
  }

  // Solo mostrar si es instancia local
  if (!status?.isLocalInstance) return null

  const totalPending = (status.pendingSales ?? 0) + (status.pendingPurchases ?? 0)
  const isBusy = isTriggering || status.isSyncing

  if (status.isOnline && totalPending === 0) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-green-500/10 border border-green-500/20 text-green-400 text-xs font-medium w-fit">
        <CheckCircle2 className="h-3.5 w-3.5" />
        <span>Conectado — sincronizado</span>
      </div>
    )
  }

  if (status.isOnline && totalPending > 0) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-medium w-fit">
        <RefreshCw className={`h-3.5 w-3.5 ${isBusy ? 'animate-spin' : ''}`} />
        <span>{isBusy ? 'Sincronizando...' : `Conectado — ${totalPending} pendiente${totalPending > 1 ? 's' : ''}`}</span>
        {!isBusy && (
          <Button
            variant="ghost"
            size="sm"
            className="h-5 px-1.5 text-xs text-blue-400 hover:text-blue-300 hover:bg-blue-500/10"
            onClick={handleTriggerSync}
          >
            <CloudUpload className="h-3 w-3 mr-1" />
            Subir ahora
          </Button>
        )}
      </div>
    )
  }

  // Offline
  return (
    <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 text-xs font-medium w-fit">
      <WifiOff className="h-3.5 w-3.5" />
      <span>
        Registrando local
        {totalPending > 0 && ` — ${totalPending} pendiente${totalPending > 1 ? 's'  : ''}`}
      </span>
    </div>
  )
}
