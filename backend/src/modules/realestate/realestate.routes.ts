import { Router, Request, Response } from 'express';
import { realEstateController } from './realestate.controller';
import { authenticate } from '../../common/middleware';
import { realEstateService } from './realestate.service';

const router: ReturnType<typeof Router> = Router();

// ── PUBLIC: portal inmobiliario ───────────────────────────────────────────────

router.get('/public/:slug/properties', async (req: Request, res: Response) => {
  try {
    const result = await realEstateService.getPublicProperties(req.params.slug, req.query as any);
    if (!result) {
      res.status(404).json({ success: false, error: 'Portal no disponible' });
      return;
    }
    res.json({ success: true, data: result });
  } catch (err) {
    console.error('RE public properties error', err);
    res.status(500).json({ success: false, error: 'Error al cargar propiedades' });
  }
});

router.get('/public/:slug/properties/:id', async (req: Request, res: Response) => {
  try {
    const result = await realEstateService.getPublicPropertyDetail(req.params.slug, req.params.id);
    if (!result) {
      res.status(404).json({ success: false, error: 'Propiedad no encontrada' });
      return;
    }
    res.json({ success: true, data: result });
  } catch (err) {
    console.error('RE public property detail error', err);
    res.status(500).json({ success: false, error: 'Error al cargar propiedad' });
  }
});

router.post('/public/:slug/leads', async (req: Request, res: Response) => {
  try {
    const { full_name, phone } = req.body;
    if (!full_name || !phone) {
      res.status(400).json({ success: false, error: 'Nombre y teléfono son requeridos' });
      return;
    }
    const data = await realEstateService.registerPublicLead(req.params.slug, req.body);
    res.status(201).json({ success: true, data, message: 'Solicitud enviada exitosamente' });
  } catch (err) {
    console.error('RE public lead error', err);
    res.status(500).json({ success: false, error: 'Error al enviar solicitud' });
  }
});

// ── AUTHENTICATED routes ──────────────────────────────────────────────────────

router.use(authenticate);

// Dashboard
router.get('/stats', (req, res, next) => realEstateController.getDashboardStats(req as any, res, next));

// Properties
router.get('/properties',        (req, res, next) => realEstateController.getProperties(req as any, res, next));
router.get('/properties/:id',    (req, res, next) => realEstateController.getPropertyById(req as any, res, next));
router.post('/properties',       (req, res, next) => realEstateController.createProperty(req as any, res, next));
router.put('/properties/:id',    (req, res, next) => realEstateController.updateProperty(req as any, res, next));
router.delete('/properties/:id', (req, res, next) => realEstateController.deleteProperty(req as any, res, next));

// Property media
router.post('/properties/:id/media',          (req, res, next) => realEstateController.addMedia(req as any, res, next));
router.delete('/properties/:id/media/:mediaId', (req, res, next) => realEstateController.deleteMedia(req as any, res, next));

// Owners
router.get('/owners',        (req, res, next) => realEstateController.getOwners(req as any, res, next));
router.get('/owners/:id',    (req, res, next) => realEstateController.getOwnerById(req as any, res, next));
router.post('/owners',       (req, res, next) => realEstateController.createOwner(req as any, res, next));
router.put('/owners/:id',    (req, res, next) => realEstateController.updateOwner(req as any, res, next));
router.delete('/owners/:id', (req, res, next) => realEstateController.deleteOwner(req as any, res, next));

// Clients
router.get('/clients',        (req, res, next) => realEstateController.getClients(req as any, res, next));
router.get('/clients/:id',    (req, res, next) => realEstateController.getClientById(req as any, res, next));
router.post('/clients',       (req, res, next) => realEstateController.createClient(req as any, res, next));
router.put('/clients/:id',    (req, res, next) => realEstateController.updateClient(req as any, res, next));
router.delete('/clients/:id', (req, res, next) => realEstateController.deleteClient(req as any, res, next));

// Leads
router.get('/leads',                    (req, res, next) => realEstateController.getLeads(req as any, res, next));
router.get('/leads/:id',                (req, res, next) => realEstateController.getLeadById(req as any, res, next));
router.post('/leads',                   (req, res, next) => realEstateController.createLead(req as any, res, next));
router.put('/leads/:id',                (req, res, next) => realEstateController.updateLead(req as any, res, next));
router.delete('/leads/:id',             (req, res, next) => realEstateController.deleteLead(req as any, res, next));
router.post('/leads/:id/activities',    (req, res, next) => realEstateController.addLeadActivity(req as any, res, next));

// Visits
router.get('/visits',              (req, res, next) => realEstateController.getVisits(req as any, res, next));
router.post('/visits',             (req, res, next) => realEstateController.createVisit(req as any, res, next));
router.patch('/visits/:id/status', (req, res, next) => realEstateController.updateVisitStatus(req as any, res, next));

// Contracts
router.get('/contracts',              (req, res, next) => realEstateController.getContracts(req as any, res, next));
router.post('/contracts',             (req, res, next) => realEstateController.createContract(req as any, res, next));
router.patch('/contracts/:id/status', (req, res, next) => realEstateController.updateContractStatus(req as any, res, next));

// Rent payments
router.get('/contracts/:contractId/payments',        (req, res, next) => realEstateController.getRentPayments(req as any, res, next));
router.post('/contracts/:contractId/payments',       (req, res, next) => realEstateController.createRentPayment(req as any, res, next));
router.patch('/rent-payments/:paymentId/paid',       (req, res, next) => realEstateController.markRentPaymentPaid(req as any, res, next));

// Maintenances
router.get('/maintenances',              (req, res, next) => realEstateController.getMaintenances(req as any, res, next));
router.post('/maintenances',             (req, res, next) => realEstateController.createMaintenance(req as any, res, next));
router.patch('/maintenances/:id/status', (req, res, next) => realEstateController.updateMaintenanceStatus(req as any, res, next));

export default router;
