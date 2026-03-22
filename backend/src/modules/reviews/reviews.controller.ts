import { Request, Response, NextFunction } from 'express';
import { reviewsService } from './reviews.service';
import { AuthRequest } from '../../common/middleware';

export class ReviewsController {

  // GET /api/reviews — merchant sees all reviews (with optional filters)
  async findAll(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.user!.tenantId!;
      const { productId, status } = req.query as any;
      const data = await reviewsService.findAll(tenantId, { productId, status });
      res.json({ success: true, data });
    } catch (error) { next(error); }
  }

  // GET /api/reviews/public/:tenantId/:productId — public, no auth
  async findPublic(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { tenantId, productId } = req.params;
      const data = await reviewsService.findPublic(tenantId, productId);
      res.json({ success: true, data });
    } catch (error) { next(error); }
  }

  // POST /api/reviews — public: customers submit reviews
  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { tenantId, productId, reviewerName, reviewerEmail, rating, title, body, imageUrl1, imageUrl2 } = req.body;
      const review = await reviewsService.create(tenantId, {
        productId, reviewerName, reviewerEmail, rating, title, body, imageUrl1, imageUrl2,
      });
      res.status(201).json({ success: true, data: review, message: 'Reseña enviada exitosamente' });
    } catch (error) { next(error); }
  }

  // PUT /api/reviews/:id — merchant edits review content
  async update(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.user!.tenantId!;
      const review = await reviewsService.update(tenantId, req.params.id, req.body);
      res.json({ success: true, data: review, message: 'Reseña actualizada' });
    } catch (error) { next(error); }
  }

  // PUT /api/reviews/:id/status — merchant approves/rejects + optional reply
  async updateStatus(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.user!.tenantId!;
      const { status, reply } = req.body;
      const review = await reviewsService.updateStatus(tenantId, req.params.id, status, reply);
      res.json({ success: true, data: review, message: 'Estado actualizado' });
    } catch (error) { next(error); }
  }

  // DELETE /api/reviews/:id — merchant deletes a review
  async delete(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenantId = req.user!.tenantId!;
      await reviewsService.delete(tenantId, req.params.id);
      res.json({ success: true, message: 'Reseña eliminada' });
    } catch (error) { next(error); }
  }
}

export const reviewsController = new ReviewsController();
