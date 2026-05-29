# 🛣️ API Routes — Lopbuk

> **Fuente de verdad DETALLADA** — con descripciones y notas por endpoint.  
> Para versión ultra-compacta (solo rutas) → usa `[[indexes/endpoints-index]]`  
> Actualizar ambos cuando agregues endpoints nuevos.

> **Base URL:** `http://localhost:3001/api`  
> **Auth:** `Authorization: Bearer <JWT>` en headers (o httpOnly cookie)  
> **Convención:** `GET` lista/obtiene · `POST` crea · `PUT/PATCH` actualiza · `DELETE` elimina  
> **Respuesta exitosa:** `{ success: true, data: {...} }`  
> **Error:** `{ success: false, error: "mensaje" }`

---

## 🔐 Auth (`/api/auth`)
```
POST   /api/auth/login              → Login local (email + password)
POST   /api/auth/google             → Login con Google OAuth
POST   /api/auth/logout             → Logout (limpia cookie)
GET    /api/auth/me                 → Usuario actual autenticado
```

## 👥 Usuarios (`/api/users`)
```
GET    /api/users                   → Lista usuarios del tenant
GET    /api/users/:id               → Obtiene usuario por ID
POST   /api/users                   → Crea usuario
PUT    /api/users/:id               → Actualiza usuario
DELETE /api/users/:id               → Desactiva usuario
PUT    /api/users/:id/role          → Cambia rol
```

## 🏢 Tenants (`/api/tenants`)
```
GET    /api/tenants                 → Lista tenants (superadmin)
GET    /api/tenants/:id             → Obtiene tenant
POST   /api/tenants                 → Crea tenant
PUT    /api/tenants/:id             → Actualiza config del tenant
GET    /api/tenants/:id/modules     → Módulos activos del tenant
PUT    /api/tenants/:id/modules     → Actualiza módulos activos
```

## 📦 Productos (`/api/products`)
```
GET    /api/products                → Lista productos del tenant
GET    /api/products/:id            → Obtiene producto
POST   /api/products                → Crea producto
PUT    /api/products/:id            → Actualiza producto
DELETE /api/products/:id            → Elimina producto (soft)
POST   /api/products/bulk           → Importación masiva
GET    /api/products/export         → Exportar CSV
```

## 🗂️ Categorías (`/api/categories`)
```
GET    /api/categories              → Lista categorías (?includeHidden=true para ver ocultas)
POST   /api/categories              → Crea categoría { id, name, description?, color? }
PUT    /api/categories/:id          → Actualiza { name?, description?, color?, sortOrder? }
PATCH  /api/categories/:id/visibility → Toggle is_active (ocultar/mostrar)
DELETE /api/categories/:id          → Elimina (falla si tiene productos activos)
```

## 📊 Inventario (`/api/inventory`)
```
GET    /api/inventory               → Movimientos de stock (kardex)
POST   /api/inventory/movement      → Registra movimiento (entrada/salida/ajuste)
GET    /api/inventory/stock         → Stock actual por producto
GET    /api/inventory/alerts        → Alertas de stock mínimo
```

## 💰 Ventas (`/api/sales`)
```
GET    /api/sales                   → Lista ventas (con filtros de fecha)
GET    /api/sales/:id               → Obtiene venta con items
POST   /api/sales                   → Registra venta
PATCH  /api/sales/:id/cancel        → Cancela venta (con razón)
GET    /api/sales/summary           → Resumen/totales del período
GET    /api/sales/export            → Exportar ventas
```

## 📋 Pedidos (`/api/orders`)
```
GET    /api/orders                  → Lista pedidos
GET    /api/orders/:id              → Obtiene pedido
POST   /api/orders                  → Crea pedido
PATCH  /api/orders/:id/status       → Actualiza estado del pedido
DELETE /api/orders/:id              → Cancela pedido
```

