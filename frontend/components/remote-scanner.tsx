'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { getScannerSocket, disconnectScannerSocket } from '@/lib/socket'
import { Button } from '@/components/ui/button'
import { X, Smartphone, Wifi, WifiOff, Loader2, ScanLine } from 'lucide-react'
import { toast } from 'sonner'
import type { Socket } from 'socket.io-client'

interface RemoteScannerProps {
  onScan: (barcode: string) => void
  onClose: () => void
}

type ConnectionStatus = 'connecting' | 'waiting' | 'connected' | 'disconnected' | 'error'

export function RemoteScanner({ onScan, onClose }: RemoteScannerProps) {
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [status, setStatus] = useState<ConnectionStatus>('connecting')
  const [lastBarcode, setLastBarcode] = useState<string | null>(null)
  const [scanCount, setScanCount] = useState(0)
  const socketRef = useRef<Socket | null>(null)
  const sessionIdRef = useRef<string | null>(null)

  const handleClose = useCallback(() => {
    if (socketRef.current && sessionIdRef.current) {
      socketRef.current.emit('end-session', sessionIdRef.current)
    }
    disconnectScannerSocket()
    onClose()
  }, [onClose])

  useEffect(() => {
    const socket = getScannerSocket()
    socketRef.current = socket

    socket.connect()

    socket.on('connect', () => {
      socket.emit('create-session', (data: { sessionId: string }) => {
        setSessionId(data.sessionId)
        sessionIdRef.current = data.sessionId
        setStatus('waiting')
      })
    })

    socket.on('connect_error', () => {
      setStatus('error')
      toast.error('Error al conectar con el servidor')
    })

    socket.on('mobile-connected', () => {
      setStatus('connected')
      toast.success('Dispositivo móvil conectado')
    })

    socket.on('mobile-disconnected', () => {
      setStatus('disconnected')
      toast.warning('Dispositivo móvil desconectado')
    })

    socket.on('barcode-received', (data: { barcode: string }) => {
      setLastBarcode(data.barcode)
      setScanCount(prev => prev + 1)
      onScan(data.barcode)
    })

    socket.on('session-ended', () => {
      setStatus('disconnected')
    })

    return () => {
      if (sessionIdRef.current) {
        socket.emit('end-session', sessionIdRef.current)
      }
      disconnectScannerSocket()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const remoteUrl = sessionId
    ? `${window.location.origin}/scanner-remote/${sessionId}`
    : null

  const statusConfig: Record<ConnectionStatus, { text: string; icon: React.ReactNode; color: string }> = {
    connecting: { text: 'Conectando...', icon: <Loader2 className="h-5 w-5 animate-spin" />, color: 'text-muted-foreground' },
    waiting: { text: 'Esperando dispositivo...', icon: <Wifi className="h-5 w-5 animate-pulse" />, color: 'text-amber-500' },
    connected: { text: 'Dispositivo conectado', icon: <Smartphone className="h-5 w-5" />, color: 'text-green-500' },
    disconnected: { text: 'Dispositivo desconectado', icon: <WifiOff className="h-5 w-5" />, color: 'text-destructive' },
    error: { text: 'Error de conexión', icon: <WifiOff className="h-5 w-5" />, color: 'text-destructive' },
  }

  const currentStatus = statusConfig[status]

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-card rounded-xl border border-border max-w-md w-full p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <Smartphone className="h-5 w-5" />
            Escáner Remoto
          </h2>
          <Button variant="ghost" size="icon" onClick={handleClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Estado */}
        <div className={`flex items-center gap-2 ${currentStatus.color}`}>
          {currentStatus.icon}
          <span className="text-sm font-medium">{currentStatus.text}</span>
        </div>

        {/* Código QR */}
        {remoteUrl && status !== 'error' && (
          <div className="flex flex-col items-center gap-4">
            <div className="bg-white p-4 rounded-lg">
              <QRCodeSVG value={remoteUrl} size={200} level="M" />
            </div>
            <p className="text-sm text-muted-foreground text-center">
              Escanea este código QR con tu teléfono para abrir el escáner remoto
            </p>
            <div className="w-full">
              <p className="text-xs text-muted-foreground text-center break-all bg-secondary/50 rounded-lg p-2">
                {remoteUrl}
              </p>
            </div>
          </div>
        )}

        {/* Actividad de escaneo */}
        {status === 'connected' && (
          <div className="space-y-2 border-t border-border pt-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Escaneos realizados</span>
              <span className="text-sm font-medium text-foreground">{scanCount}</span>
            </div>
            {lastBarcode && (
              <div className="flex items-center gap-2 bg-secondary/50 rounded-lg p-3">
                <ScanLine className="h-4 w-4 text-primary flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground">Último código</p>
                  <p className="text-sm font-mono text-foreground truncate">{lastBarcode}</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Estado de error */}
        {status === 'error' && (
          <div className="text-center space-y-3">
            <p className="text-sm text-muted-foreground">
              No se pudo conectar con el servidor. Verifica que el backend esté ejecutándose.
            </p>
            <Button variant="outline" onClick={handleClose}>
              Cerrar
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
