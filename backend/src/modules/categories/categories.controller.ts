import { Response, NextFunction } from 'express';
import { categoriesService } from './categories.service';
import { AuthRequest } from '../../common/middleware';

export class CategoriesController {
  async findAll(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.user!.tenantId!;
      const categories = await categoriesService.findAll(tenantId);

      res.json({
        success: true,
        data: categories,
      });
    } catch (error) {
      next(error);
    }
  }

  async create(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.user!.tenantId!;
      const category = await categoriesService.create(tenantId, req.body);

      res.status(201).json({
        success: true,
        data: category,
        message: 'Categoría creada exitosamente',
      });
    } catch (error) {
      next(error);
    }
  }

  async delete(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.user!.tenantId!;
      await categoriesService.delete(tenantId, req.params.id);

      res.json({
        success: true,
        message: 'Categoría eliminada exitosamente',
      });
    } catch (error) {
      next(error);
    }
  }
}

export const categoriesController = new CategoriesController();
