// ── Horario de atención de un comercio ──────────────────────────────────────
// Calcula el estado abierto/cerrado de forma automática a partir de las franjas
// horarias configuradas por el comerciante. La hora "actual" se evalúa en la
// zona horaria de Colombia (America/Bogota) para que sea consistente sin
// depender de la zona del servidor.

export type DayKey = 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun';

export interface TimeSlot {
  open: string;  // 'HH:MM' (24h)
  close: string; // 'HH:MM' (24h)
}

export type BusinessHours = Partial<Record<DayKey, TimeSlot[]>>;

const DAY_KEYS: DayKey[] = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];

/** Convierte 'HH:MM' a minutos desde medianoche, o null si es inválido. */
function toMinutes(hhmm: string): number | null {
  if (typeof hhmm !== 'string') return null;
  const m = hhmm.match(/^(\d{1,2}):(\d{2})$/);
  if (!m) return null;
  const h = parseInt(m[1], 10);
  const min = parseInt(m[2], 10);
  if (h < 0 || h > 23 || min < 0 || min > 59) return null;
  return h * 60 + min;
}

/** Parsea el JSON de business_hours (string u objeto) a BusinessHours seguro. */
export function parseBusinessHours(raw: unknown): BusinessHours | null {
  if (!raw) return null;
  let obj: any = raw;
  if (typeof raw === 'string') {
    try { obj = JSON.parse(raw); } catch { return null; }
  }
  if (!obj || typeof obj !== 'object') return null;
  const result: BusinessHours = {};
  for (const day of DAY_KEYS) {
    const slots = obj[day];
    if (Array.isArray(slots)) {
      result[day] = slots
        .filter((s: any) => s && typeof s.open === 'string' && typeof s.close === 'string')
        .map((s: any) => ({ open: s.open, close: s.close }));
    }
  }
  return result;
}

/** ¿Hay al menos una franja definida en toda la semana? */
export function hasAnySchedule(hours: BusinessHours | null): boolean {
  if (!hours) return false;
  return DAY_KEYS.some((d) => (hours[d]?.length ?? 0) > 0);
}

/** Devuelve { dayKey, minutes } de la hora actual en America/Bogota. */
function nowInBogota(): { dayKey: DayKey; minutes: number } {
  const fmt = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Bogota',
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
  const parts = fmt.formatToParts(new Date());
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? '';
  const wd = get('weekday').toLowerCase().slice(0, 3); // sun, mon, ...
  let hour = parseInt(get('hour'), 10);
  if (hour === 24) hour = 0; // algunos entornos devuelven '24' a medianoche
  const minute = parseInt(get('minute'), 10);
  const dayKey = (['sun','mon','tue','wed','thu','fri','sat'].includes(wd) ? wd : 'mon') as DayKey;
  return { dayKey, minutes: hour * 60 + minute };
}

/** ¿Una franja (posiblemente nocturna) contiene 'minutes'? */
function slotContains(slot: TimeSlot, minutes: number): boolean {
  const open = toMinutes(slot.open);
  const close = toMinutes(slot.close);
  if (open === null || close === null) return false;
  if (close > open) {
    // Mismo día: [open, close)
    return minutes >= open && minutes < close;
  }
  if (close < open) {
    // Cruza medianoche: [open, 24:00) ∪ [00:00, close)
    return minutes >= open || minutes < close;
  }
  // open === close → franja de 24h
  return true;
}

/**
 * Calcula 'open' | 'closed' automáticamente según el horario.
 * Si no hay horario configurado, devuelve `fallback` (por defecto 'open'),
 * para no cerrar comercios que aún no lo han configurado.
 */
export function computeOpenState(
  raw: unknown,
  fallback: 'open' | 'closed' = 'open'
): 'open' | 'closed' {
  const hours = parseBusinessHours(raw);
  if (!hasAnySchedule(hours)) return fallback;

  const { dayKey, minutes } = nowInBogota();
  const today = hours![dayKey] ?? [];

  // Hoy
  for (const slot of today) {
    if (slotContains(slot, minutes)) return 'open';
  }
  // Franjas nocturnas que arrancaron ayer y siguen abiertas pasada la medianoche
  const yesterdayIdx = (DAY_KEYS.indexOf(dayKey) + 6) % 7;
  const yesterday = hours![DAY_KEYS[yesterdayIdx]] ?? [];
  for (const slot of yesterday) {
    const open = toMinutes(slot.open);
    const close = toMinutes(slot.close);
    if (open !== null && close !== null && close < open && minutes < close) {
      return 'open';
    }
  }
  return 'closed';
}

const DAY_LABELS_ES: Record<DayKey, string> = {
  mon: 'lunes', tue: 'martes', wed: 'miércoles', thu: 'jueves',
  fri: 'viernes', sat: 'sábado', sun: 'domingo',
};

/** 'HH:MM' → '8:00' (sin cero inicial en la hora). */
function prettyTime(hhmm: string): string {
  const m = /^(\d{1,2}):(\d{2})$/.exec(hhmm || '');
  if (!m) return hhmm;
  return `${parseInt(m[1], 10)}:${m[2]}`;
}

/**
 * Devuelve una etiqueta legible de la próxima apertura (ej. 'Abre hoy 18:00',
 * 'Abre mañana 8:00', 'Abre el lunes 8:00') o null si está abierto / sin horario.
 * Busca hasta 7 días hacia adelante en zona horaria de Colombia.
 */
export function computeNextOpen(raw: unknown): string | null {
  const hours = parseBusinessHours(raw);
  if (!hasAnySchedule(hours)) return null;
  if (computeOpenState(raw) === 'open') return null;

  const { dayKey, minutes } = nowInBogota();
  const todayIdx = DAY_KEYS.indexOf(dayKey);

  for (let offset = 0; offset <= 7; offset++) {
    const key = DAY_KEYS[(todayIdx + offset) % 7];
    const slots = (hours![key] ?? [])
      .map((s) => ({ s, openMin: toMinutes(s.open) }))
      .filter((x) => x.openMin !== null)
      .sort((a, b) => (a.openMin! - b.openMin!));
    for (const { s, openMin } of slots) {
      if (offset === 0 && openMin! <= minutes) continue; // ya pasó hoy
      const t = prettyTime(s.open);
      if (offset === 0) return `Abre hoy ${t}`;
      if (offset === 1) return `Abre mañana ${t}`;
      return `Abre el ${DAY_LABELS_ES[key]} ${t}`;
    }
  }
  return null;
}
