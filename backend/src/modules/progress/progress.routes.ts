/**
 * progress.routes — Transformation tracking (F4.3).
 */
import { Router, Response } from 'express';
import { authenticate, AuthRequest } from '../../common/middleware';
import { progressService } from './progress.service';

const router: ReturnType<typeof Router> = Router();
const ok = (res: Response, data: any, code = 200) => res.status(code).json({ success: true, data });
const fail = (res: Response, e: any) => res.status(e?.statusCode || 500).json({ success: false, error: e?.message || 'Error' });

router.get('/me', authenticate, async (req: AuthRequest, res: Response) => {
  try { ok(res, await progressService.getSummary(req.user!.userId)); } catch (e) { fail(res, e); }
});
router.get('/me/logs', authenticate, async (req: AuthRequest, res: Response) => {
  try { ok(res, await progressService.listMine(req.user!.userId, Number(req.query.limit) || 60)); } catch (e) { fail(res, e); }
});
router.post('/log', authenticate, async (req: AuthRequest, res: Response) => {
  try { ok(res, await progressService.addLog(req.user!.userId, req.body || {}), 201); } catch (e) { fail(res, e); }
});

export default router;
