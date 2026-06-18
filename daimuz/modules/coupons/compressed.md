# coupons — compressed

> 5 líneas. Módulo sin doc completo aún.

- **Qué hace**: cupones de descuento que los clientes aplican en el checkout de la tienda online
- **Tipos**: `porcentaje` (ej: 10%) · `fijo` (ej: $5.000 off) — se aplican sobre el subtotal
- **Restricciones**: `min_purchase` monto mínimo para activar · `max_uses` usos totales (NULL = ilimitado) · `expires_at` expiración
- **Aplica en**: storefront checkout — el POS físico tiene su propio sistema de descuentos separado
- **Archivos**: `coupons.routes.ts`, `cupones.tsx` · Tabla: `discount_coupons`

---

← [[DAIMUZ]] | [[indexes/modules-index]]
