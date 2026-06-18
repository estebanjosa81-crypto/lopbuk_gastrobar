# 📦 Módulo: Products — Variants + Price Tiers

> **Arquitectura completa de productos con variantes (color/talla), precios escalonados por volumen, stock independiente por variante, y flujo proveedor.**

---

## 🌳 Estructura del Modelo

```text
products (plantilla base)
  └── product_variants (1 por combinación color/talla)
        ├── stock, stock_minimo, cost_price, price_override
        ├── supplier_id → suppliers
        └── variant_price_tiers (N filas por variante)
              ├── min_qty: 1, 6, 12, 24
              ├── price: precio unitario en ese tier
              └── tenant_margin_pct: comisión de la plataforma
```

---

## 📐 Tablas de Base de Datos

### `products` — plantilla base del producto (refinada)

```sql
products (
  id            VARCHAR(36) PK,
  tenant_id     VARCHAR(36) NOT NULL,
  name          VARCHAR(255) NOT NULL,
  description   TEXT,
  base_price    DECIMAL(12,2) NOT NULL DEFAULT 0,  -- precio por defecto
  category_id   VARCHAR(36),
  image_url     VARCHAR(500),
  is_active     TINYINT(1) DEFAULT 1,
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
)
```

> **Cambio clave:** `stock`, `cost`, `sku`, `barcode`, `size`, `color`, `supplier_id` se MUEVEN a `product_variants`. `products` ya no tiene stock directo.

### `product_variants` — unidades vendibles

```sql
product_variants (
  id              VARCHAR(36) PK,
  tenant_id       VARCHAR(36) NOT NULL,
  product_id      VARCHAR(36) NOT NULL,
  sku             VARCHAR(100) NOT NULL,          -- único por tenant
  barcode         VARCHAR(100),
  color           VARCHAR(100),                   -- atributo 1
  size            VARCHAR(100),                   -- atributo 2
  stock           INT NOT NULL DEFAULT 0,         -- stock actual (NUNCA < 0)
  reserved_stock  INT NOT NULL DEFAULT 0,         -- reservado durante checkout
  stock_minimo    INT NOT NULL DEFAULT 0,         -- umbral alerta reorden
  cost_price      DECIMAL(12,2) NOT NULL DEFAULT 0, -- costo del proveedor
  price_override  DECIMAL(12,2) NULL,             -- si difiere del base_price
  supplier_id     VARCHAR(36),                    -- FK → suppliers
  is_active       TINYINT(1) DEFAULT 1,
  created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  INDEX(tenant_id),
  INDEX(product_id, tenant_id),
  UNIQUE(tenant_id, sku),
  INDEX(supplier_id)
)
```

### `variant_price_tiers` — precios por volumen

```sql
variant_price_tiers (
  id                VARCHAR(36) PK,
  tenant_id         VARCHAR(36) NOT NULL,          -- multi-tenant directo
  variant_id        VARCHAR(36) NOT NULL,
  min_qty           INT NOT NULL,                 -- solo mínimo, sin max_qty
  price             DECIMAL(12,2) NOT NULL,       -- precio unitario en este tier
  tenant_margin_pct DECIMAL(5,2) NOT NULL DEFAULT 0, -- comisión plataforma %
  is_active         TINYINT(1) DEFAULT 1,
  created_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at        TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  INDEX(variant_id, min_qty),
  INDEX(tenant_id),
  FOREIGN KEY (variant_id) REFERENCES product_variants(id)
)
```

### `inventory_movements` — kardex por variante

```sql
inventory_movements (
  id          VARCHAR(36) PK,
  tenant_id   VARCHAR(36) NOT NULL,
  variant_id  VARCHAR(36) NOT NULL,
  type        ENUM('entrada', 'salida', 'ajuste', 'merma', 'transferencia') NOT NULL,
  quantity    INT NOT NULL,             -- CON SIGNO: positivo=entra, negativo=sale
  reason      TEXT NOT NULL,            -- obligatorio para auditoría
  cost        DECIMAL(12,2),           -- costo unitario en el momento
  created_by  VARCHAR(36),
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  INDEX(tenant_id, variant_id),
  INDEX(created_at)
)
```

### `order_items` — datos congelados al comprar

```sql
order_items (
  id              VARCHAR(36) PK,
  tenant_id       VARCHAR(36) NOT NULL,
  sale_id         VARCHAR(36),
  variant_id      VARCHAR(36),
  product_name    VARCHAR(255) NOT NULL,     -- FROZEN
  sku             VARCHAR(100) NOT NULL,     -- FROZEN
  quantity        INT NOT NULL,
  unit_price      DECIMAL(12,2) NOT NULL,   -- FROZEN
  cost_price      DECIMAL(12,2) NOT NULL,   -- FROZEN
  margin_pct      DECIMAL(5,2) NOT NULL,    -- FROZEN
  margin_amount   DECIMAL(12,2) NOT NULL,   -- FROZEN
  subtotal        DECIMAL(12,2) NOT NULL,
  created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)
```

---

## 🧠 Lógica de Negocio (services)

### `variants.service.ts`

| Método | Descripción |
|---|---|
| `findByProduct(productId, tenantId)` | Lista variantes activas de un producto |
| `findById(id, tenantId)` | Variante individual con tiers |
| `create(data, tenantId)` | Crea variante con validación SKU único |
| `update(id, data, tenantId)` | Actualiza variante |
| `softDelete(id, tenantId)` | `is_active = 0` |
| `adjustStock(variantId, qty, reason, tenantId)` | **Actualización atómica** con race condition handling |

### `price-tier.service.ts`

