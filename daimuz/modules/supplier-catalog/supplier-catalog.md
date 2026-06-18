# 🏭 Módulo: Supplier Catalog

## Qué hace
Gestiona productos con variantes (color/talla) y precios escalonados por volumen, permitiendo a proveedores externos subir catálogos completos con stock real. Lopbuk publica en la tienda online mostrando solo variantes con stock > 0, y el precio se resuelve automáticamente según la cantidad que el cliente elija.

## Arquitectura del modelo

```
products (producto base: "Body Siso Premium")
  └── product_variants (cada combinación color+talla: "Negro M", "Marfil L")
        ├── stock propio, SKU propio, costo propio, supplier_id
        └── variant_price_tiers (precios escalonados por volumen)
              ├── min_qty: 1   → price: $45.000, margin_pct: 15
              ├── min_qty: 6   → price: $42.000, margin_pct: 12
              └── min_qty: 12  → price: $39.000, margin_pct: 10
```

## Archivos del Módulo

**Backend:**
- `backend/src/modules/supplier-catalog/variants.service.ts` — CRUD variantes, descuento de stock por variante
- `backend/src/modules/supplier-catalog/variants.routes.ts` — endpoints REST
- `backend/src/modules/supplier-catalog/variants.controller.ts` — controller
- `backend/src/modules/supplier-catalog/price-tier.service.ts` — resolvePrice(variantId, qty, tenantId)
- `backend/src/modules/supplier-catalog/price-tier.routes.ts` — endpoints para configurar tiers
- `backend/src/modules/supplier-catalog/import.service.ts` — importación CSV con agrupación por handle
- `backend/src/modules/supplier-catalog/import.routes.ts` — endpoints de importación

**Frontend:**
- `frontend/components/variant-selector.tsx` — selector de variante en POS
- `frontend/components/price-tier-display.tsx` — visualización de precios escalonados
- `frontend/components/supplier-panel.tsx` — vista del proveedor (stock por variante, ventas)
- `frontend/components/catalog-import.tsx` — UI para subir CSV de proveedor

## APIs

```
# Variantes
GET    /api/products/:id/variants           → lista variantes de un producto
POST   /api/products/:id/variants           → crear variante
PUT    /api/variants/:id                    → actualizar variante
PATCH  /api/variants/:id/stock              → ajustar stock atómico
DELETE /api/variants/:id                    → soft delete variante

# Price Tiers
GET    /api/variants/:id/price-tiers        → lista tiers de una variante
POST   /api/variants/:id/price-tiers        → crear tier
PUT    /api/price-tiers/:id                 → actualizar tier
DELETE /api/price-tiers/:id                 → eliminar tier

# Resolución de precio (público)
GET    /api/variants/:id/price?qty=N        → { price, marginPct, source }

# Importación
POST   /api/supplier-catalog/import         → subir CSV y procesar
GET    /api/supplier-catalog/import/:jobId  → estado de importación

# Panel proveedor
GET    /api/supplier/my-products            → productos activos del proveedor
GET    /api/supplier/my-sales               → ventas generadas de sus productos
```

## Flujo de Resolución de Precio

```
resolvePrice(variantId, qty, tenantId)
  1. SELECT * FROM variant_price_tiers
     WHERE variant_id = ? AND tenant_id = ?
     AND min_qty <= ?
     ORDER BY min_qty DESC LIMIT 1

  2. Si hay tier → devuelve { price, marginPct, source: 'tier' }

  3. Si no hay tier → devuelve { price: variant.price_override ?? product.base_price,
                                  marginPct: 0, source: 'base' }
```

## Flujo de Descuento de Stock (Race Condition Safe)

```sql
UPDATE product_variants
SET stock = stock - ?
WHERE id = ? AND tenant_id = ? AND stock >= ?;
```
Si `affectedRows === 0` → error "Stock insuficiente". Esto previene sobreventa bajo concurrencia.

## Congelación en Order Items

Cuando se genera una venta o pedido, los ítems congelan:
```
order_items / sale_items:
  variant_id, product_name, sku, price (congelado),
  cost_price (congelado), margin_pct (congelado), margin_amount
```

## Tablas DB

