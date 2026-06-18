import { Response, NextFunction } from 'express';
import { realEstateService } from './realestate.service';
import { AuthRequest } from '../../common/middleware';

export class RealEstateController {

  // ── PROPERTIES ────────────────────────────────────────────────────────────

  async getProperties(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const filters = req.query as any;
      if (filters.minPrice) filters.minPrice = Number(filters.minPrice);
      if (filters.maxPrice) filters.maxPrice = Number(filters.maxPrice);
      if (filters.is_published !== undefined) filters.is_published = filters.is_published === 'true';
      if (filters.is_featured  !== undefined) filters.is_featured  = filters.is_featured  === 'true';
      const data = await realEstateService.getProperties(req.user!.tenantId!, filters);
      res.json({ success: true, data });
    } catch (err) { next(err); }
  }

  async getPropertyById(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await realEstateService.getPropertyById(req.user!.tenantId!, req.params.id);
      res.json({ success: true, data });
    } catch (err) { next(err); }
  }

  async createProperty(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await realEstateService.createProperty(req.user!.tenantId!, req.body);
      res.status(201).json({ success: true, data, message: 'Inmueble creado exitosamente' });
    } catch (err) { next(err); }
  }

  async updateProperty(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await realEstateService.updateProperty(req.user!.tenantId!, req.params.id, req.body);
      res.json({ success: true, data, message: 'Inmueble actualizado' });
    } catch (err) { next(err); }
  }

  async deleteProperty(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      await realEstateService.deleteProperty(req.user!.tenantId!, req.params.id);
      res.json({ success: true, message: 'Inmueble eliminado' });
    } catch (err) { next(err); }
  }

  // ── MEDIA ─────────────────────────────────────────────────────────────────

  async addMedia(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await realEstateService.addMedia(req.user!.tenantId!, req.params.id, req.body);
      res.status(201).json({ success: true, data });
    } catch (err) { next(err); }
  }

  async deleteMedia(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      await realEstateService.deleteMedia(req.user!.tenantId!, Number(req.params.mediaId));
      res.json({ success: true });
    } catch (err) { next(err); }
  }

  // ── OWNERS ────────────────────────────────────────────────────────────────

  async getOwners(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await realEstateService.getOwners(req.user!.tenantId!);
      res.json({ success: true, data });
    } catch (err) { next(err); }
  }

  async getOwnerById(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await realEstateService.getOwnerById(req.user!.tenantId!, req.params.id);
      res.json({ success: true, data });
    } catch (err) { next(err); }
  }

  async createOwner(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await realEstateService.createOwner(req.user!.tenantId!, req.body);
      res.status(201).json({ success: true, data, message: 'Propietario creado' });
    } catch (err) { next(err); }
  }

  async updateOwner(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await realEstateService.updateOwner(req.user!.tenantId!, req.params.id, req.body);
      res.json({ success: true, data, message: 'Propietario actualizado' });
    } catch (err) { next(err); }
  }

  async deleteOwner(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      await realEstateService.deleteOwner(req.user!.tenantId!, req.params.id);
      res.json({ success: true, message: 'Propietario eliminado' });
    } catch (err) { next(err); }
  }

  // ── CLIENTS ───────────────────────────────────────────────────────────────

  async getClients(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await realEstateService.getClients(req.user!.tenantId!, req.query as any);
      res.json({ success: true, data });
    } catch (err) { next(err); }
  }

  async getClientById(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await realEstateService.getClientById(req.user!.tenantId!, req.params.id);
      res.json({ success: true, data });
    } catch (err) { next(err); }
  }

  async createClient(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await realEstateService.createClient(req.user!.tenantId!, req.body);
      res.status(201).json({ success: true, data, message: 'Cliente creado' });
    } catch (err) { next(err); }
  }

  async updateClient(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await realEstateService.updateClient(req.user!.tenantId!, req.params.id, req.body);
      res.json({ success: true, data, message: 'Cliente actualizado' });
    } catch (err) { next(err); }
  }

  async deleteClient(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      await realEstateService.deleteClient(req.user!.tenantId!, req.params.id);
      res.json({ success: true, message: 'Cliente eliminado' });
    } catch (err) { next(err); }
  }

  // ── LEADS ─────────────────────────────────────────────────────────────────

  async getLeads(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await realEstateService.getLeads(req.user!.tenantId!, req.query as any);
      res.json({ success: true, data });
    } catch (err) { next(err); }
  }

  async getLeadById(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await realEstateService.getLeadById(req.user!.tenantId!, req.params.id);
      res.json({ success: true, data });
    } catch (err) { next(err); }
  }

  async createLead(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await realEstateService.createLead(req.user!.tenantId!, req.body);
      res.status(201).json({ success: true, data, message: 'Lead creado' });
    } catch (err) { next(err); }
  }

  async updateLead(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await realEstateService.updateLead(req.user!.tenantId!, req.params.id, req.body);
      res.json({ success: true, data, message: 'Lead actualizado' });
    } catch (err) { next(err); }
  }

  async deleteLead(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      await realEstateService.deleteLead(req.user!.tenantId!, req.params.id);
      res.json({ success: true, message: 'Lead eliminado' });
    } catch (err) { next(err); }
  }

  async addLeadActivity(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await realEstateService.addLeadActivity(
        req.user!.tenantId!, req.params.id,
        { ...req.body, created_by: req.user!.userId }
      );
      res.status(201).json({ success: true, data });
    } catch (err) { next(err); }
  }

  // ── VISITS ────────────────────────────────────────────────────────────────

  async getVisits(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await realEstateService.getVisits(req.user!.tenantId!, req.query as any);
      res.json({ success: true, data });
    } catch (err) { next(err); }
  }

  async createVisit(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await realEstateService.createVisit(req.user!.tenantId!, req.body);
      res.status(201).json({ success: true, data, message: 'Visita agendada' });
    } catch (err) { next(err); }
  }

  async updateVisitStatus(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      await realEstateService.updateVisitStatus(
        req.user!.tenantId!, req.params.id, req.body.status, req.body
      );
      res.json({ success: true, message: 'Visita actualizada' });
    } catch (err) { next(err); }
  }

  // ── CONTRACTS ─────────────────────────────────────────────────────────────

  async getContracts(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await realEstateService.getContracts(req.user!.tenantId!, req.query as any);
      res.json({ success: true, data });
    } catch (err) { next(err); }
  }

  async createContract(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await realEstateService.createContract(req.user!.tenantId!, req.user!.userId!, req.body);
      res.status(201).json({ success: true, data, message: 'Contrato creado' });
    } catch (err) { next(err); }
  }

  async updateContractStatus(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      await realEstateService.updateContractStatus(req.user!.tenantId!, req.params.id, req.body.status);
      res.json({ success: true, message: 'Contrato actualizado' });
    } catch (err) { next(err); }
  }

  // ── RENT PAYMENTS ─────────────────────────────────────────────────────────

  async getRentPayments(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await realEstateService.getRentPayments(req.user!.tenantId!, req.params.contractId);
      res.json({ success: true, data });
    } catch (err) { next(err); }
  }

  async createRentPayment(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await realEstateService.createRentPayment(req.user!.tenantId!, req.body);
      res.status(201).json({ success: true, data });
    } catch (err) { next(err); }
  }

  async markRentPaymentPaid(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      await realEstateService.markRentPaymentPaid(req.user!.tenantId!, Number(req.params.paymentId), req.body);
      res.json({ success: true, message: 'Pago registrado' });
    } catch (err) { next(err); }
  }

  // ── MAINTENANCES ──────────────────────────────────────────────────────────

  async getMaintenances(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await realEstateService.getMaintenances(req.user!.tenantId!, req.query as any);
      res.json({ success: true, data });
    } catch (err) { next(err); }
  }

  async createMaintenance(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await realEstateService.createMaintenance(req.user!.tenantId!, req.body);
      res.status(201).json({ success: true, data, message: 'Solicitud creada' });
    } catch (err) { next(err); }
  }

  async updateMaintenanceStatus(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      await realEstateService.updateMaintenanceStatus(req.user!.tenantId!, req.params.id, req.body.status, req.body);
      res.json({ success: true, message: 'Mantenimiento actualizado' });
    } catch (err) { next(err); }
  }

  // ── DASHBOARD ─────────────────────────────────────────────────────────────

  async getDashboardStats(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await realEstateService.getDashboardStats(req.user!.tenantId!);
      res.json({ success: true, data });
    } catch (err) { next(err); }
  }
}

export const realEstateController = new RealEstateController();
