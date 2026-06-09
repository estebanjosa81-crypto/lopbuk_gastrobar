# ⚖️ Reglas de Negocio — Lopbuk

> Reglas críticas que Claude debe conocer antes de modificar lógica del sistema.  
> Ver también: [[decisions/multitenant-strategy]] · [[decisions/auth-approach]]

---

## 🏢 Multi-Tenant

1. **Todo dato de negocio lleva `tenant_id`** — sin excepción
2. **Nunca hacer queries sin filtro de tenant** — podría exponer datos de otro negocio
3. **El `tenant_id` viene siempre de `req.user.tenantId`** (JWT), nunca del body del request
4. **Superadmin** puede operar en cualquier tenant; los demás roles solo en el suyo
5. Los módulos inactivos de un tenant → el backend retorna 403

---

## 🧩 Variantes y Precios Escalonados

### Productos con Variantes
- Un `product` es una plantilla base (name, desc, base_price, image)
- Las `product_variants` representan combinaciones de atributos (color + talla)
- Cada variante tiene su propio: SKU, stock, cost_price, price_override, supplier
- El `stock` se maneja a nivel de variante, no de producto

### Precios por Volumen (Tiers)
- `variant_price_tiers` usa solo `min_qty` (sin `max_qty`) para evitar gaps
- La query de resolución: `SELECT ... WHERE min_qty <= ? ORDER BY min_qty DESC LIMIT 1`
- Si no hay tier aplicable → se usa `price_override ?? base_price` del producto
- `tenant_margin_pct` define la comisión de la plataforma por tier

### Congelación en Orden (Order Items)
- `order_items` **NUNCA** lee precios actuales — congela al momento de la compra:
  - `product_name`, `sku`, `unit_price`, `cost_price`, `margin_pct`, `margin_amount`
- Esto garantiza que los reportes financieros históricos NO se rompan al cambiar precios

### Concurrencia de Stock
```sql
-- Única forma válida de descontar stock:
UPDATE product_variants
SET stock = stock - ?
WHERE id = ? AND stock >= ?;
-- Si affectedRows = 0 → rechazar la venta
```

---

## 🧬 Product Variants (Variantes y Precios Escalonados)

### Modelo de Variantes
1. **Un producto puede tener N variantes** — cada variante es una combinación única de color/talla
2. **Stock independiente** — cada variante tiene su propio stock, stock_minimo y reserved_stock
3. **Variante default** — si un producto no tiene variantes explícitas, se crea una implícita que replica `base_price` y stock
4. **`products.stock` es calculado** — `SUM(product_variants.stock)` cuando el producto tiene variantes

### SKU y Barcode
5. **SKU único por tenant** — `UNIQUE(tenant_id, sku)` en `product_variants`. El SKU del producto base ya no se usa para stock
6. **Barcode opcional** — se migra del producto base a la variante correspondiente

### Precios Escalonados (Tiers)
7. **Solo `min_qty`** — los tiers se definen con `min_qty` únicamente (sin `max_qty`), evitando gaps entre rangos
8. **Resolución** — `SELECT ... WHERE min_qty <= ? ORDER BY min_qty DESC LIMIT 1`. Si qty=15 y hay tiers para 1, 6, 12 → devuelve el de 12
9. **Sin tier → precio base** — si no hay tier que cumpla, se usa `price_override` de la variante o `base_price` del producto
10. **Congelar al vender** — el `price`, `cost_price` y `margin_pct` se copian a `sale_items`/`order_items` en el momento de la venta. Nunca leer `variant_price_tiers` para calcular ventas históricas

### Control de Stock (Race Conditions)
11. **Descuento atómico** — `UPDATE product_variants SET stock = stock - ? WHERE id = ? AND stock >= ?`. Si `affectedRows === 0`, la venta se rechaza
12. **Reserved stock** — durante el checkout se bloquea stock en `reserved_stock` para evitar sobreventa. Si el checkout expira o se cancela, se libera
13. **Stock nunca negativo** — el UPDATE atómico lo garantiza (la condición `stock >= ?` previene sobreventa)

### Congelación en Ítems de Venta
14. **`sale_items` congela**: `variant_id`, `frozen_sku`, `frozen_cost`, `frozen_margin_pct`
15. **`order_items` congela**: mismo patrón
16. **`storefront_order_items` congela**: `variant_id`
17. **Razón**: si mañana cambias un precio en el tier, los reportes históricos no se rompen

### Multi-Proveedor
18. **`supplier_id` en variante** — cada variante puede tener un proveedor diferente (precio, costo)
19. **`supplier_products`** — tabla cruzada que permite a un producto tener N proveedores con diferentes SKUs y precios
20. **Proveedor preferido** — `is_preferred` marca el proveedor default para nuevas variantes

### Importación Masiva (CSV)
21. **Formato handle-based** — filas repetidas con el mismo `handle` se agrupan bajo el mismo producto
22. **Columnas requeridas**: `handle`, `product_name`, `variant_sku`, `variant_color`, `variant_size`, `variant_stock`, `variant_cost_price`
23. **Columnas opcionales**: `variant_price_override`, `variant_barcode`, `supplier_id`, `base_price`, `category`
24. **El importador**: agrupa por `handle` → crea/encuentra `products` → bulk insert en `product_variants`

