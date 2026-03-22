import { Response, NextFunction } from 'express';
import { recipesService } from './recipes.service';
import { AuthRequest } from '../../common/middleware';

export class RecipesController {
  async findAll(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.user!.tenantId!;
      const recipes = await recipesService.findAll(tenantId);

      res.json({
        success: true,
        data: recipes,
      });
    } catch (error) {
      next(error);
    }
  }

  async findByProductId(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.user!.tenantId!;
      const recipe = await recipesService.findByProductId(req.params.productId, tenantId);

      if (!recipe) {
        res.status(404).json({
          success: false,
          error: 'Receta no encontrada',
        });
        return;
      }

      res.json({
        success: true,
        data: recipe,
      });
    } catch (error) {
      next(error);
    }
  }

  async createOrReplace(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.user!.tenantId!;
      const { productId, ingredients } = req.body;

      const recipe = await recipesService.createOrReplace(tenantId, productId, ingredients);

      res.status(201).json({
        success: true,
        data: recipe,
        message: 'Receta guardada exitosamente',
      });
    } catch (error) {
      next(error);
    }
  }

  async delete(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.user!.tenantId!;
      await recipesService.deleteByProductId(req.params.productId, tenantId);

      res.json({
        success: true,
        message: 'Receta eliminada exitosamente',
      });
    } catch (error) {
      next(error);
    }
  }
}

export const recipesController = new RecipesController();
