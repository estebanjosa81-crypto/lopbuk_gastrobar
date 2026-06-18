# ⚡ Sinapsis: Cadena Operativa

> Si modificas cualquier nodo, estos son los efectos secundarios garantizados.

## Flujo: POS → Venta → Variante → Inventario → Caja

```
cash-sessions (open)
    │
    ▼
pos (carrito + cobro)
    │
    ├──► [¿Producto TIENE variantes?]
    │      │
    │      ├──► SÍ → variant-selector: elige color/talla
    │      │         │
    │      │         └──► price-tier.service.resolvePrice(variantId, qty)
    │      │                └──► tier con min_qty <= qty → { price, marginPct, source }
    │      │
    │      └──► NO → usa product.price directamente
    │
    ├──► sales.service.createSale()
    │         │
    │         ├──► [CON variante]
    │         │      │
    │         │      ├──► UPDATE product_variants SET stock = stock - qty
    │         │      │         WHERE id = ? AND stock >= qty  ← ATÓMICO
    │         │      │         ├──► affected_rows = 0 → ERROR "Stock insuficiente"
    │         │      │         └──► inventory_movements INSERT (type: 'salida', variant_id)
    │         │      │
    │         │      ├──► sale_items INSERT (datos CONGELADOS):
    │         │      │      variant_id, frozen_sku, unit_price, frozen_cost,
    │         │      │      frozen_margin_pct, frozen_margin_amount
    │         │      │
    │         │      └──► si stock < min_stock → ALERTA
    │         │
    │         ├──► [SIN variante] stock_movements INSERT + products UPDATE stock
    │         │
    │         └──► si método = 'efectivo' → cash_movements INSERT
    │                         │
    │                         └──► cash_sessions.calculated += monto
    │
    └──► cart.clearCart()  [frontend Zustand]
```

## Impacto por Cambio

### Si cambias `variants.service.ts`
- ⚠️ Afecta: `sales` (descuenta stock de variant), `inventory` (kardex variant_id), `pos` (selector), `storefront` (chips color)
- ✅ Verificar: UPDATE atómico `WHERE stock >= ?`, soft delete, SKU único por tenant

### Si cambias `price-tier.service.ts`
- ⚠️ Afecta: `pos` (precio dinámico por qty), `storefront` (precio escalonado), `sales` (margin congelado)
- ✅ Verificar: `ORDER BY min_qty DESC LIMIT 1`, sin gaps, fallback a base_price

### Si cambias `sales.service.ts`
- ⚠️ Afecta: `variants` (descuento stock), `inventory` (movements), `cash-sessions` (suma), `customers`, `finances`
- ✅ Verificar: stock no negativo, datos congelados correctos, tenant_id

### Si cambias `inventory.service.ts`
- ⚠️ Afecta: `variants` (kardex variant_id), `pos` (valida stock), `gastrobar-ops` (food cost), `purchases` (entradas)
- ✅ Verificar: reason obligatorio, tenant_id, inventory_movements correcto

### Si cambias `products.service.ts`
- ⚠️ Afecta: `variants` (product_id FK), `recipes` (BOM), `pos` (búsqueda), `storefront`
- ✅ Verificar: no borrar producto con variantes activas, base_price actualizado

### Si cambias `cash-sessions.service.ts`
- ⚠️ Afecta: `sales` (necesitan sesión activa), `pos` (bloquea sin sesión), `dashboard`, `finances`
- ✅ Verificar: solo 1 activa por sede, históricos inmutables

## Regla de Oro

```
NO hay venta sin:
  1. cash_session activa para esa sede
  2. [si tiene variante] variante seleccionada + stock suficiente (validación atómica)
  3. datos CONGELADOS en sale_items (price, cost, margin, sku) — NUNCA leer de tiers
  4. tenant_id correcto en todos los registros
```

---

**Módulos:** [[modules/pos/pos]] · [[modules/sales/sales]] · [[modules/variants/variants]] · [[modules/inventory/inventory]] · [[modules/cash-sessions/cash-sessions]] · [[modules/customers/customers]] · [[modules/dashboard/dashboard]]

← [[DAIMUZ]] | → [[synapses/gastrobar-chain]]