| Método | Descripción |
|---|---|
| `resolvePrice(variantId, qty, tenantId)` | Devuelve `{ price, marginPct, source: 'tier'\|'base' }` |
| `setTier(variantId, data, tenantId)` | Crea/actualiza un tier |
| `deleteTier(tierId, tenantId)` | Elimina un tier |

### `import.service.ts`

- Lee CSV con formato: `Handle | Product Name | Color | Size | Variant SKU | Variant Stock | Base Price | Cost Price`
- Agrupa por Handle → crea `product` + `product_variants` por fila (bulk insert)

---

## ⚡ Reglas de Negocio Críticas

### Concurrencia de Stock (Race Condition)
```sql
-- Siempre usar UPDATE condicional para evitar sobreventa:
UPDATE product_variants
SET stock = stock - ?
WHERE id = ? AND stock >= ?;

-- Si affected_rows = 0 → rechazar la venta
```

### Resolución de Precio
```sql
-- Sin rangos max_qty, solo minimum_quantity:
SELECT price, tenant_margin_pct
FROM variant_price_tiers
WHERE variant_id = ? AND min_qty <= ? AND is_active = 1
ORDER BY min_qty DESC
LIMIT 1;

-- Si no hay tier → usar price_override ?? base_price del producto
```

### Congelación en Order
```json
// Cada order_item congela en el momento exacto de la compra:
{
  "product_name": "Body Siso Premium",
  "sku": "SE-SISO-BLK",
  "unit_price": 42000,
  "cost_price": 30000,
  "margin_pct": 28.57,
  "margin_amount": 12000
}
```

### tenant_id
- `product_variants`, `variant_price_tiers`, `inventory_movements` — TODAS llevan `tenant_id`
- Decisión: rendimiento multi-tenant > normalización. Permite queries directas sin JOIN,
  sharding futuro, y aislamiento por diseño. Ver [[decisions/variant-architecture]]

---

## 🧩 Integración con Módulos Existentes

| Módulo | Impacto del Cambio |
|---|---|
| **POS** | Selector de variante tras elegir producto; recalcular precio según cantidad |
| **Storefront** | Mostrar chips de color con stock; badge "mejor precio desde N uds." |
| **Inventory** | `stock_movements` ahora apunta a `variant_id`, no `product_id` |
| **Sales** | `sale_items` congela datos de la variante comprada |
| **Purchases** | Órdenes de compra ahora pueden especificar variante |
| **Suppliers** | Nueva columna `supplier_id` en variants para catálogo proveedor |

---

## 📦 Migración DB

```sql
-- 1. Crear product_variants
CREATE TABLE product_variants (...);

-- 2. Migrar datos existentes
INSERT INTO product_variants (id, tenant_id, product_id, sku, barcode, color, size,
                              stock, stock_minimo, cost_price, supplier_id)
SELECT UUID(), tenant_id, id, sku, barcode, color, size,
       stock, reorder_point, purchase_price, supplier_id
FROM products
WHERE is_active = 1;

-- 3. Crear variant_price_tiers (un tier base por variante con min_qty=1)
INSERT INTO variant_price_tiers (id, variant_id, min_qty, price, tenant_margin_pct)
SELECT UUID(), pv.id, 1, p.sale_price, 0
FROM products p
JOIN product_variants pv ON pv.product_id = p.id;

-- 4. Crear inventory_movements (volcar stock_movements existentes con variant_id)
-- 5. Agregar FKs y constraints
-- 6. Remover columnas obsoletas de products (stock, cost, size, color, etc.)
```

> ⚠️ Esta migración debe ejecutarse en transacción con backup previo.

---

## 📂 Archivos del Módulo

**Backend:**
- `backend/src/modules/variants/variants.service.ts`
- `backend/src/modules/variants/variants.controller.ts`
- `backend/src/modules/variants/variants.routes.ts`
- `backend/src/modules/variants/index.ts`
- `backend/src/modules/price-tiers/price-tier.service.ts`
- `backend/src/modules/price-tiers/price-tier.controller.ts`
- `backend/src/modules/price-tiers/price-tier.routes.ts`
- `backend/src/modules/price-tiers/index.ts`
- `backend/src/modules/products/import.service.ts` (CSV mejorado)

**Frontend:**
- `frontend/components/variant-selector.tsx` — selector en POS
- `frontend/components/price-tier-manager.tsx` — admin configura tiers
- `frontend/components/supplier-catalog.tsx` — vista proveedor

---

## 🗺️ Sprints de Implementación

| Sprint | Duración | Qué incluye |
|---|---|---|
| **Sprint 1 — Schema** | 2 días | Migración DB: `product_variants`, `variant_price_tiers`, `inventory_movements`, `order_items`. Índices. Migración de datos existentes. |
| **Sprint 2 — Backend** | 3 días | `variants.service.ts` CRUD, `price-tier.service.ts` con `resolvePrice()`, endpoints REST, importación CSV mejorada, migración de `products.service.ts` |
| **Sprint 3 — Frontend** | 3 días | Selector de variante en POS, chips de color en storefront, precio por cantidad dinámico, `price-tier-manager.tsx` en panel admin |
| **Sprint 4 — Proveedor** | 2 días | Vista proveedor de sus productos/stock/ventas, margen configurable por tier desde admin, panel de importación |

---

## ⚠️ Dependencias

- [[modules/inventory/inventory]] — kardex migra a `inventory_movements`
- [[modules/sales/sales]] — `sale_items` congela datos de variante
- [[modules/storefront/storefront]] — muestra variantes con stock > 0
- [[modules/pos/pos]] — requiere selector de variante
- [[modules/purchases/purchases]] — compras por variante
- [[synapses/ops-chain]] — toda la cadena POS → Venta → Inventario se ve afectada

---

← [[DAIMUZ]] | → [[modules/products/compressed]]
