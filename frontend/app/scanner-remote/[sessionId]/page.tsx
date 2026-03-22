'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { useParams } from 'next/navigation'
import { BrowserMultiFormatReader, NotFoundException } from '@zxing/library'
import { io, Socket } from 'socket.io-client'
import { Camera, Wifi, WifiOff, Check, Loader2 } from 'lucide-react'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'
const SOCKET_URL = API_URL.replace(/\/api\/?$/, '')

type PageStatus = 'connecting' | 'ready' | 'scanning' | 'error' | 'session-ended'

export default function RemoteScannerPage() {
  const params = useParams()
  const sessionId = params.sessionId as string

  const videoRef = useRef<HTMLVideoElement>(null)
  const readerRef = useRef<BrowserMultiFormatReader | null>(null)
  const socketRef = useRef<Socket | null>(null)

  const [status, setStatus] = useState<PageStatus>('connecting')
  const [lastScanned, setLastScanned] = useState<string | null>(null)
  const [scanCount, setScanCount] = useState(0)
  const [showSuccess, setShowSuccess] = useState(false)
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([])
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('')

  const sendBarcode = useCallback((barcode: string) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit('barcode-scanned', { sessionId, barcode })
      setLastScanned(barcode)
      setScanCount(prev => prev + 1)

      setShowSuccess(true)
      setTimeout(() => setShowSuccess(false), 1000)
    }
  }, [sessionId])

  const startScanning = useCallback((deviceId: string) => {
    if (!readerRef.current || !videoRef.current) return

    try {
      readerRef.current.decodeFromVideoDevice(
        deviceId,
        videoRef.current,
        (result, error) => {
          if (result) {
            const barcode = result.getText()
            sendBarcode(barcode)

            // Pausa breve y continuar escaneando
            if (readerRef.current) {
              readerRef.current.reset()
            }
            setTimeout(() => {
              startScanning(deviceId)
            }, 1500)
          }
          if (error && !(error instanceof NotFoundException)) {
            console.error('Error escaneando:', error)
          }
        }
      )
    } catch (error) {
      console.error('Error al iniciar escaneo:', error)
    }
  }, [sendBarcode])

  useEffect(() => {
    const socket = io(`${SOCKET_URL}/scanner`, {
      transports: ['websocket', 'polling'],
    })
    socketRef.current = socket

    socket.on('connect', () => {
      socket.emit('join-session', sessionId, (response: { success: boolean; error?: string }) => {
        if (response.success) {
          setStatus('ready')
          initCamera()
        } else {
          setStatus('error')
        }
      })
    })

    socket.on('connect_error', () => {
      setStatus('error')
    })

    socket.on('session-ended', () => {
      setStatus('session-ended')
      if (readerRef.current) {
        readerRef.current.reset()
      }
    })

    async function initCamera() {
      try {
        readerRef.current = new BrowserMultiFormatReader()
        const videoInputDevices = await readerRef.current.listVideoInputDevices()
        setDevices(videoInputDevices)

        const backCameraIndex = videoInputDevices.findIndex(device =>
          device.label.toLowerCase().includes('back') ||
          device.label.toLowerCase().includes('rear') ||
          device.label.toLowerCase().includes('trasera') ||
          device.label.toLowerCase().includes('environment')
        )

        const initialDevice = videoInputDevices[backCameraIndex >= 0 ? backCameraIndex : 0]
        if (initialDevice) {
          setSelectedDeviceId(initialDevice.deviceId)
          setStatus('scanning')
          startScanning(initialDevice.deviceId)
        }
      } catch (error) {
        console.error('Error inicializando cámara:', error)
        setStatus('error')
      }
    }

    return () => {
      if (readerRef.current) readerRef.current.reset()
      socket.disconnect()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId])

  const handleCameraChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newDeviceId = e.target.value
    if (newDeviceId === selectedDeviceId) return
    if (readerRef.current) readerRef.current.reset()
    setSelectedDeviceId(newDeviceId)
    setTimeout(() => startScanning(newDeviceId), 300)
  }

  return (
    <div className="fixed inset-0 bg-black flex flex-col">
      {/* Barra de estado */}
      <div className="bg-black/90 backdrop-blur-sm p-3 flex items-center justify-between z-10">
        <div className="flex items-center gap-2 text-white">
          <Camera className="h-4 w-4" />
          <span className="text-sm font-medium">Escáner Remoto</span>
        </div>
        <div className="flex items-center gap-2">
          {status === 'scanning' && (
            <span className="flex items-center gap-1.5 text-green-400 text-xs">
              <Wifi className="h-3 w-3" />
              Conectado
            </span>
          )}
          {scanCount > 0 && (
            <span className="bg-primary/20 text-primary text-xs px-2 py-0.5 rounded-full">
              {scanCount} escaneados
            </span>
          )}
        </div>
      </div>

      {/* Selector de cámara */}
      {devices.length > 1 && status === 'scanning' && (
        <div className="bg-black/80 px-3 py-2 z-10">
          <select
            value={selectedDeviceId}
            onChange={handleCameraChange}
            className="w-full bg-gray-800 text-white text-sm rounded-lg px-3 py-2 border border-gray-700"
          >
            {devices.map((device, index) => (
              <option key={device.deviceId} value={device.deviceId}>
                {device.label || `Cámara ${index + 1}`}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Video */}
      <div className="flex-1 relative">
        <video
          ref={videoRef}
          className="w-full h-full object-cover"
          playsInline
          muted
          autoPlay
        />

        {/* Overlay del marco de escaneo */}
        {status === 'scanning' && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className={`relative w-72 h-48 transition-colors duration-300 ${showSuccess ? 'opacity-50' : ''}`}>
              <div className={`absolute inset-0 border-2 rounded-lg ${showSuccess ? 'border-green-500' : 'border-primary'}`}>
                <div className={`absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 rounded-tl-lg ${showSuccess ? 'border-green-500' : 'border-primary'}`} />
                <div className={`absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 rounded-tr-lg ${showSuccess ? 'border-green-500' : 'border-primary'}`} />
                <div className={`absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 rounded-bl-lg ${showSuccess ? 'border-green-500' : 'border-primary'}`} />
                <div className={`absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 rounded-br-lg ${showSuccess ? 'border-green-500' : 'border-primary'}`} />
              </div>
              {!showSuccess && <div className="absolute left-2 right-2 h-0.5 bg-primary animate-scan" />}
              {showSuccess && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <Check className="h-16 w-16 text-green-500" />
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Barra inferior */}
      <div className="bg-black/90 backdrop-blur-sm p-4 z-10">
        {status === 'connecting' && (
          <div className="flex items-center justify-center gap-2 text-gray-400">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-sm">Conectando...</span>
          </div>
        )}
        {status === 'ready' && (
          <div className="flex items-center justify-center gap-2 text-gray-400">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span className="text-sm">Iniciando cámara...</span>
          </div>
        )}
        {status === 'scanning' && lastScanned && (
          <div className="text-center">
            <p className="text-xs text-gray-400">Último código escaneado</p>
            <p className="text-sm font-mono text-white">{lastScanned}</p>
          </div>
        )}
        {status === 'scanning' && !lastScanned && (
          <p className="text-sm text-center text-gray-400">
            Centra el código de barras dentro del marco
          </p>
        )}
        {status === 'error' && (
          <div className="text-center text-red-400">
            <WifiOff className="h-8 w-8 mx-auto mb-2" />
            <p className="text-sm">Sesión no encontrada o expirada</p>
            <p className="text-xs text-gray-500 mt-1">Genera un nuevo código QR desde el escritorio</p>
          </div>
        )}
        {status === 'session-ended' && (
          <div className="text-center text-gray-400">
            <p className="text-sm font-medium">Sesión finalizada</p>
            <p className="text-xs mt-1">Puedes cerrar esta ventana</p>
          </div>
        )}
      </div>
    </div>
  )
}
