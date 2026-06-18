import { Router } from 'express';
import { body, param } from 'express-validator';
import { categoriesController } from './categories.controller';
import { authenticate, authorize } from '../../common/middleware';
import { validateRequest } from '../../utils/validators';

const router: ReturnType<typeof Router> = Router();

router.use(authenticate);

// GET /api/categories?includeHidden=true
router.get('/', categoriesController.findAll.bind(categoriesController));

// POST /api/categories
router.post(
  '/',
  authorize('comerciante', 'superadmin', 'administrador_rb', 'cajero'),
  [
    body('id').notEmpty().withMessage('El identificador es requerido'),
    body('name').notEmpty().withMessage('El nombre es requerido'),
    body('description').optional().isString(),
    body('color').optional().isString().isLength({ max: 7 }),
    validateRequest,
  ],
  categoriesController.create.bind(categoriesController)
);

// PUT /api/categories/:id — editar nombre, descripción, color, orden
router.put(
  '/:id',
  authorize('comerciante', 'superadmin', 'administrador_rb'),
  [
    param('id').notEmpty().withMessage('ID requerido'),
    body('name').optional().notEmpty().withMessage('El nombre no puede estar vacío'),
    body('description').optional().isString(),
    body('color').optional().isString().isLength({ max: 7 }),
    body('sortOrder').optional().isInt({ min: 0 }),
    validateRequest,
  ],
  categoriesController.update.bind(categoriesController)
);

// PATCH /api/categories/:id/visibility — ocultar / mostrar
router.patch(
  '/:id/visibility',
  authorize('comerciante', 'superadmin', 'administrador_rb'),
  [param('id').notEmpty().withMessage('ID requerido'), validateRequest],
  categoriesController.toggleVisibility.bind(categoriesController)
);

// DELETE /api/categories/:id
router.delete(
  '/:id',
  authorize('comerciante', 'superadmin', 'administrador_rb'),
  [param('id').notEmpty().withMessage('ID requerido'), validateRequest],
  categoriesController.delete.bind(categoriesController)
);

export default router;
