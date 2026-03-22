import { Response, NextFunction } from 'express';
import { dashboardService } from './dashboard.service';
import { AuthRequest } from '../../common/middleware';

export class DashboardController {
  async getMetrics(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const metrics = await dashboardService.getMetrics(req.user!.tenantId!);

      res.json({
        success: true,
        data: metrics,
      });
    } catch (error) {
      next(error);
    }
  }

  async getSalesTrend(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const daysParam = req.query.days !== undefined ? parseInt(req.query.days as string) : 7;
      const days = isNaN(daysParam) ? 7 : daysParam;
      const trend = await dashboardService.getSalesTrend(req.user!.tenantId!, days);

      res.json({
        success: true,
        data: trend,
      });
    } catch (error) {
      next(error);
    }
  }

  async getMonthlyRevenueCosts(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const monthsParam = req.query.months !== undefined ? parseInt(req.query.months as string) : 6;
      const months = isNaN(monthsParam) ? 6 : monthsParam;
      const data = await dashboardService.getMonthlyRevenueCosts(req.user!.tenantId!, months);

      res.json({
        success: true,
        data,
      });
    } catch (error) {
      next(error);
    }
  }

  async getStoreInfo(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const storeInfo = await dashboardService.getStoreInfo(req.user!.tenantId!);

      res.json({
        success: true,
        data: storeInfo,
      });
    } catch (error) {
      next(error);
    }
  }

  async updateStoreInfo(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      await dashboardService.updateStoreInfo(req.user!.tenantId!, req.body);

      res.json({
        success: true,
        message: 'Informacion de la tienda actualizada exitosamente',
      });
    } catch (error) {
      next(error);
    }
  }
}

export const dashboardController = new DashboardController();
