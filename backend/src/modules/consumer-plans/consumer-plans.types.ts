/**
 * consumer-plans.types — Tipos del sistema Consumer Plans / LEGEND (v2).
 *
 * Modela ACCESS + ENTITLEMENTS + EXPERIENCIA (no "suscripciones" rígidas), para
 * escalar a múltiples tiers (legend, pro, elite, coach…) sin rehacer la base.
 */

export type DurationUnit = 'day' | 'month';
export type StackPolicy = 'extend' | 'replace' | 'block';
export type CodeScope = 'global' | 'tenant';
export type GrantStatus = 'active' | 'expired' | 'revoked';
export type LedgerAction = 'redeem' | 'extend' | 'replace' | 'expire' | 'revoke';

/** Tope máximo acumulado al apilar códigos (recomendación de producto: 180 días). */
export const STACK_CAP_DAYS = 180;

/** Entitlements conocidos del tier LEGEND (gate por feature, no por plan). */
export type EntitlementKey =
  | 'routine_ai'
  | 'premium_theme'
  | 'coach_priority'
  | 'discounts'
  | 'smart_combos'
  | 'content_vault';

export interface ConsumerAccessCode {
  id: string;
  codeHash: string;
  codePreview: string;
  tier: string;
  durationValue: number;
  durationUnit: DurationUnit;
  stackPolicy: StackPolicy;
  maxRedemptions: number | null;
  redemptions: number;
  validFrom: string | null;
  validUntil: string | null;
  scope: CodeScope;
  tenantId: string | null;
  metadata: Record<string, unknown> | null;
  isActive: boolean;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ConsumerPlanGrant {
  id: string;
  userId: string;
  tier: string;
  status: GrantStatus;
  startedAt: string;
  expiresAt: string;
  sourceLedgerId: string | null;
  lastCheckedAt: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
}

export interface ConsumerAccessLedgerEntry {
  id: string;
  userId: string;
  codeId: string | null;
  grantId: string | null;
  action: LedgerAction;
  oldExpiresAt: string | null;
  newExpiresAt: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
}

export interface ConsumerEntitlement {
  id: string;
  tier: string;
  entitlementKey: string;
  createdAt: string;
}

/** Milestones de continuidad LEGEND ("días de poder"). */
export interface LegendMilestone {
  key: string;
  label: string;
  days: number;
}
export const LEGEND_MILESTONES: LegendMilestone[] = [
  { key: 'constante',  label: 'Constante',      days: 30 },
  { key: 'elite',      label: 'Elite',          days: 90 },
  { key: 'glow',       label: 'Glow',           days: 180 },
  { key: 'founder',    label: 'Founder Legend', days: 365 },
];

/** Respuesta de getUserTier() / GET /me — lo que consume el frontend para el gate. */
export interface UserTierState {
  tier: string;            // 'free' si no hay grant vigente
  status: GrantStatus | 'free';
  startedAt: string | null;
  expiresAt: string | null;
  remainingSeconds: number;
  isExpired: boolean;
  entitlements: string[];
  /** Días continuos como LEGEND (desde started_at del grant activo). */
  powerDays: number;
  /** Milestones alcanzados (keys de LEGEND_MILESTONES). */
  milestones: string[];
}

/** Config visual del reveal LEGEND (vive en platform_settings KV). */
export interface LegendConfig {
  animation: 'chat-daimuz' | 'flame' | 'confetti';
  primary: string;
  accent: string;
  glow: boolean;
  revealDuration: number;  // ms (≤ 2500 recomendado)
  soundEnabled: boolean;
  badgeStyle: string;
}

export const DEFAULT_LEGEND_CONFIG: LegendConfig = {
  animation: 'chat-daimuz',
  primary: '#D4AF37',     // dorado LEGEND
  accent: '#0e0e0e',
  glow: true,
  revealDuration: 2500,
  soundEnabled: false,
  badgeStyle: 'gold',
};