## 🏧 Sesiones de Caja (`/api/cash-sessions`)
```
GET    /api/cash-sessions           → Lista sesiones
GET    /api/cash-sessions/active    → Sesión activa actual
POST   /api/cash-sessions/open      → Abre sesión de caja
POST   /api/cash-sessions/close     → Cierra sesión con arqueo
GET    /api/cash-sessions/:id       → Obtiene sesión con movimientos
```

## 👤 Clientes (`/api/customers`)
```
GET    /api/customers               → Lista clientes
GET    /api/customers/:id           → Obtiene cliente con historial
POST   /api/customers               → Crea cliente
PUT    /api/customers/:id           → Actualiza cliente
DELETE /api/customers/:id           → Elimina cliente
POST   /api/customers/bulk          → Importación masiva
```

## 🏦 Créditos / Fiados (`/api/credits`)
```
GET    /api/credits                 → Lista créditos pendientes
GET    /api/credits/:id             → Obtiene crédito con pagos
POST   /api/credits                 → Crea crédito/fiado
POST   /api/credits/:id/payment     → Registra pago
```

## 🛒 Compras (`/api/purchases`)
```
GET    /api/purchases               → Lista compras
GET    /api/purchases/:id           → Obtiene compra con items
POST   /api/purchases               → Crea orden de compra
PUT    /api/purchases/:id           → Actualiza compra
DELETE /api/purchases/:id           → Cancela compra
```

## 📖 Recetas (`/api/recipes`)
```
GET    /api/recipes                 → Lista recetas
GET    /api/recipes/:id             → Obtiene receta con ingredientes
POST   /api/recipes                 → Crea receta
PUT    /api/recipes/:id             → Actualiza receta
DELETE /api/recipes/:id             → Elimina receta
GET    /api/recipes/:id/cost        → Calcula food cost
```

## 🗑️ Merma (`/api/merma`)
```
GET    /api/merma                   → Lista registros de merma
POST   /api/merma                   → Registra merma
GET    /api/merma/report            → Reporte de merma por período
```

## 📈 Dashboard (`/api/dashboard`)
```
GET    /api/dashboard/stats         → KPIs principales
GET    /api/dashboard/sales-chart   → Datos para gráficas de ventas
GET    /api/dashboard/top-products  → Productos más vendidos
GET    /api/dashboard/recent        → Actividad reciente
GET    /api/dashboard/inventory     → Alertas de inventario
```

## 💳 Finanzas (`/api/finances`)
```
GET    /api/finances                → Lista movimientos financieros
POST   /api/finances                → Registra movimiento
GET    /api/finances/balance        → Balance actual
GET    /api/finances/report         → Reporte P&L
```

## 🍽️ RestBar (`/api/restbar`)
```
GET    /api/restbar/tables                        → Lista mesas
POST   /api/restbar/tables                        → Crea mesa
PUT    /api/restbar/tables/:id                    → Actualiza mesa
GET    /api/restbar/orders                        → Comandas activas
POST   /api/restbar/orders                        → Crea comanda
PATCH  /api/restbar/orders/:id                    → Actualiza comanda
GET    /api/restbar/reservations                  → Lista reservas
POST   /api/restbar/reservations                  → Crea reserva
PATCH  /api/restbar/reservations/:id/status       → Confirma/cancela reserva
```

## 💰 RestBar Finanzas (`/api/restbar/finanzas`) — solo admin
```
GET    /api/restbar/finanzas/timeline?month=      → Feed cronológico del mes
GET    /api/restbar/finanzas/gastos?from=&to=     → Lista gastos variables
POST   /api/restbar/finanzas/gastos               → Registra gasto (auto-timestamp)
PUT    /api/restbar/finanzas/gastos/:id           → Edita gasto
DELETE /api/restbar/finanzas/gastos/:id           → Elimina gasto
GET    /api/restbar/finanzas/ingresos?month=      → Ingresos diarios del mes
POST   /api/restbar/finanzas/ingresos             → Upsert ingreso diario
DELETE /api/restbar/finanzas/ingresos/:id         → Elimina ingreso
GET    /api/restbar/finanzas/gastos-fijos         → Lista gastos fijos
POST   /api/restbar/finanzas/gastos-fijos         → Crea gasto fijo
PUT    /api/restbar/finanzas/gastos-fijos/:id     → Edita gasto fijo
DELETE /api/restbar/finanzas/gastos-fijos/:id     → Elimina gasto fijo
GET    /api/restbar/finanzas/resumen?month=       → P&L quincenal (Q1/Q2/global)
```

