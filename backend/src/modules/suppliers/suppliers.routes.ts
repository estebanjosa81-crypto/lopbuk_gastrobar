import { Router } from 'express';
import { body, param } from 'express-validator';
import { suppliersController } from './suppliers.controller';
import { authenticate } from '../../common/middleware';
import { validateRequest } from '../../utils/validators';

const router: ReturnType<typeof Router> = Router();
router.use(authenticate);

router.get('/', suppliersController.findAll.bind(suppliersController));

router.get(
  '/:id',
  [param('id').isUUID(), validateRequest],
  suppliersController.findById.bind(suppliersController)
);

router.post(
  '/',
  [body('name').notEmpty().withMessage('Nombre requerido'), validateRequest],
  suppliersController.create.bind(suppliersController)
);

router.put(
  '/:id',
  [param('id').isUUID(), validateRequest],
  suppliersController.update.bind(suppliersController)
);

router.delete(
  '/:id',
  [param('id').isUUID(), validateRequest],
  suppliersController.delete.bind(suppliersController)
);

// Productos del proveedor
router.get(
  '/:id/products',
  [param('id').isUUID(), validateRequest],
  suppliersController.getProducts.bind(suppliersController)
);

router.post(
  '/:id/products',
  [
    param('id').isUUID(),
    body('productId').isUUID().withMessage('productId requerido'),
    validateRequest,
  ],
  suppliersController.linkProduct.bind(suppliersController)
);

router.delete(
  '/:id/products/:productId',
  [param('id').isUUID(), param('productId').isUUID(), validateRequest],
  suppliersController.unlinkProduct.bind(suppliersController)
);

export default router;
