/**
 * consumer-plans.service — Access service + entitlement engine (G2).
 *
 * Núcleo del sistema Consumer Plans / LEGEND:
 *   - redeemCode()      canje transaccional (FOR UPDATE, anti-race, idempotente,
 *                       aplica stack_policy con tope, escribe grant + ledger).
 *   - getUserTier()     estado del usuario (expira perezosamente).
 *   - hasEntitlement()  gate universal por feature.
 *   - admin: createCode / listCodes / updateCode.
 *   - getLegendConfig / saveLegendConfig (platform_settings KV).
 *
 * Convención del proyecto: ids VARCHAR(36) UUID; respuestas API { success, data }.
 */
import crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../../config';
import { AppError } from '../../common/middleware';
import {
  STACK_CAP_DAYS, DEFAULT_LEGEND_CONFIG, LEGEND_MILESTONES,
  type DurationUnit, type StackPolicy, type CodeScope,
  type UserTierState, type LegendConfig,
} from './consumer-plans.types';

// ── Helpers ────────────────────────────────────────────────────────────────
const FREE: UserTierState = { tier: 'free', status: 'free', startedAt: null, expiresAt: null, remainingSeconds: 0, isExpired: true, entitlements: [], powerDays: 0, milestones: [] };

/** Normaliza y hashea el código (no se guarda el código real, solo su SHA256). */
const hashCode = (raw: string) =>
  crypto.createHash('sha256').update(String(raw || '').trim().toUpperCase()).digest('hex');

const codePreview = (raw: string) => {
  const c = String(raw || '').trim().toUpperCase();
  return (c.length <= 6 ? c : `${c.slice(0, 6)}${'*'.repeat(Math.min(8, c.length - 6))}`).slice(0, 30);
};

const toMysql = (d: Date) => d.toISOString().slice(0, 19).replace('T', ' ');

/** Suma duración (día/mes) a una fecha base. */
function addDuration(base: Date, value: number, unit: DurationUnit): Date {
  const d = new Date(base.getTime());
  if (unit === 'month') d.setMonth(d.getMonth() + value);
  else d.setDate(d.getDate() + value);
  return d;
}

async function setPlatformSetting(key: string, value: string): Promise<void> {
  await db.query(
    `INSERT INTO platform_settings (setting_key, setting_value) VALUES (?, ?)
     ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)`,
    [key, value]
  );
}

// ── Entitlements ─────────────────────────────────────────────────────────────
export async function getEntitlementsForTier(tier: string): Promise<string[]> {
  if (!tier || tier === 'free') return [];
  const [rows]: any = await db.query(
    `SELECT entitlement_key FROM consumer_entitlements WHERE tier = ?`, [tier]
  );
  return (rows as any[]).map(r => r.entitlement_key);
}

// ── Estado del usuario (expira perezosamente) ────────────────────────────────
export async function getUserTier(userId: string): Promise<UserTierState> {
  if (!userId) return { ...FREE };
  // Expiración perezosa: marca como vencidos los grants pasados de fecha.
  await db.query(
    `UPDATE consumer_plan_grants SET status = 'expired', last_checked_at = NOW()
      WHERE user_id = ? AND status = 'active' AND expires_at <= NOW()`,
    [userId]
  );
  const [rows]: any = await db.query(
    `SELECT tier, status, started_at, expires_at FROM consumer_plan_grants
      WHERE user_id = ? AND status = 'active' AND expires_at > NOW()
      ORDER BY expires_at DESC LIMIT 1`,
    [userId]
  );
  const g = (rows as any[])[0];
  if (!g) return { ...FREE };
  const remainingSeconds = Math.max(0, Math.floor((new Date(g.expires_at).getTime() - Date.now()) / 1000));
  const entitlements = await getEntitlementsForTier(g.tier);
  const powerDays = Math.max(0, Math.floor((Date.now() - new Date(g.started_at).getTime()) / 86400000));
  const milestones = LEGEND_MILESTONES.filter(m => powerDays >= m.days).map(m => m.key);
  return {
    tier: g.tier, status: 'active', startedAt: g.started_at, expiresAt: g.expires_at,
    remainingSeconds, isExpired: false, entitlements, powerDays, milestones,
  };
}

