import { Response, NextFunction } from 'express';
import { cashSessionsService } from './cash-sessions.service';
import { AuthRequest } from '../../common/middleware';
import { CashSessionStatus } from '../../common/types';

export class CashSessionsController {
  async getActive(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const session = await cashSessionsService.getActiveSession(req.user!.tenantId!);

      res.json({
        success: true,
        data: session,
      });
    } catch (error) {
      next(error);
    }
  }

  async findAll(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;

      const filters: { status?: CashSessionStatus } = {};

      if (req.query.status) {
        filters.status = req.query.status as CashSessionStatus;
      }

      const result = await cashSessionsService.findAll(req.user!.tenantId!, page, limit, filters);

      res.json({
        success: true,
        ...result,
      });
    } catch (error) {
      next(error);
    }
  }

  async getById(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const session = await cashSessionsService.findById(req.params.id);

      res.json({
        success: true,
        data: session,
      });
    } catch (error) {
      next(error);
    }
  }

  async open(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const session = await cashSessionsService.openSession(
        req.user!.tenantId!,
        req.user!.userId,
        req.body.userName || 'Usuario',
        req.body.openingAmount
      );

      res.status(201).json({
        success: true,
        data: session,
        message: 'Caja abierta exitosamente',
      });
    } catch (error) {
      next(error);
    }
  }

  async addMovement(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const movement = await cashSessionsService.addCashMovement(
        req.user!.tenantId!,
        req.params.id,
        req.body.type,
        req.body.amount,
        req.body.reason,
        req.body.notes,
        req.user!.userId,
        req.body.userName || 'Usuario'
      );

      res.status(201).json({
        success: true,
        data: movement,
        message: `${req.body.type === 'entrada' ? 'Entrada' : 'Salida'} registrada exitosamente`,
      });
    } catch (error) {
      next(error);
    }
  }

  async getMovements(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const movements = await cashSessionsService.getSessionMovements(req.params.id);

      res.json({
        success: true,
        data: movements,
      });
    } catch (error) {
      next(error);
    }
  }

  async getLiveTotals(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const totals = await cashSessionsService.calculateSessionTotals(req.params.id);

      res.json({
        success: true,
        data: totals,
      });
    } catch (error) {
      next(error);
    }
  }

  async submitActualAndClose(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const session = await cashSessionsService.closeSession(
        req.params.id,
        req.user!.userId,
        req.body.userName || 'Admin',
        req.body.actualCash,
        req.body.observations
      );

      res.json({
        success: true,
        data: session,
        message: 'Caja cerrada exitosamente',
      });
    } catch (error) {
      next(error);
    }
  }
}

export const cashSessionsController = new CashSessionsController();
