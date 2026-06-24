/**
 * trainers.routes — Coach Economy (T1: auth + perfil).
 * Auth propia del entrenador (JWT type='trainer', cookie trainerToken).
 * Manejadores inline (mismo patrón que affiliates.routes).
 */
import { Router, Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../../config';
import { authenticate, authorize, AuthRequest } from '../../common/middleware';
import { trainersService } from './trainers.service';
import { createCheckout } from '../payments/payments.service';

const router: ReturnType<typeof Router> = Router();

interface TrReq extends Request { trainerId?: string; trainer?: any }

const ok = (res: Response, data: any, code = 200) => res.status(code).json({ success: true, data });
const fail = (res: Response, e: any) => res.status(e?.statusCode || 500).json({ success: false, error: e?.message || 'Error' });

const isProd = process.env.NODE_ENV === 'production';
const cookieOpts = { httpOnly: true, sameSite: 'lax' as const, secure: isProd, maxAge: 30 * 24 * 60 * 60 * 1000 };

// Auth propia del entrenador (JWT type='trainer')
async function authenticateTrainer(req: TrReq, res: Response, next: NextFunction): Promise<void> {
  try {
    const token: string | undefined =
      req.cookies?.trainerToken ||
      (req.headers.authorization?.startsWith('Bearer ') ? req.headers.authorization.split(' ')[1] : undefined);
    if (!token) { res.status(401).json({ success: false, error: 'No autenticado' }); return; }
    const decoded = jwt.verify(token, config.jwt.secret) as any;
    if (decoded?.type !== 'trainer' || !decoded.trainerId) { res.status(401).json({ success: false, error: 'Token inválido' }); return; }
    const tr = await trainersService.getById(decoded.trainerId);
    if (!tr) { res.status(401).json({ success: false, error: 'Entrenador no encontrado' }); return; }
    if (tr.status === 'suspended') { res.status(403).json({ success: false, error: 'Tu cuenta de entrenador está suspendida' }); return; }
    req.trainerId = tr.id; req.trainer = tr;
    next();
  } catch { res.status(401).json({ success: false, error: 'Token inválido o expirado' }); }
}

// ─────────── PÚBLICO: registro / login del entrenador ───────────
router.post('/register', async (req: Request, res: Response) => {
  try {
    const { trainer, token } = await trainersService.register(req.body);
    res.cookie('trainerToken', token, cookieOpts);
    ok(res, { trainer, token }, 201);
  } catch (e) { fail(res, e); }
});

router.post('/login', async (req: Request, res: Response) => {
  try {
    const { trainer, token } = await trainersService.login(req.body?.email, req.body?.password);
    res.cookie('trainerToken', token, cookieOpts);
    ok(res, { trainer, token });
  } catch (e) { fail(res, e); }
});

router.post('/logout', (_req: Request, res: Response) => {
  res.clearCookie('trainerToken');
  ok(res, { ok: true });
});

// ─────────── Entrenador autenticado ───────────
router.get('/me', authenticateTrainer, (req: TrReq, res: Response) => { ok(res, req.trainer); });

router.patch('/me', authenticateTrainer, async (req: TrReq, res: Response) => {
  try { ok(res, await trainersService.updateProfile(req.trainerId!, req.body || {})); }
  catch (e) { fail(res, e); }
});

// ─────────── Ofertas / Programas (entrenador) ───────────
router.get('/me/offers', authenticateTrainer, async (req: TrReq, res: Response) => {
  try { ok(res, await trainersService.listMyOffers(req.trainerId!)); } catch (e) { fail(res, e); }
});
router.post('/me/offers', authenticateTrainer, async (req: TrReq, res: Response) => {
  try { ok(res, await trainersService.createOffer(req.trainerId!, req.body || {}), 201); } catch (e) { fail(res, e); }
});
router.patch('/me/offers/:id', authenticateTrainer, async (req: TrReq, res: Response) => {
  try { ok(res, await trainersService.updateOffer(req.trainerId!, req.params.id, req.body || {})); } catch (e) { fail(res, e); }
});
router.delete('/me/offers/:id', authenticateTrainer, async (req: TrReq, res: Response) => {
  try { await trainersService.deactivateOffer(req.trainerId!, req.params.id); ok(res, { ok: true }); } catch (e) { fail(res, e); }
});

// ─────────── Catálogo público (consumidor) ───────────
router.get('/public/trainers', async (_req: Request, res: Response) => {
  try { ok(res, await trainersService.listActiveTrainers()); } catch (e) { fail(res, e); }
});
router.get('/public/ranking', async (req: Request, res: Response) => {
  try { ok(res, await trainersService.getRanking(Number(req.query.limit) || 10)); } catch (e) { fail(res, e); }
});
router.get('/public/trainers/:idOrHandle', async (req: Request, res: Response) => {
  try {
    const t = await trainersService.getTrainerPublic(req.params.idOrHandle);
    if (!t) { res.status(404).json({ success: false, error: 'Entrenador no encontrado' }); return; }
    ok(res, t);
  } catch (e) { fail(res, e); }
});
router.get('/public/trainers/:id/reviews', async (req: Request, res: Response) => {
  try { ok(res, await trainersService.listTrainerReviews(req.params.id, Number(req.query.limit) || 20)); } catch (e) { fail(res, e); }
});

// ─────────── Contratación / Programa (consumidor autenticado, T3) ───────────
// Crea el booking (congela snapshot) y devuelve el checkout de Wompi para pagar.
router.post('/bookings', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.userId;
    const booking = await trainersService.createBooking(userId, String(req.body?.offerId || ''));
    const co = await createCheckout({
      context: 'coach_booking', contextId: booking.id, tenantId: null,
      amountInCents: 0, // se resuelve del booking en el servidor
      redirectUrl: `${String(req.body?.origin || '').replace(/\/$/, '')}/pago/resultado`,
      customerEmail: req.user!.email || undefined,
    });
    ok(res, { bookingId: booking.id, amountCop: booking.amountCop, checkoutUrl: co.checkoutUrl }, 201);
  } catch (e) { fail(res, e); }
});

