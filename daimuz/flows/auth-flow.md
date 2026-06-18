# 🔑 Flujo: Autenticación

## Login Local

```mermaid
sequenceDiagram
    Usuario->>auth-form.tsx: escribe email + password
    auth-form.tsx->>auth-store.ts: login(email, password)
    auth-store.ts->>api.ts: POST /api/auth/login
    api.ts->>Express: { email, password }
    Express->>auth.service.ts: login()
    auth.service.ts->>MySQL: SELECT * FROM users WHERE email=?
    MySQL-->>auth.service.ts: user row
    auth.service.ts->>auth.service.ts: bcrypt.compare()
    auth.service.ts->>auth.service.ts: jwt.sign({userId, tenantId, role})
    auth.service.ts-->>Express: { token, user }
    Express-->>api.ts: Set-Cookie: httpOnly + { token, user }
    api.ts-->>auth-store.ts: { success, data }
    auth-store.ts->>auth-store.ts: setToken + setUser
    auth-store.ts-->>auth-form.tsx: isAuthenticated = true
    auth-form.tsx->>Usuario: redirige al dashboard
```

## Login Google OAuth

```
1. Click "Continuar con Google"
2. Google Sign-In popup → obtiene idToken
3. POST /api/auth/google { idToken }
4. Backend verifica con Google API
5. UPSERT usuario en DB
6. Genera JWT propio
7. Mismo final que login local
```

## Protección de Rutas

```typescript
// Toda ruta protegida:
verifyToken → req.user = { userId, tenantId, role }

// Rutas por rol:
requireRole('admin')       → solo admin + superadmin
requireRole('cajero')      → cajero, admin, superadmin
```

## Token Storage

```
httpOnly Cookie ← fuente de verdad (persiste entre refreshes)
auth-store.ts   ← cache en memoria (para header Authorization)
```

**Relacionado:** [[modules/auth/auth]]

---

← [[DAIMUZ]] | → [[flows/sale-flow]]
