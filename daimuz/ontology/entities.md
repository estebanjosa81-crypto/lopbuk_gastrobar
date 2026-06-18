# 🧠 Ontología — Entidades del Sistema

> Qué ES cada entidad semánticamente. No cómo funciona — qué significa.

---

## `Tenant`

Un **negocio registrado** en la plataforma Lopbuk.  
Es el dueño de todos sus datos. Todo dato tiene exactamente 1 tenant.  
Tiene un `plan` que determina qué módulos puede usar.  
Puede tener múltiples `sedes` y múltiples `users`.

```
Tenant ──tiene──> users (con roles)
       ──tiene──> sedes
       ──activa──> módulos (según plan)
       ──paga──> subscriptions (Stripe)
```

---

## `User`

Una **persona con credenciales** que pertenece a exactamente 1 tenant.  
Su `role` determina qué puede ver y hacer en el sistema.  
El `tenantId` del JWT es la única fuente de verdad de su tenant.

```
Roles (enum exacto en DB):
  superadmin          → dueño de la plataforma SaaS
  comerciante         → dueño del negocio (máximo control dentro del tenant)
  administrador_rb    → admin del gastrobar (acceso a finanzas RB)
  cajero              → caja y POS
  cocinero            → cocina
  bartender           → barra
  mesero              → salón/mesas
  vendedor            → ventas externas
  repartidor          → conductor de delivery
  despachador         → despacho y asignación de rutas
  auxiliar_bodega     → inventario y bodega
  asesor_inmobiliario → módulo inmobiliaria
  gerente_inmobiliario→ módulo inmobiliaria (nivel admin)
  cliente             → cliente final (sin acceso al panel)
```

> ⚠️ El rol en el código es `comerciante`, NO `admin`. Confundirlos rompe `authorize()`.

---

## `Cash Session`

Un **turno de caja** con monto inicial declarado.  
Es el contenedor de todas las ventas de efectivo de ese turno.  
Existe exactamente 1 sesión activa por sede en un momento dado.  
Al cerrarse, es INMUTABLE — nunca se edita ni elimina.

---

## `Sale`

Una **transacción de compra** completada en el POS.  
Está ligada a 1 cash_session, 1 o más sale_items, y opcionalmente 1 customer.  
Una vez registrada, solo se puede `cancelar` (con razón) — nunca editar.

```
Sale genera automáticamente:
  - stock_movements de tipo 'venta' (por variante si aplica)
  - historial en customers si hay cliente
  - registro en finances (fire-and-forget)
  - Los precios en sale_items están CONGELADOS (no se leen del catálogo después)
```

---

## `Order`

Un **pedido en progreso** que aún no se ha cobrado.  
Puede venir de una mesa (restbar) o de delivery (storefront/externo).  
Cuando se cierra una mesa → la order se convierte en Sale.

---

## `RbOrder` (Comanda)

Una **comanda de mesa** del módulo RestBar.  
⚠️ DISTINTA de `Order` — tabla diferente (`rb_orders`).

---

## `Product`

Un **artículo vendible** del negocio.  
Es el contenedor lógico que agrupa una o más variantes.  
Ya no tiene stock directo — el stock vive en sus variantes.  
Nunca se elimina físicamente — `is_active = 0` (soft delete).

```
Product tiene:
  - price  → precio base (usado como fallback si la variante no tiene price_override)
  - cost   → costo legacy (el costo real está en product_variants.cost_price)
  - stock  → ⚠️ campo legacy, no se actualiza automáticamente
```

---

## `ProductVariant`

Una **combinación específica** de atributos (color, talla) de un producto.  
Es la unidad real de inventario — tiene su propio stock, SKU, costo de proveedor y precio opcional.

```
ProductVariant:
  - product_id  → FK al producto padre
  - sku         → único dentro del tenant
  - color, size → atributos de la variante
  - stock       → stock actual (NUNCA < 0)
  - reserved_stock → stock reservado en checkouts activos
  - stock_minimo   → umbral para alertas de reorden
  - cost_price     → precio del proveedor (margen real)
  - price_override → si esta variante cuesta diferente al producto base
  - supplier_id    → FK al proveedor de esta variante
```

