import { v4 as uuidv4 } from 'uuid';
import { db } from '../../config';
import { AppError } from '../../common/middleware';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

// ─── Row interfaces ───────────────────────────────────────────────────────────

interface PropertyRow extends RowDataPacket {
  id: string; tenant_id: string; code: string; title: string;
  description: string | null; property_type: string; operation_type: string;
  status: string; price: number; admin_fee: number | null;
  address: string | null; city: string | null; neighborhood: string | null;
  state_province: string | null; country: string;
  lat: number | null; lng: number | null; stratum: number | null;
  area_m2: number | null; built_area_m2: number | null;
  bedrooms: number; bathrooms: number; garages: number; floors: number;
  age_years: number | null; owner_id: string | null; assigned_agent_id: string | null;
  is_featured: number; is_published: number; published_at: Date | null;
  cover_image_url: string | null; tags: string | null; seo_slug: string | null;
  created_at: Date; updated_at: Date;
  owner_name?: string; agent_name?: string;
}

interface OwnerRow extends RowDataPacket {
  id: string; tenant_id: string; full_name: string; document_type: string;
  document: string | null; phone: string | null; email: string | null;
  address: string | null; city: string | null; bank_name: string | null;
  bank_account: string | null; bank_account_type: string | null; notes: string | null;
  created_at: Date; updated_at: Date;
}

interface ClientRow extends RowDataPacket {
  id: string; tenant_id: string; full_name: string; document_type: string | null;
  document: string | null; phone: string | null; email: string | null;
  client_type: string; source: string | null; assigned_agent_id: string | null;
  notes: string | null; created_at: Date; updated_at: Date;
  agent_name?: string;
}

interface LeadRow extends RowDataPacket {
  id: string; tenant_id: string; client_id: string | null; full_name: string;
  phone: string | null; email: string | null; source: string | null;
  interested_in: string; budget_min: number | null; budget_max: number | null;
  property_type_pref: string | null; city_pref: string | null; stage: string;
  assigned_agent_id: string | null; property_id: string | null;
  notes: string | null; last_contact_at: Date | null;
  created_at: Date; updated_at: Date;
  agent_name?: string; property_title?: string;
}

interface VisitRow extends RowDataPacket {
  id: string; tenant_id: string; property_id: string; client_id: string | null;
  lead_id: string | null; assigned_agent_id: string | null;
  scheduled_at: Date; duration_minutes: number; visit_type: string; status: string;
  feedback: string | null; rating: number | null; notes: string | null;
  created_at: Date; updated_at: Date;
  property_title?: string; client_name?: string; agent_name?: string;
}

interface ContractRow extends RowDataPacket {
  id: string; tenant_id: string; contract_number: string; contract_type: string;
  property_id: string; client_id: string; owner_id: string | null;
  start_date: string; end_date: string | null; canon: number | null;
  sale_price: number | null; commission_pct: number | null; commission_amount: number | null;
  deposit_amount: number | null; status: string; notes: string | null;
  created_by: string | null; created_at: Date; updated_at: Date;
  property_title?: string; client_name?: string; owner_name?: string;
}

interface CountRow extends RowDataPacket { total: number; }

// ─── Service ──────────────────────────────────────────────────────────────────

class RealEstateService {

  // ── PROPERTIES ────────────────────────────────────────────────────────────

  async getProperties(tenantId: string, filters: {
    status?: string; operation_type?: string; property_type?: string;
    city?: string; minPrice?: number; maxPrice?: number;
    is_published?: boolean; is_featured?: boolean; search?: string;
  } = {}) {
    let sql = `
      SELECT p.*,
             o.full_name AS owner_name,
             u.name      AS agent_name
      FROM re_properties p
      LEFT JOIN re_owners o ON o.id = p.owner_id
      LEFT JOIN users u    ON u.id  = p.assigned_agent_id
      WHERE p.tenant_id = ?`;
    const params: any[] = [tenantId];

    if (filters.status)         { sql += ' AND p.status = ?';         params.push(filters.status); }
    if (filters.operation_type) { sql += ' AND p.operation_type = ?'; params.push(filters.operation_type); }
    if (filters.property_type)  { sql += ' AND p.property_type = ?';  params.push(filters.property_type); }
    if (filters.city)           { sql += ' AND p.city = ?';           params.push(filters.city); }
    if (filters.minPrice != null) { sql += ' AND p.price >= ?';       params.push(filters.minPrice); }
    if (filters.maxPrice != null) { sql += ' AND p.price <= ?';       params.push(filters.maxPrice); }
    if (filters.is_published != null) { sql += ' AND p.is_published = ?'; params.push(filters.is_published ? 1 : 0); }
    if (filters.is_featured != null)  { sql += ' AND p.is_featured = ?';  params.push(filters.is_featured ? 1 : 0); }
    if (filters.search) {
      sql += ' AND (p.title LIKE ? OR p.code LIKE ? OR p.address LIKE ? OR p.neighborhood LIKE ?)';
      const s = `%${filters.search}%`;
      params.push(s, s, s, s);
    }
    sql += ' ORDER BY p.is_featured DESC, p.updated_at DESC';

    const [rows] = await db.execute<PropertyRow[]>(sql, params);
    return rows;
  }

