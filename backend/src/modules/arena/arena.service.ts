/**
 * arena.service — Community Layer (F5.1).
 * Leaderboard social (Community Score) + retos de temporada (seasonal challenges).
 * El Community Score mezcla actividad (días activos 30d), logros y drops reclamados.
 * Nombres de pila por privacidad.
 */
import { v4 as uuidv4 } from 'uuid';
import { RowDataPacket } from 'mysql2';
import { db } from '../../config';
import { AppError } from '../../common/middleware';

const firstName = (n?: string) => (n || 'Atleta').trim().split(' ')[0];
function communityScore(activeDays: number, achievements: number, drops: number): number {
  return Math.round((Number(activeDays) || 0) * 10 + (Number(achievements) || 0) * 15 + (Number(drops) || 0) * 8);
}

class ArenaService {
  // ── Leaderboard global ─────────────────────────────────────────────────────
  async getLeaderboard(userId: string, limit = 20) {
    const lim = Math.min(100, Math.max(1, Math.floor(limit) || 20));
    const [rows] = await db.execute<RowDataPacket[]>(
      `SELECT u.id, u.name,
              (SELECT COUNT(*) FROM consumer_streak_days s WHERE s.user_id = u.id AND s.day >= (CURDATE() - INTERVAL 30 DAY)) AS activeDays,
              (SELECT COUNT(*) FROM consumer_achievements a WHERE a.user_id = u.id) AS achievements,
              (SELECT COUNT(*) FROM drop_claims d WHERE d.user_id = u.id) AS drops
         FROM users u
        WHERE (
          EXISTS (SELECT 1 FROM consumer_streak_days s WHERE s.user_id = u.id) OR
          EXISTS (SELECT 1 FROM consumer_achievements a WHERE a.user_id = u.id) OR
          EXISTS (SELECT 1 FROM drop_claims d WHERE d.user_id = u.id)
        )
        LIMIT 1000`
    );
    const ranked = (rows as any[])
      .map(r => ({
        id: r.id, name: firstName(r.name),
        activeDays: Number(r.activeDays) || 0, achievements: Number(r.achievements) || 0, drops: Number(r.drops) || 0,
        score: communityScore(r.activeDays, r.achievements, r.drops),
      }))
      .sort((a, b) => b.score - a.score)
      .map((r, i) => ({ ...r, rank: i + 1 }));

    const meRow = ranked.find(r => r.id === userId) || null;
    const top = ranked.slice(0, lim).map(({ id, ...rest }) => ({ ...rest, isMe: id === userId }));
    const me = meRow ? { rank: meRow.rank, score: meRow.score, name: meRow.name } : null;
    return { top, me, total: ranked.length };
  }

  // ── Retos de temporada ─────────────────────────────────────────────────────
  private async userProgress(userId: string, ch: any): Promise<number> {
    const start = ch.starts_at, end = ch.ends_at;
    if (ch.metric === 'drops') {
      const [r] = await db.execute<RowDataPacket[]>('SELECT COUNT(*) AS c FROM drop_claims WHERE user_id = ? AND created_at BETWEEN ? AND ?', [userId, start, end]);
      return Number((r[0] as any)?.c) || 0;
    }
    if (ch.metric === 'achievements') {
      const [r] = await db.execute<RowDataPacket[]>('SELECT COUNT(*) AS c FROM consumer_achievements WHERE user_id = ? AND unlocked_at BETWEEN ? AND ?', [userId, start, end]);
      return Number((r[0] as any)?.c) || 0;
    }
    // streak: días activos dentro de la ventana
    const [r] = await db.execute<RowDataPacket[]>('SELECT COUNT(*) AS c FROM consumer_streak_days WHERE user_id = ? AND day BETWEEN DATE(?) AND DATE(?)', [userId, start, end]);
    return Number((r[0] as any)?.c) || 0;
  }

  private mapChallenge(c: any) {
    return {
      id: c.id, title: c.title, description: c.description ?? null, metric: c.metric,
      goalValue: Number(c.goal_value) || 0, reward: c.reward ?? null,
      startsAt: c.starts_at, endsAt: c.ends_at, status: c.status, createdAt: c.created_at,
    };
  }

  async listActive(userId: string) {
    const [rows] = await db.execute<RowDataPacket[]>(
      `SELECT * FROM seasonal_challenges WHERE status = 'active' AND ends_at > NOW() ORDER BY ends_at ASC LIMIT 30`
    );
    const out: any[] = [];
    for (const c of rows as any[]) {
      const [[p]]: any = await db.execute('SELECT id FROM challenge_participants WHERE challenge_id = ? AND user_id = ? LIMIT 1', [c.id, userId]);
      const [[cnt]]: any = await db.execute('SELECT COUNT(*) AS n FROM challenge_participants WHERE challenge_id = ?', [c.id]);
      const joined = !!p;
      const progress = joined ? await this.userProgress(userId, c) : 0;
      out.push({ ...this.mapChallenge(c), joined, progress, participants: Number(cnt?.n) || 0, now: new Date().toISOString() });
    }
    return out;
  }

