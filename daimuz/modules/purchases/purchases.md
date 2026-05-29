# 🛒 Módulo: Purchases (Compras)

## Qué hace
Gestiona compras a proveedores. Al confirmar una compra, los productos entran automáticamente al inventario (stock_movement tipo `entrada`).

## Archivos
- `backend/src/modules/purchases/purchases.service.ts`
- `backend/src/modules/purchases/purchases.routes.ts`
- `frontend/components/purchase-invoices.tsx`

## APIs
```
GET    /api/purchases          → lista compras
GET    /api/purchases/:id      → compra con líneas de detalle
POST   /api/purchases          → crea orden de compra
PUT    /api/purchases/:id      → actualiza (estado: borrador → confirmada)
DELETE /api/purchases/:id      → cancela compra (soft)
POST   /api/purchases/:id/confirm → confirma: ingresa stock
```

## Estados de una Compra
```
borrador → confirmada → recibida → cancelada
```

## Flujo al Confirmar
```
POST /api/purchases/:id/confirm
  → Por cada purchase_item:
    → stock_movement tipo 'entrada'
    → UPDATE products.stock += quantity
    → UPDATE products.cost = precio_compra (actualiza costo)
```

## Reglas Críticas
- Solo al `confirmar` ingresa el stock (no al crear la orden)
- El costo del producto se actualiza con el último precio de compra
- Una compra cancelada no revierte el stock si ya fue confirmada (requiere ajuste manual)

## Dependencias
- [[modules/inventory/inventory]] — genera movimientos de entrada
- [[modules/gastrobar-ops/gastrobar-ops]] — sugerencias de recompra desde niveles PAR
- [[modules/finances/finances]] — el gasto queda en el flujo de caja

---
← [[DAIMUZ]]
