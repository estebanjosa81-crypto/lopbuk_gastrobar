/**
 * adaptive.routes — Adaptive OS (Fase 4.1). Nudges priorizados para el Today.
 */
import { Router, Response } from 'express';
import { authenticate, AuthRequest } from '../../common/middleware';
import { adaptiveService } from './adaptive.service';

const router: ReturnType<typeof Router> = Router();

router.get('/me', authenticate, async (req: AuthRequest, res: Response) => {
  try { res.json({ success: true, data: await adaptiveService.getNudges(req.user!.userId) }); }
  catch (e: any) { res.status(e?.statusCode || 500).json({ success: false, error: e?.message || 'Error' }); }
});

export default router;
