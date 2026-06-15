/**
 * community.routes.ts — COMUNIDAD DAIMUZ.
 *
 * Feed público tipo Instagram/blog gestionado por usuarios con rol
 * `comunidad_admin` (globales, tenant_id = NULL). Los posts pueden adjuntar
 * productos de tiendas públicas como "anuncios".
 *
 * Grupos de rutas:
 *   PÚBLICO            → feed, post, comentarios, búsqueda de productos
 *   USUARIO (auth)     → reaccionar (like/save), comentar
 *   COMUNIDAD_ADMIN    → CRUD de posts, moderar comentarios
 *   SUPERADMIN         → crear/listar comunidad_admin + métricas
 */
import { Router, Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import pool from '../../config/database';
import { config } from '../../config';
import { JWTPayload } from '../../common/types';
import { authenticate, authorize, AuthRequest } from '../../common/middleware';
import { createNotification } from '../notifications/notifications.routes';

const router: ReturnType<typeof Router> = Router();

const CATEGORIES = ['noticia', 'video', 'tutorial', 'app', 'oferta'];

const ok = (res: Response, data: any, code = 200) => res.status(code).json({ success: true, data });
const fail = (res: Response, e: any, msg: string, code?: number) => {
  const c = code || e?.statusCode || 500;
  if (c === 500) console.error(`${msg}:`, e);
  res.status(c).json({ success: false, error: e?.message || msg });
};

/** Auth opcional: adjunta req.user si hay token válido. */
const optionalAuth = (req: AuthRequest, _res: Response, next: NextFunction) => {
  const token = req.cookies?.authToken ||
    (req.headers.authorization?.startsWith('Bearer ') ? req.headers.authorization.split(' ')[1] : undefined);
  if (token) { try { req.user = jwt.verify(token, config.jwt.secret) as JWTPayload; } catch { /* anónimo */ } }
  next();
};

const ADMIN = [authenticate, authorize('comunidad_admin')];
const SUPER = [authenticate, authorize('superadmin')];

// ── helpers de carga ─────────────────────────────────────────────────────────
async function loadMedia(postIds: string[]) {
  if (!postIds.length) return {} as Record<string, any[]>;
  const [rows] = (await pool.query(
    `SELECT id, post_id, media_type AS mediaType, url, order_index AS orderIndex
       FROM community_post_media WHERE post_id IN (?) ORDER BY order_index ASC`, [postIds]
  )) as any;
  return groupBy(rows, 'post_id');
}
async function loadAds(postIds: string[]) {
  if (!postIds.length) return {} as Record<string, any[]>;
  const [rows] = (await pool.query(
    `SELECT a.id, a.post_id, a.product_id AS productId, a.tenant_id AS tenantId, a.order_index AS orderIndex,
            p.name, p.sale_price AS salePrice, p.image_url AS imageUrl,
            p.is_on_offer AS isOnOffer, p.offer_price AS offerPrice,
            t.slug AS storeSlug, t.name AS storeName
       FROM community_post_ads a
       JOIN products p ON p.id = a.product_id
       LEFT JOIN tenants t ON t.id = a.tenant_id
      WHERE a.post_id IN (?) ORDER BY a.order_index ASC`, [postIds]
  )) as any;
  return groupBy(rows.map((r: any) => ({ ...r, isOnOffer: !!r.isOnOffer })), 'post_id');
}
async function userReactions(postIds: string[], userId?: string, deviceId?: string) {
  if (!postIds.length) return {} as Record<string, { liked: boolean; saved: boolean }>;
  let rows: any[] = [];
  if (userId) {
    [rows] = (await pool.query(
      `SELECT post_id, type FROM community_reactions WHERE user_id = ? AND post_id IN (?)`, [userId, postIds]
    )) as any;
  } else if (deviceId) {
    // Anónimo: solo el like se rastrea por dispositivo (guardar requiere sesión).
    [rows] = (await pool.query(
      `SELECT post_id, type FROM community_reactions WHERE device_id = ? AND type = 'like' AND post_id IN (?)`, [deviceId, postIds]
    )) as any;
  } else {
    return {} as Record<string, { liked: boolean; saved: boolean }>;
  }
  const map: Record<string, { liked: boolean; saved: boolean }> = {};
  for (const r of rows) { (map[r.post_id] ||= { liked: false, saved: false }); if (r.type === 'like') map[r.post_id].liked = true; else map[r.post_id].saved = true; }
  return map;
}
// ── Ajustes globales de la comunidad ─────────────────────────────────────────
async function getCommunitySetting(key: string, fallback = ''): Promise<string> {
  try {
    const [rows] = (await pool.query('SELECT setting_value AS v FROM community_settings WHERE setting_key = ? LIMIT 1', [key])) as any;
    return rows && rows[0] ? (rows[0].v ?? fallback) : fallback;
  } catch { return fallback; }
}
async function likeRequiresLogin(): Promise<boolean> {
  return (await getCommunitySetting('like_requires_login', '0')) === '1';
}

function groupBy(rows: any[], key: string) {
  return rows.reduce((acc: Record<string, any[]>, r: any) => { (acc[r[key]] ||= []).push(r); return acc; }, {});
}
function mapPost(r: any, media: any[], ads: any[], react?: { liked: boolean; saved: boolean }) {
  return {
    id: r.id, title: r.title, body: r.body, category: r.category, status: r.status,
    coverUrl: r.cover_url, author: r.author, authorAvatar: r.authorAvatar,
    likes: Number(r.likes_count || 0), saves: Number(r.saves_count || 0), comments: Number(r.comments_count || 0),
    shares: Number(r.shares_count || 0),
    createdAt: r.created_at, publishedAt: r.published_at,
    media: media || [], ads: ads || [],
    liked: react?.liked || false, saved: react?.saved || false,
  };
}

// ════════════════════════ AJUSTES ════════════════════════

// Ajustes públicos de la comunidad (los lee el feed).
router.get('/settings', async (_req: Request, res: Response) => {
  try { ok(res, { likeRequiresLogin: await likeRequiresLogin() }); }
  catch (e) { fail(res, e, 'Error al obtener ajustes'); }
});

// Actualizar ajustes (comunidad_admin).
router.put('/settings', ADMIN, async (req: AuthRequest, res: Response) => {
  try {
    if (req.body?.likeRequiresLogin !== undefined) {
      const v = req.body.likeRequiresLogin ? '1' : '0';
      await pool.query(
        `INSERT INTO community_settings (setting_key, setting_value) VALUES ('like_requires_login', ?)
         ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)`, [v]
      );
    }
    ok(res, { likeRequiresLogin: await likeRequiresLogin() });
  } catch (e) { fail(res, e, 'Error al guardar ajustes'); }
});

// ════════════════════════ PÚBLICO ════════════════════════

// Buscar productos de tiendas públicas (para adjuntar como anuncio).
// (antes de /posts/:id para no chocar como :id)
router.get('/products/public', optionalAuth, async (req: Request, res: Response) => {
  try {
    const q = String((req.query.q as string) || '').trim();
    const limit = Math.min(40, Math.max(1, parseInt(String(req.query.limit || '24'), 10)));
    const params: any[] = [];
    let search = '';
    if (q) { search = 'AND (p.name LIKE ? OR p.brand LIKE ?)'; params.push(`%${q}%`, `%${q}%`); }
    const [rows] = (await pool.query(
      `SELECT p.id, p.name, p.brand, p.sale_price AS salePrice, p.image_url AS imageUrl,
              p.is_on_offer AS isOnOffer, p.offer_price AS offerPrice,
              p.tenant_id AS tenantId, t.slug AS storeSlug, t.name AS storeName
         FROM products p JOIN tenants t ON t.id = p.tenant_id
        WHERE p.published_in_store = 1 AND p.stock > 0 AND t.status = 'activo' ${search}
        ORDER BY p.updated_at DESC LIMIT ?`,
      [...params, limit]
    )) as any;
    ok(res, (rows || []).map((r: any) => ({ ...r, isOnOffer: !!r.isOnOffer })));
  } catch (e) { fail(res, e, 'Error al buscar productos'); }
});

// Feed público (paginado, con filtros category / sort / q)
router.get('/posts', optionalAuth, async (req: AuthRequest, res: Response) => {
  try {
    const page = Math.max(1, parseInt(String(req.query.page || '1'), 10));
    const limit = Math.min(30, Math.max(1, parseInt(String(req.query.limit || '10'), 10)));
    const offset = (page - 1) * limit;
    const sort = String(req.query.sort || 'recent');
    const category = String(req.query.category || '');
    const q = String(req.query.q || '').trim();

    const where: string[] = ["p.status = 'published'", 'p.is_active = 1'];
    const params: any[] = [];
    if (CATEGORIES.includes(category)) { where.push('p.category = ?'); params.push(category); }
    if (q) { where.push('(p.title LIKE ? OR p.body LIKE ?)'); params.push(`%${q}%`, `%${q}%`); }
    const order = sort === 'popular' ? 'p.likes_count DESC, p.published_at DESC' : 'p.published_at DESC';

    const [rows] = (await pool.query(
      `SELECT p.*, u.name AS author, u.avatar AS authorAvatar
         FROM community_posts p LEFT JOIN users u ON u.id = p.author_id
        WHERE ${where.join(' AND ')} ORDER BY ${order} LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    )) as any;

    const ids = rows.map((r: any) => r.id);
    const [media, ads, react] = await Promise.all([loadMedia(ids), loadAds(ids), userReactions(ids, req.user?.userId, req.query.did as string)]);
    const [[{ total }]] = (await pool.query(
      `SELECT COUNT(*) AS total FROM community_posts p WHERE ${where.join(' AND ')}`, params
    )) as any;

    ok(res, {
      data: rows.map((r: any) => mapPost(r, media[r.id], ads[r.id], react[r.id])),
      page, pageSize: limit, total: Number(total), hasMore: offset + rows.length < Number(total),
    });
  } catch (e) { fail(res, e, 'Error al obtener el feed'); }
});

// Post individual
router.get('/posts/:id', optionalAuth, async (req: AuthRequest, res: Response) => {
  try {
    const [rows] = (await pool.query(
      `SELECT p.*, u.name AS author, u.avatar AS authorAvatar
         FROM community_posts p LEFT JOIN users u ON u.id = p.author_id
        WHERE p.id = ? AND p.is_active = 1 LIMIT 1`, [req.params.id]
    )) as any;
    if (!rows.length) return fail(res, null, 'Publicación no encontrada', 404);
    const r = rows[0];
    if (r.status !== 'published' && req.user?.userId !== r.author_id && req.user?.role !== 'comunidad_admin')
      return fail(res, null, 'Publicación no disponible', 404);
    const [media, ads, react] = await Promise.all([loadMedia([r.id]), loadAds([r.id]), userReactions([r.id], req.user?.userId, req.query.did as string)]);
    ok(res, mapPost(r, media[r.id], ads[r.id], react[r.id]));
  } catch (e) { fail(res, e, 'Error al obtener la publicación'); }
});

// Comentarios de un post (públicos)
router.get('/posts/:id/comments', async (req: Request, res: Response) => {
  try {
    const [rows] = (await pool.query(
      `SELECT c.id, c.post_id, c.user_id AS userId, c.body, c.parent_id AS parentId, c.created_at AS createdAt,
              COALESCE(u.name, c.author_name) AS user, u.avatar
         FROM community_comments c LEFT JOIN users u ON u.id = c.user_id
        WHERE c.post_id = ? AND c.is_active = 1 ORDER BY c.created_at ASC`, [req.params.id]
    )) as any;
    ok(res, rows);
  } catch (e) { fail(res, e, 'Error al obtener comentarios'); }
});

// ════════════════════════ INTERACCIÓN ════════════════════════

/**
 * Reaccionar.
 *  - LIKE: permitido SIN sesión (el sistema lo cuenta). Con sesión se registra
 *    por usuario (toggle real); anónimo respeta el estado deseado del cliente
 *    (body.active) para sumar/restar y evitar inflar el contador.
 *  - SAVE (guardar): SIEMPRE requiere sesión.
 */
router.post('/posts/:id/react', optionalAuth, async (req: AuthRequest, res: Response) => {
  try {
    const type = req.body?.type === 'save' ? 'save' : 'like';
    const postId = req.params.id;
    const col = type === 'like' ? 'likes_count' : 'saves_count';
    const userId = req.user?.userId;

    if (type === 'save' && !userId) return fail(res, null, 'Inicia sesión para guardar', 401);
    if (type === 'like' && !userId && await likeRequiresLogin()) return fail(res, null, 'Inicia sesión para dar like', 401);

    let active: boolean;
    if (userId) {
      // Usuario autenticado → toggle por usuario.
      const [exists] = (await pool.query(
        'SELECT id FROM community_reactions WHERE post_id = ? AND user_id = ? AND type = ?', [postId, userId, type]
      )) as any;
      if (exists.length) {
        await pool.query('DELETE FROM community_reactions WHERE id = ?', [exists[0].id]);
        await pool.query(`UPDATE community_posts SET ${col} = GREATEST(${col} - 1, 0) WHERE id = ?`, [postId]);
        active = false;
      } else {
        await pool.query('INSERT INTO community_reactions (id, post_id, user_id, type) VALUES (?,?,?,?)', [uuidv4(), postId, userId, type]);
        await pool.query(`UPDATE community_posts SET ${col} = ${col} + 1 WHERE id = ?`, [postId]);
        active = true;
      }
    } else {
      // Anónimo (solo like): toggle real por DISPOSITIVO (1 like por dispositivo).
      const deviceId = String(req.body?.deviceId || '').slice(0, 64);
      if (!deviceId) {
        // Sin device_id no podemos deduplicar: suma simple (caso borde).
        await pool.query(`UPDATE community_posts SET ${col} = ${col} + 1 WHERE id = ?`, [postId]); active = true;
      } else {
        const [exists] = (await pool.query(
          `SELECT id FROM community_reactions WHERE post_id = ? AND device_id = ? AND type = 'like'`, [postId, deviceId]
        )) as any;
        if (exists.length) {
          await pool.query('DELETE FROM community_reactions WHERE id = ?', [exists[0].id]);
          await pool.query(`UPDATE community_posts SET ${col} = GREATEST(${col} - 1, 0) WHERE id = ?`, [postId]);
          active = false;
        } else {
          await pool.query('INSERT INTO community_reactions (id, post_id, user_id, device_id, type) VALUES (?,?,NULL,?,?)', [uuidv4(), postId, deviceId, 'like']);
          await pool.query(`UPDATE community_posts SET ${col} = ${col} + 1 WHERE id = ?`, [postId]);
          active = true;
        }
      }
    }
    const [[counts]] = (await pool.query('SELECT likes_count AS likes, saves_count AS saves FROM community_posts WHERE id = ?', [postId])) as any;
    ok(res, { type, active, likes: Number(counts?.likes || 0), saves: Number(counts?.saves || 0) });
  } catch (e) { fail(res, e, 'Error al reaccionar'); }
});

// Compartir (cuenta cada vez que alguien comparte; sin sesión).
router.post('/posts/:id/share', optionalAuth, async (req: Request, res: Response) => {
  try {
    await pool.query('UPDATE community_posts SET shares_count = shares_count + 1 WHERE id = ?', [req.params.id]);
    const [[c]] = (await pool.query('SELECT shares_count AS shares FROM community_posts WHERE id = ?', [req.params.id])) as any;
    ok(res, { shares: Number(c?.shares || 0) });
  } catch (e) { fail(res, e, 'Error al compartir'); }
});

// Comentar
router.post('/posts/:id/comments', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const body = String(req.body?.body || '').trim();
    if (!body) return fail(res, null, 'El comentario es requerido', 400);
    if (body.length > 1000) return fail(res, null, 'Comentario demasiado largo', 400);
    const id = uuidv4();
    await pool.query(
      'INSERT INTO community_comments (id, post_id, user_id, body, parent_id) VALUES (?,?,?,?,?)',
      [id, req.params.id, req.user!.userId, body, req.body?.parentId || null]
    );
    await pool.query('UPDATE community_posts SET comments_count = comments_count + 1 WHERE id = ?', [req.params.id]);
    const [rows] = (await pool.query(
      `SELECT c.id, c.post_id, c.user_id AS userId, c.body, c.parent_id AS parentId, c.created_at AS createdAt, COALESCE(u.name, c.author_name) AS user, u.avatar
         FROM community_comments c LEFT JOIN users u ON u.id = c.user_id WHERE c.id = ?`, [id]
    )) as any;
    ok(res, rows[0], 201);
  } catch (e) { fail(res, e, 'Error al comentar'); }
});

// ════════════════════════ COMUNIDAD_ADMIN ════════════════════════

// Listar mis publicaciones (todos los estados)
router.get('/admin/posts', ADMIN, async (req: AuthRequest, res: Response) => {
  try {
    const [rows] = (await pool.query(
      `SELECT p.*, u.name AS author, u.avatar AS authorAvatar FROM community_posts p LEFT JOIN users u ON u.id = p.author_id
        WHERE p.author_id = ? AND p.is_active = 1 ORDER BY p.created_at DESC`, [req.user!.userId]
    )) as any;
    const ids = rows.map((r: any) => r.id);
    const [media, ads] = await Promise.all([loadMedia(ids), loadAds(ids)]);
    ok(res, rows.map((r: any) => mapPost(r, media[r.id], ads[r.id])));
  } catch (e) { fail(res, e, 'Error al listar publicaciones'); }
});

async function saveMediaAndAds(postId: string, media?: any[], ads?: any[]) {
  if (Array.isArray(media)) {
    await pool.query('DELETE FROM community_post_media WHERE post_id = ?', [postId]);
    for (const [i, m] of media.entries()) {
      if (!m?.url) continue;
      await pool.query('INSERT INTO community_post_media (id, post_id, media_type, url, order_index) VALUES (?,?,?,?,?)',
        [uuidv4(), postId, m.mediaType || 'image', m.url, i]);
    }
  }
  if (Array.isArray(ads)) {
    await pool.query('DELETE FROM community_post_ads WHERE post_id = ?', [postId]);
    for (const [i, a] of ads.entries()) {
      if (!a?.productId || !a?.tenantId) continue;
      await pool.query('INSERT INTO community_post_ads (id, post_id, product_id, tenant_id, order_index) VALUES (?,?,?,?,?)',
        [uuidv4(), postId, a.productId, a.tenantId, i]);
    }
  }
}

/** Avisa a cada comercio cuyo producto fue adjuntado como anuncio. */
async function notifyAdTenants(ads: any[] | undefined, postTitle: string) {
  if (!Array.isArray(ads) || ads.length === 0) return;
  const productIds = ads.map(a => a?.productId).filter(Boolean);
  if (!productIds.length) return;
  try {
    // Nombre real del producto + tenant dueño (no confiamos en el body).
    const [rows] = (await pool.query(
      'SELECT id, name, tenant_id AS tenantId FROM products WHERE id IN (?)', [productIds]
    )) as any;
    const seen = new Set<string>();
    for (const p of rows || []) {
      const key = `${p.tenantId}:${p.id}`;
      if (seen.has(key)) continue; seen.add(key);
      await createNotification(p.tenantId, {
        type: 'community_ad',
        title: 'Tu producto fue destacado en la Comunidad',
        body: `“${p.name}” aparece como anuncio en la publicación “${postTitle}”.`,
        link: '/comunidad',
      });
    }
  } catch (e) { console.error('notifyAdTenants error:', e); }
}

// Crear post
router.post('/posts', ADMIN, async (req: AuthRequest, res: Response) => {
  try {
    const b = req.body || {};
    if (!b.title?.trim()) return fail(res, null, 'El título es requerido', 400);
    const category = CATEGORIES.includes(b.category) ? b.category : 'noticia';
    const status = b.status === 'published' ? 'published' : 'draft';
    const id = uuidv4();
    await pool.query(
      `INSERT INTO community_posts (id, author_id, title, body, category, status, cover_url, published_at)
       VALUES (?,?,?,?,?,?,?,?)`,
      [id, req.user!.userId, b.title.trim(), b.body || null, category, status, b.coverUrl || null, status === 'published' ? new Date() : null]
    );
    await saveMediaAndAds(id, b.media, b.ads);
    // Notifica a los comercios solo si el post se publica con anuncios.
    if (status === 'published') await notifyAdTenants(b.ads, b.title.trim());
    ok(res, { id }, 201);
  } catch (e) { fail(res, e, 'Error al crear la publicación'); }
});

// Editar post
router.put('/posts/:id', ADMIN, async (req: AuthRequest, res: Response) => {
  try {
    const [own] = (await pool.query('SELECT id, status FROM community_posts WHERE id = ? AND author_id = ? AND is_active = 1', [req.params.id, req.user!.userId])) as any;
    if (!own.length) return fail(res, null, 'Publicación no encontrada', 404);

    const b = req.body || {};
    const sets: string[] = []; const params: any[] = [];
    if (b.title !== undefined) { sets.push('title = ?'); params.push(b.title); }
    if (b.body !== undefined) { sets.push('body = ?'); params.push(b.body); }
    if (b.category !== undefined && CATEGORIES.includes(b.category)) { sets.push('category = ?'); params.push(b.category); }
    if (b.coverUrl !== undefined) { sets.push('cover_url = ?'); params.push(b.coverUrl); }
    // Overrides manuales del admin (contadores)
    if (b.likesCount !== undefined) { sets.push('likes_count = ?'); params.push(Math.max(0, Number(b.likesCount) || 0)); }
    if (b.sharesCount !== undefined) { sets.push('shares_count = ?'); params.push(Math.max(0, Number(b.sharesCount) || 0)); }
    if (b.savesCount !== undefined) { sets.push('saves_count = ?'); params.push(Math.max(0, Number(b.savesCount) || 0)); }
    if (b.status !== undefined) {
      const status = b.status === 'published' ? 'published' : 'draft';
      sets.push('status = ?'); params.push(status);
      if (status === 'published' && own[0].status !== 'published') { sets.push('published_at = ?'); params.push(new Date()); }
    }
    if (sets.length) { params.push(req.params.id); await pool.query(`UPDATE community_posts SET ${sets.join(', ')} WHERE id = ?`, params); }
    await saveMediaAndAds(req.params.id, b.media, b.ads);

    // Si el post pasa de borrador a publicado, avisa a los comercios de sus anuncios.
    if (b.status === 'published' && own[0].status !== 'published') {
      const [adRows] = (await pool.query('SELECT product_id AS productId FROM community_post_ads WHERE post_id = ?', [req.params.id])) as any;
      const [[titleRow]] = (await pool.query('SELECT title FROM community_posts WHERE id = ?', [req.params.id])) as any;
      await notifyAdTenants(adRows, titleRow?.title || '');
    }
    ok(res, { id: req.params.id });
  } catch (e) { fail(res, e, 'Error al editar la publicación'); }
});

// Inserción masiva de comentarios sintéticos (admin).
// body: { comments: [{ body, author? }] }  ó  { items: ["texto", ...] }
router.post('/posts/:id/comments/bulk', ADMIN, async (req: AuthRequest, res: Response) => {
  try {
    // Verifica que el post sea del propio admin
    const [own] = (await pool.query('SELECT id FROM community_posts WHERE id = ? AND author_id = ? AND is_active = 1', [req.params.id, req.user!.userId])) as any;
    if (!own.length) return fail(res, null, 'Publicación no encontrada', 404);

    const raw = req.body?.comments ?? req.body?.items ?? [];
    if (!Array.isArray(raw) || raw.length === 0) return fail(res, null, 'Sin comentarios para insertar', 400);

    const NAMES = ['Camila', 'Andrés', 'Valentina', 'Sebastián', 'Daniela', 'Mateo', 'Sofía', 'Santiago', 'Luisa', 'Juan', 'Mariana', 'Carlos', 'Paula', 'Felipe', 'Laura'];
    let n = 0;
    for (const item of raw.slice(0, 500)) {
      const body = String(typeof item === 'string' ? item : item?.body || '').trim();
      if (!body) continue;
      const author = (typeof item === 'object' && item?.author ? String(item.author) : NAMES[Math.floor(Math.random() * NAMES.length)]).slice(0, 160);
      await pool.query(
        'INSERT INTO community_comments (id, post_id, user_id, author_name, body) VALUES (?,?,NULL,?,?)',
        [uuidv4(), req.params.id, author, body.slice(0, 1000)]
      );
      n++;
    }
    await pool.query('UPDATE community_posts SET comments_count = comments_count + ? WHERE id = ?', [n, req.params.id]);
    ok(res, { inserted: n }, 201);
  } catch (e) { fail(res, e, 'Error al insertar comentarios'); }
});

// Soft delete
router.delete('/posts/:id', ADMIN, async (req: AuthRequest, res: Response) => {
  try {
    await pool.query('UPDATE community_posts SET is_active = 0 WHERE id = ? AND author_id = ?', [req.params.id, req.user!.userId]);
    ok(res, { deleted: true });
  } catch (e) { fail(res, e, 'Error al eliminar'); }
});

// Moderar comentario (ocultar)
router.delete('/comments/:id', ADMIN, async (req: AuthRequest, res: Response) => {
  try {
    // Solo comentarios de posts del propio admin
    const [r] = (await pool.query(
      `UPDATE community_comments c JOIN community_posts p ON p.id = c.post_id
          SET c.is_active = 0
        WHERE c.id = ? AND p.author_id = ?`, [req.params.id, req.user!.userId]
    )) as any;
    if (r.affectedRows) await pool.query(
      'UPDATE community_posts p JOIN community_comments c ON c.post_id = p.id SET p.comments_count = GREATEST(p.comments_count - 1, 0) WHERE c.id = ?', [req.params.id]
    );
    ok(res, { moderated: true });
  } catch (e) { fail(res, e, 'Error al moderar'); }
});

// Comentarios para moderar (de todos mis posts)
router.get('/admin/comments', ADMIN, async (req: AuthRequest, res: Response) => {
  try {
    const [rows] = (await pool.query(
      `SELECT c.id, c.body, c.created_at AS createdAt, c.post_id AS postId, u.name AS user, p.title AS postTitle
         FROM community_comments c
         JOIN community_posts p ON p.id = c.post_id
         LEFT JOIN users u ON u.id = c.user_id
        WHERE p.author_id = ? AND c.is_active = 1 ORDER BY c.created_at DESC LIMIT 200`, [req.user!.userId]
    )) as any;
    ok(res, rows);
  } catch (e) { fail(res, e, 'Error al obtener comentarios'); }
});

// Estadísticas del admin
router.get('/admin/stats', ADMIN, async (req: AuthRequest, res: Response) => {
  try {
    const [[s]] = (await pool.query(
      `SELECT
         (SELECT COUNT(*) FROM community_posts WHERE author_id = ? AND is_active = 1) AS posts,
         (SELECT COUNT(*) FROM community_posts WHERE author_id = ? AND status = 'published' AND is_active = 1) AS published,
         (SELECT COALESCE(SUM(likes_count),0) FROM community_posts WHERE author_id = ? AND is_active = 1) AS likes,
         (SELECT COALESCE(SUM(saves_count),0) FROM community_posts WHERE author_id = ? AND is_active = 1) AS saves,
         (SELECT COALESCE(SUM(comments_count),0) FROM community_posts WHERE author_id = ? AND is_active = 1) AS comments`,
      [req.user!.userId, req.user!.userId, req.user!.userId, req.user!.userId, req.user!.userId]
    )) as any;
    ok(res, { posts: Number(s.posts), published: Number(s.published), likes: Number(s.likes), saves: Number(s.saves), comments: Number(s.comments) });
  } catch (e) { fail(res, e, 'Error al obtener estadísticas'); }
});

// ════════════════════════ SUPERADMIN ════════════════════════

// Crear usuario comunidad_admin
router.post('/admins', SUPER, async (req: AuthRequest, res: Response) => {
  try {
    const { name, email, password } = req.body || {};
    if (!name || !email || !password) return fail(res, null, 'Nombre, email y contraseña son requeridos', 400);
    if (String(password).length < 6) return fail(res, null, 'La contraseña debe tener al menos 6 caracteres', 400);

    const [dups] = (await pool.query('SELECT id FROM users WHERE email = ?', [email])) as any;
    if (dups.length) return fail(res, null, 'El email ya está registrado', 409);

    const id = uuidv4();
    const hash = await bcrypt.hash(String(password), 10);
    await pool.query(
      `INSERT INTO users (id, tenant_id, email, password, name, role, is_active, can_login) VALUES (?, NULL, ?, ?, ?, 'comunidad_admin', 1, 1)`,
      [id, email, hash, name]
    );
    ok(res, { id, name, email, role: 'comunidad_admin' }, 201);
  } catch (e) { fail(res, e, 'Error al crear el admin de comunidad'); }
});

// Listar admins de comunidad
router.get('/admins', SUPER, async (_req: AuthRequest, res: Response) => {
  try {
    const [rows] = (await pool.query(
      `SELECT u.id, u.name, u.email, u.is_active AS isActive, u.created_at AS createdAt,
              (SELECT COUNT(*) FROM community_posts p WHERE p.author_id = u.id AND p.is_active = 1) AS posts
         FROM users u WHERE u.role = 'comunidad_admin' ORDER BY u.created_at DESC`
    )) as any;
    ok(res, rows.map((r: any) => ({ ...r, isActive: !!r.isActive, posts: Number(r.posts) })));
  } catch (e) { fail(res, e, 'Error al listar admins'); }
});

// Métricas globales de la comunidad
router.get('/superadmin/stats', SUPER, async (_req: AuthRequest, res: Response) => {
  try {
    const [[s]] = (await pool.query(
      `SELECT
         (SELECT COUNT(*) FROM community_posts WHERE status='published' AND is_active=1) AS published,
         (SELECT COUNT(*) FROM community_posts WHERE is_active=1) AS total,
         (SELECT COUNT(*) FROM community_reactions) AS reactions,
         (SELECT COUNT(*) FROM community_comments WHERE is_active=1) AS comments,
         (SELECT COUNT(*) FROM users WHERE role='comunidad_admin') AS admins`
    )) as any;
    ok(res, { published: Number(s.published), total: Number(s.total), reactions: Number(s.reactions), comments: Number(s.comments), admins: Number(s.admins) });
  } catch (e) { fail(res, e, 'Error al obtener métricas'); }
});

export default router;
