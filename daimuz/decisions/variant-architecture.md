# 🧬 Decisión: Arquitectura de Variantes

> ⚠️ Este documento ha sido reemplazado por [[brain/variants-and-suppliers]] como fuente de verdad única.
> Mantenido solo para referencia histórica.

---

## ⚠️ El Problema

El modelo actual trata `products` como una tabla plana con un solo registro de stock.
"Body Siso Negro" y "Body Siso Marfil" comparten inventario o requieren duplicar el
producto completo, lo que rompe la lógica de precios por volumen y hace imposible
operar como plataforma proveedor.

---

## ✅ La Solución: 3 Capas

```
products (plantilla base)
  └── product_variants (1 por combinación color/talla)
        ├── stock, cost_price, price_override, supplier_id
        └── variant_price_tiers (N filas, precio por volumen)
```

---

## Decisiones Tomadas

### 1. `min_qty` en vez de `min_qty + max_qty`

**Problema del enfoque original:** rangos como `1-5`, `7-11` dejan un gap en `6` donde
ningún tier aplica → el sistema falla o usa precio base por error.

**Decisión:** Usar SOLO `min_qty`. La resolución ordena por `min_qty DESC` y toma el
primer tier donde `min_qty <= cantidad`.

```sql
SELECT price, tenant_margin_pct
FROM variant_price_tiers
WHERE variant_id = ? AND min_qty <= ? AND is_active = 1
ORDER BY min_qty DESC LIMIT 1;
```

| min_qty | price  |
|---------|--------|
| 1       | $45.000 |
| 6       | $42.000 |
| 12      | $39.000 |

`resolvePrice(variantId, 8)` → tier de 6 → `$42.000`. Sin gaps. ✅

### 2. `tenant_id` en `product_variants` y en `variant_price_tiers`

**Debate:** Hay dos escuelas:
- **Normalización:** Solo `products` tiene `tenant_id`; variants y tiers lo heredan vía JOIN.
- **Rendimiento multi-tenant:** Todas las tablas de negocio tienen `tenant_id` para filtrado
  directo sin JOIN, lo que simplifica queries y evita errores de omisión.

**Decisión:** `tenant_id` en `product_variants` y `variant_price_tiers`.

**Razón:** Lopbuk es SaaS multi-empresa. Tener `tenant_id` en cada tabla permite:
- Queries directas sin JOIN (`WHERE tenant_id = ?`)
- Sharding futuro por tenant_id
- Aislamiento de datos por diseño (un error en la query no expone datos de otro tenant)
- Consistencia con el patrón existente: TODAS las tablas de negocio tienen tenant_id

### 3. `cost_price` como columna obligatoria en variantes

**Problema:** Sin `cost_price` no sabes cuánto paga la plataforma al proveedor.
El margen calculado como `price - (price × margin_pct / 100)` es frágil: si el
proveedor sube su precio, el margen real desaparece.

**Decisión:** `cost_price DECIMAL(12,2) NOT NULL DEFAULT 0` en `product_variants`.

```
cost_price  → lo que cobra el proveedor
unit_price  → lo que paga el cliente (del tier o del override o base)
margin_real = unit_price - cost_price
margin_pct  → comisión que se lleva la plataforma (sobre unit_price)
```

### 4. `inventory_movements` como nueva tabla (no extender `stock_movements`)

**Decisión:** Crear tabla `inventory_movements` independiente para variantes, en vez
de agregar `variant_id` a `stock_movements`.

**Razón:**
- Schema limpio y optimizado para variantes (sin columnas heredadas irrelevantes)
- `stock_movements` sigue funcionando para productos sin variantes (backwards compat)
- Eventualmente se unifican cuando todos los productos migren
- La nueva tabla incluye `reference_type` + `reference_id` para trazabilidad origen

### 5. Congelación de precios en `order_items` / `sale_items`

**Problema:** Si reportes financieros leen el precio actual del tier, cambiar un tier
después de una venta corrompe el historial financiero.

**Decisión:** Cada `order_item` / `sale_item` congela en la compra:

```json
{
  "product_name": "Body Siso Premium",
  "variant_label": "Negro / M",
  "sku": "SE-SISO-BLK",
  "unit_price": 42000,
  "cost_price": 30000,
  "margin_pct": 28.57,
  "margin_amount": 12000
}
```

Nunca leer precios vivos de tiers/products para ventas históricas.

### 6. Stock atómico contra race conditions

