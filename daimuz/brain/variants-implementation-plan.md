# 🧬 Plan Definitivo — Variantes + Price Tiers + Proveedores

> **Diagnóstico:** La ontología, el esquema DB y la documentación DAIMUZ ya definen correctamente el modelo de variantes. El código (`products.service.ts`, `storefront.routes.ts`, `sales.service.ts`) aún opera con el modelo plano (color/talla como columnas directas, stock único, sin tiers). Este plan cierra esa brecha.

---

## 1. Diagnóstico — Qué está bien y qué falta

### ✅ Ya existe en DAIMUZ (validado contra el análisis crítico)

| Concepto | Estado | Documento |
|---|---|---|
| Modelo `products → variants → price_tiers` | ✅ Definido | `modules/products/products.md` |
| `min_qty` sin `max_qty` (sin gaps) | ✅ Correcto | `modules/products/products.md:173` |
| Stock atómico con `WHERE stock >= ?` | ✅ Definido | `modules/products/products.md:161` |
| Precios congelados en `order_items` | ✅ Definido | `modules/products/products.md:108` |
| `cost_price` en variante (costo proveedor) | ✅ Definido | `modules/products/products.md:57` |
| `reserved_stock` para checkout | ✅ En schema | `modules/products/products.md:55` |
| `tenant_id` en variants (no en tiers) | ✅ Decisión tomada | `modules/products/products.md:195` |
| `inventory_movements` como kardex | ✅ Definido | `modules/products/products.md:89` |
| Flujo proveedor completo (supplier-chain) | ✅ Definido | `synapses/supplier-chain.md` |
| Formato CSV de importación | ✅ Definido | `modules/products-variants/products-variants.md:152` |
| Ontología de entidades | ✅ Definida | `ontology/entities.md` |

### ⚠️ Inconsistencias detectadas (hay que alinear)

| Dónde | Problema | Solución |
|---|---|---|
| `products.md` vs `products-variants.md` | products.md usa `inventory_movements` como tabla nueva; products-variants.md modifica `stock_movements` | Unificar: crear `inventory_movements` como tabla universal |
| `products.md` vs `migrations/004_*.sql` | products.md NO tiene `product_id` en `inventory_movements`; la migración SÍ tiene ambos (`variant_id` + `product_id`) | La migración está bien: permitir `product_id` para movimientos de productos sin variantes |
| `products.md` vs `migrations/004_*.sql` | products.md: tiers SIN `tenant_id`; migración: tiers CON `tenant_id` | Mantener SIN `tenant_id` en tiers (se resuelve vía variant → product) |
| `products.md` columna `quantity` | Dice "CON SIGNO: positivo=entra, negativo=sale" | Mejor usar `quantity` siempre positivo + `type` indica dirección |
| `entities.md` tiene `ProductVariant` repetido 3 veces | Entrada duplicada (líneas 139, 190, 276) | Limpiar duplicados |

### 🔴 Lo que NO existe y hay que crear

| Qué | Prioridad | Archivo |
|---|---|---|
| `variants.service.ts` — CRUD + stock atómico | P1 | `backend/src/modules/variants/` |
| `variants.controller.ts` | P1 |  |
| `variants.routes.ts` | P1 |  |
| `price-tier.service.ts` — resolvePrice + CRUD tiers | P1 | `backend/src/modules/price-tiers/` |
| `price-tier.controller.ts` | P1 |  |
| `price-tier.routes.ts` | P1 |  |
| `import.service.ts` — CSV con variantes | P1 | `backend/src/modules/products/` |
| `variant-selector.tsx` — chips color/talla en POS | P2 | `frontend/components/` |
| `price-tier-manager.tsx` — admin configura tiers | P2 | `frontend/components/` |
| Badge "mejor precio desde N uds" en storefront | P2 | `frontend/components/` |
| Panel proveedor (stock/ventas) | P3 | `frontend/components/` |
| Actualizar `products.service.ts` — migrar color/size a variantes | P1 | `backend/src/modules/products/` |
| Actualizar `storefront.routes.ts` — variants + price tiers en queries | P1 | `backend/src/modules/storefront/` |
| Actualizar `sales.service.ts` — variantes en createSale + stock atómico | P1 | `backend/src/modules/sales/` |
| Actualizar `common/types/index.ts` — tipos Variant, PriceTier | P1 | `backend/src/common/types/` |

