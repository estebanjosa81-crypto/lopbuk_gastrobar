# 📦 Módulo: Inventory

## Qué hace
Controla el stock de todos los productos del negocio. Cada movimiento queda registrado en el kardex para trazabilidad completa.

## Archivos del Módulo

**Backend:**
- `backend/src/modules/inventory/inventory.routes.ts`
- `backend/src/modules/inventory/inventory.controller.ts`
- `backend/src/modules/inventory/inventory.service.ts`
- `backend/src/modules/products/products.service.ts` — actualiza `stock` en la tabla products
- `backend/src/modules/merma/merma.service.ts` — mermas

**Frontend:**
- `frontend/components/inventory-list.tsx` — vista y gestión de inventario
- `frontend/components/merma.tsx` — registro de mermas
- `frontend/components/barcode-scanner.tsx` — escáner de barras
- `frontend/components/bulk-upload-dialog.tsx` — importación masiva

## Tipos de Movimiento

| Tipo | Efecto en Stock | Cuándo |
|---|---|---|
| `entrada` | + | Compra de proveedor, ajuste positivo |
| `salida` | - | Venta (automático), ajuste negativo |
| `ajuste` | +/- | Corrección manual |
| `merma` | - | Pérdida, vencimiento, daño |
| `transferencia` | - origen / + destino | Entre sedes |

## APIs

```
GET  /api/inventory           → movimientos de stock (kardex)
POST /api/inventory/movement  → { productId, quantity, type, reason }
GET  /api/inventory/stock     → stock actual de todos los productos
GET  /api/inventory/alerts    → productos bajo stock mínimo
GET  /api/inventory/report    → reporte por período

GET  /api/merma               → lista mermas
POST /api/merma               → { productId, quantity, reason, cost }
```

## Flujo de Movimiento de Stock

```
1. POST /api/inventory/movement
2. Valida: producto existe y pertenece al tenant
3. Si type = 'salida' o 'merma': verifica que stock >= quantity
4. Inserta en stock_movements
5. UPDATE products SET stock = stock + delta WHERE id = ?
6. Si stock < stock_minimo → genera alerta
```

## Reglas Críticas

- **Stock nunca baja de 0** — el sistema bloquea la operación
- Todo movimiento requiere `reason` (texto) para auditoría
- Las ventas generan movimientos automáticamente (no manual)
- La merma también requiere justificación
- El ajuste manual requiere rol mínimo de `admin`

## Tablas DB

```sql
stock_movements (
  id, tenant_id, product_id, sede_id,
  type, quantity, reason, cost,
  created_by, created_at
)

products (
  ..., stock, stock_minimo, cost
)
```

## Dependencias
- [[modules/sales/sales]] — genera movimientos salida automáticamente
- [[modules/pos/pos]] — valida stock antes de vender
- [[architecture/database]] — tablas stock_movements, products

---

← [[DAIMUZ]] | → [[flows/inventory-flow]]