  async getPropertyById(tenantId: string, id: string) {
    const [[prop]] = await db.execute<PropertyRow[]>(
      `SELECT p.*, o.full_name AS owner_name, u.name AS agent_name
       FROM re_properties p
       LEFT JOIN re_owners o ON o.id = p.owner_id
       LEFT JOIN users u    ON u.id  = p.assigned_agent_id
       WHERE p.id = ? AND p.tenant_id = ?`,
      [id, tenantId]
    );
    if (!prop) throw new AppError('Inmueble no encontrado', 404);

    const [features] = await db.execute<RowDataPacket[]>(
      'SELECT feature FROM re_property_features WHERE property_id = ?', [id]
    );
    const [media] = await db.execute<RowDataPacket[]>(
      'SELECT * FROM re_property_media WHERE property_id = ? ORDER BY is_cover DESC, sort_order ASC', [id]
    );

    return {
      ...prop,
      tags: prop.tags ? JSON.parse(prop.tags) : [],
      features: features.map((f: any) => f.feature),
      media,
    };
  }

  async createProperty(tenantId: string, data: {
    code: string; title: string; description?: string;
    property_type: string; operation_type: string;
    price: number; admin_fee?: number;
    address?: string; city?: string; neighborhood?: string;
    state_province?: string; country?: string;
    lat?: number; lng?: number; stratum?: number;
    area_m2?: number; built_area_m2?: number;
    bedrooms?: number; bathrooms?: number; garages?: number;
    floors?: number; age_years?: number;
    owner_id?: string; assigned_agent_id?: string;
    cover_image_url?: string; tags?: string[]; seo_slug?: string;
    features?: string[];
  }) {
    const id = uuidv4();
    await db.execute<ResultSetHeader>(
      `INSERT INTO re_properties
        (id, tenant_id, code, title, description, property_type, operation_type,
         price, admin_fee, address, city, neighborhood, state_province, country,
         lat, lng, stratum, area_m2, built_area_m2, bedrooms, bathrooms, garages,
         floors, age_years, owner_id, assigned_agent_id, cover_image_url, tags, seo_slug)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [id, tenantId, data.code, data.title, data.description ?? null,
       data.property_type, data.operation_type,
       data.price, data.admin_fee ?? null,
       data.address ?? null, data.city ?? null, data.neighborhood ?? null,
       data.state_province ?? null, data.country ?? 'Colombia',
       data.lat ?? null, data.lng ?? null, data.stratum ?? null,
       data.area_m2 ?? null, data.built_area_m2 ?? null,
       data.bedrooms ?? 0, data.bathrooms ?? 0, data.garages ?? 0,
       data.floors ?? 1, data.age_years ?? null,
       data.owner_id ?? null, data.assigned_agent_id ?? null,
       data.cover_image_url ?? null,
       data.tags ? JSON.stringify(data.tags) : null,
       data.seo_slug ?? null]
    );

    if (data.features?.length) {
      await this._syncFeatures(id, data.features);
    }
    return this.getPropertyById(tenantId, id);
  }

  async updateProperty(tenantId: string, id: string, data: Partial<{
    code: string; title: string; description: string;
    property_type: string; operation_type: string; status: string;
    price: number; admin_fee: number;
    address: string; city: string; neighborhood: string;
    state_province: string; country: string;
    lat: number; lng: number; stratum: number;
    area_m2: number; built_area_m2: number;
    bedrooms: number; bathrooms: number; garages: number;
    floors: number; age_years: number;
    owner_id: string; assigned_agent_id: string;
    is_featured: boolean; is_published: boolean;
    cover_image_url: string; tags: string[]; seo_slug: string;
    features: string[];
  }>) {
    const [[existing]] = await db.execute<PropertyRow[]>(
      'SELECT id FROM re_properties WHERE id = ? AND tenant_id = ?', [id, tenantId]
    );
    if (!existing) throw new AppError('Inmueble no encontrado', 404);

    const fields: string[] = [];
    const values: any[] = [];

    const simple = [
      'code','title','description','property_type','operation_type','status',
      'price','admin_fee','address','city','neighborhood','state_province','country',
      'lat','lng','stratum','area_m2','built_area_m2','bedrooms','bathrooms','garages',
      'floors','age_years','owner_id','assigned_agent_id','cover_image_url','seo_slug',
    ] as const;

    for (const key of simple) {
      if (data[key as keyof typeof data] !== undefined) {
        fields.push(`${key} = ?`);
        values.push((data as any)[key] ?? null);
      }
    }
    if (data.is_featured !== undefined) { fields.push('is_featured = ?'); values.push(data.is_featured ? 1 : 0); }
    if (data.is_published !== undefined) {
      fields.push('is_published = ?'); values.push(data.is_published ? 1 : 0);
      fields.push('published_at = ?'); values.push(data.is_published ? new Date() : null);
    }
    if (data.tags !== undefined) { fields.push('tags = ?'); values.push(JSON.stringify(data.tags)); }

    if (fields.length) {
      await db.execute(`UPDATE re_properties SET ${fields.join(', ')} WHERE id = ? AND tenant_id = ?`, [...values, id, tenantId]);
    }
    if (data.features !== undefined) {
      await this._syncFeatures(id, data.features);
    }
    return this.getPropertyById(tenantId, id);
  }

  async deleteProperty(tenantId: string, id: string) {
    const [result] = await db.execute<ResultSetHeader>(
      'DELETE FROM re_properties WHERE id = ? AND tenant_id = ?', [id, tenantId]
    );
    if (result.affectedRows === 0) throw new AppError('Inmueble no encontrado', 404);
  }

  private async _syncFeatures(propertyId: string, features: string[]) {
    await db.execute('DELETE FROM re_property_features WHERE property_id = ?', [propertyId]);
    if (features.length) {
      const rows = features.map(f => `(${db.escape(propertyId)}, ${db.escape(f)})`).join(',');
      await db.execute(`INSERT IGNORE INTO re_property_features (property_id, feature) VALUES ${rows}`);
    }
  }

  // ── MEDIA ─────────────────────────────────────────────────────────────────

  async addMedia(tenantId: string, propertyId: string, data: {
    media_type: string; url: string; caption?: string; sort_order?: number; is_cover?: boolean;
  }) {
    const [[prop]] = await db.execute<RowDataPacket[]>(
      'SELECT id FROM re_properties WHERE id = ? AND tenant_id = ?', [propertyId, tenantId]
    );
    if (!prop) throw new AppError('Inmueble no encontrado', 404);

    if (data.is_cover) {
      await db.execute('UPDATE re_property_media SET is_cover = 0 WHERE property_id = ?', [propertyId]);
    }
    const [result] = await db.execute<ResultSetHeader>(
      `INSERT INTO re_property_media (property_id, media_type, url, caption, sort_order, is_cover)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [propertyId, data.media_type ?? 'foto', data.url, data.caption ?? null,
       data.sort_order ?? 0, data.is_cover ? 1 : 0]
    );
    if (data.is_cover) {
      await db.execute('UPDATE re_properties SET cover_image_url = ? WHERE id = ?', [data.url, propertyId]);
    }
    return { id: result.insertId };
  }

