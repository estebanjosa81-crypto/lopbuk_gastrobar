import { v4 as uuidv4 } from 'uuid';
import { db } from '../../config';
import { AppError } from '../../common/middleware';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

interface WorkOrderRow extends RowDataPacket {
  id: string; tenant_id: string; order_number: string;
  customer_id: string | null; customer_name: string; customer_phone: string | null;
  item_description: string; item_type: string; job_type: string;
  fabric_description: string | null;
  quoted_price: number; advance_paid: number;
  received_at: Date; promised_at: string | null; delivered_at: Date | null;
  status: string; notes: string | null;
  assigned_to: string | null; sale_id: string | null;
  photos_in: string | null; photos_out: string | null;
  created_by: string | null; created_at: Date; updated_at: Date;
  assigned_name?: string; total_paid?: number; materials_cost?: number;
}

class WorkOrderService {

  private async _nextOrderNumber(tenantId: string): Promise<string> {
    // Ensure sequence row exists
    await db.execute(
      'INSERT IGNORE INTO work_order_sequence (tenant_id, prefix, current_number) VALUES (?, "OT", 0)',
      [tenantId]
    );
    await db.execute(
      'UPDATE work_order_sequence SET current_number = current_number + 1 WHERE tenant_id = ?',
      [tenantId]
    );
    const [[seq]] = await db.execute<RowDataPacket[]>(
      'SELECT current_number, prefix FROM work_order_sequence WHERE tenant_id = ?',
      [tenantId]
    ) as any;
    return `${seq.prefix}-${String(seq.current_number).padStart(4, '0')}`;
  }

  // ── WORK ORDERS ───────────────────────────────────────────────────────────

  async getWorkOrders(tenantId: string, filters: {
    status?: string; search?: string;
    dateFrom?: string; dateTo?: string; assigned_to?: string;
  } = {}) {
    let sql = `
      SELECT wo.*,
             u.name AS assigned_name,
             COALESCE(p_agg.total_paid, 0)     AS total_paid,
             COALESCE(m_agg.materials_cost, 0)  AS materials_cost
      FROM work_orders wo
      LEFT JOIN users u ON u.id = wo.assigned_to
      LEFT JOIN (
        SELECT work_order_id, SUM(amount) AS total_paid
        FROM work_order_payments WHERE tenant_id = ?
        GROUP BY work_order_id
      ) p_agg ON p_agg.work_order_id = wo.id
      LEFT JOIN (
        SELECT work_order_id, SUM(total_cost) AS materials_cost
        FROM work_order_materials WHERE tenant_id = ?
        GROUP BY work_order_id
      ) m_agg ON m_agg.work_order_id = wo.id
      WHERE wo.tenant_id = ?`;
    const params: any[] = [tenantId, tenantId, tenantId];

    if (filters.status)      { sql += ' AND wo.status = ?';                  params.push(filters.status); }
    if (filters.assigned_to) { sql += ' AND wo.assigned_to = ?';             params.push(filters.assigned_to); }
    if (filters.dateFrom)    { sql += ' AND DATE(wo.received_at) >= ?';       params.push(filters.dateFrom); }
    if (filters.dateTo)      { sql += ' AND DATE(wo.received_at) <= ?';       params.push(filters.dateTo); }
    if (filters.search) {
      sql += ' AND (wo.order_number LIKE ? OR wo.customer_name LIKE ? OR wo.customer_phone LIKE ? OR wo.item_description LIKE ?)';
      const s = `%${filters.search}%`;
      params.push(s, s, s, s);
    }
    // Sort: active orders first, then by urgency (vencidas al tope), then by promised date
    sql += ` ORDER BY
      (wo.status IN ('entregado','cancelado')) ASC,
      (wo.promised_at < CURDATE() AND wo.status NOT IN ('entregado','cancelado')) DESC,
      wo.promised_at ASC,
      wo.received_at DESC`;

    const [rows] = await db.execute<WorkOrderRow[]>(sql, params);
    return rows;
  }

