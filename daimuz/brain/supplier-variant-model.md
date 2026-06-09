# 🧠 Modelo: Variantes de Producto + Precios Escalonados + Proveedores

> Arquitectura completa para que Lopbuk maneje productos con variantes (color/talla), precios por volumen y flujo multi-proveedor. Basado en mejores prácticas de Shopify, MedusaJS, ERPNext y plataformas SaaS multi-tenant.

---

## El Problema

El modelo actual trata al producto como un objeto plano con un solo registro de stock. `products` tiene columnas `color` / `size` directas, lo que obliga a duplicar el producto completo por cada combinación, rompiendo la lógica de precios por volumen e inventario independiente.

**Caso concreto:** "Body Siso Negro" y "Body Siso Marfil" comparten el mismo producto base pero necesitan stock, SKU y precio de proveedor independientes.

---

## Solución en 3 Capas

### Capa 1 — Modelo de Datos (DB)

```
products
  └── product_variants            ← 1 fila por combo color/talla
        ├── variant_price_tiers   ← N filas: precios escalonados por cantidad
        └── inventory_movements   ← kardex por variante (nuevo: variant_id en stock_movements)
```

### Capa 2 — Lógica de Negocio (services)

| Servicio | Responsabilidad |
|---|---|
| `variants.service.ts` | CRUD variantes + `resolvePrice()` + descontar stock |
| `price-tier.service.ts` | Dado variant_id + qty → devuelve precio correcto del tier |
| `import.service.ts` | CSV multi-fila → agrupa por handle, crea product + variants en bulk |

### Capa 3 — Flujo Proveedor

```
Proveedor (SE Sport)
  → sube catálogo con stock real por color
    → Lopbuk publica en storefront (solo colores con stock > 0)
      → Cliente elige color + cantidad
        → price-tier.service calcula precio del tier
          → Venta: descuenta stock de variante (atómico), congela datos en sale_items
```

---

## Schema DB

### product_variants

```sql
CREATE TABLE product_variants (
  id            VARCHAR(36) PRIMARY KEY,
  tenant_id     VARCHAR(36) NOT NULL,
  product_id    VARCHAR(36) NOT NULL,
  supplier_id   VARCHAR(50) NULL,        -- FK → suppliers(id)
  sku           VARCHAR(50) NOT NULL,
  color         VARCHAR(50) NULL,
  size          VARCHAR(20) NULL,
  stock         INT NOT NULL DEFAULT 0,
  min_stock     INT NOT NULL DEFAULT 5,
  cost_price    DECIMAL(12,2) NOT NULL DEFAULT 0,  -- precio del proveedor
  price_override DECIMAL(12,2) NULL,               -- precio venta diferente al base
  is_active     TINYINT(1) DEFAULT 1,
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  FOREIGN KEY (product_id, tenant_id) REFERENCES products(id, tenant_id),
  FOREIGN KEY (supplier_id) REFERENCES suppliers(id) ON DELETE SET NULL,
  INDEX idx_variant_product (product_id, tenant_id),
  INDEX idx_variant_sku (sku, tenant_id),
  INDEX idx_variant_supplier (supplier_id),
  UNIQUE INDEX idx_variant_tenant_sku (tenant_id, sku)
);
```

### variant_price_tiers

```sql
CREATE TABLE variant_price_tiers (
  id              VARCHAR(36) PRIMARY KEY,
  tenant_id       VARCHAR(36) NOT NULL,
  variant_id      VARCHAR(36) NOT NULL,
  min_qty         INT NOT NULL,               -- única columna: sin max_qty (evita gaps)
  price           DECIMAL(12,2) NOT NULL,      -- precio público final
  tenant_margin_pct DECIMAL(5,2) NOT NULL DEFAULT 0,  -- % comisión de Lopbuk
  is_active       TINYINT(1) DEFAULT 1,
  created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (variant_id, tenant_id) REFERENCES product_variants(id, tenant_id),
  INDEX idx_tier_variant (variant_id, tenant_id, min_qty),
  UNIQUE INDEX idx_tier_unique (variant_id, tenant_id, min_qty)  -- 1 tier por qty
);
```

