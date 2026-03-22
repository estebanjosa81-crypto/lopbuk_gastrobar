import { Response, NextFunction } from 'express';
import { creditsService } from './credits.service';
import { AuthRequest } from '../../common/middleware';

export class CreditsController {
  async findAllPending(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.user!.tenantId!;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const customerId = req.query.customerId as string | undefined;
      const status = req.query.status as string | undefined;

      const result = await creditsService.findAllPendingCredits(
        tenantId,
        page,
        limit,
        customerId,
        status
      );

      res.json({
        success: true,
        ...result,
      });
    } catch (error) {
      next(error);
    }
  }

  async getCreditDetail(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.user!.tenantId!;
      const credit = await creditsService.getCreditDetail(tenantId, req.params.saleId);

      res.json({
        success: true,
        data: credit,
      });
    } catch (error) {
      next(error);
    }
  }

  async getPaymentHistory(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const payments = await creditsService.getPaymentHistory(req.params.saleId);

      res.json({
        success: true,
        data: payments,
      });
    } catch (error) {
      next(error);
    }
  }

  async registerPayment(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.user!.tenantId!;
      const userId = req.user?.userId || null;
      const payment = await creditsService.registerPayment(
        tenantId,
        req.params.saleId,
        req.body,
        userId
      );

      res.status(201).json({
        success: true,
        data: payment,
        message: 'Abono registrado exitosamente',
      });
    } catch (error) {
      next(error);
    }
  }

  async getSummary(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.user!.tenantId!;
      const summary = await creditsService.getSummary(tenantId);

      res.json({
        success: true,
        data: summary,
      });
    } catch (error) {
      next(error);
    }
  }
}

export const creditsController = new CreditsController();
