import { Router, Response, NextFunction } from 'express';
import { body, param } from 'express-validator';
import { authenticate, authorize, AuthRequest } from '../../common/middleware';
import { validateRequest } from '../../utils/validators';
import pool from '../../config/database';

const router: ReturnType<typeof Router> = Router();

router.use(authenticate);

// =============================================
// REPARTIDOR endpoints
// =============================================

// GET /api/delivery/my-orders — Pedidos asignados al repartidor
router.get(
  '/my-orders',
  authorize('repartidor'),
  async (req: AuthRequest, res: Response) => {
    try {
      const driverId = req.user!.userId;
      const tenantId = req.user!.tenantId;

      const sql = `
        SELECT o.id, o.order_number as orderNumber, o.customer_name as customerName,
               o.customer_phone as customerPhone, o.department, o.municipality,
               o.address, o.neighborhood, o.delivery_latitude as deliveryLatitude,
               o.delivery_longitude as deliveryLongitude, o.delivery_status as deliveryStatus,
               o.total, o.status, o.notes, o.created_at as createdAt,
               t.name as storeName
        FROM storefront_orders o
        LEFT JOIN tenants t ON t.id = o.tenant_id
        WHERE o.delivery_driver_id = ?
          ${tenantId ? 'AND o.tenant_id = ?' : ''}
          AND o.status NOT IN ('cancelado')
          AND o.delivery_status != 'entregado'
        ORDER BY o.created_at DESC`;

      const params: any[] = tenantId ? [driverId, tenantId] : [driverId];

      const [orders] = await pool.query(sql, params) as any;

      for (const order of orders) {
        const [items] = await pool.query(
          `SELECT product_name as productName, quantity, unit_price as unitPrice
           FROM storefront_order_items WHERE order_id = ?`,
          [order.id]
        ) as any;
        order.items = items;
      }

      res.json({ success: true, data: orders });
    } catch (error) {
      console.error('Get driver orders error:', error);
      res.status(500).json({ success: false, error: 'Error al obtener pedidos' });
    }
  }
);

// GET /api/delivery/my-history — Pedidos entregados por el repartidor
router.get(
  '/my-history',
  authorize('repartidor'),
  async (req: AuthRequest, res: Response) => {
    try {
      const driverId = req.user!.userId;
      const tenantId = req.user!.tenantId;

      const sql = `
        SELECT o.id, o.order_number as orderNumber, o.customer_name as customerName,
               o.delivery_status as deliveryStatus, o.total,
               o.delivery_delivered_at as deliveredAt, o.created_at as createdAt,
               t.name as storeName
        FROM storefront_orders o
        LEFT JOIN tenants t ON t.id = o.tenant_id
        WHERE o.delivery_driver_id = ?
          ${tenantId ? 'AND o.tenant_id = ?' : ''}
          AND o.delivery_status = 'entregado'
        ORDER BY o.delivery_delivered_at DESC
        LIMIT 50`;

      const params: any[] = tenantId ? [driverId, tenantId] : [driverId];

      const [orders] = await pool.query(sql, params) as any;

      res.json({ success: true, data: orders });
    } catch (error) {
      console.error('Get driver history error:', error);
      res.status(500).json({ success: false, error: 'Error al obtener historial' });
    }
  }
);

// GET /api/delivery/available — Pedidos disponibles para tomar
router.get(
  '/available',
  authorize('repartidor'),
  async (req: AuthRequest, res: Response) => {
    try {
      const tenantId = req.user!.tenantId;

      const sql = `
        SELECT o.id, o.order_number as orderNumber, o.customer_name as customerName,
               o.customer_phone as customerPhone, o.department, o.municipality,
               o.address, o.neighborhood, o.delivery_latitude as deliveryLatitude,
               o.delivery_longitude as deliveryLongitude, o.total, o.notes,
               o.created_at as createdAt,
               t.name as storeName
        FROM storefront_orders o
        LEFT JOIN tenants t ON t.id = o.tenant_id
        WHERE ${tenantId ? 'o.tenant_id = ? AND' : ''}
              o.delivery_driver_id IS NULL
          AND o.delivery_status = 'sin_asignar'
          AND o.status IN ('pendiente', 'confirmado', 'preparando', 'enviado')
        ORDER BY o.created_at ASC`;

      const params: any[] = tenantId ? [tenantId] : [];

      const [orders] = await pool.query(sql, params) as any;

      for (const order of orders) {
        const [items] = await pool.query(
          `SELECT product_name as productName, quantity, unit_price as unitPrice
           FROM storefront_order_items WHERE order_id = ?`,
          [order.id]
        ) as any;
        order.items = items;
      }

      res.json({ success: true, data: orders });
    } catch (error) {
      console.error('Get available orders error:', error);
      res.status(500).json({ success: false, error: 'Error al obtener pedidos disponibles' });
    }
  }
);