  async deleteMedia(tenantId: string, mediaId: number) {
    await db.execute(
      `DELETE m FROM re_property_media m
       JOIN re_properties p ON p.id = m.property_id
       WHERE m.id = ? AND p.tenant_id = ?`,
      [mediaId, tenantId]
    );
  }

  // ── OWNERS ────────────────────────────────────────────────────────────────

  async getOwners(tenantId: string) {
    const [rows] = await db.execute<OwnerRow[]>(
      `SELECT o.*,
        (SELECT COUNT(*) FROM re_properties WHERE owner_id = o.id) AS properties_count
       FROM re_owners o WHERE o.tenant_id = ? ORDER BY o.full_name`,
      [tenantId]
    );
    return rows;
  }

  async getOwnerById(tenantId: string, id: string) {
    const [[owner]] = await db.execute<OwnerRow[]>(
      'SELECT * FROM re_owners WHERE id = ? AND tenant_id = ?', [id, tenantId]
    );
    if (!owner) throw new AppError('Propietario no encontrado', 404);
    return owner;
  }

  async createOwner(tenantId: string, data: Omit<OwnerRow, 'id'|'tenant_id'|'created_at'|'updated_at'>) {
    const id = uuidv4();
    await db.execute(
      `INSERT INTO re_owners (id, tenant_id, full_name, document_type, document, phone, email,
        address, city, bank_name, bank_account, bank_account_type, notes)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [id, tenantId, data.full_name, data.document_type ?? 'cedula', data.document ?? null,
       data.phone ?? null, data.email ?? null, data.address ?? null, data.city ?? null,
       data.bank_name ?? null, data.bank_account ?? null, data.bank_account_type ?? null,
       data.notes ?? null]
    );
    return this.getOwnerById(tenantId, id);
  }

  async updateOwner(tenantId: string, id: string, data: Partial<Omit<OwnerRow, 'id'|'tenant_id'|'created_at'|'updated_at'>>) {
    const [[existing]] = await db.execute<RowDataPacket[]>(
      'SELECT id FROM re_owners WHERE id = ? AND tenant_id = ?', [id, tenantId]
    );
    if (!existing) throw new AppError('Propietario no encontrado', 404);

    const fields: string[] = [];
    const values: any[] = [];
    const cols = ['full_name','document_type','document','phone','email','address','city','bank_name','bank_account','bank_account_type','notes'];
    for (const col of cols) {
      if ((data as any)[col] !== undefined) { fields.push(`${col} = ?`); values.push((data as any)[col] ?? null); }
    }
    if (fields.length) {
      await db.execute(`UPDATE re_owners SET ${fields.join(', ')} WHERE id = ? AND tenant_id = ?`, [...values, id, tenantId]);
    }
    return this.getOwnerById(tenantId, id);
  }

  async deleteOwner(tenantId: string, id: string) {
    const [result] = await db.execute<ResultSetHeader>(
      'DELETE FROM re_owners WHERE id = ? AND tenant_id = ?', [id, tenantId]
    );
    if (result.affectedRows === 0) throw new AppError('Propietario no encontrado', 404);
  }

  // ── CLIENTS ───────────────────────────────────────────────────────────────

  async getClients(tenantId: string, filters: { client_type?: string; search?: string } = {}) {
    let sql = `SELECT c.*, u.name AS agent_name FROM re_clients c
               LEFT JOIN users u ON u.id = c.assigned_agent_id
               WHERE c.tenant_id = ?`;
    const params: any[] = [tenantId];
    if (filters.client_type) { sql += ' AND c.client_type = ?'; params.push(filters.client_type); }
    if (filters.search) {
      sql += ' AND (c.full_name LIKE ? OR c.phone LIKE ? OR c.email LIKE ?)';
      const s = `%${filters.search}%`;
      params.push(s, s, s);
    }
    sql += ' ORDER BY c.full_name';
    const [rows] = await db.execute<ClientRow[]>(sql, params);
    return rows;
  }

  async getClientById(tenantId: string, id: string) {
    const [[client]] = await db.execute<ClientRow[]>(
      `SELECT c.*, u.name AS agent_name FROM re_clients c
       LEFT JOIN users u ON u.id = c.assigned_agent_id
       WHERE c.id = ? AND c.tenant_id = ?`,
      [id, tenantId]
    );
    if (!client) throw new AppError('Cliente no encontrado', 404);
    return client;
  }

  async createClient(tenantId: string, data: Partial<Omit<ClientRow, 'id'|'tenant_id'|'created_at'|'updated_at'|'agent_name'>> & { full_name: string }) {
    const id = uuidv4();
    await db.execute(
      `INSERT INTO re_clients (id, tenant_id, full_name, document_type, document, phone, email,
        client_type, source, assigned_agent_id, notes)
       VALUES (?,?,?,?,?,?,?,?,?,?,?)`,
      [id, tenantId, data.full_name, data.document_type ?? null, data.document ?? null,
       data.phone ?? null, data.email ?? null, data.client_type ?? 'prospecto',
       data.source ?? null, data.assigned_agent_id ?? null, data.notes ?? null]
    );
    return this.getClientById(tenantId, id);
  }

  async updateClient(tenantId: string, id: string, data: Partial<Omit<ClientRow, 'id'|'tenant_id'|'created_at'|'updated_at'|'agent_name'>>) {
    const [[existing]] = await db.execute<RowDataPacket[]>(
      'SELECT id FROM re_clients WHERE id = ? AND tenant_id = ?', [id, tenantId]
    );
    if (!existing) throw new AppError('Cliente no encontrado', 404);
    const fields: string[] = [];
    const values: any[] = [];
    const cols = ['full_name','document_type','document','phone','email','client_type','source','assigned_agent_id','notes'];
    for (const col of cols) {
      if ((data as any)[col] !== undefined) { fields.push(`${col} = ?`); values.push((data as any)[col] ?? null); }
    }
    if (fields.length) {
      await db.execute(`UPDATE re_clients SET ${fields.join(', ')} WHERE id = ? AND tenant_id = ?`, [...values, id, tenantId]);
    }
    return this.getClientById(tenantId, id);
  }

  async deleteClient(tenantId: string, id: string) {
    const [result] = await db.execute<ResultSetHeader>(
      'DELETE FROM re_clients WHERE id = ? AND tenant_id = ?', [id, tenantId]
    );
    if (result.affectedRows === 0) throw new AppError('Cliente no encontrado', 404);
  }

  // ── LEADS ─────────────────────────────────────────────────────────────────

  async getLeads(tenantId: string, filters: { stage?: string; assigned_agent_id?: string; search?: string } = {}) {
    let sql = `SELECT l.*, u.name AS agent_name, p.title AS property_title
               FROM re_leads l
               LEFT JOIN users u           ON u.id = l.assigned_agent_id
               LEFT JOIN re_properties p   ON p.id = l.property_id
               WHERE l.tenant_id = ?`;
    const params: any[] = [tenantId];
    if (filters.stage)             { sql += ' AND l.stage = ?';             params.push(filters.stage); }
    if (filters.assigned_agent_id) { sql += ' AND l.assigned_agent_id = ?'; params.push(filters.assigned_agent_id); }
    if (filters.search) {
      sql += ' AND (l.full_name LIKE ? OR l.phone LIKE ? OR l.email LIKE ?)';
      const s = `%${filters.search}%`;
      params.push(s, s, s);
    }
    sql += ' ORDER BY l.updated_at DESC';
    const [rows] = await db.execute<LeadRow[]>(sql, params);
    return rows;
  }

  async getLeadById(tenantId: string, id: string) {
    const [[lead]] = await db.execute<LeadRow[]>(
      `SELECT l.*, u.name AS agent_name, p.title AS property_title
       FROM re_leads l
       LEFT JOIN users u         ON u.id = l.assigned_agent_id
       LEFT JOIN re_properties p ON p.id = l.property_id
       WHERE l.id = ? AND l.tenant_id = ?`,
      [id, tenantId]
    );
    if (!lead) throw new AppError('Lead no encontrado', 404);
    const [activities] = await db.execute<RowDataPacket[]>(
      `SELECT a.*, u.name AS created_by_name FROM re_lead_activities a
       LEFT JOIN users u ON u.id = a.created_by
       WHERE a.lead_id = ? ORDER BY a.created_at DESC`,
      [id]
    );
    return { ...lead, activities };
  }

  async createLead(tenantId: string, data: Partial<Omit<LeadRow, 'id'|'tenant_id'|'created_at'|'updated_at'|'agent_name'|'property_title'>> & { full_name: string }) {
    const id = uuidv4();
    await db.execute(
      `INSERT INTO re_leads (id, tenant_id, client_id, full_name, phone, email, source,
        interested_in, budget_min, budget_max, property_type_pref, city_pref, stage,
        assigned_agent_id, property_id, notes)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [id, tenantId, data.client_id ?? null, data.full_name, data.phone ?? null,
       data.email ?? null, data.source ?? null, data.interested_in ?? 'venta',
       data.budget_min ?? null, data.budget_max ?? null,
       data.property_type_pref ?? null, data.city_pref ?? null,
       data.stage ?? 'nuevo', data.assigned_agent_id ?? null,
       data.property_id ?? null, data.notes ?? null]
    );
    return this.getLeadById(tenantId, id);
  }

