/**
 * push.routes — clave pública VAPID + alta de suscripción.
 */
import { Router, Response } from 'express';
import { authenticate, AuthRequest } from '../../common/middleware';
import { pushService } from './push.service';

const router: ReturnType<typeof Router> = Router();

router.get('/public-key', authenticate, async (_req: AuthRequest, res: Response) => {
  try { res.json({ success: true, data: { publicKey: await pushService.getPublicKey() } }); }
  catch (e: any) { res.status(500).json({ success: false, error: e?.message || 'Error' }); }
});
router.post('/subscribe', authenticate, async (req: AuthRequest, res: Response) => {
  try { res.json({ success: true, data: await pushService.saveSubscription(req.user!.userId, req.body?.subscription || req.body) }); }
  catch (e: any) { res.status(500).json({ success: false, error: e?.message || 'Error' }); }
});

export default router;
