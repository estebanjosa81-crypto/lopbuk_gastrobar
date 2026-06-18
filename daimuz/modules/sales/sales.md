# 💰 Módulo: Sales

## Qué hace
Registra y persiste todas las ventas del negocio. Es el módulo de más alto volumen de datos. Alimenta el dashboard, finanzas y el historial de clientes.

## Archivos

**Backend:**
- `backend/src/modules/sales/sales.routes.ts`
- `backend/src/modules/sales/sales.controller.ts`
- `backend/src/modules/sales/sales.service.ts`

**Frontend:**
- `frontend/components/sales-history.tsx` — historial con filtros
- `frontend/components/daily-closing-report.tsx` — reporte del día
- `frontend/lib/store.ts` — `sales[]` state

## APIs

```
GET    /api/sales              → lista con filtros (fecha, cajero, método pago)
GET    /api/sales/:id          → venta completa con items
POST   /api/sales              → registra venta nueva
PATCH  /api/sales/:id/cancel   → { reason: string }
GET    /api/sales/summary      → totales del período
GET    /api/sales/export       → CSV exportable
```

## Estructura de una Venta

```typescript
// POST /api/sales body:
{
  items: [{
    productId: string,
    quantity: number,
    discount?: number,      // descuento por ítem en %
    customAmount?: number   // precio manual
  }],
  paymentMethod: string,    // 'efectivo' | 'tarjeta' | 'transferencia' | 'fiado' | 'mixto'
  amountPaid: number,       // monto recibido
  globalDiscount?: number,  // descuento global en %
  customerId?: string,      // si hay cliente registrado
  applyTax?: boolean,       // si aplica IVA
  sedeId?: string,          // sucursal
}
```

## Qué hace el Service al registrar una venta

```
1. Verifica sesión de caja abierta
2. Por cada ítem: verifica stock disponible
3. Calcula totales (subtotal, descuentos, impuestos, total)
4. Inserta en sales + sale_items
5. Por cada ítem: genera stock_movement tipo 'salida'
6. Si hay cliente: actualiza total_purchases
7. Si es fiado: crea registro en credits
8. Emite socket event para dashboard en tiempo real
```

## Reglas Críticas

- Requiere sesión de caja activa (cash_session_id)
- Si algún ítem no tiene stock → rechaza TODA la venta
- Las ventas son inmutables (no se editan, se cancelan)
- La cancelación requiere razón y queda en auditoría
- El cambio de caja solo si la venta es en efectivo

## Tablas DB

```sql
sales (id, tenant_id, sede_id, cash_session_id, customer_id,
       subtotal, discount, tax, total, payment_method, amount_paid,
       change_amount, created_by, created_at, is_cancelled)

sale_items (id, sale_id, product_id, quantity, unit_price,
            discount, custom_amount, subtotal)
```

## Dependencias
- [[modules/pos/pos]] — genera las ventas desde el POS
- [[modules/inventory/inventory]] — descuenta stock
- [[modules/customers/customers]] — historial del cliente
- [[modules/finances/finances]] — alimenta flujo de caja
- [[modules/dashboard/dashboard]] — KPIs en tiempo real

---

← [[DAIMUZ]]
