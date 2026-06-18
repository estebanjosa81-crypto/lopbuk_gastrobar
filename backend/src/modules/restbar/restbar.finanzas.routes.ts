/**
 * Restbar — Módulo de Control Financiero
 * Permite registrar gastos, ingresos diarios y gastos fijos del gastrobar.
 * Cada registro captura fecha/hora automáticamente → línea de tiempo cronológica.
 */
import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import pool from '../../config/database';
import { authenticate, authorize } from '../../common/middleware';
import { UserRole } from '../../common/types';

const router: ReturnType<typeof Router> = Router();

const ADMIN_ROLES: UserRole[] = ['superadmin', 'comerciante', 'administrador_rb'];

router.use(authenticate);
router.use(authorize(...ADMIN_ROLES));

// ─── HELPERS ──────────────────────────────────────────────────────────────────
const tenantId = (req: Request) => (req as any).user?.tenantId as string;
const userId   = (req: Request) => (req as any).user?.userId   as string;

// ─── GASTOS (Egresos) ─────────────────────────────────────────────────────────

/** GET /api/restbar/finanzas/gastos?from=YYYY-MM-DD&to=YYYY-MM-DD&quincena=1|2 */
router.get('/gastos', async (req: Request, res: Response) => {
  try {
    const tid = tenantId(req);
    const { from, to, quincena } = req.query as Record<string, string>;

    let dateFilter = '';
    const params: any[] = [tid];

    if (quincena) {
      // quincena 1 = días 1-15, quincena 2 = días 16-31
      const month = (req.query.month as string) || new Date().toISOString().slice(0, 7); // YYYY-MM
      const q = parseInt(quincena);
      const startDay = q === 1 ? 1 : 16;
      const endDay   = q === 1 ? 15 : 31;
      dateFilter = `AND DATE(registered_at) BETWEEN '${month}-${String(startDay).padStart(2,'0')}' AND '${month}-${String(endDay).padStart(2,'0')}'`;
    } else if (from && to) {
      dateFilter = `AND DATE(registered_at) BETWEEN ? AND ?`;
      params.push(from, to);
    }

    const [rows] = await pool.query(
      `SELECT id, concepto, categoria, cantidad, valor_unitario, total, notas,
              registered_at, created_by
       FROM rb_gastos
       WHERE tenant_id = ? ${dateFilter}
       ORDER BY registered_at DESC`,
      params
    ) as any;

    const totalGastos = rows.reduce((sum: number, r: any) => sum + Number(r.total), 0);

    res.json({ success: true, data: { gastos: rows, totalGastos } });
  } catch (err) {
    console.error('rb_gastos GET error:', err);
    res.status(500).json({ success: false, error: 'Error al obtener gastos' });
  }
});