---

## 2. Modelo de Datos Definitivo (fuente única de verdad)

```sql
-- products: ahora es plantilla base (sin stock, sin color/size directos)
products (
  id, tenant_id,
  name, description, base_price, category_id, image_url,
  is_active, created_at, updated_at
  -- stock, cost, sku, barcode, color, size, material, gender → se MUEVEN a variants
)

-- product_variants: unidad mínima de inventario
product_variants (
  id VARCHAR(36) PK,
  tenant_id VARCHAR(36) NOT NULL,
  product_id VARCHAR(36) NOT NULL,
  sku VARCHAR(100) NOT NULL,
  barcode VARCHAR(100),
  color VARCHAR(100),                   -- primer atributo (ej: "Negro", "Marfil")
  size VARCHAR(100),                    -- segundo atributo (ej: "S", "M", "L")
  material VARCHAR(100),               -- tercer atributo opcional
  stock DECIMAL(12,3) NOT NULL DEFAULT 0,  -- NUNCA < 0
  reserved_stock DECIMAL(12,3) NOT NULL DEFAULT 0,  -- reservado por checkout en progreso
  min_stock DECIMAL(12,3) NOT NULL DEFAULT 0,       -- umbral alerta reorden
  cost_price DECIMAL(12,2),             -- precio del proveedor
  price_override DECIMAL(12,2),         -- si difiere de products.base_price
  supplier_id VARCHAR(36),              -- FK → suppliers
  images JSON,                          -- fotos específicas de la variante
  sort_order INT DEFAULT 0,
  is_active TINYINT(1) DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uk_sku_tenant (sku, tenant_id),
  INDEX(product_id, tenant_id),
  INDEX(supplier_id)
)
-- DECISIÓN: Rendimiento multi-tenant > normalización. Permite filtrado directo sin JOIN,
-- sharding futuro y aislamiento por diseño.

variant_price_tiers (
  id VARCHAR(36) PK,
  tenant_id VARCHAR(36) NOT NULL,       -- redundante deliberado: filtrado directo sin JOIN
  variant_id VARCHAR(36) NOT NULL,
  min_qty INT UNSIGNED NOT NULL,        -- SOLO minimum_quantity (sin max_qty, sin gaps)
  price DECIMAL(12,2) NOT NULL,         -- precio unitario en este escalón
  tenant_margin_pct DECIMAL(5,2) NOT NULL DEFAULT 0,
  is_active TINYINT(1) DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX(variant_id, tenant_id, min_qty),
  UNIQUE(variant_id, min_qty),
  FOREIGN KEY (variant_id) REFERENCES product_variants(id)
)

-- inventory_movements: kardex universal (reemplaza stock_movements gradualmente)
inventory_movements (
  id VARCHAR(36) PK,
  tenant_id VARCHAR(36) NOT NULL,
  variant_id VARCHAR(36),               -- NULL si es producto sin variantes
  product_id VARCHAR(36) NOT NULL,      -- siempre presente (para productos legacy)
  type ENUM('entrada','salida','ajuste','merma','transferencia','reserva','liberacion') NOT NULL,
  quantity INT NOT NULL,                -- siempre positivo. type determina dirección
  reason TEXT NOT NULL,
  cost DECIMAL(12,2),
  reference_type VARCHAR(50),           -- 'sale', 'purchase', 'adjustment'
  reference_id VARCHAR(36),             -- ID de la referencia
  created_by VARCHAR(36),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX(tenant_id, variant_id),
  INDEX(tenant_id, product_id),
  INDEX(created_at)
)

-- suppliers: proveedores
suppliers (
  id VARCHAR(36) PK,
  tenant_id VARCHAR(36) NOT NULL,
  name VARCHAR(255) NOT NULL,
  contact_info TEXT,
  phone VARCHAR(50),
  email VARCHAR(255),
  payment_terms VARCHAR(100),
  is_active TINYINT(1) DEFAULT 1,
  created_at, updated_at
)

-- supplier_products: relación N:N (multi-proveedor futuro)
supplier_products (
  id VARCHAR(36) PK,
  tenant_id VARCHAR(36) NOT NULL,
  product_id VARCHAR(36) NOT NULL,
  supplier_id VARCHAR(36) NOT NULL,
  supplier_sku VARCHAR(100),
  supplier_price DECIMAL(12,2),
  lead_time_days INT,
  is_preferred TINYINT(1) DEFAULT 0,
  is_active TINYINT(1) DEFAULT 1,
  created_at, updated_at,
  UNIQUE(supplier_id, product_id)
)

-- Modificaciones a tablas existentes:
ALTER TABLE sale_items ADD COLUMN variant_id VARCHAR(36) NULL;
ALTER TABLE sale_items ADD COLUMN frozen_sku VARCHAR(100) NULL;
ALTER TABLE sale_items ADD COLUMN frozen_cost DECIMAL(12,2) NULL;
ALTER TABLE sale_items ADD COLUMN frozen_margin_pct DECIMAL(5,2) NULL;

ALTER TABLE order_items ADD COLUMN variant_id VARCHAR(36) NULL;
ALTER TABLE order_items ADD COLUMN frozen_sku VARCHAR(100) NULL;
ALTER TABLE order_items ADD COLUMN frozen_cost DECIMAL(12,2) NULL;
ALTER TABLE order_items ADD COLUMN frozen_margin_pct DECIMAL(5,2) NULL;

ALTER TABLE storefront_order_items ADD COLUMN variant_id VARCHAR(36) NULL;
```

