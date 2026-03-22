import { v4 as uuidv4 } from 'uuid';
import { db } from '../../config';
import { StockMovement, StockMovementType, PaginatedResponse } from '../../common/types';
import { AppError } from '../../common/middleware';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

interface StockMovementRow extends RowDataPacket {
  id: string;
  product_id: string;
  type: StockMovementType;
  quantity: number;
  previous_stock: number;
  new_stock: number;
  reason: string | null;
  reference_id: string | null;
  user_id: string | null;
  created_at: Date;
}

interface CountRow extends RowDataPacket {
  total: number;
}

interface ProductRow extends RowDataPacket {
  id: string;
  stock: number;
  name: string;
}

export interface StockMovementFilters {
  productId?: string;
  type?: StockMovementType;
  startDate?: Date;
  endDate?: Date;
}

export class InventoryService {
  private mapStockMovement(row: StockMovementRow): StockMovement {
    return {
      id: row.id,
      productId: row.product_id,
      type: row.type,
      quantity: row.quantity,
      previousStock: row.previous_stock,
      newStock: row.new_stock,
      reason: row.reason || undefined,
      referenceId: row.reference_id || undefined,
      userId: row.user_id || undefined,
      createdAt: row.created_at,
    };
  }

  async findAll(
    tenantId: string,
    page = 1,
    limit = 10,
    filters?: StockMovementFilters
  ): Promise<PaginatedResponse<StockMovement>> {
    const offset = (page - 1) * limit;
    const conditions: string[] = ['sm.tenant_id = ?'];
    const values: (string | Date)[] = [tenantId];

    if (filters?.productId) {
      conditions.push('sm.product_id = ?');
      values.push(filters.productId);
    }

    if (filters?.type) {
      conditions.push('sm.type = ?');
      values.push(filters.type);
    }

    if (filters?.startDate) {
      conditions.push('sm.created_at >= ?');
      values.push(filters.startDate);
    }

    if (filters?.endDate) {
      conditions.push('sm.created_at <= ?');
      values.push(filters.endDate);
    }

    const whereClause = `WHERE ${conditions.join(' AND ')}`;

    const [countResult] = await db.execute<CountRow[]>(
      `SELECT COUNT(*) as total FROM stock_movements sm ${whereClause}`,
      values
    );
    const total = countResult[0].total;

    const [rows] = await db.execute<StockMovementRow[]>(
      `SELECT sm.* FROM stock_movements sm ${whereClause} ORDER BY sm.created_at DESC LIMIT ? OFFSET ?`,
      [...values, String(limit), String(offset)]
    );

    return {
      data: rows.map(this.mapStockMovement),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findByProductId(productId: string, tenantId: string): Promise<StockMovement[]> {
    const [rows] = await db.execute<StockMovementRow[]>(
      'SELECT * FROM stock_movements WHERE product_id = ? AND tenant_id = ? ORDER BY created_at DESC',
      [productId, tenantId]
    );

    return rows.map(this.mapStockMovement);
  }

  async adjustStock(
    tenantId: string,
    productId: string,
    quantity: number,
    type: 'entrada' | 'salida' | 'ajuste',
    reason: string,
    userId: string
  ): Promise<StockMovement> {
    const connection = await db.getConnection();

    try {
      await connection.beginTransaction();

      const [productRows] = await connection.execute<ProductRow[]>(
        'SELECT id, stock, name FROM products WHERE id = ? AND tenant_id = ? FOR UPDATE',
        [productId, tenantId]
      );

      if (productRows.length === 0) {
        throw new AppError('Producto no encontrado', 404);
      }

      const product = productRows[0];
      let newStock: number;

      if (type === 'entrada') {
        newStock = product.stock + quantity;
      } else if (type === 'salida') {
        newStock = product.stock - quantity;
        if (newStock < 0) {
          throw new AppError('Stock insuficiente', 400);
        }
      } else {
        // ajuste - el quantity es el nuevo stock absoluto
        newStock = quantity;
      }

      await connection.execute(
        'UPDATE products SET stock = ? WHERE id = ?',
        [newStock, productId]
      );

      const movementId = uuidv4();
      const actualQuantity = type === 'ajuste' ? Math.abs(newStock - product.stock) : quantity;

      await connection.execute<ResultSetHeader>(
        `INSERT INTO stock_movements (id, tenant_id, product_id, type, quantity, previous_stock, new_stock, reason, user_id)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [movementId, tenantId, productId, type, actualQuantity, product.stock, newStock, reason, userId]
      );

      await connection.commit();

      const [movementRows] = await db.execute<StockMovementRow[]>(
        'SELECT * FROM stock_movements WHERE id = ?',
        [movementId]
      );

      return this.mapStockMovement(movementRows[0]);
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }

  async bulkAdjustStock(
    tenantId: string,
    adjustments: Array<{
      productId: string;
      quantity: number;
      type: 'entrada' | 'salida' | 'ajuste';
      reason: string;
    }>,
    userId: string
  ): Promise<StockMovement[]> {
    const movements: StockMovement[] = [];

    for (const adjustment of adjustments) {
      const movement = await this.adjustStock(
        tenantId,
        adjustment.productId,
        adjustment.quantity,
        adjustment.type,
        adjustment.reason,
        userId
      );
      movements.push(movement);
    }

    return movements;
  }
}

export const inventoryService = new InventoryService();