---

## 📦 Inventario

### Stock — Productos sin Variantes (legacy)
- El stock **nunca baja de 0** — el sistema bloquea la operación si no hay suficiente
- Todo movimiento genera un `stock_movement` en el kardex
- Tipos: `entrada` | `salida` | `ajuste` | `merma` | `transferencia`
- Las ventas generan automáticamente movimientos de salida

### Stock — Productos con Variantes
- El stock vive en `product_variants.stock` — NO en `products.stock`
- **UPDATE atómico**: `UPDATE product_variants SET stock = stock - ? WHERE id = ? AND stock >= ?`
- Si `affected_rows = 0` → error "Stock insuficiente" (previene race conditions)
- `reserved_stock` bloquea unidades durante checkout (se libera o descuenta al confirmar)
- Cada movimiento de variante genera un registro en `inventory_movements`
- El stock del producto padre se calcula como `SUM(product_variants.stock)` cuando tiene variantes

### Precios Escalonados (Price Tiers)
- Los tiers usan SOLO `min_qty` — sin `max_qty`, sin gaps entre rangos
- Resolución: `SELECT ... WHERE min_qty <= ? ORDER BY min_qty DESC LIMIT 1`
- Fallback si no hay tier: `variant.price_override ?? product.base_price`
- El `margin_pct` del tier define la comisión de la plataforma en ese escalón
- Los precios y márgenes se **CONGELAN** en `sale_items` al momento de la venta

### Congelación en Órdenes (Regla de Oro)
- `sale_items` / `order_items` / `storefront_order_items` deben congelar al vender:
  - `variant_id`, `frozen_sku`, `unit_price`, `frozen_cost`, `frozen_margin_pct`
- **NUNCA** leer `variant_price_tiers` para calcular ventas históricas
- Si cambia un precio en tiers mañana, los reportes de ayer NO se ven afectados

### Importación CSV de Proveedor
- Formato normalizado: fila repetida por variante, agrupado por Handle
- Columnas: Handle, Product Name, Attribute:Color, Attribute:Size, Variant SKU, Variant Stock, Base Price, Cost Price
- El backend agrupa por Handle → crea/actualiza producto → bulk insert de variantes

### Merma
- Descuenta del stock igual que una salida
- Requiere justificación/razón para auditoría
- Genera alerta si supera el umbral configurado

### Recetas (BOM)
- Al producir una receta → descuenta ingredientes del inventario automáticamente
- `food_cost = Σ(costo_ingrediente × cantidad)`
- El costo de un producto con receta se calcula en tiempo real

### Niveles PAR
- PAR = stock mínimo deseado por período
- Si `stock_actual < PAR` → alerta de reorden
- El sistema puede sugerir órdenes de compra automáticamente

---

## 💰 Ventas y POS

### POS
- Mínimo: 1 ítem + método de pago para registrar una venta
- Descuentos: por ítem (%) o globales (% o $)
- Solo se puede cancelar una venta si la caja está abierta
- La cancelación requiere razón y queda auditada

### Fiados / Crédito
- El crédito **requiere cliente registrado**
- Se verifica cupo disponible antes de aprobar
- Pagos parciales están permitidos
- Las ventas fiadas **NO descuentan caja** hasta que se cobren

### Caja
- Solo una sesión de caja activa por sede al mismo tiempo
- El cajero debe abrir caja antes de registrar ventas
- El cierre incluye: conteo físico + diferencia + observaciones
- El historial de caja es **inmutable** — no se puede editar

---

## 📋 Pedidos y Delivery

### Estados del Pedido
```
pendiente → aceptado → en_preparacion → listo → despachado → entregado
                                                    ↓
                                                 cancelado (solo antes de despachar)
```

### Delivery
- Pedidos de delivery requieren dirección del cliente
- Solo se asignan conductores con estado `disponible`
- El conductor actualiza el estado desde su panel
- Coordenadas de tracking se envían por Socket.io

---

## 🔐 Auth y Roles

### Jerarquía
```
superadmin > admin > cajero/vendedor/mesero/cocinero/bartender > driver/dispatcher > cliente
```

### Permisos por Rol
| Rol | Puede hacer |
|---|---|
| `cajero` | Ventas, caja, ver productos — NO: usuarios, finanzas globales |
| `cocinero` / `bartender` | Solo ver y actualizar estado de pedidos en su área |
| `mesero` | Crear pedidos, ver mesas — NO: caja |
| `vendedor` | Crear ventas, ver su historial — NO: finanzas globales |
| `driver` | Solo sus entregas asignadas |
| `dispatcher` | Asignar conductores, ver pedidos de delivery |
| `admin` | Todo excepto gestión de tenants |
| `superadmin` | Acceso total a toda la plataforma |

---

## 💳 Finanzas

