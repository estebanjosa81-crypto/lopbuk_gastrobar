# 🏢 Módulo: Tenants

## Qué hace
Gestiona los negocios (tenants) de la plataforma SaaS. Cada tenant es un negocio independiente con sus propios datos, módulos activados y configuración.

## Archivos

**Backend:**
- `backend/src/modules/tenants/tenants.routes.ts`
- `backend/src/modules/tenants/tenants.controller.ts`
- `backend/src/modules/tenants/tenants.service.ts`

**Frontend:**
- `frontend/components/tenant-management.tsx` — gestión (superadmin)
- `frontend/components/superadmin-home.tsx` — panel superadmin
- `frontend/components/settings.tsx` — config del negocio (admin)
- `frontend/components/register-modal.tsx` — registro nuevo tenant

## Estructura de un Tenant

```typescript
{
  id: string,              // UUID único
  name: string,            // nombre del negocio
  slug: string,            // URL única (lopbuk.com/s/[slug])
  business_type: string,   // gastrobar | retail | services | etc.
  logo: string,            // URL imagen
  primary_color: string,   // branding
  plan: string,            // free | basic | pro | enterprise
  is_active: boolean,
  modules: string[],       // módulos activos
  settings: JSON           // config adicional
}
```

## Módulos Activables

Cada tenant activa solo los módulos que necesita según su tipo de negocio.

```json
{
  "modules": [
    "inventory", "pos", "sales", "cash-sessions",
    "customers", "credits", "finances", "purchases",
    "restbar", "gastrobar-ops", "recipes", "merma",
    "orders", "delivery", "fleet",
    "storefront", "portfolio", "services",
    "subscriptions", "stripe", "whatsapp",
    "realestate", "workorders"
  ]
}
```

## APIs

```
GET    /api/tenants             → lista todos (solo superadmin)
GET    /api/tenants/:id         → obtiene tenant
POST   /api/tenants             → crea nuevo tenant (registro)
PUT    /api/tenants/:id         → actualiza config
GET    /api/tenants/:id/modules → módulos activos
PUT    /api/tenants/:id/modules → actualiza módulos activos
```

## Reglas Críticas

- Solo `superadmin` puede ver/crear tenants
- El `admin` de un tenant solo puede editar SU tenant
- El slug es único globalmente → validar antes de crear
- Desactivar un tenant (`is_active = false`) bloquea el acceso de todos sus usuarios
- Los datos del tenant NO se borran al desactivar (soft delete)

## Dependencias
- [[modules/auth/auth]] — el `tenant_id` viene del JWT
- [[modules/finances/finances]] — suscripciones del tenant

---

← [[DAIMUZ]]
