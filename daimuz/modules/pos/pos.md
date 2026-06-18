# 🛒 Módulo: POS (Punto de Venta)

## Qué hace
El corazón operativo del sistema. Permite registrar ventas rápidamente: buscar productos, armar carrito, aplicar descuentos y cobrar con múltiples métodos de pago.

## Archivos del Módulo

**Frontend (principal):**
- `frontend/components/point-of-sale.tsx` — POS principal
- `frontend/components/billing-pos.tsx` — POS con facturación
- `frontend/components/cash-register.tsx` — apertura/cierre de caja
- `frontend/lib/store.ts` — `cart[]` y acciones del carrito

**Backend:**
- `backend/src/modules/sales/sales.routes.ts`
- `backend/src/modules/sales/sales.controller.ts`
- `backend/src/modules/sales/sales.service.ts`
- `backend/src/modules/cash-sessions/` — sesiones de caja

## Flujo de una Venta

```
1. Cajero abre sesión de caja (cash-sessions)
2. Busca productos por nombre, SKU o código de barras
3. Agrega ítems al carrito (store.addToCart)
4. Aplica descuentos opcionales (por ítem % o global %)
5. Selecciona método de pago (efectivo, tarjeta, transferencia, mixto)
6. POST /api/sales con items + paymentMethod + amountPaid
7. Backend:
   a. Valida stock disponible
   b. Descuenta inventario automáticamente
   c. Registra venta + sale_items en DB
   d. Si hay cliente: actualiza historial
   e. Si es fiado: crea registro en credits
8. Frontend limpia carrito + muestra comprobante
```

## Estado del Carrito (Zustand)

```typescript
cart: CartItem[]         // ítems en el carrito
addToCart(product, qty)  // agrega/incrementa
removeFromCart(id)       // elimina ítem
updateCartQuantity(id, qty)
applyItemDiscount(id, discount%)
setCustomAmount(id, amount)  // precio manual
clearCart()
```

## APIs

```
POST /api/sales           → registra venta completa
GET  /api/sales           → historial con filtros
GET  /api/sales/:id       → venta con items
PATCH /api/sales/:id/cancel → cancela (requiere razón)
GET  /api/sales/summary   → totales del período

POST /api/cash-sessions/open   → abre caja con monto inicial
POST /api/cash-sessions/close  → cierra con arqueo
GET  /api/cash-sessions/active → sesión activa actual
```

## Métodos de Pago Soportados

`efectivo` · `tarjeta` · `transferencia` · `nequi` · `daviplata` · `fiado` · `mixto`

## Reglas Críticas

- **No se puede vender sin caja abierta**
- **No se puede vender sin stock** (el sistema bloquea)
- Las cancelaciones quedan en auditoría (nunca se borran)
- El fiado requiere cliente registrado con cupo disponible
- Al cerrar caja: conteo físico vs calculado = diferencia registrada

## Dependencias
- [[modules/inventory/inventory]] — valida y descuenta stock
- [[modules/customers/customers]] — para ventas con cliente
- [[modules/sales/sales]] — registro persistente
- [[flows/sale-flow]] — flujo completo

---

← [[DAIMUZ]] | → [[flows/sale-flow]]