---

## 3. Arquitectura de Servicios

```
┌─────────────────────────────────────────────────────────────┐
│                     variants/ module                        │
│  variants.routes.ts → variants.controller.ts                │
│     → variants.service.ts (CRUD + stock atómico)            │
│     → price-tier.service.ts (resolvePrice + tiers CRUD)     │
│     → import.service.ts (CSV proveedor)                     │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                  Módulos que se actualizan                   │
│                                                             │
│  products.service.ts  →  update() sin stock/color/size      │
│  sales.service.ts     →  createSale() usa variants          │
│  storefront.routes.ts →  queries con variants + price tiers │
│  pos (frontend)       →  variant-selector.tsx               │
│  inventory            →  inventory_movements como kardex    │
└─────────────────────────────────────────────────────────────┘
```

### VariantsService — Métodos Core

| Método | Responsabilidad |
|---|---|
| `findByProduct(productId, tenantId)` | Lista variantes activas + sus tiers |
| `findById(id, tenantId)` | Variante individual con datos del producto padre |
| `create(data, tenantId)` | Valida SKU único, crea variante |
| `update(id, data, tenantId)` | Actualiza campos permitidos |
| `softDelete(id, tenantId)` | `is_active = 0` |
| `adjustStock(variantId, qty, reason, tenantId, reference?)` | UPDATE atómico + inventory_movement + verificación affectedRows |

### PriceTierService — Métodos Core

| Método | Responsabilidad |
|---|---|
| `resolvePrice(variantId, qty, tenantId)` | Busca tier con `min_qty <= qty ORDER BY min_qty DESC LIMIT 1`. Fallback: `price_override ?? base_price` |
| `setTier(variantId, data, tenantId)` | Crea tier con validación de duplicado `(variant_id, min_qty)` |
| `deleteTier(tierId, tenantId)` | Soft delete del tier |

### ImportService — Flujo CSV

```
1. Recibir CSV con columnas:
   Handle | ProductName | Attribute:Color | Attribute:Size | VariantSKU | VariantStock | BasePrice | CostPrice

2. Agrupar filas por Handle
3. Para cada grupo:
   a. Buscar/crear Product por nombre
   b. Bulk insert en product_variants (1 fila por variante en el grupo)
   c. Crear price_tier base (min_qty=1, price=BasePrice, margin=0)
4. Transacción: todo o nada
```

---

## 4. Reglas de Negocio — Checklist de Validación

