import { Router } from 'express';
import { body, param, query } from 'express-validator';
import { cashSessionsController } from './cash-sessions.controller';
import { authenticate, authorize } from '../../common/middleware';
import { validateRequest } from '../../utils/validators';

const router: ReturnType<typeof Router> = Router();

router.use(authenticate);

// GET /api/cash-sessions/active - Get current open session
router.get('/active', cashSessionsController.getActive.bind(cashSessionsController));

// GET /api/cash-sessions - List all sessions (comerciante/superadmin only)
router.get(
  '/',
  authorize('comerciante', 'superadmin'),
  [
    query('page').optional().isInt({ min: 1 }).withMessage('Pagina invalida'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limite invalido'),
    query('status').optional().isIn(['abierta', 'cerrada']).withMessage('Estado invalido'),
    validateRequest,
  ],
  cashSessionsController.findAll.bind(cashSessionsController)
);

// GET /api/cash-sessions/:id - Get session detail
router.get(
  '/:id',
  [param('id').notEmpty().withMessage('ID requerido'), validateRequest],
  cashSessionsController.getById.bind(cashSessionsController)
);

// POST /api/cash-sessions/open - Open new session
router.post(
  '/open',
  [
    body('openingAmount').isFloat({ min: 0 }).withMessage('Monto de apertura requerido'),
    body('userName').optional().isString(),
    validateRequest,
  ],
  cashSessionsController.open.bind(cashSessionsController)
);

// POST /api/cash-sessions/:id/movements - Add cash movement
router.post(
  '/:id/movements',
  [
    param('id').notEmpty().withMessage('ID de sesion requerido'),
    body('type').isIn(['entrada', 'salida']).withMessage('Tipo debe ser entrada o salida'),
    body('amount').isFloat({ min: 0.01 }).withMessage('Monto debe ser mayor a 0'),
    body('reason').notEmpty().withMessage('Razon requerida'),
    body('notes').optional(),
    body('userName').optional().isString(),
    validateRequest,
  ],
  cashSessionsController.addMovement.bind(cashSessionsController)
);

// GET /api/cash-sessions/:id/movements - Get movements for a session
router.get(
  '/:id/movements',
  [param('id').notEmpty().withMessage('ID requerido'), validateRequest],
  cashSessionsController.getMovements.bind(cashSessionsController)
);

// GET /api/cash-sessions/:id/totals - Get live totals
router.get(
  '/:id/totals',
  [param('id').notEmpty().withMessage('ID requerido'), validateRequest],
  cashSessionsController.getLiveTotals.bind(cashSessionsController)
);

// POST /api/cash-sessions/:id/close - Close session (cierre ciego)
router.post(
  '/:id/close',
  authorize('comerciante', 'superadmin'),
  [
    param('id').notEmpty().withMessage('ID requerido'),
    body('actualCash').isFloat({ min: 0 }).withMessage('Monto real requerido'),
    body('observations').optional(),
    body('userName').optional().isString(),
    validateRequest,
  ],
  cashSessionsController.submitActualAndClose.bind(cashSessionsController)
);

export default router;
