import { Router } from 'express';
import { body, param, query } from 'express-validator';
import { cashSessionsController } from './cash-sessions.controller';
import { authenticate, authorize } from '../../common/middleware';
import { validateRequest } from '../../utils/validators';

const router: ReturnType<typeof Router> = Router();

router.use(authenticate);

// GET /api/cash-sessions/active - Get current open session
router.get('/active', cashSessionsController.getActive.bind(cashSessionsController));

// GET /api/cash-sessions/daily-summary - Resumen consolidado del día (turnos)
router.get(
  '/daily-summary',
  [query('date').optional().isString(), validateRequest],
  cashSessionsController.getDailySummary.bind(cashSessionsController)
);

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

// ── Empleados del turno ──
// GET /api/cash-sessions/:id/employees
router.get(
  '/:id/employees',
  [param('id').notEmpty().withMessage('ID requerido'), validateRequest],
  cashSessionsController.getEmployees.bind(cashSessionsController)
);
// POST /api/cash-sessions/:id/employees
router.post(
  '/:id/employees',
  [
    param('id').notEmpty().withMessage('ID requerido'),
    body('name').notEmpty().withMessage('Nombre requerido'),
    body('role').optional().isString(),
    body('userId').optional({ nullable: true }).isString(),
    validateRequest,
  ],
  cashSessionsController.addEmployee.bind(cashSessionsController)
);
// PUT /api/cash-sessions/:id/employees/:empId
router.put(
  '/:id/employees/:empId',
  [
    param('empId').notEmpty().withMessage('ID empleado requerido'),
    body('role').optional({ nullable: true }).isString(),
    body('status').optional().isIn(['activo', 'baja']),
    body('bajaReason').optional({ nullable: true }).isString(),
    validateRequest,
  ],
  cashSessionsController.updateEmployee.bind(cashSessionsController)
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
