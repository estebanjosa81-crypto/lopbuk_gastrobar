import { Request, Response } from 'express';
import { mermaService } from './merma.service';

function todayStr() {
  return new Date().toISOString().split('T')[0];
}

function nDaysAgo(n: number) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().split('T')[0];
}

export const mermaController = {

  async create(req: Request, res: Response) {
    try {
      const tenantId = (req as any).user.tenantId;
      const userId   = (req as any).user.id;
      const userName = (req as any).user.name ?? (req as any).user.email ?? 'Sistema';
      const record = await mermaService.create(tenantId, userId, userName, req.body);
      res.status(201).json({ success: true, data: record });
    } catch (err: any) {
      res.status(err.statusCode ?? 500).json({ success: false, error: err.message });
    }
  },

  async list(req: Request, res: Response) {
    try {
      const tenantId = (req as any).user.tenantId;
      const result = await mermaService.list(tenantId, {
        dateFrom:  req.query.dateFrom as string,
        dateTo:    req.query.dateTo   as string,
        area:      req.query.area     as string,
        wasteType: req.query.wasteType as string,
        page:      req.query.page  ? Number(req.query.page)  : undefined,
        limit:     req.query.limit ? Number(req.query.limit) : undefined,
      });
      res.json({ success: true, ...result });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  },

  async getById(req: Request, res: Response) {
    try {
      const tenantId = (req as any).user.tenantId;
      const record = await mermaService.getById(tenantId, req.params.id);
      res.json({ success: true, data: record });
    } catch (err: any) {
      res.status(err.statusCode ?? 500).json({ success: false, error: err.message });
    }
  },

  async remove(req: Request, res: Response) {
    try {
      const tenantId = (req as any).user.tenantId;
      await mermaService.delete(tenantId, req.params.id);
      res.json({ success: true, message: 'Registro eliminado' });
    } catch (err: any) {
      res.status(err.statusCode ?? 500).json({ success: false, error: err.message });
    }
  },

  async getDashboard(req: Request, res: Response) {
    try {
      const tenantId = (req as any).user.tenantId;
      const dateFrom = (req.query.dateFrom as string) ?? nDaysAgo(7);
      const dateTo   = (req.query.dateTo   as string) ?? todayStr();
      const data = await mermaService.getDashboard(tenantId, dateFrom, dateTo);
      res.json({ success: true, data });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  },

  // PAR levels
  async listPar(req: Request, res: Response) {
    try {
      const tenantId = (req as any).user.tenantId;
      const rows = await mermaService.listParLevels(tenantId);
      res.json({ success: true, data: rows });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  },

  async upsertPar(req: Request, res: Response) {
    try {
      const tenantId = (req as any).user.tenantId;
      const id = await mermaService.upsertParLevel(tenantId, req.body);
      res.json({ success: true, data: { id } });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  },

  async deletePar(req: Request, res: Response) {
    try {
      const tenantId = (req as any).user.tenantId;
      await mermaService.deleteParLevel(tenantId, req.params.id);
      res.json({ success: true, message: 'Nivel PAR eliminado' });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  },
};
