# 🧩 Módulo: Variants

## Qué hace
Gestiona variantes de producto (color, talla, material) con stock independiente, precios escalonados por volumen y trazabilidad de inventario por variante. Es la capa que permite operar como plataforma proveedor (ej: SE Sport) con catálogos de 429+ productos sin duplicar registros.

## Arquitectura
```
products (base)
   └── product_variants (color/talla)
          ├── stock propio (NUNCA < 0)
          ├── cost_price (precio proveedor)
          ├── price_override (opcional)
          ├── supplier_id
          └── variant_price_tiers (N por variante)
                 ├── min_qty (única condición — sin max_qty)
                 ├── price (precio público)
                 └── tenant_margin_pct (comisión plataforma)
```

## Archivos del Módulo

**Backend:**
- `backend/src/modules/variants/variants.service.ts` — CRUD, resolvePrice con tiers, adjustStock atómico
- `backend/src/modules/variants/variants.controller.ts`
- `backend/src/modules/variants/variants.routes.ts`
- `backend/src/modules/variants/price-tier.service.ts` — lógica de resolución de tiers
- `backend/src/modules/variants/import.service.ts` — importación CSV normalizado con variantes

**Frontend (Sprint 3):**
- `frontend/components/variant-selector.tsx` — selector color/talla en POS
- `frontend/components/variant-price-tiers.tsx` — admin de tiers en panel
- `frontend/components/supplier-catalog.tsx` — vista proveedor (stock, ventas)
- Actualización de `inventory-list.tsx` para mostrar/editar variantes
- Actualización de storefront para chips de color con disponibilidad

## APIs

```
VARIANTS
  GET    /api/products/:productId/variants     → lista variantes del producto
  POST   /api/products/:productId/variants     → crea variante con atributos
  PUT    /api/variants/:id                     → actualiza variante
  DELETE /api/variants/:id                     → soft delete
  PATCH  /api/variants/:id/stock               → { quantity, reason } UPDATE atómico

PRICE TIERS
  GET    /api/variants/:id/price-tiers         → lista tiers de la variante
  POST   /api/variants/:id/price-tiers         → { minQty, price, marginPct }
  PUT    /api/price-tiers/:id                  → actualiza tier
  DELETE /api/price-tiers/:id                  → elimina tier
  POST   /api/variants/:id/resolve-price       → body { qty } → { price, marginPct, source }

IMPORT PROVEEDOR
  POST   /api/products/variants/import         → sube CSV normalizado
  GET    /api/products/variants/import/template → descarga plantilla
```

## Reglas Críticas

### Stock
- **UPDATE atómico**: `UPDATE product_variants SET stock = stock - ? WHERE id = ? AND stock >= ?`
- Si `affected_rows = 0` → error "Stock insuficiente" (race condition safe)
- `stock` nunca baja de 0
- `reserved_stock` para bloqueos durante checkout (se libera o descuenta)
- Si `stock < stock_minimo` → alerta automática

### Precios (price-tier.service.ts)
- Los tiers usan SOLO `min_qty` — sin `max_qty`, sin gaps entre rangos
- Resolución: `SELECT ... WHERE min_qty <= ? ORDER BY min_qty DESC LIMIT 1`
- Si no hay tier aplicable → fallback a `price_override` de la variante o `base_price` del producto
- El `tenant_margin_pct` define la comisión de la plataforma en ese escalón

### Congelación en Órdenes
- `sale_items` / `order_items` / `storefront_order_items` congelan al momento de la venta:
  - `variant_id`, `frozen_sku`, `unit_price`, `frozen_cost`, `frozen_margin_pct`, `frozen_margin_amount`
- **NUNCA** leer precio actual de `variant_price_tiers` para ventas históricas — usar datos congelados

### Trazabilidad (Inventory Movements)
- `inventory_movements` es la fuente de verdad del stock para variantes
- Cada `entrada`/`salida`/`ajuste`/`merma`/`transferencia` genera un movimiento
- `stock_movements` legacy sigue existiendo para productos sin variantes
- Eventualmente migrar todo a `inventory_movements`

### Multi-tenant
- `tenant_id` en `product_variants` e `inventory_movements`
- `variant_price_tiers` también lleva `tenant_id` para queries directas (redundancia deliberada por rendimiento)
- Siempre filtrar por `tenant_id` del JWT

### CSV de Importación (formato normalizado)
```
Handle (ID/Slug) | Product Name | Attribute: Color | Attribute: Size | Variant SKU | Variant Stock | Base Price | Cost Price
```
El backend agrupa por Handle, crea/actualiza el producto, y bulk inserta las variantes.

## Dependencias
- [[modules/products/products]] — producto padre
- [[modules/inventory/inventory]] — inventory_movements + stock_movements legacy
- [[modules/sales/sales]] — descuenta stock de variante al vender
- [[modules/storefront/storefront]] — muestra variantes con stock > 0
- [[modules/suppliers/suppliers]] — supplier_id en variante
- [[modules/purchases/purchases]] — compras pueden especificar variante

---

← [[DAIMUZ]] | → [[modules/variants/compressed]]
