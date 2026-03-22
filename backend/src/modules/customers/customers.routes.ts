import { Router } from 'express';
import { body, param, query } from 'express-validator';
import { customersController } from './customers.controller';
import { authenticate } from '../../common/middleware';
import { validateRequest } from '../../utils/validators';

const router: ReturnType<typeof Router> = Router();

// Todas las rutas requieren autenticacion
router.use(authenticate);

// GET /api/customers - Listar clientes
router.get('/', customersController.findAll.bind(customersController));

// GET /api/customers/search?q=query - Buscar clientes (para POS)
router.get(
  '/search',
  [
    query('q').optional().isString().withMessage('Query debe ser texto'),
    validateRequest,
  ],
  customersController.search.bind(customersController)
);

// GET /api/customers/:id - Obtener cliente por ID
router.get(
  '/:id',
  [param('id').notEmpty().withMessage('ID requerido'), validateRequest],
  customersController.findById.bind(customersController)
);

// GET /api/customers/:id/balance - Obtener saldo del cliente
router.get(
  '/:id/balance',
  [param('id').notEmpty().withMessage('ID requerido'), validateRequest],
  customersController.getBalance.bind(customersController)
);

// POST /api/customers - Crear cliente
router.post(
  '/',
  [
    body('cedula')
      .notEmpty().withMessage('La cédula es requerida')
      .isString().withMessage('Cédula inválida')
      .isLength({ min: 5, max: 20 }).withMessage('La cédula debe tener entre 5 y 20 caracteres'),
    body('name').notEmpty().withMessage('El nombre es requerido'),
    body('phone').optional().isString().withMessage('Teléfono inválido'),
    body('email').optional().isEmail().withMessage('Email inválido'),
    body('address').optional().isString().withMessage('Dirección inválida'),
    body('creditLimit')
      .optional()
      .isFloat({ min: 0 }).withMessage('El límite de crédito debe ser un valor positivo'),
    body('notes').optional().isString().withMessage('Notas inválidas'),
    validateRequest,
  ],
  customersController.create.bind(customersController)
);

// PUT /api/customers/:id - Actualizar cliente
router.put(
  '/:id',
  [
    param('id').notEmpty().withMessage('ID requerido'),
    body('cedula')
      .optional()
      .isString().withMessage('Cédula inválida')
      .isLength({ min: 5, max: 20 }).withMessage('La cédula debe tener entre 5 y 20 caracteres'),
    body('name').optional().notEmpty().withMessage('El nombre no puede estar vacío'),
    body('phone').optional().isString().withMessage('Teléfono inválido'),
    body('email').optional().isEmail().withMessage('Email inválido'),
    body('address').optional().isString().withMessage('Dirección inválida'),
    body('creditLimit')
      .optional()
      .isFloat({ min: 0 }).withMessage('El límite de crédito debe ser un valor positivo'),
    body('notes').optional().isString().withMessage('Notas inválidas'),
    validateRequest,
  ],
  customersController.update.bind(customersController)
);

// DELETE /api/customers/:id - Eliminar cliente
router.delete(
  '/:id',
  [param('id').notEmpty().withMessage('ID requerido'), validateRequest],
  customersController.delete.bind(customersController)
);

export default router;