  async getWorkOrderById(tenantId: string, id: string) {
    const [[wo]] = await db.execute<WorkOrderRow[]>(
      `SELECT wo.*, u.name AS assigned_name
       FROM work_orders wo
       LEFT JOIN users u ON u.id = wo.assigned_to
       WHERE wo.id = ? AND wo.tenant_id = ?`,
      [id, tenantId]
    );
    if (!wo) throw new AppError('Orden de trabajo no encontrada', 404);

    const [materials] = await db.execute<RowDataPacket[]>(
      'SELECT * FROM work_order_materials WHERE work_order_id = ? ORDER BY id',
      [id]
    );
    const [payments] = await db.execute<RowDataPacket[]>(
      `SELECT p.*, u.name AS received_by_name
       FROM work_order_payments p
       LEFT JOIN users u ON u.id = p.received_by
       WHERE p.work_order_id = ? ORDER BY p.id`,
      [id]
    );

    const total_paid = (payments as any[]).reduce((s, p) => s + Number(p.amount), 0);
    const materials_cost = (materials as any[]).reduce((s, m) => s + Number(m.total_cost), 0);

    return {
      ...wo,
      photos_in:  wo.photos_in  ? JSON.parse(wo.photos_in)  : [],
      photos_out: wo.photos_out ? JSON.parse(wo.photos_out) : [],
      materials,
      payments,
      total_paid,
      materials_cost,
    };
  }

