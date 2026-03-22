import { Router } from 'express';
import { body } from 'express-validator';
import { authController } from './auth.controller';
import { authenticate } from '../../common/middleware';
import { validateRequest } from '../../utils/validators';

const router: ReturnType<typeof Router> = Router();

// POST /api/auth/login
router.post(
  '/login',
  [
    body('email').isEmail().withMessage('Email invalido'),
    body('password').notEmpty().withMessage('La contrasena es requerida'),
    validateRequest,
  ],
  authController.login.bind(authController)
);

// POST /api/auth/register
router.post(
  '/register',
  [
    body('email').isEmail().withMessage('Email invalido'),
    body('password')
      .isLength({ min: 6 })
      .withMessage('La contrasena debe tener al menos 6 caracteres'),
    body('name').notEmpty().withMessage('El nombre es requerido'),
    body('role')
      .optional()
      .isIn(['superadmin', 'comerciante', 'vendedor', 'repartidor'])
      .withMessage('Rol invalido'),
    validateRequest,
  ],
  authController.register.bind(authController)
);

// POST /api/auth/google (PUBLIC - Google OAuth login/register)
router.post(
  '/google',
  [
    body('credential').notEmpty().withMessage('Token de Google es requerido'),
    body('storeSlug').optional().notEmpty().withMessage('Identificador de tienda invalido'),
    validateRequest,
  ],
  authController.googleLogin.bind(authController)
);

// POST /api/auth/register-client (PUBLIC - no auth required)
router.post(
  '/register-client',
  [
    body('email').isEmail().withMessage('Email invalido'),
    body('password')
      .isLength({ min: 6 })
      .withMessage('La contrasena debe tener al menos 6 caracteres'),
    body('name').notEmpty().withMessage('El nombre es requerido'),
    body('phone').optional().notEmpty().withMessage('Telefono invalido'),
    body('storeSlug').optional().notEmpty().withMessage('Identificador de tienda invalido'),
    validateRequest,
  ],
  authController.registerClient.bind(authController)
);

// POST /api/auth/logout
router.post('/logout', authController.logout.bind(authController));

// GET /api/auth/profile
router.get(
  '/profile',
  authenticate,
  authController.getProfile.bind(authController)
);

// PUT /api/auth/profile
router.put(
  '/profile',
  authenticate,
  [
    body('name').optional().notEmpty().withMessage('El nombre no puede estar vacio'),
    body('avatar').optional().isURL().withMessage('URL de avatar invalida'),
    validateRequest,
  ],
  authController.updateProfile.bind(authController)
);

// PUT /api/auth/change-password
router.put(
  '/change-password',
  authenticate,
  [
    body('currentPassword').notEmpty().withMessage('La contrasena actual es requerida'),
    body('newPassword')
      .isLength({ min: 6 })
      .withMessage('La nueva contrasena debe tener al menos 6 caracteres'),
    validateRequest,
  ],
  authController.changePassword.bind(authController)
);

export default router;
