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

```
Una sesión:
  - Abre con initialAmount
  - Acumula ventas en efectivo (calculado)
  - Cierra con countedAmount (conteo físico)
  - diferencia = countedAmount - calculado
  - Queda congelada para auditoría
```

---

## `Sale`

Una **transacción de compra** completada en el POS.  
Es el registro financiero de que el negocio recibió dinero.  
Está ligada a 1 cash_session, 1 o más sale_items, y opcionalmente 1 customer.  
Una vez registrada, solo se puede `cancelar` (con razón) — nunca editar.

```
Sale:
  - total = sum(item.price × item.qty - item.discount)
  - método de pago (efectivo suma al cash_session calculado)
  - genera stock_movements de tipo 'salida' automáticamente
  - genera historial en customers si hay cliente
```

---

## `Order`

Un **pedido en progreso** que aún no se ha cobrado.  
Puede venir de una mesa (restbar) o de delivery (storefront/externo).  
Sigue el flujo de estados hacia su resolución.  
Cuando se cierra una mesa → la order se convierte en Sale.

```
Order vs Sale:
  Order = "lo que pidieron" (en preparación)
  Sale  = "lo que se cobró" (transacción finalizada)
```

---

## `RbOrder` (Comanda)

Una **comanda de mesa** del módulo RestBar.  
⚠️ DISTINTA de `Order` — tabla diferente (`rb_orders`), flujo diferente.

```
Diferencia clave:
  Order     → tabla `orders`    → delivery + mesa (legacy)
  RbOrder   → tabla `rb_orders` → solo mesas del gastrobar

RbOrder flujo:
  abierta → en_proceso → lista → entregada → cerrada
                                               ↓
                                          genera Sale (POST /api/sales)
```

Tiene `rb_order_items` con estado individual por ítem (pendiente → en_preparacion → listo → entregado).

---

## `Product`

Un **artículo vendible** del negocio con precio, stock y costo.  
El `stock` se actualiza automáticamente en cada movimiento.  
El `cost` se usa para calcular food cost en recetas.  
Nunca se elimina físicamente — `is_active = 0` (soft delete).

```
Product tiene:
  - price  → precio de venta al cliente
  - cost   → costo de compra (para calcular margen/food cost)
  - stock  → cantidad actual (NUNCA < 0)
  - stock_minimo → umbral para alertas de reorden
```

---

## `Recipe` (Receta BOM)

Una **fórmula de producción** que describe qué ingredientes (products) y en qué cantidades se necesitan para producir 1 unidad del plato.  
Permite calcular automáticamente el food cost en tiempo real.

```
Recipe:
  ingredients: [{ productId, quantity, unit }]
  
food_cost = Σ(product.cost × ingredient.quantity)
food_cost_pct = (food_cost / recipe.price) × 100
```

---

## `Stock Movement`

Un **registro atómico del kardex**. Cada cambio de stock es 1 movimiento.  
Nunca se borra. Es la fuente de verdad para trazabilidad.  
El stock actual de un producto = suma de todos sus movimientos.

---

## `Par Level`

El **stock mínimo deseado** de un producto para operar sin interrupciones.  
`stock_gap = par_level - stock_actual`  
Si `stock_actual < par_level` → aparece en sugerencias de compra del gastrobar.

---

**Módulos de estas entidades:**
[[modules/auth/compressed]] (User, Tenant) · [[modules/tenants/compressed]] (Tenant) · [[modules/sales/compressed]] (Sale) · [[modules/cash-sessions/compressed]] (CashSession) · [[modules/orders/compressed]] (Order) · [[modules/gastrobar-ops/compressed]] (RbOrder) · [[modules/inventory/compressed]] (StockMovement) · [[modules/recipes/compressed]] (Recipe) · [[modules/merma/compressed]] (ParLevel) · [[modules/users/compressed]] (User roles)

← [[DAIMUZ]]
