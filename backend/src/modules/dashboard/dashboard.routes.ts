import { Router } from 'express';
import { body, query } from 'express-validator';
import { dashboardController } from './dashboard.controller';
import { authenticate, authorize } from '../../common/middleware';
import { validateRequest } from '../../utils/validators';

const router: ReturnType<typeof Router> = Router();

// Todas las rutas requieren autenticacion
router.use(authenticate);

// GET /api/dashboard/metrics
router.get('/metrics', dashboardController.getMetrics.bind(dashboardController));

// GET /api/dashboard/sales-trend
router.get(
  '/sales-trend',
  [
    query('days')
      .optional()
      .isInt({ min: 0, max: 365 })
      .withMessage('El numero de dias debe estar entre 0 y 365'),
    validateRequest,
  ],
  dashboardController.getSalesTrend.bind(dashboardController)
);

// GET /api/dashboard/monthly-revenue-costs
router.get(
  '/monthly-revenue-costs',
  [
    query('months')
      .optional()
      .isInt({ min: 1, max: 12 })
      .withMessage('El numero de meses debe estar entre 1 y 12'),
    validateRequest,
  ],
  dashboardController.getMonthlyRevenueCosts.bind(dashboardController)
);

// GET /api/dashboard/store-info
router.get('/store-info', dashboardController.getStoreInfo.bind(dashboardController));

// PUT /api/dashboard/store-info
router.put(
  '/store-info',
  authorize('comerciante', 'superadmin'),
  [
    body('name').optional().notEmpty().withMessage('El nombre no puede estar vacio'),
    body('email').optional().isEmail().withMessage('Email invalido'),
    validateRequest,
  ],
  dashboardController.updateStoreInfo.bind(dashboardController)
);

export default router;