```
Relación:
  Product 1──N ProductVariant 1──N PriceTier
```

---

## `PriceTier`

Un **precio escalonado** por cantidad para una variante específica.  
Define cuánto paga el cliente y qué margen retiene la plataforma cuando se compra desde N unidades.

```
PriceTier:
  - variant_id       → FK a la variante
  - min_qty          → cantidad mínima para aplicar este tier (sin max_qty)
  - price            → precio final para el cliente en este tier
  - tenant_margin_pct → comisión de Lopbuk (se descuenta antes de pagar al proveedor)

Regla: Se aplica el tier con min_qty más alto que sea <= cantidad comprada.
       Si no hay tier aplicable → se usa price_override o products.price.
```

---

## `Supplier`

Un **proveedor registrado** que puede tener productos asociados.  
A través de `supplier_products` se relaciona N:N con `products`.  
Cada `product_variant` puede tener opcionalmente un `supplier_id`.

```
Supplier:
  - name, contact_info, payment_terms
  - supplier_products → { product_id, cost_price, lead_time_days }
  - Liquidación: (price - (price × margin_pct / 100)) × qty
```

---

## `SupplierProduct`

La **relación entre un producto y un proveedor** en un esquema multi-proveedor.  
Un producto puede tener múltiples proveedores, pero solo 1 preferido.

---

## `InventoryMovement` (kardex universal)

La **fuente de verdad del stock** para productos con variantes.  
Cada cambio de stock es 1 movimiento. Nunca se borra.  
Reemplazará `StockMovement` legacy gradualmente.

```
InventoryMovement:
  - tenant_id       → multi-tenant directo
  - variant_id      → FK a la variante (NULL para productos legacy)
  - product_id      → siempre presente (compatibilidad)
  - type            → 'entrada' | 'salida' | 'ajuste' | 'merma'
                       | 'transferencia' | 'reserva' | 'liberacion'
  - quantity        → siempre positivo. type determina dirección
  - reason          → obligatorio para auditoría
  - cost            → costo unitario en el momento
  - reference_type  → 'sale' | 'purchase' | 'adjustment' | 'transfer'
  - reference_id    → ID del registro origen (trazabilidad completa)
```

---

## `StockMovement` (legacy)

El **registro atómico del kardex** original para productos sin variantes.  
Se mantiene para backward compatibility. Eventualmente migrar a `InventoryMovement`.

```
StockMovement:
  - product_id  → siempre presente
  - variant_id  → NULL (legacy, productos sin variantes)
  - type: entrada | salida | ajuste | merma | venta | transferencia
  - reason → obligatorio para auditoría
```

---

## `Recipe` (Receta BOM)

Una **fórmula de producción** que describe qué ingredientes (products) y en qué cantidades se necesitan para producir 1 unidad del plato.  
Permite calcular automáticamente el food cost en tiempo real.

```
food_cost = Σ(product.cost × ingredient.quantity)
food_cost_pct = (food_cost / recipe.price) × 100
```

---

## `Par Level`

El **stock mínimo deseado** de un producto para operar sin interrupciones.  
Si `stock_actual < par_level` → aparece en sugerencias de compra del gastrobar.

---

**Módulos de estas entidades:**
[[modules/auth/compressed]] (User, Tenant) · [[modules/tenants/compressed]] (Tenant) · [[modules/sales/compressed]] (Sale) · [[modules/cash-sessions/compressed]] (CashSession) · [[modules/restbar/compressed]] (RbOrder) · [[modules/inventory/compressed]] (InventoryMovement, StockMovement) · [[modules/variants/compressed]] (ProductVariant, VariantPriceTier) · [[modules/products/products]] (Product) · [[modules/recipes/compressed]] (Recipe) · [[modules/merma/compressed]] (ParLevel) · [[modules/users/compressed]] (User roles) · [[modules/suppliers/suppliers]] (Supplier, SupplierProduct)

← [[DAIMUZ]]