  async updateLead(tenantId: string, id: string, data: Partial<Omit<LeadRow, 'id'|'tenant_id'|'created_at'|'updated_at'|'agent_name'|'property_title'>>) {
    const [[existing]] = await db.execute<RowDataPacket[]>(
      'SELECT id, stage FROM re_leads WHERE id = ? AND tenant_id = ?', [id, tenantId]
    );
    if (!existing) throw new AppError('Lead no encontrado', 404);

    const fields: string[] = [];
    const values: any[] = [];
    const cols = ['client_id','full_name','phone','email','source','interested_in','budget_min','budget_max',
                  'property_type_pref','city_pref','stage','assigned_agent_id','property_id','notes','last_contact_at'];
    for (const col of cols) {
      if ((data as any)[col] !== undefined) { fields.push(`${col} = ?`); values.push((data as any)[col] ?? null); }
    }
    if (fields.length) {
      await db.execute(`UPDATE re_leads SET ${fields.join(', ')} WHERE id = ? AND tenant_id = ?`, [...values, id, tenantId]);
    }
    return this.getLeadById(tenantId, id);
  }

  async addLeadActivity(tenantId: string, leadId: string, data: {
    activity_type: string; description: string; created_by?: string;
    scheduled_at?: string; completed?: boolean;
  }) {
    const [[lead]] = await db.execute<RowDataPacket[]>(
      'SELECT id FROM re_leads WHERE id = ? AND tenant_id = ?', [leadId, tenantId]
    );
    if (!lead) throw new AppError('Lead no encontrado', 404);
    const [result] = await db.execute<ResultSetHeader>(
      `INSERT INTO re_lead_activities (tenant_id, lead_id, activity_type, description, created_by, scheduled_at, completed)
       VALUES (?,?,?,?,?,?,?)`,
      [tenantId, leadId, data.activity_type, data.description, data.created_by ?? null,
       data.scheduled_at ?? null, data.completed !== false ? 1 : 0]
    );
    await db.execute('UPDATE re_leads SET last_contact_at = NOW() WHERE id = ?', [leadId]);
    return { id: result.insertId };
  }

