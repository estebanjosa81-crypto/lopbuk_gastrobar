# 💳 Módulo: Finances

## Qué hace
Controla el flujo de caja del negocio: ingresos, egresos, balance, y reportes financieros básicos. Conecta con Stripe para suscripciones SaaS.

## Archivos

**Backend:**
- `backend/src/modules/finances/finances.service.ts`
- `backend/src/modules/stripe/stripe.service.ts`
- `backend/src/modules/subscriptions/subscriptions.service.ts`

**Frontend:**
- `frontend/components/finances.tsx` — flujo de caja
- `frontend/components/invoicing.tsx` — facturación

## APIs

```
GET  /api/finances          → movimientos financieros del período
POST /api/finances          → registra ingreso o egreso manual
GET  /api/finances/balance  → balance actual
GET  /api/finances/report   → P&L del período

GET  /api/subscriptions/current   → suscripción activa del tenant
POST /api/subscriptions/checkout  → inicia pago Stripe
POST /api/subscriptions/cancel    → cancela suscripción
POST /api/stripe/webhook          → eventos de Stripe
```

## Tipos de Movimiento

| Tipo | Ejemplos |
|---|---|
| Ingreso | Ventas, cobro de créditos, otros ingresos |
| Egreso | Compras, gastos operativos, nómina, servicios |

## Reglas Críticas

- Las ventas fiadas **NO** cuentan como ingreso hasta que se cobren
- Los cierres de caja alimentan automáticamente el flujo de caja
- El flujo de caja es de solo lectura para roles que no sean `admin`
- Los webhooks de Stripe actualizan el estado de suscripción automáticamente

## Planes SaaS (via Stripe)

| Plan | Módulos disponibles |
|---|---|
| Free | POS + inventario básico |
| Básico | + clientes + finanzas |
| Pro | + delivery + storefront + gastrobar |
| Enterprise | Todos los módulos |

## Dependencias
- [[modules/sales/sales]] — ventas → ingresos
- [[modules/pos/pos]] — cierres de caja
- [[modules/customers/customers]] — cobros de crédito
- [[modules/tenants/tenants]] — estado de suscripción

---

← [[DAIMUZ]]