```sql
product_variants (
  id              VARCHAR(36) PK,
  tenant_id       VARCHAR(36) NOT NULL,    -- duplicado para queries rápidas
  product_id      VARCHAR(36) NOT NULL,    -- FK → products.id
  supplier_id     VARCHAR(36) NULL,        -- FK → suppliers.id
  sku             VARCHAR(50) NOT NULL,    -- único por tenant
  color           VARCHAR(50) NULL,
  size            VARCHAR(50) NULL,
  stock           INT NOT NULL DEFAULT 0,
  reserved_stock  INT NOT NULL DEFAULT 0,
  cost_price      DECIMAL(12,2) NOT NULL,  -- precio del proveedor
  price_override  DECIMAL(12,2) NULL,      -- si difiere del precio base del producto
  is_active       TINYINT(1) DEFAULT 1,
  created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  UNIQUE (tenant_id, sku),
  UNIQUE (tenant_id, product_id, color, size),
  INDEX (product_id, tenant_id),
  INDEX (supplier_id)
)

variant_price_tiers (
  id                VARCHAR(36) PK,
  tenant_id         VARCHAR(36) NOT NULL,  -- duplicado para queries rápidas
  variant_id        VARCHAR(36) NOT NULL,  -- FK → product_variants.id
  min_qty           INT NOT NULL,          -- cantidad mínima para aplicar este tier
  price             DECIMAL(12,2) NOT NULL,-- precio público en este tier
  tenant_margin_pct DECIMAL(5,2) NOT NULL, -- % que gana Lopbuk
  is_active         TINYINT(1) DEFAULT 1,
  created_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at        TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  INDEX (variant_id, tenant_id),
  INDEX (variant_id, min_qty)
)

-- Extensión de stock_movements existente: agregar variant_id NULLable
ALTER TABLE stock_movements ADD COLUMN variant_id VARCHAR(36) NULL;

-- Extensión de sale_items: agregar variant_id + frozen price fields
ALTER TABLE sale_items ADD COLUMN variant_id VARCHAR(36) NULL;
ALTER TABLE sale_items ADD COLUMN frozen_sku VARCHAR(100) NULL;
ALTER TABLE sale_items ADD COLUMN frozen_cost DECIMAL(12,2) NULL;
ALTER TABLE sale_items ADD COLUMN frozen_margin_pct DECIMAL(5,2) NULL;

-- Extensión de order_items: mismo patrón
ALTER TABLE order_items ADD COLUMN variant_id VARCHAR(36) NULL;
ALTER TABLE order_items ADD COLUMN frozen_sku VARCHAR(100) NULL;
ALTER TABLE order_items ADD COLUMN frozen_cost DECIMAL(12,2) NULL;
ALTER TABLE order_items ADD COLUMN frozen_margin_pct DECIMAL(5,2) NULL;

-- Extensión de storefront_order_items: mismo patrón
ALTER TABLE storefront_order_items ADD COLUMN variant_id VARCHAR(36) NULL;
```

## Modelo de Importación CSV

Formato estándar con filas repetidas por variante:

```csv
Handle,ProductName,Attribute:Color,Attribute:Size,VariantSKU,VariantStock,CostPrice,SalePrice
body-siso,Body Siso Premium,Negro,M,SE-SISO-BLK-M,15,30000,45000
body-siso,Body Siso Premium,Negro,L,SE-SISO-BLK-L,12,30000,45000
body-siso,Body Siso Premium,Marfil,M,SE-SISO-IVR-M,8,30000,45000
```

`import.service.ts` agrupa por `Handle`, crea el `product` si no existe, luego bulk insert en `product_variants`.

## Proveedores Múltiples (Futuro)

Cuando un mismo producto puede venir de varios proveedores:

```sql
supplier_products (
  id              VARCHAR(36) PK,
  tenant_id       VARCHAR(36) NOT NULL,
  product_id      VARCHAR(36) NOT NULL,
  supplier_id     VARCHAR(36) NOT NULL,
  supplier_sku    VARCHAR(100) NULL,
  supplier_price  DECIMAL(12,2) NULL,
  is_preferred    TINYINT(1) DEFAULT 0,
  is_active       TINYINT(1) DEFAULT 1,
  created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  UNIQUE (supplier_id, product_id),
  INDEX (tenant_id)
)
```

Modelo: `products → supplier_products → product_variants`

## Reglas Críticas

- **Stock nunca baja de 0** — validación atómica con `WHERE stock >= ?`
- **Todo movimiento de variante se registra en stock_movements** con variant_id
- **Los precios se congelan en sale_items/order_items** al momento de la compra — no se leen de tiers después
- **tenant_id se duplica** en product_variants y variant_price_tiers para queries rápidas sin JOIN
- **Solo variantes con stock > 0** aparecen en la tienda online
- **El precio base del producto** se usa como fallback si no hay tier configurado
- **Soft delete** en variantes — `is_active = 0`, nunca DELETE físico

## Dependencias

- [[modules/products/products]] — el producto base existe aquí
- [[modules/inventory/inventory]] — stock_movements extendido con variant_id
- [[modules/sales/sales]] — sale_items congelan datos de variante
- [[modules/storefront/storefront]] — muestra variantes con stock > 0 y precio resuelto
- [[modules/suppliers/suppliers]] — proveedores referenciados por supplier_id
- [[modules/pos/pos]] — selector de variante al vender

---

← [[DAIMUZ]] | → [[modules/supplier-catalog/compressed]]
