# 🗄️ DB Tables Index — Lopbuk

> MySQL · Multi-tenant · Todo tiene `tenant_id` · Soft delete: `is_active = 0`  
> PK: `id` VARCHAR(36) UUID · Timestamps: `created_at`, `updated_at`

## Tablas de Negocio

| Tabla | Módulo | Descripción |
|---|---|---|
| `users` | auth | Usuarios con rol y tenant |
| `tenants` | tenants | Negocios registrados en la plataforma |
| `tenant_modules` | tenants | Módulos activados por tenant |
| `sedes` | sedes | Sucursales del tenant |
| `products` | inventory | Productos con stock, precio, costo |
| `categories` | products | Categorías de productos |
| `stock_movements` | inventory | Kardex: cada movimiento de stock |
| `sales` | sales | Cabecera de ventas |
| `sale_items` | sales | Ítems de cada venta |
| `cash_sessions` | cash-sessions | Sesiones de caja (apertura/cierre) |
| `cash_movements` | cash-sessions | Movimientos durante la sesión |
| `orders` | orders | Pedidos (mesa + delivery) |
| `order_items` | orders | Ítems de cada pedido |
| `customers` | customers | CRM de clientes |
| `credits` | credits | Fiados/créditos |
| `credit_payments` | credits | Pagos de créditos |
| `purchases` | purchases | Órdenes de compra |
| `purchase_items` | purchases | Ítems de compra |
| `recipes` | recipes | Recetas con nombre y precio |
| `recipe_ingredients` | recipes | Ingredientes de cada receta (BOM) |
| `waste_records` | merma | Registros de merma |
| `par_levels` | merma | Niveles PAR por producto |
| `tables` | restbar | Mesas del local |
| `restbar_orders` | restbar | Comandas en mesa |
| `restbar_order_items` | restbar | Ítems de cada comanda |
| `reservations` | restbar | Reservas de mesas |
| `rb_gastos` | restbar-finanzas | Gastos variables del gastrobar (auto-timestamp) |
| `rb_ingresos_diarios` | restbar-finanzas | Ingresos diarios (upsert por tenant+fecha) |
| `rb_gastos_fijos` | restbar-finanzas | Gastos fijos recurrentes (quincenal/semanal/mensual) |
| `deliveries` | delivery | Asignaciones de delivery |
| `fleet_vehicles` | delivery | Vehículos de la flota |
| `drivers` | delivery | Conductores |
| `storefront_orders` | storefront | Pedidos desde tienda online |
| `storefront_order_items` | storefront | Ítems de pedidos online |
| `finances` | finances | Movimientos del flujo de caja |
| `subscriptions` | subscriptions | Suscripciones SaaS de tenants |
| `subscription_plans` | subscriptions | Planes disponibles |
| `chatbot_config` | agent | Configuración del agente IA por tenant |
| `chatbot_conversations` | agent | Sesiones de conversación |
| `chatbot_messages` | agent | Mensajes del historial del agente |
| `media_library` | media | Imágenes en Cloudinary |

## Columnas Adicionales en `categories` (desde v3.8)

```sql
categories (
  ...
  is_active   TINYINT(1)  DEFAULT 1      -- ocultar/mostrar en POS (PATCH /:id/visibility)
  color       VARCHAR(7)  NULL           -- hex UI: '#6366f1'
  sort_order  INT         DEFAULT 0      -- orden ascendente en listas
)
```

## Columnas Universales

```sql
-- En TODAS las tablas de negocio
tenant_id   VARCHAR(36)  NOT NULL  -- dueño del dato, NUNCA confiar en body
id          VARCHAR(36)  NOT NULL  -- UUID v4
created_at  TIMESTAMP    DEFAULT CURRENT_TIMESTAMP
updated_at  TIMESTAMP    ON UPDATE CURRENT_TIMESTAMP
is_active   TINYINT(1)   DEFAULT 1 -- soft delete

-- En tablas con usuario creador
created_by  VARCHAR(36)  -- FK → users.id
```

## Columnas Críticas de products

```sql
products (
  id, tenant_id,
  name, sku, barcode,
  price,          -- precio de venta
  cost,           -- costo de compra (para food cost)
  stock,          -- stock actual (actualizado automáticamente)
  stock_minimo,   -- para alertas de reorden
  weight_kg,      -- para ferretería
  is_active
)
```

## Columnas Críticas de stock_movements

```sql
stock_movements (
  id, tenant_id,
  product_id,     -- FK → products.id
  sede_id,
  type,           -- entrada | salida | ajuste | merma | transferencia
  quantity,       -- número de unidades
  reason,         -- texto obligatorio (auditoría)
  cost,           -- costo unitario del movimiento
  created_by,
  created_at
)
```

---

← [[indexes/endpoints-index]] | [[DAIMUZ]] | → [[indexes/files-index]]
