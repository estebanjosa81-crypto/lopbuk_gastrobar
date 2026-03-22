import { v4 as uuidv4 } from 'uuid';
import { db } from '../../config';
import { AppError } from '../../common/middleware';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

// ─── Row interfaces ───────────────────────────────────────────────
interface ServiceRow extends RowDataPacket {
  id: string; tenant_id: string; name: string; description: string | null;
  category: string | null; service_type: string; price: number; price_type: string;
  duration_minutes: number | null; image_url: string | null;
  requires_payment: boolean; max_advance_days: number; cancellation_hours: number;
  is_active: boolean; is_published: boolean; sort_order: number;
  created_at: Date; updated_at: Date;
}

interface AvailabilityRow extends RowDataPacket {
  id: string; service_id: string; tenant_id: string; day_of_week: number;
  start_time: string; end_time: string; slot_duration_minutes: number;
  max_simultaneous: number; is_active: boolean;
}

interface BlockedPeriodRow extends RowDataPacket {
  id: string; tenant_id: string; service_id: string | null;
  blocked_date: Date; start_time: string | null; end_time: string | null;
  reason: string | null; created_at: Date;
}

interface BookingRow extends RowDataPacket {
  id: string; tenant_id: string; service_id: string; service_name: string;
  booking_type: string; client_name: string; client_phone: string;
  client_email: string | null; client_notes: string | null;
  booking_date: Date | null; start_time: string | null; end_time: string | null;
  preferred_date_range: string | null; project_description: string | null;
  budget_range: string | null; status: string; payment_status: string;
  amount_paid: number; merchant_notes: string | null;
  created_at: Date; updated_at: Date;
}

interface CountRow extends RowDataPacket { total: number; }

// ─── Mappers ─────────────────────────────────────────────────────
const mapService = (r: ServiceRow) => ({
  id: r.id, tenantId: r.tenant_id, name: r.name, description: r.description,
  category: r.category, serviceType: r.service_type, price: Number(r.price),
  priceType: r.price_type, durationMinutes: r.duration_minutes,
  imageUrl: r.image_url, requiresPayment: Boolean(r.requires_payment),
  maxAdvanceDays: r.max_advance_days, cancellationHours: r.cancellation_hours,
  isActive: Boolean(r.is_active), isPublished: Boolean(r.is_published),
  sortOrder: r.sort_order, createdAt: r.created_at, updatedAt: r.updated_at,
});

const mapAvailability = (r: AvailabilityRow) => ({
  id: r.id, serviceId: r.service_id, dayOfWeek: r.day_of_week,
  startTime: r.start_time, endTime: r.end_time,
  slotDurationMinutes: r.slot_duration_minutes,
  maxSimultaneous: r.max_simultaneous, isActive: Boolean(r.is_active),
});

const mapBlocked = (r: BlockedPeriodRow) => ({
  id: r.id, serviceId: r.service_id, blockedDate: r.blocked_date,
  startTime: r.start_time, endTime: r.end_time, reason: r.reason,
  createdAt: r.created_at,
});

const mapBooking = (r: BookingRow) => ({
  id: r.id, tenantId: r.tenant_id, serviceId: r.service_id,
  serviceName: r.service_name, bookingType: r.booking_type,
  clientName: r.client_name, clientPhone: r.client_phone,
  clientEmail: r.client_email, clientNotes: r.client_notes,
  bookingDate: r.booking_date, startTime: r.start_time, endTime: r.end_time,
  preferredDateRange: r.preferred_date_range,
  projectDescription: r.project_description, budgetRange: r.budget_range,
  status: r.status, paymentStatus: r.payment_status,
  amountPaid: Number(r.amount_paid), merchantNotes: r.merchant_notes,
  createdAt: r.created_at, updatedAt: r.updated_at,
});

// ─── Service class ────────────────────────────────────────────────
export class ServicesService {

  // ── SERVICES CRUD ──────────────────────────────────────────────
  async findAll(tenantId: string) {
    const [rows] = await db.execute<ServiceRow[]>(
      'SELECT * FROM services WHERE tenant_id = ? ORDER BY sort_order, name',
      [tenantId]
    );
    return rows.map(mapService);
  }

  async findById(id: string, tenantId: string) {
    const [rows] = await db.execute<ServiceRow[]>(
      'SELECT * FROM services WHERE id = ? AND tenant_id = ?',
      [id, tenantId]
    );
    if (!rows.length) throw new AppError('Servicio no encontrado', 404);
    return mapService(rows[0]);
  }

