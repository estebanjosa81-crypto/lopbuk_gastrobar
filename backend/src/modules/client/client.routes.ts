import { Router, Response } from 'express';
import { authenticate, authorize, AuthRequest } from '../../common/middleware';
import pool from '../../config/database';

const router: ReturnType<typeof Router> = Router();

router.use(authenticate);
router.use(authorize('cliente'));

// GET /api/client/orders — Mis pedidos (de todas las tiendas donde haya comprado)
router.get('/orders', async (req: AuthRequest, res: Response) => {
  try {
    const clientUserId = req.user!.userId;

    const [orders] = await pool.query(
      `SELECT o.id, o.order_number as orderNumber, o.customer_name as customerName,
              o.total, o.status, o.delivery_status as deliveryStatus,
              o.created_at as createdAt,
              u.name as driverName,
              t.name as storeName, t.slug as storeSlug
       FROM storefront_orders o
       LEFT JOIN users u ON u.id = o.delivery_driver_id
       LEFT JOIN tenants t ON t.id = o.tenant_id
       WHERE o.client_user_id = ?
       ORDER BY o.created_at DESC`,
      [clientUserId]
    ) as any;

    // Get items for each order
    for (const order of orders) {
      const [items] = await pool.query(
        `SELECT product_name as productName, product_image as productImage,
                quantity, unit_price as unitPrice, total_price as totalPrice, size, color
         FROM storefront_order_items WHERE order_id = ?`,
        [order.id]
      ) as any;
      order.items = items;
    }

    res.json({ success: true, data: orders });
  } catch (error) {
    console.error('Get client orders error:', error);
    res.status(500).json({ success: false, error: 'Error al obtener pedidos' });
  }
});

// GET /api/client/orders/:id — Detalle de mi pedido
router.get('/orders/:id', async (req: AuthRequest, res: Response) => {
  try {
    const clientUserId = req.user!.userId;
    const orderId = req.params.id;

    const [orders] = await pool.query(
      `SELECT o.id, o.order_number as orderNumber, o.customer_name as customerName,
              o.customer_phone as customerPhone, o.customer_email as customerEmail,
              o.department, o.municipality, o.address, o.neighborhood,
              o.delivery_latitude as deliveryLatitude, o.delivery_longitude as deliveryLongitude,
              o.subtotal, o.shipping_cost as shippingCost, o.discount, o.total,
              o.status, o.delivery_status as deliveryStatus, o.payment_method as paymentMethod,
              o.delivery_assigned_at as deliveryAssignedAt,
              o.delivery_picked_at as deliveryPickedAt,
              o.delivery_delivered_at as deliveryDeliveredAt,
              o.created_at as createdAt,
              u.name as driverName, u.phone as driverPhone
       FROM storefront_orders o
       LEFT JOIN users u ON u.id = o.delivery_driver_id
       WHERE o.id = ? AND o.client_user_id = ?`,
      [orderId, clientUserId]
    ) as any;

    if (orders.length === 0) {
      res.status(404).json({ success: false, error: 'Pedido no encontrado' });
      return;
    }

    const [items] = await pool.query(
      `SELECT product_name as productName, product_image as productImage,
              quantity, unit_price as unitPrice, total_price as totalPrice, size, color
       FROM storefront_order_items WHERE order_id = ?`,
      [orderId]
    ) as any;

    res.json({ success: true, data: { ...orders[0], items } });
  } catch (error) {
    console.error('Get client order detail error:', error);
    res.status(500).json({ success: false, error: 'Error al obtener pedido' });
  }
});

export default router;
