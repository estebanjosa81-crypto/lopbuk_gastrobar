import { Response, NextFunction } from 'express';
import { novedadesService } from './novedades.service';
import { AuthRequest } from '../../common/middleware';

export class NovedadesController {
  async findAll(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.user!.tenantId!;
      const { userId, type, status, from, to } = req.query as any;
      const data = await novedadesService.findAll(tenantId, { userId, type, status, from, to });
      res.json({ success: true, data });
    } catch (error) { next(error); }
  }

  async create(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.user!.tenantId!;
      const novelty = await novedadesService.create(tenantId, {
        ...req.body,
        createdBy: req.user!.id,
      });
      res.status(201).json({ success: true, data: novelty, message: 'Novedad registrada exitosamente' });
    } catch (error) { next(error); }
  }

  async updateStatus(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.user!.tenantId!;
      const { status, rejectionReason } = req.body;
      const novelty = await novedadesService.updateStatus(tenantId, req.params.id, status, rejectionReason);
      res.json({ success: true, data: novelty, message: 'Estado actualizado' });
    } catch (error) { next(error); }
  }

  async delete(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.user!.tenantId!;
      await novedadesService.delete(tenantId, req.params.id);
      res.json({ success: true, message: 'Novedad eliminada' });
    } catch (error) { next(error); }
  }

  async getVacationBalances(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.user!.tenantId!;
      const year = req.query.year ? parseInt(req.query.year as string) : undefined;
      const data = await novedadesService.getVacationBalances(tenantId, year);
      res.json({ success: true, data });
    } catch (error) { next(error); }
  }

  async updateVacationBalance(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.user!.tenantId!;
      const { userId, year, daysGranted } = req.body;
      await novedadesService.updateVacationBalance(tenantId, userId, year, daysGranted);
      res.json({ success: true, message: 'Saldo actualizado' });
    } catch (error) { next(error); }
  }
}

export const novedadesController = new NovedadesController();
