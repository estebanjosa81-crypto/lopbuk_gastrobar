# auth — middleware

> Detalle del middleware de autenticación y autorización. Archivo: `backend/src/middleware/auth.middleware.ts`

## `verifyToken`

Valida el JWT. Extrae el payload y lo pone en `req.user`.

```typescript
// Busca el token en este orden:
// 1. Header: Authorization: Bearer <token>
// 2. Cookie: httpOnly cookie 'token'

interface JWTPayload {
  userId: string
  tenantId: string    // ← ÚNICA fuente de verdad del tenant
  role: UserRole
}

// req.user queda disponible para todos los siguientes middlewares
```

## `authorize(...roles)`

Verifica que `req.user.role` esté en la lista de roles permitidos.

```typescript
// ✅ CORRECTO — parámetros sueltos (spread)
router.get('/', verifyToken, authorize('admin', 'cajero'), controller.get)
router.post('/', verifyToken, authorize('comerciante', 'superadmin'), controller.post)

// ❌ INCORRECTO — NO acepta array
authorize(['admin', 'cajero'])  // falla silenciosamente o error

// Roles válidos:
// 'superadmin' | 'admin' | 'cajero' | 'cocinero' | 'bartender'
// 'mesero' | 'vendedor' | 'driver' | 'dispatcher' | 'cliente'
// 'comerciante' (alias de 'admin' en algunos contextos)
```

## `requireModule(moduleName)`

Verifica que el tenant tenga el módulo activado en su plan.

```typescript
router.get('/gastrobar', verifyToken, requireModule('gastrobar'), controller.get)
// → SELECT FROM tenant_modules WHERE tenant_id = ? AND module = 'gastrobar' AND is_active = 1
// Si no está activo → 403 "Módulo no disponible en tu plan"
```

## Regla de oro — tenant_id

```typescript
// El middleware pone esto:
req.user = { userId, tenantId, role }

// En el service SIEMPRE:
const tenantId = req.user.tenantId  // ✅

// NUNCA:
const tenantId = req.body.tenantId   // ❌ manipulable
const tenantId = req.params.tenantId // ❌ manipulable
```

---

← [[modules/auth/auth]] | [[modules/auth/compressed]]
