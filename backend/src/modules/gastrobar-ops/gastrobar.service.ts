import { db } from '../../config';
import { RowDataPacket } from 'mysql2';

export const gastrobarService = {

  // ── Modo Dueño: snapshot ejecutivo del día ────────────────────────────────
  async getMododueno(tenantId: string, date: string) {
    const [salesRows] = await db.query<RowDataPacket[]>(
      `SELECT
         COALESCE(SUM(s.total),0)          AS total_sales,
         COALESCE(SUM(s.subtotal),0)       AS subtotal,
         COUNT(*)                          AS total_orders,
         COALESCE(SUM(ic.item_cost),0)     AS total_cost
       FROM sales s
       LEFT JOIN (
         SELECT si.sale_id, SUM(si.quantity * p.purchase_price) AS item_cost
         FROM sale_items si
         JOIN products p ON p.id = si.product_id
         GROUP BY si.sale_id
       ) ic ON ic.sale_id = s.id
       WHERE s.tenant_id = ? AND DATE(s.created_at) = ? AND s.status = 'completada'`,
      [tenantId, date]
    );
    const salesData = salesRows[0] as any;

    const totalSales   = Number(salesData?.total_sales  ?? 0);
    const totalCost    = Number(salesData?.total_cost   ?? 0);
    const grossProfit  = totalSales - totalCost;
    const foodCostPercent = totalSales > 0 ? (totalCost / totalSales) * 100 : 0;

    // Merma del día
    const [wasteRows] = await db.query<RowDataPacket[]>(
      `SELECT COALESCE(SUM(cost_value),0) as waste_cost
       FROM waste_records WHERE tenant_id = ? AND DATE(created_at) = ?`,
      [tenantId, date]
    );
    const wasteCost = Number((wasteRows[0] as any)?.waste_cost ?? 0);

    const realProfit = grossProfit - wasteCost;

    // Low stock alerts (productos bajo reorder_point)
    const [lowStockAlerts] = await db.query<RowDataPacket[]>(
      `SELECT name, stock, reorder_point, preparation_area
       FROM products
       WHERE tenant_id = ? AND is_menu_item = 1 AND stock <= reorder_point AND reorder_point > 0
       ORDER BY (stock / NULLIF(reorder_point,0)) ASC
       LIMIT 10`,
      [tenantId]
    );

    // PAR level alerts
    const [parAlerts] = await db.query<RowDataPacket[]>(
      `SELECT p.name, p.stock,
              (pl.daily_usage * pl.days_between_orders + pl.safety_stock) as par_level,
              pl.area,
              p.stock - (pl.daily_usage * pl.days_between_orders + pl.safety_stock) as gap
       FROM par_levels pl
       JOIN products p ON p.id = pl.product_id AND p.tenant_id = pl.tenant_id
       WHERE pl.tenant_id = ?
         AND p.stock < (pl.daily_usage * pl.days_between_orders + pl.safety_stock)
       ORDER BY gap ASC
       LIMIT 10`,
      [tenantId]
    );

    // Top 5 platos del día
    const [topItems] = await db.query<RowDataPacket[]>(
      `SELECT si.product_name, SUM(si.quantity) as qty, SUM(si.subtotal) as revenue
       FROM sale_items si
       JOIN sales s ON s.id = si.sale_id
       WHERE s.tenant_id = ? AND DATE(s.created_at) = ? AND s.status != 'cancelada'
       GROUP BY si.product_name
       ORDER BY qty DESC
       LIMIT 5`,
      [tenantId, date]
    );

    // Semáforo — merma verde si no hay ventas aún (evita rojo en día sin datos)
    const semaforo = {
      cocina:     foodCostPercent > 40  ? 'rojo' : foodCostPercent > 35 ? 'amarillo' : 'verde',
      bar:        foodCostPercent > 30  ? 'rojo' : foodCostPercent > 25 ? 'amarillo' : 'verde',
      inventario: (lowStockAlerts as any[]).length > 3 ? 'rojo' : (lowStockAlerts as any[]).length > 0 ? 'amarillo' : 'verde',
      merma:      totalSales > 0
        ? (wasteCost > totalSales * 0.08 ? 'rojo' : wasteCost > totalSales * 0.05 ? 'amarillo' : 'verde')
        : 'verde',
    };

    return {
      date,
      kpis: {
        totalSales,
        totalCost,
        grossProfit,
        wasteCost,
        realProfit,
        foodCostPercent: Math.round(foodCostPercent * 10) / 10,
        totalOrders: Number(salesData?.total_orders ?? 0),
      },
      semaforo,
      alerts: { lowStock: lowStockAlerts, parAlerts },
      topItems,
    };
  },

  // ── Food cost por receta ──────────────────────────────────────────────────
  async getFoodCost(tenantId: string) {
    const [menuItems] = await db.query<RowDataPacket[]>(
      `SELECT p.id, p.name, p.sale_price, p.preparation_area,
              (
                SELECT COALESCE(SUM(pr.quantity * ing.purchase_price), 0)
                FROM product_recipes pr
                JOIN products ing ON ing.id = pr.ingredient_id AND ing.tenant_id = p.tenant_id
                WHERE pr.product_id = p.id
              ) as recipe_cost,
              (SELECT COUNT(*) FROM product_recipes pr WHERE pr.product_id = p.id) as ingredient_count
       FROM products p
       WHERE p.tenant_id = ? AND p.is_menu_item = 1
       ORDER BY p.category, p.name`,
      [tenantId]
    );

    return (menuItems as any[]).map(item => {
      const salePrice   = Number(item.sale_price  ?? 0);
      const recipeCost  = Number(item.recipe_cost ?? 0);
      const foodCostPct = salePrice > 0 ? (recipeCost / salePrice) * 100 : 0;

      const area = item.preparation_area ?? 'cocina';
      const [minOk, maxOk] = area === 'bar' ? [18, 28] : [25, 35];

      let status: 'ok' | 'warning' | 'danger' = 'ok';
      if (foodCostPct > maxOk + 10)    status = 'danger';
      else if (foodCostPct > maxOk)    status = 'warning';
      else if (Number(item.ingredient_count) === 0) status = 'warning';

      return {
        id:              item.id,
        name:            item.name,
        salePrice,
        recipeCost:      Math.round(recipeCost * 10) / 10,
        foodCostPct:     Math.round(foodCostPct * 10) / 10,
        grossMargin:     Math.round((salePrice - recipeCost) * 10) / 10,
        area,
        ingredientCount: Number(item.ingredient_count ?? 0),
        status,
        idealRange:      `${minOk}%-${maxOk}%`,
      };
    });
  },

  // ── Sugerencias de compra ─────────────────────────────────────────────────
  async getPurchaseSuggestions(tenantId: string) {
    const [parItems] = await db.query<RowDataPacket[]>(
      `SELECT
         p.id, p.name, p.stock, p.purchase_price, p.supplier_id,
         s.name as supplier_name,
         pl.daily_usage, pl.days_between_orders, pl.safety_stock, pl.area,
         (pl.daily_usage * pl.days_between_orders + pl.safety_stock) as par_level,
         GREATEST(0, (pl.daily_usage * pl.days_between_orders + pl.safety_stock) - p.stock) as to_order,
         GREATEST(0, (pl.daily_usage * pl.days_between_orders + pl.safety_stock) - p.stock) * p.purchase_price as estimated_cost
       FROM par_levels pl
       JOIN products p ON p.id = pl.product_id AND p.tenant_id = pl.tenant_id
       LEFT JOIN suppliers s ON s.id = p.supplier_id
       WHERE pl.tenant_id = ?
         AND p.stock < (pl.daily_usage * pl.days_between_orders + pl.safety_stock)
       ORDER BY pl.area, to_order DESC`,
      [tenantId]
    );

    const [lowStockItems] = await db.query<RowDataPacket[]>(
      `SELECT p.id, p.name, p.stock, p.reorder_point, p.purchase_price,
              p.preparation_area as area,
              s.name as supplier_name,
              GREATEST(0, p.reorder_point * 2 - p.stock) as to_order,
              GREATEST(0, p.reorder_point * 2 - p.stock) * p.purchase_price as estimated_cost
       FROM products p
       LEFT JOIN suppliers s ON s.id = p.supplier_id
       LEFT JOIN par_levels pl ON pl.product_id = p.id AND pl.tenant_id = p.tenant_id
       WHERE p.tenant_id = ?
         AND p.stock <= p.reorder_point
         AND p.reorder_point > 0
         AND pl.id IS NULL
         AND (p.is_menu_item = 1 OR p.is_ingredient = 1)
       ORDER BY p.stock ASC
       LIMIT 20`,
      [tenantId]
    );

    const totalEstimatedCost = [...(parItems as any[]), ...(lowStockItems as any[])].reduce(
      (sum, item) => sum + Number(item.estimated_cost ?? 0), 0
    );

    return {
      parBased:  parItems,
      stockBased: lowStockItems,
      summary: {
        totalItems:         (parItems as any[]).length + (lowStockItems as any[]).length,
        totalEstimatedCost: Math.round(totalEstimatedCost),
      },
    };
  },

  // ── Tendencia 14 días ─────────────────────────────────────────────────────
  async getWeeklyTrend(tenantId: string) {
    // Use DATE_FORMAT to get guaranteed string keys — avoids JS Date object key issues
    const [salesRows] = await db.query<RowDataPacket[]>(
      `SELECT DATE_FORMAT(created_at, '%Y-%m-%d') as day,
              COALESCE(SUM(total),0) as revenue,
              COUNT(*) as orders
       FROM sales
       WHERE tenant_id = ? AND created_at >= DATE_SUB(CURDATE(), INTERVAL 14 DAY)
         AND status != 'cancelada'
       GROUP BY day ORDER BY day ASC`,
      [tenantId]
    );

    const [wasteRows] = await db.query<RowDataPacket[]>(
      `SELECT DATE_FORMAT(created_at, '%Y-%m-%d') as day,
              COALESCE(SUM(cost_value),0) as waste_cost
       FROM waste_records
       WHERE tenant_id = ? AND created_at >= DATE_SUB(CURDATE(), INTERVAL 14 DAY)
       GROUP BY day ORDER BY day ASC`,
      [tenantId]
    );

    // Both keys are now guaranteed plain YYYY-MM-DD strings
    const wasteMap: Record<string, number> = {};
    (wasteRows as any[]).forEach(r => {
      wasteMap[String(r.day)] = Number(r.waste_cost ?? 0);
    });

    return (salesRows as any[]).map(r => ({
      day:       String(r.day),
      revenue:   Number(r.revenue  ?? 0),
      orders:    Number(r.orders   ?? 0),
      wasteCost: wasteMap[String(r.day)] ?? 0,
    }));
  },
};
