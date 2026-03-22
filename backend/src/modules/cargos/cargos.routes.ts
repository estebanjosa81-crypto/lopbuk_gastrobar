import { Router } from 'express';
import { body, param } from 'express-validator';
import { cargosController } from './cargos.controller';
import { authenticate, authorize } from '../../common/middleware';
import { validateRequest } from '../../utils/validators';
import { ALL_PERMISSIONS } from '../../utils/permissions';

const router: ReturnType<typeof Router> = Router();

router.use(authenticate);
router.use(authorize('comerciante', 'superadmin'));

// GET /api/cargos — lista todos los cargos del tenant con sus permisos
router.get('/', cargosController.findAll.bind(cargosController));

// POST /api/cargos — crear cargo con permisos opcionales
router.post(
  '/',
  [
    body('name').notEmpty().withMessage('El nombre del cargo es requerido'),
    body('description').optional().isString(),
    body('permissions')
      .optional()
      .isArray()
      .withMessage('permissions debe ser un arreglo')
      .custom((perms: string[]) => {
        const invalid = perms.filter(p => !ALL_PERMISSIONS.includes(p as any));
        if (invalid.length > 0) throw new Error(`Permisos inválidos: ${invalid.join(', ')}`);
        return true;
      }),
    validateRequest,
  ],
  cargosController.create.bind(cargosController)
);

// PUT /api/cargos/:id — actualizar nombre, descripción o permisos
router.put(
  '/:id',
  [
    param('id').notEmpty().withMessage('ID requerido'),
    body('name').optional().notEmpty().withMessage('El nombre no puede estar vacío'),
    body('description').optional().isString(),
    body('permissions')
      .optional()
      .isArray()
      .withMessage('permissions debe ser un arreglo')
      .custom((perms: string[]) => {
        const invalid = perms.filter(p => !ALL_PERMISSIONS.includes(p as any));
        if (invalid.length > 0) throw new Error(`Permisos inválidos: ${invalid.join(', ')}`);
        return true;
      }),
    validateRequest,
  ],
  cargosController.update.bind(cargosController)
);

// DELETE /api/cargos/:id
router.delete(
  '/:id',
  [param('id').notEmpty().withMessage('ID requerido'), validateRequest],
  cargosController.delete.bind(cargosController)
);

export default router;
