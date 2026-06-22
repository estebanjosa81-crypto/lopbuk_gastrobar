/**
 * vault.realtime — Socket.io del Vault / Drops (V2).
 * Namespace `/vault`. Los clientes se unen a la sala `drop:<id>` y reciben
 * `drop:update` cuando alguien reclama un cupo (contador en vivo / escasez real).
 */
import { Server, Socket } from 'socket.io';

let nsp: ReturnType<Server['of']> | null = null;

export function initVaultSocket(io: Server) {
  nsp = io.of('/vault');
  nsp.on('connection', (socket: Socket) => {
    socket.on('drop:join', (dropId: string) => { if (dropId) socket.join(`drop:${dropId}`); });
    socket.on('drop:leave', (dropId: string) => { if (dropId) socket.leave(`drop:${dropId}`); });
  });
}

/** Emite el estado de cupos de un drop a todos los suscritos a su sala. */
export function emitDropUpdate(dropId: string, payload: { slotsTaken: number; totalSlots: number; soldOut: boolean }) {
  if (!nsp) return;
  nsp.to(`drop:${dropId}`).emit('drop:update', { dropId, ...payload });
}
