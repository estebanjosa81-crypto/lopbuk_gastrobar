import { v4 as uuidv4 } from 'uuid';
import { db } from '../../config';
import { AppError } from '../../common/middleware';
import { RowDataPacket, ResultSetHeader } from 'mysql2';
import { Permission } from '../../utils/permissions';

interface CargoRow extends RowDataPacket {
  id: string;
  tenant_id: string;
  name: string;
  description: string | null;
  permissions: string | null;
  created_at: Date;
}

export interface CargoItem {
  id: string;
  name: string;
  description?: string;
  permissions: Permission[];
  createdAt: Date;
}

export class CargosService {
  private mapCargo(row: CargoRow): CargoItem {
    let permissions: Permission[] = [];
    if (row.permissions) {
      try {
        permissions = typeof row.permissions === 'string'
          ? JSON.parse(row.permissions)
          : row.permissions;
      } catch { permissions = []; }
    }
    return {
      id: row.id,
      name: row.name,
      description: row.description || undefined,
      permissions,
      createdAt: row.created_at,
    };
  }

  async findAll(tenantId: string): Promise<CargoItem[]> {
    const [rows] = await db.execute<CargoRow[]>(
      'SELECT * FROM employee_cargos WHERE tenant_id = ? ORDER BY name ASC',
      [tenantId]
    );
    return rows.map(r => this.mapCargo(r));
  }

  async create(tenantId: string, data: { name: string; description?: string; permissions?: Permission[] }): Promise<CargoItem> {
    const id = uuidv4();
    const permsJson = JSON.stringify(data.permissions || []);
    await db.execute<ResultSetHeader>(
      'INSERT INTO employee_cargos (id, tenant_id, name, description, permissions) VALUES (?, ?, ?, ?, ?)',
      [id, tenantId, data.name.trim(), data.description?.trim() || null, permsJson]
    );
    const [rows] = await db.execute<CargoRow[]>('SELECT * FROM employee_cargos WHERE id = ?', [id]);
    return this.mapCargo(rows[0]);
  }

  async update(tenantId: string, id: string, data: { name?: string; description?: string; permissions?: Permission[] }): Promise<CargoItem> {
    const updates: string[] = [];
    const values: unknown[] = [];

    if (data.name !== undefined) { updates.push('name = ?'); values.push(data.name.trim()); }
    if (data.description !== undefined) { updates.push('description = ?'); values.push(data.description?.trim() || null); }
    if (data.permissions !== undefined) { updates.push('permissions = ?'); values.push(JSON.stringify(data.permissions)); }

    if (updates.length === 0) throw new AppError('No hay datos para actualizar', 400);

    values.push(id, tenantId);
    const [result] = await db.execute<ResultSetHeader>(
      `UPDATE employee_cargos SET ${updates.join(', ')} WHERE id = ? AND tenant_id = ?`,
      values
    );
    if (result.affectedRows === 0) throw new AppError('Cargo no encontrado', 404);

    const [rows] = await db.execute<CargoRow[]>('SELECT * FROM employee_cargos WHERE id = ?', [id]);
    return this.mapCargo(rows[0]);
  }

  async delete(tenantId: string, id: string): Promise<void> {
    const [users] = await db.execute<RowDataPacket[]>(
      'SELECT COUNT(*) as count FROM users WHERE cargo_id = ? AND tenant_id = ?',
      [id, tenantId]
    );
    if (users[0].count > 0) {
      throw new AppError('No se puede eliminar un cargo que tiene empleados asignados', 400);
    }
    const [result] = await db.execute<ResultSetHeader>(
      'DELETE FROM employee_cargos WHERE id = ? AND tenant_id = ?',
      [id, tenantId]
    );
    if (result.affectedRows === 0) {
      throw new AppError('Cargo no encontrado', 404);
    }
  }
}

export const cargosService = new CargosService();
