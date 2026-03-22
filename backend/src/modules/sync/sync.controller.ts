import { Request, Response } from 'express';
import {
  getSyncStatus,
  runSync,
  receiveSalesFromLocal,
  receivePurchasesFromLocal,
  getChangesSince,
} from './sync.service';
import { config } from '../../config/env';

/**
 * GET /api/sync/status
 * Devuelve el estado actual del servicio de sync.
 * Usado por el frontend para mostrar el indicador online/offline.
 */
export async function getStatus(req: Request, res: Response): Promise<void> {
  const status = getSyncStatus();
  res.json({ success: true, data: status });
}

/**
 * POST /api/sync/trigger
 * Dispara un ciclo de sync manualmente desde el frontend.
 */
export async function triggerSync(req: Request, res: Response): Promise<void> {
  try {
    const result = await runSync();
    const status = getSyncStatus();
    res.json({ success: true, data: { ...result, ...status } });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
}

/**
 * POST /api/sync/receive-sales
 * ENDPOINT DE LA NUBE: recibe ventas creadas offline desde el local.
 * Protegido con x-sync-secret header.
 */
export async function receiveSales(req: Request, res: Response): Promise<void> {
  const secret = req.headers['x-sync-secret'];
  if (!config.sync.secret || secret !== config.sync.secret) {
    res.status(401).json({ success: false, error: 'No autorizado' });
    return;
  }

  const { sales } = req.body;
  if (!Array.isArray(sales) || sales.length === 0) {
    res.status(400).json({ success: false, error: 'Sin datos' });
    return;
  }

  try {
    const result = await receiveSalesFromLocal(sales);
    res.json({ success: true, data: result });
  } catch (err: any) {
    console.error('[Sync] Error recibiendo ventas:', err);
    res.status(500).json({ success: false, error: err.message });
  }
}

/**
 * GET /api/sync/changes?since=ISO_TIMESTAMP&tenantId=UUID
 * ENDPOINT DE LA NUBE: retorna productos y clientes modificados desde `since`.
 * El local lo llama para hacer el PULL (bajar cambios de la nube).
 * Protegido con x-sync-secret header.
 */
export async function getChanges(req: Request, res: Response): Promise<void> {
  const secret = req.headers['x-sync-secret'];
  if (!config.sync.secret || secret !== config.sync.secret) {
    res.status(401).json({ success: false, error: 'No autorizado' });
    return;
  }

  const { since, tenantId } = req.query as { since?: string; tenantId?: string };
  if (!since || !tenantId) {
    res.status(400).json({ success: false, error: 'Parámetros since y tenantId requeridos' });
    return;
  }

  const sinceDate = new Date(since);
  if (isNaN(sinceDate.getTime())) {
    res.status(400).json({ success: false, error: 'Formato de since inválido (usar ISO 8601)' });
    return;
  }

  try {
    const data = await getChangesSince(tenantId, sinceDate);
    res.json({ success: true, ...data });
  } catch (err: any) {
    console.error('[Sync] Error en GET /changes:', err);
    res.status(500).json({ success: false, error: err.message });
  }
}

/**
 * POST /api/sync/receive-purchases
 * ENDPOINT DE LA NUBE: recibe compras creadas offline desde el local.
 * Protegido con x-sync-secret header.
 */
export async function receivePurchases(req: Request, res: Response): Promise<void> {
  const secret = req.headers['x-sync-secret'];
  if (!config.sync.secret || secret !== config.sync.secret) {
    res.status(401).json({ success: false, error: 'No autorizado' });
    return;
  }

  const { purchases } = req.body;
  if (!Array.isArray(purchases) || purchases.length === 0) {
    res.status(400).json({ success: false, error: 'Sin datos' });
    return;
  }

  try {
    const result = await receivePurchasesFromLocal(purchases);
    res.json({ success: true, data: result });
  } catch (err: any) {
    console.error('[Sync] Error recibiendo compras:', err);
    res.status(500).json({ success: false, error: err.message });
  }
}
