import { v4 as uuidv4 } from 'uuid';
import pool from '../../config/database';

// mysql2 may return JSON columns as already-parsed JS values or as raw strings
// depending on version and configuration. This handles both cases safely.
function parseJsonArray(raw: unknown): string[] {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw as string[];
  if (typeof raw === 'string') {
    try { return JSON.parse(raw); } catch { return []; }
  }
  return [];
}

export interface ReservationInput {
  tableId: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  reservationDate: string;   // YYYY-MM-DD
  reservationTime: string;   // HH:MM
  guestsCount: number;
  occasion?: string;
  notes?: string;
  preOrderItems?: PreOrderItem[];
  preOrderNotes?: string;
}

export interface PreOrderItem {
  menuItemId: string;
  name: string;
  quantity: number;
  unitPrice: number;
}

export interface ReservationSettings {
  enabled: boolean;
  whatsapp?: string;
  openTime: string;
  closeTime: string;
  slotMinutes: number;
  maxAdvanceDays: number;
  minAdvanceHours: number;
  occasions: string[];
}

class ReservationsService {

  async getPublicConfig(slug: string) {
    const [rows] = await pool.query(
      `SELECT id, name, reservations_enabled, reservations_open_time, reservations_close_time,
              reservations_slot_minutes, reservations_max_advance_days, reservations_min_advance_hours,
              reservations_occasions
       FROM tenants WHERE slug = ? AND status = 'activo' LIMIT 1`,
      [slug]
    ) as any;

    if (!rows?.length) return null;
    const t = rows[0];
    if (!t.reservations_enabled) return null;

    const occasions = parseJsonArray(t.reservations_occasions);

    return {
      tenantId: t.id,
      storeName: t.name,
      openTime: t.reservations_open_time,
      closeTime: t.reservations_close_time,
      slotMinutes: t.reservations_slot_minutes || 60,
      maxAdvanceDays: t.reservations_max_advance_days || 30,
      minAdvanceHours: t.reservations_min_advance_hours || 2,
      occasions,
    };
  }

  async getAvailableSlots(tenantId: string, date: string): Promise<string[]> {
    const [rows] = await pool.query(
      `SELECT reservations_open_time AS openTime, reservations_close_time AS closeTime,
              reservations_slot_minutes AS slotMinutes, reservations_min_advance_hours AS minHours
       FROM tenants WHERE id = ? LIMIT 1`,
      [tenantId]
    ) as any;

    if (!rows?.length) return [];
    const { openTime, closeTime, slotMinutes, minHours } = rows[0];

    const slots = this._generateSlots(openTime, closeTime, slotMinutes || 60);
    const nowBogota = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Bogota' }));
    const todayStr = nowBogota.toLocaleDateString('en-CA');
    const isToday = date === todayStr;

    // Count active tables
    const [tableRows] = await pool.query(
      `SELECT COUNT(*) AS total FROM rb_tables WHERE tenant_id = ? AND is_active = 1 AND status != 'inactiva'`,
      [tenantId]
    ) as any;
    const totalTables = Number(tableRows[0]?.total || 0);

    // Reservations already taken this date
    const [reserved] = await pool.query(
      `SELECT reservation_time, COUNT(*) AS cnt
       FROM rb_reservations
       WHERE tenant_id = ? AND reservation_date = ? AND status IN ('pendiente','confirmada')
       GROUP BY reservation_time`,
      [tenantId, date]
    ) as any;

    const reservedMap: Record<string, number> = {};
    for (const r of reserved) {
      reservedMap[r.reservation_time.slice(0, 5)] = Number(r.cnt);
    }

    return slots.filter(slot => {
      if (isToday) {
        const [h, m] = slot.split(':').map(Number);
        const slotDate = new Date(nowBogota);
        slotDate.setHours(h, m, 0, 0);
        const diffHours = (slotDate.getTime() - nowBogota.getTime()) / 3600000;
        if (diffHours < (minHours || 2)) return false;
      }
      // When no tables are configured yet, show all slots (table step handles capacity)
      if (totalTables === 0) return true;
      const taken = reservedMap[slot] || 0;
      return taken < totalTables;
    });
  }

  async getAvailableTables(tenantId: string, date: string, time: string, guests: number) {
    const timeFormatted = time.length === 5 ? time + ':00' : time;

    const [tables] = await pool.query(
      `SELECT t.id, t.number, t.area, t.capacity
       FROM rb_tables t
       WHERE t.tenant_id = ? AND t.is_active = 1 AND t.status != 'inactiva'
         AND t.capacity >= ?
         AND t.id NOT IN (
           SELECT r.table_id FROM rb_reservations r
           WHERE r.tenant_id = ? AND r.reservation_date = ?
             AND r.reservation_time = ? AND r.status IN ('pendiente','confirmada')
             AND r.table_id IS NOT NULL
         )
       ORDER BY t.capacity ASC, t.number ASC`,
      [tenantId, guests, tenantId, date, timeFormatted]
    ) as any;

    return tables.map((t: any) => ({
      id: t.id,
      number: t.number,
      area: t.area || null,
      capacity: t.capacity,
    }));
  }

