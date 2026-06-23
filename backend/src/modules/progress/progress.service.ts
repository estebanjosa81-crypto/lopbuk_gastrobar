/**
 * progress.service — Transformation tracking (F4.3).
 * Registro de peso/medidas/fotos → tendencia + Progress Score (0–100) que mezcla
 * avance hacia la meta (peso objetivo del perfil de rutina) + consistencia.
 */
import { v4 as uuidv4 } from 'uuid';
import { RowDataPacket } from 'mysql2';
import { db } from '../../config';
import { AppError } from '../../common/middleware';

const safeJson = (s: any) => { if (s == null) return null; if (typeof s !== 'string') return s; try { return JSON.parse(s); } catch { return null; } };
const clamp = (n: number, a = 0, b = 100) => Math.max(a, Math.min(b, n));

class ProgressService {
  /** Registra (o actualiza) el log del día. */
  async addLog(userId: string, data: { loggedOn?: string; weightKg?: number; bodyFat?: number; measurements?: any; photoUrl?: string; note?: string }) {
    if (!userId) throw new AppError('No autenticado', 401);
    const weight = data.weightKg != null && data.weightKg !== ('' as any) ? Number(data.weightKg) : null;
    const bodyFat = data.bodyFat != null && data.bodyFat !== ('' as any) ? Number(data.bodyFat) : null;
    if (weight == null && bodyFat == null && !data.photoUrl && !data.measurements) {
      throw new AppError('Registra al menos tu peso, % grasa o una foto', 400);
    }
    if (weight != null && (weight < 20 || weight > 400)) throw new AppError('Peso fuera de rango', 400);
    const day = data.loggedOn ? new Date(data.loggedOn) : new Date();
    const dayStr = day.toISOString().slice(0, 10);
    await db.execute(
      `INSERT INTO consumer_body_logs (id, user_id, logged_on, weight_kg, body_fat, measurements, photo_url, note)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE weight_kg = VALUES(weight_kg), body_fat = VALUES(body_fat),
         measurements = VALUES(measurements), photo_url = COALESCE(VALUES(photo_url), photo_url), note = VALUES(note)`,
      [uuidv4(), userId, dayStr, weight, bodyFat, data.measurements ? JSON.stringify(data.measurements) : null, data.photoUrl?.trim() || null, data.note?.trim() || null]
    );
    return this.getSummary(userId);
  }

  async listMine(userId: string, limit = 60) {
    const lim = Math.min(365, Math.max(1, Math.floor(limit) || 60));
    const [rows] = await db.execute<RowDataPacket[]>(
      `SELECT logged_on, weight_kg, body_fat, measurements, photo_url, note
         FROM consumer_body_logs WHERE user_id = ? ORDER BY logged_on ASC LIMIT ${lim}`, [userId]
    );
    return rows.map((r: any) => ({
      date: r.logged_on, weightKg: r.weight_kg != null ? Number(r.weight_kg) : null,
      bodyFat: r.body_fat != null ? Number(r.body_fat) : null,
      measurements: safeJson(r.measurements), photoUrl: r.photo_url, note: r.note,
    }));
  }

  /** Resumen + Progress Score. */
  async getSummary(userId: string) {
    const logs = await this.listMine(userId, 90);
    const weights = logs.filter(l => l.weightKg != null);
    const [pr] = await db.execute<RowDataPacket[]>(
      'SELECT weight_kg AS startW, target_weight_kg AS targetW, goal FROM rutina_perfil WHERE user_id = ? LIMIT 1', [userId]
    );
    const perfil: any = pr[0] || {};
    const profileStart = perfil.startW != null ? Number(perfil.startW) : null;
    const target = perfil.targetW != null ? Number(perfil.targetW) : null;

    const firstW = weights[0]?.weightKg ?? profileStart ?? null;
    const latestW = weights.length ? weights[weights.length - 1].weightKg : profileStart;
    const start = profileStart ?? firstW;

    // Avance hacia la meta (0–100). Funciona para bajar o subir de peso.
    let goalPct = 0;
    if (start != null && target != null && latestW != null && start !== target) {
      goalPct = clamp(((start - latestW) / (start - target)) * 100);
    }
    // Consistencia: días registrados en los últimos 30.
    const cutoff = Date.now() - 30 * 86400000;
    const recent = logs.filter(l => new Date(l.date).getTime() >= cutoff).length;
    const consistency = clamp((recent / 12) * 100); // ~3 registros/semana = 100%

    const score = Math.round(goalPct * 0.65 + consistency * 0.35);
    const deltaKg = (latestW != null && firstW != null) ? Math.round((latestW - firstW) * 10) / 10 : null;
    const toGoalKg = (latestW != null && target != null) ? Math.round((latestW - target) * 10) / 10 : null;

    return {
      score, goalPct: Math.round(goalPct), consistency: Math.round(consistency),
      latestWeightKg: latestW, firstWeightKg: firstW, targetWeightKg: target, goal: perfil.goal ?? null,
      deltaKg, toGoalKg, logsCount: logs.length,
      trend: weights.slice(-14).map(w => ({ date: w.date, weightKg: w.weightKg })),
      lastPhotoUrl: [...logs].reverse().find(l => l.photoUrl)?.photoUrl ?? null,
    };
  }
}

export const progressService = new ProgressService();