  async join(userId: string, challengeId: string) {
    const [rows] = await db.execute<RowDataPacket[]>("SELECT * FROM seasonal_challenges WHERE id = ? LIMIT 1", [challengeId]);
    const c = rows[0] as any;
    if (!c) throw new AppError('Reto no encontrado', 404);
    if (c.status !== 'active' || new Date(c.ends_at).getTime() < Date.now()) throw new AppError('Este reto ya cerró', 410);
    await db.execute('INSERT IGNORE INTO challenge_participants (id, challenge_id, user_id) VALUES (?, ?, ?)', [uuidv4(), challengeId, userId]);
    return { joined: true };
  }

  async challengeLeaderboard(challengeId: string, limit = 20) {
    const lim = Math.min(100, Math.max(1, Math.floor(limit) || 20));
    const [rows] = await db.execute<RowDataPacket[]>("SELECT * FROM seasonal_challenges WHERE id = ? LIMIT 1", [challengeId]);
    const c = rows[0] as any;
    if (!c) throw new AppError('Reto no encontrado', 404);
    const [parts] = await db.execute<RowDataPacket[]>(
      `SELECT p.user_id, u.name FROM challenge_participants p LEFT JOIN users u ON u.id = p.user_id WHERE p.challenge_id = ? LIMIT 500`, [challengeId]
    );
    const scored: any[] = [];
    for (const p of parts as any[]) {
      const progress = await this.userProgress(p.user_id, c);
      scored.push({ name: firstName(p.name), progress });
    }
    return {
      challenge: this.mapChallenge(c),
      board: scored.sort((a, b) => b.progress - a.progress).slice(0, lim).map((r, i) => ({ ...r, rank: i + 1 })),
    };
  }

  // ── Admin ───────────────────────────────────────────────────────────────────
  async adminCreate(data: any, createdBy?: string | null) {
    const title = String(data?.title || '').trim();
    if (!title) throw new AppError('El título es requerido', 400);
    const metric = ['streak', 'drops', 'achievements'].includes(data?.metric) ? data.metric : 'streak';
    const startsAt = data?.startsAt ? new Date(data.startsAt) : null;
    const endsAt = data?.endsAt ? new Date(data.endsAt) : null;
    if (!startsAt || isNaN(startsAt.getTime()) || !endsAt || isNaN(endsAt.getTime())) throw new AppError('Fechas inválidas', 400);
    if (endsAt.getTime() <= startsAt.getTime()) throw new AppError('El fin debe ser después del inicio', 400);
    const goalValue = Math.max(1, Math.floor(Number(data?.goalValue) || 7));
    const id = uuidv4();
    await db.execute(
      `INSERT INTO seasonal_challenges (id, title, description, metric, goal_value, reward, starts_at, ends_at, status, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'active', ?)`,
      [id, title, data?.description?.trim() || null, metric, goalValue, data?.reward?.trim() || null, startsAt, endsAt, createdBy || null]
    );
    const [rows] = await db.execute<RowDataPacket[]>('SELECT * FROM seasonal_challenges WHERE id = ? LIMIT 1', [id]);
    return this.mapChallenge(rows[0]);
  }

  async adminList() {
    const [rows] = await db.execute<RowDataPacket[]>('SELECT * FROM seasonal_challenges ORDER BY starts_at DESC LIMIT 100');
    return rows.map((c: any) => this.mapChallenge(c));
  }

  async adminUpdate(id: string, patch: any) {
    const sets: string[] = []; const args: any[] = [];
    if (patch?.status !== undefined) { sets.push('status = ?'); args.push(patch.status === 'cancelled' ? 'cancelled' : 'active'); }
    if (patch?.title !== undefined) { sets.push('title = ?'); args.push(String(patch.title).trim()); }
    if (patch?.reward !== undefined) { sets.push('reward = ?'); args.push(patch.reward?.trim() || null); }
    if (patch?.endsAt !== undefined) { sets.push('ends_at = ?'); args.push(new Date(patch.endsAt)); }
    if (sets.length === 0) { const [r] = await db.execute<RowDataPacket[]>('SELECT * FROM seasonal_challenges WHERE id = ? LIMIT 1', [id]); return r[0] ? this.mapChallenge(r[0]) : null; }
    args.push(id);
    const [res] = await db.execute(`UPDATE seasonal_challenges SET ${sets.join(', ')} WHERE id = ?`, args);
    if ((res as any).affectedRows === 0) throw new AppError('Reto no encontrado', 404);
    const [r] = await db.execute<RowDataPacket[]>('SELECT * FROM seasonal_challenges WHERE id = ? LIMIT 1', [id]);
    return this.mapChallenge(r[0]);
  }
}

export const arenaService = new ArenaService();
