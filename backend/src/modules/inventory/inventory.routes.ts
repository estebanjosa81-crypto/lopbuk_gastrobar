import { Router } from 'express';
import { body, param, query } from 'express-validator';
import { inventoryController } from './inventory.controller';
import { authenticate, authorize } from '../../common/middleware';
import { validateRequest } from '../../utils/validators';

const router: ReturnType<typeof Router> = Router();

// Todas las rutas requieren autenticacion
router.use(authenticate);

// GET /api/inventory/movements
router.get(
  '/movements',
  [
    query('page').optional().isInt({ min: 1 }).withMessage('Pagina invalida'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limite invalido'),
    query('type')
      .optional()
      .isIn(['entrada', 'salida', 'ajuste', 'venta', 'devolucion'])
      .withMessage('Tipo invalido'),
    validateRequest,
  ],
  inventoryController.findAll.bind(inventoryController)
);

// GET /api/inventory/movements/product/:productId
router.get(
  '/movements/product/:productId',
  [param('productId').notEmpty().withMessage('ID del producto requerido'), validateRequest],
  inventoryController.findByProductId.bind(inventoryController)
);

// POST /api/inventory/adjust
router.post(
  '/adjust',
  authorize('comerciante', 'superadmin'),
  [
    body('productId').notEmpty().withMessage('ID del producto requerido'),
    body('quantity')
      .isInt({ min: 0 })
      .withMessage('La cantidad debe ser mayor o igual a 0'),
    body('type')
      .isIn(['entrada', 'salida', 'ajuste'])
      .withMessage('Tipo invalido'),
    body('reason').notEmpty().withMessage('La razon es requerida'),
    validateRequest,
  ],
  inventoryController.adjustStock.bind(inventoryController)
);

// POST /api/inventory/bulk-adjust
router.post(
  '/bulk-adjust',
  authorize('comerciante', 'superadmin'),
  [
    body('adjustments')
      .isArray({ min: 1 })
      .withMessage('Debe incluir al menos un ajuste'),
    body('adjustments.*.productId')
      .notEmpty()
      .withMessage('ID del producto requerido'),
    body('adjustments.*.quantity')
      .isInt({ min: 0 })
      .withMessage('La cantidad debe ser mayor o igual a 0'),
    body('adjustments.*.type')
      .isIn(['entrada', 'salida', 'ajuste'])
      .withMessage('Tipo invalido'),
    body('adjustments.*.reason')
      .notEmpty()
      .withMessage('La razon es requerida'),
    validateRequest,
  ],
  inventoryController.bulkAdjustStock.bind(inventoryController)
);

export default router;