- [ ] **Stock atómico**: `UPDATE product_variants SET stock = stock - ? WHERE id = ? AND stock >= ?`. Si `affectedRows = 0` → `AppError('Stock insuficiente', 400)`. No hay check-and-set en dos pasos.
- [ ] **Sin gaps en tiers**: Solo `min_qty`. Resolución: `WHERE min_qty <= ? ORDER BY min_qty DESC LIMIT 1`.
- [ ] **Precios congelados**: `sale_items` y `order_items` guardan `frozen_sku, frozen_cost, frozen_margin_pct` al momento de la compra. Nunca leer `variant_price_tiers` para histórico.
- [ ] **Stock nunca negativo**: Validado a nivel DB (el UPDATE no lo permite) y a nivel aplicación.
- [ ] **Solo stock > 0 visible**: Storefront muestra variantes donde `stock - reserved_stock > 0`.
- [ ] **tenant_id**: `product_variants`, `variant_price_tiers`, `inventory_movements` — TODAS llevan `tenant_id`. Decisión: rendimiento multi-tenant > normalización.
- [ ] **Soft delete**: Variantes y tiers usan `is_active = 0`. Nunca DELETE físico.
- [ ] **Movimiento requiere reason**: `inventory_movements.reason` es NOT NULL. Sin excepción.
- [ ] **Reserved stock**: `reserved_stock` se incrementa al iniciar checkout, se decrementa al confirmar o liberar.
- [ ] **Importación en transacción**: O toda la importación del CSV es exitosa o se revierte todo.

---

## 5. Plan de Implementación (Sprints)

### Sprint 0 — Alineación DAIMUZ (1 día)

| Tarea | Archivo |
|---|---|
| Unificar `products.md` y `products-variants.md` (resolver inconsistencias) | `daimuz/modules/products/products.md` |
| Limpiar `ProductVariant` repetido en `entities.md` | `daimuz/ontology/entities.md` |
| Migración SQL definitiva (basada en `004_*.sql` pero alineada al plan) | `backend/src/migrations/005_variants_definitive.sql` |
| Agregar `common/types` para Variant, PriceTier, Supplier | `backend/src/common/types/index.ts` |

### Sprint 1 — Backend Variants (3 días)

| Tarea | Archivos |
|---|---|
| `variants.service.ts` — CRUD + stock atómico | `backend/src/modules/variants/variants.service.ts` |
| `variants.controller.ts` | `backend/src/modules/variants/variants.controller.ts` |
| `variants.routes.ts` | `backend/src/modules/variants/variants.routes.ts` |
| `price-tier.service.ts` — resolvePrice + CRUD | `backend/src/modules/price-tiers/price-tier.service.ts` |
| Endpoints REST para tiers | `backend/src/modules/price-tiers/` |
| `import.service.ts` — CSV con agrupación por Handle | `backend/src/modules/products/import.service.ts` |
| Registrar rutas en módulo index | `backend/src/modules/index.ts` |

### Sprint 2 — Migrar módulos existentes (2 días)

| Tarea | Archivos |
|---|---|
| Refactor `products.service.ts`: remover color/size/stock/cost de productos planos | `backend/src/modules/products/products.service.ts` |
| Refactor `sales.service.ts`: `createSale()` usa variants si `variant_id` presente, stock atómico | `backend/src/modules/sales/sales.service.ts` |
| Refactor `storefront.routes.ts`: queries con variants + price tiers | `backend/src/modules/storefront/storefront.routes.ts` |
| Refactor `inventory.service.ts`: soporte `inventory_movements` | `backend/src/modules/inventory/inventory.service.ts` |
| Migración de datos: productos existentes → variantes base | Script SQL |

### Sprint 3 — Frontend POS + Storefront (3 días)

| Tarea | Archivos |
|---|---|
| `variant-selector.tsx` — chips color + talla en POS | `frontend/components/variant-selector.tsx` |
| `price-tier-manager.tsx` — admin configura tiers | `frontend/components/price-tier-manager.tsx` |
| Storefront: mostrar variantes con stock > 0, badge "mejor precio desde N uds" | `frontend/components/tienda.tsx` |
| Storefront: recalcular precio al cambiar cantidad | `frontend/components/` |
| POS: actualizar precio automático según cantidad + variante | `frontend/components/point-of-sale.tsx` |

### Sprint 4 — Panel Proveedor (2 días)

