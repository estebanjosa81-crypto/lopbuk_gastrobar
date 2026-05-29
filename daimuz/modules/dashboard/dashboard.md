# 📊 Módulo: Dashboard

## Qué hace
El panel de control central del negocio. Muestra KPIs, métricas, alertas y tendencias en tiempo real. Primera pantalla que ve el admin al entrar.

## Archivos

**Backend:**
- `backend/src/modules/dashboard/dashboard.routes.ts`
- `backend/src/modules/dashboard/dashboard.controller.ts`
- `backend/src/modules/dashboard/dashboard.service.ts`

**Frontend:**
- `frontend/components/dashboard.tsx` — panel principal
- `frontend/components/analytics.tsx` — reportes avanzados
- `frontend/components/daily-closing-report.tsx` — cierre del día
- `frontend/components/accounting-report.tsx` — reporte contable

## APIs

```
GET /api/dashboard/stats          → KPIs principales
GET /api/dashboard/sales-chart    → datos para gráficas
GET /api/dashboard/top-products   → más vendidos
GET /api/dashboard/recent         → actividad reciente
GET /api/dashboard/inventory      → alertas de stock bajo
GET /api/dashboard/kpis           → métricas ejecutivas
```

## KPIs que muestra

| KPI | Descripción |
|---|---|
| Ventas hoy | Total vendido en el día |
| Ventas semana/mes | Comparativo con período anterior |
| Transacciones | Número de ventas |
| Ticket promedio | Venta promedio por transacción |
| Stock bajo | Productos bajo nivel mínimo |
| Pedidos pendientes | Pedidos sin completar |
| Caja activa | Estado de la sesión de caja |
| Top productos | Los más vendidos del período |

## Tiempo Real

El dashboard se actualiza vía Socket.io cuando:
- Se registra una nueva venta
- Cambia el estado de un pedido
- Se recibe un pedido online

## Dependencias
- [[modules/sales/sales]] — datos de ventas
- [[modules/inventory/inventory]] — alertas de stock
- [[modules/orders/orders]] — pedidos pendientes
- [[modules/finances/finances]] — flujo de caja

---

← [[DAIMUZ]]
