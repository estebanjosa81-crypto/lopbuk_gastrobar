import { Router } from 'express';
import { body, param } from 'express-validator';
import { categoriesController } from './categories.controller';
import { authenticate } from '../../common/middleware';
import { validateRequest } from '../../utils/validators';

const router: ReturnType<typeof Router> = Router();

router.use(authenticate);

// GET /api/categories
router.get('/', categoriesController.findAll.bind(categoriesController));

// POST /api/categories
router.post(
  '/',
  [
    body('id').notEmpty().withMessage('El identificador es requerido'),
    body('name').notEmpty().withMessage('El nombre es requerido'),
    body('description').optional().isString().withMessage('La descripción debe ser texto'),
    validateRequest,
  ],
  categoriesController.create.bind(categoriesController)
);

// DELETE /api/categories/:id
router.delete(
  '/:id',
  [param('id').notEmpty().withMessage('ID requerido'), validateRequest],
  categoriesController.delete.bind(categoriesController)
);

export default router;
