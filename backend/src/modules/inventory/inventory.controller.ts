import { Response, NextFunction } from 'express';
import { inventoryService, StockMovementFilters } from './inventory.service';
import { AuthRequest } from '../../common/middleware';
import { StockMovementType } from '../../common/types';

export class InventoryController {
  async findAll(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;

      const filters: StockMovementFilters = {};

      if (req.query.productId) {
        filters.productId = req.query.productId as string;
      }

      if (req.query.type) {
        filters.type = req.query.type as StockMovementType;
      }

      if (req.query.startDate) {
        filters.startDate = new Date(req.query.startDate as string);
      }

      if (req.query.endDate) {
        filters.endDate = new Date(req.query.endDate as string);
      }

      const result = await inventoryService.findAll(req.user!.tenantId!, page, limit, filters);

      res.json({
        success: true,
        ...result,
      });
    } catch (error) {
      next(error);
    }
  }

  async findByProductId(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const movements = await inventoryService.findByProductId(req.params.productId, req.user!.tenantId!);

      res.json({
        success: true,
        data: movements,
      });
    } catch (error) {
      next(error);
    }
  }

  async adjustStock(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { productId, quantity, type, reason } = req.body;

      const movement = await inventoryService.adjustStock(
        req.user!.tenantId!,
        productId,
        quantity,
        type,
        reason,
        req.user!.userId
      );

      res.status(201).json({
        success: true,
        data: movement,
        message: 'Stock ajustado exitosamente',
      });
    } catch (error) {
      next(error);
    }
  }

  async bulkAdjustStock(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { adjustments } = req.body;

      const movements = await inventoryService.bulkAdjustStock(
        req.user!.tenantId!,
        adjustments,
        req.user!.userId
      );

      res.status(201).json({
        success: true,
        data: movements,
        message: 'Stock ajustado exitosamente',
      });
    } catch (error) {
      next(error);
    }
  }
}

export const inventoryController = new InventoryController();