  async createWorkOrder(tenantId: string, userId: string, data: {
    customer_name: string; customer_phone?: string; customer_id?: string;
    item_description: string; item_type?: string; job_type?: string;
    fabric_description?: string; quoted_price?: number; advance_paid?: number;
    promised_at?: string; assigned_to?: string; notes?: string;
  }) {
    if (!data.customer_name) throw new AppError('Nombre del cliente requerido', 400);
    if (!data.item_description) throw new AppError('Descripción del artículo requerida', 400);

    const id = uuidv4();
    const order_number = await this._nextOrderNumber(tenantId);

    await db.execute(
      `INSERT INTO work_orders
        (id, tenant_id, order_number, customer_id, customer_name, customer_phone,
         item_description, item_type, job_type, fabric_description,
         quoted_price, advance_paid, promised_at, assigned_to, notes, created_by)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [id, tenantId, order_number,
       data.customer_id ?? null, data.customer_name, data.customer_phone ?? null,
       data.item_description,
       data.item_type ?? 'vehiculo',
       data.job_type ?? 'tapizado_completo',
       data.fabric_description ?? null,
       data.quoted_price ?? 0, data.advance_paid ?? 0,
       data.promised_at ?? null,
       data.assigned_to ?? null,
       data.notes ?? null, userId]
    );
    return this.getWorkOrderById(tenantId, id);
  }

  async updateWorkOrder(tenantId: string, id: string, data: Partial<{
    customer_name: string; customer_phone: string; customer_id: string;
    item_description: string; item_type: string; job_type: string;
    fabric_description: string; quoted_price: number; advance_paid: number;
    promised_at: string; assigned_to: string; notes: string;
    photos_in: string[]; photos_out: string[];
  }>) {
    const [[existing]] = await db.execute<RowDataPacket[]>(
      'SELECT id FROM work_orders WHERE id = ? AND tenant_id = ?', [id, tenantId]
    );
    if (!existing) throw new AppError('Orden no encontrada', 404);

    const fields: string[] = [];
    const values: any[] = [];
    const cols = [
      'customer_name', 'customer_phone', 'customer_id',
      'item_description', 'item_type', 'job_type', 'fabric_description',
      'quoted_price', 'advance_paid', 'promised_at', 'assigned_to', 'notes',
    ];
    for (const col of cols) {
      if ((data as any)[col] !== undefined) {
        fields.push(`${col} = ?`);
        values.push((data as any)[col] ?? null);
      }
    }
    if (data.photos_in  !== undefined) { fields.push('photos_in = ?');  values.push(JSON.stringify(data.photos_in)); }
    if (data.photos_out !== undefined) { fields.push('photos_out = ?'); values.push(JSON.stringify(data.photos_out)); }

    if (fields.length) {
      await db.execute(
        `UPDATE work_orders SET ${fields.join(', ')} WHERE id = ? AND tenant_id = ?`,
        [...values, id, tenantId]
      );
    }
    return this.getWorkOrderById(tenantId, id);
  }

  async updateStatus(tenantId: string, id: string, status: string) {
    const valid = ['recibido','cotizado','aprobado','en_proceso','listo','entregado','cancelado'];
    if (!valid.includes(status)) throw new AppError('Estado inválido', 400);

    const extra = status === 'entregado' ? ', delivered_at = NOW()' : '';
    const [result] = await db.execute<ResultSetHeader>(
      `UPDATE work_orders SET status = ?${extra} WHERE id = ? AND tenant_id = ?`,
      [status, id, tenantId]
    );
    if (result.affectedRows === 0) throw new AppError('Orden no encontrada', 404);
  }

  async deleteWorkOrder(tenantId: string, id: string) {
    const [result] = await db.execute<ResultSetHeader>(
      'DELETE FROM work_orders WHERE id = ? AND tenant_id = ?', [id, tenantId]
    );
    if (result.affectedRows === 0) throw new AppError('Orden no encontrada', 404);
  }

  // ── MATERIALS ─────────────────────────────────────────────────────────────

  async addMaterial(tenantId: string, workOrderId: string, data: {
    product_id?: string; product_name: string;
    quantity: number; unit?: string; unit_cost: number; notes?: string;
  }) {
    const [[wo]] = await db.execute<RowDataPacket[]>(
      'SELECT id FROM work_orders WHERE id = ? AND tenant_id = ?', [workOrderId, tenantId]
    );
    if (!wo) throw new AppError('Orden no encontrada', 404);

    const total_cost = Number(data.quantity) * Number(data.unit_cost);
    const [result] = await db.execute<ResultSetHeader>(
      `INSERT INTO work_order_materials
        (tenant_id, work_order_id, product_id, product_name, quantity, unit, unit_cost, total_cost, notes)
       VALUES (?,?,?,?,?,?,?,?,?)`,
      [tenantId, workOrderId, data.product_id ?? null, data.product_name,
       data.quantity, data.unit ?? 'unidad', data.unit_cost, total_cost, data.notes ?? null]
    );
    return { id: result.insertId, total_cost };
  }

  async removeMaterial(tenantId: string, materialId: number) {
    await db.execute(
      `DELETE m FROM work_order_materials m
       JOIN work_orders wo ON wo.id = m.work_order_id
       WHERE m.id = ? AND wo.tenant_id = ?`,
      [materialId, tenantId]
    );
  }

  // ── PAYMENTS ──────────────────────────────────────────────────────────────

  async addPayment(tenantId: string, workOrderId: string, userId: string, data: {
    amount: number; payment_method?: string; notes?: string;
  }) {
    if (!data.amount || data.amount <= 0) throw new AppError('Monto inválido', 400);

    const [[wo]] = await db.execute<RowDataPacket[]>(
      'SELECT id FROM work_orders WHERE id = ? AND tenant_id = ?', [workOrderId, tenantId]
    );
    if (!wo) throw new AppError('Orden no encontrada', 404);

    const [result] = await db.execute<ResultSetHeader>(
      `INSERT INTO work_order_payments
        (tenant_id, work_order_id, amount, payment_method, notes, received_by)
       VALUES (?,?,?,?,?,?)`,
      [tenantId, workOrderId, data.amount,
       data.payment_method ?? 'efectivo', data.notes ?? null, userId]
    );
    return { id: result.insertId };
  }

  // ── DASHBOARD STATS ───────────────────────────────────────────────────────

  async getDashboardStats(tenantId: string) {
    const [[counts]] = await db.execute<RowDataPacket[]>(
      `SELECT
        COUNT(*) AS total,
        SUM(status = 'recibido')                                                       AS recibidas,
        SUM(status IN ('cotizado','aprobado','en_proceso'))                             AS en_proceso,
        SUM(status = 'listo')                                                          AS listas,
        SUM(status = 'entregado')                                                      AS entregadas,
        SUM(status = 'cancelado')                                                      AS canceladas,
        SUM(promised_at < CURDATE() AND status NOT IN ('entregado','cancelado'))        AS vencidas
       FROM work_orders WHERE tenant_id = ?`,
      [tenantId]
    ) as any;

    const [[revenue]] = await db.execute<RowDataPacket[]>(
      `SELECT
        COALESCE(SUM(CASE WHEN DATE(created_at) = CURDATE()                             THEN amount END), 0) AS hoy,
        COALESCE(SUM(CASE WHEN created_at >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)        THEN amount END), 0) AS semana,
        COALESCE(SUM(CASE WHEN MONTH(created_at) = MONTH(CURDATE())
                           AND YEAR(created_at)  = YEAR(CURDATE())                     THEN amount END), 0) AS mes
       FROM work_order_payments WHERE tenant_id = ?`,
      [tenantId]
    ) as any;

    const [due_today] = await db.execute<WorkOrderRow[]>(
      `SELECT id, order_number, customer_name, customer_phone, item_description,
              quoted_price, advance_paid, promised_at, status
       FROM work_orders
       WHERE tenant_id = ? AND promised_at = CURDATE()
         AND status NOT IN ('entregado','cancelado')
       ORDER BY customer_name`,
      [tenantId]
    );

    const [overdue] = await db.execute<WorkOrderRow[]>(
      `SELECT id, order_number, customer_name, item_description, promised_at, status
       FROM work_orders
       WHERE tenant_id = ? AND promised_at < CURDATE()
         AND status NOT IN ('entregado','cancelado')
       ORDER BY promised_at ASC LIMIT 10`,
      [tenantId]
    );

    return { counts, revenue, due_today, overdue };
  }
}

export const workOrderService = new WorkOrderService();
