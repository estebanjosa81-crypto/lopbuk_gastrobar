import { v4 as uuidv4 } from 'uuid';
import { db } from '../../config';
import { AppError } from '../../common/middleware';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

export type ReviewStatus = 'pendiente' | 'aprobado' | 'rechazado';

interface ReviewRow extends RowDataPacket {
  id: string;
  tenant_id: string;
  product_id: string;
  product_name: string;
  reviewer_name: string;
  reviewer_email: string | null;
  rating: number;
  title: string | null;
  body: string | null;
  image_url_1: string | null;
  image_url_2: string | null;
  status: ReviewStatus;
  reply: string | null;
  created_at: Date;
  updated_at: Date;
}

export class ReviewsService {

  async findAll(tenantId: string, filters?: {
    productId?: string;
    status?: ReviewStatus;
  }) {
    let sql = `
      SELECT r.*, p.name AS product_name
      FROM product_reviews r
      JOIN products p ON r.product_id = p.id
      WHERE r.tenant_id = ?
    `;
    const params: any[] = [tenantId];

    if (filters?.productId) { sql += ' AND r.product_id = ?'; params.push(filters.productId); }
    if (filters?.status)    { sql += ' AND r.status = ?';     params.push(filters.status); }

    sql += ' ORDER BY r.created_at DESC';

    const [rows] = await db.execute<ReviewRow[]>(sql, params);
    return rows.map(this.mapReview);
  }

  // Public endpoint: only approved reviews for a product
  async findPublic(tenantId: string, productId: string) {
    const [rows] = await db.execute<ReviewRow[]>(
      `SELECT r.*, p.name AS product_name
       FROM product_reviews r
       JOIN products p ON r.product_id = p.id
       WHERE r.tenant_id = ? AND r.product_id = ? AND r.status = 'aprobado'
       ORDER BY r.created_at DESC`,
      [tenantId, productId]
    );
    return rows.map(this.mapReview);
  }

  async create(tenantId: string, data: {
    productId: string;
    reviewerName: string;
    reviewerEmail?: string;
    rating: number;
    title?: string;
    body?: string;
    imageUrl1?: string;
    imageUrl2?: string;
  }) {
    // Validate product exists in tenant and is published
    const [prodRows] = await db.execute<RowDataPacket[]>(
      'SELECT id FROM products WHERE id = ? AND tenant_id = ?',
      [data.productId, tenantId]
    );
    if (prodRows.length === 0) throw new AppError('Producto no encontrado', 404);

    const id = uuidv4();
    await db.execute<ResultSetHeader>(
      `INSERT INTO product_reviews
       (id, tenant_id, product_id, reviewer_name, reviewer_email, rating, title, body, image_url_1, image_url_2)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id, tenantId, data.productId, data.reviewerName,
        data.reviewerEmail || null, data.rating,
        data.title || null, data.body || null,
        data.imageUrl1 || null, data.imageUrl2 || null,
      ]
    );

    return this.findById(tenantId, id);
  }

  async update(tenantId: string, id: string, data: {
    reviewerName?: string;
    reviewerEmail?: string;
    rating?: number;
    title?: string;
    body?: string;
    imageUrl1?: string | null;
    imageUrl2?: string | null;
  }) {
    await this.findById(tenantId, id); // throws 404 if not found

    const sets: string[] = [];
    const params: any[] = [];

    if (data.reviewerName !== undefined) { sets.push('reviewer_name = ?'); params.push(data.reviewerName); }
    if (data.reviewerEmail !== undefined) { sets.push('reviewer_email = ?'); params.push(data.reviewerEmail || null); }
    if (data.rating !== undefined) { sets.push('rating = ?'); params.push(data.rating); }
    if (data.title !== undefined) { sets.push('title = ?'); params.push(data.title || null); }
    if (data.body !== undefined) { sets.push('body = ?'); params.push(data.body || null); }
    if (data.imageUrl1 !== undefined) { sets.push('image_url_1 = ?'); params.push(data.imageUrl1); }
    if (data.imageUrl2 !== undefined) { sets.push('image_url_2 = ?'); params.push(data.imageUrl2); }

    if (sets.length === 0) return this.findById(tenantId, id);

    params.push(id, tenantId);
    await db.execute(
      `UPDATE product_reviews SET ${sets.join(', ')} WHERE id = ? AND tenant_id = ?`,
      params
    );

    return this.findById(tenantId, id);
  }

  async updateStatus(tenantId: string, id: string, status: ReviewStatus, reply?: string) {
    await this.findById(tenantId, id);
    await db.execute(
      'UPDATE product_reviews SET status = ?, reply = ? WHERE id = ? AND tenant_id = ?',
      [status, reply !== undefined ? reply : null, id, tenantId]
    );
    return this.findById(tenantId, id);
  }

  async delete(tenantId: string, id: string) {
    const [result] = await db.execute<ResultSetHeader>(
      'DELETE FROM product_reviews WHERE id = ? AND tenant_id = ?',
      [id, tenantId]
    );
    if (result.affectedRows === 0) throw new AppError('Reseña no encontrada', 404);
  }

  async findById(tenantId: string, id: string) {
    const [rows] = await db.execute<ReviewRow[]>(
      `SELECT r.*, p.name AS product_name
       FROM product_reviews r
       JOIN products p ON r.product_id = p.id
       WHERE r.id = ? AND r.tenant_id = ?`,
      [id, tenantId]
    );
    if (rows.length === 0) throw new AppError('Reseña no encontrada', 404);
    return this.mapReview(rows[0]);
  }

  private mapReview(row: ReviewRow) {
    return {
      id: row.id,
      tenantId: row.tenant_id,
      productId: row.product_id,
      productName: row.product_name,
      reviewerName: row.reviewer_name,
      reviewerEmail: row.reviewer_email,
      rating: row.rating,
      title: row.title,
      body: row.body,
      imageUrl1: row.image_url_1,
      imageUrl2: row.image_url_2,
      status: row.status,
      reply: row.reply,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}

export const reviewsService = new ReviewsService();
