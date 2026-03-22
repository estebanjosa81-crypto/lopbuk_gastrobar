import { db } from '../../config';
import { AppError } from '../../common/middleware';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

interface CategoryRow extends RowDataPacket {
  id: string;
  name: string;
  description: string | null;
}

export interface CategoryItem {
  id: string;
  name: string;
  description?: string;
}

export class CategoriesService {
  private mapCategory(row: CategoryRow): CategoryItem {
    return {
      id: row.id,
      name: row.name,
      description: row.description || undefined,
    };
  }

  async findAll(tenantId: string): Promise<CategoryItem[]> {
    const [rows] = await db.execute<CategoryRow[]>(
      'SELECT * FROM categories WHERE tenant_id = ? ORDER BY name ASC',
      [tenantId]
    );
    return rows.map(this.mapCategory);
  }

  async create(tenantId: string, data: { id: string; name: string; description?: string }): Promise<CategoryItem> {
    const [existing] = await db.execute<CategoryRow[]>(
      'SELECT id FROM categories WHERE id = ? AND tenant_id = ?',
      [data.id, tenantId]
    );

    if (existing.length > 0) {
      throw new AppError('Ya existe una categoría con ese identificador', 400);
    }

    await db.execute<ResultSetHeader>(
      'INSERT INTO categories (id, tenant_id, name, description) VALUES (?, ?, ?, ?)',
      [data.id, tenantId, data.name, data.description || null]
    );

    return { id: data.id, name: data.name, description: data.description };
  }

  async delete(tenantId: string, id: string): Promise<void> {
    // Check if category has products
    const [products] = await db.execute<RowDataPacket[]>(
      'SELECT COUNT(*) as count FROM products WHERE category = ? AND tenant_id = ?',
      [id, tenantId]
    );

    if (products[0].count > 0) {
      throw new AppError('No se puede eliminar una categoría que tiene productos asociados', 400);
    }

    const [result] = await db.execute<ResultSetHeader>(
      'DELETE FROM categories WHERE id = ? AND tenant_id = ?',
      [id, tenantId]
    );

    if (result.affectedRows === 0) {
      throw new AppError('Categoría no encontrada', 404);
    }
  }
}

export const categoriesService = new CategoriesService();