  async deleteLead(tenantId: string, id: string) {
    const [result] = await db.execute<ResultSetHeader>(
      'DELETE FROM re_leads WHERE id = ? AND tenant_id = ?', [id, tenantId]
    );
    if (result.affectedRows === 0) throw new AppError('Lead no encontrado', 404);
  }

  // ── VISITS ────────────────────────────────────────────────────────────────

  async getVisits(tenantId: string, filters: { status?: string; property_id?: string; date?: string } = {}) {
    let sql = `SELECT v.*,
                 p.title  AS property_title,
                 c.full_name AS client_name,
                 u.name   AS agent_name
               FROM re_visits v
               LEFT JOIN re_properties p ON p.id = v.property_id
               LEFT JOIN re_clients c    ON c.id = v.client_id
               LEFT JOIN users u         ON u.id = v.assigned_agent_id
               WHERE v.tenant_id = ?`;
    const params: any[] = [tenantId];
    if (filters.status)      { sql += ' AND v.status = ?';      params.push(filters.status); }
    if (filters.property_id) { sql += ' AND v.property_id = ?'; params.push(filters.property_id); }
    if (filters.date)        { sql += ' AND DATE(v.scheduled_at) = ?'; params.push(filters.date); }
    sql += ' ORDER BY v.scheduled_at DESC';
    const [rows] = await db.execute<VisitRow[]>(sql, params);
    return rows;
  }