  async create(tenantId: string, data: {
    name: string; description?: string; category?: string;
    serviceType: 'cita' | 'asesoria' | 'contacto'; price?: number;
    priceType?: string; durationMinutes?: number; imageUrl?: string;
    requiresPayment?: boolean; maxAdvanceDays?: number;
    cancellationHours?: number; sortOrder?: number;
  }) {
    const id = uuidv4();
    await db.execute<ResultSetHeader>(
      `INSERT INTO services
        (id, tenant_id, name, description, category, service_type, price, price_type,
         duration_minutes, image_url, requires_payment, max_advance_days, cancellation_hours, sort_order)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id, tenantId, data.name, data.description || null, data.category || null,
        data.serviceType, data.price || 0, data.priceType || 'fijo',
        data.durationMinutes || null, data.imageUrl || null,
        data.requiresPayment ? 1 : 0, data.maxAdvanceDays || 30,
        data.cancellationHours || 24, data.sortOrder || 0,
      ]
    );
    return this.findById(id, tenantId);
  }

  async update(id: string, tenantId: string, data: Partial<{
    name: string; description: string; category: string; serviceType: string;
    price: number; priceType: string; durationMinutes: number; imageUrl: string;
    requiresPayment: boolean; maxAdvanceDays: number; cancellationHours: number;
    isActive: boolean; isPublished: boolean; sortOrder: number;
  }>) {
    const fields: string[] = [];
    const values: unknown[] = [];

    const map: Record<string, string> = {
      name: 'name', description: 'description', category: 'category',
      serviceType: 'service_type', price: 'price', priceType: 'price_type',
      durationMinutes: 'duration_minutes', imageUrl: 'image_url',
      requiresPayment: 'requires_payment', maxAdvanceDays: 'max_advance_days',
      cancellationHours: 'cancellation_hours', isActive: 'is_active',
      isPublished: 'is_published', sortOrder: 'sort_order',
    };

    for (const [key, col] of Object.entries(map)) {
      if (key in data) {
        fields.push(`${col} = ?`);
        values.push((data as Record<string, unknown>)[key]);
      }
    }

    if (!fields.length) throw new AppError('Sin cambios', 400);

    values.push(id, tenantId);
    await db.execute(
      `UPDATE services SET ${fields.join(', ')} WHERE id = ? AND tenant_id = ?`,
      values
    );
    return this.findById(id, tenantId);
  }

  async remove(id: string, tenantId: string) {
    const [result] = await db.execute<ResultSetHeader>(
      'DELETE FROM services WHERE id = ? AND tenant_id = ?',
      [id, tenantId]
    );
    if (!result.affectedRows) throw new AppError('Servicio no encontrado', 404);
  }

  // ── AVAILABILITY ──────────────────────────────────────────────
  async getAvailability(serviceId: string) {
    const [rows] = await db.execute<AvailabilityRow[]>(
      'SELECT * FROM service_availability WHERE service_id = ? ORDER BY day_of_week, start_time',
      [serviceId]
    );
    return rows.map(mapAvailability);
  }

  async setAvailability(serviceId: string, tenantId: string, slots: Array<{
    dayOfWeek: number; startTime: string; endTime: string;
    slotDurationMinutes: number; maxSimultaneous: number;
  }>) {
    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();
      await connection.execute(
        'DELETE FROM service_availability WHERE service_id = ?',
        [serviceId]
      );
      for (const slot of slots) {
        await connection.execute(
          `INSERT INTO service_availability
            (id, service_id, tenant_id, day_of_week, start_time, end_time, slot_duration_minutes, max_simultaneous)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [uuidv4(), serviceId, tenantId, slot.dayOfWeek, slot.startTime,
           slot.endTime, slot.slotDurationMinutes, slot.maxSimultaneous]
        );
      }
      await connection.commit();
    } catch (e) {
      await connection.rollback();
      throw e;
    } finally {
      connection.release();
    }
    return this.getAvailability(serviceId);
  }

  // ── BLOCKED PERIODS ───────────────────────────────────────────
  async getBlockedPeriods(tenantId: string, serviceId?: string) {
    let query = 'SELECT * FROM service_blocked_periods WHERE tenant_id = ?';
    const params: unknown[] = [tenantId];
    if (serviceId) {
      query += ' AND (service_id = ? OR service_id IS NULL)';
      params.push(serviceId);
    }
    query += ' ORDER BY blocked_date';
    const [rows] = await db.execute<BlockedPeriodRow[]>(query, params);
    return rows.map(mapBlocked);
  }

  async addBlockedPeriod(tenantId: string, data: {
    serviceId?: string; blockedDate: string;
    startTime?: string; endTime?: string; reason?: string;
  }) {
    const id = uuidv4();
    await db.execute<ResultSetHeader>(
      `INSERT INTO service_blocked_periods (id, tenant_id, service_id, blocked_date, start_time, end_time, reason)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [id, tenantId, data.serviceId || null, data.blockedDate,
       data.startTime || null, data.endTime || null, data.reason || null]
    );
    const [rows] = await db.execute<BlockedPeriodRow[]>(
      'SELECT * FROM service_blocked_periods WHERE id = ?', [id]
    );
    return mapBlocked(rows[0]);
  }

  async removeBlockedPeriod(id: string, tenantId: string) {
    const [result] = await db.execute<ResultSetHeader>(
      'DELETE FROM service_blocked_periods WHERE id = ? AND tenant_id = ?',
      [id, tenantId]
    );
    if (!result.affectedRows) throw new AppError('Período no encontrado', 404);
  }

  // ── AVAILABLE SLOTS ───────────────────────────────────────────
  async getAvailableSlots(serviceId: string, tenantId: string, dateStr: string): Promise<string[]> {
    const date = new Date(dateStr + 'T00:00:00');
    const dayOfWeek = date.getDay(); // 0=Sun

    // 1. Get service availability for this day
    const [availRows] = await db.execute<AvailabilityRow[]>(
      `SELECT * FROM service_availability
       WHERE service_id = ? AND day_of_week = ? AND is_active = TRUE`,
      [serviceId, dayOfWeek]
    );
    if (!availRows.length) return [];

    // 2. Check if date is fully blocked (service-specific or tenant-wide)
    const [fullBlocks] = await db.execute<RowDataPacket[]>(
      `SELECT id FROM service_blocked_periods
       WHERE tenant_id = ? AND blocked_date = ? AND start_time IS NULL
         AND (service_id = ? OR service_id IS NULL)`,
      [tenantId, dateStr, serviceId]
    );
    if (fullBlocks.length) return [];

    // 3. Get partial blocks for this date
    const [partialBlocks] = await db.execute<BlockedPeriodRow[]>(
      `SELECT start_time, end_time FROM service_blocked_periods
       WHERE tenant_id = ? AND blocked_date = ? AND start_time IS NOT NULL
         AND (service_id = ? OR service_id IS NULL)`,
      [tenantId, dateStr, serviceId]
    );

    // 4. Get existing bookings for this date (pending + confirmed)
    const [bookings] = await db.execute<RowDataPacket[]>(
      `SELECT start_time, end_time FROM service_bookings
       WHERE service_id = ? AND booking_date = ?
         AND status IN ('pendiente', 'confirmada')`,
      [serviceId, dateStr]
    );

    const availableSlots: string[] = [];

    for (const avail of availRows) {
      const slotMin = avail.slot_duration_minutes;
      const maxSim = avail.max_simultaneous;

      // Generate all slots for this availability block
      const [sh, sm] = avail.start_time.split(':').map(Number);
      const [eh, em] = avail.end_time.split(':').map(Number);
      const startMinutes = sh * 60 + sm;
      const endMinutes = eh * 60 + em;

      for (let t = startMinutes; t + slotMin <= endMinutes; t += slotMin) {
        const slotHH = String(Math.floor(t / 60)).padStart(2, '0');
        const slotMM = String(t % 60).padStart(2, '0');
        const slotTime = `${slotHH}:${slotMM}`;
        const slotEndMin = t + slotMin;
        const slotEndHH = String(Math.floor(slotEndMin / 60)).padStart(2, '0');
        const slotEndMM = String(slotEndMin % 60).padStart(2, '0');
        const slotEndTime = `${slotEndHH}:${slotEndMM}`;

        // Check partial blocks
        const isBlocked = partialBlocks.some((b) => {
          if (!b.start_time || !b.end_time) return false;
          const [bsh, bsm] = b.start_time.split(':').map(Number);
          const [beh, bem] = b.end_time.split(':').map(Number);
          const bStart = bsh * 60 + bsm;
          const bEnd = beh * 60 + bem;
          return t < bEnd && slotEndMin > bStart;
        });
        if (isBlocked) continue;

        // Count concurrent bookings
        const concurrent = bookings.filter((b) => {
          if (!b.start_time) return false;
          const [bsh, bsm] = b.start_time.split(':').map(Number);
          const [beh, bem] = (b.end_time as string).split(':').map(Number);
          const bStart = bsh * 60 + bsm;
          const bEnd = beh * 60 + bem;
          return t < bEnd && slotEndMin > bStart;
        }).length;

        if (concurrent < maxSim) {
          availableSlots.push(`${slotTime}-${slotEndTime}`);
        }
      }
    }

    return availableSlots;
  }

  // ── PUBLIC: list published services by tenant slug ─────────────
  async findPublicBySlug(slug: string) {
    const [tenants] = await db.execute<RowDataPacket[]>(
      "SELECT id FROM tenants WHERE slug = ? AND status = 'activo' LIMIT 1",
      [slug]
    );
    if (!tenants.length) throw new AppError('Tienda no encontrada', 404);
    const tenantId = tenants[0].id;
    const [rows] = await db.execute<ServiceRow[]>(
      'SELECT * FROM services WHERE tenant_id = ? AND is_published = TRUE AND is_active = TRUE ORDER BY sort_order, name',
      [tenantId]
    );
    return { tenantId, services: rows.map(mapService) };
  }

  // ── BOOKINGS ──────────────────────────────────────────────────
  async findBookings(tenantId: string, filters?: {
    serviceId?: string; status?: string; dateFrom?: string; dateTo?: string;
    page?: number; limit?: number;
  }) {
    const page = filters?.page || 1;
    const limit = filters?.limit || 20;
    const offset = (page - 1) * limit;
    const conditions = ['tenant_id = ?'];
    const values: unknown[] = [tenantId];

    if (filters?.serviceId) { conditions.push('service_id = ?'); values.push(filters.serviceId); }
    if (filters?.status) { conditions.push('status = ?'); values.push(filters.status); }
    if (filters?.dateFrom) { conditions.push('(booking_date >= ? OR booking_date IS NULL)'); values.push(filters.dateFrom); }
    if (filters?.dateTo) { conditions.push('(booking_date <= ? OR booking_date IS NULL)'); values.push(filters.dateTo); }

    const where = `WHERE ${conditions.join(' AND ')}`;
    const [countRows] = await db.execute<CountRow[]>(
      `SELECT COUNT(*) as total FROM service_bookings ${where}`, values
    );
    const total = countRows[0].total;
    const [rows] = await db.execute<BookingRow[]>(
      `SELECT * FROM service_bookings ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
      [...values, String(limit), String(offset)]
    );
    return {
      data: rows.map(mapBooking),
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async createBooking(tenantId: string, data: {
    serviceId: string; clientName: string; clientPhone: string;
    clientEmail?: string; clientNotes?: string;
    bookingDate?: string; startTime?: string;
    preferredDateRange?: string; projectDescription?: string; budgetRange?: string;
  }) {
    // Validate service belongs to tenant and is active
    const [svcRows] = await db.execute<ServiceRow[]>(
      'SELECT * FROM services WHERE id = ? AND tenant_id = ? AND is_active = TRUE',
      [data.serviceId, tenantId]
    );
    if (!svcRows.length) throw new AppError('Servicio no disponible', 404);
    const svc = svcRows[0];

    let endTime: string | null = null;

    // For cita type: validate slot is available
    if (svc.service_type === 'cita' && data.bookingDate && data.startTime) {
      const available = await this.getAvailableSlots(data.serviceId, tenantId, data.bookingDate);
      const matchingSlot = available.find((s) => s.startsWith(data.startTime!));
      if (!matchingSlot) throw new AppError('El horario seleccionado no está disponible', 400);
      endTime = matchingSlot.split('-')[1];
    }

    const id = uuidv4();
    await db.execute<ResultSetHeader>(
      `INSERT INTO service_bookings
        (id, tenant_id, service_id, service_name, booking_type, client_name, client_phone,
         client_email, client_notes, booking_date, start_time, end_time,
         preferred_date_range, project_description, budget_range)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id, tenantId, data.serviceId, svc.name, svc.service_type,
        data.clientName, data.clientPhone, data.clientEmail || null,
        data.clientNotes || null,
        data.bookingDate || null, data.startTime || null, endTime,
        data.preferredDateRange || null, data.projectDescription || null,
        data.budgetRange || null,
      ]
    );

    const [rows] = await db.execute<BookingRow[]>(
      'SELECT * FROM service_bookings WHERE id = ?', [id]
    );
    return mapBooking(rows[0]);
  }

  async updateBookingStatus(id: string, tenantId: string, data: {
    status?: string; merchantNotes?: string;
  }) {
    const fields: string[] = [];
    const values: unknown[] = [];
    if (data.status) { fields.push('status = ?'); values.push(data.status); }
    if (data.merchantNotes !== undefined) { fields.push('merchant_notes = ?'); values.push(data.merchantNotes); }
    if (!fields.length) throw new AppError('Sin cambios', 400);
    values.push(id, tenantId);
    const [result] = await db.execute<ResultSetHeader>(
      `UPDATE service_bookings SET ${fields.join(', ')} WHERE id = ? AND tenant_id = ?`,
      values
    );
    if (!result.affectedRows) throw new AppError('Reserva no encontrada', 404);
    const [rows] = await db.execute<BookingRow[]>(
      'SELECT * FROM service_bookings WHERE id = ?', [id]
    );
    return mapBooking(rows[0]);
  }
}

export const servicesService = new ServicesService();
