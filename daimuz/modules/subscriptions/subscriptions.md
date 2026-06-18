# 💳 Módulo: Subscriptions (Suscripciones SaaS)

## Qué hace
Gestiona los planes de suscripción de los tenants a la plataforma Lopbuk. Integrado con Stripe para cobros automáticos. Define qué módulos puede usar cada tenant según su plan.

## Archivos
- `backend/src/modules/subscriptions/subscriptions.service.ts`
- `backend/src/modules/subscriptions/subscriptions.routes.ts`
- `backend/src/modules/stripe/stripe.service.ts`

## APIs
```
GET    /api/subscriptions/plans     → lista planes disponibles
GET    /api/subscriptions/current   → suscripción activa del tenant
POST   /api/subscriptions/checkout  → inicia checkout en Stripe
POST   /api/subscriptions/cancel    → cancela suscripción
POST   /api/subscriptions/upgrade   → cambia de plan
```

## Planes

| Plan | Módulos | Precio |
|---|---|---|
| Free | POS + Inventario básico | $0 |
| Básico | + Clientes + Finanzas + Compras | $X/mes |
| Pro | + Delivery + Storefront + Gastrobar | $X/mes |
| Enterprise | Todos los módulos | $X/mes |

## Ciclo de Vida

```
checkout → pago confirmado (Stripe webhook) → activa plan → módulos disponibles
                                ↓
                          renovación automática mensual
                                ↓
                          vencimiento → 7 días gracia → solo lectura
```

## Webhooks de Stripe
Los eventos de Stripe actualizan el estado automáticamente:
- `customer.subscription.created` → activa
- `invoice.payment_succeeded` → renueva
- `customer.subscription.deleted` → desactiva

## Dependencias
- [[modules/tenants/tenants]] — el plan determina los módulos activos
- [[modules/finances/finances]] — los cobros quedan en el historial
- [[vault/integrations]] — configuración de Stripe

---
← [[DAIMUZ]]