| Tarea | Archivos |
|---|---|
| Vista proveedor: productos activos, stock por variante | `frontend/components/supplier-catalog.tsx` |
| Admin: configurar margen por tier | `price-tier-manager.tsx` (extendido) |
| Panel de importación CSV en frontend | `frontend/components/supplier-catalog-upload.tsx` |
| Reporte de ventas por variante para proveedor | `backend/src/modules/variants/variants.service.ts` |

---

## 6. Mapa de Archivos a Crear vs Modificar

### Crear desde cero
```
backend/src/modules/variants/
  ├── variants.routes.ts
  ├── variants.controller.ts
  ├── variants.service.ts
  └── index.ts

backend/src/modules/price-tiers/
  ├── price-tier.routes.ts
  ├── price-tier.controller.ts
  ├── price-tier.service.ts
  └── index.ts

backend/src/migrations/005_variants_definitive.sql

frontend/components/variant-selector.tsx
frontend/components/price-tier-manager.tsx
frontend/components/supplier-catalog.tsx
frontend/components/supplier-catalog-upload.tsx
```

### Modificar
```
backend/src/modules/products/products.service.ts   ← refactor modelo plano
backend/src/modules/products/products.routes.ts    ← nuevos endpoints variants
backend/src/modules/products/import.service.ts     ← CSV con variantes
backend/src/modules/sales/sales.service.ts         ← variants + stock atómico
backend/src/modules/inventory/inventory.service.ts ← inventory_movements
backend/src/modules/storefront/storefront.routes.ts ← variants en queries
backend/src/common/types/index.ts                  ← nuevos tipos

daimuz/ontology/entities.md                         ← limpiar duplicados
daimuz/modules/products/products.md                 ← unificar con variants
daimuz/modules/products-variants/products-variants.md ← unificar
```

---

## 7. Scorecard — Análisis vs Mejores Prácticas

| Práctica | Propuesta original | DAIMUZ existente | Este plan |
|---|---|---|---|
| Variantes con stock propio | 9/10 | 10/10 | 10/10 |
| Price tiers sin gaps | 8/10 | 10/10 | 10/10 |
| Multi-tenant (tenant_id en todas las tablas) | 8/10 | 9/10 | 9/10 |
| Escalabilidad (índices, sharding-ready) | 8/10 | 10/10 | 10/10 |
| Concurrencia de stock (race conditions) | 6/10 | 10/10 | 10/10 |
| Auditoría financiera (precios congelados) | 5/10 | 10/10 | 10/10 |
| Importación masiva CSV | 8/10 | 9/10 | 9/10 |
| Arquitectura SaaS / multi-proveedor | 8/10 | 9/10 | 10/10 |
| Kardex universal (inventory_movements) | — | 9/10 | 10/10 |
| **Total** | **8.0/10** | **9.4/10** | **9.8/10** |

**Diferencias con la propuesta original del usuario:**
- `tenant_id` en tiers → SÍ (decisión final: rendimiento multi-tenant > normalización)
- `max_qty` en rangos → NO (solo `min_qty`)
- `cost_price` → SÍ (ya en daimuz)
- Stock atómico → SÍ (ya en daimuz)
- Precios congelados → SÍ (ya en daimuz)
- `inventory_movements` como reemplazo de `stock_movements` → SÍ (mejora sobre la propuesta original que solo modificaba stock_movements)

---

## 8. Riesgos y Mitigaciones

| Riesgo | Impacto | Mitigación |
|---|---|---|
| Migración de datos existentes (productos actuales → variantes) | Alto | Script idempotente con transacción + backup. Productos sin color/size se quedan como están (sin variantes) |
| Storefront en producción rompe durante migración | Alto | Feature flag: `variants_enabled` en tenant. Mientras esté en false, el storefront usa el modelo plano actual |
| Race conditions durante rollout | Medio | El stock atómico ya se implementa desde el día 1 de variantes. El sistema plano actual no tiene race condition handling (es el bug que estamos arreglando) |
| Proveedores con datos inconsistentes en CSV | Bajo | Validación estricta en `import.service.ts`. Errores por fila en lugar de rechazar todo el archivo |

---

← [[brain/identity]] | [[DAIMUZ]] | → [[context/current-sprint]]
