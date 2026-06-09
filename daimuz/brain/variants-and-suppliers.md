# 🧠 Arquitectura: Variantes + Precios por Volumen + Proveedores

> Decisión arquitectónica del 2026-06-07. Documenta el diseño completo del sistema de variantes (color/talla), precios escalonados por cantidad (tiers), y flujo proveedor $\to$ plataforma $\to$ cliente.

---

## ⚠️ El problema que resuelve

El modelo actual trata `products` como un objeto plano con un solo registro de stock. Cuando un producto tiene múltiples colores o tallas ("Body Siso Negro" vs "Body Siso Marfil"), el sistema obliga a:

- Compartir inventario (imposible porque cada color tiene stock independiente), o
- Duplicar el producto completo (rompe lógica de precios por volumen e imposibilita operar como plataforma proveedor).

---

## 🏛️ Modelo de datos definitivo

```sql
-- Un producto abstracto (camiseta premium)
products (
  id, tenant_id, name, sku, barcode,
  base_price,        -- precio base del producto (se usa si variant no tiene override)
  cost,              -- costo estimado (para food cost / recipes)
  stock,             -- stock agregado (calculado, no fuente de verdad)
  is_active
)

-- Cada variante concreta (color + talla con stock propio)
product_variants (
  id, tenant_id, product_id,
  sku,               -- SKU único de la variante
  barcode,           -- código de barras específico
  color,             -- opcional: "Negro", "Marfil"
  size,              -- opcional: "S", "M", "L", "XL"
  material,          -- opcional: "Algodón", "Poliéster"
  stock,             -- STOCK ACTUAL (fuente de verdad para variantes)
  reserved_stock,    -- stock reservado por pedidos en progreso
  min_stock,         -- umbral de alerta para reorden
  cost_price,        -- lo que NOS cobra el proveedor por esta variante
  price_override,    -- si es distinto al base_price del producto padre
  supplier_id,       -- FK opcional → suppliers.id
  images,            -- JSON array de URLs específicas de esta variante
  sort_order,        -- orden de visualización
  is_active
)
-- INDEX: (product_id, tenant_id), (supplier_id)

-- Precios escalonados por cantidad (tiers)
variant_price_tiers (
  id, tenant_id, variant_id,
  min_qty,           -- cantidad mínima para aplicar este tier
  price,             -- precio unitario en este rango
  tenant_margin_pct, -- % de margen que se queda Lopbuk como plataforma
  is_active
)
-- INDEX: (variant_id, tenant_id, min_qty)

-- Proveedores (catálogo global)
suppliers (
  id, tenant_id,
  name, contact_info, phone, email,
  payment_terms,     -- condiciones de pago
  is_active
)

-- Productos por proveedor (relación N:N)
supplier_products (
  id, supplier_id, product_id,
  supplier_sku,      -- SKU que usa el proveedor internamente
  cost_price,        -- precio que cobra el proveedor
  lead_time_days,    -- días de entrega
  is_preferred,      -- proveedor preferido para este producto
  is_active
)
-- INDEX: (supplier_id, product_id)

-- MOVIMIENTOS DE INVENTARIO (fuente de verdad del stock)
inventory_movements (
  id, tenant_id,
  variant_id,        -- FK → product_variants.id (NULL si es producto sin variante)
  product_id,        -- FK → products.id (siempre)
  type,              -- entrada | salida | ajuste | merma | transferencia | reserva | liberacion
  quantity,
  reason,
  reference_type,    -- sale | purchase | adjustment | transfer
  reference_id,      -- ID del documento origen
  created_by,
  created_at
)
-- INDEX: (variant_id, tenant_id), (product_id, tenant_id)
```

---

## 🧬 Reglas de negocio (universales)

### 1. Stock concurrente (Race condition)

```sql
-- ✅ SIEMPRE usar UPDATE condicional
UPDATE product_variants
SET stock = stock - ?
WHERE id = ? AND stock >= ?;

-- Si affectedRows === 0 → rechazar venta (stock insuficiente)
-- NUNCA hacer SELECT + UPDATE por separado sin FOR UPDATE
```

### 2. Resolución de precios (price-tier.service.ts)

```typescript
// ✅ Modelo minimum_quantity — sin gaps, sin max_qty
async resolvePrice(variantId: string, qty: number, tenantId: string) {
  const tier = await db.execute(
    `SELECT price, tenant_margin_pct
     FROM variant_price_tiers
     WHERE variant_id = ? AND tenant_id = ?
     AND min_qty <= ? AND is_active = 1
     ORDER BY min_qty DESC
     LIMIT 1`,
    [variantId, tenantId, qty]
  );

  if (tier[0]) return tier[0];

  // Fallback: price_override de la variante o base_price del producto
  const variant = await this.findById(variantId);
  return {
    price: variant.priceOverride ?? variant.product.basePrice,
    tenantMarginPct: 0,
  };
}
```

### 3. Congelación de precios en ventas (Order items)

```sql
-- ✅ Los precios se CONGELAN al crear la venta
order_items (
  ...
  variant_id,         -- FK, pero solo referencial
  product_name,       -- congelado
  sku,                -- congelado
  price,              -- precio unitario pagado (congelado)
  cost_price,         -- costo en ese momento (congelado)
  margin_pct,         -- margen de plataforma en ese momento (congelado)
  margin_amount,      -- cálculo: (price - cost_price) * qty (congelado)
  qty
)

-- ❌ NUNCA leer variant_price_tiers para calcular reportes de ventas pasadas
```

### 4. Stock fuente de verdad

