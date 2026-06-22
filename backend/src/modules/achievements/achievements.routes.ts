/**
 * achievements.routes — Logros de cliente (V3). Solo lectura para el consumidor;
 * el otorgamiento ocurre dentro de los flujos (vault/drops/coach/legend).
 */
import { Router, Request, Response } from 'express';
import { authenticate, AuthRequest } from '../../common/middleware';
import { achievementsService } from './achievements.service';

const router: ReturnType<typeof Router> = Router();
const ok = (res: Response, data: any) => res.json({ success: true, data });
const fail = (res: Response, e: any) => res.status(e?.statusCode || 500).json({ success: false, error: e?.message || 'Error' });

router.get('/catalog', (_req: Request, res: Response) => ok(res, achievementsService.getCatalog()));
router.get('/me', authenticate, async (req: AuthRequest, res: Response) => {
  try { ok(res, await achievementsService.getMine(req.user!.userId)); } catch (e) { fail(res, e); }
});

export default router;
