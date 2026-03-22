import { Router, Request, Response, NextFunction } from 'express';
import { body, param } from 'express-validator';
import { validateRequest } from '../../utils/validators';
import pool from '../../config/database';
import { authenticate } from '../../common/middleware';
import { v4 as uuidv4 } from 'uuid';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

const router: ReturnType<typeof Router> = Router();

router.use(authenticate);

// GET /api/sedes — listar todas las sedes del tenant
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const tenantId = (req as any).user!.tenantId!;
    const [rows] = await pool.query<RowDataPacket[]>(
      'SELECT id, name, address, created_at FROM sedes WHERE tenant_id = ? ORDER BY created_at ASC',
      [tenantId]
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    next(err);
  }
});

// POST /api/sedes — crear sede
router.post(
  '/',
  [
    body('name').notEmpty().withMessage('El nombre es requerido'),
    body('address').optional().isString(),
    validateRequest,
  ],
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const tenantId = (req as any).user!.tenantId!;
      const { name, address } = req.body;
      const id = uuidv4();
      await pool.query<ResultSetHeader>(
        'INSERT INTO sedes (id, tenant_id, name, address) VALUES (?, ?, ?, ?)',
        [id, tenantId, name, address || null]
      );
      res.status(201).json({ success: true, data: { id, name, address: address || null } });
    } catch (err) {
      next(err);
    }
  }
);

// PUT /api/sedes/:id — actualizar sede
router.put(
  '/:id',
  [
    param('id').notEmpty(),
    body('name').optional().notEmpty().withMessage('El nombre no puede estar vacio'),
    body('address').optional().isString(),
    validateRequest,
  ],
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const tenantId = (req as any).user!.tenantId!;
      const { id } = req.params;
      const { name, address } = req.body;
      const sets: string[] = [];
      const values: any[] = [];
      if (name !== undefined) { sets.push('name = ?'); values.push(name); }
      if (address !== undefined) { sets.push('address = ?'); values.push(address || null); }
      if (sets.length === 0) return res.status(400).json({ success: false, message: 'Nada que actualizar' });
      values.push(id, tenantId);
      await pool.query<ResultSetHeader>(
        `UPDATE sedes SET ${sets.join(', ')} WHERE id = ? AND tenant_id = ?`,
        values
      );
      res.json({ success: true, message: 'Sede actualizada' });
    } catch (err) {
      next(err);
    }
  }
);

// DELETE /api/sedes/:id — eliminar sede
router.delete(
  '/:id',
  [param('id').notEmpty(), validateRequest],
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const tenantId = (req as any).user!.tenantId!;
      const { id } = req.params;
      // Desvincular productos de esta sede antes de eliminar
      await pool.query('UPDATE products SET sede_id = NULL WHERE sede_id = ? AND tenant_id = ?', [id, tenantId]);
      await pool.query<ResultSetHeader>(
        'DELETE FROM sedes WHERE id = ? AND tenant_id = ?',
        [id, tenantId]
      );
      res.json({ success: true, message: 'Sede eliminada' });
    } catch (err) {
      next(err);
    }
  }
);

export default router;
