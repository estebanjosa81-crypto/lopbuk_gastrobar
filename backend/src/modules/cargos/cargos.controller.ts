import { Response, NextFunction } from 'express';
import { cargosService } from './cargos.service';
import { AuthRequest } from '../../common/middleware';
import { audit } from '../../utils/audit-logger';

export class CargosController {
  async findAll(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.user!.tenantId!;
      const cargos = await cargosService.findAll(tenantId);
      res.json({ success: true, data: cargos });
    } catch (error) {
      next(error);
    }
  }

  async create(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.user!.tenantId!;
      const cargo = await cargosService.create(tenantId, req.body);
      audit.adminAction(req.user!.userId, 'cargo_created', cargo.id, { name: cargo.name });
      res.status(201).json({ success: true, data: cargo, message: 'Cargo creado exitosamente' });
    } catch (error) {
      next(error);
    }
  }

  async update(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.user!.tenantId!;
      const cargo = await cargosService.update(tenantId, req.params.id, req.body);
      audit.adminAction(req.user!.userId, 'cargo_updated', cargo.id, { name: cargo.name, permissions: cargo.permissions });
      res.json({ success: true, data: cargo, message: 'Cargo actualizado exitosamente' });
    } catch (error) {
      next(error);
    }
  }

  async delete(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.user!.tenantId!;
      await cargosService.delete(tenantId, req.params.id);
      audit.adminAction(req.user!.userId, 'cargo_deleted', req.params.id);
      res.json({ success: true, message: 'Cargo eliminado exitosamente' });
    } catch (error) {
      next(error);
    }
  }
}

export const cargosController = new CargosController();