## 🍳 Gastrobar Ops (`/api/gastrobar-ops`)
```
GET    /api/gastrobar-ops/modo-dueno              → Snapshot ejecutivo diario
GET    /api/gastrobar-ops/food-cost               → Food cost % por receta
GET    /api/gastrobar-ops/purchase-suggestions    → Sugerencias reorden por PAR
GET    /api/gastrobar-ops/weekly-trend            → Tendencia 14 días
GET    /api/merma/par/levels                      → Niveles PAR con stock_gap
POST   /api/merma/par/levels                      → Upsert nivel PAR
DELETE /api/merma/par/levels/:id                  → Elimina nivel PAR
```

## 🚚 Delivery (`/api/delivery`)
```
GET    /api/delivery/orders         → Pedidos de delivery
POST   /api/delivery/assign         → Asigna conductor a pedido
PATCH  /api/delivery/:id/status     → Actualiza estado (en camino, entregado)
```

## 🚗 Flota (`/api/fleet`)
```
GET    /api/fleet/vehicles          → Lista vehículos
POST   /api/fleet/vehicles          → Agrega vehículo
GET    /api/fleet/drivers           → Lista conductores
GET    /api/fleet/tracking          → Posición actual (tiempo real)
```

## 🛍️ Storefront (`/api/storefront`)
```
GET    /api/storefront/:slug        → Obtiene tienda pública por slug
GET    /api/storefront/:slug/products → Productos de la tienda pública
POST   /api/storefront/:slug/order  → Crea pedido desde tienda pública
```

## 📱 Subscripciones (`/api/subscriptions`)
```
GET    /api/subscriptions/plans     → Lista planes disponibles
GET    /api/subscriptions/current   → Suscripción activa del tenant
POST   /api/subscriptions/checkout  → Inicia checkout Stripe
POST   /api/subscriptions/cancel    → Cancela suscripción
```

## 💳 Stripe (`/api/stripe`)
```
POST   /api/stripe/webhook          → Webhook de eventos Stripe
POST   /api/stripe/payment-intent   → Crea PaymentIntent
```

## 📲 WhatsApp (`/api/whatsapp`)
```
POST   /api/whatsapp/send           → Envía mensaje WhatsApp
GET    /api/whatsapp/messages       → Historial de mensajes
POST   /api/whatsapp/webhook        → Webhook para mensajes entrantes
```

## 🤖 Agente IA (`/api/agent`)
```
POST   /api/agent/chat              → Envía pregunta al agente IA
GET    /api/agent/history           → Historial de conversaciones
```

## 🖼️ Media Library (`/api/media-library`)
```
GET    /api/media-library           → Lista imágenes
POST   /api/media-library/upload    → Sube imagen a Cloudinary
DELETE /api/media-library/:id       → Elimina imagen
```

## 🏪 Sedes (`/api/sedes`)
```
GET    /api/sedes                   → Lista sucursales
POST   /api/sedes                   → Crea sucursal
PUT    /api/sedes/:id               → Actualiza sucursal
DELETE /api/sedes/:id               → Desactiva sucursal
```

---

## Códigos HTTP

| Código | Significado |
|---|---|
| 200 | OK |
| 201 | Creado |
| 400 | Bad Request (validación) |
| 401 | No autenticado |
| 403 | Sin permisos / módulo inactivo |
| 404 | No encontrado |
| 500 | Error del servidor |

---

← [[DAIMUZ]] | → [[business-rules]]
