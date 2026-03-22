import { Server, Socket } from 'socket.io';
import { v4 as uuidv4 } from 'uuid';

interface ScanSession {
  id: string;
  desktopSocketId: string;
  mobileSocketId: string | null;
  createdAt: Date;
}

const sessions = new Map<string, ScanSession>();

const SESSION_TTL_MS = 60 * 60 * 1000; // 1 hora

function cleanupStaleSessions() {
  const now = Date.now();
  for (const [id, session] of sessions) {
    if (now - session.createdAt.getTime() > SESSION_TTL_MS) {
      sessions.delete(id);
    }
  }
}

export function initScannerSocket(io: Server) {
  setInterval(cleanupStaleSessions, 10 * 60 * 1000);

  const scannerNamespace = io.of('/scanner');

  scannerNamespace.on('connection', (socket: Socket) => {
    console.log(`Scanner socket conectado: ${socket.id}`);

    // Escritorio crea una sesión de escaneo
    socket.on('create-session', (callback: (data: { sessionId: string }) => void) => {
      cleanupStaleSessions();
      const sessionId = uuidv4().slice(0, 8);
      const session: ScanSession = {
        id: sessionId,
        desktopSocketId: socket.id,
        mobileSocketId: null,
        createdAt: new Date(),
      };
      sessions.set(sessionId, session);
      socket.join(`session:${sessionId}`);

      if (typeof callback === 'function') {
        callback({ sessionId });
      }
    });

    // Móvil se une a una sesión existente
    socket.on('join-session', (sessionId: string, callback: (data: { success: boolean; error?: string }) => void) => {
      const session = sessions.get(sessionId);
      if (!session) {
        if (typeof callback === 'function') {
          callback({ success: false, error: 'Sesión no encontrada o expirada' });
        }
        return;
      }

      session.mobileSocketId = socket.id;
      socket.join(`session:${sessionId}`);

      // Notificar al escritorio que el móvil se conectó
      scannerNamespace.to(session.desktopSocketId).emit('mobile-connected', {
        sessionId,
      });

      if (typeof callback === 'function') {
        callback({ success: true });
      }
    });

    // Móvil envía un código de barras escaneado
    socket.on('barcode-scanned', (data: { sessionId: string; barcode: string }) => {
      const session = sessions.get(data.sessionId);
      if (!session) return;

      scannerNamespace.to(session.desktopSocketId).emit('barcode-received', {
        barcode: data.barcode,
        sessionId: data.sessionId,
      });
    });

    // Cualquiera de los dos termina la sesión
    socket.on('end-session', (sessionId: string) => {
      const session = sessions.get(sessionId);
      if (!session) return;

      scannerNamespace.to(`session:${sessionId}`).emit('session-ended', { sessionId });
      sessions.delete(sessionId);
    });

    // Manejar desconexión
    socket.on('disconnect', () => {
      for (const [id, session] of sessions) {
        if (session.desktopSocketId === socket.id) {
          scannerNamespace.to(`session:${id}`).emit('session-ended', { sessionId: id });
          sessions.delete(id);
        } else if (session.mobileSocketId === socket.id) {
          session.mobileSocketId = null;
          scannerNamespace.to(session.desktopSocketId).emit('mobile-disconnected', {
            sessionId: id,
          });
        }
      }
    });
  });
}
