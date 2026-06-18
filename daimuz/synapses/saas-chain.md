# 🌐 Sinapsis: Cadena SaaS

> Cómo se conectan tenants, auth, módulos y suscripciones.

## Flujo: Registro → Tenant → Acceso Modular

```
NUEVO NEGOCIO se registra (register-modal.tsx)
    │
    ▼
POST /api/auth/register { name, email, password, businessName }
    │
    ├──► tenants INSERT  { id, name, slug, plan, is_active }
    ├──► users INSERT    { tenantId, role: 'comerciante', ... }
    └──► tenant_modules INSERT (módulos base activados por plan)
              │
              └──► JWT generado con { userId, tenantId, role: 'comerciante' }
```

## Flujo: Cada Request → Validación Multi-tenant

```
CUALQUIER REQUEST autenticado
    │
    ▼
auth.middleware.verifyToken
    │
    ├──► Decodifica JWT → { userId, tenantId, role }
    ├──► req.user.tenantId = payload.tenantId  ← ÚNICA fuente del tenant
    └──► tenant_id en queries SIEMPRE de req.user.tenantId (NUNCA del body)
              │
              └──► authorize() si necesita rol específico
```

## Flujo: Control de Módulos por Plan

```
tenant.plan → tenant_modules (qué módulos tiene activos)
    │
    └──► auth.middleware.requireModule('gastrobar')
              │
              ├──► SELECT FROM tenant_modules WHERE tenant_id = ? AND module = 'gastrobar'
              └──► Si no activo → 403 "Módulo no disponible en tu plan"
```

## Flujo: Suscripción Stripe

```
POST /api/subscriptions/checkout
    │
    ├──► Stripe: crear PaymentIntent
    └──► POST /api/stripe/webhook (después del pago)
              └──► subscriptions UPDATE estado + fecha_vencimiento
                        └──► tenant_modules UPDATE según nuevo plan
```

## Impacto por Cambio

### Si cambias `auth.middleware.ts`
- ⚠️ Afecta: TODOS los módulos (pasan por aquí)
- ✅ Verificar: verifyToken no rompe el payload, requireRole acepta strings sueltos (NO array): `authorize('comerciante', 'superadmin')`

### Si cambias `tenants.service.ts`
- ⚠️ Afecta: `auth` (valida tenant activo), `subscriptions` (plan), todos los módulos (tenant_id viene de aquí)
- ✅ Verificar: soft delete solo desactiva, nunca borra usuarios/datos del tenant

### Regla de Seguridad Multi-tenant

```typescript
// ✅ SIEMPRE así
const tenantId = req.user.tenantId

// ❌ NUNCA así (podría venir de un request malicioso)
const tenantId = req.body.tenantId
const tenantId = req.params.tenantId
```

---

**Módulos de esta cadena:** [[modules/auth/auth]] · [[modules/tenants/tenants]] · [[modules/subscriptions/subscriptions]] · [[modules/finances/finances]]

← [[synapses/delivery-chain]] | [[DAIMUZ]]