```sql
-- inventory_movements es la única fuente de verdad
-- El stock en product_variants es un CACHÉ calculado

-- Para reconstruir stock:
SELECT COALESCE(SUM(
  CASE WHEN type IN ('entrada') THEN quantity
       WHEN type IN ('salida', 'merma', 'ajuste') THEN -quantity
       ELSE 0 END
), 0) AS stock_actual
FROM inventory_movements
WHERE variant_id = ? AND tenant_id = ?;

-- Para operaciones rápidas: leer product_variants.stock
-- Para reconciliación / auditoría: sumar inventory_movements
```

### 5. tenant_id en tablas hijas

```sql
-- ✅ DECISIÓN: tenant_id en TODAS las tablas de negocio
-- Razón: filtrado directo sin JOINs, sharding futuro, aislamiento multi-tenant
-- products, product_variants, variant_price_tiers, suppliers,
-- supplier_products, inventory_movements, orders, order_items
-- TODAS tienen tenant_id
```

---

## 🧩 Módulos nuevos

| Módulo | Archivos | Función |
|---|---|---|
| `variants` | `variants.service.ts`, `.controller.ts`, `.routes.ts` | CRUD variantes, resolución de precio, descuento de stock |
| `suppliers` | `suppliers.service.ts`, `.controller.ts`, `.routes.ts` | Catálogo de proveedores, productos por proveedor |
| `price-tiers` | `price-tier.service.ts` (lógica pura, sin router propio) | Resolución de precio por tier, cálculos de margen |
| `import` | `import.service.ts` | Importación CSV → productos + variantes |

---

## 🔀 Flujo: Proveedor $\to$ Plataforma $\to$ Cliente

```
1. SE Sport sube CSV con:
   Handle | Product Name | Color | Size | SKU | Stock | Cost Price

2. import.service.ts
   ├── Agrupa por Handle
   ├── Crea/Normaliza products (uno por Handle)
   ├── Bulk insert en product_variants
   └── Asigna supplier_id

3. Admin configura tiers de precio:
   ├── 1 ud  → $45.000 (margin 10%)
   ├── 6 uds → $42.000 (margin 12%)
   └── 12 uds → $39.000 (margin 15%)

4. Cliente en storefront:
   ├── Ve variantes con stock > 0
   ├── Selecciona color, talla, cantidad
   ├── price-tier.service.ts calcula precio automático
   └── Al comprar: se descuenta stock con UPDATE condicional

5. Pago al proveedor:
   ├── price - (price * margin_pct / 100) = pago al proveedor
   └── Congelado en order_items al momento de la venta
```

---

## 📐 Mapeo con el modelo actual

### products antes:
```sql
products (
  color, size, material, gender, season,        -- estos se MUEVEN a variants
  stock, reorder_point,                          -- stock se MUEVE a variants
  price, purchase_price,                         -- price → base_price, purchase_price → cost_price
  supplier, supplier_id                          → suppliers / supplier_products
)
```

### Transformación:
- `products.color`, `products.size`, `products.material` $\to$ se migran a `product_variants`
- `products.stock` $\to$ se recalcula como `SUM(variants.stock)` para productos con variantes
- `products.price` $\to$ se mantiene como `base_price` (fallback si variante sin override)
- `products.cost` $\to$ se mantiene (para food cost / recipes)
- `products.supplier`, `supplier_id` $\to$ migrar a `supplier_products`

### Productos SIN variantes:
- Siguen funcionando igual: se lee `products.base_price`, `products.stock`
- No es obligatorio tener variantes

### Migración:
```sql
-- Crear tablas nuevas (sin eliminar las viejas)
-- Productos sin variantes: stock sigue en products.stock
-- Productos con variantes: stock se calcula SUM(variants.stock)
-- Opcional: trigger para mantener products.stock sincronizado
```

---

## 🗺️ Plan de implementación (4 sprints)

### Sprint 1 — Schema DB
- Migración: `product_variants`, `variant_price_tiers`, `suppliers`, `supplier_products`, `inventory_movements`
- Índices en todas las FK compuestas
- `order_items`: agregar columnas congeladas (`cost_price`, `margin_pct`, `margin_amount`)

### Sprint 2 — Backend Core
- `variants.service.ts` — CRUD completo con tenant filter
- `price-tier.service.ts` — `resolvePrice()` + `calculateMargin()`
- `import.service.ts` — parser CSV con agrupación por Handle
- `suppliers.service.ts` — CRUD proveedores + productos por proveedor
- Endpoints REST (ver endpoints-index)

### Sprint 3 — Frontend POS + Storefront
- POS: selector de variante (color/talla) después de elegir producto
- POS: actualización de precio automática según cantidad (tier)
- Storefront: chips de color con disponibilidad visual
- Storefront: badge "mejor precio a partir de N uds."
- Storefront: recalculo en tiempo real al cambiar cantidad

### Sprint 4 — Panel Proveedor + Admin
- Vista proveedor: productos activos, stock por variante, ventas generadas
- Panel admin: configuración de margen por tier
- Reportes: utilidad real por producto (price - cost_price)
- Dashboard: KPIs de proveedores

---

## 🔗 Referencias cruzadas

- Ontología: [[ontology/entities]] — ProductVariant, VariantPriceTier, Supplier, InventoryMovement
- Governance: [[governance/universal-constraints]] — reglas de stock concurrente, price freezing
- Sinapsis: [[synapses/ops-chain]] — cadena Variant → PriceTier → Sale → InventoryMovement
- Flujo: [[flows/supplier-flow]] — proveedor → importación → venta → pago
- DB Index: [[indexes/db-tables-index]] — nuevas tablas
- Endpoints: [[indexes/endpoints-index]] — nuevos endpoints

---

⬡ DAIMUZ v3.9 — Arquitectura Variantes + Precios por Volumen + Proveedores
