/**
 * push.service — Notificaciones Web Push reales.
 * Las claves VAPID se autogeneran en el primer uso y se persisten en
 * platform_settings (KV). `sendToUser` envía a todas las suscripciones del
 * usuario y poda las muertas (404/410). Nunca lanza al flujo origen.
 */
import webpush from 'web-push';
import { v4 as uuidv4 } from 'uuid';
import { RowDataPacket } from 'mysql2';
import { db } from '../../config';

const VAPID_KEY = 'web_push_vapid';
let cached: { publicKey: string; privateKey: string } | null = null;

async function getVapid() {
  if (cached) return cached;
  const [rows]: any = await db.query('SELECT setting_value FROM platform_settings WHERE setting_key = ? LIMIT 1', [VAPID_KEY]);
  const raw = rows?.[0]?.setting_value;
  if (raw) { try { cached = JSON.parse(raw); } catch { cached = null; } }
  if (!cached) {
    cached = webpush.generateVAPIDKeys();
    await db.query('INSERT INTO platform_settings (setting_key, setting_value) VALUES (?, ?) ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)', [VAPID_KEY, JSON.stringify(cached)]);
  }
  webpush.setVapidDetails('mailto:soporte@daimuz.com', cached.publicKey, cached.privateKey);
  return cached;
}

class PushService {
  async getPublicKey(): Promise<string> { return (await getVapid()).publicKey; }

  async saveSubscription(userId: string, sub: any) {
    if (!userId || !sub?.endpoint || !sub?.keys?.p256dh || !sub?.keys?.auth) return { ok: false };
    await db.execute(
      `INSERT INTO push_subscriptions (id, user_id, endpoint, p256dh, auth) VALUES (?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE user_id = VALUES(user_id), p256dh = VALUES(p256dh), auth = VALUES(auth)`,
      [uuidv4(), userId, sub.endpoint, sub.keys.p256dh, sub.keys.auth]
    );
    return { ok: true };
  }

  /** Envía una notificación a todas las suscripciones del usuario. Defensivo. */
  async sendToUser(userId: string, payload: { title: string; body: string; url?: string; tag?: string }) {
    try {
      await getVapid();
      const [rows] = await db.execute<RowDataPacket[]>('SELECT id, endpoint, p256dh, auth FROM push_subscriptions WHERE user_id = ?', [userId]);
      const data = JSON.stringify({ title: payload.title, body: payload.body, url: payload.url || '/', tag: payload.tag || 'daimuz' });
      for (const s of rows as any[]) {
        const sub = { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } };
        try {
          await webpush.sendNotification(sub as any, data);
        } catch (e: any) {
          if (e?.statusCode === 404 || e?.statusCode === 410) {
            await db.execute('DELETE FROM push_subscriptions WHERE id = ?', [s.id]).catch(() => {});
          }
        }
      }
    } catch { /* no bloquear el flujo origen */ }
  }
}

export const pushService = new PushService();
