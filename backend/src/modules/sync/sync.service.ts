import { RowDataPacket, ResultSetHeader } from 'mysql2/promise';
import { db } from '../../config';
import { config } from '../../config/env';

// ─── Estado interno del servicio ────────────────────────────────────────────

interface SyncStatus {
  isOnline: boolean;
  isSyncing: boolean;
  lastSyncAt: Date | null;
  lastPullAt: Date | null;
  pendingSales: number;
  pendingPurchases: number;
}

const state: SyncStatus = {
  isOnline: false,
  isSyncing: false,
  lastSyncAt: null,
  lastPullAt: null,
  pendingSales: 0,
  pendingPurchases: 0,
};

// Cursor para pull incremental: última vez que descargamos cambios de la nube.
// Se inicializa a 24h atrás para cubrir el primer arranque.
let lastPullCursor: Date = new Date(Date.now() - 24 * 60 * 60 * 1000);

let syncTimer: ReturnType<typeof setInterval> | null = null;

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Verifica si hay conexión con el backend en la nube.
 * Hace un GET /health al CLOUD_API_URL con timeout de 5s.
 */
async function checkConnectivity(): Promise<boolean> {
  if (!config.sync.cloudApiUrl) return false;
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 5000);
    const res = await fetch(`${config.sync.cloudApiUrl}/health`, {
      signal: controller.signal,
    });
    clearTimeout(timer);
    return res.ok;
  } catch {
    return false;
  }
}

async function countPending(): Promise<{ sales: number; purchases: number }> {
  const [rows] = await db.execute<RowDataPacket[]>(
    `SELECT
       (SELECT COUNT(*) FROM sales            WHERE synced = 0) AS pending_sales,
       (SELECT COUNT(*) FROM purchase_invoices WHERE synced = 0) AS pending_purchases`
  );
  return {
    sales: Number((rows[0] as any).pending_sales),
    purchases: Number((rows[0] as any).pending_purchases),
  };
}

/**
 * Hace un POST al backend de la nube con el header de autenticación de sync.
 */