  async createReservation(tenantId: string, data: ReservationInput) {
    const conn = await (pool as any).getConnection();
    try {
      await conn.beginTransaction();

      // Double-check table availability
      const timeFormatted = data.reservationTime.length === 5
        ? data.reservationTime + ':00'
        : data.reservationTime;

      const [conflict] = await conn.query(
        `SELECT id FROM rb_reservations
         WHERE tenant_id = ? AND table_id = ? AND reservation_date = ?
           AND reservation_time = ? AND status IN ('pendiente','confirmada')
         LIMIT 1 FOR UPDATE`,
        [tenantId, data.tableId, data.reservationDate, timeFormatted]
      ) as any;

      if (conflict?.length) {
        await conn.rollback();
        return { error: 'La mesa ya no está disponible para ese horario' };
      }

      // Generate reservation number R-XXXX
      await conn.query(
        `INSERT INTO rb_reservation_sequence (tenant_id, prefix, current_number)
         VALUES (?, 'R', 1) ON DUPLICATE KEY UPDATE current_number = current_number + 1`,
        [tenantId]
      );
      const [seqRow] = await conn.query(
        `SELECT current_number FROM rb_reservation_sequence WHERE tenant_id = ? LIMIT 1`,
        [tenantId]
      ) as any;
      const num = seqRow[0].current_number;
      const reservationNumber = `R-${String(num).padStart(4, '0')}`;

      const id = uuidv4();
      await conn.query(
        `INSERT INTO rb_reservations
           (id, tenant_id, table_id, reservation_number, customer_name, customer_phone,
            customer_email, reservation_date, reservation_time, guests_count,
            occasion, notes, pre_order_items, pre_order_notes, status)
         VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,'pendiente')`,
        [
          id, tenantId, data.tableId, reservationNumber,
          data.customerName, data.customerPhone, data.customerEmail || null,
          data.reservationDate, timeFormatted, data.guestsCount,
          data.occasion || null, data.notes || null,
          data.preOrderItems ? JSON.stringify(data.preOrderItems) : null,
          data.preOrderNotes || null,
        ]
      );

      // Get table info for response
      const [tableRow] = await conn.query(
        `SELECT number, area FROM rb_tables WHERE id = ? LIMIT 1`,
        [data.tableId]
      ) as any;

      await conn.commit();
      return {
        id,
        reservationNumber,
        date: data.reservationDate,
        time: data.reservationTime,
        tableName: tableRow[0]?.number || '',
        tableArea: tableRow[0]?.area || null,
        guestsCount: data.guestsCount,
      };
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  }

  async listReservations(tenantId: string, filters: { date?: string; status?: string; page?: number }) {
    const conditions: string[] = ['r.tenant_id = ?'];
    const params: any[] = [tenantId];

    if (filters.date) {
      conditions.push('r.reservation_date = ?');
      params.push(filters.date);
    }
    if (filters.status) {
      conditions.push('r.status = ?');
      params.push(filters.status);
    }

    const page = filters.page || 1;
    const limit = 50;
    const offset = (page - 1) * limit;

    const [rows] = await pool.query(
      `SELECT r.id, r.reservation_number, r.customer_name, r.customer_phone, r.customer_email,
              r.reservation_date, r.reservation_time, r.guests_count, r.occasion, r.notes,
              r.pre_order_items, r.pre_order_notes, r.status, r.rejection_reason,
              r.notified_whatsapp, r.confirmed_at, r.cancelled_at, r.created_at,
              t.number AS table_number, t.area AS table_area, t.capacity AS table_capacity
       FROM rb_reservations r
       LEFT JOIN rb_tables t ON t.id = r.table_id
       WHERE ${conditions.join(' AND ')}
       ORDER BY r.reservation_date ASC, r.reservation_time ASC
       LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    ) as any;

    const [countRow] = await pool.query(
      `SELECT COUNT(*) AS total FROM rb_reservations r WHERE ${conditions.join(' AND ')}`,
      params
    ) as any;

    return {
      reservations: rows.map((r: any) => ({
        ...r,
        preOrderItems: parseJsonArray(r.pre_order_items),
      })),
      total: Number(countRow[0]?.total || 0),
      page,
    };
  }

  async getPendingCount(tenantId: string): Promise<number> {
    const [rows] = await pool.query(
      `SELECT COUNT(*) AS cnt FROM rb_reservations WHERE tenant_id = ? AND status = 'pendiente'`,
      [tenantId]
    ) as any;
    return Number(rows[0]?.cnt || 0);
  }

  async getById(tenantId: string, id: string) {
    const [rows] = await pool.query(
      `SELECT r.*, t.number AS table_number, t.area AS table_area, t.capacity AS table_capacity
       FROM rb_reservations r
       LEFT JOIN rb_tables t ON t.id = r.table_id
       WHERE r.id = ? AND r.tenant_id = ? LIMIT 1`,
      [id, tenantId]
    ) as any;
    if (!rows?.length) return null;
    const r = rows[0];
    return { ...r, preOrderItems: parseJsonArray(r.pre_order_items) };
  }

  async confirmReservation(tenantId: string, id: string, tableId?: string) {
    const updates: string[] = ["status = 'confirmada'", 'confirmed_at = NOW()'];
    const params: any[] = [];

    if (tableId) {
      updates.unshift('table_id = ?');
      params.push(tableId);
    }

    params.push(tenantId, id);
    const [result] = await pool.query(
      `UPDATE rb_reservations SET ${updates.join(', ')}
       WHERE tenant_id = ? AND id = ? AND status = 'pendiente'`,
      params
    ) as any;

    return result.affectedRows > 0;
  }

  async cancelReservation(tenantId: string, id: string, reason: string) {
    const [result] = await pool.query(
      `UPDATE rb_reservations
       SET status = 'cancelada', rejection_reason = ?, cancelled_at = NOW()
       WHERE tenant_id = ? AND id = ? AND status IN ('pendiente','confirmada')`,
      [reason, tenantId, id]
    ) as any;
    return result.affectedRows > 0;
  }

  async completeReservation(tenantId: string, id: string) {
    const [result] = await pool.query(
      `UPDATE rb_reservations SET status = 'completada'
       WHERE tenant_id = ? AND id = ? AND status = 'confirmada'`,
      [tenantId, id]
    ) as any;
    return result.affectedRows > 0;
  }

  async markNoShow(tenantId: string, id: string) {
    const [result] = await pool.query(
      `UPDATE rb_reservations SET status = 'no_show'
       WHERE tenant_id = ? AND id = ? AND status = 'confirmada'`,
      [tenantId, id]
    ) as any;
    return result.affectedRows > 0;
  }

  async markWhatsappNotified(tenantId: string, id: string) {
    await pool.query(
      `UPDATE rb_reservations SET notified_whatsapp = 1 WHERE tenant_id = ? AND id = ?`,
      [tenantId, id]
    );
  }

  async getSettings(tenantId: string): Promise<ReservationSettings | null> {
    const [rows] = await pool.query(
      `SELECT reservations_enabled, reservations_whatsapp, reservations_open_time,
              reservations_close_time, reservations_slot_minutes, reservations_max_advance_days,
              reservations_min_advance_hours, reservations_occasions, slug
       FROM tenants WHERE id = ? LIMIT 1`,
      [tenantId]
    ) as any;
    if (!rows?.length) return null;
    const t = rows[0];
    const occasions = parseJsonArray(t.reservations_occasions);

    return {
      enabled: !!t.reservations_enabled,
      whatsapp: t.reservations_whatsapp || '',
      openTime: t.reservations_open_time || '12:00:00',
      closeTime: t.reservations_close_time || '22:00:00',
      slotMinutes: t.reservations_slot_minutes || 60,
      maxAdvanceDays: t.reservations_max_advance_days || 30,
      minAdvanceHours: t.reservations_min_advance_hours || 2,
      occasions,
      slug: t.slug,
    } as any;
  }

  async updateSettings(tenantId: string, settings: Partial<ReservationSettings> & { slug?: string }) {
    const fields: string[] = [];
    const params: any[] = [];

    if (settings.enabled !== undefined)       { fields.push('reservations_enabled = ?');        params.push(settings.enabled ? 1 : 0); }
    if (settings.whatsapp !== undefined)      { fields.push('reservations_whatsapp = ?');        params.push(settings.whatsapp || null); }
    if (settings.openTime !== undefined)      { fields.push('reservations_open_time = ?');       params.push(settings.openTime); }
    if (settings.closeTime !== undefined)     { fields.push('reservations_close_time = ?');      params.push(settings.closeTime); }
    if (settings.slotMinutes !== undefined)   { fields.push('reservations_slot_minutes = ?');    params.push(settings.slotMinutes); }
    if (settings.maxAdvanceDays !== undefined){ fields.push('reservations_max_advance_days = ?');params.push(settings.maxAdvanceDays); }
    if (settings.minAdvanceHours !== undefined){ fields.push('reservations_min_advance_hours = ?');params.push(settings.minAdvanceHours); }
    if (settings.occasions !== undefined)     { fields.push('reservations_occasions = ?');       params.push(JSON.stringify(settings.occasions)); }

    if (!fields.length) return;
    params.push(tenantId);
    await pool.query(`UPDATE tenants SET ${fields.join(', ')} WHERE id = ?`, params);
  }

  private _generateSlots(openTime: string, closeTime: string, slotMinutes: number): string[] {
    const slots: string[] = [];
    const [oh, om] = openTime.split(':').map(Number);
    const [ch, cm] = closeTime.split(':').map(Number);
    let current = oh * 60 + om;
    const end = ch * 60 + cm;
    while (current < end) {
      const h = Math.floor(current / 60);
      const m = current % 60;
      slots.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
      current += slotMinutes;
    }
    return slots;
  }
}

export const reservationsService = new ReservationsService();
