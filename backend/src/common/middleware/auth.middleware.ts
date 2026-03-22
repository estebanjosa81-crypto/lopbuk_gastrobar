import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config, db } from '../../config';
import { JWTPayload, UserRole } from '../types';
import { RowDataPacket } from 'mysql2';
import { audit } from '../../utils/audit-logger';
import { Permission } from '../../utils/permissions';

export interface AuthRequest extends Request {
  user?: JWTPayload;
}

export const authenticate = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    // Prefer httpOnly cookie; fall back to Authorization: Bearer header
    const token: string | undefined =
      req.cookies?.authToken ||
      (req.headers.authorization?.startsWith('Bearer ')
        ? req.headers.authorization.split(' ')[1]
        : undefined);

    if (!token) {
      res.status(401).json({
        success: false,
        error: 'Token de autenticacion no proporcionado',
      });
      return;
    }
    const decoded = jwt.verify(token, config.jwt.secret) as JWTPayload;

    // Verify user status + load cargo permissions in one query
    const [userRows] = await db.execute<RowDataPacket[]>(
      `SELECT u.is_active, u.can_login, ec.permissions
       FROM users u
       LEFT JOIN employee_cargos ec ON u.cargo_id = ec.id
       WHERE u.id = ?`,
      [decoded.userId]
    );
    if (userRows.length === 0 || !userRows[0].is_active) {
      audit.accountSuspended(decoded.userId, req.ip);
      res.status(403).json({
        success: false,
        error: 'Tu cuenta ha sido desactivada',
      });
      return;
    }
    if (userRows[0].can_login === false || userRows[0].can_login === 0) {
      audit.accountSuspended(decoded.userId, req.ip);
      res.status(403).json({
        success: false,
        error: 'Tu cuenta no tiene permiso para iniciar sesión en el sistema',
      });
      return;
    }

    // Verify tenant is still active (for non-superadmin)
    if (decoded.tenantId && decoded.role !== 'superadmin') {
      const [tenantRows] = await db.execute<RowDataPacket[]>(
        'SELECT status FROM tenants WHERE id = ?',
        [decoded.tenantId]
      );
      if (tenantRows.length > 0 && tenantRows[0].status !== 'activo') {
        audit.tenantSuspended(decoded.tenantId, decoded.userId, req.ip);
        res.status(403).json({
          success: false,
          error: 'Tu comercio ha sido suspendido. Contacta al administrador.',
        });
        return;
      }
    }

    // Attach cargo permissions to request user (parsed from JSON if stored as string)
    let permissions: string[] | undefined;
    const rawPerms = userRows[0].permissions;
    if (rawPerms) {
      try {
        permissions = typeof rawPerms === 'string' ? JSON.parse(rawPerms) : rawPerms;
      } catch { permissions = []; }
    }

    req.user = { ...decoded, permissions };
    next();
  } catch {
    audit.tokenInvalid(req.ip);
    res.status(401).json({
      success: false,
      error: 'Token invalido o expirado',
    });
  }
};

export const authorize = (...roles: UserRole[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'No autenticado',
      });
      return;
    }

    if (!roles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        error: 'No tienes permisos para realizar esta accion',
      });
      return;
    }

    next();
  };
};

/**
 * Middleware de permisos granulares por cargo.
 * - superadmin y comerciante tienen acceso total (sin verificar permisos).
 * - vendedor/repartidor/auxiliar_bodega necesitan el permiso en su cargo.
 *
 * Uso: router.get('/ventas', authenticate, requirePermission('ventas'), handler)
 */
export const requirePermission = (...perms: Permission[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'No autenticado' });
      return;
    }

    // Roles con acceso total — no verifican permisos de cargo
    if (req.user.role === 'superadmin' || req.user.role === 'comerciante') {
      next();
      return;
    }

    const userPerms: string[] = req.user.permissions || [];
    const hasAll = perms.every(p => userPerms.includes(p));

    if (!hasAll) {
      audit.unauthorizedAccess(req.path, req.ip, req.user.userId);
      res.status(403).json({
        success: false,
        error: `Acceso denegado. Tu cargo no tiene el permiso requerido: ${perms.join(', ')}`,
      });
      return;
    }

    next();
  };
};