/** POST /api/restbar/finanzas/gastos — registra un gasto, captura timestamp automático */
router.post('/gastos', async (req: Request, res: Response) => {
  try {
    const tid = tenantId(req);
    const uid = userId(req);
    const { concepto, categoria = 'egreso', cantidad = 1, valor_unitario, notas } = req.body;

    if (!concepto || valor_unitario == null) {
      res.status(400).json({ success: false, error: 'concepto y valor_unitario son requeridos' });
      return;
    }

    const id    = uuidv4();
    const qty   = Number(cantidad);
    const vu    = Number(valor_unitario);
    const total = Math.round(qty * vu);
    const now   = new Date(); // ← timestamp automático

    await pool.query(
      `INSERT INTO rb_gastos (id, tenant_id, concepto, categoria, cantidad, valor_unitario, total, notas, registered_at, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, tid, concepto.trim(), categoria, qty, vu, total, notas || null, now, uid]
    );

    res.status(201).json({
      success: true,
      data: { id, concepto, categoria, cantidad: qty, valor_unitario: vu, total, registered_at: now },
      message: 'Gasto registrado',
    });
  } catch (err) {
    console.error('rb_gastos POST error:', err);
    res.status(500).json({ success: false, error: 'Error al registrar gasto' });
  }
});

/** PUT /api/restbar/finanzas/gastos/:id */
router.put('/gastos/:id', async (req: Request, res: Response) => {
  try {
    const tid = tenantId(req);
    const { concepto, categoria, cantidad = 1, valor_unitario, notas } = req.body;

    const qty   = Number(cantidad);
    const vu    = Number(valor_unitario);
    const total = Math.round(qty * vu);

    const [result] = await pool.query(
      `UPDATE rb_gastos SET concepto=?, categoria=?, cantidad=?, valor_unitario=?, total=?, notas=?
       WHERE id=? AND tenant_id=?`,
      [concepto, categoria, qty, vu, total, notas || null, req.params.id, tid]
    ) as any;

    if (result.affectedRows === 0) {
      res.status(404).json({ success: false, error: 'Gasto no encontrado' });
      return;
    }
    res.json({ success: true, message: 'Gasto actualizado' });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Error al actualizar gasto' });
  }
});

/** DELETE /api/restbar/finanzas/gastos/:id */
router.delete('/gastos/:id', async (req: Request, res: Response) => {
  try {
    const tid = tenantId(req);
    const [result] = await pool.query(
      'DELETE FROM rb_gastos WHERE id=? AND tenant_id=?',
      [req.params.id, tid]
    ) as any;
    if (result.affectedRows === 0) {
      res.status(404).json({ success: false, error: 'Gasto no encontrado' });
      return;
    }
    res.json({ success: true, message: 'Gasto eliminado' });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Error al eliminar gasto' });
  }
});

// ─── INGRESOS DIARIOS ─────────────────────────────────────────────────────────

/** GET /api/restbar/finanzas/ingresos?month=YYYY-MM */
router.get('/ingresos', async (req: Request, res: Response) => {
  try {
    const tid = tenantId(req);
    const month = (req.query.month as string) || new Date().toISOString().slice(0, 7);

    const [rows] = await pool.query(
      `SELECT id, fecha, num_pedidos, valor_ventas, ganancia, notas, created_at, updated_at
       FROM rb_ingresos_diarios
       WHERE tenant_id = ? AND DATE_FORMAT(fecha, '%Y-%m') = ?
       ORDER BY fecha ASC`,
      [tid, month]
    ) as any;

    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Error al obtener ingresos' });
  }
});

/** POST /api/restbar/finanzas/ingresos — upsert por tenant+fecha */
router.post('/ingresos', async (req: Request, res: Response) => {
  try {
    const tid = tenantId(req);
    const { fecha, num_pedidos = 0, valor_ventas = 0, ganancia = 0, notas } = req.body;

    if (!fecha) {
      res.status(400).json({ success: false, error: 'La fecha es requerida' });
      return;
    }

    const id = uuidv4();

    await pool.query(
      `INSERT INTO rb_ingresos_diarios (id, tenant_id, fecha, num_pedidos, valor_ventas, ganancia, notas)
       VALUES (?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         num_pedidos=VALUES(num_pedidos), valor_ventas=VALUES(valor_ventas),
         ganancia=VALUES(ganancia), notas=VALUES(notas), updated_at=NOW()`,
      [id, tid, fecha, Number(num_pedidos), Number(valor_ventas), Number(ganancia), notas || null]
    );

    res.status(201).json({ success: true, message: 'Ingreso registrado' });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Error al registrar ingreso' });
  }
});

/** DELETE /api/restbar/finanzas/ingresos/:id */
router.delete('/ingresos/:id', async (req: Request, res: Response) => {
  try {
    const tid = tenantId(req);
    await pool.query('DELETE FROM rb_ingresos_diarios WHERE id=? AND tenant_id=?', [req.params.id, tid]);
    res.json({ success: true, message: 'Ingreso eliminado' });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Error al eliminar ingreso' });
  }
});

// ─── GASTOS FIJOS ─────────────────────────────────────────────────────────────

/** GET /api/restbar/finanzas/gastos-fijos */
router.get('/gastos-fijos', async (req: Request, res: Response) => {
  try {
    const tid = tenantId(req);
    const [rows] = await pool.query(
      'SELECT * FROM rb_gastos_fijos WHERE tenant_id=? ORDER BY nombre ASC',
      [tid]
    ) as any;
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Error al obtener gastos fijos' });
  }
});

/** POST /api/restbar/finanzas/gastos-fijos */
router.post('/gastos-fijos', async (req: Request, res: Response) => {
  try {
    const tid = tenantId(req);
    const { nombre, valor, periodo = 'quincenal' } = req.body;

    if (!nombre || valor == null) {
      res.status(400).json({ success: false, error: 'nombre y valor son requeridos' });
      return;
    }

    const id = uuidv4();
    await pool.query(
      'INSERT INTO rb_gastos_fijos (id, tenant_id, nombre, valor, periodo) VALUES (?, ?, ?, ?, ?)',
      [id, tid, nombre.trim(), Number(valor), periodo]
    );
    res.status(201).json({ success: true, data: { id, nombre, valor: Number(valor), periodo }, message: 'Gasto fijo creado' });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Error al crear gasto fijo' });
  }
});

/** PUT /api/restbar/finanzas/gastos-fijos/:id */
router.put('/gastos-fijos/:id', async (req: Request, res: Response) => {
  try {
    const tid = tenantId(req);
    const { nombre, valor, periodo, is_active } = req.body;

    await pool.query(
      `UPDATE rb_gastos_fijos SET nombre=?, valor=?, periodo=?, is_active=? WHERE id=? AND tenant_id=?`,
      [nombre, Number(valor), periodo, is_active ? 1 : 0, req.params.id, tid]
    );
    res.json({ success: true, message: 'Gasto fijo actualizado' });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Error al actualizar gasto fijo' });
  }
});

/** DELETE /api/restbar/finanzas/gastos-fijos/:id */
router.delete('/gastos-fijos/:id', async (req: Request, res: Response) => {
  try {
    const tid = tenantId(req);
    await pool.query('DELETE FROM rb_gastos_fijos WHERE id=? AND tenant_id=?', [req.params.id, tid]);
    res.json({ success: true, message: 'Gasto fijo eliminado' });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Error al eliminar gasto fijo' });
  }
});

// ─── TIMELINE (feed cronológico de todos los registros) ───────────────────────

/** GET /api/restbar/finanzas/timeline?month=YYYY-MM */
router.get('/timeline', async (req: Request, res: Response) => {
  try {
    const tid = tenantId(req);
    const month = (req.query.month as string) || new Date().toISOString().slice(0, 7);

    const [gastos] = await pool.query(
      `SELECT id, 'gasto' AS type, concepto AS titulo, categoria, total AS valor, notas, registered_at AS fecha
       FROM rb_gastos
       WHERE tenant_id=? AND DATE_FORMAT(registered_at, '%Y-%m')=?`,
      [tid, month]
    ) as any;

    const [ingresos] = await pool.query(
      `SELECT id, 'ingreso' AS type, CONCAT('Ingresos del día') AS titulo,
              'ingreso_diario' AS categoria, valor_ventas AS valor, notas, fecha AS fecha
       FROM rb_ingresos_diarios
       WHERE tenant_id=? AND DATE_FORMAT(fecha, '%Y-%m')=?`,
      [tid, month]
    ) as any;

    const timeline = [...gastos, ...ingresos]
      .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());

    res.json({ success: true, data: timeline });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Error al obtener timeline' });
  }
});

// ─── RESUMEN QUINCENAL ────────────────────────────────────────────────────────

/** GET /api/restbar/finanzas/resumen?month=YYYY-MM */
router.get('/resumen', async (req: Request, res: Response) => {
  try {
    const tid = tenantId(req);
    const month = (req.query.month as string) || new Date().toISOString().slice(0, 7);

    // Quincena 1: días 1-15 | Quincena 2: días 16-31
    const q1Start = `${month}-01`, q1End = `${month}-15`;
    const q2Start = `${month}-16`, q2End = `${month}-31`;

    const getGastos = async (from: string, to: string) => {
      const [rows] = await pool.query(
        `SELECT COALESCE(SUM(total),0) AS total FROM rb_gastos
         WHERE tenant_id=? AND DATE(registered_at) BETWEEN ? AND ?`,
        [tid, from, to]
      ) as any;
      return Number(rows[0].total);
    };

    const getIngresos = async (from: string, to: string) => {
      const [rows] = await pool.query(
        `SELECT COALESCE(SUM(valor_ventas),0) AS ventas, COALESCE(SUM(ganancia),0) AS ganancia
         FROM rb_ingresos_diarios WHERE tenant_id=? AND fecha BETWEEN ? AND ?`,
        [tid, from, to]
      ) as any;
      return { ventas: Number(rows[0].ventas), ganancia: Number(rows[0].ganancia) };
    };

    const [fijosRows] = await pool.query(
      `SELECT nombre, valor, periodo FROM rb_gastos_fijos WHERE tenant_id=? AND is_active=1`,
      [tid]
    ) as any;

    const totalFijos = fijosRows.reduce((s: number, r: any) => {
      const v = Number(r.valor);
      if (r.periodo === 'quincenal')   return s + v / 2; // la mitad por quincena
      if (r.periodo === 'semanal')     return s + v * 2; // ~2 semanas por quincena
      if (r.periodo === 'mensual')     return s + v / 2;
      return s;
    }, 0);

    const [gq1, iq1, gq2, iq2] = await Promise.all([
      getGastos(q1Start, q1End), getIngresos(q1Start, q1End),
      getGastos(q2Start, q2End), getIngresos(q2Start, q2End),
    ]);

    const quincena1 = {
      gastos_variables: gq1,
      ventas: iq1.ventas,
      ganancia_ventas: iq1.ganancia,
      gastos_fijos: Math.round(totalFijos),
      ganancia_neta: Math.round(iq1.ventas - gq1 - totalFijos),
    };
    const quincena2 = {
      gastos_variables: gq2,
      ventas: iq2.ventas,
      ganancia_ventas: iq2.ganancia,
      gastos_fijos: Math.round(totalFijos),
      ganancia_neta: Math.round(iq2.ventas - gq2 - totalFijos),
    };
    const global = {
      total_gastos: gq1 + gq2,
      total_ventas: iq1.ventas + iq2.ventas,
      total_gastos_fijos: Math.round(totalFijos * 2),
      ganancia_neta: Math.round((iq1.ventas + iq2.ventas) - (gq1 + gq2) - totalFijos * 2),
    };

    res.json({ success: true, data: { month, quincena1, quincena2, global, gastos_fijos: fijosRows } });
  } catch (err) {
    console.error('resumen error:', err);
    res.status(500).json({ success: false, error: 'Error al generar resumen' });
  }
});

export default router;
