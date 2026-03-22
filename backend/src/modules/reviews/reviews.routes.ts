import { Router } from 'express';
import { body, param, query } from 'express-validator';
import { reviewsController } from './reviews.controller';
import { authenticate, authorize } from '../../common/middleware';
import { validateRequest } from '../../utils/validators';

const router: ReturnType<typeof Router> = Router();

// ── Public routes (no auth) ────────────────────────────────────────────────

// GET /api/reviews/public/:tenantId/:productId
router.get(
  '/public/:tenantId/:productId',
  reviewsController.findPublic.bind(reviewsController)
);

// POST /api/reviews — customers submit reviews
router.post(
  '/',
  [
    body('tenantId').notEmpty().withMessage('tenantId es requerido'),
    body('productId').notEmpty().withMessage('productId es requerido'),
    body('reviewerName').notEmpty().withMessage('El nombre es requerido'),
    body('reviewerEmail').optional({ nullable: true }).isEmail().withMessage('Email inválido'),
    body('rating').isInt({ min: 1, max: 5 }).withMessage('La calificación debe ser entre 1 y 5'),
    body('title').optional({ nullable: true }).isString(),
    body('body').optional({ nullable: true }).isString(),
    body('imageUrl1').optional({ nullable: true }).isURL().withMessage('URL de imagen 1 inválida'),
    body('imageUrl2').optional({ nullable: true }).isURL().withMessage('URL de imagen 2 inválida'),
    validateRequest,
  ],
  reviewsController.create.bind(reviewsController)
);

// ── Protected routes (merchant / superadmin) ──────────────────────────────

router.use(authenticate);
router.use(authorize('comerciante', 'superadmin'));

// GET /api/reviews
router.get(
  '/',
  [
    query('productId').optional().isString(),
    query('status').optional().isIn(['pendiente', 'aprobado', 'rechazado']),
  ],
  reviewsController.findAll.bind(reviewsController)
);

// PUT /api/reviews/:id
router.put(
  '/:id',
  [
    param('id').notEmpty(),
    body('reviewerName').optional().notEmpty(),
    body('reviewerEmail').optional({ nullable: true }).isEmail(),
    body('rating').optional().isInt({ min: 1, max: 5 }),
    body('title').optional({ nullable: true }).isString(),
    body('body').optional({ nullable: true }).isString(),
    body('imageUrl1').optional({ nullable: true }),
    body('imageUrl2').optional({ nullable: true }),
    validateRequest,
  ],
  reviewsController.update.bind(reviewsController)
);

// PUT /api/reviews/:id/status
router.put(
  '/:id/status',
  [
    param('id').notEmpty(),
    body('status').isIn(['pendiente', 'aprobado', 'rechazado']).withMessage('Estado inválido'),
    body('reply').optional({ nullable: true }).isString(),
    validateRequest,
  ],
  reviewsController.updateStatus.bind(reviewsController)
);

// DELETE /api/reviews/:id
router.delete(
  '/:id',
  [param('id').notEmpty(), validateRequest],
  reviewsController.delete.bind(reviewsController)
);

export default router;
