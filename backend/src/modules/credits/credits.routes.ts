import { Router } from 'express';
import { body, param } from 'express-validator';
import { creditsController } from './credits.controller';
import { authenticate } from '../../common/middleware';
import { validateRequest } from '../../utils/validators';

const router: ReturnType<typeof Router> = Router();

// Todas las rutas requieren autenticacion
router.use(authenticate);

// GET /api/credits - Listar creditos pendientes
router.get('/', creditsController.findAllPending.bind(creditsController));

// GET /api/credits/summary - Resumen de cuentas por cobrar
router.get('/summary', creditsController.getSummary.bind(creditsController));

// GET /api/credits/:saleId - Detalle de un credito
router.get(
  '/:saleId',
  [param('saleId').notEmpty().withMessage('ID de venta requerido'), validateRequest],
  creditsController.getCreditDetail.bind(creditsController)
);

// GET /api/credits/:saleId/payments - Historial de abonos
router.get(
  '/:saleId/payments',
  [param('saleId').notEmpty().withMessage('ID de venta requerido'), validateRequest],
  creditsController.getPaymentHistory.bind(creditsController)
);

// POST /api/credits/:saleId/payments - Registrar abono
router.post(
  '/:saleId/payments',
  [
    param('saleId').notEmpty().withMessage('ID de venta requerido'),
    body('amount')
      .isFloat({ min: 0.01 })
      .withMessage('El monto debe ser mayor a 0'),
    body('paymentMethod')
      .isIn(['efectivo', 'tarjeta', 'transferencia'])
      .withMessage('Metodo de pago invalido'),
    body('notes').optional().isString().withMessage('Notas invalidas'),
    validateRequest,
  ],
  creditsController.registerPayment.bind(creditsController)
);

export default router;
