import { Router } from 'express';
import { body, param } from 'express-validator';
import { novedadesController } from './novedades.controller';
import { authenticate, authorize } from '../../common/middleware';
import { validateRequest } from '../../utils/validators';

const router: ReturnType<typeof Router> = Router();

router.use(authenticate);
router.use(authorize('comerciante', 'superadmin'));

const NOVELTY_TYPES = [
  'vacaciones', 'permiso_remunerado', 'permiso_no_remunerado',
  'incapacidad', 'calamidad', 'licencia_maternidad', 'suspension', 'otro',
];

// GET /api/novedades
router.get('/', novedadesController.findAll.bind(novedadesController));

// GET /api/novedades/vacaciones
router.get('/vacaciones', novedadesController.getVacationBalances.bind(novedadesController));

// POST /api/novedades
router.post(
  '/',
  [
    body('userId').notEmpty().withMessage('El empleado es requerido'),
    body('type').isIn(NOVELTY_TYPES).withMessage('Tipo de novedad inválido'),
    body('startDate').isDate().withMessage('Fecha de inicio inválida'),
    body('endDate').isDate().withMessage('Fecha de fin inválida'),
    body('description').optional().isString(),
    validateRequest,
  ],
  novedadesController.create.bind(novedadesController)
);

// PUT /api/novedades/:id/status
router.put(
  '/:id/status',
  [
    param('id').notEmpty(),
    body('status').isIn(['pendiente', 'aprobado', 'rechazado']).withMessage('Estado inválido'),
    body('rejectionReason').optional().isString(),
    validateRequest,
  ],
  novedadesController.updateStatus.bind(novedadesController)
);

// PUT /api/novedades/vacaciones/balance
router.put(
  '/vacaciones/balance',
  [
    body('userId').notEmpty(),
    body('year').isInt({ min: 2020, max: 2099 }),
    body('daysGranted').isInt({ min: 0, max: 365 }),
    validateRequest,
  ],
  novedadesController.updateVacationBalance.bind(novedadesController)
);

// DELETE /api/novedades/:id
router.delete(
  '/:id',
  [param('id').notEmpty(), validateRequest],
  novedadesController.delete.bind(novedadesController)
);

export default router;
