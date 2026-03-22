import { Request, Response, NextFunction } from 'express';
import { servicesService } from './services.service';
import { AuthRequest } from '../../common/middleware';

export class ServicesController {
  // ── SERVICES CRUD ─────────────────────────────────────────────
  async findAll(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const data = await servicesService.findAll(req.user!.tenantId!);
      res.json({ success: true, data });
    } catch (e) { next(e); }
  }

  async findById(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const data = await servicesService.findById(req.params.id, req.user!.tenantId!);
      res.json({ success: true, data });
    } catch (e) { next(e); }
  }

  async create(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const data = await servicesService.create(req.user!.tenantId!, req.body);
      res.status(201).json({ success: true, data, message: 'Servicio creado' });
    } catch (e) { next(e); }
  }

  async update(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const data = await servicesService.update(req.params.id, req.user!.tenantId!, req.body);
      res.json({ success: true, data, message: 'Servicio actualizado' });
    } catch (e) { next(e); }
  }

  async remove(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      await servicesService.remove(req.params.id, req.user!.tenantId!);
      res.json({ success: true, message: 'Servicio eliminado' });
    } catch (e) { next(e); }
  }

  // ── AVAILABILITY ─────────────────────────────────────────────
  async getAvailability(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const data = await servicesService.getAvailability(req.params.id);
      res.json({ success: true, data });
    } catch (e) { next(e); }
  }

  async setAvailability(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const data = await servicesService.setAvailability(
        req.params.id, req.user!.tenantId!, req.body.slots
      );
      res.json({ success: true, data, message: 'Horarios actualizados' });
    } catch (e) { next(e); }
  }

  // ── BLOCKED PERIODS ──────────────────────────────────────────
  async getBlocked(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const data = await servicesService.getBlockedPeriods(
        req.user!.tenantId!, req.query.serviceId as string | undefined
      );
      res.json({ success: true, data });
    } catch (e) { next(e); }
  }

  async addBlocked(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const data = await servicesService.addBlockedPeriod(req.user!.tenantId!, req.body);
      res.status(201).json({ success: true, data, message: 'Fecha bloqueada' });
    } catch (e) { next(e); }
  }

  async removeBlocked(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      await servicesService.removeBlockedPeriod(req.params.id, req.user!.tenantId!);
      res.json({ success: true, message: 'Bloqueo eliminado' });
    } catch (e) { next(e); }
  }

  // ── SLOTS (public) ───────────────────────────────────────────
  async getSlots(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { date, store } = req.query as { date: string; store: string };
      if (!date) { res.status(400).json({ success: false, error: 'date requerido' }); return; }

      // Resolve tenantId from store slug
      const pool = (await import('../../config')).db;
      const [tenants] = await pool.execute<any[]>(
        "SELECT id FROM tenants WHERE slug = ? AND status = 'activo' LIMIT 1", [store]
      );
      if (!tenants.length) { res.status(404).json({ success: false, error: 'Tienda no encontrada' }); return; }
      const tenantId = tenants[0].id;

      const slots = await servicesService.getAvailableSlots(id, tenantId, date);
      res.json({ success: true, data: slots });
    } catch (e) { next(e); }
  }

  // ── PUBLIC services ──────────────────────────────────────────
  async findPublic(req: Request, res: Response, next: NextFunction) {
    try {
      const store = req.query.store as string;
      if (!store) { res.status(400).json({ success: false, error: 'store requerido' }); return; }
      const result = await servicesService.findPublicBySlug(store);
      res.json({ success: true, data: result.services });
    } catch (e) { next(e); }
  }

  // ── BOOKINGS (merchant) ───────────────────────────────────────
  async findBookings(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const result = await servicesService.findBookings(req.user!.tenantId!, {
        serviceId: req.query.serviceId as string,
        status: req.query.status as string,
        dateFrom: req.query.dateFrom as string,
        dateTo: req.query.dateTo as string,
        page: parseInt(req.query.page as string) || 1,
        limit: parseInt(req.query.limit as string) || 20,
      });
      res.json({ success: true, ...result });
    } catch (e) { next(e); }
  }

  // ── CREATE BOOKING (public) ───────────────────────────────────
  async createBooking(req: Request, res: Response, next: NextFunction) {
    try {
      const store = req.query.store as string;
      if (!store) { res.status(400).json({ success: false, error: 'store requerido' }); return; }
      const pool = (await import('../../config')).db;
      const [tenants] = await pool.execute<any[]>(
        "SELECT id FROM tenants WHERE slug = ? AND status = 'activo' LIMIT 1", [store]
      );
      if (!tenants.length) { res.status(404).json({ success: false, error: 'Tienda no encontrada' }); return; }
      const tenantId = tenants[0].id;
      const booking = await servicesService.createBooking(tenantId, req.body);
      res.status(201).json({ success: true, data: booking, message: 'Reserva recibida. Te contactaremos para confirmar.' });
    } catch (e) { next(e); }
  }

  async updateBookingStatus(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const data = await servicesService.updateBookingStatus(
        req.params.id, req.user!.tenantId!, req.body
      );
      res.json({ success: true, data, message: 'Reserva actualizada' });
    } catch (e) { next(e); }
  }
}

export const servicesController = new ServicesController();