### Modificaciones a tablas existentes

```sql
-- stock_movements: agregar variant_id opcional
ALTER TABLE stock_movements ADD COLUMN variant_id VARCHAR(36) NULL;
ALTER TABLE stock_movements ADD INDEX idx_movement_variant (variant_id);

-- sale_items: agregar variant_id + datos congelados
ALTER TABLE sale_items ADD COLUMN variant_id VARCHAR(36) NULL;
ALTER TABLE sale_items ADD COLUMN cost_price DECIMAL(12,2) NULL;
ALTER TABLE sale_items ADD COLUMN margin_pct DECIMAL(5,2) NULL;
ALTER TABLE sale_items ADD COLUMN margin_amount DECIMAL(12,2) NULL;
ALTER TABLE sale_items ADD INDEX idx_saleitem_variant (variant_id);

-- storefront_order_items: misma congelación
ALTER TABLE storefront_order_items ADD COLUMN variant_id VARCHAR(36) NULL;
ALTER TABLE storefront_order_items ADD COLUMN cost_price DECIMAL(12,2) NULL;
ALTER TABLE storefront_order_items ADD COLUMN margin_pct DECIMAL(5,2) NULL;
ALTER TABLE storefront_order_items ADD COLUMN margin_amount DECIMAL(12,2) NULL;
```

---

## Servicios Backend

### variants.service.ts — CRUD completo

```
Métodos:
  create(data)             → crea variante + valida tenant_id
  findAll(productId)       → variantes activas de un producto
  findById(id)             → variante individual
  update(id, data)         → actualiza stock, precio, etc.
  softDelete(id)           → is_active = 0
  findBySku(sku)           → lookup rápido

  descontarStock(variantId, qty, tenantId)
    → UPDATE product_variants SET stock = stock - qty
      WHERE id = ? AND tenant_id = ? AND stock >= qty
    → if affected_rows === 0 → throw AppError('Stock insuficiente', 400)
    → INSERT inventory_movements (type: 'salida', variant_id, quantity)
    → if stock < min_stock → alerta

  reposicionarStock(variantId, qty, tenantId, reason)
    → UPDATE product_variants SET stock = stock + qty WHERE id = ?
    → INSERT inventory_movements (type: 'entrada'|'devolucion', variant_id)
```

### price-tier.service.ts — Resolución de precio

```typescript
// Dado variant_id + qty → devuelve el tier aplicable o precio base
// SIN rangos min_qty/max_qty — solo minimum_quantity para evitar gaps
async resolvePrice(variantId: string, qty: number, tenantId: string) {
  // 1. Buscar tier activo con min_qty más alto ≤ qty
  const tier = await db.query(
    `SELECT price, tenant_margin_pct
     FROM variant_price_tiers
     WHERE variant_id = ? AND tenant_id = ? AND is_active = 1 AND min_qty <= ?
     ORDER BY min_qty DESC
     LIMIT 1`,
    [variantId, tenantId, qty]
  );

  if (tier[0]) return {
    success: true,
    price: Number(tier[0].price),
    marginPct: Number(tier[0].tenant_margin_pct),
    source: 'tier'
  };

  // 2. Fallback: price_override de la variante o sale_price del producto base
  const variant = await this.findById(variantId);
  const basePrice = variant.price_override ?? (await this.getProductPrice(variant.product_id));

  return {
    success: true,
    price: Number(basePrice),
    marginPct: 0,
    source: 'base'
  };
}
```

### import.service.ts — CSV masivo con variantes

Formato CSV (estándar e-commerce):

```
handle,name,color,size,sku,stock,cost_price,sale_price
body-siso,"Body Siso Premium",Negro,Única,SE-SISO-BLK,45,30000,45000
body-siso,"Body Siso Premium",Marfil,Única,SE-SISO-IVR,0,30000,45000
```

