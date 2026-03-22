'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { BrowserMultiFormatReader, NotFoundException } from '@zxing/library'
import { Camera, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'
import { useStore } from '@/lib/store'

interface BarcodeScannerProps {
  onScan: (barcode: string) => void
  onClose: () => void
  continuous?: boolean
}

export function BarcodeScanner({ onScan, onClose, continuous = false }: BarcodeScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [isScanning, setIsScanning] = useState(false)
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([])
  const [selectedDeviceId, setSelectedDeviceId] = useState('')
  const [initError, setInitError] = useState<string | null>(null)
  const [scanCount, setScanCount] = useState(0)
  const [lastScanned, setLastScanned] = useState<string | null>(null)
  const [successFlash, setSuccessFlash] = useState(false)
  const readerRef = useRef<BrowserMultiFormatReader | null>(null)
  const isStartingRef = useRef(false)
  const hasScannedRef = useRef(false)
  const scanCooldownRef = useRef(false)
  const startupGraceRef = useRef(true) // Ignore stale frames during camera startup
  const { preferredCameraDeviceId, setPreferredCameraDeviceId } = useStore()

  const playBeep = useCallback(() => {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
    const oscillator = audioContext.createOscillator()
    const gainNode = audioContext.createGain()
    
    oscillator.connect(gainNode)
    gainNode.connect(audioContext.destination)
    
    oscillator.frequency.value = 800
    oscillator.type = 'sine'
    
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime)
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2)
    
    oscillator.start(audioContext.currentTime)
    oscillator.stop(audioContext.currentTime + 0.2)
  }, [])

  const stopVideoStream = useCallback(() => {
    const video = videoRef.current
    const stream = video?.srcObject as MediaStream | null
    if (stream) {
      stream.getTracks().forEach(track => track.stop())
    }
    if (video) {
      video.srcObject = null
    }
  }, [])

  const stopScanning = useCallback(() => {
    if (readerRef.current) {
      readerRef.current.reset()
    }
    stopVideoStream()
    setIsScanning(false)
  }, [stopVideoStream])

  const startScanning = useCallback(async (deviceId: string) => {
    if (!readerRef.current || !videoRef.current) return
    if (isStartingRef.current) return
    if (!continuous && hasScannedRef.current) return
    
    isStartingRef.current = true
    setIsScanning(true)
    setInitError(null)

    if (!continuous) {
      stopVideoStream()
    }

    videoRef.current.muted = true
    videoRef.current.playsInline = true
    videoRef.current.autoplay = true

    // Grace period: ignore stale buffered frames from previous camera sessions
    startupGraceRef.current = true
    setTimeout(() => {
      startupGraceRef.current = false
    }, 1200)

    try {
      await readerRef.current.decodeFromVideoDevice(
        deviceId,
        videoRef.current,
        (result, error) => {
          if (result && !scanCooldownRef.current && !startupGraceRef.current) {
            const barcode = result.getText()
            scanCooldownRef.current = true
            
            // Reproducir sonido
            playBeep()
            
            // Flash visual
            setSuccessFlash(true)
            setTimeout(() => setSuccessFlash(false), 500)
            
            setLastScanned(barcode)
            setScanCount(prev => prev + 1)
            
            // Toast más prominente
            toast.success(`✓ CÓDIGO ESCANEADO: ${barcode}`, {
              duration: 2000,
              className: 'bg-green-500 text-white border-2 border-green-600',
              style: {
                fontSize: '16px',
                fontWeight: 'bold',
                padding: '16px'
              }
            })
            
            onScan(barcode)

            if (continuous) {
              // En modo continuo, espera 1.5s antes de permitir otro escaneo
              setTimeout(() => {
                scanCooldownRef.current = false
              }, 1500)
            } else {
              // En modo single, cierra el escáner
              hasScannedRef.current = true
              stopScanning()
              onClose()
            }
          }

          if (error && !(error instanceof NotFoundException)) {
            console.error('Error escaneando:', error)
          }
        }
      )
    } catch (error) {
      console.error('Error al iniciar escaneo:', error)
      setInitError('No fue posible reproducir el video de la cámara.')
      toast.error('No fue posible reproducir el video de la cámara.')
      setIsScanning(false)
    } finally {
      isStartingRef.current = false
    }
  }, [onScan, onClose, stopScanning, stopVideoStream, continuous])

  useEffect(() => {
    const pickInitialDevice = (videoInputDevices: MediaDeviceInfo[]) => {
      if (preferredCameraDeviceId) {
        const preferred = videoInputDevices.find(d => d.deviceId === preferredCameraDeviceId)
        if (preferred) return preferred
      }

      const droidCamIndex = videoInputDevices.findIndex(device =>
        device.label.toLowerCase().includes('droidcam')
      )
      if (droidCamIndex >= 0) return videoInputDevices[droidCamIndex]

      const backCameraIndex = videoInputDevices.findIndex(device =>
        device.label.toLowerCase().includes('back') ||
        device.label.toLowerCase().includes('rear') ||
        device.label.toLowerCase().includes('trasera') ||
        device.label.toLowerCase().includes('environment')
      )
      return videoInputDevices[backCameraIndex >= 0 ? backCameraIndex : 0]
    }

    const requestPermission = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true })
        stream.getTracks().forEach(track => track.stop())
      } catch (error) {
        console.error('Permisos de cámara rechazados:', error)
        throw error
      }
    }

    const initScanner = async () => {
      try {
        setInitError(null)
        // Limpieza: crear un nuevo reader para esta sesión
        if (readerRef.current) {
          readerRef.current.reset()
        }
        readerRef.current = new BrowserMultiFormatReader()
        hasScannedRef.current = false // Resetear el flag de escaneo
        
        await requestPermission()

        const videoInputDevices = await readerRef.current.listVideoInputDevices()
        if (!videoInputDevices.length) {
          setInitError('No se encontraron cámaras disponibles')
          toast.error('No se encontraron cámaras disponibles')
          return
        }

        setDevices(videoInputDevices)
        const initialDevice = pickInitialDevice(videoInputDevices)

        if (initialDevice?.deviceId) {
          setSelectedDeviceId(initialDevice.deviceId)
          startScanning(initialDevice.deviceId)
        }
      } catch (error) {
        console.error('Error inicializando escáner:', error)
        setInitError('Error al acceder a la cámara. Verifica los permisos.')
        toast.error('Error al acceder a la cámara. Verifica los permisos.')
      }
    }

    initScanner()

    return () => {
      stopScanning()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleCameraChange = (deviceId: string) => {
    if (deviceId === selectedDeviceId) return
    stopScanning()
    setSelectedDeviceId(deviceId)
    setPreferredCameraDeviceId(deviceId)
    hasScannedRef.current = false // Resetear flag cuando cambias de cámara
    startupGraceRef.current = true // Resetear grace period para nueva cámara
    setTimeout(() => {
      startScanning(deviceId)
    }, 300)
  }

  return (
    <div className="fixed inset-0 z-50 bg-black">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-10 p-4 bg-gradient-to-b from-black/80 to-transparent">
        <div className="flex items-center justify-between">
          <h2 className="text-white text-lg font-semibold flex items-center gap-2">
            <Camera className="h-5 w-5" />
            Escanear Código de Barras
          </h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              stopScanning()
              onClose()
            }}
            className="text-white hover:bg-white/20"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Video */}
      <video
        ref={videoRef}
        className="w-full h-full object-cover"
        playsInline
        muted
      />

      {/* Overlay de escaneo */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className={`relative w-72 h-48 transition-all duration-300 ${
          successFlash ? 'ring-4 ring-green-400/80 scale-105' : ''
        }`}>
          {/* Marco de escaneo */}
          <div className={`absolute inset-0 border-2 rounded-lg ${
            successFlash ? 'border-green-400' : 'border-primary'
          }`}>
            <div className={`absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 rounded-tl-lg ${
              successFlash ? 'border-green-400' : 'border-primary'
            }`} />
            <div className={`absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 rounded-tr-lg ${
              successFlash ? 'border-green-400' : 'border-primary'
            }`} />
            <div className={`absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 rounded-bl-lg ${
              successFlash ? 'border-green-400' : 'border-primary'
            }`} />
            <div className={`absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 rounded-br-lg ${
              successFlash ? 'border-green-400' : 'border-primary'
            }`} />
          </div>

          {/* Línea de escaneo animada */}
          {!successFlash && <div className="absolute left-2 right-2 h-0.5 bg-primary animate-scan" />}
          
          {/* Indicador de éxito */}
          {successFlash && (
            <div className="absolute inset-0 flex items-center justify-center">
              <svg className="h-24 w-24 text-green-400 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          )}
        </div>
      </div>

      {/* Instrucciones */}
      <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 to-transparent">
        {continuous && scanCount > 0 && (
          <div className="bg-primary/20 backdrop-blur-sm rounded-lg p-3 mb-3 border border-primary/30">
            <div className="flex items-center justify-between text-white">
              <span className="text-sm font-medium">Productos escaneados:</span>
              <span className="text-lg font-bold">{scanCount}</span>
            </div>
            {lastScanned && (
              <p className="text-xs text-white/70 mt-1 font-mono truncate">
                Último: {lastScanned}
              </p>
            )}
          </div>
        )}
        <p className="text-white text-center text-sm">
          {continuous ? 'Escanea múltiples códigos' : 'Centra el código de barras dentro del marco'}
        </p>
        {isScanning && (
          <div className="flex items-center justify-center gap-2 mt-2">
            <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
            <span className="text-primary text-sm">
              {scanCooldownRef.current ? 'Procesando...' : 'Escaneando...'}
            </span>
          </div>
        )}
        {initError && (
          <p className="text-red-300 text-center text-xs mt-2">
            {initError}
          </p>
        )}
      </div>

      {/* Selector de cámara */}
      {devices.length > 1 && (
        <div className="absolute bottom-20 left-1/2 transform -translate-x-1/2 z-10">
          <Select value={selectedDeviceId} onValueChange={handleCameraChange}>
            <SelectTrigger className="bg-secondary/90 backdrop-blur-sm text-white border-white/20 min-w-[200px] max-w-[300px]">
              <Camera className="h-4 w-4 mr-2 flex-shrink-0" />
              <SelectValue placeholder="Seleccionar cámara" />
            </SelectTrigger>
            <SelectContent className="z-[60]">
              {devices.map((device, index) => (
                <SelectItem key={device.deviceId} value={device.deviceId}>
                  {device.label || `Cámara ${index + 1}`}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-[11px] text-white/70 text-center mt-2">
            Si usas DroidCam por USB, selecciona la cámara DroidCam en la lista.
          </p>
        </div>
      )}
    </div>
  )
}