// PUT /api/delivery/accept/:orderId — Repartidor toma un pedido
router.put(
  '/accept/:orderId',
  authorize('repartidor'),
  [param('orderId').notEmpty(), validateRequest],
  async (req: AuthRequest, res: Response) => {
    try {
      const driverId = req.user!.userId;
      const tenantId = req.user!.tenantId;
      const { orderId } = req.params;

      const checkSql = `
        SELECT id FROM storefront_orders
        WHERE id = ?
          ${tenantId ? 'AND tenant_id = ?' : ''}
          AND delivery_driver_id IS NULL
          AND delivery_status = 'sin_asignar'`;

      const checkParams: any[] = tenantId ? [orderId, tenantId] : [orderId];

      const [orderRows] = await pool.query(checkSql, checkParams) as any;

      if (orderRows.length === 0) {
        res.status(400).json({ success: false, error: 'El pedido ya fue tomado o no está disponible' });
        return;
      }

      await pool.query(
        `UPDATE storefront_orders
         SET delivery_driver_id = ?, delivery_status = 'asignado', delivery_assigned_at = NOW()
         WHERE id = ?`,
        [driverId, orderId]
      );

      res.json({ success: true, message: 'Pedido aceptado exitosamente' });
    } catch (error) {
      console.error('Accept order error:', error);
      res.status(500).json({ success: false, error: 'Error al aceptar pedido' });
    }
  }
);

// PUT /api/delivery/status/:orderId — Cambiar estado de entrega
router.put(
  '/status/:orderId',
  authorize('repartidor'),
  [
    param('orderId').notEmpty(),
    body('deliveryStatus').isIn(['recogido', 'en_camino', 'entregado']).withMessage('Estado de entrega inválido'),
    validateRequest,
  ],
  async (req: AuthRequest, res: Response) => {
    try {
      const driverId = req.user!.userId;
      const { orderId } = req.params;
      const { deliveryStatus } = req.body;

      const [orderRows] = await pool.query(
        `SELECT id, status FROM storefront_orders WHERE id = ? AND delivery_driver_id = ?`,
        [orderId, driverId]
      ) as any;

      if (orderRows.length === 0) {
        res.status(404).json({ success: false, error: 'Pedido no encontrado o no asignado a ti' });
        return;
      }

      const updates: string[] = ['delivery_status = ?'];
      const values: any[] = [deliveryStatus];

      if (deliveryStatus === 'recogido') {
        updates.push('delivery_picked_at = NOW()');
      } else if (deliveryStatus === 'entregado') {
        updates.push('delivery_delivered_at = NOW()');
        updates.push('status = \'entregado\'');
      }

      values.push(orderId);

      await pool.query(
        `UPDATE storefront_orders SET ${updates.join(', ')} WHERE id = ?`,
        values
      );

      res.json({ success: true, message: `Estado actualizado a: ${deliveryStatus}` });
    } catch (error) {
      console.error('Update delivery status error:', error);
      res.status(500).json({ success: false, error: 'Error al actualizar estado' });
    }
  }
);

// =============================================
// COMERCIANTE / SUPERADMIN endpoints
// =============================================

// GET /api/delivery/drivers — Listar repartidores del tenant
router.get(
  '/drivers',
  authorize('comerciante', 'superadmin'),
  async (req: AuthRequest, res: Response) => {
    try {
      const tenantId = req.user!.tenantId;

      const [drivers] = await pool.query(
        `SELECT id, name, email, phone, is_active as isActive
         FROM users
         WHERE ${tenantId ? 'tenant_id = ? AND' : 'tenant_id IS NULL AND'}
               role = 'repartidor'
         ORDER BY name`,
        tenantId ? [tenantId] : []
      ) as any;

      res.json({ success: true, data: drivers });
    } catch (error) {
      console.error('Get drivers error:', error);
      res.status(500).json({ success: false, error: 'Error al obtener repartidores' });
    }
  }
);

// PUT /api/delivery/assign/:orderId — Asignar repartidor a pedido
router.put(
  '/assign/:orderId',
  authorize('comerciante', 'superadmin'),
  [
    param('orderId').notEmpty(),
    body('driverId').notEmpty().withMessage('ID del repartidor es requerido'),
    validateRequest,
  ],
  async (req: AuthRequest, res: Response) => {
    try {
      const tenantId = req.user!.tenantId;
      const { orderId } = req.params;
      const { driverId } = req.body;

      // Verify driver exists (tenant or global)
      const [driverRows] = await pool.query(
        `SELECT id FROM users
         WHERE id = ? AND role = 'repartidor' AND is_active = TRUE
           AND (tenant_id = ? OR tenant_id IS NULL)`,
        [driverId, tenantId || '']
      ) as any;

      if (driverRows.length === 0) {
        res.status(404).json({ success: false, error: 'Repartidor no encontrado' });
        return;
      }

      const checkSql = `SELECT id FROM storefront_orders WHERE id = ? ${tenantId ? 'AND tenant_id = ?' : ''}`;
      const checkParams = tenantId ? [orderId, tenantId] : [orderId];
      const [orderRows] = await pool.query(checkSql, checkParams) as any;

      if (orderRows.length === 0) {
        res.status(404).json({ success: false, error: 'Pedido no encontrado' });
        return;
      }

      await pool.query(
        `UPDATE storefront_orders
         SET delivery_driver_id = ?, delivery_status = 'asignado', delivery_assigned_at = NOW()
         WHERE id = ?`,
        [driverId, orderId]
      );

      res.json({ success: true, message: 'Repartidor asignado exitosamente' });
    } catch (error) {
      console.error('Assign driver error:', error);
      res.status(500).json({ success: false, error: 'Error al asignar repartidor' });
    }
  }
);

export default router;
