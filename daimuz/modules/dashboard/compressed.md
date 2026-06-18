# dashboard — compressed

> 5 líneas. Si necesitas más → lee `dashboard.md`

- **KPIs**: ventas hoy/semana/mes, ticket promedio, nº transacciones, stock bajo mínimo, pedidos pendientes, estado caja activa, top productos
- **Tiempo real**: se actualiza vía Socket.io en: nueva venta, cambio de estado pedido, pedido online recibido
- **Acceso**: admin ve todo · cajero ve estado de caja · superadmin tiene vista global SaaS
- **Servicios**: `GET /api/dashboard/stats`, `/sales-chart`, `/top-products`, `/recent`, `/inventory`, `/kpis`
- **Archivos**: `dashboard.service.ts`, `dashboard.tsx`, `analytics.tsx`, `daily-closing-report.tsx`

---

← [[DAIMUZ]] | → [[modules/dashboard/dashboard]]
