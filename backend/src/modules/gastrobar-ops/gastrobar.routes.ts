import { Router, Request, Response } from 'express';
import { authenticate, authorize } from '../../common/middleware';
import { gastrobarService } from './gastrobar.service';

const router: ReturnType<typeof Router> = Router();

router.use(authenticate, authorize('comerciante', 'superadmin'));

function todayStr() {
  return new Date().toISOString().split('T')[0];
}

router.get('/modo-dueno', async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).user.tenantId;
    const date = (req.query.date as string) ?? todayStr();
    const data = await gastrobarService.getMododueno(tenantId, date);
    res.json({ success: true, data });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get('/food-cost', async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).user.tenantId;
    const data = await gastrobarService.getFoodCost(tenantId);
    res.json({ success: true, data });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get('/purchase-suggestions', async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).user.tenantId;
    const data = await gastrobarService.getPurchaseSuggestions(tenantId);
    res.json({ success: true, data });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get('/weekly-trend', async (req: Request, res: Response) => {
  try {
    const tenantId = (req as any).user.tenantId;
    const data = await gastrobarService.getWeeklyTrend(tenantId);
    res.json({ success: true, data });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export { router as gastrobarRoutes };