/** Gate universal por feature. */
export async function hasEntitlement(userId: string, key: string): Promise<boolean> {
  const state = await getUserTier(userId);
  return !state.isExpired && state.entitlements.includes(key);
}

// ── Canje (transaccional, anti-race, idempotente) ────────────────────────────
export async function redeemCode(params: {
  userId: string;
  code: string;
  tenantId?: string | null;
  ip?: string | null;
  userAgent?: string | null;
}): Promise<UserTierState> {
  const { userId } = params;
  if (!userId) throw new AppError('Usuario no autenticado', 401);
  if (!params.code || !params.code.trim()) throw new AppError('Ingresa un código', 400);
  const hash = hashCode(params.code);

  const conn = await (db as any).getConnection();
  try {
    await conn.beginTransaction();

    // 1) Código (bloqueado para evitar carreras en redemptions).
    const [codeRows] = await conn.query(
      `SELECT * FROM consumer_access_codes WHERE code_hash = ? FOR UPDATE`, [hash]
    );
    const code = (codeRows as any[])[0];
    if (!code || !code.is_active) throw new AppError('Código inválido o inactivo', 404);

    const now = new Date();
    if (code.valid_from && new Date(code.valid_from) > now) throw new AppError('Este código aún no está disponible', 409);
    if (code.valid_until && new Date(code.valid_until) < now) throw new AppError('Este código ya venció', 409);
    if (code.max_redemptions != null && code.redemptions >= code.max_redemptions) throw new AppError('Este código ya alcanzó su límite de canjes', 409);
    if ((code.scope as CodeScope) === 'tenant' && code.tenant_id && params.tenantId && code.tenant_id !== params.tenantId) {
      throw new AppError('Este código no aplica para esta tienda', 409);
    }

    // 2) Idempotencia: un usuario no puede canjear DOS veces el mismo código.
    const [dup] = await conn.query(
      `SELECT 1 FROM consumer_access_ledger WHERE user_id = ? AND code_id = ? LIMIT 1`, [userId, code.id]
    );
    if ((dup as any[]).length > 0) throw new AppError('Ya usaste este código', 409);

    // 3) Grant activo vigente del mismo tier (bloqueado).
    const [grantRows] = await conn.query(
      `SELECT * FROM consumer_plan_grants
        WHERE user_id = ? AND tier = ? AND status = 'active' AND expires_at > NOW()
        ORDER BY expires_at DESC LIMIT 1 FOR UPDATE`,
      [userId, code.tier]
    );
    const existing = (grantRows as any[])[0];
    const stack = code.stack_policy as StackPolicy;

    if (existing && stack === 'block') throw new AppError('Ya tienes un plan activo; no se puede apilar este código', 409);

    // 4) Calcular nueva expiración.
    const base = (existing && stack === 'extend') ? new Date(Math.max(now.getTime(), new Date(existing.expires_at).getTime())) : now;
    let newExpiry = addDuration(base, code.duration_value, code.duration_unit as DurationUnit);
    const cap = addDuration(now, STACK_CAP_DAYS, 'day');           // tope acumulado (180 días)
    if (newExpiry > cap) newExpiry = cap;
    const startedAt = existing && stack === 'extend' ? new Date(existing.started_at) : now;
    const action = !existing ? 'redeem' : (stack === 'replace' ? 'replace' : 'extend');

    // 5) Ledger.
    const ledgerId = uuidv4();
    await conn.query(
      `INSERT INTO consumer_access_ledger (id, user_id, code_id, grant_id, action, old_expires_at, new_expires_at, metadata)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [ledgerId, userId, code.id, existing?.id ?? null, action,
       existing ? toMysql(new Date(existing.expires_at)) : null, toMysql(newExpiry),
       JSON.stringify({ ip: params.ip ?? null, userAgent: params.userAgent ?? null })]
    );

    // 6) Grant: extiende/reemplaza el activo o crea uno nuevo.
    if (existing) {
      await conn.query(
        `UPDATE consumer_plan_grants SET expires_at = ?, started_at = ?, status = 'active', source_ledger_id = ?, last_checked_at = NOW() WHERE id = ?`,
        [toMysql(newExpiry), toMysql(startedAt), ledgerId, existing.id]
      );
    } else {
      await conn.query(
        `INSERT INTO consumer_plan_grants (id, user_id, tier, status, started_at, expires_at, source_ledger_id)
         VALUES (?, ?, ?, 'active', ?, ?, ?)`,
        [uuidv4(), userId, code.tier, toMysql(startedAt), toMysql(newExpiry), ledgerId]
      );
    }

    // 7) Incrementa canjes del código.
    await conn.query(`UPDATE consumer_access_codes SET redemptions = redemptions + 1 WHERE id = ?`, [code.id]);

    await conn.commit();
  } catch (e) {
    await conn.rollback();
    throw e;
  } finally {
    conn.release();
  }

  return getUserTier(userId);
}

// ── Admin: CRUD de códigos ───────────────────────────────────────────────────
export async function createCode(params: {
  tier?: string;
  durationValue: number;
  durationUnit: DurationUnit;
  stackPolicy?: StackPolicy;
  maxRedemptions?: number | null;
  validFrom?: string | null;
  validUntil?: string | null;
  scope?: CodeScope;
  tenantId?: string | null;
  rawCode?: string;            // opcional: si no llega, se genera
  createdBy?: string | null;
}): Promise<{ id: string; code: string; codePreview: string }> {
  const tier = params.tier || 'legend';
  const dv = Math.floor(Number(params.durationValue));
  if (!Number.isFinite(dv) || dv <= 0) throw new AppError('Duración inválida', 400);
  if (!['day', 'month'].includes(params.durationUnit)) throw new AppError('Unidad de duración inválida', 400);

  // Genera un código legible si no se provee uno.
  const raw = (params.rawCode && params.rawCode.trim())
    ? params.rawCode.trim().toUpperCase()
    : `${tier.toUpperCase()}-${crypto.randomBytes(3).toString('hex').toUpperCase()}-${crypto.randomBytes(2).toString('hex').toUpperCase()}`;
  const hash = hashCode(raw);
  const id = uuidv4();

  try {
    await db.query(
      `INSERT INTO consumer_access_codes
        (id, code_hash, code_preview, tier, duration_value, duration_unit, stack_policy,
         max_redemptions, valid_from, valid_until, scope, tenant_id, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, hash, codePreview(raw), tier, dv, params.durationUnit, params.stackPolicy || 'extend',
       params.maxRedemptions ?? null, params.validFrom ?? null, params.validUntil ?? null,
       params.scope || 'global', params.tenantId ?? null, params.createdBy ?? null]
    );
  } catch (e: any) {
    if (e?.errno === 1062) throw new AppError('Ese código ya existe', 409);
    throw e;
  }
  // Se devuelve el código real UNA sola vez (no se vuelve a poder leer del hash).
  return { id, code: raw, codePreview: codePreview(raw) };
}

