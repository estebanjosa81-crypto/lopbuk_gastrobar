import { db } from '../../config';
import { AppError } from '../../common/middleware';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

interface CategoryRow extends RowDataPacket {
  id: string;
  name: string;
  description: string | null;
  is_active: number;
  color: string | null;
  sort_order: number;
}

export interface CategoryItem {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
  color?: string;
  sortOrder: number;
}

export class CategoriesService {
  private mapCategory(row: CategoryRow): CategoryItem {
    return {
      id: row.id,
      name: row.name,
      description: row.description || undefined,
      isActive: row.is_active !== 0,
      color: row.color || '#6366f1',
      sortOrder: row.sort_order ?? 0,
    };
  }

  async findAll(tenantId: string, includeHidden = false): Promise<CategoryItem[]> {
    const whereActive = includeHidden ? '' : 'AND (is_active IS NULL OR is_active = 1)';
    const [rows] = await db.execute<CategoryRow[]>(
      `SELECT id, name, description, COALESCE(is_active,1) AS is_active,
              color, COALESCE(sort_order,0) AS sort_order
       FROM categories
       WHERE tenant_id = ? ${whereActive}
       ORDER BY COALESCE(sort_order,0) ASC, name ASC`,
      [tenantId]
    );
    return rows.map(this.mapCategory.bind(this));
  }

  async create(tenantId: string, data: { id: string; name: string; description?: string; color?: string }): Promise<CategoryItem> {
    const [existing] = await db.execute<CategoryRow[]>(
      'SELECT id FROM categories WHERE id = ? AND tenant_id = ?',
      [data.id, tenantId]
    );

    if (existing.length > 0) {
      throw new AppError('Ya existe una categoría con ese identificador', 400);
    }

    const color = data.color || '#6366f1';
    await db.execute<ResultSetHeader>(
      'INSERT INTO categories (id, tenant_id, name, description, color, is_active, sort_order) VALUES (?, ?, ?, ?, ?, 1, 0)',
      [data.id, tenantId, data.name, data.description || null, color]
    );

    return { id: data.id, name: data.name, description: data.description, isActive: true, color, sortOrder: 0 };
  }

  async update(tenantId: string, id: string, data: { name?: string; description?: string; color?: string; sortOrder?: number }): Promise<CategoryItem> {
    const [rows] = await db.execute<CategoryRow[]>(
      'SELECT * FROM categories WHERE id = ? AND tenant_id = ?',
      [id, tenantId]
    );
    if (rows.length === 0) throw new AppError('Categoría no encontrada', 404);

    const current = rows[0];
    const name        = data.name        ?? current.name;
    const description = data.description !== undefined ? data.description : current.description;
    const color       = data.color       ?? current.color ?? '#6366f1';
    const sortOrder   = data.sortOrder   !== undefined ? data.sortOrder : (current.sort_order ?? 0);

    await db.execute<ResultSetHeader>(
      'UPDATE categories SET name=?, description=?, color=?, sort_order=? WHERE id=? AND tenant_id=?',
      [name, description || null, color, sortOrder, id, tenantId]
    );

    return this.mapCategory({ ...current, name, description: description ?? null, color, sort_order: sortOrder });
  }

  async toggleVisibility(tenantId: string, id: string): Promise<{ isActive: boolean }> {
    const [rows] = await db.execute<CategoryRow[]>(
      'SELECT id, COALESCE(is_active,1) AS is_active FROM categories WHERE id = ? AND tenant_id = ?',
      [id, tenantId]
    );
    if (rows.length === 0) throw new AppError('Categoría no encontrada', 404);

    const newActive = rows[0].is_active === 0 ? 1 : 0;
    await db.execute<ResultSetHeader>(
      'UPDATE categories SET is_active=? WHERE id=? AND tenant_id=?',
      [newActive, id, tenantId]
    );
    return { isActive: newActive === 1 };
  }

  async delete(tenantId: string, id: string): Promise<void> {
    // Verificar si tiene productos activos
    const [products] = await db.execute<RowDataPacket[]>(
      'SELECT COUNT(*) as count FROM products WHERE category = ? AND tenant_id = ? AND is_active = 1',
      [id, tenantId]
    );

    if (products[0].count > 0) {
      throw new AppError('No se puede eliminar una categoría que tiene productos asociados. Oculta la categoría en su lugar.', 400);
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