async function postToCloud(path: string, body: unknown): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 15000);
    const res = await fetch(`${config.sync.cloudApiUrl}${path}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-sync-secret': config.sync.secret,
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    clearTimeout(timer);
    return res.ok;
  } catch {
    return false;
  }
}

// ─── Push ventas locales → nube ───────────────────────────────────────────────

async function pushSales(): Promise<number> {
  const [salesRows] = await db.execute<RowDataPacket[]>(
    `SELECT * FROM sales WHERE synced = 0 ORDER BY created_at ASC LIMIT 50`
  );
  if (salesRows.length === 0) return 0;

  // Cargar items de cada venta
  const salesWithItems = await Promise.all(
    salesRows.map(async (sale: any) => {
      const [items] = await db.execute<RowDataPacket[]>(
        `SELECT * FROM sale_items WHERE sale_id = ?`,
        [sale.id]
      );
      return { ...sale, items };
    })
  );

  const ok = await postToCloud('/api/sync/receive-sales', { sales: salesWithItems });
  if (!ok) return 0;

  // Marcar como sincronizadas
  const ids = salesRows.map((s: any) => s.id);
  const placeholders = ids.map(() => '?').join(',');
  await db.execute(
    `UPDATE sales SET synced = 1, synced_at = NOW() WHERE id IN (${placeholders})`,
    ids
  );

  console.log(`[Sync] ${ids.length} ventas sincronizadas con la nube`);
  return ids.length;
}

// ─── Push compras locales → nube ─────────────────────────────────────────────

async function pushPurchases(): Promise<number> {
  const [purchaseRows] = await db.execute<RowDataPacket[]>(
    `SELECT * FROM purchase_invoices WHERE synced = 0 ORDER BY created_at ASC LIMIT 50`
  );
  if (purchaseRows.length === 0) return 0;

  const purchasesWithItems = await Promise.all(
    purchaseRows.map(async (inv: any) => {
      const [items] = await db.execute<RowDataPacket[]>(
        `SELECT * FROM purchase_invoice_items WHERE invoice_id = ?`,
        [inv.id]
      );
      return { ...inv, items };
    })
  );

  const ok = await postToCloud('/api/sync/receive-purchases', { purchases: purchasesWithItems });
  if (!ok) return 0;

  const ids = purchaseRows.map((p: any) => p.id);
  const placeholders = ids.map(() => '?').join(',');
  await db.execute(
    `UPDATE purchase_invoices SET synced = 1, synced_at = NOW() WHERE id IN (${placeholders})`,
    ids
  );

  console.log(`[Sync] ${ids.length} compras sincronizadas con la nube`);
  return ids.length;
}

// ─── Recibir ventas de un local (endpoint en la NUBE) ────────────────────────

export async function receiveSalesFromLocal(sales: any[]): Promise<{ inserted: number; skipped: number }> {
  let inserted = 0;
  let skipped = 0;

  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    for (const sale of sales) {
      // INSERT IGNORE: si el ID ya existe en la nube, lo omite sin error
      const [result] = await connection.execute<ResultSetHeader>(
        `INSERT IGNORE INTO sales
           (id, tenant_id, invoice_number, customer_id, customer_name, customer_phone,
            customer_email, subtotal, tax, discount, total, payment_method, amount_paid,
            change_amount, seller_id, seller_name, cash_session_id, status, credit_status,
            due_date, notes, synced, synced_at, origin, created_at, updated_at)
         VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,1,NOW(),'local',?,?)`,
        [
          sale.id, sale.tenant_id, sale.invoice_number, sale.customer_id || null,
          sale.customer_name || null, sale.customer_phone || null, sale.customer_email || null,
          sale.subtotal, sale.tax, sale.discount, sale.total, sale.payment_method,
          sale.amount_paid, sale.change_amount, sale.seller_id || null, sale.seller_name,
          sale.cash_session_id || null, sale.status, sale.credit_status || null,
          sale.due_date || null, sale.notes || null,
          sale.created_at, sale.updated_at,
        ]
      );

      if (result.affectedRows > 0) {
        // Insertar items también
        for (const item of (sale.items || [])) {
          await connection.execute(
            `INSERT IGNORE INTO sale_items
               (id, tenant_id, sale_id, product_id, product_name, product_sku,
                quantity, unit_price, discount, subtotal, created_at)
             VALUES (?,?,?,?,?,?,?,?,?,?,?)`,
            [
              item.id, item.tenant_id || sale.tenant_id, item.sale_id,
              item.product_id, item.product_name, item.product_sku,
              item.quantity, item.unit_price, item.discount, item.subtotal,
              item.created_at,
            ]
          );
        }
        inserted++;
      } else {
        skipped++;
      }
    }

    await connection.commit();
    return { inserted, skipped };
  } catch (err) {
    await connection.rollback();
    throw err;
  } finally {
    connection.release();
  }
}

// ─── Recibir compras de un local (endpoint en la NUBE) ───────────────────────

export async function receivePurchasesFromLocal(purchases: any[]): Promise<{ inserted: number; skipped: number }> {
  let inserted = 0;
  let skipped = 0;

  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    for (const inv of purchases) {
      const [result] = await connection.execute<ResultSetHeader>(
        `INSERT IGNORE INTO purchase_invoices
           (id, tenant_id, invoice_number, supplier_id, supplier_name, purchase_date,
            document_type, subtotal, discount, tax, total, payment_method, payment_status,
            due_date, file_url, notes, created_by, synced, synced_at, origin, created_at, updated_at)
         VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,1,NOW(),'local',?,?)`,
        [
          inv.id, inv.tenant_id, inv.invoice_number, inv.supplier_id || null,
          inv.supplier_name, inv.purchase_date, inv.document_type,
          inv.subtotal, inv.discount, inv.tax, inv.total, inv.payment_method,
          inv.payment_status, inv.due_date || null, inv.file_url || null,
          inv.notes || null, inv.created_by || null,
          inv.created_at, inv.updated_at,
        ]
      );

      if (result.affectedRows > 0) {
        for (const item of (inv.items || [])) {
          await connection.execute(
            `INSERT IGNORE INTO purchase_invoice_items
               (id, tenant_id, invoice_id, product_id, product_name, product_sku,
                quantity, unit_cost, subtotal)
             VALUES (?,?,?,?,?,?,?,?,?)`,
            [
              item.id, item.tenant_id || inv.tenant_id, item.invoice_id,
              item.product_id, item.product_name, item.product_sku,
              item.quantity, item.unit_cost, item.subtotal,
            ]
          );
        }
        inserted++;
      } else {
        skipped++;
      }
    }

    await connection.commit();
    return { inserted, skipped };
  } catch (err) {
    await connection.rollback();
    throw err;
  } finally {
    connection.release();
  }
}

// ─── Pull: nube → local (productos y clientes actualizados) ──────────────────

/**
 * Descarga de la nube los productos y clientes modificados desde `lastPullCursor`
 * y los aplica localmente con estrategia "último updated_at gana".
 * Solo se ejecuta en instancias locales con SYNC_TENANT_ID configurado.
 */
async function pullFromCloud(): Promise<number> {
  if (!config.sync.cloudApiUrl || !config.sync.tenantId) return 0;

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 15000);
    const since = lastPullCursor.toISOString();

    const res = await fetch(
      `${config.sync.cloudApiUrl}/api/sync/changes?since=${encodeURIComponent(since)}&tenantId=${encodeURIComponent(config.sync.tenantId)}`,
      {
        headers: { 'x-sync-secret': config.sync.secret },
        signal: controller.signal,
      }
    );
    clearTimeout(timer);

    if (!res.ok) return 0;
    const data = await res.json() as { products?: any[]; customers?: any[] };

    let applied = 0;

    // Aplicar productos: actualiza stock y precios si la nube tiene dato más nuevo
    for (const p of (data.products || [])) {
      await db.execute(
        `INSERT INTO products
           (id, tenant_id, name, articulo, category, product_type, brand, model,
            description, purchase_price, sale_price, sku, barcode, stock,
            reorder_point, supplier, supplier_id, entry_date, image_url, notes,
            location_in_store, updated_at)
         VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
         ON DUPLICATE KEY UPDATE
           stock          = IF(VALUES(updated_at) > updated_at, VALUES(stock),          stock),
           sale_price     = IF(VALUES(updated_at) > updated_at, VALUES(sale_price),     sale_price),
           purchase_price = IF(VALUES(updated_at) > updated_at, VALUES(purchase_price), purchase_price),
           name           = IF(VALUES(updated_at) > updated_at, VALUES(name),           name),
           updated_at     = IF(VALUES(updated_at) > updated_at, VALUES(updated_at),     updated_at)`,
        [
          p.id, p.tenant_id, p.name, p.articulo || null, p.category,
          p.product_type || 'general', p.brand || null, p.model || null,
          p.description || null, p.purchase_price, p.sale_price, p.sku,
          p.barcode || null, p.stock, p.reorder_point || 5,
          p.supplier || null, p.supplier_id || null, p.entry_date || null,
          p.image_url || null, p.notes || null, p.location_in_store || null,
          p.updated_at,
        ]
      );
      applied++;
    }

    // Aplicar clientes: inserta nuevos o actualiza si la nube tiene dato más nuevo
    for (const c of (data.customers || [])) {
      await db.execute(
        `INSERT INTO customers
           (id, tenant_id, cedula, name, phone, email, address, credit_limit, notes, updated_at)
         VALUES (?,?,?,?,?,?,?,?,?,?)
         ON DUPLICATE KEY UPDATE
           name         = IF(VALUES(updated_at) > updated_at, VALUES(name),         name),
           phone        = IF(VALUES(updated_at) > updated_at, VALUES(phone),        phone),
           email        = IF(VALUES(updated_at) > updated_at, VALUES(email),        email),
           address      = IF(VALUES(updated_at) > updated_at, VALUES(address),      address),
           credit_limit = IF(VALUES(updated_at) > updated_at, VALUES(credit_limit), credit_limit),
           updated_at   = IF(VALUES(updated_at) > updated_at, VALUES(updated_at),   updated_at)`,
        [
          c.id, c.tenant_id, c.cedula, c.name, c.phone || null,
          c.email || null, c.address || null, c.credit_limit || 0,
          c.notes || null, c.updated_at,
        ]
      );
      applied++;
    }

    lastPullCursor = new Date();
    state.lastPullAt = lastPullCursor;
    console.log(`[Sync] PULL: ${applied} registros aplicados desde la nube`);
    return applied;
  } catch (err) {
    console.error('[Sync] Error en pull:', err);
    return 0;
  }
}

// ─── getChangesSince: endpoint de la NUBE para servir cambios a los locales ──

/**
 * Retorna productos y clientes del tenant modificados desde `since`.
 * Se usa en el endpoint GET /api/sync/changes (solo corre en la nube).
 */
export async function getChangesSince(
  tenantId: string,
  since: Date
): Promise<{ products: any[]; customers: any[] }> {
  const [products] = await db.execute<RowDataPacket[]>(
    `SELECT id, tenant_id, name, articulo, category, product_type, brand, model,
            description, purchase_price, sale_price, sku, barcode, stock,
            reorder_point, supplier, supplier_id, entry_date, image_url, notes,
            location_in_store, updated_at
     FROM products
     WHERE tenant_id = ? AND updated_at > ?
     ORDER BY updated_at ASC
     LIMIT 500`,
    [tenantId, since]
  );

  const [customers] = await db.execute<RowDataPacket[]>(
    `SELECT id, tenant_id, cedula, name, phone, email, address, credit_limit, notes, updated_at
     FROM customers
     WHERE tenant_id = ? AND updated_at > ?
     ORDER BY updated_at ASC
     LIMIT 500`,
    [tenantId, since]
  );

  return { products: products as any[], customers: customers as any[] };
}

// ─── Ciclo principal de sync ──────────────────────────────────────────────────

export async function runSync(): Promise<{ salesSynced: number; purchasesSynced: number; pulled: number }> {
  if (state.isSyncing) return { salesSynced: 0, purchasesSynced: 0, pulled: 0 };

  state.isSyncing = true;
  try {
    const online = await checkConnectivity();
    state.isOnline = online;

    const pending = await countPending();
    state.pendingSales = pending.sales;
    state.pendingPurchases = pending.purchases;

    if (!online) {
      return { salesSynced: 0, purchasesSynced: 0, pulled: 0 };
    }

    // 1. PUSH: subir datos locales pendientes a la nube
    const salesSynced = await pushSales();
    const purchasesSynced = await pushPurchases();

    // 2. PULL: bajar cambios de la nube (productos, clientes)
    const pulled = await pullFromCloud();

    // Actualizar contadores después del push
    const pendingAfter = await countPending();
    state.pendingSales = pendingAfter.sales;
    state.pendingPurchases = pendingAfter.purchases;
    state.lastSyncAt = new Date();

    return { salesSynced, purchasesSynced, pulled };
  } finally {
    state.isSyncing = false;
  }
}

// ─── Scheduler ───────────────────────────────────────────────────────────────

export function startSyncScheduler(): void {
  if (!config.sync.isLocalInstance || !config.sync.cloudApiUrl) {
    return; // Solo activo en instancias locales con CLOUD_API_URL configurado
  }

  console.log(`[Sync] Instancia local detectada. Scheduler iniciado (cada ${config.sync.intervalMs / 1000}s)`);
  console.log(`[Sync] Destino: ${config.sync.cloudApiUrl}`);

  // Primer intento al arrancar
  runSync().catch((err) => console.error('[Sync] Error en sync inicial:', err));

  syncTimer = setInterval(() => {
    runSync().catch((err) => console.error('[Sync] Error en sync:', err));
  }, config.sync.intervalMs);
}

export function stopSyncScheduler(): void {
  if (syncTimer) {
    clearInterval(syncTimer);
    syncTimer = null;
  }
}

export function getSyncStatus(): SyncStatus & { isLocalInstance: boolean } {
  return {
    ...state,
    isLocalInstance: config.sync.isLocalInstance,
  };
}