router.get('/bookings/active', authenticate, async (req: AuthRequest, res: Response) => {
  try { ok(res, await trainersService.getActiveProgram(req.user!.userId)); } catch (e) { fail(res, e); }
});

router.get('/bookings/mine', authenticate, async (req: AuthRequest, res: Response) => {
  try { ok(res, await trainersService.listMyBookings(req.user!.userId)); } catch (e) { fail(res, e); }
});

// Reseñas (consumidor): programas pagados sin reseñar + crear reseña.
router.get('/bookings/reviewable', authenticate, async (req: AuthRequest, res: Response) => {
  try { ok(res, await trainersService.listReviewableBookings(req.user!.userId)); } catch (e) { fail(res, e); }
});
router.post('/reviews', authenticate, async (req: AuthRequest, res: Response) => {
  try { ok(res, await trainersService.createReview(req.user!.userId, req.body || {}), 201); } catch (e) { fail(res, e); }
});

// Feed del programa (consumidor): ver + responder.
router.get('/bookings/:id/feed', authenticate, async (req: AuthRequest, res: Response) => {
  try { ok(res, await trainersService.getBookingFeed(req.params.id, { userId: req.user!.userId })); } catch (e) { fail(res, e); }
});
router.post('/bookings/:id/feed', authenticate, async (req: AuthRequest, res: Response) => {
  try { ok(res, await trainersService.userReplyFeed(req.user!.userId, req.params.id, String(req.body?.body || '')), 201); } catch (e) { fail(res, e); }
});

// ─────────── Coach Layer: clientes + feed (entrenador, T4) ───────────
router.get('/me/clients', authenticateTrainer, async (req: TrReq, res: Response) => {
  try { ok(res, await trainersService.coachListClients(req.trainerId!)); } catch (e) { fail(res, e); }
});
router.get('/me/clients/:bookingId/feed', authenticateTrainer, async (req: TrReq, res: Response) => {
  try { ok(res, await trainersService.getBookingFeed(req.params.bookingId, { trainerId: req.trainerId })); } catch (e) { fail(res, e); }
});
router.post('/me/clients/:bookingId/feed', authenticateTrainer, async (req: TrReq, res: Response) => {
  try { ok(res, await trainersService.coachPostFeed(req.trainerId!, req.params.bookingId, req.body || {}), 201); } catch (e) { fail(res, e); }
});

// ─────────── Wallet / Payouts del coach (T5) ───────────
router.get('/me/wallet', authenticateTrainer, async (req: TrReq, res: Response) => {
  try { ok(res, await trainersService.getWallet(req.trainerId!)); } catch (e) { fail(res, e); }
});
router.get('/me/commissions', authenticateTrainer, async (req: TrReq, res: Response) => {
  try { ok(res, await trainersService.listMyCommissions(req.trainerId!)); } catch (e) { fail(res, e); }
});
router.get('/me/withdrawals', authenticateTrainer, async (req: TrReq, res: Response) => {
  try { ok(res, await trainersService.listMyWithdrawals(req.trainerId!)); } catch (e) { fail(res, e); }
});
router.post('/me/withdrawals', authenticateTrainer, async (req: TrReq, res: Response) => {
  try { ok(res, await trainersService.requestWithdrawal(req.trainerId!, req.body || {}), 201); } catch (e) { fail(res, e); }
});

// ─────────── Superadmin: gestión + retiros de coaches ───────────
const sa = [authenticate, authorize('superadmin')];

router.get('/admin/trainers', ...sa, async (_req: AuthRequest, res: Response) => {
  try { ok(res, await trainersService.adminListTrainers()); } catch (e) { fail(res, e); }
});
router.patch('/admin/trainers/:id/status', ...sa, async (req: AuthRequest, res: Response) => {
  try { ok(res, await trainersService.adminSetTrainerStatus(req.params.id, req.body?.status)); } catch (e) { fail(res, e); }
});
router.get('/admin/withdrawals', ...sa, async (req: AuthRequest, res: Response) => {
  try { ok(res, await trainersService.adminListWithdrawals(req.query.status as string | undefined)); } catch (e) { fail(res, e); }
});
router.patch('/admin/withdrawals/:id', ...sa, async (req: AuthRequest, res: Response) => {
  try {
    const st = req.body?.status;
    if (!['processing', 'paid', 'rejected'].includes(st)) { fail(res, new Error('Estado inválido')); return; }
    await trainersService.adminProcessWithdrawal(req.params.id, st, req.user!.userId, req.body?.note);
    ok(res, { id: req.params.id, status: st });
  } catch (e) { fail(res, e); }
});

export default router;
