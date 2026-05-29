# 📛 Nomenclatura del Proyecto

## Archivos

| Tipo | Patrón | Ejemplo |
|---|---|---|
| Backend service | `[módulo].service.ts` | `inventory.service.ts` |
| Backend controller | `[módulo].controller.ts` | `sales.controller.ts` |
| Backend routes | `[módulo].routes.ts` | `orders.routes.ts` |
| Frontend componente (módulo) | `[función].tsx` | `point-of-sale.tsx` |
| Frontend componente (UI) | `[elemento].tsx` | `button.tsx` |
| Frontend store | `[área]-store.ts` | `auth-store.ts` |

## Endpoints API

```
/api/[módulo]              → CRUD principal
/api/[módulo]/:id          → item específico
/api/[módulo]/:id/[acción] → acción específica

Ejemplos:
GET  /api/products
POST /api/sales
PATCH /api/orders/:id/status
POST /api/cash-sessions/close
```

## Base de Datos

| Tipo | Convención | Ejemplo |
|---|---|---|
| Tablas | snake_case plural | `stock_movements`, `sale_items` |
| PK | `id` VARCHAR(36) UUID | `id` |
| FK | `[tabla_singular]_id` | `product_id`, `tenant_id` |
| Timestamps | `created_at`, `updated_at` | — |
| Booleanos | `is_[estado]` | `is_active`, `is_completed` |
| Soft delete | `is_active` 0/1 | — |

## Roles del Sistema

```typescript
type UserRole =
  | 'superadmin'   // dueño de la plataforma SaaS
  | 'admin'        // dueño del negocio
  | 'cajero'       // caja y POS
  | 'cocinero'     // cocina
  | 'bartender'    // barra
  | 'mesero'       // salón/mesas
  | 'vendedor'     // ventas externas
  | 'driver'       // conductor de delivery
  | 'dispatcher'   // despachador
  | 'cliente'      // cliente final
```

## Estados de Pedido

```
pendiente → aceptado → en_preparacion → listo → despachado → entregado
                                                           ↘ cancelado
```

## Tipos de Movimiento de Inventario

```
entrada    → ingreso de stock (compra, ajuste positivo)
salida     → consumo (venta, receta)
ajuste     → corrección manual
merma      → pérdida/desperdicio registrado
transferencia → entre sedes
```

## Variables de Entorno

```bash
# Backend
DB_*           → base de datos
JWT_*          → autenticación
GOOGLE_*       → OAuth
STRIPE_*       → pagos
WHATSAPP_*     → mensajería
CLOUDINARY_*   → imágenes
PORT           → puerto del servidor

# Frontend
NEXT_PUBLIC_API_URL    → URL del backend
NEXT_PUBLIC_*          → cualquier var pública
```

---

← [[ai-behavior]] | [[DAIMUZ]]
