import { Router } from 'express';
import { body, param } from 'express-validator';
import { recipesController } from './recipes.controller';
import { authenticate } from '../../common/middleware';
import { validateRequest } from '../../utils/validators';

const router: ReturnType<typeof Router> = Router();

router.use(authenticate);

// GET /api/recipes
router.get('/', recipesController.findAll.bind(recipesController));

// GET /api/recipes/:productId
router.get(
  '/:productId',
  [param('productId').notEmpty().withMessage('ID de producto requerido'), validateRequest],
  recipesController.findByProductId.bind(recipesController)
);

// POST /api/recipes
router.post(
  '/',
  [
    body('productId').notEmpty().withMessage('El producto es requerido'),
    body('ingredients')
      .isArray({ min: 1 })
      .withMessage('Se requiere al menos un ingrediente'),
    body('ingredients.*.ingredientId')
      .notEmpty()
      .withMessage('El ingrediente es requerido'),
    body('ingredients.*.quantity')
      .isFloat({ gt: 0 })
      .withMessage('La cantidad debe ser mayor a 0'),
    validateRequest,
  ],
  recipesController.createOrReplace.bind(recipesController)
);

// DELETE /api/recipes/:productId
router.delete(
  '/:productId',
  [param('productId').notEmpty().withMessage('ID de producto requerido'), validateRequest],
  recipesController.delete.bind(recipesController)
);

export default router;
