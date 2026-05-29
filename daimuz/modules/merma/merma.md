# 🗑️ Módulo: Merma

## Qué hace
Registra pérdidas de producto: vencimientos, daños, derrames, desperdicios. Cada registro descuenta del stock y queda en auditoría con responsable y justificación.

## Archivos
- `backend/src/modules/merma/merma.service.ts`
- `backend/src/modules/merma/merma.routes.ts`
- `frontend/components/merma.tsx`

## APIs
```
GET  /api/merma              → lista registros por período
POST /api/merma              → { productId, quantity, reason, cost, type }
GET  /api/merma/report       → reporte de desperdicio por categoría
GET  /api/merma/summary      → resumen monetario del impacto
```

## Tipos de Merma
| Tipo | Descripción |
|---|---|
| `vencimiento` | Producto caducado |
| `daño` | Daño físico del producto |
| `derrame` | Líquidos/bebidas |
| `coccion` | Pérdida en proceso de cocción |
| `ajuste` | Corrección de inventario |

## Reglas Críticas
- Siempre requiere `reason` (razón obligatoria para auditoría)
- El `cost` se calcula con el precio de costo del producto
- Genera alerta si la merma supera el umbral configurado
- Crea un movimiento en [[modules/inventory/inventory]] tipo `merma`

## Dependencias
- [[modules/inventory/inventory]] — descuenta stock
- [[modules/gastrobar-ops/gastrobar-ops]] — reportado en centro de mando
- [[modules/dashboard/dashboard]] — KPI de merma del día

---
← [[DAIMUZ]]