  async createVisit(tenantId: string, data: {
    property_id: string; client_id?: string; lead_id?: string;
    assigned_agent_id?: string; scheduled_at: string; duration_minutes?: number;
    visit_type?: string; notes?: string;
  }) {
    const id = uuidv4();
    await db.execute(
      `INSERT INTO re_visits (id, tenant_id, property_id, client_id, lead_id, assigned_agent_id,
        scheduled_at, duration_minutes, visit_type, notes)
       VALUES (?,?,?,?,?,?,?,?,?,?)`,
      [id, tenantId, data.property_id, data.client_id ?? null, data.lead_id ?? null,
       data.assigned_agent_id ?? null, data.scheduled_at, data.duration_minutes ?? 30,
       data.visit_type ?? 'presencial', data.notes ?? null]
    );
    const [[visit]] = await db.execute<VisitRow[]>(
      `SELECT v.*, p.title AS property_title, c.full_name AS client_name, u.name AS agent_name
       FROM re_visits v
       LEFT JOIN re_properties p ON p.id = v.property_id
       LEFT JOIN re_clients c    ON c.id = v.client_id
       LEFT JOIN users u         ON u.id = v.assigned_agent_id
       WHERE v.id = ?`,
      [id]
    );
    return visit;
  }

  async updateVisitStatus(tenantId: string, id: string, status: string, extra: { feedback?: string; rating?: number; notes?: string } = {}) {
    const [result] = await db.execute<ResultSetHeader>(
      `UPDATE re_visits SET status = ?, feedback = COALESCE(?, feedback), rating = COALESCE(?, rating), notes = COALESCE(?, notes)
       WHERE id = ? AND tenant_id = ?`,
      [status, extra.feedback ?? null, extra.rating ?? null, extra.notes ?? null, id, tenantId]
    );
    if (result.affectedRows === 0) throw new AppError('Visita no encontrada', 404);
  }

  // ── CONTRACTS ─────────────────────────────────────────────────────────────

  async getContracts(tenantId: string, filters: { status?: string; contract_type?: string } = {}) {
    let sql = `SELECT c.*, p.title AS property_title, cl.full_name AS client_name, o.full_name AS owner_name
               FROM re_contracts c
               JOIN re_properties p  ON p.id  = c.property_id
               JOIN re_clients cl    ON cl.id = c.client_id
               LEFT JOIN re_owners o ON o.id  = c.owner_id
               WHERE c.tenant_id = ?`;
    const params: any[] = [tenantId];
    if (filters.status)        { sql += ' AND c.status = ?';        params.push(filters.status); }
    if (filters.contract_type) { sql += ' AND c.contract_type = ?'; params.push(filters.contract_type); }
    sql += ' ORDER BY c.start_date DESC';
    const [rows] = await db.execute<ContractRow[]>(sql, params);
    return rows;
  }

