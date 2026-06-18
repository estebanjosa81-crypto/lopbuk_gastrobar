import { v4 as uuidv4 } from 'uuid';
import { db } from '../../config';
import { AppError } from '../../common/middleware';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

export interface WasteRecord {
  id: string;
  tenant_id: string;
  product_id: string | null;
  product_name: string;
  quantity: number;
  unit: string;
  waste_type: 'natural' | 'operativa' | 'administrativa' | 'vencimiento';
  reason: 'quemado' | 'vencido' | 'mal_corte' | 'devolucion' | 'consumo_interno' | 'robo' | 'cortesia' | 'sobreporcion' | 'dano' | 'otro';
  cost_value: number;
  area: 'cocina' | 'bar' | 'general';
  responsible_id: string | null;
  responsible_name: string | null;
  notes: string | null;
  photo_url: string | null;
  recorded_by: string;
  recorded_by_name: string;
  created_at: Date;
}

interface WasteRow extends RowDataPacket, WasteRecord {}
interface CountRow extends RowDataPacket { total: number }
interface SumRow extends RowDataPacket { total_cost: number; total_qty: number }

export const mermaService = {

  async create(tenantId: string, userId: string, userName: string, data: Partial<WasteRecord>): Promise<WasteRecord> {
    const id = uuidv4();

    // Auto-resolve cost_value from product purchase_price if not provided
    let costValue = data.cost_value ?? 0;
    if (!costValue && data.product_id) {
      const [priceRows] = await db.query<RowDataPacket[]>(
        'SELECT purchase_price FROM products WHERE id = ? AND tenant_id = ? LIMIT 1',
        [data.product_id, tenantId]
      );
      if (priceRows[0]) costValue = Number(priceRows[0].purchase_price) * Number(data.quantity ?? 1);
    }

    await db.query<ResultSetHeader>(
      `INSERT INTO waste_records
         (id, tenant_id, product_id, product_name, quantity, unit, waste_type, reason,
          cost_value, area, responsible_id, responsible_name, notes, photo_url,
          recorded_by, recorded_by_name)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id, tenantId,
        data.product_id ?? null,
        data.product_name,
        data.quantity,
        data.unit ?? 'unidad',
        data.waste_type ?? 'operativa',
        data.reason ?? 'otro',
        costValue,
        data.area ?? 'cocina',
        data.responsible_id ?? null,
        data.responsible_name ?? null,
        data.notes ?? null,
        data.photo_url ?? null,
        userId,
        userName,
      ]
    );

    // Optionally reduce stock if product_id provided
    if (data.product_id) {
      // Read stock BEFORE updating so previous_stock is accurate
      const [stockRows] = await db.query<RowDataPacket[]>(
        'SELECT stock FROM products WHERE id = ? AND tenant_id = ? LIMIT 1',
        [data.product_id, tenantId]
      );
      const prevStock = Number(stockRows[0]?.stock ?? 0);
      const newStock  = Math.max(0, prevStock - data.quantity!);

      await db.query(
        `UPDATE products SET stock = ? WHERE id = ? AND tenant_id = ?`,
        [newStock, data.product_id, tenantId]
      );

      await db.query(
        `INSERT INTO stock_movements (id, tenant_id, product_id, type, quantity, previous_stock, new_stock, reason, user_id)
         VALUES (?, ?, ?, 'ajuste', ?, ?, ?, ?, ?)`,
        [uuidv4(), tenantId, data.product_id, -data.quantity!, prevStock, newStock, `Merma: ${data.reason}`, userId]
      );
    }

    const [created] = await db.query<WasteRow[]>(
      'SELECT * FROM waste_records WHERE id = ?',
      [id]
    );
    return created[0];
  },

  async list(tenantId: string, filters: {
    dateFrom?: string;
    dateTo?: string;
    area?: string;
    wasteType?: string;
    page?: number;
    limit?: number;
  }) {
    const page   = Math.max(1, filters.page ?? 1);
    const limit  = Math.min(100, filters.limit ?? 30);
    const offset = (page - 1) * limit;

    const conditions: string[] = ['tenant_id = ?'];
    const params: unknown[]    = [tenantId];

    if (filters.dateFrom) { conditions.push('DATE(created_at) >= ?'); params.push(filters.dateFrom); }
    if (filters.dateTo)   { conditions.push('DATE(created_at) <= ?'); params.push(filters.dateTo); }
    if (filters.area)     { conditions.push('area = ?'); params.push(filters.area); }
    if (filters.wasteType){ conditions.push('waste_type = ?'); params.push(filters.wasteType); }

    const where = conditions.join(' AND ');

    const [countRows] = await db.query<CountRow[]>(
      `SELECT COUNT(*) as total FROM waste_records WHERE ${where}`, params
    );
    const total = countRows[0].total;

    const [rows] = await db.query<WasteRow[]>(
      `SELECT * FROM waste_records WHERE ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    return { data: rows, pagination: { total, page, limit, pages: Math.ceil(total / limit) } };
  },

  async getById(tenantId: string, id: string): Promise<WasteRecord> {
    const [rows] = await db.query<WasteRow[]>(
      'SELECT * FROM waste_records WHERE id = ? AND tenant_id = ?',
      [id, tenantId]
    );
    if (!rows[0]) throw new AppError('Registro no encontrado', 404);
    return rows[0];
  },

  async delete(tenantId: string, id: string): Promise<void> {
    const [result] = await db.query<ResultSetHeader>(
      'DELETE FROM waste_records WHERE id = ? AND tenant_id = ?',
      [id, tenantId]
    );
    if (result.affectedRows === 0) throw new AppError('Registro no encontrado', 404);
  },

  async getDashboard(tenantId: string, dateFrom: string, dateTo: string) {
    const [totals] = await db.query<SumRow[]>(
      `SELECT COALESCE(SUM(cost_value),0) as total_cost, COALESCE(SUM(quantity),0) as total_qty
       FROM waste_records WHERE tenant_id = ? AND DATE(created_at) BETWEEN ? AND ?`,
      [tenantId, dateFrom, dateTo]
    );

    const [byArea] = await db.query<RowDataPacket[]>(
      `SELECT area, COALESCE(SUM(cost_value),0) as cost, COUNT(*) as records
       FROM waste_records WHERE tenant_id = ? AND DATE(created_at) BETWEEN ? AND ?
       GROUP BY area ORDER BY cost DESC`,
      [tenantId, dateFrom, dateTo]
    );

    const [byType] = await db.query<RowDataPacket[]>(
      `SELECT waste_type, COALESCE(SUM(cost_value),0) as cost, COUNT(*) as records
       FROM waste_records WHERE tenant_id = ? AND DATE(created_at) BETWEEN ? AND ?
       GROUP BY waste_type ORDER BY cost DESC`,
      [tenantId, dateFrom, dateTo]
    );

    const [topProducts] = await db.query<RowDataPacket[]>(
      `SELECT product_name, COALESCE(SUM(cost_value),0) as cost, SUM(quantity) as qty, COUNT(*) as records
       FROM waste_records WHERE tenant_id = ? AND DATE(created_at) BETWEEN ? AND ?
       GROUP BY product_name ORDER BY cost DESC LIMIT 5`,
      [tenantId, dateFrom, dateTo]
    );

    const [byReason] = await db.query<RowDataPacket[]>(
      `SELECT reason, COALESCE(SUM(cost_value),0) as cost, COUNT(*) as records
       FROM waste_records WHERE tenant_id = ? AND DATE(created_at) BETWEEN ? AND ?
       GROUP BY reason ORDER BY cost DESC`,
      [tenantId, dateFrom, dateTo]
    );

    // DATE() returns a JS Date object from mysql2 — serialize as string to avoid key bugs
    const [rawTrend] = await db.query<RowDataPacket[]>(
      `SELECT DATE_FORMAT(created_at, '%Y-%m-%d') as day,
              COALESCE(SUM(cost_value),0) as cost,
              COUNT(*) as records
       FROM waste_records WHERE tenant_id = ? AND DATE(created_at) BETWEEN ? AND ?
       GROUP BY day ORDER BY day ASC`,
      [tenantId, dateFrom, dateTo]
    );

    // Normalize daily trend days to plain strings
    const dailyTrend = (rawTrend as any[]).map(r => ({
      ...r,
      day: String(r.day).substring(0, 10),
      cost: Number(r.cost),
      records: Number(r.records),
    }));

    // Total purchases in period — correct column names: total, purchase_date, payment_status
    let totalPurchases = 0;
    try {
      const [purchaseRows] = await db.query<RowDataPacket[]>(
        `SELECT COALESCE(SUM(total),0) as total
         FROM purchase_invoices
         WHERE tenant_id = ? AND DATE(purchase_date) BETWEEN ? AND ? AND payment_status != 'cancelada'`,
        [tenantId, dateFrom, dateTo]
      );
      totalPurchases = Number(purchaseRows[0]?.total ?? 0);
    } catch {
      // Table may not exist in all tenant setups
    }

    const totalWasteCost = Number(totals[0].total_cost);
    const wastePercent = totalPurchases > 0 ? (totalWasteCost / totalPurchases) * 100 : 0;

    return {
      summary: {
        totalCost: totalWasteCost,
        totalQty: Number(totals[0].total_qty),
        wastePercent: Math.round(wastePercent * 10) / 10,
        purchasesTotal: totalPurchases,
      },
      byArea,
      byType,
      byReason,
      topProducts,
      dailyTrend,
    };
  },

  // ── PAR levels ────────────────────────────────────────────────────────────
  async listParLevels(tenantId: string) {
    const [rows] = await db.query<RowDataPacket[]>(
      `SELECT pl.*, p.name as product_name, p.stock as current_stock, p.purchase_price,
              (pl.daily_usage * pl.days_between_orders + pl.safety_stock) as par_level,
              p.stock - (pl.daily_usage * pl.days_between_orders + pl.safety_stock) as stock_gap
       FROM par_levels pl
       LEFT JOIN products p ON p.id = pl.product_id AND p.tenant_id = pl.tenant_id
       WHERE pl.tenant_id = ?
       ORDER BY stock_gap ASC`,
      [tenantId]
    );
    return rows;
  },

  async upsertParLevel(tenantId: string, data: {
    product_id: string;
    daily_usage: number;
    days_between_orders: number;
    safety_stock: number;
    area: string;
    notes?: string;
  }) {
    const existing = await db.query<RowDataPacket[]>(
      'SELECT id FROM par_levels WHERE tenant_id = ? AND product_id = ?',
      [tenantId, data.product_id]
    ).then(([r]) => r[0]);

    if (existing) {
      await db.query(
        `UPDATE par_levels SET daily_usage=?, days_between_orders=?, safety_stock=?, area=?, notes=?, updated_at=NOW()
         WHERE id=?`,
        [data.daily_usage, data.days_between_orders, data.safety_stock, data.area, data.notes ?? null, existing.id]
      );
      return existing.id;
    } else {
      const id = uuidv4();
      await db.query(
        `INSERT INTO par_levels (id,tenant_id,product_id,daily_usage,days_between_orders,safety_stock,area,notes)
         VALUES (?,?,?,?,?,?,?,?)`,
        [id, tenantId, data.product_id, data.daily_usage, data.days_between_orders, data.safety_stock, data.area, data.notes ?? null]
      );
      return id;
    }
  },

  async deleteParLevel(tenantId: string, id: string) {
    await db.query('DELETE FROM par_levels WHERE id = ? AND tenant_id = ?', [id, tenantId]);
  },
};
