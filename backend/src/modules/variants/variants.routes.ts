import { Router } from 'express';
import { body, param } from 'express-validator';
import { variantsController } from './variants.controller';
import { authenticate } from '../../common/middleware';
import { validateRequest } from '../../utils/validators';

const router: ReturnType<typeof Router> = Router();
router.use(authenticate);

// ── Por producto ──────────────────────────────────────────────────────────────
// GET  /api/products/:productId/variants
// POST /api/products/:productId/variants
router.get(
  '/products/:productId/variants',
  [param('productId').isUUID().withMessage('ID de producto inválido'), validateRequest],
  variantsController.findByProduct.bind(variantsController)
);

router.post(
  '/products/:productId/variants',
  [
    param('productId').isUUID(),
    body('sku').notEmpty().withMessage('SKU requerido'),
    validateRequest,
  ],
  variantsController.create.bind(variantsController)
);

// ── Por variante ──────────────────────────────────────────────────────────────
// GET    /api/variants/:id
// PUT    /api/variants/:id
// DELETE /api/variants/:id
// PATCH  /api/variants/:id/stock
// GET    /api/variants/:id/movements
// GET    /api/variants/:id/price-tiers
// POST   /api/variants/:id/price-tiers
// POST   /api/variants/:id/resolve-price
router.get(
  '/variants/:id',
  [param('id').isUUID(), validateRequest],
  variantsController.findById.bind(variantsController)
);

router.put(
  '/variants/:id',
  [param('id').isUUID(), validateRequest],
  variantsController.update.bind(variantsController)
);

router.delete(
  '/variants/:id',
  [param('id').isUUID(), validateRequest],
  variantsController.delete.bind(variantsController)
);

router.patch(
  '/variants/:id/stock',
  [
    param('id').isUUID(),
    body('quantity').isNumeric().withMessage('Cantidad requerida'),
    body('type').isIn(['entrada', 'salida', 'ajuste', 'merma']).withMessage('Tipo inválido'),
    body('reason').notEmpty().withMessage('Motivo requerido'),
    validateRequest,
  ],
  variantsController.adjustStock.bind(variantsController)
);

router.get(
  '/variants/:id/movements',
  [param('id').isUUID(), validateRequest],
  variantsController.getMovements.bind(variantsController)
);

router.get(
  '/variants/:id/price-tiers',
  [param('id').isUUID(), validateRequest],
  variantsController.getTiers.bind(variantsController)
);

router.post(
  '/variants/:id/price-tiers',
  [
    param('id').isUUID(),
    body('minQty').isInt({ min: 1 }).withMessage('minQty debe ser ≥ 1'),
    body('price').isNumeric().withMessage('Precio requerido'),
    validateRequest,
  ],
  variantsController.createTier.bind(variantsController)
);

router.post(
  '/variants/:id/resolve-price',
  [param('id').isUUID(), validateRequest],
  variantsController.resolvePrice.bind(variantsController)
);

// ── Tiers individuales ────────────────────────────────────────────────────────
// PUT    /api/price-tiers/:tierId
// DELETE /api/price-tiers/:tierId
router.put(
  '/price-tiers/:tierId',
  [param('tierId').isUUID(), validateRequest],
  variantsController.updateTier.bind(variantsController)
);

router.delete(
  '/price-tiers/:tierId',
  [param('tierId').isUUID(), validateRequest],
  variantsController.deleteTier.bind(variantsController)
);

// ── Import CSV ────────────────────────────────────────────────────────────────
// POST /api/variants/import
// GET  /api/variants/import/template
router.get('/variants/import/template', variantsController.importTemplate.bind(variantsController));
router.post(
  '/variants/import',
  [body('csv').notEmpty().withMessage('CSV requerido'), validateRequest],
  variantsController.importCsv.bind(variantsController)
);

export default router;