Algoritmo:
1. Agrupar filas por `handle`
2. Si el producto no existe → crearlo (primera fila = datos base)
3. Bulk insert de todas las variantes del grupo
4. Validar que `handle` + `tenant_id` no duplique productos

---

## Decisiones Arquitectónicas

### 1. `tenant_id` duplicado en tablas hijas

**Decisión:** SÍ — `product_variants` y `variant_price_tiers` tienen su propio `tenant_id`.

**Razón:** Lopbuk es multi-tenant SaaS. Tener `tenant_id` en cada tabla permite queries directas sin joins costosos, sharding futuro por tenant, y aislamiento completo. La redundancia es aceptable (misma filosofía que `products.tenant_id`).

### 2. `minimum_quantity` en vez de `min_qty + max_qty`

**Decisión:** Solo `min_qty`. Sin `max_qty`.

**Razón:** Elimina gaps entre rangos (ej: 1-5 y 7-11 → qty=6 sin tier). La query `ORDER BY min_qty DESC LIMIT 1` siempre encuentra el tier correcto. Es el estándar en plataformas modernas.

### 3. `cost_price` separado del `price_override`

**Decisión:** Ambos campos en `product_variants`.

**Razón:** `cost_price` = lo que cobra el proveedor (para calcular margen real). `price_override` = precio de venta si es distinto al `sale_price` del producto base. Sin `cost_price` no puedes saber si un cambio de precio del proveedor te deja sin margen.

### 4. `UPDATE stock = stock - X WHERE stock >= X` (atómico)

**Decisión:** Update condicional + verificación de `affected_rows`.

**Razón:** Previene race conditions. Si dos requests descontarStock() se ejecutan "al mismo tiempo", MySQL serializa los writes. El segundo UPDATE fallará silenciosamente (affected_rows = 0) porque `stock >= qty` ya no se cumple. Esto es más robusto que `SELECT ... FOR UPDATE` + validación en app.

### 5. Congelar datos en `sale_items`

**Decisión:** Al crear una venta, copiar `variant_id`, `sku`, `price`, `cost_price`, `margin_pct`, `margin_amount` a `sale_items`.

**Razón:** Si mañana cambias el precio de un tier, los reportes históricos no deben cambiar. Los precios y márgenes congelados son la fuente de verdad para contabilidad.

### 6. `inventory_movements` con `variant_id` opcional

**Decisión:** `stock_movements.variant_id` es NULL-able.

**Razón:** Los productos sin variantes siguen funcionando como antes (stock en `products`). Solo los productos con variantes registran movimientos con `variant_id`. Ambos coexisten.

---

## Implementación por Sprints

### Sprint 1 — Schema DB (1-2 días)

- Migración: `product_variants`, `variant_price_tiers`
- ALTER TABLE: `stock_movements` + `sale_items` + `storefront_order_items`
- Índices en `(product_id, tenant_id)` y `(variant_id, tenant_id, min_qty)`
- FK hacia `suppliers`, `products`

### Sprint 2 — Backend (2-3 días)

- `variants.service.ts` — CRUD + descontarStock + reposicionarStock
- `price-tier.service.ts` — resolvePrice(variantId, qty, tenantId)
- `import.service.ts` — CSV multi-fila con agrupación por handle
- Endpoints REST:
  - `GET /api/products/:id/variants` — variantes del producto
  - `POST /api/products/:id/variants` — crear variante
  - `PUT /api/variants/:id` — actualizar
  - `DELETE /api/variants/:id` — soft delete
  - `GET /api/variants/:id/price-tiers` — tiers de precio
  - `POST /api/variants/:id/price-tiers` — crear tier
  - `DELETE /api/variants/:id/price-tiers/:tierId` — eliminar tier
  - `POST /api/import/variants` — CSV import
- Modificar `sales.service.ts`:
  - Aceptar `variantId` en items
  - Descontar stock de variante si aplica
  - Congelar variant_id, cost_price, margin en sale_items

