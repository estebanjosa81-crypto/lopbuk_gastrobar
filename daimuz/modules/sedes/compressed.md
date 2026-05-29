# sedes — compressed

> 5 líneas. Módulo sin doc completo aún.

- **Qué es**: sucursales del tenant — cada sede tiene su propia caja e inventario independientes
- **Aislamiento**: `cash_sessions` y `stock_movements` llevan `sede_id` — las ventas de sede A no mezclan con sede B
- **`sede_id` en ventas**: `sales.sede_id` registra en qué sucursal se realizó la venta
- **Sede única**: si el tenant no usa multi-sede, `sede_id = null` — funciona igual
- **Archivos**: `sedes.routes.ts` · Tabla: `sedes` · Usado en: [[modules/cash-sessions/compressed]], [[modules/sales/compressed]]

---

← [[DAIMUZ]] | [[indexes/modules-index]]
