import pool from '../../config/database';

export interface FeaturedProduct {
  id: string;
  name: string;
  salePrice: number;
  category: string | null;
  imageUrl: string | null;
}

export interface DynamicContext {
  storeName: string;
  storeSlug: string;
  storePhone: string | null;
  storeEmail: string | null;
  storeAddress: string | null;
  storeSchedule: string | null;
  storeWhatsapp: string | null;
  storeInstagram: string | null;
  paymentMethods: string | null;
  categories: string[];
  services: ServiceInfo[];
  featuredProducts: FeaturedProduct[];
  reservationsEnabled: boolean;
  reservationOpenTime?: string;
  reservationCloseTime?: string;
  reservationOccasions?: string[];
}

interface ServiceInfo {
  name: string;
  price: number;
  priceType: string;
  durationMinutes: number | null;
  serviceType: string;
}

function parseJsonArray(raw: unknown): string[] {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw as string[];
  if (typeof raw === 'string') {
    try { return JSON.parse(raw); } catch { return []; }
  }
  return [];
}

export async function buildDynamicContext(tenantId: string): Promise<DynamicContext> {
  const [[storeRows], [tenantRows], [catRows], [svcRows], [prodRows]] = await Promise.all([
    pool.query(
      `SELECT name, phone, email, address, schedule, social_whatsapp, social_instagram, payment_methods
       FROM store_info WHERE tenant_id = ? LIMIT 1`,
      [tenantId]
    ) as Promise<any>,
    pool.query(
      `SELECT slug, reservations_enabled, reservations_open_time, reservations_close_time,
              reservations_slot_minutes, reservations_occasions
       FROM tenants WHERE id = ? LIMIT 1`,
      [tenantId]
    ) as Promise<any>,
    pool.query(
      `SELECT name FROM categories WHERE tenant_id = ? AND hidden_in_store = 0 ORDER BY name LIMIT 20`,
      [tenantId]
    ) as Promise<any>,
    pool.query(
      `SELECT name, price, price_type, duration_minutes, service_type
       FROM services WHERE tenant_id = ? AND is_published = 1 AND is_active = 1
       ORDER BY sort_order ASC LIMIT 10`,
      [tenantId]
    ) as Promise<any>,
    pool.query(
      `SELECT id, name, sale_price AS salePrice, category, image_url AS imageUrl
       FROM products
       WHERE tenant_id = ? AND published_in_store = 1 AND stock > 0
       ORDER BY created_at DESC LIMIT 20`,
      [tenantId]
    ) as Promise<any>,
  ]);

  const store = (storeRows as any[])?.[0] || {};
  const tenant = (tenantRows as any[])?.[0] || {};

  return {
    storeName: store.name || '',
    storeSlug: tenant.slug || '',
    storePhone: store.phone || null,
    storeEmail: store.email || null,
    storeAddress: store.address || null,
    storeSchedule: store.schedule || null,
    storeWhatsapp: store.social_whatsapp || null,
    storeInstagram: store.social_instagram || null,
    paymentMethods: store.payment_methods || null,
    categories: ((catRows as any[]) || []).map((r: any) => r.name),
    services: ((svcRows as any[]) || []).map((s: any) => ({
      name: s.name,
      price: Number(s.price),
      priceType: s.price_type,
      durationMinutes: s.duration_minutes || null,
      serviceType: s.service_type,
    })),
    featuredProducts: ((prodRows as any[]) || []).map((p: any) => ({
      id: String(p.id),
      name: p.name,
      salePrice: Number(p.salePrice),
      category: p.category || null,
      imageUrl: p.imageUrl || null,
    })),
    reservationsEnabled: !!tenant.reservations_enabled,
    reservationOpenTime: tenant.reservations_open_time || undefined,
    reservationCloseTime: tenant.reservations_close_time || undefined,
    reservationOccasions: parseJsonArray(tenant.reservations_occasions),
  };
}