### Sprint 3 — Frontend POS y Tienda (2-3 días)

- **POS**: Selector de variante (color/talla) al elegir producto
  - Muestra solo variantes con stock > 0 (o todas con badge)
  - Precio dinámico según cantidad (price-tier.service)
  - `CartItem.variantId` en el store
- **Storefront**: Chips de color con disponibilidad visual
  - Badge "Precio mejora a partir de N uds."
  - Recalculo en tiempo real al cambiar cantidad
  - `ProductoCarrito` extiende con `variantId`, `costPrice`
- **Checkout**: Enviar `variantId` al crear pedido

### Sprint 4 — Panel Proveedor (1-2 días)

- Vista para que el proveedor vea:
  - Productos activos de su catálogo
  - Stock por variante
  - Ventas generadas (con datos congelados)
- Panel admin: configurar margen por tier
- Reportes de rentabilidad por proveedor

---

## Archivos del Módulo

### Backend (nuevos)

```
backend/src/modules/variants/
├── variants.service.ts      ← CRUD + descontarStock + resolvePrice
├── variants.controller.ts   ← handlers
├── variants.routes.ts       ← GET/POST/PUT/DELETE
└── index.ts

backend/src/modules/price-tiers/
├── price-tier.service.ts    ← resolvePrice() puro
├── price-tier.controller.ts
├── price-tier.routes.ts
└── index.ts

backend/src/modules/import/
├── import.service.ts        ← CSV con variantes
├── import.controller.ts
├── import.routes.ts
└── index.ts
```

### Frontend (nuevos/modificados)

```
frontend/components/
├── variant-selector.tsx     ← Selector color/talla para POS
├── variant-price-badge.tsx  ← Badge "mejora precio desde N"
├── storefront-variant-picker.tsx ← Chips de color en tienda
└── provider-products.tsx    ← Panel proveedor: stock y ventas
```

---

## Reglas de Negocio

1. **Stock de variante nunca negativo** — UPDATE condicional lo garantiza
2. **Sin gaps en tiers** — modelo `min_qty` único evita rangos huérfanos
3. **Precio siempre resuelto** — si no hay tier, usa `price_override` o `sale_price`
4. **Datos congelados en venta** — variante_id, precio, costo y margen se copian a sale_items
5. **Soft delete en variantes** — `is_active = 0`, nunca DELETE físico
6. **No borrar producto con variantes activas** — validar antes de soft delete
7. **Variante con stock > 0 → visible** en storefront; `stock = 0` → oculta
8. **tenant_id siempre presente** — en todas las queries de variantes y tiers

---

## Impacto en Módulos Existentes

| Módulo | Cambio |
|---|---|
| `products` | `color`/`size` columnas existentes se mantienen para productos sin variantes; productos CON variantes delegan a `product_variants` |
| `sales` | Aceptar `variantId` en items; descontar stock de variant (no product); congelar datos de variante en `sale_items` |
| `inventory` | `stock_movements.variant_id` opcional; kardex soporta variantes |
| `pos` | Selector de variante después de elegir producto; precio dinámico por qty |
| `storefront` | Mostrar variantes como chips de color; ocultar variantes sin stock; precio escalonado público |
| `purchases` | `suppliers` tabla ya existe; se referencia desde `product_variants.supplier_id` |
| `orders` (online) | Aceptar variantId, costPrice, margin en order_items |

---

## Métricas de Éxito

- Productos con variantes → stock independiente por color/talla
- Precios por volumen → cliente ve precio correcto según cantidad
- Proveedores → costo real por variante, margen calculable
- Historial financiero → reportes inmutables (datos congelados)
- Sin sobreventa → UPDATE atómico + affected_rows = 0
- Sin gaps de precio → modelo min_qty garantiza cobertura

---

← [[brain/coding-standards]] | [[DAIMUZ]] | → [[governance/universal-constraints]]
