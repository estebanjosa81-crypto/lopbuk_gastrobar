import { Request, Response, NextFunction } from 'express';
import { usersService } from './users.service';
import { AuthRequest } from '../../common/middleware';

export class UsersController {
  async findAll(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const tenantId = req.user!.tenantId;

      const result = await usersService.findAll(tenantId, page, limit);

      res.json({
        success: true,
        ...result,
      });
    } catch (error) {
      next(error);
    }
  }

  async findById(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = await usersService.findById(req.params.id);

      res.json({
        success: true,
        data: user,
      });
    } catch (error) {
      next(error);
    }
  }

  async create(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      // Comerciante creates users in their own tenant; superadmin can specify tenantId
      const tenantId = req.body.tenantId || req.user!.tenantId;
      const user = await usersService.create({ ...req.body, tenantId });

      res.status(201).json({
        success: true,
        data: user,
        message: 'Usuario creado exitosamente',
      });
    } catch (error) {
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = await usersService.update(req.params.id, req.body);

      res.json({
        success: true,
        data: user,
        message: 'Usuario actualizado exitosamente',
      });
    } catch (error) {
      next(error);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await usersService.delete(req.params.id);

      res.json({
        success: true,
        message: 'Usuario eliminado exitosamente',
      });
    } catch (error) {
      next(error);
    }
  }

  async resetPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await usersService.resetPassword(req.params.id, req.body.newPassword);

      res.json({
        success: true,
        message: 'Contrasena restablecida exitosamente',
      });
    } catch (error) {
      next(error);
    }
  }
}

export const usersController = new UsersController();
