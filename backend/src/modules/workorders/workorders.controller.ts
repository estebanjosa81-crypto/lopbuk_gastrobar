import { Request, Response, NextFunction } from 'express';
import { workOrderService } from './workorders.service';

export const workOrdersController = {
  // ── WORK ORDERS ──────────────────────────────────────────────────────────
  list: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { status, search, dateFrom, dateTo, assigned_to } = req.query as Record<string, string>;
      const data = await workOrderService.getWorkOrders(req.user!.tenantId, {
        status, search, dateFrom, dateTo, assigned_to,
      });
      res.json({ success: true, data });
    } catch (e) { next(e); }
  },

  getOne: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await workOrderService.getWorkOrderById(req.user!.tenantId, req.params.id);
      res.json({ success: true, data });
    } catch (e) { next(e); }
  },

  create: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await workOrderService.createWorkOrder(req.user!.tenantId, req.user!.id, req.body);
      res.status(201).json({ success: true, data });
    } catch (e) { next(e); }
  },

  update: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await workOrderService.updateWorkOrder(req.user!.tenantId, req.params.id, req.body);
      res.json({ success: true, data });
    } catch (e) { next(e); }
  },

  updateStatus: async (req: Request, res: Response, next: NextFunction) => {
    try {
      await workOrderService.updateStatus(req.user!.tenantId, req.params.id, req.body.status);
      res.json({ success: true });
    } catch (e) { next(e); }
  },

  remove: async (req: Request, res: Response, next: NextFunction) => {
    try {
      await workOrderService.deleteWorkOrder(req.user!.tenantId, req.params.id);
      res.json({ success: true });
    } catch (e) { next(e); }
  },

  // ── MATERIALS ────────────────────────────────────────────────────────────
  addMaterial: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await workOrderService.addMaterial(req.user!.tenantId, req.params.id, req.body);
      res.status(201).json({ success: true, data });
    } catch (e) { next(e); }
  },

  removeMaterial: async (req: Request, res: Response, next: NextFunction) => {
    try {
      await workOrderService.removeMaterial(req.user!.tenantId, Number(req.params.materialId));
      res.json({ success: true });
    } catch (e) { next(e); }
  },

  // ── PAYMENTS ─────────────────────────────────────────────────────────────
  addPayment: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await workOrderService.addPayment(req.user!.tenantId, req.params.id, req.user!.id, req.body);
      res.status(201).json({ success: true, data });
    } catch (e) { next(e); }
  },

  // ── DASHBOARD ────────────────────────────────────────────────────────────
  stats: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await workOrderService.getDashboardStats(req.user!.tenantId);
      res.json({ success: true, data });
    } catch (e) { next(e); }
  },
};
