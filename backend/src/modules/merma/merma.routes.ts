import { Router } from 'express';
import { body, param } from 'express-validator';
import { mermaController } from './merma.controller';
import { authenticate, authorize } from '../../common/middleware';
import { validateRequest } from '../../utils/validators';

const router: ReturnType<typeof Router> = Router();

router.use(authenticate);

// ── Dashboard / analytics (antes que /:id para evitar colisión) ──────────────
router.get('/dashboard', authorize('comerciante', 'superadmin'), mermaController.getDashboard);

// ── PAR levels (deben ir antes de /:id) ─────────────────────────────────────
router.get('/par/levels', authorize('comerciante', 'superadmin'), mermaController.listPar);

router.post('/par/levels',
  authorize('comerciante', 'superadmin'),
  [
    body('product_id').isUUID().withMessage('product_id requerido'),
    body('daily_usage').isFloat({ min: 0 }).withMessage('daily_usage requerido'),
    body('days_between_orders').isInt({ min: 1 }).withMessage('days_between_orders requerido'),
    body('safety_stock').isFloat({ min: 0 }).withMessage('safety_stock requerido'),
    body('area').isIn(['cocina','bar','general']).withMessage('Área inválida'),
  ],
  validateRequest,
  mermaController.upsertPar
);

router.delete('/par/levels/:id',
  authorize('comerciante', 'superadmin'),
  param('id').isUUID(),
  validateRequest,
  mermaController.deletePar
);

// ── Waste records ─────────────────────────────────────────────────────────────
router.get('/', authorize('comerciante', 'vendedor', 'superadmin'), mermaController.list);

router.post('/',
  authorize('comerciante', 'vendedor', 'superadmin'),
  [
    body('product_name').notEmpty().withMessage('Nombre del producto requerido'),
    body('quantity').isFloat({ min: 0.001 }).withMessage('Cantidad debe ser mayor a 0'),
    body('waste_type').isIn(['natural','operativa','administrativa','vencimiento']).withMessage('Tipo de merma inválido'),
    body('reason').isIn(['quemado','vencido','mal_corte','devolucion','consumo_interno','robo','cortesia','sobreporcion','dano','otro']).withMessage('Motivo inválido'),
    body('area').isIn(['cocina','bar','general']).withMessage('Área inválida'),
  ],
  validateRequest,
  mermaController.create
);

router.get('/:id', authorize('comerciante', 'vendedor', 'superadmin'), param('id').isUUID(), validateRequest, mermaController.getById);

router.delete('/:id',
  authorize('comerciante', 'superadmin'),
  param('id').isUUID(),
  validateRequest,
  mermaController.remove
);

export { router as mermaRoutes };
