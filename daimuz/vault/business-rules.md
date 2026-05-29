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

## 📦 Inventario

### Stock
- El stock **nunca baja de 0** — el sistema bloquea la operación si no hay suficiente
- Todo movimiento genera un `stock_movement` en el kardex
- Tipos: `entrada` | `salida` | `ajuste` | `merma` | `transferencia`
- Las ventas generan automáticamente movimientos de salida

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

← [[api-routes]] | [[DAIMUZ]] | → [[glossary]]
