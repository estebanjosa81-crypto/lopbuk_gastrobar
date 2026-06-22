import { io, Socket } from 'socket.io-client'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'
const SOCKET_URL = API_URL.replace(/\/api\/?$/, '')

let scannerSocket: Socket | null = null

export function getScannerSocket(): Socket {
  if (!scannerSocket) {
    scannerSocket = io(`${SOCKET_URL}/scanner`, {
      autoConnect: false,
      transports: ['websocket', 'polling'],
    })
  }
  return scannerSocket
}

export function disconnectScannerSocket() {
  if (scannerSocket) {
    scannerSocket.disconnect()
    scannerSocket = null
  }
}

// ── Vault / Drops (V2): contador de cupos en vivo ──
let vaultSocket: Socket | null = null

export function getVaultSocket(): Socket {
  if (!vaultSocket) {
    vaultSocket = io(`${SOCKET_URL}/vault`, {
      autoConnect: true,
      transports: ['websocket', 'polling'],
    })
  }
  return vaultSocket
}