export async function listCodes(filters: { status?: 'active' | 'inactive' | 'exhausted'; tier?: string } = {}) {
  const where: string[] = [];
  const args: any[] = [];
  if (filters.tier) { where.push('tier = ?'); args.push(filters.tier); }
  if (filters.status === 'active') where.push('is_active = 1');
  if (filters.status === 'inactive') where.push('is_active = 0');
  if (filters.status === 'exhausted') where.push('max_redemptions IS NOT NULL AND redemptions >= max_redemptions');
  const sql = `SELECT id, code_preview, tier, duration_value, duration_unit, stack_policy,
                      max_redemptions, redemptions, valid_from, valid_until, scope, tenant_id,
                      is_active, created_at
                 FROM consumer_access_codes
                 ${where.length ? `WHERE ${where.join(' AND ')}` : ''}
                 ORDER BY created_at DESC LIMIT 500`;
  const [rows]: any = await db.query(sql, args);
  return (rows as any[]).map(r => ({
    id: r.id, codePreview: r.code_preview, tier: r.tier,
    durationValue: r.duration_value, durationUnit: r.duration_unit, stackPolicy: r.stack_policy,
    maxRedemptions: r.max_redemptions, redemptions: r.redemptions,
    validFrom: r.valid_from, validUntil: r.valid_until, scope: r.scope, tenantId: r.tenant_id,
    isActive: Boolean(r.is_active), createdAt: r.created_at,
  }));
}