- **Ingresos** = ventas cobradas + cobros de crédito + otros ingresos
- **Egresos** = compras + gastos operativos + nómina
- El flujo de caja NO incluye ventas fiadas hasta que se cobren
- Las devoluciones generan nota crédito — **no** se modifica la venta original

---

## 🌐 Storefront (Tienda Pública)

- El slug de la tienda es único globalmente
- Los precios de la tienda pueden diferir de los del POS
- Pedidos online llegan al panel de pedidos del admin
- Si no hay stock → el producto no se muestra en la tienda
- Tipos de pedido online: con delivery o para recoger

---

## 📊 Suscripciones SaaS

- Tenant sin suscripción activa → plan free (acceso limitado)
- Al vencer → tenant en modo "lectura" por 7 días
- Stripe maneja cobro automático (webhooks actualizan DB)
- El superadmin puede extender manualmente

---

## 🗂️ Categorías

- `PATCH /categories/:id/visibility` hace **toggle de `is_active`** — NO es soft delete, la categoría sigue existiendo
- **Eliminar** una categoría falla si tiene productos activos (`products.is_active = 1`)
- `color` es hex (`#6366f1`). Si no se envía, el backend usa `#6366f1` como default
- `sort_order` define el orden en listas. `0` = sin orden especial

---

## ⏱️ Auto-timestamp (RestBar Finanzas)

- `rb_gastos.registered_at` lo asigna **el servidor** al momento del INSERT
- Nunca confiar en la fecha del cliente para estos registros — el servidor es la fuente de verdad
- `rb_ingresos_diarios` tiene **upsert** por `(tenant_id, fecha)` — no puede haber 2 registros del mismo día

---

## 📶 Offline-First (Sync)

- `sales.synced = 0` y `purchase_invoices.synced = 0` → pendiente de subir a la nube
- `sales.origin = 'local'` o `'cloud'` → indica origen del registro
- El módulo `sync` sube los registros locales y los marca `synced = 1`
- Nunca modificar directamente los campos `synced` desde el frontend — solo el módulo `sync` los toca

---

---

## 🧩 Variantes de Producto

### Stock
- El stock **vive en `product_variants`**, no en `products` — `products.stock` queda como legacy
- El descuento de stock usa `UPDATE product_variants SET stock = stock - ? WHERE id = ? AND stock >= ?` — atómico y race-condition-safe
- Todo movimiento de variante genera un `stock_movements` con `variant_id`
- Las ventas descuentan de `product_variants.stock`, no de `products.stock`
- Si una variante tiene `stock = 0`, no se muestra en storefront (a menos que sea preorder)

### Precios escalonados (Tiers)
- Solo `min_qty` — **nunca usar `max_qty`** para evitar gaps entre rangos
- El tier aplicable es el de `min_qty` más alto que sea `<= cantidad` pedida
- Si no hay tier aplicable → fallback a `price_override` de la variante, o `products.price`
- Los tiers se ordenan por `min_qty DESC` para la query de resolución

### Costos y márgenes
- `cost_price` en la variante = lo que cobra el proveedor (fuente de verdad)
- El margen real de Lopbuk = `price - cost_price`, no un porcentaje arbitrario
- `tenant_margin_pct` en el tier es la comisión que Lopbuk retiene al proveedor

### Congelación en ventas
- `sale_items` congela: `variant_id`, `unit_price`, `cost_price`, `margin_pct`, `margin_amount`
- **Nunca leer `variant_price_tiers` para reportes de ventas antiguas** — usar los valores congelados en `sale_items`
- Si cambia el precio de un tier mañana, las ventas de ayer no se ven afectadas

### Multi-tenant
- `tenant_id` en `product_variants` y `variant_price_tiers` (duplicado para queries directas)
- Siempre filtrar por `tenant_id` en toda query de variantes

---

## 📐 Convenciones de Código

| Regla | Descripción |
|---|---|
| Lógica en Service | Nunca en Controller ni Routes |
| `tenant_id` siempre | Filtrar por tenant en toda query |
| Soft delete | `is_active = 0`, nunca DELETE físico en datos de negocio |
| IDs como UUID | `v4()`, no auto-increment en tablas de negocio |
| Fechas | UTC en DB, timezone del tenant en frontend |
| Errores | `new AppError('mensaje', httpCode)` en services |
| Datos sensibles | Encriptar con `encryptNullable` antes de guardar |

---

### Storefront
- El producto se muestra en tienda si al menos 1 variante tiene `stock > 0`.
- Chips de color seleccionables con indicador visual de disponibilidad.
- Al cambiar cantidad → recalcular precio vía `POST /api/variants/:id/resolve-price`.
- Badge automático: "Precio mejora a partir de N unidades" cuando hay tiers configurados.

### Panel Proveedor
- El proveedor ve solo SUS productos activos y stock por variante.
- El admin de Lopbuk configura márgenes por tier.

### Supplier Products (multi-proveedor)
- Tabla `supplier_products`: relaciona productos con proveedores en esquema N:N.
- `supplier_id` opcional en `product_variants` para asignar proveedor directo.
- `is_preferred` marca el proveedor default.

---

← [[api-routes]] | [[DAIMUZ]] | → [[glossary]]