  async createContract(tenantId: string, userId: string, data: {
    contract_type: string; property_id: string; client_id: string; owner_id?: string;
    start_date: string; end_date?: string; canon?: number; sale_price?: number;
    commission_pct?: number; deposit_amount?: number; notes?: string;
  }) {
    const id = uuidv4();
    const [[{ nextNum }]] = await db.execute<RowDataPacket[]>(
      'SELECT COUNT(*) + 1 AS nextNum FROM re_contracts WHERE tenant_id = ?', [tenantId]
    ) as any;
    const contract_number = `C${String(nextNum).padStart(4, '0')}`;

    const commission_amount = data.commission_pct && data.sale_price
      ? (data.sale_price * data.commission_pct) / 100
      : data.commission_pct && data.canon
        ? (data.canon * data.commission_pct) / 100
        : null;

    await db.execute(
      `INSERT INTO re_contracts (id, tenant_id, contract_number, contract_type, property_id, client_id,
        owner_id, start_date, end_date, canon, sale_price, commission_pct, commission_amount,
        deposit_amount, status, notes, created_by)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [id, tenantId, contract_number, data.contract_type, data.property_id, data.client_id,
       data.owner_id ?? null, data.start_date, data.end_date ?? null,
       data.canon ?? null, data.sale_price ?? null,
       data.commission_pct ?? null, commission_amount,
       data.deposit_amount ?? null, 'borrador', data.notes ?? null, userId]
    );
    return { id, contract_number };
  }

  async updateContractStatus(tenantId: string, id: string, status: string) {
    const [result] = await db.execute<ResultSetHeader>(
      'UPDATE re_contracts SET status = ? WHERE id = ? AND tenant_id = ?', [status, id, tenantId]
    );
    if (result.affectedRows === 0) throw new AppError('Contrato no encontrado', 404);
  }

  // ── RENT PAYMENTS ─────────────────────────────────────────────────────────

  async getRentPayments(tenantId: string, contractId: string) {
    const [rows] = await db.execute<RowDataPacket[]>(
      `SELECT * FROM re_rent_payments WHERE tenant_id = ? AND contract_id = ?
       ORDER BY period_year DESC, period_month DESC`,
      [tenantId, contractId]
    );
    return rows;
  }

  async createRentPayment(tenantId: string, data: {
    contract_id: string; period_month: number; period_year: number;
    due_date: string; canon: number; late_fee?: number;
  }) {
    const total_amount = data.canon + (data.late_fee ?? 0);
    const [result] = await db.execute<ResultSetHeader>(
      `INSERT INTO re_rent_payments (tenant_id, contract_id, period_month, period_year,
        due_date, canon, late_fee, total_amount)
       VALUES (?,?,?,?,?,?,?,?)`,
      [tenantId, data.contract_id, data.period_month, data.period_year,
       data.due_date, data.canon, data.late_fee ?? 0, total_amount]
    );
    return { id: result.insertId, total_amount };
  }

  async markRentPaymentPaid(tenantId: string, paymentId: number, data: {
    paid_amount: number; payment_method: string; receipt_url?: string; notes?: string;
  }) {
    const [[payment]] = await db.execute<RowDataPacket[]>(
      'SELECT total_amount FROM re_rent_payments WHERE id = ? AND tenant_id = ?',
      [paymentId, tenantId]
    ) as any;
    if (!payment) throw new AppError('Pago no encontrado', 404);
    const status = data.paid_amount >= Number(payment.total_amount) ? 'pagado' : 'parcial';
    await db.execute(
      `UPDATE re_rent_payments SET status = ?, paid_amount = ?, paid_at = NOW(),
        payment_method = ?, receipt_url = ?, notes = ?
       WHERE id = ? AND tenant_id = ?`,
      [status, data.paid_amount, data.payment_method, data.receipt_url ?? null,
       data.notes ?? null, paymentId, tenantId]
    );
  }

  // ── MAINTENANCES ──────────────────────────────────────────────────────────

  async getMaintenances(tenantId: string, filters: { status?: string; property_id?: string; priority?: string } = {}) {
    let sql = `SELECT m.*, p.title AS property_title
               FROM re_maintenances m
               JOIN re_properties p ON p.id = m.property_id
               WHERE m.tenant_id = ?`;
    const params: any[] = [tenantId];
    if (filters.status)      { sql += ' AND m.status = ?';      params.push(filters.status); }
    if (filters.property_id) { sql += ' AND m.property_id = ?'; params.push(filters.property_id); }
    if (filters.priority)    { sql += ' AND m.priority = ?';    params.push(filters.priority); }
    sql += ' ORDER BY FIELD(m.priority, "urgente","alta","media","baja"), m.created_at DESC';
    const [rows] = await db.execute<RowDataPacket[]>(sql, params);
    return rows;
  }

  async createMaintenance(tenantId: string, data: {
    property_id: string; contract_id?: string; reported_by?: string;
    title: string; description?: string; category?: string;
    priority?: string; estimated_cost?: number; assigned_to?: string;
    scheduled_at?: string;
  }) {
    const id = uuidv4();
    await db.execute(
      `INSERT INTO re_maintenances (id, tenant_id, property_id, contract_id, reported_by,
        title, description, category, priority, estimated_cost, assigned_to, scheduled_at)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`,
      [id, tenantId, data.property_id, data.contract_id ?? null, data.reported_by ?? null,
       data.title, data.description ?? null, data.category ?? null,
       data.priority ?? 'media', data.estimated_cost ?? null,
       data.assigned_to ?? null, data.scheduled_at ?? null]
    );
    return { id };
  }

  async updateMaintenanceStatus(tenantId: string, id: string, status: string, extra: {
    actual_cost?: number; assigned_to?: string; scheduled_at?: string; notes?: string;
  } = {}) {
    const fields = ['status = ?'];
    const values: any[] = [status];
    if (extra.actual_cost !== undefined) { fields.push('actual_cost = ?'); values.push(extra.actual_cost); }
    if (extra.assigned_to !== undefined) { fields.push('assigned_to = ?'); values.push(extra.assigned_to); }
    if (extra.scheduled_at !== undefined) { fields.push('scheduled_at = ?'); values.push(extra.scheduled_at); }
    if (extra.notes !== undefined) { fields.push('notes = ?'); values.push(extra.notes); }
    if (status === 'completado') { fields.push('completed_at = NOW()'); }
    const [result] = await db.execute<ResultSetHeader>(
      `UPDATE re_maintenances SET ${fields.join(', ')} WHERE id = ? AND tenant_id = ?`,
      [...values, id, tenantId]
    );
    if (result.affectedRows === 0) throw new AppError('Mantenimiento no encontrado', 404);
  }

  // ── DASHBOARD STATS ───────────────────────────────────────────────────────

  async getDashboardStats(tenantId: string) {
    const [[counts]] = await db.execute<RowDataPacket[]>(
      `SELECT
        COUNT(*) AS total_properties,
        SUM(is_published) AS published,
        SUM(status = 'disponible') AS available,
        SUM(status = 'vendido') AS sold,
        SUM(status = 'arrendado') AS rented,
        SUM(status = 'reservado') AS reserved
       FROM re_properties WHERE tenant_id = ?`,
      [tenantId]
    ) as any;

    const [[leadCounts]] = await db.execute<RowDataPacket[]>(
      `SELECT
        COUNT(*) AS total_leads,
        SUM(stage = 'nuevo') AS nuevos,
        SUM(stage = 'negociacion') AS en_negociacion,
        SUM(stage = 'cierre') AS cerrados,
        SUM(stage = 'perdido') AS perdidos
       FROM re_leads WHERE tenant_id = ?`,
      [tenantId]
    ) as any;

    const [[visitCounts]] = await db.execute<RowDataPacket[]>(
      `SELECT COUNT(*) AS total, SUM(status = 'programada') AS programadas
       FROM re_visits WHERE tenant_id = ?`,
      [tenantId]
    ) as any;

    const [[contractCounts]] = await db.execute<RowDataPacket[]>(
      `SELECT COUNT(*) AS total, SUM(status = 'activo') AS activos
       FROM re_contracts WHERE tenant_id = ?`,
      [tenantId]
    ) as any;

    return { properties: counts, leads: leadCounts, visits: visitCounts, contracts: contractCounts };
  }

  // ── PUBLIC PORTAL ─────────────────────────────────────────────────────────

  private async _getTenantWithRE(slug: string): Promise<{ id: string; name: string } | null> {
    // Try with realestate_enabled column (post-migration). Fall back to basic fetch if column missing.
    try {
      const [[t]] = await db.execute<RowDataPacket[]>(
        'SELECT id, name FROM tenants WHERE slug = ? AND status = "activo" AND realestate_enabled = 1 LIMIT 1',
        [slug]
      ) as any;
      return t ?? null;
    } catch {
      // Column doesn't exist yet — deny access until migration runs
      return null;
    }
  }

  async getPublicProperties(slug: string, filters: {
    operation_type?: string; property_type?: string;
    city?: string; minPrice?: number; maxPrice?: number;
    bedrooms?: number; search?: string;
  } = {}) {
    const tenant = await this._getTenantWithRE(slug);
    if (!tenant) return null;

    let sql = `SELECT p.id, p.code, p.title, p.description, p.property_type, p.operation_type,
                      p.status, p.price, p.admin_fee, p.address, p.city, p.neighborhood,
                      p.state_province, p.stratum, p.area_m2, p.built_area_m2,
                      p.bedrooms, p.bathrooms, p.garages, p.cover_image_url,
                      p.tags, p.seo_slug, p.is_featured, p.age_years
               FROM re_properties p
               WHERE p.tenant_id = ? AND p.is_published = 1 AND p.status = 'disponible'`;
    const params: any[] = [tenant.id];

    if (filters.operation_type) { sql += ' AND p.operation_type = ?'; params.push(filters.operation_type); }
    if (filters.property_type)  { sql += ' AND p.property_type = ?';  params.push(filters.property_type); }
    if (filters.city)           { sql += ' AND p.city = ?';           params.push(filters.city); }
    if (filters.bedrooms != null) { sql += ' AND p.bedrooms >= ?';    params.push(filters.bedrooms); }
    if (filters.minPrice != null) { sql += ' AND p.price >= ?';       params.push(filters.minPrice); }
    if (filters.maxPrice != null) { sql += ' AND p.price <= ?';       params.push(filters.maxPrice); }
    if (filters.search) {
      sql += ' AND (p.title LIKE ? OR p.address LIKE ? OR p.neighborhood LIKE ?)';
      const s = `%${filters.search}%`;
      params.push(s, s, s);
    }
    sql += ' ORDER BY p.is_featured DESC, p.published_at DESC';

    const [rows] = await db.execute<RowDataPacket[]>(sql, params);
    return { tenant: { id: tenant.id, name: tenant.name, slug }, properties: rows };
  }

  async getPublicPropertyDetail(slug: string, propertyId: string) {
    const tenant = await this._getTenantWithRE(slug);
    if (!tenant) return null;

    const [[prop]] = await db.execute<RowDataPacket[]>(
      `SELECT p.id, p.code, p.title, p.description, p.property_type, p.operation_type,
              p.status, p.price, p.admin_fee, p.address, p.city, p.neighborhood,
              p.state_province, p.country, p.stratum, p.area_m2, p.built_area_m2,
              p.bedrooms, p.bathrooms, p.garages, p.floors, p.age_years,
              p.cover_image_url, p.tags, p.lat, p.lng
       FROM re_properties p
       WHERE p.id = ? AND p.tenant_id = ? AND p.is_published = 1`,
      [propertyId, tenant.id]
    ) as any;
    if (!prop) return null;

    const [features] = await db.execute<RowDataPacket[]>(
      'SELECT feature FROM re_property_features WHERE property_id = ?', [propertyId]
    );
    const [media] = await db.execute<RowDataPacket[]>(
      'SELECT id, media_type, url, caption, sort_order, is_cover FROM re_property_media WHERE property_id = ? ORDER BY is_cover DESC, sort_order',
      [propertyId]
    );

    return {
      tenant: { id: tenant.id, name: tenant.name, slug },
      property: {
        ...prop,
        tags: prop.tags ? JSON.parse(prop.tags) : [],
        features: features.map((f: any) => f.feature),
        media,
      },
    };
  }

  // ── PUBLIC LEAD REGISTRATION ──────────────────────────────────────────────

  async registerPublicLead(slug: string, data: {
    full_name: string; phone: string; email?: string;
    source?: string; property_id?: string; notes?: string;
    interested_in?: string;
  }) {
    const tenant = await this._getTenantWithRE(slug);
    if (!tenant) throw new AppError('Portal no disponible', 404);

    const id = uuidv4();
    await db.execute(
      `INSERT INTO re_leads (id, tenant_id, full_name, phone, email, source, interested_in, property_id, stage)
       VALUES (?,?,?,?,?,?,?,?,'nuevo')`,
      [id, tenant.id, data.full_name, data.phone, data.email ?? null,
       data.source ?? 'portal', data.interested_in ?? 'venta', data.property_id ?? null]
    );
    return { id };
  }
}

export const realEstateService = new RealEstateService();