**Problema:** Si 2 clientes compran la última unidad simultáneamente, ambos pueden
pasar un `if(stock > 0)` y generar sobreventa.

**Decisión:** Usar UPDATE condicional con verificación de filas afectadas:

```sql
UPDATE product_variants
SET stock = stock - ?
WHERE id = ? AND stock >= ?;

-- En el servicio:
const [result] = await db.execute(...)
if (result.affectedRows === 0) {
  throw new AppError('Stock insuficiente', 400)
}
```

Esto es atómico a nivel DB — no importa cuántos requests concurrentes lleguen.

### 7. `reserved_stock` para checkout multi-paso

**Decisión:** Agregar `reserved_stock INT DEFAULT 0` en `product_variants`.

Durante el checkout del storefront:
1. Seleccionan variante + cantidad → se reserva (`reserved_stock += qty`)
2. Si no completan el pago en N minutos → se libera la reserva
3. Al confirmar pago → `reserved_stock -= qty`, `stock -= qty`
4. El stock disponible para otros = `stock - reserved_stock`

Esto evita que 2 clientes compren el mismo producto durante el proceso de pago.

### 8. CSV de importación con formato jerárquico

**Formato estándar** (usado por Shopify, Medusa, etc.):

```
Handle | Product Name | Color | Size | Variant SKU | Stock | Cost Price | Sale Price
body-siso | Body Siso Premium | Negro | M | SE-SISO-BLK-M | 45 | 30000 | 50000
body-siso | Body Siso Premium | Marfil | M | SE-SISO-IVR-M | 30 | 30000 | 50000
```

El `import.service.ts` agrupa por **Handle**, upsert el producto, y bulk inserta
las variantes. Sin entrada manual.

---

## Diagrama de Tablas

```sql
products (
  id, tenant_id, name, description,
  base_price, category_id, image_url,
  is_active, created_at, updated_at
)
  │
  ├── product_variants (
  │     id, tenant_id, product_id,
  │     sku [UNIQUE per tenant], barcode,
  │     color, size, material, gender,
  │     stock, reserved_stock, stock_minimo,
  │     cost_price, price_override,
  │     image_url, supplier_id,
  │     is_active, created_at, updated_at
  │   )
  │     │
  │     ├── variant_price_tiers (
  │     │     id, tenant_id, variant_id,
  │     │     min_qty, price,
  │     │     tenant_margin_pct,
  │     │     is_active, created_at
  │     │   )
  │     │
  │     └── inventory_movements (
  │           id, tenant_id, variant_id,
  │           product_id, type, quantity,
  │           reason, cost, reference_type,
  │           reference_id, created_by, created_at
  │         )
  │
  └── stock_movements (legacy, productos sin variantes)
```

---

## Impacto en Módulos Existentes

| Módulo | Cambio |
|--------|--------|
| **products** | Se eliminan columnas: stock, cost, sku, barcode, color, size, supplier_id. `sale_price` → `base_price`. |
| **inventory** | Nueva tabla `inventory_movements` para variantes. `stock_movements` legacy sigue. |
| **sales** | `sale_items` congela datos de variante + agregar `variant_id` |
| **storefront** | Mostrar variantes como chips; ocultar variantes sin stock; recalcular precio por cantidad |
| **pos** | Selector de variante después de producto; precio dinámico según cantidad |
| **purchases** | Compras pueden especificar variante |
| **suppliers** | `supplier_id` en variantes; futura tabla `supplier_products` para multi-proveedor |
| **orders** | `storefront_order_items` congela datos de variante |

---

## Plan de Implementación

| Sprint | Días | Qué |
|--------|------|-----|
| **Sprint 1 — Schema DB** | 2 | Migración: `product_variants`, `variant_price_tiers`, `inventory_movements`. Migrar datos existentes de products a variantes (1 variante por producto con stock actual). |
| **Sprint 2 — Backend** | 3 | `variants.service.ts` CRUD + `adjustStock` atómico. `price-tier.service.ts` con `resolvePrice()`. `import.service.ts` CSV jerárquico. Endpoints REST. |
| **Sprint 3 — Frontend** | 3 | `variant-selector.tsx` en POS. Storefront: chips de color, badge "mejor precio desde N", precio dinámico. `price-tier-manager.tsx` en panel admin. |
| **Sprint 4 — Proveedor** | 2 | Vista proveedor de catálogo + stock + ventas. Margen configurable por tier. Panel de importación CSV. |

---

← [[decisions/multitenant-strategy]] | [[DAIMUZ]]
