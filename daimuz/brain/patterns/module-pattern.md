# 🔩 Patrón de Módulo Estándar

> El patrón que sigue TODOS los módulos del backend. Leer antes de crear uno nuevo.

## Estructura de archivos

```
modules/[nombre]/
├── [nombre].routes.ts
├── [nombre].controller.ts
├── [nombre].service.ts
└── index.ts
```

## 1. routes.ts — el contrato

```typescript
import { Router } from 'express'
import { verifyToken, requireRole } from '../../common/middleware'
import { NombreController } from './nombre.controller'

const router = Router()
const controller = new NombreController()

router.get('/',    verifyToken, controller.getAll)
router.get('/:id', verifyToken, controller.getById)
router.post('/',   verifyToken, requireRole('admin'), controller.create)
router.put('/:id', verifyToken, requireRole('admin'), controller.update)
router.delete('/:id', verifyToken, requireRole('admin'), controller.delete)

export default router
```

## 2. controller.ts — el puente

```typescript
export class NombreController {
  private service = new NombreService()

  getAll = async (req: Request, res: Response) => {
    const data = await this.service.getAll(req.user!.tenantId)
    res.json({ success: true, data })
  }

  create = async (req: Request, res: Response) => {
    const item = await this.service.create(req.user!.tenantId, req.body)
    res.status(201).json({ success: true, data: item })
  }
}
```

**Regla:** El controller NUNCA tiene lógica de negocio. Solo parsea y delega.

## 3. service.ts — el cerebro

```typescript
export class NombreService {
  async getAll(tenantId: string) {
    const [rows] = await db.execute<NombreRow[]>(
      'SELECT * FROM nombre WHERE tenant_id = ? AND is_active = 1',
      [tenantId]
    )
    return rows
  }

  async create(tenantId: string, data: CreateNombreDto) {
    if (!data.campo_requerido) throw new AppError('Campo requerido', 400)
    const id = uuidv4()
    await db.execute(
      'INSERT INTO nombre (id, tenant_id, ...) VALUES (?, ?, ...)',
      [id, tenantId, ...]
    )
    return { id, ...data }
  }
}
```

**Reglas:**
- Siempre `tenant_id` en queries
- Siempre `AppError` para errores de negocio
- Siempre UUIDs como IDs

## 4. Registro en index.ts del módulo

```typescript
// modules/index.ts
import nombreRouter from './nombre'
app.use('/api/nombre', nombreRouter)
```

## Ver también
- [[brain/coding-standards]] — reglas generales de código
- [[decisions/db-design]] — cómo diseñar la tabla
- [[prompts/new-module]] — prompt para crear con Claude
- [[architecture/backend]] — mapa de todos los módulos

---
← [[DAIMUZ]]
