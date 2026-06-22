/**
 * vault.routes — Vault / Access Ecosystem (V1).
 *   • Consumidor (authenticate)        → canjea su Access Pass + consulta desbloqueos.
 *   • Superadmin (authenticate + authorize) → emite / lista / edita llaves.
 * Manejadores inline (patrón trainers / affiliates).
 */
import { Router, Request, Response } from 'express';
import { authenticate, authorize, AuthRequest } from '../../common/middleware';
import { vaultService, KNOWN_UNLOCKS } from './vault.service';
import { dropsService } from './vault.drops.service';
import { createCheckout } from '../payments/payments.service';

const router: ReturnType<typeof Router> = Router();
const ok = (res: Response, data: any, code = 200) => res.status(code).json({ success: true, data });
const fail = (res: Response, e: any) => res.status(e?.statusCode || 500).json({ success: false, error: e?.message || 'Error' });

// Catálogo de interfaces ocultas conocidas (para los selects del admin).
router.get('/unlock-types', (_req: Request, res: Response) => ok(res, KNOWN_UNLOCKS));

// ─────────── Consumidor ───────────
router.post('/redeem', authenticate, async (req: AuthRequest, res: Response) => {
  try { ok(res, await vaultService.redeem(req.user!.userId, String(req.body?.code || ''), req.body?.data), 201); } catch (e) { fail(res, e); }
});
router.get('/me/unlocks', authenticate, async (req: AuthRequest, res: Response) => {
  try { ok(res, await vaultService.getMyUnlocks(req.user!.userId)); } catch (e) { fail(res, e); }
});

// ─────────── Drops (consumidor) ───────────
router.get('/drops', authenticate, async (req: AuthRequest, res: Response) => {
  try { ok(res, await dropsService.listForUser(req.user!.userId)); } catch (e) { fail(res, e); }
});
router.get('/drops/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try { ok(res, await dropsService.getForUser(req.params.id, req.user!.userId)); } catch (e) { fail(res, e); }
});
router.post('/drops/:id/claim', authenticate, async (req: AuthRequest, res: Response) => {
  try { ok(res, await dropsService.claim(req.user!.userId, req.params.id), 201); } catch (e) { fail(res, e); }
});
// Pagar el cupo (drops con precio): crea checkout Wompi sobre el cupo reservado.
router.post('/drops/:id/checkout', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const claimId = await dropsService.getClaimId(req.user!.userId, req.params.id);
    if (!claimId) { res.status(409).json({ success: false, error: 'Primero reclama tu cupo' }); return; }
    const co = await createCheckout({
      context: 'drop', contextId: claimId, tenantId: null, amountInCents: 0,
      redirectUrl: `${String(req.body?.origin || '').replace(/\/$/, '')}/pago/resultado`,
      customerEmail: req.user!.email || undefined,
    });
    ok(res, { checkoutUrl: co.checkoutUrl }, 201);
  } catch (e) { fail(res, e); }
});

// ─────────── Superadmin ───────────
const sa = [authenticate, authorize('superadmin')];
router.get('/admin/keys', ...sa, async (_req: Request, res: Response) => {
  try { ok(res, await vaultService.adminListKeys()); } catch (e) { fail(res, e); }
});
router.post('/admin/keys', ...sa, async (req: AuthRequest, res: Response) => {
  try { ok(res, await vaultService.createKey(req.body || {}, { createdBy: req.user!.userId }), 201); } catch (e) { fail(res, e); }
});
router.patch('/admin/keys/:id', ...sa, async (req: Request, res: Response) => {
  try { ok(res, await vaultService.adminUpdateKey(req.params.id, req.body || {})); } catch (e) { fail(res, e); }
});

// Drops (superadmin)
router.get('/admin/drops', ...sa, async (_req: Request, res: Response) => {
  try { ok(res, await dropsService.adminList()); } catch (e) { fail(res, e); }
});
router.post('/admin/drops', ...sa, async (req: AuthRequest, res: Response) => {
  try { ok(res, await dropsService.adminCreate(req.body || {}, req.user!.userId), 201); } catch (e) { fail(res, e); }
});
router.patch('/admin/drops/:id', ...sa, async (req: Request, res: Response) => {
  try { ok(res, await dropsService.adminUpdate(req.params.id, req.body || {})); } catch (e) { fail(res, e); }
});

export default router;
