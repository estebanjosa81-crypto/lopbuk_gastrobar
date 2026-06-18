# 🔐 Módulo: Auth

## Qué hace
Gestiona autenticación de usuarios (login, logout, sesión) y autorización por roles. Es la primera barrera de todo el sistema.

## Proveedores
- **Local** — email + password (bcrypt)
- **Google OAuth2** — con Google Identity

## Archivos del Módulo

**Backend:**
- `backend/src/modules/auth/auth.routes.ts`
- `backend/src/modules/auth/auth.controller.ts`
- `backend/src/modules/auth/auth.service.ts`

**Frontend:**
- `frontend/components/auth-form.tsx` — formulario login/registro
- `frontend/components/google-oauth-wrapper.tsx` — botón Google
- `frontend/lib/auth-store.ts` — estado de autenticación
- `frontend/components/register-modal.tsx` — registro nuevo tenant

## Flujo Login Local

```
1. POST /api/auth/login { email, password }
2. bcrypt.compare(password, hash_db)
3. jwt.sign({ userId, tenantId, role }, secret, { expiresIn: '7d' })
4. Setea httpOnly cookie
5. Devuelve { token, user }
6. auth-store.ts guarda token en memoria
```

## Flujo Google OAuth

```
1. Frontend obtiene idToken de Google Sign-In
2. POST /api/auth/google { idToken }
3. Backend verifica con Google API
4. UPSERT usuario en DB (crea o actualiza)
5. Genera JWT propio
6. Mismo flujo que login local
```

## APIs

```
POST /api/auth/login          → { email, password }
POST /api/auth/google         → { idToken }
POST /api/auth/logout         → limpia cookie
GET  /api/auth/me             → usuario actual
```

## Middleware de Protección

```typescript
// verifyToken — valida JWT en header o cookie
router.get('/protected', verifyToken, controller.get)

// requireRole — verifica rol mínimo
router.delete('/admin', verifyToken, requireRole('admin'), controller.delete)
```

## JWT Payload

```typescript
interface JWTPayload {
  userId: string
  tenantId: string
  role: UserRole
}
```

## Reglas Críticas

- El `tenant_id` del JWT es la única fuente de verdad del tenant actual
- **Nunca** confiar en el tenant_id del body del request
- Las cookies son httpOnly → no accesibles desde JavaScript (protección XSS)
- Token expira en 7 días

## Dependencias
- [[modules/tenants/tenants]] — para validar tenant activo
- [[architecture/database]] — tabla `users`

---

← [[DAIMUZ]] | → [[flows/auth-flow]]
