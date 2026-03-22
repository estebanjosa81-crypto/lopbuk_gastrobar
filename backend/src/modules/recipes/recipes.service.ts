import { v4 as uuidv4 } from 'uuid';
import { db } from '../../config';
import { AppError } from '../../common/middleware';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

interface RecipeRow extends RowDataPacket {
  id: string;
  product_id: string;
  ingredient_id: string;
  quantity: number;
  include_in_cost: number;
  product_name: string;
  product_sku: string;
  ingredient_name: string;
  ingredient_sku: string;
  purchase_price: number;
}

export interface RecipeIngredient {
  id: string;
  ingredientId: string;
  ingredientName: string;
  ingredientSku: string;
  quantity: number;
  unitCost: number;
  totalCost: number;
  includeInCost: boolean;
}

export interface RecipeGroup {
  productId: string;
  productName: string;
  productSku: string;
  totalCost: number;
  ingredients: RecipeIngredient[];
}

class RecipesService {
  async findAll(tenantId: string): Promise<RecipeGroup[]> {
    const [rows] = await db.execute<RecipeRow[]>(
      `SELECT pr.id, pr.product_id, pr.ingredient_id, pr.quantity, pr.include_in_cost,
              p.name as product_name, p.sku as product_sku,
              i.name as ingredient_name, i.sku as ingredient_sku, i.purchase_price
       FROM product_recipes pr
       JOIN products p ON p.id = pr.product_id
       JOIN products i ON i.id = pr.ingredient_id
       WHERE pr.tenant_id = ?
       ORDER BY p.name, i.name`,
      [tenantId]
    );

    const groupMap = new Map<string, RecipeGroup>();

    for (const row of rows) {
      if (!groupMap.has(row.product_id)) {
        groupMap.set(row.product_id, {
          productId: row.product_id,
          productName: row.product_name,
          productSku: row.product_sku,
          totalCost: 0,
          ingredients: [],
        });
      }

      const group = groupMap.get(row.product_id)!;
      const includeInCost = row.include_in_cost !== 0; // NULL o 1 = incluir, solo 0 = excluir
      const unitCost = Number(row.purchase_price);
      const quantity = Number(row.quantity);
      const totalCost = unitCost * quantity;

      group.ingredients.push({
        id: row.id,
        ingredientId: row.ingredient_id,
        ingredientName: row.ingredient_name,
        ingredientSku: row.ingredient_sku,
        quantity,
        unitCost,
        totalCost,
        includeInCost,
      });

      if (includeInCost) group.totalCost += totalCost;
    }

    return Array.from(groupMap.values());
  }

  async findByProductId(productId: string, tenantId: string): Promise<RecipeGroup | null> {
    const [rows] = await db.execute<RecipeRow[]>(
      `SELECT pr.id, pr.product_id, pr.ingredient_id, pr.quantity, pr.include_in_cost,
              p.name as product_name, p.sku as product_sku,
              i.name as ingredient_name, i.sku as ingredient_sku, i.purchase_price
       FROM product_recipes pr
       JOIN products p ON p.id = pr.product_id
       JOIN products i ON i.id = pr.ingredient_id
       WHERE pr.tenant_id = ? AND pr.product_id = ?
       ORDER BY i.name`,
      [tenantId, productId]
    );

    if (rows.length === 0) return null;

    const group: RecipeGroup = {
      productId: rows[0].product_id,
      productName: rows[0].product_name,
      productSku: rows[0].product_sku,
      totalCost: 0,
      ingredients: [],
    };

    for (const row of rows) {
      const includeInCost = row.include_in_cost !== 0; // NULL o 1 = incluir, solo 0 = excluir
      const unitCost = Number(row.purchase_price);
      const quantity = Number(row.quantity);
      const totalCost = unitCost * quantity;

      group.ingredients.push({
        id: row.id,
        ingredientId: row.ingredient_id,
        ingredientName: row.ingredient_name,
        ingredientSku: row.ingredient_sku,
        quantity,
        unitCost,
        totalCost,
        includeInCost,
      });

      if (includeInCost) group.totalCost += totalCost;
    }

    return group;
  }

  async createOrReplace(
    tenantId: string,
    productId: string,
    ingredients: Array<{ ingredientId: string; quantity: number; includeInCost?: boolean }>
  ): Promise<RecipeGroup> {
    if (!ingredients || ingredients.length === 0) {
      throw new AppError('Se requiere al menos un ingrediente', 400);
    }

    // Verify product exists
    const [products] = await db.execute<RowDataPacket[]>(
      'SELECT id FROM products WHERE id = ? AND tenant_id = ?',
      [productId, tenantId]
    );
    if ((products as any[]).length === 0) {
      throw new AppError('Producto no encontrado', 404);
    }

    // Verify all ingredients exist
    for (const ing of ingredients) {
      const [ingRows] = await db.execute<RowDataPacket[]>(
        'SELECT id FROM products WHERE id = ? AND tenant_id = ?',
        [ing.ingredientId, tenantId]
      );
      if ((ingRows as any[]).length === 0) {
        throw new AppError(`Ingrediente ${ing.ingredientId} no encontrado`, 404);
      }
    }

    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();

      // Delete existing recipe
      await connection.execute(
        'DELETE FROM product_recipes WHERE product_id = ? AND tenant_id = ?',
        [productId, tenantId]
      );

      // Insert new ingredients
      for (const ing of ingredients) {
        const includeInCost = ing.includeInCost !== false ? 1 : 0;
        await connection.execute(
          'INSERT INTO product_recipes (id, tenant_id, product_id, ingredient_id, quantity, include_in_cost) VALUES (?, ?, ?, ?, ?, ?)',
          [uuidv4(), tenantId, productId, ing.ingredientId, ing.quantity, includeInCost]
        );
      }

      await connection.commit();
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }

    const recipe = await this.findByProductId(productId, tenantId);
    return recipe!;
  }

  async deleteByProductId(productId: string, tenantId: string): Promise<void> {
    const [result] = await db.execute<ResultSetHeader>(
      'DELETE FROM product_recipes WHERE product_id = ? AND tenant_id = ?',
      [productId, tenantId]
    );

    if (result.affectedRows === 0) {
      throw new AppError('Receta no encontrada', 404);
    }
  }
}

export const recipesService = new RecipesService();
