/**
 * trainers.types — Coach Economy / Marketplace de Entrenadores (T1).
 * Plataforma (como afiliados): auth propia, programas, contratación, comisión, reviews.
 */

export type TrainerStatus = 'pending' | 'active' | 'suspended';
export type OfferKind = 'programa' | 'sesion' | 'mensual' | 'combo';
export type BookingStatus = 'pending' | 'paid' | 'delivered' | 'completed' | 'refunded';
export type CommissionStatus = 'pending' | 'available' | 'paid';

/** Comisión por defecto: híbrido 20% con mínimo 100k (decisión del plan maestro). */
export const DEFAULT_COMMISSION_PCT = 20;
export const DEFAULT_MIN_COMMISSION_COP = 100_000;
export const MIN_OFFER_PRICE_COP = 500_000;

export interface Trainer {
  id: string;
  userId: string | null;
  name: string;
  email: string;
  handle: string | null;
  bio: string | null;
  photoUrl: string | null;
  specialties: string[] | null;
  status: TrainerStatus;
  commissionPct: number;
  minCommissionCop: number;
  balanceCop: number;
  pendingCop: number;
  ratingAvg: number;
  sessionsCount: number;
  createdAt: string;
}

export interface TrainerOffer {
  id: string;
  trainerId: string;
  title: string;
  description: string | null;
  kind: OfferKind;
  priceCop: number;
  durationDays: number | null;
  deliverables: Record<string, unknown> | null;
  media: Record<string, unknown> | null;
  isActive: boolean;
  createdAt: string;
}

export interface TrainerBooking {
  id: string;
  offerId: string;
  trainerId: string;
  userId: string;
  amountCop: number;
  platformCop: number;
  trainerCop: number;
  gatewayFeeCop: number;
  status: BookingStatus;
  wompiReference: string | null;
  startedAt: string | null;
  expiresAt: string | null;
  createdAt: string;
}

/** JWT propio del coach. */
export interface TrainerJWT {
  trainerId: string;
  type: 'trainer';
}