export async function updateCode(id: string, patch: { isActive?: boolean; validUntil?: string | null; maxRedemptions?: number | null }) {
  const sets: string[] = [];
  const args: any[] = [];
  if (patch.isActive !== undefined) { sets.push('is_active = ?'); args.push(patch.isActive ? 1 : 0); }
  if (patch.validUntil !== undefined) { sets.push('valid_until = ?'); args.push(patch.validUntil); }
  if (patch.maxRedemptions !== undefined) { sets.push('max_redemptions = ?'); args.push(patch.maxRedemptions); }
  if (!sets.length) return;
  args.push(id);
  const [r]: any = await db.query(`UPDATE consumer_access_codes SET ${sets.join(', ')} WHERE id = ?`, args);
  if ((r as any).affectedRows === 0) throw new AppError('Código no encontrado', 404);
}

// ── Config visual del reveal LEGEND (platform_settings KV, clave única JSON) ──
const LEGEND_CONFIG_KEY = 'legend_config';

export async function getLegendConfig(): Promise<LegendConfig> {
  const [rows]: any = await db.query(`SELECT setting_value FROM platform_settings WHERE setting_key = ? LIMIT 1`, [LEGEND_CONFIG_KEY]);
  const raw = rows?.[0]?.setting_value;
  if (!raw) return { ...DEFAULT_LEGEND_CONFIG };
  try { return { ...DEFAULT_LEGEND_CONFIG, ...JSON.parse(raw) }; } catch { return { ...DEFAULT_LEGEND_CONFIG }; }
}

export async function saveLegendConfig(patch: Partial<LegendConfig>): Promise<LegendConfig> {
  const current = await getLegendConfig();
  const next: LegendConfig = { ...current, ...patch };
  await setPlatformSetting(LEGEND_CONFIG_KEY, JSON.stringify(next));
  return next;
}

// ── Analytics / retención (superadmin) ───────────────────────────────────────
export async function getAnalytics() {
  // Normaliza estados vencidos antes de contar.
  await db.query(`UPDATE consumer_plan_grants SET status='expired' WHERE status='active' AND expires_at <= NOW()`);

  const [actRows]: any = await db.query(
    `SELECT COUNT(*) c FROM consumer_plan_grants WHERE status='active' AND expires_at > NOW()`
  );
  const [soonRows]: any = await db.query(
    `SELECT COUNT(*) c FROM consumer_plan_grants WHERE status='active' AND expires_at > NOW() AND expires_at <= NOW() + INTERVAL 7 DAY`
  );
  const [expRows]: any = await db.query(
    `SELECT COUNT(*) c FROM consumer_plan_grants WHERE status='expired'`
  );
  const [redRows]: any = await db.query(
    `SELECT COUNT(*) total, SUM(created_at >= NOW() - INTERVAL 30 DAY) last30 FROM consumer_access_ledger WHERE action='redeem'`
  );
  const [everRows]: any = await db.query(
    `SELECT COUNT(DISTINCT user_id) c FROM consumer_access_ledger WHERE action='redeem'`
  );
  const [msRows]: any = await db.query(
    `SELECT
        SUM(DATEDIFF(NOW(), started_at) >= 30)  AS constante,
        SUM(DATEDIFF(NOW(), started_at) >= 90)  AS elite,
        SUM(DATEDIFF(NOW(), started_at) >= 180) AS glow,
        SUM(DATEDIFF(NOW(), started_at) >= 365) AS founder
       FROM consumer_plan_grants WHERE status='active' AND expires_at > NOW()`
  );

  const active = Number(actRows[0]?.c) || 0;
  const everRedeemed = Number(everRows[0]?.c) || 0;
  const ms = msRows[0] || {};
  return {
    activeLegends: active,
    expiringSoon7d: Number(soonRows[0]?.c) || 0,
    expiredTotal: Number(expRows[0]?.c) || 0,
    redeemsTotal: Number(redRows[0]?.total) || 0,
    redeemsLast30: Number(redRows[0]?.last30) || 0,
    everRedeemed,
    retentionPct: everRedeemed > 0 ? Math.round((active / everRedeemed) * 100) : 0,
    milestones: {
      constante: Number(ms.constante) || 0,
      elite: Number(ms.elite) || 0,
      glow: Number(ms.glow) || 0,
      founder: Number(ms.founder) || 0,
    },
  };
}
